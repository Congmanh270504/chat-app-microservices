import NextAuth from 'next-auth';
import { authConfig } from './auth.config';
import CredentialsProvider from 'next-auth/providers/credentials';
import { jwtDecode } from 'jwt-decode';

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
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

          const tokens = await res.json();

          if (tokens && tokens.accessToken) {
            // Decode the access token to extract user info (id, email, displayName)
            const decodedToken: any = jwtDecode(tokens.accessToken);

            // Return user object compatible with NextAuth
            return {
              id: decodedToken.sub,
              email: decodedToken.email,
              name: decodedToken.displayName || decodedToken.email.split('@')[0], // fallback if displayName not in token
              accessToken: tokens.accessToken,
              refreshToken: tokens.refreshToken,
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
