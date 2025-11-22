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
// | department_id | bigint   | YES  | MUL | NULL    |                |
// +------------+-------------+------+-----+---------+----------------+

// Assignment table structure:
// +---------------+----------------------------+------+-----+-------------------+-------------------+
// | assignment_id | bigint                     | NO   | PRI | NULL              | auto_increment    |
// | complaint_id  | bigint                     | NO   | MUL | NULL              |                   |
// | official_id   | bigint                     | NO   | MUL | NULL              |                   |
// | worker_id     | bigint                     | NO   | MUL | NULL              |                   |
// | assigned_date | timestamp                  | YES  |     | CURRENT_TIMESTAMP | DEFAULT_GENERATED |
// | status        | enum('in-progress','done') | YES  |     | NULL              |                   |
// +---------------+----------------------------+------+-----+-------------------+-------------------+

const db = require('../../database/dbConnect');

const getWorkersForOfficial = (req, res) => {
    const departmentId = req.user.department_id;
    const complaintId = req.query.complaint_id;

    // Query to get workers with their assignment status for this specific complaint
    const query = `
        SELECT
            w.worker_id,
            w.First_name,
            w.Last_name,
            w.Phone,
            CASE
                WHEN a.assignment_id IS NOT NULL THEN 'assigned'
                ELSE 'available'
            END as assignment_status,
            a.assignment_id
        FROM Worker w
        LEFT JOIN assignment a ON w.worker_id = a.worker_id
            AND a.complaint_id = ?
            AND a.status = 'in-progress'
        WHERE w.department_id = ?
        ORDER BY assignment_status DESC, w.First_name ASC
    `;

    db.query(query, [complaintId, departmentId], (err, results) => {
        if (err) {
            console.error('Error fetching workers:', err);
            return res.status(500).json({ message: 'Internal server error' });
        }

        res.status(200).json({
            workers: results,
            complaint_id: complaintId
        });
    });
};

const addWorker = (req, res) => {
    const { First_name, Last_name, Phone } = req.body;
    const departmentId = req.user.department_id;

    if (!First_name || !Last_name || !Phone) {
        return res.status(400).json({ message: 'First name, Last name, and Phone are required.' });
    }

    const query = `
        INSERT INTO Worker (First_name, Last_name, Phone, Skill_1, department_id)
        VALUES (?, ?, ?, 'General', ?)
    `;

    db.query(query, [First_name, Last_name, Phone, departmentId], (err, result) => {
        if (err) {
            console.error('Error adding worker:', err);
            if (err.code === 'ER_DUP_ENTRY') {
                return res.status(400).json({ message: 'Worker with this phone number already exists.' });
            }
            return res.status(500).json({ message: 'Internal server error' });
        }

        res.status(201).json({
            message: 'Worker added successfully.',
            worker_id: result.insertId
        });
    });
};

const assignWorker = (req, res) => {
    const { worker_id, complaint_id } = req.body;
    const officialId = req.user.official_id;
    const departmentId = req.user.department_id;

    if (!worker_id || !complaint_id) {
        return res.status(400).json({ message: 'Worker ID and Complaint ID are required.' });
    }

    // First verify the worker belongs to this department
    const verifyQuery = 'SELECT worker_id FROM Worker WHERE worker_id = ? AND department_id = ?';

    db.query(verifyQuery, [worker_id, departmentId], (err, results) => {
        if (err) {
            console.error('Error verifying worker:', err);
            return res.status(500).json({ message: 'Internal server error' });
        }

        if (results.length === 0) {
            return res.status(404).json({ message: 'Worker not found in your department.' });
        }

        // Check if worker is already assigned to this complaint
        const checkAssignmentQuery = 'SELECT assignment_id FROM assignment WHERE worker_id = ? AND complaint_id = ? AND status = "in-progress"';

        db.query(checkAssignmentQuery, [worker_id, complaint_id], (err, assignmentResults) => {
            if (err) {
                console.error('Error checking assignment:', err);
                return res.status(500).json({ message: 'Internal server error' });
            }

            if (assignmentResults.length > 0) {
                return res.status(400).json({ message: 'Worker is already assigned to this complaint.' });
            }

            // Create assignment record
            const insertAssignmentQuery = 'INSERT INTO assignment (complaint_id, official_id, worker_id, status) VALUES (?, ?, ?, "in-progress")';

            db.query(insertAssignmentQuery, [complaint_id, officialId, worker_id], (err) => {
                if (err) {
                    console.error('Error creating assignment:', err);
                    return res.status(500).json({ message: 'Internal server error' });
                }

                // Update complaint status to 'in-progress'
                const updateComplaintQuery = 'UPDATE Complaint SET status = "in-progress" WHERE complaint_id = ?';

                db.query(updateComplaintQuery, [complaint_id], (err) => {
                    if (err) {
                        console.error('Error updating complaint status:', err);
                        return res.status(500).json({ message: 'Internal server error' });
                    }

                    res.status(200).json({
                        message: 'Worker assigned successfully and complaint status updated to in-progress.'
                    });
                });
            });
        });
    });
};

module.exports = { getWorkersForOfficial, addWorker, assignWorker };