import { useCallback, useEffect, useMemo, useState, type Dispatch, type SetStateAction } from "react";
import type {
  MonitoringWidgetConfig,
  MonitoringWidgetKind,
  MonitoringWorkspaceConfig,
} from "@/types/monitoring";
import {
  addWidgetToWorkspace,
  createDefaultWorkspaceConfig,
  moveWidgetDown,
  moveWidgetUp,
  removeWidgetFromWorkspace,
  renameWorkspace,
  resetWorkspaceToDefault,
  resizeWidget,
  toggleWidgetVisibility,
  updateKpiStrip,
  updateWidgetConfig,
} from "@/utils/monitoring-layout";

const STORAGE_KEY = "smc-monitoring-workspace-v2";

type PresetId =
  | "default"
  | "radio-health"
  | "congestion-focus"
  | "executive-view"
  | "investigation-view";

function sanitizeMetricKey(metricKey: string) {
  if (metricKey === "radio_congestion") return "avg_iub_congestion";
  return metricKey;
}

function sanitizeWorkspace(workspace: MonitoringWorkspaceConfig): MonitoringWorkspaceConfig {
  return {
    ...workspace,
    kpiStrip: workspace.kpiStrip.map(sanitizeMetricKey),
    widgets: workspace.widgets.map((widget) => ({
      ...widget,
      metricKey: sanitizeMetricKey(widget.metricKey),
    })),
  };
}

function createRadioHealthPreset(): MonitoringWorkspaceConfig {
  const workspace = createDefaultWorkspaceConfig();

  return {
    ...workspace,
    profileName: "Radio Health",
    kpiStrip: [
      "avg_cssr_ps",
      "avg_ps_rab_sr",
      "avg_iub_congestion",
      "avg_call_drop_dch",
      "avg_throughput",
    ],
  };
}

function createCongestionFocusPreset(): MonitoringWorkspaceConfig {
  const workspace = createDefaultWorkspaceConfig();

  return {
    ...workspace,
    profileName: "Congestion Focus",
    kpiStrip: [
      "avg_iub_congestion",
      "avg_throughput",
      "avg_call_drop_dch",
      "avg_cssr_ps",
    ],
    widgets: workspace.widgets.map((widget) => {
      if (widget.kind === "trend-line") {
        return {
          ...widget,
          title: "IUB Congestion Primary Trend",
          metricKey: "avg_iub_congestion",
        };
      }

      if (widget.kind === "trend-area" && widget.order === 7) {
        return {
          ...widget,
          title: "IUB Congestion Trend",
          metricKey: "avg_iub_congestion",
        };
      }

      if (widget.kind === "trend-area" && widget.order === 8) {
        return {
          ...widget,
          title: "Throughput Trend",
          metricKey: "avg_throughput",
        };
      }

      if (widget.kind === "distribution") {
        return {
          ...widget,
          title: "Congestion Distribution",
          metricKey: "avg_iub_congestion",
        };
      }

      return widget;
    }),
  };
}

function createExecutiveViewPreset(): MonitoringWorkspaceConfig {
  const workspace = createDefaultWorkspaceConfig();

  return {
    ...workspace,
    profileName: "Executive View",
    kpiStrip: [
      "avg_cssr_ps",
      "avg_ps_rab_sr",
      "avg_iub_congestion",
      "avg_call_drop_dch",
    ],
    widgets: workspace.widgets.map((widget) => {
      if (widget.kind === "worst-cells-table") {
        return {
          ...widget,
          visible: false,
        };
      }

      if (widget.kind === "distribution") {
        return {
          ...widget,
          visible: false,
        };
      }

      return widget;
    }),
  };
}

function createInvestigationViewPreset(): MonitoringWorkspaceConfig {
  const workspace = createDefaultWorkspaceConfig();

  return {
    ...workspace,
    profileName: "Investigation View",
    kpiStrip: [
      "avg_cssr_ps",
      "avg_ps_rab_sr",
      "avg_iub_congestion",
      "avg_call_drop_dch",
      "avg_throughput",
    ],
    widgets: workspace.widgets.map((widget) => {
      if (widget.kind === "worst-cells-table") {
        return {
          ...widget,
          size: "xl",
          order: 2,
        };
      }

      if (widget.kind === "ranking-bar") {
        return {
          ...widget,
          size: "md",
          order: 3,
        };
      }

      return widget;
    }),
  };
}

