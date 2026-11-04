import { MessageStatus } from './message';

export interface ParticipantRead {
  userId: string;
  lastReadAt: Date;
  lastReadMessageId?: string | null;
}

export interface Conversation {
  id: string;
  title: string | null;
  participantIds: string[];
  isGroup?: boolean;
  createdAt: Date;
  updatedAt: Date;
  lastMessageAt: Date | null;
  lastMessagePreview: string | null;
  lastMessageStatus: MessageStatus | null;
  lastMessageSenderId?: string | null;
  participantReads?: ParticipantRead[];
}

export interface CreateConversationInput {
  id?: string;
  title?: string | null;
  participantIds: string[];
}

export interface ConversationFilter {
  participantId: string;
}

export type ConversationSummary = Conversation;
