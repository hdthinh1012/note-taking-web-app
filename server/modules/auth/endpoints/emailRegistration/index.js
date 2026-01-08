import express from 'express';
const router = express.Router();
import { ssoRepository } from '../../repository/ssoRepository.js';
import { v4 as uuidv4 } from 'uuid';
import jsonwebtoken from 'jsonwebtoken';
import { sendEmail } from '../../../../utils/email/emailServices.js';
import { EmailRegistrationService } from '../../services/emailRegistration.js';
import { AccountRegistrationService } from '../../services/accountRegistration.js';
import dotenv from 'dotenv';


dotenv.config();
const { verify } = jsonwebtoken;

// Healthcheck endpoint
router.get('/healthcheck', (req, res) => {
  res.json({ status: 'ok', service: 'emailRegistration' });
});

router.post('/signup', (req, res) => {
  try {
    if (!req.body.email) {
      return res.status(400).json({ error: 'Email is required' });
    }
    // find sso entry by email
    const existingSso = ssoRepository.getSsosByAccount(req.body.email);
    if (existingSso && existingSso.length > 0) {
      return res.status(400).json({ error: 'Email is already registered' });
    }

    const { email } = req.body;
    const uuidAssigned = uuidv4();

    const verifyLink = `${process.env.SERVER_URL}/auth/email-registration/verify/${uuidAssigned}`;
    const rejectLink = `${process.env.SERVER_URL}/auth/email-registration/reject/${uuidAssigned}`;
    ssoRepository.createSsoEntry({ uuid: uuidAssigned, userId: null, type: 'email', sso_account: email, verified: false, verifyLink, rejectLink, status: 'pending' });

    sendEmail(email, 'Email Verification', `Please verify your email by clicking on the following link: ${verifyLink}. If you did not request this, you can reject the registration here: ${rejectLink}`);

    res.status(200).json({ message: 'Register email sent, check your inbox for further instruction!' });
  } catch (error) {
    console.error('Error during registration:', error);
    res.status(500).json({ error });
  }
});

router.get('/verify/:uuid', async (req, res) => {
  try {
    const { uuid } = req.params;
    await EmailRegistrationService.verifyUuid(uuid);
    const registerToken = await AccountRegistrationService.createRegisterToken(uuid);


    // const csrfProtectedForm = `
    //   <form id="redirectForm" method="GET" action="http://localhost:3001/abc/xyz">
    //     <input type="hidden" name="csrfToken" value="${csrfToken}" />
    //     <input type="username" name="username" />
    //     <input type="password" name="password" />
    //     <button type="submit">Create Account</button>
    //   </form>
    // `;
    
    // Return frontend URL with token as query parameter
    const frontendUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/auth/account-register?sso_uuid=${registerToken.sso_uuid}`;
    res.status(302).redirect(frontendUrl);
  } catch (error) {
    console.error('Error during verification:', error);
    res.status(500).json({ error });
  }
});

router.get('/reject/:uuid', async (req, res) => {
  try {
    const { uuid } = req.params;
    await EmailRegistrationService.rejectUuid(uuid);
    res.send(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Registration Rejected</title>
          <style>
            body { font-family: Arial, sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; background-color: #f5f5f5; }
            .container { text-align: center; padding: 40px; background: white; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
            h1 { color: #333; }
            p { color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>Thank You for Your Response</h1>
            <p>The registration request has been rejected successfully.</p>
          </div>
        </body>
      </html>
    `);
  } catch (error) {
    console.error('Error during verification:', error);
    res.status(500).json({ error });
  }
});

router.get('/account-create/:token', (req, res) => {});

export default router;
