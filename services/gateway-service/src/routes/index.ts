import type { Router } from 'express';
import axios from 'axios';
import { env } from '@/config/env';
import { authRouter } from '@/routes/auth.routes';
import { userRouter } from '@/routes/user.routes';
import { authLimiter } from '@/middleware/rate-limiter';
import { conversationRouter } from './conversation.routes';

export const registerRoutes = (app: Router) => {
  // Health check endpoint for Docker/K8s
  app.get('/health', (_req, res) => {
    res.status(200).json({ status: 'ok', service: 'gateway-service' });
  });

  // Keep-alive endpoint called periodically by Upstash QStash
  // Pings all database services (MySQL, Postgres, Mongo, Redis) to prevent free-tier hibernation
  app.all('/keep-alive', async (_req, res) => {
    const results: Record<string, any> = {};
    const headers = { 'X-Internal-Token': env.INTERNAL_API_TOKEN };

    const pingService = async (key: string, baseUrl: string) => {
      try {
        const response = await axios.get(`${baseUrl}/keep-alive`, {
          headers,
          timeout: 8000,
        });
        results[key] = response.data;
      } catch (err: any) {
        results[key] = {
          status: 'error',
          message: err.response?.data?.message || err.message,
        };
      }
    };

    await Promise.allSettled([
      pingService('auth_service_mysql', env.AUTH_SERVICE_URL),
      pingService('user_service_postgres', env.USER_SERVICE_URL),
      pingService('chat_service_mongo_redis', env.CHAT_SERVICE_URL),
    ]);

    const hasError = Object.values(results).some((r) => r.status === 'error');
    res.status(hasError ? 207 : 200).json({
      success: !hasError,
      message: 'Keep-alive ping completed for all database services',
      timestamp: new Date().toISOString(),
      services: results,
    });
  });

  // Áp dụng giới hạn 20 lần/phút cho các route xác thực (đăng nhập, đăng ký)
  app.use('/auth', authLimiter, authRouter);
  app.use('/conversations', conversationRouter);
  app.use('/users', userRouter);
};
