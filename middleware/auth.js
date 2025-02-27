const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
  const token = req.header('Authorization'); // Récupère le token dans le header
  if (!token) {
    return res.status(401).json({ message: 'Accès refusé. Aucun token fourni.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET); // Vérifie le token
    req.user = decoded; // Ajoute l'utilisateur décodé à `req.user`
    next();
  } catch (error) {
    res.status(401).json({ message: 'Token invalide.' });
  }
};

module.exports = authMiddleware;
