/* eslint-disable react-hooks/set-state-in-effect */
'use client';

import * as React from 'react';
import { useRouter, useParams } from 'next/navigation';
import { toast } from 'sonner';
import { useSession } from 'next-auth/react';
import { Edit } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { SearchSelectInput, type SearchSelectOption } from '@/components/SearchSelectInput';
import {
  getUsersAction,
  createConversationAction,
  getPopulatedConversationsAction,
} from '@/app/chat/chat.actions';
import { pusherClient } from '@/lib/pusher';

export interface PopulatedConversation {
  id: string;
  title: string | null;
  participantIds: string[];
  createdAt: Date | string;
  updatedAt: Date | string;
  lastMessageAt: Date | string | null;
  lastMessagePreview: string | null;
  lastMessageStatus?: string | null;
  recipient?: {
    id: string;
    displayName?: string;
    email?: string;
    image_url?: string;
  } | null;
}

interface ChatListProps {
  initialConversations?: PopulatedConversation[];
}

export function ChatList({ initialConversations = [] }: ChatListProps) {
  const router = useRouter();
  const params = useParams();
  const activeId = params?.id as string | undefined;

  const [conversations, setConversations] =
    React.useState<PopulatedConversation[]>(initialConversations);
  const [selectedValue, setSelectedValue] = React.useState('');
  const [userOptions, setUserOptions] = React.useState<SearchSelectOption[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = React.useState(false);
  const [isCreating, setIsCreating] = React.useState(false);

  React.useEffect(() => {
    setConversations(initialConversations);
  }, [initialConversations]);

  const refreshConversations = React.useCallback(async () => {
    try {
      const res = await getPopulatedConversationsAction();
      if (res.success && res.data) {
        setConversations(res.data);
      }
    } catch (e) {
      console.error('Failed to sync conversations:', e);
    }
  }, []);

  React.useEffect(() => {
    refreshConversations();
  }, [refreshConversations, activeId]);

  // Subscribe to real-time updates on user personal channel and active conversations
  const { data: session } = useSession();
  const currentUserId = session?.user?.id;

  React.useEffect(() => {
    if (!currentUserId) return;

    const userChannelName = `user-${currentUserId}`;
    const channel = pusherClient.subscribe(userChannelName);

    const handleRefresh = () => {
      refreshConversations();
    };

    channel.bind('conversation:new', handleRefresh);
    channel.bind('new-message', handleRefresh);

    return () => {
      channel.unbind('conversation:new', handleRefresh);
      channel.unbind('new-message', handleRefresh);
      pusherClient.unsubscribe(userChannelName);
    };
  }, [currentUserId, refreshConversations]);

  React.useEffect(() => {
    if (!conversations.length) return;
    const conversationIds = conversations.map((c) => c.id);

    conversationIds.forEach((id) => {
      const channelName = `chat-${id}`;
      const channel = pusherClient.subscribe(channelName);
      channel.bind('new-message', () => {
        refreshConversations();
      });
    });

    return () => {
      conversationIds.forEach((id) => {
        const channelName = `chat-${id}`;
        pusherClient.unsubscribe(channelName);
      });
    };
  }, [conversations.map((c) => c.id).join(','), refreshConversations]);

  React.useEffect(() => {
    async function loadUsers() {
      setIsLoadingUsers(true);
      const res = await getUsersAction();
      if (res.success && res.data) {
        const opts: SearchSelectOption[] = res.data.map((u: any) => ({
          key: u.id,
          value: u.id,
          image_url: u.image_url,
          label: u.displayName || u.email,
          description: u.email,
          searchText: `${u.displayName || ''} ${u.email}`,
        }));
        setUserOptions(opts);
      } else if (res.error) {
        console.error('Failed to fetch users:', res.error);
      }
      setIsLoadingUsers(false);
    }
    loadUsers();
  }, []);

  const handleSelectUser = async (option: SearchSelectOption) => {
    setIsCreating(true);
    try {
      const res = await createConversationAction(option.value);
      if (res.success && res.data?.id) {
        toast.success('Chuyển tới cuộc trò chuyện');
        await refreshConversations();
        router.push(`/chat/${res.data.id}`);
        router.refresh();
      } else {
        toast.error(res.error || 'Tạo cuộc trò chuyện thất bại');
      }
    } catch (err: any) {
      toast.error('Có lỗi xảy ra khi tạo cuộc trò chuyện');
    } finally {
      setIsCreating(false);
      setSelectedValue('');
    }
  };

  const formatTime = (dateStr?: Date | string | null) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '';
    const now = new Date();
    const isToday =
      d.getDate() === now.getDate() &&
      d.getMonth() === now.getMonth() &&
      d.getFullYear() === now.getFullYear();

    if (isToday) {
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  const renderStatus = (status?: string | null) => {
    if (!status) return null;
    if (status === 'READ') {
      return (
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          className="text-blue-500 shrink-0"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M4 12L9 17L20 6"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M4 17L9 22L20 11"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="opacity-50"
          />
        </svg>
      );
    }
    if (status === 'DELIVERED' || status === 'SENT') {
      return (
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          className="text-muted-foreground shrink-0"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M4 12L9 17L20 6"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
    }
    if (status === 'PENDING') {
      return <span className="text-[10px] text-muted-foreground italic">Đang gửi...</span>;
    }
    if (status === 'BROKEN') {
      return <span className="text-[10px] text-red-500 font-semibold">Lỗi</span>;
    }
    return null;
  };

  return (
    <div className="flex flex-col h-full bg-background ">
      {/* Messages Section */}
      <div className="p-3 flex items-center justify-between mt-0 ">
        <h2 className="font-bold text-xl p-0  mt-0">Messages</h2>
        <Button
          variant="ghost"
          size="icon"
          className="mt-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-full"
        >
          <Edit size={20} />
        </Button>
      </div>

      {/* Search Bar */}
      <div className="p-2">
        <SearchSelectInput
          value={selectedValue}
          onChange={setSelectedValue}
          onSelectOption={handleSelectUser}
          options={userOptions}
          placeholder="Search users..."
          emptyText={isLoadingUsers ? 'Loading...' : 'No users found'}
          disabled={isCreating}
        />
      </div>

      {/* Filter Chips */}
      <div className="px-3 pb-2 border-b">
        <ScrollArea className="w-full whitespace-nowrap">
          <div className="flex w-max space-x-2 pb-2">
            <Button
              variant="default"
              className="rounded-full bg-blue-600 hover:bg-blue-700 h-8 text-xs px-4"
            >
              All Messages
            </Button>
            <Button
              variant="ghost"
              className="rounded-full h-8 text-xs font-semibold hover:bg-muted text-foreground"
            >
              Groups
            </Button>
            <Button
              variant="ghost"
              className="rounded-full h-8 text-xs font-semibold hover:bg-muted text-foreground"
            >
              Pinned
            </Button>
            <Button
              variant="ghost"
              className="rounded-full h-8 text-xs font-semibold hover:bg-muted text-foreground"
            >
              Archived
            </Button>
          </div>
          <ScrollBar orientation="horizontal" className="invisible" />
        </ScrollArea>
      </div>

      {/* Chat List Items */}
      <ScrollArea className="flex-1">
        <div className="flex flex-col px-2 pb-4">
          {conversations.length === 0 ? (
            <div className="p-4 text-center text-xs text-muted-foreground">
              Chưa có cuộc trò chuyện nào. Hãy tìm kiếm người dùng ở trên để bắt đầu nhắn tin!
            </div>
          ) : (
            conversations.map((conv) => {
              const isActive = activeId === conv.id;
              const partnerName =
                conv.recipient?.displayName || conv.recipient?.email || conv.title || 'Người dùng';
              const partnerAvatar = conv.recipient?.image_url || '';
              const fallbackLetter = partnerName ? partnerName[0].toUpperCase() : 'U';
              const formattedTime = formatTime(conv.lastMessageAt);
              const previewMessage = conv.lastMessagePreview || '';

              return (
                <div
                  key={conv.id}
                  onClick={() => router.push(`/chat/${conv.id}`)}
                  className={`flex items-center gap-3 p-3 rounded-2xl cursor-pointer transition-colors ${
                    isActive ? 'bg-muted/80 font-medium' : 'hover:bg-muted/50'
                  }`}
                >
                  <div className="relative shrink-0">
                    <Avatar className="h-12 w-12">
                      {partnerAvatar ? (
                        <AvatarImage src={partnerAvatar} alt={partnerName} />
                      ) : null}
                      <AvatarFallback>{fallbackLetter}</AvatarFallback>
                    </Avatar>
                  </div>

                  <div className="flex-1 overflow-hidden">
                    <div className="flex justify-between items-center mb-1">
                      <h3 className="font-semibold text-sm truncate">{partnerName}</h3>
                      <span className="text-xs text-muted-foreground shrink-0 ml-2">
                        {formattedTime}
                      </span>
                    </div>

                    <div className="flex justify-between items-center gap-2">
                      <p className="text-xs truncate text-muted-foreground flex-1">
                        {previewMessage}
                      </p>
                      {renderStatus(conv.lastMessageStatus)}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
