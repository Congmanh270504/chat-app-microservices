import {
  MessageStatus,
  type Message,
  type MessageListOptions,
  type AddReactionInput,
  type RemoveReactionInput,
} from '@/types/message';

import { messageRepository } from '@/repositories/message.repository';
import { conversationService } from '@/services/conversation.service';
import { HttpError } from '@chatapp/common';
import { pusherServer } from '@/lib/pusher';
import { indexMessageDoc, searchMessagesInMeili } from '@/clients/meilisearch.client';

export const messageService = {
  async createMessage(
    conversationId: string,
    senderId: string,
    body: string,
    event: boolean = false,
  ): Promise<Message> {
    // Ensure conversation exists before inserting the message
    const conversation = await conversationService.getConversationById(conversationId);

    if (!conversation.participantIds.includes(senderId)) {
      throw new HttpError(403, 'Sender is not part of this conversation');
    }

    const message = await messageRepository.create(conversationId, senderId, body, event);
    await conversationService.touchConversation(
      conversationId,
      body.slice(0, 120),
      message.status,
      senderId,
    );

    // Sync to Meilisearch in background
    indexMessageDoc({
      id: message.id,
      conversationId,
      senderId,
      body,
      createdAtTimestamp: new Date(message.createdAt).getTime(),
      createdAt: message.createdAt.toISOString(),
    }).catch((err) => {
      console.error('Failed to index message in Meilisearch:', err);
    });

    try {
      await pusherServer.trigger(`chat-${conversationId}`, 'new-message', message);
      for (const participantId of conversation.participantIds) {
        await pusherServer.trigger(`user-${participantId}`, 'new-message', message);
      }
    } catch (error) {
      console.error('Failed to trigger Pusher event:', error);
    }

    return message;
  },

  async listMessages(
    conversationId: string,
    requesterId: string,
    options: MessageListOptions = {},
  ): Promise<Message[]> {
    // Ensure conversation exists; re-use conversation service for caching behavior
    const conversation = await conversationService.getConversationById(conversationId);

    if (!conversation.participantIds.includes(requesterId)) {
      throw new HttpError(403, 'Requester is not part of this conversation');
    }

    const messages = await messageRepository.findByConversation(conversationId, options);

    // Compute status according to partner's read watermark
    const partnerReads = conversation.participantReads?.filter((p) => p.userId !== requesterId) ?? [];
    const maxPartnerReadTime = partnerReads.reduce((max, curr) => {
      const t = new Date(curr.lastReadAt).getTime();
      return t > max ? t : max;
    }, 0);

    return messages.map((msg) => {
      if (
        msg.senderId === requesterId &&
        maxPartnerReadTime > 0 &&
        new Date(msg.createdAt).getTime() <= maxPartnerReadTime
      ) {
        return {
          ...msg,
          status: MessageStatus.READ,
        };
      }
      return msg;
    });
  },

  async addReaction(
    conversationId: string,
    messageId: string,
    userReactId: string,
    emoji: string,
  ): Promise<Message> {
    const conversation = await conversationService.getConversationById(conversationId);

    if (!conversation.participantIds.includes(userReactId)) {
      throw new HttpError(403, 'User is not part of this conversation');
    }

    const message = await messageRepository.findById(messageId);
    if (!message) {
      throw new HttpError(404, 'Message not found');
    }
    if (message.conversationId !== conversationId) {
      throw new HttpError(400, 'Message does not belong to this conversation');
    }

    const updatedMessage = await messageRepository.addReaction(
      conversationId,
      messageId,
      userReactId,
      emoji,
    );

    if (!updatedMessage) {
      throw new HttpError(500, 'Failed to update reaction');
    }

    try {
      await pusherServer.trigger(`chat-${conversationId}`, 'message-reaction', {
        messageId,
        reactions: updatedMessage.reactions,
      });
      for (const participantId of conversation.participantIds) {
        await pusherServer.trigger(`user-${participantId}`, 'message-reaction', {
          messageId,
          reactions: updatedMessage.reactions,
        });
      }
    } catch (error) {
      console.error('Failed to trigger Pusher event for reaction:', error);
    }

    return updatedMessage;
  },

  async searchMessages(
    conversationId: string,
    requesterId: string,
    query: string,
    options: { limit?: number; offset?: number } = {},
  ) {
    const conversation = await conversationService.getConversationById(conversationId);

    if (!conversation.participantIds.includes(requesterId)) {
      throw new HttpError(403, 'Requester is not part of this conversation');
    }

    return searchMessagesInMeili({
      conversationId,
      query,
      limit: options.limit,
      offset: options.offset,
    });
  },
};
