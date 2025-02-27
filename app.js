require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Connexion à MongoDB
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => console.log('✅ MongoDB connecté'))
  .catch(err => console.error('❌ Erreur de connexion MongoDB:', err));

// Importation des routes
const usersRouter = require('./routes/users');
const authRoutes = require('./routes/auth');
const eventsRouter = require('./routes/eventRoutes');

app.use('/users', usersRouter); // Routes utilisateurs
app.use('/auth', authRoutes); // Routes d'authentification
app.use('/events', eventsRouter); // Routes sorties

// Route test principale
app.get('/', (req, res) => {
  res.send('API City Connect fonctionne 🚀');
});

// Exportation de `app`
module.exports = app;
