const prisma = require('../utils/prisma');

const getStores = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', sortBy = 'name', sortOrder = 'asc' } = req.query;
    const userId = req.user?.userId; // Requester's user ID to identify "My Rating"

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Filters: Search by store name or address
    const where = {};
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { address: { contains: search, mode: 'insensitive' } }
      ];
    }

    // Fetch stores
    // Since we need to calculate average rating and "My Rating", we include the ratings relation
    const [stores, total] = await prisma.$transaction([
      prisma.store.findMany({
        where,
        include: {
          ratings: {
            select: {
              rating: true,
              userId: true
            }
          },
          owner: {
            select: {
              name: true,
              email: true
            }
          }
        }
      }),
      prisma.store.count({ where })
    ]);

    // Process stores to calculate averageRating and myRating
    let processedStores = stores.map(store => {
      const ratingCount = store.ratings.length;
      const sum = store.ratings.reduce((acc, curr) => acc + curr.rating, 0);
      const averageRating = ratingCount > 0 ? parseFloat((sum / ratingCount).toFixed(2)) : 0;
      
      const myRatingObj = userId ? store.ratings.find(r => r.userId === userId) : null;
      const myRating = myRatingObj ? myRatingObj.rating : null;

      // Extract only required info
      return {
        id: store.id,
        name: store.name,
        email: store.email,
        address: store.address,
        ownerId: store.ownerId,
        ownerName: store.owner.name,
        ownerEmail: store.owner.email,
        averageRating,
        totalRatings: ratingCount,
        myRating
      };
    });

    // In-memory sorting for averageRating or normal fields
    const safeSortOrder = ['asc', 'desc'].includes(sortOrder.toLowerCase()) ? sortOrder.toLowerCase() : 'asc';
    const multiplier = safeSortOrder === 'asc' ? 1 : -1;

    processedStores.sort((a, b) => {
      if (sortBy === 'averageRating') {
        return (a.averageRating - b.averageRating) * multiplier;
      }
      if (sortBy === 'totalRatings') {
        return (a.totalRatings - b.totalRatings) * multiplier;
      }
      
      const valA = (a[sortBy] || '').toString().toLowerCase();
      const valB = (b[sortBy] || '').toString().toLowerCase();
      if (valA < valB) return -1 * multiplier;
      if (valA > valB) return 1 * multiplier;
      return 0;
    });

    // Paginate in memory after sorting (since we computed averageRating which can't be ordered easily in Prisma direct query without native SQL group queries)
    const paginatedStores = processedStores.slice(skip, skip + limitNum);

    res.json({
      data: paginatedStores,
      meta: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    console.error('getStores error:', error);
    res.status(500).json({ error: 'Failed to retrieve stores.' });
  }
};

const getStoreById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.userId;

    const store = await prisma.store.findUnique({
      where: { id },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        ratings: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          }
        }
      }
    });

    if (!store) {
      return res.status(404).json({ error: 'Store not found.' });
    }

    const ratingCount = store.ratings.length;
    const sum = store.ratings.reduce((acc, curr) => acc + curr.rating, 0);
    const averageRating = ratingCount > 0 ? parseFloat((sum / ratingCount).toFixed(2)) : 0;
    
    const myRatingObj = userId ? store.ratings.find(r => r.userId === userId) : null;
    const myRating = myRatingObj ? myRatingObj.rating : null;

    res.json({
      id: store.id,
      name: store.name,
      email: store.email,
      address: store.address,
      owner: store.owner,
      averageRating,
      totalRatings: ratingCount,
      myRating,
      ratings: store.ratings.map(r => ({
        id: r.id,
        rating: r.rating,
        createdAt: r.createdAt,
        user: r.user
      }))
    });
  } catch (error) {
    console.error('getStoreById error:', error);
    res.status(500).json({ error: 'Failed to retrieve store details.' });
  }
};

const createStore = async (req, res) => {
  try {
    const { name, email, address, ownerId } = req.body;

    if (!name || !email || !address || !ownerId) {
      return res.status(400).json({ error: 'All fields (name, email, address, ownerId) are required.' });
    }

    // Verify owner exists and has STORE_OWNER role
    const owner = await prisma.user.findUnique({ where: { id: ownerId } });
    if (!owner) {
      return res.status(404).json({ error: 'Store owner not found.' });
    }
    if (owner.role !== 'STORE_OWNER') {
      return res.status(400).json({ error: 'Selected user is not registered as a Store Owner.' });
    }

    // Check if store email is already in use
    const existingStore = await prisma.store.findUnique({ where: { email } });
    if (existingStore) {
      return res.status(400).json({ error: 'A store with this email already exists.' });
    }

    const newStore = await prisma.store.create({
      data: {
        name,
        email,
        address,
        ownerId
      },
      include: {
        owner: {
          select: {
            name: true,
            email: true
          }
        }
      }
    });

    res.status(201).json(newStore);
  } catch (error) {
    console.error('createStore error:', error);
    res.status(500).json({ error: 'Failed to create store.' });
  }
};

const updateStore = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, address, ownerId } = req.body;

    const store = await prisma.store.findUnique({ where: { id } });
    if (!store) {
      return res.status(404).json({ error: 'Store not found.' });
    }

    // Permission check: Admin can update any store. Store Owners can only update their own stores.
    if (req.user.role !== 'ADMIN' && (req.user.role !== 'STORE_OWNER' || store.ownerId !== req.user.userId)) {
      return res.status(403).json({ error: 'Access denied.' });
    }

    const updateData = {};
    if (name) updateData.name = name;
    if (address) updateData.address = address;
    
    if (email) {
      const existingEmail = await prisma.store.findUnique({ where: { email } });
      if (existingEmail && existingEmail.id !== id) {
        return res.status(400).json({ error: 'Store email is already in use by another store.' });
      }
      updateData.email = email;
    }

    if (ownerId) {
      if (req.user.role !== 'ADMIN') {
        return res.status(403).json({ error: 'Only administrators can reassign store ownership.' });
      }
      const owner = await prisma.user.findUnique({ where: { id: ownerId } });
      if (!owner) {
        return res.status(404).json({ error: 'Store owner not found.' });
      }
      if (owner.role !== 'STORE_OWNER') {
        return res.status(400).json({ error: 'Selected user is not registered as a Store Owner.' });
      }
      updateData.ownerId = ownerId;
    }

    const updatedStore = await prisma.store.update({
      where: { id },
      data: updateData,
      include: {
        owner: {
          select: {
            name: true,
            email: true
          }
        }
      }
    });

    res.json(updatedStore);
  } catch (error) {
    console.error('updateStore error:', error);
    res.status(500).json({ error: 'Failed to update store.' });
  }
};

const deleteStore = async (req, res) => {
  try {
    const { id } = req.params;

    const store = await prisma.store.findUnique({ where: { id } });
    if (!store) {
      return res.status(404).json({ error: 'Store not found.' });
    }

    // Permission check: Admin can delete any store. Store Owners can only delete their own stores.
    if (req.user.role !== 'ADMIN' && (req.user.role !== 'STORE_OWNER' || store.ownerId !== req.user.userId)) {
      return res.status(403).json({ error: 'Access denied.' });
    }

    await prisma.store.delete({ where: { id } });
    res.json({ message: 'Store deleted successfully.' });
  } catch (error) {
    console.error('deleteStore error:', error);
    res.status(500).json({ error: 'Failed to delete store.' });
  }
};

module.exports = {
  getStores,
  getStoreById,
  createStore,
  updateStore,
  deleteStore
};
