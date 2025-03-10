const request = require('supertest');
const app = require('../app');
const jwt = require('jsonwebtoken');

// Générer un token de test
const token = jwt.sign({ userId: 'testuserid' }, process.env.JWT_SECRET || 'secret', { expiresIn: '1h' });

describe('POST /events', () => {
    it('✅ Devrait renvoyer 401 si utilisateur non authentifié', async () => {
        const res = await request(app)
            .post('/events')
            .send({ title: 'Test Event' });

        expect(res.status).toBe(401);
    });
});
