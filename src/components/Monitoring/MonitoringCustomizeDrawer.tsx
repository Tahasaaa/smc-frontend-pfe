import { useMemo, useState } from "react";
import type {
  MonitoringWidgetConfig,
  MonitoringWidgetKind,
  MonitoringWorkspaceConfig,
} from "@/types/monitoring";
import LayoutTab from "@/components/Monitoring/drawer/LayoutTab";
import WidgetConfigTab from "@/components/Monitoring/drawer/WidgetConfigTab";
import PresetsTab from "@/components/Monitoring/drawer/PresetsTab";

type PresetId =
  | "default"
  | "radio-health"
  | "congestion-focus"
  | "executive-view"
  | "investigation-view";

type MonitoringCustomizeDrawerProps = {
  isOpen: boolean;
  workspace: MonitoringWorkspaceConfig | null;
  selectedWidgetId: string | null;
  onClose: () => void;
  onSelectWidget: (id: string | null) => void;
  onLoadPreset: (presetId: PresetId) => void;
  onAddWidget: (kind: MonitoringWidgetKind) => void;
  onRemoveWidget: (widgetId: string) => void;
  onMoveWidgetUp: (widgetId: string) => void;
  onMoveWidgetDown: (widgetId: string) => void;
  onToggleWidget: (widgetId: string) => void;
  onResizeWidget: (
    widgetId: string,
    size: MonitoringWidgetConfig["size"]
  ) => void;
  onUpdateWidget: (
    widgetId: string,
    updates: Partial<MonitoringWidgetConfig>
  ) => void;
  onRenameProfile: (name: string) => void;
  onUpdateKpiStrip?: (kpiKeys: string[]) => void;
};

type DrawerTab = "layout" | "widget-config" | "presets";

export default function MonitoringCustomizeDrawer({
  isOpen,
  workspace,
  selectedWidgetId,
  onClose,
  onSelectWidget,
  onLoadPreset,
  onAddWidget,
  onRemoveWidget,
  onMoveWidgetUp,
  onMoveWidgetDown,
  onToggleWidget,
  onResizeWidget,
  onUpdateWidget,
  onRenameProfile,
}: MonitoringCustomizeDrawerProps) {
  const [activeTab, setActiveTab] = useState<DrawerTab>("layout");

  const selectedWidget = useMemo(() => {
    if (!workspace || !selectedWidgetId) return null;
    return workspace.widgets.find((widget) => widget.id === selectedWidgetId) ?? null;
  }, [workspace, selectedWidgetId]);

  if (!workspace) return null;

  return (
    <>
      <div
        className={[
          "fixed inset-0 z-40 bg-black/50 transition-opacity duration-200",
          isOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0",
        ].join(" ")}
        onClick={onClose}
      />

      <aside
        className={[
          "fixed right-0 top-0 z-50 flex h-screen w-full max-w-[440px] flex-col border-l border-white/[0.06] bg-[#0b1119] shadow-[-12px_0_32px_rgba(0,0,0,0.35)] transition-transform duration-300 ease-out",
          isOpen ? "translate-x-0" : "translate-x-full",
        ].join(" ")}
      >
        <header className="border-b border-white/[0.06] bg-[#0f1722]/80 px-4 py-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white/35">
                Workspace editor
              </p>
              <h2 className="mt-1 text-lg font-semibold text-white">
                Customize Workspace
              </h2>
              <p className="mt-1 text-xs text-white/45">
                Configure widgets, layout, and saved monitoring presets.
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-white/[0.08] bg-white/[0.04] px-3 py-2 text-xs font-medium text-white/70 transition hover:bg-white/[0.08] hover:text-white"
            >
              Close
            </button>
          </div>

          <div className="mt-4 flex items-center gap-2">
            <TabButton
              label="Layout"
              active={activeTab === "layout"}
              onClick={() => setActiveTab("layout")}
            />
            <TabButton
              label="Widget Config"
              active={activeTab === "widget-config"}
              onClick={() => setActiveTab("widget-config")}
            />
            <TabButton
              label="Presets"
              active={activeTab === "presets"}
              onClick={() => setActiveTab("presets")}
            />
          </div>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
          {activeTab === "layout" ? (
            <LayoutTab
              widgets={workspace.widgets}
              selectedWidgetId={selectedWidgetId}
              onSelectWidget={onSelectWidget}
              onAddWidget={onAddWidget}
              onRemoveWidget={onRemoveWidget}
              onMoveWidgetUp={onMoveWidgetUp}
              onMoveWidgetDown={onMoveWidgetDown}
              onToggleWidget={onToggleWidget}
              onResizeWidget={onResizeWidget}
            />
          ) : null}

          {activeTab === "widget-config" ? (
            <WidgetConfigTab
              selectedWidget={selectedWidget}
              profileName={workspace.profileName}
              onRenameProfile={onRenameProfile}
              onUpdateWidget={onUpdateWidget}
            />
          ) : null}

          {activeTab === "presets" ? (
            <PresetsTab
              currentProfileName={workspace.profileName}
              onLoadPreset={onLoadPreset}
            />
          ) : null}
        </div>
      </aside>
    </>
  );
}

function TabButton({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "rounded-lg border px-3 py-2 text-xs font-medium transition",
        active
          ? "border-[#ff7900]/20 bg-[#ff7900]/12 text-[#ffb26b]"
          : "border-white/[0.08] bg-white/[0.04] text-white/65 hover:bg-white/[0.08] hover:text-white",
      ].join(" ")}
    >
      {label}
    </button>
  );
}