import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
);

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const athleteId = searchParams.get("athleteId");

  if (!athleteId) {
    return NextResponse.json({ error: "athleteId required" }, { status: 400 });
  }

  const { data, error } = await supabase
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
    .eq("athlete_id", athleteId)
    .order("last_message_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  interface ConversationRow {
    id: string;
    last_message: string | null;
    last_message_at: string;
    unread_count: number;
    contact: {
      id: string;
      first_name: string;
      last_name: string;
      role: string;
    } | null;
  }

  const conversations = ((data as unknown as ConversationRow[]) ?? []).map((row) => {
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