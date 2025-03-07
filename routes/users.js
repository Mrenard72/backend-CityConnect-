const express = require('express');
const router = express.Router();
const User = require('../models/User');
const cloudinary = require('cloudinary').v2;
const authMiddleware = require('../middleware/auth');
const Event = require('../models/Event'); // Modèle pour récupérer les activités créées par l'utilisateur

const { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } = process.env;

// Configurer Cloudinary !
cloudinary.config({
    cloud_name: CLOUDINARY_CLOUD_NAME,
    api_key: CLOUDINARY_API_KEY,
    api_secret: CLOUDINARY_API_SECRET
});
console.log("\uD83D\uDE80 Cloudinary Config :", {
  cloud_name: CLOUDINARY_CLOUD_NAME,
  api_key: CLOUDINARY_API_KEY,
  api_secret: CLOUDINARY_API_SECRET ? 'OK' : 'NON CHARGÉ'
});

// Fonction pour supprimer l'ancienne photo sur Cloudinary
const deleteOldPhoto = async (photoUrl) => {
    if (photoUrl && photoUrl.includes("cloudinary.com")) {
        const publicId = photoUrl.split("/").pop().split(".")[0]; // Extrait l'ID public
        await cloudinary.uploader.destroy(publicId); // Supprime l'ancienne image
    }
};

// Route pour mettre à jour la photo de profil
router.post('/upload-profile-pic', authMiddleware, async (req, res) => {
    try {
        const { photoUrl } = req.body;
        if (!photoUrl || !photoUrl.startsWith("https://res.cloudinary.com/")) {
            return res.status(400).json({ message: 'URL invalide. L’image doit être hébergée sur Cloudinary.' });
        }

        // Trouver l'utilisateur
        const user = await User.findById(req.user._id);
        if (!user) return res.status(404).json({ message: 'Utilisateur non trouvé' });

        user.photo = photoUrl;
        await user.save();

        res.json({ message: 'Photo mise à jour avec succès', photo: user.photo });
    } catch (err) {
        console.log("❌ Erreur serveur :", err);
        res.status(500).json({ message: 'Erreur serveur' });
    }
});

// Route pour mettre à jour son profil (nom, photo)
router.put('/profile', authMiddleware, async (req, res) => {
    try {
        const { username, photo } = req.body;
        const user = await User.findById(req.user._id);
        if (!user) return res.status(404).json({ message: 'Utilisateur non trouvé' });

        if (username) user.username = username;
        if (photo && photo.startsWith("https://res.cloudinary.com/")) {
            user.photo = photo;
        }

        await user.save();
        res.json({ message: 'Profil mis à jour avec succès', user });
    } catch (error) {
        console.error("❌ Erreur lors de la mise à jour du profil :", error);
        res.status(500).json({ message: 'Erreur serveur', error });
    }
});

// ✅ Route pour récupérer le profil utilisateur par son ID
router.get('/:userId', async (req, res) => {
    try {
        const user = await User.findById(req.params.userId)
            .select('username photo proposedActivities reviewsReceived bio') // ✅ Inclure `reviewsReceived`
            .lean();

        if (!user) {
            return res.status(404).json({ message: 'Utilisateur non trouvé' });
        }

        // ✅ Calculer la note moyenne manuellement si elle n'est pas incluse via le virtual
        if (user.reviewsReceived && user.reviewsReceived.length > 0) {
            const sum = user.reviewsReceived.reduce((acc, review) => acc + review.rating, 0);
            user.averageRating = (sum / user.reviewsReceived.length).toFixed(1);
        } else {
            user.averageRating = "Pas encore noté";
        }

        console.log("✅ Données envoyées au frontend :", user); // 🔍 Vérification

        res.json(user);
    } catch (error) {
        console.error("❌ Erreur lors de la récupération du profil :", error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
});

  

// ✅ Route pour récupérer les activités créées par un utilisateur
router.get('/:userId/activities', async (req, res) => {
    try {
        const activities = await Event.find({ createdBy: req.params.userId });
        if (!activities.length) {
            return res.status(404).json({ message: "Aucune activité trouvée pour cet utilisateur." });
        }
        res.json(activities);
    } catch (error) {
        console.error("❌ Erreur lors de la récupération des activités :", error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
});

// ✅ Route pour changer la bio de l'utilisateur

router.put('/update-bio', authMiddleware, async (req, res) => {
    try {
        const { bio } = req.body;
        if (!bio || typeof bio !== 'string') {
            return res.status(400).json({ message: "La bio est invalide." });
        }

        const user = await User.findById(req.user._id);
        if (!user) {
            return res.status(404).json({ message: "Utilisateur non trouvé" });
        }

        user.bio = bio;
        await user.save();

        res.json({ message: "Bio mise à jour avec succès", bio: user.bio });
    } catch (error) {
        console.error("❌ Erreur lors de la mise à jour de la bio :", error);
        res.status(500).json({ message: "Erreur serveur" });
    }
});



module.exports = router;
