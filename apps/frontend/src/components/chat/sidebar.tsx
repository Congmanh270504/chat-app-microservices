/* eslint-disable react-hooks/set-state-in-effect */
'use client';

import { SettingsDialog } from '@/components/chat/settings-dialog';
import { TypographyPopover } from '@/components/chat/typography-popover';
import { Button } from '@/components/ui/button';
import { LogOut, MessageSquare, Moon, Phone, Settings, Sun } from 'lucide-react';
import { signOut } from 'next-auth/react';
import { useTheme } from 'next-themes';
import * as React from 'react';
import UserAvatar from '../user-avatar';

interface ChatSidebarProps {
  user?: {
    id?: string | null;
    name?: string | null;
    email?: string | null;
    image?: string | null;
    image_url?: string | null;
  } | null;
}

export function ChatSidebar({ user }: ChatSidebarProps) {
  const { setTheme, theme } = useTheme();
  const [mounted, setMounted] = React.useState(false);
  const [openSettings, setOpenSettings] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const currentTheme = mounted ? theme : undefined;

  return (
    <>
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

          <div className="mt-2 cursor-pointer" onClick={() => setOpenSettings(true)}>
            <UserAvatar
              name={user?.name || 'User'}
              imageUrl={user?.image || (user as any)?.image_url || undefined}
              className="h-10 w-10 hover:ring-2 hover:ring-primary transition-all"
              textClassName="text-lg"
            />
          </div>
        </div>

        {/* Bottom Icons */}
        <div className="flex flex-col gap-4 items-center mb-2">
          <TypographyPopover />
          <Button
            variant="ghost"
            size="icon"
            className="text-muted-foreground hover:bg-muted"
            onClick={() => setOpenSettings(true)}
          >
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
            onClick={() => signOut({ callbackUrl: '/login' })}
          >
            <LogOut size={24} />
          </Button>
        </div>
      </div>

      <SettingsDialog open={openSettings} onOpenChange={setOpenSettings} user={user} />
    </>
  );
}
