const db = require("../db");

const checkAdminRole = (req, res, next) => {
    const assigned_id = req.params.assigned_id.trim();

    console.log("checkAdminRole - assigned_id:", assigned_id);

    const query = `SELECT role FROM users WHERE user_id = ?`;

    db.query(query, [assigned_id], (err, results) => {
        if (err) {
            console.error("checkAdminRole DB error:", err);

            return res.status(500).json({
                error: "Database query failed"
            });
        }

        console.log("checkAdminRole - results:", results);

        if (results.length === 0) {
            return res.status(404).json([]);
        }

        const userRole = results[0].role;

        console.log("checkAdminRole - role:", userRole);

        req.isAdmin = userRole === "admin";

        next();
    });
};

module.exports = checkAdminRole;
