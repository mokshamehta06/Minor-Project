const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
console.log('Environment loaded:', {
    DB_HOST: process.env.DB_HOST,
    DB_USER: process.env.DB_USER,
    DB_NAME: process.env.DB_NAME,
    hasPassword: !!process.env.DB_PASSWORD
});
const app = require("./app");
const userRoutes = require("./routes/user.routes");
const db = require("./database/dbConnect");
const officialRoutes = require("./routes/official.routes");
const adminRoutes = require("./routes/admin.routes");

const PORT = process.env.PORT || 3000;

// API endpoints for departments and categories
app.get("/api/departments", (req, res) => {
    db.query('SELECT department_id, Name FROM Department', (err, results) => {
        if (err) {
            console.error('Error fetching departments:', err);
            return res.status(500).json({ error: 'Internal server error' });
        }
        res.json({ departments: results });
    });
});

app.get("/api/categories", (req, res) => {
    db.query('SELECT category_id, Name, department_id FROM category', (err, results) => {
        if (err) {
            console.error('Error fetching categories:', err);
            return res.status(500).json({ error: 'Internal server error' });
        }
        res.json({ categories: results });
    });
});

// Complaints routes
const complaintsRoutes = require("./routes/complaints.routes");
app.use("/complaints", complaintsRoutes);

// Chat/AI routes
const chatRoutes = require("./routes/chat.routes");
app.use("/api/chat", chatRoutes);

app.use("/user", userRoutes);
app.use("/official", officialRoutes);
app.use("/admin", adminRoutes);

// Global error handler for unhandled routes
app.use((req, res) => {
    res.status(404).json({ error: 'Route not found' });
});

// Global error handler middleware (must be last)
app.use((err, req, res, next) => {
    console.error('\n❌ ========== GLOBAL ERROR HANDLER ==========');
    console.error('❌ Unhandled Error:', err);
    console.error('❌ Error Type:', err.constructor.name);
    console.error('❌ Error Message:', err.message);
    console.error('❌ Error Stack:', err.stack);
    console.error('❌ Request URL:', req.url);
    console.error('❌ Request Method:', req.method);
    console.error('❌ ===========================================\n');

    res.status(err.status || 500).json({
        error: err.message || 'Internal server error',
        errorHi: 'आंतरिक सर्वर त्रुटि',
        success: false,
        details: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
    console.error('\n❌ ========== UNCAUGHT EXCEPTION ==========');
    console.error('❌ Error:', err);
    console.error('❌ Stack:', err.stack);
    console.error('❌ =========================================\n');
    // Don't exit in production, but log the error
    if (process.env.NODE_ENV === 'development') {
        process.exit(1);
    }
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
    console.error('\n❌ ========== UNHANDLED REJECTION ==========');
    console.error('❌ Reason:', reason);
    console.error('❌ Promise:', promise);
    console.error('❌ ==========================================\n');
    // Don't exit, but log the error
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
    console.log('✅ Global error handlers registered');
    console.log('✅ Uncaught exception handler registered');
    console.log('✅ Unhandled rejection handler registered');
});