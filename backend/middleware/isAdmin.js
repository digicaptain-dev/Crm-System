const db = require("../db");

// Middleware to check if the user is admin
const checkAdminRole = (req, res, next) => {
    const { assigned_id } = req.params; // Get user_id from params, headers, or body

    // Query to find the role of the user based on user_id
    const query = `SELECT role FROM users WHERE user_id = ?`;

    db.query(query, [assigned_id], (err, results) => {
        if (err) {
            return res.status(500).json({ error: 'Database query failed' });
        }

        if (results.length === 0) {
            return res.status(404).json([]);
        }

        const userRole = results[0].role;

        // Check if the user is an admin
        if (userRole === 'admin') {
            req.isAdmin = true; // Store the result in request object
        } else {
            req.isAdmin = false;
        }

        // Proceed to the next middleware or route handler
        next();
    });
};

module.exports = checkAdminRole;