import express from 'express';
import cors from 'cors';
import http from 'http';
import { setupSocket } from './socket/index.js';
import { initializeRedisClient } from './utils/os/redis/redis.js';
import { db } from './utils/database/database.js';
import authRouter from './modules/auth/endpoints/index.js';
import notesRouter from './modules/notes/endpoints/index.js';
import process from 'node:process';
import dotenv from 'dotenv';

dotenv.config();

function runServer() {
  const app = express();
  app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    credentials: true
  }));
  app.use(express.json());

  app.use('/auth', authRouter);
  app.use('/notes', notesRouter);

  // Global healthcheck
  app.get('/health', async (req, res) => {
    await new Promise(resolve => setTimeout(resolve, 5000));
    res.json({ status: 'ok', service: 'api', pid: process.pid });
  });

  // Create HTTP server and setup WebSocket
  const server = http.createServer(app);
  setupSocket(server);

  // Setup database
  db.connect()
    .then(() => console.log('Database connected'))
    .catch(err => console.error('Database connection error:', err));

  // Initialize Redis client
  initializeRedisClient()
    .then(() => console.log('Redis client initialized'))
    .catch(err => console.error('Redis initialization error:', err));

  const PORT = process.env.PORT || 3001;
  server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}


// import { sendEmail } from './utils/email/emailServices.js';

// // Example usage
// async function exampleUsage() {
//     try {
//         await sendEmail(
//             'hdthinh001@gmail.com',
//             'Welcome to Our Service!',
//             '<p>Hello there,</p><p>Thank you for joining our platform!</p>'
//         );
//     } catch (error) {
//         console.error('Failed to send welcome email:', error);
//     }
// }

// exampleUsage();

export default runServer;