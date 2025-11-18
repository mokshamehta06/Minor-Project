const express = require('express');
const router = express.Router();
const db = require('../database/dbConnect');
const { registerOfficial } = require('../controllers/admin.controller/admin.registerOfficial.controller');
const { loginOfficial } = require('../controllers/official.controllers/official.login.controller');
const { isAuthenticated } = require('../middlewares/admin.auth');
const { getOfficialProfile } = require('../controllers/official.controllers/official.profile.controller');
const {isOfficialAuthenticated} = require('../middlewares/official.auth');
const {loginAdmin} = require('../controllers/admin.controller/admin.login.controller');
const {isAdminAuthenticated} = require('../middlewares/admin.auth');
const {getWorkersForOfficial} = require('../controllers/official.controllers/official.getWorkers.controller')
router.post('/register',isAdminAuthenticated, registerOfficial);
router.get('/register',isAdminAuthenticated, (req, res) => {
    res.render('official/official.register.ejs');
});
router.get('/login', (req, res) => {
    res.render('official/official.login.ejs');
});
router.get('/profile', isOfficialAuthenticated, (req, res) => {
    console.log('Official profile accessed:', req.user);
    res.render('official/official.profile.ejs');
});
router.get('/profile/data', isOfficialAuthenticated, getOfficialProfile);
router.post('/login', loginOfficial);
router.get('/getWorkers', isOfficialAuthenticated, getWorkersForOfficial);
module.exports = router;