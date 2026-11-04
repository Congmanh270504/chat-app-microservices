import { auth } from '@/lib/auth';
import { getConversationAction, getUserByIdAction } from '@/app/chat/chat.actions';
import { ChatArea } from '@/components/chat/chat-area';

export const dynamic = 'force-dynamic';

export default async function ChatDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ recipientId?: string }>;
}) {
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;
  const chatId = resolvedParams.id;
  const recipientId = resolvedSearchParams?.recipientId;

  let recipient = null;
  let currentUserId: string | undefined = undefined;
  let isGroup = false;
  let conversationTitle: string | null = null;
  let participantCount = 0;
  const initialUsers: Record<string, { id: string; displayName?: string; image_url?: string | null }> = {};

  try {
    const session = await auth();
    currentUserId = session?.user?.id;

    const convRes = await getConversationAction(chatId);
    if (convRes.success && convRes.data) {
      const conversation = convRes.data;
      participantCount = conversation.participantIds?.length || 0;
      isGroup =
        Boolean(conversation.isGroup) ||
        participantCount > 2 ||
        Boolean(conversation.title);

      if (isGroup) {
        conversationTitle = conversation.title || `Group (${participantCount} members)`;
      }

      // Pre-fetch all participants in the conversation to resolve avatars and names
      const participantIds: string[] = conversation.participantIds || [];
      const userList = await Promise.all(
        participantIds.map(async (id) => {
          try {
            const userRes = await getUserByIdAction(id);
            return userRes.success && userRes.data ? userRes.data : null;
          } catch {
            return null;
          }
        }),
      );

      for (const u of userList) {
        if (u) {
          initialUsers[u.id] = {
            id: u.id,
            displayName: u.displayName,
            image_url: u.image_url,
          };
        }
      }

      if (!isGroup) {
        const targetUserId =
          conversation.participantIds?.find((id: string) => id !== currentUserId) ||
          conversation.participantIds?.[0];

        if (targetUserId && initialUsers[targetUserId]) {
          recipient = initialUsers[targetUserId];
        } else if (targetUserId) {
          const userRes = await getUserByIdAction(targetUserId);
          if (userRes.success && userRes.data) {
            recipient = userRes.data;
            initialUsers[targetUserId] = userRes.data;
          }
        }
      }
    } else if (recipientId) {
      // Draft conversation before first message is sent
      const userRes = await getUserByIdAction(recipientId);
      if (userRes.success && userRes.data) {
        recipient = userRes.data;
        initialUsers[recipientId] = userRes.data;
      }
    }
  } catch (error) {
    console.error('Failed to fetch recipient user on server:', error);
  }

  return (
    <ChatArea
      chatId={chatId}
      recipient={recipient}
      currentUserId={currentUserId}
      draftRecipientId={recipientId}
      isGroup={isGroup}
      conversationTitle={conversationTitle}
      participantCount={participantCount}
      initialUsers={initialUsers}
    />
  );
}
