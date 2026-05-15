import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import {
  AlertTriangle,
  ArrowLeft,
  BookOpenCheck,
  BrainCircuit,
  CheckCircle2,
  ClipboardCheck,
  FileText,
  Loader2,
  Radar,
  RefreshCw,
  Save,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Target,
  X,
  XCircle,
  Zap,
} from "lucide-react";

import AppShell from "@/components/layout/AppShell";
import { getStoredUser } from "@/services/auth";
import type { IncidentDetails } from "@/services/incidents";
import {
  analyzeIncidentRca,
  approveRca,
  generateRcaReport,
  getRcaReport,
  previewIncidentRca,
  publishRunbook,
  type RcaAnalysis,
  type RcaHypothesis,
  type RcaKpiInsight,
  type RcaPreview,
  type RcaReport,
  type RunbookEntry,
} from "@/services/rca";

type LocationState = {
  incident?: IncidentDetails;
};

type HypothesisDecision = "validated" | "rejected" | "partial";

type IncidentSnapshot = {
  ticket: string;
  title: string;
  priority: string;
  severity: string;
  family: string;
  site: string;
  region: string;
  technology: string;
  impact: string;
};

const DEFAULT_TAGS = "rca, incident-service, intelligent-noc";

export default function RcaPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  const locationState = location.state as LocationState | null;
  const selectedIncident = locationState?.incident ?? null;
  const selectedIncidentRecord = asRecord(selectedIncident);

  const ticketNumber =
    searchParams.get("ticket") ||
    readString(selectedIncidentRecord, ["ticket_number", "ticket_id", "id"]) ||
    "";

  const [analysis, setAnalysis] = useState<RcaAnalysis | null>(null);
  const [preview, setPreview] = useState<RcaPreview | null>(null);
  const [runbook, setRunbook] = useState<RunbookEntry | null>(null);
  const [report, setReport] = useState<RcaReport | null>(null);
  const [reportOpen, setReportOpen] = useState(false);

  const [engineerNotes, setEngineerNotes] = useState("");
  const [tags, setTags] = useState(DEFAULT_TAGS);
  const [selectedFamily, setSelectedFamily] = useState("");
  const [hypothesisDecisions, setHypothesisDecisions] = useState<
    Record<string, HypothesisDecision>
  >({});

  const [loadingAnalysis, setLoadingAnalysis] = useState(false);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [savingApproval, setSavingApproval] = useState(false);
  const [generatingReport, setGeneratingReport] = useState(false);
  const [publishingRunbook, setPublishingRunbook] = useState(false);

  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const ticketId = String(
    analysis?.ticket_id || analysis?.ticket_number || ticketNumber
  );

  const predictedFamily = String(
    analysis?.predicted_family ||
      getIncidentContextValue(
        analysis,
        preview,
        selectedIncident,
        ["problem_family_hint", "problem_family", "family"],
        ""
      ) ||
      readString(selectedIncidentRecord, ["problem_family", "family"]) ||
      "Waiting for analysis"
  );

  const confidence = normalizePercent(analysis?.confidence);

  const topHypotheses = useMemo<RcaHypothesis[]>(() => {
    if (
      Array.isArray(analysis?.hypothesis_reviews) &&
      analysis.hypothesis_reviews.length
    ) {
      return analysis.hypothesis_reviews.map((item, index) => ({
        family: item.family || `Hypothesis ${index + 1}`,
        probability:
          typeof item.probability === "number"
            ? item.probability
            : typeof item.probability_percent === "number"
              ? item.probability_percent / 100
              : undefined,
        probability_percent: item.probability_percent,
        rank: item.rank,
        is_model_choice: item.is_model_choice,
        suggested_checks: item.suggested_checks,
        suggested_actions: item.suggested_actions,
      }));
    }

    return Array.isArray(analysis?.top_hypotheses)
      ? analysis.top_hypotheses
      : [];
  }, [analysis]);

  const kpiInsights = Array.isArray(analysis?.kpi_insights)
    ? analysis.kpi_insights
    : [];

  const recommendedChecks = Array.isArray(analysis?.recommended_checks)
    ? analysis.recommended_checks
    : [];

  const recommendedActions = Array.isArray(analysis?.recommended_actions)
    ? analysis.recommended_actions
    : [];

  const incidentSnapshot = useMemo<IncidentSnapshot>(() => {
    return {
      ticket: ticketNumber,
      title: sanitizeTitle(
        getIncidentContextValue(
          analysis,
          preview,
          selectedIncident,
          ["problem_statement", "ticket_text", "description", "title", "summary"],
          readString(selectedIncidentRecord, ["title", "description", "summary"]) ||
            "Incident context loaded from RCA backend."
        )
      ),
      priority: getIncidentContextValue(
        analysis,
        preview,
        selectedIncident,
        ["priority", "priorite"],
        readString(selectedIncidentRecord, ["priority", "priorite"]) || "—"
      ),
      severity: getIncidentContextValue(
        analysis,
        preview,
        selectedIncident,
        ["severity", "priorite_texte"],
        readString(selectedIncidentRecord, ["severity", "priorite_texte"]) || "—"
      ),
      family: getIncidentContextValue(
        analysis,
        preview,
        selectedIncident,
        ["problem_family_hint", "problem_family", "family"],
        readString(selectedIncidentRecord, ["problem_family", "family"]) ||
          predictedFamily ||
          "—"
      ),
      site: getIncidentContextValue(
        analysis,
        preview,
        selectedIncident,
        ["site_id", "site_name", "nom_du_site", "site"],
        readString(selectedIncidentRecord, [
          "site_name",
          "site_id",
          "nom_du_site",
          "site",
        ]) || "Not available"
      ),
      region: getIncidentContextValue(
        analysis,
        preview,
        selectedIncident,
        ["region", "region_code"],
        readString(selectedIncidentRecord, ["region_code", "region"]) ||
          "Not available"
      ),
      technology: getIncidentContextValue(
        analysis,
        preview,
        selectedIncident,
        ["technology", "technologie"],
        readString(selectedIncidentRecord, ["technology", "technologie"]) || "3G"
      ),
      impact: getIncidentContextValue(
        analysis,
        preview,
        selectedIncident,
        ["impact", "incident_potential", "health_impact_score", "impact_score"],
        readString(selectedIncidentRecord, [
          "health_impact_score",
          "impact",
          "incident_potential",
          "impact_score",
        ]) || "—"
      ),
    };
  }, [
    analysis,
    preview,
    predictedFamily,
    selectedIncident,
    selectedIncidentRecord,
    ticketNumber,
  ]);

  const extractedProblem = useMemo(() => {
    const text = getIncidentContextValue(
      analysis,
      preview,
      selectedIncident,
      ["problem_statement", "ticket_text", "description", "title", "summary"],
      readString(selectedIncidentRecord, ["description", "title", "summary"]) ||
        incidentSnapshot.title ||
        "No extracted problem available yet."
    );

    return sanitizeTitle(text || "No extracted problem available yet.");
  }, [
    analysis,
    preview,
    selectedIncident,
    selectedIncidentRecord,
    incidentSnapshot.title,
  ]);

  useEffect(() => {
    if (!ticketNumber) return;
    void runAnalysis();
    void runPreview();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ticketNumber]);

  useEffect(() => {
    if (analysis?.predicted_family) {
      setSelectedFamily(String(analysis.predicted_family));
    }
  }, [analysis?.predicted_family]);

  async function runAnalysis() {
    if (!ticketNumber) return;

    try {
      setLoadingAnalysis(true);
      setError("");
      setSuccessMessage("");

      const response = await analyzeIncidentRca(ticketNumber);
      setAnalysis(response);
      setRunbook(null);
      setReport(null);
      setReportOpen(false);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to analyze selected incident with RCA backend."
      );
    } finally {
      setLoadingAnalysis(false);
    }
  }

  async function runPreview() {
    if (!ticketNumber) return;

    try {
      setLoadingPreview(true);
      const response = await previewIncidentRca(ticketNumber);
      setPreview(response);
    } catch {
      // Preview enriches UI but is not mandatory.
    } finally {
      setLoadingPreview(false);
    }
  }

  function setHypothesisDecision(
    hypothesis: RcaHypothesis,
    index: number,
    decision: HypothesisDecision
  ) {
    const key = getHypothesisKey(hypothesis, index);
    const family = getHypothesisFamily(hypothesis, index);

    setHypothesisDecisions((prev) => ({
      ...prev,
      [key]: decision,
    }));

    if (decision === "validated" || decision === "partial") {
      setSelectedFamily(family);
    }
  }

  async function saveApproval() {
    if (!analysis || !ticketId) return;

    try {
      setSavingApproval(true);
      setError("");
      setSuccessMessage("");

      const storedUser = getStoredUser() as
        | {
            username?: string;
            fullname?: string;
            email?: string;
          }
        | null;

      const approvedBy =
        storedUser?.username ||
        storedUser?.fullname ||
        storedUser?.email ||
        "taha";

      const selectedHypothesis = topHypotheses.find(
        (item, index) => getHypothesisFamily(item, index) === selectedFamily
      );

      const selectedRecord = asRecord(selectedHypothesis);

      const approvedChecks =
        readStringArray(selectedRecord, [
          "suggested_checks",
          "recommended_checks",
          "checks",
          "approved_checks",
        ]) || recommendedChecks;

      const approvedActions =
        readStringArray(selectedRecord, [
          "suggested_actions",
          "recommended_actions",
          "actions",
          "approved_actions",
        ]) || recommendedActions;

      await approveRca({
        ticket_id: ticketId,
        approved_by: approvedBy,
        approved_family: selectedFamily || predictedFamily,
        approved_checks: approvedChecks,
        approved_actions: approvedActions,
        engineer_notes:
          engineerNotes.trim() || "Approved after engineer review.",
        approval_status: getApprovalStatus(hypothesisDecisions),
      });

      setSuccessMessage("Engineer RCA decision saved successfully.");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to save RCA approval."
      );
    } finally {
      setSavingApproval(false);
    }
  }

  async function handleGenerateReport() {
    if (!ticketId) return;

    try {
      setGeneratingReport(true);
      setError("");
      setSuccessMessage("");

      const generated = await generateRcaReport({ ticket_id: ticketId });

      if (extractReportText(generated)) {
        setReport(generated);
      } else {
        try {
          const stored = await getRcaReport(ticketId);
          setReport({
            ...generated,
            ...stored,
            report_text:
              extractReportText(stored) || extractReportText(generated) || "",
          });
        } catch {
          setReport(generated);
        }
      }

      setReportOpen(true);
      setSuccessMessage("Final RCA report generated successfully.");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to generate RCA report."
      );
    } finally {
      setGeneratingReport(false);
    }
  }

  async function handlePublishRunbook() {
    if (!ticketId) return;

    try {
      setPublishingRunbook(true);
      setError("");
      setSuccessMessage("");

      const storedUser = getStoredUser() as
        | {
            username?: string;
            fullname?: string;
            email?: string;
          }
        | null;

      const createdBy =
        storedUser?.username ||
        storedUser?.fullname ||
        storedUser?.email ||
        "taha";

      const published = await publishRunbook({
        ticket_id: ticketId,
        created_by: createdBy,
        tags: tags
          .split(",")
          .map((tag) => tag.trim())
          .filter(Boolean),
        is_reusable: "yes",
      });

      setRunbook(published);
      setSuccessMessage("Runbook published successfully.");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to publish runbook."
      );
    } finally {
      setPublishingRunbook(false);
    }
  }

  if (!ticketNumber) {
    return (
      <AppShell>
        <div className="px-1 pb-3 pt-1 text-white">
          <section className="premium-panel rounded-[1.55rem]">
            <div className="premium-panel-body flex min-h-[62vh] flex-col items-center justify-center px-6 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-[1.4rem] border border-orange-400/14 bg-orange-500/10 text-orange-300">
                <BrainCircuit className="h-7 w-7" />
              </div>

              <h1 className="mt-5 text-[1.45rem] font-semibold tracking-[-0.05em] text-white">
                No incident selected
              </h1>

              <p className="mt-3 max-w-xl text-sm leading-6 text-white/48">
                Open the incident page, select an incident, then launch RCA from
                the inspection panel.
              </p>

              <button
                onClick={() => navigate("/incidents")}
                className="orange-ring-focus mt-6 inline-flex items-center justify-center gap-2 rounded-[1rem] border border-orange-400/18 bg-orange-500/12 px-4 py-3 text-sm font-semibold text-orange-200 transition hover:bg-orange-500/18"
              >
                <ArrowLeft className="h-4 w-4" />
                Go to incidents
              </button>
            </div>
          </section>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="relative min-h-[calc(100vh-2rem)] px-1 pb-32 pt-1 text-white">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-72 rounded-[2rem] bg-[radial-gradient(circle_at_50%_0%,rgba(255,121,0,0.10),transparent_60%)]" />

        <section className="relative grid grid-cols-1 gap-3 2xl:grid-cols-[370px_minmax(0,1fr)]">
          <aside className="space-y-3">
            <IncidentCaseFile
              incident={incidentSnapshot}
              predictedFamily={predictedFamily}
              confidence={confidence}
              loadingPreview={loadingPreview}
              onBack={() => navigate("/incidents")}
              onReAnalyze={runAnalysis}
              loadingAnalysis={loadingAnalysis}
            />

            <RiskCompact risk={asRecord(analysis).risk_if_not_fixed} />

            <EngineerConclusionCard
              selectedFamily={selectedFamily}
              setSelectedFamily={setSelectedFamily}
              engineerNotes={engineerNotes}
              setEngineerNotes={setEngineerNotes}
              tags={tags}
              setTags={setTags}
              disabled={!analysis || savingApproval}
              savingApproval={savingApproval}
              onSave={saveApproval}
            />
          </aside>

          <main className="min-w-0">
            <section className="overflow-hidden rounded-[1.6rem] border border-white/[0.07] bg-[linear-gradient(180deg,rgba(24,29,36,0.96),rgba(9,14,20,0.98))] shadow-[0_28px_80px_rgba(0,0,0,0.34),inset_0_1px_0_rgba(255,255,255,0.035)]">
              <CauseCanvasHeader
                ticketNumber={ticketNumber}
                predictedFamily={predictedFamily}
                confidence={confidence}
                loadingAnalysis={loadingAnalysis}
                analysisReady={Boolean(analysis)}
                kpiInsights={kpiInsights}
                extractedProblem={extractedProblem}
              />

              {analysis ? <RcaChartsPanel analysis={analysis} /> : null}

              <div className="p-4 md:p-5">
                {loadingAnalysis && !analysis ? (
                  <AiOperationLoading />
                ) : topHypotheses.length > 0 ? (
                  <div className="space-y-4">
                    {topHypotheses.map((hypothesis, index) => {
                      const key = getHypothesisKey(hypothesis, index);
                      const decision = hypothesisDecisions[key];

                      return (
                        <AiHypothesisOperation
                          key={key}
                          hypothesis={hypothesis}
                          index={index}
                          decision={decision}
                          fallbackChecks={recommendedChecks}
                          fallbackActions={recommendedActions}
                          onValidate={() =>
                            setHypothesisDecision(
                              hypothesis,
                              index,
                              "validated"
                            )
                          }
                          onReject={() =>
                            setHypothesisDecision(
                              hypothesis,
                              index,
                              "rejected"
                            )
                          }
                          onPartial={() =>
                            setHypothesisDecision(
                              hypothesis,
                              index,
                              "partial"
                            )
                          }
                        />
                      );
                    })}
                  </div>
                ) : (
                  <EmptyAnalysisState onAnalyze={runAnalysis} />
                )}
              </div>
            </section>
          </main>
        </section>

        <RcaNotification
          type={error ? "error" : "success"}
          message={error || successMessage}
          onClose={() => {
            setError("");
            setSuccessMessage("");
          }}
        />

        <GeneratedReportPanel
          open={reportOpen}
          report={report}
          analysis={analysis}
          ticketId={ticketId}
          onClose={() => setReportOpen(false)}
        />

        <FloatingRcaActions
          analysisReady={Boolean(analysis)}
          generatingReport={generatingReport}
          publishingRunbook={publishingRunbook}
          runbookReady={Boolean(runbook)}
          onGenerateReport={handleGenerateReport}
          onPublishRunbook={handlePublishRunbook}
          onOpenRunbook={() => navigate(`/runbooks?q=${ticketId}`)}
        />

        <style>{`
          @keyframes aiOrbit {
            from {
              transform: rotate(0deg);
            }
            to {
              transform: rotate(360deg);
            }
          }

          @keyframes scanLine {
            0% {
              transform: translateX(-25%);
              opacity: 0;
            }
            20% {
              opacity: 1;
            }
            100% {
              transform: translateX(125%);
              opacity: 0;
            }
          }
        `}</style>
      </div>
    </AppShell>
  );
}

