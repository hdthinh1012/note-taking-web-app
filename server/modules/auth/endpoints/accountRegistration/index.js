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

router.get('/gen-csrf-token/:ssoUuid', async (req, res) => {
    try {
        const { ssoUuid } = req.params;
        const registerToken = await AccountRegistrationService.getRegisterToken(ssoUuid);
        console.log('registerToken', registerToken);
        if (!registerToken) {
            return res.status(404).json({ error: 'Register token not found' });
        }
        const csrfToken = jsonwebtoken.sign(
            { registerToken: registerToken.uuid },
            process.env.CSRF_TOKEN_SECRET,
            { expiresIn: '15m' }
        );
        res.status(200).json({ csrfToken });
    } catch (error) {
        console.error('Error generating CSRF token:', error);
        res.status(500).json({ error });
    }
});

export default router;