const express = require('express');
const router = express.Router();

// const authenticateToken = require('../middleware/jwt');
const {authorizeRole, authenticateToken} = require('../middleware/jwt');

// Example healthcheck for auth domain
router.get('/health', (req, res) => {
  res.json({ status: 'ok', domain: 'auth' });
});

router.get('/protected', authenticateToken, authorizeRole('user'), (req, res) => {
  res.json({ message: 'This is a protected route', user: req.user });
});

// Add more auth endpoints here
// Attach emailRegistration sub-router
const emailRegistrationRouter = require('./emailRegistration');
router.use('/email-registration', emailRegistrationRouter);

module.exports = router;