function IncidentCaseFile({
  incident,
  predictedFamily,
  confidence,
  loadingPreview,
  onBack,
  onReAnalyze,
  loadingAnalysis,
}: {
  incident: IncidentSnapshot;
  predictedFamily: string;
  confidence: number;
  loadingPreview: boolean;
  onBack: () => void;
  onReAnalyze: () => void;
  loadingAnalysis: boolean;
}) {
  return (
    <section className="overflow-hidden rounded-[1.45rem] border border-orange-400/12 bg-[radial-gradient(circle_at_top_left,rgba(255,121,0,0.13),transparent_36%),linear-gradient(180deg,#15191f_0%,#0b1118_100%)] shadow-[0_24px_60px_rgba(0,0,0,0.28),inset_0_1px_0_rgba(255,255,255,0.035)]">
      <div className="border-b border-white/[0.06] p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-orange-400/14 bg-orange-500/10 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-orange-300">
              <FileText className="h-3.5 w-3.5" />
              Incident Case File
            </div>

            <h1 className="mt-4 text-[1.75rem] font-semibold tracking-[-0.06em] text-white">
              {incident.ticket}
            </h1>
          </div>

          {loadingPreview ? (
            <Loader2 className="h-4 w-4 animate-spin text-orange-300" />
          ) : (
            <Target className="h-5 w-5 text-orange-300/80" />
          )}
        </div>

        <p className="mt-3 text-sm leading-6 text-white/58">
          {sanitizeTitle(incident.title)}
        </p>
      </div>

      <div className="grid gap-px bg-white/[0.06]">
        <div className="grid grid-cols-2 gap-px bg-white/[0.06]">
          <CaseCell label="Priority" value={incident.priority} />
          <CaseCell label="Severity" value={incident.severity} />
          <CaseCell label="Site" value={incident.site} />
          <CaseCell label="Region" value={incident.region} />
          <CaseCell label="Technology" value={incident.technology} />
          <CaseCell label="Impact" value={incident.impact} />
        </div>

        <div className="bg-[rgba(255,255,255,0.018)] p-4">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/34">
            AI predicted family
          </p>

          <div className="mt-2 flex items-center justify-between gap-3">
            <p className="text-base font-semibold text-white">
              {predictedFamily}
            </p>
            <span className={confidenceBadgeClass(confidence)}>
              {confidence.toFixed(2)}%
            </span>
          </div>

          <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/[0.06]">
            <div
              className="h-full rounded-full bg-[linear-gradient(90deg,rgba(255,121,0,0.68),rgba(16,185,129,0.8))]"
              style={{ width: `${Math.min(100, confidence)}%` }}
            />
          </div>
        </div>
      </div>

      <div className="flex gap-2 p-4">
        <button
          onClick={onBack}
          className="premium-button-ghost orange-ring-focus flex-1 text-white/76 hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Incidents
        </button>

        <button
          onClick={onReAnalyze}
          disabled={loadingAnalysis}
          className="premium-button-ghost orange-ring-focus flex-1 text-white/76 hover:text-white disabled:opacity-50"
        >
          {loadingAnalysis ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
          Analyze
        </button>
      </div>
    </section>
  );
}

function CaseCell({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="min-h-[76px] bg-[rgba(255,255,255,0.018)] p-4">
      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/34">
        {label}
      </p>
      <p className="mt-2 text-sm font-semibold text-white">{value}</p>
    </div>
  );
}

function RiskCompact({ risk }: { risk: unknown }) {
  if (!risk) {
    return (
      <section className="rounded-[1.25rem] border border-white/[0.06] bg-[linear-gradient(180deg,#15191f_0%,#0b1118_100%)] p-4">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-white/35" />
          <p className="text-sm font-semibold text-white">Risk</p>
        </div>
        <p className="mt-2 text-sm leading-6 text-white/42">
          Risk assessment will appear after analysis.
        </p>
      </section>
    );
  }

  if (typeof risk === "string") {
    return (
      <section className="rounded-[1.25rem] border border-red-500/14 bg-red-500/8 p-4">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-red-300" />
          <p className="text-sm font-semibold text-red-100">Risk</p>
        </div>
        <p className="mt-2 text-sm leading-6 text-red-100/78">{risk}</p>
      </section>
    );
  }

  const riskObject = asRecord(risk);
  const level = String(riskObject.risk_level || "unknown");
  const score =
    typeof riskObject.risk_score === "number"
      ? riskObject.risk_score
      : undefined;
  const eta = String(riskObject.estimated_time_to_impact || "");

  const description = String(
    riskObject.impact_if_not_fixed ||
      riskObject.summary ||
      riskObject.impact ||
      riskObject.escalation_advice ||
      "Risk details returned by RCA backend."
  );

  return (
    <section className="rounded-[1.25rem] border border-red-500/14 bg-[radial-gradient(circle_at_top_left,rgba(239,68,68,0.15),transparent_38%),linear-gradient(180deg,#15191f_0%,#0b1118_100%)] p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-red-300" />
            <p className="text-sm font-semibold text-white">
              Risk if not fixed
            </p>
          </div>

          <h3 className="mt-3 text-xl font-semibold tracking-[-0.04em] text-red-200">
            {formatLabel(level)}
          </h3>
        </div>

        {score !== undefined ? (
          <span className="rounded-full border border-red-400/20 bg-red-500/12 px-3 py-1.5 text-sm font-semibold text-red-200">
            {score}
          </span>
        ) : null}
      </div>

      <p className="mt-3 text-sm leading-6 text-white/58">{description}</p>

      {eta ? (
        <div className="mt-3 rounded-[0.9rem] border border-white/[0.06] bg-white/[0.025] px-3 py-2 text-xs text-white/58">
          Time to impact:{" "}
          <span className="font-semibold text-white">{eta}</span>
        </div>
      ) : null}
    </section>
  );
}

function EngineerConclusionCard({
  selectedFamily,
  setSelectedFamily,
  engineerNotes,
  setEngineerNotes,
  tags,
  setTags,
  disabled,
  savingApproval,
  onSave,
}: {
  selectedFamily: string;
  setSelectedFamily: (value: string) => void;
  engineerNotes: string;
  setEngineerNotes: (value: string) => void;
  tags: string;
  setTags: (value: string) => void;
  disabled: boolean;
  savingApproval: boolean;
  onSave: () => void;
}) {
  return (
    <section className="overflow-hidden rounded-[1.25rem] border border-white/[0.06] bg-[linear-gradient(180deg,#15191f_0%,#0b1118_100%)] shadow-[0_22px_55px_rgba(0,0,0,0.22)]">
      <div className="border-b border-white/[0.06] p-4">
        <div className="flex items-center gap-2">
          <ClipboardCheck className="h-4 w-4 text-emerald-300" />
          <h2 className="text-sm font-semibold text-white">
            Engineer conclusion
          </h2>
        </div>
        <p className="mt-1 text-xs text-white/42">
          Save the validated RCA family and notes.
        </p>
      </div>

      <div className="space-y-3 p-4">
        <FieldLabel label="Approved family">
          <input
            value={selectedFamily}
            onChange={(event) => setSelectedFamily(event.target.value)}
            className="h-10 w-full rounded-[0.95rem] border border-white/10 bg-[#0b1219] px-4 text-sm text-white outline-none transition placeholder:text-white/25 focus:border-[#ff7900]/45 focus:bg-[#101925]"
            placeholder="Approved family"
          />
        </FieldLabel>

        <FieldLabel label="Engineer notes">
          <textarea
            value={engineerNotes}
            onChange={(event) => setEngineerNotes(event.target.value)}
            placeholder="Add engineer note, correction, or final conclusion..."
            className="min-h-[118px] w-full resize-none rounded-[1rem] border border-white/10 bg-[#0b1219] px-4 py-3 text-sm leading-6 text-white outline-none transition placeholder:text-white/25 focus:border-[#ff7900]/45 focus:bg-[#101925]"
          />
        </FieldLabel>

        <FieldLabel label="Runbook tags">
          <input
            value={tags}
            onChange={(event) => setTags(event.target.value)}
            className="h-10 w-full rounded-[0.95rem] border border-white/10 bg-[#0b1219] px-4 text-sm text-white outline-none transition placeholder:text-white/25 focus:border-[#ff7900]/45 focus:bg-[#101925]"
            placeholder="Tags separated by comma"
          />
        </FieldLabel>

        <button
          onClick={onSave}
          disabled={disabled}
          className="orange-ring-focus inline-flex w-full items-center justify-center gap-2 rounded-[1rem] border border-emerald-400/18 bg-emerald-500/12 px-4 py-3 text-sm font-semibold text-emerald-200 transition hover:bg-emerald-500/18 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {savingApproval ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <ShieldCheck className="h-4 w-4" />
          )}
          Save RCA decision
        </button>
      </div>
    </section>
  );
}

