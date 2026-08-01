import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { MapPin, Phone, MessageCircle, Siren, Hospital, Save } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { AppShell } from "@/components/AppShell";
import { RequireAuth } from "@/components/RequireAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useInvalidate, useProfile } from "@/lib/queries";

export const Route = createFileRoute("/emergency")({
  head: () => ({
    meta: [
      { title: "Emergency SOS & Nearby Hospitals — MediAlert" },
      {
        name: "description",
        content:
          "Send an SOS with your live location to your emergency contact via WhatsApp or SMS, and find hospitals and clinics near you.",
      },
      { property: "og:title", content: "Emergency SOS — MediAlert" },
      {
        property: "og:description",
        content: "One tap shares your live location with your emergency contact and finds nearby care.",
      },
    ],
  }),
  component: () => (
    <RequireAuth>
      <EmergencyPage />
    </RequireAuth>
  ),
});

type Coords = { lat: number; lng: number };

function EmergencyPage() {
  const { userId } = useAuth();
  const { data: profile } = useProfile(userId);
  const invalidate = useInvalidate();

  const [contact, setContact] = useState<string | null>(null);
  const [coords, setCoords] = useState<Coords | null>(null);
  const [locating, setLocating] = useState(false);

  const contactValue = contact ?? profile?.emergency_contact ?? "";
  const digits = contactValue.replace(/[^\d]/g, "");

  const saveContact = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase
      .from("profiles")
      .upsert({ id: userId!, emergency_contact: contactValue });
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Emergency contact saved");
    invalidate("profile");
  };

  const locate = () =>
    new Promise<Coords | null>((resolve) => {
      if (typeof navigator === "undefined" || !navigator.geolocation) {
        toast.error("Location is not available in this browser.");
        resolve(null);
        return;
      }
      setLocating(true);
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const next = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          setCoords(next);
          setLocating(false);
          resolve(next);
        },
        (err) => {
          setLocating(false);
          toast.error(
            err.code === err.PERMISSION_DENIED
              ? "Location permission denied — allow it to share your position."
              : "Couldn't get your location. Try again.",
          );
          resolve(null);
        },
        { enableHighAccuracy: true, timeout: 10000 },
      );
    });

  const triggerSOS = async () => {
    if (!digits) {
      toast.error("Add an emergency contact number first.");
      return;
    }
    const position = coords ?? (await locate());
    if (!position) return;

    const mapsLink = `https://www.google.com/maps?q=${position.lat},${position.lng}`;
    const message = `EMERGENCY - I need help. My live location: ${mapsLink}`;
    window.open(`https://wa.me/${digits}?text=${encodeURIComponent(message)}`, "_blank");
  };

  const smsFallback = () => {
    if (!digits) {
      toast.error("Add an emergency contact number first.");
      return;
    }
    const mapsLink = coords
      ? `https://www.google.com/maps?q=${coords.lat},${coords.lng}`
      : "(location unavailable)";
    window.location.href = `sms:${digits}?body=${encodeURIComponent(
      `EMERGENCY - I need help. My live location: ${mapsLink}`,
    )}`;
  };

  const mapsSearch = (query: string) =>
    coords
      ? `https://www.google.com/maps/search/${encodeURIComponent(query)}/@${coords.lat},${coords.lng},14z`
      : `https://www.google.com/maps/search/${encodeURIComponent(query)}`;

  return (
    <AppShell title="Emergency SOS" subtitle="Share your live location and find care fast.">
      <Card className="border-2 border-destructive/40 shadow-card">
        <CardContent className="flex flex-col items-center gap-4 py-8">
          <Button
            variant="destructive"
            className="animate-sos size-40 rounded-full text-lg font-semibold shadow-sos"
            onClick={triggerSOS}
          >
            <span className="flex flex-col items-center gap-1">
              <Siren className="size-8" />
              SOS
            </span>
          </Button>
          <p className="max-w-sm text-center text-sm text-muted-foreground">
            Sends a WhatsApp message with your live location link to your emergency contact.
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            <Button variant="outline" size="sm" onClick={() => locate()} disabled={locating}>
              <MapPin className="size-4" /> {locating ? "Locating…" : "Refresh location"}
            </Button>
            <Button variant="outline" size="sm" onClick={smsFallback}>
              <MessageCircle className="size-4" /> Send by SMS
            </Button>
            {digits && (
              <Button asChild variant="outline" size="sm">
                <a href={`tel:${digits}`}>
                  <Phone className="size-4" /> Call contact
                </a>
              </Button>
            )}
          </div>
          {coords && (
            <p className="text-xs text-muted-foreground">
              Location ready: {coords.lat.toFixed(4)}, {coords.lng.toFixed(4)}
            </p>
          )}
        </CardContent>
      </Card>

      <Card className="mt-5 shadow-card">
        <CardHeader>
          <CardTitle className="text-lg">Emergency contact</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="flex flex-wrap items-end gap-3" onSubmit={saveContact}>
            <div className="min-w-52 flex-1 space-y-1.5">
              <Label htmlFor="contact">Phone number (with country code)</Label>
              <Input
                id="contact"
                value={contactValue}
                onChange={(e) => setContact(e.target.value)}
                placeholder="+1 555 010 2030"
                inputMode="tel"
              />
            </div>
            <Button type="submit">
              <Save className="size-4" /> Save
            </Button>
          </form>
          {!profile?.emergency_contact && (
            <p className="mt-3 text-xs text-muted-foreground">
              No contact saved yet — add one so the SOS button knows who to alert.
            </p>
          )}
        </CardContent>
      </Card>

      <Card className="mt-5 shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Hospital className="size-5 text-primary" /> Nearby facilities
          </CardTitle>
        </CardHeader>
        <CardContent>
          {coords ? (
            <>
              <div className="overflow-hidden rounded-lg border border-border">
                <iframe
                  title="Map of your current location"
                  className="h-72 w-full"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  src={`https://www.openstreetmap.org/export/embed.html?bbox=${coords.lng - 0.02}%2C${coords.lat - 0.015}%2C${coords.lng + 0.02}%2C${coords.lat + 0.015}&layer=mapnik&marker=${coords.lat}%2C${coords.lng}`}
                />
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <Button asChild size="sm">
                  <a href={mapsSearch("hospitals near me")} target="_blank" rel="noreferrer">
                    Hospitals near me
                  </a>
                </Button>
                <Button asChild variant="outline" size="sm">
                  <a href={mapsSearch("clinics near me")} target="_blank" rel="noreferrer">
                    Clinics near me
                  </a>
                </Button>
                <Button asChild variant="outline" size="sm">
                  <a href={mapsSearch("pharmacies near me")} target="_blank" rel="noreferrer">
                    Pharmacies
                  </a>
                </Button>
              </div>
            </>
          ) : (
            <div className="rounded-lg border border-dashed border-border p-6 text-center">
              <p className="text-sm text-muted-foreground">
                Share your location to see a map and find hospitals, clinics, and pharmacies nearby.
              </p>
              <Button className="mt-3" size="sm" onClick={() => locate()} disabled={locating}>
                <MapPin className="size-4" /> {locating ? "Locating…" : "Use my location"}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </AppShell>
  );
}
