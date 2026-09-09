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

        let whereClauses = ["d.deal_organization IS NOT NULL", "TRIM(d.deal_organization) != ''"];
        let params = [];

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

        // 2. Global KPIs
        const [metricsResult] = await db.query(`
            SELECT 
                COUNT(DISTINCT NULLIF(TRIM(deal_organization), '')) AS totalCompanies,
                SUM(deal_value) AS totalPipelineValue,
                COUNT(*) AS totalDeals,
                SUM(CASE WHEN deal_status IN ('Closed Won', 'Won') THEN deal_value ELSE 0 END) AS wonValue
            FROM deals
            WHERE deal_organization IS NOT NULL AND TRIM(deal_organization) != ''
        `);

        const globalMetrics = {
            totalCompanies: metricsResult[0]?.totalCompanies || 0,
            totalPipelineValue: metricsResult[0]?.totalPipelineValue || 0,
            totalDeals: metricsResult[0]?.totalDeals || 0,
            wonValue: metricsResult[0]?.wonValue || 0
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
                MAX(NULLIF(d.contact_person, '')) AS primary_contact,
                MAX(d.deal_owner) AS owner,
                MAX(COALESCE(u.name, d.deal_owner)) AS owner_name,
                MAX(d.creation_date) AS last_activity,
                CASE 
                    WHEN SUM(CASE WHEN d.deal_status = 'Open' THEN 1 ELSE 0 END) > 0 THEN 'Active'
                    WHEN SUM(CASE WHEN d.deal_status IN ('Closed Won', 'Won') THEN 1 ELSE 0 END) > 0 THEN 'Client'
                    ELSE 'Inactive'
                END AS status
            FROM deals d
            LEFT JOIN users u ON d.deal_owner = u.user_id OR d.assign_to = u.user_id
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
