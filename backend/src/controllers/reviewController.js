const mongoose = require('mongoose');
const Review = require('../models/Review');
const College = require('../models/College');

/**
 * @route   GET /api/reviews
 * @desc    Get all reviews with pagination, search and filters
 * @access  Public
 */
const getReviews = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 10));
    const skip = (page - 1) * limit;

    // Build filter query
    const filter = {};

    if (req.query.college) {
      if (!mongoose.Types.ObjectId.isValid(req.query.college)) {
        return res.status(400).json({ success: false, message: 'Invalid college ID.' });
      }
      filter.college = req.query.college;
    }

    if (req.query.rating) {
      const rating = parseInt(req.query.rating);
      if (isNaN(rating) || rating < 1 || rating > 5) {
        return res.status(400).json({ success: false, message: 'Rating filter must be between 1 and 5.' });
      }
      filter.rating = rating;
    }

    if (req.query.search) {
      const regex = new RegExp(req.query.search, 'i');
      filter.$or = [{ title: regex }, { body: regex }];
    }

    const [reviews, total] = await Promise.all([
      Review.find(filter)
        .populate('college', 'name location')
        .populate('author', 'name role')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Review.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      data: reviews,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/reviews/:id
 * @desc    Get a single review
 * @access  Public
 */
const getReview = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid review ID.' });
    }

    const review = await Review.findById(id)
      .populate('college', 'name location')
      .populate('author', 'name role');

    if (!review) {
      return res.status(404).json({ success: false, message: 'Review not found.' });
    }

    return res.status(200).json({ success: true, data: review });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/reviews
 * @desc    Create a review (one per user per college)
 * @access  Authenticated
 */
const createReview = async (req, res, next) => {
  try {
    const { college, rating, title, body } = req.body;

    // Check college exists
    const collegeDoc = await College.findById(college);
    if (!collegeDoc) {
      return res.status(404).json({ success: false, message: 'College not found.' });
    }

    // Check for duplicate review
    const existing = await Review.findOne({ college, author: req.user.id });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'You have already reviewed this college.',
      });
    }

    const review = await Review.create({
      college,
      author: req.user.id,
      rating,
      title,
      body,
      role: req.user.role,
    });

    await review.populate([
      { path: 'college', select: 'name location' },
      { path: 'author', select: 'name role' },
    ]);

    return res.status(201).json({ success: true, data: review });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'You have already reviewed this college.',
      });
    }
    next(error);
  }
};

/**
 * @route   PUT /api/reviews/:id
 * @desc    Update own review (or admin)
 * @access  Authenticated (owner or admin)
 */
const updateReview = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid review ID.' });
    }

    const review = await Review.findById(id);
    if (!review) {
      return res.status(404).json({ success: false, message: 'Review not found.' });
    }

    // Only the author or an admin can update
    const isOwner = review.author.toString() === req.user.id;
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to update this review.',
      });
    }

    const allowed = ['rating', 'title', 'body'];
    allowed.forEach((field) => {
      if (req.body[field] !== undefined) {
        review[field] = req.body[field];
      }
    });

    await review.save();
    await review.populate([
      { path: 'college', select: 'name location' },
      { path: 'author', select: 'name role' },
    ]);

    return res.status(200).json({ success: true, data: review });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   DELETE /api/reviews/:id
 * @desc    Delete own review (or admin)
 * @access  Authenticated (owner or admin)
 */
const deleteReview = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid review ID.' });
    }

    const review = await Review.findById(id);
    if (!review) {
      return res.status(404).json({ success: false, message: 'Review not found.' });
    }

    const isOwner = review.author.toString() === req.user.id;
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to delete this review.',
      });
    }

    await review.deleteOne();

    return res.status(200).json({
      success: true,
      message: 'Review deleted successfully.',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/reviews/stats/dashboard
 * @desc    Aggregated dashboard stats (rating distribution, reviews over time)
 * @access  Public
 */
const getDashboardStats = async (req, res, next) => {
  try {
    const [ratingBuckets, monthlyCounts, overall] = await Promise.all([
      Review.aggregate([
        { $group: { _id: '$rating', count: { $sum: 1 } } },
        { $sort: { _id: -1 } },
      ]),
      Review.aggregate([
        {
          $group: {
            _id: {
              year: { $year: '$createdAt' },
              month: { $month: '$createdAt' },
            },
            reviews: { $sum: 1 },
          },
        },
        { $sort: { '_id.year': 1, '_id.month': 1 } },
        { $limit: 12 },
      ]),
      Review.aggregate([
        {
          $group: {
            _id: null,
            avgRating: { $avg: '$rating' },
            totalReviews: { $sum: 1 },
          },
        },
      ]),
    ]);

    const ratingMap = Object.fromEntries(ratingBuckets.map((b) => [b._id, b.count]));
    const ratingDistribution = [5, 4, 3, 2, 1].map((stars) => ({
      name: stars === 1 ? '1 Star' : `${stars} Stars`,
      value: ratingMap[stars] ?? 0,
    }));

    const monthLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const reviewsOverTime = monthlyCounts.map((entry) => ({
      month: monthLabels[entry._id.month - 1],
      reviews: entry.reviews,
    }));

    const summary = overall[0] ?? { avgRating: null, totalReviews: 0 };

    return res.status(200).json({
      success: true,
      data: {
        ratingDistribution,
        reviewsOverTime,
        avgRating: summary.avgRating != null ? Math.round(summary.avgRating * 10) / 10 : null,
        totalReviews: summary.totalReviews,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getReviews,
  getReview,
  createReview,
  updateReview,
  deleteReview,
  getDashboardStats,
};
