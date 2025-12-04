// Authentication Middleware (verify JWT)
import jwt from 'jsonwebtoken';

function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token == null) return res.sendStatus(401);

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) return res.sendStatus(403);
        req.user = user; // Attach user info to request
        next();
    });
}

// Authorization Middleware (check role)
function authorizeRole(requiredRole) {
    return (req, res, next) => {
        if (req.user.role !== requiredRole) {
            return res.sendStatus(403); // Forbidden
        }
        next();
    };
}

export { authenticateToken, authorizeRole };