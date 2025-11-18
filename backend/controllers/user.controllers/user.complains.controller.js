 // below is complaint table structure
 //+---------------+-------------------------------------------+------+-----+-------------------+-----------------------------------------------+
// | Field         | Type                                      | Null | Key | Default           | Extra                                         |
// +---------------+-------------------------------------------+------+-----+-------------------+-----------------------------------------------+
// | complaint_id  | bigint                                    | NO   | PRI | NULL              | auto_increment                                |
// | user_id       | bigint                                    | NO   | MUL | NULL              |                                               |
// | category_id   | bigint                                    | NO   | MUL | NULL              |                                               |
// | department_id | bigint                                    | NO   | MUL | NULL              |                                               |
// | description   | text                                      | YES  |     | NULL              |                                               |
// | status        | enum('reported','in-progress','resolved') | YES  |     | reported          |                                               |
// | imageUrl      | varchar(255)                              | YES  |     | NULL              |                                               |
// | Pincode       | varchar(10)                               | NO   |     | NULL              |                                               |
// | State         | varchar(30)                               | NO   |     | NULL              |                                               |
// | City          | varchar(30)                               | NO   |     | NULL              |                                               |
// | Address_Line  | varchar(50)                               | YES  |     | NULL              |                                               |
// | created_at    | timestamp                                 | YES  |     | CURRENT_TIMESTAMP | DEFAULT_GENERATED                             |
// | updated_at    | timestamp                                 | YES  |     | CURRENT_TIMESTAMP | DEFAULT_GENERATED on update CURRENT_TIMESTAMP |
// +---------------+-------------------------------------------+------+-----+-------------------+-----------------------------------------------+

const db = require('../../database/dbConnect');
const trackUserComplain = (req, res) => {
    const userId = req.user.user_id; // Assuming user ID is stored in req.user after authentication
    console.log("----------------------");
    console.log(req.user.user_id);
    console.log("----------------------");
    // Database query to fetch complaints for the user
    const query = 'SELECT * FROM Complaint WHERE user_id = ?';
    db.query(query, [userId], (err, results) => {
        if (err) {
            console.error('Error fetching complaints:', err);
            return res.status(500).json({ message: 'Internal server error' });
        }
        console.log("*****************");
        console.log(results);
        console.log("*****************");
        return res.status(200).json({ complaints: results });
    });
};
module.exports = { trackUserComplain };