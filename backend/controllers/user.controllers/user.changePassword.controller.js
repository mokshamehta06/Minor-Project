const changePassword = (req, res) => {
    const { oldPassword, newPassword } = req.body;
    const userId = req.user.user_id;

    const db = require('../../database/dbConnect');
    db.query('SELECT password FROM User WHERE user_id = ?', [userId], (err, results) => {
        if (err) {
            console.error('Error fetching user from database:', err);
            return res.status(500).json({ error: 'Database error while fetching user.' });
        }   
        if (results.length === 0) {
            return res.status(404).json({ error: 'User not found.' });
        }
        const currentPassword = results[0].password;
        bcrypt.compare(oldPassword, currentPassword, (err, isMatch) => {
            if (err) {
                console.error('Error comparing passwords:', err);
                return res.status(500).json({ error: 'Internal server error' });
            }
            if (!isMatch) {
                return res.status(400).json({ error: 'Old password is incorrect.' });
            }
            bcrypt.hash(newPassword, 10, (err, hashedPassword) => {
                if (err) {
                    console.error('Error hashing new password:', err);
                    return res.status(500).json({ error: 'Internal server error' });
                }
                db.query('UPDATE User SET password = ? WHERE user_id = ?', [hashedPassword, userId], (err, result) => {
                    if (err) {
                        console.error('Error updating password in database:', err);
                        return res.status(500).json({ error: 'Database error while updating password.' });
                    }
                    res.status(200).json({ message: 'Password changed successfully.' });    
                });
            });
        });
    });
};
module.exports = { changePassword };