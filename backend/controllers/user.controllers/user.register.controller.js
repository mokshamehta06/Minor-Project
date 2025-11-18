const bcrypt = require('bcrypt');
const registerUser = async (req, res) => {
    const {
        First_name,
        Last_name,
        Email,
        Phone,
        Password,
        Pincode,
        State,
        City,
        Address_Line
    } = req.body;
    if (!First_name || !Last_name || !Email || !Phone || !Password || !Pincode || !State || !City) {
        return res.status(400).json({ error: 'All fields except Address_Line are required.' });
    }
    try {
        const Password_hash = await bcrypt.hash(Password, 10);
        const db = require('../../database/dbConnect');
        const query = `insert into User(First_name,Last_name,Email,Phone,Password_hash,Pincode,State,City,Address_Line) values(?,?,?,?,?,?,?,?,?)`;
        const values = [First_name,Last_name,Email,Phone,Password_hash,Pincode,State,City,Address_Line || null];
        db.query(query,values,(err,result)=>{
            if(err)
            {
                console.error('Error registering user:', err);
                return res.status(500).json({error:'Database error while registering user.'});
        
            }
            console.log('User registered with ID:', result.insertId);
            res.status(201).json({ message: 'User registered successfully.', userId : result.insertId });
        })
    } catch (error) {
        console.error('Unexpected error:', error);
        res.status(500).json({ error: 'Unexpected server error.' });
    }

};

module.exports = { registerUser };