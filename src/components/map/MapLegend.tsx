import { useState } from "react";
import { ChevronDown, ChevronUp, MousePointerClick, Palette } from "lucide-react";
import type { CartographyMetricMode } from "@/types/cartography";
import {
  getLegendItems,
  getMetricModeTitle,
} from "@/components/map/cartographyColorScale";

type MapLegendProps = {
  metricMode?: CartographyMetricMode;
};

export default function MapLegend({
  metricMode = "health",
}: MapLegendProps) {
  const [collapsed, setCollapsed] = useState(false);

  const items = getLegendItems(metricMode);
  const title = getMetricModeTitle(metricMode);

  return (
    <div className="w-[310px] max-w-[calc(100vw-2rem)] rounded-[1.15rem] border border-white/[0.08] bg-[linear-gradient(180deg,rgba(13,20,30,0.96),rgba(8,14,22,0.96))] shadow-[0_20px_50px_rgba(0,0,0,0.38)] backdrop-blur-xl">
      <div className="flex items-center justify-between border-b border-white/[0.06] px-4 py-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/36">
            Map Legend
          </p>
          <p className="mt-1 text-sm font-medium text-white/88">{title}</p>
        </div>

        <button
          type="button"
          onClick={() => setCollapsed((prev) => !prev)}
          className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/[0.08] bg-white/[0.03] text-white/70 transition hover:bg-white/[0.06] hover:text-white"
        >
          {collapsed ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </button>
      </div>

      {!collapsed ? (
        <div className="space-y-4 px-4 py-4">
          <div>
            <div className="mb-2 flex items-center gap-2">
              <Palette className="h-3.5 w-3.5 text-[#ff7900]" />
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-white/44">
                Color scale
              </p>
            </div>

            <div className="grid gap-2">
              {items.map((item) => (
                <LegendRow
                  key={item.label}
                  label={item.label}
                  description={item.description}
                  color={item.color}
                />
              ))}
            </div>
          </div>

          <div className="rounded-[1rem] border border-white/[0.06] bg-white/[0.03] px-3.5 py-3">
            <div className="flex items-center gap-2">
              <MousePointerClick className="h-3.5 w-3.5 text-[#ff7900]" />
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-white/44">
                Interaction
              </p>
            </div>

            <p className="mt-2 text-xs leading-5 text-white/58">
              Hover a marker for quick site context. Click a marker to open the
              inspection panel with KPIs, incidents, and site details.
            </p>
          </div>
        </div>
      ) : (
        <div className="px-4 py-3">
          <p className="text-xs leading-5 text-white/56">
            Same thresholds and colors as the visible map markers.
          </p>
        </div>
      )}
    </div>
  );
}

function LegendRow({
  label,
  description,
  color,
}: {
  label: string;
  description: string;
  color: string;
}) {
  return (
    <div className="rounded-[0.95rem] border border-white/[0.06] bg-[linear-gradient(180deg,rgba(255,255,255,0.035),rgba(255,255,255,0.02))] px-3 py-3">
      <div className="flex items-center gap-2">
        <span
          className="inline-flex h-3 w-3 rounded-full shadow-[0_0_12px_rgba(255,255,255,0.18)]"
          style={{ backgroundColor: color }}
        />
        <p className="text-sm font-semibold text-white/90">{label}</p>
      </div>
      <p className="mt-1 text-[11px] leading-4 text-white/42">{description}</p>
    </div>
  );
}