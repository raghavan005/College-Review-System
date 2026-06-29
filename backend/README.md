# College Review API

 Users can register, browse colleges, and post reviews with role-based access control.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Runtime | Node.js 20 |
| Framework | Express.js 4 |
| Database | MongoDB 7 + Mongoose 8 |
| Auth | JWT (jsonwebtoken) + bcryptjs |
| Validation | Joi |
| Testing | Jest + Supertest + mongodb-memory-server |
| Docs | Swagger (swagger-jsdoc + swagger-ui-express) |
| Security | Helmet, CORS, express-rate-limit |
| Containerization | Docker + Docker Compose |

---

## Project Structure

```
backend/
  src/
    config/db.js          - MongoDB connection
    middleware/
      auth.js             - JWT verification, attaches req.user
      role.js             - authorize(...roles) RBAC factory
      validate.js         - Joi validation middleware
    models/
      User.js
      College.js
      Review.js
    routes/
      auth.js
      colleges.js
      reviews.js
    controllers/
      authController.js
      collegeController.js
      reviewController.js
    validations/
      authValidation.js
      collegeValidation.js
      reviewValidation.js
    app.js                - Express app, middleware, error handlers
  tests/
    auth.test.js
    reviews.test.js
  scripts/
    seed.js               - Database seeder
  swagger.js              - Swagger/OpenAPI spec
  server.js               - Entry point
  package.json
  .env.example
  Dockerfile
  docker-compose.yml
```

---

## Setup & Run

### Prerequisites

- Node.js 20+
- MongoDB running locally (or use Docker)

### Local Development

```bash
# 1. Navigate to backend directory
cd backend

# 2. Install dependencies
npm install

# 3. Copy and configure environment variables
cp .env.example .env
# Edit .env and set JWT_SECRET to a strong random string

# 4. Start MongoDB locally (if not running)
mongod

# 5. Seed the database with sample data
npm run seed

# 6. Start in development mode (with auto-reload)
npm run dev

# 7. Or start in production mode
npm start
```

The server starts on `http://localhost:5000`.

### Docker

> ⚠️ **Important:** `docker compose` reads `.env` from the **repository root** (not `backend/`).  
> You **must** create it before running `docker compose up`, otherwise the command will fail with  
> `env file .env not found`.

```bash
# 0. From the repository root — create the .env file FIRST
cp .env.example .env
# Open .env and set JWT_SECRET to a strong random string

# 1. Build and start all services
docker compose up -d --build

# 2. Seed the database (run once after first build)
#    Creates admin, teacher, student users + 8 colleges + 15 reviews
docker compose exec api node scripts/seed.js

# 3. Stop services
docker compose down

# 4. Stop and remove volumes (wipes DB data)
docker compose down -v
```

> 💡 **First time?** After `docker compose up`, always run the seed command before logging in.  
> Without it the database is empty and all logins will return 401.

**Services after `docker compose up`:**

| Service | URL |
|---------|-----|
| Frontend app | http://localhost:3000 |
| REST API | http://localhost:5000 |
| Swagger Docs | http://localhost:5000/api/docs |
| Health Check | http://localhost:5000/api/health |
| MongoDB | mongodb://localhost:27017 |

> The `.env.example` at the repo root uses `MONGODB_URI=mongodb://mongo:27017/college_review`  
> (`mongo` is the Docker service name). For local development without Docker, change it to `localhost`.

---

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `PORT` | No | `5000` | Server port |
| `MONGODB_URI` | Yes | - | MongoDB connection string |
| `JWT_SECRET` | Yes | - | Secret key for signing JWTs (use a long random string) |
| `JWT_EXPIRES_IN` | No | `7d` | JWT expiry (e.g., `1h`, `7d`, `30d`) |
| `NODE_ENV` | No | `development` | Environment (`development`, `production`, `test`) |

---

## API Endpoints

### Base URL: `http://localhost:5000`

### Authentication

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/register` | Public | Register a new user |
| POST | `/api/auth/login` | Public | Login and receive a JWT |

### Colleges

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/colleges` | Public | List all colleges with avg rating & review count |
| GET | `/api/colleges/:id` | Public | Get single college with aggregated stats |
| POST | `/api/colleges` | Admin | Create a new college |
| PUT | `/api/colleges/:id` | Admin | Update a college |
| DELETE | `/api/colleges/:id` | Admin | Delete a college (cascades to reviews) |

