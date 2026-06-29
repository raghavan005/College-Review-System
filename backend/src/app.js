const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('../swagger');

const authRoutes = require('./routes/auth');
const collegeRoutes = require('./routes/colleges');
const reviewRoutes = require('./routes/reviews');

const app = express();

// --- Security & Utility Middleware ---
app.use(helmet());
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:4173',
  'http://localhost:3000',
  // Netlify — set ALLOWED_ORIGIN=https://your-site.netlify.app in production env
  ...(process.env.ALLOWED_ORIGIN ? [process.env.ALLOWED_ORIGIN] : []),
];
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (curl, Postman, server-to-server)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    callback(new Error(`CORS: origin ${origin} not allowed`));
  },
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// --- Rate Limiting ---
const isProd = process.env.NODE_ENV === 'production';
const limiter = rateLimit({
  // Keep strict limits in production, relaxed limits in local/dev work.
  windowMs: isProd ? 15 * 60 * 1000 : 60 * 1000,
  max: isProd ? 100 : 2000,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: isProd
      ? 'Too many requests from this IP, please try again after 15 minutes.'
      : 'Too many requests from this IP, please try again shortly.',
  },
});
app.use('/api', limiter);

// --- API Documentation ---
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, { explorer: true }));

// --- Routes ---
app.use('/api/auth', authRoutes);
app.use('/api/colleges', collegeRoutes);
app.use('/api/reviews', reviewRoutes);

// --- Health Check ---
app.get('/api/health', (req, res) => {
  res.status(200).json({ success: true, message: 'Server is running.', timestamp: new Date() });
});

// --- 404 Handler ---
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.originalUrl} not found.`,
  });
});

// --- Global Error Handler ---
app.use((err, req, res, next) => {
  console.error(err.stack || err);

  // Mongoose validation errors
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map((e) => e.message);
    return res.status(400).json({ success: false, message: 'Validation failed.', errors });
  }

  // Mongoose cast error (bad ObjectId)
  if (err.name === 'CastError') {
    return res.status(400).json({ success: false, message: `Invalid ${err.path}: ${err.value}` });
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    return res.status(409).json({
      success: false,
      message: `Duplicate value for field: ${field}.`,
    });
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({ success: false, message: 'Invalid token.' });
  }
  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({ success: false, message: 'Token expired.' });
  }

  const statusCode = err.statusCode || err.status || 500;
  res.status(statusCode).json({
    success: false,
    message: err.message || 'Internal Server Error',
    errors: err.errors || [],
  });
});

module.exports = app;
