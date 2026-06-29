const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../src/app');
const User = require('../src/models/User');
const College = require('../src/models/College');

let mongoServer;

// Shared state across tests
let studentToken;
let otherStudentToken;
let adminToken;
let collegeId;
let reviewId;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);

  process.env.JWT_SECRET = 'test_secret_key';
  process.env.JWT_EXPIRES_IN = '7d';

  // Create users
  const studentRes = await request(app).post('/api/auth/register').send({
    name: 'Student One',
    email: 'student1@test.com',
    password: 'password123',
    role: 'student',
  });
  studentToken = studentRes.body.token;

  const otherStudentRes = await request(app).post('/api/auth/register').send({
    name: 'Student Two',
    email: 'student2@test.com',
    password: 'password123',
    role: 'student',
  });
  otherStudentToken = otherStudentRes.body.token;

  const adminRes = await request(app).post('/api/auth/register').send({
    name: 'Admin User',
    email: 'admin@test.com',
    password: 'password123',
    role: 'admin',
  });
  adminToken = adminRes.body.token;

  // Create a college using admin token
  const collegeRes = await request(app)
    .post('/api/colleges')
    .set('Authorization', `Bearer ${adminToken}`)
    .send({
      name: 'Test University',
      location: 'Test City, TC',
      description: 'A test university for integration tests',
    });
  collegeId = collegeRes.body.data._id;
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

describe('GET /api/reviews', () => {
  it('should return paginated reviews', async () => {
    const res = await request(app).get('/api/reviews');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.pagination).toBeDefined();
    expect(res.body.pagination).toHaveProperty('page');
    expect(res.body.pagination).toHaveProperty('limit');
    expect(res.body.pagination).toHaveProperty('total');
    expect(res.body.pagination).toHaveProperty('pages');
  });

  it('should respect page and limit query params', async () => {
    const res = await request(app).get('/api/reviews?page=1&limit=5');

    expect(res.status).toBe(200);
    expect(res.body.pagination.page).toBe(1);
    expect(res.body.pagination.limit).toBe(5);
  });
});

describe('POST /api/reviews', () => {
  const reviewData = {
    rating: 4,
    title: 'Great university',
    body: 'This university has excellent facilities and a vibrant campus life.',
  };

  it('should return 401 when not authenticated', async () => {
    const res = await request(app)
      .post('/api/reviews')
      .send({ ...reviewData, college: collegeId });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('should create a review when authenticated', async () => {
    const res = await request(app)
      .post('/api/reviews')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ ...reviewData, college: collegeId });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toBeDefined();
    expect(res.body.data.rating).toBe(4);
    expect(res.body.data.title).toBe(reviewData.title);
    expect(res.body.data.college).toBeDefined();
    expect(res.body.data.author).toBeDefined();

    // Save for later tests
    reviewId = res.body.data._id;
  });

  it('should return 409 when trying to review the same college twice', async () => {
    const res = await request(app)
      .post('/api/reviews')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ ...reviewData, college: collegeId });

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
  });

  it('should return 400 for invalid rating', async () => {
    const res = await request(app)
      .post('/api/reviews')
      .set('Authorization', `Bearer ${otherStudentToken}`)
      .send({ college: collegeId, rating: 10, title: 'Bad rating test', body: 'This should fail validation.' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('should return 400 for short body', async () => {
    const res = await request(app)
      .post('/api/reviews')
      .set('Authorization', `Bearer ${otherStudentToken}`)
      .send({ college: collegeId, rating: 3, title: 'Short body', body: 'Too short' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });
});

describe('PUT /api/reviews/:id', () => {
  it("should update own review", async () => {
    const res = await request(app)
      .put(`/api/reviews/${reviewId}`)
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ rating: 5, body: 'Updated: this university exceeded all my expectations!' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.rating).toBe(5);
  });

  it("should return 403 when updating someone else's review", async () => {
    const res = await request(app)
      .put(`/api/reviews/${reviewId}`)
      .set('Authorization', `Bearer ${otherStudentToken}`)
      .send({ rating: 1, body: 'Trying to hijack the review maliciously here!' });

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });

  it("should allow admin to update any review", async () => {
    const res = await request(app)
      .put(`/api/reviews/${reviewId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ title: 'Admin updated title' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('should return 401 without token', async () => {
    const res = await request(app)
      .put(`/api/reviews/${reviewId}`)
      .send({ rating: 2 });

    expect(res.status).toBe(401);
  });
});

describe('DELETE /api/reviews/:id', () => {
  let tempReviewId;

  beforeEach(async () => {
    // Create a fresh review by otherStudent for deletion tests
    const res = await request(app)
      .post('/api/reviews')
      .set('Authorization', `Bearer ${otherStudentToken}`)
      .send({
        college: collegeId,
        rating: 3,
        title: 'Temp review to delete',
        body: 'This review will be deleted in the test below.',
      });
    tempReviewId = res.body.data?._id;
  });

  afterEach(async () => {
    // Clean up any leftover temp reviews
    if (tempReviewId) {
      await request(app)
        .delete(`/api/reviews/${tempReviewId}`)
        .set('Authorization', `Bearer ${adminToken}`);
    }
  });

  it("should delete own review", async () => {
    const res = await request(app)
      .delete(`/api/reviews/${tempReviewId}`)
      .set('Authorization', `Bearer ${otherStudentToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    tempReviewId = null; // Already deleted
  });

  it("should return 403 when deleting someone else's review", async () => {
    const res = await request(app)
      .delete(`/api/reviews/${reviewId}`)
      .set('Authorization', `Bearer ${otherStudentToken}`);

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });

  it("should allow admin to delete any review", async () => {
    const res = await request(app)
      .delete(`/api/reviews/${tempReviewId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    tempReviewId = null;
  });
});
