const express = require('express');
const router = express.Router();
const User = require('../models/User');
const cloudinary = require('cloudinary').v2;
const authMiddleware = require('../middleware/auth');

const { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } = process.env;

// Configurer Cloudinary !
cloudinary.config({
    cloud_name: CLOUDINARY_CLOUD_NAME,
    api_key: CLOUDINARY_API_KEY,
    api_secret: CLOUDINARY_API_SECRET
});
console.log("🚀 Cloudinary Config :", {
  cloud_name: CLOUDINARY_CLOUD_NAME,
  api_key: CLOUDINARY_API_KEY,
  api_secret: CLOUDINARY_API_SECRET ? 'OK' : 'NON CHARGÉ'
});


router.get('/profile', authMiddleware, async (req, res) => {
  try {
      const user = await User.findById(req.user._id).select('username email photo');
      if (!user) {
          return res.status(404).json({ message: 'Utilisateur non trouvé' });
      }

      res.json({
          username: user.username,
          email: user.email,
          photo: user.photo // ✅ Ajout de la photo de profil
      });

  } catch (error) {
      console.error("❌ Erreur lors de la récupération du profil :", error);
      res.status(500).json({ message: 'Erreur serveur', error });
  }
});

router.post('/upload-profile-pic', authMiddleware, async (req, res) => {
  try {
      const { photoUrl } = req.body; // On récupère l'URL envoyée par le frontend

      if (!photoUrl) {
          return res.status(400).json({ message: 'Aucune URL fournie' });
      }

      // Trouver l'utilisateur
      const user = await User.findById(req.user._id);
      if (!user) return res.status(404).json({ message: 'Utilisateur non trouvé' });

      // Mettre à jour la photo de profil
      user.photo = photoUrl;
      await user.save();

      res.json({ message: 'Photo mise à jour avec succès', photo: user.photo });

  } catch (err) {
      console.log("❌ Erreur serveur :", err);
      res.status(500).json({ message: 'Erreur serveur' });
  }
});


// ✅ Route pour mettre à jour son profil (nom, photo)
router.put('/profile', authMiddleware, async (req, res) => {
    try {
        const { username, photo } = req.body;
        const user = await User.findById(req.user._id);
        if (!user) return res.status(404).json({ message: 'Utilisateur non trouvé' });

        if (username) user.username = username;
        if (photo) user.photo = photo;

        await user.save();
        res.json({ message: 'Profil mis à jour avec succès', user });

    } catch (error) {
        console.error("❌ Erreur lors de la mise à jour du profil :", error);
        res.status(500).json({ message: 'Erreur serveur', error });
    }
});


module.exports = router;

