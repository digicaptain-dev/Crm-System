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

        // 2. User-specific KPIs summary
        let metricsWhere = "";
        let metricsParams = [];
        if (role !== "admin" && role !== "coworker") {
            metricsWhere = `WHERE deals.assign_to = ? AND (deals.deal_stage NOT IN (SELECT stage_id FROM stages WHERE LOWER(stage_name) LIKE '%pool%'))`;
            metricsParams = [user_id];
        } else if (assign_to && assign_to !== "all") {
            metricsWhere = `WHERE deals.assign_to = ?`;
            metricsParams = [assign_to];
        }

        const [metricsResult] = await db.query(`
            SELECT 
                COUNT(*) AS totalAll,
                SUM(CASE WHEN LOWER(deal_status) = 'open' THEN 1 ELSE 0 END) AS openDeals,
                SUM(CASE WHEN LOWER(deal_status) IN ('closed won', 'won') THEN 1 ELSE 0 END) AS wonDeals,
                SUM(CASE WHEN LOWER(deal_status) IN ('closed lost', 'lost') THEN 1 ELSE 0 END) AS lostDeals
            FROM deals
            ${metricsWhere}
        `, metricsParams);

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
   GET DASHBOARD STATS & ANALYTICS (FULL AGGREGATION)
   ===================================================== */

