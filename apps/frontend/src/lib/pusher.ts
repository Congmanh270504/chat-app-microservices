import PusherServer from 'pusher';
import PusherClient from 'pusher-js';

export const pusherServer = new PusherServer({
  appId: process.env.PUSHER_APP_ID!,
  key: process.env.PUSHER_KEY!,
  secret: process.env.PUSHER_SERCET!,
  cluster: process.env.PUSHER_CLUSTER!,
  useTLS: true,
});

export const pusherClient = new PusherClient(process.env.NEXT_PUBLIC_PUSHER_APP_KEY!, {
  cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER || process.env.PUSHER_CLUSTER || 'ap1',
  forceTLS: true,
  enabledTransports: ['ws', 'wss'],
  disabledTransports: ['xhr_polling', 'xhr_streaming'],
  activityTimeout: 120000,
  pongTimeout: 60000,
});
