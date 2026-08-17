// pnpm exec tsx src/clean-db.ts
import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const mongoUrl =
  process.env.MONGO_URL ||
  'mongodb://chatapp_mongo_user:testpassword@127.0.0.1:27017/chatapp_chat_service?authSource=admin';

async function clearChatData() {
  console.log('Connecting to MongoDB at:', mongoUrl);
  const client = new MongoClient(mongoUrl);
  await client.connect();

  const db = client.db();
  const collections = await db.collections();
  console.log(
    'Found collections:',
    collections.map((c) => c.collectionName),
  );

  const conversationsResult = await db.collection('conversations').deleteMany({});
  console.log(`Deleted ${conversationsResult.deletedCount} conversations.`);

  const messagesResult = await db.collection('messages').deleteMany({});
  console.log(`Deleted ${messagesResult.deletedCount} messages.`);

  await client.close();
  console.log('MongoDB connection closed. Data cleaned successfully.');
}

clearChatData().catch(console.error);
