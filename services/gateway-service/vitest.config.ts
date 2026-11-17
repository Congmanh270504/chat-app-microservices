import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    env: {
      NODE_ENV: 'test',
      GATEWAY_PORT: '4000',
      USER_SERVICE_URL: 'http://localhost:4001',
      AUTH_SERVICE_URL: 'http://localhost:4003',
      CHAT_SERVICE_URL: 'http://localhost:4002',
      JWT_SECRET: 'supersecretjwtkeythatisatleast32characterslong',
      INTERNAL_API_TOKEN: 'internalapitoken16chars',
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
    },
  },
});
