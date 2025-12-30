export const runtime = 'nodejs';

import type { NextAuthConfig } from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';

export const authConfig: NextAuthConfig = {
    pages: {
        signIn: '/login',
    },
    providers: [
        Credentials({
            credentials: {
                email: { label: 'Email', type: 'email' },
                password: { label: 'Password', type: 'password' },
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) {
                    return null;
                }

                // Import db only in Node.js runtime
                const { getUserByEmail } = await import('@/lib/db');
                const user = await getUserByEmail(credentials.email as string);

                if (!user) {
                    return null;
                }

                const passwordMatch = await bcrypt.compare(
                    credentials.password as string,
                    user.password_hash
                );

                if (!passwordMatch) {
                    return null;
                }

                if (user.banned_until) {
                    const banDate = new Date(user.banned_until);
                    if (banDate > new Date()) {
                        throw new Error(`Tài khoản của bạn bị khóa đến ${banDate.toLocaleDateString('vi-VN')} ${banDate.toLocaleTimeString('vi-VN')}`);
                    }
                }

                return {
                    id: user.id.toString(),
                    email: user.email,
                    name: user.name,
                    role: user.role,
                    avatar: user.avatar,
                };
            },
        }),
    ],
    callbacks: {
        async jwt({ token, user, trigger, session }) {
            if (user) {
                token.id = user.id;
                token.role = user.role;
            }
            // Handle session update for simple fields
            if (trigger === "update" && session) {
                if (session.name) token.name = session.name;
            }
            return token;
        },
        async session({ session, token }) {
            if (token && session.user) {
                session.user.id = token.id as string;
                session.user.role = token.role as string;
            }
            return session;
        },
    },
    session: {
        strategy: 'jwt',
    },
    cookies: {
        sessionToken: {
            name: `vietdict.session-token`,
            options: {
                httpOnly: true,
                sameSite: 'lax',
                path: '/',
                secure: process.env.NODE_ENV === 'production',
            },
        },
    },
};
