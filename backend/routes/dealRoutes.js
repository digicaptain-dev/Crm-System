const express = require("express");
const router = express.Router();
const db = require("../db");
const uuid = require("uuid");

const authenticateToken = require("../middleware/authMiddleware");
const authorizeRole = require("../middleware/authorizeRole");
const { notifyUser } = require("../utils/notificationService");

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
        const { search = "", status = "", priority = "", pipeline_id = "", assign_to = "" } = req.query;

        const page = Math.max(1, parseInt(req.query.page) || 1);
        const limit = Math.max(1, Math.min(100, parseInt(req.query.limit) || 15));
        const offset = (page - 1) * limit;

        let whereClauses = [];
        let params = [];

        if (role !== "admin" && role !== "coworker") {
            whereClauses.push("deals.assign_to = ?");
            params.push(user_id);
            whereClauses.push("(deals.deal_stage NOT IN (SELECT stage_id FROM stages WHERE LOWER(stage_name) LIKE '%pool%'))");
        } else if (assign_to && assign_to !== "all") {
            whereClauses.push("deals.assign_to = ?");
            params.push(assign_to);
        }

        if (search.trim()) {
            whereClauses.push(`(
                deals.deal_name LIKE ? OR
                deals.deal_organization LIKE ? OR
                deals.customer_email LIKE ? OR
                deals.customer_number LIKE ? OR
                deals.contact_person LIKE ?
            )`);
            const searchWildcard = `%${search.trim()}%`;
            params.push(searchWildcard, searchWildcard, searchWildcard, searchWildcard, searchWildcard);
        }

        if (status && status !== "all") {
            if (status.toLowerCase() === "open") {
                whereClauses.push("deals.deal_status = 'Open'");
            } else if (status.toLowerCase() === "won" || status.toLowerCase() === "closed won") {
                whereClauses.push("deals.deal_status IN ('Closed Won', 'Won')");
            } else if (status.toLowerCase() === "lost" || status.toLowerCase() === "closed lost") {
                whereClauses.push("deals.deal_status IN ('Closed Lost', 'Lost')");
            } else {
                whereClauses.push("deals.deal_status = ?");
                params.push(status);
            }
        }

        if (priority && priority !== "all") {
            whereClauses.push("deals.deal_priority = ?");
            params.push(priority);
        }

        if (pipeline_id && pipeline_id !== "all") {
            whereClauses.push("deals.pipeline_id = ?");
            params.push(pipeline_id);
        }

        const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(" AND ")}` : "";

        // 1. Total records count
        const countSql = `SELECT COUNT(*) AS total FROM deals ${whereSql}`;
        const [countResult] = await db.query(countSql, params);
        const totalDeals = countResult[0]?.total || 0;
        const totalPages = Math.ceil(totalDeals / limit) || 1;

        // 2. Global KPIs summary
        const [metricsResult] = await db.query(`
            SELECT 
                COUNT(*) AS totalAll,
                SUM(CASE WHEN LOWER(deal_status) = 'open' THEN 1 ELSE 0 END) AS openDeals,
                SUM(CASE WHEN LOWER(deal_status) IN ('closed won', 'won') THEN 1 ELSE 0 END) AS wonDeals,
                SUM(CASE WHEN LOWER(deal_status) IN ('closed lost', 'lost') THEN 1 ELSE 0 END) AS lostDeals
            FROM deals
        `);

        const globalMetrics = {
            totalDeals: Number(metricsResult[0]?.totalAll || 0),
            openDeals: Number(metricsResult[0]?.openDeals || 0),
            wonDeals: Number(metricsResult[0]?.wonDeals || 0),
            lostDeals: Number(metricsResult[0]?.lostDeals || 0)
        };

        // 3. Paginated Data fetch
        const selectSql = `
            SELECT 
                deals.*,
                assigned_user.name AS assigned_user_name,
                owner_user.name AS owner_name
            FROM deals
            LEFT JOIN users AS assigned_user ON deals.assign_to = assigned_user.user_id
            LEFT JOIN users AS owner_user ON deals.deal_owner = owner_user.user_id
            ${whereSql}
            ORDER BY deals.creation_date DESC
            LIMIT ? OFFSET ?
        `;

        const queryParams = [...params, limit, offset];
        const [results] = await db.query(selectSql, queryParams);

        return res.status(200).json({
            success: true,
            deals: results,
            metrics: globalMetrics,
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
            message: "Failed to fetch deals",
            error: error.message
        });
    }
});

/* =====================================================
   GET SINGLE DEAL
   ===================================================== */

router.get('/deal/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.user_id;
        const userRole = req.user.role;

        let sql = `
            SELECT
                deals.*,

                /* Owner */
                owner_user.name AS owner_name,
                owner_user.email AS owner_email,

                /* Assigned user */
                assigned_user.name AS assigned_user_name,
                assigned_user.email AS assigned_user_email,

                /* Pipeline */
                p.pipeline_name,
                p.description AS pipeline_description,

                /* Stage */
                s.stage_name,
                s.stage_order,
                s.description AS stage_description

            FROM deals

            LEFT JOIN users AS owner_user
                ON deals.deal_owner = owner_user.user_id

            LEFT JOIN users AS assigned_user
                ON deals.assign_to = assigned_user.user_id

            LEFT JOIN pipelines AS p
                ON deals.pipeline_id = p.pipeline_id

            LEFT JOIN stages AS s
                ON deals.pipeline_id = s.pipeline_id
                AND deals.deal_stage = s.stage_id

            WHERE deals.deal_id = ?
        `;

        const params = [id];

        /*
         * Admin can view any deal.
         * Non-admin can only view assigned deals.
         */
        if (userRole !== "admin") {
            sql += ` AND deals.assign_to = ?`;
            params.push(userId);
        }

        sql += ` LIMIT 1`;

        const [results] = await db.query(sql, params);

        if (results.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Deal not found or you do not have access to this deal"
            });
        }

        return res.status(200).json({
            success: true,
            deal: results[0]
        });

    } catch (error) {
        console.error("GET DEAL DETAILS ERROR:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to fetch deal details"
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

        const createdDeal = rows[0] || newDeal;

        // Trigger notification if assigned
        if (newDeal.assign_to) {
            notifyUser({
                userId: newDeal.assign_to,
                title: "New Lead Assigned",
                message: `You have been assigned to lead "${newDeal.deal_organization || newDeal.deal_name || 'New Lead'}".`,
                type: "deal_assigned",
                entityType: "deal",
                entityId: newDeal.deal_id,
                io: req.app.get("io")
            }).catch(e => console.warn("Notify error:", e.message));
        }

        return res.status(201).json({
            success: true,
            message: "Deal created successfully",
            deal: createdDeal
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
            "customer_address",
            "website"
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

        const updatedRecord = rows[0];
        const oldAssignee = dealResults[0]?.assign_to;
        const newAssignee = updatedDeal.assign_to;
        const dealTitle = updatedRecord?.deal_organization || updatedRecord?.deal_name || "Lead";

        // Check if assignment changed
        if (newAssignee !== undefined && String(newAssignee || "") !== String(oldAssignee || "")) {
            if (newAssignee) {
                notifyUser({
                    userId: newAssignee,
                    title: "Lead Assigned",
                    message: `Lead "${dealTitle}" has been assigned to you.`,
                    type: "deal_assigned",
                    entityType: "deal",
                    entityId: id,
                    io: req.app.get("io")
                }).catch(e => console.warn("Notify error:", e.message));
            }

            if (oldAssignee) {
                notifyUser({
                    userId: oldAssignee,
                    title: "Lead Unassigned",
                    message: `Lead "${dealTitle}" was unassigned from you.`,
                    type: "deal_unassigned",
                    entityType: "deal",
                    entityId: id,
                    io: req.app.get("io")
                }).catch(e => console.warn("Notify error:", e.message));
            }
        }

        return res.status(200).json({
            success: true,
            message: "Deal updated successfully",
            deal: updatedRecord
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

            if (role === "admin" || role === "coworker") {
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
                    AND (assign_to = ? OR deal_owner = ? OR assign_to IS NULL)
                    LIMIT 1
                `;
                params = [
                    dealId,
                    user_id,
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
             * Check target stage details
             */
            const [stageRows] = await db.query(
                `SELECT stage_id, stage_name FROM stages WHERE stage_id = ? OR stage_name = ? LIMIT 1`,
                [deal_stage, deal_stage]
            );
            const targetStageId = stageRows[0]?.stage_id || deal_stage;
            const targetStageName = stageRows[0]?.stage_name || deal_stage;
            const isPoolDrive = targetStageName.toLowerCase().includes("pool");

            const [userRows] = await db.query(
                `SELECT name FROM users WHERE user_id = ? LIMIT 1`,
                [user_id]
            );
            const moverName = userRows[0]?.name || req.user.name || "User";

            if (isPoolDrive) {
                // Moving to Pool Drive: unassign deal, record moved_by
                await db.query(
                    `
                    UPDATE deals
                    SET
                        deal_stage = ?,
                        assign_to = NULL,
                        moved_by_name = ?,
                        moved_by_user_id = ?,
                        moved_at = CURRENT_TIMESTAMP,
                        last_updated = CURRENT_TIMESTAMP
                    WHERE deal_id = ?
                    `,
                    [
                        targetStageId,
                        moverName,
                        user_id,
                        dealId
                    ]
                );

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
                        `User ${moverName} moved this deal to Pool Drive`
                    ]
                );

                // Notify admin & manager users
                try {
                    const [admins] = await db.query(
                        `SELECT user_id FROM users WHERE role IN ('admin', 'coworker') AND user_id != ?`,
                        [user_id]
                    );
                    for (const adm of admins) {
                        await notifyUser({
                            userId: adm.user_id,
                            title: "Lead Moved to Pool Drive",
                            message: `${moverName} moved "${currentDeal.deal_name}" to Pool Drive`,
                            type: "deal_moved_pool",
                            dealId: dealId
                        });
                    }
                } catch (notifyErr) {
                    console.error("Failed to send pool notifications:", notifyErr);
                }
            } else {
                // Moving to normal stage
                await db.query(
                    `
                    UPDATE deals
                    SET
                        deal_stage = ?,
                        last_updated = CURRENT_TIMESTAMP
                    WHERE deal_id = ?
                    `,
                    [
                        targetStageId,
                        dealId
                    ]
                );

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
                        `Deal stage changed from "${currentDeal.deal_stage}" to "${targetStageName}"`
                    ]
                );
            }

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
   DELETE DEAL (Single & Bulk)
   ===================================================== */

