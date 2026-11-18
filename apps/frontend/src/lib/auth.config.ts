import type { NextAuthConfig } from 'next-auth';

function decodeJwt(
    token?: string,
): { exp?: number; sub?: string; email?: string } | null {
    if (!token || typeof token !== 'string') return null;
    try {
        const parts = token.split('.');
        if (parts.length < 2) return null;
        const payloadBase64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
        if (typeof Buffer !== 'undefined') {
            return JSON.parse(
                Buffer.from(payloadBase64, 'base64').toString('utf-8'),
            );
        }
        if (typeof atob === 'function') {
            const raw = atob(payloadBase64);
            const bytes = Uint8Array.from(raw, (c) => c.charCodeAt(0));
            return JSON.parse(new TextDecoder().decode(bytes));
        }
        return null;
    } catch {
        return null;
    }
}

async function refreshAccessToken(token: any) {
    try {
        const gateWayURL = process.env.GATE_WAY_URL || 'http://127.0.0.1:4000';
        const res = await fetch(`${gateWayURL}/auth/refresh`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                refreshToken: token.refreshToken,
            }),
        });

        const data = await res.json().catch(() => ({}));

        if (!res.ok || !data.accessToken) {
            console.error('[auth] Failed to refresh access token, response:', data);
            return {
                ...token,
                error: 'RefreshTokenError',
            };
        }

        const decoded = decodeJwt(data.accessToken);
        const newExpires = decoded?.exp
            ? decoded.exp * 1000
            : Date.now() + 24 * 60 * 60 * 1000;

        return {
            ...token,
            accessToken: data.accessToken,
            refreshToken: data.refreshToken || token.refreshToken,
            accessTokenExpires: newExpires,
            error: undefined,
        };
    } catch (error) {
        console.error('[auth] Error in refreshAccessToken:', error);
        return {
            ...token,
            error: 'RefreshTokenError',
        };
    }
}

export const authConfig = {
    pages: {
        signIn: '/login',
    },
    callbacks: {
        async signIn({ user, account, profile }) {
            if (account?.provider === 'google') {
                try {
                    const gateWayURL =
                        process.env.GATE_WAY_URL || 'http://127.0.0.1:4000';
                    const res = await fetch(`${gateWayURL}/auth/google`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            email: user.email,
                            displayName:
                                user.name ||
                                profile?.name ||
                                user.email?.split('@')[0],
                            image_url: user.image || (profile as any)?.picture,
                        }),
                    });

                    if (!res.ok) {
                        console.error(
                            'Google backend auth failed:',
                            await res.text(),
                        );
                        return false;
                    }

                    const resData = await res.json();
                    const userData = resData.user || resData.data?.user;
                    const accessToken =
                        resData.accessToken || resData.data?.accessToken;
                    const refreshToken =
                        resData.refreshToken || resData.data?.refreshToken;

                    if (userData?.id) {
                        user.id = userData.id;
                    }
                    (user as any).accessToken = accessToken;
                    (user as any).refreshToken = refreshToken;
                    (user as any).role =
                        userData?.role ||
                        (user.email === 'admin@gmail.com' ? 'ADMIN' : 'USER');
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
            const hasRefreshError = (auth as any)?.error === 'RefreshTokenError';
            const isProtected =
                nextUrl.pathname.startsWith('/chat') ||
                nextUrl.pathname.startsWith('/admin');
            if (isProtected) {
                if (isLoggedIn && !hasRefreshError) return true;
                return false; // Redirect unauthenticated users or users with invalid/expired tokens to login page
            } else if (isLoggedIn && !hasRefreshError) {
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
                token.role =
                    (user as any).role ||
                    (user.email === 'admin@gmail.com' ? 'ADMIN' : 'USER');

                if (token.accessToken) {
                    const decoded = decodeJwt(token.accessToken as string);
                    token.accessTokenExpires = decoded?.exp
                        ? decoded.exp * 1000
                        : Date.now() + 24 * 60 * 60 * 1000;
                }
                return token;
            }

            if (!token.role) {
                token.role =
                    token.email === 'admin@gmail.com' ? 'ADMIN' : 'USER';
            }

            // Return previous token if the access token has not expired yet (refresh 2 minutes before expiration)
            const expiresAt =
                (token.accessTokenExpires as number) ||
                (token.accessToken
                    ? decodeJwt(token.accessToken as string)?.exp
                        ? decodeJwt(token.accessToken as string)!.exp! * 1000
                        : 0
                    : 0);

            const isExpired =
                !expiresAt || Date.now() >= expiresAt - 2 * 60 * 1000;

            if (!isExpired) {
                return token;
            }

            // Access token has expired, try to update it using refresh token
            if (!token.refreshToken) {
                return {
                    ...token,
                    error: 'RefreshTokenError',
                };
            }

            return await refreshAccessToken(token);
        },
        async session({ session, token }) {
            if (token) {
                if (session.user) {
                    session.user.id = token.id as string;
                    session.user.email = token.email as string;
                    session.user.name = token.name as string;
                    session.user.image = (token.picture ||
                        token.image) as string;
                    (session.user as any).role =
                        token.role ||
                        (token.email === 'admin@gmail.com' ? 'ADMIN' : 'USER');
                }
                // Add tokens and error to session so client/server can access them
                (session as any).accessToken = token.accessToken;
                (session as any).refreshToken = token.refreshToken;
                (session as any).error = token.error;
            }
            return session;
        },
    },
    providers: [],
} satisfies NextAuthConfig;
