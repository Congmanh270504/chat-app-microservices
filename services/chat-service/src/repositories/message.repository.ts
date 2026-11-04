import { randomUUID } from 'node:crypto';

import { type WithId, type Document, ObjectId } from 'mongodb';

import { MessageStatus, type Message, type MessageListOptions } from '@/types/message';

import { getMongoClient } from '@/clients/mongo.client';

const MESSAGES_COLLECTION = 'messages';

const toMessage = (doc: WithId<Document>): Message => ({
  id: String(doc._id),
  conversationId: String(doc.conversationId),
  senderId: String(doc.senderId),
  body: String(doc.body),
  event: Boolean(doc.event),
  createdAt: new Date(doc.createdAt as string | number | Date),
  reactions: Array.isArray(doc.reactions)
    ? doc.reactions.map((r: WithId<Document>) => ({
        messageId: String(r.messageId ?? doc._id),
        userReactId: String(r.userReactId ?? r.userId),
        emoji: String(r.emoji),
        createdAt: new Date(r.createdAt as string | number | Date),
      }))
    : [],
  status: doc.status as MessageStatus,
});

export const messageRepository = {
  async create(
    conversationId: string,
    senderId: string,
    body: string,
    event: boolean = false,
  ): Promise<Message> {
    const client = await getMongoClient();
    const db = client.db();
    const collection = db.collection(MESSAGES_COLLECTION);
    const now = new Date();
    const document = {
      _id: randomUUID(),
      conversationId,
      senderId,
      body,
      event: Boolean(event),
      createdAt: now,
      status: MessageStatus.SENT,
    };

    await collection.insertOne(document as unknown as Document);

    return toMessage(document as unknown as WithId<Document>);
  },

  async findByConversation(
    conversationId: string,
    options: MessageListOptions = {},
  ): Promise<Message[]> {
    const client = await getMongoClient();
    const db = client.db();
    const query: Record<string, unknown> = {
      conversationId,
    };

    if (options.after) {
      query.createdAt = { $gt: options.after };
    }

    const cursor = db
      .collection(MESSAGES_COLLECTION)
      .find(query)
      .sort({ createdAt: 1 })
      .limit(options.limit ?? 50);

    const messages = await cursor.toArray();
    return messages.map((doc) => toMessage(doc));
  },

  async findById(messageId: string): Promise<Message | null> {
    const client = await getMongoClient();
    const db = client.db();
    const doc = await db
      .collection(MESSAGES_COLLECTION)
      .findOne({ _id: messageId } as unknown as Document);
    return doc ? toMessage(doc) : null;
  },

  async addReaction(
    conversationId: string,
    messageId: string,
    userReactId: string,
    emoji: string,
  ): Promise<Message | null> {
    const client = await getMongoClient();
    const db = client.db();
    const collection = db.collection(MESSAGES_COLLECTION);

    const doc = await collection.findOne({
      _id: messageId,
      conversationId,
    } as unknown as Document);

    if (!doc) return null;

    const currentReactions: Array<{ userReactId?: string; userId?: string; emoji: string }> =
      Array.isArray(doc.reactions) ? doc.reactions : [];

    const userExistingReaction = currentReactions.find(
      (r) => r.userReactId === userReactId || r.userId === userReactId,
    );

    // Remove any previous reaction by this user (ensure each user only has 1 reaction)
    await collection.updateOne(
      { _id: messageId, conversationId } as unknown as Document,
      {
        $pull: {
          reactions: {
            $or: [{ userReactId }, { userId: userReactId }],
          },
        },
      } as unknown as Document,
    );

    // If clicking a different emoji (or hadn't reacted before), add the new reaction
    if (!userExistingReaction || userExistingReaction.emoji !== emoji) {
      const reaction = {
        messageId,
        userReactId,
        emoji,
        createdAt: new Date(),
      };
      await collection.updateOne(
        { _id: messageId, conversationId } as unknown as Document,
        {
          $push: {
            reactions: reaction,
          },
        } as unknown as Document,
      );
    }

    return this.findById(messageId);
  },
};
