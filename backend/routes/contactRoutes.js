const express = require("express");
const router = express.Router();
const db = require("../db");
const authenticateToken = require("../middleware/authMiddleware");

// =====================================================
// GET ALL CONTACTS (With Server Pagination & Filters)
// =====================================================
router.get("/contacts", authenticateToken, async (req, res) => {
    try {
        const { search = "", status = "all", page = 1, limit = 15 } = req.query;

        const pageNum = Math.max(1, parseInt(page) || 1);
        const limitNum = Math.max(1, Math.min(100, parseInt(limit) || 15));
        const offset = (pageNum - 1) * limitNum;

        let whereClauses = [];
        let params = [];

        if (search.trim()) {
            whereClauses.push(`(
                d.contact_person LIKE ? OR
                d.deal_name LIKE ? OR
                d.deal_organization LIKE ? OR
                d.customer_email LIKE ? OR
                d.customer_number LIKE ?
            )`);
            const searchWildcard = `%${search.trim()}%`;
            params.push(searchWildcard, searchWildcard, searchWildcard, searchWildcard, searchWildcard);
        }

        if (status && status !== "all") {
            if (status.toLowerCase() === "open") {
                whereClauses.push(`d.deal_status = 'Open'`);
            } else if (status.toLowerCase() === "won") {
                whereClauses.push(`(d.deal_status = 'Closed Won' OR d.deal_status = 'Won')`);
            } else if (status.toLowerCase() === "lost") {
                whereClauses.push(`(d.deal_status = 'Closed Lost' OR d.deal_status = 'Lost')`);
            }
        }

        const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(" AND ")}` : "";

        // 1. Total matching count
        const countSql = `SELECT COUNT(*) AS total FROM deals d ${whereSql}`;
        const [countResult] = await db.query(countSql, params);
        const total = countResult[0]?.total || 0;
        const totalPages = Math.ceil(total / limitNum) || 1;

        // 2. Global KPIs summary (total, open, won, companies)
        const [metricsResult] = await db.query(`
            SELECT 
                COUNT(*) AS totalAll,
                SUM(CASE WHEN deal_status = 'Open' THEN 1 ELSE 0 END) AS openCount,
                SUM(CASE WHEN deal_status IN ('Closed Won', 'Won') THEN 1 ELSE 0 END) AS wonCount,
                COUNT(DISTINCT NULLIF(TRIM(deal_organization), '')) AS companiesCount
            FROM deals
        `);

        const globalMetrics = {
            total: metricsResult[0]?.totalAll || 0,
            open: metricsResult[0]?.openCount || 0,
            won: metricsResult[0]?.wonCount || 0,
            companies: metricsResult[0]?.companiesCount || 0
        };

        // 3. Paginated records
        const dataSql = `
            SELECT 
                d.deal_id AS id,
                d.deal_id,
                COALESCE(NULLIF(d.contact_person, ''), d.deal_name) AS name,
                d.deal_name,
                d.deal_organization AS company,
                d.customer_email AS email,
                d.customer_number AS phone,
                d.customer_address AS address,
                d.time_zone,
                d.deal_owner AS owner,
                d.deal_status AS status,
                d.deal_value AS value,
                d.deal_stage,
                d.creation_date,
                d.last_updated,
                u.name AS owner_name
            FROM deals d
            LEFT JOIN users u ON d.deal_owner = u.user_id OR d.assign_to = u.user_id
            ${whereSql}
            ORDER BY d.creation_date DESC
            LIMIT ? OFFSET ?
        `;

        const dataParams = [...params, limitNum, offset];
        const [contacts] = await db.query(dataSql, dataParams);

        return res.status(200).json({
            success: true,
            total,
            page: pageNum,
            limit: limitNum,
            totalPages,
            metrics: globalMetrics,
            contacts: contacts
        });

    } catch (error) {
        console.error("GET CONTACTS ERROR:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to fetch contacts",
            error: error.message
        });
    }
});

module.exports = router;
