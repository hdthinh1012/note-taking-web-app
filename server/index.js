const express = require('express');
const cors = require('cors');
const http = require('http');
const { setupSocket } = require('./socket');


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
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'api' });
});

const server = http.createServer(app);
setupSocket(server);

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});


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