const jwt = require('jsonwebtoken');
const db = require('../database/dbConnect');
const isAuthenticated = (req, res, next) => {
    const token = req.cookies.token;
    if (!token) {
        return res.status(401).json({ error: 'Authentication token is missing.' });
    }
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        console.log('Decoded JWT:', decoded);
        const user_id = decoded.userId;
        db.query('SELECT * FROM User WHERE user_id = ?', [user_id], (err, results) => {
            if (err) {
                console.error('Error fetching user from database:', err);
                return res.status(500).json({ error: 'Database error while fetching user.' });
            }
            if (results.length === 0) {
                return res.status(404).json({ error: 'User not found.' });
            }
            req.user = results[0];
            next();
        });
    } catch (error) {
        return res.status(401).json({ error: 'Invalid authentication token.' });
    }
}
module.exports = { isAuthenticated };