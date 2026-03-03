"use client";

import { Coach } from "@/types/coach";
import { MapPin, Star, Clock, Info } from "lucide-react";

interface CoachCardProps {
  coach: Coach;
}

const locationIcon = (type: string) => {
  if (type.toLowerCase().includes("online")) return "🌐";
  if (type.toLowerCase().includes("in-person")) return "📍";
  return "🔄";
};

export default function CoachCard({ coach }: CoachCardProps) {
  const fullName = `${coach.firstName} ${coach.lastName}`;

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow duration-200">
      {/* Header */}
      <div className="flex items-start gap-3 mb-3">
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold text-sm flex-shrink-0"
          style={{ backgroundColor: coach.avatarColor }}
        >
          {coach.initials}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1">
            <h3 className="font-semibold text-gray-900 text-sm">{fullName}</h3>
            {coach.verified && (
              <Info size={14} className="text-gray-400 flex-shrink-0" />
            )}
          </div>
          <div className="flex flex-wrap gap-1 mt-1">
            {coach.sports.map((sport) => (
              <span
                key={sport}
                className="text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full font-medium"
              >
                {sport}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="space-y-1.5 mb-3">
        <div className="flex items-center gap-1.5">
          <Star size={13} className="text-yellow-400 fill-yellow-400" />
          <span className="text-sm font-semibold text-gray-800">
            {coach.rating}
          </span>
          <span className="text-xs text-gray-500">
            ({coach.reviewCount} reviews)
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-gray-600">
          <Clock size={13} className="text-gray-400" />
          <span>{coach.yearsExperience} years experience</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-gray-600">
          <span>{locationIcon(coach.coachingType)}</span>
          <span>{coach.coachingType}</span>
        </div>
      </div>

      {/* Bio */}
      <p className="text-xs text-gray-500 leading-relaxed mb-4 line-clamp-2">
        {coach.bio}
      </p>

      {/* Actions */}
      <div className="flex gap-2">
        <button className="flex-1 bg-blue-600 text-white text-xs font-medium py-2 px-3 rounded-lg hover:bg-blue-700 transition-colors">
          View Profile
        </button>
        <button className="flex-1 border border-gray-300 text-gray-700 text-xs font-medium py-2 px-3 rounded-lg hover:bg-gray-50 transition-colors">
          Book Session
        </button>
      </div>
    </div>
  );
}