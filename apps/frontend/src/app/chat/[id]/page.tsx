import { ChatArea } from '@/components/chat/chat-area';

export default async function ChatDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  return <ChatArea chatId={resolvedParams.id} />;
}
