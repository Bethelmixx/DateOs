import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, Clock, MapPin, ShieldOff } from "lucide-react";
import { toast } from "sonner";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Drawer } from "@/components/ui/drawer";
import { Stars } from "@/components/chrome/stars";
import { useAppStore } from "@/lib/app-store";
import { categoryById, problemLabel, severityLabel } from "@/lib/categories";
import { formatStamp, timeAgo } from "@/lib/format";
import { getReport, voteOnReport } from "@/lib/reports/server";
import type { Report } from "@/lib/reports/types";
import { cn } from "@/lib/utils";

const STATUS_TONE = {
  unconfirmed: "red",
  pending: "yellow",
  confirmed: "green",
} as const;

const STATUS_LABEL = {
  unconfirmed: "Sin confirmar",
  pending: "En confirmación",
  confirmed: "Confirmado",
} as const;

export function ReportDetailSheet({ preview }: { preview: Report | undefined }) {
  const selectedId = useAppStore((s) => s.selectedReportId);
  const setSelectedReportId = useAppStore((s) => s.setSelectedReportId);
  const queryClient = useQueryClient();

  const detail = useQuery({
    queryKey: ["report", selectedId],
    queryFn: () => getReport({ data: selectedId! }),
    enabled: Boolean(selectedId),
  });

  const report = detail.data ?? preview;

  const vote = useMutation({
    mutationFn: (kind: "confirm" | "resolved") =>
      voteOnReport({ data: { reportId: selectedId!, vote: kind } }),
    onSuccess: async (updated) => {
      queryClient.setQueryData(["report", selectedId], updated);
      await queryClient.invalidateQueries({ queryKey: ["reports"] });
    },
    onError: (err: Error) => toast.error(err.message || "No se pudo registrar"),
  });

  return (
    <Drawer
      open={Boolean(selectedId)}
      onOpenChange={(open) => {
        if (!open) setSelectedReportId(null);
      }}
      title="Detalle del reporte"
    >
      {!report ? (
        <p className="py-8 text-center text-sm text-muted">Cargando reporte…</p>
      ) : (
        <article className="space-y-4">
          <header className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted">
                {categoryById(report.category)?.label}
              </p>
              <h2 className="mt-1 font-display text-xl font-semibold tracking-tight">
                {problemLabel(report.category, report.problemType)}
              </h2>
            </div>
            <Badge tone={STATUS_TONE[report.status]}>{STATUS_LABEL[report.status]}</Badge>
          </header>

          <p className="text-sm leading-relaxed text-fg">{report.description}</p>

          <div className="flex flex-wrap gap-2">
            <Badge>{severityLabel(report.severity)}</Badge>
            <span className="inline-flex items-center gap-1 text-xs text-muted">
              <Clock className="size-3.5" />
              {timeAgo(report.createdAt)}
            </span>
          </div>
          <p className="text-[11px] text-subtle">{formatStamp(report.createdAt)}</p>

          {report.hasPhoto && report.photoData ? (
            <img
              src={report.photoData}
              alt="Foto del reporte"
              className="max-h-56 w-full rounded-xl object-cover"
            />
          ) : null}

          <div className="flex items-center gap-3 rounded-xl border border-border bg-surface-2 px-3 py-2.5">
            <Avatar src={report.author.avatarUrl} name={report.author.displayName ?? report.author.username} />
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">@{report.author.username}</p>
              <Stars value={report.author.reputation} />
            </div>
          </div>

          <p className="flex items-center gap-1.5 text-xs text-muted">
            <MapPin className="size-3.5" />
            <span className="tabular-nums">
              {report.lat.toFixed(5)}, {report.lng.toFixed(5)}
            </span>
          </p>

          <div className="grid grid-cols-2 gap-2 rounded-xl border border-border bg-bg px-3 py-3 text-center">
            <Stat value={report.confirmationCount} label="Confirmaciones" />
            <Stat value={report.resolvedCount} label="Ya no ocurre" />
          </div>
          <p className="text-[11px] text-subtle">Pasa a verde con 10 confirmaciones independientes.</p>

          {report.isOwner ? (
            <p className="rounded-xl border border-border bg-surface-2 px-3 py-2 text-xs text-muted">
              Este reporte es tuyo. Otras personas podrán confirmarlo.
            </p>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant={report.myVote === "confirm" ? "default" : "secondary"}
                disabled={vote.isPending}
                onClick={() => vote.mutate("confirm")}
              >
                <Check className="size-4" />
                Sigue ocurriendo
              </Button>
              <Button
                variant={report.myVote === "resolved" ? "danger" : "secondary"}
                disabled={vote.isPending}
                onClick={() => vote.mutate("resolved")}
              >
                <ShieldOff className="size-4" />
                Ya no ocurre
              </Button>
            </div>
          )}
        </article>
      )}
    </Drawer>
  );
}

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <div>
      <p className={cn("font-display text-lg font-semibold tabular-nums")}>{value}</p>
      <p className="text-[11px] text-muted">{label}</p>
    </div>
  );
}
