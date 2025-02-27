const jwt = require('jsonwebtoken');
const User = require('../models/User'); // ✅ Import du modèle User

const authMiddleware = async (req, res, next) => {
  console.log("🔍 Header Authorization reçu :", req.headers.authorization); // ✅ Debugging

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.log("❌ Token manquant ou mal formaté.");
    return res.status(401).json({ message: "Token invalide ou manquant." });
  }

  const token = authHeader.split(' ')[1];

  try {
    console.log("🔑 Token extrait :", token);
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // ✅ Récupérer l'utilisateur complet en base de données
    const user = await User.findById(decoded.userId).select('_id username email');
    if (!user) {
      return res.status(401).json({ message: "Utilisateur non trouvé." });
    }

    req.user = user; // ✅ Stocker l'utilisateur complet dans `req.user`
    console.log("✅ Utilisateur récupéré :", req.user);
    next();
  } catch (error) {
    console.error("❌ Erreur de validation du token :", error);
    return res.status(401).json({ message: "Token invalide." });
  }
};

module.exports = authMiddleware;
