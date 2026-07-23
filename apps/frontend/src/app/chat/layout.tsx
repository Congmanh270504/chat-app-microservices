import { ChatSidebar } from '@/components/chat/sidebar';
import { ChatList } from '@/components/chat/chat-list';

export default function ChatLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      {/* Sidebar */}
      <ChatSidebar />

      {/* Messages List Panel */}
      <div className="w-[350px] border-r flex flex-col h-full bg-background/95">
        <ChatList />
      </div>

      {/* Main Content Area (Either Empty State or Chat Area) */}
      <div className="flex-1 flex flex-col h-full bg-[#f0f2f5] dark:bg-[#0a0a0a] relative">
        {/* Pattern Background */}
        <div
          className="absolute inset-0 z-0 opacity-[0.05] pointer-events-none"
          style={{
            backgroundImage:
              'url("data:image/svg+xml,%3Csvg width=\\"20\\" height=\\"20\\" viewBox=\\"0 0 20 20\\" xmlns=\\"http://www.w3.org/2000/svg\\"%3E%3Cpath d=\\"M0 0h20v20H0V0zm10 17a7 7 0 1 0 0-14 7 7 0 0 0 0 14zm0-2a5 5 0 1 1 0-10 5 5 0 0 1 0 10z\\" fill=\\"currentColor\\" fill-rule=\\"evenodd\\"/%3E%3C/svg%3E")',
          }}
        />

        <div className="relative z-10 flex flex-col h-full">
          {children}
        </div>
      </div>
    </div>
  );
}
