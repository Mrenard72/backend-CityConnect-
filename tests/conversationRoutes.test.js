require('dotenv').config({ path: './.env' });

const request = require('supertest');
const app = require('../app'); // Assure-toi que ton app Express est bien exportée dans app.js

test('✅ Vérifier que la route de récupération des conversations existe', async () => {
  const res = await request(app).get('/conversations/my-conversations');
  expect(res.statusCode).not.toBe(404); // Vérifie que la route existe
});
