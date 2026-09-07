const express = require('express');
const db = require('../db');
const authenticateToken = require("../middleware/authMiddleware");
const allowRoles = require("../middleware/roleMiddleware");
const bcrypt = require("bcrypt");
const { v4: uuidv4 } = require("uuid");

const router = express.Router();

// =====================================================
// CREATE USER
// =====================================================
// ONLY Company Owner (admin) can create users.
//
// Manager and Employee cannot create users.
// =====================================================

router.post(
    "/users",
    authenticateToken,
    allowRoles("admin"),
    async (req, res) => {

        try {

            const {
                name,
                email,
                password,
                role
            } = req.body;


            // ---------------------------------------------
            // Validation
            // ---------------------------------------------

            if (!name || !email || !password || !role) {

                return res.status(400).json({
                    success: false,
                    message: "Name, email, password and role are required"
                });
            }


            // ---------------------------------------------
            // Validate role
            // ---------------------------------------------

            const allowedRoles = [
                "coworker",
                "user"
            ];

            if (!allowedRoles.includes(role)) {

                return res.status(400).json({
                    success: false,
                    message: "Invalid role. Only coworker or user can be created."
                });
            }


            // ---------------------------------------------
            // Clean data
            // ---------------------------------------------

            const cleanName = name.trim();
            const cleanEmail = email.trim().toLowerCase();


            if (!cleanName) {

                return res.status(400).json({
                    success: false,
                    message: "Name cannot be empty"
                });
            }


            if (password.length < 6) {

                return res.status(400).json({
                    success: false,
                    message: "Password must be at least 6 characters"
                });
            }


            // ---------------------------------------------
            // Check duplicate email
            // ---------------------------------------------

            const [existingUser] = await db.query(
                `SELECT user_id
                 FROM users
                 WHERE email = ?`,
                [cleanEmail]
            );


            if (existingUser.length > 0) {

                return res.status(409).json({
                    success: false,
                    message: "A user with this email already exists"
                });
            }


            // ---------------------------------------------
            // Hash password
            // ---------------------------------------------

            const hashedPassword = await bcrypt.hash(
                password,
                10
            );


            // ---------------------------------------------
            // Generate user ID
            // ---------------------------------------------

            const user_id = uuidv4();


            // ---------------------------------------------
            // Insert user
            // ---------------------------------------------

            await db.query(
                `INSERT INTO users
                (
                    user_id,
                    name,
                    email,
                    password,
                    role
                )
                VALUES (?, ?, ?, ?, ?)`,
                [
                    user_id,
                    cleanName,
                    cleanEmail,
                    hashedPassword,
                    role
                ]
            );


            // ---------------------------------------------
            // Response
            // ---------------------------------------------

            return res.status(201).json({
                success: true,
                message: "User created successfully",
                user: {
                    user_id,
                    name: cleanName,
                    email: cleanEmail,
                    role
                }
            });

        } catch (error) {

            console.error("CREATE USER ERROR:", error);

            return res.status(500).json({
                success: false,
                message: "Error creating user",
                error: error.message
            });
        }
    }
);






// =====================================================
// GET ALL USERS
// =====================================================
// Admin + Manager can view users
//
// admin    = Company Owner
// coworker = Manager
// user     = Employee
// =====================================================

router.get(
    "/users",
    authenticateToken,
    allowRoles("admin", "coworker"),
    async (req, res) => {

        try {

            const [users] = await db.query(
                `SELECT 
                    user_id,
                    name,
                    email,
                    role,
                    created_at
                 FROM users
                 ORDER BY created_at DESC`
            );

            return res.status(200).json({
                success: true,
                users
            });

        } catch (error) {

            console.error("GET USERS ERROR:", error);

            return res.status(500).json({
                success: false,
                message: "Error fetching users",
                error: error.message
            });
        }
    }
);


// =====================================================
// GET SINGLE USER
// =====================================================
// Admin + Manager can view a single user
// =====================================================

router.get(
    "/users/:id",
    authenticateToken,
    allowRoles("admin", "coworker"),
    async (req, res) => {

        try {

            const { id } = req.params;

            const [users] = await db.query(
                `SELECT 
                    user_id,
                    name,
                    email,
                    role,
                    created_at
                 FROM users
                 WHERE user_id = ?`,
                [id]
            );

            if (users.length === 0) {

                return res.status(404).json({
                    success: false,
                    message: "User not found"
                });
            }

            return res.status(200).json({
                success: true,
                user: users[0]
            });

        } catch (error) {

            console.error("GET SINGLE USER ERROR:", error);

            return res.status(500).json({
                success: false,
                message: "Error fetching user",
                error: error.message
            });
        }
    }
);


