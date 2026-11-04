import { HttpError } from '@chatapp/common';
import type {
  Conversation,
  ConversationFilter,
  ConversationSummary,
  CreateConversationInput,
} from '@/types/conversation';

import { conversationCache } from '@/cache/conversation.cache';
import { conversationRepository } from '@/repositories/conversation.repository';
import { messageRepository } from '@/repositories/message.repository';
import { pusherServer } from '@/lib/pusher';

import { MessageStatus } from '@/types/message';

export const conversationService = {
  async createConversation(input: CreateConversationInput): Promise<Conversation> {
    const conversation = await conversationRepository.create(input);

    const isGroup = conversation.participantIds.length > 2 || Boolean(conversation.title);
    if (isGroup && !conversation.lastMessageAt) {
      try {
        const creatorId = input.participantIds[0];
        const eventText = input.title ? `Đã tạo nhóm "${input.title}"` : 'Đã tạo nhóm';
        const eventMsg = await messageRepository.create(conversation.id, creatorId, eventText, true);
        await conversationRepository.touchConversation(
          conversation.id,
          eventText,
          eventMsg.status,
          creatorId,
        );
        conversation.lastMessagePreview = eventText;
        conversation.lastMessageAt = eventMsg.createdAt;
      } catch (error) {
        console.error('Failed to create initial group event message:', error);
      }
    }

    await conversationCache.set(conversation);

    try {
      for (const participantId of conversation.participantIds) {
        await pusherServer.trigger(`user-${participantId}`, 'conversation:new', conversation);
      }
    } catch (error) {
      console.error('Failed to trigger conversation:new Pusher event:', error);
    }

    return conversation;
  },

  async getConversationById(id: string): Promise<Conversation> {
    const cached = await conversationCache.get(id);
    if (cached) {
      return cached;
    }

    const conversation = await conversationRepository.findById(id);
    if (!conversation) {
      throw new HttpError(404, 'Conversation not found');
    }

    await conversationCache.set(conversation);
    return conversation;
  },

  async listConversation(filter: ConversationFilter): Promise<ConversationSummary[]> {
    return conversationRepository.findSummaries(filter);
  },

  async touchConversation(
    conversationId: string,
    preview: string,
    status?: MessageStatus | null,
    senderId?: string,
  ): Promise<void> {
    await conversationRepository.touchConversation(conversationId, preview, status, senderId);
    await conversationCache.delete(conversationId);
  },

  async markConversationAsRead(
    conversationId: string,
    userId: string,
    messageId?: string,
  ): Promise<{ conversation: Conversation; lastReadAt: Date }> {
    const res = await conversationRepository.markAsRead(conversationId, userId, messageId);
    if (!res) {
      throw new HttpError(404, 'Conversation not found');
    }

    await conversationCache.delete(conversationId);

    try {
      await pusherServer.trigger(`chat-${conversationId}`, 'conversation:read', {
        conversationId,
        readerId: userId,
        lastReadAt: res.lastReadAt,
      });

      for (const participantId of res.conversation.participantIds) {
        await pusherServer.trigger(`user-${participantId}`, 'conversation:read', {
          conversationId,
          readerId: userId,
          lastReadAt: res.lastReadAt,
          lastMessageStatus: res.conversation.lastMessageStatus,
        });
      }
    } catch (error) {
      console.error('Failed to trigger conversation:read Pusher event:', error);
    }

    return res;
  },

  async getUnreadCount(userId: string): Promise<number> {
    return conversationRepository.getUnreadCount(userId);
  },
};
