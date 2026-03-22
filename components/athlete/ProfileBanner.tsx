"use client";

import { useAthleteProfile } from "@/hooks/athlete/useAthleteProfile";
import { Skeleton } from "@/components/ui/skeleton";
import { User, MapPin, Trophy } from "lucide-react";
import Image from "next/image";

export function ProfileBanner() {
    const { profile, loading, error } = useAthleteProfile();

    if (loading) {
        return (
            <div className="h-48 md:h-60 bg-white rounded-2xl w-full relative overflow-hidden shadow-sm border border-gray-100 flex items-center p-8">
                <Skeleton className="w-24 h-24 md:w-32 md:h-32 rounded-full mr-6" />
                <div className="space-y-4">
                    <Skeleton className="h-8 w-64" />
                    <Skeleton className="h-4 w-48" />
                    <Skeleton className="h-4 w-32" />
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="h-48 bg-red-50 rounded-2xl w-full flex items-center justify-center text-red-500 font-medium border border-red-100">
                Error loading profile: {error}
            </div>
        );
    }

    if (!profile) return null;

    return (
        <div className="relative h-48 md:h-60 bg-white rounded-2xl w-full shadow-sm border border-gray-100 p-6 md:p-8 flex items-center justify-between overflow-hidden group">
            
            <div className="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-l from-blue-50/50 to-transparent pointer-events-none" />
            <div className="absolute bottom-0 left-1/4 w-32 h-32 bg-blue-100/20 blur-3xl rounded-full" />

            <div className="flex items-center relative z-10 w-full">
               
                <div className="relative w-28 h-28 md:w-36 md:h-36 mr-6 md:mr-10 flex-shrink-0">
                    <div className="w-full h-full rounded-full border-4 border-white shadow-lg bg-gray-100 flex items-center justify-center overflow-hidden">
                        {profile.profile_image_url ? (
                            <Image
                                src={profile.profile_image_url}
                                alt={`${profile.first_name} ${profile.last_name}`}
                                fill
                                className="object-cover"
                            />
                        ) : (
                            <User className="w-1/2 h-1/2 text-gray-400" />
                        )}
                    </div>
                    
                    <div className="absolute bottom-2 right-2 w-5 h-5 bg-green-500 border-2 border-white rounded-full" />
                </div>

              
                <div className="flex-grow">
                    <h1 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight mb-2">
                        {profile.first_name} {profile.last_name}
                    </h1>

                    <div className="flex flex-wrap gap-4 md:gap-6">
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 rounded-lg">
                            <Trophy className="w-4 h-4 text-blue-600" />
                            <span className="text-sm font-bold text-blue-700 uppercase tracking-wide">
                                {profile.sport?.name || "Athlete"}
                            </span>
                        </div>

                        <div className="flex items-center gap-2 text-gray-500">
                            <MapPin className="w-4 h-4" />
                            <span className="text-sm font-medium">Sri Lanka</span>
                        </div>
                    </div>

                    <div className="mt-4 md:mt-6 flex gap-4">
                        <div className="flex flex-col">
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none mb-1">Role</span>
                            <span className="text-sm font-bold text-gray-700 capitalize">{profile.role.replace('_', ' ')}</span>
                        </div>
                        <div className="w-px h-8 bg-gray-100" />
                        <div className="flex flex-col">
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none mb-1">Email</span>
                            <span className="text-sm font-bold text-gray-700">{profile.email}</span>
                        </div>
                    </div>
                </div>
            </div>

           
            <div className="hidden lg:flex flex-col items-end justify-center h-full gap-2 relative z-10">
                <div className="px-4 py-2 bg-gray-900 rounded-xl text-white shadow-xl flex items-center gap-2 transform transition hover:scale-105 cursor-default">
                    <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
                    <span className="text-xs font-black tracking-tighter uppercase">Athlete ID: {profile.id.slice(0, 8)}</span>
                </div>
            </div>
        </div>
    );
}