### Reviews

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/reviews` | Public | List all reviews (paginated, filterable) |
| GET | `/api/reviews/:id` | Public | Get a single review |
| POST | `/api/reviews` | Authenticated | Create a review (one per college per user) |
| PUT | `/api/reviews/:id` | Owner / Admin | Update a review |
| DELETE | `/api/reviews/:id` | Owner / Admin | Delete a review |

### Other

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Health check |
| GET | `/api/docs` | Swagger UI documentation |

---

## Query Parameters for `GET /api/reviews`

| Parameter | Type | Description |
|-----------|------|-------------|
| `page` | integer | Page number (default: 1) |
| `limit` | integer | Items per page (default: 10, max: 100) |
| `college` | string | Filter by college ObjectId |
| `rating` | integer (1-5) | Filter by exact rating |
| `search` | string | Search in title and body |

**Example:** `GET /api/reviews?page=1&limit=5&college=<id>&rating=4`

---

## Response Format

All endpoints return consistent JSON:

```jsonc
// Success (list)
{
  "success": true,
  "data": [...],
  "pagination": { "page": 1, "limit": 10, "total": 42, "pages": 5 }
}

// Success (single item)
{ "success": true, "data": { ... } }

// Auth success
{ "success": true, "token": "eyJ...", "user": { ... } }

// Error
{ "success": false, "message": "...", "errors": [] }
```

---

## Seeding

```bash
npm run seed
```

Creates:
- 1 admin user
- 2 teacher users
- 3 student users
- 5 colleges
- 15 reviews distributed across colleges and users

**Seed credentials:**

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@college.com | Admin@1234 |
| Teacher | alice@college.com | Teacher@1234 |
| Student | charlie@college.com | Student@1234 |

---

## Testing

Tests use `mongodb-memory-server` - no real database is needed.

```bash
npm test
```

**Test results:**

![Test Results](../frontend/public/test-result)

**Expected output:**

```
 PASS  tests/auth.test.js
  POST /api/auth/register
    PASS should register a new user successfully (xxx ms)
    PASS should return 409 for duplicate email (xxx ms)
    PASS should return 400 for missing name (xxx ms)
    PASS should return 400 for invalid email (xxx ms)
    PASS should return 400 for short password (xxx ms)
    PASS should register with a specific role (xxx ms)
  POST /api/auth/login
    PASS should login successfully with correct credentials (xxx ms)
    PASS should return 401 for wrong password (xxx ms)
    PASS should return 401 for non-existent email (xxx ms)
    PASS should return 400 for missing password (xxx ms)

 PASS  tests/reviews.test.js
  GET /api/reviews
    PASS should return paginated reviews (xxx ms)
    PASS should respect page and limit query params (xxx ms)
  POST /api/reviews
    PASS should return 401 when not authenticated (xxx ms)
    PASS should create a review when authenticated (xxx ms)
    PASS should return 409 when trying to review the same college twice (xxx ms)
    PASS should return 400 for invalid rating (xxx ms)
    PASS should return 400 for short body (xxx ms)
  PUT /api/reviews/:id
    PASS should update own review (xxx ms)
    PASS should return 403 when updating someone else's review (xxx ms)
    PASS should allow admin to update any review (xxx ms)
    PASS should return 401 without token (xxx ms)
  DELETE /api/reviews/:id
    PASS should delete own review (xxx ms)
    PASS should return 403 when deleting someone else's review (xxx ms)
    PASS should allow admin to delete any review (xxx ms)

Test Suites: 2 passed, 2 total
Tests:       24 passed, 24 total
```

---

## API Documentation (Swagger)

Interactive API documentation is available at:

```
http://localhost:5000/api/docs
```

Supports JWT auth via the "Authorize" button (enter `Bearer <your_token>`).

---

## Production Readiness Notes

* **Password Security** – Passwords are hashed with bcryptjs and never exposed in API responses.
* **Rate Limiting** – Limits API requests to prevent abuse and brute-force attacks.
* **Helmet** – Adds security headers to protect against common web vulnerabilities.
* **CORS** – Restricts API access to trusted origins in production.
* **JWT Authentication** – Uses expiring JSON Web Tokens for secure authentication.
* **MongoDB Aggregation** – Efficiently calculates college ratings and review statistics.
* **Compound Index** – Ensures each user can submit only one review per college.
* **Cascade Delete** – Automatically removes reviews when a college is deleted.
* **Graceful Shutdown** – Safely closes the server during shutdown or restarts.
* **Global Error Handler** – Returns consistent and structured error responses.
* **Health Check** – Provides a monitoring endpoint to verify API availability.
* **Production Ready** – Supports secure deployment with HTTPS, logging, and secrets management.

