// "use client";

// import { useState, useEffect } from "react";
// import { Consultant } from "@/types/consultant";
// import { DollarSign, CheckCircle } from "lucide-react";
// import { ConsultationCard } from "@/components/ConsultationCard";

// const AVATAR_COLORS = [
//   "#6366F1", // indigo
//   "#8B5CF6", // violet
//   "#0EA5E9", // sky
//   "#10B981", // emerald
//   "#F59E0B", // amber
//   "#EC4899", // pink
// ];

// function getAvatarColor(id: string): string {
//   const index = id.charCodeAt(0) % AVATAR_COLORS.length;
//   return AVATAR_COLORS[index];
// }

// export default function ConsultantCard({ consultant }: { consultant: Consultant }) {
//   const [isBooking, setIsBooking] = useState(false);

//   const fullName    = `${consultant.firstName} ${consultant.lastName}`.trim() || "Unknown";
//   const avatarColor = getAvatarColor(consultant.id);

//   // Prevent background scroll while modal is open
//   useEffect(() => {
//     document.body.style.overflow = isBooking ? "hidden" : "unset";
//     return () => { document.body.style.overflow = "unset"; };
//   }, [isBooking]);

//   return (
//     <>
//       {/* ── CARD ── */}
//       <div className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow duration-200 flex flex-col gap-4">

//         {/* Header */}
//         <div className="flex items-start gap-3">
//           {/* Avatar – use photo if available, else initials */}
//           {consultant.avatarUrl ? (
//             <img
//               src={consultant.avatarUrl}
//               alt={fullName}
//               className="w-10 h-10 rounded-full object-cover flex-shrink-0"
//             />
//           ) : (
//             <div
//               className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold text-sm flex-shrink-0"
//               style={{ backgroundColor: avatarColor }}
//             >
//               {consultant.initials}
//             </div>
//           )}

//           <div className="flex-1 min-w-0">
//             <div className="flex items-center gap-1.5">
//               <h3 className="font-semibold text-gray-900 text-sm truncate">{fullName}</h3>
//               {/* Visual indicator – always shown as consultants are verified on signup */}
//               <CheckCircle size={13} className="text-green-500 flex-shrink-0" />
//             </div>

//             {/* Specialty pill */}
//             <div className="flex flex-wrap gap-1 mt-1">
//               <span className="text-xs text-blue-600 bg-blue-100 px-2 py-0.5 rounded-full font-medium capitalize">
//                 {consultant.specialty.replace(/_/g, " ")}
//               </span>
//             </div>
//           </div>
//         </div>

//         {/* Stats */}
//         <div className="space-y-1.5">
//           {consultant.hourlyRate !== null && (
//             <div className="flex items-center gap-1.5 text-xs text-gray-600">
//               <DollarSign size={13} className="text-gray-400" />
//               <span>${consultant.hourlyRate} / hour</span>
//             </div>
//           )}
//         </div>

//         {/* Bio */}
//         {consultant.bio ? (
//           <p className="text-xs text-gray-500 leading-relaxed line-clamp-2">{consultant.bio}</p>
//         ) : (
//           <p className="text-xs text-gray-300 italic">No bio available</p>
//         )}

//         {/* Certifications */}
//         {consultant.certifications.length > 0 && (
//           <div className="flex flex-wrap gap-1">
//             {consultant.certifications.slice(0, 2).map((cert) => (
//               <span
//                 key={cert}
//                 className="text-xs bg-gray-50 text-gray-500 px-2 py-0.5 rounded-full border border-gray-100"
//               >
//                 {cert}
//               </span>
//             ))}
//           </div>
//         )}

//         {/* Actions */}
//         <div className="flex gap-2 mt-auto">
//           <button className="flex-1 bg-blue-600 text-white text-xs font-medium py-2 px-3 rounded-lg hover:bg-blue-700 transition-colors">
//             View Profile
//           </button>
//           <button
//             onClick={() => setIsBooking(true)}
//             className="flex-1 border border-gray-300 text-gray-700 text-xs font-medium py-2 px-3 rounded-lg hover:bg-gray-50 transition-colors"
//           >
//             Book Session
//           </button>
//         </div>
//       </div>

//       {/* ── BOOKING MODAL ── */}
//       {isBooking && (
//         <ConsultationCard
//           consultant={consultant}
//           onClose={() => setIsBooking(false)}
//         />
//       )}
//     </>
//   );
// }
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import { Consultant } from "@/types/consultant";
import { DollarSign, CheckCircle, MessageSquare } from "lucide-react";
import { ConsultationCard } from "@/components/ConsultationCard";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
)

