import type { NextAuthConfig } from 'next-auth';

export const authConfig = {
  pages: {
    signIn: '/login',
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider === 'google') {
        try {
          const gateWayURL = process.env.GATE_WAY_URL || 'http://127.0.0.1:4000';
          const res = await fetch(`${gateWayURL}/auth/google`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: user.email,
              displayName: user.name || profile?.name || user.email?.split('@')[0],
              image_url: user.image || (profile as any)?.picture,
            }),
          });

          if (!res.ok) {
            console.error('Google backend auth failed:', await res.text());
            return false;
          }

          const resData = await res.json();
          const userData = resData.user || resData.data?.user;
          const accessToken = resData.accessToken || resData.data?.accessToken;
          const refreshToken = resData.refreshToken || resData.data?.refreshToken;

          if (userData?.id) {
            user.id = userData.id;
          }
          (user as any).accessToken = accessToken;
          (user as any).refreshToken = refreshToken;
          (user as any).role =
            userData?.role || (user.email === 'admin@gmail.com' ? 'ADMIN' : 'USER');
          return true;
        } catch (err) {
          console.error('Error during Google signIn callback:', err);
          return false;
        }
      }
      return true;
    },
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isProtected =
        nextUrl.pathname.startsWith('/chat') || nextUrl.pathname.startsWith('/admin');
      if (isProtected) {
        if (isLoggedIn) return true;
        return false; // Redirect unauthenticated users to login page
      } else if (isLoggedIn) {
        const isAuthRoute =
          nextUrl.pathname === '/login' ||
          nextUrl.pathname === '/register' ||
          nextUrl.pathname === '/';
        if (isAuthRoute) {
          return Response.redirect(new URL('/chat', nextUrl));
        }
      }
      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        // User object is passed in during initial sign in
        token.accessToken = (user as any).accessToken;
        token.refreshToken = (user as any).refreshToken;
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
        token.picture = user.image;
        token.role = (user as any).role || (user.email === 'admin@gmail.com' ? 'ADMIN' : 'USER');
      }
      if (!token.role) {
        token.role = token.email === 'admin@gmail.com' ? 'ADMIN' : 'USER';
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        if (session.user) {
          session.user.id = token.id as string;
          session.user.email = token.email as string;
          session.user.name = token.name as string;
          session.user.image = (token.picture || token.image) as string;
          (session.user as any).role =
            token.role || (token.email === 'admin@gmail.com' ? 'ADMIN' : 'USER');
        }
        // Add tokens to session so client/server can access them
        (session as any).accessToken = token.accessToken;
        (session as any).refreshToken = token.refreshToken;
      }
      return session;
    },
  },
  providers: [],
} satisfies NextAuthConfig;
