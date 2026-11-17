import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '@/app';

const app = createApp();

describe('API Endpoints', () => {
  describe('GET /health', () => {
    it('should return health status', async () => {
      const res = await request(app).get('/health').expect(200);
      expect(res.body).toHaveProperty('status', 'ok');
      expect(res.body).toHaveProperty('service', 'gateway-service');
    });
  });

  describe('GET /nonExistent', () => {
    it('should return 404 for non-existent route', async () => {
      const res = await request(app).get('/nonExistent').expect(404);
      expect(res.body).toHaveProperty('message', 'Not Found');
    });
  });
});
