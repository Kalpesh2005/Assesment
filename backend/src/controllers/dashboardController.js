const prisma = require('../utils/prisma');

const getAdminDashboard = async (req, res) => {
  try {
    const totalUsers = await prisma.user.count();
    const totalStores = await prisma.store.count();
    const totalRatings = await prisma.rating.count();

    // Fetch quick stats by role
    const adminCount = await prisma.user.count({ where: { role: 'ADMIN' } });
    const userCount = await prisma.user.count({ where: { role: 'USER' } });
    const storeOwnerCount = await prisma.user.count({ where: { role: 'STORE_OWNER' } });

    res.json({
      totalUsers,
      totalStores,
      totalRatings,
      roleCounts: {
        admin: adminCount,
        user: userCount,
        storeOwner: storeOwnerCount
      }
    });
  } catch (error) {
    console.error('getAdminDashboard error:', error);
    res.status(500).json({ error: 'Failed to retrieve admin dashboard stats.' });
  }
};

const getStoreOwnerDashboard = async (req, res) => {
  try {
    const ownerId = req.user.userId;

    // Fetch stores owned by this store owner
    const stores = await prisma.store.findMany({
      where: { ownerId },
      include: {
        ratings: {
          include: {
            user: {
              select: {
                name: true,
                email: true
              }
            }
          }
        }
      }
    });

    // Compile reviews list and calculate average ratings
    let totalReviews = 0;
    let sumRatings = 0;
    const reviewsList = [];

    stores.forEach(store => {
      totalReviews += store.ratings.length;
      store.ratings.forEach(rating => {
        sumRatings += rating.rating;
        reviewsList.push({
          id: rating.id,
          storeId: store.id,
          storeName: store.name,
          userName: rating.user.name,
          userEmail: rating.user.email,
          rating: rating.rating,
          date: rating.createdAt
        });
      });
    });

    const averageRating = totalReviews > 0 ? parseFloat((sumRatings / totalReviews).toFixed(2)) : 0;

    // Sort reviews list by date desc
    reviewsList.sort((a, b) => new Date(b.date) - new Date(a.date));

    res.json({
      averageRating,
      totalReviews,
      storesCount: stores.length,
      reviews: reviewsList
    });
  } catch (error) {
    console.error('getStoreOwnerDashboard error:', error);
    res.status(500).json({ error: 'Failed to retrieve store owner dashboard stats.' });
  }
};

module.exports = {
  getAdminDashboard,
  getStoreOwnerDashboard
};
