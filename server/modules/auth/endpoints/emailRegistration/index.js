import express from 'express';
const router = express.Router();
import { ssoRepository } from '../../repository/ssoRepository.js';
import { v4 as uuidv4 } from 'uuid';
import jsonwebtoken from 'jsonwebtoken';
import { sendEmail } from '../../../../utils/email/emailServices.js';
import { EmailRegistrationService } from '../../services/emailRegistration.js';

const { verify } = jsonwebtoken;

// Healthcheck endpoint
router.get('/healthcheck', (req, res) => {
  res.json({ status: 'ok', service: 'emailRegistration' });
});

router.post('/register', (req, res) => {
  if (!req.body.email) {
    return res.status(400).json({ error: 'Email is required' });
  }
  const { email } = req.body;
  const uuidAssigned = uuidv4();

  const verifyLink = `http://localhost:3001/auth/email-registration/verify/${uuidAssigned}`;
  ssoRepository.createSsoEntry({ uuid: uuidAssigned, userId: null, type: 'email', sso_account: email, verified: false, verifyLink, status: 'pending' });

  sendEmail(email, 'Email Verification', `Please verify your email by clicking on the following link: ${verifyLink}`);

  res.status(201).json({ message: 'User registered successfully' });
});

router.get('/verify/:uuid', async (req, res) => {
  const { uuid } = req.params;
  await EmailRegistrationService.verifyUuid(process, uuid);
  res.json({ message: 'User verified successfully' });
});

export default router;
