const mongoose = require('mongoose');

// ✅ Schéma de la sortie (événement)
const eventSchema = new mongoose.Schema({
  title: { type: String, required: true }, // 🏷️ Nom de l'événement
  description: { type: String, required: true }, // 📝 Description
  location: { type: String, required: true }, // 📍 Lieu
  date: { type: Date, required: true }, // 📅 Date de l'événement
  category: { type: String, enum: ['Sport', 'Culturel', 'Sorties', 'Culinaire'], required: true }, // 🎭 Catégorie
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // 👤 Utilisateur créateur
  participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }], // 👥 Liste des participants
}, { timestamps: true });

module.exports = mongoose.model('Event', eventSchema);
