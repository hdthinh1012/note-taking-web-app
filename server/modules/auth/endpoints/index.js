import express from 'express';
const router = express.Router();

import { authorizeRole, authenticateToken } from '../middleware/jwt.js';

// Example healthcheck for auth domain
router.get('/health', (req, res) => {
  res.json({ status: 'ok', domain: 'auth' });
});

router.get('/protected', authenticateToken, authorizeRole('user'), (req, res) => {
  res.json({ message: 'This is a protected route', user: req.user });
});

// Add more auth endpoints here
// Attach emailRegistration sub-router
import emailRegistrationRouter from './emailRegistration/index.js';
import accountRegistrationRouter from './accountRegistration/router.js';
import userAuthenticationRouter from './userAuthentication/router.js';
router.use('/email-registration', emailRegistrationRouter);
router.use('/account-registration', accountRegistrationRouter);
router.use('/user-authentication', userAuthenticationRouter);

export default router;
