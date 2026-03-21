// "use client";

// import { useState, useEffect } from "react";
// import { Coach } from "@/types/coach";
// import { Star, Clock, CheckCircle, Loader2 } from "lucide-react";
// import { SessionCard } from "@/components/SessionCard"; // Import the multi-step SessionCard
// import { coachService } from "@/services/coach/coach.service";

// const AVATAR_COLORS = [
//   "#3B82F6", "#8B5CF6", "#10B981",
//   "#F59E0B", "#EC4899", "#6366F1",
// ];

// /**
//  * Utility: Generates a consistent color for the user avatar based on their ID string
//  */
// function getAvatarColor(id: string) {
//   const index = id.charCodeAt(0) % AVATAR_COLORS.length;
//   return AVATAR_COLORS[index];
// }

// export default function CoachCard({ coach }: { coach: Coach }) {
//   // --- STATE MANAGEMENT ---
//   const [isBooking, setIsBooking] = useState(false); // Controls the visibility of the booking popup
//   const [stats, setStats] = useState<{ totalSessions: number; averageRating: number } | null>(null);
//   const [loadingStats, setLoadingStats] = useState(true);

//   const fullName = `${coach.firstName} ${coach.lastName}`;
//   const avatarColor = getAvatarColor(coach.id);

//   // --- FETCH STATS ---
//   useEffect(() => {
//     async function fetchStats() {
//       setLoadingStats(true);
//       const { data, error } = await coachService.getCoachStats(coach.id);
//       if (!error && data) {
//         setStats(data);
//       }
//       setLoadingStats(false);
//     }
//     fetchStats();
//   }, [coach.id]);

//   // --- SIDE EFFECTS ---
//   /**
//    * Prevents the background page from scrolling when the booking modal is active.
//    * Also applies a scaling effect to the background layout for a modern UI feel.
//    */
//   useEffect(() => {
//     if (isBooking) {
//       // Disable body scroll when modal is open
//       document.body.style.overflow = "hidden";
//       // Add class to trigger the background scaling effect (defined in globals.css)
//       document.documentElement.classList.add("modal-open-scale");
//     } else {
//       // Re-enable body scroll
//       document.body.style.overflow = "unset";
//       // Remove scaling effect
//       document.documentElement.classList.remove("modal-open-scale");
//     }
//     // Cleanup on unmount to prevent stale styles
//     return () => {
//       document.body.style.overflow = "unset";
//       document.documentElement.classList.remove("modal-open-scale");
//     };
//   }, [isBooking]);

//   // --- HANDLERS ---
//   /**
//    * Opens the booking modal and triggers the layout scale-down
//    */
//   const handleOpenBooking = () => setIsBooking(true);

//   /**
//    * Closes the booking modal and restores the layout scale
//    */
//   const handleCloseBooking = () => setIsBooking(false);

//   return (
//     <>
//       {/* 
//           MAIN COACH CARD UI
//       */}
//       <div className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow duration-200 flex flex-col gap-4 relative">
//         {/* Header */}
//         <div className="flex items-start gap-3">
//           <div
//             className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold text-sm flex-shrink-0"
//             style={{ backgroundColor: avatarColor }}
//           >
//             {coach.initials}
//           </div>
//           <div className="flex-1 min-w-0">
//             <div className="flex items-center gap-1.5">
//               <h3 className="font-semibold text-gray-900 text-sm truncate">{fullName}</h3>
//               {coach.isAvailable && (
//                 <CheckCircle size={13} className="text-green-500 flex-shrink-0" />
//               )}
//             </div>
//             <div className="flex flex-wrap gap-1 mt-1">
//               <span className="text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full font-medium">
//                 {coach.sport}
//               </span>
//               {coach.specialization && (
//                 <span className="text-xs text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full font-medium">
//                   {coach.specialization}
//                 </span>
//               )}
//             </div>
//           </div>
//         </div>

