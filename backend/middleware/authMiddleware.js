const jwt = require("jsonwebtoken");

const authenticateToken = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        console.log("AUTH HEADER:", authHeader);

        if (!authHeader) {
            return res.status(401).json({
                success: false,
                message: "Authorization header is missing"
            });
        }

        if (!authHeader.startsWith("Bearer ")) {
            return res.status(401).json({
                success: false,
                message: "Invalid authorization format"
            });
        }

        const token = authHeader.split(" ")[1];

        if (!token) {
            return res.status(401).json({
                success: false,
                message: "Token is missing"
            });
        }

        jwt.verify(
            token,
            process.env.JWT_SECRET,
            (err, decoded) => {

                if (err) {
                    console.error(
                        "JWT verification error:",
                        err.message
                    );

                    return res.status(401).json({
                        success: false,
                        message: "Invalid or expired token"
                    });
                }

                console.log(
                    "AUTHENTICATED USER:",
                    decoded
                );

                req.user = decoded;

                next();
            }
        );

    } catch (error) {

        console.error(
            "Authentication middleware error:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Authentication failed"
        });
    }
};

module.exports = authenticateToken;