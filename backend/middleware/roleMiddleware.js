// middleware/roleMiddleware.js

function allowRoles(...allowedRoles) {

    return (req, res, next) => {

        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: "Authentication required."
            });
        }

        if (!allowedRoles.includes(req.user.role)) {

            console.warn(
                `Unauthorized access attempt: ${req.user.email} (${req.user.role})`
            );

            return res.status(403).json({
                success: false,
                message: "You are not authorized to perform this action."
            });
        }

        next();
    };
}

module.exports = allowRoles;