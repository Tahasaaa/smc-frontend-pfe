import type { EmailTemplate, InternalEmail, MailParticipant } from "@/types/email";

const nocEngineer: MailParticipant = {
  name: "Taha Sadraoui",
  email: "taha.sadraoui@orange.tn",
  role: "NOC Engineer",
};

const operationsLead: MailParticipant = {
  name: "Operations Lead",
  email: "ops.lead@orange.tn",
  role: "Network Operations",
};

const fieldTeam: MailParticipant = {
  name: "Field Intervention Team",
  email: "field.team@orange.tn",
  role: "Field Operations",
};

const stakeholderGroup: MailParticipant = {
  name: "Service Stakeholders",
  email: "service.stakeholders@orange.tn",
  role: "Business Stakeholders",
};

const rcaTeam: MailParticipant = {
  name: "RCA Coordination",
  email: "rca.coordination@orange.tn",
  role: "RCA Team",
};

function minutesAgo(minutes: number) {
  return new Date(Date.now() - minutes * 60 * 1000).toISOString();
}

export const mockInternalEmails: InternalEmail[] = [
  {
    id: "mail-inbox-001",
    folder: "inbox",
    status: "unread",
    priority: "critical",
    source: "incident",
    subject: "Critical 3G service degradation requires immediate review",
    preview:
      "A high-impact degradation has been detected in the active 3G scope. Please review the affected region and validate next actions.",
    body:
      "Hello NOC team,\n\nA critical 3G service degradation has been detected in the active operational scope. Current indicators suggest a severe quality drop with customer-facing impact.\n\nPlease review the incident context, validate the affected sites, and prepare an initial stakeholder communication once the technical assessment is confirmed.\n\nRecommended next steps:\n- Inspect the incident details\n- Validate KPI trend behavior\n- Confirm impacted region and site scope\n- Prepare a short operational update\n\nRegards,\nOperations Command",
    from: operationsLead,
    to: [nocEngineer],
    createdAt: minutesAgo(8),
    tags: ["incident", "critical", "3g"],
    starred: true,
    attachments: [
      {
        id: "att-001",
        name: "incident-impact-summary.pdf",
        type: "pdf",
        sizeLabel: "420 KB",
      },
    ],
    context: {
      incidentId: 1,
      incidentTicket: "INC-3G-1042",
      technology: "3G",
      regionCode: "TUN",
      siteName: "Tunis Core Area",
      impactSummary:
        "High-impact service degradation in the active 3G scope with critical customer-facing risk.",
      rootCauseSummary:
        "Root cause is not confirmed yet. Initial monitoring suggests congestion and access instability.",
      actionPlan: [
        "Validate KPI behavior in monitoring workspace",
        "Inspect incident metadata",
        "Coordinate with field and transmission teams",
        "Prepare stakeholder communication",
      ],
    },
  },
  {
    id: "mail-inbox-002",
    folder: "inbox",
    status: "unread",
    priority: "high",
    source: "monitoring",
    subject: "Monitoring threshold breach: IUB congestion watch",
    preview:
      "IUB congestion crossed the configured watch threshold. Monitoring review is recommended before escalation.",
    body:
      "Hello,\n\nThe monitoring layer detected an IUB congestion threshold breach in the current 3G operational scope.\n\nThis does not yet confirm a full incident escalation, but the behavior should be reviewed against trend history and regional traffic pressure.\n\nSuggested review:\n- Check KPI trend window\n- Compare congestion with call setup success behavior\n- Confirm whether degradation is localized or regional\n\nRegards,\nMonitoring Automation",
    from: {
      name: "Monitoring Automation",
      email: "monitoring.system@orange.tn",
      role: "System",
    },
    to: [nocEngineer],
    createdAt: minutesAgo(32),
    tags: ["monitoring", "threshold", "iub"],
    context: {
      technology: "3G",
      regionCode: "SFX",
      impactSummary:
        "IUB congestion watch threshold exceeded. Requires review before escalation.",
      actionPlan: [
        "Open monitoring workspace",
        "Check congestion trend",
        "Compare with CSSR and throughput indicators",
      ],
    },
  },
  {
    id: "mail-draft-001",
    folder: "drafts",
    status: "draft",
    priority: "high",
    source: "ai",
    subject: "Draft: Stakeholder update for 3G degradation",
    preview:
      "AI-prepared draft for stakeholder communication. Needs engineer validation before sending.",
    body:
      "Hello,\n\nWe are currently investigating a 3G service degradation affecting part of the monitored operational scope.\n\nInitial assessment indicates a potential congestion-related issue with visible impact on service quality. Technical teams are reviewing KPI behavior and incident evidence to confirm the root cause.\n\nWe will provide an updated communication once the investigation confirms the action plan and estimated recovery status.\n\nRegards,\nNetwork Operations Center",
    from: nocEngineer,
    to: [stakeholderGroup],
    cc: [operationsLead],
    createdAt: minutesAgo(58),
    updatedAt: minutesAgo(18),
    tags: ["ai-draft", "stakeholder", "incident"],
    aiGenerated: true,
    context: {
      incidentId: 1,
      incidentTicket: "INC-3G-1042",
      technology: "3G",
      impactSummary:
        "Stakeholder-ready draft for current 3G degradation incident.",
    },
  },
  {
    id: "mail-sent-001",
    folder: "sent",
    status: "sent",
    priority: "normal",
    source: "manual",
    subject: "Daily NOC handover summary",
    preview:
      "Summary of active incidents, monitoring watchpoints, and pending RCA items for the next shift.",
    body:
      "Hello team,\n\nPlease find below the NOC handover summary for the current shift.\n\nActive focus areas:\n- 3G service posture remains under review\n- Incident queue requires continued severity-first monitoring\n- RCA follow-up package is pending for previous degradation event\n\nNo 4G or 5G operational scope should be treated as live until the related data layer is ready.\n\nRegards,\nTaha",
    from: nocEngineer,
    to: [operationsLead],
    cc: [fieldTeam],
    createdAt: minutesAgo(180),
    tags: ["handover", "noc", "daily"],
  },
  {
    id: "mail-inbox-003",
    folder: "inbox",
    status: "read",
    priority: "normal",
    source: "rca",
    subject: "RCA summary package required for previous event",
    preview:
      "Please prepare an RCA-ready summary including impact, suspected cause, action plan, and communication notes.",
    body:
      "Hello,\n\nFor the previous network degradation event, please prepare an RCA-ready communication package.\n\nThe package should include:\n- RCA title\n- Impact summary\n- Root cause summary\n- Corrective action plan\n- Stakeholder-ready explanation\n\nThis will later be exportable as a report and reusable inside the internal email system.\n\nRegards,\nRCA Coordination",
    from: rcaTeam,
    to: [nocEngineer],
    createdAt: minutesAgo(260),
    tags: ["rca", "reporting", "stakeholder"],
    context: {
      rcaId: "RCA-2026-014",
      technology: "3G",
      impactSummary:
        "Previous event requires structured RCA communication package.",
      actionPlan: [
        "Collect incident context",
        "Write root cause explanation",
        "Prepare stakeholder summary",
        "Export report when RCA module is ready",
      ],
    },
  },
  {
    id: "mail-template-001",
    folder: "templates",
    status: "template",
    priority: "normal",
    source: "system",
    subject: "Template: Incident stakeholder update",
    preview:
      "Reusable communication template for incident status updates and stakeholder reporting.",
    body:
      "Hello,\n\nWe are currently investigating [INCIDENT_TITLE] affecting [AFFECTED_SCOPE].\n\nCurrent impact:\n[IMPACT_SUMMARY]\n\nCurrent technical understanding:\n[ROOT_CAUSE_OR_INVESTIGATION_SUMMARY]\n\nCurrent action plan:\n[ACTION_PLAN]\n\nNext update:\n[NEXT_UPDATE_TIME]\n\nRegards,\nNetwork Operations Center",
    from: {
      name: "System Templates",
      email: "templates@orange.tn",
      role: "System",
    },
    to: [],
    createdAt: minutesAgo(500),
    tags: ["template", "incident", "stakeholder"],
  },
];

