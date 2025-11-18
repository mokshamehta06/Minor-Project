// we are facing this error
// Database error during login: Error: You have an error in your SQL syntax; check the manual that corresponds to your MySQL server version for the right syntax to use near '' at line 1
//     at Packet.asError (/Users/mayanklovevanshi/Desktop/Minor_Project/backend/node_modules/mysql2/lib/packets/packet.js:740:17)
//     at Query.execute (/Users/mayanklovevanshi/Desktop/Minor_Project/backend/node_modules/mysql2/lib/commands/command.js:29:26)
//     at Connection.handlePacket (/Users/mayanklovevanshi/Desktop/Minor_Project/backend/node_modules/mysql2/lib/base/connection.js:477:34)
//     at PacketParser.onPacket (/Users/mayanklovevanshi/Desktop/Minor_Project/backend/node_modules/mysql2/lib/base/connection.js:93:12)
//     at PacketParser.executeStart (/Users/mayanklovevanshi/Desktop/Minor_Project/backend/node_modules/mysql2/lib/packet_parser.js:75:16)
//     at Socket.<anonymous> (/Users/mayanklovevanshi/Desktop/Minor_Project/backend/node_modules/mysql2/lib/base/connection.js:100:25)
//     at Socket.emit (node:events:519:28)
//     at addChunk (node:internal/streams/readable:559:12)
//     at readableAddChunkPushByteMode (node:internal/streams/readable:510:3)
//     at Readable.push (node:internal/streams/readable:390:5) {
//   code: 'ER_PARSE_ERROR',
//   errno: 1064,
//   sqlState: '42000',
//   sqlMessage: "You have an error in your SQL syntax; check the manual that corresponds to your MySQL server version for the right syntax to use near '' at line 1",
//   sql: 'SELECT * FROM Official WHERE Login_credentials = '
const db = require('../../database/dbConnect');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const loginOfficial = async (req, res) => {
   const { Login_credentials, Password } = req.body;
    console.log('=== OFFICIAL LOGIN ATTEMPT ===');
    console.log('Login_credentials:', Login_credentials);
    console.log('Password:', Password);
   if (!Login_credentials || !Password) {
       console.log('Missing credentials or password');
       return res.status(400).json({ error: 'Login credentials and Password are required.' });
   }

   try {
       const query = `SELECT official_id, First_name, Last_name, Email, Phone, department_id, Password_hash FROM Official WHERE Login_credentials = ?`;
       const values = [Login_credentials];
       console.log('Executing query:', query);
       console.log('With values:', values);

       db.query(query, values, async (err, results) => {
           if (err) {
               console.error('Error logging in official:', err);
               return res.status(500).json({ error: 'Database error while logging in official.' });
           }

           console.log('Query results:', results);
           console.log('Number of results:', results.length);

           if (results.length === 0) {
               console.log('No official found with these credentials');
               return res.status(401).json({ error: 'Invalid login credentials or password.' });
           }

           console.log('Found official:', results[0].First_name, results[0].Last_name);
           console.log('Stored password hash:', results[0].Password_hash);
           console.log('Comparing with password:', Password);

           const isPasswordValid = await bcrypt.compare(Password, results[0].Password_hash);
           console.log('Password valid?', isPasswordValid);

           if (!isPasswordValid) {
               console.log('Password does not match');
               return res.status(401).json({ error: 'Invalid login credentials or password.' });
           }

           const token = jwt.sign({ userId: results[0].official_id }, process.env.JWT_SECRET, { expiresIn: '1h' });
           console.log('Login successful! Token generated');
           res.cookie('token', token, { httpOnly: true});

           res.status(200).json({ message: 'Login successful.', official: results[0], token });
       });
   } catch (error) {
       console.error('Unexpected error:', error);
       res.status(500).json({ error: 'Unexpected server error.' });
   }
}

module.exports = { loginOfficial }; 