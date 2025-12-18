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
    const complaintId = req.query.complaint_id || 0;

    // Query to get workers with their assignment status for this specific complaint
    const query = `
        SELECT
            w.worker_id,
            w.First_name,
            w.Last_name,
            w.Phone,
            CASE
                WHEN a_this.assignment_id IS NOT NULL THEN 'assigned'
                WHEN a_other.assignment_id IS NOT NULL THEN 'busy'
                ELSE 'available'
            END as assignment_status,
            a_this.assignment_id as this_assignment_id,
            a_this.complaint_id as this_complaint_id,
            a_other.assignment_id as other_assignment_id,
            a_other.complaint_id as other_complaint_id
        FROM Worker w
        LEFT JOIN assignment a_this ON w.worker_id = a_this.worker_id
            AND a_this.complaint_id = ?
            AND a_this.status = 'in-progress'
        LEFT JOIN assignment a_other ON w.worker_id = a_other.worker_id
            AND a_other.status = 'in-progress'
            AND a_other.complaint_id != ?
        WHERE w.department_id = ?
        ORDER BY assignment_status DESC, w.First_name ASC
    `;

    db.query(query, [complaintId, complaintId, departmentId], (err, results) => {
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

            // Check if worker has any other in-progress assignment (only one active assignment allowed)
            const checkActiveAssignment = 'SELECT assignment_id, complaint_id FROM assignment WHERE worker_id = ? AND status = "in-progress"';

            db.query(checkActiveAssignment, [worker_id], (err, activeResults) => {
                if (err) {
                    console.error('Error checking worker active assignment:', err);
                    return res.status(500).json({ message: 'Internal server error' });
                }

                if (activeResults.length > 0) {
                    // There is an active assignment (possibly to another complaint)
                    // Only allow assignment if the active assignment is the same complaint (already checked above) — otherwise reject
                    return res.status(400).json({ message: 'Worker already has an active assignment. A worker can only have one active task at a time.' });
                }
                // Proceed to create assignment

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
    });
};

const completeTask = (req, res) => {
    const { complaint_id } = req.body;
    const officialId = req.user.official_id;

    if (!complaint_id) {
        return res.status(400).json({ message: 'Complaint ID is required.' });
    }

    // Find the in-progress assignment for this complaint
    const findAssignQuery = 'SELECT assignment_id, worker_id FROM assignment WHERE complaint_id = ? AND status = "in-progress"';
    db.query(findAssignQuery, [complaint_id], (err, rows) => {
        if (err) {
            console.error('Error finding assignment for completion:', err);
            return res.status(500).json({ message: 'Internal server error' });
        }

        if (rows.length === 0) {
            return res.status(404).json({ message: 'No active assignment found for this complaint.' });
        }

        const assignmentId = rows[0].assignment_id;

        // Mark the assignment as done
        const updateAssignQuery = 'UPDATE assignment SET status = "done" WHERE assignment_id = ?';
        db.query(updateAssignQuery, [assignmentId], (err) => {
            if (err) {
                console.error('Error updating assignment status:', err);
                return res.status(500).json({ message: 'Internal server error' });
            }

            // Update complaint status
            const updateComplaintQuery = 'UPDATE Complaint SET status = "resolved" WHERE complaint_id = ?';
            db.query(updateComplaintQuery, [complaint_id], (err) => {
                if (err) {
                    console.error('Error updating complaint status:', err);
                    return res.status(500).json({ message: 'Internal server error' });
                }

                res.status(200).json({ message: 'Task completed, assignment marked done and complaint resolved.' });
            });
        });
    });
};

const rejectComplaint = async (req, res) => {
    const { complaint_id, reason } = req.body;
    const officialId = req.user.official_id;
    const departmentId = req.user.department_id;

    if (!complaint_id) {
        return res.status(400).json({ message: 'Complaint ID is required.' });
    }

    try {
        // Verify complaint exists and belongs to this department
        const [rows] = await db.promise().query('SELECT complaint_id, department_id, status FROM Complaint WHERE complaint_id = ?', [complaint_id]);
        if (!rows || rows.length === 0) {
            return res.status(404).json({ message: 'Complaint not found.' });
        }
        const complaint = rows[0];
        if (complaint.department_id && complaint.department_id !== departmentId) {
            return res.status(403).json({ message: 'You are not authorized to reject this complaint.' });
        }

        // Optional: Prevent rejecting already resolved/rejected complaints
        if (complaint.status === 'resolved') {
            return res.status(400).json({ message: 'Cannot reject a resolved complaint.' });
        }

        // Ensure rejection columns exist: rejection_reason, rejected_by, rejected_at
        try {
            const [colRows] = await db.promise().query(
                "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'Complaint' AND COLUMN_NAME IN ('rejection_reason','rejected_by','rejected_at')"
            );
            const existing = (colRows || []).map(r => r.COLUMN_NAME);
            const missing = [];
            if (!existing.includes('rejection_reason')) missing.push("ALTER TABLE Complaint ADD COLUMN rejection_reason TEXT NULL");
            if (!existing.includes('rejected_by')) missing.push("ALTER TABLE Complaint ADD COLUMN rejected_by BIGINT NULL");
            if (!existing.includes('rejected_at')) missing.push("ALTER TABLE Complaint ADD COLUMN rejected_at DATETIME NULL");

            for (const q of missing) {
                try {
                    await db.promise().query(q);
                } catch (alterErr) {
                    console.warn('Could not add column for rejection:', alterErr.message || alterErr);
                }
            }
        } catch (schemaErr) {
            console.warn('Error checking/creating rejection columns:', schemaErr.message || schemaErr);
        }

        // Update complaint to rejected
        const updateQuery = `UPDATE Complaint SET status = 'rejected', rejection_reason = ?, rejected_by = ?, rejected_at = NOW() WHERE complaint_id = ?`;
        await db.promise().query(updateQuery, [reason || null, officialId, complaint_id]);

        return res.status(200).json({ message: 'Complaint rejected successfully.' });
    } catch (err) {
        console.error('Error rejecting complaint:', err);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

module.exports = { getWorkersForOfficial, addWorker, assignWorker, completeTask, rejectComplaint };