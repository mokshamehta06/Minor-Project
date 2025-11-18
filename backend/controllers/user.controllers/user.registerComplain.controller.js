const db = require('../../database/dbConnect');
const registerUserComplain = (req, res) => {
    console.log("=== COMPLAINT REGISTRATION STARTED ===");
    console.log("Request Body:", req.body);
    console.log("User Object:", req.user);

    const userId = req.user.user_id;
    console.log("User ID:", userId);

    const { Pincode, State, description, City, imageUrl, category, department, Address_Line } = req.body;

    // Validation
    if (!Pincode || !State || !description || !City || !category || !department) {
        console.log("❌ Validation failed - Missing required fields");
        return res.status(400).json({ error: 'Pincode, State, City, description, category, and department are required.' });
    }

    console.log("✅ Validation passed");

    // Step 1: Get department_id from department name
    console.log("Step 1: Fetching department_id for:", department);
    const departmentQuery = 'SELECT department_id FROM Department WHERE Name = ?';
    db.query(departmentQuery, [department], (err, deptResult) => {
        if (err) {
            console.error('❌ Error fetching department ID:', err);
            return res.status(500).json({ error: 'Internal server error while fetching department' });
        }
        if (deptResult.length === 0) {
            console.log("❌ Department not found:", department);
            return res.status(400).json({ error: 'Invalid department name: ' + department });
        }

        const departmentId = deptResult[0].department_id;
        console.log("✅ Department ID found:", departmentId);

        // Step 2: Get category_id from category name and department_id
        console.log("Step 2: Fetching category_id for:", category, "in department:", departmentId);
        const categoryQuery = 'SELECT category_id FROM category WHERE Name = ? AND department_id = ?';
        db.query(categoryQuery, [category, departmentId], (err, catResult) => {
            if (err) {
                console.error('❌ Error fetching category ID:', err);
                return res.status(500).json({ error: 'Internal server error while fetching category' });
            }
            if (catResult.length === 0) {
                console.log("❌ Category not found:", category, "for department:", departmentId);
                return res.status(400).json({ error: 'Invalid category name for the given department' });
            }

            const categoryId = catResult[0].category_id;
            console.log("✅ Category ID found:", categoryId);

            // Step 3: Insert complaint with all the IDs
            console.log("Step 3: Inserting complaint into database");
            const insertQuery = 'INSERT INTO Complaint (user_id, category_id, department_id, description, Address_Line, Pincode, City, State, imageUrl) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)';
            const values = [userId, categoryId, departmentId, description, Address_Line || null, Pincode, City, State, imageUrl || null];
            console.log("Insert values:", values);

            db.query(insertQuery, values, (err, result) => {
                if (err) {
                    console.error('❌ Error registering complaint:', err);
                    return res.status(500).json({ error: 'Database error while registering complaint: ' + err.message });
                }console.log(result);
                console.log('✅ Complaint registered successfully with ID:', result.insertId);
                console.log("=== COMPLAINT REGISTRATION COMPLETED ===");
                res.status(201).json({
                    message: 'Complaint registered successfully.',
                    complaint: result
                });
            });
        });
    });
};

module.exports = { registerUserComplain };