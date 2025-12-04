import express from 'express';
const router = express.Router();

// Example healthcheck for notes domain
router.get('/health', (req, res) => {
  res.json({ status: 'ok', domain: 'notes' });
});

// Add more notes endpoints here

export default router;
