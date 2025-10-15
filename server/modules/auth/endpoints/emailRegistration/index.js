const express = require('express');
const router = express.Router();
const ssoRepository = require('../../repository/ssoRepository');
const uuid = require('uuid');
const { verify } = require('jsonwebtoken');
const { sendEmail } = require('../../../../utils/email/emailServices');
const sso = require('db-migration/models/sso');

// Healthcheck endpoint
router.get('/healthcheck', (req, res) => {
  res.json({ status: 'ok', service: 'emailRegistration' });
});

router.post('/register', (req, res) => {
  if (!req.body.email) {
    return res.status(400).json({ error: 'Email is required' });
  }
  const { email } = req.body;
  const uuidAssigned = uuid.v4();

  const verifyLink = `http://localhost:3001/auth/email-registration/verify/${uuidAssigned}`;
  ssoRepository.createSsoEntry({ uuid: uuidAssigned, userId: null, type: 'email', sso_account: email, verified: false, verifyLink, status: 'pending' });

  sendEmail(email, 'Email Verification', `Please verify your email by clicking on the following link: ${verifyLink}`);

  res.status(201).json({ message: 'User registered successfully' });
});

router.get('/verify/:uuid', async (req, res) => {
  const { uuid } = req.params;
  const ssoEntry = await ssoRepository.getSsoEntryByUuid(uuid);
  if (!ssoEntry) {
    return res.status(404).json({ error: 'SSO entry not found' });
  }
  const { sso_account, verified } = ssoEntry;
  if (verified) {
    return res.status(400).json({ error: 'User already verified' });
  }
  let otherSsoEntries = await ssoRepository.getSsosByAccount(sso_account);
  if (otherSsoEntries.length > 1) {
    otherSsoEntries = otherSsoEntries.filter(entry => entry.uuid !== uuid);
    ssoRepository.markSsoAsInvalid(otherSsoEntries.map(entry => entry.uuid));
  }
  await ssoRepository.markSsoAsVerified(uuid);
  res.json({ message: 'User verified successfully' });
});

module.exports = router;
