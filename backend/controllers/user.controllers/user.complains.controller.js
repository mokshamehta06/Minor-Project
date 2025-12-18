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

// Ensure Worker_Rating table exists (safe to run on each server start)
const createWorkerRatingTableSQL = `
    CREATE TABLE IF NOT EXISTS Worker_Rating (
        rating_id BIGINT AUTO_INCREMENT PRIMARY KEY,
        assignment_id BIGINT UNIQUE,
        worker_id BIGINT,
        complaint_id BIGINT,
        rating TINYINT,
        review TEXT,
        confirmed TINYINT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
`;

db.query(createWorkerRatingTableSQL, (err) => {
    if (err) {
        console.error('Error ensuring Worker_Rating table exists:', err);
    } else {
        console.log('Worker_Rating table ensured');
    }
});
const trackUserComplain = (req, res) => {
    const userId = req.user.user_id; // Assuming user ID is stored in req.user after authentication
    console.log("----------------------");
    console.log(req.user.user_id);
    console.log("----------------------");

    // Database query to fetch complaints with assigned worker information
    const query = `
        SELECT
            c.*,
            w.worker_id,
            w.First_name as worker_first_name,
            w.Last_name as worker_last_name,
            w.Phone as worker_phone,
            a.assignment_id,
            a.assigned_date,
            a.status as assignment_status,
            wr.rating,
            wr.review,
            wr.confirmed as citizen_confirmed,
            c.rejection_reason,
            c.rejected_by,
            c.rejected_at
        FROM Complaint c
        LEFT JOIN assignment a ON c.complaint_id = a.complaint_id
        LEFT JOIN Worker w ON a.worker_id = w.worker_id
        LEFT JOIN Worker_Rating wr ON a.assignment_id = wr.assignment_id
        WHERE c.user_id = ?
        ORDER BY c.created_at DESC
    `;

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
// Endpoint to confirm completion and optionally set a flag (create or update Worker_Rating)
const confirmCompletion = (req, res) => {
    const userId = req.user.user_id;
    const { assignment_id, complaint_id, confirmed } = req.body;

    if (!assignment_id || !complaint_id) {
        return res.status(400).json({ message: 'assignment_id and complaint_id are required.' });
    }

    // Verify ownership: ensure complaint belongs to user
    const verifyQuery = 'SELECT complaint_id FROM Complaint WHERE complaint_id = ? AND user_id = ?';
    db.query(verifyQuery, [complaint_id, userId], (err, results) => {
        if (err) {
            console.error('Error verifying complaint ownership:', err);
            return res.status(500).json({ message: 'Internal server error' });
        }

        if (results.length === 0) {
            return res.status(403).json({ message: 'You are not authorized to confirm completion for this complaint.' });
        }

        // Insert or update Worker_Rating to mark confirmed = 1 if confirmed
        const upsertQuery = `INSERT INTO Worker_Rating (assignment_id, complaint_id, confirmed, created_at) VALUES (?, ?, ?, NOW()) ON DUPLICATE KEY UPDATE confirmed = VALUES(confirmed)`;
        db.query(upsertQuery, [assignment_id, complaint_id, confirmed ? 1 : 0], (err) => {
            if (err) {
                console.error('Error creating/updating confirmation record:', err);
                return res.status(500).json({ message: 'Internal server error' });
            }
            return res.status(200).json({ message: 'Confirmation recorded.' });
        });
    });
};

// Endpoint to submit rating for a worker (stores or updates Worker_Rating)
const rateWorker = (req, res) => {
    const userId = req.user.user_id;
    const { assignment_id, complaint_id, rating, review } = req.body;

    if (!assignment_id || !complaint_id || !rating) {
        return res.status(400).json({ message: 'assignment_id, complaint_id and rating are required.' });
    }

    // Validate rating
    const r = parseInt(rating, 10);
    if (!Number.isInteger(r) || r < 1 || r > 5) {
        return res.status(400).json({ message: 'Rating must be an integer between 1 and 5.' });
    }

    // Verify ownership
    const verifyQuery = 'SELECT c.complaint_id FROM Complaint c WHERE c.complaint_id = ? AND c.user_id = ?';
    db.query(verifyQuery, [complaint_id, userId], (err, results) => {
        if (err) {
            console.error('Error verifying complaint ownership for rating:', err);
            return res.status(500).json({ message: 'Internal server error' });
        }

        if (results.length === 0) {
            return res.status(403).json({ message: 'You are not authorized to rate this worker.' });
        }
        
        // Get worker id from assignment
        const getAssignmentQuery = 'SELECT worker_id FROM assignment WHERE assignment_id = ? AND complaint_id = ?';
        db.query(getAssignmentQuery, [assignment_id, complaint_id], (err, assignRows) => {
            if (err) {
                console.error('Error finding assignment for rating:', err);
                return res.status(500).json({ message: 'Internal server error' });
            }

            if (assignRows.length === 0) {
                return res.status(404).json({ message: 'Assignment not found.' });
            }

            const workerId = assignRows[0].worker_id;

            // Insert or update rating
            const upsertRating = `INSERT INTO Worker_Rating (assignment_id, worker_id, complaint_id, rating, review, created_at) VALUES (?, ?, ?, ?, ?, NOW()) ON DUPLICATE KEY UPDATE rating = VALUES(rating), review = VALUES(review), updated_at = NOW()`;
            db.query(upsertRating, [assignment_id, workerId, complaint_id, r, review || null], (err) => {
                if (err) {
                    console.error('Error inserting/updating worker rating:', err);
                    return res.status(500).json({ message: 'Internal server error' });
                }

                return res.status(200).json({ message: 'Rating submitted. Thank you!' });
            });
        });
    });
};
module.exports = { trackUserComplain, confirmCompletion, rateWorker };