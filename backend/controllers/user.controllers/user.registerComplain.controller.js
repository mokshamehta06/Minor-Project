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
      department_id: rawDepartmentId,
      latitude,
      longitude
    } = req.body || {};

    const rawHasFace = req.body && (req.body.hasFace || req.body.has_face || req.body.face) ;

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

    // --- Reverse Geocoding Logic ---
    let detectedCity = null;
    let detectedState = null;
    let detectedAddress = null;

    if (latitude && longitude) {
      try {
        const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`;
        console.log("Fetching location from:", url);
        // Using native fetch
        const geoRes = await fetch(url, {
          headers: {
            'User-Agent': 'MinorProjectApps/1.0' // important for Nominatim
          }
        });
        if (geoRes.ok) {
          const geoData = await geoRes.json();
          console.log("Nominatim Data:", geoData);
          detectedAddress = geoData.display_name;
          if (geoData.address) {
            detectedCity = geoData.address.city || geoData.address.town || geoData.address.village || geoData.address.hamlet;
            detectedState = geoData.address.state;
          }
        } else {
          console.error("Nominatim API error:", geoRes.statusText);
        }
      } catch (geoErr) {
        console.error("Error fetching reverse geocode:", geoErr);
      }
    }


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
        console.log("Attempting to use raw ID if provided...");
        // Fallback: if department is actually an ID? Logic below assumes names. 
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
          console.log("File status : ", req.file);
          console.log("*************");
          if (req.file) {
            const result = await uploadOnCloudinary(req.file);
            console.log('url : ', result.url);
            imageUrl = result.secure_url || result.url || null;
          }

          // Normalize hasFace flag
          const hasFaceFlag = (rawHasFace === 'true' || rawHasFace === '1' || rawHasFace === 1 || rawHasFace === true) ? 1 : 0;

          // Check if the Complaint table has a 'hasFace' column (so we insert only when present)
          let includeHasFace = false;
          try {
            const [colRows] = await db.promise().query(
              "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'Complaint' AND COLUMN_NAME = 'hasFace'"
            );
            includeHasFace = Array.isArray(colRows) && colRows.length > 0;
          } catch (colErr) {
            console.warn('Could not verify hasFace column existence:', colErr.message || colErr);
            includeHasFace = false;
          }

          // Build insert dynamically so missing DB columns don't break insertion
          const insertCols = ['user_id','category_id','department_id','description','status','imageUrl','Pincode','State','City','Address_Line','latitude','longitude','detected_city','detected_state','detected_address'];
          const insertPlaceholders = insertCols.map(() => '?');
          const insertValues = [userId, categoryId, departmentId, description, 'reported', imageUrl, Pincode, State, City, Address_Line, latitude || null, longitude || null, detectedCity, detectedState, detectedAddress];

          if (includeHasFace) {
            insertCols.push('hasFace');
            insertPlaceholders.push('?');
            insertValues.push(hasFaceFlag);
          }

          const insertQuery = `INSERT INTO Complaint (${insertCols.join(',')}) VALUES (${insertPlaceholders.join(',')})`;

          const [result] = await db.promise().query(insertQuery, insertValues);
          return res.status(201).json({ message: 'Complaint registered', complaintId: result.insertId, geotagged: !!(latitude && longitude), hasFace: includeHasFace ? !!hasFaceFlag : null });

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