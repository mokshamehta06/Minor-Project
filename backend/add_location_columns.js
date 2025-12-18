require('dotenv').config();
const db = require('./database/dbConnect');

const addLocationColumns = () => {
    const alterQuery = `
        ALTER TABLE Complaint
        ADD COLUMN latitude DECIMAL(10, 8) NULL,
        ADD COLUMN longitude DECIMAL(11, 8) NULL;
    `;

    db.query(alterQuery, (err, result) => {
        if (err) {
            // Check if error is because columns already exist (duplicate column name)
            if (err.code === 'ER_DUP_FIELDNAME') {
                console.log('✅ Columns "latitude" and "longitude" already exist.');
            } else {
                console.error('❌ Error adding columns:', err);
            }
        } else {
            console.log('✅ Successfully added "latitude" and "longitude" columns to Complaint table.');
        }
        process.exit();
    });
};

addLocationColumns();
