const prisma = require('../utils/prisma');

const submitRating = async (req, res) => {
  try {
    const { storeId, rating } = req.body;
    const userId = req.user.userId;

    // Validate that user is USER role
    if (req.user.role !== 'USER') {
      return res.status(403).json({ error: 'Only normal users can submit store ratings.' });
    }

    if (!storeId || rating === undefined) {
      return res.status(400).json({ error: 'Store ID and rating value are required.' });
    }

    const ratingVal = parseInt(rating);
    if (isNaN(ratingVal) || ratingVal < 1 || ratingVal > 5) {
      return res.status(400).json({ error: 'Rating must be an integer between 1 and 5.' });
    }

    // Verify store exists
    const store = await prisma.store.findUnique({ where: { id: storeId } });
    if (!store) {
      return res.status(404).json({ error: 'Store not found.' });
    }

    // Check if user already rated this store
    const existingRating = await prisma.rating.findUnique({
      where: {
        userId_storeId: {
          userId,
          storeId
        }
      }
    });

    if (existingRating) {
      return res.status(400).json({ error: 'You have already rated this store. Please update your existing rating instead.' });
    }

    // Create rating
    const newRating = await prisma.rating.create({
      data: {
        userId,
        storeId,
        rating: ratingVal
      },
      include: {
        store: {
          select: { name: true }
        }
      }
    });

    res.status(201).json(newRating);
  } catch (error) {
    console.error('submitRating error:', error);
    res.status(500).json({ error: 'Failed to submit rating.' });
  }
};

const updateRating = async (req, res) => {
  try {
    const { id } = req.params;
    const { rating } = req.body;
    const userId = req.user.userId;

    if (req.user.role !== 'USER') {
      return res.status(403).json({ error: 'Only normal users can update ratings.' });
    }

    if (rating === undefined) {
      return res.status(400).json({ error: 'Rating value is required.' });
    }

    const ratingVal = parseInt(rating);
    if (isNaN(ratingVal) || ratingVal < 1 || ratingVal > 5) {
      return res.status(400).json({ error: 'Rating must be an integer between 1 and 5.' });
    }

    // Check if rating exists and belongs to the user
    const existingRating = await prisma.rating.findUnique({ where: { id } });
    if (!existingRating) {
      return res.status(404).json({ error: 'Rating not found.' });
    }

    if (existingRating.userId !== userId) {
      return res.status(403).json({ error: 'Access denied. You cannot edit another user\'s rating.' });
    }

    // Update rating
    const updatedRating = await prisma.rating.update({
      where: { id },
      data: { rating: ratingVal },
      include: {
        store: {
          select: { name: true }
        }
      }
    });

    res.json(updatedRating);
  } catch (error) {
    console.error('updateRating error:', error);
    res.status(500).json({ error: 'Failed to update rating.' });
  }
};

const getRatingsByStore = async (req, res) => {
  try {
    const { storeId } = req.params;

    const ratings = await prisma.rating.findMany({
      where: { storeId },
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
    });

    res.json(ratings);
  } catch (error) {
    console.error('getRatingsByStore error:', error);
    res.status(500).json({ error: 'Failed to retrieve ratings for the store.' });
  }
};

module.exports = {
  submitRating,
  updateRating,
  getRatingsByStore
};
