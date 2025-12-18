require('dotenv').config();
const db = require('./database/dbConnect');

const checkColumns = () => {
    const query = "SHOW COLUMNS FROM Complaint WHERE Field IN ('latitude', 'longitude')";
    db.query(query, (err, results) => {
        if (err) {
            console.error('Error checking columns:', err);
        } else {
            console.log('Found columns:', JSON.stringify(results));
        }
        process.exit();
    });
};

checkColumns();
