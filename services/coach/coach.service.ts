import { supabase } from "@/lib/supabase/client";
import { Availability, Session, ServiceResponse } from "@/types/database.types";

export const coachService = {
  
  async getAvailability(
    coachId: string,
    date: Date
  ): Promise<ServiceResponse<{ availableSlots: string[]; bookedSlots: string[] }>> {
    try {
      const dayOfWeek = date.getDay(); 
      const dateString = date.toISOString().split("T")[0];

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


      const allPossibleSlots: string[] = [];

      if (relevantAvailability.length === 0) {
   
        let currentHour = 8;
        let currentMinute = 0;

        while (currentHour < 20 || (currentHour === 20 && currentMinute <= 30)) {
          allPossibleSlots.push(
            `${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}`
          );
          currentMinute += 30;
          if (currentMinute >= 60) {
            currentHour++;
            currentMinute = 0;
          }
        }
      } else {
        relevantAvailability.forEach((avail: Availability) => {
          let currentHour = parseInt(avail.start_time.split(":")[0]);
          let currentMinute = parseInt(avail.start_time.split(":")[1] || "0");
          const endHour = parseInt(avail.end_time.split(":")[0]);
          const endMinute = parseInt(avail.end_time.split(":")[1] || "0");


          while (currentHour < endHour || (currentHour === endHour && currentMinute < endMinute)) {
            if (currentHour > 20 || (currentHour === 20 && currentMinute > 30)) break;
            
            allPossibleSlots.push(
              `${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}`
            );
            
            currentMinute += 30;
            if (currentMinute >= 60) {
              currentHour++;
              currentMinute = 0;
            }
          }
        });
      }


      const bookedSlotsSet = new Set<string>();

      sessionsData?.forEach((session: { scheduled_at: string; duration_minutes: number }) => {
        const startTime = new Date(session.scheduled_at);
        const duration = session.duration_minutes || 30;
        
        let current = new Date(startTime);
        const endTime = new Date(startTime.getTime() + duration * 60000);

        while (current < endTime) {
          const slotStr = `${current.getHours().toString().padStart(2, '0')}:${current.getMinutes().toString().padStart(2, '0')}`;
          bookedSlotsSet.add(slotStr);
          current.setMinutes(current.getMinutes() + 30);
        }
      });


      const now = new Date();
      const isToday = date.toDateString() === now.toDateString();
      if (isToday) {
        allPossibleSlots.forEach(slot => { 
          const [h, m] = slot.split(':').map(Number);
          const slotTime = new Date(date);
          slotTime.setHours(h, m, 0, 0);
          
          if (slotTime < now) {
            bookedSlotsSet.add(slot); 
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


  async getCoachStats(coachId: string): Promise<ServiceResponse<{ totalSessions: number; averageRating: number }>> {
    try {
      const now = new Date().toISOString();
      

      const { count, error: sessionError } = await supabase
        .from("sessions")
        .select("*", { count: "exact", head: true })
        .eq("provider_id", coachId)
        .lte("scheduled_at", now)
        .not("status", "eq", "cancelled");

      if (sessionError) throw sessionError;

   
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