const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// ── Middleware ────────────────────────────────────────────
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve frontend — frontend folder is inside backend folder
const frontendPath = path.join(__dirname, 'frontend');
app.use(express.static(frontendPath));

// ── API Routes ────────────────────────────────────────────
app.use('/api/auth', require('./routes/auth'));
app.use('/api/items', require('./routes/items'));
app.use('/api/categories', require('./routes/categories'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', project: 'ReFind', college: "King's College Nepal" });
});

// ── Frontend fallback ─────────────────────────────────────
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend', 'index.html'));
});

// ── Error handler ─────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err.message);
  res.status(500).json({ error: err.message || 'Internal server error.' });
});

// ── Start server ──────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`ReFind server running on http://localhost:${PORT}`);
  console.log(`Frontend path: ${frontendPath}`);
  console.log(`API available at http://localhost:${PORT}/api`);
});
