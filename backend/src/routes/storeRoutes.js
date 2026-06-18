const express = require('express');
const { getStores, getStoreById, createStore, updateStore, deleteStore } = require('../controllers/storeController');
const { authenticateToken, authorizeRoles } = require('../middlewares/auth');

const router = express.Router();

router.use(authenticateToken);

router.get('/', getStores);
router.get('/:id', getStoreById);
router.post('/', authorizeRoles('ADMIN'), createStore);
router.put('/:id', authorizeRoles('ADMIN', 'STORE_OWNER'), updateStore);
router.delete('/:id', authorizeRoles('ADMIN', 'STORE_OWNER'), deleteStore);

module.exports = router;
