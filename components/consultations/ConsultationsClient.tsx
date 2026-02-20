"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import { Eye, Stethoscope, Dumbbell } from "lucide-react";
import type { ConsultationSession } from "@/lib/types/dashboard";

interface Props {
  sessions: ConsultationSession[];
}

type Tab = "Doctors" | "Coaches";

const STATUS_STYLES: Record<ConsultationSession["status"], string> = {
  COMPLETED: "bg-green-50 text-green-600",
  UPCOMING: "bg-blue-50 text-blue-500",
  CANCELLED: "bg-red-50 text-red-500",
};

export default function ConsultationsClient({ sessions }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>("Doctors");

  const filtered = useMemo(
    () => sessions.filter((s) => s.type === activeTab.toLowerCase().slice(0, -1) as "doctor" | "coach"),
    [sessions, activeTab]
  );

  return (
    <>
      {/* Tab Switcher */}
      <div className="flex bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm mb-6">
        {(["Doctors", "Coaches"] as Tab[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 flex items-center justify-center gap-2 py-4 text-sm font-medium transition-colors ${
              activeTab === tab
                ? "bg-white text-gray-900 shadow-sm"
                : "bg-gray-50 text-gray-400 hover:text-gray-600"
            }`}
          >
            {tab === "Doctors" ? (
              <Stethoscope className="w-4 h-4" />
            ) : (
              <Dumbbell className="w-4 h-4" />
            )}
            {tab}
          </button>
        ))}
      </div>

      {/* Cards Grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-20 text-gray-400 text-sm">
          No {activeTab.toLowerCase()} consultations found.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((session) => (
            <SessionCard key={session.id} session={session} />
          ))}
        </div>
      )}
    </>
  );
}

function SessionCard({ session }: { session: ConsultationSession }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col gap-4">
      {/* Top: Avatar + Name + Status */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="relative w-14 h-14 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
            <Image
              src={session.avatarUrl}
              alt={session.name}
              fill
              className="object-cover"
            />
          </div>
          <div>
            <p className="font-semibold text-gray-900 text-sm">{session.name}</p>
            <p className="text-xs text-gray-400 mt-0.5">{session.specialty}</p>
          </div>
        </div>
        <span
          className={`text-xs font-semibold px-2.5 py-1 rounded-lg flex-shrink-0 ${STATUS_STYLES[session.status]}`}
        >
          {session.status}
        </span>
      </div>

      {/* Divider */}
      <div className="border-t border-gray-50" />

      {/* Bottom: Date + Notes + Details */}
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="text-xs text-gray-500">
            {session.date} · {session.time}
          </p>
          <p className="text-xs text-gray-400 italic mt-1">{session.notes}</p>
        </div>
        <button className="flex items-center gap-1.5 text-xs text-gray-500 border border-gray-200 rounded-lg px-3 py-2 hover:bg-gray-50 transition-colors flex-shrink-0">
          <Eye className="w-3.5 h-3.5" />
          Details
        </button>
      </div>
    </div>
  );
}