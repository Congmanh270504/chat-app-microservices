/* eslint-disable react-hooks/set-state-in-effect */
'use client';

import * as React from 'react';
import {
  Phone,
  Video,
  Search,
  Users,
  Smile,
  SmilePlus,
  Paperclip,
  Mic,
  Send,
  Loader2,
  X,
} from 'lucide-react';
import { useSession } from 'next-auth/react';
import { toast } from 'sonner';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  MessageScrollerProvider,
  MessageScroller,
  MessageScrollerViewport,
  MessageScrollerContent,
  MessageScrollerItem,
  MessageScrollerButton,
} from '@/components/ui/message-scroller';
import { Bubble, BubbleContent, BubbleGroup, BubbleReactions } from '@/components/ui/bubble';
import { Message, MessageAvatar, MessageContent, MessageFooter } from '@/components/ui/message';
import { pusherClient } from '@/lib/pusher';
import {
  getMessagesAction,
  sendMessageAction,
  addReactionAction,
  markConversationAsReadAction,
  searchMessagesAction,
  createConversationAction,
  getUserByIdAction,
} from '@/app/chat/chat.actions';
import { cn } from '@/lib/utils';
import dynamic from 'next/dynamic';
import type { EmojiClickData } from 'emoji-picker-react';

const EmojiPicker = dynamic(() => import('emoji-picker-react'), { ssr: false });

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';

export interface RecipientUser {
  id?: string;
  displayName?: string;
  email?: string;
  image_url?: string | null;
}

export interface Reaction {
  messageId: string;
  userReactId: string;
  emoji: string;
  createdAt: string | Date;
}

export interface ChatMessage {
  id: string;
  conversationId: string;
  senderId: string;
  body: string;
  event?: boolean;
  status?: string;
  createdAt?: string | Date;
  reactions?: Reaction[];
}

