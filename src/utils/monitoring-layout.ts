import type {
  MonitoringWidgetConfig,
  MonitoringWidgetKind,
  MonitoringWidgetSize,
  MonitoringWorkspaceConfig,
} from "@/types/monitoring";
import {
  DEFAULT_KPI_STRIP,
  DEFAULT_WORKSPACE_WIDGETS,
  getWidgetLibraryItem,
} from "@/utils/monitoring-widgets";

function createWidgetId(prefix: string) {
  const random = Math.random().toString(36).slice(2, 8);
  return `${prefix}-${Date.now()}-${random}`;
}

function reindexWidgetOrder(widgets: MonitoringWidgetConfig[]) {
  return [...widgets]
    .sort((a, b) => a.order - b.order)
    .map((widget, index) => ({
      ...widget,
      order: index + 1,
    }));
}

export function createDefaultWorkspaceConfig(): MonitoringWorkspaceConfig {
  return {
    profileName: "Default Profile",
    defaultTechnology: "3G",
    defaultDateRange: "24h",
    kpiStrip: [...DEFAULT_KPI_STRIP],
    widgets: DEFAULT_WORKSPACE_WIDGETS.map((widget) => ({
      ...widget,
      id: createWidgetId(widget.kind),
    })),
  };
}

export function sortWidgetsByOrder(widgets: MonitoringWidgetConfig[]) {
  return [...widgets].sort((a, b) => a.order - b.order);
}

export function addWidgetToWorkspace(
  workspace: MonitoringWorkspaceConfig,
  kind: MonitoringWidgetKind
): MonitoringWorkspaceConfig {
  const libraryItem = getWidgetLibraryItem(kind);

  if (!libraryItem) return workspace;

  const nextOrder =
    workspace.widgets.length > 0
      ? Math.max(...workspace.widgets.map((widget) => widget.order)) + 1
      : 1;

  const nextWidget: MonitoringWidgetConfig = {
    id: createWidgetId(kind),
    kind: libraryItem.kind,
    title: libraryItem.defaultTitle,
    subtitle: libraryItem.defaultSubtitle,
    metricKey: libraryItem.defaultMetricKey,
    size: libraryItem.defaultSize,
    visible: true,
    order: nextOrder,
    scopeMode: "global",
  };

  return {
    ...workspace,
    widgets: [...workspace.widgets, nextWidget],
  };
}

export function removeWidgetFromWorkspace(
  workspace: MonitoringWorkspaceConfig,
  widgetId: string
): MonitoringWorkspaceConfig {
  const filtered = workspace.widgets.filter((widget) => widget.id !== widgetId);

  return {
    ...workspace,
    widgets: reindexWidgetOrder(filtered),
  };
}

export function toggleWidgetVisibility(
  workspace: MonitoringWorkspaceConfig,
  widgetId: string
): MonitoringWorkspaceConfig {
  return {
    ...workspace,
    widgets: workspace.widgets.map((widget) =>
      widget.id === widgetId
        ? { ...widget, visible: !widget.visible }
        : widget
    ),
  };
}

export function resizeWidget(
  workspace: MonitoringWorkspaceConfig,
  widgetId: string,
  size: MonitoringWidgetSize
): MonitoringWorkspaceConfig {
  return {
    ...workspace,
    widgets: workspace.widgets.map((widget) =>
      widget.id === widgetId ? { ...widget, size } : widget
    ),
  };
}

export function updateWidgetConfig(
  workspace: MonitoringWorkspaceConfig,
  widgetId: string,
  updates: Partial<MonitoringWidgetConfig>
): MonitoringWorkspaceConfig {
  return {
    ...workspace,
    widgets: workspace.widgets.map((widget) =>
      widget.id === widgetId ? { ...widget, ...updates } : widget
    ),
  };
}

export function moveWidgetUp(
  workspace: MonitoringWorkspaceConfig,
  widgetId: string
): MonitoringWorkspaceConfig {
  const widgets = sortWidgetsByOrder(workspace.widgets);
  const index = widgets.findIndex((widget) => widget.id === widgetId);

  if (index <= 0) return workspace;

  const swapped = [...widgets];
  [swapped[index - 1], swapped[index]] = [swapped[index], swapped[index - 1]];

  return {
    ...workspace,
    widgets: reindexWidgetOrder(swapped),
  };
}

export function moveWidgetDown(
  workspace: MonitoringWorkspaceConfig,
  widgetId: string
): MonitoringWorkspaceConfig {
  const widgets = sortWidgetsByOrder(workspace.widgets);
  const index = widgets.findIndex((widget) => widget.id === widgetId);

  if (index === -1 || index >= widgets.length - 1) return workspace;

  const swapped = [...widgets];
  [swapped[index], swapped[index + 1]] = [swapped[index + 1], swapped[index]];

  return {
    ...workspace,
    widgets: reindexWidgetOrder(swapped),
  };
}

export function updateKpiStrip(
  workspace: MonitoringWorkspaceConfig,
  kpiStrip: string[]
): MonitoringWorkspaceConfig {
  return {
    ...workspace,
    kpiStrip: [...kpiStrip],
  };
}

export function renameWorkspace(
  workspace: MonitoringWorkspaceConfig,
  profileName: string
): MonitoringWorkspaceConfig {
  return {
    ...workspace,
    profileName,
  };
}

export function resetWorkspaceToDefault(): MonitoringWorkspaceConfig {
  return createDefaultWorkspaceConfig();
}