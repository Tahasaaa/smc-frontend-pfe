import { apiRequest, RCA_API_BASE_URL } from "./api";

export type RcaHypothesis = {
  family?: string;
  label?: string;
  hypothesis?: string;
  probability?: number;
  probability_percent?: number;
  confidence?: number;
  explanation?: string;
  rank?: number;
  is_model_choice?: boolean;
  suggested_checks?: string[];
  suggested_actions?: string[];
  recommended_checks?: string[];
  recommended_actions?: string[];
  checks?: string[];
  actions?: string[];
  approved_checks?: string[];
  approved_actions?: string[];
  [key: string]: unknown;
};

export type RcaHypothesisReview = {
  rank?: number;
  family?: string;
  probability?: number;
  probability_percent?: number;
  is_model_choice?: boolean;
  suggested_checks?: string[];
  suggested_actions?: string[];
  review_options?: string[];
  engineer_decision?: string | null;
  engineer_note?: string;
  [key: string]: unknown;
};

export type RcaKpiInsight =
  | string
  | {
      name?: string;
      kpi_name?: string;
      status?: string;
      value?: string | number;
      interpretation?: string;
      evidence?: string;
      severity?: string;
      [key: string]: unknown;
    };

export type RcaChartPoint = {
  label?: string;
  name?: string;
  value?: number;
  score?: number;
  probability?: number;
  raw_probability?: number;
  threshold?: number;
  severity_score?: number;
  status?: string;
  risk_score?: number;
  [key: string]: unknown;
};

export type RcaCharts = {
  hypothesis_probability?: RcaChartPoint[];
  kpi_evidence?: RcaChartPoint[];
  risk_timeline?: RcaChartPoint[];
  [key: string]: unknown;
};

export type RcaRisk = {
  risk_level?: string;
  risk_score?: number;
  estimated_time_to_impact?: string;
  summary?: string;
  impact?: string;
  impact_if_not_fixed?: string;
  escalation_advice?: string;
  [key: string]: unknown;
};

export type RcaSourceFlags = {
  incident_found?: boolean;
  kpi_context_found?: boolean;
  dataset_context_found?: boolean;
};

export type RcaIncidentContext = {
  ticket_id?: string;
  problem_statement?: string;
  site_id?: string;
  site_name?: string;
  region?: string;
  priority?: string;
  severity?: string;
  status?: string;
  technology?: string;
  impact?: string | number;
  problem_family_hint?: string;
  source_flags?: RcaSourceFlags;
  [key: string]: unknown;
};

export type RcaEnrichmentTrace = {
  incident_found?: boolean;
  kpi_context_found?: boolean;
  rca_dataset_context_found?: boolean;
  used_fallback_text_only?: boolean;
  incident_service?: string[];
  site_candidates?: string[];
  kpi_service?: string[];
  rca_dataset?: string[];
  enrichment_result?: {
    incident_found?: boolean;
    kpi_context_found?: boolean;
    rca_dataset_context_found?: boolean;
    used_fallback_text_only?: boolean;
    [key: string]: unknown;
  };
  [key: string]: unknown;
};

export type RcaRootCauseSummary = {
  site_name?: string;
  priority?: string;
  predicted_family?: string;
  confidence?: number;
  confidence_percent?: number;
  confidence_label?: string;
  root_cause?: string;
  evidence_summary?: string[];
  [key: string]: unknown;
};

export type RcaAnalysis = {
  ticket_id: string;
  ticket_number?: string;
  analysis_status?: string;
  predicted_family?: string;
  confidence?: number;
  top_hypotheses?: RcaHypothesis[];
  hypothesis_reviews?: RcaHypothesisReview[];

  incident_context?: RcaIncidentContext;

  payload?: Record<string, unknown>;
  source_incident?: Record<string, unknown>;
  kpi_context?: Record<string, unknown>;
  dataset_context?: Record<string, unknown>;

  kpi_insights?: RcaKpiInsight[];
  recommended_checks?: string[];
  recommended_actions?: string[];
  draft_report?: string;
  root_cause_summary?: RcaRootCauseSummary | string;
  risk_if_not_fixed?: RcaRisk | string;
  charts?: RcaCharts;
  enrichment_trace?: RcaEnrichmentTrace;
  explainability_status?: Record<string, unknown>;
  [key: string]: unknown;
};

export type RcaPreview = {
  ticket_id?: string;
  ticket_number?: string;

  incident_context?: RcaIncidentContext;
  payload?: Record<string, unknown>;
  source_incident?: Record<string, unknown>;
  kpi_context?: Record<string, unknown>;
  dataset_context?: Record<string, unknown>;

  incident_found?: boolean;
  kpi_context_found?: boolean;
  rca_dataset_context_found?: boolean;
  used_fallback_text_only?: boolean;
  incident?: unknown;
  rca_dataset_context?: unknown;
  enrichment_trace?: RcaEnrichmentTrace;
  [key: string]: unknown;
};

