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
        connection.release();
    } catch (err) {
        console.error('[DB FATAL ERROR] Unable to establish MySQL connection:', err.message);
    }
})();

module.exports = db;