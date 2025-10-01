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


const authRouter = require('./auth/endpoints');
const notesRouter = require('./notes/endpoints');
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
