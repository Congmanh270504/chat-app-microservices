'use client';

import { Search, Plus, Edit } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarBadge, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';

const STATUS_USERS = [
  { id: 1, name: 'Mark', image: 'https://i.pravatar.cc/150?u=1', hasStory: true },
  { id: 2, name: 'Layomi', image: 'https://i.pravatar.cc/150?u=2', hasStory: true },
  { id: 3, name: 'Jasper', image: 'https://i.pravatar.cc/150?u=3', hasStory: false },
  { id: 4, name: 'Mary Ph', image: 'https://i.pravatar.cc/150?u=4', hasStory: false },
];

const CHATS = [
  {
    id: '1',
    name: 'Alfred Benson',
    message: 'I have not been seeing you make com...',
    time: '4:35',
    unread: 5,
    avatar: 'https://i.pravatar.cc/150?u=5',
    typing: false,
  },
  {
    id: '2',
    name: 'Alfred Benson',
    message: 'Typing',
    time: '5:45',
    unread: 2,
    avatar: 'https://i.pravatar.cc/150?u=6',
    typing: true,
  },
  {
    id: '3',
    name: 'Alfred Benson',
    message: 'I have not been seeing you make com...',
    time: '5:45',
    unread: 0,
    avatar: 'https://i.pravatar.cc/150?u=7',
    typing: false,
    read: true,
  },
  {
    id: '4',
    name: 'Alfred Benson',
    message: 'I have not been seeing you make com...',
    time: '9:00',
    unread: 0,
    avatar: 'https://i.pravatar.cc/150?u=8',
    typing: false,
    read: true,
  },
  {
    id: '5',
    name: 'Grillo 💖💖',
    message: 'I have not been seeing you make com...',
    time: '9:45',
    unread: 0,
    avatar: 'https://i.pravatar.cc/150?u=9',
    typing: false,
    read: true,
    active: true,
  },
  {
    id: '6',
    name: 'Alfred Benson',
    message: 'I have not been seeing you make com...',
    time: '9:45',
    unread: 0,
    avatar: 'https://i.pravatar.cc/150?u=10',
    typing: false,
    read: true,
  },
  {
    id: '7',
    name: 'Alfred Benson',
    message: 'I have not been seeing you make com...',
    time: '9:45',
    unread: 0,
    avatar: 'https://i.pravatar.cc/150?u=11',
    typing: false,
    read: true,
  },
];

export function ChatList() {
  return (
    <div className="flex flex-col h-full bg-background ">
      {/* Status Section */}
      {/* <div className="px-4 pb-2">
        <h2 className="font-bold text-lg mb-4">Status</h2>
        <ScrollArea className="w-full whitespace-nowrap">
          <div className="flex w-max space-x-4 pb-4">
            <div className="flex flex-col items-center gap-2 cursor-pointer">
              <div className="h-14 w-14 rounded-full border-2 border-dashed border-muted-foreground flex items-center justify-center">
                <Plus className="text-muted-foreground" size={24} />
              </div>
              <span className="text-xs font-medium">My Status</span>
            </div>
            
            {STATUS_USERS.map((user) => (
              <div key={user.id} className="flex flex-col items-center gap-2 cursor-pointer">
                <div className={`rounded-full p-[2px] ${user.hasStory ? 'bg-gradient-to-tr from-blue-600 to-blue-400' : 'bg-transparent'}`}>
                  <Avatar className="h-13 w-13 border-2 border-background">
                    <AvatarImage src={user.image} alt={user.name} />
                    <AvatarFallback>{user.name[0]}</AvatarFallback>
                  </Avatar>
                </div>
                <span className="text-xs font-medium">{user.name}</span>
              </div>
            ))}
          </div>
          <ScrollBar orientation="horizontal" className="invisible" />
        </ScrollArea>
      </div> */}

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
        <div className="relative">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            size={18}
          />
          <Input
            placeholder="search"
            className="pl-9 bg-muted/50 border-none rounded-full h-10 focus-visible:ring-1 focus-visible:ring-ring"
          />
        </div>
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
          {CHATS.map((chat) => (
            <div
              key={chat.id}
              className={`flex items-center gap-3 p-3 rounded-2xl cursor-pointer transition-colors ${chat.active ? 'bg-muted/80' : 'hover:bg-muted/50'}`}
            >
              <div className="relative">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={chat.avatar} alt={chat.name} />
                  <AvatarFallback>{chat.name[0]}</AvatarFallback>
                  <AvatarBadge
                    className={
                      chat.active
                        ? 'bg-green-600 dark:bg-green-800'
                        : 'bg-gray-600 dark:bg-gray-800'
                    }
                  />
                </Avatar>
                {/* {chat.active && (
                  <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-background rounded-full"></span>
                )} */}
              </div>

              <div className="flex-1 overflow-hidden">
                <div className="flex justify-between items-center mb-1">
                  <h3 className="font-semibold text-sm truncate">{chat.name}</h3>
                  <span
                    className={`text-xs ${chat.unread > 0 ? 'text-blue-600 font-bold' : 'text-muted-foreground'}`}
                  >
                    {chat.time}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <p
                    className={`text-xs truncate mr-2 ${chat.typing ? 'text-blue-600 font-medium italic' : 'text-muted-foreground'}`}
                  >
                    {chat.message}
                  </p>

                  {chat.unread > 0 ? (
                    <span className="bg-blue-600 text-white text-[10px] font-bold rounded-full h-5 w-5 flex items-center justify-center shrink-0">
                      {chat.unread}
                    </span>
                  ) : chat.read ? (
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
                  ) : null}
                </div>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
