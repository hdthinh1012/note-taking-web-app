// Authentication Middleware (verify JWT)
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import { verifyJwtToken } from '../services/jwt.js';
dotenv.config();

function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    console.log('Auth Header:', authHeader);
    const token = authHeader && authHeader.split(' ')[1];
    console.log('Token:', token);
    if (token == null) return res.sendStatus(401);

    const user = verifyJwtToken(token);
    if (!user) return res.sendStatus(403);
    req.user = user; // Attach user info to request
    next();
}

// Authorization Middleware (check role)
function authorizeRole(requiredRole) {
    return (req, res, next) => {
        if (!req.user.roles || !req.user.roles.includes(requiredRole)) {
            return res.sendStatus(403); // Forbidden
        }
        next();
    };
}

export { authenticateToken, authorizeRole };