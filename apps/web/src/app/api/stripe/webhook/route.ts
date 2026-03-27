import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { subscriptions } from "@streamkit/db/schema";
import { db } from "@/lib/db";
import { getStripe } from "@/lib/stripe";
import type Stripe from "stripe";

export async function POST(request: Request) {
  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json(
      { status: "fail", message: "Missing signature" },
      { status: 400 }
    );
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    return NextResponse.json(
      { status: "fail", message: "Webhook secret not configured" },
      { status: 500 }
    );
  }

  let event: Stripe.Event;
  try {
    const stripe = getStripe();
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch {
    return NextResponse.json(
      { status: "fail", message: "Invalid signature" },
      { status: 400 }
    );
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const workspaceId = session.metadata?.workspaceId;
      if (!workspaceId) break;

      const stripeSubscriptionId = session.subscription as string;
      const stripe = getStripe();
      const subscription = await stripe.subscriptions.retrieve(stripeSubscriptionId);
      const priceId = subscription.items.data[0]?.price.id;

      let tier: "pro" | "business" = "pro";
      if (priceId === process.env.STRIPE_PRICE_BUSINESS) {
        tier = "business";
      }

      await db
        .update(subscriptions)
        .set({
          tier,
          status: "active",
          stripeCustomerId: session.customer as string,
          stripeSubscriptionId,
          currentPeriodEnd: new Date(subscription.current_period_end * 1000),
        })
        .where(eq(subscriptions.workspaceId, workspaceId));
      break;
    }

    case "customer.subscription.updated": {
      const subscription = event.data.object as Stripe.Subscription;
      const sub = await db
        .select()
        .from(subscriptions)
        .where(eq(subscriptions.stripeSubscriptionId, subscription.id))
        .limit(1);

      if (sub[0]) {
        await db
          .update(subscriptions)
          .set({
            status: subscription.status === "active" ? "active" : "inactive",
            currentPeriodEnd: new Date(subscription.current_period_end * 1000),
          })
          .where(eq(subscriptions.id, sub[0].id));
      }
      break;
    }

    case "customer.subscription.deleted": {
      const subscription = event.data.object as Stripe.Subscription;
      await db
        .update(subscriptions)
        .set({ tier: "free", status: "cancelled", stripeSubscriptionId: null })
        .where(eq(subscriptions.stripeSubscriptionId, subscription.id));
      break;
    }
  }

  return NextResponse.json({ received: true });
}
