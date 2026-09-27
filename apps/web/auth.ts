import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { PrismaAdapter } from '@auth/prisma-adapter';
import { prisma } from '@life-rpg/db';
import bcrypt from 'bcryptjs';

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: 'jwt',
  },
  providers: [
    Credentials({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const email = String(credentials.email).toLowerCase().trim();
        const password = String(credentials.password);

        let user = await prisma.user.findUnique({
          where: { email },
          include: { player: true },
        });

        if (!user) {
          // Auto-provision user & player on first sign in for MVP
          const hashedPassword = await bcrypt.hash(password, 10);
          user = await prisma.user.create({
            data: {
              email,
              name: email.split('@')[0],
              password: hashedPassword,
              player: {
                create: {
                  level: 1,
                  xp: 0,
                  streakCount: 0,
                },
              },
            },
            include: { player: true },
          });
          return user;
        }

        if (user.password) {
          const isValid = await bcrypt.compare(password, user.password);
          if (!isValid) return null;
        }

        // Ensure Player record exists
        if (!user.player) {
          await prisma.player.create({
            data: {
              userId: user.id,
              level: 1,
              xp: 0,
              streakCount: 0,
            },
          });
        }

        return user;
      },
    }),
  ],
  events: {
    async createUser({ user }) {
      if (user.id) {
        const existingPlayer = await prisma.player.findUnique({
          where: { userId: user.id },
        });
        if (!existingPlayer) {
          await prisma.player.create({
            data: {
              userId: user.id,
              level: 1,
              xp: 0,
              streakCount: 0,
            },
          });
        }
      }
    },
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.id) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
  pages: {
    signIn: '/signin',
  },
});
