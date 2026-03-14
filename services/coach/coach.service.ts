import { supabase } from "@/lib/supabase/client";
import { Availability, Session, ServiceResponse } from "@/types/database.types";

export const coachService = {
  /**
   * Fetches availability for a specific coach and date
   */
  async getAvailability(
    coachId: string,
    date: Date,
    sessionType: 'online' | 'in_person' | null = 'online'
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

      let relevantAvailability = specificDateEntries.length > 0 ? specificDateEntries : dayOfWeekEntries;

      // 2. Fetch existing sessions
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      const { data: sessionsData, error: sessionsError } = await supabase
        .from("sessions")
        .select("scheduled_at")
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
        // 8 AM to 8 PM for online (20:00), 8 AM to 4 PM for in-person (16:00)
        const endHour = sessionType === 'in_person' ? 16 : 20;

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

      // Add existing bookings from DB
      sessionsData?.forEach((session: any) => {
        const d = new Date(session.scheduled_at);
        bookedSlotsSet.add(`${d.getHours().toString().padStart(2, '0')}:00`);
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
    } catch (error: any) {
      console.error("Error fetching availability:", error);
      return { data: null, error: error.message };
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
    } catch (error: any) {
      console.error("Detailed booking error:", JSON.stringify(error, null, 2));
      return { data: null, error: error.message || "An error occurred during booking" };
    }
  },
};