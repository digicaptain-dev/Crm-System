const express = require("express");
const router = express.Router();
const db = require("../db");
const uuid = require("uuid");

const authenticateToken = require("../middleware/authMiddleware");
const authorizeRole = require("../middleware/authorizeRole");

/**
 * @swagger
 * tags:
 *   name: Deals
 *   description: Deal management
 */


/* =====================================================
   GET ALL DEALS
   ===================================================== */

router.get("/deals", authenticateToken, async (req, res) => {
    try {
        const { user_id, role } = req.user;

        // Query params se page aur limit read karein (default: page=1, limit=10)
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;

        let baseQuery = "";
        let countQuery = "";
        let params = [];

        if (role === "admin") {
            baseQuery = `
                FROM deals
                LEFT JOIN users AS assigned_user ON deals.assign_to = assigned_user.user_id
                LEFT JOIN users AS owner_user ON deals.deal_owner = owner_user.user_id
            `;
            countQuery = `SELECT COUNT(*) AS total FROM deals`;
        } else {
            baseQuery = `
                FROM deals
                LEFT JOIN users AS assigned_user ON deals.assign_to = assigned_user.user_id
                LEFT JOIN users AS owner_user ON deals.deal_owner = owner_user.user_id
                WHERE deals.assign_to = ?
            `;
            countQuery = `SELECT COUNT(*) AS total FROM deals WHERE assign_to = ?`;
            params = [user_id];
        }

        // 1. Total records count
        const [countResult] = await db.query(countQuery, params);
        const totalDeals = countResult[0].total;
        const totalPages = Math.ceil(totalDeals / limit);

        // 2. Paginated Data fetch (LIMIT aur OFFSET add karke)
        const selectSql = `
            SELECT 
                deals.*,
                assigned_user.name AS assigned_user_name,
                owner_user.name AS owner_name
            ${baseQuery}
            ORDER BY deals.creation_date DESC
            LIMIT ? OFFSET ?
        `;

        const queryParams = [...params, limit, offset];
        const [results] = await db.query(selectSql, queryParams);

        return res.status(200).json({
            success: true,
            deals: results,
            pagination: {
                totalDeals,
                totalPages,
                currentPage: page,
                limit
            }
        });

    } catch (error) {
        console.error("Fetch deals error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to fetch deals"
        });
    }
});

/* =====================================================
   GET SINGLE DEAL
   ===================================================== */

router.get("/deal/:id", authenticateToken, async (req, res) => {

    const { id } = req.params;
    const { user_id, role } = req.user;

    try {

        let sql;
        let params;

        /*
         * ADMIN
         * Admin can view any deal
         */
        if (role === "admin") {

            sql = `
                SELECT
                    deals.*,

                    assigned_user.name AS assigned_user_name,
                    assigned_user.email AS assigned_user_email,

                    owner_user.name AS owner_name,
                    owner_user.email AS owner_email

                FROM deals

                LEFT JOIN users AS assigned_user
                    ON deals.assign_to = assigned_user.user_id

                LEFT JOIN users AS owner_user
                    ON deals.deal_owner = owner_user.user_id

                WHERE deals.deal_id = ?

                LIMIT 1
            `;

            params = [id];

        } else {

            /*
             * COWORKER / USER
             * Can view only their assigned deals
             */
            sql = `
                SELECT
                    deals.*,

                    assigned_user.name AS assigned_user_name,
                    assigned_user.email AS assigned_user_email,

                    owner_user.name AS owner_name,
                    owner_user.email AS owner_email

                FROM deals

                LEFT JOIN users AS assigned_user
                    ON deals.assign_to = assigned_user.user_id

                LEFT JOIN users AS owner_user
                    ON deals.deal_owner = owner_user.user_id

                WHERE deals.deal_id = ?
                AND deals.assign_to = ?

                LIMIT 1
            `;

            params = [
                id,
                user_id
            ];
        }

        const [results] = await db.query(sql, params);

        if (results.length === 0) {

            return res.status(404).json({
                success: false,
                message: "Deal not found or access denied"
            });
        }

        return res.status(200).json({
            success: true,
            deal: results[0]
        });

    } catch (error) {

        console.error("Fetch single deal error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to fetch deal"
        });
    }
});

/* =====================================================
   CREATE DEAL
   ===================================================== */

