// +------------+-------------+------+-----+---------+----------------+
// | Field      | Type        | Null | Key | Default | Extra          |
// +------------+-------------+------+-----+---------+----------------+
// | worker_id  | bigint      | NO   | PRI | NULL    | auto_increment |
// | First_name | varchar(40) | NO   |     | NULL    |                |
// | Last_name  | varchar(40) | NO   |     | NULL    |                |
// | Phone      | varchar(15) | NO   | UNI | NULL    |                |
// | Skill_1    | varchar(30) | NO   |     | NULL    |                |
// | Skill_2    | varchar(30) | YES  |     | NULL    |                |
// | Skill_3    | varchar(30) | YES  |     | NULL    |                |
// | Skill_4    | varchar(30) | YES  |     | NULL    |                |
// +------------+-------------+------+-----+---------+----------------+
// 8 rows in set (0.011 sec)

// above is the structure of the 'workers' table in the database
const db = require('../../database/dbConnect');
const getWorkersForOfficial = (req, res) => {
    const departmentId = req.user.department_id; // Assuming official_id is stored in req.user after authentication

    const query = 'SELECT worker_id, First_name, Last_name, Phone, Skill_1, Skill_2, Skill_3, Skill_4 FROM Worker where department_id = ?';
    
    db.query(query, [departmentId],(err, results) => {
        if (err) {
            console.error('Error fetching workers:', err);
            return res.status(500).json({ message: 'Internal server error' });
        }

        res.status(200).json({ workers: results });
    });

}
    module.exports = { getWorkersForOfficial };