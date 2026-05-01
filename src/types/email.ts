export type MailFolder =
  | "inbox"
  | "sent"
  | "drafts"
  | "templates"
  | "ai-drafts";

export type MailPriority = "critical" | "high" | "normal" | "low";

export type MailStatus = "unread" | "read" | "draft" | "sent" | "template";

export type MailSource =
  | "incident"
  | "monitoring"
  | "rca"
  | "ai"
  | "system"
  | "manual";

export type MailParticipant = {
  name: string;
  email: string;
  role?: string;
};

export type MailAttachment = {
  id: string;
  name: string;
  type: "pdf" | "csv" | "image" | "report" | "other";
  sizeLabel: string;
};

export type MailOperationalContext = {
  incidentId?: number;
  incidentTicket?: string;
  rcaId?: string;
  siteName?: string;
  regionCode?: string;
  technology?: "2G" | "3G" | "4G" | "5G";
  impactSummary?: string;
  rootCauseSummary?: string;
  actionPlan?: string[];
};

export type InternalEmail = {
  id: string;
  folder: MailFolder;
  status: MailStatus;
  priority: MailPriority;
  source: MailSource;
  subject: string;
  preview: string;
  body: string;
  from: MailParticipant;
  to: MailParticipant[];
  cc?: MailParticipant[];
  createdAt: string;
  updatedAt?: string;
  tags: string[];
  aiGenerated?: boolean;
  starred?: boolean;
  attachments?: MailAttachment[];
  context?: MailOperationalContext;
};

export type EmailTemplate = {
  id: string;
  title: string;
  description: string;
  source: MailSource;
  subject: string;
  body: string;
  tags: string[];
};

export type MailComposeMode =
  | "blank"
  | "reply"
  | "forward"
  | "from-template"
  | "ai-draft";

export type MailFilter = {
  folder: MailFolder;
  search: string;
  priority: "all" | MailPriority;
  source: "all" | MailSource;
};