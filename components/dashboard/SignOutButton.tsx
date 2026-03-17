"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut, X, Check } from "lucide-react";
import { supabase } from "@/lib/supabase/client";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

export function SignOutButton() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleSignOut = async () => {
    try {
      setIsLoading(true);
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      router.push("/login");
      router.refresh();
    } catch (error) {
      console.error("Error signing out:", error);
      setIsLoading(false);
      setShowConfirm(false);
    }
  };

  if (showConfirm) {
    return (
      <SidebarMenu>
        <SidebarMenuItem>
          <div className="flex flex-col gap-2 p-2 bg-white/5 rounded-lg border border-white/10 animate-in fade-in zoom-in duration-200">
            <p className="text-xs font-medium text-white/70 px-1">Are you sure?</p>
            <div className="flex gap-2">
              <button
                onClick={handleSignOut}
                disabled={isLoading}
                className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-md text-xs font-semibold transition-colors border border-red-500/20"
              >
                <Check className="w-3.5 h-3.5" />
                {isLoading ? "..." : "Yes"}
              </button>
              <button
                onClick={() => setShowConfirm(false)}
                disabled={isLoading}
                className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 bg-white/5 hover:bg-white/10 text-white/70 rounded-md text-xs font-semibold transition-colors border border-white/10"
              >
                <X className="w-3.5 h-3.5" />
                No
              </button>
            </div>
          </div>
        </SidebarMenuItem>
      </SidebarMenu>
    );
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarMenuButton
          onClick={() => setShowConfirm(true)}
          tooltip="Sign Out"
          className="text-white/90 hover:bg-white/10 hover:text-white transition-colors"
        >
          <LogOut className="w-5 h-5 shrink-0" />
          <span className="font-medium text-base">Sign Out</span>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
