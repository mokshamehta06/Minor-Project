const express = require('express');
const router = express.Router();
const db = require('../database/dbConnect');
const { registerUser } = require('../controllers/user.controllers/user.register.controller');
const { loginUser } = require('../controllers/user.controllers/user.login.controller');
const {isAuthenticated} = require('../middlewares/user.auth');
const { getUserProfile } = require('../controllers/user.controllers/user.profile.controller');
const { registerUserComplain } = require('../controllers/user.controllers/user.registerComplain.controller');
const { trackUserComplain } = require('../controllers/user.controllers/user.complains.controller');
const {viewLocalIssues} = require('../controllers/user.controllers/user.viewLocalIssues.controller');
const {viewCityIssues} = require('../controllers/user.controllers/user.viewCityIssues.controller');
const {viewStateIssues} = require('../controllers/user.controllers/user.viewStateIssues.controller');


router.post('/register', registerUser);
router.get('/register', (req, res) => {
    res.render('user/user.register.ejs');
});
router.get('/login', (req, res) => {
    res.render('user/user.login.ejs');
});
router.post('/login',loginUser);
router.get('/profile/:id', isAuthenticated,getUserProfile);
router.post('/registerComplain', isAuthenticated,registerUserComplain);
router.get('/trackComplain', isAuthenticated,trackUserComplain);
router.get('/viewLocalIssues', isAuthenticated, viewLocalIssues);
router.get('/viewCityIssues', isAuthenticated, viewCityIssues);
router.get('/viewStateIssues', isAuthenticated, viewStateIssues);
router.post('/logout', (req, res) => { 
  console.log();
  res.clearCookie('token', {
    httpOnly: true,
    secure: true,
    sameSite: 'Strict'
  });
  return res.status(200).json({ message: 'Logged out successfully' });
});

module.exports = router;