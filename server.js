const express = require('express');
const cors = require('cors');
require('dotenv').config();

// Import routes
const authRoutes    = require('./src/routes/auth');
const stressRoutes  = require('./src/routes/stress');

const app = express();

// ── Middleware ──────────────────────────────────────────
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── Routes ──────────────────────────────────────────────
app.use('/api/auth',   authRoutes);
app.use('/api/stress', stressRoutes);

// ── Health check ────────────────────────────────────────
app.get('/', (req, res) => {
    res.json({
        status  : 'running',
        message : 'Stress Backend API is live',
        version : 'v1.0.0'
    });
});

// ── 404 Handler ─────────────────────────────────────────
app.use((req, res) => {
    res.status(404).json({ error: 'Route not found' });
});

// ── Start Server ─────────────────────────────────────────
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});