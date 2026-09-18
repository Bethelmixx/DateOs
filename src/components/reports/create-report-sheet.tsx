import { useEffect, useRef, useState, type ReactNode } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Camera, MapPin, X } from "lucide-react";
import { toast } from "sonner";
import { Drawer } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAppStore } from "@/lib/app-store";
import {
  CATEGORIES,
  PROBLEM_TYPES,
  SEVERITIES,
  type CategoryId,
  type SeverityId,
} from "@/lib/categories";
import { DEFAULT_CENTER } from "@/lib/geo";
import { compressImage } from "@/lib/image";
import { createReport } from "@/lib/reports/server";
import { cn } from "@/lib/utils";

export function CreateReportSheet() {
  const open = useAppStore((s) => s.createOpen);
  const setCreateOpen = useAppStore((s) => s.setCreateOpen);
  const reportLocation = useAppStore((s) => s.reportLocation);
  const userLocation = useAppStore((s) => s.userLocation);
  const mapCenter = useAppStore((s) => s.mapCenter);
  const setReportLocation = useAppStore((s) => s.setReportLocation);
  const pinPickMode = useAppStore((s) => s.pinPickMode);
  const queryClient = useQueryClient();

  const [category, setCategory] = useState<CategoryId>("electricidad");
  const [problemType, setProblemType] = useState(PROBLEM_TYPES.electricidad[0].id);
  const [severity, setSeverity] = useState<SeverityId>("total");
  const [description, setDescription] = useState("");
  const [photo, setPhoto] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const loc = reportLocation ?? userLocation ?? mapCenter ?? DEFAULT_CENTER;

  useEffect(() => {
    if (open && !reportLocation) setReportLocation(loc);
  }, [open, loc, reportLocation, setReportLocation]);

  useEffect(() => {
    setProblemType(PROBLEM_TYPES[category][0].id);
  }, [category]);

  const mutation = useMutation({
    mutationFn: () =>
      createReport({
        data: {
          category,
          problemType,
          severity,
          description,
          lat: loc.lat,
          lng: loc.lng,
          photoData: photo,
        },
      }),
    onSuccess: async () => {
      toast.success("Reporte publicado");
      await queryClient.invalidateQueries({ queryKey: ["reports"] });
      reset();
      setCreateOpen(false);
    },
    onError: (err: Error) => {
      toast.error(err.message || "No se pudo publicar");
    },
  });

  function reset() {
    setCategory("electricidad");
    setProblemType(PROBLEM_TYPES.electricidad[0].id);
    setSeverity("total");
    setDescription("");
    setPhoto(null);
  }

  async function onFile(file: File | undefined) {
    if (!file) return;
    try {
      const data = await compressImage(file);
      setPhoto(data);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo usar esa foto");
    }
  }

  return (
    <Drawer
      open={open}
      onOpenChange={(v) => {
        if (!v) reset();
        setCreateOpen(v);
      }}
      title="Nuevo reporte"
    >
      <div className="space-y-4">
        <div>
          <h2 className="font-display text-xl font-semibold tracking-tight">Nuevo reporte</h2>
          <p className="mt-1 text-sm text-muted">
            {pinPickMode ? "Toca el mapa para ubicar el pin." : "Se publicará en tu ubicación."}
          </p>
        </div>

        <div className="flex items-center gap-2 rounded-xl border border-border bg-surface-2 px-3 py-2 text-xs text-muted">
          <MapPin className="size-4 text-primary" />
          <span className="tabular-nums">
            {loc.lat.toFixed(5)}, {loc.lng.toFixed(5)}
          </span>
        </div>

        <Field label="Categoría">
          <ChipRow>
            {CATEGORIES.map((c) => (
              <Chip key={c.id} active={category === c.id} onClick={() => setCategory(c.id)}>
                {c.short}
              </Chip>
            ))}
          </ChipRow>
        </Field>

        <Field label="Tipo de problema">
          <ChipRow>
            {PROBLEM_TYPES[category].map((p) => (
              <Chip key={p.id} active={problemType === p.id} onClick={() => setProblemType(p.id)}>
                {p.label}
              </Chip>
            ))}
          </ChipRow>
        </Field>

        <Field label="Nivel">
          <ChipRow>
            {SEVERITIES.map((s) => (
              <Chip key={s.id} active={severity === s.id} onClick={() => setSeverity(s.id)}>
                {s.label}
              </Chip>
            ))}
          </ChipRow>
        </Field>

        <Field label="Descripción breve">
          <Textarea
            value={description}
            maxLength={280}
            placeholder="¿Qué está pasando y desde cuándo?"
            onChange={(e) => setDescription(e.target.value)}
          />
          <p className="mt-1 text-right text-[11px] tabular-nums text-subtle">{description.length}/280</p>
        </Field>

        <Field label="Foto (opcional)">
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => void onFile(e.target.files?.[0])}
          />
          {photo ? (
            <div className="relative overflow-hidden rounded-xl">
              <img src={photo} alt="Vista previa" className="h-36 w-full object-cover" />
              <button
                type="button"
                onClick={() => setPhoto(null)}
                className="absolute right-2 top-2 grid size-8 place-items-center rounded-full bg-bg/80 text-fg"
                aria-label="Quitar foto"
              >
                <X className="size-4" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="flex h-11 w-full items-center justify-center gap-2 rounded-md border border-dashed border-border-strong text-sm text-muted"
            >
              <Camera className="size-4" />
              Agregar fotografía
            </button>
          )}
        </Field>

        <Button
          className="w-full"
          disabled={mutation.isPending}
          onClick={() => mutation.mutate()}
        >
          {mutation.isPending ? "Publicando…" : "Publicar reporte"}
        </Button>
      </div>
    </Drawer>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {children}
    </div>
  );
}

function ChipRow({ children }: { children: ReactNode }) {
  return <div className="flex flex-wrap gap-1.5">{children}</div>;
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "h-9 rounded-full border px-3 text-xs font-medium transition-colors duration-150",
        active
          ? "border-primary bg-primary text-primary-fg"
          : "border-border bg-surface-2 text-muted hover:text-fg",
      )}
    >
      {children}
    </button>
  );
}
