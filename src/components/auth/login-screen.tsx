import { useState, type FormEvent } from "react";
import { signInWithPassword, signUpWithPassword } from "@/lib/auth/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Mode = "entrar" | "crear";

export function LoginScreen({ localMode = false }: { localMode?: boolean }) {
  const [mode, setMode] = useState<Mode>("entrar");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (mode === "crear" && password !== confirm) {
      setError("Las contraseñas no coinciden");
      return;
    }
    setPending(true);
    try {
      if (mode === "crear") await signUpWithPassword(username, password);
      else await signInWithPassword(username, password);
    } catch (err) {
      setPending(false);
      setError(err instanceof Error ? err.message : "No se pudo completar");
    }
  }

  return (
    <main className="relative min-h-dvh overflow-hidden bg-bg">
      <div className="street-grid pointer-events-none absolute inset-0 opacity-60" />
      <div className="relative z-10 flex min-h-dvh items-center justify-center px-6 py-10">
        <div className="w-full max-w-sm space-y-8">
          <div className="space-y-3">
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-primary">Venezuela</p>
            <h1 className="font-display text-4xl font-semibold tracking-tight">DateOs</h1>
            <p className="max-w-[20rem] text-sm leading-relaxed text-muted">
              Reporta cortes, agua, tráfico y lo que pasa en tu zona. La calle se verifica entre todos.
            </p>
            {localMode ? (
              <div className="rounded-xl border border-status-yellow/40 bg-surface p-3 text-left text-[12px] leading-relaxed text-muted">
                <p className="font-medium text-fg">Los reportes no se comparten</p>
                <p className="mt-1">
                  Vercel no está leyendo la base. En Settings → Environment Variables,{" "}
                  <code className="text-primary">DATABASE_URL</code> tiene que estar en{" "}
                  <strong className="text-fg">Production</strong>. Luego Deployments → ⋮ → Redeploy
                  (desmarca Use existing Build Cache).
                </p>
              </div>
            ) : null}
          </div>

          <div className="flex gap-3">
            <Pin color="bg-status-red" label="Sin confirmar" />
            <Pin color="bg-status-yellow" label="En proceso" />
            <Pin color="bg-status-green" label="Confirmado" />
          </div>

          <form className="space-y-3" onSubmit={(e) => void onSubmit(e)}>
            <div className="grid grid-cols-2 rounded-lg border border-border bg-surface p-1">
              <button
                type="button"
                className={`h-9 rounded-md text-sm ${mode === "entrar" ? "bg-surface-2 font-medium text-fg" : "text-muted"}`}
                onClick={() => {
                  setMode("entrar");
                  setError(null);
                }}
              >
                Entrar
              </button>
              <button
                type="button"
                className={`h-9 rounded-md text-sm ${mode === "crear" ? "bg-surface-2 font-medium text-fg" : "text-muted"}`}
                onClick={() => {
                  setMode("crear");
                  setError(null);
                }}
              >
                Crear cuenta
              </button>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="username">Usuario</Label>
              <Input
                id="username"
                name="username"
                autoComplete="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="ej. maria_ccs"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">Contraseña</Label>
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete={mode === "crear" ? "new-password" : "current-password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            {mode === "crear" ? (
              <div className="space-y-1.5">
                <Label htmlFor="confirm">Repite la contraseña</Label>
                <Input
                  id="confirm"
                  name="confirm"
                  type="password"
                  autoComplete="new-password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  required
                />
              </div>
            ) : null}

            <Button
              type="submit"
              variant="secondary"
              className="h-12 w-full bg-fg text-bg hover:opacity-90"
              disabled={pending}
            >
              {pending
                ? "Espera…"
                : mode === "crear"
                  ? "Crear cuenta"
                  : "Entrar"}
            </Button>
            {error ? <p className="text-center text-xs text-status-red">{error}</p> : null}
            <p className="text-center text-[11px] leading-relaxed text-subtle">
              Solo usuario y contraseña. No pedimos teléfono ni correo.
            </p>
          </form>
        </div>
      </div>
    </main>
  );
}

function Pin({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-2 text-[11px] text-muted">
      <span className={`size-2.5 rounded-full ${color}`} />
      {label}
    </div>
  );
}
