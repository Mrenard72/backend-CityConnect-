const mongoose = require('mongoose');

const conversationSchema = new mongoose.Schema({
    participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    messages: [{
        sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        content: String,
        timestamp: { type: Date, default: Date.now }
    }],
    lastUpdated: { type: Date, default: Date.now },
    eventId: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true } // Lien avec un événement
});

module.exports = mongoose.model('Conversation', conversationSchema);
