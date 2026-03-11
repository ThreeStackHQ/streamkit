import { NextResponse } from "next/server";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { subscriptions } from "@streamkit/db/schema";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { getStripe } from "@/lib/stripe";

const checkoutSchema = z.object({
  tier: z.enum(["pro", "business"]),
});

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json(
      { status: "fail", message: "Unauthorized" },
      { status: 401 }
    );
  }

  const workspaceId = (session.user as { workspaceId?: string }).workspaceId;
  if (!workspaceId) {
    return NextResponse.json(
      { status: "fail", message: "No workspace" },
      { status: 400 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { status: "fail", message: "Invalid JSON" },
      { status: 400 }
    );
  }

  const parsed = checkoutSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { status: "fail", message: "Validation error" },
      { status: 422 }
    );
  }

  const priceId =
    parsed.data.tier === "pro"
      ? process.env.STRIPE_PRICE_PRO
      : process.env.STRIPE_PRICE_BUSINESS;

  if (!priceId) {
    return NextResponse.json(
      { status: "fail", message: "Price not configured" },
      { status: 500 }
    );
  }

  const stripe = getStripe();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  const checkoutSession = await stripe.checkout.sessions.create({
    mode: "subscription",
    payment_method_types: ["card"],
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${appUrl}/dashboard?billing=success`,
    cancel_url: `${appUrl}/dashboard?billing=cancelled`,
    metadata: { workspaceId },
  });

  return NextResponse.json({
    status: "success",
    data: { url: checkoutSession.url },
  });
}
