const db = require('../config/db');

// ── Save Stress Log ─────────────────────────────────────
const saveLog = async (req, res) => {
    try {
        const { stress_value } = req.body;
        const user_id = req.user.id;

        if (stress_value === undefined) {
            return res.status(400).json({ error: 'stress_value is required.' });
        }

        // Determine stress level
        let stress_level;
        if      (stress_value < 0.4) stress_level = 'low';
        else if (stress_value < 0.7) stress_level = 'moderate';
        else                         stress_level = 'high';

        const [result] = await db.query(
            'INSERT INTO stress_logs (user_id, stress_value, stress_level) VALUES (?, ?, ?)',
            [user_id, stress_value, stress_level]
        );

        res.status(201).json({
            message      : 'Stress log saved.',
            id           : result.insertId,
            stress_value,
            stress_level
        });

    } catch (err) {
        console.error('saveLog error:', err.message);
        res.status(500).json({ error: 'Internal server error.' });
    }
};

// ── Get Stress Logs ─────────────────────────────────────
const getLogs = async (req, res) => {
    try {
        const user_id = req.user.id;

        // Optional: filter by date range
        const { from, to } = req.query;

        let query = 'SELECT * FROM stress_logs WHERE user_id = ?';
        const params = [user_id];

        if (from && to) {
            query += ' AND recorded_at BETWEEN ? AND ?';
            params.push(from, to);
        }

        query += ' ORDER BY recorded_at DESC LIMIT 100';

        const [logs] = await db.query(query, params);

        res.status(200).json({ logs });

    } catch (err) {
        console.error('getLogs error:', err.message);
        res.status(500).json({ error: 'Internal server error.' });
    }
};

// ── Get Stress Stats ────────────────────────────────────
const getStats = async (req, res) => {
    try {
        const user_id = req.user.id;

        // Average stress value
        const [[avgResult]] = await db.query(
            'SELECT AVG(stress_value) as avg_stress FROM stress_logs WHERE user_id = ?',
            [user_id]
        );

        // Total sessions
        const [[countResult]] = await db.query(
            'SELECT COUNT(*) as total_sessions FROM stress_logs WHERE user_id = ?',
            [user_id]
        );

        // Best day (day with lowest avg stress)
        const [[bestDayResult]] = await db.query(
            `SELECT DAYNAME(recorded_at) as best_day
             FROM stress_logs
             WHERE user_id = ?
             GROUP BY DAYNAME(recorded_at)
             ORDER BY AVG(stress_value) ASC
             LIMIT 1`,
            [user_id]
        );

        // Monthly trend (weekly averages)
        const [weeklyTrend] = await db.query(
            `SELECT 
                WEEK(recorded_at) as week_number,
                ROUND(AVG(stress_value), 2) as avg_stress
             FROM stress_logs
             WHERE user_id = ?
             AND recorded_at >= DATE_SUB(NOW(), INTERVAL 1 MONTH)
             GROUP BY WEEK(recorded_at)
             ORDER BY week_number ASC`,
            [user_id]
        );

        res.status(200).json({
            avg_stress     : avgResult.avg_stress
                ? Math.round(avgResult.avg_stress * 100) + '%'
                : '0%',
            total_sessions : countResult.total_sessions,
            best_day       : bestDayResult ? bestDayResult.best_day : 'N/A',
            weekly_trend   : weeklyTrend
        });

    } catch (err) {
        console.error('getStats error:', err.message);
        res.status(500).json({ error: 'Internal server error.' });
    }
};

// ── Save / Update Settings ──────────────────────────────
const updateSettings = async (req, res) => {
    try {
        const user_id = req.user.id;
        const {
            alert_threshold,
            high_stress_alerts,
            daily_summary,
            session_reminders,
            weekly_report,
            background_music,
            haptic_feedback,
            night_mode
        } = req.body;

        await db.query(
            `UPDATE user_settings SET
                alert_threshold     = ?,
                high_stress_alerts  = ?,
                daily_summary       = ?,
                session_reminders   = ?,
                weekly_report       = ?,
                background_music    = ?,
                haptic_feedback     = ?,
                night_mode          = ?
             WHERE user_id = ?`,
            [
                alert_threshold,
                high_stress_alerts,
                daily_summary,
                session_reminders,
                weekly_report,
                background_music,
                haptic_feedback,
                night_mode,
                user_id
            ]
        );

        res.status(200).json({ message: 'Settings updated successfully.' });

    } catch (err) {
        console.error('updateSettings error:', err.message);
        res.status(500).json({ error: 'Internal server error.' });
    }
};

// ── Get Settings ────────────────────────────────────────
const getSettings = async (req, res) => {
    try {
        const user_id = req.user.id;

        const [[settings]] = await db.query(
            'SELECT * FROM user_settings WHERE user_id = ?',
            [user_id]
        );

        res.status(200).json({ settings });

    } catch (err) {
        console.error('getSettings error:', err.message);
        res.status(500).json({ error: 'Internal server error.' });
    }
};

module.exports = { saveLog, getLogs, getStats, updateSettings, getSettings };