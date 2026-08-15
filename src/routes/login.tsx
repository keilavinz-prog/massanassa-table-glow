import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Loader2, UtensilsCrossed } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { getCurrentUserWithRole, type AppRole } from "@/lib/auth.functions";

export const Route = createFileRoute("/login")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Acceso al equipo — El Fogó de Massanassa" },
      {
        name: "description",
        content:
          "Área privada de El Fogó de Massanassa: acceso para gerencia, sala y proveedores.",
      },
      { property: "og:title", content: "Acceso al equipo — El Fogó de Massanassa" },
      {
        property: "og:description",
        content: "Inicia sesión para gestionar la carta, reservas y pedidos del restaurante.",
      },
    ],
  }),
  component: LoginPage,
});

const demoUsers: { label: string; email: string; password: string }[] = [
  { label: "Entrar como Admin", email: "admin@elfogodemassanassa.es", password: "Admin1234!" },
  {
    label: "Entrar como Empleado",
    email: "empleado@elfogodemassanassa.es",
    password: "Empleado1234!",
  },
  {
    label: "Entrar como Proveedor",
    email: "proveedor@elfogodemassanassa.es",
    password: "Proveedor1234!",
  },
];

const homeByRole: Record<AppRole, string> = {
  admin: "/admin",
  empleado: "/equipo",
  proveedor: "/proveedor",
};

function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function signIn(mail: string, pass: string) {
    setError(null);
    setLoading(true);
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: mail,
      password: pass,
    });
    if (signInError) {
      setLoading(false);
      setError("Email o contraseña incorrectos");
      return;
    }
    const user = await getCurrentUserWithRole();
    setLoading(false);
    if (!user) {
      setError("Email o contraseña incorrectos");
      return;
    }
    navigate({ to: homeByRole[user.role], replace: true });
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-6 py-16">
      <div className="w-full max-w-md space-y-6">
        <div className="flex flex-col items-center text-center">
          <span className="flex size-12 items-center justify-center rounded-full bg-primary text-primary-foreground">
            <UtensilsCrossed className="size-6" />
          </span>
          <h1 className="mt-4 font-display text-h2">El Fogó de Massanassa</h1>
          <p className="text-small text-muted-foreground">Acceso al área privada</p>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            void signIn(email, password);
          }}
          className="space-y-4 rounded-md bg-cream p-8 shadow-warm"
          noValidate={false}
        >
          <div className="space-y-2">
            <label htmlFor="email" className="text-small font-medium">
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              placeholder="tu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="transition-warm w-full rounded-sm border border-input bg-white px-3 py-2 outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="password" className="text-small font-medium">
              Contraseña
            </label>
            <input
              id="password"
              type="password"
              required
              minLength={6}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="transition-warm w-full rounded-sm border border-input bg-white px-3 py-2 outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          {error && (
            <p role="alert" className="text-small font-medium text-destructive">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="transition-warm inline-flex w-full items-center justify-center gap-2 rounded-md bg-primary px-6 py-3 font-medium text-primary-foreground shadow-warm hover:brightness-110 disabled:opacity-70"
          >
            {loading && <Loader2 className="size-4 animate-spin" />}
            {loading ? "Entrando…" : "Iniciar sesión"}
          </button>

          <button
            type="button"
            className="w-full text-small text-muted-foreground underline-offset-4 hover:underline"
          >
            ¿Olvidaste tu contraseña?
          </button>
        </form>

        <div className="rounded-md border border-dashed border-gold bg-accent/10 p-6">
          <p className="eyebrow text-olive">Acceso rápido de demostración</p>
          <p className="mt-2 text-small text-muted-foreground">
            Atajo solo para pruebas: rellena el formulario real con credenciales de
            ejemplo. La autenticación y el rol siguen validándose en el servidor.
          </p>
          <div className="mt-4 grid gap-2">
            {demoUsers.map((d) => (
              <button
                key={d.email}
                type="button"
                disabled={loading}
                onClick={() => {
                  setEmail(d.email);
                  setPassword(d.password);
                  setError(null);
                }}
                className="transition-warm rounded-sm border border-input bg-background px-4 py-2 text-small font-medium hover:bg-accent/20 disabled:opacity-60"
              >
                {d.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
