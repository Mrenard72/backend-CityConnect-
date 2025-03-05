const express = require('express');
const router = express.Router();
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Event = require('../models/Event');
const axios = require("axios");


// ✅ Vérifier que JWT_SECRET est bien défini !
console.log("🚀 JWT_SECRET chargé :", process.env.JWT_SECRET);

// ✅ Fonction pour générer un token JWT
const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '360d' });
};

// ✅ Route d'inscription
router.post('/register', async (req, res) => {
  try {
    const { username, email, password, photo } = req.body;

    // ✅ Vérifier si l'email est valide
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: 'Adresse email invalide' });
    }

    // ✅ Vérifier si l'utilisateur existe déjà
    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ message: 'Email déjà utilisé' });

    // ✅ Créer un nouvel utilisateur
    const newUser = new User({ username, email, password, photo });
    await newUser.save();

    // ✅ Générer un token
    const token = generateToken(newUser._id);

    res.status(201).json({ token, userId: newUser._id, username: newUser.username });

  } catch (error) {
    console.error("❌ Erreur lors de l'inscription :", error);
    res.status(500).json({ message: 'Erreur serveur', error });
  }
});

// ✅ Route de connexion
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // ✅ Vérifier si l'utilisateur existe
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: 'Email ou mot de passe incorrect' });

    // ✅ Vérifier le mot de passe
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Email ou mot de passe incorrect' });

    // ✅ Générer un token
    const token = generateToken(user._id);

    res.json({ token, userId: user._id, username: user.username, photo: user.photo });

  } catch (error) {
    console.error("❌ Erreur lors de la connexion :", error);
    res.status(500).json({ message: 'Erreur serveur', error });
  }
});

// ✅ Middleware d'authentification
const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: "Token invalide ou manquant." });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ message: "Token invalide." });
  }
};

// ✅ Route pour récupérer le profil utilisateur !!
router.get('/profile', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('-password');
    if (!user) return res.status(404).json({ message: 'Utilisateur non trouvé' });

    res.json({
      _id: user._id,  // 🔥 Assure-toi que l'ID est bien renvoyé ici
      username: user.username,
      photo: user.photo,
      email: user.email,
      averageRating: user.averageRating
    });
  } catch (error) {
    console.error("❌ Erreur lors de la récupération du profil :", error);
    res.status(500).json({ message: 'Erreur serveur', error });
  }
});


// ✅ Route pour mettre à jour son profil
router.get('/profile', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('-password');
    if (!user) return res.status(404).json({ message: 'Utilisateur non trouvé' });

    res.json({
      _id: user._id,  // 🔥 Assure-toi que _id est bien renvoyé ici
      username: user.username,
      photo: user.photo,
      email: user.email,
      averageRating: user.averageRating
    });
  } catch (error) {
    console.error("❌ Erreur lors de la récupération du profil :", error);
    res.status(500).json({ message: 'Erreur serveur', error });
  }
});


// ✅ Route pour se déconnecter (optionnel)
router.post('/logout', authMiddleware, (req, res) => {
  try {
    res.json({ message: 'Déconnexion réussie' });
  } catch (error) {
    console.error("❌ Erreur lors de la déconnexion :", error);
    res.status(500).json({ message: 'Erreur serveur', error });
  }
});

// ✅ Route pour changer le mot de passe
router.put('/change-password', authMiddleware, async (req, res) => {
  try {
    // Vérification des données reçues
    console.log("🔍 Données reçues:", req.body);

    // Extraire les valeurs du body
    const { lastPassword, newPassword } = req.body;

    // Vérification que les champs sont bien fournis
    if (!lastPassword || !newPassword) {
      return res.status(400).json({ message: "Veuillez remplir tous les champs." });
    }

    // Récupération de l'utilisateur depuis la base de données
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }

    // Vérification de l'ancien mot de passe
    const isMatch = await bcrypt.compare(lastPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Ancien mot de passe incorrect' });
    }

    // Ajout de logs pour voir ce qui se passe
    console.log("✅ Ancien mot de passe correct.");

    // Hashage du nouveau mot de passe
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Vérification du hashage (log pour voir le résultat)
    console.log("🔑 Nouveau hash du mot de passe :", hashedPassword);
    const updateresult = await user.updateOne({ password: hashedPassword });
    if (updateresult.modifiedCount === 0) {
      return res.status(404).json({ message: 'Erreur serveur', error: "update failed" });
      }
      console.log("✅ Mot de passe mis à jour en base de données.");
      res.json({ message: 'Mot de passe mis à jour avec succès' });
  
  } catch (error) {
    console.error("❌ Erreur lors de la modification du mot de passe :", error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// ✅ Route pour se connecter avec Google
router.post('/google-login', async (req, res) => {
  try {
    // Vérifier l'authenticité du token avec Google
    const googleResponse = await axios.get(
      `https://www.googleapis.com/oauth2/v3/tokeninfo?id_token=${idToken}`
    );

    const { email, name, picture, sub: googleId } = googleResponse.data;

    // Vérifier si l'utilisateur existe déjà
    let user = await User.findOne({ email });

    if (!user) {
      // Générer un mot de passe aléatoire hashé pour l'utilisateur
      const randomPassword = await bcrypt.hash(googleId, 10);

      user = new User({
        username: name || email.split("@")[0], // Utilise le nom Google ou l'email
        email,
        password: randomPassword, // Mot de passe caché
        photo: picture,
      });

      await user.save();
    }

    // Générer un token JWT pour l'authentification
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    res.json({ token, user });
  } catch (error) {
    console.error("Erreur d'authentification Google :", error);
    res.status(401).json({ message: "Échec de l'authentification" });
  }
});

// ✅ Route pour récupérer un utilisateur par son ID
router.get('/:userId', async (req, res) => {
  try {
      const user = await User.findById(req.params.userId).select('username photo averageRating bio proposedActivities');
      if (!user) {
          return res.status(404).json({ message: 'Utilisateur non trouvé' });
      }
      res.json(user);
  } catch (error) {
      console.error("❌ Erreur lors de la récupération de l'utilisateur:", error);
      res.status(500).json({ message: 'Erreur serveur' });
  }
});

// ✅ Route pour récupérer les activités créées par un utilisateur
router.get('/:userId/activities', async (req, res) => {
  try {
      const activities = await Event.find({ createdBy: req.params.userId });
      res.json(activities);
  } catch (error) {
      console.error("❌ Erreur lors de la récupération des activités:", error);
      res.status(500).json({ message: 'Erreur serveur' });
  }
});

// ✅ Route pour noter un utilisateur
router.post('/:userId/rate', authMiddleware, async (req, res) => {
  try {
      const { rating } = req.body;
      if (!rating || rating < 1 || rating > 5) {
          return res.status(400).json({ message: 'La note doit être entre 1 et 5' });
      }

      const user = await User.findById(req.params.userId);
      if (!user) {
          return res.status(404).json({ message: 'Utilisateur non trouvé' });
      }

      user.reviewsReceived.push({ reviewerId: req.user.userId, rating });
      await user.save();
      res.json({ message: 'Note enregistrée avec succès' });
  } catch (error) {
      console.error("❌ Erreur lors de la notation de l'utilisateur:", error);
      res.status(500).json({ message: 'Erreur serveur' });
  }
});

module.exports = router;
