import { LayoutTemplate, RotateCcw } from "lucide-react";

type CartographyHeaderProps = {
  loading?: boolean;
  onResetFilters?: () => void;
};

export default function CartographyHeader({
  loading = false,
  onResetFilters,
}: CartographyHeaderProps) {
  return (
    <section className="premium-panel rounded-[1.45rem]">
      <div className="premium-panel-body px-4 py-4 md:px-5 md:py-5">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="min-w-0 flex-1">
            <p className="section-eyebrow">Geo investigation workspace</p>

            <div className="mt-2 flex flex-wrap items-center gap-3">
              <h1 className="text-[1.32rem] font-semibold tracking-[-0.05em] text-white md:text-[1.5rem]">
                Tunisia 3G Site Cartography
              </h1>

              {loading ? (
                <span className="status-pill watch">Refreshing</span>
              ) : (
                <span className="status-pill good">Map Ready</span>
              )}
            </div>

            <p className="mt-2 max-w-3xl text-sm leading-6 text-white/52">
              Premium geo-operations surface for live site health inspection, KPI
              review, and incident-aware territorial investigation.
            </p>
          </div>

          <div className="w-full xl:w-auto xl:min-w-[520px]">
            <div className="rounded-[1rem] border border-white/[0.07] bg-[linear-gradient(180deg,rgba(255,255,255,0.028),rgba(255,255,255,0.015))] px-4 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
              <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
                <div className="flex items-center gap-3">
                  <span className="premium-toolbar-pill">
                    <LayoutTemplate className="h-3.5 w-3.5 text-[#ff7900]" />
                    Cartography mode
                  </span>

                  <span className="text-xs text-white/38">
                    Territorial investigation controls
                  </span>
                </div>

                <div className="flex flex-wrap gap-2">
                  {onResetFilters ? (
                    <button
                      type="button"
                      onClick={onResetFilters}
                      className="premium-button-ghost orange-ring-focus text-white/78 hover:text-white"
                    >
                      <RotateCcw className="h-4 w-4" />
                      Reset filters
                    </button>
                  ) : null}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}