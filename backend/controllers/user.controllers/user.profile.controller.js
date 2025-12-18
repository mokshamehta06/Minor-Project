const db = require('../../database/dbConnect');
const getUserProfile = (req, res) => {
    const userId = req.params.id;
    const query = `SELECT user_id, First_name, Last_name, Email, Phone, Pincode, State, City, Address_Line FROM User WHERE user_id = ?`;
    const values = [userId];
    db.query(query, values, (err, results) => {
        if (err) {
            console.error('Error fetching user profile:', err);
            return res.status(500).json({ error: 'Database error while fetching user profile.' });
        }
        if (results.length === 0) {
            return res.status(404).json({ error: 'User not found.' });
        }
        console.log('User profile fetched:', results[0]);
        res.status(200);
        res.render('user/user.profile.ejs', { user: results[0] });
    });
};
module.exports = { getUserProfile };