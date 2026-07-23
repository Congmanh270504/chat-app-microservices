'use client';

import { Phone, Video, Search, Smile, Paperclip, Mic } from 'lucide-react';
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
import { Message, MessageContent } from '@/components/ui/message';

const MESSAGES = [
  {
    id: 1,
    text: 'I was atleast able to move out of the house',
    align: 'end',
    time: '16:45',
    read: true,
  },
  { id: 2, text: "You don't have to worry about me", align: 'end', time: '16:45', read: true },
  { id: 3, text: '❤️❤️❤️', align: 'end', time: '16:46', read: true },
  { id: 4, text: 'Pele', align: 'start', time: '16:47' },
  { id: 5, text: "I'm glad you are better now", align: 'start', time: '16:47' },
  { id: 6, text: 'Will you be able to come to church tomorrow?', align: 'start', time: '16:54' },
  { id: 7, text: '???😢😢😢', align: 'start', time: '19:00' },
  { id: 'divider', type: 'divider', text: 'Today' },
  { id: 8, text: 'Good morning', align: 'start', time: '7:06' },
  { id: 9, text: 'Good Morning 💖', align: 'end', time: '7:45', read: true },
  {
    id: 10,
    text: 'I have not been seeing you make comments on the group, and I kind of fed off your',
    align: 'end',
    time: '7:46',
  },
];

export function ChatArea(chatId: { chatId: string | null }) {
  return (
    <div className="flex-1 flex flex-col h-full z-10 relative">
      {/* Header */}
      <div className="h-[80px] bg-background/80 backdrop-blur-md border-b flex items-center justify-between px-6 shrink-0">
        <div className="flex items-center gap-4 cursor-pointer">
          <div className="relative">
            <Avatar className="h-12 w-12">
              <AvatarImage src="https://i.pravatar.cc/150?u=9" alt="Grillo" />
              <AvatarFallback>G</AvatarFallback>
            </Avatar>
            <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-background rounded-full"></span>
          </div>
          <div>
            <h2 className="font-bold text-lg">Grillo 💖💖</h2>
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
                {MESSAGES.map((msg) => {
                  if (msg.type === 'divider') {
                    return (
                      <MessageScrollerItem key={msg.id} className="flex justify-center my-4">
                        <span className="bg-black/5 dark:bg-white/10 px-4 py-1 rounded-full text-xs font-medium text-muted-foreground">
                          {msg.text}
                        </span>
                      </MessageScrollerItem>
                    );
                  }

                  return (
                    <MessageScrollerItem
                      key={msg.id}
                      className={`flex ${msg.align === 'end' ? 'justify-end' : 'justify-start'} mb-1`}
                    >
                      <Message align={msg.align as 'start' | 'end'} className="max-w-[70%] w-fit">
                        <MessageContent>
                          <div
                            className={`px-4 py-2.5 rounded-2xl relative group ${
                              msg.align === 'end'
                                ? 'bg-blue-200 dark:bg-blue-800 text-blue-950 dark:text-blue-50 rounded-br-sm shadow-sm'
                                : 'bg-background shadow-sm rounded-bl-sm text-foreground'
                            }`}
                          >
                            {msg.align === 'end' && msg.id === 1 && (
                              <div className="text-[10px] text-blue-800 dark:text-blue-200 mb-1 font-medium">
                                You
                              </div>
                            )}
                            <p className="text-[15px] leading-relaxed">{msg.text}</p>
                            <div
                              className={`text-[10px] flex justify-end items-center gap-1 mt-1 opacity-70 ${msg.align === 'end' ? 'text-blue-800 dark:text-blue-200' : 'text-muted-foreground'}`}
                            >
                              {msg.time}
                              {msg.align === 'end' && msg.read && (
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
                })}
              </MessageScrollerContent>
            </MessageScrollerViewport>
            <MessageScrollerButton />
          </MessageScroller>
        </MessageScrollerProvider>
      </div>

      {/* Input Area */}
      <div className="p-4 pt-2">
        <div className="bg-background rounded-full shadow-sm flex items-center px-4 py-2 gap-2 border">
          <Button
            variant="ghost"
            size="icon"
            className="text-muted-foreground hover:text-foreground shrink-0 rounded-full h-10 w-10"
          >
            <Smile size={24} />
          </Button>
          <Input
            className="flex-1 border-none shadow-none focus-visible:ring-0 text-[15px] bg-transparent"
            placeholder="Type a message"
          />
          <Button
            variant="ghost"
            size="icon"
            className="text-muted-foreground hover:text-foreground shrink-0 rounded-full h-10 w-10"
          >
            <Paperclip size={24} />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="text-muted-foreground hover:text-foreground shrink-0 rounded-full h-10 w-10"
          >
            <Mic size={24} />
          </Button>
        </div>
      </div>
    </div>
  );
}
