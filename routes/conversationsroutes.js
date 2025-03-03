const express = require('express');
const mongoose = require('mongoose'); // Pour cast si besoin
const Conversation = require('../models/Conversation');
const authMiddleware = require('../middleware/auth');
const User = require('../models/User'); // Pour récupérer les infos du sender

const router = express.Router();

// Créer une nouvelle conversation
router.post('/create', authMiddleware, async (req, res) => {
  try {
    // Utiliser req.user._id au lieu de req.user.userId
    const userId = req.user._id;
    const { recipientId, eventId } = req.body;

    if (!recipientId || !eventId) {
      return res.status(400).json({ message: "Destinataire ou événement manquant" });
    }

    let conversation = await Conversation.findOne({
      participants: { $all: [userId, recipientId] },
      eventId
    });

    if (!conversation) {
      conversation = new Conversation({ participants: [userId, recipientId], eventId });
      await conversation.save();
    }

    res.status(201).json(conversation);
  } catch (error) {
    console.error("❌ Erreur création conversation:", error.stack);
    res.status(500).json({ message: "Erreur serveur", error: error.message, stack: error.stack });
  }
});

// Envoyer un message (version modifiée avec $slice pour récupérer le sender peuplé)
router.post('/:conversationId/message', authMiddleware, async (req, res) => {
  try {
    // Récupérer l'id de l'utilisateur via _id
    const userId = req.user._id;
    const { conversationId } = req.params;
    const { content } = req.body;

    console.log(`📩 Tentative d'envoi de message dans la conversation ${conversationId} par ${userId}`);
    console.log("Données reçues :", req.body);

    if (!content) {
      console.log("⚠️ Message vide !");
      return res.status(400).json({ message: "Message vide" });
    }

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      console.log("❌ Conversation introuvable !");
      return res.status(404).json({ message: "Conversation introuvable" });
    }

    // Création du message (sender est maintenant correctement défini)
    const newMsg = { 
      sender: userId, 
      content, 
      timestamp: new Date() 
    };
    conversation.messages.push(newMsg);
    conversation.lastUpdated = Date.now();
    await conversation.save();
    console.log("✅ Message enregistré avec succès !");

    // Utiliser une projection avec $slice pour récupérer uniquement le dernier message et le peupler
    const convPop = await Conversation.findOne(
      { _id: conversationId },
      { messages: { $slice: -1 } } // Récupère uniquement le dernier message
    ).populate('messages.sender', 'username');

    if (!convPop || !convPop.messages || convPop.messages.length === 0) {
      console.log("❌ Aucune donnée trouvée après save");
      return res.status(404).json({ message: "Aucun message trouvé après enregistrement" });
    }
    
    const addedMessage = convPop.messages[0];
    console.log("🔎 Dernier message renvoyé :", addedMessage);
    res.json(addedMessage);
  } catch (error) {
    console.error("❌ Erreur envoi message:", error.stack);
    res.status(500).json({ 
      message: "Erreur serveur", 
      error: error.message, 
      stack: error.stack 
    });
  }
});

// Récupérer les conversations d'un utilisateur
router.get('/my-conversations', authMiddleware, async (req, res) => {
  try {
    const userId = req.user._id;
    const conversations = await Conversation.find({ participants: userId })
      .populate('participants', 'username email')
      .populate('messages.sender', 'username')
      .populate('eventId', 'title');

    res.json(conversations);
  } catch (error) {
    console.error("Erreur récupération conversations:", error.stack);
    res.status(500).json({ message: "Erreur serveur", error: error.message, stack: error.stack });
  }
});
  
// Récupérer une conversation spécifique par son ID
router.get('/:conversationId', authMiddleware, async (req, res) => {
  try {
    const { conversationId } = req.params;
    console.log("🔍 Recherche de la conversation avec ID :", conversationId);

    const conversation = await Conversation.findById(conversationId)
      .populate('participants', 'username email')
      .populate('messages.sender', 'username content timestamp')
      .populate('eventId', 'title');

    if (!conversation) {
      console.log("⚠️ Conversation introuvable !");
      return res.status(404).json({ message: "Conversation introuvable" });
    }

    console.log("📩 Conversation trouvée :", conversation);
    res.json(conversation);
  } catch (error) {
    console.error("❌ Erreur récupération conversation :", error.stack);
    res.status(500).json({ message: "Erreur serveur", error: error.message, stack: error.stack });
  }
});

module.exports = router;
