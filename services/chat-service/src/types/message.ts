export interface Reaction {
  emoji: string;
  userId: string;
  createdAt: Date;
}

export enum MessageStatus {
  PENDING = 'PENDING',
  DELIVERED = 'DELIVERED',
  SENT = 'SENT',
  READ = 'READ',
  BROKEN = 'BROKEN',
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  body: string;
  createdAt: Date;
  reactions: Reaction[];
  status: MessageStatus;
}

export interface CreateMessageInput {
  conversationId: string;
  senderId: string;
  body: string;
}

export interface MessageListOptions {
  limit?: number;
  after?: Date;
}

export interface AddReactionInput {
  messageId: string;
  conversationId: string;
  userId: string;
  emoji: string;
}

export interface RemoveReactionInput {
  messageId: string;
  conversationId: string;
  userId: string;
  emoji: string;
}
