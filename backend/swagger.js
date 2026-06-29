const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'College Review API',
      version: '1.0.0',
      description:
        'A production-ready REST API for reviewing colleges. Supports user authentication, college management, and review CRUD with role-based access control.',
      contact: {
        name: 'API Support',
        email: 'support@collegereview.com',
      },
    },
    servers: [
      {
        url: 'http://localhost:5000',
        description: 'Development server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      schemas: {
        AuthResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            token: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIs...' },
            user: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                name: { type: 'string' },
                email: { type: 'string' },
                role: { type: 'string', enum: ['admin', 'teacher', 'student'] },
                createdAt: { type: 'string', format: 'date-time' },
              },
            },
          },
        },
        College: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            name: { type: 'string' },
            location: { type: 'string' },
            description: { type: 'string' },
            website: { type: 'string' },
            established: { type: 'integer' },
            avgRating: { type: 'number', nullable: true },
            reviewCount: { type: 'integer' },
            createdBy: { type: 'object' },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        CollegeInput: {
          type: 'object',
          required: ['name', 'location'],
          properties: {
            name: { type: 'string', example: 'MIT' },
            location: { type: 'string', example: 'Cambridge, MA' },
            description: { type: 'string' },
            website: { type: 'string', example: 'https://mit.edu' },
            established: { type: 'integer', example: 1861 },
          },
        },
        Review: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            college: { type: 'object' },
            author: { type: 'object' },
            rating: { type: 'integer', minimum: 1, maximum: 5 },
            title: { type: 'string' },
            body: { type: 'string' },
            role: { type: 'string' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        ReviewInput: {
          type: 'object',
          required: ['college', 'rating', 'title', 'body'],
          properties: {
            college: { type: 'string', description: 'College ObjectId' },
            rating: { type: 'integer', minimum: 1, maximum: 5, example: 4 },
            title: { type: 'string', minLength: 3, example: 'Great campus' },
            body: {
              type: 'string',
              minLength: 10,
              example: 'The facilities and faculty are excellent.',
            },
          },
        },
        ReviewUpdateInput: {
          type: 'object',
          properties: {
            rating: { type: 'integer', minimum: 1, maximum: 5 },
            title: { type: 'string', minLength: 3 },
            body: { type: 'string', minLength: 10 },
          },
        },
        PaginatedReviews: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'array',
              items: { $ref: '#/components/schemas/Review' },
            },
            pagination: {
              type: 'object',
              properties: {
                page: { type: 'integer' },
                limit: { type: 'integer' },
                total: { type: 'integer' },
                pages: { type: 'integer' },
              },
            },
          },
        },
        ErrorResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            message: { type: 'string' },
            errors: { type: 'array', items: { type: 'string' } },
          },
        },
      },
    },
  },
  apis: ['./src/routes/*.js'],
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;
