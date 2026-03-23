import NextAuth from "next-auth";
import GitHub from "next-auth/providers/github";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "./prisma";
import type { AuthUser } from "./types";

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  providers: [
    GitHub({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (token?.id) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
});

/**
 * Resolve the authenticated user from the current session.
 * Throws if the request is not authenticated.
 */
export async function getAuthUser(): Promise<AuthUser> {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  return session.user as AuthUser;
}

/**
 * Resolve the authenticated user's ID, returning null if not authenticated.
 * Use when unauthenticated access should silently return empty data.
 */
export async function tryGetAuthUserId(): Promise<string | null> {
  const session = await auth();
  return session?.user?.id ?? null;
}
