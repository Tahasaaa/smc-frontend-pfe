import { apiRequest, KPI_API_BASE_URL } from "./api";
import type {
  CartographyFilterOptions,
  CartographyFilters,
  CartographySiteDetail,
  CartographySitesResponse,
  CartographySummary,
} from "@/types/cartography";

const CARTOGRAPHY_API_BASE_URL = `${KPI_API_BASE_URL}/cartography`;

type CartographyQuery = {
  date?: string;
  rnc_name?: string;
  status?: string;
};

function buildCartographyQuery(filters?: Partial<CartographyFilters>): CartographyQuery {
  return {
    date: filters?.date || undefined,
    rnc_name: filters?.rnc_name || undefined,
    status: filters?.status || undefined,
  };
}

export function getCartographyFilterOptions() {
  return apiRequest<CartographyFilterOptions>("/filter-options/", {
    baseUrl: CARTOGRAPHY_API_BASE_URL,
  });
}

export function getCartographySites(filters?: Partial<CartographyFilters>) {
  return apiRequest<CartographySitesResponse>("/sites/", {
    baseUrl: CARTOGRAPHY_API_BASE_URL,
    query: buildCartographyQuery(filters),
  });
}

export function getCartographySummary(filters?: Partial<CartographyFilters>) {
  return apiRequest<CartographySummary>("/summary/", {
    baseUrl: CARTOGRAPHY_API_BASE_URL,
    query: buildCartographyQuery(filters),
  });
}

export function getCartographySiteDetail(
  nodebName: string,
  filters?: Partial<CartographyFilters>
) {
  return apiRequest<CartographySiteDetail>(
    `/site/${encodeURIComponent(nodebName)}/`,
    {
      baseUrl: CARTOGRAPHY_API_BASE_URL,
      query: buildCartographyQuery(filters),
    }
  );
}

export { CARTOGRAPHY_API_BASE_URL };