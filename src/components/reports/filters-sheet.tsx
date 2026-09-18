import { Drawer } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { useAppStore } from "@/lib/app-store";
import { CATEGORIES, STATUSES } from "@/lib/categories";
import { cn } from "@/lib/utils";

export function FiltersSheet() {
  const open = useAppStore((s) => s.filtersOpen);
  const setFiltersOpen = useAppStore((s) => s.setFiltersOpen);
  const categories = useAppStore((s) => s.categories);
  const statuses = useAppStore((s) => s.statuses);
  const toggleCategory = useAppStore((s) => s.toggleCategory);
  const toggleStatus = useAppStore((s) => s.toggleStatus);
  const clearFilters = useAppStore((s) => s.clearFilters);

  return (
    <Drawer open={open} onOpenChange={setFiltersOpen} title="Filtros">
      <div className="space-y-5">
        <div>
          <h2 className="font-display text-xl font-semibold tracking-tight">Filtros</h2>
          <p className="mt-1 text-sm text-muted">Vacío significa ver todo.</p>
        </div>

        <section className="space-y-2">
          <h3 className="text-xs font-medium uppercase tracking-wide text-muted">Categoría</h3>
          <div className="flex flex-wrap gap-1.5">
            {CATEGORIES.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => toggleCategory(c.id)}
                className={cn(
                  "h-9 rounded-full border px-3 text-xs font-medium",
                  categories.includes(c.id)
                    ? "border-primary bg-primary text-primary-fg"
                    : "border-border bg-surface-2 text-muted",
                )}
              >
                {c.label}
              </button>
            ))}
          </div>
        </section>

        <section className="space-y-2">
          <h3 className="text-xs font-medium uppercase tracking-wide text-muted">Verificación</h3>
          <div className="flex flex-wrap gap-1.5">
            {STATUSES.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => toggleStatus(s.id)}
                className={cn(
                  "h-9 rounded-full border px-3 text-xs font-medium",
                  statuses.includes(s.id)
                    ? "border-primary bg-primary text-primary-fg"
                    : "border-border bg-surface-2 text-muted",
                )}
              >
                {s.label}
              </button>
            ))}
          </div>
        </section>

        <div className="flex gap-2">
          <Button variant="secondary" className="flex-1" onClick={clearFilters}>
            Limpiar
          </Button>
          <Button className="flex-1" onClick={() => setFiltersOpen(false)}>
            Ver mapa
          </Button>
        </div>
      </div>
    </Drawer>
  );
}
