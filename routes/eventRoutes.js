const express = require('express');
const router = express.Router();
const Event = require('../models/Event'); // 📌 Import du modèle
const authMiddleware = require('../middleware/auth'); // 🔒 Middleware d'authentification
const Conversation = require('../models/Conversation');

// ✅ 1. Créer un événement (authentification requise)
router.post('/', authMiddleware, async (req, res) => {
    try {
        console.log("🔍 Utilisateur connecté :", req.user);

        if (!req.user || !req.user._id) {
            return res.status(401).json({ message: "Utilisateur non authentifié." });
        }

        const { title, description, location, date, category, maxParticipants, photos } = req.body;

        if (!title || !description || !location || !date || !category || !maxParticipants) {
            return res.status(400).json({ message: "Tous les champs obligatoires doivent être remplis." });
        }

        // Création de l'événement
        const newEvent = new Event({
            title,
            description,
            location,
            date,
            category,
            createdBy: req.user._id,
            maxParticipants,
            participants: [req.user._id], // Ajouter le créateur dans la liste des participants
            photos: photos || []
        });

        await newEvent.save();

        // 🔹 Création de la conversation associée à l'événement
        const conversation = new Conversation({
            participants: [req.user._id],
            eventId: newEvent._id
        });

        await conversation.save();

        // Mise à jour de l'événement avec l'ID de la conversation
        newEvent.conversationId = conversation._id;
        await newEvent.save();

        res.status(201).json({ message: 'Événement créé avec succès !', event: newEvent, conversation });

    } catch (error) {
        console.error("❌ Erreur lors de la création de l'événement :", error);
        res.status(500).json({ message: 'Erreur lors de la création de l’événement', error });
    }
});

// ✅ 2. Récupérer tous les événements
router.get('/', async (req, res) => {
    try {
        const events = await Event.find().populate('createdBy', 'username');
        res.json(events);
    } catch (error) {
        console.error("❌ Erreur lors de la récupération des événements :", error);
        res.status(500).json({ message: 'Erreur lors de la récupération des événements', error });
    }
});

// ✅ 3. Récupérer un événement par ID
router.get('/:id', async (req, res) => {
    try {
        const event = await Event.findById(req.params.id).populate('createdBy', 'username');
        if (!event) return res.status(404).json({ message: 'Événement non trouvé' });

        res.json(event);
    } catch (error) {
        console.error("❌ Erreur lors de la récupération de l’événement :", error);
        res.status(500).json({ message: 'Erreur lors de la récupération de l’événement', error });
    }
});

// ✅ 4. Mettre à jour un événement (authentification requise, seul le créateur peut modifier)
router.put('/:id', authMiddleware, async (req, res) => {
    try {
        const event = await Event.findById(req.params.id);
        if (!event) return res.status(404).json({ message: 'Événement non trouvé' });

        if (event.createdBy.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Non autorisé à modifier cet événement' });
        }

        Object.assign(event, req.body);
        await event.save();

        res.json({ message: 'Événement mis à jour avec succès', event });
    } catch (error) {
        console.error("❌ Erreur lors de la mise à jour :", error);
        res.status(500).json({ message: 'Erreur lors de la mise à jour', error });
    }
});

// ✅ 5. Supprimer un événement (authentification requise, seul le créateur peut supprimer)
router.delete('/:id', authMiddleware, async (req, res) => {
    try {
        const event = await Event.findById(req.params.id);
        if (!event) return res.status(404).json({ message: 'Événement non trouvé' });

        if (event.createdBy.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Non autorisé à supprimer cet événement' });
        }

        await event.deleteOne();
        res.json({ message: 'Événement supprimé avec succès' });
    } catch (error) {
        console.error("❌ Erreur lors de la suppression :", error);
        res.status(500).json({ message: 'Erreur lors de la suppression', error });
    }
});

// ✅ 6. Participer à un événement
// ✅ 8. ajout automatique de l'utilisateur à la conversation
router.post('/:id/join', authMiddleware, async (req, res) => {
    try {
        const event = await Event.findById(req.params.id);
        if (!event) return res.status(404).json({ message: 'Événement non trouvé' });

        if (event.participants.length >= event.maxParticipants) {
            return res.status(400).json({ message: "L'événement est complet." });
        }

        if (event.participants.includes(req.user._id)) {
            return res.status(400).json({ message: "Vous êtes déjà inscrit à cet événement." });
        }

        event.participants.push(req.user._id);
        await event.save();

        // 🔹 Ajouter l'utilisateur à la conversation de l'événement
        let conversation = await Conversation.findOne({ eventId: event._id });

        if (!conversation) {
            console.log("🚀 Création d'une nouvelle conversation...");
            conversation = new Conversation({
                participants: [req.user._id],
                eventId: event._id
            });
            await conversation.save();
        } else {
            console.log("📌 Ajout de l'utilisateur à la conversation existante.");
            if (!conversation.participants.includes(req.user._id)) {
                conversation.participants.push(req.user._id);
                await conversation.save();
            }
        }

        res.json({ message: 'Inscription réussie à l’événement', event, conversation });

    } catch (error) {
        console.error("❌ Erreur lors de l'inscription :", error);
        res.status(500).json({ message: 'Erreur lors de l’inscription', error });
    }
});


// ✅ 7. Quitter un événement
router.post('/:id/leave', authMiddleware, async (req, res) => {
    try {
        const event = await Event.findById(req.params.id);
        if (!event) return res.status(404).json({ message: 'Événement non trouvé' });

        // Vérifier si l'utilisateur est inscrit avant de le retirer
        if (!event.participants.includes(req.user._id)) {
            return res.status(400).json({ message: "Vous n'êtes pas inscrit à cet événement." });
        }

        event.participants = event.participants.filter(id => id.toString() !== req.user._id.toString());
        await event.save();

        res.json({ message: 'Désinscription réussie', event });
    } catch (error) {
        console.error("❌ Erreur lors de la désinscription :", error);
        res.status(500).json({ message: 'Erreur lors de la désinscription', error });
    }
});



module.exports = router;
