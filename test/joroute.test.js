const request = require('supertest');
const auth = require('../auth'); // Assurez-vous que le chemin vers votre fichier app.js est correct

describe('GET /existing-route', () => {
    it('should return 200 and the expected response', async () => {
        const res = await request(auth).get('/existing-route');
        expect(res.statusCode).toEqual(200);
        expect(res.body).toHaveProperty('data'); // Adaptez cette ligne en fonction de la réponse attendue
    });
});

describe('POST /existing-route', () => {
    it('should create a new resource and return 201', async () => {
        const res = await request(app)
            .post('/existing-route')
            .send({
                key: 'value' // Adaptez cette ligne en fonction des données attendues
            });
        expect(res.statusCode).toEqual(201);
        expect(res.body).toHaveProperty('id'); // Adaptez cette ligne en fonction de la réponse attendue
    });
});