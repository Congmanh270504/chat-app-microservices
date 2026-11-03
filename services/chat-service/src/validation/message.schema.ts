import { z } from '@chatapp/common';

export const createMessageBodySchema = z.object({
  body: z.string().min(1).max(2000),
});

export const createMessageSchema = createMessageBodySchema.extend({
  conversationId: z.string().uuid(),
});

export const listMessagesQuerySchema = z.object({
  limit: z
    .preprocess(
      (value) => (value === undefined ? undefined : Number(value)),
      z.number().int().min(1).max(200),
    )
    .optional(),
  after: z.string().datetime().optional(),
});

export const addReactionBodySchema = z.object({
  emoji: z.string().min(1).max(20),
});

export const messageParamsSchema = z.object({
  id: z.string().uuid(),
  messageId: z.string().min(1),
});