router.delete(
    "/deal/:id?",
    authenticateToken,
    async (req, res) => {
        const { user_id, role } = req.user;
        const dealIdParam = req.params.id;
        const { deal_id, deal_ids } = req.body || {};

        let targetIds = [];
        if (dealIdParam) {
            targetIds = [dealIdParam];
        } else if (Array.isArray(deal_ids) && deal_ids.length > 0) {
            targetIds = deal_ids;
        } else if (deal_id) {
            targetIds = [deal_id];
        }

        if (targetIds.length === 0) {
            return res.status(400).json({
                success: false,
                message: "No deal ID(s) provided"
            });
        }

        try {
            // Delete associated records first to prevent FK constraint failures
            try {
                await db.query(`DELETE FROM activities WHERE deal_id IN (?)`, [targetIds]);
            } catch (e) { /* ignore if table/col doesn't exist */ }
            try {
                await db.query(`DELETE FROM schedules WHERE deal_id IN (?)`, [targetIds]);
            } catch (e) { /* ignore if table/col doesn't exist */ }
            try {
                await db.query(`DELETE FROM comments WHERE deal_id IN (?)`, [targetIds]);
            } catch (e) { /* ignore if table/col doesn't exist */ }

            let sql;
            let params;

            if (role === "admin") {
                sql = `DELETE FROM deals WHERE deal_id IN (?)`;
                params = [targetIds];
            } else {
                sql = `DELETE FROM deals WHERE deal_id IN (?) AND assign_to = ?`;
                params = [targetIds, user_id];
            }

            const [result] = await db.query(sql, params);

            if (result.affectedRows === 0) {
                return res.status(404).json({
                    success: false,
                    message: "No matching deals found or access denied"
                });
            }

            return res.status(200).json({
                success: true,
                message: `${result.affectedRows} deal(s) deleted successfully`,
                deletedCount: result.affectedRows
            });
        } catch (error) {
            console.error("Delete deal error:", error);
            return res.status(500).json({
                success: false,
                message: "Failed to delete deal",
                error: error.message
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

            // Notify assigned user
            notifyUser({
                userId: user_id,
                title: "New Leads Assigned",
                message: `${deal_ids.length} new lead(s) have been assigned to you by Admin.`,
                type: "deal_assigned",
                entityType: "deal",
                entityId: deal_ids[0] || null,
                io: req.app.get("io")
            }).catch(e => console.warn("Notify error:", e.message));

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