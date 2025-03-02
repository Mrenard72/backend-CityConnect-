const express = require('express');
const router = express.Router();
const User = require('../models/User');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const authMiddleware = require('../middleware/auth');

const { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } = process.env;

// Configurer Cloudinary
cloudinary.config({
    cloud_name: CLOUDINARY_CLOUD_NAME,
    api_key: CLOUDINARY_API_KEY,
    api_secret: CLOUDINARY_API_SECRET
});

// Configuration Multer pour l'upload
const storage = multer.memoryStorage();
const upload = multer({ storage });

router.get('/profile', authMiddleware, async (req, res) => {
  try {
      const user = await User.findById(req.user._id).select('username email profilePicture');
      if (!user) {
          return res.status(404).json({ message: 'Utilisateur non trouvé' });
      }

      res.json({
          username: user.username,
          email: user.email,
          profilePicture: user.profilePicture // ✅ Ajout de la photo de profil
      });

  } catch (error) {
      console.error("❌ Erreur lors de la récupération du profil :", error);
      res.status(500).json({ message: 'Erreur serveur', error });
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

router.post('/upload-profile-pic', authMiddleware, upload.single('profilePic'), async (req, res) => {
    try {
      console.log("📸 Fichier reçu :", req.file); 


        if (!req.file) {
            console.log("❌ Aucune image reçue !");
            return res.status(400).json({ message: 'Aucun fichier fourni' });
        }

        cloudinary.uploader.upload_stream({ folder: 'profile_pictures' }, async (error, result) => {
            if (error) {
                console.log("❌ Erreur Cloudinary :", error);
                return res.status(500).json({ message: 'Échec de l\'upload' });
            }

            console.log("✅ Image uploadée sur Cloudinary :", result.secure_url);

            const user = await User.findById(req.user._id);
            if (!user) return res.status(404).json({ message: 'Utilisateur non trouvé' });

            user.profilePicture = result.secure_url;
            await user.save();

            res.json({ profilePicture: result.secure_url });
        }).end(req.file.buffer);

    } catch (err) {
        console.log("❌ Erreur serveur :", err);
        res.status(500).json({ message: 'Erreur serveur' });
    }
});

module.exports = router;