function FieldLabel({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.12em] text-white/38">
        {label}
      </span>
      {children}
    </label>
  );
}

function CauseCanvasHeader({
  ticketNumber,
  predictedFamily,
  confidence,
  loadingAnalysis,
  analysisReady,
  kpiInsights,
  extractedProblem,
}: {
  ticketNumber: string;
  predictedFamily: string;
  confidence: number;
  loadingAnalysis: boolean;
  analysisReady: boolean;
  kpiInsights: RcaKpiInsight[];
  extractedProblem: string;
}) {
  const topEvidence = kpiInsights.slice(0, 5);

  return (
    <header className="relative overflow-hidden border-b border-white/[0.07] bg-[radial-gradient(circle_at_top_left,rgba(255,121,0,0.12),transparent_42%),linear-gradient(180deg,rgba(255,255,255,0.035),rgba(255,255,255,0.012))] p-5">
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-[linear-gradient(90deg,transparent,rgba(255,121,0,0.45),transparent)]" />

      <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-2 rounded-full border border-orange-400/14 bg-orange-500/10 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-orange-300">
              <BrainCircuit className="h-3.5 w-3.5" />
              AI RCA Operation
            </span>

            <span
              className={[
                "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.14em]",
                analysisReady
                  ? "border-emerald-400/14 bg-emerald-500/10 text-emerald-300"
                  : "border-white/[0.08] bg-white/[0.04] text-white/42",
              ].join(" ")}
            >
              {loadingAnalysis ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Sparkles className="h-3.5 w-3.5" />
              )}
              {analysisReady ? "Analysis ready" : "Scanning"}
            </span>
          </div>

          <h1 className="mt-4 text-[1.65rem] font-semibold tracking-[-0.06em] text-white md:text-[2rem]">
            RCA mission for {ticketNumber}
          </h1>

          <div className="mt-4 rounded-[1.18rem] border border-orange-400/12 bg-[#0b1219]/70 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.025)]">
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-orange-300" />
              <p className="text-[11px] font-semibold uppercase tracking-[0.13em] text-orange-200/80">
                Problem extracted for RCA
              </p>
            </div>

            <p className="mt-3 max-w-5xl text-[0.95rem] leading-7 text-white/76">
              {extractedProblem}
            </p>
          </div>

          <p className="mt-3 max-w-4xl text-sm leading-6 text-white/46">
            The RCA backend enriches this incident with KPI context and ranks
            probable causes. The engineer validates the most relevant
            operational conclusion.
          </p>
        </div>

        <div className="shrink-0 rounded-[1.15rem] border border-orange-400/12 bg-[#0b1219]/75 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.025)]">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/34">
            Predicted cause
          </p>

          <div className="mt-2 flex items-center justify-between gap-4">
            <p className="text-xl font-semibold tracking-[-0.04em] text-white">
              {predictedFamily}
            </p>

            <span className={confidenceBadgeClass(confidence)}>
              {confidence.toFixed(2)}%
            </span>
          </div>

          <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/[0.06]">
            <div
              className="h-full rounded-full bg-[linear-gradient(90deg,rgba(255,121,0,0.68),rgba(16,185,129,0.8))]"
              style={{ width: `${Math.min(100, confidence)}%` }}
            />
          </div>
        </div>
      </div>

      <div className="mt-5 grid gap-3 xl:grid-cols-[1fr_1fr]">
        <AiOperationRail loading={loadingAnalysis} analysisReady={analysisReady} />

        <div className="rounded-[1.05rem] border border-white/[0.06] bg-white/[0.025] p-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-white/38">
            KPI evidence observed
          </p>

          {topEvidence.length ? (
            <div className="mt-3 flex flex-wrap gap-2">
              {topEvidence.map((item, index) => (
                <span
                  key={`evidence-${index}`}
                  className="rounded-full border border-white/[0.08] bg-white/[0.04] px-3 py-1.5 text-xs font-medium text-white/64"
                >
                  {formatKpiInsight(item, index)}
                </span>
              ))}
            </div>
          ) : (
            <p className="mt-3 text-sm leading-6 text-white/42">
              KPI evidence will appear after backend enrichment.
            </p>
          )}
        </div>
      </div>
    </header>
  );
}

