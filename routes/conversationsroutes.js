const express = require('express');
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

// Envoyer un message – version finale avec réponse manuelle
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

    // Récupérer la conversation existante
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({ message: "Conversation introuvable" });
    }

    // Créer et ajouter le message
    const newMsg = {
      sender: userId, // On utilise directement userId
      content,
      timestamp: new Date()
    };

    conversation.messages.push(newMsg);
    conversation.lastUpdated = new Date();
    await conversation.save();
    console.log("✅ Message enregistré dans la conversation.");

    // Récupérer le message ajouté depuis le document sauvegardé
    const savedMsg = conversation.messages[conversation.messages.length - 1];
    console.log("Message sauvegardé (brut):", savedMsg);

    // Construire manuellement la réponse en forçant le champ sender avec les infos de req.user
    const responseMessage = {
      _id: savedMsg._id,
      content: savedMsg.content,
      timestamp: savedMsg.timestamp,
      sender: {
        _id: req.user._id,
        username: req.user.username
      }
    };

    console.log("🔎 Message final renvoyé :", responseMessage);
    res.json(responseMessage);
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
    res.status(500).json({
      message: "Erreur serveur",
      error: error.message,
      stack: error.stack
    });
  }
});

module.exports = router;
