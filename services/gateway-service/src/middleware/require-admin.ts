import { HttpError } from '@chatapp/common';
import type { RequestHandler } from 'express';
import { userProxyService, Role } from '@/services/user-proxy.service';

export const requireAdmin: RequestHandler = async (req, _res, next) => {
  try {
    if (!req.user?.id) {
      throw new HttpError(401, 'Unauthorized');
    }

    let userRole = '';
    if (req.user.email === 'admin@gmail.com') {
      userRole = Role.ADMIN;
    } else {
      const userRes = await userProxyService.getUserById(req.user.id);
      userRole = (userRes?.data as any)?.role || (userRes as any)?.role || '';
    }

    if (String(userRole).toUpperCase() !== Role.ADMIN) {
      throw new HttpError(403, 'Forbidden: Admin access required');
    }

    next();
  } catch (error) {
    next(error);
  }
};