router.post("/deal", authenticateToken, async (req, res) => {

    try {

        const {
            user_id,
            role
        } = req.user;

        const {
            deal_name,
            pipeline_id
        } = req.body;

        /*
         * Required fields
         */
        if (!deal_name || !deal_name.trim()) {

            return res.status(400).json({
                success: false,
                message: "Deal name is required"
            });
        }

        if (!pipeline_id) {

            return res.status(400).json({
                success: false,
                message: "Pipeline is required"
            });
        }

        /*
         * Create deal
         */
        const newDeal = {
            deal_id: uuid.v4(),
            ...req.body
        };

        /*
         * Non-admin users automatically
         * become responsible for their own deal.
         *
         * This prevents an employee from
         * manually assigning a deal to someone else.
         */
        if (role !== "admin") {
            newDeal.assign_to = user_id;
        }

        /*
         * Admin can assign a deal.
         * If admin doesn't provide assign_to,
         * it remains NULL.
         */

        const sql = "INSERT INTO deals SET ?";

        await db.query(sql, newDeal);

        /*
         * Fetch newly created deal
         */
        const [rows] = await db.query(
            `
            SELECT *
            FROM deals
            WHERE deal_id = ?
            LIMIT 1
            `,
            [newDeal.deal_id]
        );

        return res.status(201).json({
            success: true,
            message: "Deal created successfully",
            deal: rows[0]
        });

    } catch (error) {

        console.error("Create deal error:", error);

        return res.status(400).json({
            success: false,
            message:
                error.sqlMessage ||
                error.message ||
                "Failed to create deal"
        });
    }
});


/* =====================================================
   UPDATE DEAL
   ===================================================== */

router.put("/deal/:id", authenticateToken, async (req, res) => {

    const { id } = req.params;
    const {
        user_id,
        role
    } = req.user;

    try {

        /*
         * Check whether deal exists
         * and whether current user can access it.
         */
        let checkSql;
        let checkParams;

        if (role === "admin") {

            checkSql = `
                SELECT *
                FROM deals
                WHERE deal_id = ?
                LIMIT 1
            `;

            checkParams = [id];

        } else {

            checkSql = `
                SELECT *
                FROM deals
                WHERE deal_id = ?
                AND assign_to = ?
                LIMIT 1
            `;

            checkParams = [
                id,
                user_id
            ];
        }

        const [dealResults] = await db.query(
            checkSql,
            checkParams
        );

        if (dealResults.length === 0) {

            return res.status(404).json({
                success: false,
                message: "Deal not found or access denied"
            });
        }

        /*
         * Only allow legitimate deal fields.
         *
         * Prevent users from changing:
         * - deal_id
         * - creation_date
         * - last_updated
         */
        const allowedFields = [
            "deal_name",
            "deal_value",
            "deal_stage",
            "deal_owner",
            "customer_email",
            "close_date",
            "deal_source",
            "deal_priority",
            "deal_status",
            "associated_contacts",
            "deal_notes",
            "products_services",
            "pipeline_id",
            "probability",
            "tags",
            "currency",
            "team_members",
            "deal_organization",
            "contact_person",
            "time_zone",
            "customer_number",
            "customer_address"
        ];

        /*
         * assign_to can only be changed by admin
         */
        if (role === "admin") {
            allowedFields.push("assign_to");
        }

        const updatedDeal = {};

        for (const field of allowedFields) {

            if (
                Object.prototype.hasOwnProperty.call(
                    req.body,
                    field
                )
            ) {
                updatedDeal[field] = req.body[field];
            }
        }

        /*
         * Nothing to update
         */
        if (Object.keys(updatedDeal).length === 0) {

            return res.status(400).json({
                success: false,
                message: "No valid fields provided for update"
            });
        }

        /*
         * Update deal
         */
        await db.query(
            "UPDATE deals SET ? WHERE deal_id = ?",
            [
                updatedDeal,
                id
            ]
        );

        /*
         * Fetch updated deal
         */
        const [rows] = await db.query(
            `
            SELECT *
            FROM deals
            WHERE deal_id = ?
            LIMIT 1
            `,
            [id]
        );

        return res.status(200).json({
            success: true,
            message: "Deal updated successfully",
            deal: rows[0]
        });

    } catch (error) {

        console.error("Deal update error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to update deal"
        });
    }
});


/* =====================================================
   UPDATE DEAL STAGE
   ===================================================== */

