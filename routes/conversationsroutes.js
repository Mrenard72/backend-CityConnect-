const express = require('express');
const mongoose = require('mongoose');
const Conversation = require('../models/Conversation');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// Créer une nouvelle conversation
router.post('/create', authMiddleware, async (req, res) => {
  try {
    const userId = req.user._id; // Utiliser req.user._id
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

// Envoyer un message – version avec findByIdAndUpdate pour récupérer le sender peuplé
router.post('/:conversationId/message', authMiddleware, async (req, res) => {
  try {
    const userId = req.user._id; // Utilisation de req.user._id
    const { conversationId } = req.params;
    const { content } = req.body;

    console.log(`📩 Envoi de message dans la conversation ${conversationId} par ${userId}`);
    console.log("Contenu reçu :", content);

    if (!content) {
      return res.status(400).json({ message: "Message vide" });
    }

    // Utiliser $push pour ajouter le message et $set pour mettre à jour lastUpdated
    const update = {
      $push: { messages: { sender: userId, content, timestamp: new Date() } },
      $set: { lastUpdated: new Date() }
    };
    const options = { new: true };

    // findByIdAndUpdate renvoie le document mis à jour
    const updatedConversation = await Conversation.findByIdAndUpdate(conversationId, update, options)
      .populate('messages.sender', 'username');

    if (!updatedConversation || !updatedConversation.messages.length) {
      return res.status(404).json({ message: "Erreur lors de l'enregistrement du message" });
    }

    // Récupérer le dernier message ajouté
    const addedMessage = updatedConversation.messages[updatedConversation.messages.length - 1];
    console.log("🔎 Message renvoyé après mise à jour :", addedMessage);
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
    res.status(500).json({ 
      message: "Erreur serveur", 
      error: error.message, 
      stack: error.stack 
    });
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
    console.error("❌ Erreur récupération conversation:", error.stack);
    res.status(500).json({ message: "Erreur serveur", error: error.message, stack: error.stack });
  }
});

module.exports = router;