//         {/* Stats */}
//         <div className="space-y-1.5">
//           {loadingStats ? (
//             <div className="flex items-center gap-2 text-xs text-gray-400">
//               <Loader2 size={12} className="animate-spin" />
//               <span>Loading stats...</span>
//             </div>
//           ) : (
//             <div className="flex items-center gap-1.5">
//               <Star size={13} className="text-yellow-400 fill-yellow-400" />
//               <span className="text-sm font-semibold text-gray-800">
//                 {stats?.averageRating ?? coach.rating ?? "0.0"}
//               </span>
//               <span className="text-xs text-gray-400">
//                 ({stats?.totalSessions ?? 0} sessions)
//               </span>
//             </div>
//           )}
          
//           {coach.yearsOfExperience !== null && (
//             <div className="flex items-center gap-1.5 text-xs text-gray-600">
//               <Clock size={13} className="text-gray-400" />
//               <span>{coach.yearsOfExperience} years experience</span>
//             </div>
//           )}
//           {coach.hourlyRate !== null && (
//             <div className="flex items-center gap-1.5 text-xs text-gray-600">
//               {/*<DollarSign size={13} className="text-gray-400" />*/}
//               <span>LKR {coach.hourlyRate} / hour</span>
//             </div>
//           )}
//         </div>

//         {/* Bio */}
//         {coach.bio ? (
//           <p className="text-xs text-gray-500 leading-relaxed line-clamp-2">{coach.bio}</p>
//         ) : (
//           <p className="text-xs text-gray-300 italic">No bio available</p>
//         )}

//         {/* Certifications */}
//         {coach.certifications.length > 0 && (
//           <div className="flex flex-wrap gap-1">
//             {coach.certifications.slice(0, 2).map((cert) => (
//               <span key={cert} className="text-xs bg-gray-50 text-gray-500 px-2 py-0.5 rounded-full border border-gray-100">
//                 {cert}
//               </span>
//             ))}
//           </div>
//         )}

//         {/* Actions */}
//         <div className="flex gap-2 mt-auto">
//           {/* View Profile Button - Currently placeholder */}
//           <button className="flex-1 bg-blue-600 text-white text-xs font-medium py-2 px-3 rounded-lg hover:bg-blue-700 transition-colors">
//             View Profile
//           </button>
//           {/* Book Session Button - Opens the scaled booking experience */}
//           <button 
//             onClick={handleOpenBooking}
//             className="flex-1 border border-gray-300 text-gray-700 text-xs font-medium py-2 px-3 rounded-lg hover:bg-gray-50 transition-colors"
//           >
//             Book Session
//           </button>
//         </div>
//       </div>

//       {/* 
//           LOAD SESSION MODAL
//           The SessionCard handles the actual booking flow.
//           It is rendered inside the same container but isn't scaled itself 
//           because of how fixed positioning interacts with parents.
//       */}
//       {isBooking && (
//         <SessionCard 
//           coach={coach} 
//           onClose={handleCloseBooking} 
//         />
//       )}
//     </>
//   );
// }

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import { Coach } from "@/types/coach";
import { Star, Clock, CheckCircle, MessageSquare } from "lucide-react";
import { SessionCard } from "@/components/SessionCard";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
)

const AVATAR_COLORS = [
  "#3B82F6", "#8B5CF6", "#10B981",
  "#F59E0B", "#EC4899", "#6366F1",
];

function getAvatarColor(id: string) {
  return AVATAR_COLORS[id.charCodeAt(0) % AVATAR_COLORS.length];
}

