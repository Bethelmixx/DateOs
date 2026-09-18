import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { Camera, ChevronLeft } from "lucide-react";
import { toast } from "sonner";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Stars } from "@/components/chrome/stars";
import { Skeleton } from "@/components/ui/skeleton";
import { authEnabled, signOut } from "@/lib/auth/client";
import { hasGateSessionMarker } from "@/lib/auth/gate-session-marker";
import { useCurrentUser } from "@/lib/auth/use-current-user";
import { compressImage } from "@/lib/image";
import { getMyProfile, updateMyProfile } from "@/lib/profiles/server";

const subscribeToNothing = () => () => {};
const noGateSessionOnServer = () => false;

export function ProfileView() {
  const navigate = useNavigate();
  const user = useCurrentUser();
  const queryClient = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [signingOut, setSigningOut] = useState(false);
  const gateSession = useSyncExternalStore(
    subscribeToNothing,
    hasGateSessionMarker,
    noGateSessionOnServer,
  );

  const profile = useQuery({
    queryKey: ["profile"],
    queryFn: () => getMyProfile(),
  });

  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [avatarDirty, setAvatarDirty] = useState(false);

  useEffect(() => {
    if (!profile.data) return;
    setUsername(profile.data.username);
    setDisplayName(profile.data.displayName ?? "");
    setAvatarUrl(profile.data.avatarUrl);
    setAvatarDirty(false);
  }, [profile.data]);

  const save = useMutation({
    mutationFn: () =>
      updateMyProfile({
        data: {
          username,
          displayName,
          avatarUrl: avatarDirty ? avatarUrl : undefined,
        },
      }),
    onSuccess: (data) => {
      queryClient.setQueryData(["profile"], data);
      toast.success("Perfil actualizado");
      setAvatarDirty(false);
    },
    onError: (err: Error) => toast.error(err.message || "No se pudo guardar"),
  });

  async function onFile(file: File | undefined) {
    if (!file) return;
    try {
      const data = await compressImage(file);
      setAvatarUrl(data);
      setAvatarDirty(true);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo usar esa foto");
    }
  }

  if (profile.isPending || !profile.data) {
    return (
      <main className="mx-auto min-h-dvh max-w-lg bg-bg px-4 py-6">
        <Skeleton className="h-8 w-24" />
        <Skeleton className="mx-auto mt-10 size-16 rounded-full" />
        <Skeleton className="mt-8 h-11 w-full" />
        <Skeleton className="mt-3 h-11 w-full" />
      </main>
    );
  }

  return (
    <main className="mx-auto min-h-dvh max-w-lg bg-bg px-4 pb-10 pt-[max(1.25rem,env(safe-area-inset-top))]">
      <header className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => navigate({ to: "/" })}
          className="grid size-11 place-items-center rounded-full hover:bg-surface-2"
          aria-label="Volver al mapa"
        >
          <ChevronLeft className="size-5" />
        </button>
        <h1 className="font-display text-lg font-semibold">Perfil</h1>
      </header>

      <div className="mt-6 flex flex-col items-center">
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="relative"
          aria-label="Cambiar foto"
        >
          <Avatar src={avatarUrl} name={displayName || username} size="lg" />
          <span className="absolute -bottom-1 -right-1 grid size-8 place-items-center rounded-full border border-border bg-surface-2">
            <Camera className="size-3.5" />
          </span>
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => void onFile(e.target.files?.[0])}
        />
        <div className="mt-4">
          <Stars value={profile.data.reputation} />
        </div>
        <p className="mt-1 text-xs text-subtle">Reputación inicial neutral. El peso por precisión llega después.</p>
        <p className="mt-3 text-sm text-muted">
          <span className="tabular-nums font-medium text-fg">{profile.data.reportCount}</span> reportes publicados
        </p>
      </div>

      <form
        className="mt-8 space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          save.mutate();
        }}
      >
        <div className="space-y-1.5">
          <Label htmlFor="username">Nombre de usuario</Label>
          <Input
            id="username"
            value={username}
            autoComplete="username"
            onChange={(e) => setUsername(e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="displayName">Nombre para mostrar</Label>
          <Input
            id="displayName"
            value={displayName}
            autoComplete="name"
            onChange={(e) => setDisplayName(e.target.value)}
          />
        </div>
        <Button type="submit" className="w-full" disabled={save.isPending}>
          {save.isPending ? "Guardando…" : "Guardar cambios"}
        </Button>
      </form>

      <p className="mt-8 text-center text-[11px] text-subtle">
        Tu correo no se muestra a otras personas.
        {user?.primaryEmail ? ` Solo tú lo ves.` : null}
      </p>

      {authEnabled && !gateSession ? (
        <Button
          type="button"
          variant="ghost"
          className="mt-6 w-full text-muted"
          disabled={signingOut}
          onClick={() => {
            setSigningOut(true);
            void signOut("/login").catch(() => setSigningOut(false));
          }}
        >
          {signingOut ? "Cerrando sesión…" : "Cerrar sesión"}
        </Button>
      ) : null}
    </main>
  );
}
