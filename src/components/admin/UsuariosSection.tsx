import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { KeyRound, Plus, Trash2, UserCog } from "lucide-react";
import {
  createUser,
  deleteUser,
  listUsers,
  resetUserPassword,
  updateUser,
  type ManagedUser,
} from "@/lib/users.functions";
import { APP_ROLES, ROLE_DESCRIPTIONS, ROLE_LABELS } from "@/lib/users-schemas";

const inputClass =
  "w-full rounded-sm border border-input bg-background px-3 py-2 text-body outline-none focus:border-terracota";
const primaryBtn =
  "tap-target transition-warm inline-flex items-center gap-2 rounded-md bg-terracota px-5 py-2.5 text-body font-medium text-white hover:opacity-90 disabled:opacity-60";
const ghostBtn =
  "tap-target transition-warm inline-flex items-center gap-2 rounded-md border border-input bg-background px-3 py-1.5 text-small hover:bg-accent/20";

function formatDate(value: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export function UsuariosSection() {
  const queryClient = useQueryClient();
  const fetchUsers = useServerFn(listUsers);
  const createFn = useServerFn(createUser);
  const updateFn = useServerFn(updateUser);
  const resetFn = useServerFn(resetUserPassword);
  const deleteFn = useServerFn(deleteUser);

  const { data: users, isLoading } = useQuery({
    queryKey: ["admin-users"],
    queryFn: () => fetchUsers(),
  });

  const [creating, setCreating] = useState(false);
  const [newUser, setNewUser] = useState({
    email: "",
    password: "",
    full_name: "",
    role: "empleado" as (typeof APP_ROLES)[number],
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["admin-users"] });
  const fail = (err: unknown) =>
    toast.error(err instanceof Error ? err.message : "Operación no completada");

  const createMutation = useMutation({
    mutationFn: createFn,
    onSuccess: () => {
      toast.success("Usuario creado");
      setCreating(false);
      setNewUser({ email: "", password: "", full_name: "", role: "empleado" });
      void invalidate();
    },
    onError: fail,
  });

  const updateMutation = useMutation({
    mutationFn: updateFn,
    onSuccess: () => {
      toast.success("Usuario actualizado");
      void invalidate();
    },
    onError: fail,
  });

  const resetMutation = useMutation({
    mutationFn: resetFn,
    onSuccess: () => toast.success("Contraseña actualizada"),
    onError: fail,
  });

  const deleteMutation = useMutation({
    mutationFn: deleteFn,
    onSuccess: () => {
      toast.success("Usuario eliminado");
      void invalidate();
    },
    onError: fail,
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-display text-h2">Usuarios</h2>
          <p className="mt-1 text-small text-muted-foreground">
            Crea cuentas del equipo y decide a qué panel accede cada persona. El rol se
            verifica siempre en el servidor.
          </p>
        </div>
        <button type="button" className={primaryBtn} onClick={() => setCreating((v) => !v)}>
          <Plus className="size-4" /> Nuevo usuario
        </button>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        {APP_ROLES.map((role) => (
          <div key={role} className="rounded-md border border-border bg-card p-4 shadow-warm">
            <p className="font-display text-h3">{ROLE_LABELS[role]}</p>
            <p className="mt-1 text-small text-muted-foreground">{ROLE_DESCRIPTIONS[role]}</p>
          </div>
        ))}
      </div>

      {creating && (
        <form
          className="animate-rise-in grid gap-4 rounded-md bg-card p-5 shadow-warm sm:grid-cols-2"
          onSubmit={(e) => {
            e.preventDefault();
            createMutation.mutate({
              data: {
                email: newUser.email,
                password: newUser.password,
                full_name: newUser.full_name,
                role: newUser.role,
              },
            });
          }}
        >
          <h3 className="font-display text-h3 sm:col-span-2">Nuevo usuario</h3>
          <label className="block space-y-1">
            <span className="text-small font-medium">Email</span>
            <input
              className={inputClass}
              type="email"
              required
              value={newUser.email}
              onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
            />
          </label>
          <label className="block space-y-1">
            <span className="text-small font-medium">Contraseña (mín. 8 caracteres)</span>
            <input
              className={inputClass}
              type="text"
              required
              minLength={8}
              value={newUser.password}
              onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
            />
          </label>
          <label className="block space-y-1">
            <span className="text-small font-medium">Nombre</span>
            <input
              className={inputClass}
              value={newUser.full_name}
              onChange={(e) => setNewUser({ ...newUser, full_name: e.target.value })}
            />
          </label>
          <label className="block space-y-1">
            <span className="text-small font-medium">Rol</span>
            <select
              className={inputClass}
              value={newUser.role}
              onChange={(e) =>
                setNewUser({
                  ...newUser,
                  role: e.target.value as (typeof APP_ROLES)[number],
                })
              }
            >
              {APP_ROLES.map((role) => (
                <option key={role} value={role}>
                  {ROLE_LABELS[role]}
                </option>
              ))}
            </select>
          </label>
          <div className="flex gap-2 sm:col-span-2">
            <button type="submit" className={primaryBtn} disabled={createMutation.isPending}>
              Crear usuario
            </button>
            <button type="button" className={ghostBtn} onClick={() => setCreating(false)}>
              Cancelar
            </button>
          </div>
        </form>
      )}

      {isLoading ? (
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-md bg-muted/70 shadow-warm" />
          ))}
        </div>
      ) : !users || users.length === 0 ? (
        <p className="rounded-md border border-border bg-card p-6 text-center text-muted-foreground shadow-warm">
          No hay usuarios registrados.
        </p>
      ) : (
        <ul className="space-y-3">
          {users.map((user) => (
            <UserRow
              key={user.id}
              user={user}
              onSave={(full_name, role) =>
                updateMutation.mutate({ data: { id: user.id, full_name, role } })
              }
              onResetPassword={(password) =>
                resetMutation.mutate({ data: { id: user.id, password } })
              }
              onDelete={() => deleteMutation.mutate({ data: { id: user.id } })}
              busy={updateMutation.isPending || deleteMutation.isPending}
            />
          ))}
        </ul>
      )}
    </div>
  );
}