router.get("/deals/dashboard-stats", authenticateToken, async (req, res) => {
    try {
        const { user_id, role } = req.user;
        const { pipeline_id = "all" } = req.query;

        let whereClauses = [];
        let params = [];

        if (role !== "admin" && role !== "coworker") {
            whereClauses.push("deals.assign_to = ?");
            params.push(user_id);
            whereClauses.push("(deals.deal_stage NOT IN (SELECT stage_id FROM stages WHERE LOWER(stage_name) LIKE '%pool%'))");
        }

        if (pipeline_id && pipeline_id !== "all") {
            whereClauses.push("deals.pipeline_id = ?");
            params.push(pipeline_id);
        }

        const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(" AND ")}` : "";

        // 1. Overall Metrics
        const [overall] = await db.query(`
            SELECT 
                COUNT(*) AS totalDeals,
                SUM(CASE WHEN LOWER(COALESCE(deal_status, 'open')) = 'open' THEN 1 ELSE 0 END) AS openCount,
                SUM(CASE WHEN LOWER(COALESCE(deal_status, '')) IN ('closed won', 'won') THEN 1 ELSE 0 END) AS wonCount,
                SUM(CASE WHEN LOWER(COALESCE(deal_status, '')) IN ('closed lost', 'lost') THEN 1 ELSE 0 END) AS lostCount,
                COALESCE(SUM(deal_value), 0) AS totalPipelineValue,
                COALESCE(SUM(CASE WHEN LOWER(COALESCE(deal_status, 'open')) = 'open' THEN deal_value ELSE 0 END), 0) AS openPipelineValue,
                COALESCE(SUM(CASE WHEN LOWER(COALESCE(deal_status, '')) IN ('closed won', 'won') THEN deal_value ELSE 0 END), 0) AS wonPipelineValue,
                SUM(CASE WHEN LOWER(COALESCE(deal_priority, 'medium')) = 'high' THEN 1 ELSE 0 END) AS highPriority,
                SUM(CASE WHEN LOWER(COALESCE(deal_priority, 'medium')) = 'medium' THEN 1 ELSE 0 END) AS mediumPriority,
                SUM(CASE WHEN LOWER(COALESCE(deal_priority, 'medium')) = 'low' THEN 1 ELSE 0 END) AS lowPriority,
                SUM(CASE WHEN assign_to IS NULL OR assign_to = '' THEN 1 ELSE 0 END) AS unassignedCount,
                SUM(CASE WHEN assign_to IS NOT NULL AND assign_to != '' THEN 1 ELSE 0 END) AS assignedCount
            FROM deals
            ${whereSql}
        `, params);

        // 2. Stage Breakdown
        const [stageRows] = await db.query(`
            SELECT 
                deal_stage AS stage_id,
                COUNT(*) AS deal_count,
                COALESCE(SUM(deal_value), 0) AS stage_value
            FROM deals
            ${whereSql}
            GROUP BY deal_stage
        `, params);

        // 3. User Assignment Breakdown (For Admins)
        let userStats = [];
        if (role === "admin" || role === "coworker") {
            const [uStats] = await db.query(`
                SELECT 
                    assign_to AS user_id,
                    COUNT(*) AS dealCount,
                    SUM(CASE WHEN LOWER(COALESCE(deal_status, 'open')) = 'open' THEN 1 ELSE 0 END) AS openCount,
                    SUM(CASE WHEN LOWER(COALESCE(deal_status, '')) IN ('closed won', 'won') THEN 1 ELSE 0 END) AS wonCount,
                    COALESCE(SUM(deal_value), 0) AS totalValue
                FROM deals
                ${whereSql}
                GROUP BY assign_to
            `, params);
            userStats = uStats;
        }

        // 4. Recent Deals
        const [recent] = await db.query(`
            SELECT 
                deals.*,
                assigned_user.name AS assigned_user_name
            FROM deals
            LEFT JOIN users AS assigned_user ON deals.assign_to = assigned_user.user_id
            ${whereSql}
            ORDER BY deals.creation_date DESC
            LIMIT 10
        `, params);

        return res.json({
            success: true,
            summary: overall[0] || {},
            stages: stageRows || [],
            userStats: userStats || [],
            recentDeals: recent || []
        });

    } catch (error) {
        console.error("Dashboard stats error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to fetch dashboard stats",
            error: error.message
        });
    }
});

/* =====================================================
   AUTO FORMAT UNSPACED COMPANY NAMES (ADMIN ROUTE)
   ===================================================== */

router.post("/deals/format-company-names", authenticateToken, async (req, res) => {
    try {
        const { formatCompanyName } = require("../utils/companyNameFormatter");
        const [rowsToFormat] = await db.query(
            `SELECT deal_id, deal_organization, contact_person FROM deals 
             WHERE deal_organization IS NOT NULL 
               AND TRIM(deal_organization) != '' 
               AND deal_organization NOT LIKE '% %'`
        );

        let updatedCount = 0;
        for (const r of rowsToFormat) {
            const formatted = formatCompanyName(r.deal_organization, r.contact_person);
            if (formatted && formatted !== r.deal_organization) {
                await db.query(
                    `UPDATE deals SET deal_organization = ? WHERE deal_id = ?`,
                    [formatted, r.deal_id]
                );
                updatedCount++;
            }
        }

        return res.json({
            success: true,
            message: `Successfully formatted ${updatedCount} company names.`,
            updated: updatedCount,
            totalChecked: rowsToFormat.length
        });
    } catch (err) {
        console.error("Clean company names error:", err);
        return res.status(500).json({ success: false, error: err.message });
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

        const dealRecord = results[0];

        // Resolve creator name from deal field or activities history
        if (!dealRecord.created_by) {
            try {
                const [actRows] = await db.query(
                    `SELECT details, user_id FROM activities WHERE deal_id = ? AND details LIKE 'Lead created by%' ORDER BY created_at ASC LIMIT 1`,
                    [id]
                );
                if (actRows.length > 0 && actRows[0].details) {
                    dealRecord.created_by = actRows[0].details.replace(/^Lead created by\s+/i, "").trim();
                } else {
                    dealRecord.created_by = dealRecord.owner_name || dealRecord.deal_owner || "Admin";
                }
            } catch (e) {
                dealRecord.created_by = dealRecord.owner_name || dealRecord.deal_owner || "Admin";
            }
        }

        // If created_by is an email or user_id, resolve to actual User Name
        if (dealRecord.created_by) {
            try {
                const rawVal = dealRecord.created_by.trim();
                if (rawVal.includes("@") || rawVal.length >= 20) {
                    const [uRows] = await db.query(
                        `SELECT name FROM users WHERE LOWER(TRIM(email)) = LOWER(TRIM(?)) OR user_id = ? LIMIT 1`,
                        [rawVal, rawVal]
                    );
                    if (uRows.length > 0 && uRows[0].name) {
                        dealRecord.created_by = uRows[0].name;
                    } else if (rawVal.includes("@")) {
                        // Fallback clean display if not in users table
                        const localPart = rawVal.split("@")[0].replace(/[._-]/g, " ");
                        dealRecord.created_by = localPart.charAt(0).toUpperCase() + localPart.slice(1);
                    }
                }
            } catch (uErr) {
                console.warn("User lookup for created_by failed:", uErr.message);
            }
        }

        return res.status(200).json({
            success: true,
            deal: dealRecord
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
            created_by: req.user.name || req.user.email || "Admin",
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
            "website",
            "created_by"
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
         * If deal is being assigned to a user, check if it's currently in Pool Drive.
         * If so, automatically move it to the first active stage of its pipeline and clear moved_by.
         */
        if (updatedDeal.assign_to) {
            const [stageCheck] = await db.query(
                `SELECT d.pipeline_id, s.stage_name 
                 FROM deals d 
                 LEFT JOIN stages s ON d.deal_stage = s.stage_id 
                 WHERE d.deal_id = ? LIMIT 1`,
                [id]
            );
            if (stageCheck[0]?.stage_name && stageCheck[0].stage_name.toLowerCase().includes("pool")) {
                if (!updatedDeal.deal_stage || updatedDeal.deal_stage === dealResults[0]?.deal_stage) {
                    const [firstStages] = await db.query(
                        `SELECT stage_id FROM stages 
                         WHERE (pipeline_id = ? OR pipeline_id IS NULL) 
                         AND LOWER(stage_name) NOT LIKE '%pool%' 
                         ORDER BY stage_order ASC LIMIT 1`,
                        [stageCheck[0].pipeline_id]
                    );
                    if (firstStages.length > 0) {
                        updatedDeal.deal_stage = firstStages[0].stage_id;
                    }
                }
                updatedDeal.moved_by_name = null;
                updatedDeal.moved_by_user_id = null;
                updatedDeal.moved_at = null;
            }
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

        // Auto-generate activity timeline entry for changes
        try {
            const oldRec = dealResults[0] || {};
            const changes = [];

            if (updatedDeal.deal_stage && String(updatedDeal.deal_stage) !== String(oldRec.deal_stage)) {
                const [oldStg] = oldRec.deal_stage ? await db.query("SELECT stage_name FROM stages WHERE stage_id = ? LIMIT 1", [oldRec.deal_stage]) : [[]];
                const [newStg] = await db.query("SELECT stage_name FROM stages WHERE stage_id = ? LIMIT 1", [updatedDeal.deal_stage]);
                const oldName = oldStg[0]?.stage_name || oldRec.deal_stage;
                const newName = newStg[0]?.stage_name || updatedDeal.deal_stage;
                changes.push(`moved stage from "${oldName}" to "${newName}"`);
            }
            if (updatedDeal.deal_status && updatedDeal.deal_status !== oldRec.deal_status) {
                changes.push(`changed status from "${oldRec.deal_status || 'Open'}" to "${updatedDeal.deal_status}"`);
            }
            if (updatedDeal.deal_priority && updatedDeal.deal_priority !== oldRec.deal_priority) {
                changes.push(`changed priority from "${oldRec.deal_priority || 'Medium'}" to "${updatedDeal.deal_priority}"`);
            }
            if (updatedDeal.deal_value !== undefined && String(updatedDeal.deal_value || "") !== String(oldRec.deal_value || "")) {
                const oldVal = oldRec.deal_value ? `$${oldRec.deal_value}` : "$0";
                const newVal = updatedDeal.deal_value ? `$${updatedDeal.deal_value}` : "$0";
                changes.push(`updated deal value from ${oldVal} to ${newVal}`);
            }
            if (updatedDeal.customer_number !== undefined && updatedDeal.customer_number !== oldRec.customer_number) {
                if (oldRec.customer_number && updatedDeal.customer_number) {
                    changes.push(`updated phone from "${oldRec.customer_number}" to "${updatedDeal.customer_number}"`);
                } else if (updatedDeal.customer_number) {
                    changes.push(`added phone: "${updatedDeal.customer_number}"`);
                } else {
                    changes.push(`removed phone number`);
                }
            }
            if (updatedDeal.customer_email !== undefined && updatedDeal.customer_email !== oldRec.customer_email) {
                if (oldRec.customer_email && updatedDeal.customer_email) {
                    changes.push(`updated email from "${oldRec.customer_email}" to "${updatedDeal.customer_email}"`);
                } else if (updatedDeal.customer_email) {
                    changes.push(`added email: "${updatedDeal.customer_email}"`);
                } else {
                    changes.push(`removed email`);
                }
            }
            if (updatedDeal.contact_person !== undefined && updatedDeal.contact_person !== oldRec.contact_person) {
                if (oldRec.contact_person && updatedDeal.contact_person) {
                    changes.push(`updated contact person from "${oldRec.contact_person}" to "${updatedDeal.contact_person}"`);
                } else if (updatedDeal.contact_person) {
                    changes.push(`set contact person to "${updatedDeal.contact_person}"`);
                }
            }
            if (updatedDeal.customer_address !== undefined && updatedDeal.customer_address !== oldRec.customer_address) {
                if (updatedDeal.customer_address) {
                    changes.push(`updated address to "${updatedDeal.customer_address}"`);
                } else {
                    changes.push(`removed address`);
                }
            }
            if (updatedDeal.website !== undefined && updatedDeal.website !== oldRec.website) {
                if (updatedDeal.website) {
                    changes.push(`updated website to "${updatedDeal.website}"`);
                } else {
                    changes.push(`removed website`);
                }
            }
            if (newAssignee !== undefined && String(newAssignee || "") !== String(oldAssignee || "")) {
                if (newAssignee) {
                    const [oldAsgn] = oldAssignee ? await db.query("SELECT name FROM users WHERE user_id = ? LIMIT 1", [oldAssignee]) : [[]];
                    const [newAsgn] = await db.query("SELECT name FROM users WHERE user_id = ? LIMIT 1", [newAssignee]);
                    const oldName = oldAsgn[0]?.name || "Unassigned";
                    const newName = newAsgn[0]?.name || "new employee";
                    changes.push(`reassigned lead from "${oldName}" to "${newName}"`);
                } else {
                    const [oldAsgn] = oldAssignee ? await db.query("SELECT name FROM users WHERE user_id = ? LIMIT 1", [oldAssignee]) : [[]];
                    changes.push(`unassigned lead (previously "${oldAsgn[0]?.name || 'assigned'}")`);
                }
            }
            if (updatedDeal.associated_contacts !== undefined && updatedDeal.associated_contacts !== oldRec.associated_contacts) {
                let oldList = [];
                let newList = [];
                try { oldList = JSON.parse(oldRec.associated_contacts || "[]"); } catch {}
                try { newList = JSON.parse(updatedDeal.associated_contacts || "[]"); } catch {}
                if (!Array.isArray(oldList)) oldList = [];
                if (!Array.isArray(newList)) newList = [];

                const added = newList.filter(n => !oldList.some(o => o.id === n.id || (o.value === n.value && o.type === n.type)));
                const removed = oldList.filter(o => !newList.some(n => n.id === o.id || (n.value === o.value && n.type === o.type)));

                if (added.length > 0) {
                    for (const item of added) {
                        changes.push(`added ${item.label || item.type || 'contact'}: "${item.value}"`);
                    }
                } else if (removed.length > 0) {
                    for (const item of removed) {
                        changes.push(`removed ${item.label || item.type || 'contact'}: "${item.value}"`);
                    }
                } else {
                    changes.push(`updated additional contact info`);
                }
            }
            if (updatedDeal.deal_notes !== undefined && updatedDeal.deal_notes !== oldRec.deal_notes) {
                if (updatedDeal.deal_notes) {
                    const snippet = updatedDeal.deal_notes.length > 60 ? updatedDeal.deal_notes.substring(0, 60) + '...' : updatedDeal.deal_notes;
                    changes.push(`updated notes: "${snippet}"`);
                } else {
                    changes.push(`cleared notes`);
                }
            }

            if (changes.length > 0) {
                const [uRows] = await db.query("SELECT name FROM users WHERE user_id = ? LIMIT 1", [user_id]);
                const actorName = uRows[0]?.name || req.user.name || "User";
                const activityText = `${actorName} ${changes.join(", ")}`;

                await db.query(
                    `INSERT INTO activities (deal_id, user_id, activity_type, details) VALUES (?, ?, 'comment', ?)`,
                    [id, user_id, activityText]
                );
            }
        } catch (actLogErr) {
            console.warn("Auto timeline log error:", actLogErr.message);
        }

        // Check if assignment changed for notifications
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

            const [oldStageRows] = currentDeal.deal_stage ? await db.query(
                `SELECT stage_name FROM stages WHERE stage_id = ? OR stage_name = ? LIMIT 1`,
                [currentDeal.deal_stage, currentDeal.deal_stage]
            ) : [[]];
            const oldStageName = oldStageRows[0]?.stage_name || currentDeal.deal_stage || "Initial Stage";

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
                        `${moverName} moved this deal from "${oldStageName}" to Pool Drive`
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
                // Moving to normal stage: clear pool flags
                await db.query(
                    `
                    UPDATE deals
                    SET
                        deal_stage = ?,
                        moved_by_name = NULL,
                        moved_by_user_id = NULL,
                        moved_at = NULL,
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
                        `${moverName} moved stage from "${oldStageName}" to "${targetStageName}"`
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

            // If any assigned deals are currently in Pool Drive, automatically move them to the first active stage
            try {
                const [poolDeals] = await db.query(
                    `SELECT d.deal_id, d.pipeline_id 
                     FROM deals d
                     JOIN stages s ON d.deal_stage = s.stage_id
                     WHERE d.deal_id IN (${placeholders}) AND LOWER(s.stage_name) LIKE '%pool%'`,
                    deal_ids
                );

                for (const pd of poolDeals) {
                    const [firstStages] = await db.query(
                        `SELECT stage_id FROM stages 
                         WHERE (pipeline_id = ? OR pipeline_id IS NULL) 
                         AND LOWER(stage_name) NOT LIKE '%pool%' 
                         ORDER BY stage_order ASC LIMIT 1`,
                        [pd.pipeline_id]
                    );
                    if (firstStages.length > 0) {
                        await db.query(
                            `UPDATE deals 
                             SET deal_stage = ?, moved_by_name = NULL, moved_by_user_id = NULL, moved_at = NULL, last_updated = CURRENT_TIMESTAMP 
                             WHERE deal_id = ?`,
                            [firstStages[0].stage_id, pd.deal_id]
                        );
                    } else {
                        await db.query(
                            `UPDATE deals 
                             SET moved_by_name = NULL, moved_by_user_id = NULL, moved_at = NULL, last_updated = CURRENT_TIMESTAMP 
                             WHERE deal_id = ?`,
                            [pd.deal_id]
                        );
                    }
                }
            } catch (poolSyncErr) {
                console.warn("Failed to auto-shift assigned deals out of Pool Drive:", poolSyncErr.message);
            }

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