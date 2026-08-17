import { authProxyService } from '@/services/auth-proxy.service';
import { userProxyService } from '@/services/user-proxy.service';
import {
  changePasswordSchema,
  loginSchema,
  refreshSchema,
  registerSchema,
  revokeSchema,
} from '@/validation/auth.schema';
import { AsyncHandler } from '@chatapp/common';
import jwt from 'jsonwebtoken';

export const registerUser: AsyncHandler = async (req, res, next) => {
  try {
    const payload = registerSchema.parse(req.body);
    const response = await authProxyService.register(payload);
    res.status(201).json(response);
  } catch (error) {
    next(error);
  }
};

export const loginUser: AsyncHandler = async (req, res, next) => {
  try {
    const payload = loginSchema.parse(req.body);
    const tokens = await authProxyService.login(payload);

    let user = null;
    try {
      const decoded = jwt.decode(tokens.accessToken) as { sub?: string } | null;
      if (decoded?.sub) {
        const userRes = await userProxyService.getUserById(decoded.sub);
        user = userRes.data;
      }
    } catch {
      // Fallback if user profile fetching fails
    }

    res.json({
      ...tokens,
      user,
    });
  } catch (error) {
    next(error);
  }
};

export const refreshTokens: AsyncHandler = async (req, res, next) => {
  try {
    const payload = refreshSchema.parse(req.body);
    const tokens = await authProxyService.refresh(payload);
    res.json(tokens);
  } catch (error) {
    next(error);
  }
};

export const revokeTokens: AsyncHandler = async (req, res, next) => {
  try {
    const payload = revokeSchema.parse(req.body);
    await authProxyService.revoke(payload);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

export const changePassword: AsyncHandler = async (req, res, next) => {
  try {
    const payload = changePasswordSchema.parse(req.body);
    const response = await authProxyService.changePassword(payload);
    res.json(response);
  } catch (error) {
    next(error);
  }
};

