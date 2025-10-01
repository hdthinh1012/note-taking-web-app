const express = require('express');
const router = express.Router();

const authenticateToken = require('../middleware/jwt');
const authorizeRole = require('../middleware/jwt');

// Example healthcheck for auth domain
router.get('/health', (req, res) => {
  res.json({ status: 'ok', domain: 'auth' });
});

router.get('/protected', authenticateToken, authorizeRole('user'), (req, res) => {
  res.json({ message: 'This is a protected route', user: req.user });
});

// Add more auth endpoints here

module.exports = router;
