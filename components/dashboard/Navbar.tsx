"use client";

import { Bell, UserCircle, LogOut, Settings, User } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export function Navbar() {
  const [open, setOpen] = useState(false);
  const [profile, setProfile] = useState<{ firstName: string; lastName: string; role: string } | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) return;
      const { data: p } = await supabase
        .from("profiles")
        .select("first_name, last_name, role")
        .eq("id", data.user.id)
        .single();
      if (p) setProfile({ firstName: p.first_name, lastName: p.last_name, role: p.role });
    });
  }, []);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  const fullName = profile ? `${profile.firstName} ${profile.lastName}` : "Loading...";
  const role = profile?.role?.replace("_", " ") ?? "";

  return (
    <header className="h-20 bg-white border-b border-gray-100 flex items-center justify-end px-8 sticky top-0 z-10">
      <div className="flex items-center gap-6">
        <button className="text-gray-500 hover:text-blue-600 transition-colors p-2 rounded-full hover:bg-gray-50 relative">
          <Bell className="w-6 h-6" />
          <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white" />
        </button>

        <div className="flex items-center gap-3 pl-4 border-l border-gray-200">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-semibold text-gray-900 leading-none capitalize">{fullName}</p>
            <p className="text-xs text-gray-500 mt-1 capitalize">{role}</p>
          </div>

         
          <div className="relative" ref={ref}>
            <button
              onClick={() => setOpen(!open)}
              className="flex items-center justify-center p-1 rounded-full hover:ring-2 hover:ring-blue-100 transition-all"
            >
              <UserCircle className="w-9 h-9 text-gray-400 hover:text-blue-600 transition-colors" />
            </button>

            {open && (
              <div className="absolute right-0 top-12 w-82 bg-white border border-gray-100 rounded-2xl shadow-lg py-2 z-50">
           
                <div className="px-4 py-5 border-b border-gray-100 mb-1">
                  <p className="text-sm font-bold text-gray-900 capitalize">{fullName}</p>
                  <p className="text-xs text-gray-400 capitalize">{role}</p>
                </div>

                <button
                  onClick={() => {
                    setOpen(false);
                    const roleRouteMap: Record<string, string> = {
                      athlete: "/athlete/profile",
                      coach: "/coach/profile",
                      wellness_professional: "/consultant/profile",
                    };
                    router.push(roleRouteMap[profile?.role ?? ""] ?? "/athlete/profile");
                  }}
                  className="w-full flex items-center gap-3 px-4 py-5 text-sm text-gray-700 hover:bg-gray-50 font-medium"
                >
                  <User className="w-4 h-4 text-gray-400" />
                  View Profile
                </button>

                <button
                  onClick={() => { setOpen(false); router.push("/dashboard/settings"); }}
                  className="w-full flex items-center gap-3 px-4 py-5 text-sm text-gray-700 hover:bg-gray-50 font-medium"
                >
                  <Settings className="w-4 h-4 text-gray-400" />
                  Settings
                </button>

                <div className="border-t border-gray-100 mt-1 pt-1">
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-5 text-sm text-red-500 hover:bg-red-50 font-medium"
                  >
                    <LogOut className="w-4 h-4" />
                    Logout
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}