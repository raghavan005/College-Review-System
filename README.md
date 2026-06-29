# College Review System (MERN)

Production-style College Review backend + frontend with role-based access.

## Deliverables Checklist

- Code: included in this repo
- README with setup/test steps: this file
- Docker Compose + `.env.example`: root `docker-compose.yml` and `.env.example`
- API Docs: Swagger at `/api/docs` (backend) and Postman Collection (`backend/college_review_postman.json`)
- Seed script: `backend/scripts/seed.js`
- Test results: `backend/tests/*.test.js` (Jest + Supertest)
- Production readiness note: see section below

## Tech Stack

- Backend: Node.js, Express.js, MongoDB, Mongoose
- Auth/Security: JWT, bcryptjs, Helmet, CORS, rate limiting
- Validation: Joi
- Testing: Jest + Supertest + mongodb-memory-server
- Docs: Swagger (OpenAPI)
- Frontend: React + TypeScript + Vite

## Project Structure

```text
.
├── Dockerfile                  # root Dockerfile for backend API image
├── docker-compose.yml          # root compose for Mongo + API
├── .env.example
├── backend/
│   ├── server.js
│   ├── src/
│   │   ├── app.js
│   │   ├── models/
│   │   ├── controllers/
│   │   ├── routes/
│   │   ├── validations/
│   │   └── middleware/
│   ├── scripts/seed.js
│   └── tests/
└── frontend/
```

## Setup & Run

### 1) Clone and configure env

```bash
git clone <your-repo-url>
cd College-Review-System
cp .env.example .env
```

Update `JWT_SECRET` in `.env`.

### 2) Start MongoDB + API with Docker

```bash
docker compose up -d --build
```

### 3) Install dependencies (for local scripts/tests)

```bash
cd backend
npm install
```

### 4) Seed sample data

```bash
npm run seed
```

### 5) Run backend locally (optional, dev mode)

```bash
npm run dev
```

### 6) Run tests

```bash
npm test
```

### 7) Frontend (optional local run)

```bash
cd ../frontend
npm install
npm run dev
```

## API Endpoints (Core)

- Auth:
  - `POST /api/auth/register`
  - `POST /api/auth/login`
- Colleges:
  - `GET /api/colleges`
  - `GET /api/colleges/:id`
  - `POST /api/colleges` (admin)
  - `PUT /api/colleges/:id` (admin)
  - `DELETE /api/colleges/:id` (admin)
- Reviews:
  - `GET /api/reviews` (pagination/search/filter)
  - `GET /api/reviews/:id`
  - `POST /api/reviews` (authenticated)
  - `PUT /api/reviews/:id` (owner/admin)
  - `DELETE /api/reviews/:id` (owner/admin)

Swagger docs: [http://localhost:5000/api/docs](http://localhost:5000/api/docs)

Postman Collection: Import [backend/college_review_postman.json](file:///home/raghavan/projects/College-Review-System/backend/college_review_postman.json) directly into Postman. It defines dynamic environment variables (`base_url`, `auth_token`, `college_id`, `review_id`) and automated test scripts to store JWT auth headers dynamically.

## Seed Credentials

- Admin: `admin@college.com` / `Admin@1234`
- Teacher: `alice@college.com` / `Teacher@1234`
- Student: `charlie@college.com` / `Student@1234`

## Test Coverage Output

Run:

```bash
cd backend
npm test
```

Current suite includes integration tests for:
- Auth register/login
- Colleges CRUD + role-based permissions
- Review CRUD + auth/authorization rules

## Production Readiness Note

- JWT auth with expiring tokens
- Password hashing via bcryptjs
- Role-based middleware for admin/teacher/student flows
- Joi validation and centralized error handling
- Aggregation for college `avgRating` and `reviewCount`
- One-review-per-user-per-college enforced with DB compound index
- Security middleware: Helmet, CORS, rate limiter
- Dockerized deployment path (Mongo + API)
- Swagger API documentation for integration/testing