function getPresetWorkspace(presetId: PresetId): MonitoringWorkspaceConfig {
  switch (presetId) {
    case "radio-health":
      return createRadioHealthPreset();
    case "congestion-focus":
      return createCongestionFocusPreset();
    case "executive-view":
      return createExecutiveViewPreset();
    case "investigation-view":
      return createInvestigationViewPreset();
    case "default":
    default:
      return createDefaultWorkspaceConfig();
  }
}

function readStoredWorkspace(): MonitoringWorkspaceConfig | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as MonitoringWorkspaceConfig;

    if (!parsed || !Array.isArray(parsed.widgets) || !Array.isArray(parsed.kpiStrip)) {
      return null;
    }

    return sanitizeWorkspace(parsed);
  } catch {
    return null;
  }
}

function writeStoredWorkspace(workspace: MonitoringWorkspaceConfig) {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(sanitizeWorkspace(workspace)));
  } catch {
    // ignore storage failures to keep UI usable
  }
}

export type UseMonitoringWorkspaceReturn = {
  workspace: MonitoringWorkspaceConfig | null;
  isEditMode: boolean;
  selectedWidgetId: string | null;
  hasStoredWorkspace: boolean;
  openCustomize: () => void;
  closeCustomize: () => void;
  setSelectedWidgetId: (id: string | null) => void;
  setWorkspace: Dispatch<SetStateAction<MonitoringWorkspaceConfig | null>>;
  updateWorkspace: (
    updater: (prev: MonitoringWorkspaceConfig) => MonitoringWorkspaceConfig
  ) => void;
  saveWorkspace: () => void;
  resetWorkspace: () => void;
  loadPreset: (presetId: PresetId) => void;
  initializeDefaultWorkspace: () => void;
  addWidget: (kind: MonitoringWidgetKind) => void;
  removeWidget: (widgetId: string) => void;
  moveWidgetUpById: (widgetId: string) => void;
  moveWidgetDownById: (widgetId: string) => void;
  toggleWidgetById: (widgetId: string) => void;
  resizeWidgetById: (
    widgetId: string,
    size: MonitoringWidgetConfig["size"]
  ) => void;
  updateWidgetById: (
    widgetId: string,
    updates: Partial<MonitoringWidgetConfig>
  ) => void;
  updateKpiStripSelection: (kpiKeys: string[]) => void;
  renameProfile: (name: string) => void;
  selectedWidget: MonitoringWidgetConfig | null;
};

