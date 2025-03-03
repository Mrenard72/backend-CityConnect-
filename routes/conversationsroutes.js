const express = require('express');
const Conversation = require('../models/Conversation');
const authMiddleware = require('../middleware/auth');

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
    console.error("❌ Erreur création conversation:", error);
    res.status(500).json({ message: "Erreur serveur", error });
  }
});




//Envoyer un message
// ✅ Envoyer un message
router.post('/:conversationId/message', authMiddleware, async (req, res) => {
  try {
    const { userId } = req.user;
    const { conversationId } = req.params;
    const { content } = req.body;

    console.log(`📩 Tentative d'envoi de message dans la conversation ${conversationId} par ${userId}`);

    if (!content) {
      console.log("⚠️ Message vide détecté !");
      return res.status(400).json({ message: "Message vide" });
    }

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      console.log("⚠️ Conversation introuvable !");
      return res.status(404).json({ message: "Conversation introuvable" });
    }

    console.log("📌 Conversation trouvée, ajout du message...");
    conversation.messages.push({ sender: userId, content });
    conversation.lastUpdated = Date.now();
    await conversation.save();

    console.log("✅ Message enregistré avec succès !");
    res.json(conversation);
  } catch (error) {
    console.error("❌ Erreur envoi message:", error);
    res.status(500).json({ message: "Erreur serveur", error });
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
  
  // ✅ Récupérer une conversation spécifique par son ID
router.get('/:conversationId', authMiddleware, async (req, res) => {
  try {
    const { conversationId } = req.params;
    console.log("🔍 Recherche de la conversation avec ID :", conversationId); // Debugging

    const conversation = await Conversation.findById(conversationId)
      .populate('participants', 'username email')
      .populate('messages.sender', 'username content timestamp');

    if (!conversation) {
      console.log("⚠️ Conversation introuvable !");
      return res.status(404).json({ message: "Conversation introuvable" });
    }

    console.log("📩 Conversation trouvée :", conversation);
    res.json(conversation);
  } catch (error) {
    console.error("❌ Erreur récupération conversation :", error);
    res.status(500).json({ message: "Erreur serveur", error });
  }
});


  module.exports = router;
