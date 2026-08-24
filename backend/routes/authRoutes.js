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
    body('password').isLength({ min: 6 })
 ], (req, res) => {
    var user_id = v4();    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
             success: false,
             message: 'Please correct the highlighted fields.',
             errors: errors.array().map((error)=>({
                field:error.path,
                message:error.msg
             }))
            });
    }

    const { name, email, password, role } = req.body;

   

    // Check if the user already exists
    db.query('SELECT email FROM users WHERE email = ?', [email], (err, result) => {
        

        if (err) throw err;
        if (result.length > 0) {
            return res.status(400).json({ success: false, msg: 'User already exists' });
        }

        // Hash the password before saving it
        bcrypt.hash(password, 10, (err, hash) => {
            if (err) throw err;

            const newUser = {
                user_id: user_id,
                name,
                email,
                password: hash,
                role: role || 'user'
            };

            // Insert the new user into the database
            db.query('INSERT INTO users SET ?', newUser, (err, result) => {
                if (err) throw err;
                res.status(201).json({ success: true, msg: 'User registered successfully' });
            });
        });
    });
});

// Login route
router.post('/login', [
    body('email').isEmail(),
    body('password').isLength({ min: 6 })
], (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    db.query('SELECT * FROM users WHERE email = ?', [email], (err, result) => {
        if (err) throw err;
        if (result.length === 0) {
            return res.status(400).json({ msg: 'Invalid credentials' });
        }

        const user = result[0];
         // Log the user object for debugging

        // Compare password
        bcrypt.compare(password, user.password, (err, isMatch) => {
            if (err) throw err;
            if (!isMatch) {
                return res.status(400).json({ msg: 'Invalid credentials' });
            }

            // Create JWT token with email and hashed password from the database
            const token = jwt.sign({ email: user.email, password: password }, process.env.JWT_SECRET, {
                expiresIn: '48h'
            });

            res.status(200).json({ token });
        });
    });
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
