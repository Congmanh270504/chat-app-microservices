import type { Request, Response, NextFunction } from 'express';

interface RateLimitOptions {
  windowMs: number; // Thời gian cửa sổ tính giới hạn (ví dụ 60.000ms = 1 phút)
  max: number; // Số request tối đa trong cửa sổ
  message?: string;
  skip?: (req: Request) => boolean;
}

interface ClientRecord {
  count: number;
  resetTime: number;
}

/**
 * In-memory Rate Limiter siêu nhẹ, không cần Redis hay thư viện ngoài.
 * Chặn đứng các đợt spam request, flood traffic từ bot hoặc hacker.
 */
export const createRateLimiter = (options: RateLimitOptions) => {
  const {
    windowMs,
    max,
    message = 'Too many requests from your IP, please try again later.',
    skip,
  } = options;

  const clients = new Map<string, ClientRecord>();

  // Tự động dọn dẹp các IP đã hết hạn sau mỗi 3 phút để tránh tràn RAM
  setInterval(
    () => {
      const now = Date.now();
      for (const [ip, record] of clients.entries()) {
        if (now > record.resetTime) {
          clients.delete(ip);
        }
      }
    },
    3 * 60 * 1000,
  ).unref();

  return (req: Request, res: Response, next: NextFunction): void => {
    if (skip && skip(req)) {
      return next();
    }

    // Lấy IP thật của client (được Caddy chuyển tiếp qua X-Forwarded-For)
    const clientIp =
      (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
      req.socket.remoteAddress ||
      'unknown';

    const now = Date.now();
    const client = clients.get(clientIp);

    if (!client || now > client.resetTime) {
      clients.set(clientIp, {
        count: 1,
        resetTime: now + windowMs,
      });
      res.setHeader('X-RateLimit-Limit', max);
      res.setHeader('X-RateLimit-Remaining', max - 1);
      return next();
    }

    client.count += 1;
    const remaining = Math.max(0, max - client.count);
    res.setHeader('X-RateLimit-Limit', max);
    res.setHeader('X-RateLimit-Remaining', remaining);
    res.setHeader('X-RateLimit-Reset', Math.ceil(client.resetTime / 1000));

    if (client.count > max) {
      res.status(429).json({
        status: 429,
        error: 'Too Many Requests',
        message,
        retryAfterSeconds: Math.ceil((client.resetTime - now) / 1000),
      });
      return;
    }

    next();
  };
};

// 1. Giới hạn chung cho toàn bộ API Gateway: tối đa 150 request / phút / IP
export const generalLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  max: 150,
  skip: (req) => req.path === '/health' || req.path === '/keep-alive',
});

// 2. Giới hạn nghiêm ngặt cho Auth (đăng nhập, đăng ký): tối đa 20 request / phút / IP chống brute-force
export const authLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  max: 20,
  message: 'Too many requests from your IP, please try again later.',
});
