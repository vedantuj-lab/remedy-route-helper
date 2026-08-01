import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Bell, Check, Pill, Siren, Stethoscope, X } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { AppShell } from "@/components/AppShell";
import { RequireAuth } from "@/components/RequireAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  useMedications,
  useTodayLog,
  useInvalidate,
} from "@/lib/queries";
import {
  nowHHmm,
  requestNotificationPermission,
  timeOfDay,
  useMedicationReminders,
} from "@/lib/medications";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "MediAlert — Medication Reminders, Triage & Emergency SOS" },
      {
        name: "description",
        content:
          "MediAlert keeps you on top of your medication schedule, offers rule-based symptom guidance, and sends an emergency SOS with your live location.",
      },
      { property: "og:title", content: "MediAlert — Your health companion" },
      {
        property: "og:description",
        content:
          "Medication reminders, rule-based symptom triage, emergency SOS with live location, and nearby facilities.",
      },
    ],
  }),
  component: () => (
    <RequireAuth>
      <Dashboard />
    </RequireAuth>
  ),
});

function Dashboard() {
  const { userId, user } = useAuth();
  const { data: medications = [] } = useMedications(userId);
  const { data: log = [] } = useTodayLog(userId);
  const invalidate = useInvalidate();
  const [notifState, setNotifState] = useState<string>(
    typeof Notification !== "undefined" ? Notification.permission : "unsupported",
  );

  const doneKey = useMemo(
    () => new Set(log.map((l) => `${l.medication_id}:${l.scheduled_time}:${l.status}`)),
    [log],
  );
  const isDone = (medId: string, time: string) =>
    doneKey.has(`${medId}:${time}:taken`) || doneKey.has(`${medId}:${time}:missed`);

  useMedicationReminders(medications, isDone);

  const doses = useMemo(() => {
    const rows = medications.flatMap((med) =>
      med.times.map((time) => ({ med, time })),
    );
    return rows.sort((a, b) => a.time.localeCompare(b.time));
  }, [medications]);

  const taken = log.filter((l) => l.status === "taken").length;
  const missed = log.filter((l) => l.status === "missed").length;
  const current = nowHHmm();

  const mark = async (medId: string, time: string, status: "taken" | "missed") => {
    const { error } = await supabase.from("adherence_log").insert({
      user_id: userId!,
      medication_id: medId,
      scheduled_time: time,
      status,
    });
    if (error) return toast.error(error.message);
    invalidate("adherence");
    toast.success(status === "taken" ? "Marked as taken" : "Marked as missed");
  };

  const enableNotifications = async () => {
    const result = await requestNotificationPermission();
    setNotifState(result);
    if (result === "granted") toast.success("Reminders enabled on this device");
    else if (result === "denied") toast.error("Notifications blocked in browser settings");
  };

  return (
    <AppShell
      title={`Hello${user?.email ? `, ${user.email.split("@")[0]}` : ""}`}
      subtitle="Here's your day at a glance."
    >
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Doses scheduled today" value={doses.length} />
        <StatCard label="Taken" value={taken} tone="success" />
        <StatCard label="Missed" value={missed} tone="destructive" />
      </div>

      {notifState !== "granted" && (
        <Card className="mt-4 border-primary/30 bg-secondary/60">
          <CardContent className="flex flex-wrap items-center justify-between gap-3 py-4">
            <div className="flex items-center gap-3">
              <Bell className="size-5 text-primary" />
              <p className="text-sm">
                Turn on browser notifications so MediAlert can alert you when a dose is due.
              </p>
            </div>
            <Button size="sm" onClick={enableNotifications}>
              Enable reminders
            </Button>
          </CardContent>
        </Card>
      )}

      <Card className="mt-4 shadow-card">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">Today's schedule</CardTitle>
          <Button asChild variant="outline" size="sm">
            <Link to="/medications">
              <Pill className="size-4" /> Manage
            </Link>
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {doses.length === 0 && (
            <div className="rounded-lg border border-dashed border-border p-6 text-center">
              <p className="text-sm text-muted-foreground">
                No medications yet — add one to start getting reminders.
              </p>
              <Button asChild className="mt-3" size="sm">
                <Link to="/medications">Add a medication</Link>
              </Button>
            </div>
          )}

          {doses.map(({ med, time }) => {
            const isTaken = doneKey.has(`${med.id}:${time}:taken`);
            const isMissed = doneKey.has(`${med.id}:${time}:missed`);
            const overdue = !isTaken && !isMissed && time < current;
            return (
              <div
                key={`${med.id}-${time}`}
                className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-card p-3"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{med.name}</span>
                    {med.dosage && (
                      <span className="text-sm text-muted-foreground">{med.dosage}</span>
                    )}
                  </div>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {time} · {timeOfDay(time)}
                    {overdue && " · overdue"}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {isTaken && <Badge className="bg-success text-success-foreground">Taken</Badge>}
                  {isMissed && <Badge variant="destructive">Missed</Badge>}
                  {!isTaken && !isMissed && (
                    <>
                      <Button size="sm" onClick={() => mark(med.id, time, "taken")}>
                        <Check className="size-4" /> Taken
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => mark(med.id, time, "missed")}
                      >
                        <X className="size-4" /> Missed
                      </Button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <QuickCard
          to="/symptoms"
          icon={<Stethoscope className="size-5 text-primary" />}
          title="Check symptoms"
          body="Answer a short checklist for rule-based guidance on what to do next."
        />
        <QuickCard
          to="/emergency"
          icon={<Siren className="size-5 text-destructive" />}
          title="Emergency SOS"
          body="Share your live location with your emergency contact and find nearby care."
        />
      </div>
    </AppShell>
  );
}

function StatCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone?: "success" | "destructive";
}) {
  const color =
    tone === "success" ? "text-success" : tone === "destructive" ? "text-destructive" : "text-primary";
  return (
    <Card className="shadow-card">
      <CardContent className="py-5">
        <p className={`font-display text-3xl font-semibold ${color}`}>{value}</p>
        <p className="mt-1 text-xs text-muted-foreground">{label}</p>
      </CardContent>
    </Card>
  );
}

function QuickCard({
  to,
  icon,
  title,
  body,
}: {
  to: string;
  icon: React.ReactNode;
  title: string;
  body: string;
}) {
  return (
    <Card className="shadow-card transition-shadow hover:shadow-lg">
      <CardContent className="py-5">
        <div className="flex items-center gap-2">
          {icon}
          <h2 className="font-display text-base font-semibold">{title}</h2>
        </div>
        <p className="mt-2 text-sm text-muted-foreground">{body}</p>
        <Button asChild variant="outline" size="sm" className="mt-3">
          <Link to={to}>Open</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
