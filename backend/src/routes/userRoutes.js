const express = require('express');
const { getUsers, getUserById, createUser, updateUser, deleteUser } = require('../controllers/userController');
const { authenticateToken, authorizeRoles } = require('../middlewares/auth');

const router = express.Router();

router.use(authenticateToken);

router.get('/', authorizeRoles('ADMIN'), getUsers);
router.get('/:id', getUserById);
router.post('/', authorizeRoles('ADMIN'), createUser);
router.put('/:id', updateUser);
router.delete('/:id', authorizeRoles('ADMIN'), deleteUser);

module.exports = router;
