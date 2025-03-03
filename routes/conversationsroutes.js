const express = require('express');
const Conversation = require('../models/Conversation');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// ------------------------------
// 1. Créer une nouvelle conversation
// ------------------------------
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

// ------------------------------
// 2. Envoyer un message (sans .execPopulate())
// ------------------------------
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

    // (Facultatif) Vérifier que userId fait bien partie de participants :
    // if (!conversation.participants.includes(userId)) {
    //   console.log("❌ User non participant de cette conversation");
    //   return res.status(403).json({ message: "Non autorisé" });
    // }

    // Ajout du message
    const newMsg = { sender: userId, content, timestamp: new Date() };
    conversation.messages.push(newMsg);
    conversation.lastUpdated = Date.now();

    console.log("💾 On enregistre la conversation avec le nouveau message...");
    await conversation.save();
    console.log("✅ Conversation enregistrée !");

    // ----------------------------------------------------------
    // Technique : refaire un second findById + populate
    // ----------------------------------------------------------
    console.log("🔍 On refait un findById + populate du dernier message...");
    const convPop = await Conversation.findById(conversationId)
      .populate('messages.sender', 'username'); // on veut messages.sender.username

    if (!convPop) {
      console.log("❌ Introuvable après save ???");
      return res.status(404).json({ message: "Conversation introuvable après save" });
    }

    console.log("✅ convPop trouvé. Nombre de messages :", convPop.messages.length);
    // Récupérer le dernier message
    const addedMessage = convPop.messages[convPop.messages.length - 1];
    console.log("🔎 Dernier message:", addedMessage);

    // Renvoi du message peuplé
    res.json(addedMessage);

  } catch (error) {
    console.error("❌ Erreur envoi message:", error.stack);
    // On renvoie un JSON plus détaillé pour comprendre ce qui se passe
    res.status(500).json({ 
      message: "Erreur serveur", 
      error: error.message, 
      stack: error.stack
    });
  }
});

// ------------------------------
// 3. Récupérer les conversations de l'utilisateur
// ------------------------------
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
    res.status(500).json({ 
      message: "Erreur serveur", 
      error: error.message, 
      stack: error.stack
    });
  }
});

// ------------------------------
// 4. Récupérer une conversation spécifique par son ID
// ------------------------------
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
    res.status(500).json({ 
      message: "Erreur serveur", 
      error: error.message, 
      stack: error.stack
    });
  }
});

module.exports = router;