// =====================================================
// UPDATE USER
// =====================================================
// Admin can update anyone.
// Manager can update normal employees only.
//
// Manager CANNOT:
// - change another Manager
// - change Company Owner
// - promote Employee to Manager
// =====================================================

router.put(
    "/users/:id",
    authenticateToken,
    allowRoles("admin", "coworker"),
    async (req, res) => {
console.log("UPDATE USER REQUEST BODY:", req.body);
console.log("UPDATE USER REQUEST PARAMS:", req.params);
        try {

            const { id } = req.params;

            const {
                name,
                email,
                role,
                password
            } = req.body;


            // ---------------------------------------------
            // Check user exists
            // ---------------------------------------------

            const [existingUsers] = await db.query(
                `SELECT *
                 FROM users
                 WHERE user_id = ?`,
                [id]
            );


            if (existingUsers.length === 0) {

                return res.status(404).json({
                    success: false,
                    message: "User not found"
                });
            }


            const existingUser = existingUsers[0];


            // ---------------------------------------------
            // Manager restrictions
            // ---------------------------------------------

            if (req.user.role === "coworker") {

                // Manager cannot edit admin
                if (existingUser.role === "admin") {

                    return res.status(403).json({
                        success: false,
                        message: "Manager cannot modify Company Owner"
                    });
                }


                // Manager cannot edit another manager
                if (existingUser.role === "coworker") {

                    return res.status(403).json({
                        success: false,
                        message: "Manager cannot modify another Manager"
                    });
                }


                // Manager cannot promote employee
                if (role && role !== "user") {

                    return res.status(403).json({
                        success: false,
                        message: "Manager can only manage normal employees"
                    });
                }
            }


            // ---------------------------------------------
            // Validate name
            // ---------------------------------------------

            if (!name || !name.trim()) {

                return res.status(400).json({
                    success: false,
                    message: "Name is required"
                });
            }


            // ---------------------------------------------
            // Validate email
            // ---------------------------------------------

            if (!email || !email.trim()) {

                return res.status(400).json({
                    success: false,
                    message: "Email is required"
                });
            }


            const cleanName = name.trim();
            const cleanEmail = email.trim().toLowerCase();


            // ---------------------------------------------
            // Check duplicate email
            // ---------------------------------------------

            const [duplicateEmail] = await db.query(
                `SELECT user_id
                 FROM users
                 WHERE email = ?
                 AND user_id != ?`,
                [
                    cleanEmail,
                    id
                ]
            );


            if (duplicateEmail.length > 0) {

                return res.status(409).json({
                    success: false,
                    message: "This email is already being used"
                });
            }


            // ---------------------------------------------
            // Validate role
            // ---------------------------------------------

            if (
                role &&
                !["admin", "coworker", "user"].includes(role)
            ) {

                return res.status(400).json({
                    success: false,
                    message: "Invalid role"
                });
            }


            // ---------------------------------------------
            // Update with password
            // ---------------------------------------------

            if (password && password.trim()) {

                if (password.length < 6) {

                    return res.status(400).json({
                        success: false,
                        message: "Password must be at least 6 characters"
                    });
                }


                const hashedPassword = await bcrypt.hash(
                    password,
                    10
                );


                await db.query(
                    `UPDATE users
                     SET
                        name = ?,
                        email = ?,
                        role = ?,
                        password = ?
                     WHERE user_id = ?`,
                    [
                        cleanName,
                        cleanEmail,
                        role || existingUser.role,
                        hashedPassword,
                        id
                    ]
                );

            } else {

                // -----------------------------------------
                // Update without password
                // -----------------------------------------

                await db.query(
                    `UPDATE users
                     SET
                        name = ?,
                        email = ?,
                        role = ?
                     WHERE user_id = ?`,
                    [
                        cleanName,
                        cleanEmail,
                        role || existingUser.role,
                        id
                    ]
                );
            }


            return res.status(200).json({
                success: true,
                message: "User updated successfully"
            });

        } catch (error) {

            console.error("UPDATE USER ERROR:", error);

            return res.status(500).json({
                success: false,
                message: "Error updating user",
                error: error.message
            });
        }
    }
);



// =====================================================
// DELETE USER
// =====================================================
// Admin can delete users.
// Manager can delete normal employees.
// Manager cannot delete another manager or admin.
// =====================================================

