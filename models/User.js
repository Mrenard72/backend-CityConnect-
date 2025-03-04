const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  token: { type: String }, // Stocke temporairement le token d’authentification
  photo: { type: String, default: "https://res.cloudinary.com/dasntwyhd/image/upload/v1712345678/default-avatar.jpg" }, // Photo de profil
  
  reservedActivities: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Experience' }], // Activités réservées
  proposedActivities: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Experience' }], // Activités créées ok
  
  reviewsReceived: [{
    reviewerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Qui a noté ?
    rating: { type: Number, min: 1, max: 5 }, // Note entre 1 et 5
    createdAt: { type: Date, default: Date.now }
  }],

  createdAt: { type: Date, default: Date.now }
}, { timestamps: true });

// //  Hashage du mot de passe avant sauvegarde
// UserSchema.pre('save', async function(next) {
//   if (!this.isModified('password') || this.password.startsWith('$2a$')) return next();
//   const salt = await bcrypt.genSalt(10);
//   this.password = await bcrypt.hash(this.password, salt);
//   next();
// });


// Calculer la note moyenne reçue par un utilisateur
UserSchema.virtual('averageRating').get(function() {
  if (!this.reviewsReceived || this.reviewsReceived.length === 0) return "Pas encore noté";
  const sum = this.reviewsReceived.reduce((acc, review) => acc + review.rating, 0);
  return (sum / this.reviewsReceived.length).toFixed(1);
});

module.exports = mongoose.model('User', UserSchema);
