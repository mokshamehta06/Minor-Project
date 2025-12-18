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

    // First get official info
    const officialQuery = `SELECT * FROM Official WHERE official_id = ?`;

    db.query(officialQuery, [officialId], (err, officialResults) => {
        if (err) {
            console.error('Error fetching official:', err);
            return res.status(500).json({ message: 'Internal server error' });
        }

        if (officialResults.length === 0) {
            return res.status(404).json({ message: 'Official not found' });
        }

        const official = officialResults[0];

        // Now fetch ALL complaints from ALL departments with full details
        const complaintsQuery = `
            SELECT
                c.*,
                d.Name as department_name,
                d.department_id,
                cat.Name as category_name,
                u.First_name as user_first_name,
                u.Last_name as user_last_name,
                u.Email as user_email,
                u.Phone as user_phone,
                w.First_name as worker_first_name,
                w.Last_name as worker_last_name,
                a.assigned_date,
                o.First_name as assigned_official_first_name,
                o.Last_name as assigned_official_last_name
            FROM Complaint c
            LEFT JOIN Department d ON c.department_id = d.department_id
            LEFT JOIN category cat ON c.category_id = cat.category_id
            LEFT JOIN User u ON c.user_id = u.user_id
            LEFT JOIN Assignment a ON c.complaint_id = a.complaint_id
            LEFT JOIN Worker w ON a.worker_id = w.worker_id
            LEFT JOIN Official o ON a.official_id = o.official_id
            ORDER BY d.Name, c.created_at DESC
        `;

        db.query(complaintsQuery, (err, complaints) => {
            if (err) {
                console.error('Error fetching complaints:', err);
                return res.status(500).json({ message: 'Internal server error' });
            }

            console.log("Fetched", complaints.length, "complaints from all departments");

            // Combine official info with complaints
            const response = complaints.map(complaint => ({
                ...official,
                ...complaint
            }));

            res.status(200).json({
                profile: response,
                official: official,
                totalComplaints: complaints.length
            });
        });
    });
};

module.exports = { getOfficialProfile };