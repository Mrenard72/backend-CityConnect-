const express = require('express');
const axios = require('axios');
require('dotenv').config();

const router = express.Router();

const { FOURSQUARE_API_KEY } = process.env;

// ✅ Middleware pour vérifier si la clé API est bien définie
if (!FOURSQUARE_API_KEY) {
    console.error("❌ ERREUR: La clé API Foursquare est manquante !");
    process.exit(1);
}

// 📌 Route pour récupérer les restaurants à partir des coordonnées GPS
router.get('/restaurants', async (req, res) => {
    const { lat, lon } = req.query;

    // ✅ Vérifie si les coordonnées sont bien fournies
    if (!lat || !lon) {
        console.log("⚠️ Erreur: Latitude et Longitude manquantes !");
        return res.status(400).json({ error: "Latitude et Longitude sont requis." });
    }

    try {
        console.log(`🔍 Recherche des restaurants pour lat=${lat}, lon=${lon}`);

        const url = `https://api.foursquare.com/v3/places/search?ll=${lat},${lon}&radius=5000&categories=13065&limit=20`;

        // ✅ Appel API à Foursquare
        const response = await axios.get(url, {
            headers: {
                "Authorization": `Bearer ${FOURSQUARE_API_KEY}`,
                "Accept": "application/json"
            }
        });

        console.log("✅ Réponse API reçue :", JSON.stringify(response.data, null, 2));

        // ✅ Vérifie si on a des résultats
        if (!response.data.results || response.data.results.length === 0) {
            return res.json({ message: "Aucun restaurant trouvé." });
        }

        // ✅ Formatage des données
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
        console.error("❌ Erreur API Foursquare :", error.response ? error.response.data : error.message);
        res.status(500).json({ error: "Erreur lors de la récupération des restaurants." });
    }
});

module.exports = router;
