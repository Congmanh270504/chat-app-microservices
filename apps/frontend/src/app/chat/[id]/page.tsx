import { auth } from '@/lib/auth';
import { getConversationAction, getUserByIdAction } from '@/app/chat/chat.actions';
import { ChatArea } from '@/components/chat/chat-area';

export const dynamic = 'force-dynamic';

export default async function ChatDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const chatId = resolvedParams.id;

  let recipient = null;
  let currentUserId: string | undefined = undefined;

  try {
    const session = await auth();
    currentUserId = session?.user?.id;

    const convRes = await getConversationAction(chatId);
    if (convRes.success && convRes.data) {
      const conversation = convRes.data;
      const targetUserId =
        conversation.participantIds?.find((id: string) => id !== currentUserId) ||
        conversation.participantIds?.[0];

      if (targetUserId) {
        const userRes = await getUserByIdAction(targetUserId);
        if (userRes.success && userRes.data) {
          recipient = userRes.data;
        }
      }
    }
  } catch (error) {
    console.error('Failed to fetch recipient user on server:', error);
  }

  return <ChatArea chatId={chatId} recipient={recipient} currentUserId={currentUserId} />;
}
