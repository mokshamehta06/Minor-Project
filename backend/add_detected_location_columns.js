require('dotenv').config();
const db = require('./database/dbConnect');

const addDetectedLocationColumns = () => {
    const alterQuery = `
        ALTER TABLE Complaint
        ADD COLUMN detected_city VARCHAR(255) NULL,
        ADD COLUMN detected_state VARCHAR(255) NULL,
        ADD COLUMN detected_address TEXT NULL;
    `;

    db.query(alterQuery, (err, result) => {
        if (err) {
            // Check if error is because columns already exist (duplicate column name)
            if (err.code === 'ER_DUP_FIELDNAME') {
                console.log('✅ Columns "detected_city", "detected_state", and "detected_address" already exist.');
            } else {
                console.error('❌ Error adding columns:', err);
            }
        } else {
            console.log('✅ Successfully added detected location columns to Complaint table.');
        }
        process.exit();
    });
};

addDetectedLocationColumns();
