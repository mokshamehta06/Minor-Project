// this file will handle official registration code
// +-------------------+--------------+------+-----+---------+----------------+
// | Field             | Type         | Null | Key | Default | Extra          |
// +-------------------+--------------+------+-----+---------+----------------+
// | official_id       | bigint       | NO   | PRI | NULL    | auto_increment |
// | First_name        | varchar(40)  | NO   |     | NULL    |                |
// | Last_name         | varchar(40)  | NO   |     | NULL    |                |
// | Email             | varchar(100) | NO   | UNI | NULL    |                |
// | Phone             | varchar(15)  | NO   | UNI | NULL    |                |
// | Password_hash     | varchar(255) | NO   |     | NULL    |                |
// | Login_credentials | varchar(50)  | NO   | UNI | NULL    |                |
// | department_id     | bigint       | NO   | MUL | NULL    |                |
// +-------------------+--------------+------+-----+---------+----------------+
// above is official table structure
const db = require('../../database/dbConnect');
const bcrypt = require('bcrypt');

const registerOfficial = (req, res) => {
    const { First_name, Last_name, Email, Phone, Password, Login_credentials, department_id } = req.body;
    if (!First_name || !Last_name || !Email || !Phone || !Password || !Login_credentials || !department_id) {
        return res.status(400).json({ message: 'All fields are required.' });
    }
    const checkQuery = 'SELECT * FROM Official WHERE Email = ? OR Phone = ? OR Login_credentials = ?';
    db.query(checkQuery, [Email, Phone, Login_credentials], (err, results) => {
        if (err) {
            console.error('Database error during registration:', err);
            return res.status(500).json({ message: 'Internal server error' });
        }
        if (results.length > 0) {
            return res.status(409).json({ message: 'Official with provided Email, Phone or Login credentials already exists.' });
        }
        bcrypt.hash(Password, 10, (err, hash) => {
            if (err) {
                console.error('Error hashing password:', err);
                return res.status(500).json({ message: 'Internal server error' });
            }
            const insertQuery = `
                INSERT INTO Official (First_name, Last_name, Email, Phone, Password_hash, Login_credentials, department_id)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            `;
            db.query(insertQuery, [First_name, Last_name, Email, Phone, hash, Login_credentials, department_id], (err, result) => {
                if (err) {
                    console.error('Database error inserting official:', err);
                    return res.status(500).json({ message: 'Internal server error' });
                }
                res.status(201).json({ message: 'Official registered successfully.' });
            });
        });
    });
};

module.exports = { registerOfficial };