export default function CoachCard({ coach }: { coach: Coach }) {
  const router = useRouter();
  const [isBooking,     setIsBooking]     = useState(false);
  const [messaging,     setMessaging]     = useState(false);
  const [isAthlete,     setIsAthlete]     = useState(true);   // optimistic
  const [roleLoaded,    setRoleLoaded]    = useState(false);  // true once fetch resolves
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const fullName    = `${coach.firstName} ${coach.lastName}`;
  const avatarColor = getAvatarColor(coach.id);

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) { setRoleLoaded(true); return; }
      setCurrentUserId(user.id);
      const { data } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();
      setIsAthlete(data?.role === "athlete");
      setRoleLoaded(true);
    });
  }, []);

  useEffect(() => {
    document.body.style.overflow = isBooking ? "hidden" : "unset";
    return () => { document.body.style.overflow = "unset"; };
  }, [isBooking]);

  // Show buttons optimistically; hide only after confirmed non-athlete or own card
  const showActions = (!roleLoaded || isAthlete) && currentUserId !== coach.id;

  const handleMessage = async () => {
    setMessaging(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }

      const { data: existing } = await supabase
        .from("conversations")
        .select("id")
        .eq("athlete_id", user.id)
        .eq("contact_id", coach.id)
        .maybeSingle();

      if (existing) {
        router.push(`/athlete/chats?contactId=${coach.id}`);
        return;
      }

      const { error } = await supabase
        .from("conversations")
        .insert({
          athlete_id:           user.id,
          contact_id:           coach.id,
          last_message:         null,
          last_message_at:      null,
          unread_count:         0,
          contact_unread_count: 0,
        });

      if (error) throw error;
      router.push(`/athlete/chats?contactId=${coach.id}`);
    } catch (err) {
      console.error("Failed to start conversation:", err);
    } finally {
      setMessaging(false);
    }
  };

  return (
    <>
      <div className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow duration-200 flex flex-col gap-4 relative">

        {/* Header */}
        <div className="flex items-start gap-3">
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold text-sm flex-shrink-0"
            style={{ backgroundColor: avatarColor }}
          >
            {coach.initials}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <h3 className="font-semibold text-gray-900 text-sm truncate">{fullName}</h3>
              {coach.isAvailable && (
                <CheckCircle size={13} className="text-green-500 flex-shrink-0" />
              )}
            </div>
            <div className="flex flex-wrap gap-1 mt-1">
              <span className="text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full font-medium">
                {coach.sport}
              </span>
              {coach.specialization && (
                <span className="text-xs text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full font-medium">
                  {coach.specialization}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="space-y-1.5">
          {coach.rating !== null && (
            <div className="flex items-center gap-1.5">
              <Star size={13} className="text-yellow-400 fill-yellow-400" />
              <span className="text-sm font-semibold text-gray-800">{coach.rating}</span>
              {coach.totalSessions !== null && (
                <span className="text-xs text-gray-400">({coach.totalSessions} sessions)</span>
              )}
            </div>
          )}
          {coach.yearsOfExperience !== null && (
            <div className="flex items-center gap-1.5 text-xs text-gray-600">
              <Clock size={13} className="text-gray-400" />
              <span>{coach.yearsOfExperience} years experience</span>
            </div>
          )}
          {coach.hourlyRate !== null && (
            <div className="flex items-center gap-1.5 text-xs text-gray-600">
              <span>LKR {coach.hourlyRate / 2} / 30 min</span>
            </div>
          )}
        </div>

        {/* Bio */}
        {coach.bio ? (
          <p className="text-xs text-gray-500 leading-relaxed line-clamp-2">{coach.bio}</p>
        ) : (
          <p className="text-xs text-gray-300 italic">No bio available</p>
        )}

        {/* Certifications */}
        {coach.certifications.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {coach.certifications.slice(0, 2).map((cert) => (
              <span key={cert} className="text-xs bg-gray-50 text-gray-500 px-2 py-0.5 rounded-full border border-gray-100">
                {cert}
              </span>
            ))}
          </div>
        )}

        {/* Actions */}
        {showActions && (
          <div className="flex gap-2 mt-auto">
            <button
              onClick={handleMessage}
              disabled={messaging}
              className="flex items-center justify-center gap-1.5 flex-1 border border-gray-300 text-gray-700 text-xs font-medium py-2 px-3 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              <MessageSquare size={13} />
              {messaging ? "Opening..." : "Message"}
            </button>
            <button
              onClick={() => setIsBooking(true)}
              className="flex-1 bg-blue-600 text-white text-xs font-medium py-2 px-3 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Book Session
            </button>
          </div>
        )}
      </div>

      {isBooking && (
        <SessionCard
          coach={coach}
          onClose={() => setIsBooking(false)}
        />
      )}
    </>
  );
}