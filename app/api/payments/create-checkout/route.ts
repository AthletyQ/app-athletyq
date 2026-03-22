import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: NextRequest) {

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  try {
    const { sessionIds } = await req.json();

    if (!sessionIds || !Array.isArray(sessionIds) || sessionIds.length === 0) {
      return NextResponse.json({ error: "No session IDs provided" }, { status: 400 });
    }

   
    const { data: sessions, error } = await supabaseAdmin
      .from("sessions")
      .select(`
        id,
        price,
        currency,
        scheduled_at,
        duration_minutes,
        provider_type,
        provider_id,
        athlete_id,
        profiles!sessions_provider_id_fkey (
          first_name,
          last_name
        )
      `)
      .in("id", sessionIds);

    if (error || !sessions || sessions.length === 0) {
      return NextResponse.json({ error: "Sessions not found" }, { status: 404 });
    }


    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = sessions.map((s: any) => {
      const provider = Array.isArray(s.profiles) ? s.profiles[0] : s.profiles;
      const providerName = provider
        ? `${provider.first_name} ${provider.last_name}`
        : "Provider";
      const scheduledDate = new Date(s.scheduled_at).toLocaleString("en-US", {
        month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
      });

      return {
        price_data: {
          currency:     (s.currency ?? "lkr").toLowerCase(),
          unit_amount:  Math.round(Number(s.price) * 100),
          product_data: {
            name:        `Session with ${providerName}`,
            description: `${s.provider_type === "coach" ? "Coaching" : "Consultation"} · ${s.duration_minutes} min · ${scheduledDate}`,
          },
        },
        quantity: 1,
      };
    });

    const totalAmount = sessions.reduce((sum, s) => sum + Number(s.price), 0);
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  
    const checkoutSession = await stripe.checkout.sessions.create({
      mode:        "payment",
      line_items:  lineItems,
      success_url: `${baseUrl}/athlete/payment/success?session_ids=${sessionIds.join(",")}&checkout_id={CHECKOUT_SESSION_ID}`,
      cancel_url:  `${baseUrl}/athlete/payment/cancel`,
      metadata: {
        session_ids:  sessionIds.join(","),
        athlete_id:   sessions[0].athlete_id,
        total_amount: String(totalAmount),
      },
      payment_intent_data: {
        metadata: {
          session_ids: sessionIds.join(","),
          athlete_id:  sessions[0].athlete_id,
        },
      },
    });

    return NextResponse.json({ url: checkoutSession.url });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unexpected error";
    console.error("[create-checkout]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}