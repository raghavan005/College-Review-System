const express = require('express');
const router = express.Router();
const {
  getColleges,
  getCollege,
  createCollege,
  updateCollege,
  deleteCollege,
} = require('../controllers/collegeController');
const protect = require('../middleware/auth');
const authorize = require('../middleware/role');
const validate = require('../middleware/validate');
const { createCollegeSchema, updateCollegeSchema } = require('../validations/collegeValidation');

/**
 * @swagger
 * tags:
 *   name: Colleges
 *   description: College management endpoints
 */

/**
 * @swagger
 * /api/colleges:
 *   get:
 *     summary: Get all colleges with aggregated ratings
 *     tags: [Colleges]
 *     responses:
 *       200:
 *         description: List of colleges
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/College'
 */
router.get('/', getColleges);

/**
 * @swagger
 * /api/colleges/{id}:
 *   get:
 *     summary: Get a single college by ID
 *     tags: [Colleges]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: College details
 *       404:
 *         description: College not found
 */
router.get('/:id', getCollege);

/**
 * @swagger
 * /api/colleges:
 *   post:
 *     summary: Create a new college (admin only)
 *     tags: [Colleges]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CollegeInput'
 *     responses:
 *       201:
 *         description: College created
 *       400:
 *         description: Validation error
 *       403:
 *         description: Forbidden
 */
router.post('/', protect, authorize('admin'), validate(createCollegeSchema), createCollege);

/**
 * @swagger
 * /api/colleges/{id}:
 *   put:
 *     summary: Update a college (admin only)
 *     tags: [Colleges]
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
 *             $ref: '#/components/schemas/CollegeInput'
 *     responses:
 *       200:
 *         description: College updated
 *       403:
 *         description: Forbidden
 *       404:
 *         description: College not found
 */
router.put('/:id', protect, authorize('admin'), validate(updateCollegeSchema), updateCollege);

/**
 * @swagger
 * /api/colleges/{id}:
 *   delete:
 *     summary: Delete a college (admin only)
 *     tags: [Colleges]
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
 *         description: College deleted
 *       403:
 *         description: Forbidden
 *       404:
 *         description: College not found
 */
router.delete('/:id', protect, authorize('admin'), deleteCollege);

module.exports = router;
