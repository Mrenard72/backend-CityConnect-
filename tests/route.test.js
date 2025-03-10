

const request = require('supertest');
const express = require('express');
const app = express();

app.use(express.json());

app.post('/api/test', (req, res) => {
    res.status(200).send({ message: 'Success' });
});

describe('POST /api/test', () => {
    it('should return 200 and success message', async () => {
        const res = await request(app)
            .post('/api/test')
            .send({ key: 'value' });

        expect(res.statusCode).toEqual(200);
        expect(res.body).toHaveProperty('message', 'Success');
    });
});