// Run with: pnpm --filter chat-service exec tsx src/sync-meilisearch.ts
import dns from 'node:dns';
try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch {}

import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { Meilisearch } from 'meilisearch';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const mongoUrl =
  process.env.MONGO_URL ||
  'mongodb://chatapp_mongo_user:testpassword@127.0.0.1:27017/chatapp_chat_service?authSource=admin';

const meiliHost = process.env.MEILISEARCH_HOST || 'http://127.0.0.1:7700';
const meiliKey = process.env.MEILISEARCH_MASTER_KEY || 'masterKey123456';

async function syncAllMessages() {
  console.log('[Sync] Connecting to Meilisearch at:', meiliHost);
  const meili = new Meilisearch({ host: meiliHost, apiKey: meiliKey });
  const index = meili.index('messages');

  // Ensure index exists
  try {
    await meili.getIndex('messages');
  } catch {
    await meili.createIndex('messages', { primaryKey: 'id' });
  }

  // Set index settings
  await index.updateFilterableAttributes(['conversationId', 'senderId', 'createdAtTimestamp']);
  await index.updateSearchableAttributes(['body']);
  await index.updateSortableAttributes(['createdAtTimestamp']);
  console.log('[Sync] Index settings updated.');

  console.log('[Sync] Connecting to MongoDB at:', mongoUrl);
  const client = new MongoClient(mongoUrl);
  await client.connect();

  const db = client.db();
  const messagesCollection = db.collection('messages');
  const total = await messagesCollection.countDocuments();
  console.log(`[Sync] Found ${total} messages in MongoDB.`);

  if (total > 0) {
    const cursor = messagesCollection.find({});
    const batchSize = 1000;
    let batch: any[] = [];
    let synced = 0;

    for await (const doc of cursor) {
      batch.push({
        id: String(doc._id),
        conversationId: String(doc.conversationId),
        senderId: String(doc.senderId),
        body: String(doc.body || ''),
        createdAtTimestamp: new Date(doc.createdAt).getTime(),
        createdAt: new Date(doc.createdAt).toISOString(),
      });

      if (batch.length >= batchSize) {
        await index.addDocuments(batch, { primaryKey: 'id' });
        synced += batch.length;
        console.log(`[Sync] Synced ${synced}/${total} messages...`);
        batch = [];
      }
    }

    if (batch.length > 0) {
      await index.addDocuments(batch, { primaryKey: 'id' });
      synced += batch.length;
      console.log(`[Sync] Synced ${synced}/${total} messages.`);
    }
  }

  await client.close();
  console.log('[Sync] Complete! All messages have been indexed to Meilisearch.');
}

syncAllMessages().catch(console.error);

