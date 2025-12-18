require('dotenv').config();
const db = require('./database/dbConnect');

const checkSchema = () => {
    const query = 'DESCRIBE Complaint';
    db.query(query, (err, results) => {
        if (err) {
            console.error('Error describing table:', err);
        } else {
            console.log('Complaint Table Schema:');
            console.table(results);
        }
        process.exit();
    });
};

checkSchema();