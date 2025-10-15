const express = require('express');
const cors = require('cors');
const http = require('http');
const { setupSocket } = require('./socket');


function runServer() {
  const app = express();
  app.use(cors({
    origin: 'http://localhost:3000',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    credentials: true
  }));
  app.use(express.json());


  const authRouter = require('./modules/auth/endpoints');
  const notesRouter = require('./modules/notes/endpoints');
  app.use('/auth', authRouter);
  app.use('/notes', notesRouter);

  // Global healthcheck
  app.get('/health', async (req, res) => {
    const process = require('node:process');
    await new Promise(resolve => setTimeout(resolve, 5000));
    res.json({ status: 'ok', service: 'api', pid: process.pid });
  });

  // Create HTTP server and setup WebSocket
  const server = http.createServer(app);
  setupSocket(server);

  // Setup database
  const { db } = require('./utils/database/database');
  db.connect()
    .then(() => console.log('Database connected'))
    .catch(err => console.error('Database connection error:', err));

  const PORT = process.env.PORT || 3001;
  server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}


// const { sendEmail } = require('./utils/email/emailServices');

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

module.exports = runServer;