const express = require('express');
const axios = require('axios');
require('dotenv').config();

const router = express.Router();

// 📌 Route pour récupérer les restaurants proches de la localisation de l'utilisateur
router.get('/restaurants', async (req, res) => {
    const { lat, lon } = req.query; // 📍 Récupérer les coordonnées envoyées par le frontend

    if (!lat || !lon) {
        return res.status(400).json({ error: "Latitude et Longitude sont requis." });
    }

    try {
        // 📌 Construire l'URL Foursquare avec les coordonnées
        const url = `https://api.foursquare.com/v3/places/search?ll=${lat},${lon}&radius=5000&categories=13065&limit=20`;

        // 📌 Effectuer l'appel API vers Foursquare
        const response = await axios.get(url, {
            headers: {
                "Authorization": `Bearer ${process.env.FOURSQUARE_API_KEY}`, // 🔑 Clé API depuis Vercel
                "Accept": "application/json"
            },
        });

        // 📌 Mapper les résultats et formater la réponse
        const restaurants = response.data.results.map((place) => ({
            id: place.fsq_id,
            name: place.name,
            address: place.location.address || "Adresse non disponible",
            city: place.location.locality || "Ville inconnue",
            latitude: place.geocodes.main.latitude,
            longitude: place.geocodes.main.longitude,
        }));

        res.json(restaurants); // 📌 Retourner la liste des restaurants au frontend
    } catch (error) {
        console.error("Erreur API Foursquare:", error.response ? error.response.data : error);
        res.status(500).json({ error: "Erreur lors de la récupération des restaurants." });
    }
});

module.exports = router;
