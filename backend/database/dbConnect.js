const mysql = require('mysql2');

const db = mysql.createConnection({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'MinorDB',
});

db.connect((err) => {
  if (err) {
    console.error("❌ MySQL Connection Error:", err);
    console.error("DB Config:", {
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      database: process.env.DB_NAME
    });
    return;
  }
  console.log("✅ Connected to MySQL Database");
});

module.exports = db;
