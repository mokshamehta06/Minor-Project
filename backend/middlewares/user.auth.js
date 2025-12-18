const jwt = require('jsonwebtoken');
const db = require('../database/dbConnect');
const isAuthenticated = (req, res, next) => {
    const token = req.cookies.token;
    console.log('🔐 Auth check - Token present:', !!token);

    if (!token) {
        console.log('❌ No token found in cookies');
        return res.status(401).json({ error: 'Authentication token is missing.' });
    }
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        console.log('✅ JWT decoded successfully:', { userId: decoded.userId });
        const user_id = decoded.userId;

        db.query('SELECT * FROM User WHERE user_id = ?', [user_id], (err, results) => {
            if (err) {
                console.error('❌ Database error fetching user:', err);
                return res.status(500).json({ error: 'Database error while fetching user.' });
            }
            if (results.length === 0) {
                console.error('❌ User not found in database for user_id:', user_id);
                return res.status(404).json({ error: 'User not found.' });
            }
            console.log('✅ User authenticated:', results[0].First_name, results[0].Last_name);
            req.user = results[0];
            next();
        });
    } catch (error) {
        console.error('❌ JWT verification failed:', error.message);
        return res.status(401).json({ error: 'Invalid authentication token.' });
    }
}
module.exports = { isAuthenticated };