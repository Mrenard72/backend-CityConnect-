 // Importation des modules supertest et de l'application
  const request = require('supertest');
  const app = require('../app'); 
  const mongoose = require('mongoose');
  
  describe('Test de la route GET /', () => {
    test('Devrait renvoyer le message "🚀 API CityConnect fonctionne !"', async () => {
      const response = await request(app).get('/');
      expect(response.status).toBe(200);
      expect(response.text).toBe('🚀 API CityConnect fonctionne !');
    });
  });
  
  afterAll(async () => {
    // Ferme la connexion MongoDB après les tests
    await mongoose.connection.close();
  });
  
  yar