export const mockEmailTemplates: EmailTemplate[] = [
  {
    id: "tpl-incident-update",
    title: "Incident stakeholder update",
    description:
      "Short communication for stakeholders during an active service incident.",
    source: "incident",
    subject: "Service update: [INCIDENT_TITLE]",
    body:
      "Hello,\n\nWe are currently investigating [INCIDENT_TITLE] affecting [AFFECTED_SCOPE].\n\nImpact summary:\n[IMPACT_SUMMARY]\n\nCurrent action plan:\n[ACTION_PLAN]\n\nWe will share the next update once additional technical confirmation is available.\n\nRegards,\nNetwork Operations Center",
    tags: ["incident", "stakeholder"],
  },
  {
    id: "tpl-rca-summary",
    title: "RCA executive summary",
    description:
      "Structured RCA communication with impact, root cause, and action plan.",
    source: "rca",
    subject: "RCA summary: [EVENT_TITLE]",
    body:
      "Hello,\n\nPlease find below the RCA summary for [EVENT_TITLE].\n\nImpact:\n[IMPACT_SUMMARY]\n\nRoot cause:\n[ROOT_CAUSE_SUMMARY]\n\nCorrective actions:\n[ACTION_PLAN]\n\nPreventive measures:\n[PREVENTIVE_MEASURES]\n\nRegards,\nRCA Coordination",
    tags: ["rca", "report"],
  },
  {
    id: "tpl-monitoring-watch",
    title: "Monitoring threshold watch",
    description:
      "Internal notification for a threshold breach that needs engineer review.",
    source: "monitoring",
    subject: "Monitoring watch: [KPI_NAME] threshold breach",
    body:
      "Hello,\n\nA monitoring threshold has been crossed and requires review.\n\nKPI:\n[KPI_NAME]\n\nScope:\n[AFFECTED_SCOPE]\n\nObserved behavior:\n[OBSERVED_BEHAVIOR]\n\nRecommended checks:\n[RECOMMENDED_CHECKS]\n\nRegards,\nMonitoring Automation",
    tags: ["monitoring", "threshold"],
  },
];