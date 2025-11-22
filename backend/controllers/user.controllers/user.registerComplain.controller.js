const { uploadOnCloudinary } = require('../../utils/cloudinary');
const db = require('../../database/dbConnect');

const registerUserComplain = async (req, res) => {
  try {
    console.log('req.file:', req.file);
    console.log('req.body:', req.body);

    const userId = req.user && req.user.user_id;
    const {
      Pincode: rawPincode,
      State: rawState,
      description: rawDescription,
      City: rawCity,
      Address_Line: rawAddress,
      // accept either `category` or `category_id` and `department` or `department_id`
      category: rawCategory,
      department: rawDepartment,
      category_id: rawCategoryId,
      department_id: rawDepartmentId
    } = req.body || {};

    // trim inputs to avoid whitespace-only values
    const trim = v => (typeof v === 'string' ? v.trim() : v);
    const Pincode = trim(rawPincode);
    const State = trim(rawState);
    const description = trim(rawDescription);
    const City = trim(rawCity);
    const Address_Line = trim(rawAddress);

    // prefer explicit names, fallback to *_id fields (your client sends category_id/department_id as names)
    const category = trim(rawCategory || rawCategoryId);
    const department = trim(rawDepartment || rawDepartmentId);

    // Validation
    if (!Pincode || !State || !description || !City || !category || !department) {
      console.log("❌ Validation failed - Missing required fields", { Pincode, State, description, City, category, department });
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
      db.query(categoryQuery, [category, departmentId], async (err, catResult) => {
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

        try {
          let imageUrl = null;
            console.log("*************");
            console.log("File status : ",req.file);
            console.log("*************");
          if (req.file) {
            const result = await uploadOnCloudinary(req.file);
            //onsole.log("✅ Image uploaded to Cloudinary:", result).secure_url;
            console.log('url : ',result.url);
            imageUrl = result.secure_url || result.url || null;
          }

          const query = `INSERT INTO Complaint (user_id, category_id, department_id, description, status, imageUrl, Pincode, State, City, Address_Line)
                         VALUES (?, ?, ?, ?, 'reported', ?, ?, ?, ?, ?)`;
          db.query(query, [userId, categoryId, departmentId, description, imageUrl, Pincode, State, City, Address_Line], (err, results) => {
            if (err) {
              console.error('Insert complaint error', err);
              return res.status(500).json({ message: 'Internal server error' });
            }
            return res.status(201).json({ message: 'Complaint registered', complaintId: results.insertId });
          });
        } catch (err) {
          console.error(err);
          return res.status(500).json({ message: 'Upload or registration failed' });
        }
      });
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

module.exports = { registerUserComplain };


