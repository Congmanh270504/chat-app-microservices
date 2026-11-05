import { Router } from 'express';
import { authRouter } from '@/routes/auth.routes';
import { sequelize } from '@/db/sequelize';

export const registerRoutes = (app: Router) => {
  // Health check endpoint for Docker/K8s
  app.get('/health', (_req, res) => {
    res.status(200).json({ status: 'ok', service: 'auth-service' });
  });

  // Keep-alive endpoint to prevent Cloud DB from sleeping
  app.all('/keep-alive', async (_req, res) => {
    try {
      await sequelize.query(
        'CREATE TABLE IF NOT EXISTS db_pings (id INT PRIMARY KEY, pinged_at DATETIME, note VARCHAR(50))',
      );
      await sequelize.query(
        'REPLACE INTO db_pings (id, pinged_at, note) VALUES (1, NOW(), "keep-alive from qstash")',
      );
      res.status(200).json({ status: 'ok', service: 'auth-service', db: 'mysql' });
    } catch (error: any) {
      res.status(500).json({ status: 'error', service: 'auth-service', message: error.message });
    }
  });

  app.use('/auth', authRouter);
};
