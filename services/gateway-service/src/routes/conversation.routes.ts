import { requireAuth } from '@/middleware/require-auth';
import {
  conversationIdParamsSchema,
  createConversationBodySchema,
  listConversationsQuerySchema,
} from '@/validation/conversation.schema';
import { Router } from 'express';
import { asyncHandler, validateRequest } from '@chatapp/common';
import {
  createConversationHandler,
  createMessageHandler,
  getConversationHandler,
  getUnreadCountHandler,
  listConversationsHandler,
  listMessagesHandler,
  addReactionHandler,
  markConversationAsReadHandler,
  searchMessagesHandler,
} from '@/controllers/conversation.controller';
import {
  createMessageBodySchema,
  listMessagesQuerySchema,
  addReactionBodySchema,
  messageParamsSchema,
  searchMessagesQuerySchema,
} from '@/validation/message.schema';

export const conversationRouter: Router = Router();

conversationRouter.use(requireAuth);

conversationRouter.post(
  '/',
  validateRequest({ body: createConversationBodySchema }),
  createConversationHandler,
);

conversationRouter.get(
  '/',
  validateRequest({ query: listConversationsQuerySchema }),
  listConversationsHandler,
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
  listMessagesHandler,
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
