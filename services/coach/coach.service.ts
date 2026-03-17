import { supabase } from "@/lib/supabase/client";
import { Availability, Session, ServiceResponse } from "@/types/database.types";

export const coachService = {
  /**
   * Fetches availability for a specific coach and date
   */
  async getAvailability(
    coachId: string,
    date: Date
  ): Promise<ServiceResponse<{ availableSlots: string[]; bookedSlots: string[] }>> {
    try {
      const dayOfWeek = date.getDay(); // 0 is Sunday, 6 is Saturday
      const dateString = date.toISOString().split("T")[0];

      // 1. Fetch general availability for this day of week OR specific date
      const { data: availabilityData, error: availabilityError } = await supabase
        .from("availability")
        .select("*")
        .eq("provider_id", coachId)
        .eq("is_available", true)
        .or(`day_of_week.eq.${dayOfWeek},specific_date.eq.${dateString}`);

      if (availabilityError) throw availabilityError;

      const specificDateEntries = availabilityData?.filter(a => a.specific_date === dateString) || [];
      const dayOfWeekEntries = availabilityData?.filter(a => a.day_of_week === dayOfWeek && !a.specific_date) || [];

      const relevantAvailability = specificDateEntries.length > 0 ? specificDateEntries : dayOfWeekEntries;

      // 2. Fetch existing sessions
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      const { data: sessionsData, error: sessionsError } = await supabase
        .from("sessions")
        .select("scheduled_at, duration_minutes")
        .eq("provider_id", coachId)
        .gte("scheduled_at", startOfDay.toISOString())
        .lte("scheduled_at", endOfDay.toISOString())
        .not("status", "eq", "cancelled");

      if (sessionsError) throw sessionsError;

      // 3. Process availability into slots
      const allPossibleSlots: string[] = [];

      if (relevantAvailability.length === 0) {
        // --- DYNAMIC FALLBACK LOGIC ---
        let currentHour = 8;
        // 8 AM to 8 PM for online (20:00)
        const endHour = 20;

        while (currentHour < endHour) {
          allPossibleSlots.push(`${currentHour.toString().padStart(2, '0')}:00`);
          currentHour++;
        }
      } else {
        relevantAvailability.forEach((avail: Availability) => {
          let currentHour = parseInt(avail.start_time.split(":")[0]);
          const endHour = parseInt(avail.end_time.split(":")[0]);
          while (currentHour < endHour) {
            allPossibleSlots.push(`${currentHour.toString().padStart(2, '0')}:00`);
            currentHour++;
          }
        });
      }

      // 4. Identify booked and PAST slots
      const bookedSlotsSet = new Set<string>();
      // Add existing bookings from DB, accounting for duration
      sessionsData?.forEach((session: { scheduled_at: string; duration_minutes: number }) => {
        const startTime = new Date(session.scheduled_at);
        const duration = session.duration_minutes || 60;
        const startHour = startTime.getHours();
        const slotsCount = Math.ceil(duration / 60);

        for (let i = 0; i < slotsCount; i++) {
          const slotHour = startHour + i;
          if (slotHour < 24) {
            bookedSlotsSet.add(`${slotHour.toString().padStart(2, '0')}:00`);
          }
        }
      });

      // --- DEACTIVATE PAST SLOTS ---
      const now = new Date();
      const isToday = date.toDateString() === now.toDateString();
      if (isToday) {
        const currentHour = now.getHours();
        allPossibleSlots.forEach(slot => { 
          const slotHour = parseInt(slot.split(':')[0]);
          if (slotHour <= currentHour) {
            bookedSlotsSet.add(slot); // Treat past slots as "booked" (disabled)
          }
        });
      }

      const uniqueAvailable = Array.from(new Set(allPossibleSlots)).sort();

      return {
        data: {
          availableSlots: uniqueAvailable,
          bookedSlots: Array.from(bookedSlotsSet),
        },
        error: null,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : "An unknown error occurred";
      console.error("Error fetching availability:", error);
      return { data: null, error: message };
    }
  },

  /**
   * Books one or more sessions
   */
  async bookSessions(
    sessions: Partial<Session>[]
  ): Promise<ServiceResponse<Session[]>> {
    try {
      const { data, error } = await supabase
        .from("sessions")
        .insert(sessions)
        .select();

      if (error) {
        console.error("Supabase booking error:", error);
        throw error;
      }

      return { data, error: null };
    } catch (error) {
      const message = error instanceof Error ? error.message : "An unknown error occurred during booking";
      console.error("Detailed booking error:", JSON.stringify(error, null, 2));
      return { data: null, error: message };
    }
  },

  /**
   * Fetches real-time stats for a coach: 
   * - Count of sessions from start until current time
   * - Average rating (currently from coaches table as a fallback)
   */
  async getCoachStats(coachId: string): Promise<ServiceResponse<{ totalSessions: number; averageRating: number }>> {
    try {
      const now = new Date().toISOString();
      
      // 1. Fetch session count (from start to now), excluding cancelled sessions
      const { count, error: sessionError } = await supabase
        .from("sessions")
        .select("*", { count: "exact", head: true })
        .eq("provider_id", coachId)
        .lte("scheduled_at", now)
        .not("status", "eq", "cancelled");

      if (sessionError) throw sessionError;

      // 2. Fetch rating from coaches table
      const { data: coachData, error: coachError } = await supabase
        .from("coaches")
        .select("rating")
        .eq("user_id", coachId)
        .single();

      if (coachError) throw coachError;

      return {
        data: {
          totalSessions: count || 0,
          averageRating: coachData?.rating || 0,
        },
        error: null,
      };
    } catch (error) {
      console.error("Error fetching coach stats:", error);
      return { data: null, error: "Failed to fetch coach stats" };
    }
  },
};