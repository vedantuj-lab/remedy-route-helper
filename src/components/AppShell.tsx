import { Link } from "@tanstack/react-router";
import { HeartPulse, Pill, Stethoscope, Siren, LogOut } from "lucide-react";
import type { ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

const NAV = [
  { to: "/", label: "Dashboard", icon: HeartPulse },
  { to: "/medications", label: "Medications", icon: Pill },
  { to: "/symptoms", label: "Symptoms", icon: Stethoscope },
  { to: "/emergency", label: "Emergency", icon: Siren },
] as const;

export function AppShell({
  title,
  subtitle,
  children,
  showSignOut = true,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  showSignOut?: boolean;
}) {
  return (
    <div className="min-h-screen bg-background pb-24 md:pb-0">
      <header className="bg-hero text-primary-foreground">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-4">
          <Link to="/" className="flex items-center gap-2">
            <HeartPulse className="size-6" />
            <span className="font-display text-lg font-semibold">MediAlert</span>
          </Link>
          <nav className="hidden items-center gap-1 md:flex">
            {NAV.map(({ to, label }) => (
              <Link
                key={to}
                to={to}
                className="rounded-md px-3 py-1.5 text-sm font-medium opacity-80 transition-opacity hover:opacity-100"
                activeProps={{ className: "bg-primary-foreground/15 opacity-100" }}
                activeOptions={{ exact: to === "/" }}
              >
                {label}
              </Link>
            ))}
            {showSignOut && (
              <Button
                variant="ghost"
                size="sm"
                className="ml-2 hover:bg-primary-foreground/15"
                onClick={() => supabase.auth.signOut()}
              >
                <LogOut className="size-4" />
                Sign out
              </Button>
            )}
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold md:text-3xl">{title}</h1>
          {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
        </div>
        {children}
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card/95 backdrop-blur md:hidden">
        <div className="mx-auto flex max-w-4xl">
          {NAV.map(({ to, label, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              className="flex flex-1 flex-col items-center gap-1 py-2.5 text-xs text-muted-foreground"
              activeProps={{ className: "text-primary font-medium" }}
              activeOptions={{ exact: to === "/" }}
            >
              <Icon className="size-5" />
              {label}
            </Link>
          ))}
        </div>
      </nav>
    </div>
  );
}
