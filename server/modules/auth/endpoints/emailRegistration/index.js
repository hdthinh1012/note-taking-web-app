const express = require('express');
const router = express.Router();
const ssoRepository = require('../../repository/ssoRepository');

// Healthcheck endpoint
router.get('/healthcheck', (req, res) => {
  res.json({ status: 'ok', service: 'emailRegistration' });
});

router.post('/register', (req, res) => {
  // Registration logic here
  // Fetch email from req.body, create user, send confirmation email, etc.
  const { email } = req.body;

  // Simulate user creation and email sending
  console.log(`Registering user with email: ${email}`);
  // Here you would typically interact with your user database and email service
  ssoRepository.createSsoEntry({ userId: 'hdthinh01', type: 'email', sso_account: email, verified: false });

  res.status(201).json({ message: 'User registered successfully' });
});

module.exports = router;