const AVATAR_COLORS = [
  "#6366F1", "#8B5CF6", "#0EA5E9",
  "#10B981", "#F59E0B", "#EC4899",
];

function getAvatarColor(id: string): string {
  return AVATAR_COLORS[id.charCodeAt(0) % AVATAR_COLORS.length];
}

export default function ConsultantCard({ consultant }: { consultant: Consultant }) {
  const router = useRouter();
  const [isBooking,  setIsBooking]  = useState(false);
  const [messaging,  setMessaging]  = useState(false);

  const fullName    = `${consultant.firstName} ${consultant.lastName}`.trim() || "Unknown";
  const avatarColor = getAvatarColor(consultant.id);

  useEffect(() => {
    document.body.style.overflow = isBooking ? "hidden" : "unset";
    return () => { document.body.style.overflow = "unset"; };
  }, [isBooking]);

  // ── Create or retrieve conversation, then navigate to chat ───────────────
  const handleMessage = async () => {
    setMessaging(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }

      // Check if a conversation already exists between this athlete + consultant
      const { data: existing } = await supabase
        .from("conversations")
        .select("id")
        .eq("athlete_id",  user.id)
        .eq("contact_id",  consultant.id)
        .maybeSingle();

      if (existing) {
        // Conversation exists — open it directly
        router.push(`/athlete/chats?consultantId=${consultant.id}`);
        return;
      }

      // Create a new conversation row
      const { error } = await supabase
        .from("conversations")
        .insert({
          athlete_id:           user.id,
          contact_id:           consultant.id,
          last_message:         null,
          last_message_at:      null,
          unread_count:         0,
          contact_unread_count: 0,
        });

      if (error) throw error;

      router.push(`/athlete/chats?consultantId=${consultant.id}`);
    } catch (err) {
      console.error("Failed to start conversation:", err);
    } finally {
      setMessaging(false);
    }
  };

  return (
    <>
      <div className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow duration-200 flex flex-col gap-4">

        {/* Header */}
        <div className="flex items-start gap-3">
          {consultant.avatarUrl ? (
            <img
              src={consultant.avatarUrl}
              alt={fullName}
              className="w-10 h-10 rounded-full object-cover flex-shrink-0"
            />
          ) : (
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold text-sm flex-shrink-0"
              style={{ backgroundColor: avatarColor }}
            >
              {consultant.initials}
            </div>
          )}

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <h3 className="font-semibold text-gray-900 text-sm truncate">{fullName}</h3>
              <CheckCircle size={13} className="text-green-500 flex-shrink-0" />
            </div>
            <div className="flex flex-wrap gap-1 mt-1">
              <span className="text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full font-medium capitalize">
                {consultant.specialty.replace(/_/g, " ")}
              </span>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="space-y-1.5">
          {consultant.hourlyRate !== null && (
            <div className="flex items-center gap-1.5 text-xs text-gray-600">
              <DollarSign size={13} className="text-gray-400" />
              <span>${consultant.hourlyRate} / hour</span>
            </div>
          )}
        </div>

        {/* Bio */}
        {consultant.bio ? (
          <p className="text-xs text-gray-500 leading-relaxed line-clamp-2">{consultant.bio}</p>
        ) : (
          <p className="text-xs text-gray-300 italic">No bio available</p>
        )}

        {/* Certifications */}
        {consultant.certifications.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {consultant.certifications.slice(0, 2).map((cert) => (
              <span
                key={cert}
                className="text-xs bg-gray-50 text-gray-500 px-2 py-0.5 rounded-full border border-gray-100"
              >
                {cert}
              </span>
            ))}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 mt-auto">
          {/* Message button */}
          <button
            onClick={handleMessage}
            disabled={messaging}
            className="flex items-center justify-center gap-1.5 flex-1 border border-gray-300 text-gray-700 text-xs font-medium py-2 px-3 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            <MessageSquare size={13} />
            {messaging ? "Opening..." : "Message"}
          </button>

          {/* Book Session button */}
          <button
            onClick={() => setIsBooking(true)}
            className="flex-1 bg-blue-600 text-white text-xs font-medium py-2 px-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Book Session
          </button>
        </div>
      </div>

      {isBooking && (
        <ConsultationCard
          consultant={consultant}
          onClose={() => setIsBooking(false)}
        />
      )}
    </>
  );
}
