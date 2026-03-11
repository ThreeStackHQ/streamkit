import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcryptjs from "bcryptjs";
import { eq } from "drizzle-orm";
import { users, workspaces } from "@streamkit/db/schema";
import { db } from "./db";
import { authConfig } from "./auth.config";

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email = credentials?.email as string | undefined;
        const password = credentials?.password as string | undefined;
        if (!email || !password) return null;

        const result = await db
          .select()
          .from(users)
          .where(eq(users.email, email))
          .limit(1);

        const user = result[0];
        if (!user) return null;

        const valid = await bcryptjs.compare(password, user.passwordHash);
        if (!valid) return null;

        const ws = await db
          .select()
          .from(workspaces)
          .where(eq(workspaces.ownerId, user.id))
          .limit(1);

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          workspaceId: ws[0]?.id,
        };
      },
    }),
  ],
});