function UserRow({
  user,
  onSave,
  onResetPassword,
  onDelete,
  busy,
}: {
  user: ManagedUser;
  onSave: (fullName: string, role: (typeof APP_ROLES)[number]) => void;
  onResetPassword: (password: string) => void;
  onDelete: () => void;
  busy: boolean;
}) {
  const [fullName, setFullName] = useState(user.full_name ?? "");
  const [role, setRole] = useState(user.role as (typeof APP_ROLES)[number]);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const dirty = fullName !== (user.full_name ?? "") || role !== user.role;

  return (
    <li className="rounded-md border border-border bg-card p-5 shadow-warm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="font-medium">
            {user.email}
            {user.is_self && (
              <span className="ml-2 rounded-full bg-olive/15 px-2 py-0.5 text-small text-olive">
                tu cuenta
              </span>
            )}
          </p>
          <p className="text-small text-muted-foreground">
            Alta {formatDate(user.created_at)} · Último acceso{" "}
            {formatDate(user.last_sign_in_at)}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            className={ghostBtn}
            onClick={() => setShowPassword((v) => !v)}
          >
            <KeyRound className="size-4" /> Contraseña
          </button>
          {!user.is_self && (
            <button
              type="button"
              className={ghostBtn}
              disabled={busy}
              onClick={() => {
                if (confirm(`¿Eliminar la cuenta de ${user.email}?`)) onDelete();
              }}
            >
              <Trash2 className="size-4" /> Eliminar
            </button>
          )}
        </div>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_200px_auto] sm:items-end">
        <label className="block space-y-1">
          <span className="text-small font-medium">Nombre</span>
          <input
            className={inputClass}
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
          />
        </label>
        <label className="block space-y-1">
          <span className="text-small font-medium">Rol</span>
          <select
            className={inputClass}
            value={role}
            onChange={(e) => setRole(e.target.value as (typeof APP_ROLES)[number])}
          >
            {APP_ROLES.map((r) => (
              <option key={r} value={r}>
                {ROLE_LABELS[r]}
              </option>
            ))}
          </select>
        </label>
        <button
          type="button"
          className={primaryBtn}
          disabled={!dirty || busy}
          onClick={() => onSave(fullName, role)}
        >
          <UserCog className="size-4" /> Guardar
        </button>
      </div>

      {showPassword && (
        <div className="animate-rise-in mt-4 grid gap-3 border-t border-border/70 pt-4 sm:grid-cols-[1fr_auto] sm:items-end">
          <label className="block space-y-1">
            <span className="text-small font-medium">Nueva contraseña (mín. 8)</span>
            <input
              className={inputClass}
              type="text"
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </label>
          <button
            type="button"
            className={primaryBtn}
            disabled={password.length < 8}
            onClick={() => {
              onResetPassword(password);
              setPassword("");
              setShowPassword(false);
            }}
          >
            Cambiar contraseña
          </button>
        </div>
      )}
    </li>
  );
}
