import { useState } from "react";
import { signIn } from "@/lib/auth/client";
import { Button } from "@/components/ui/button";

export function LoginScreen() {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onGoogle() {
    setError(null);
    setPending(true);
    try {
      await signIn("google", { callbackURL: "/" });
    } catch (err) {
      setPending(false);
      setError(err instanceof Error ? err.message : "No se pudo iniciar sesión");
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
        </div>

        <div className="flex gap-3">
          <Pin color="bg-status-red" label="Sin confirmar" />
          <Pin color="bg-status-yellow" label="En proceso" />
          <Pin color="bg-status-green" label="Confirmado" />
        </div>

        <div className="space-y-3">
          <Button
            type="button"
            variant="secondary"
            className="h-12 w-full bg-fg text-bg hover:opacity-90"
            disabled={pending}
            onClick={() => void onGoogle()}
          >
            <GoogleMark />
            {pending ? "Conectando…" : "Continuar con Google"}
          </Button>
          {error ? <p className="text-center text-xs text-status-red">{error}</p> : null}
          <p className="text-center text-[11px] leading-relaxed text-subtle">
            No pedimos número de teléfono. Tu correo no se muestra en los reportes.
          </p>
        </div>
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

function GoogleMark() {
  return (
    <svg viewBox="0 0 24 24" className="size-4" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M23.5 12.3c0-.85-.07-1.46-.23-2.1H12v3.8h6.6c-.13 1.08-.85 2.7-2.45 3.79l-.02.14 3.55 2.7.25.02c2.25-2.04 3.57-5.04 3.57-8.35z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.96-1.05 7.95-2.86l-3.78-2.86c-1.01.69-2.37 1.17-4.17 1.17-3.19 0-5.9-2.1-6.87-5.01l-.13.01-3.7 2.81-.05.12C3.22 21.53 7.31 24 12 24z"
      />
      <path
        fill="#FBBC05"
        d="M5.13 14.44A7.2 7.2 0 0 1 4.73 12c0-.85.16-1.67.39-2.44l-.01-.16-3.74-2.85-.12.06A11.96 11.96 0 0 0 0 12c0 1.94.47 3.77 1.25 5.39l3.88-2.95z"
      />
      <path
        fill="#EA4335"
        d="M12 4.75c2.25 0 3.77.96 4.64 1.76l3.39-3.25C17.95 1.19 15.24 0 12 0 7.31 0 3.22 2.47 1.25 6.61l3.86 2.95C6.1 6.65 8.81 4.75 12 4.75z"
      />
    </svg>
  );
}
