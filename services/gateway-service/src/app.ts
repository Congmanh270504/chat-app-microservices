import express, { type Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { errorHandler } from '@/middleware/error-handler';
import { generalLimiter } from '@/middleware/rate-limiter';
import { registerRoutes } from '@/routes';

export const createApp = (): Application => {
  const app = express();

  // Tin tưởng header X-Forwarded-For từ Caddy Reverse Proxy
  app.set('trust proxy', true);

  app.use(helmet());
  app.use(
    cors({
      origin: '*',
      credentials: true,
    }),
  );

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Áp dụng Rate Limiting bảo vệ toàn bộ Gateway chống spam / DDoS
  app.use(generalLimiter);

  registerRoutes(app);

  app.use((_req, res) => {
    res.status(404).json({ message: 'Not Found' });
  });

  app.use(errorHandler);

  return app;
};
