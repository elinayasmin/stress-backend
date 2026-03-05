const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');
require('dotenv').config();

// ── Register ────────────────────────────────────────────
const register = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        // Validate fields
        if (!name || !email || !password) {
            return res.status(400).json({ error: 'All fields are required.' });
        }

        // Check if email already exists
        const [existing] = await db.query(
            'SELECT id FROM users WHERE email = ?', [email]
        );
        if (existing.length > 0) {
            return res.status(409).json({ error: 'Email already registered.' });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Insert user
        const [result] = await db.query(
            'INSERT INTO users (name, email, password) VALUES (?, ?, ?)',
            [name, email, hashedPassword]
        );

        // Create default settings for new user
        await db.query(
            'INSERT INTO user_settings (user_id) VALUES (?)',
            [result.insertId]
        );

        // Generate JWT
        const token = jwt.sign(
            { id: result.insertId, email, name },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN }
        );

        res.status(201).json({
            message : 'User registered successfully.',
            token,
            user    : { id: result.insertId, name, email }
        });

    } catch (err) {
        console.error('Register error:', err.message);
        res.status(500).json({ error: 'Internal server error.' });
    }
};

// ── Login ───────────────────────────────────────────────
const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Validate fields
        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required.' });
        }

        // Find user
        const [users] = await db.query(
            'SELECT * FROM users WHERE email = ?', [email]
        );
        if (users.length === 0) {
            return res.status(404).json({ error: 'User not found.' });
        }

        const user = users[0];

        // Compare password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ error: 'Invalid password.' });
        }

        // Generate JWT
        const token = jwt.sign(
            { id: user.id, email: user.email, name: user.name },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN }
        );

        res.status(200).json({
            message : 'Login successful.',
            token,
            user    : { id: user.id, name: user.name, email: user.email }
        });

    } catch (err) {
        console.error('Login error:', err.message);
        res.status(500).json({ error: 'Internal server error.' });
    }
};

module.exports = { register, login };