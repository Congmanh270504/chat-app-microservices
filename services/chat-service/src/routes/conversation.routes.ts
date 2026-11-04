import {
  createConversationHandler,
  createMessageHandler,
  getConversationHandler,
  getUnreadCountHandler,
  listConversationHandler,
  listMessageHandler,
  addReactionHandler,
  markConversationAsReadHandler,
  searchMessagesHandler,
} from '@/controllers/conversation.controller';
import { attachAuthenticatedUser } from '@/middleware/authenticated-user';
import {
  createConversationSchema,
  listConversationsQuerySchema,
} from '@/validation/conversation.schema';
import {
  createMessageBodySchema,
  listMessagesQuerySchema,
  addReactionBodySchema,
  messageParamsSchema,
  searchMessagesQuerySchema,
} from '@/validation/message.schema';
import { conversationIdParamsSchema } from '@/validation/shared.schema';
import { validateRequest } from '@chatapp/common';
import { Router } from 'express';

export const conversationRouter: Router = Router();

conversationRouter.use(attachAuthenticatedUser);

conversationRouter.post(
  '/',
  validateRequest({ body: createConversationSchema }),
  createConversationHandler,
);

conversationRouter.get(
  '/',
  validateRequest({ query: listConversationsQuerySchema }),
  listConversationHandler,
);

conversationRouter.get('/unread-count', getUnreadCountHandler);

conversationRouter.get(
  '/:id',
  validateRequest({ params: conversationIdParamsSchema }),
  getConversationHandler,
);

conversationRouter.post(
  '/:id/messages',
  validateRequest({ params: conversationIdParamsSchema, body: createMessageBodySchema }),
  createMessageHandler,
);

conversationRouter.get(
  '/:id/messages',
  validateRequest({ params: conversationIdParamsSchema, query: listMessagesQuerySchema }),
  listMessageHandler,
);

conversationRouter.get(
  '/:id/messages/search',
  validateRequest({ params: conversationIdParamsSchema, query: searchMessagesQuerySchema }),
  searchMessagesHandler,
);

conversationRouter.post(
  '/:id/messages/:messageId/reactions',
  validateRequest({ params: messageParamsSchema, body: addReactionBodySchema }),
  addReactionHandler,
);

conversationRouter.patch(
  '/:id/read',
  validateRequest({ params: conversationIdParamsSchema }),
  markConversationAsReadHandler,
);

conversationRouter.post(
  '/:id/read',
  validateRequest({ params: conversationIdParamsSchema }),
  markConversationAsReadHandler,
);
