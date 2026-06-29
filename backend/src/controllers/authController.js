const jwt = require('jsonwebtoken');
const User = require('../models/User');

const signToken = (user) => {
  return jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

const toSafeUser = (user) => ({
  _id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  createdAt: user.createdAt,
});

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user
 * @access  Public
 */
const register = async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;

    // Check if email already exists
    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'An account with that email already exists.',
      });
    }

    const user = await User.create({ name, email, password, role });
    const token = signToken(user);

    return res.status(201).json({
      success: true,
      token,
      user: toSafeUser(user),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/auth/login
 * @desc    Login and return JWT
 * @access  Public
 */
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Fetch user with password (select:false by default)
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    const token = signToken(user);

    return res.status(200).json({
      success: true,
      token,
      user: toSafeUser(user),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/auth/me
 * @desc    Get current authenticated user
 * @access  Authenticated
 */
const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(401).json({ success: false, message: 'User not found.' });
    return res.status(200).json({ success: true, data: toSafeUser(user) });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/auth/users
 * @desc    List users (admin only)
 * @access  Admin
 */
const listUsers = async (req, res, next) => {
  try {
    const users = await User.find().sort({ createdAt: -1 });
    return res.status(200).json({ success: true, data: users.map(toSafeUser) });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/auth/users
 * @desc    Admin creates a user
 * @access  Admin
 */
const adminCreateUser = async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;
    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'An account with that email already exists.',
      });
    }

    const user = await User.create({ name, email, password, role });
    return res.status(201).json({ success: true, data: toSafeUser(user) });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   PUT /api/auth/users/:id
 * @desc    Admin updates a user
 * @access  Admin
 */
const adminUpdateUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id).select('+password');
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });

    if (req.body.email) user.email = req.body.email.toLowerCase();
    if (req.body.name) user.name = req.body.name;
    if (req.body.role) {
      // Prevent admin from accidentally removing their own admin role
      if (user._id.toString() === req.user.id && req.body.role !== 'admin') {
        return res.status(400).json({
          success: false,
          message: 'You cannot change your own role from admin.',
        });
      }
      user.role = req.body.role;
    }
    if (req.body.password) user.password = req.body.password;

    await user.save();
    return res.status(200).json({ success: true, data: toSafeUser(user) });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'An account with that email already exists.',
      });
    }
    next(error);
  }
};

/**
 * @route   DELETE /api/auth/users/:id
 * @desc    Admin deletes a user
 * @access  Admin
 */
const adminDeleteUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (id === req.user.id) {
      return res.status(400).json({
        success: false,
        message: 'You cannot delete your own account.',
      });
    }
    const user = await User.findByIdAndDelete(id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
    return res.status(200).json({ success: true, message: 'User deleted successfully.' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  getMe,
  listUsers,
  adminCreateUser,
  adminUpdateUser,
  adminDeleteUser,
};
