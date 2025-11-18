const db = require('../../database/dbConnect');

const viewLocalIssues = (req, res) => {
    const userPincode = req.user.Pincode; // Assuming user Pincode is stored in req.user after authentication

    // Database query to fetch local issues for the user
    const query = 'SELECT * FROM Complaint WHERE Pincode = ? ';
    db.query(query, [userPincode], (err, results) => {
        if (err) {
            console.error('Error fetching local issues:', err);
            return res.status(500).json({ message: 'Internal server error' });
        }
        console.log(results);
        return res.status(200).json({ localIssues: results });
    });
};
module.exports = { viewLocalIssues };