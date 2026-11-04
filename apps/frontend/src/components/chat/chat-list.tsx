/* eslint-disable react-hooks/set-state-in-effect */
'use client';

import { getPopulatedConversationsAction, getUsersAction } from '@/app/chat/chat.actions';
import { SearchSelectInput, type SearchSelectOption } from '@/components/SearchSelectInput';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ToggleTabs } from '@/components/ui/toggle-tabs';
import { Button } from '@/components/ui/button';
import { CreateGroupDialog } from '@/components/chat/create-group-dialog';
import { Users } from 'lucide-react';
import { pusherClient } from '@/lib/pusher';
import { cn } from '@/lib/utils';
import { useSession } from 'next-auth/react';
import { useParams, useRouter } from 'next/navigation';
import * as React from 'react';
import { toast } from 'sonner';

const FILTER_TABS = [
  { label: 'All Messages', value: 'all' },
  { label: 'User', value: 'direct' },
  { label: 'Groups', value: 'groups' },
];

export interface PopulatedConversation {
  id: string;
  title: string | null;
  participantIds: string[];
  isGroup?: boolean;
  createdAt: Date | string;
  updatedAt: Date | string;
  lastMessageAt: Date | string | null;
  lastMessagePreview: string | null;
  lastMessageStatus?: string | null;
  lastMessageSenderId?: string | null;
  recipient?: {
    id: string;
    displayName?: string;
    email?: string;
    image_url?: string;
  } | null;
}

interface ChatListProps {
  initialConversations?: PopulatedConversation[];
  currentUserId?: string;
}

