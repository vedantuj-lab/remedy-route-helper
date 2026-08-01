# MediAlert

MediAlert is a lightweight health companion web app: it keeps you on top of your medication schedule, gives transparent rule-based symptom guidance, triggers an emergency SOS with your live location, and helps you find nearby health facilities.

## Problem statement

People forget doses, hesitate about whether a symptom needs a doctor, and lose critical minutes in an emergency trying to explain where they are. MediAlert brings those three moments into one fast, mobile-friendly app.

## Features

1. **Auth** — email/password plus Google sign-in, so each user's data is private to them.
2. **Medication reminders** — add/edit/delete medications with dosage and multiple dose times, grouped by time of day. A per-minute check fires a browser notification when a dose is due, and each dose can be logged as *taken* or *missed*.
3. **Symptom checker** — a checklist of common symptoms run through a hand-written rule table that returns colour-coded guidance: self-care (green), see a doctor (yellow), emergency (red). No AI diagnosis, and a permanent disclaimer banner.
4. **Emergency SOS** — one button requests your location, builds a Google Maps link, and opens a pre-filled WhatsApp message (with SMS and call fallbacks) to your saved emergency contact.
5. **Nearby facilities** — an embedded map of your position plus one-tap searches for hospitals, clinics, and pharmacies near you.

## Stack

- React 19 + TanStack Start (Vite) + Tailwind CSS v4 + shadcn/ui
- Lovable Cloud for database, auth, and row-level security
- Browser Geolocation API, Notification API, Google Maps search links, `wa.me` / `sms:` / `tel:` links — no paid API keys

## Data model

```
profiles(id -> auth user, display_name, emergency_contact)
medications(id, user_id, name, dosage, times[], created_at)
adherence_log(id, user_id, medication_id, scheduled_time, status, created_at)
```

Row-level security scopes every row to its owner.

## Setup

```bash
bun install
bun run dev
```

Backend credentials are injected automatically by Lovable Cloud.

## Screenshots

_Add screenshots here._

## Disclaimer

MediAlert is not a medical device and does not provide a medical diagnosis. All guidance is general information only. In an emergency, contact your local emergency services.
