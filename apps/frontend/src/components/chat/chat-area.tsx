/* eslint-disable react-hooks/set-state-in-effect */
'use client';

import * as React from 'react';
import { Phone, Video, Search, Smile, Paperclip, Mic, Send, Loader2 } from 'lucide-react';
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
import { Message, MessageContent } from '@/components/ui/message';
import { pusherClient } from '@/lib/pusher';
import { getMessagesAction, sendMessageAction } from '@/app/chat/chat.actions';

export interface RecipientUser {
  id?: string;
  displayName?: string;
  email?: string;
  image_url?: string;
}

export interface ChatMessage {
  id: string;
  conversationId: string;
  senderId: string;
  body: string;
  status?: string;
  createdAt?: string | Date;
}

interface ChatAreaProps {
  chatId: string | null;
  recipient?: RecipientUser | null;
}

export function ChatArea({ chatId, recipient }: ChatAreaProps) {
  const { data: session } = useSession();
  const currentUserId = session?.user?.id;

  const [messages, setMessages] = React.useState<ChatMessage[]>([]);
  const [inputText, setInputText] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);
  const [isSending, setIsSending] = React.useState(false);

  const textareaRef = React.useRef<HTMLTextAreaElement>(null);
  const bottomRef = React.useRef<HTMLDivElement>(null);

  const displayName = recipient?.displayName || recipient?.email || 'Người dùng';
  const avatarUrl = recipient?.image_url || '';
  const fallbackLetter = displayName ? displayName[0].toUpperCase() : 'U';

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
          setMessages(res.data);
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
        return [...prev, newMessage];
      });
    };

    channel.bind('new-message', handleNewMessage);

    return () => {
      channel.unbind('new-message', handleNewMessage);
      pusherClient.unsubscribe(channelName);
    };
  }, [chatId]);

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

  const handleSend = async () => {
    const text = inputText.trim();
    if (!text || !chatId || isSending) return;

    setInputText('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

    setIsSending(true);
    const res = await sendMessageAction(chatId, text);

    if (!res.success) {
      toast.error(res.error || 'Gửi tin nhắn thất bại');
      setInputText(text);
    }
    setIsSending(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const formatTime = (dateStr?: string | Date) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '';
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (!chatId) {
    return (
      <div className="flex-1 flex items-center justify-center text-muted-foreground">
        Chọn một cuộc trò chuyện để bắt đầu nhắn tin
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
              <MessageScrollerContent>
                {isLoading ? (
                  <div className="flex items-center justify-center py-12 text-muted-foreground gap-2">
                    <Loader2 size={20} className="animate-spin" />
                    <span>Đang tải tin nhắn...</span>
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex items-center justify-center py-12 text-muted-foreground text-sm">
                    Chưa có tin nhắn nào. Gửi tin nhắn đầu tiên!
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isMe = msg.senderId === currentUserId;
                    const align = isMe ? 'end' : 'start';

                    return (
                      <MessageScrollerItem
                        key={msg.id}
                        className={`flex ${align === 'end' ? 'justify-end' : 'justify-start'} mb-2`}
                      >
                        <Message align={align} className="max-w-[70%] w-fit">
                          <MessageContent>
                            <div
                              className={`px-4 py-2.5 rounded-2xl relative group ${
                                align === 'end'
                                  ? 'bg-blue-600 text-white rounded-br-sm shadow-sm'
                                  : 'bg-background shadow-sm rounded-bl-sm text-foreground border'
                              }`}
                            >
                              <p className="text-[15px] leading-relaxed whitespace-pre-wrap break-words">
                                {msg.body}
                              </p>
                              <div
                                className={`text-[10px] flex justify-end items-center gap-1 mt-1 opacity-75 ${
                                  align === 'end' ? 'text-blue-100' : 'text-muted-foreground'
                                }`}
                              >
                                {formatTime(msg.createdAt)}
                                {align === 'end' && (
                                  <svg
                                    width="12"
                                    height="12"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    className="shrink-0"
                                    xmlns="http://www.w3.org/2000/svg"
                                  >
                                    <path
                                      d="M4 12L9 17L20 6"
                                      stroke="currentColor"
                                      strokeWidth="2.5"
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                    />
                                    <path
                                      d="M4 17L9 22L20 11"
                                      stroke="currentColor"
                                      strokeWidth="2.5"
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      className="opacity-50"
                                    />
                                  </svg>
                                )}
                              </div>
                            </div>
                          </MessageContent>
                        </Message>
                      </MessageScrollerItem>
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
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="text-muted-foreground hover:text-foreground shrink-0 rounded-full h-10 w-10 mb-0.5"
          >
            <Smile size={22} />
          </Button>

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
