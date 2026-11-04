import { z } from '@chatapp/common';

export const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  displayName: z.string().min(3).max(30),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export const refreshSchema = z.object({
  refreshToken: z.string(),
});

export const revokeSchema = z.object({
  userId: z.string().uuid(),
});

export const changePasswordSchema = z.object({
  userId: z.string().uuid(),
  currentPassword: z.string().min(1, 'Mật khẩu hiện tại là bắt buộc'),
  newPassword: z.string().min(6, 'Mật khẩu mới phải có ít nhất 6 ký tự'),
});

export const resetPasswordSchema = z.object({
  userId: z.string().uuid(),
  newPassword: z.string().min(6, 'Mật khẩu mới phải có ít nhất 6 ký tự'),
  email: z.string().email().optional(),
  displayName: z.string().optional(),
});

export const googleLoginSchema = z.object({
  email: z.string().email(),
  displayName: z.string().optional(),
  image_url: z.string().optional(),
});