export type RcaApprovalPayload = {
  ticket_id: string;
  approved_by: string;
  approved_family: string;
  approved_checks: string[];
  approved_actions: string[];
  engineer_notes: string;
  approval_status: "approved" | "rejected" | "partially_correct" | string;
};

export type RcaApprovalResponse = {
  id?: number;
  ticket_id?: string;
  approval_status?: string;
  approved_family?: string;
  engineer_notes?: string;
  created_at?: string;
  [key: string]: unknown;
};

export type RcaReportPayload = {
  ticket_id: string;
};

export type RcaReport = {
  ticket_id?: string;
  report_id?: number | string;
  title?: string;
  report_status?: string;
  report_text?: string;
  report_content?: string;
  content?: string;
  final_conclusion?: string;
  generated_at?: string;
  created_at?: string;
  [key: string]: unknown;
};

export type PublishRunbookPayload = {
  ticket_id: string;
  created_by: string;
  tags: string[];
  is_reusable: "yes" | "no" | string;
};

export type RunbookEntry = {
  id?: number;
  ticket_id?: string;
  site_id?: string;
  site_name?: string;
  region?: string;
  incident_summary?: string;
  approved_family?: string;
  checks?: string[];
  actions?: string[];
  approved_checks?: string[];
  approved_actions?: string[];
  engineer_notes?: string;
  final_conclusion?: string;
  report_id?: string;
  tags?: string[];
  is_reusable?: string;
  reusable_status?: string;
  created_by?: string;
  created_at?: string;
  [key: string]: unknown;
};

export type RunbookSearchResponse = {
  total?: number;
  items?: RunbookEntry[];
};

export type RunbookFeedbackSummary = {
  total_runbooks?: number;
  reusable_runbooks?: number;
  by_family?: Record<string, number>;
  learning_strategy?: string;
  [key: string]: unknown;
};

export type ExplainabilityResponse = {
  ticket_id?: string;
  top_features?: unknown[];
  explanations?: unknown[];
  [key: string]: unknown;
};

export function analyzeIncidentRca(ticketNumber: string) {
  return apiRequest<RcaAnalysis>(
    `/v2/backend/incidents/${encodeURIComponent(ticketNumber)}/analyze`,
    {
      method: "POST",
      baseUrl: RCA_API_BASE_URL,
    }
  );
}

export function previewIncidentRca(ticketNumber: string) {
  return apiRequest<RcaPreview>(
    `/v2/backend/incidents/${encodeURIComponent(ticketNumber)}/preview`,
    {
      method: "GET",
      baseUrl: RCA_API_BASE_URL,
    }
  );
}

export function approveRca(payload: RcaApprovalPayload) {
  return apiRequest<RcaApprovalResponse>("/v2/approvals", {
    method: "POST",
    baseUrl: RCA_API_BASE_URL,
    body: payload,
  });
}

export function generateRcaReport(payload: RcaReportPayload) {
  return apiRequest<RcaReport>("/v2/reports", {
    method: "POST",
    baseUrl: RCA_API_BASE_URL,
    body: payload,
  });
}

export function getRcaReport(ticketId: string) {
  return apiRequest<RcaReport>(`/v2/reports/${encodeURIComponent(ticketId)}`, {
    method: "GET",
    baseUrl: RCA_API_BASE_URL,
  });
}

export function publishRunbook(payload: PublishRunbookPayload) {
  return apiRequest<RunbookEntry>("/v2/runbooks/publish", {
    method: "POST",
    baseUrl: RCA_API_BASE_URL,
    body: payload,
  });
}

export function getRunbook(ticketId: string) {
  return apiRequest<RunbookEntry>(
    `/v2/runbooks/${encodeURIComponent(ticketId)}`,
    {
      method: "GET",
      baseUrl: RCA_API_BASE_URL,
    }
  );
}

export function searchRunbooks(query = "") {
  return apiRequest<RunbookSearchResponse | RunbookEntry[]>(
    "/v2/runbooks/search",
    {
      method: "GET",
      baseUrl: RCA_API_BASE_URL,
      query: { q: query },
    }
  );
}

export function getRunbookFeedbackSummary() {
  return apiRequest<RunbookFeedbackSummary>("/v2/training/feedback/summary", {
    method: "GET",
    baseUrl: RCA_API_BASE_URL,
  });
}

export function getLocalExplainability(ticketId: string, topN = 10) {
  return apiRequest<ExplainabilityResponse>(
    `/v2/explain/local/${encodeURIComponent(ticketId)}`,
    {
      method: "GET",
      baseUrl: RCA_API_BASE_URL,
      query: { top_n: topN },
    }
  );
}

export function getGlobalExplainability(topN = 15) {
  return apiRequest<ExplainabilityResponse>("/v2/explain/global", {
    method: "GET",
    baseUrl: RCA_API_BASE_URL,
    query: { top_n: topN },
  });
}