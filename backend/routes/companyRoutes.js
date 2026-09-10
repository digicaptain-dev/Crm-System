const express = require("express");
const router = express.Router();
const db = require("../db");
const authenticateToken = require("../middleware/authMiddleware");

// =====================================================
// GET ALL COMPANIES (Aggregated from Deals & CRM Data)
// =====================================================
router.get("/companies", authenticateToken, async (req, res) => {
    try {
        const { search = "", page = 1, limit = 15 } = req.query;

        const pageNum = Math.max(1, parseInt(page) || 1);
        const limitNum = Math.max(1, Math.min(100, parseInt(limit) || 15));
        const offset = (pageNum - 1) * limitNum;

        const { user_id, role } = req.user;

        let whereClauses = ["d.deal_organization IS NOT NULL", "TRIM(d.deal_organization) != ''"];
        let params = [];

        if (role !== "admin" && role !== "coworker") {
            whereClauses.push("d.assign_to = ?");
            params.push(user_id);
            whereClauses.push("(d.deal_stage NOT IN (SELECT stage_id FROM stages WHERE LOWER(stage_name) LIKE '%pool%'))");
        }

        if (search.trim()) {
            whereClauses.push(`(
                d.deal_organization LIKE ? OR
                d.customer_email LIKE ? OR
                d.customer_number LIKE ? OR
                d.customer_address LIKE ?
            )`);
            const searchWildcard = `%${search.trim()}%`;
            params.push(searchWildcard, searchWildcard, searchWildcard, searchWildcard);
        }

        const whereSql = `WHERE ${whereClauses.join(" AND ")}`;

        // 1. Total unique companies count
        const countSql = `
            SELECT COUNT(DISTINCT d.deal_organization) AS total 
            FROM deals d 
            ${whereSql}
        `;
        const [countResult] = await db.query(countSql, params);
        const total = countResult[0]?.total || 0;
        const totalPages = Math.ceil(total / limitNum) || 1;

        // 2. KPIs
        let metricsWhere = "WHERE deal_organization IS NOT NULL AND TRIM(deal_organization) != ''";
        let metricsParams = [];
        if (role !== "admin" && role !== "coworker") {
            metricsWhere += ` AND assign_to = ? AND (deal_stage NOT IN (SELECT stage_id FROM stages WHERE LOWER(stage_name) LIKE '%pool%'))`;
            metricsParams.push(user_id);
        }

        const [metricsResult] = await db.query(`
            SELECT 
                COUNT(DISTINCT NULLIF(TRIM(deal_organization), '')) AS totalCompanies,
                SUM(CASE WHEN LOWER(deal_status) = 'open' THEN 1 ELSE 0 END) AS openDeals,
                COUNT(*) AS totalDeals,
                SUM(CASE WHEN LOWER(deal_status) IN ('closed won', 'won') THEN 1 ELSE 0 END) AS wonDeals
            FROM deals
            ${metricsWhere}
        `, metricsParams);

        const globalMetrics = {
            totalCompanies: Number(metricsResult[0]?.totalCompanies || 0),
            openDeals: Number(metricsResult[0]?.openDeals || 0),
            totalDeals: Number(metricsResult[0]?.totalDeals || 0),
            wonDeals: Number(metricsResult[0]?.wonDeals || 0)
        };

        // 3. Paginated Companies Data
        const dataSql = `
            SELECT 
                d.deal_organization AS name,
                d.deal_organization AS id,
                COUNT(d.deal_id) AS deals_count,
                COALESCE(SUM(d.deal_value), 0) AS total_value,
                SUM(CASE WHEN d.deal_status IN ('Closed Won', 'Won') THEN 1 ELSE 0 END) AS won_deals,
                SUM(CASE WHEN d.deal_status = 'Open' THEN 1 ELSE 0 END) AS open_deals,
                MAX(NULLIF(d.customer_email, '')) AS email,
                MAX(NULLIF(d.customer_number, '')) AS phone,
                MAX(NULLIF(d.customer_address, '')) AS address,
                MAX(COALESCE(NULLIF(d.deal_owner, ''), NULLIF(d.contact_person, ''))) AS primary_contact,
                MAX(d.deal_owner) AS owner,
                MAX(assigned_user.name) AS assigned_user_name,
                MAX(assigned_user.name) AS owner_name,
                MAX(d.creation_date) AS last_activity,
                CASE 
                    WHEN SUM(CASE WHEN d.deal_status = 'Open' THEN 1 ELSE 0 END) > 0 THEN 'Active'
                    WHEN SUM(CASE WHEN d.deal_status IN ('Closed Won', 'Won') THEN 1 ELSE 0 END) > 0 THEN 'Client'
                    ELSE 'Inactive'
                END AS status
            FROM deals d
            LEFT JOIN users assigned_user ON d.assign_to = assigned_user.user_id
            ${whereSql}
            GROUP BY d.deal_organization
            ORDER BY total_value DESC, deals_count DESC
            LIMIT ? OFFSET ?
        `;

        const dataParams = [...params, limitNum, offset];
        const [companies] = await db.query(dataSql, dataParams);

        return res.status(200).json({
            success: true,
            total,
            page: pageNum,
            limit: limitNum,
            totalPages,
            metrics: globalMetrics,
            companies: companies
        });

    } catch (error) {
        console.error("GET COMPANIES ERROR:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to fetch companies",
            error: error.message
        });
    }
});

module.exports = router;
