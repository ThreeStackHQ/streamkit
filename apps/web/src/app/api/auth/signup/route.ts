import { NextResponse } from "next/server";
import bcryptjs from "bcryptjs";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { users, workspaces, subscriptions } from "@streamkit/db/schema";
import { db } from "@/lib/db";

const signupSchema = z.object({
  email: z.string().email().max(255),
  password: z.string().min(8).max(128),
  name: z.string().min(2).max(100),
});

export async function POST(request: Request) {
  try {
    const body: unknown = await request.json();
    const data = signupSchema.parse(body);

    const existing = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, data.email))
      .limit(1);

    if (existing.length > 0) {
      return NextResponse.json(
        { status: "fail", message: "Email already registered" },
        { status: 422 }
      );
    }

    const passwordHash = await bcryptjs.hash(data.password, 12);

    const [user] = await db
      .insert(users)
      .values({
        email: data.email,
        passwordHash,
        name: data.name,
      })
      .returning();

    const [workspace] = await db
      .insert(workspaces)
      .values({
        name: `${data.name}'s workspace`,
        ownerId: user.id,
      })
      .returning();

    await db.insert(subscriptions).values({
      workspaceId: workspace.id,
      tier: "free",
    });

    return NextResponse.json(
      {
        status: "success",
        data: { id: user.id, email: user.email, name: user.name },
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          status: "fail",
          message: "Validation error",
          errors: error.errors.map((e) => ({
            field: e.path.join("."),
            message: e.message,
          })),
        },
        { status: 422 }
      );
    }
    console.error("Signup error:", error);
    return NextResponse.json(
      { status: "fail", message: "Internal server error" },
      { status: 500 }
    );
  }
}
