"use client";

import { useState, useEffect } from "react";
import { Bell, UserCircle } from "lucide-react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
);

export function Navbar() {
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      console.log('Auth user:', user);

      if (user) {
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('first_name, last_name, role')
          .eq('id', user.id)
          .single();

        console.log('Profile:', profile);
        console.log('Profile error:', error);

        setUser(profile);
      }
    };

    getUser(); // ← this was missing!
  }, []);

  return (
    <header className="h-20 bg-white border-b border-gray-100 flex items-center justify-end px-8 sticky top-0 z-10">
      <div className="flex items-center gap-6">
        <button className="text-gray-500 hover:text-blue-600 transition-colors p-2 rounded-full hover:bg-gray-50 relative">
          <Bell className="w-6 h-6" />
          <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
        </button>

        <div className="flex items-center gap-3 pl-4 border-l border-gray-200">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-semibold text-gray-900 leading-none">
              {user ? `${user.first_name} ${user.last_name}` : 'Loading...'}
            </p>
            <p className="text-xs text-gray-500 mt-1 capitalize">
              {user?.role || ''}
            </p>
          </div>
          <button className="flex items-center justify-center p-1 rounded-full hover:ring-2 hover:ring-blue-100 transition-all">
            <UserCircle className="w-9 h-9 text-gray-400 hover:text-blue-600 transition-colors" />
          </button>
        </div>
      </div>
    </header>
  );
}