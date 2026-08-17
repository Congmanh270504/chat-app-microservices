import { randomUUID } from 'node:crypto';
import type { Collection, WithId, Document } from 'mongodb';

import type {
  Conversation,
  ConversationFilter,
  ConversationSummary,
  CreateConversationInput,
} from '@/types/conversation';

import { getMongoClient } from '@/clients/mongo.client';
import { MessageStatus } from '@/types/message';

const CONVERSATIONS_COLLECTION = 'conversations';
const MESSAGES_COLLECTION = 'messages';

interface ConversationDocument {
  _id: string;
  title: string | null;
  participantIds: string[];
  createdAt: Date;
  updatedAt: Date;
  lastMessageAt: Date | null;
  lastMessagePreview: string | null;
  lastMessageStatus?: MessageStatus | null;
}

const getCollection = async (): Promise<Collection<ConversationDocument>> => {
  const client = await getMongoClient();
  return client.db().collection<ConversationDocument>(CONVERSATIONS_COLLECTION);
};

const toConversation = (doc: ConversationDocument | WithId<Document>): Conversation => ({
  id: String(doc._id),
  title: typeof doc.title === 'string' ? doc.title : null,
  participantIds: Array.isArray(doc.participantIds) ? (doc.participantIds as string[]) : [],
  createdAt: new Date(doc.createdAt as string | number | Date),
  updatedAt: new Date(doc.updatedAt as string | number | Date),
  lastMessageAt: doc.lastMessageAt ? new Date(doc.lastMessageAt as string | number | Date) : null,
  lastMessagePreview: typeof doc.lastMessagePreview === 'string' ? doc.lastMessagePreview : null,
  lastMessageStatus: (doc.lastMessageStatus as MessageStatus | null) ?? null,
});

const toConversationSummary = (doc: ConversationDocument | WithId<Document>): ConversationSummary =>
  toConversation(doc);

export const conversationRepository = {
  async create(input: CreateConversationInput): Promise<Conversation> {
    const collection = await getCollection();

    const isExitMemberConversation = await collection.findOne({
      participantIds: { $all: input.participantIds },
    });

    if (isExitMemberConversation) {
      return toConversation(isExitMemberConversation);
    }

    const now = new Date();
    const document: ConversationDocument = {
      _id: randomUUID(),
      title: input.title ?? null,
      participantIds: input.participantIds,
      createdAt: now,
      updatedAt: now,
      lastMessageAt: null,
      lastMessagePreview: null,
    };

    await collection.insertOne(document);
    return toConversation(document);
  },

  async findById(id: string): Promise<Conversation | null> {
    const collection = await getCollection();
    const doc = await collection.findOne({ _id: id });
    return doc ? toConversation(doc) : null;
  },

  async findSummaries(filter: ConversationFilter): Promise<ConversationSummary[]> {
    const collection = await getCollection();
    const query = filter.participantId ? { participantIds: { $in: [filter.participantId] } } : {};
    const cursor = collection
      .find(query)
      .sort({ lastMessageAt: -1, updatedAt: -1 });
    const results = await cursor.toArray();
    return results.map((doc) => toConversationSummary(doc));
  },

  async touchConversation(conversationId: string, preview: string, status?: MessageStatus | null): Promise<void> {
    const collection = await getCollection();
    await collection.updateOne(
      { _id: conversationId },
      {
        $set: {
          lastMessageAt: new Date(),
          lastMessagePreview: preview,
          lastMessageStatus: status ?? MessageStatus.SENT,
          updatedAt: new Date(),
        },
      },
    );
  },

  async removeAll(): Promise<void> {
    const client = await getMongoClient();
    const db = client.db();
    await Promise.all([
      db.collection(CONVERSATIONS_COLLECTION).deleteMany({}),
      db.collection(MESSAGES_COLLECTION).deleteMany({}),
    ]);
  },
};

