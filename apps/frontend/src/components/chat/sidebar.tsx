/* eslint-disable react-hooks/set-state-in-effect */
'use client';

import * as React from 'react';
import { MessageSquare, Phone, Settings, LogOut, Sun, Moon } from 'lucide-react';
import { useTheme } from 'next-themes';
import { Avatar, AvatarBadge, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { TypographyPopover } from '@/components/chat/typography-popover';
import UserAvatar from '../user-avatar';

export function ChatSidebar() {
  const { setTheme, theme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const currentTheme = mounted ? theme : undefined;

  return (
    <div className="w-[80px] border-r flex flex-col items-center py-4 bg-background z-20">
      {/* Top Icons */}
      <div className="flex flex-col gap-6 items-center flex-1">
        <div className="relative cursor-pointer mt-2">
          <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-2xl text-blue-600 dark:text-blue-300">
            <MessageSquare size={24} className="fill-current" />
          </div>
          <span className="absolute -top-2 -right-2 bg-blue-600 text-white text-[10px] rounded-full h-5 w-5 flex items-center justify-center font-bold shadow-sm">
            22
          </span>
        </div>

        <div className="relative cursor-pointer mt-2">
          <div className="p-2 text-muted-foreground hover:text-foreground transition-colors">
            <Phone size={24} />
          </div>
          <span className="absolute top-1 right-1 bg-red-500 text-white text-[10px] rounded-full h-4 w-4 flex items-center justify-center font-bold border-2 border-background">
            5
          </span>
        </div>

        <div className="mt-2 cursor-pointer">
          <UserAvatar
            name="John Doe"
            imageUrl="https://github.com/shadcn.png"
            className="h-10 w-10"
            textClassName="text-lg"
          />
        </div>
      </div>

      {/* Bottom Icons */}
      <div className="flex flex-col gap-4 items-center mb-2">
        <TypographyPopover />
        <Button variant="ghost" size="icon" className="text-muted-foreground hover:bg-muted">
          <Settings size={24} />
        </Button>

        <div className="bg-muted rounded-full p-1 flex flex-col gap-1">
          <Button
            variant="ghost"
            size="icon"
            className={`rounded-full h-8 w-8 ${currentTheme === 'light' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
            onClick={() => setTheme('light')}
          >
            <Sun size={18} />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className={`rounded-full h-8 w-8 ${currentTheme === 'dark' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
            onClick={() => setTheme('dark')}
          >
            <Moon size={18} />
          </Button>
        </div>

        <Button
          variant="ghost"
          size="icon"
          className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 mt-2"
        >
          <LogOut size={24} />
        </Button>
      </div>
    </div>
  );
}
