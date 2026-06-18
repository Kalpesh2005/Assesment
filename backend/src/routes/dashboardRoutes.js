const express = require('express');
const { getAdminDashboard, getStoreOwnerDashboard } = require('../controllers/dashboardController');
const { authenticateToken, authorizeRoles } = require('../middlewares/auth');

const router = express.Router();

router.use(authenticateToken);

router.get('/admin', authorizeRoles('ADMIN'), getAdminDashboard);
router.get('/store-owner', authorizeRoles('STORE_OWNER'), getStoreOwnerDashboard);

module.exports = router;
