import {
  createUser,
  deleteUser,
  getAllUsers,
  getUser,
  searchUsers,
  editUser,
} from '@/controllers/user.controller';
import {
  createUserSchema,
  searchUsersQuerySchema,
  userIdParamsSchema,
} from '@/validation/user.schema';
import { asyncHandler, validateRequest } from '@chatapp/common';
import { Router } from 'express';

export const userRoutes: Router = Router();

userRoutes.get('/', asyncHandler(getAllUsers));
userRoutes.get(
  '/search',
  validateRequest({ query: searchUsersQuerySchema }),
  asyncHandler(searchUsers),
);
userRoutes.get('/:id', validateRequest({ params: userIdParamsSchema }), asyncHandler(getUser));
userRoutes.post('/', validateRequest({ body: createUserSchema }), asyncHandler(createUser));
userRoutes.put('/:id', validateRequest({ body: createUserSchema }), asyncHandler(editUser));
userRoutes.delete(
  '/:id',
  validateRequest({ params: userIdParamsSchema }),
  asyncHandler(deleteUser),
);
