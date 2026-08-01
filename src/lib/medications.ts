import { useEffect, useRef } from "react";
import { toast } from "sonner";

export type Medication = {
  id: string;
  name: string;
  dosage: string;
  times: string[];
  created_at: string;
};

export function nowHHmm(d = new Date()) {
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

export function todayKey(d = new Date()) {
  return d.toISOString().slice(0, 10);
}

export function timeOfDay(time: string) {
  const hour = Number(time.slice(0, 2));
  if (hour < 12) return "Morning";
  if (hour < 17) return "Afternoon";
  if (hour < 21) return "Evening";
  return "Night";
}

/**
 * Checks every minute whether a dose is due and fires a browser notification
 * (plus an in-app toast) once per medication/time/day.
 */
export function useMedicationReminders(
  medications: Medication[],
  isDone: (medId: string, time: string) => boolean,
) {
  const fired = useRef<Set<string>>(new Set());
  const medsRef = useRef(medications);
  const doneRef = useRef(isDone);
  medsRef.current = medications;
  doneRef.current = isDone;

  useEffect(() => {
    const check = () => {
      const current = nowHHmm();
      const day = todayKey();
      for (const med of medsRef.current) {
        for (const time of med.times) {
          if (time !== current) continue;
          const key = `${day}:${med.id}:${time}`;
          if (fired.current.has(key)) continue;
          if (doneRef.current(med.id, time)) continue;
          fired.current.add(key);

          const body = `${med.name}${med.dosage ? ` — ${med.dosage}` : ""} is due at ${time}.`;
          toast("Medication due", { description: body, duration: 15000 });
          if (typeof Notification !== "undefined" && Notification.permission === "granted") {
            new Notification("MediAlert reminder", { body });
          }
        }
      }
    };

    check();
    const id = setInterval(check, 60_000);
    return () => clearInterval(id);
  }, []);
}

export async function requestNotificationPermission() {
  if (typeof Notification === "undefined") return "unsupported" as const;
  if (Notification.permission === "granted") return "granted" as const;
  return await Notification.requestPermission();
}
