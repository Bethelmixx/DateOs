import { useEffect, useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Filter, LocateFixed, Plus, UserRound } from "lucide-react";
import { useAppStore } from "@/lib/app-store";
import { cn } from "@/lib/utils";

const SIZE = 58;
const MARGIN = 12;

export function AssistiveFab({ onLocate }: { onLocate: () => void }) {
  const navigate = useNavigate();
  const fabOpen = useAppStore((s) => s.fabOpen);
  const setFabOpen = useAppStore((s) => s.setFabOpen);
  const setCreateOpen = useAppStore((s) => s.setCreateOpen);
  const setFiltersOpen = useAppStore((s) => s.setFiltersOpen);
  const createOpen = useAppStore((s) => s.createOpen);

  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);
  const drag = useRef<{ dx: number; dy: number; moved: boolean; pointerId: number } | null>(null);

  useEffect(() => {
    const x = window.innerWidth - SIZE - 16;
    const y = window.innerHeight - SIZE - 28;
    setPos({ x, y: Math.max(MARGIN, y) });
  }, []);

  function clamp(x: number, y: number) {
    const maxX = Math.max(MARGIN, window.innerWidth - SIZE - MARGIN);
    const maxY = Math.max(MARGIN, window.innerHeight - SIZE - MARGIN);
    return { x: Math.min(maxX, Math.max(MARGIN, x)), y: Math.min(maxY, Math.max(MARGIN, y)) };
  }

  function onPointerDown(e: React.PointerEvent<HTMLButtonElement>) {
    const rect = (e.currentTarget.parentElement as HTMLElement).getBoundingClientRect();
    const current = pos ?? { x: rect.left, y: rect.top };
    if (!pos) setPos(current);
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    drag.current = {
      dx: e.clientX - current.x,
      dy: e.clientY - current.y,
      moved: false,
      pointerId: e.pointerId,
    };
  }

  function onPointerMove(e: React.PointerEvent<HTMLButtonElement>) {
    const d = drag.current;
    if (!d) return;
    const nx = e.clientX - d.dx;
    const ny = e.clientY - d.dy;
    const origin = pos ?? { x: nx, y: ny };
    if (Math.hypot(nx - origin.x, ny - origin.y) > 6) d.moved = true;
    if (d.moved) setPos(clamp(nx, ny));
  }

  function onPointerUp() {
    const d = drag.current;
    drag.current = null;
    if (!d?.moved) setFabOpen(!fabOpen);
  }

  if (createOpen) return null;

  const items = [
    { label: "Nuevo reporte", icon: Plus, action: () => setCreateOpen(true) },
    { label: "Filtros", icon: Filter, action: () => setFiltersOpen(true) },
    { label: "Mi ubicación", icon: LocateFixed, action: () => onLocate() },
    { label: "Mi perfil", icon: UserRound, action: () => navigate({ to: "/perfil" }) },
  ];

  return (
    <>
      {fabOpen ? (
        <button
          type="button"
          aria-label="Cerrar menú"
          className="fixed inset-0 z-30 bg-bg/20"
          onClick={() => setFabOpen(false)}
        />
      ) : null}

      <div
        className="fixed z-40"
        style={
          pos
            ? { left: pos.x, top: pos.y, width: SIZE, height: SIZE }
            : { right: 16, bottom: 28, width: SIZE, height: SIZE }
        }
      >
        <div
          className={cn(
            "absolute bottom-full right-0 mb-2 flex w-44 flex-col gap-1 rounded-2xl border border-border bg-surface/95 p-1.5 shadow-[var(--shadow-panel)] backdrop-blur-sm transition-[opacity,transform] duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] origin-bottom-right",
            fabOpen ? "pointer-events-auto scale-100 opacity-100" : "pointer-events-none scale-[0.97] opacity-0",
          )}
        >
          {items.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.label}
                type="button"
                onClick={() => {
                  setFabOpen(false);
                  item.action();
                }}
                className="flex h-11 items-center gap-2.5 rounded-xl px-2.5 text-left text-sm font-medium text-fg transition-colors duration-150 hover:bg-surface-2"
              >
                <span className="grid size-8 place-items-center rounded-full bg-surface-2 text-fg">
                  <Icon className="size-4" />
                </span>
                {item.label}
              </button>
            );
          })}
        </div>

        <button
          type="button"
          aria-label="Menú rápido"
          aria-expanded={fabOpen}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          className={cn(
            "grid size-[58px] place-items-center rounded-full border border-border-strong",
            "bg-surface/88 text-fg shadow-[var(--shadow-panel)] backdrop-blur-sm",
            "transition-transform duration-150 ease-out active:scale-[0.96]",
            fabOpen && "bg-primary text-primary-fg",
          )}
        >
          <Plus
            className={cn(
              "size-7 transition-transform duration-200 ease-out",
              fabOpen && "rotate-45",
            )}
          />
        </button>
      </div>
    </>
  );
}
