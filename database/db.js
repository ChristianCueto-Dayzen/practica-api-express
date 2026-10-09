const mysql2 = require('mysql2/promise');
const dotenv = require('dotenv');

const config = dotenv.config()

if (config.error) {
    throw config.error
}

const connectDB = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT
}

const conn = mysql2.createPool(connectDB);

conn.getConnection()
    .then((connection) => {
        console.log('Database connected');
        connection.release();
    })
    .catch((err) => {
        console.error('Error connecting to the database:', err);
    });

module.exports = conn;