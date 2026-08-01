export type Urgency = "self-care" | "see-doctor" | "emergency";

export type Symptom = {
  id: string;
  label: string;
  group: "general" | "chest" | "neuro" | "gut" | "resp";
};

export const SYMPTOMS: Symptom[] = [
  { id: "fever", label: "Fever", group: "general" },
  { id: "mild_fever", label: "Mild temperature (under 38°C)", group: "general" },
  { id: "fatigue", label: "Tiredness / fatigue", group: "general" },
  { id: "headache", label: "Headache", group: "neuro" },
  { id: "dizziness", label: "Dizziness", group: "neuro" },
  { id: "confusion", label: "Confusion or slurred speech", group: "neuro" },
  { id: "fainting", label: "Fainting / loss of consciousness", group: "neuro" },
  { id: "chest_pain", label: "Chest pain or pressure", group: "chest" },
  { id: "palpitations", label: "Racing heartbeat", group: "chest" },
  { id: "breathless", label: "Shortness of breath", group: "resp" },
  { id: "cough", label: "Cough", group: "resp" },
  { id: "sore_throat", label: "Sore throat", group: "resp" },
  { id: "runny_nose", label: "Runny nose / sneezing", group: "resp" },
  { id: "nausea", label: "Nausea or vomiting", group: "gut" },
  { id: "diarrhoea", label: "Diarrhoea", group: "gut" },
  { id: "abdominal_pain", label: "Severe abdominal pain", group: "gut" },
  { id: "rash", label: "Skin rash", group: "general" },
  { id: "bleeding", label: "Uncontrolled bleeding", group: "general" },
];

type Rule = {
  urgency: Urgency;
  /** every symptom in `all` must be selected */
  all?: string[];
  /** at least one symptom in `any` must be selected */
  any?: string[];
  title: string;
  advice: string;
};

// Transparent, hand-written rules — evaluated top to bottom, first match wins.
const RULES: Rule[] = [
  {
    urgency: "emergency",
    any: ["chest_pain", "fainting", "confusion", "bleeding"],
    title: "Seek emergency care now",
    advice:
      "Your selection includes a red-flag symptom. Call your local emergency number or use the SOS button to alert your emergency contact with your location.",
  },
  {
    urgency: "emergency",
    all: ["breathless", "palpitations"],
    title: "Seek emergency care now",
    advice:
      "Breathlessness together with a racing heartbeat needs urgent assessment. Use the SOS button or call emergency services.",
  },
  {
    urgency: "emergency",
    all: ["abdominal_pain", "nausea"],
    title: "Seek emergency care now",
    advice:
      "Severe abdominal pain with vomiting can indicate a condition needing urgent attention. Go to the nearest emergency department.",
  },
  {
    urgency: "see-doctor",
    all: ["fever", "breathless"],
    title: "See a doctor today",
    advice:
      "Fever with breathing difficulty should be reviewed by a clinician the same day. Find a nearby facility on the Emergency tab.",
  },
  {
    urgency: "see-doctor",
    all: ["fever", "rash"],
    title: "See a doctor today",
    advice: "Fever together with a rash should be examined by a clinician.",
  },
  {
    urgency: "see-doctor",
    any: ["abdominal_pain", "breathless", "palpitations"],
    title: "See a doctor",
    advice: "This symptom should be assessed by a clinician rather than managed at home.",
  },
  {
    urgency: "see-doctor",
    all: ["fever", "cough"],
    title: "See a doctor",
    advice:
      "A persistent fever with cough lasting more than 3 days is worth a clinical check-up.",
  },
  {
    urgency: "see-doctor",
    all: ["diarrhoea", "dizziness"],
    title: "See a doctor",
    advice: "Diarrhoea with dizziness suggests dehydration — get checked and rehydrate.",
  },
  {
    urgency: "self-care",
    any: ["runny_nose", "sore_throat", "cough", "mild_fever", "headache", "fatigue", "nausea", "diarrhoea", "rash", "dizziness"],
    title: "Self-care is likely enough",
    advice:
      "Rest, drink fluids, and monitor your symptoms. If anything worsens or lasts more than a few days, check again or contact a clinician.",
  },
];

export type TriageResult = {
  urgency: Urgency;
  title: string;
  advice: string;
  matched: string[];
};

export function triage(selected: string[]): TriageResult | null {
  if (selected.length === 0) return null;

  for (const rule of RULES) {
    const allOk = rule.all ? rule.all.every((s) => selected.includes(s)) : true;
    const anyOk = rule.any ? rule.any.some((s) => selected.includes(s)) : true;
    if (allOk && anyOk) {
      return {
        urgency: rule.urgency,
        title: rule.title,
        advice: rule.advice,
        matched: selected,
      };
    }
  }

  return {
    urgency: "self-care",
    title: "No specific rule matched",
    advice:
      "Nothing in your selection matches our red-flag rules. Monitor your symptoms and contact a clinician if you are worried.",
    matched: selected,
  };
}

export const URGENCY_META: Record<
  Urgency,
  { label: string; className: string; badge: string }
> = {
  "self-care": {
    label: "Self-care",
    className: "border-success/40 bg-success/10",
    badge: "bg-success text-success-foreground",
  },
  "see-doctor": {
    label: "See a doctor",
    className: "border-warning/50 bg-warning/10",
    badge: "bg-warning text-warning-foreground",
  },
  emergency: {
    label: "Emergency",
    className: "border-destructive/50 bg-destructive/10",
    badge: "bg-destructive text-destructive-foreground",
  },
};
