const mongoose = require('mongoose');

// ✅ Schéma de l'événement
const eventSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  location: { type: String, required: true },
  date: { type: Date, required: true }, 
  category: { type: String, enum: ['Sport', 'Culturel', 'Sorties', 'Culinaire'], required: true },
  
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, //  Référence au créateur de l'événement
  participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }], //  Liste des participants
  
  maxParticipants: { type: Number, required: true }, //  Nombre max de personnes autorisées
  photos: [{ type: String }], //  Liste des URLs des photos de l'événement

  createdAt: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('Event', eventSchema);
