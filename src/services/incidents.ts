import { apiRequest } from "./api";

const INCIDENTS_API_BASE_URL = "http://127.0.0.1:8002/api";

export type Incident = {
  id: number;
  ticket_number: string;
  title: string;
  status: string;
  severity: string;
  priority: string | null;
  problem_family: string | null;
  site_name: string | null;
  region_code: string | null;
  technology: string;
  started_at: string;
  is_active: boolean;
  health_impact_score: number;
  root_cause_hint: string | null;
};

export type IncidentListResponse = {
  count: number;
  limit: number;
  offset: number;
  results: Incident[];
};

export type IncidentStats = {
  active_incidents: number;
  critical_incidents: number;
  major_incidents: number;
  minor_incidents: number;
  resolved_incidents: number;
  closed_incidents: number;
};

export type IncidentDetails = Incident & {
  description?: string;
  source?: string;
  ticket_type?: string;
  assigned_team?: string | null;
  acknowledged_at?: string | null;
  resolved_at?: string | null;
  closed_at?: string | null;
  created_at?: string;
  updated_at?: string;
};

export type IncidentFilterOptions = {
  statuses: string[];
  severities: string[];
  priorities: string[];
  problem_families?: string[];
};

export function getIncidents(params?: {
  limit?: number;
  offset?: number;
  status?: string;
  severity?: string;
  priority?: string;
  technology?: string;
}) {
  return apiRequest<IncidentListResponse>("/incidents/", {
    baseUrl: INCIDENTS_API_BASE_URL,
    query: params,
  });
}

export function getIncidentOverview() {
  return apiRequest<Incident[]>("/incidents/overview/", {
    baseUrl: INCIDENTS_API_BASE_URL,
  });
}

export function getIncidentStats() {
  return apiRequest<IncidentStats>("/incidents/stats/", {
    baseUrl: INCIDENTS_API_BASE_URL,
  });
}

export async function getIncidentFilterOptions() {
  const data = await apiRequest<IncidentFilterOptions>("/incidents/filter-options/", {
    baseUrl: INCIDENTS_API_BASE_URL,
  });

  return {
    ...data,
    statuses: Array.from(new Set(data.statuses)).filter(Boolean),
    severities: Array.from(new Set(data.severities)).filter(Boolean),
    priorities: Array.from(new Set(data.priorities)).filter(Boolean),
    problem_families: Array.from(new Set(data.problem_families ?? [])).filter(Boolean),
  };
}

export function getIncidentById(id: number | string) {
  return apiRequest<IncidentDetails>(`/incidents/${id}/`, {
    baseUrl: INCIDENTS_API_BASE_URL,
  });
}