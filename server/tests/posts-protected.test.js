process.env.JWT_SECRET = 'testsecret';
const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../server');
const User = require('../models/User');
const Post = require('../models/Post');
const Category = require('../models/Category');

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

afterEach(async () => {
  await User.deleteMany();
  await Post.deleteMany();
  await Category.deleteMany();
});

describe('Protected posts DELETE route', () => {
  let adminToken, userToken, postId, categoryId;

  beforeEach(async () => {
    // Create a category
  const category = new Category({ name: 'TestCat', slug: 'testcat', description: 'desc' });
  await category.save();
  categoryId = category._id;

    // Create admin
    const adminRes = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Admin', email: 'admin@example.com', password: 'adminpass', role: 'admin' });
    adminToken = adminRes.body.token;

    // Create user
    const userRes = await request(app)
      .post('/api/auth/register')
      .send({ name: 'User', email: 'user@example.com', password: 'userpass', role: 'user' });
    userToken = userRes.body.token;

    // Create a post as admin
    const post = new Post({
      title: 'Test Post',
      content: 'Test content',
      author: (await User.findOne({ email: 'admin@example.com' }))._id,
      category: categoryId,
      slug: 'test-post',
      isPublished: true
    });
    await post.save();
    postId = post._id;
  });

  it('denies delete for unauthenticated user', async () => {
    const res = await request(app).delete(`/api/posts/${postId}`);
    expect(res.statusCode).toBe(401);
  });

  it('denies delete for non-admin user', async () => {
    const res = await request(app)
      .delete(`/api/posts/${postId}`)
      .set('Authorization', `Bearer ${userToken}`);
    expect(res.statusCode).toBe(403);
  });

  it('allows delete for admin user', async () => {
    const res = await request(app)
      .delete(`/api/posts/${postId}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toMatch(/deleted/i);
  });
});
