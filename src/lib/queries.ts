import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { todayKey, type Medication } from "@/lib/medications";

export type AdherenceEntry = {
  id: string;
  medication_id: string | null;
  scheduled_time: string | null;
  status: string;
  created_at: string;
};

export function useMedications(userId: string | null) {
  return useQuery({
    queryKey: ["medications", userId],
    enabled: !!userId,
    queryFn: async (): Promise<Medication[]> => {
      const { data, error } = await supabase
        .from("medications")
        .select("id, name, dosage, times, created_at")
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useTodayLog(userId: string | null) {
  return useQuery({
    queryKey: ["adherence", userId, todayKey()],
    enabled: !!userId,
    queryFn: async (): Promise<AdherenceEntry[]> => {
      const { data, error } = await supabase
        .from("adherence_log")
        .select("id, medication_id, scheduled_time, status, created_at")
        .gte("created_at", `${todayKey()}T00:00:00.000Z`)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useProfile(userId: string | null) {
  return useQuery({
    queryKey: ["profile", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, display_name, emergency_contact")
        .eq("id", userId!)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}

export function useInvalidate() {
  const qc = useQueryClient();
  return (key: string) => qc.invalidateQueries({ queryKey: [key] });
}
