const jwt = require('jsonwebtoken');
const User = require('../models/User'); // ✅ Import du modèle User

const authMiddleware = async (req, res, next) => {
  const token = req.header('Authorization'); // 🔑 Récupère le token dans les headers
  if (!token) {
    return res.status(401).json({ message: 'Accès refusé. Aucun token fourni.' });
  }

  try {
    const decoded = jwt.verify(token.split(' ')[1], process.env.JWT_SECRET); // ✅ Vérifie le token
    const user = await User.findById(decoded.userId).select('_id username'); // 🔍 Récupère l'utilisateur en base

    if (!user) {
      return res.status(401).json({ message: 'Utilisateur non trouvé.' });
    }

    req.user = user; // ✅ Ajoute l'utilisateur entier dans `req.user`
    next(); // 🔄 Passe à la route suivante
  } catch (error) {
    res.status(401).json({ message: 'Token invalide.', error });
  }
};

module.exports = authMiddleware;
