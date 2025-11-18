// in this file i have to set the login credentials for admin and put it in cookies
// is this not possible to verify admin on the basis of process.env.ADMIN_USERNAME and process.env.ADMIN_PASSWORD and put login credentials in cookies
// after login successfull i am not able to access register official page unless i manually set the cookies in browser

// const isAdminAuthenticated = (req, res, next) => {
//     const adminToken = req.cookies.adminToken;
//     if (!adminToken) {
//         return res.status(401).json({ error: 'Admin authentication token is missing.' });
//     }
//     if (adminToken !== 'someSecureToken') {
//         return res.status(401).json({ error: 'Invalid admin authentication token.' });
//     }
//     next();
// };

// on printing adminToken it is coming to be undefined even after setting it in cookies
const loginAdmin = (req, res) => {
    const { username, password } = req.body;

    console.log('Login attempt:');
    console.log('Received username:', username);
    console.log('Received password:', password);
    console.log('Expected username:', process.env.ADMIN_USERNAME);
    console.log('Expected password:', process.env.ADMIN_PASSWORD);
    console.log('Username match:', username === process.env.ADMIN_USERNAME);
    console.log('Password match:', password === process.env.ADMIN_PASSWORD);

    if (username === process.env.ADMIN_USERNAME && password === process.env.ADMIN_PASSWORD) {
        // Set a cookie to indicate admin is logged in
        res.cookie('adminToken', 'someSecureToken', { httpOnly: true});
        console.log('Admin login successful!');
        return res.status(200).json({ message: 'Admin logged in successfully' });
    } else {
        console.log('Admin login failed - credentials do not match');
        return res.status(401).json({ error: 'Invalid admin credentials' });
    }
};

module.exports = { loginAdmin };