const bcrypt = require('bcryptjs');
const prisma = require('../utils/prisma');

const PASSWORD_REGEX = /^(?=.*[A-Z])(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,16}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const getUsers = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', role, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Building filter query
    const where = {};

    if (role && ['ADMIN', 'USER', 'STORE_OWNER'].includes(role.toUpperCase())) {
      where.role = role.toUpperCase();
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { address: { contains: search, mode: 'insensitive' } }
      ];
    }

    // Determine safe sort field
    const allowedSortFields = ['name', 'email', 'role', 'createdAt', 'updatedAt'];
    const safeSortBy = allowedSortFields.includes(sortBy) ? sortBy : 'createdAt';
    const safeSortOrder = ['asc', 'desc'].includes(sortOrder.toLowerCase()) ? sortOrder.toLowerCase() : 'desc';

    const [users, total] = await prisma.$transaction([
      prisma.user.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { [safeSortBy]: safeSortOrder },
        select: {
          id: true,
          name: true,
          email: true,
          address: true,
          role: true,
          createdAt: true,
          updatedAt: true
        }
      }),
      prisma.user.count({ where })
    ]);

    res.json({
      data: users,
      meta: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    console.error('getUsers error:', error);
    res.status(500).json({ error: 'Failed to retrieve users.' });
  }
};

const getUserById = async (req, res) => {
  try {
    const { id } = req.params;

    // Permissions: Admin can access any profile. Users can only access their own profile.
    if (req.user.role !== 'ADMIN' && req.user.userId !== id) {
      return res.status(403).json({ error: 'Access denied.' });
    }

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        address: true,
        role: true,
        createdAt: true,
        updatedAt: true
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    // If user is a Store Owner, fetch their stores and average ratings
    let storeInfo = null;
    if (user.role === 'STORE_OWNER') {
      const stores = await prisma.store.findMany({
        where: { ownerId: user.id },
        include: {
          ratings: {
            select: { rating: true }
          }
        }
      });

      storeInfo = stores.map(store => {
        const ratingCount = store.ratings.length;
        const sum = store.ratings.reduce((acc, curr) => acc + curr.rating, 0);
        const averageRating = ratingCount > 0 ? parseFloat((sum / ratingCount).toFixed(2)) : 0;
        return {
          id: store.id,
          name: store.name,
          email: store.email,
          address: store.address,
          averageRating,
          totalRatings: ratingCount
        };
      });
    }

    res.json({
      ...user,
      stores: storeInfo
    });
  } catch (error) {
    console.error('getUserById error:', error);
    res.status(500).json({ error: 'Failed to retrieve user details.' });
  }
};

const createUser = async (req, res) => {
  try {
    const { name, email, address, password, role } = req.body;

    // Admin only check is handled by middleware, but validation rules apply
    if (!name || name.length < 20 || name.length > 60) {
      return res.status(400).json({ error: 'Name must be between 20 and 60 characters.' });
    }

    if (!email || !EMAIL_REGEX.test(email)) {
      return res.status(400).json({ error: 'Please enter a valid email address.' });
    }

    if (!address || address.length > 400) {
      return res.status(400).json({ error: 'Address must not exceed 400 characters.' });
    }

    if (!password || !PASSWORD_REGEX.test(password)) {
      return res.status(400).json({
        error: 'Password must be 8-16 characters long, containing at least one uppercase letter and one special character.'
      });
    }

    const targetRole = role && ['ADMIN', 'USER', 'STORE_OWNER'].includes(role) ? role : 'USER';

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: 'An account with this email already exists.' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        address,
        password: hashedPassword,
        role: targetRole
      },
      select: {
        id: true,
        name: true,
        email: true,
        address: true,
        role: true,
        createdAt: true
      }
    });

    res.status(201).json(newUser);
  } catch (error) {
    console.error('createUser error:', error);
    res.status(500).json({ error: 'Failed to create user.' });
  }
};

const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, address, role } = req.body;

    // Authorization: Admin can edit any user. Other roles can edit their own profiles.
    if (req.user.role !== 'ADMIN' && req.user.userId !== id) {
      return res.status(403).json({ error: 'Access denied.' });
    }

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    // Build update object and validate fields if provided
    const updateData = {};

    if (name !== undefined) {
      if (name.length < 20 || name.length > 60) {
        return res.status(400).json({ error: 'Name must be between 20 and 60 characters.' });
      }
      updateData.name = name;
    }

    if (email !== undefined) {
      if (!EMAIL_REGEX.test(email)) {
        return res.status(400).json({ error: 'Please enter a valid email address.' });
      }
      // Check if email already in use
      const emailUser = await prisma.user.findUnique({ where: { email } });
      if (emailUser && emailUser.id !== id) {
        return res.status(400).json({ error: 'Email is already in use by another user.' });
      }
      updateData.email = email;
    }

    if (address !== undefined) {
      if (address.length > 400) {
        return res.status(400).json({ error: 'Address must not exceed 400 characters.' });
      }
      updateData.address = address;
    }

    // Role can only be changed by Admin
    if (role !== undefined) {
      if (req.user.role !== 'ADMIN') {
        return res.status(403).json({ error: 'Only administrators can update user roles.' });
      }
      if (!['ADMIN', 'USER', 'STORE_OWNER'].includes(role)) {
        return res.status(400).json({ error: 'Invalid user role.' });
      }
      updateData.role = role;
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        address: true,
        role: true,
        updatedAt: true
      }
    });

    res.json(updatedUser);
  } catch (error) {
    console.error('updateUser error:', error);
    res.status(500).json({ error: 'Failed to update user.' });
  }
};

const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    // Prevent self-deletion of final admin
    if (req.user.userId === id) {
      return res.status(400).json({ error: 'You cannot delete your own account.' });
    }

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    await prisma.user.delete({ where: { id } });
    res.json({ message: 'User deleted successfully.' });
  } catch (error) {
    console.error('deleteUser error:', error);
    res.status(500).json({ error: 'Failed to delete user.' });
  }
};

module.exports = {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser
};