export function useMonitoringWorkspace(): UseMonitoringWorkspaceReturn {
  const [workspace, setWorkspace] = useState<MonitoringWorkspaceConfig | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedWidgetId, setSelectedWidgetId] = useState<string | null>(null);
  const [hasStoredWorkspace, setHasStoredWorkspace] = useState(false);

  useEffect(() => {
    const stored = readStoredWorkspace();

    if (stored) {
      setWorkspace(stored);
      setHasStoredWorkspace(true);
      return;
    }

    setWorkspace(null);
    setHasStoredWorkspace(false);
  }, []);

  const selectedWidget = useMemo(() => {
    if (!workspace || !selectedWidgetId) return null;
    return workspace.widgets.find((widget) => widget.id === selectedWidgetId) ?? null;
  }, [workspace, selectedWidgetId]);

  const updateWorkspace = useCallback(
    (updater: (prev: MonitoringWorkspaceConfig) => MonitoringWorkspaceConfig) => {
      setWorkspace((prev) => {
        const base = prev ?? createDefaultWorkspaceConfig();
        return sanitizeWorkspace(updater(base));
      });
    },
    []
  );

  const initializeDefaultWorkspace = useCallback(() => {
    const next = sanitizeWorkspace(createDefaultWorkspaceConfig());
    setWorkspace(next);
    setSelectedWidgetId(next.widgets[0]?.id ?? null);
    setHasStoredWorkspace(false);
  }, []);

  const openCustomize = useCallback(() => {
    if (!workspace) {
      const next = sanitizeWorkspace(createDefaultWorkspaceConfig());
      setWorkspace(next);
      setSelectedWidgetId(next.widgets[0]?.id ?? null);
    } else if (!selectedWidgetId && workspace.widgets.length > 0) {
      setSelectedWidgetId(workspace.widgets[0].id);
    }

    setIsEditMode(true);
  }, [workspace, selectedWidgetId]);

  const closeCustomize = useCallback(() => {
    setIsEditMode(false);
  }, []);

  const saveWorkspace = useCallback(() => {
    if (!workspace) return;
    writeStoredWorkspace(workspace);
    setHasStoredWorkspace(true);
  }, [workspace]);

  const resetWorkspace = useCallback(() => {
    const next = sanitizeWorkspace(resetWorkspaceToDefault());
    setWorkspace(next);
    setSelectedWidgetId(next.widgets[0]?.id ?? null);
    writeStoredWorkspace(next);
    setHasStoredWorkspace(true);
  }, []);

  const loadPreset = useCallback((presetId: PresetId) => {
    const next = sanitizeWorkspace(getPresetWorkspace(presetId));
    setWorkspace(next);
    setSelectedWidgetId(next.widgets[0]?.id ?? null);
  }, []);

  const addWidget = useCallback(
    (kind: MonitoringWidgetKind) => {
      updateWorkspace((prev) => {
        const next = addWidgetToWorkspace(prev, kind);
        const lastWidget = [...next.widgets].sort((a, b) => b.order - a.order)[0];
        if (lastWidget) {
          setSelectedWidgetId(lastWidget.id);
        }
        return next;
      });
    },
    [updateWorkspace]
  );

  const removeWidget = useCallback(
    (widgetId: string) => {
      updateWorkspace((prev) => {
        const next = removeWidgetFromWorkspace(prev, widgetId);

        if (selectedWidgetId === widgetId) {
          setSelectedWidgetId(next.widgets[0]?.id ?? null);
        }

        return next;
      });
    },
    [selectedWidgetId, updateWorkspace]
  );

  const moveWidgetUpById = useCallback((widgetId: string) => {
    updateWorkspace((prev) => moveWidgetUp(prev, widgetId));
  }, [updateWorkspace]);

  const moveWidgetDownById = useCallback((widgetId: string) => {
    updateWorkspace((prev) => moveWidgetDown(prev, widgetId));
  }, [updateWorkspace]);

  const toggleWidgetById = useCallback((widgetId: string) => {
    updateWorkspace((prev) => toggleWidgetVisibility(prev, widgetId));
  }, [updateWorkspace]);

  const resizeWidgetById = useCallback(
    (widgetId: string, size: MonitoringWidgetConfig["size"]) => {
      updateWorkspace((prev) => resizeWidget(prev, widgetId, size));
    },
    [updateWorkspace]
  );

  const updateWidgetById = useCallback(
    (widgetId: string, updates: Partial<MonitoringWidgetConfig>) => {
      updateWorkspace((prev) => updateWidgetConfig(prev, widgetId, updates));
    },
    [updateWorkspace]
  );

  const updateKpiStripSelection = useCallback((kpiKeys: string[]) => {
    updateWorkspace((prev) => updateKpiStrip(prev, kpiKeys.map(sanitizeMetricKey)));
  }, [updateWorkspace]);

  const renameProfile = useCallback((name: string) => {
    updateWorkspace((prev) => renameWorkspace(prev, name));
  }, [updateWorkspace]);

  return {
    workspace,
    isEditMode,
    selectedWidgetId,
    hasStoredWorkspace,
    openCustomize,
    closeCustomize,
    setSelectedWidgetId,
    setWorkspace,
    updateWorkspace,
    saveWorkspace,
    resetWorkspace,
    loadPreset,
    initializeDefaultWorkspace,
    addWidget,
    removeWidget,
    moveWidgetUpById,
    moveWidgetDownById,
    toggleWidgetById,
    resizeWidgetById,
    updateWidgetById,
    updateKpiStripSelection,
    renameProfile,
    selectedWidget,
  };
}