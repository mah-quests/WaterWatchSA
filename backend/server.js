require('dotenv').config();

const express = require('express');
const cors    = require('cors');

const authRoutes    = require('./routes/auth');
const outageRoutes  = require('./routes/outages');
const qualityRoutes = require('./routes/water-quality');

const app  = express();
const PORT = process.env.PORT || 3000;

/* ── CORS ─────────────────────────────────────────────────────────────────── */
const allowedOrigins = (process.env.ALLOWED_ORIGINS || '')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean);

app.use(cors({
  origin: (origin, cb) => {
    /* Allow requests with no origin (curl, Postman, same-origin) */
    if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
    cb(new Error(`CORS: origin ${origin} not allowed`));
  },
  credentials: true,
}));

/* ── Body parsing ─────────────────────────────────────────────────────────── */
app.use(express.json({ limit: '2mb' }));

/* ── Routes ───────────────────────────────────────────────────────────────── */
app.use('/api/auth',          authRoutes);
app.use('/api/outages',       outageRoutes);
app.use('/api/water-quality', qualityRoutes);

/* ── Health check ─────────────────────────────────────────────────────────── */
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

/* ── 404 ──────────────────────────────────────────────────────────────────── */
app.use((req, res) => {
  res.status(404).json({ message: `Route ${req.method} ${req.path} not found.` });
});

/* ── Error handler ────────────────────────────────────────────────────────── */
app.use((err, req, res, _next) => {
  console.error(err.message);
  res.status(500).json({ message: err.message || 'Internal server error.' });
});

/* ── Start ────────────────────────────────────────────────────────────────── */
app.listen(PORT, () => {
  console.log(`\n🌊 WaterWatch SA API running on http://localhost:${PORT}`);
  console.log(`   Health: http://localhost:${PORT}/api/health\n`);
});
