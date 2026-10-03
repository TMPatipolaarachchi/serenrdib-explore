/**
 * Public-site authentication (NextAuth v4).
 *
 *  • Email + password (Credentials provider, bcrypt hashes)
 *  • Google sign-in (enabled when GOOGLE_CLIENT_ID/SECRET are set)
 *
 * Sessions are JWTs. On every server request we still re-load the user from the
 * database (`getCurrentUser`) so suspensions/bans take effect immediately.
 *
 * Admins do NOT use this — see src/lib/admin-auth.ts.
 */
import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { getServerSession, type NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import type { User } from "@/generated/prisma/client";
import { prisma } from "./prisma";
import { loginSchema } from "./validations";
import { rateLimit, resetRateLimit } from "./rate-limit";
import { ApiError } from "./api";

export const googleEnabled = Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);

/** Returns a reason code if the account can't be used right now, otherwise null. */
export function accountBlockReason(user: Pick<User, "status" | "suspendedUntil">): "AccountBanned" | "AccountSuspended" | null {
  if (user.status === "BANNED") return "AccountBanned";
  if (user.status === "SUSPENDED" && (!user.suspendedUntil || user.suspendedUntil > new Date())) {
    return "AccountSuspended";
  }
  return null;
}

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  session: { strategy: "jwt", maxAge: 30 * 24 * 60 * 60 },
  pages: { signIn: "/login", error: "/login" },
  providers: [
    CredentialsProvider({
      id: "credentials",
      name: "Email",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) return null;
        const { email, password } = parsed.data;

        // Slow down password guessing: 10 attempts per 15 minutes per email.
        const limitKey = `login:${email}`;
        if (!rateLimit(limitKey, 10, 15 * 60_000).ok) throw new Error("TooManyAttempts");

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user?.passwordHash || !(await bcrypt.compare(password, user.passwordHash))) return null;

        const blocked = accountBlockReason(user);
        if (blocked) throw new Error(blocked);

        resetRateLimit(limitKey);
        await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
        return { id: user.id, name: user.name, email: user.email, image: user.image };
      },
    }),
    ...(googleEnabled
      ? [
          GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
          }),
        ]
      : []),
  ],
  callbacks: {
    /** Creates/links the local user for Google sign-ins and blocks banned accounts. */
    async signIn({ user, account, profile }) {
      if (account?.provider !== "google") return true;

      const email = user.email?.toLowerCase();
      const emailVerified = (profile as { email_verified?: boolean } | undefined)?.email_verified;
      if (!email || emailVerified === false) return "/login?error=GoogleEmailNotVerified";

      let dbUser = await prisma.user.findUnique({ where: { email } });
      if (!dbUser) {
        dbUser = await prisma.user.create({
          data: {
            email,
            name: user.name || email.split("@")[0]!,
            image: user.image,
            googleId: account.providerAccountId,
            emailVerified: new Date(),
          },
        });
      } else if (!dbUser.googleId) {
        dbUser = await prisma.user.update({
          where: { id: dbUser.id },
          data: { googleId: account.providerAccountId, image: dbUser.image ?? user.image, emailVerified: new Date() },
        });
      }

      const blocked = accountBlockReason(dbUser);
      if (blocked) return `/login?error=${blocked}`;

      await prisma.user.update({ where: { id: dbUser.id }, data: { lastLoginAt: new Date() } });
      return true;
    },

    async jwt({ token, user, account, trigger, session }) {
      if (account && user) {
        if (account.provider === "google") {
          // Use our database id, not Google's account id.
          const dbUser = await prisma.user.findUnique({ where: { email: token.email!.toLowerCase() } });
          if (dbUser) {
            token.sub = dbUser.id;
            token.name = dbUser.name;
            token.picture = dbUser.image;
          }
        } else {
          token.sub = user.id;
        }
      }
      // Allows `useSession().update({ name })` after editing the profile.
      if (trigger === "update" && session && typeof session.name === "string") token.name = session.name;
      return token;
    },

    async session({ session, token }) {
      if (session.user && token.sub) session.user.id = token.sub;
      return session;
    },
  },
};

/**
 * The signed-in user loaded fresh from the database, or null.
 * Wrapped in React `cache` so multiple calls in one request hit the DB once.
 */
export const getCurrentUser = cache(async () => {
  const session = await getServerSession(authOptions);
  const id = session?.user?.id;
  if (!id) return null;
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user || accountBlockReason(user)) return null;
  return user;
});

/** For pages: redirects to the login page when nobody is signed in. */
export async function requireUser(callbackUrl: string) {
  const user = await getCurrentUser();
  if (!user) redirect(`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`);
  return user;
}

/** For API routes: throws a 401 ApiError when nobody is signed in. */
export async function requireApiUser() {
  const user = await getCurrentUser();
  if (!user) throw new ApiError(401, "unauthorized");
  return user;
}
