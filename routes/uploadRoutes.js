// routes/uploadRoutes.js
const express = require('express');
const router = express.Router();
const cloudinary = require('cloudinary').v2;
const multer = require('multer');
const authMiddleware = require('../middleware/auth');

// Configuration de cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});


const storage = multer.memoryStorage(); // Stockage en mémoire au lieu de sur disque
const upload = multer({ storage });

// Puis modifiez votre route d'upload:
router.post('/upload', authMiddleware, upload.single('file'), async (req, res) => {
  try {
    console.log("Requête d'upload reçue");
    
    if (!req.file) {
      console.log("Aucun fichier n'a été reçu");
      return res.status(400).json({ message: 'Aucun fichier fourni' });
    }

    // Convertir le buffer en données base64 pour Cloudinary
    const fileStr = req.file.buffer.toString('base64');
    const fileUri = `data:${req.file.mimetype};base64,${fileStr}`;
    
    // Upload des données en base64 vers Cloudinary
    const result = await cloudinary.uploader.upload(fileUri, {
      folder: 'city_connect',
    });

    console.log("Upload Cloudinary réussi:", result.secure_url);
    
    res.json({ 
      url: result.secure_url,
      public_id: result.public_id
    });
  } catch (error) {
    console.error("Erreur d'upload Cloudinary:", error);
    res.status(500).json({ message: "Erreur lors de l'upload de l'image", error: error.message });
  }
});

module.exports = router;