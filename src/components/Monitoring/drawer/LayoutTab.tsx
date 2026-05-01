import type {
  MonitoringWidgetConfig,
  MonitoringWidgetKind,
} from "@/types/monitoring";
import { formatKpiLabel } from "@/utils/monitoring-formatters";
import WidgetLibraryList from "@/components/Monitoring/drawer/WidgetLibraryList";

type LayoutTabProps = {
  widgets: MonitoringWidgetConfig[];
  selectedWidgetId: string | null;
  onSelectWidget: (id: string | null) => void;
  onAddWidget: (kind: MonitoringWidgetKind) => void;
  onRemoveWidget: (widgetId: string) => void;
  onMoveWidgetUp: (widgetId: string) => void;
  onMoveWidgetDown: (widgetId: string) => void;
  onToggleWidget: (widgetId: string) => void;
  onResizeWidget: (
    widgetId: string,
    size: MonitoringWidgetConfig["size"]
  ) => void;
};

const SIZE_OPTIONS: MonitoringWidgetConfig["size"][] = ["sm", "md", "lg", "xl"];

export default function LayoutTab({
  widgets,
  selectedWidgetId,
  onSelectWidget,
  onAddWidget,
  onRemoveWidget,
  onMoveWidgetUp,
  onMoveWidgetDown,
  onToggleWidget,
  onResizeWidget,
}: LayoutTabProps) {
  const orderedWidgets = [...widgets].sort((a, b) => a.order - b.order);

  return (
    <div className="space-y-4">
      <section className="rounded-xl border border-white/[0.06] bg-[#09121a] p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold text-white">Visible Widgets</h3>
            <p className="mt-1 text-xs text-white/45">
              Reorder, resize, hide, or select a widget for deeper configuration.
            </p>
          </div>
        </div>

        <div className="mt-4 space-y-3">
          {orderedWidgets.length === 0 ? (
            <div className="rounded-lg border border-white/[0.06] bg-white/[0.03] px-3 py-4 text-sm text-white/45">
              No widgets in the workspace yet.
            </div>
          ) : (
            orderedWidgets.map((widget, index) => {
              const isSelected = selectedWidgetId === widget.id;

              return (
                <div
                  key={widget.id}
                  className={[
                    "rounded-xl border p-3 transition",
                    isSelected
                      ? "border-[#ff7900]/20 bg-[#ff7900]/10"
                      : "border-white/[0.06] bg-white/[0.03]",
                  ].join(" ")}
                >
                  <div className="flex items-start justify-between gap-3">
                    <button
                      type="button"
                      onClick={() => onSelectWidget(widget.id)}
                      className="min-w-0 flex-1 text-left"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-semibold uppercase tracking-[0.1em] text-white/35">
                          #{widget.order}
                        </span>

                        <span className="rounded-md border border-white/[0.08] bg-white/[0.04] px-2 py-1 text-[10px] font-medium uppercase tracking-[0.08em] text-white/60">
                          {widget.kind}
                        </span>

                        {!widget.visible ? (
                          <span className="rounded-md border border-amber-500/20 bg-amber-500/10 px-2 py-1 text-[10px] font-medium uppercase tracking-[0.08em] text-amber-300">
                            Hidden
                          </span>
                        ) : null}
                      </div>

                      <div className="mt-2 truncate text-sm font-semibold text-white">
                        {widget.title}
                      </div>

                      <div className="mt-1 text-xs text-white/45">
                        {widget.subtitle || formatKpiLabel(widget.metricKey)}
                      </div>
                    </button>

                    <div className="flex shrink-0 items-center gap-2">
                      <button
                        type="button"
                        onClick={() => onMoveWidgetUp(widget.id)}
                        disabled={index === 0}
                        className="rounded-lg border border-white/[0.08] bg-white/[0.04] px-2.5 py-2 text-[11px] font-medium text-white/70 transition hover:bg-white/[0.08] hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        Up
                      </button>

                      <button
                        type="button"
                        onClick={() => onMoveWidgetDown(widget.id)}
                        disabled={index === orderedWidgets.length - 1}
                        className="rounded-lg border border-white/[0.08] bg-white/[0.04] px-2.5 py-2 text-[11px] font-medium text-white/70 transition hover:bg-white/[0.08] hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        Down
                      </button>
                    </div>
                  </div>

                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => onToggleWidget(widget.id)}
                      className={[
                        "rounded-lg border px-3 py-2 text-[11px] font-medium transition",
                        widget.visible
                          ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-300"
                          : "border-white/[0.08] bg-white/[0.04] text-white/60 hover:bg-white/[0.08] hover:text-white",
                      ].join(" ")}
                    >
                      {widget.visible ? "Visible" : "Hidden"}
                    </button>

                    <SizeSelect
                      value={widget.size}
                      onChange={(size) => onResizeWidget(widget.id, size)}
                    />

                    <button
                      type="button"
                      onClick={() => onRemoveWidget(widget.id)}
                      className="rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-[11px] font-medium text-red-300 transition hover:bg-red-500/16 hover:text-white"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </section>

      <section className="rounded-xl border border-white/[0.06] bg-[#09121a] p-4">
        <div>
          <h3 className="text-sm font-semibold text-white">Add Widget</h3>
          <p className="mt-1 text-xs text-white/45">
            Add a new monitoring module to the workspace.
          </p>
        </div>

        <div className="mt-4">
          <WidgetLibraryList onAddWidget={onAddWidget} />
        </div>
      </section>
    </div>
  );
}

function SizeSelect({
  value,
  onChange,
}: {
  value: MonitoringWidgetConfig["size"];
  onChange: (size: MonitoringWidgetConfig["size"]) => void;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as MonitoringWidgetConfig["size"])}
      className="h-9 rounded-lg border border-white/10 bg-[#101925] px-3 text-[11px] font-medium text-white outline-none transition focus:border-[#ff7900]/45 focus:bg-[#121d2a]"
    >
      {SIZE_OPTIONS.map((size) => (
        <option key={size} value={size} className="bg-[#0f1722]">
          Size: {size.toUpperCase()}
        </option>
      ))}
    </select>
  );
}