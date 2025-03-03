const express = require('express');
const axios = require('axios');
require('dotenv').config();

const router = express.Router();

// 📌 Route pour récupérer les restaurants proches de la localisation de l'utilisateur

router.get('/restaurants', async (req, res) => {
    const { lat, lon } = req.query;

    if (!lat || !lon) {
        console.log("⚠️ Erreur: latitude et longitude manquantes !");
        return res.status(400).json({ error: "Latitude et Longitude sont requis." });
    }

    try {
        console.log(`🔍 Recherche de restaurants pour lat=${lat}, lon=${lon}`);
        
        const url = `https://api.foursquare.com/v3/places/search?ll=${lat},${lon}&radius=5000&categories=13065&limit=20`;

        console.log("🔑 Clé API utilisée :", process.env.FOURSQUARE_API_KEY);

        const response = await axios.get(url, {
            headers: {
                "Authorization": `Bearer ${process.env.FOURSQUARE_API_KEY}`,
                "Accept": "application/json"
            }
        });

        console.log("✅ Réponse API reçue :", JSON.stringify(response.data, null, 2));

        const restaurants = response.data.results.map((place) => ({
            id: place.fsq_id,
            name: place.name,
            address: place.location.address || "Adresse non disponible",
            city: place.location.locality || "Ville inconnue",
            latitude: place.geocodes.main.latitude,
            longitude: place.geocodes.main.longitude,
        }));

        res.json(restaurants);
    } catch (error) {
        console.error("❌ Erreur API Foursquare :", error.response ? JSON.stringify(error.response.data, null, 2) : error.message);
        res.status(500).json({ error: error.response ? error.response.data : "Erreur lors de la récupération des restaurants." });
    }
});

module.exports = router;
