const db = require('../../database/dbConnect');
const viewCityIssues = (req, res) => {
    const userCity = req.user.City; // Assuming user City is stored in req.user after authentication

    // Database query to fetch city issues for the user
    const query = 'SELECT * FROM Complaint WHERE City = ? ';
    db.query(query, [userCity], (err, results) => {
        if (err) {
            console.error('Error fetching city issues:', err);
            return res.status(500).json({ message: 'Internal server error' });
        }
        console.log(results);
        return res.status(200).json({ cityIssues: results });
    });
};
module.exports = { viewCityIssues };