import { DefaultSession, NextAuthOptions } from 'next-auth'
import { prisma } from './db'
import { PrismaAdapter } from '@next-auth/prisma-adapter'
import GoogleProvider from 'next-auth/providers/google'


declare module 'next-auth' {
    interface Session extends DefaultSession {
        user: {
            id: string;
            credits: number;
        } & DefaultSession["user"];
    }
}

declare module 'next-auth/jwt' {
    interface JWT {
        id: string;
        credits: number;
    }
}

export const authOptions: NextAuthOptions = {
    session: {
        strategy: 'jwt'
    },
    callbacks: {
        jwt: async ({ token }) => {
            // Searching for a user in the database with the email provided in the JWT
            const db_user = await prisma.user.findFirst({
                where: {
                    email: token.email
                }
            });
            // If the user is found, attach the user's ID and credits to the JWT
            // This enriches the JWT with critical user information
            // Binding the database user ID to the token
            // Binding the user's credits to the token
            // Returning the modified token with additional user information
            if (db_user) {
                token.id = db_user.id
                token.credits = db_user.credits
            }
            return token;
        },
        session: ({ session, token }) => {
            if (token) {
                session.user.id = token.id;
                session.user.name = token.name;
                session.user.email = token.email;
                session.user.image = token.picture;
                session.user.credits = token.credits;
            }
            return session;
        }

    },
    secret: process.env.NEXTAUTH_SECRET as string,
    adapter: PrismaAdapter(prisma),
    providers: [
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID as string,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET as string
        })
    ]
}