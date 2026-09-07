const express = require("express");
const db = require("../db");
const router = express.Router();

const authenticateToken = require("../middleware/authMiddleware");

// =====================================================
// GET ALL ACTIVITIES
// =====================================================

router.get("/activities", authenticateToken, async (req, res) => {
    try {

        const [results] = await db.query(`
            SELECT 
                a.id,
                a.deal_id,
                a.user_id,
                a.activity_type,
                a.details,
                a.created_at,
                u.name AS user_name,
                d.deal_name
            FROM activities a
            LEFT JOIN users u 
                ON a.user_id = u.user_id
            LEFT JOIN deals d 
                ON a.deal_id = d.deal_id
            ORDER BY a.created_at DESC
        `);

        return res.status(200).json({
            success: true,
            activities: results
        });

    } catch (error) {

        console.error("GET ACTIVITIES ERROR:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to fetch activities",
            error: error.message
        });
    }
});


// =====================================================
// GET ACTIVITIES FOR ONE DEAL
// =====================================================

router.get(
    "/deals/:dealId/activities",
    authenticateToken,
    async (req, res) => {

        const { dealId } = req.params;

        try {

            const [results] = await db.query(`
                SELECT 
                    a.id,
                    a.deal_id,
                    a.user_id,
                    a.activity_type,
                    a.details,
                    a.created_at,
                    u.name AS user_name
                FROM activities a
                LEFT JOIN users u 
                    ON a.user_id = u.user_id
                WHERE a.deal_id = ?
                ORDER BY a.created_at DESC
            `, [dealId]);

            return res.status(200).json({
                success: true,
                activities: results
            });

        } catch (error) {

            console.error(
                "GET DEAL ACTIVITIES ERROR:",
                error
            );

            return res.status(500).json({
                success: false,
                message: "Failed to fetch deal activities",
                error: error.message
            });
        }
    }
);


// =====================================================
// CREATE ACTIVITY
// =====================================================

router.post(
    "/activities",
    authenticateToken,
    async (req, res) => {

        const {
            deal_id,
            activity_type,
            details
        } = req.body;

        // User comes from JWT
        const user_id = req.user.user_id;

        // -----------------------------
        // Validation
        // -----------------------------

        if (!deal_id) {
            return res.status(400).json({
                success: false,
                message: "deal_id is required"
            });
        }

        if (!activity_type) {
            return res.status(400).json({
                success: false,
                message: "activity_type is required"
            });
        }

        const allowedTypes = [
            "comment",
            "stage change",
            "task"
        ];

        if (!allowedTypes.includes(activity_type)) {
            return res.status(400).json({
                success: false,
                message: "Invalid activity type"
            });
        }

        try {

            // -----------------------------
            // Check deal exists
            // -----------------------------

            const [deal] = await db.query(
                "SELECT deal_id FROM deals WHERE deal_id = ?",
                [deal_id]
            );

            if (deal.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: "Deal not found"
                });
            }

            // -----------------------------
            // Insert activity
            // -----------------------------

            const [result] = await db.query(
                `
                INSERT INTO activities
                (
                    deal_id,
                    user_id,
                    activity_type,
                    details
                )
                VALUES (?, ?, ?, ?)
                `,
                [
                    deal_id,
                    user_id,
                    activity_type,
                    details || null
                ]
            );

            console.log(
                `Activity created | Deal: ${deal_id} | User: ${user_id} | Type: ${activity_type}`
            );

            // -----------------------------
            // Return created activity
            // -----------------------------

            const [activity] = await db.query(
                `
                SELECT 
                    a.*,
                    u.name AS user_name
                FROM activities a
                LEFT JOIN users u
                    ON a.user_id = u.user_id
                WHERE a.id = ?
                `,
                [result.insertId]
            );

            return res.status(201).json({
                success: true,
                message: "Activity recorded successfully",
                activity: activity[0]
            });

        } catch (error) {

            console.error(
                "CREATE ACTIVITY ERROR:",
                error
            );

            return res.status(500).json({
                success: false,
                message: "Failed to create activity",
                error: error.message
            });
        }
    }
);


module.exports = router;