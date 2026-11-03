import dns from 'node:dns';
import { MongoClient } from 'mongodb';

import { env } from '@/config/env';
import { logger } from '@/utils/logger';

// Set public DNS servers to resolve MongoDB Atlas SRV records on Windows
try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch (e) {
  // Fallback to system default
}

let client: MongoClient | null = null;

export const getMongoClient = async (): Promise<MongoClient> => {
  if (client) {
    return client;
  }

  const mongoUrl = env.MONGO_URL;
  client = new MongoClient(mongoUrl);
  await client.connect();
  logger.info('MongoDB connection established');

  return client;
};

export const closeMongoClient = async () => {
  if (!client) {
    return;
  }
  await client.close();
  logger.info('MongoDB connection closed');
  client = null;
};
