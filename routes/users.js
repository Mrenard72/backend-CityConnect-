const express = require('express');
const router = express.Router();

// Route test utilisateur
router.get('/', (req, res) => {
  res.json({ message: "Route utilisateur opérationnelle ✅" });
});

module.exports = router;
