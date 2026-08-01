import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { AlertTriangle, RotateCcw } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { RequireAuth } from "@/components/RequireAuth";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SYMPTOMS, triage, URGENCY_META, type TriageResult } from "@/lib/symptom-rules";

export const Route = createFileRoute("/symptoms")({
  head: () => ({
    meta: [
      { title: "Symptom Checker — Rule-Based Guidance | MediAlert" },
      {
        name: "description",
        content:
          "Tick your symptoms and get transparent, rule-based guidance: self-care, see a doctor, or emergency. Guidance only, not a medical diagnosis.",
      },
      { property: "og:title", content: "Symptom Checker — MediAlert" },
      {
        property: "og:description",
        content:
          "Transparent rule-based symptom triage: self-care, see a doctor, or emergency care.",
      },
    ],
  }),
  component: () => (
    <RequireAuth>
      <SymptomsPage />
    </RequireAuth>
  ),
});

function SymptomsPage() {
  const [selected, setSelected] = useState<string[]>([]);
  const [result, setResult] = useState<TriageResult | null>(null);

  const toggle = (id: string) =>
    setSelected((prev) => (prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]));

  return (
    <AppShell
      title="Symptom checker"
      subtitle="Tick what you're feeling — we apply a fixed set of rules, no AI guesswork."
    >
      <div className="mb-5 flex items-start gap-3 rounded-xl border border-warning/50 bg-warning/10 p-4">
        <AlertTriangle className="mt-0.5 size-5 shrink-0 text-warning" />
        <p className="text-sm">
          <strong>This is not a medical diagnosis.</strong> MediAlert gives general guidance only.
          If you feel you are in danger, contact emergency services immediately.
        </p>
      </div>

      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="text-lg">Select your symptoms</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2 sm:grid-cols-2">
            {SYMPTOMS.map((symptom) => (
              <label
                key={symptom.id}
                className="flex cursor-pointer items-center gap-3 rounded-lg border border-border p-3 transition-colors hover:bg-secondary/60"
              >
                <Checkbox
                  checked={selected.includes(symptom.id)}
                  onCheckedChange={() => toggle(symptom.id)}
                />
                <span className="text-sm">{symptom.label}</span>
              </label>
            ))}
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            <Button onClick={() => setResult(triage(selected))} disabled={selected.length === 0}>
              Get guidance
            </Button>
            <Button
              variant="ghost"
              onClick={() => {
                setSelected([]);
                setResult(null);
              }}
            >
              <RotateCcw className="size-4" /> Reset
            </Button>
          </div>
          {selected.length === 0 && (
            <p className="mt-3 text-xs text-muted-foreground">
              Nothing selected yet — tick at least one symptom above.
            </p>
          )}
        </CardContent>
      </Card>

      {result && (
        <Card className={`mt-5 border-2 shadow-card ${URGENCY_META[result.urgency].className}`}>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">{result.title}</CardTitle>
            <Badge className={URGENCY_META[result.urgency].badge}>
              {URGENCY_META[result.urgency].label}
            </Badge>
          </CardHeader>
          <CardContent>
            <p className="text-sm">{result.advice}</p>
            {result.urgency === "emergency" && (
              <Button asChild variant="destructive" className="mt-4">
                <Link to="/emergency">Open Emergency SOS</Link>
              </Button>
            )}
            <p className="mt-4 text-xs text-muted-foreground">
              Based on {result.matched.length} selected symptom
              {result.matched.length === 1 ? "" : "s"} · guidance only, not a diagnosis.
            </p>
          </CardContent>
        </Card>
      )}
    </AppShell>
  );
}
