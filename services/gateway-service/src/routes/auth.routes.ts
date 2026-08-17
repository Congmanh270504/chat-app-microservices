import {
  changePassword,
  loginUser,
  refreshTokens,
  registerUser,
  revokeTokens,
} from '@/controllers/auth.controller';
import {
  changePasswordSchema,
  loginSchema,
  refreshSchema,
  registerSchema,
  revokeSchema,
} from '@/validation/auth.schema';
import { asyncHandler, validateRequest } from '@chatapp/common';

import { Router } from 'express';

export const authRouter: Router = Router();

authRouter.post('/register', validateRequest({ body: registerSchema }), asyncHandler(registerUser));
authRouter.post('/login', validateRequest({ body: loginSchema }), asyncHandler(loginUser));
authRouter.post('/refresh', validateRequest({ body: refreshSchema }), asyncHandler(refreshTokens));
authRouter.post('/revoke', validateRequest({ body: revokeSchema }), asyncHandler(revokeTokens));
authRouter.post(
  '/change-password',
  validateRequest({ body: changePasswordSchema }),
  asyncHandler(changePassword),
);

