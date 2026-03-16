"use client";

import { useState, useEffect } from "react";
import { Coach } from "@/types/coach";
import { Star, Clock, DollarSign, CheckCircle, Loader2 } from "lucide-react";
import { SessionCard } from "@/components/SessionCard"; // Import the multi-step SessionCard
import { coachService } from "@/services/coach/coach.service";

const AVATAR_COLORS = [
  "#3B82F6", "#8B5CF6", "#10B981",
  "#F59E0B", "#EC4899", "#6366F1",
];

/**
 * Utility: Generates a consistent color for the user avatar based on their ID string
 */
function getAvatarColor(id: string) {
  const index = id.charCodeAt(0) % AVATAR_COLORS.length;
  return AVATAR_COLORS[index];
}

export default function CoachCard({ coach }: { coach: Coach }) {
  // --- STATE MANAGEMENT ---
  const [isBooking, setIsBooking] = useState(false); // Controls the visibility of the booking popup
  const [stats, setStats] = useState<{ totalSessions: number; averageRating: number } | null>(null);
  const [loadingStats, setLoadingStats] = useState(true);

  const fullName = `${coach.firstName} ${coach.lastName}`;
  const avatarColor = getAvatarColor(coach.id);

  // --- FETCH STATS ---
  useEffect(() => {
    async function fetchStats() {
      setLoadingStats(true);
      const { data, error } = await coachService.getCoachStats(coach.id);
      if (!error && data) {
        setStats(data);
      }
      setLoadingStats(false);
    }
    fetchStats();
  }, [coach.id]);

  // --- SIDE EFFECTS ---
  /**
   * Prevents the background page from scrolling when the booking modal is active.
   * Also applies a scaling effect to the background layout for a modern UI feel.
   */
  useEffect(() => {
    if (isBooking) {
      // Disable body scroll when modal is open
      document.body.style.overflow = "hidden";
      // Add class to trigger the background scaling effect (defined in globals.css)
      document.documentElement.classList.add("modal-open-scale");
    } else {
      // Re-enable body scroll
      document.body.style.overflow = "unset";
      // Remove scaling effect
      document.documentElement.classList.remove("modal-open-scale");
    }
    // Cleanup on unmount to prevent stale styles
    return () => {
      document.body.style.overflow = "unset";
      document.documentElement.classList.remove("modal-open-scale");
    };
  }, [isBooking]);

  // --- HANDLERS ---
  /**
   * Opens the booking modal and triggers the layout scale-down
   */
  const handleOpenBooking = () => setIsBooking(true);

  /**
   * Closes the booking modal and restores the layout scale
   */
  const handleCloseBooking = () => setIsBooking(false);

  return (
    <>
      {/* 
          MAIN COACH CARD UI
      */}
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
          {loadingStats ? (
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <Loader2 size={12} className="animate-spin" />
              <span>Loading stats...</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5">
              <Star size={13} className="text-yellow-400 fill-yellow-400" />
              <span className="text-sm font-semibold text-gray-800">
                {stats?.averageRating ?? coach.rating ?? "0.0"}
              </span>
              <span className="text-xs text-gray-400">
                ({stats?.totalSessions ?? 0} sessions)
              </span>
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
              <DollarSign size={13} className="text-gray-400" />
              <span>LKR {coach.hourlyRate} / hour</span>
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
        <div className="flex gap-2 mt-auto">
          {/* View Profile Button - Currently placeholder */}
          <button className="flex-1 bg-blue-600 text-white text-xs font-medium py-2 px-3 rounded-lg hover:bg-blue-700 transition-colors">
            View Profile
          </button>
          {/* Book Session Button - Opens the scaled booking experience */}
          <button 
            onClick={handleOpenBooking}
            className="flex-1 border border-gray-300 text-gray-700 text-xs font-medium py-2 px-3 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Book Session
          </button>
        </div>
      </div>

      {/* 
          LOAD SESSION MODAL
          The SessionCard handles the actual booking flow.
          It is rendered inside the same container but isn't scaled itself 
          because of how fixed positioning interacts with parents.
      */}
      {isBooking && (
        <SessionCard 
          coach={coach} 
          onClose={handleCloseBooking} 
        />
      )}
    </>
  );
}