router.delete(
    "/users/:id",
    authenticateToken,
    allowRoles("admin", "coworker"),
    async (req, res) => {

        try {

            const { id } = req.params;


            // ---------------------------------------------
            // Check user
            // ---------------------------------------------

            const [users] = await db.query(
                `SELECT user_id, name, email, role
                 FROM users
                 WHERE user_id = ?`,
                [id]
            );


            if (users.length === 0) {

                return res.status(404).json({
                    success: false,
                    message: "User not found"
                });
            }


            const targetUser = users[0];


            // ---------------------------------------------
            // Never allow admin deletion
            // ---------------------------------------------

            if (targetUser.role === "admin") {

                return res.status(403).json({
                    success: false,
                    message: "Company Owner cannot be deleted"
                });
            }


            // ---------------------------------------------
            // Manager restrictions
            // ---------------------------------------------

            if (
                req.user.role === "coworker" &&
                targetUser.role === "coworker"
            ) {

                return res.status(403).json({
                    success: false,
                    message: "Manager cannot delete another Manager"
                });
            }


            // ---------------------------------------------
            // Delete
            // ---------------------------------------------

            await db.query(
                `DELETE FROM users
                 WHERE user_id = ?`,
                [id]
            );


            return res.status(200).json({
                success: true,
                message: "User deleted successfully"
            });

        } catch (error) {

            console.error("DELETE USER ERROR:", error);

            return res.status(500).json({
                success: false,
                message: "Error deleting user",
                error: error.message
            });
        }
    }
);


// Get all deals for the user or admin
router.get('/deals', (req, res) => {
    const { userId, role } = req.query; // Fetch userId and role from query (admin/user)
    let sql;

    if (role === 'admin') {
        sql = 'SELECT * FROM deals'; // Admin can see all deals
    } else {
        sql = 'SELECT * FROM deals WHERE assigned_to = ?'; // User can see only their assigned deals
    }

    db.query(sql, [userId], (err, results) => {
        if (err) {
            return res.status(500).json({ message: 'Error fetching deals', error: err });
        }
        res.status(200).json(results);
    });
});

// Admin assigns a deal to a user/coworker
router.post('/deals/assign', (req, res) => {
    const { dealId, assignedTo } = req.body;
    const sql = 'UPDATE deals SET assigned_to = ? WHERE deal_id = ?';

    db.query(sql, [assignedTo, dealId], (err, result) => {
        if (err) {
            return res.status(500).json({ message: 'Error assigning deal', error: err });
        }
        res.status(200).json({ message: 'Deal assigned successfully' });
    });
});

// User moves a deal to the next stage (e.g., lost, won, etc.)
router.put('/deals/move', (req, res) => {
    const { dealId, stage } = req.body;
    const sql = 'UPDATE deals SET deal_stage = ? WHERE deal_id = ?';

    db.query(sql, [stage, dealId], (err, result) => {
        if (err) {
            return res.status(500).json({ message: 'Error updating deal stage', error: err });
        }

        // Log activity for the stage change
        const activitySql = 'INSERT INTO activities (deal_id, activity_type, details) VALUES (?, ?, ?)';
        db.query(activitySql, [dealId, 'Stage Change', `Moved to ${stage}`], (activityErr) => {
            if (activityErr) {
                return res.status(500).json({ message: 'Error logging activity', error: activityErr });
            }
            res.status(200).json({ message: 'Deal stage updated successfully' });
        });
    });
});

// User/coworker adds a comment or logs a task (e.g., meeting, call, etc.)
router.post('/deals/comment', (req, res) => {
    const { dealId, comment, activityType, userId } = req.body;
    const sql = 'INSERT INTO activities (deal_id, activity_type, details, user_id) VALUES (?, ?, ?, ?)';

    db.query(sql, [dealId, activityType, comment, userId], (err, result) => {
        if (err) {
            return res.status(500).json({ message: 'Error adding comment', error: err });
        }
        res.status(201).json({ message: 'Comment added successfully' });
    });
});

// Get deal activity log (comments, stage changes, etc.)
router.get('/deals/:id/activity', (req, res) => {
    const { id } = req.params;
    const sql = 'SELECT * FROM activities WHERE deal_id = ? ORDER BY created_at DESC';

    db.query(sql, [id], (err, results) => {
        if (err) {
            return res.status(500).json({ message: 'Error fetching activity log', error: err });
        }
        res.status(200).json(results);
    });
});

module.exports = router;