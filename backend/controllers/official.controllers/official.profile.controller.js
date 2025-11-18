// i have to implement the official profile fetching logic here
// the profile will contain complaints registerd by the citizens with respect to their department
// so copilet suggest code with correct sql queries and structure  
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
 //+-------------------+--------------+------+-----+---------+----------------+
 // above is official table structure
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

// +---------------+--------------+------+-----+---------+----------------+
// | Field         | Type         | Null | Key | Default | Extra          |
// +---------------+--------------+------+-----+---------+----------------+
// | department_id | bigint       | NO   | PRI | NULL    | auto_increment |
// | Name          | varchar(100) | NO   | UNI | NULL    |                |
// | Contact_info  | varchar(255) | YES  |     | NULL    |                |
// +---------------+--------------+------+-----+---------+----------------+
// above is department table structure
// we have to join official table with complaint table on department_id
// and fetch all complaints related to that department
// also we can fetch department name from department table using department_id
// so we have to join three tables here official, complaint and department
const db = require('../../database/dbConnect');
const getOfficialProfile = (req, res) => {
    //console.log(req);
    
    const officialId = req.user.official_id; // Assuming official ID is stored in req.official after authentication
    console.log("Fetching profile for official ID:", officialId);
    // Database query to fetch official profile along with complaints and department name
    const query = `
        SELECT * FROM Official o
        JOIN Department d ON o.department_id = d.department_id
        LEFT JOIN Complaint c ON o.department_id = c.department_id
        WHERE o.official_id = ?
    `;
    db.query(query, [officialId], (err, results) => {
        if (err) {
            console.error('Error fetching official profile:', err);
            return res.status(500).json({ message: 'Internal server error' });
        }

        // If no results found, return 404
        if (results.length === 0) {
            return res.status(404).json({ message: 'Official profile not found' });
        }
        console.log("Official profile fetched successfully:", results);
        // Return the official profile along with complaints and department name
        
        res.status(200).json({ profile: results });
    });
};

module.exports = { getOfficialProfile };