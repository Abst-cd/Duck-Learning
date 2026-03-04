const request = require('supertest');
const express = require('express');

jest.mock('../middlewares/authMiddleware', () => ({
  authenticateToken: (req, res, next) => {
    req.user = { userId: 'user123' }; 
    next();
  }
}));

jest.mock('../controllers/subjectController', () => ({
  listMySubjects: (req, res) => res.status(200).json({ ok: true }),
  createSubject: (req, res) => res.status(201).json({ created: true }),
  updateSubjectTime: (req, res) => res.status(200).json({ updated: true }),
  startSubject: (req, res) => res.status(200).json({ started: true }),
  stopSubject: (req, res) => res.status(200).json({ stopped: true }),
  deleteSubject: (req, res) => res.status(200).json({ deleted: true }),
}));

const subjectRouter = require('../routes/subjects'); 

const app = express();
app.use(express.json());
app.use('/subjects', subjectRouter);

describe('Subjects Routes Configuration', () => {

  test('GET / debe llamar a listMySubjects', async () => {
    const res = await request(app).get('/subjects');
    expect(res.statusCode).toBe(200);
    expect(res.body.ok).toBe(true);
  });

  test('POST / debe llamar a createSubject', async () => {
    const res = await request(app).post('/subjects').send({ name: 'Test' });
    expect(res.statusCode).toBe(201);
    expect(res.body.created).toBe(true);
  });

  test('PATCH /:id/time debe ser accesible', async () => {
    const res = await request(app).patch('/subjects/123/time').send({ studyMinutes: 10 });
    expect(res.statusCode).toBe(200);
    expect(res.body.updated).toBe(true);
  });

  test('POST /:id/start debe ser accesible', async () => {
    const res = await request(app).post('/subjects/123/start');
    expect(res.statusCode).toBe(200);
    expect(res.body.started).toBe(true);
  });

  test('DELETE /:id debe ser accesible', async () => {
    const res = await request(app).delete('/subjects/123');
    expect(res.statusCode).toBe(200);
    expect(res.body.deleted).toBe(true);
  });
});