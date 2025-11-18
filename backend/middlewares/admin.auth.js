// we are taking admin data from process.env and verifying it here

// const db = require('../../database/dbConnect');
// require('dotenv').config();

// const loginAdmin = (req, res) => {
//     const { username, password } = req.body;

//     if (username === process.env.ADMIN_USERNAME && password === process.env.ADMIN_PASSWORD) {
//         // Set a cookie to indicate admin is logged in
//         res.cookie('adminToken', 'someSecureToken', { httpOnly: true, secure: process.env.NODE_ENV === 'production' });
//         return res.status(200).json({ message: 'Admin logged in successfully' });
//     } else {
//         return res.status(401).json({ error: 'Invalid admin credentials' });
//     }
// };

// above is the login logic for admin

// adminToken is coming to be undefined even after setting it in cookies

const isAdminAuthenticated = (req, res, next) => {
    const adminToken = req.cookies.adminToken;
    if (!adminToken) {
        return res.status(401).json({ error: 'Admin authentication token is missing.' });
    }
    if (adminToken !== 'someSecureToken') {
        return res.status(401).json({ error: 'Invalid admin authentication token.' });
    }
    next();
};

module.exports = { isAdminAuthenticated };