/* eslint-disable react-hooks/set-state-in-effect */
'use client';

import * as React from 'react';
import {
  Phone,
  Video,
  Search,
  Smile,
  SmilePlus,
  Paperclip,
  Mic,
  Send,
  Loader2,
} from 'lucide-react';
import { useSession } from 'next-auth/react';
import { toast } from 'sonner';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
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
  image_url?: string;
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
  onToggleReaction: (messageId: string, emoji: string) => void;
}

const MessageBubble = React.memo(function MessageBubble({
  msg,
  isMe,
  align,
  currentUserId,
  hasPrevReaction,
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
        <BubbleContent className="wrap-break-word break-words whitespace-pre-wrap">
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

interface ChatAreaProps {
  chatId: string | null;
  recipient?: RecipientUser | null;
  currentUserId?: string;
}

export function ChatArea({ chatId, recipient, currentUserId: propUserId }: ChatAreaProps) {
  const { data: session } = useSession();
  const currentUserId = propUserId || session?.user?.id;

  const [messages, setMessages] = React.useState<ChatMessage[]>([]);
  const [inputText, setInputText] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);
  const [isSending, setIsSending] = React.useState(false);
  const [openEmoji, setOpenEmoji] = React.useState(false);

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
      messages: ChatMessage[];
      senderId: string;
    }[] = [];

    for (let i = 0; i < uniqueMessages.length; i++) {
      const msg = uniqueMessages[i];
      const prevMsg = i > 0 ? uniqueMessages[i - 1] : null;

      const isAfter15Mins =
        prevMsg?.createdAt && msg.createdAt
          ? new Date(msg.createdAt).getTime() - new Date(prevMsg.createdAt).getTime() >=
            15 * 60 * 1000
          : false;

      const lastGroup = groups[groups.length - 1];

      if (isAfter15Mins) {
        groups.push({
          showDivider: true,
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
          markConversationAsReadAction(chatId).catch(console.error);
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
        markConversationAsReadAction(chatId).catch(console.error);
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
    <div className="flex-1 flex flex-col h-full z-10 relative overflow-hidden">
      {/* Header */}
      <div className="h-[80px] bg-background/80 backdrop-blur-md border-b flex items-center justify-between px-6 shrink-0 z-20">
        <div className="flex items-center gap-4 cursor-pointer">
          <div className="relative">
            <Avatar className="h-12 w-12">
              {avatarUrl ? <AvatarImage src={avatarUrl} alt={displayName} /> : null}
              <AvatarFallback>{fallbackLetter}</AvatarFallback>
            </Avatar>
            <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-background rounded-full"></span>
          </div>
          <div>
            <h2 className="font-bold text-lg">{displayName}</h2>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full bg-background/50 hover:bg-muted text-muted-foreground border"
          >
            <Phone size={18} />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full bg-background/50 hover:bg-muted text-muted-foreground border"
          >
            <Video size={18} />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full bg-background/50 hover:bg-muted text-muted-foreground border ml-2"
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
                    const lastMsg = group.messages[group.messages.length - 1];
                    if (!firstMsg || !lastMsg) return null;
                    const isMe = firstMsg.senderId === currentUserId;
                    const align = isMe ? 'end' : 'start';

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
                                  {avatarUrl && <AvatarImage src={avatarUrl} alt={displayName} />}
                                  <AvatarFallback>{fallbackLetter}</AvatarFallback>
                                </Avatar>
                              </MessageAvatar>
                            )}
                            <MessageContent>
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
  );
}
