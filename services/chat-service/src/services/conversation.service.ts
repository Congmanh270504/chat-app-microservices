import { HttpError } from '@chatapp/common';
import type {
  Conversation,
  ConversationFilter,
  ConversationSummary,
  CreateConversationInput,
} from '@/types/conversation';

import { conversationCache } from '@/cache/conversation.cache';
import { conversationRepository } from '@/repositories/conversation.repository';
import { pusherServer } from '@/lib/pusher';

import { MessageStatus } from '@/types/message';

export const conversationService = {
  async createConversation(input: CreateConversationInput): Promise<Conversation> {
    const conversation = await conversationRepository.create(input);
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

  async touchConversation(conversationId: string, preview: string, status?: MessageStatus | null): Promise<void> {
    await conversationRepository.touchConversation(conversationId, preview, status);
    await conversationCache.delete(conversationId);
  },
};
