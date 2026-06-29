const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema(
  {
    college: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'College',
      required: [true, 'College is required'],
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Author is required'],
    },
    rating: {
      type: Number,
      required: [true, 'Rating is required'],
      min: [1, 'Rating must be at least 1'],
      max: [5, 'Rating cannot exceed 5'],
    },
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      minlength: [3, 'Title must be at least 3 characters'],
    },
    body: {
      type: String,
      required: [true, 'Body is required'],
      trim: true,
      minlength: [10, 'Body must be at least 10 characters'],
    },
    role: {
      type: String,
      enum: ['admin', 'teacher', 'student'],
    },
  },
  {
    timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' },
  }
);

// Compound index: one review per user per college
reviewSchema.index({ college: 1, author: 1 }, { unique: true });

// Text index for search query optimization on title and body
reviewSchema.index({ title: 'text', body: 'text' });

module.exports = mongoose.model('Review', reviewSchema);
