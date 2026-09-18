const mysql = require('mysql2/promise');
require('dotenv').config();

// Production vs Development Connection Pool Setup
const poolConfig = {
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 10000,
    // Railway MySQL production SSL compatibility handle
    ssl: process.env.NODE_ENV === 'production' && process.env.DB_HOST !== 'localhost' 
        ? { rejectUnauthorized: false } 
        : false
};

const db = mysql.createPool(poolConfig);

// Immediate connection test on application startup
(async () => {
    try {
        const connection = await db.getConnection();
        console.log(`[DB SUCCESS] Connected to MySQL Database: ${process.env.DB_NAME} (${process.env.DB_HOST})`);

        // Ensure website and deal_source columns on deals table
        try {
            await connection.query(`ALTER TABLE deals ADD COLUMN website VARCHAR(255) NULL`);
        } catch (alterErr) {}
        try {
            await connection.query(`ALTER TABLE deals MODIFY COLUMN deal_source VARCHAR(255) NULL`);
        } catch (alterErr2) {}

        // Ensure notifications table exists
        try {
            await connection.query(`
                CREATE TABLE IF NOT EXISTS notifications (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    notification_id VARCHAR(64) UNIQUE,
                    user_id VARCHAR(64) NOT NULL,
                    title VARCHAR(255) NOT NULL,
                    message TEXT NOT NULL,
                    type VARCHAR(50) DEFAULT 'general',
                    entity_type VARCHAR(50) NULL,
                    entity_id VARCHAR(64) NULL,
                    is_read TINYINT(1) DEFAULT 0,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    INDEX idx_user_read (user_id, is_read),
                    INDEX idx_user_created (user_id, created_at)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
            `);
            console.log('[DB SCHEMA] Verified/created notifications table');
        } catch (notifErr) {
            console.error('[DB SCHEMA ERROR] Failed creating notifications table:', notifErr.message);
        }

        // Ensure activities, comments, and users tables are utf8mb4_general_ci to match deals table
        try {
            await connection.query(`ALTER TABLE activities CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci`);
            await connection.query(`ALTER TABLE comments CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci`);
            await connection.query(`ALTER TABLE users CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci`);
        } catch (charsetErr) {
            // ignore if already done
        }

        connection.release();
    } catch (err) {
        console.error('[DB FATAL ERROR] Unable to establish MySQL connection:', err.message);
    }
})();

module.exports = db;