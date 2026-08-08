import type { Metadata } from 'next';
import { Geist, Roboto, Geist_Mono } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from '@/components/theme-provider';
import { TooltipProvider } from '@/components/ui/tooltip';
import { SessionProvider } from '@/components/providers/session-provider';
import { Toaster } from '@/components/ui/sonner';
import { ChatSidebar } from '@/components/chat/sidebar';
import { getCurrentUser } from '@/lib/auth';
const geist = Geist({
  subsets: ['latin'],
  variable: '--font-geist',
});

const roboto = Roboto({
  weight: ['300', '400', '500', '700'],
  subsets: ['latin'],
  variable: '--font-roboto',
});

const geistMono = Geist_Mono({
  subsets: ['latin'],
  variable: '--font-geist-mono',
});

export const metadata: Metadata = {
  title: 'Chat App',
  description: 'Chat Interface',
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await getCurrentUser();
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geist.variable} ${roboto.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <SessionProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="light"
            enableSystem
            disableTransitionOnChange
          >
            <TooltipProvider>
              <div className="flex-1 flex h-full">
                <div className="flex h-screen w-full overflow-hidden bg-background">
                  {/* Sidebar */}
                  <ChatSidebar user={user} />
                  {children}
                </div>
              </div>
              <Toaster position="top-right" richColors closeButton />
            </TooltipProvider>
          </ThemeProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
