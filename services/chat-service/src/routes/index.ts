import type { Router } from 'express';

import { conversationRouter } from '@/routes/conversation.routes';
import { getMongoClient } from '@/clients/mongo.client';
import { getRedisClient } from '@/clients/redis.client';

export const registerRoutes = (app: Router) => {
  // Health check endpoint for Docker/K8s
  app.get('/health', (_req, res) => {
    res.status(200).json({ status: 'ok', service: 'chat-service' });
  });

  // Keep-alive endpoint to prevent MongoDB Atlas & Upstash Redis from sleeping
  app.all('/keep-alive', async (_req, res) => {
    const results: Record<string, any> = {};
    try {
      const client = await getMongoClient();
      await client
        .db()
        .collection('db_pings')
        .updateOne(
          { id: 'keep-alive' },
          { $set: { pingedAt: new Date(), note: 'keep-alive from qstash' } },
          { upsert: true },
        );
      results.mongodb = 'ok';
    } catch (err: any) {
      results.mongodb = `error: ${err.message}`;
    }

    try {
      const redis = getRedisClient();
      await redis.set('db_ping:last_ping', new Date().toISOString(), 'EX', 86400 * 30);
      results.redis = 'ok';
    } catch (err: any) {
      results.redis = `error: ${err.message}`;
    }

    const hasError = Object.values(results).some((status) => typeof status === 'string' && status.startsWith('error'));
    res.status(hasError ? 207 : 200).json({
      status: hasError ? 'partial' : 'ok',
      service: 'chat-service',
      results,
    });
  });

  app.use('/conversations', conversationRouter);
};
