import type { MonitoringWidgetConfig } from "@/types/monitoring";
import { formatKpiLabel } from "@/utils/monitoring-formatters";

type WidgetConfigTabProps = {
  selectedWidget: MonitoringWidgetConfig | null;
  profileName: string;
  onRenameProfile: (name: string) => void;
  onUpdateWidget: (
    widgetId: string,
    updates: Partial<MonitoringWidgetConfig>
  ) => void;
};

const METRIC_OPTIONS = [
  "radio_congestion",
  "avg_cssr_ps",
  "avg_ps_rab_sr",
  "avg_iub_congestion",
  "avg_call_drop_dch",
  "avg_throughput",
  "multi_kpi",
  "scope",
];

const DATE_RANGE_OPTIONS: Array<{
  label: string;
  value: NonNullable<MonitoringWidgetConfig["dateRangeOverride"]>;
}> = [
  { label: "24H", value: "24h" },
  { label: "7D", value: "7d" },
  { label: "30D", value: "30d" },
  { label: "Custom", value: "custom" },
];

const SIZE_OPTIONS: MonitoringWidgetConfig["size"][] = ["sm", "md", "lg", "xl"];

export default function WidgetConfigTab({
  selectedWidget,
  profileName,
  onRenameProfile,
  onUpdateWidget,
}: WidgetConfigTabProps) {
  return (
    <div className="space-y-4">
      <section className="rounded-xl border border-white/[0.06] bg-[#09121a] p-4">
        <h3 className="text-sm font-semibold text-white">Workspace Profile</h3>
        <p className="mt-1 text-xs text-white/45">
          Rename the current monitoring workspace profile.
        </p>

        <div className="mt-4">
          <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.1em] text-white/35">
            Profile Name
          </label>
          <input
            type="text"
            value={profileName}
            onChange={(e) => onRenameProfile(e.target.value)}
            className="h-11 w-full rounded-xl border border-white/10 bg-[#101925] px-3 text-sm text-white outline-none transition focus:border-[#ff7900]/45 focus:bg-[#121d2a]"
            placeholder="Monitoring profile name"
          />
        </div>
      </section>

      <section className="rounded-xl border border-white/[0.06] bg-[#09121a] p-4">
        <h3 className="text-sm font-semibold text-white">Widget Configuration</h3>
        <p className="mt-1 text-xs text-white/45">
          Update title, metric, size, and override behavior for the selected widget.
        </p>

        {!selectedWidget ? (
          <div className="mt-4 rounded-lg border border-white/[0.06] bg-white/[0.03] px-3 py-4 text-sm text-white/45">
            Select a widget from the Layout tab to configure it here.
          </div>
        ) : (
          <div className="mt-4 space-y-4">
            <div className="rounded-lg border border-white/[0.06] bg-white/[0.03] px-3 py-3">
              <div className="text-[11px] uppercase tracking-[0.1em] text-white/35">
                Selected Widget
              </div>
              <div className="mt-1 text-sm font-semibold text-white">
                {selectedWidget.title}
              </div>
              <div className="mt-1 text-xs text-white/45">
                {selectedWidget.kind}
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.1em] text-white/35">
                Title
              </label>
              <input
                type="text"
                value={selectedWidget.title}
                onChange={(e) =>
                  onUpdateWidget(selectedWidget.id, { title: e.target.value })
                }
                className="h-11 w-full rounded-xl border border-white/10 bg-[#101925] px-3 text-sm text-white outline-none transition focus:border-[#ff7900]/45 focus:bg-[#121d2a]"
                placeholder="Widget title"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.1em] text-white/35">
                Subtitle
              </label>
              <input
                type="text"
                value={selectedWidget.subtitle || ""}
                onChange={(e) =>
                  onUpdateWidget(selectedWidget.id, {
                    subtitle: e.target.value || undefined,
                  })
                }
                className="h-11 w-full rounded-xl border border-white/10 bg-[#101925] px-3 text-sm text-white outline-none transition focus:border-[#ff7900]/45 focus:bg-[#121d2a]"
                placeholder="Optional subtitle"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.1em] text-white/35">
                Metric
              </label>
              <select
                value={selectedWidget.metricKey}
                onChange={(e) =>
                  onUpdateWidget(selectedWidget.id, { metricKey: e.target.value })
                }
                className="h-11 w-full rounded-xl border border-white/10 bg-[#101925] px-3 text-sm text-white outline-none transition focus:border-[#ff7900]/45 focus:bg-[#121d2a]"
              >
                {METRIC_OPTIONS.map((metric) => (
                  <option key={metric} value={metric} className="bg-[#0f1722]">
                    {formatKpiLabel(metric)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.1em] text-white/35">
                Size
              </label>
              <select
                value={selectedWidget.size}
                onChange={(e) =>
                  onUpdateWidget(selectedWidget.id, {
                    size: e.target.value as MonitoringWidgetConfig["size"],
                  })
                }
                className="h-11 w-full rounded-xl border border-white/10 bg-[#101925] px-3 text-sm text-white outline-none transition focus:border-[#ff7900]/45 focus:bg-[#121d2a]"
              >
                {SIZE_OPTIONS.map((size) => (
                  <option key={size} value={size} className="bg-[#0f1722]">
                    {size.toUpperCase()}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.1em] text-white/35">
                Scope Mode
              </label>
              <select
                value={selectedWidget.scopeMode || "global"}
                onChange={(e) =>
                  onUpdateWidget(selectedWidget.id, {
                    scopeMode: e.target.value as "global" | "custom",
                  })
                }
                className="h-11 w-full rounded-xl border border-white/10 bg-[#101925] px-3 text-sm text-white outline-none transition focus:border-[#ff7900]/45 focus:bg-[#121d2a]"
              >
                <option value="global" className="bg-[#0f1722]">
                  Global
                </option>
                <option value="custom" className="bg-[#0f1722]">
                  Custom
                </option>
              </select>
            </div>

            {selectedWidget.scopeMode === "custom" ? (
              <>
                <div>
                  <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.1em] text-white/35">
                    Technology Override
                  </label>
                  <input
                    type="text"
                    value={selectedWidget.technologyOverride || ""}
                    onChange={(e) =>
                      onUpdateWidget(selectedWidget.id, {
                        technologyOverride: e.target.value || undefined,
                      })
                    }
                    className="h-11 w-full rounded-xl border border-white/10 bg-[#101925] px-3 text-sm text-white outline-none transition focus:border-[#ff7900]/45 focus:bg-[#121d2a]"
                    placeholder="e.g. 3G"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.1em] text-white/35">
                    Region Override
                  </label>
                  <input
                    type="text"
                    value={selectedWidget.regionOverride || ""}
                    onChange={(e) =>
                      onUpdateWidget(selectedWidget.id, {
                        regionOverride: e.target.value || undefined,
                      })
                    }
                    className="h-11 w-full rounded-xl border border-white/10 bg-[#101925] px-3 text-sm text-white outline-none transition focus:border-[#ff7900]/45 focus:bg-[#121d2a]"
                    placeholder="Region code"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.1em] text-white/35">
                    RNC Override
                  </label>
                  <input
                    type="text"
                    value={selectedWidget.rncOverride || ""}
                    onChange={(e) =>
                      onUpdateWidget(selectedWidget.id, {
                        rncOverride: e.target.value || undefined,
                      })
                    }
                    className="h-11 w-full rounded-xl border border-white/10 bg-[#101925] px-3 text-sm text-white outline-none transition focus:border-[#ff7900]/45 focus:bg-[#121d2a]"
                    placeholder="RNC name"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.1em] text-white/35">
                    Date Range Override
                  </label>
                  <select
                    value={selectedWidget.dateRangeOverride || "24h"}
                    onChange={(e) =>
                      onUpdateWidget(selectedWidget.id, {
                        dateRangeOverride:
                          e.target.value as MonitoringWidgetConfig["dateRangeOverride"],
                      })
                    }
                    className="h-11 w-full rounded-xl border border-white/10 bg-[#101925] px-3 text-sm text-white outline-none transition focus:border-[#ff7900]/45 focus:bg-[#121d2a]"
                  >
                    {DATE_RANGE_OPTIONS.map((option) => (
                      <option
                        key={option.value}
                        value={option.value}
                        className="bg-[#0f1722]"
                      >
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </>
            ) : null}
          </div>
        )}
      </section>
    </div>
  );
}