const request = require('supertest');
const express = require('express');

// Example auth endpoint for demonstration
const app = express();
app.use(express.json());
app.post('/auth/login', (req, res) => {
  const { username, password } = req.body;
  if (username === 'user' && password === 'pass') {
    return res.status(200).json({ token: 'fake-jwt-token' });
  }
  res.status(401).json({ error: 'Unauthorized' });
});

describe('Auth Endpoints', () => {
  it('should login successfully with correct credentials', async () => {
    const res = await request(app)
      .post('/auth/login')
      .send({ username: 'user', password: 'pass' });
    expect(res.statusCode).toBe(200);
    expect(res.body.token).toBeDefined();
  });

  it('should fail login with wrong credentials', async () => {
    const res = await request(app)
      .post('/auth/login')
      .send({ username: 'user', password: 'wrong' });
    expect(res.statusCode).toBe(401);
    expect(res.body.error).toBe('Unauthorized');
  });
});
