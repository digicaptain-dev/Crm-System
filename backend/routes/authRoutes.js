const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const mysql = require('mysql');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const db = require('../db');
const { v4 } = require('uuid');

// Registration route


/**
 * @swagger
 * tags:
 *   name: Authentication
 *   description: User registration and login
 */

/**
 * @swagger
 * /register:
 *   post:
 *     summary: Register a new user
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, email, password]
 *             properties:
 *               name:
 *                 type: string
 *                 example: Asha Sharma
 *               email:
 *                 type: string
 *                 format: email
 *                 example: asha@example.com
 *               password:
 *                 type: string
 *                 format: password
 *                 minLength: 6
 *                 example: password123
 *               role:
 *                 type: string
 *                 enum: [admin, coworker, user]
 *                 default: user
 *     responses:
 *       201:
 *         description: User registered successfully
 *       400:
 *         description: Validation failed or email is already registered
 */
// Registration route





router.post('/register', [
    body('name').notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Please provide a valid email'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
], async (req, res) => {

    console.log("1. Registration request received:", req.body);

    try {
        const errors = validationResult(req);

        if (!errors.isEmpty()) {
            console.log("2. Validation failed");

            return res.status(400).json({
                success: false,
                message: 'Please correct the highlighted fields.',
                errors: errors.array().map((error) => ({
                    field: error.path,
                    message: error.msg
                }))
            });
        }

        const { name, email, password, role } = req.body;

        console.log("2. Validation passed");
        console.log("3. Checking email:", email);

        // Check existing user
        const [existingUser] = await db.query(
            'SELECT email FROM users WHERE email = ?',
            [email]
        );

        console.log("4. Email query completed");
        console.log("5. Existing users:", existingUser.length);

        if (existingUser.length > 0) {
            return res.status(400).json({
                success: false,
                msg: 'User already exists'
            });
        }

        console.log("6. Hashing password...");

        const hash = await bcrypt.hash(password, 10);

        console.log("7. Password hashed");

        const user_id = v4();

        const newUser = {
            user_id,
            name: name.trim(),
            email: email.trim().toLowerCase(),
            password: hash,
            role: role || 'user'
        };

        console.log("8. New user:", {
            user_id: newUser.user_id,
            name: newUser.name,
            email: newUser.email,
            role: newUser.role
        });

        console.log("9. Inserting user into database...");

        const [result] = await db.query(
            'INSERT INTO users SET ?',
            newUser
        );

        console.log("10. User inserted:", result);

        return res.status(201).json({
            success: true,
            msg: 'User registered successfully',
            user: {
                user_id,
                name: newUser.name,
                email: newUser.email,
                role: newUser.role
            }
        });

    } catch (error) {

        console.error("REGISTRATION ERROR:", error);

        return res.status(500).json({
            success: false,
            message: 'Registration failed',
            error: error.message
        });
    }
});

// Login route
router.post('/login', [
    body('email').isEmail(),
    body('password').isLength({ min: 6 })
], async (req, res) => {

    try {
        const errors = validationResult(req);

        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                errors: errors.array()
            });
        }

        const { email, password } = req.body;

        console.log("1. Login request received:", email);

        console.log("2. Starting database query...");

        const [result] = await db.query(
            'SELECT * FROM users WHERE email = ?',
            [email]
        );

        console.log("3. Database query completed");
        console.log("4. Users found:", result.length);

        if (result.length === 0) {
            return res.status(400).json({
                success: false,
                msg: "Invalid credentials"
            });
        }

        const user = result[0];

        console.log("5. User found:", {
            user_id: user.user_id,
            name: user.name,
            email: user.email,
            role: user.role
        });

        console.log("6. Starting bcrypt comparison...");

        const isMatch = await bcrypt.compare(
            password,
            user.password
        );

        console.log("7. Bcrypt completed:", isMatch);

        if (!isMatch) {
            return res.status(400).json({
                success: false,
                msg: "Invalid credentials"
            });
        }

        console.log("8. Creating JWT...");

        const token = jwt.sign(
            {
                user_id: user.user_id,
                email: user.email,
                role: user.role
            },
            process.env.JWT_SECRET,
            {
                expiresIn: "48h"
            }
        );

        console.log("9. JWT created");

        const safeUser = {
            user_id: user.user_id,
            name: user.name,
            email: user.email,
            role: user.role
        };

        console.log("10. Sending login response");

        return res.status(200).json({
            success: true,
            token,
            user: safeUser
        });

    } catch (error) {

        console.error("LOGIN ERROR:", error);

        return res.status(500).json({
            success: false,
            message: "Login failed",
            error: error.message
        });
    }
});

// Route to login using a token
router.post('/login_by_token', (req, res) => {
    const token = req.body.token; // Expecting the token in the request body

    if (!token) {
        return res.status(400).json({ message: 'Token is required' });
    }

    // Verify and decode the token
    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if (err) {
            return res.status(403).json({ message: 'Invalid Token' });
        }

        const { email, password } = decoded; // Extract email and password hash from token

        if (!email || !password) {
            return res.status(400).json({ message: 'Invalid token data' });
        }

        // Check if user exists in the database
        db.query('SELECT * FROM users WHERE email = ?', [email], (err, result) => {
            if (err) throw err;
            if (result.length === 0) {
                return res.status(400).json({ msg: 'Invalid credentials' });
            }

            const user = result[0];

            if (!user.password) {
                return res.status(400).json({ msg: 'No password found for user' });
            }

            // Compare the hashed password from the token with the hashed password from the database
            bcrypt.compare(password, user.password, (err, isMatch) => {
                if (err) {
                    return res.status(500).json({ msg: 'Error comparing passwords', error: err });
                }
                if (!isMatch) {
                    return res.status(400).json({ msg: 'Invalid credentials' });
                }

                // Successful login
                res.json({ message: 'Login successful', user: { name: user.name, email: user.email, role: user.role, user_id: user.user_id } });
            });
        });
    });
});

module.exports = router;
