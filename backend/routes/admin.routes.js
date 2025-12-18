const express = require('express');
const router = express.Router();
const db = require('../database/dbConnect');
const { registerOfficial } = require('../controllers/admin.controller/admin.registerOfficial.controller');
const {loginAdmin} = require('../controllers/admin.controller/admin.login.controller');
const {isAdminAuthenticated} = require('../middlewares/admin.auth');
router.post('/register',isAdminAuthenticated, registerOfficial);
router.get('/register',isAdminAuthenticated, (req, res) => {
    res.render('official/official.register.ejs');
});
router.get('/login', (req, res) => {
    res.render('admin/admin.login.ejs');
});
router.post('/login', loginAdmin);
module.exports = router;