function formatTime(dateStr?: string | Date) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function formatDividerTime(dateStr?: string | Date) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '';
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${hours}:${minutes} ${day}/${month}/${year}`;
}

interface MessageBubbleProps {
  msg: ChatMessage;
  isMe: boolean;
  align: 'start' | 'end';
  currentUserId?: string;

  hasPrevReaction?: boolean;
  isHighlighted?: boolean;
  onToggleReaction: (messageId: string, emoji: string) => void;
}

const MessageBubble = React.memo(function MessageBubble({
  msg,
  isMe,
  align,
  currentUserId,
  hasPrevReaction,
  isHighlighted,
  onToggleReaction,
}: MessageBubbleProps) {
  const [openPicker, setOpenPicker] = React.useState(false);

  const reactionsMap = (msg.reactions || []).reduce<
    Record<string, { count: number; users: string[] }>
  >((acc, r) => {
    if (!acc[r.emoji]) {
      acc[r.emoji] = { count: 0, users: [] };
    }
    acc[r.emoji].count += 1;
    acc[r.emoji].users.push(r.userReactId);
    return acc;
  }, {});

  const reactionEntries = Object.entries(reactionsMap);
  const hasReactions = reactionEntries.length > 0;
  const hasUserReacted = currentUserId
    ? (msg.reactions || []).some((r) => r.userReactId === currentUserId)
    : false;

  return (
    <HoverCard>
      <HoverCardTrigger
        render={
          <Bubble
            id={`message-${msg.id}`}
            variant="muted"
            align={align}
            className={cn(
              'relative group/bubble w-fit max-w-[50%]',
              isMe ? 'self-end' : 'self-start',
              hasPrevReaction && 'mt-4',
            )}
          />
        }
      >
        <BubbleContent
          className={cn(
            'wrap-break-word whitespace-pre-wrap transition-all duration-300',
            isHighlighted &&
              'ring-2 ring-primary shadow-lg bg-primary/15 dark:bg-primary/25 scale-[1.02]',
          )}
        >
          {msg.body}
        </BubbleContent>
        <BubbleReactions
          align={isMe ? 'start' : 'end'}
          side="bottom"
          className={cn(
            'py-0.5 px-1.5 gap-1 shadow-xs border bg-background/95 backdrop-blur-xs transition-opacity',
            hasReactions
              ? 'opacity-100 flex items-center'
              : 'opacity-0 group-hover/bubble:opacity-100 flex items-center',
          )}
        >
          {reactionEntries.map(([emoji, { count, users }]) => {
            const isUserReacted = currentUserId ? users.includes(currentUserId) : false;
            return (
              <button
                key={emoji}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleReaction(msg.id, emoji);
                }}
                className={cn(
                  'inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-xs font-medium cursor-pointer transition-colors',
                  isUserReacted
                    ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 border border-blue-300 dark:border-blue-700'
                    : 'hover:bg-muted text-foreground',
                )}
              >
                <span>{emoji}</span>
                {count > 1 && <span className="text-[10px] opacity-75">{count}</span>}
              </button>
            );
          })}

          {!hasUserReacted && (
            <DropdownMenu open={openPicker} onOpenChange={setOpenPicker}>
              <DropdownMenuTrigger
                render={
                  <button
                    type="button"
                    onClick={(e) => e.stopPropagation()}
                    className="inline-flex items-center justify-center h-5 w-5 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors cursor-pointer"
                  />
                }
              >
                <SmilePlus size={13} />
              </DropdownMenuTrigger>
              {openPicker && (
                <DropdownMenuContent
                  className="w-[22em] p-0 border shadow-lg z-50"
                  align={align === 'end' ? 'end' : 'start'}
                  side="top"
                >
                  <EmojiPicker
                    onEmojiClick={(emojiData) => {
                      onToggleReaction(msg.id, emojiData.emoji);
                      setOpenPicker(false);
                    }}
                    previewConfig={{ showPreview: false }}
                    width={350}
                    height={380}
                  />
                </DropdownMenuContent>
              )}
            </DropdownMenu>
          )}
        </BubbleReactions>
      </HoverCardTrigger>
      <HoverCardContent side={isMe ? 'left' : 'right'}>
        {formatTime(msg.createdAt)}
      </HoverCardContent>
    </HoverCard>
  );
});

export interface UserProfileInfo {
  id: string;
  displayName?: string;
  image_url?: string | null;
}

interface ChatAreaProps {
  chatId: string | null;
  recipient?: RecipientUser | null;
  currentUserId?: string;
  draftRecipientId?: string;
  isGroup?: boolean;
  conversationTitle?: string | null;
  participantCount?: number;
  initialUsers?: Record<string, UserProfileInfo>;
}

export function ChatArea({
  chatId,
  recipient,
  currentUserId: propUserId,
  draftRecipientId,
  isGroup,
  conversationTitle,
  participantCount,
  initialUsers,
}: ChatAreaProps) {
  const { data: session } = useSession();
  const currentUserId = propUserId || session?.user?.id;

  const [usersMap, setUsersMap] = React.useState<Record<string, UserProfileInfo>>(() => {
    const base: Record<string, UserProfileInfo> = { ...(initialUsers || {}) };
    if (recipient?.id) {
      base[recipient.id] = {
        id: recipient.id,
        displayName: recipient.displayName,
        image_url: recipient.image_url,
      };
    }
    return base;
  });

  React.useEffect(() => {
    setUsersMap((prev) => {
      const next = { ...prev, ...(initialUsers || {}) };
      if (recipient?.id) {
        next[recipient.id] = {
          id: recipient.id,
          displayName: recipient.displayName,
          image_url: recipient.image_url,
        };
      }
      return next;
    });
  }, [initialUsers, recipient]);

  const [messages, setMessages] = React.useState<ChatMessage[]>([]);
  const [inputText, setInputText] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);
  const [isSending, setIsSending] = React.useState(false);
  const [openEmoji, setOpenEmoji] = React.useState(false);
  const [isSearchOpen, setIsSearchOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [searchResults, setSearchResults] = React.useState<any[]>([]);
  const [isSearching, setIsSearching] = React.useState(false);
  const [totalHits, setTotalHits] = React.useState(0);
  const [highlightedMessageId, setHighlightedMessageId] = React.useState<string | null>(null);
  const isDraftRef = React.useRef(Boolean(draftRecipientId));

  React.useEffect(() => {
    isDraftRef.current = Boolean(draftRecipientId);
  }, [draftRecipientId, chatId]);

  // Lazy-load missing user profiles for any senders in messages
  React.useEffect(() => {
    const missingIds: string[] = [];
    for (const msg of messages) {
      if (msg.senderId && !usersMap[msg.senderId] && msg.senderId !== currentUserId) {
        missingIds.push(msg.senderId);
      }
    }
    const uniqueMissing = Array.from(new Set(missingIds));
    if (uniqueMissing.length > 0) {
      Promise.all(
        uniqueMissing.map(async (uid) => {
          try {
            const res = await getUserByIdAction(uid);
            if (res.success && res.data) {
              return res.data;
            }
          } catch {
            // ignore
          }
          return null;
        }),
      ).then((fetched) => {
        setUsersMap((prev) => {
          const next = { ...prev };
          let updated = false;
          for (const u of fetched) {
            if (u && !next[u.id]) {
              next[u.id] = { id: u.id, displayName: u.displayName, image_url: u.image_url };
              updated = true;
            }
          }
          return updated ? next : prev;
        });
      });
    }
  }, [messages, usersMap, currentUserId]);

  const textareaRef = React.useRef<HTMLTextAreaElement>(null);
  const bottomRef = React.useRef<HTMLDivElement>(null);

  const displayName = recipient?.displayName || recipient?.email || 'Người dùng';
  const avatarUrl = recipient?.image_url || '';
  const fallbackLetter = displayName ? displayName[0].toUpperCase() : 'U';

  // Group consecutive messages by senderId and 15-minute gap
  const groupedMessages = React.useMemo(() => {
    // Deduplicate messages by ID to prevent duplicate React keys
    const seenIds = new Set<string>();
    const uniqueMessages = messages.filter((msg) => {
      if (!msg || !msg.id || !msg.senderId) return false;
      if (seenIds.has(msg.id)) return false;
      seenIds.add(msg.id);
      return true;
    });

    const groups: {
      showDivider: boolean;
      dividerDate?: string | Date;
      isEvent?: boolean;
      messages: ChatMessage[];
      senderId: string;
    }[] = [];

    for (let i = 0; i < uniqueMessages.length; i++) {
      const msg = uniqueMessages[i];
      const prevMsg = i > 0 ? uniqueMessages[i - 1] : null;

      // Handle event messages (system notifications)
      if (msg.event) {
        groups.push({
          showDivider: false,
          isEvent: true,
          messages: [msg],
          senderId: msg.senderId,
        });
        continue;
      }

      const isAfter15Mins =
        prevMsg?.createdAt && msg.createdAt
          ? new Date(msg.createdAt).getTime() - new Date(prevMsg.createdAt).getTime() >=
            15 * 60 * 1000
          : false;

      const lastGroup = groups[groups.length - 1];

      if (isAfter15Mins || lastGroup?.isEvent) {
        groups.push({
          showDivider: isAfter15Mins,
          dividerDate: msg.createdAt,
          messages: [msg],
          senderId: msg.senderId,
        });
      } else if (lastGroup && lastGroup.senderId === msg.senderId) {
        lastGroup.messages.push(msg);
      } else {
        groups.push({
          showDivider: false,
          messages: [msg],
          senderId: msg.senderId,
        });
      }
    }

    return groups;
  }, [messages]);

  // Auto-scroll to bottom
  const scrollToBottom = React.useCallback(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  // Debounced search via Meilisearch
  React.useEffect(() => {
    if (!isSearchOpen || !chatId || !searchQuery.trim()) {
      setSearchResults([]);
      setTotalHits(0);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    const timer = setTimeout(() => {
      searchMessagesAction(chatId, searchQuery.trim())
        .then((res) => {
          if (res.success && res.data) {
            setSearchResults(res.data.hits || []);
            setTotalHits(res.data.totalHits ?? (res.data.hits?.length || 0));
          } else {
            setSearchResults([]);
            setTotalHits(0);
          }
        })
        .catch((err) => {
          console.error('Search error:', err);
          setSearchResults([]);
          setTotalHits(0);
        })
        .finally(() => {
          setIsSearching(false);
        });
    }, 350);

    return () => clearTimeout(timer);
  }, [searchQuery, chatId, isSearchOpen]);

  const handleJumpToMessage = React.useCallback((messageId: string) => {
    const el = document.getElementById(`message-${messageId}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setHighlightedMessageId(messageId);
      setTimeout(() => {
        setHighlightedMessageId((prev) => (prev === messageId ? null : prev));
      }, 2500);
    } else {
      toast.info('This message is in older pages or not loaded into current chat windown tại.');
    }
  }, []);

  // Fetch initial messages on chatId change
  React.useEffect(() => {
    if (!chatId) {
      setMessages([]);
      return;
    }

    setIsLoading(true);
    getMessagesAction(chatId)
      .then((res) => {
        if (res.success && res.data) {
          const seen = new Set<string>();
          const deduped = (res.data as ChatMessage[]).filter((m) => {
            if (!m?.id) return false;
            if (seen.has(m.id)) return false;
            seen.add(m.id);
            return true;
          });
          setMessages(deduped);
          markConversationAsReadAction(chatId)
            .then(() => {
              if (typeof window !== 'undefined') window.dispatchEvent(new Event('chat:read'));
            })
            .catch(console.error);
        } else if (res.error) {
          toast.error(res.error);
        }
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [chatId]);

  // Subscribe to Pusher real-time updates
  React.useEffect(() => {
    if (!chatId) return;

    const channelName = `chat-${chatId}`;
    const channel = pusherClient.subscribe(channelName);

    const handleNewMessage = (newMessage: ChatMessage) => {
      setMessages((prev) => {
        if (prev.some((m) => m.id === newMessage.id)) {
          return prev;
        }

        // If sent by me, check if there is an optimistic temp message to replace
        if (newMessage.senderId === currentUserId) {
          const tempIdx = prev.findIndex(
            (m) =>
              m.id.startsWith('temp-') &&
              m.body === newMessage.body &&
              (m.status === 'PENDING' || !m.status),
          );
          if (tempIdx !== -1) {
            const next = [...prev];
            next[tempIdx] = newMessage;
            return next;
          }
        }

        return [...prev, newMessage];
      });

      if (newMessage.senderId !== currentUserId) {
        markConversationAsReadAction(chatId)
          .then(() => {
            if (typeof window !== 'undefined') window.dispatchEvent(new Event('chat:read'));
          })
          .catch(console.error);
      }
    };

    const handleConversationRead = (data: {
      conversationId: string;
      readerId: string;
      lastReadAt: string | Date;
    }) => {
      if (data.readerId !== currentUserId) {
        const readTime = new Date(data.lastReadAt).getTime();
        setMessages((prev) =>
          prev.map((msg) => {
            if (
              msg.senderId === currentUserId &&
              msg.createdAt &&
              new Date(msg.createdAt).getTime() <= readTime
            ) {
              return { ...msg, status: 'READ' };
            }
            return msg;
          }),
        );
      }
    };

    const handleReactionUpdate = (data: { messageId: string; reactions: Reaction[] }) => {
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === data.messageId ? { ...msg, reactions: data.reactions } : msg,
        ),
      );
    };

    channel.bind('new-message', handleNewMessage);
    channel.bind('conversation:read', handleConversationRead);
    channel.bind('message-reaction', handleReactionUpdate);

    return () => {
      channel.unbind('new-message', handleNewMessage);
      channel.unbind('conversation:read', handleConversationRead);
      channel.unbind('message-reaction', handleReactionUpdate);
      pusherClient.unsubscribe(channelName);
    };
  }, [chatId, currentUserId]);

  // Scroll to bottom when messages update
  React.useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Adjust textarea height dynamically
  const handleTextareaInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputText(e.target.value);
    const textarea = e.target;
    textarea.style.height = 'auto';
    textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;
  };

  const handleEmojiClick = React.useCallback((emojiData: EmojiClickData) => {
    const emoji = emojiData.emoji;
    if (!emoji) return;

    const textarea = textareaRef.current;
    if (!textarea) {
      setInputText((prev) => prev + emoji);
      return;
    }

    const start = textarea.selectionStart ?? textarea.value.length;
    const end = textarea.selectionEnd ?? textarea.value.length;

    setInputText((prev) => prev.slice(0, start) + emoji + prev.slice(end));

    requestAnimationFrame(() => {
      textarea.focus();
      const nextCursorPos = start + emoji.length;
      textarea.setSelectionRange(nextCursorPos, nextCursorPos);

      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;
    });
  }, []);

  const handleToggleReaction = React.useCallback(
    async (messageId: string, emoji: string) => {
      if (!chatId || !currentUserId) return;

      setMessages((prev) =>
        prev.map((msg) => {
          if (msg.id !== messageId) return msg;
          const currentReactions = msg.reactions || [];
          const existingReaction = currentReactions.find((r) => r.userReactId === currentUserId);
          const withoutUserReaction = currentReactions.filter(
            (r) => r.userReactId !== currentUserId,
          );

          let nextReactions: Reaction[];
          if (existingReaction && existingReaction.emoji === emoji) {
            // Clicked same emoji -> toggle off
            nextReactions = withoutUserReaction;
          } else {
            // Clicked different emoji or new reaction -> replace previous
            nextReactions = [
              ...withoutUserReaction,
              {
                messageId,
                userReactId: currentUserId,
                emoji,
                createdAt: new Date(),
              },
            ];
          }
          return { ...msg, reactions: nextReactions };
        }),
      );

      const res = await addReactionAction(chatId, messageId, emoji);
      if (!res.success) {
        toast.error(res.error || 'Không thể cập nhật biểu cảm');
        const refreshed = await getMessagesAction(chatId);
        if (refreshed.success && refreshed.data) {
          setMessages(refreshed.data);
        }
      } else if (res.data) {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === messageId ? { ...msg, reactions: res.data.reactions } : msg,
          ),
        );
      }
    },
    [chatId, currentUserId],
  );

  const handleSend = async () => {
    const text = inputText.trim();
    if (!text || !chatId || isSending) return;

    const tempId = `temp-${Date.now()}`;
    const optimisticMessage: ChatMessage = {
      id: tempId,
      conversationId: chatId,
      senderId: currentUserId || '',
      body: text,
      status: 'PENDING',
      createdAt: new Date(),
      reactions: [],
    };

    setInputText('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

    setMessages((prev) => [...prev, optimisticMessage]);
    setIsSending(true);

    try {
      if (isDraftRef.current && (draftRecipientId || recipient?.id)) {
        const targetUserId = draftRecipientId || recipient?.id;
        if (targetUserId) {
          const createConvRes = await createConversationAction(targetUserId, chatId);
          if (!createConvRes.success) {
            toast.error(createConvRes.error || 'Không thể tạo cuộc trò chuyện');
            setMessages((prev) => prev.filter((m) => m.id !== tempId));
            return;
          }
          isDraftRef.current = false;
          if (typeof window !== 'undefined') {
            window.history.replaceState(null, '', `/chat/${chatId}`);
            window.dispatchEvent(new Event('chat:read'));
          }
        }
      }

      const res = await sendMessageAction(chatId, text);
      if (!res.success) {
        toast.error(res.error || 'Gửi tin nhắn thất bại');
        setMessages((prev) => prev.map((m) => (m.id === tempId ? { ...m, status: 'BROKEN' } : m)));
      } else if (res.data) {
        const confirmedMsg = { ...res.data, status: res.data.status || 'SENT' };
        setMessages((prev) => {
          const alreadyExists = prev.some((m) => m.id === confirmedMsg.id);
          if (alreadyExists) {
            return prev.filter((m) => m.id !== tempId);
          }
          return prev.map((m) => (m.id === tempId ? confirmedMsg : m));
        });
      }
    } catch {
      toast.error('Lỗi khi gửi tin nhắn');
      setMessages((prev) => prev.map((m) => (m.id === tempId ? { ...m, status: 'BROKEN' } : m)));
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!chatId) {
    return (
      <div className="flex-1 flex items-center justify-center text-muted-foreground">
        Select one conversation to start chatting
      </div>
    );
  }

  return (
    <div className="flex-1 flex h-full z-10 relative overflow-hidden">
      {/* Main Chat Column */}
      <div className="flex-1 flex flex-col h-full min-w-0 relative overflow-hidden">
        {/* Header */}
        <div className="h-[80px] bg-background/80 backdrop-blur-md border-b flex items-center justify-between px-6 shrink-0 z-20">
          <div className="flex items-center gap-4 cursor-pointer">
            <div className="relative">
              {isGroup ? (
                <div className="h-12 w-12 rounded-2xl bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold shrink-0">
                  <Users className="size-6" />
                </div>
              ) : (
                <>
                  <Avatar className="h-12 w-12">
                    {avatarUrl ? <AvatarImage src={avatarUrl} alt={displayName} /> : null}
                    <AvatarFallback>{fallbackLetter}</AvatarFallback>
                  </Avatar>
                  <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-background rounded-full"></span>
                </>
              )}
            </div>
            <div>
              <h2 className="font-bold text-lg">
                {isGroup ? conversationTitle || 'Nhóm chat' : displayName}
              </h2>
              {isGroup && (
                <p className="text-xs text-muted-foreground">{participantCount || 0} thành viên</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsSearchOpen((prev) => !prev)}
              className={cn(
                'rounded-full bg-background/50 hover:bg-muted text-muted-foreground border ml-2 transition-all',
                isSearchOpen &&
                  'bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-950 dark:text-blue-400 dark:border-blue-800',
              )}
              title={isSearchOpen ? 'Close search' : 'Search in conversation'}
            >
              <Search size={18} />
            </Button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-hidden">
          <MessageScrollerProvider>
            <MessageScroller>
              <MessageScrollerViewport className="px-6 py-6">
                <MessageScrollerContent className="gap-4">
                  {isLoading ? (
                    <div className="flex items-center justify-center py-12 text-muted-foreground gap-2">
                      <Loader2 size={20} className="animate-spin" />
                      <span>Loading messages...</span>
                    </div>
                  ) : groupedMessages.length === 0 ? (
                    <div className="flex items-center justify-center py-12 text-muted-foreground text-sm">
                      No messages yet. Send the first message!
                    </div>
                  ) : (
                    groupedMessages.map((group, groupIndex) => {
                      if (!group || !group.messages || group.messages.length === 0) return null;
                      const firstMsg = group.messages[0];
                      if (!firstMsg) return null;

                      if (group.isEvent) {
                        return (
                          <MessageScrollerItem
                            key={firstMsg.id}
                            className="flex justify-center my-2"
                          >
                            <span className="bg-muted/80 text-muted-foreground text-xs px-3 py-1 rounded-full border border-border/50 select-none">
                              {firstMsg.body}
                            </span>
                          </MessageScrollerItem>
                        );
                      }

                      const lastMsg = group.messages[group.messages.length - 1];
                      if (!lastMsg) return null;
                      const isMe = firstMsg.senderId === currentUserId;
                      const align = isMe ? 'end' : 'start';

                      const sender =
                        usersMap[firstMsg.senderId] ||
                        (firstMsg.senderId === recipient?.id ? recipient : null);
                      const senderAvatar = sender?.image_url;
                      const senderDisplayName =
                        sender?.displayName || (isMe ? 'You' : recipient?.displayName || 'User');
                      const senderFallback = senderDisplayName
                        ? senderDisplayName.charAt(0).toUpperCase()
                        : 'U';

                      const prevGroup = groupIndex > 0 ? groupedMessages[groupIndex - 1] : null;
                      const lastMsgOfPrevGroup = prevGroup
                        ? prevGroup.messages[prevGroup.messages.length - 1]
                        : null;

                      return (
                        <React.Fragment key={firstMsg.id}>
                          {group.showDivider && (
                            <MessageScrollerItem key={`divider-${firstMsg.id}`}>
                              <div className="flex items-center my-3 gap-3 w-full">
                                <div className="flex-1 h-px bg-border/60" />
                                <span className="bg-muted px-3 py-1 rounded-full text-xs font-medium text-muted-foreground select-none">
                                  {formatDividerTime(group.dividerDate)}
                                </span>
                                <div className="flex-1 h-px bg-border/60" />
                              </div>
                            </MessageScrollerItem>
                          )}

                          <MessageScrollerItem key={firstMsg.id}>
                            <Message align={align}>
                              {!isMe && (
                                <MessageAvatar>
                                  <Avatar>
                                    {senderAvatar ? (
                                      <AvatarImage src={senderAvatar} alt={senderDisplayName} />
                                    ) : null}
                                    <AvatarFallback>{senderFallback}</AvatarFallback>
                                  </Avatar>
                                </MessageAvatar>
                              )}
                              <MessageContent>
                                {isGroup && !isMe && (
                                  <span className="text-[11px] font-semibold text-muted-foreground ml-1 mb-1 block select-none">
                                    {senderDisplayName}
                                  </span>
                                )}
                                {group.messages.length > 1 ? (
                                  <BubbleGroup
                                    className={cn(
                                      'w-full flex flex-col gap-2',
                                      isMe ? 'items-end' : 'items-start',
                                    )}
                                  >
                                    {group.messages.map((msg, index) => {
                                      const hasPrevReaction =
                                        index > 0
                                          ? Boolean(
                                              group.messages[index - 1].reactions &&
                                              group.messages[index - 1].reactions!.length > 0,
                                            )
                                          : !group.showDivider &&
                                            Boolean(
                                              lastMsgOfPrevGroup?.reactions &&
                                              lastMsgOfPrevGroup.reactions.length > 0,
                                            );

                                      return (
                                        <MessageBubble
                                          key={msg.id}
                                          msg={msg}
                                          isMe={isMe}
                                          align={align}
                                          currentUserId={currentUserId}
                                          hasPrevReaction={hasPrevReaction}
                                          isHighlighted={highlightedMessageId === msg.id}
                                          onToggleReaction={handleToggleReaction}
                                        />
                                      );
                                    })}
                                  </BubbleGroup>
                                ) : (
                                  <MessageBubble
                                    key={firstMsg.id}
                                    msg={firstMsg}
                                    isMe={isMe}
                                    align={align}
                                    currentUserId={currentUserId}
                                    hasPrevReaction={
                                      !group.showDivider &&
                                      Boolean(
                                        lastMsgOfPrevGroup?.reactions &&
                                        lastMsgOfPrevGroup.reactions.length > 0,
                                      )
                                    }
                                    isHighlighted={highlightedMessageId === firstMsg.id}
                                    onToggleReaction={handleToggleReaction}
                                  />
                                )}

                                <MessageFooter
                                  className={cn(
                                    'text-xs text-muted-foreground mt-1 flex items-center gap-1.5',
                                    lastMsg.reactions && lastMsg.reactions.length > 0 && 'mt-3.5',
                                    isMe && 'justify-end',
                                    lastMsg.status === 'BROKEN' && 'text-red-500 font-medium',
                                    lastMsg.status === 'READ' && 'text-blue-500 font-medium',
                                  )}
                                >
                                  {isMe ? (
                                    <>
                                      {lastMsg.status === 'READ' && (
                                        <div className="flex items-center gap-1">
                                          <svg
                                            width="14"
                                            height="14"
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
                                          <span>
                                            Đã đọc{' '}
                                            <span className="font-normal">
                                              {formatTime(lastMsg.createdAt)}
                                            </span>
                                          </span>
                                        </div>
                                      )}

                                      {lastMsg.status === 'DELIVERED' && (
                                        <div className="flex items-center gap-1">
                                          <svg
                                            width="14"
                                            height="14"
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
                                            <path
                                              d="M4 17L9 22L20 11"
                                              stroke="currentColor"
                                              strokeWidth="2"
                                              strokeLinecap="round"
                                              strokeLinejoin="round"
                                            />
                                          </svg>
                                          <span>
                                            Đã nhận{' '}
                                            <span className="font-normal">
                                              {formatTime(lastMsg.createdAt)}
                                            </span>
                                          </span>
                                        </div>
                                      )}

                                      {(lastMsg.status === 'SENT' ||
                                        (!lastMsg.status &&
                                          lastMsg.id &&
                                          !lastMsg.id.startsWith('temp-'))) && (
                                        <div className="flex items-center gap-1">
                                          <svg
                                            width="14"
                                            height="14"
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
                                          <span>
                                            Đã gửi{' '}
                                            <span className="font-normal">
                                              {formatTime(lastMsg.createdAt)}
                                            </span>
                                          </span>
                                        </div>
                                      )}

                                      {lastMsg.status === 'PENDING' && (
                                        <div className="flex items-center gap-1 text-muted-foreground italic">
                                          <Loader2 size={12} className="animate-spin" />
                                          <span>Đang gửi...</span>
                                        </div>
                                      )}

                                      {lastMsg.status === 'BROKEN' && (
                                        <div className="flex items-center gap-1 text-red-500 font-semibold">
                                          <span>Gửi thất bại</span>
                                        </div>
                                      )}
                                    </>
                                  ) : (
                                    <div>
                                      <span className="font-normal">
                                        {formatTime(lastMsg.createdAt)}
                                      </span>
                                    </div>
                                  )}
                                </MessageFooter>
                              </MessageContent>
                            </Message>
                          </MessageScrollerItem>
                        </React.Fragment>
                      );
                    })
                  )}
                  <div ref={bottomRef} />
                </MessageScrollerContent>
              </MessageScrollerViewport>
              <MessageScrollerButton />
            </MessageScroller>
          </MessageScrollerProvider>
        </div>

        {/* Input Area */}
        <div className="p-4 pt-2 shrink-0">
          <div className="bg-background rounded-3xl shadow-sm flex items-end px-4 py-2 gap-2 border">
            <DropdownMenu open={openEmoji} onOpenChange={setOpenEmoji}>
              <DropdownMenuTrigger render={<Button variant="outline" className={'self-center'} />}>
                <Smile size={22} />
              </DropdownMenuTrigger>
              {openEmoji && (
                <DropdownMenuContent className="w-[25.5em]" align="start" side="top">
                  <EmojiPicker
                    onEmojiClick={handleEmojiClick}
                    previewConfig={{ showPreview: false }}
                    width={400}
                  />
                </DropdownMenuContent>
              )}
            </DropdownMenu>

            <textarea
              ref={textareaRef}
              value={inputText}
              onChange={handleTextareaInput}
              onKeyDown={handleKeyDown}
              placeholder="Nhập tin nhắn..."
              rows={1}
              className="flex-1 border-none outline-none focus:outline-none focus:ring-0 text-[15px] bg-transparent resize-none py-2 max-h-32 leading-relaxed text-foreground placeholder:text-muted-foreground"
            />

            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="text-muted-foreground hover:text-foreground shrink-0 rounded-full h-10 w-10 mb-0.5"
            >
              <Paperclip size={22} />
            </Button>

            {inputText.trim() ? (
              <Button
                type="button"
                onClick={handleSend}
                disabled={isSending}
                size="icon"
                className="bg-blue-600 hover:bg-blue-700 text-white shrink-0 rounded-full h-10 w-10 mb-0.5 transition-all duration-200"
              >
                {isSending ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
              </Button>
            ) : (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="text-muted-foreground hover:text-foreground shrink-0 rounded-full h-10 w-10 mb-0.5"
              >
                <Mic size={22} />
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Right Search Panel with Slide Animation */}
      <div
        className={cn(
          'h-full border-l bg-background/95 backdrop-blur-sm flex flex-col shrink-0 transition-all duration-300 ease-in-out overflow-hidden z-20 shadow-xs',
          isSearchOpen ? 'w-[340px] opacity-100' : 'w-0 opacity-0 border-l-0 pointer-events-none',
        )}
      >
        <div className="w-[340px] h-full flex flex-col">
          {/* Search Header */}
          <div className="h-[80px] border-b flex items-center justify-between px-5 shrink-0 bg-background/80 backdrop-blur-md">
            <div className="flex items-center gap-2">
              <Search size={18} className="text-muted-foreground" />
              <h3 className="font-semibold text-base">Search Messages</h3>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full h-8 w-8 hover:bg-muted text-muted-foreground hover:text-foreground"
              onClick={() => setIsSearchOpen(false)}
              title="Close"
            >
              <X size={18} />
            </Button>
          </div>

          {/* Search Input Box */}
          <div className="p-4 border-b">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search in conversation..."
                className="pl-9 pr-8 h-9 text-sm rounded-lg bg-muted/50 border-input focus-visible:bg-background"
                autoFocus={isSearchOpen}
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  aria-label="Clear search"
                >
                  <X className="size-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Search Content / Results Area */}
          <div className="flex-1 p-4 overflow-y-auto flex flex-col">
            {searchQuery.trim() ? (
              <div className="w-full h-full flex flex-col">
                <div className="flex items-center justify-between text-xs text-muted-foreground mb-3 px-1">
                  <span>Results for &ldquo;{searchQuery}&rdquo;</span>
                  {!isSearching && totalHits > 0 && (
                    <span className="font-medium bg-muted px-2 py-0.5 rounded-full text-[11px]">
                      {totalHits} {totalHits === 1 ? 'match' : 'matches'}
                    </span>
                  )}
                </div>

                {isSearching ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground gap-2 py-12">
                    <Loader2 className="size-6 animate-spin text-primary" />
                    <p className="text-xs">Searching messages...</p>
                  </div>
                ) : searchResults.length > 0 ? (
                  <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                    {searchResults.map((hit) => {
                      const isFromMe = hit.senderId === currentUserId;
                      const hitDate = hit.createdAt ? formatTime(hit.createdAt) : '';
                      const hitSender = usersMap[hit.senderId];
                      const hitSenderName = isFromMe
                        ? 'You'
                        : hitSender?.displayName || displayName;
                      return (
                        <div
                          key={hit.id}
                          onClick={() => handleJumpToMessage(hit.id)}
                          className="group p-3 rounded-xl border bg-card/60 hover:bg-accent/60 cursor-pointer transition-all hover:shadow-xs space-y-1.5 text-left"
                        >
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-semibold text-foreground">{hitSenderName}</span>
                            <span className="text-[11px] text-muted-foreground">{hitDate}</span>
                          </div>
                          <div
                            className="text-xs text-muted-foreground group-hover:text-foreground line-clamp-3 leading-relaxed break-words"
                            dangerouslySetInnerHTML={{
                              __html: hit._formatted?.body || hit.body,
                            }}
                          />
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground gap-2 py-8 text-center">
                    <div className="p-3 bg-muted rounded-full">
                      <Search className="size-6 text-muted-foreground" />
                    </div>
                    <p className="text-sm font-medium">No results found</p>
                    <p className="text-xs text-muted-foreground max-w-[200px]">
                      Try searching with different keywords
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground gap-3 py-10 text-center">
                <div className="p-4 bg-muted/60 rounded-2xl">
                  <Search className="size-8 text-muted-foreground/80" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-foreground mb-1">
                    Search in this chat
                  </h4>
                  <p className="text-xs text-muted-foreground max-w-[220px]">
                    Find messages, media, and links in this conversation
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
