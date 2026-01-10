import express from 'express';
const router = express.Router();
import { ssoRepository } from '../../repository/ssoRepository.js';
import { v4 as uuidv4 } from 'uuid';
import jsonwebtoken from 'jsonwebtoken';
import { sendEmail } from '../../../../utils/email/emailServices.js';
import { EmailRegistrationService } from '../../services/emailRegistration.js';
import { AccountRegistrationService } from '../../services/accountRegistration.js';
import { BcryptService } from '../../services/bcrypt.js';
import { UserService } from '../../services/userService.js';
import dotenv from 'dotenv';

dotenv.config();

router.get('/gen-csrf-token/:ssoUuid', async (req, res) => {
    try {
        const { ssoUuid } = req.params;
        const registerToken = await AccountRegistrationService.getRegisterTokenBySsoUuid(ssoUuid);
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

router.post('/auth/account-registration/signup', async (req, res) => {
    try {
        const { username, password, csrfToken } = req.body;

        if (!username || !password || !csrfToken) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        // Verify CSRF token
        let decoded;
        try {
            decoded = jsonwebtoken.verify(csrfToken, process.env.CSRF_TOKEN_SECRET);
            const registerToken = await AccountRegistrationService.getRegisterTokenBySsoUuid(decoded.registerToken);
            if (!registerToken) {
                return res.status(403).json({ error: 'Invalid or expired CSRF token' });
            }
            if (registerToken.status !== 'CREATED') {
                return res.status(403).json({ error: 'CSRF token has already been used' });
            }
            // Mark the register token as used
            await AccountRegistrationService.markRegisterTokenAsUsed(registerToken.uuid);
            // Proceed with account creation logic here
            const hashedPassword = await BcryptService.hashPassword(password);
            // Create user in the database (pseudo-code, replace with actual implementation)
            const email = (await ssoRepository.getSsoEntryByUuid(registerToken.sso_uuid)).sso_account;
            await UserService.createUser({username, email, hashedPassword});
            
            return res.status(201).json({ message: 'Account created successfully' });

        } catch (err) {
            console.error('[ERROR][/auth/account-registration/signup] verifying CSRF token:', err);
            return res.status(500).json({ error: 'Internal server error' });
        }
    }
    catch (err) {

    }
});

export default router;