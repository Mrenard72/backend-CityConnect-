const express = require('express');
const router = express.Router();
const Event = require('../models/Event'); // 📌 Import du modèle
const authMiddleware = require('../middleware/auth'); // 🔒 Middleware d'authentification

// ✅ 1. Créer une sortie (authentification requise)
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { title, description, location, date, category } = req.body;

    const newEvent = new Event({
      title,
      description,
      location,
      date,
      category,
      createdBy: req.user._id, // 👤 L'utilisateur connecté est l'organisateur
    });

    await newEvent.save();
    res.status(201).json({ message: 'Sortie créée avec succès !', event: newEvent });
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la création de la sortie', error });
  }
});

// ✅ 2. Récupérer toutes les sorties
router.get('/', async (req, res) => {
  try {
    const events = await Event.find().populate('createdBy', 'username'); // 🔍 Ajoute le nom de l'organisateur
    res.json(events);
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la récupération des sorties', error });
  }
});

// ✅ 3. Récupérer une sortie par ID
router.get('/:id', async (req, res) => {
  try {
    const event = await Event.findById(req.params.id).populate('createdBy', 'username');
    if (!event) return res.status(404).json({ message: 'Sortie non trouvée' });

    res.json(event);
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la récupération de la sortie', error });
  }
});

// ✅ 4. Mettre à jour une sortie (authentification requise, seul le créateur peut modifier)
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ message: 'Sortie non trouvée' });

    if (event.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Non autorisé à modifier cette sortie' });
    }

    Object.assign(event, req.body); // 🔄 Met à jour les champs avec les nouvelles valeurs
    await event.save();

    res.json({ message: 'Sortie mise à jour avec succès', event });
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la mise à jour', error });
  }
});

// ✅ 5. Supprimer une sortie (authentification requise, seul le créateur peut supprimer)
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ message: 'Sortie non trouvée' });

    if (event.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Non autorisé à supprimer cette sortie' });
    }

    await event.deleteOne();
    res.json({ message: 'Sortie supprimée avec succès' });
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la suppression', error });
  }
});

// ✅ 6. Participer à une sortie
router.post('/:id/join', authMiddleware, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ message: 'Sortie non trouvée' });

    if (!event.participants.includes(req.user._id)) {
      event.participants.push(req.user._id);
      await event.save();
    }

    res.json({ message: 'Inscription réussie à la sortie', event });
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de l\'inscription', error });
  }
});

// ✅ 7. Quitter une sortie
router.post('/:id/leave', authMiddleware, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ message: 'Sortie non trouvée' });

    event.participants = event.participants.filter(id => id.toString() !== req.user._id.toString());
    await event.save();

    res.json({ message: 'Désinscription réussie', event });
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la désinscription', error });
  }
});

module.exports = router;
