const express = require('express');
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const router = express.Router();

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

    // Générer un token JWT
    const token = jwt.sign({ userId: newUser._id }, process.env.JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({ token, userId: newUser._id, username: newUser.username });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error });
  }
});


// Route de connexion
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Vérifier si l'utilisateur existe
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: 'Email ou mot de passe incorrect' });

    // Vérifier le mot de passe
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Email ou mot de passe incorrect' });

    // Générer un token JWT
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });

    res.json({ token, userId: user._id });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error });
  }
});

const authMiddleware = require('../middleware/auth');

// Route pour récupérer le profil utilisateur
router.get('/profile', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('-password'); // Exclure le mot de passe
    if (!user) return res.status(404).json({ message: 'Utilisateur non trouvé' });

    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error });
  }
});


module.exports = router;
