import type { NextAuthConfig } from 'next-auth';

export const authConfig = {
  pages: {
    signIn: '/login',
  },
  callbacks: {
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
