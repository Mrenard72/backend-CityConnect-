const mongoose = require('mongoose');

// ✅ Schéma de la sortie (événement)
const eventSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  location: { type: String, required: true },
  date: { type: Date, required: true }, 
  category: { type: String, enum: ['Sport', 'Culturel', 'Sorties', 'Culinaire'], required: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }], 
}, { timestamps: true });

module.exports = mongoose.model('Event', eventSchema);
