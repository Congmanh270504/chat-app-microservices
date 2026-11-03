import { randomUUID } from 'node:crypto';
import type { Collection, WithId, Document } from 'mongodb';

import type {
  Conversation,
  ConversationFilter,
  ConversationSummary,
  CreateConversationInput,
  ParticipantRead,
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
  lastMessageSenderId?: string | null;
  participantReads?: ParticipantRead[];
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
  lastMessageSenderId: doc.lastMessageSenderId ? String(doc.lastMessageSenderId) : null,
  participantReads: Array.isArray(doc.participantReads)
    ? doc.participantReads.map((p: any) => ({
        userId: String(p.userId),
        lastReadAt: new Date(p.lastReadAt as string | number | Date),
        lastReadMessageId: p.lastReadMessageId ? String(p.lastReadMessageId) : null,
      }))
    : [],
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

  async touchConversation(
    conversationId: string,
    preview: string,
    status?: MessageStatus | null,
    senderId?: string,
  ): Promise<void> {
    const collection = await getCollection();
    const now = new Date();
    await collection.updateOne(
      { _id: conversationId },
      {
        $set: {
          lastMessageAt: now,
          lastMessagePreview: preview,
          lastMessageStatus: status ?? MessageStatus.SENT,
          ...(senderId ? { lastMessageSenderId: senderId } : {}),
          updatedAt: now,
        },
      },
    );

    // Update sender's read pointer to now
    if (senderId) {
      const doc = await collection.findOne({ _id: conversationId });
      const hasSender = doc?.participantReads?.some((p) => p.userId === senderId);
      if (hasSender) {
        await collection.updateOne(
          { _id: conversationId, 'participantReads.userId': senderId },
          { $set: { 'participantReads.$.lastReadAt': now } },
        );
      } else {
        await collection.updateOne(
          { _id: conversationId },
          {
            $push: {
              participantReads: {
                userId: senderId,
                lastReadAt: now,
              },
            },
          },
        );
      }
    }
  },

  async markAsRead(
    conversationId: string,
    userId: string,
    messageId?: string,
  ): Promise<{ conversation: Conversation; lastReadAt: Date } | null> {
    const collection = await getCollection();
    const doc = await collection.findOne({ _id: conversationId });
    if (!doc) return null;

    const now = new Date();
    const hasUser = doc.participantReads?.some((p) => p.userId === userId);
    const shouldUpdateLastStatus = doc.lastMessageSenderId && doc.lastMessageSenderId !== userId;

    if (hasUser) {
      await collection.updateOne(
        { _id: conversationId, 'participantReads.userId': userId },
        {
          $set: {
            'participantReads.$.lastReadAt': now,
            'participantReads.$.lastReadMessageId': messageId ?? null,
            ...(shouldUpdateLastStatus ? { lastMessageStatus: MessageStatus.READ } : {}),
          },
        },
      );
    } else {
      await collection.updateOne(
        { _id: conversationId },
        {
          $push: {
            participantReads: {
              userId,
              lastReadAt: now,
              lastReadMessageId: messageId ?? null,
            },
          },
          ...(shouldUpdateLastStatus ? { $set: { lastMessageStatus: MessageStatus.READ } } : {}),
        },
      );
    }

    const updated = await this.findById(conversationId);
    return updated ? { conversation: updated, lastReadAt: now } : null;
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

