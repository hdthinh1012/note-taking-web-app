const request = require('supertest');
const express = require('express');

// Example notes endpoint for demonstration
const app = express();
app.use(express.json());
app.get('/notes', (req, res) => {
  res.json([
    { id: 1, title: 'Note 1' },
    { id: 2, title: 'Note 2' }
  ]);
});

describe('Notes Endpoints', () => {
  it('should return a list of notes', async () => {
    const res = await request(app).get('/notes');
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBe(2);
  });
});