export function ChatList({ initialConversations = [], currentUserId: propUserId }: ChatListProps) {
  const router = useRouter();
  const params = useParams();
  const activeId = params?.id as string | undefined;

  const [conversations, setConversations] =
    React.useState<PopulatedConversation[]>(initialConversations);
  const [selectedValue, setSelectedValue] = React.useState('');
  const [userOptions, setUserOptions] = React.useState<SearchSelectOption[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = React.useState(false);
  const [isCreating, setIsCreating] = React.useState(false);
  const [isGroupDialogOpen, setIsGroupDialogOpen] = React.useState(false);
  const [filterTab, setFilterTab] = React.useState('all');

  const filteredConversations = React.useMemo(() => {
    return conversations.filter((conv) => {
      const isGroup = Boolean(
        conv.title || (conv.participantIds && conv.participantIds.length > 2),
      );
      if (filterTab === 'direct') return !isGroup;
      if (filterTab === 'groups') return isGroup;
      return true;
    });
  }, [conversations, filterTab]);

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
    // Only fetch if initialConversations wasn't loaded from server
    if (!initialConversations || initialConversations.length === 0) {
      refreshConversations();
    }
  }, [initialConversations, refreshConversations]);

  // Subscribe to real-time updates on user personal channel
  const { data: session } = useSession();
  const currentUserId = propUserId || session?.user?.id;

  React.useEffect(() => {
    if (!currentUserId) return;

    const userChannelName = `user-${currentUserId}`;
    const channel = pusherClient.subscribe(userChannelName);

    const handleRefresh = () => {
      refreshConversations();
    };

    channel.bind('conversation:new', handleRefresh);
    channel.bind('new-message', handleRefresh);
    channel.bind('conversation:read', handleRefresh);

    return () => {
      channel.unbind('conversation:new', handleRefresh);
      channel.unbind('new-message', handleRefresh);
      channel.unbind('conversation:read', handleRefresh);
      pusherClient.unsubscribe(userChannelName);
    };
  }, [currentUserId, refreshConversations]);

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
      // Check if conversation already exists between current user and target user
      const existingConv = conversations.find((conv) => {
        if (conv.title) return false;
        const pIds = conv.participantIds || [];
        return pIds.includes(option.value);
      });

      if (existingConv) {
        toast.success('Switch to conversation');
        router.push(`/chat/${existingConv.id}`);
      } else {
        // Draft conversation: generate UUIDv4 and redirect without saving to DB yet
        const draftId = crypto.randomUUID();
        router.push(`/chat/${draftId}?recipientId=${option.value}`);
      }
    } catch (err: any) {
      console.error('Error when open conversation:', err);
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
      return <span className="text-[10px] text-muted-foreground italic">Sending...</span>;
    }
    if (status === 'BROKEN') {
      return <span className="text-[10px] text-red-500 font-semibold">Error</span>;
    }
    return null;
  };

  return (
    <div className="flex flex-col h-full bg-background ">
      {/* Messages Section */}
      <div className="p-3 flex items-center justify-between mt-0">
        <h2 className="font-bold text-xl p-0 mt-0">Messages</h2>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsGroupDialogOpen(true)}
          className="rounded-xl h-8 px-2.5 text-xs font-semibold gap-1.5 hover:bg-muted text-foreground border-border/60 cursor-pointer"
          title="Tạo nhóm mới"
        >
          <Users className="size-4 text-blue-600 dark:text-blue-400" />
          <span>Create group</span>
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

      {/* Filter Tabs */}
      <div className="px-3 pb-2 border-b">
        <ToggleTabs items={FILTER_TABS} value={filterTab} onChange={setFilterTab} fullWidth />
      </div>

      {/* Chat List Items */}
      <ScrollArea className="flex-1">
        <div className="flex flex-col px-2 pb-4 pt-2">
          {filteredConversations.length === 0 ? (
            <div className="p-4 text-center text-xs text-muted-foreground">
              No conversation yet. Search users to start messages
            </div>
          ) : (
            filteredConversations.map((conv) => {
              const isActive = activeId === conv.id;
              const isGroup =
                conv.isGroup ||
                (conv.participantIds && conv.participantIds.length > 2) ||
                Boolean(conv.title);
              const partnerName =
                conv.recipient?.displayName ||
                conv.recipient?.email ||
                conv.title ||
                (isGroup ? `Nhóm (${conv.participantIds?.length || 0})` : 'Người dùng');
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
                    {isGroup ? (
                      <div className="h-12 w-12 rounded-2xl bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold shrink-0">
                        <Users className="size-6" />
                      </div>
                    ) : (
                      <Avatar className="h-12 w-12">
                        {partnerAvatar ? <AvatarImage src={partnerAvatar} alt={partnerName} /> : null}
                        <AvatarFallback>{fallbackLetter}</AvatarFallback>
                      </Avatar>
                    )}
                  </div>

                  <div className="flex-1 overflow-hidden">
                    <div className="flex justify-between items-center mb-1">
                      <h3 className="font-semibold text-sm truncate">{partnerName}</h3>
                      <span className="text-xs text-muted-foreground shrink-0 ml-2">
                        {formattedTime}
                      </span>
                    </div>

                    <div className="flex justify-between items-center gap-2">
                      <p
                        className={cn(
                          'text-xs truncate flex-1',
                          conv.lastMessageSenderId &&
                            conv.lastMessageSenderId !== currentUserId &&
                            conv.lastMessageStatus !== 'READ'
                            ? 'font-semibold text-foreground'
                            : 'text-muted-foreground',
                        )}
                      >
                        {previewMessage}
                      </p>
                      {!conv.lastMessageSenderId || conv.lastMessageSenderId === currentUserId ? (
                        renderStatus(conv.lastMessageStatus)
                      ) : conv.lastMessageStatus !== 'READ' ? (
                        <span className="w-2.5 h-2.5 rounded-full bg-blue-500 shrink-0" />
                      ) : null}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </ScrollArea>

      <CreateGroupDialog
        open={isGroupDialogOpen}
        onOpenChange={setIsGroupDialogOpen}
        userOptions={userOptions}
        onGroupCreated={refreshConversations}
      />
    </div>
  );
}
