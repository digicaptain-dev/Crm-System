const mysql = require('mysql2');
require('dotenv').config();

const mysqldb = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
});

// Convert callback-based methods to Promise-based methods
const db = mysqldb.promise();

db.connect()
    .then(() => {
        console.log('Connected to MySQL database');
    })
    .catch((err) => {
        console.error('Error connecting to MySQL:', err);
    });

module.exports = db;
