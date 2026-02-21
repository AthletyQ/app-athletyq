"use client";

import { TrendingUp, Calendar, Activity, ShieldAlert } from "lucide-react";
import { cn } from "@/lib/utils";

// Mock data for the coaches list
const coaches = [
    { name: "James Flex", role: "Coach", sport: "Athletics", avatar: "👨‍🏫" },
    { name: "James Flex", role: "Coach", sport: "Strength & Conditioning", avatar: "🏋️" },
    { name: "James Flex", role: "Nutritionist", sport: "Athletics", avatar: "🍎" },
    { name: "James Flex", role: "Doctor", sport: "Athletics", avatar: "🩺" },
];

export default function AthleteDashboardPage() {
    return (
        <div className="space-y-8">
            {/* Header Banner Placeholder */}
            <div className="h-48 bg-gray-200 rounded-2xl w-full flex items-center justify-center text-gray-400 font-medium">
                Profile Banner / Cover Image
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Coaches List */}
                <div className="space-y-4">
                    <h2 className="text-xl font-bold flex items-center gap-2">
                        <Calendar className="w-5 h-5 text-blue-600" />
                        Your Team
                    </h2>
                    <div className="space-y-3">
                        {coaches.map((coach, i) => (
                            <div key={i} className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4 hover:border-blue-200 transition-colors">
                                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center text-xl">
                                    {coach.avatar}
                                </div>
                                <div>
                                    <p className="font-semibold text-gray-900 leading-tight">Name: <span className="text-gray-600 font-normal">{coach.name}</span></p>
                                    <p className="text-sm text-gray-500">Role: <span className="font-medium">{coach.role}</span></p>
                                    <p className="text-sm text-gray-500 italic">Sport: {coach.sport}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Center Column: Performance Radar (Placeholder) */}
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col items-center justify-center space-y-4">
                    <h2 className="text-xl font-bold self-start">Performance Matrix</h2>
                    <div className="relative w-64 h-64 flex items-center justify-center bg-gray-50 rounded-full">
                        {/* Simple SVG Radar Placeholder */}
                        <svg viewBox="0 0 200 200" className="w-full h-full p-4">
                            <polygon points="100,20 180,80 150,180 50,180 20,80" fill="none" stroke="#e5e7eb" strokeWidth="1" />
                            <polygon points="100,50 140,80 125,130 75,130 60,80" fill="none" stroke="#e5e7eb" strokeWidth="1" />
                            <polygon points="100,40 160,90 140,160 80,150 40,100" fill="rgba(37, 99, 235, 0.2)" stroke="#2563eb" strokeWidth="2" />

                            <text x="100" y="15" textAnchor="middle" className="text-[10px] font-bold fill-gray-500">1RM Squat</text>
                            <text x="185" y="85" textAnchor="start" className="text-[10px] font-bold fill-gray-500">1RM Deadlift</text>
                            <text x="155" y="190" textAnchor="middle" className="text-[10px] font-bold fill-gray-500">1RM Bench</text>
                            <text x="45" y="190" textAnchor="middle" className="text-[10px] font-bold fill-gray-500">Speed</text>
                            <text x="15" y="85" textAnchor="end" className="text-[10px] font-bold fill-gray-500">Vertical Jump</text>
                        </svg>
                    </div>
                </div>

                {/* Right Column: Athlete Info */}
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-6">
                    <div>
                        <h2 className="text-2xl font-extrabold text-gray-900">Short Distance Runner</h2>
                        <p className="text-gray-500 flex items-center gap-1 mt-1">
                            Events: <span className="font-medium text-blue-600">100m, 200m</span>
                        </p>
                    </div>

                    <div className="flex justify-between items-end border-t border-gray-100 pt-6">
                        <div>
                            <p className="text-gray-400 text-sm uppercase font-bold tracking-wider">Age</p>
                            <p className="text-3xl font-black text-gray-900">18yrs</p>
                        </div>
                        <div className="h-16 w-px bg-gray-100"></div>
                        <div>
                            <p className="text-gray-400 text-sm uppercase font-bold tracking-wider">Gender</p>
                            <p className="text-3xl font-black text-gray-900">Male</p>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                            <div className="h-full bg-blue-600 w-3/4 rounded-full"></div>
                        </div>
                        <p className="text-xs text-gray-500 font-medium italic">General Fitness: 75% Target Achieved</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Bottom Left: Injury History */}
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                    <h2 className="text-xl font-bold flex items-center gap-2 mb-6 text-gray-900">
                        <ShieldAlert className="w-5 h-5 text-orange-500" />
                        Injury History
                    </h2>
                    <div className="flex items-center justify-center h-48 relative">
                        {/* Simple CSS Venn Diagram */}
                        <div className="relative w-40 h-40">
                            <div className="absolute top-0 left-10 w-24 h-24 bg-blue-400/60 rounded-full flex items-center justify-center border-2 border-blue-500">
                                <span className="text-[10px] font-bold text-white uppercase">Groin</span>
                            </div>
                            <div className="absolute bottom-0 left-0 w-24 h-24 bg-cyan-400/60 rounded-full flex items-center justify-center border-2 border-cyan-500">
                                <span className="text-[10px] font-bold text-white uppercase text-center">Left<br />Quads</span>
                            </div>
                            <div className="absolute bottom-0 right-0 w-24 h-24 bg-orange-400/60 rounded-full flex items-center justify-center border-2 border-orange-500">
                                <span className="text-[10px] font-bold text-white uppercase text-center">Left<br />Hamstring</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Bottom Center: Performance Tracker 1 */}
                <div className="lg:col-span-1 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-sm font-bold text-gray-400 uppercase tracking-tight">Performance Tracker</p>
                            <h3 className="text-3xl font-black text-gray-900">100m</h3>
                            <p className="text-xs text-green-600 font-bold flex items-center gap-1 mt-1">
                                <TrendingUp className="w-3 h-3" /> 0.9% vs last month
                            </p>
                        </div>
                        <button className="text-xs font-bold text-blue-600 hover:text-blue-700 bg-blue-50 px-3 py-1 rounded-full transition-colors">
                            View Report
                        </button>
                    </div>
                    <div className="h-32 flex items-end gap-1.5 pt-4">
                        {/* Simple Bar Chart Placeholder */}
                        {[40, 60, 45, 90, 65, 80, 55].map((h, i) => (
                            <div key={i} className="flex-1 bg-blue-100 rounded-t-sm relative group hover:bg-blue-600 transition-colors" style={{ height: `${h}%` }}>
                                <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] font-bold text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity">
                                    {h / 10}s
                                </div>
                            </div>
                        ))}
                    </div>
                    <p className="text-[10px] text-gray-400 text-center font-medium">Performance from Sep - Oct, 2025</p>
                </div>

                {/* Bottom Right: Performance Tracker 2 */}
                <div className="lg:col-span-1 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-sm font-bold text-gray-400 uppercase tracking-tight">Performance Tracker</p>
                            <h3 className="text-3xl font-black text-gray-900">200m</h3>
                            <p className="text-xs text-green-600 font-bold flex items-center gap-1 mt-1">
                                <TrendingUp className="w-3 h-3" /> 1.1% vs last month
                            </p>
                        </div>
                        <button className="text-xs font-bold text-blue-600 hover:text-blue-700 bg-blue-50 px-3 py-1 rounded-full transition-colors">
                            View Report
                        </button>
                    </div>
                    <div className="h-32 flex items-end gap-1.5 pt-4">
                        {/* Another Bar Chart Placeholder */}
                        {[50, 40, 70, 55, 85, 60, 75].map((h, i) => (
                            <div key={i} className="flex-1 bg-blue-100 rounded-t-sm relative group hover:bg-blue-600 transition-colors" style={{ height: `${h}%` }}>
                                <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] font-bold text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity">
                                    {h / 10}s
                                </div>
                            </div>
                        ))}
                    </div>
                    <p className="text-[10px] text-gray-400 text-center font-medium">Performance from Sep - Oct, 2025</p>
                </div>
            </div>
        </div>
    );
}