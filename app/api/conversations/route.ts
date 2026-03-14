import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
);

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const athleteId = searchParams.get("athleteId");
  const contactId = searchParams.get("contactId");

  if (!athleteId && !contactId) {
    return NextResponse.json({ error: "athleteId or contactId required" }, { status: 400 });
  }

  const query = supabase
    .from("conversations")
    .select(`
      id,
      last_message,
      last_message_at,
      unread_count,
      contact:profiles!conversations_contact_id_fkey (
        id,
        first_name,
        last_name,
        role
      )
    `)
    .order("last_message_at", { ascending: false });

  const { data, error } = athleteId
    ? await query.eq("athlete_id", athleteId)
    : await query.eq("contact_id", contactId!);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const conversations = (data ?? []).map((row: any) => {
    const contact = row.contact;
    const firstName = contact?.first_name ?? "";
    const lastName  = contact?.last_name  ?? "";
    return {
      id:            row.id,
      lastMessage:   row.last_message,
      lastMessageAt: row.last_message_at,
      unreadCount:   row.unread_count,
      contact: {
        id:        contact?.id,
        firstName,
        lastName,
        initials:  `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase(),
        role:      contact?.role ?? "Coach",
        isOnline:  false,
      },
    };
  });

  return NextResponse.json({ conversations });
}