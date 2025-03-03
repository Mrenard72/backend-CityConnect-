const express = require('express');
const Conversation = require('../models/Conversation');
const authMiddleware = require('../middleware/auth');
const User = require('../models/User'); // Nécessaire pour récupérer le pseudo

const router = express.Router();

// Créer une nouvelle conversation
router.post('/create', authMiddleware, async (req, res) => {
  try {
    const { userId } = req.user;
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

// Envoyer un message (version modifiée sans .execPopulate())
router.post('/:conversationId/message', authMiddleware, async (req, res) => {
  try {
    const { userId } = req.user;
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

    // Création du message
    const newMsg = { sender: userId, content, timestamp: new Date() };
    conversation.messages.push(newMsg);
    conversation.lastUpdated = Date.now();
    await conversation.save();
    console.log("✅ Message enregistré avec succès !");

    // Récupérer le dernier message créé
    const addedMsg = conversation.messages[conversation.messages.length - 1];

    // Récupérer les infos de l'utilisateur (pseudo)
    const senderData = await User.findById(userId).select('username');
    const addedMessage = { 
      ...addedMsg.toObject(), 
      sender: senderData 
    };

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
    const { userId } = req.user;
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
