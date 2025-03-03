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
    console.log("Données reçues :", req.body);

    if (!content) {
      console.log("⚠️ Message vide !");
      return res.status(400).json({ message: "Message vide" });
    }

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      console.log("⚠️ Conversation introuvable !");
      return res.status(404).json({ message: "Conversation introuvable" });
    }

    if (!conversation.participants.includes(userId)) {
      console.log("⚠️ L'utilisateur n'est pas dans cette conversation !");
      return res.status(403).json({ message: "Vous n'avez pas accès à cette conversation." });
    }

    console.log("📌 Ajout du message...");
    conversation.messages.push({ sender: userId, content });
    conversation.lastUpdated = Date.now();

    console.log("✅ Sauvegarde de la conversation...");
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
        .populate('messages.sender', 'username')
        .populate('eventId', 'title');
  
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
      .populate('messages.sender', 'username content timestamp')
      .populate('eventId', 'title');

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
