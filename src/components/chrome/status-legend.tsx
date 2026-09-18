export function StatusLegend() {
  return (
    <div className="pointer-events-none flex items-center gap-3 rounded-xl border border-border bg-surface/90 px-3 py-2 text-[11px] font-medium text-muted shadow-[var(--shadow-panel)] backdrop-blur-sm">
      <LegendDot className="bg-status-red" label="Sin confirmar" />
      <LegendDot className="bg-status-yellow" label="En proceso" />
      <LegendDot className="bg-status-green" label="Confirmado" />
    </div>
  );
}

function LegendDot({ className, label }: { className: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={`size-2.5 rounded-full ${className}`} />
      {label}
    </span>
  );
}
