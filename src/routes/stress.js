const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/authMiddleware');
const {
    saveLog,
    getLogs,
    getStats,
    updateSettings,
    getSettings
} = require('../controllers/stressController');

// All routes below are protected by JWT ──────────────────

// POST   /api/stress/log       → save EEG reading
router.post('/log',         verifyToken, saveLog);

// GET    /api/stress/logs      → get all logs (optional ?from=&to=)
router.get('/logs',         verifyToken, getLogs);

// GET    /api/stress/stats     → get history screen stats
router.get('/stats',        verifyToken, getStats);

// GET    /api/stress/settings  → get user settings
router.get('/settings',     verifyToken, getSettings);

// PUT    /api/stress/settings  → update user settings
router.put('/settings',     verifyToken, updateSettings);

module.exports = router;