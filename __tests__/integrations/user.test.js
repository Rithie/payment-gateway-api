import request from 'supertest';
import bcrypt from 'bcryptjs';

import app from '../../src/app';
import truncate from '../util/truncate';
import User from '../../src/app/core/models/User';
import UserRepository from '../../src/app/core/repositories/UserRepository';
import operatorFake from '../util/operatorFake';

describe('User', () => {
  beforeEach(async () => {
    await truncate();
  });

  it('should be able to register an user', async () => {
    const response = await request(app)
      .post('/api/v1/users')
      .send({
        name: 'John Johnson',
        email: 'example@example.com',
        password: '123456',
      });

    expect(response.body).toHaveProperty('id');
  });

  it('should encrypt user password when user created', async () => {
    const user = await User.create({
      name: 'John Johnson',
      email: 'example@example.com',
      password: '123456',
    });

    const compareHash = await bcrypt.compare('123456', user.password_hash);
    expect(compareHash).toBe(true);
  });

  it('should be able to register with duplicate email', async () => {
    await request(app)
      .post('/api/v1/users')
      .send({
        name: 'John Johnson',
        email: 'example@example.com',
        password: '123456',
      });

    const response = await request(app)
      .post('/api/v1/users')
      .send({
        name: 'John Johnson',
        email: 'example@example.com',
        password: '123456',
      });

    expect(response.status).toBe(400);
  });

  it('should be able to update profile', async () => {
    await request(app)
      .post('/api/v1/users')
      .send({
        name: 'John Johnson',
        email: 'example@example.com',
        password: '123456',
      });

    const session = await request(app)
      .post('/api/v1/sessions')
      .send({
        email: 'example@example.com',
        password: '123456',
      });

    const response = await request(app)
      .patch('/api/v1/users')
      .set('appToken', session.body.token)
      .send({
        email: 'example@example.com',
        oldPassword: '123456',
        password: '654321',
      });

    expect(response.status).toBe(204);
  });

  it('should try to update the password with the incorrect old password and give error', async () => {
    await request(app)
      .post('/api/v1/users')
      .send({
        name: 'John Johnson',
        email: 'example@example.com',
        password: '123456',
      });

    const session = await request(app)
      .post('/api/v1/sessions')
      .send({
        email: 'example@example.com',
        password: '123456',
      });

    const response = await request(app)
      .patch('/api/v1/users')
      .set('appToken', session.body.token)
      .send({
        email: 'example@example.com',
        oldPassword: '654321',
        password: '654321',
      });

    expect(response.status).toBe(400);
  });

  it('should be able to cause an exception when to try store user with null data', async () => {
    await expect(
      operatorFake('store', UserRepository, null)
    ).resolves.toHaveProperty('statusCode', 500);
  });

  it('should be able to cause an exception when to try update user with null data', async () => {
    const params = {
      data: null,
      id: null,
    };
    await expect(
      operatorFake('update', UserRepository, params)
    ).resolves.toHaveProperty('statusCode', 500);
  });
});
