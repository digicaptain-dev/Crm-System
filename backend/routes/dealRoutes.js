const express = require('express');
const router = express.Router();
const db = require('../db');
const uuid = require('uuid');
const checkAdminRole = require('../middleware/isAdmin');
const authenticateToken = require("../middleware/authMiddleware");
const authorizeRole = require("../middleware/authorizeRole");

/**
 * @swagger
 * tags:
 *   name: Deals
 *   description: Deal management
 */

// Get all deals
/**
 * @swagger
 * /deals:
 *   get:
 *     summary: Get deals visible to the authenticated user
 *     tags: [Deals]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: List of deals
 *       401:
 *         description: Missing, invalid, or expired token
 *       500:
 *         description: Server error
 */
router.get('/deals', authenticateToken, async (req, res) => {

    try {

        const { user_id, role } = req.user;

        console.log("Fetching deals for:", {
            user_id,
            role
        });

        let sql;
        let params = [];

        // ==========================================
        // ADMIN → ALL DEALS
        // ==========================================
        if (role === "admin") {

            sql = `
                SELECT *
                FROM deals
                ORDER BY creation_date DESC
            `;

        }

        // ==========================================
        // USER / COWORKER → ASSIGNED DEALS ONLY
        // ==========================================
        else {

            sql = `
                SELECT *
                FROM deals
                WHERE assign_to = ?
                ORDER BY creation_date DESC
            `;

            params = [user_id];
        }

        const [results] = await db.query(sql, params);

        console.log("Deals returned:", results.length);

        return res.status(200).json(results);

    } catch (err) {

        console.error("Fetch deals error:", err);

        return res.status(500).json({
            success: false,
            message: "Failed to fetch deals",
            error: err.message
        });
    }
});

// Get deal by ID
/**
 * @swagger
 * /deal/{id}:
 *   get:
 *     summary: Get a deal by ID
 *     tags: [Deals]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *         description: Deal ID
 *     responses:
 *       200:
 *         description: Deal details
 *       500:
 *         description: Server error
 */
router.get('/deal/:id', (req, res) => {
    const { id } = req.params;
    const sql = 'SELECT * FROM deals WHERE deal_id = ?';
    db.query(sql, [id], (err, results) => {
        if (err) throw err;
        res.json(results[0]);
    });
});

// Add new deal
/**
 * @swagger
 * /deal:
 *   post:
 *     summary: Create a deal
 *     tags: [Deals]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               deal_name: { type: string, example: Website redesign }
 *               deal_value: { type: number, example: 25000 }
 *               pipeline_id: { type: string }
 *               deal_stage: { type: string }
 *               customer_email: { type: string, format: email }
 *     responses:
 *       201:
 *         description: Deal created
 *       400:
 *         description: Invalid request body
 *       401:
 *         description: Missing, invalid, or expired token
 */
// router.post("/deal", authenticateToken, async (req, res) => {

//     const newDeal = {
//         deal_id: uuid.v4(),
//         ...req.body,
//     };

//     const sql = "INSERT INTO deals SET ?";

//     try {

//         // Insert the new deal
//         await db.query(sql, newDeal);

//         // Fetch the complete newly created deal
//         const [rows] = await db.query(
//             "SELECT * FROM deals WHERE deal_id = ?",
//             [newDeal.deal_id]
//         );

//         return res.status(201).json({
//             success: true,
//             deal: rows[0],
//         });

//     } catch (err) {

//         console.error("Create deal error:", err);

//         return res.status(400).json({
//             error: "INVALID BODY INPUT",
//             message: err.sqlMessage || err.message,
//         });
//     }
// });

       router.post(
    "/deal",
    authenticateToken,
    async (req, res) => {

        try {

            const {
                user_id,
                role
            } = req.user;

            const newDeal = {
                deal_id: uuid.v4(),
                ...req.body
            };

            // ==========================================
            // NORMAL USER
            // Automatically assign deal to themselves
            // ==========================================

            if (role !== "admin") {
                newDeal.assign_to = user_id;
            }

            const sql = "INSERT INTO deals SET ?";

            await db.query(sql, newDeal);

            const [rows] = await db.query(
                "SELECT * FROM deals WHERE deal_id = ?",
                [newDeal.deal_id]
            );

            return res.status(201).json({
                success: true,
                deal: rows[0]
            });

        } catch (err) {

            console.error(
                "Create deal error:",
                err
            );

            return res.status(400).json({
                success: false,
                error: "INVALID BODY INPUT",
                message: err.sqlMessage || err.message
            });
        }
    }
);


