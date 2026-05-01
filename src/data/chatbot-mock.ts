import type {
  ChatbotMessage,
  ChatbotModeMeta,
  ChatbotQuickPrompt,
} from "@/types/chatbot";

export const chatbotModes: ChatbotModeMeta[] = [
  {
    key: "general",
    label: "General",
    description: "Ask about the platform, operations, or next actions.",
  },
  {
    key: "incident",
    label: "Incident",
    description: "Explain incidents, severity, impact, and triage flow.",
  },
  {
    key: "rca",
    label: "RCA",
    description: "Structure root cause analysis and action plans.",
  },
  {
    key: "email",
    label: "Email",
    description: "Draft stakeholder communication and operational updates.",
  },
  {
    key: "monitoring",
    label: "Monitoring",
    description: "Interpret KPIs, trend behavior, and threshold breaches.",
  },
  {
    key: "map",
    label: "Map",
    description: "Explain site, region, and geographic investigation context.",
  },
];

export const mockChatbotMessages: ChatbotMessage[] = [
  {
    id: "assistant-welcome",
    role: "assistant",
    mode: "general",
    createdAt: new Date().toISOString(),
    content:
      "Hello. I am your NOC Assistant. I can help explain incidents, structure RCA notes, draft internal emails, summarize monitoring issues, and prepare stakeholder communication. Select a mode below or ask directly.",
    contextCards: [
      {
        label: "Scope",
        value: "3G live operational domain",
        tone: "good",
      },
      {
        label: "AI status",
        value: "Frontend mock, backend-ready",
        tone: "ai",
      },
      {
        label: "Security",
        value: "Provider token must stay in backend",
        tone: "critical",
      },
    ],
    actions: [
      {
        label: "Draft incident email",
        mode: "email",
        prompt:
          "Draft a professional stakeholder email for a high-impact 3G incident. Include impact, current status, next action, and reassurance.",
      },
      {
        label: "Prepare RCA outline",
        mode: "rca",
        prompt:
          "Prepare an RCA outline for a recurring 3G degradation event, including symptoms, suspected root cause, evidence, corrective actions, and prevention plan.",
      },
      {
        label: "Explain KPI issue",
        mode: "monitoring",
        prompt:
          "Explain what it means when CSSR decreases while IUB congestion increases in the 3G monitoring dashboard.",
      },
    ],
  },
];

export const chatbotQuickPrompts: ChatbotQuickPrompt[] = [
  {
    id: "quick-incident",
    label: "Explain incident",
    mode: "incident",
    description: "Turn a ticket into operator-friendly meaning.",
    prompt:
      "Explain this incident like a NOC engineer: severity, likely impact, first checks, and next actions.",
  },
  {
    id: "quick-email",
    label: "Draft email",
    mode: "email",
    description: "Prepare a clean stakeholder message.",
    prompt:
      "Draft a concise professional email for stakeholders about an ongoing 3G service degradation.",
  },
  {
    id: "quick-rca",
    label: "RCA structure",
    mode: "rca",
    description: "Create a root cause analysis skeleton.",
    prompt:
      "Create an RCA report structure for a 3G network incident with impact summary, root cause, evidence, action plan, and prevention.",
  },
  {
    id: "quick-monitoring",
    label: "Interpret KPIs",
    mode: "monitoring",
    description: "Explain KPI behavior and thresholds.",
    prompt:
      "Interpret a monitoring situation where CSSR is unstable, RAB setup success is dropping, and IUB congestion is increasing.",
  },
  {
    id: "quick-map",
    label: "Map investigation",
    mode: "map",
    description: "Guide site or region investigation.",
    prompt:
      "Guide me through investigating a degraded 3G site from the map page using region, RNC, site health, and incident context.",
  },
];

export const assistantReadinessItems = [
  {
    label: "Backend AI",
    value: "Hugging Face ready",
  },
  {
    label: "Token safety",
    value: "Backend only",
  },
  {
    label: "Context",
    value: "Incident, RCA, mail, map, monitoring",
  },
  {
    label: "Current mode",
    value: "Frontend mock responses",
  },
];