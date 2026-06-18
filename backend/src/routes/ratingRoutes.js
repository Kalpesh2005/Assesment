const express = require('express');
const { submitRating, updateRating, getRatingsByStore } = require('../controllers/ratingController');
const { authenticateToken, authorizeRoles } = require('../middlewares/auth');

const router = express.Router();

router.use(authenticateToken);

router.post('/', authorizeRoles('USER'), submitRating);
router.put('/:id', authorizeRoles('USER'), updateRating);
router.get('/store/:storeId', getRatingsByStore);

module.exports = router;
