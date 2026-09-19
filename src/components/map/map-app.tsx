import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AssistiveFab } from "@/components/chrome/assistive-fab";
import { StatusLegend } from "@/components/chrome/status-legend";
import { CreateReportSheet } from "@/components/reports/create-report-sheet";
import { FiltersSheet } from "@/components/reports/filters-sheet";
import { ReportDetailSheet } from "@/components/reports/report-detail-sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { useAppStore } from "@/lib/app-store";
import { DEFAULT_CENTER, padBounds, type BoundingBox, type LatLng } from "@/lib/geo";
import { listNearbyReports } from "@/lib/reports/server";

import { MapCanvas } from "./map-canvas";

export function MapApp() {
  const [mounted, setMounted] = useState(false);
  const [bounds, setBounds] = useState<BoundingBox | null>(null);
  const [focusToken, setFocusToken] = useState(0);
  const [focusTarget, setFocusTarget] = useState<LatLng | null>(null);

  const selectedId = useAppStore((s) => s.selectedReportId);
  const setSelectedReportId = useAppStore((s) => s.setSelectedReportId);
  const userLocation = useAppStore((s) => s.userLocation);
  const setUserLocation = useAppStore((s) => s.setUserLocation);
  const reportLocation = useAppStore((s) => s.reportLocation);
  const setReportLocation = useAppStore((s) => s.setReportLocation);
  const setMapCenter = useAppStore((s) => s.setMapCenter);
  const pinPickMode = useAppStore((s) => s.pinPickMode);
  const categories = useAppStore((s) => s.categories);
  const statuses = useAppStore((s) => s.statuses);
  const createOpen = useAppStore((s) => s.createOpen);
  const setCreateOpen = useAppStore((s) => s.setCreateOpen);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setUserLocation(loc);
        setMapCenter(loc);
        setReportLocation(loc);
        setFocusTarget(loc);
        setFocusToken((n) => n + 1);
      },
      () => {
        setFocusTarget(DEFAULT_CENTER);
      },
      { enableHighAccuracy: true, timeout: 9000, maximumAge: 60_000 },
    );
  }, [setMapCenter, setReportLocation, setUserLocation]);

  const padded = bounds ? padBounds(bounds) : null;
  const query = useQuery({
    queryKey: ["reports", padded, categories, statuses],
    queryFn: () =>
      listNearbyReports({
        data: {
          ...padded!,
          categories,
          statuses,
        },
      }),
    enabled: Boolean(padded),
    refetchInterval: 5_000,
  });

  const reports = query.data ?? [];

  const selected = reports.find((r) => r.id === selectedId);

  function locate() {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setUserLocation(loc);
        setMapCenter(loc);
        if (createOpen) setReportLocation(loc);
        setFocusTarget(loc);
        setFocusToken((n) => n + 1);
      },
      () => {
        setFocusTarget(userLocation ?? DEFAULT_CENTER);
        setFocusToken((n) => n + 1);
      },
      { enableHighAccuracy: true, timeout: 9000 },
    );
  }

  const empty = mounted && !query.isLoading && !query.isError && reports.length === 0;

  return (
    <div className="relative h-dvh w-full overflow-hidden bg-bg">
      {mounted ? (
        <MapCanvas
          reports={reports}
          selectedId={selectedId}
          userLocation={userLocation}
          dropPin={createOpen ? reportLocation : null}
          focusToken={focusToken}
          focusTarget={focusTarget}
          pinPickMode={pinPickMode}
          onSelect={setSelectedReportId}
          onBounds={setBounds}
          onPick={(loc) => {
            setReportLocation(loc);
            setMapCenter(loc);
          }}
        />
      ) : (
        <MapFallback />
      )}

      <header className="pointer-events-none absolute inset-x-0 top-0 z-20 flex items-start justify-between p-4 pt-[max(1rem,env(safe-area-inset-top))]">
        <div className="pointer-events-auto rounded-2xl border border-border bg-surface/90 px-3.5 py-2.5 shadow-[var(--shadow-panel)] backdrop-blur-sm">
          <p className="font-display text-sm font-semibold tracking-tight">DateOs</p>
          <p className="text-[11px] text-muted">El pulso de tu calle</p>
        </div>
        {(categories.length > 0 || statuses.length > 0) && (
          <button
            type="button"
            onClick={() => useAppStore.getState().setFiltersOpen(true)}
            className="pointer-events-auto rounded-full border border-border bg-surface/90 px-3 py-2 text-xs font-medium text-fg shadow-[var(--shadow-panel)]"
          >
            Filtros {categories.length + statuses.length}
          </button>
        )}
      </header>

      <div className="pointer-events-none absolute bottom-6 left-4 z-20">
        <StatusLegend />
      </div>

      {query.isError ? (
        <div className="pointer-events-none absolute inset-x-0 top-28 z-10 flex justify-center px-6">
          <div className="rounded-2xl border border-status-red/40 bg-surface/92 px-4 py-3 text-center shadow-[var(--shadow-panel)] backdrop-blur-sm">
            <p className="text-sm font-medium">No se pudieron cargar los reportes</p>
            <p className="mt-1 text-xs text-muted">Revisa la conexión e intenta de nuevo.</p>
          </div>
        </div>
      ) : null}

      {empty ? (
        <div className="pointer-events-none absolute inset-x-0 top-28 z-10 flex justify-center px-6">
          <div className="rounded-2xl border border-border bg-surface/92 px-4 py-3 text-center shadow-[var(--shadow-panel)] backdrop-blur-sm">
            <p className="text-sm font-medium">Aún no hay reportes en esta zona</p>
            <p className="mt-1 text-xs text-muted">Usa el botón + para publicar el primero.</p>
          </div>
        </div>
      ) : null}

      {createOpen ? (
        <button
          type="button"
          onClick={() => setCreateOpen(false)}
          className="absolute right-4 top-[max(5.5rem,calc(env(safe-area-inset-top)+4.5rem))] z-20 rounded-full border border-border bg-surface/90 px-3 py-2 text-xs font-medium"
        >
          Listo con el pin
        </button>
      ) : null}

      <AssistiveFab onLocate={locate} />
      <CreateReportSheet />
      <FiltersSheet />
      <ReportDetailSheet preview={selected} />
    </div>
  );
}

function MapFallback() {
  return (
    <div className="absolute inset-0 grid place-items-center bg-bg">
      <div className="space-y-3 text-center">
        <Skeleton className="mx-auto size-12 rounded-full" />
        <p className="text-sm text-muted">Cargando mapa…</p>
      </div>
    </div>
  );
}
