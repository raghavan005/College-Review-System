const express = require('express');
const router = express.Router();
const {
  getReviews,
  getReview,
  createReview,
  updateReview,
  deleteReview,
  getDashboardStats,
} = require('../controllers/reviewController');
const protect = require('../middleware/auth');
const validate = require('../middleware/validate');
const { createReviewSchema, updateReviewSchema } = require('../validations/reviewValidation');

/**
 * @swagger
 * tags:
 *   name: Reviews
 *   description: College review endpoints
 */

/**
 * @swagger
 * /api/reviews:
 *   get:
 *     summary: Get all reviews with pagination and filtering
 *     tags: [Reviews]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *       - in: query
 *         name: college
 *         schema:
 *           type: string
 *         description: Filter by college ID
 *       - in: query
 *         name: rating
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 5
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search in title and body
 *     responses:
 *       200:
 *         description: Paginated list of reviews
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PaginatedReviews'
 */
router.get('/', getReviews);

/**
 * @swagger
 * /api/reviews/stats/dashboard:
 *   get:
 *     summary: Dashboard aggregation stats
 *     tags: [Reviews]
 *     responses:
 *       200:
 *         description: Rating distribution and reviews-over-time data
 */
router.get('/stats/dashboard', getDashboardStats);

/**
 * @swagger
 * /api/reviews/{id}:
 *   get:
 *     summary: Get a single review by ID
 *     tags: [Reviews]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Review details
 *       404:
 *         description: Review not found
 */
router.get('/:id', getReview);

/**
 * @swagger
 * /api/reviews:
 *   post:
 *     summary: Create a review (authenticated users, one per college)
 *     tags: [Reviews]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ReviewInput'
 *     responses:
 *       201:
 *         description: Review created
 *       400:
 *         description: Validation error
 *       401:
 *         description: Not authenticated
 *       409:
 *         description: Already reviewed this college
 */
router.post('/', protect, validate(createReviewSchema), createReview);

/**
 * @swagger
 * /api/reviews/{id}:
 *   put:
 *     summary: Update a review (owner or admin)
 *     tags: [Reviews]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ReviewUpdateInput'
 *     responses:
 *       200:
 *         description: Review updated
 *       403:
 *         description: Not authorized
 *       404:
 *         description: Review not found
 */
router.put('/:id', protect, validate(updateReviewSchema), updateReview);

/**
 * @swagger
 * /api/reviews/{id}:
 *   delete:
 *     summary: Delete a review (owner or admin)
 *     tags: [Reviews]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Review deleted
 *       403:
 *         description: Not authorized
 *       404:
 *         description: Review not found
 */
router.delete('/:id', protect, deleteReview);

module.exports = router;
