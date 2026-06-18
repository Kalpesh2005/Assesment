const express = require('express');
const { register, login, logout, changePassword, refresh } = require('../controllers/authController');
const { authenticateToken } = require('../middlewares/auth');

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/logout', logout);
router.post('/refresh', refresh);
router.put('/change-password', authenticateToken, changePassword);

module.exports = router;
