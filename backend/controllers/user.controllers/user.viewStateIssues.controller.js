const db = require('../../database/dbConnect');
const viewStateIssues = (req, res) => {
    const userState = req.user.State; // Assuming user State is stored in req.user after authentication

    // Database query to fetch state issues for the user
    const query = 'SELECT * FROM Complaint WHERE State = ? ';
    db.query(query, [userState], (err, results) => {
        if (err) {
            console.error('Error fetching state issues:', err);
            return res.status(500).json({ message: 'Internal server error' });
        }
        console.log(results);
        return res.status(200).json({ stateIssues: results });
    });
};
module.exports = { viewStateIssues };