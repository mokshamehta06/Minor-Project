const express = require('express');
const router = express.Router();
const { isAuthenticated } = require('../middlewares/user.auth');
const { getMyComplaints } = require('../controllers/complaints.controllers/complaints.getMyComplaints.controller');

// Route to get user's own complaints
router.get('/my-complaints', isAuthenticated, getMyComplaints);

module.exports = router;

