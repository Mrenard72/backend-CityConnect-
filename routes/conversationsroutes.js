const express = require('express');
const mongoose = require('mongoose');
const Conversation = require('../models/Conversation');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// Envoyer un message – version finale avec réponse manuelle
router.post('/:conversationId/message', authMiddleware, async (req, res) => {
  try {
    const userId = req.user._id; // On utilise req.user._id
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

    // Créer le message
    const newMsg = { 
      sender: userId, 
      content, 
      timestamp: new Date() 
    };

    conversation.messages.push(newMsg);
    conversation.lastUpdated = new Date();
    await conversation.save();
    console.log("✅ Message enregistré dans la conversation.");

    // Récupérer le dernier message enregistré
    const savedMsg = conversation.messages[conversation.messages.length - 1];
    console.log("Message sauvegardé (brut) :", savedMsg);

    // Construire la réponse en forçant le champ sender à partir de req.user
    const addedMessage = {
      _id: savedMsg._id,
      content: savedMsg.content,
      timestamp: savedMsg.timestamp,
      sender: {
        _id: req.user._id,
        username: req.user.username
      }
    };

    console.log("🔎 Message final renvoyé :", addedMessage);
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

// (Les autres routes restent inchangées)

module.exports = router;