// Update deal by ID
/**
 * @swagger
 * /deal/{id}/{uid}:
 *   put:
 *     summary: Update a deal and record the update activity
 *     tags: [Deals]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *         description: Deal ID
 *       - in: path
 *         name: uid
 *         required: true
 *         schema: { type: string }
 *         description: User ID performing the update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               deal_name: { type: string }
 *               deal_value: { type: number }
 *               deal_stage: { type: string }
 *               assign_to: { type: string }
 *     responses:
 *       200:
 *         description: Deal updated
 *       404:
 *         description: Deal not found
 */
router.put('/deal/:id', authenticateToken, async (req, res) => {

    const { id } = req.params;
    const updatedDeal = req.body;

    // Logged-in user from JWT
    const userId = req.user.user_id;

    console.log("Deal update request");
    console.log("Deal ID:", id);
    console.log("User ID:", userId);
    console.log("Updated data:", updatedDeal);

    try {

        // ---------------------------------------------
        // Update deal
        // ---------------------------------------------
        const [result] = await db.query(
            'UPDATE deals SET ? WHERE deal_id = ?',
            [updatedDeal, id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: 'Deal not found'
            });
        }

        // ---------------------------------------------
        // Create activity
        // ---------------------------------------------
        await db.query(
            `INSERT INTO activities
            (deal_id, user_id, activity_type, details)
            VALUES (?, ?, ?, ?)`,
            [
                id,
                userId,
                "stage change",
                `Deal updated by user ${userId}. Updated fields: ${JSON.stringify(updatedDeal)}`
            ]
        );

        console.log(
            "Activity created for user:",
            userId
        );

        return res.json({
            success: true,
            message: 'Deal updated successfully',
            updatedDeal
        });

    } catch (error) {

        console.error(
            "Deal update error:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Failed to update deal",
            error: error.message
        });
    }
});


// =====================================================
// UPDATE DEAL STAGE
// =====================================================

router.put(
    "/deals/:dealId/stage",
    authenticateToken,
    async (req, res) => {

        const { dealId } = req.params;
        const { deal_stage } = req.body;

        try {

            // -----------------------------------------
            // Validation
            // -----------------------------------------

            if (!dealId) {
                return res.status(400).json({
                    success: false,
                    message: "Deal ID is required"
                });
            }

            if (!deal_stage) {
                return res.status(400).json({
                    success: false,
                    message: "deal_stage is required"
                });
            }

            // -----------------------------------------
            // Check deal exists
            // -----------------------------------------

            const [dealResults] = await db.query(
                `
                SELECT
                    deal_id,
                    deal_stage,
                    pipeline_id
                FROM deals
                WHERE deal_id = ?
                `,
                [dealId]
            );

            if (dealResults.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: "Deal not found"
                });
            }

            const currentDeal = dealResults[0];

            // -----------------------------------------
            // No change
            // -----------------------------------------

            if (
                String(currentDeal.deal_stage) ===
                String(deal_stage)
            ) {
                return res.status(200).json({
                    success: true,
                    message: "Deal is already in this stage",
                    deal: currentDeal
                });
            }

            // -----------------------------------------
            // Update deal stage
            // -----------------------------------------

            await db.query(
                `
                UPDATE deals
                SET
                    deal_stage = ?,
                    last_updated = CURRENT_TIMESTAMP
                WHERE deal_id = ?
                `,
                [
                    deal_stage,
                    dealId
                ]
            );

            // -----------------------------------------
            // Get updated deal
            // -----------------------------------------

            const [updatedResults] = await db.query(
                `
                SELECT *
                FROM deals
                WHERE deal_id = ?
                `,
                [dealId]
            );

            return res.status(200).json({
                success: true,
                message: "Deal stage updated successfully",
                deal: updatedResults[0]
            });

        } catch (error) {

            console.error(
                "UPDATE DEAL STAGE ERROR:",
                error
            );

            return res.status(500).json({
                success: false,
                message: "Failed to update deal stage",
                error: error.message
            });
        }
    }
);



