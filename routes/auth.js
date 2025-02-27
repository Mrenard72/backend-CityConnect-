const express = require('express');
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const router = express.Router();

// ✅ Vérifier que JWT_SECRET est bien défini
console.log("🚀 JWT_SECRET chargé :", process.env.JWT_SECRET);

// Route d'inscription
router.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Vérifier si l'utilisateur existe déjà
    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ message: 'Email déjà utilisé' });

    // Créer un nouvel utilisateur
    const newUser = new User({ username, email, password });
    await newUser.save();

    // ✅ Générer un token
    const token = jwt.sign({ userId: newUser._id }, process.env.JWT_SECRET, { expiresIn: '7d' });

    console.log("✅ Token généré à l'inscription :", token);
    res.status(201).json({ token, userId: newUser._id, username: newUser.username });
  } catch (error) {
    console.error("❌ Erreur lors de l'inscription :", error);
    res.status(500).json({ message: 'Erreur serveur', error });
  }
});

// Route de connexion
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (!user) return res.status(400).json({ message: 'Email ou mot de passe incorrect' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Email ou mot de passe incorrect' });

    // ✅ Générer un token
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });

    console.log("✅ Token généré à la connexion :", token); // ✅ Debugging

    res.json({ token, userId: user._id });
  } catch (error) {
    console.error("❌ Erreur lors de la connexion :", error);
    res.status(500).json({ message: 'Erreur serveur', error });
  }
});


// Middleware d'authentification
const authMiddleware = (req, res, next) => {
  // ✅ Voir ce que le frontend envoie
  console.log("🔍 Header Authorization reçu :", req.headers.authorization);

  // Vérifier la présence du token
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.log("❌ Token manquant ou mal formaté.");
    return res.status(401).json({ message: "Token invalide ou manquant." });
  }

  const token = authHeader.split(' ')[1];

  try {
    console.log("🔑 Token extrait :", token);
    console.log("🛠️ Utilisation de JWT_SECRET :", process.env.JWT_SECRET);

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // Stocker les infos utilisateur dans req
    console.log("✅ Token valide, utilisateur décodé :", decoded);
    next();
  } catch (error) {
    console.error("❌ Erreur de validation du token :", error);
    return res.status(401).json({ message: "Token invalide." });
  }
};

// Route pour récupérer le profil utilisateur
router.get('/profile', authMiddleware, async (req, res) => {
  try {
    console.log("🔍 Récupération du profil de l'utilisateur ID :", req.user.userId);
    const user = await User.findById(req.user.userId).select('-password'); // Exclure le mot de passe
    if (!user) return res.status(404).json({ message: 'Utilisateur non trouvé' });

    res.json(user);
  } catch (error) {
    console.error("❌ Erreur lors de la récupération du profil :", error);
    res.status(500).json({ message: 'Erreur serveur', error });
  }
});

module.exports = router;
