import { useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { LogOut } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { AppRole, CurrentUser } from "@/lib/auth.functions";

const roleStyles: Record<AppRole, string> = {
  admin: "bg-terracota text-white",
  empleado: "bg-olive text-white",
  proveedor: "bg-gold text-dark-brown",
};

const roleLabel: Record<AppRole, string> = {
  admin: "Admin",
  empleado: "Empleado",
  proveedor: "Proveedor",
};

export function ProtectedHeader({ user }: { user: CurrentUser }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);

  async function handleSignOut() {
    setLoading(true);
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/login", replace: true });
  }

  return (
    <header className="border-b border-border/70 bg-card/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-6 py-4">
        <div className="flex items-center gap-3">
          <span className="font-display text-h3 leading-none">
            {user.full_name ?? user.email}
          </span>
          <span
            className={`rounded-full px-3 py-1 text-small font-medium ${roleStyles[user.role]}`}
          >
            {roleLabel[user.role]}
          </span>
        </div>
        <button
          type="button"
          onClick={handleSignOut}
          disabled={loading}
          className="transition-warm inline-flex items-center gap-2 rounded-md border border-input bg-background px-4 py-2 text-small font-medium hover:bg-accent/20 disabled:opacity-60"
        >
          <LogOut className="size-4" /> Cerrar sesión
        </button>
      </div>
    </header>
  );
}

export function ProtectedShell({
  user,
  title,
  children,
}: {
  user: CurrentUser;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <ProtectedHeader user={user} />
      <main className="mx-auto max-w-6xl px-6 py-16">
        <h1 className="font-display text-h1">{title}</h1>
        <div className="mt-4 text-muted-foreground">{children}</div>
      </main>
    </div>
  );
}
