import NextAuth from 'next-auth';
import { authConfig } from './auth.config';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
import { jwtDecode } from 'jwt-decode';

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    GoogleProvider({
      clientId: process.env.AUTH_GOOGLE_ID || process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.AUTH_GOOGLE_SECRET || process.env.GOOGLE_CLIENT_SECRET || '',
    }),
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        try {
          const gateWayURL = process.env.GATE_WAY_URL || 'http://127.0.0.1:4000';
          const res = await fetch(`${gateWayURL}/auth/login`, {
            method: 'POST',
            body: JSON.stringify({
              email: credentials.email,
              password: credentials.password,
            }),
            headers: { 'Content-Type': 'application/json' },
          });

          if (!res.ok) {
            console.error('Login failed:', await res.text());
            return null;
          }

          const resData = await res.json();

          if (resData && resData.accessToken) {
            // Decode the access token to extract user info (id, email)
            const decodedToken: any = jwtDecode(resData.accessToken);

            // Return user object compatible with NextAuth
            return {
              id: resData.user?.id || decodedToken.sub,
              email: resData.user?.email || decodedToken.email,
              name:
                resData.user?.displayName ||
                decodedToken.displayName ||
                decodedToken.email?.split('@')[0] ||
                'User',
              image: resData.user?.image_url || decodedToken.image_url || null,
              role: resData.user?.role || decodedToken.role || 'USER',
              accessToken: resData.accessToken,
              refreshToken: resData.refreshToken,
            };
          }
          return null;
        } catch (error) {
          console.error('Login error:', error);
          return null;
        }
      },
    }),
  ],
});

export async function getCurrentUser() {
  const session = await auth();
  return session?.user || null;
}
