const db = require('../../database/dbConnect');

const getMyComplaints = (req, res) => {
    const userId = req.user.user_id;
    
    console.log("Fetching complaints for user:", userId);
    
    // Query to fetch complaints with category name and department name
    const query = `
        SELECT 
            c.complaint_id,
            c.user_id,
            c.category_id,
            c.department_id,
            c.description,
            c.Address_Line,
            c.Pincode,
            c.City,
            c.State,
            c.imageUrl,
            c.status,
            c.created_at,
            c.updated_at,
            cat.Name as category_name,
            d.Name as department_name
        FROM Complaint c
        LEFT JOIN category cat ON c.category_id = cat.category_id
        LEFT JOIN Department d ON c.department_id = d.department_id
        WHERE c.user_id = ?
        ORDER BY c.created_at DESC
    `;
    
    db.query(query, [userId], (err, results) => {
        if (err) {
            console.error('Error fetching complaints:', err);
            return res.status(500).json({ 
                error: 'Internal server error',
                message: 'Failed to fetch complaints'
            });
        }
        
        console.log(`Found ${results.length} complaints for user ${userId}`);
        return res.status(200).json({ 
            complaints: results,
            count: results.length
        });
    });
};

module.exports = { getMyComplaints };