router.put(
    "/deals/:dealId/stage",
    authenticateToken,
    async (req, res) => {

        const { dealId } = req.params;
        const { deal_stage } = req.body;

        const {
            user_id,
            role
        } = req.user;

        try {

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

            /*
             * Get deal
             */
            let sql;
            let params;

            if (role === "admin") {

                sql = `
                    SELECT *
                    FROM deals
                    WHERE deal_id = ?
                    LIMIT 1
                `;

                params = [dealId];

            } else {

                sql = `
                    SELECT *
                    FROM deals
                    WHERE deal_id = ?
                    AND assign_to = ?
                    LIMIT 1
                `;

                params = [
                    dealId,
                    user_id
                ];
            }

            const [dealResults] = await db.query(
                sql,
                params
            );

            if (dealResults.length === 0) {

                return res.status(404).json({
                    success: false,
                    message: "Deal not found or access denied"
                });
            }

            const currentDeal = dealResults[0];

            /*
             * No stage change
             */
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

            /*
             * Update stage
             */
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

            /*
             * Create activity
             *
             * Your activities table supports:
             * "stage change"
             */
            await db.query(
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
                    dealId,
                    user_id,
                    "stage change",
                    `Deal stage changed from "${currentDeal.deal_stage}" to "${deal_stage}"`
                ]
            );

            /*
             * Fetch updated deal
             */
            const [updatedResults] = await db.query(
                `
                SELECT *
                FROM deals
                WHERE deal_id = ?
                LIMIT 1
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
                message: "Failed to update deal stage"
            });
        }
    }
);


/* =====================================================
   DELETE DEAL
   ===================================================== */

router.delete(
    "/deal",
    authenticateToken,
    async (req, res) => {

        const {
            user_id,
            role
        } = req.user;

        const { deal_id } = req.body;

        try {

            if (!deal_id) {

                return res.status(400).json({
                    success: false,
                    message: "deal_id is required"
                });
            }

            /*
             * Check access
             */
            let sql;
            let params;

            if (role === "admin") {

                sql = `
                    DELETE FROM deals
                    WHERE deal_id = ?
                `;

                params = [deal_id];

            } else {

                sql = `
                    DELETE FROM deals
                    WHERE deal_id = ?
                    AND assign_to = ?
                `;

                params = [
                    deal_id,
                    user_id
                ];
            }

            const [result] = await db.query(
                sql,
                params
            );

            if (result.affectedRows === 0) {

                return res.status(404).json({
                    success: false,
                    message: "Deal not found or access denied"
                });
            }

            return res.status(200).json({
                success: true,
                message: "Deal deleted successfully"
            });

        } catch (error) {

            console.error(
                "Delete deal error:",
                error
            );

            return res.status(500).json({
                success: false,
                message: "Failed to delete deal"
            });
        }
    }
);


/* =====================================================
   GET DEALS BY PIPELINE
   ===================================================== */

router.get(
    "/deals/pipeline/:pipelineId",
    authenticateToken,
    async (req, res) => {

        const { pipelineId } = req.params;

        const {
            user_id,
            role
        } = req.user;

        try {

            let query;
            let params;

            /*
             * ADMIN → all pipeline deals
             */
            if (role === "admin") {

                query = `
                    SELECT *
                    FROM deals
                    WHERE pipeline_id = ?
                    ORDER BY creation_date DESC
                `;

                params = [
                    pipelineId
                ];

            } else {

                /*
                 * USER / COWORKER →
                 * only their assigned pipeline deals
                 */
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

            return res.status(200).json({
                success: true,
                deals: results
            });

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


/* =====================================================
   BULK ASSIGN DEALS
   ===================================================== */

router.put(
    "/deals/assign",
    authenticateToken,
    authorizeRole("admin"),
    async (req, res) => {

        const {
            deal_ids,
            user_id
        } = req.body;

        try {

            /*
             * Validation
             */
            if (
                !Array.isArray(deal_ids) ||
                deal_ids.length === 0
            ) {

                return res.status(400).json({
                    success: false,
                    message: "deal_ids must be a non-empty array"
                });
            }

            if (!user_id) {

                return res.status(400).json({
                    success: false,
                    message: "user_id is required"
                });
            }

            /*
             * Check assigned user exists
             */
            const [users] = await db.query(
                `
                SELECT user_id, name, email, role
                FROM users
                WHERE user_id = ?
                LIMIT 1
                `,
                [user_id]
            );

            if (users.length === 0) {

                return res.status(404).json({
                    success: false,
                    message: "Assigned user not found"
                });
            }

            /*
             * Create placeholders
             */
            const placeholders = deal_ids
                .map(() => "?")
                .join(",");

            const query = `
                UPDATE deals
                SET assign_to = ?
                WHERE deal_id IN (${placeholders})
            `;

            const params = [
                user_id,
                ...deal_ids
            ];

            const [result] = await db.query(
                query,
                params
            );

            console.log(
                "Deals assigned:",
                {
                    admin: req.user.user_id,
                    assigned_to: user_id,
                    deals: deal_ids,
                    affectedRows: result.affectedRows
                }
            );

            return res.status(200).json({
                success: true,
                message: "Deals successfully assigned to user.",
                assigned_to: user_id,
                affectedRows: result.affectedRows
            });

        } catch (error) {

            console.error(
                "Error assigning deals:",
                error
            );

            return res.status(500).json({
                success: false,
                message: "An error occurred while assigning deals."
            });
        }
    }
);


module.exports = router;