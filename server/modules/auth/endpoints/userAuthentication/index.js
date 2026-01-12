import express from 'express';
const router = express.Router();
import { v4 as uuidv4 } from 'uuid';
import jsonwebtoken from 'jsonwebtoken';
import dotenv from 'dotenv';
import { UserService } from '../../services/userService.js';
import { BcryptService } from '../../services/bcrypt.js';

dotenv.config();

router.get('/healthcheck', (req, res) => {
  res.json({ status: 'ok', service: 'userLogin' });
});

router.post('/login/userpass', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    const user = await UserService.getUserByUsername(username);
    if (!user || !(await BcryptService.comparePassword(password, user.password))) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    const tokenPayload = { userId: user.id, username: user.username, roles: user.roles };
    const token = jsonwebtoken.sign(tokenPayload, process.env.JWT_SECRET, { expiresIn: '1h' });

    res.status(200).json({ message: 'Login successful', token });
  } catch (error) {
    console.error('Error during login:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;