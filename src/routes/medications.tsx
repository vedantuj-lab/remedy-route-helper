import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Plus, Trash2, Pencil, Clock } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { AppShell } from "@/components/AppShell";
import { RequireAuth } from "@/components/RequireAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useInvalidate, useMedications } from "@/lib/queries";
import { timeOfDay, type Medication } from "@/lib/medications";

export const Route = createFileRoute("/medications")({
  head: () => ({
    meta: [
      { title: "Medication Reminders — MediAlert" },
      {
        name: "description",
        content:
          "Add your medications with dosage and dose times, then get browser reminders and log every dose as taken or missed.",
      },
      { property: "og:title", content: "Medication Reminders — MediAlert" },
      {
        property: "og:description",
        content: "Track medications, dose times, and adherence in one simple list.",
      },
    ],
  }),
  component: () => (
    <RequireAuth>
      <MedicationsPage />
    </RequireAuth>
  ),
});

const ORDER = ["Morning", "Afternoon", "Evening", "Night"] as const;

function MedicationsPage() {
  const { userId } = useAuth();
  const { data: medications = [], isLoading } = useMedications(userId);
  const invalidate = useInvalidate();

  const [editing, setEditing] = useState<Medication | null>(null);
  const [name, setName] = useState("");
  const [dosage, setDosage] = useState("");
  const [times, setTimes] = useState<string[]>(["08:00"]);
  const [busy, setBusy] = useState(false);

  const reset = () => {
    setEditing(null);
    setName("");
    setDosage("");
    setTimes(["08:00"]);
  };

  const startEdit = (med: Medication) => {
    setEditing(med);
    setName(med.name);
    setDosage(med.dosage);
    setTimes(med.times.length ? med.times : ["08:00"]);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanTimes = [...new Set(times.filter(Boolean))].sort();
    if (!name.trim() || cleanTimes.length === 0) {
      toast.error("Add a name and at least one time.");
      return;
    }
    setBusy(true);
    const payload = { name: name.trim(), dosage: dosage.trim(), times: cleanTimes };
    const { error } = editing
      ? await supabase.from("medications").update(payload).eq("id", editing.id)
      : await supabase.from("medications").insert({ ...payload, user_id: userId! });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(editing ? "Medication updated" : "Medication added");
    reset();
    invalidate("medications");
  };

  const remove = async (id: string) => {
    const { error } = await supabase.from("medications").delete().eq("id", id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Medication removed");
    invalidate("medications");
  };

  const grouped = ORDER.map((slot) => ({
    slot,
    items: medications
      .flatMap((med) => med.times.map((time) => ({ med, time })))
      .filter(({ time }) => timeOfDay(time) === slot)
      .sort((a, b) => a.time.localeCompare(b.time)),
  })).filter((g) => g.items.length > 0);

  return (
    <AppShell title="Medications" subtitle="Your schedule, grouped by time of day.">
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="text-lg">
            {editing ? `Edit ${editing.name}` : "Add a medication"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={save}>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="med-name">Name</Label>
                <Input
                  id="med-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Metformin"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="med-dosage">Dosage</Label>
                <Input
                  id="med-dosage"
                  value={dosage}
                  onChange={(e) => setDosage(e.target.value)}
                  placeholder="500 mg, 1 tablet"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Dose times</Label>
              <div className="flex flex-wrap items-center gap-2">
                {times.map((time, i) => (
                  <div key={i} className="flex items-center gap-1">
                    <Input
                      type="time"
                      value={time}
                      className="w-32"
                      onChange={(e) =>
                        setTimes(times.map((t, j) => (i === j ? e.target.value : t)))
                      }
                    />
                    {times.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => setTimes(times.filter((_, j) => j !== i))}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    )}
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setTimes([...times, "20:00"])}
                >
                  <Plus className="size-4" /> Add time
                </Button>
              </div>
            </div>

            <div className="flex gap-2">
              <Button type="submit" disabled={busy}>
                {editing ? "Save changes" : "Add medication"}
              </Button>
              {editing && (
                <Button type="button" variant="ghost" onClick={reset}>
                  Cancel
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      <div className="mt-6 space-y-6">
        {!isLoading && medications.length === 0 && (
          <div className="rounded-xl border border-dashed border-border p-8 text-center">
            <p className="text-sm text-muted-foreground">
              No medications yet — add one above to start getting reminders.
            </p>
          </div>
        )}

        {grouped.map(({ slot, items }) => (
          <section key={slot}>
            <h2 className="mb-2 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              <Clock className="size-4" /> {slot}
            </h2>
            <div className="space-y-2">
              {items.map(({ med, time }) => (
                <div
                  key={`${med.id}-${time}`}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-card p-3 shadow-card"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{med.name}</span>
                      <Badge variant="secondary">{time}</Badge>
                    </div>
                    {med.dosage && (
                      <p className="mt-0.5 text-xs text-muted-foreground">{med.dosage}</p>
                    )}
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => startEdit(med)}>
                      <Pencil className="size-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => remove(med.id)}>
                      <Trash2 className="size-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
    </AppShell>
  );
}
