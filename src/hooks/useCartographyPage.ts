import { useCallback, useEffect, useMemo, useState } from "react";
import {
  getCartographyFilterOptions,
  getCartographySiteDetail,
  getCartographySites,
  getCartographySummary,
} from "@/services/cartography";
import type {
  CartographyFilterOptions,
  CartographyFilters,
  CartographyMetricMode,
  CartographySelectedSiteState,
  CartographySiteMarker,
  CartographySitesResponse,
  CartographySummary,
  CartographyTooltipState,
} from "@/types/cartography";

const DEFAULT_FILTERS: CartographyFilters = {
  date: "",
  rnc_name: "",
  status: "",
};

const DEFAULT_METRIC_MODE: CartographyMetricMode = "health";

export function useCartographyPage() {
  const [filters, setFilters] = useState<CartographyFilters>(DEFAULT_FILTERS);
  const [metricMode, setMetricMode] =
    useState<CartographyMetricMode>(DEFAULT_METRIC_MODE);

  const [filterOptions, setFilterOptions] =
    useState<CartographyFilterOptions | null>(null);
  const [sitesResponse, setSitesResponse] =
    useState<CartographySitesResponse | null>(null);
  const [summary, setSummary] = useState<CartographySummary | null>(null);

  const [selectedSite, setSelectedSite] =
    useState<CartographySelectedSiteState>(null);
  const [tooltip, setTooltip] = useState<CartographyTooltipState>(null);

  const [loadingInitial, setLoadingInitial] = useState(true);
  const [loadingMap, setLoadingMap] = useState(false);
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [error, setError] = useState("");

  const sites = useMemo(() => {
    return sitesResponse?.results ?? [];
  }, [sitesResponse]);

  const selectedDate = useMemo(() => {
    return filters.date || filterOptions?.dates?.[0] || "";
  }, [filters.date, filterOptions]);

  const hasActiveFilters = useMemo(() => {
    return Boolean(filters.date || filters.rnc_name || filters.status);
  }, [filters]);

  const loadInitial = useCallback(async () => {
    try {
      setLoadingInitial(true);
      setError("");

      const options = await getCartographyFilterOptions();
      setFilterOptions(options);

      const defaultDate = options.dates?.[0] ?? "";

      setFilters((prev) => ({
        ...prev,
        date: prev.date || defaultDate,
      }));
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Failed to load cartography filter options.";
      setError(message);
    } finally {
      setLoadingInitial(false);
    }
  }, []);

  const loadWorkspaceData = useCallback(
    async (nextFilters: CartographyFilters) => {
      if (!nextFilters.date) return;

      try {
        setLoadingMap(true);
        setLoadingSummary(true);
        setError("");

        const [sitesResult, summaryResult] = await Promise.all([
          getCartographySites(nextFilters),
          getCartographySummary(nextFilters),
        ]);

        setSitesResponse(sitesResult);
        setSummary(summaryResult);

        setSelectedSite((prev) => {
          if (!prev) return null;

          const matchedMarker = sitesResult.results.find(
            (site) => site.nodeb_name === prev.marker.nodeb_name
          );

          if (!matchedMarker) return null;

          return {
            ...prev,
            marker: matchedMarker,
            detail: prev.detail
              ? {
                  ...prev.detail,
                  ...matchedMarker,
                }
              : prev.detail,
          };
        });
      } catch (err) {
        const message =
          err instanceof Error
            ? err.message
            : "Failed to load cartography workspace data.";
        setError(message);
      } finally {
        setLoadingMap(false);
        setLoadingSummary(false);
      }
    },
    []
  );

  const selectSite = useCallback(
    async (marker: CartographySiteMarker) => {
      setSelectedSite({
        marker,
        detail: null,
        loading: true,
        error: "",
      });

      try {
        const detail = await getCartographySiteDetail(marker.nodeb_name, {
          date: selectedDate,
          rnc_name: filters.rnc_name,
          status: filters.status,
        });

        setSelectedSite({
          marker,
          detail,
          loading: false,
          error: "",
        });
      } catch (err) {
        const message =
          err instanceof Error
            ? err.message
            : "Failed to load selected site details.";

        setSelectedSite({
          marker,
          detail: null,
          loading: false,
          error: message,
        });
      }
    },
    [filters.rnc_name, filters.status, selectedDate]
  );

  const clearSelectedSite = useCallback(() => {
    setSelectedSite(null);
  }, []);

  const resetFilters = useCallback(() => {
    setFilters({
      date: filterOptions?.dates?.[0] ?? "",
      rnc_name: "",
      status: "",
    });
  }, [filterOptions]);

  const setHoveredTooltip = useCallback((value: CartographyTooltipState) => {
    setTooltip(value);
  }, []);

  const clearTooltip = useCallback(() => {
    setTooltip(null);
  }, []);

  const updateFilter = useCallback(
    <K extends keyof CartographyFilters>(
      key: K,
      value: CartographyFilters[K]
    ) => {
      setFilters((prev) => ({
        ...prev,
        [key]: value,
      }));
    },
    []
  );

  useEffect(() => {
    loadInitial();
  }, [loadInitial]);

  useEffect(() => {
    if (!filters.date) return;
    loadWorkspaceData(filters);
  }, [filters, loadWorkspaceData]);

  return {
    filters,
    metricMode,
    filterOptions,
    sitesResponse,
    sites,
    summary,
    selectedSite,
    tooltip,
    selectedDate,
    hasActiveFilters,
    loadingInitial,
    loadingMap,
    loadingSummary,
    error,

    setFilters,
    updateFilter,
    resetFilters,

    setMetricMode,

    selectSite,
    clearSelectedSite,

    setHoveredTooltip,
    clearTooltip,

    reload: () => loadWorkspaceData(filters),
  };
}