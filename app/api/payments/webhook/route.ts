import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

// const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
//   apiVersion: "2024-06-20",
// });
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

// Must use admin client — webhook runs server-side, no user session
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  const body      = await req.text();
  const signature = req.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing stripe-signature header" }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Webhook verification failed";
    console.error("[webhook] signature verification failed:", message);
    return NextResponse.json({ error: message }, { status: 400 });
  }

  // ── Handle events ──────────────────────────────────────────────────────────

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;

    // Only process paid sessions
    if (session.payment_status !== "paid") {
      return NextResponse.json({ received: true });
    }

    const sessionIds = session.metadata?.session_ids?.split(",").filter(Boolean);

    if (!sessionIds || sessionIds.length === 0) {
      console.error("[webhook] No session_ids in metadata");
      return NextResponse.json({ received: true });
    }

    // Update sessions: mark as paid + confirmed
    const { error } = await supabaseAdmin
      .from("sessions")
      .update({
        payment_status: "paid",
        status:         "confirmed",
      })
      .in("id", sessionIds);

    if (error) {
      console.error("[webhook] Failed to update sessions:", error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Record payment in payments table (if you have one)
    const athleteId   = session.metadata?.athlete_id;
    const amountTotal = session.amount_total ?? 0;

    if (athleteId) {
      await supabaseAdmin.from("payments").insert({
        stripe_checkout_id: session.id,
        athlete_id:         athleteId,
        amount:             amountTotal / 100, // convert cents → dollars
        currency:           session.currency?.toUpperCase() ?? "USD",
        status:             "succeeded",
        session_ids:        sessionIds,
      }).select(); // ignore error if payments table doesn't exist
    }

    console.log(`[webhook] Payment confirmed for sessions: ${sessionIds.join(", ")}`);
  }

  if (event.type === "checkout.session.expired") {
    const session = event.data.object as Stripe.Checkout.Session;
    const sessionIds = session.metadata?.session_ids?.split(",").filter(Boolean);

    if (sessionIds?.length) {
      // Mark sessions as cancelled if checkout expired
      await supabaseAdmin
        .from("sessions")
        .update({ status: "cancelled", payment_status: "unpaid" })
        .in("id", sessionIds);
    }
  }

  return NextResponse.json({ received: true });
}

// Disable body parsing — Stripe needs the raw body to verify signatures
export const config = {
  api: { bodyParser: false },
};