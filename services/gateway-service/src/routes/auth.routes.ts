import {
  changePassword,
  googleLogin,
  loginUser,
  refreshTokens,
  registerUser,
  resetPassword,
  revokeTokens,
} from '@/controllers/auth.controller';
import { requireAdmin } from '@/middleware/require-admin';
import { requireAuth } from '@/middleware/require-auth';
import {
  changePasswordSchema,
  googleLoginSchema,
  loginSchema,
  refreshSchema,
  registerSchema,
  resetPasswordSchema,
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
authRouter.post(
  '/reset-password',
  requireAuth,
  requireAdmin,
  validateRequest({ body: resetPasswordSchema }),
  asyncHandler(resetPassword),
);
authRouter.post('/google', validateRequest({ body: googleLoginSchema }), asyncHandler(googleLogin));
