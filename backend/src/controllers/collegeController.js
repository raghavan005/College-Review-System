const mongoose = require('mongoose');
const College = require('../models/College');
const Review = require('../models/Review');

/**
 * @route   GET /api/colleges
 * @desc    Get all colleges with aggregated avgRating and reviewCount
 * @access  Public
 */
const getColleges = async (req, res, next) => {
  try {
    const colleges = await College.aggregate([
      {
        $lookup: {
          from: 'reviews',
          localField: '_id',
          foreignField: 'college',
          as: 'reviews',
        },
      },
      {
        $addFields: {
          avgRating: {
            $cond: {
              if: { $gt: [{ $size: '$reviews' }, 0] },
              then: { $round: [{ $avg: '$reviews.rating' }, 1] },
              else: null,
            },
          },
          reviewCount: { $size: '$reviews' },
        },
      },
      {
        $project: { reviews: 0 },
      },
      {
        $sort: { createdAt: -1 },
      },
    ]);

    // Populate createdBy manually after aggregation
    await College.populate(colleges, { path: 'createdBy', select: 'name email' });

    return res.status(200).json({
      success: true,
      data: colleges,
      pagination: {
        total: colleges.length,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/colleges/:id
 * @desc    Get a single college with aggregated stats
 * @access  Public
 */
const getCollege = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid college ID.' });
    }

    const result = await College.aggregate([
      { $match: { _id: new mongoose.Types.ObjectId(id) } },
      {
        $lookup: {
          from: 'reviews',
          localField: '_id',
          foreignField: 'college',
          as: 'reviews',
        },
      },
      {
        $addFields: {
          avgRating: {
            $cond: {
              if: { $gt: [{ $size: '$reviews' }, 0] },
              then: { $round: [{ $avg: '$reviews.rating' }, 1] },
              else: null,
            },
          },
          reviewCount: { $size: '$reviews' },
        },
      },
      { $project: { reviews: 0 } },
    ]);

    if (!result || result.length === 0) {
      return res.status(404).json({ success: false, message: 'College not found.' });
    }

    const college = result[0];
    await College.populate(college, { path: 'createdBy', select: 'name email' });

    return res.status(200).json({ success: true, data: college });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/colleges
 * @desc    Create a new college
 * @access  Admin only
 */
const createCollege = async (req, res, next) => {
  try {
    const { name, location, description, website, established } = req.body;

    const college = await College.create({
      name,
      location,
      description,
      website,
      established,
      createdBy: req.user.id,
    });

    await college.populate('createdBy', 'name email');

    return res.status(201).json({ success: true, data: college });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'A college with that name already exists.',
      });
    }
    next(error);
  }
};

/**
 * @route   PUT /api/colleges/:id
 * @desc    Update a college
 * @access  Admin only
 */
const updateCollege = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid college ID.' });
    }

    const college = await College.findByIdAndUpdate(
      id,
      { $set: req.body },
      { new: true, runValidators: true }
    ).populate('createdBy', 'name email');

    if (!college) {
      return res.status(404).json({ success: false, message: 'College not found.' });
    }

    return res.status(200).json({ success: true, data: college });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'A college with that name already exists.',
      });
    }
    next(error);
  }
};

/**
 * @route   DELETE /api/colleges/:id
 * @desc    Delete a college and its reviews
 * @access  Admin only
 */
const deleteCollege = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid college ID.' });
    }

    const college = await College.findByIdAndDelete(id);

    if (!college) {
      return res.status(404).json({ success: false, message: 'College not found.' });
    }

    // Cascade delete reviews
    await Review.deleteMany({ college: id });

    return res.status(200).json({
      success: true,
      message: 'College and associated reviews deleted successfully.',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getColleges, getCollege, createCollege, updateCollege, deleteCollege };
