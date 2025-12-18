const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const loginUser = async (req, res) => {
   const { Email, Password } = req.body;
   if (!Email || !Password) {
       return res.status(400).json({ error: 'Email and Password are required.' });
   }
   try {
    const db = require('../../database/dbConnect');
       const query = `SELECT user_id, First_name, Last_name, Email, Phone, Pincode, State, City, Address_Line, Password_hash FROM User WHERE Email = ?`;
       const values = [Email];
       console.log(Email);
       console.log(Password);
       db.query(query, values, async (err, results) => {
           if (err) {
               console.error('Error logging in user:', err);
               return res.status(500).json({ error: 'Database error while logging in user.' });
           }
           if (results.length === 0) {
               return res.status(401).json({ error: 'Invalid email or password.' });
           }
           console.log(results[0]);
           const isPasswordValid = await bcrypt.compare(Password, results[0].Password_hash);
           if (!isPasswordValid) {
               return res.status(401).json({ error: 'Invalid email or password.' });
           }
           const token = jwt.sign({ userId: results[0].user_id }, process.env.JWT_SECRET, { expiresIn: '1h' });
           res.cookie('token', token, { httpOnly: true, secure: false });
           res.status(200).json({ message: 'Login successful.', user: results[0], token });
       });
   } catch (error) {
       console.error('Unexpected error:', error);
       res.status(500).json({ error: 'Unexpected server error.' });
   }


}


module.exports = { loginUser };