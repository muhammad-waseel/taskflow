const request = require('supertest');
const db = require('./setup');
const app = require('../app');

beforeAll(() => db.connect('taskflow_test_auth'));
afterEach(() => db.clear());
afterAll(() => db.disconnect());

const user = { name: 'Ali Khan', email: 'ali@example.com', password: 'secret123' };

describe('POST /api/auth/register', () => {
  it('creates an account and returns a token', async () => {
    const res = await request(app).post('/api/auth/register').send(user);
    expect(res.status).toBe(201);
    expect(res.body.token).toEqual(expect.any(String));
    expect(res.body.user).toMatchObject({ name: 'Ali Khan', email: 'ali@example.com' });
    expect(res.body.user.password).toBeUndefined();
  });

  it('stores the password as a hash, never in plain text', async () => {
    await request(app).post('/api/auth/register').send(user);
    const User = require('../models/User');
    const saved = await User.findOne({ email: user.email }).select('+password');
    expect(saved.password).not.toBe(user.password);
    expect(saved.password).toMatch(/^\$2[aby]\$/);
  });

  it('rejects a duplicate email', async () => {
    await request(app).post('/api/auth/register').send(user);
    const res = await request(app).post('/api/auth/register').send({ ...user, email: 'ALI@example.com' });
    expect(res.status).toBe(409);
  });

  it.each([
    [{ ...user, name: '' }, 'Name is required'],
    [{ ...user, email: 'not-an-email' }, 'A valid email is required'],
    [{ ...user, password: '123' }, 'Password must be at least 6 characters'],
  ])('validates input (%#)', async (body, message) => {
    const res = await request(app).post('/api/auth/register').send(body);
    expect(res.status).toBe(400);
    expect(res.body.message).toBe(message);
  });
});

describe('POST /api/auth/login', () => {
  beforeEach(() => request(app).post('/api/auth/register').send(user));

  it('logs in with correct credentials', async () => {
    const res = await request(app).post('/api/auth/login').send({ email: user.email, password: user.password });
    expect(res.status).toBe(200);
    expect(res.body.token).toEqual(expect.any(String));
  });

  it('rejects a wrong password', async () => {
    const res = await request(app).post('/api/auth/login').send({ email: user.email, password: 'wrongpass' });
    expect(res.status).toBe(401);
    expect(res.body.message).toBe('Invalid email or password');
  });

  it('rejects an unknown email with the same message', async () => {
    const res = await request(app).post('/api/auth/login').send({ email: 'nobody@example.com', password: 'whatever' });
    expect(res.status).toBe(401);
    expect(res.body.message).toBe('Invalid email or password');
  });
});

describe('GET /api/auth/me', () => {
  it('returns the current user with a valid token', async () => {
    const { body } = await request(app).post('/api/auth/register').send(user);
    const res = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${body.token}`);
    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe(user.email);
  });

  it('requires a token', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
  });

  it('rejects a tampered token', async () => {
    const res = await request(app).get('/api/auth/me').set('Authorization', 'Bearer abc.def.ghi');
    expect(res.status).toBe(401);
  });
});

describe('health check', () => {
  it('reports status ok', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });
});
