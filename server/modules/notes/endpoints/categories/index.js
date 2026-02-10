import express from 'express';
const router = express.Router();
import { CategoryService } from '../../services/categoryService.js';
import dotenv from 'dotenv';
import { authorizeRole, authenticateToken } from '../../../auth/middleware/jwt.js';

dotenv.config();

router.get('/all', authenticateToken, authorizeRole('user'), async (req, res) => {
    try {
        const categories = await CategoryService.getAllCategories();
        res.json(categories);
    } catch (error) {
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

export default router;