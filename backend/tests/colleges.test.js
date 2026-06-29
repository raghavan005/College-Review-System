const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../src/app');
const User = require('../src/models/User');
const College = require('../src/models/College');

let mongoServer;
let adminToken;
let studentToken;
let collegeId;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);

  process.env.JWT_SECRET = 'test_secret_key';
  process.env.JWT_EXPIRES_IN = '7d';

  // Register admin
  const adminRes = await request(app).post('/api/auth/register').send({
    name: 'Admin User',
    email: 'admin@test.com',
    password: 'password123',
    role: 'admin',
  });
  adminToken = adminRes.body.token;

  // Register student
  const studentRes = await request(app).post('/api/auth/register').send({
    name: 'Student User',
    email: 'student@test.com',
    password: 'password123',
    role: 'student',
  });
  studentToken = studentRes.body.token;
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

describe('Colleges API', () => {
  describe('POST /api/colleges', () => {
    it('should block non-admin from creating a college', async () => {
      const res = await request(app)
        .post('/api/colleges')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          name: 'Forbidden University',
          location: 'City, CY',
        });
      expect(res.statusCode).toBe(403);
    });

    it('should allow admin to create a college', async () => {
      const res = await request(app)
        .post('/api/colleges')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Awesome Tech',
          location: 'Coimbatore, TN',
          description: 'A great engineering college',
          website: 'https://awesome.edu',
          established: 2000,
        });
      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe('Awesome Tech');
      collegeId = res.body.data._id;
    });

    it('should return 400 if required fields are missing', async () => {
      const res = await request(app)
        .post('/api/colleges')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Incomplete Tech',
        });
      expect(res.statusCode).toBe(400);
    });
  });

  describe('GET /api/colleges', () => {
    it('should return a list of colleges with aggregated fields', async () => {
      const res = await request(app).get('/api/colleges');
      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);
      expect(res.body.data[0]).toHaveProperty('avgRating');
      expect(res.body.data[0]).toHaveProperty('reviewCount');
    });
  });

  describe('GET /api/colleges/:id', () => {
    it('should return a college by its ID', async () => {
      const res = await request(app).get(`/api/colleges/${collegeId}`);
      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe('Awesome Tech');
    });

    it('should return 404 for non-existent college ID', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const res = await request(app).get(`/api/colleges/${fakeId}`);
      expect(res.statusCode).toBe(404);
    });
  });

  describe('PUT /api/colleges/:id', () => {
    it('should block non-admin from updating a college', async () => {
      const res = await request(app)
        .put(`/api/colleges/${collegeId}`)
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          name: 'Updated Tech Name',
        });
      expect(res.statusCode).toBe(403);
    });

    it('should allow admin to update a college', async () => {
      const res = await request(app)
        .put(`/api/colleges/${collegeId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Super Tech',
        });
      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe('Super Tech');
    });
  });

  describe('DELETE /api/colleges/:id', () => {
    it('should block non-admin from deleting a college', async () => {
      const res = await request(app)
        .delete(`/api/colleges/${collegeId}`)
        .set('Authorization', `Bearer ${studentToken}`);
      expect(res.statusCode).toBe(403);
    });

    it('should allow admin to delete a college', async () => {
      const res = await request(app)
        .delete(`/api/colleges/${collegeId}`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });
});
