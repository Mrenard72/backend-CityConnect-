const express = require('express');
const Conversation = require('../models/Conversation');
const authMiddleware = require('../middleware/auth');

const router = express.Router();


// Créer une nouvelle conversation
router.post('/create', authMiddleware, async (req, res) => {
  try {
    const { userId } = req.user;
    const { recipientId } = req.body;

    if (!recipientId) return res.status(400).json({ message: "Destinataire manquant" });

    // Vérifier si une conversation existe déjà
    let conversation = await Conversation.findOne({
      participants: { $all: [userId, recipientId] }
    });

    if (!conversation) {
      conversation = new Conversation({ participants: [userId, recipientId] });
      await conversation.save();
    }

    res.status(201).json(conversation);
  } catch (error) {
    console.error("Erreur création conversation:", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
});


//Envoyer un message
router.post('/:conversationId/message', authMiddleware, async (req, res) => {
    try {
      const { userId } = req.user;
      const { conversationId } = req.params;
      const { content } = req.body;
  
      if (!content) return res.status(400).json({ message: "Message vide" });
  
      const conversation = await Conversation.findById(conversationId);
      if (!conversation) return res.status(404).json({ message: "Conversation introuvable" });
  
      conversation.messages.push({ sender: userId, content });
      conversation.lastUpdated = Date.now();
      await conversation.save();
  
      res.json(conversation);
    } catch (error) {
      console.error("Erreur envoi message:", error);
      res.status(500).json({ message: "Erreur serveur" });
    }
  });
  

  //Récupérer les conversations d'un utilisateur

  router.get('/my-conversations', authMiddleware, async (req, res) => {
    try {
      const { userId } = req.user;
      const conversations = await Conversation.find({ participants: userId })
        .populate('participants', 'username email')
        .populate('messages.sender', 'username');
  
      res.json(conversations);
    } catch (error) {
      console.error("Erreur récupération conversations:", error);
      res.status(500).json({ message: "Erreur serveur" });
    }
  });
  

  module.exports = router;