// Delete deal by ID
/**
 * @swagger
 * /deal:
 *   delete:
 *     summary: Delete a deal
 *     tags: [Deals]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [deal_id]
 *             properties:
 *               deal_id: { type: string, description: Deal ID }
 *     responses:
 *       200:
 *         description: Delete result
 */
router.delete('/deal', (req, res) => {
    const deal_id = req.body.deal_id;
    console.log(deal_id)
    const sql = 'DELETE FROM deals WHERE deal_id = ?';
    db.query(sql, deal_id, (err, results) => {
        if (err) throw err;
        res.json(results);
    });
});

/**
 * @swagger
 * /deals/pipeline/{pipelineId}/{assigned_id}:
 *   get:
 *     summary: Get deals in a pipeline for a user, or all pipeline deals for an admin
 *     tags: [Deals]
 *     parameters:
 *       - in: path
 *         name: pipelineId
 *         required: true
 *         schema: { type: string }
 *         description: Pipeline ID
 *       - in: path
 *         name: assigned_id
 *         required: true
 *         schema: { type: string }
 *         description: User ID used to determine role and assigned deals
 *     responses:
 *       200:
 *         description: List of matching deals
 *       404:
 *         description: User not found
 *       500:
 *         description: Server or database error
 */
router.get(
    '/deals/pipeline/:pipelineId',
    authenticateToken,
    async (req, res) => {

        const { pipelineId } = req.params;
        const { user_id, role } = req.user;

        try {

            let query;
            let params;

            // ==========================================
            // ADMIN → ALL DEALS IN PIPELINE
            // ==========================================

            if (role === "admin") {

                query = `
                    SELECT *
                    FROM deals
                    WHERE pipeline_id = ?
                    ORDER BY creation_date DESC
                `;

                params = [pipelineId];

            }

            // ==========================================
            // USER/COWORKER → ASSIGNED DEALS ONLY
            // ==========================================

            else {

                query = `
                    SELECT *
                    FROM deals
                    WHERE pipeline_id = ?
                    AND assign_to = ?
                    ORDER BY creation_date DESC
                `;

                params = [
                    pipelineId,
                    user_id
                ];
            }

            const [results] = await db.query(
                query,
                params
            );

            return res.status(200).json(results);

        } catch (error) {

            console.error(
                "Pipeline deals error:",
                error
            );

            return res.status(500).json({
                success: false,
                message: "Failed to fetch pipeline deals"
            });
        }
    }
);
/**
 * @swagger
 * /deals/assign:
 *   put:
 *     summary: Assign multiple deals to a user
 *     tags: [Deals]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [deal_ids, user_id]
 *             properties:
 *               deal_ids:
 *                 type: array
 *                 items: { type: string }
 *                 example: ["deal-id-1", "deal-id-2"]
 *               user_id:
 *                 type: string
 *                 example: user-id
 *     responses:
 *       200:
 *         description: Deals assigned successfully
 *       400:
 *         description: Invalid request body
 *       500:
 *         description: Server error
 */
router.put(
    '/deals/assign',
    authenticateToken,
    authorizeRole("admin"),
    async (req, res) => {

        const { deal_ids, user_id } = req.body;

        if (
            !deal_ids ||
            !user_id ||
            !Array.isArray(deal_ids)
        ) {
            return res.status(400).json({
                success: false,
                error: 'Invalid data format'
            });
        }

        try {

            const query = `
                UPDATE deals
                SET assign_to = ?
                WHERE deal_id IN (?)
            `;

            await db.query(query, [
                user_id,
                deal_ids
            ]);

            console.log("Deals assigned:", {
                admin: req.user.user_id,
                assigned_to: user_id,
                deals: deal_ids
            });

            return res.status(200).json({
                success: true,
                message: 'Deals successfully assigned to user.'
            });

        } catch (error) {

            console.error(
                'Error updating deals:',
                error
            );

            return res.status(500).json({
                success: false,
                error: 'An error occurred while assigning deals.'
            });
        }
    }
    
);

module.exports = router;