function AiOperationRail({
  loading,
  analysisReady,
}: {
  loading: boolean;
  analysisReady: boolean;
}) {
  const steps = [
    "Incident retrieval",
    "KPI enrichment",
    "RCA model inference",
    "Engineer review",
  ];

  return (
    <div className="relative overflow-hidden rounded-[1.05rem] border border-orange-400/10 bg-[#0b1219]/70 p-4">
      <div className="pointer-events-none absolute inset-y-0 left-0 w-28 bg-[linear-gradient(90deg,rgba(255,121,0,0.08),transparent)]" />
      {loading ? (
        <div className="pointer-events-none absolute inset-y-0 left-0 w-1/3 bg-[linear-gradient(90deg,transparent,rgba(255,121,0,0.14),transparent)] animate-[scanLine_1.7s_ease-in-out_infinite]" />
      ) : null}

      <div className="flex items-center gap-2">
        <Radar
          className={[
            "h-4 w-4 text-orange-300",
            loading ? "animate-spin" : "",
          ].join(" ")}
        />
        <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-white/38">
          AI operation sequence
        </p>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2 md:grid-cols-4">
        {steps.map((step, index) => {
          const done = analysisReady || index < 3;

          return (
            <div
              key={step}
              className="rounded-[0.9rem] border border-white/[0.06] bg-white/[0.025] px-3 py-3"
            >
              <div className="flex items-center gap-2">
                {done ? (
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-300" />
                ) : (
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-orange-300" />
                )}
                <span className="text-[10px] font-semibold text-white/42">
                  STEP {index + 1}
                </span>
              </div>
              <p className="mt-2 text-xs font-medium text-white/70">{step}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function AiOperationLoading() {
  return (
    <div className="flex min-h-[460px] items-center justify-center rounded-[1.25rem] border border-orange-400/10 bg-[radial-gradient(circle_at_center,rgba(255,121,0,0.08),transparent_50%),linear-gradient(180deg,#0f151c_0%,#0a1016_100%)]">
      <div className="text-center">
        <div className="relative mx-auto flex h-24 w-24 items-center justify-center">
          <div className="absolute inset-0 rounded-full border border-orange-400/20 animate-[aiOrbit_2.4s_linear_infinite]" />
          <div className="absolute inset-3 rounded-full border border-dashed border-orange-300/20 animate-[aiOrbit_3.2s_linear_infinite_reverse]" />
          <div className="flex h-14 w-14 items-center justify-center rounded-[1.1rem] border border-orange-400/18 bg-orange-500/12 text-orange-200">
            <BrainCircuit className="h-6 w-6" />
          </div>
        </div>

        <h2 className="mt-5 text-lg font-semibold tracking-[-0.04em] text-white">
          AI operation running
        </h2>
        <p className="mt-2 max-w-md text-sm leading-6 text-white/45">
          Fetching incident context, matching KPI evidence and ranking probable
          root causes.
        </p>
      </div>
    </div>
  );
}

function EmptyAnalysisState({ onAnalyze }: { onAnalyze: () => void }) {
  return (
    <div className="flex min-h-[460px] items-center justify-center rounded-[1.25rem] border border-white/[0.06] bg-white/[0.025] px-6 text-center">
      <div>
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-[1.15rem] border border-orange-400/14 bg-orange-500/10 text-orange-300">
          <Zap className="h-6 w-6" />
        </div>
        <h2 className="mt-4 text-lg font-semibold tracking-[-0.04em] text-white">
          RCA operation not started
        </h2>
        <p className="mt-2 max-w-lg text-sm leading-6 text-white/44">
          Run analysis to generate hypotheses, checks and actions for this
          incident.
        </p>
        <button
          onClick={onAnalyze}
          className="orange-ring-focus mt-5 inline-flex items-center justify-center gap-2 rounded-[1rem] border border-orange-400/18 bg-orange-500/12 px-4 py-3 text-sm font-semibold text-orange-200 transition hover:bg-orange-500/18"
        >
          <BrainCircuit className="h-4 w-4" />
          Start AI analysis
        </button>
      </div>
    </div>
  );
}

function AiHypothesisOperation({
  hypothesis,
  index,
  decision,
  fallbackChecks,
  fallbackActions,
  onValidate,
  onReject,
  onPartial,
}: {
  hypothesis: RcaHypothesis;
  index: number;
  decision?: HypothesisDecision;
  fallbackChecks: string[];
  fallbackActions: string[];
  onValidate: () => void;
  onReject: () => void;
  onPartial: () => void;
}) {
  const family = getHypothesisFamily(hypothesis, index);

  const probability = normalizePercent(
    typeof hypothesis.probability === "number"
      ? hypothesis.probability
      : typeof hypothesis.probability_percent === "number"
        ? hypothesis.probability_percent
        : typeof (hypothesis as Record<string, unknown>).confidence === "number"
          ? ((hypothesis as Record<string, unknown>).confidence as number)
          : undefined
  );

  const hypothesisRecord = asRecord(hypothesis);

  const ownChecks = readStringArray(hypothesisRecord, [
    "suggested_checks",
    "recommended_checks",
    "checks",
    "approved_checks",
  ]);

  const ownActions = readStringArray(hypothesisRecord, [
    "suggested_actions",
    "recommended_actions",
    "actions",
    "approved_actions",
  ]);

  const checks = ownChecks ?? fallbackChecks;
  const actions = ownActions ?? fallbackActions;

  const explanation =
    readString(hypothesisRecord, ["explanation", "rationale", "description"]) ||
    (hypothesis.is_model_choice
      ? "This is the primary RCA candidate selected by the model."
      : "Alternative RCA hypothesis proposed for engineer review.");

  return (
    <article className="relative overflow-hidden rounded-[1.35rem] border border-orange-500/10 bg-[linear-gradient(180deg,#11171d_0%,#0b1118_100%)] shadow-[inset_0_1px_0_rgba(255,255,255,0.018),0_18px_45px_rgba(0,0,0,0.18)]">
      <div className="absolute bottom-7 left-[32px] top-[86px] w-px border-l border-dashed border-orange-300/14" />

      <div className="p-4 md:p-5">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div className="flex min-w-0 gap-4">
            <div className="relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-orange-400/18 bg-orange-500/12 text-sm font-bold text-orange-200 shadow-[0_0_0_6px_rgba(255,121,0,0.035)]">
              {index + 1}
            </div>

            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full border border-orange-400/14 bg-orange-500/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-orange-300">
                  Candidate Root Cause
                </span>

                {hypothesis.is_model_choice ? (
                  <span className="rounded-full border border-emerald-400/18 bg-emerald-500/12 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-emerald-200">
                    Model choice
                  </span>
                ) : null}

                {decision ? <DecisionBadge decision={decision} /> : null}
              </div>

              <h3 className="mt-3 text-[1.22rem] font-semibold tracking-[-0.04em] text-white">
                {family}
              </h3>

              <p className="mt-2 max-w-4xl text-sm leading-6 text-white/55">
                {explanation}
              </p>
            </div>
          </div>

          <div className="min-w-[135px] rounded-[1rem] border border-white/[0.06] bg-white/[0.025] px-3 py-3 text-center">
            <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-white/32">
              Confidence
            </p>
            <p className="mt-1 text-xl font-semibold text-white">
              {probability.toFixed(2)}%
            </p>
          </div>
        </div>

        <div className="ml-14 mt-4 h-2 overflow-hidden rounded-full bg-white/[0.06]">
          <div
            className="h-full rounded-full bg-[linear-gradient(90deg,rgba(255,121,0,0.72),rgba(16,185,129,0.75))]"
            style={{ width: `${Math.min(100, probability)}%` }}
          />
        </div>

        <div className="ml-14 mt-4 flex flex-wrap gap-2">
          <DecisionButton
            active={decision === "validated"}
            tone="good"
            onClick={onValidate}
            icon={<CheckCircle2 className="h-4 w-4" />}
          >
            Validate
          </DecisionButton>

          <DecisionButton
            active={decision === "rejected"}
            tone="bad"
            onClick={onReject}
            icon={<XCircle className="h-4 w-4" />}
          >
            Reject
          </DecisionButton>

          <DecisionButton
            active={decision === "partial"}
            tone="warning"
            onClick={onPartial}
            icon={<ShieldAlert className="h-4 w-4" />}
          >
            Partially correct
          </DecisionButton>
        </div>
      </div>

      <div className="grid gap-px bg-white/[0.06] xl:grid-cols-2">
        <OperationSubList
          title="Recommended checks"
          items={checks}
          empty="No checks returned for this candidate."
        />

        <OperationSubList
          title="Recommended actions"
          items={actions}
          empty="No actions returned for this candidate."
        />
      </div>
    </article>
  );
}

function OperationSubList({
  title,
  items,
  empty,
}: {
  title: string;
  items: string[];
  empty: string;
}) {
  return (
    <div className="bg-[rgba(255,255,255,0.018)] p-4">
      <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-white/38">
        {title}
      </p>

      {items.length ? (
        <div className="relative mt-3 space-y-2">
          <div className="absolute bottom-3 left-[10px] top-3 w-px border-l border-dashed border-white/10" />

          {items.map((item, index) => (
            <div
              key={`${title}-${item}-${index}`}
              className="relative flex gap-3 rounded-[0.95rem] border border-white/[0.06] bg-white/[0.025] px-3 py-3 transition hover:border-orange-400/12 hover:bg-white/[0.04]"
            >
              <span className="relative z-10 mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-orange-400/18 bg-[#11171d] text-[11px] font-bold text-orange-300">
                {index + 1}
              </span>

              <p className="text-sm leading-6 text-white/66">{item}</p>
            </div>
          ))}
        </div>
      ) : (
        <p className="mt-3 text-sm leading-6 text-white/42">{empty}</p>
      )}
    </div>
  );
}

function DecisionButton({
  children,
  icon,
  active,
  tone,
  onClick,
}: {
  children: ReactNode;
  icon: ReactNode;
  active: boolean;
  tone: "good" | "bad" | "warning";
  onClick: () => void;
}) {
  const activeClass =
    tone === "good"
      ? "border-emerald-400/20 bg-emerald-500/14 text-emerald-200"
      : tone === "bad"
        ? "border-red-400/20 bg-red-500/14 text-red-200"
        : "border-amber-400/20 bg-amber-500/14 text-amber-200";

  return (
    <button
      onClick={onClick}
      className={[
        "orange-ring-focus inline-flex items-center justify-center gap-2 rounded-[0.9rem] border px-3 py-2 text-xs font-semibold transition hover:-translate-y-[1px]",
        active
          ? activeClass
          : "border-white/[0.08] bg-white/[0.035] text-white/62 hover:bg-white/[0.07] hover:text-white",
      ].join(" ")}
    >
      {icon}
      {children}
    </button>
  );
}

function DecisionBadge({ decision }: { decision: HypothesisDecision }) {
  const label =
    decision === "validated"
      ? "Validated"
      : decision === "rejected"
        ? "Rejected"
        : "Partially correct";

  const cls =
    decision === "validated"
      ? "border-emerald-400/18 bg-emerald-500/12 text-emerald-200"
      : decision === "rejected"
        ? "border-red-400/18 bg-red-500/12 text-red-200"
        : "border-amber-400/18 bg-amber-500/12 text-amber-200";

  return (
    <span
      className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] ${cls}`}
    >
      {label}
    </span>
  );
}

function RcaNotification({
  type,
  message,
  onClose,
}: {
  type: "success" | "error";
  message: string;
  onClose: () => void;
}) {
  if (!message) return null;

  const isSuccess = type === "success";

  return (
    <div className="fixed right-5 top-5 z-[70] w-[min(420px,calc(100vw-2rem))]">
      <div
        className={[
          "rounded-[1.15rem] border px-4 py-3 shadow-[0_20px_55px_rgba(0,0,0,0.35)] backdrop-blur-xl",
          isSuccess
            ? "border-emerald-400/18 bg-[#06251d]/95 text-emerald-100"
            : "border-red-400/18 bg-[#2a0b0b]/95 text-red-100",
        ].join(" ")}
      >
        <div className="flex items-start gap-3">
          <div
            className={[
              "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-[0.8rem] border",
              isSuccess
                ? "border-emerald-400/18 bg-emerald-500/12"
                : "border-red-400/18 bg-red-500/12",
            ].join(" ")}
          >
            {isSuccess ? (
              <CheckCircle2 className="h-4 w-4" />
            ) : (
              <AlertTriangle className="h-4 w-4" />
            )}
          </div>

          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold">
              {isSuccess ? "RCA operation updated" : "RCA operation failed"}
            </p>
            <p className="mt-1 text-sm leading-5 opacity-80">{message}</p>
          </div>

          <button
            onClick={onClose}
            className="rounded-lg p-1 text-white/45 transition hover:bg-white/10 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

function GeneratedReportPanel({
  open,
  report,
  analysis,
  ticketId,
  onClose,
}: {
  open: boolean;
  report: RcaReport | null;
  analysis: RcaAnalysis | null;
  ticketId: string;
  onClose: () => void;
}) {
  if (!open) return null;

  const content =
    extractReportText(report) ||
    "Report generated successfully, but the backend did not return report content in the response.";

  async function copyReportText() {
    try {
      await navigator.clipboard.writeText(content);
    } catch {
      // Clipboard is optional.
    }
  }

  return (
    <div className="fixed inset-0 z-[65] flex items-end justify-center bg-black/70 px-4 py-5 backdrop-blur-md md:items-center">
      <style>{`
        @media print {
          body * {
            visibility: hidden !important;
          }

          .rca-report-print-zone,
          .rca-report-print-zone * {
            visibility: visible !important;
          }

          .rca-report-print-zone {
            position: absolute !important;
            inset: 0 !important;
            width: 100% !important;
            min-height: 100% !important;
            overflow: visible !important;
            background: white !important;
          }

          .rca-report-modal-shell,
          .rca-report-scroll-area {
            max-height: none !important;
            height: auto !important;
            overflow: visible !important;
            border: none !important;
            box-shadow: none !important;
            background: white !important;
          }

          .rca-report-noprint {
            display: none !important;
          }
        }
      `}</style>

      <section className="rca-report-modal-shell max-h-[91vh] w-full max-w-7xl overflow-hidden rounded-[1.5rem] border border-orange-400/16 bg-[linear-gradient(180deg,#111820_0%,#070b10_100%)] shadow-[0_28px_100px_rgba(0,0,0,0.62),inset_0_1px_0_rgba(255,255,255,0.05)]">
        <header className="rca-report-noprint flex flex-col gap-4 border-b border-white/[0.07] px-5 py-4 md:flex-row md:items-start md:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-orange-400/14 bg-orange-500/10 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-orange-300">
              <FileText className="h-3.5 w-3.5" />
              Executive RCA Report
            </div>

            <h2 className="mt-3 text-xl font-semibold tracking-[-0.04em] text-white">
              Generated report for {ticketId}
            </h2>

            <p className="mt-1 max-w-3xl text-sm leading-6 text-white/45">
              PDF-like RCA document with executive summary, AI prediction,
              degraded KPI evidence, risk projection, engineer validation and
              operational recommendations.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={copyReportText}
              className="rounded-[0.95rem] border border-white/[0.08] bg-white/[0.04] px-3 py-2 text-xs font-semibold text-white/68 transition hover:bg-white/[0.08] hover:text-white"
            >
              Copy text
            </button>

            <button
              onClick={() => window.print()}
              className="rounded-[0.95rem] border border-orange-400/18 bg-orange-500/12 px-3 py-2 text-xs font-semibold text-orange-200 transition hover:bg-orange-500/18"
            >
              Print / Save PDF
            </button>

            <button
              onClick={onClose}
              className="rounded-xl border border-white/[0.08] bg-white/[0.04] p-2 text-white/55 transition hover:bg-white/[0.08] hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </header>

        <div className="rca-report-scroll-area max-h-[78vh] overflow-auto bg-[#111820] px-3 py-5 md:px-6">
          <ProfessionalRcaReport
            content={content}
            report={report}
            analysis={analysis}
            ticketId={ticketId}
          />
        </div>
      </section>
    </div>
  );
}

function FloatingRcaActions({
  analysisReady,
  generatingReport,
  publishingRunbook,
  runbookReady,
  onGenerateReport,
  onPublishRunbook,
  onOpenRunbook,
}: {
  analysisReady: boolean;
  generatingReport: boolean;
  publishingRunbook: boolean;
  runbookReady: boolean;
  onGenerateReport: () => void;
  onPublishRunbook: () => void;
  onOpenRunbook: () => void;
}) {
  return (
    <div className="pointer-events-none fixed bottom-5 right-5 z-50 flex flex-col gap-2 sm:flex-row">
      <button
        onClick={onGenerateReport}
        disabled={!analysisReady || generatingReport}
        className="pointer-events-auto orange-ring-focus inline-flex items-center justify-center gap-2 rounded-[1.1rem] border border-orange-400/22 bg-[linear-gradient(180deg,rgba(255,121,0,0.28),rgba(255,121,0,0.14))] px-5 py-3 text-sm font-semibold text-orange-100 shadow-[0_18px_44px_rgba(0,0,0,0.42),0_12px_34px_rgba(255,121,0,0.16),inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-xl transition hover:-translate-y-[2px] hover:border-orange-300/35 hover:bg-orange-500/20 disabled:cursor-not-allowed disabled:opacity-45"
      >
        {generatingReport ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <FileText className="h-4 w-4" />
        )}
        Generate report
      </button>

      <button
        onClick={runbookReady ? onOpenRunbook : onPublishRunbook}
        disabled={!analysisReady || publishingRunbook}
        className="pointer-events-auto orange-ring-focus inline-flex items-center justify-center gap-2 rounded-[1.1rem] border border-emerald-400/22 bg-[linear-gradient(180deg,rgba(16,185,129,0.22),rgba(16,185,129,0.1))] px-5 py-3 text-sm font-semibold text-emerald-100 shadow-[0_18px_44px_rgba(0,0,0,0.42),0_12px_34px_rgba(16,185,129,0.12),inset_0_1px_0_rgba(255,255,255,0.07)] backdrop-blur-xl transition hover:-translate-y-[2px] hover:border-emerald-300/35 hover:bg-emerald-500/16 disabled:cursor-not-allowed disabled:opacity-45"
      >
        {publishingRunbook ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : runbookReady ? (
          <BookOpenCheck className="h-4 w-4" />
        ) : (
          <Save className="h-4 w-4" />
        )}
        {runbookReady ? "Open runbook" : "Publish runbook"}
      </button>
    </div>
  );
}

function RcaChartsPanel({ analysis }: { analysis: RcaAnalysis }) {
  const charts = asRecord(asRecord(analysis).charts);
  const hypotheses = asArray(charts.hypothesis_probability);
  const kpis = asArray(charts.kpi_evidence);
  const risk = asArray(charts.risk_timeline);

  const degradedKpis = kpis
    .map((item) => asRecord(item))
    .filter((item) => String(item.status || "").toLowerCase() === "degraded");

  const shownKpis = degradedKpis.length
    ? degradedKpis
    : kpis.map((item) => asRecord(item));

  if (!hypotheses.length && !kpis.length && !risk.length) return null;

  return (
    <div className="grid gap-3 border-b border-white/[0.06] bg-[#0b1118]/60 p-4 xl:grid-cols-3">
      <ChartCard
        title="Hypothesis probability"
        subtitle="Model ranking of probable RCA families"
      >
        <div className="space-y-3">
          {hypotheses.map((item, index) => {
            const record = asRecord(item);
            const label =
              readString(record, ["label", "name"]) || `Hypothesis ${index + 1}`;
            const value = readNumber(record, ["value", "probability"], 0);

            return (
              <MetricBar
                key={`${label}-${index}`}
                label={label}
                value={value}
                suffix="%"
                max={100}
                accent={index === 0 ? "primary" : "muted"}
              />
            );
          })}
        </div>
      </ChartCard>

      <ChartCard
        title="Most impacted KPIs"
        subtitle="Degraded indicators supporting the RCA"
      >
        <div className="space-y-3">
          {shownKpis.length ? (
            shownKpis.map((item, index) => {
              const label =
                readString(item, ["label", "name"]) || `KPI ${index + 1}`;
              const value = readNumber(item, ["value"], 0);
              const severity = readNumber(item, ["severity_score"], 0);
              const status = readString(item, ["status"]) || "unknown";

              return (
                <div
                  key={`${label}-${index}`}
                  className="rounded-[0.9rem] border border-white/[0.06] bg-white/[0.025] p-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-white">{label}</p>
                      <p className="mt-1 text-xs text-white/40">
                        Value:{" "}
                        <span className="text-white/70">
                          {formatNumber(value)}
                        </span>
                      </p>
                    </div>

                    <span
                      className={[
                        "rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.1em]",
                        status.toLowerCase() === "degraded"
                          ? "border-red-400/18 bg-red-500/12 text-red-200"
                          : "border-emerald-400/18 bg-emerald-500/12 text-emerald-200",
                      ].join(" ")}
                    >
                      {status}
                    </span>
                  </div>

                  <div className="mt-3">
                    <MetricBar
                      label="Impact score"
                      value={severity}
                      suffix="%"
                      max={100}
                      accent={
                        status.toLowerCase() === "degraded" ? "danger" : "good"
                      }
                    />
                  </div>
                </div>
              );
            })
          ) : (
            <p className="text-sm leading-6 text-white/42">
              No KPI chart data returned for this incident.
            </p>
          )}
        </div>
      </ChartCard>

      <ChartCard
        title="Risk timeline"
        subtitle="Projected operational impact if not fixed"
      >
        <div className="space-y-3">
          {risk.length ? (
            risk.map((item, index) => {
              const record = asRecord(item);
              const label =
                readString(record, ["label", "name"]) || `T+${index}`;
              const value = readNumber(
                record,
                ["risk_score", "value", "score"],
                0
              );

              return (
                <MetricBar
                  key={`${label}-${index}`}
                  label={label}
                  value={value}
                  suffix="/100"
                  max={100}
                  accent={
                    value >= 80 ? "danger" : value >= 60 ? "warning" : "good"
                  }
                />
              );
            })
          ) : (
            <p className="text-sm leading-6 text-white/42">
              No risk timeline returned for this incident.
            </p>
          )}
        </div>
      </ChartCard>
    </div>
  );
}

function ChartCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-[1.15rem] border border-white/[0.06] bg-[linear-gradient(180deg,rgba(255,255,255,0.035),rgba(255,255,255,0.015))] p-4">
      <div className="mb-4">
        <p className="text-sm font-semibold text-white">{title}</p>
        <p className="mt-1 text-xs leading-5 text-white/40">{subtitle}</p>
      </div>

      {children}
    </section>
  );
}

function MetricBar({
  label,
  value,
  suffix,
  max,
  accent,
}: {
  label: string;
  value: number;
  suffix: string;
  max: number;
  accent: "primary" | "muted" | "danger" | "warning" | "good";
}) {
  const width = Math.max(0, Math.min(100, (value / max) * 100));

  const color =
    accent === "danger"
      ? "bg-red-400"
      : accent === "warning"
        ? "bg-amber-400"
        : accent === "good"
          ? "bg-emerald-400"
          : accent === "primary"
            ? "bg-orange-400"
            : "bg-white/35";

  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between gap-3">
        <p className="truncate text-xs font-medium text-white/70">{label}</p>
        <p className="shrink-0 text-xs font-semibold text-white">
          {formatNumber(value)}
          {suffix}
        </p>
      </div>

      <div className="h-2 overflow-hidden rounded-full bg-white/[0.07]">
        <div
          className={`h-full rounded-full ${color}`}
          style={{ width: `${width}%` }}
        />
      </div>
    </div>
  );
}

function ProfessionalRcaReport({
  content,
  report,
  analysis,
  ticketId,
}: {
  content: string;
  report: RcaReport | null;
  analysis: RcaAnalysis | null;
  ticketId: string;
}) {
  const parsed = parseRcaReport(content);
  const reportRecord = asRecord(report);
  const generatedAt =
    readString(reportRecord, ["generated_at", "created_at"]) ||
    new Date().toISOString();

  const chartPayload = getReportChartPayload(analysis);
  const degradedKpis = chartPayload.kpis.filter(
    (item) => String(item.status || "").toLowerCase() === "degraded"
  );
  const shownKpis = degradedKpis.length ? degradedKpis : chartPayload.kpis;

  const predictedFamily =
    readString(asRecord(analysis), ["predicted_family"]) ||
    getReportMetaValue(parsed.meta, [
      "Chosen hypothesis",
      "Model predicted family",
    ]) ||
    "N/A";

  const confidence = normalizePercent(
    readNumber(asRecord(analysis), ["confidence"], 0)
  );

  const riskMax = chartPayload.risk.reduce((max, item) => {
    const value = readNumber(item, ["risk_score", "value", "score"], 0);
    return Math.max(max, value);
  }, 0);

  return (
    <article className="rca-report-print-zone mx-auto w-full max-w-[980px] rounded-[1.4rem] bg-[#f8fafc] p-4 text-slate-900 shadow-[0_28px_80px_rgba(0,0,0,0.38)] md:p-8">
      <section className="overflow-hidden rounded-[1.1rem] border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 bg-[linear-gradient(135deg,#111827_0%,#1f2937_60%,#ff7900_160%)] p-6 text-white">
          <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-orange-300">
                Service Management Center / NOC
              </p>

              <h1 className="mt-3 text-3xl font-bold tracking-[-0.06em]">
                Executive RCA Report
              </h1>

              <p className="mt-3 max-w-2xl text-sm leading-6 text-white/70">
                AI-assisted root cause analysis report generated from incident
                context, KPI evidence, model hypotheses, engineer validation and
                operational risk assessment.
              </p>
            </div>

            <div className="rounded-[1rem] border border-white/10 bg-white/10 p-4 text-right backdrop-blur">
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-white/45">
                Ticket ID
              </p>
              <p className="mt-1 text-xl font-bold text-white">{ticketId}</p>
              <p className="mt-3 text-xs text-white/55">
                Generated: {formatReportDate(generatedAt)}
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-px bg-slate-200 md:grid-cols-4">
          <ReportCoverStat
            label="Approved / Predicted RCA"
            value={predictedFamily}
          />
          <ReportCoverStat
            label="Model confidence"
            value={confidence ? `${confidence.toFixed(2)}%` : "N/A"}
          />
          <ReportCoverStat
            label="Impacted KPI signals"
            value={String(shownKpis.length)}
          />
          <ReportCoverStat
            label="Max risk score"
            value={riskMax ? `${formatNumber(riskMax)}/100` : "N/A"}
          />
        </div>
      </section>

      <section className="mt-5 grid gap-5 xl:grid-cols-[0.95fr_1.05fr]">
        <div className="space-y-5">
          <PaperSection
            label="01"
            title="Executive decision summary"
            subtitle="High-level RCA result for operational review"
          >
            <div className="rounded-[1rem] border border-orange-200 bg-orange-50 p-4">
              <p className="text-sm leading-7 text-slate-700">
                The RCA engine analyzed the incident and ranked the most probable
                root cause family as{" "}
                <span className="font-bold text-slate-950">
                  {predictedFamily}
                </span>
                {confidence ? (
                  <>
                    {" "}
                    with a model confidence of{" "}
                    <span className="font-bold text-slate-950">
                      {confidence.toFixed(2)}%
                    </span>
                    .
                  </>
                ) : (
                  "."
                )}{" "}
                The KPI evidence and operational recommendations below support
                the engineer validation and the final report conclusion.
              </p>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {parsed.meta.slice(0, 8).map((item) => (
                <div
                  key={item.label}
                  className="rounded-[0.9rem] border border-slate-200 bg-slate-50 px-3 py-2"
                >
                  <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">
                    {item.label}
                  </p>
                  <p className="mt-1 text-sm font-semibold text-slate-900">
                    {item.value}
                  </p>
                </div>
              ))}
            </div>
          </PaperSection>

          <PaperSection
            label="02"
            title="AI hypothesis ranking"
            subtitle="Probability distribution of RCA candidates"
          >
            <div className="space-y-3">
              {chartPayload.hypotheses.length ? (
                chartPayload.hypotheses.slice(0, 5).map((item, index) => {
                  const label =
                    readString(item, ["label", "name"]) ||
                    `Hypothesis ${index + 1}`;
                  const value = readNumber(item, ["value", "probability"], 0);

                  return (
                    <PaperMetricBar
                      key={`${label}-${index}`}
                      label={label}
                      value={value}
                      suffix="%"
                      max={100}
                      tone={index === 0 ? "orange" : "slate"}
                    />
                  );
                })
              ) : (
                <PaperEmptyText>No hypothesis chart data available.</PaperEmptyText>
              )}
            </div>
          </PaperSection>
        </div>

        <PaperSection
          label="03"
          title="Degraded KPI evidence"
          subtitle="Most affected indicators that support the RCA decision"
        >
          <ReportKpiEvidenceChart items={shownKpis.slice(0, 6)} />
        </PaperSection>
      </section>

      <section className="mt-5 grid gap-5 xl:grid-cols-2">
        <PaperSection
          label="04"
          title="Risk projection"
          subtitle="Operational risk evolution if the issue is not fixed"
        >
          <div className="space-y-3">
            {chartPayload.risk.length ? (
              chartPayload.risk.slice(0, 6).map((item, index) => {
                const label =
                  readString(item, ["label", "name"]) || `Stage ${index + 1}`;
                const value = readNumber(
                  item,
                  ["risk_score", "value", "score"],
                  0
                );

                return (
                  <PaperMetricBar
                    key={`${label}-${index}`}
                    label={label}
                    value={value}
                    suffix="/100"
                    max={100}
                    tone={value >= 80 ? "red" : value >= 60 ? "orange" : "green"}
                  />
                );
              })
            ) : (
              <PaperEmptyText>No risk timeline chart data available.</PaperEmptyText>
            )}
          </div>
        </PaperSection>

        <PaperSection
          label="05"
          title="KPI interpretation"
          subtitle="Engineering reading of the affected indicators"
        >
          <div className="space-y-3">
            {shownKpis.length ? (
              shownKpis.slice(0, 4).map((item, index) => {
                const label =
                  readString(item, ["label", "name"]) || `KPI ${index + 1}`;
                const value = readNumber(item, ["value"], 0);
                const severity = readNumber(item, ["severity_score"], 0);
                const status = readString(item, ["status"]) || "unknown";

                return (
                  <div
                    key={`${label}-interpretation-${index}`}
                    className="rounded-[1rem] border border-slate-200 bg-slate-50 p-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-bold text-slate-950">
                          {label}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          Observed value:{" "}
                          <span className="font-semibold text-slate-800">
                            {formatNumber(value)}
                          </span>
                        </p>
                      </div>

                      <span
                        className={[
                          "rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.1em]",
                          status.toLowerCase() === "degraded"
                            ? "border-red-200 bg-red-50 text-red-700"
                            : "border-emerald-200 bg-emerald-50 text-emerald-700",
                        ].join(" ")}
                      >
                        {status}
                      </span>
                    </div>

                    <p className="mt-3 text-xs leading-5 text-slate-500">
                      RCA contribution estimated at{" "}
                      <span className="font-bold text-slate-800">
                        {formatNumber(severity)}%
                      </span>
                      . This KPI is used as supporting evidence in the final RCA
                      validation.
                    </p>
                  </div>
                );
              })
            ) : (
              <PaperEmptyText>No KPI interpretation data available.</PaperEmptyText>
            )}
          </div>
        </PaperSection>
      </section>

      <section className="mt-5 space-y-5">
        {parsed.sections.map((section) => (
          <PaperReportSection key={section.title} section={section} />
        ))}
      </section>

      <footer className="mt-6 rounded-[1rem] border border-slate-200 bg-white px-5 py-4 text-xs text-slate-500">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <p>
            Generated by the intelligent RCA module for SMC/NOC operational
            support.
          </p>
          <p>Ticket: {ticketId}</p>
        </div>
      </footer>

      <details className="rca-report-noprint mt-5 rounded-[1rem] border border-slate-200 bg-white p-4">
        <summary className="cursor-pointer text-sm font-semibold text-slate-700">
          Show raw report text
        </summary>
        <pre className="mt-4 whitespace-pre-wrap rounded-[1rem] bg-slate-950 p-4 text-xs leading-6 text-slate-200">
          {content}
        </pre>
      </details>
    </article>
  );
}

function ReportCoverStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white p-4">
      <p className="text-[10px] font-bold uppercase tracking-[0.13em] text-slate-400">
        {label}
      </p>
      <p className="mt-2 truncate text-base font-bold text-slate-950">
        {value}
      </p>
    </div>
  );
}

function PaperSection({
  label,
  title,
  subtitle,
  children,
}: {
  label: string;
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-[1.1rem] border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-start gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-orange-500 text-sm font-bold text-white">
          {label}
        </span>

        <div>
          <h2 className="text-lg font-bold tracking-[-0.03em] text-slate-950">
            {title}
          </h2>
          <p className="mt-1 text-xs leading-5 text-slate-500">{subtitle}</p>
        </div>
      </div>

      {children}
    </section>
  );
}

function PaperReportSection({
  section,
}: {
  section: {
    number: string;
    title: string;
    lines: string[];
  };
}) {
  return (
    <section className="rounded-[1.1rem] border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-start gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-900 text-sm font-bold text-white">
          {section.number || "•"}
        </span>

        <div>
          <h2 className="text-lg font-bold tracking-[-0.03em] text-slate-950">
            {section.title}
          </h2>
          <p className="mt-1 text-xs leading-5 text-slate-500">
            Structured report section generated by the RCA workflow.
          </p>
        </div>
      </div>

      <PaperReportSectionBody section={section} />
    </section>
  );
}

function PaperReportSectionBody({
  section,
}: {
  section: {
    number: string;
    title: string;
    lines: string[];
  };
}) {
  const cleanedLines = section.lines
    .map((line) => line.trim())
    .filter(Boolean);

  const numberedItems = cleanedLines.filter((line) => /^\d+\.\s+/.test(line));
  const bulletItems = cleanedLines.filter((line) => line.startsWith("- "));
  const plainLines = cleanedLines.filter(
    (line) => !/^\d+\.\s+/.test(line) && !line.startsWith("- ")
  );

  const isMostlyNumberedList =
    numberedItems.length >= 2 && numberedItems.length >= bulletItems.length;

  const isMostlyBulletList =
    bulletItems.length >= 2 && bulletItems.length > numberedItems.length;

  return (
    <div className="space-y-4">
      {plainLines.length ? (
        <div className="space-y-2">
          {plainLines.map((line, index) => (
            <p
              key={`${section.title}-plain-${index}`}
              className="text-sm leading-7 text-slate-700"
            >
              {line}
            </p>
          ))}
        </div>
      ) : null}

      {isMostlyNumberedList ? (
        <div className="rounded-[1rem] border border-slate-200 bg-slate-50 p-3">
          <div className="space-y-2">
            {numberedItems.map((item, index) => {
              const match = item.match(/^(\d+)\.\s+(.+)$/);
              const number = match?.[1] ?? String(index + 1);
              const text = match?.[2] ?? item;

              return (
                <div
                  key={`${section.title}-ordered-${index}`}
                  className="flex items-start gap-3 rounded-[0.85rem] border border-slate-200 bg-white px-3 py-3"
                >
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-orange-500 text-xs font-bold text-white">
                    {number}
                  </span>
                  <p className="pt-0.5 text-sm leading-6 text-slate-700">
                    {text}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      ) : null}

      {isMostlyBulletList ? (
        <div className="rounded-[1rem] border border-slate-200 bg-slate-50 p-3">
          <div className="space-y-2">
            {bulletItems.map((item, index) => (
              <div
                key={`${section.title}-bullet-${index}`}
                className="flex items-start gap-3 rounded-[0.85rem] border border-slate-200 bg-white px-3 py-3"
              >
                <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-orange-500" />
                <p className="text-sm leading-6 text-slate-700">
                  {item.slice(2)}
                </p>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {!isMostlyNumberedList && !isMostlyBulletList && !plainLines.length ? (
        <div className="space-y-2">
          {cleanedLines.map((line, index) => (
            <p
              key={`${section.title}-fallback-${index}`}
              className="text-sm leading-7 text-slate-700"
            >
              {line}
            </p>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function ReportKpiEvidenceChart({
  items,
}: {
  items: Record<string, unknown>[];
}) {
  if (!items.length) {
    return (
      <PaperEmptyText>
        No degraded KPI data was returned for this incident.
      </PaperEmptyText>
    );
  }

  return (
    <div className="space-y-3">
      {items.map((item, index) => {
        const label = readString(item, ["label", "name"]) || `KPI ${index + 1}`;
        const value = readNumber(item, ["value"], 0);
        const severity = readNumber(item, ["severity_score"], 0);
        const status = readString(item, ["status"]) || "unknown";

        return (
          <div
            key={`${label}-${index}`}
            className="rounded-[1rem] border border-slate-200 bg-slate-50 p-4"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-bold text-slate-950">{label}</p>
                <p className="mt-1 text-xs text-slate-500">
                  Observed value:{" "}
                  <span className="font-semibold text-slate-800">
                    {formatNumber(value)}
                  </span>
                </p>
              </div>

              <span
                className={[
                  "rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.1em]",
                  status.toLowerCase() === "degraded"
                    ? "border-red-200 bg-red-50 text-red-700"
                    : "border-emerald-200 bg-emerald-50 text-emerald-700",
                ].join(" ")}
              >
                {status}
              </span>
            </div>

            <div className="mt-4">
              <PaperMetricBar
                label="KPI impact contribution"
                value={severity}
                suffix="%"
                max={100}
                tone={status.toLowerCase() === "degraded" ? "red" : "green"}
              />
            </div>

            <div className="mt-3 rounded-[0.85rem] border border-slate-200 bg-white px-3 py-2">
              <p className="text-xs leading-5 text-slate-500">
                This KPI is considered a supporting signal for the RCA decision.
                Higher contribution means stronger evidence in the generated
                diagnostic report.
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function PaperMetricBar({
  label,
  value,
  suffix,
  max,
  tone,
}: {
  label: string;
  value: number;
  suffix: string;
  max: number;
  tone: "orange" | "red" | "green" | "slate";
}) {
  const width = Math.max(0, Math.min(100, (value / max) * 100));

  const color =
    tone === "red"
      ? "bg-red-500"
      : tone === "green"
        ? "bg-emerald-500"
        : tone === "orange"
          ? "bg-orange-500"
          : "bg-slate-400";

  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between gap-3">
        <p className="truncate text-xs font-semibold text-slate-600">{label}</p>
        <p className="shrink-0 text-xs font-bold text-slate-950">
          {formatNumber(value)}
          {suffix}
        </p>
      </div>

      <div className="h-2.5 overflow-hidden rounded-full bg-slate-200">
        <div
          className={`h-full rounded-full ${color}`}
          style={{ width: `${width}%` }}
        />
      </div>
    </div>
  );
}

function PaperEmptyText({ children }: { children: ReactNode }) {
  return (
    <p className="rounded-[0.9rem] border border-slate-200 bg-slate-50 px-3 py-3 text-sm leading-6 text-slate-500">
      {children}
    </p>
  );
}

function normalizePercent(value?: number) {
  if (typeof value !== "number" || Number.isNaN(value)) return 0;
  if (value <= 1) return value * 100;
  return value;
}

function getHypothesisKey(hypothesis: RcaHypothesis, index: number) {
  return `${getHypothesisFamily(hypothesis, index)}-${index}`;
}

function getHypothesisFamily(hypothesis: RcaHypothesis, index: number) {
  return String(
    hypothesis.family ||
      (hypothesis as Record<string, unknown>).label ||
      (hypothesis as Record<string, unknown>).hypothesis ||
      `Hypothesis ${index + 1}`
  );
}

function getApprovalStatus(decisions: Record<string, HypothesisDecision>) {
  const values = Object.values(decisions);

  if (values.includes("validated")) return "approved";
  if (values.includes("partial")) return "partially_correct";
  if (values.includes("rejected")) return "rejected";

  return "approved";
}

function confidenceBadgeClass(confidence: number) {
  if (confidence >= 90) {
    return "rounded-full border border-emerald-400/18 bg-emerald-500/12 px-3 py-1.5 text-sm font-semibold text-emerald-200";
  }

  if (confidence >= 70) {
    return "rounded-full border border-orange-400/18 bg-orange-500/12 px-3 py-1.5 text-sm font-semibold text-orange-200";
  }

  return "rounded-full border border-amber-400/18 bg-amber-500/12 px-3 py-1.5 text-sm font-semibold text-amber-200";
}

function sanitizeTitle(input: string) {
  return String(input || "")
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .trim();
}

function formatLabel(value: string) {
  return value.replace(/_/g, " ");
}

function asRecord(value: unknown): Record<string, unknown> {
  return typeof value === "object" && value !== null
    ? (value as Record<string, unknown>)
    : {};
}

function isPrimitive(value: unknown) {
  return (
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  );
}

function readString(record: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = record[key];

    if (value !== undefined && value !== null && value !== "") {
      if (isPrimitive(value)) {
        return String(value);
      }
    }
  }

  return "";
}

function readStringArray(record: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = record[key];

    if (Array.isArray(value)) {
      return value
        .filter((item) => item !== undefined && item !== null && item !== "")
        .map((item) => (isPrimitive(item) ? String(item) : ""))
        .filter(Boolean);
    }

    if (isPrimitive(value) && String(value).trim()) {
      return [String(value)];
    }
  }

  return null;
}

function getIncidentContextValue(
  analysis: RcaAnalysis | null,
  preview: RcaPreview | null,
  selectedIncident: unknown,
  keys: string[],
  fallback = "—"
) {
  const analysisRecord = asRecord(analysis);
  const previewRecord = asRecord(preview);
  const selectedRecord = asRecord(selectedIncident);

  const analysisContext = asRecord(analysisRecord.incident_context);
  const previewContext = asRecord(previewRecord.incident_context);

  const candidates = [
    analysisContext,
    previewContext,
    analysisRecord,
    previewRecord,
    asRecord(analysisRecord.payload),
    asRecord(previewRecord.payload),
    asRecord(analysisRecord.source_incident),
    asRecord(previewRecord.source_incident),
    asRecord(analysisRecord.dataset_context),
    asRecord(previewRecord.dataset_context),
    asRecord(analysisRecord.kpi_context),
    asRecord(previewRecord.kpi_context),
    selectedRecord,
  ];

  for (const candidate of candidates) {
    const value = readString(candidate, keys);
    if (value) return value;
  }

  return fallback;
}

function extractReportText(report: RcaReport | null | undefined) {
  if (!report) return "";

  return (
    readString(asRecord(report), [
      "report_text",
      "report_content",
      "content",
      "final_conclusion",
      "draft_report",
    ]) || ""
  );
}

function formatKpiInsight(item: RcaKpiInsight, index: number) {
  if (typeof item === "string") return item;

  const record = asRecord(item);

  return (
    readString(record, [
      "evidence",
      "interpretation",
      "name",
      "kpi_name",
      "status",
      "severity",
    ]) || `KPI ${index + 1}`
  );
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function readNumber(
  record: Record<string, unknown>,
  keys: string[],
  fallback = 0
) {
  for (const key of keys) {
    const value = record[key];

    if (typeof value === "number" && Number.isFinite(value)) {
      return value;
    }

    if (typeof value === "string" && value.trim()) {
      const parsed = Number(value);
      if (Number.isFinite(parsed)) return parsed;
    }
  }

  return fallback;
}

function formatNumber(value: number) {
  if (!Number.isFinite(value)) return "0";
  if (Math.abs(value) >= 100) return value.toFixed(0);
  if (Math.abs(value) >= 10) return value.toFixed(1);
  return value.toFixed(2);
}

function getReportChartPayload(analysis: RcaAnalysis | null) {
  const analysisRecord = asRecord(analysis);
  const charts = asRecord(analysisRecord.charts);

  let hypotheses = asArray(charts.hypothesis_probability).map(asRecord);
  const kpis = asArray(charts.kpi_evidence).map(asRecord);
  let risk = asArray(charts.risk_timeline).map(asRecord);

  if (!hypotheses.length && Array.isArray(analysis?.top_hypotheses)) {
    hypotheses = analysis.top_hypotheses.map((item, index) => {
      const record = asRecord(item);
      const family =
        readString(record, ["family", "label", "hypothesis"]) ||
        `Hypothesis ${index + 1}`;

      const probability = normalizePercent(
        readNumber(record, ["probability", "probability_percent", "confidence"], 0)
      );

      return {
        label: family,
        value: probability,
        probability,
      };
    });
  }

  if (!risk.length) {
    const riskObject = asRecord(analysisRecord.risk_if_not_fixed);
    const riskScore = readNumber(riskObject, ["risk_score", "score"], 0);

    if (riskScore) {
      risk = [
        { label: "Now", value: riskScore },
        { label: "+4h", value: Math.min(100, riskScore + 8) },
        { label: "+12h", value: Math.min(100, riskScore + 14) },
        { label: "+24h", value: Math.min(100, riskScore + 20) },
      ];
    }
  }

  return {
    hypotheses,
    kpis,
    risk,
  };
}

function getReportMetaValue(
  meta: { label: string; value: string }[],
  labels: string[]
) {
  const normalizedLabels = labels.map((item) => item.trim().toLowerCase());

  const found = meta.find((item) =>
    normalizedLabels.includes(item.label.trim().toLowerCase())
  );

  return found?.value || "";
}

function formatReportDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString();
}

function parseRcaReport(content: string) {
  const lines = content.split(/\r?\n/).map((line) => line.trimEnd());

  const firstNonEmpty =
    lines.find((line) => line.trim()) || "Final RCA Report";

  const meta: { label: string; value: string }[] = [];

  const firstSectionIndex = lines.findIndex((line) =>
    isTopLevelReportSection(line)
  );

  const metaLines = lines.slice(
    0,
    firstSectionIndex > -1 ? firstSectionIndex : 8
  );

  for (const line of metaLines) {
    const match = line.match(/^([^:]+):\s*(.+)$/);

    if (match) {
      meta.push({
        label: match[1].trim(),
        value: match[2].trim(),
      });
    }
  }

  const bodyLines =
    firstSectionIndex > -1 ? lines.slice(firstSectionIndex) : lines;

  const sections: {
    number: string;
    title: string;
    lines: string[];
  }[] = [];

  let current:
    | {
        number: string;
        title: string;
        lines: string[];
      }
    | null = null;

  for (const line of bodyLines) {
    const trimmed = line.trim();
    const sectionMatch = trimmed.match(/^(\d+)\.\s+(.+)$/);

    if (sectionMatch && isTopLevelReportSection(trimmed)) {
      if (current) sections.push(current);

      current = {
        number: sectionMatch[1],
        title: sectionMatch[2].trim(),
        lines: [],
      };

      continue;
    }

    if (current) {
      current.lines.push(line);
    }
  }

  if (current) sections.push(current);

  return {
    title: firstNonEmpty,
    meta,
    sections: sections.length
      ? sections
      : [
          {
            number: "",
            title: "Report content",
            lines,
          },
        ],
  };
}

function isTopLevelReportSection(line: string) {
  const match = line.trim().match(/^(\d+)\.\s+(.+)$/);

  if (!match) return false;

  const title = match[2].trim().toLowerCase();

  const knownSectionTitles = [
    "incident description",
    "approved root cause",
    "top model hypotheses",
    "kpi evidence and supporting signals",
    "engineer validation",
    "recommended checks / diagnostic steps",
    "recommended actions / steps to follow",
    "risk if not fixed",
    "chart data guidance",
    "final conclusion",
  ];

  return knownSectionTitles.some((sectionTitle) =>
    title.startsWith(sectionTitle)
  );
}