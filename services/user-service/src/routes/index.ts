import type { Router } from 'express';
import { userRoutes } from './users.routes';
import { sequelize } from '@/db/sequelize';

export const registerRoutes = (app: Router) => {
  // Health check endpoint for Docker/K8s
  app.get('/health', (_req, res) => {
    res.status(200).json({ status: 'ok', service: 'user-service' });
  });

  // Keep-alive endpoint to prevent Supabase Postgres from pausing
  app.all('/keep-alive', async (_req, res) => {
    try {
      await sequelize.query(
        'CREATE TABLE IF NOT EXISTS db_pings (id INT PRIMARY KEY, pinged_at TIMESTAMP, note VARCHAR(50))',
      );
      await sequelize.query(
        "INSERT INTO db_pings (id, pinged_at, note) VALUES (1, NOW(), 'keep-alive from qstash') ON CONFLICT (id) DO UPDATE SET pinged_at = NOW()",
      );
      res.status(200).json({ status: 'ok', service: 'user-service', db: 'postgres' });
    } catch (error: any) {
      res.status(500).json({ status: 'error', service: 'user-service', message: error.message });
    }
  });

  app.use('/users', userRoutes);
};
