import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import {
  AlertTriangle,
  Archive,
  Bot,
  CheckCheck,
  ChevronRight,
  Download,
  ExternalLink,
  FileText,
  Filter,
  Forward,
  Inbox,
  Mail,
  MailPlus,
  Paperclip,
  Plus,
  Radio,
  Reply,
  Search,
  Send,
  Settings,
  ShieldAlert,
  SlidersHorizontal,
  Sparkles,
  Star,
  Users,
  WandSparkles,
  X,
} from "lucide-react";

import AppShell from "@/components/layout/AppShell";
import { mockEmailTemplates, mockInternalEmails } from "@/data/email-mock";
import type {
  EmailTemplate,
  InternalEmail,
  MailComposeMode,
  MailFolder,
  MailParticipant,
  MailPriority,
  MailSource,
} from "@/types/email";

import { addNotification } from "@/stores/notificationStore";

const CURRENT_OPERATOR: MailParticipant = {
  name: "NOC Operations",
  email: "noc.operations@orange.tn",
  role: "Network Operations Center",
};

const folderItems: Array<{
  key: MailFolder;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  {
    key: "inbox",
    label: "Inbox",
    description: "Incoming operational communication",
    icon: Inbox,
  },
  {
    key: "sent",
    label: "Sent",
    description: "Validated outgoing messages",
    icon: Send,
  },
  {
    key: "drafts",
    label: "Drafts",
    description: "Engineer drafts and pending reviews",
    icon: FileText,
  },
  {
    key: "templates",
    label: "Templates",
    description: "Reusable incident and RCA formats",
    icon: Archive,
  },
  {
    key: "ai-drafts",
    label: "AI Drafts",
    description: "Future generated communication",
    icon: Sparkles,
  },
];

const priorityOptions: Array<"all" | MailPriority> = [
  "all",
  "critical",
  "high",
  "normal",
  "low",
];

const sourceOptions: Array<"all" | MailSource> = [
  "all",
  "incident",
  "monitoring",
  "rca",
  "ai",
  "system",
  "manual",
];

type ComposePayload = {
  to: string;
  cc: string;
  subject: string;
  body: string;
};

type AssistantMailDraftPayload = {
  subject: string;
  body: string;
  to?: string;
  cc?: string;
};

type ComposeState = {
  open: boolean;
  mode: MailComposeMode;
  template: EmailTemplate | null;
  sourceEmail: InternalEmail | null;
  prefillDraft: AssistantMailDraftPayload | null;
};

const initialComposeState: ComposeState = {
  open: false,
  mode: "blank",
  template: null,
  sourceEmail: null,
  prefillDraft: null,
};

export default function InternalMailPage() {
  const navigate = useNavigate();

  const [emails, setEmails] = useState<InternalEmail[]>(mockInternalEmails);
  const [activeFolder, setActiveFolder] = useState<MailFolder>("inbox");
  const [selectedEmailId, setSelectedEmailId] = useState<string | null>(
    mockInternalEmails[0]?.id ?? null
  );
  const [search, setSearch] = useState("");
  const [priorityFilter, setPriorityFilter] =
    useState<"all" | MailPriority>("all");
  const [sourceFilter, setSourceFilter] = useState<"all" | MailSource>("all");

  const [composeState, setComposeState] =
    useState<ComposeState>(initialComposeState);

  const [mailListCollapsed, setMailListCollapsed] = useState(true);
  const [mailListHovered, setMailListHovered] = useState(false);
  const mailListExpanded = !mailListCollapsed || mailListHovered;

  useEffect(() => {
    const assistantDraft = readAssistantDraftFromStorage();
    if (!assistantDraft) return;

    setComposeState({
      open: true,
      mode: "ai-draft",
      template: null,
      sourceEmail: null,
      prefillDraft: assistantDraft,
    });

    localStorage.removeItem("assistant_mail_draft");
  }, []);

  const folderCounts = useMemo(() => {
    return folderItems.reduce<Record<MailFolder, number>>((acc, item) => {
      if (item.key === "ai-drafts") {
        acc[item.key] = emails.filter((email) => email.aiGenerated).length;
        return acc;
      }

      acc[item.key] = emails.filter((email) => email.folder === item.key).length;
      return acc;
    }, {} as Record<MailFolder, number>);
  }, [emails]);

  const unreadCount = useMemo(
    () => emails.filter((email) => email.status === "unread").length,
    [emails]
  );

  const filteredEmails = useMemo(() => {
    const query = search.trim().toLowerCase();

    return emails
      .filter((email) => {
        if (activeFolder === "ai-drafts") return email.aiGenerated;
        return email.folder === activeFolder;
      })
      .filter((email) => {
        if (priorityFilter === "all") return true;
        return email.priority === priorityFilter;
      })
      .filter((email) => {
        if (sourceFilter === "all") return true;
        return email.source === sourceFilter;
      })
      .filter((email) => {
        if (!query) return true;

        const haystack = [
          email.subject,
          email.preview,
          email.body,
          email.from.name,
          email.from.email,
          email.context?.incidentTicket,
          email.context?.regionCode,
          email.context?.siteName,
          ...email.tags,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        return haystack.includes(query);
      })
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
  }, [activeFolder, emails, priorityFilter, search, sourceFilter]);

  const selectedEmail = useMemo(() => {
    return (
      filteredEmails.find((email) => email.id === selectedEmailId) ??
      filteredEmails[0] ??
      null
    );
  }, [filteredEmails, selectedEmailId]);

  const selectedFolderMeta = folderItems.find(
    (item) => item.key === activeFolder
  );

  function handleSelectEmail(email: InternalEmail) {
    setSelectedEmailId(email.id);

    if (email.status === "unread") {
      setEmails((prev) =>
        prev.map((item) =>
          item.id === email.id ? { ...item, status: "read" } : item
        )
      );
    }
  }

  function markAllVisibleAsRead() {
    const visibleIds = new Set(filteredEmails.map((email) => email.id));

    setEmails((prev) =>
      prev.map((email) =>
        visibleIds.has(email.id) && email.status === "unread"
          ? { ...email, status: "read" }
          : email
      )
    );
  }

  function toggleSelectedReadState(email: InternalEmail) {
    setEmails((prev) =>
      prev.map((item) =>
        item.id === email.id
          ? {
              ...item,
              status: item.status === "unread" ? "read" : "unread",
            }
          : item
      )
    );
  }

  function openBlankCompose() {
    setComposeState({
      open: true,
      mode: "blank",
      template: null,
      sourceEmail: null,
      prefillDraft: null,
    });
  }

  function openReplyCompose(email: InternalEmail) {
    setComposeState({
      open: true,
      mode: "reply",
      template: null,
      sourceEmail: email,
      prefillDraft: null,
    });
  }

  function openForwardCompose(email: InternalEmail) {
    setComposeState({
      open: true,
      mode: "forward",
      template: null,
      sourceEmail: email,
      prefillDraft: null,
    });
  }

  function openTemplateCompose(template: EmailTemplate) {
    setComposeState({
      open: true,
      mode: "from-template",
      template,
      sourceEmail: selectedEmail,
      prefillDraft: null,
    });
  }

  function openAiDraftCompose(email: InternalEmail) {
    setComposeState({
      open: true,
      mode: "ai-draft",
      template: null,
      sourceEmail: email,
      prefillDraft: null,
    });
    addNotification({
      title: "AI draft prepared",
      message:
        "An AI-assisted operational email draft has been prepared for engineer review.",
      severity: "info",
      source: "ai",
      entityLabel: email.context?.incidentTicket ?? "AI Draft",
      action: {
        label: "Review draft",
        href: "/mail",
      },
    });
  }

  function closeCompose() {
    setComposeState(initialComposeState);
  }

  function saveDraft(payload: ComposePayload) {
    const now = new Date().toISOString();

    const draft: InternalEmail = {
      id: `mail-draft-${Date.now()}`,
      folder: "drafts",
      status: "draft",
      priority: inferPriorityFromSource(composeState.sourceEmail),
      source:
        composeState.mode === "ai-draft"
          ? "ai"
          : composeState.template?.source ??
            composeState.sourceEmail?.source ??
            "manual",
      subject: payload.subject.trim() || "Untitled draft",
      preview: buildPreview(payload.body),
      body: payload.body,
      from: CURRENT_OPERATOR,
      to: parseParticipants(payload.to),
      cc: parseParticipants(payload.cc),
      createdAt: now,
      updatedAt: now,
      tags: buildComposeTags(composeState),
      aiGenerated: composeState.mode === "ai-draft",
      context: composeState.sourceEmail?.context,
    };

    setEmails((prev) => [draft, ...prev]);
    setActiveFolder("drafts");
    setSelectedEmailId(draft.id);
    addNotification({
      title: "Draft saved",
      message: `Draft "${draft.subject}" was saved to the internal mail workspace.`,
      severity: "info",
      source: "email",
      entityLabel: "Drafts",
      action: {
        label: "Open mail",
        href: "/mail",
      },
    });
    setComposeState(initialComposeState);
  }

  function sendEmail(payload: ComposePayload) {
    const now = new Date().toISOString();

    const sent: InternalEmail = {
      id: `mail-sent-${Date.now()}`,
      folder: "sent",
      status: "sent",
      priority: inferPriorityFromSource(composeState.sourceEmail),
      source:
        composeState.mode === "ai-draft"
          ? "ai"
          : composeState.template?.source ??
            composeState.sourceEmail?.source ??
            "manual",
      subject: payload.subject.trim() || "No subject",
      preview: buildPreview(payload.body),
      body: payload.body,
      from: CURRENT_OPERATOR,
      to: parseParticipants(payload.to),
      cc: parseParticipants(payload.cc),
      createdAt: now,
      updatedAt: now,
      tags: buildComposeTags(composeState),
      aiGenerated: composeState.mode === "ai-draft",
      context: composeState.sourceEmail?.context,
    };

    setEmails((prev) => [sent, ...prev]);
    setActiveFolder("sent");
    setSelectedEmailId(sent.id);
    addNotification({
      title: "Internal email sent",
      message: `Email "${sent.subject}" was sent to ${
        sent.to.length || 1
      } recipient group.`,
      severity: sent.priority === "critical" ? "major" : "success",
      source: "email",
      entityLabel: "Sent mail",
      action: {
        label: "Open mail",
        href: "/mail",
      },
    });
    setComposeState(initialComposeState);
  }

  function openIncidentContext(email: InternalEmail) {
    if (email.context?.incidentId) {
      navigate(`/incidents?incident=${email.context.incidentId}`);
    }
  }

  return (
    <AppShell>
      <div className="space-y-3 px-1 pb-3 pt-1 text-white">
        <section className="premium-panel rounded-[1.6rem]">
          <div className="premium-panel-body px-4 py-4 md:px-5 md:py-5">
            <div className="flex flex-col gap-4 2xl:flex-row 2xl:items-end 2xl:justify-between">
              <div className="min-w-0">
                <p className="section-eyebrow">Internal Communication</p>

                <div className="mt-2 flex flex-wrap items-center gap-3">
                  <h1 className="text-[1.45rem] font-semibold tracking-[-0.05em] text-white md:text-[1.72rem]">
                    Operational Mail Center
                  </h1>

                  <span className="status-pill watch">{unreadCount} unread</span>
                </div>

                <p className="mt-2 max-w-3xl text-sm leading-6 text-white/54">
                  Internal email workspace for incident communication, monitoring
                  escalation, RCA summaries, stakeholder updates, and future
                  AI-assisted drafting.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={markAllVisibleAsRead}
                  className="premium-button-ghost orange-ring-focus text-white/78 hover:text-white"
                >
                  <CheckCheck className="h-4 w-4" />
                  Mark visible read
                </button>

                <button
                  onClick={openBlankCompose}
                  className="premium-button orange-ring-focus"
                >
                  <MailPlus className="h-4 w-4" />
                  Compose email
                </button>
              </div>
            </div>

            <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              <MailHeroStat
                label="Unread"
                value={unreadCount}
                tone="critical"
                icon={<Inbox className="h-4 w-4" />}
              />
              <MailHeroStat
                label="AI-ready drafts"
                value={emails.filter((email) => email.aiGenerated).length}
                tone="ai"
                icon={<Bot className="h-4 w-4" />}
              />
              <MailHeroStat
                label="Incident linked"
                value={emails.filter((email) => email.context?.incidentId).length}
                tone="warning"
                icon={<ShieldAlert className="h-4 w-4" />}
              />
              <MailHeroStat
                label="Templates"
                value={mockEmailTemplates.length}
                tone="neutral"
                icon={<FileText className="h-4 w-4" />}
              />
            </div>
          </div>
        </section>

        <section className="premium-panel rounded-[1.35rem]">
          <div className="premium-panel-body px-4 py-3">
            <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
              <div className="flex min-w-0 flex-1 items-center gap-3">
                <div className="relative min-w-0 flex-1">
                  <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
                  <input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Search subject, incident, region, sender..."
                    className="premium-input orange-ring-focus w-full pl-11 pr-4 text-sm placeholder:text-white/28"
                  />
                </div>

                <div className="hidden items-center gap-2 xl:flex">
                  <span className="premium-toolbar-pill">
                    <SlidersHorizontal className="h-3.5 w-3.5" />
                    Filters
                  </span>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <FilterSelect
                  icon={<AlertTriangle className="h-3.5 w-3.5" />}
                  value={priorityFilter}
                  onChange={(value) =>
                    setPriorityFilter(value as "all" | MailPriority)
                  }
                  options={priorityOptions}
                />

                <FilterSelect
                  icon={<Filter className="h-3.5 w-3.5" />}
                  value={sourceFilter}
                  onChange={(value) =>
                    setSourceFilter(value as "all" | MailSource)
                  }
                  options={sourceOptions}
                />
              </div>
            </div>
          </div>
        </section>

        <section className="flex flex-col gap-3 2xl:flex-row">
          <aside className="premium-panel rounded-[1.45rem] 2xl:w-[285px] 2xl:shrink-0">
            <div className="premium-panel-header">
              <div>
                <h2 className="panel-title">Mailboxes</h2>
                <p className="panel-subtitle">Internal operational flows</p>
              </div>
            </div>

            <div className="premium-panel-body space-y-2">
              {folderItems.map((item) => (
                <FolderButton
                  key={item.key}
                  item={item}
                  count={folderCounts[item.key] ?? 0}
                  active={activeFolder === item.key}
                  onClick={() => {
                    setActiveFolder(item.key);
                    setSelectedEmailId(null);
                  }}
                />
              ))}

              <div className="mt-4 rounded-[1.1rem] border border-orange-400/12 bg-orange-500/[0.055] p-3.5">
                <div className="flex items-center gap-2">
                  <WandSparkles className="h-4 w-4 text-[#ff7900]" />
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-orange-200">
                    AI-ready
                  </p>
                </div>

                <p className="mt-2 text-xs leading-5 text-white/46">
                  Later, Gemini or DeepSeek can generate drafts through a backend
                  endpoint. The frontend should never store the API token.
                </p>
              </div>
            </div>
          </aside>

          <section
            onMouseEnter={() => setMailListHovered(true)}
            onMouseLeave={() => setMailListHovered(false)}
            className={[
              "premium-panel min-w-0 rounded-[1.45rem] transition-[width] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
              mailListExpanded ? "2xl:w-[350px]" : "2xl:w-[72px]",
              "2xl:shrink-0",
            ].join(" ")}
          >
            {mailListExpanded ? (
              <>
                <div className="premium-panel-header">
                  <div className="min-w-0">
                    <h2 className="panel-title">
                      {selectedFolderMeta?.label ?? "Mailbox"}
                    </h2>
                    <p className="panel-subtitle">
                      {selectedFolderMeta?.description ?? "Messages"}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="premium-toolbar-pill">
                      {filteredEmails.length} items
                    </span>

                    <button
                      onClick={() => setMailListCollapsed((prev) => !prev)}
                      className="orange-ring-focus rounded-xl border border-white/[0.07] bg-white/[0.035] px-2.5 py-2 text-xs font-medium text-white/58 transition hover:bg-white/[0.07] hover:text-white"
                      title={
                        mailListCollapsed
                          ? "Keep mail list open"
                          : "Collapse mail list"
                      }
                    >
                      {mailListCollapsed ? "Pin" : "Close"}
                    </button>
                  </div>
                </div>

                <div className="premium-panel-body pt-3">
                  <div className="max-h-[760px] space-y-2 overflow-y-auto pr-1">
                    {filteredEmails.length === 0 ? (
                      <EmptyState
                        title="No messages found"
                        description="Try another folder, priority, source, or search query."
                      />
                    ) : (
                      filteredEmails.map((email) => (
                        <MailListItem
                          key={email.id}
                          email={email}
                          active={selectedEmail?.id === email.id}
                          onClick={() => handleSelectEmail(email)}
                        />
                      ))
                    )}
                  </div>
                </div>
              </>
            ) : (
              <div className="flex h-full min-h-[640px] flex-col items-center gap-3 px-2 py-4">
                <button
                  onClick={() => setMailListCollapsed(false)}
                  className="orange-ring-focus flex h-11 w-11 items-center justify-center rounded-[1rem] border border-orange-400/16 bg-orange-500/10 text-orange-200 transition hover:bg-orange-500/16"
                  title="Open mail list"
                >
                  <Mail className="h-4.5 w-4.5" />
                </button>

                <div className="h-px w-10 bg-white/[0.08]" />

                <div className="flex flex-1 flex-col items-center gap-2 overflow-y-auto">
                  {filteredEmails.slice(0, 10).map((email) => {
                    const active = selectedEmail?.id === email.id;
                    const unread = email.status === "unread";

                    return (
                      <button
                        key={email.id}
                        onClick={() => handleSelectEmail(email)}
                        className={[
                          "orange-ring-focus relative flex h-11 w-11 items-center justify-center rounded-[1rem] border transition",
                          active
                            ? "border-orange-400/22 bg-orange-500/14 text-orange-200"
                            : "border-white/[0.07] bg-white/[0.03] text-white/54 hover:bg-white/[0.06] hover:text-white",
                        ].join(" ")}
                        title={email.subject}
                      >
                        <Mail className="h-4 w-4" />

                        {unread ? (
                          <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-[#ff7900] shadow-[0_0_10px_rgba(255,121,0,0.45)]" />
                        ) : null}

                        <span
                          className={[
                            "absolute -bottom-1 left-1/2 h-1.5 w-5 -translate-x-1/2 rounded-full opacity-80",
                            email.priority === "critical"
                              ? "bg-red-400"
                              : email.priority === "high"
                              ? "bg-orange-400"
                              : "bg-white/22",
                          ].join(" ")}
                        />
                      </button>
                    );
                  })}
                </div>

                <div className="rounded-full border border-white/[0.07] bg-white/[0.035] px-2 py-1 text-[10px] font-semibold text-white/42">
                  {filteredEmails.length}
                </div>
              </div>
            )}
          </section>

          <section className="premium-panel min-w-0 flex-[1_1_780px] rounded-[1.45rem]">
            {selectedEmail ? (
              <MailReader
                email={selectedEmail}
                templates={mockEmailTemplates}
                onCompose={openBlankCompose}
                onReply={() => openReplyCompose(selectedEmail)}
                onForward={() => openForwardCompose(selectedEmail)}
                onUseTemplate={openTemplateCompose}
                onOpenIncident={() => openIncidentContext(selectedEmail)}
                onAiDraft={() => openAiDraftCompose(selectedEmail)}
                onToggleRead={() => toggleSelectedReadState(selectedEmail)}
              />
            ) : (
              <div className="premium-panel-body">
                <EmptyState
                  title="Select an email"
                  description="Choose a message from the list to inspect details, context, and AI-ready actions."
                  tall
                />
              </div>
            )}
          </section>
        </section>

        {composeState.open ? (
          <ComposeWindow
            mode={composeState.mode}
            template={composeState.template}
            sourceEmail={composeState.sourceEmail}
            prefillDraft={composeState.prefillDraft}
            onClose={closeCompose}
            onSaveDraft={saveDraft}
            onSend={sendEmail}
          />
        ) : null}
      </div>
    </AppShell>
  );
}

function FolderButton({
  item,
  count,
  active,
  onClick,
}: {
  item: {
    key: MailFolder;
    label: string;
    description: string;
    icon: React.ComponentType<{ className?: string }>;
  };
  count: number;
  active: boolean;
  onClick: () => void;
}) {
  const Icon = item.icon;

  return (
    <button
      onClick={onClick}
      className={[
        "orange-ring-focus group flex w-full items-center gap-3 rounded-[1.08rem] border px-3 py-3 text-left transition",
        active
          ? "border-orange-400/16 bg-[linear-gradient(90deg,rgba(255,121,0,0.14),rgba(255,255,255,0.025))] text-white shadow-[0_12px_26px_rgba(255,121,0,0.08)]"
          : "border-white/[0.055] bg-white/[0.025] text-white/62 hover:border-white/[0.09] hover:bg-white/[0.045] hover:text-white",
      ].join(" ")}
    >
      <span
        className={[
          "flex h-10 w-10 shrink-0 items-center justify-center rounded-[0.95rem] border transition",
          active
            ? "border-orange-400/18 bg-orange-500/12 text-orange-200"
            : "border-white/[0.06] bg-white/[0.025] text-white/54 group-hover:text-white",
        ].join(" ")}
      >
        <Icon className="h-4.5 w-4.5" />
      </span>

      <span className="min-w-0 flex-1">
        <span className="block text-sm font-medium">{item.label}</span>
        <span className="mt-0.5 block truncate text-xs text-white/36">
          {item.description}
        </span>
      </span>

      <span className="rounded-full border border-white/[0.07] bg-white/[0.035] px-2 py-1 text-[10px] font-semibold text-white/46">
        {count}
      </span>
    </button>
  );
}

function MailListItem({
  email,
  active,
  onClick,
}: {
  email: InternalEmail;
  active: boolean;
  onClick: () => void;
}) {
  const priority = priorityMeta(email.priority);
  const source = sourceMeta(email.source);
  const unread = email.status === "unread";

  return (
    <button
      onClick={onClick}
      className={[
        "orange-ring-focus group w-full rounded-[1.15rem] border px-3.5 py-3 text-left transition",
        active
          ? "border-orange-400/18 bg-[linear-gradient(180deg,rgba(255,121,0,0.115),rgba(255,255,255,0.018))] shadow-[inset_3px_0_0_rgba(255,121,0,0.95)]"
          : unread
          ? "border-orange-400/10 bg-orange-500/[0.045] hover:border-orange-400/18"
          : "border-white/[0.055] bg-white/[0.022] hover:border-white/[0.09] hover:bg-white/[0.04]",
      ].join(" ")}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            {unread ? (
              <span className="h-2 w-2 rounded-full bg-[#ff7900] shadow-[0_0_10px_rgba(255,121,0,0.45)]" />
            ) : null}

            <span
              className={`rounded-full border px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.1em] ${priority.className}`}
            >
              {priority.label}
            </span>

            <span className="text-[10px] font-semibold uppercase tracking-[0.13em] text-white/28">
              {source.label}
            </span>
          </div>

          <p className="mt-2 line-clamp-1 text-sm font-semibold text-white/90">
            {email.subject}
          </p>

          <p className="mt-1 line-clamp-2 text-xs leading-5 text-white/42">
            {email.preview}
          </p>
        </div>

        <div className="flex shrink-0 flex-col items-end gap-2">
          <span className="text-[10px] text-white/30">
            {formatRelativeTime(email.createdAt)}
          </span>

          {email.starred ? (
            <Star className="h-3.5 w-3.5 fill-orange-300 text-orange-300" />
          ) : null}

          {email.attachments?.length ? (
            <Paperclip className="h-3.5 w-3.5 text-white/32" />
          ) : null}
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        {email.context?.incidentTicket ? (
          <span className="rounded-full border border-red-500/14 bg-red-500/8 px-2 py-1 text-[10px] font-medium text-red-200/80">
            {email.context.incidentTicket}
          </span>
        ) : null}

        {email.context?.technology ? (
          <span className="rounded-full border border-white/[0.07] bg-white/[0.035] px-2 py-1 text-[10px] font-medium text-white/42">
            {email.context.technology}
          </span>
        ) : null}

        {email.aiGenerated ? (
          <span className="rounded-full border border-sky-500/14 bg-sky-500/8 px-2 py-1 text-[10px] font-medium text-sky-200/80">
            AI draft
          </span>
        ) : null}
      </div>
    </button>
  );
}

function MailReader({
  email,
  templates,
  onCompose,
  onReply,
  onForward,
  onUseTemplate,
  onOpenIncident,
  onAiDraft,
  onToggleRead,
}: {
  email: InternalEmail;
  templates: EmailTemplate[];
  onCompose: () => void;
  onReply: () => void;
  onForward: () => void;
  onUseTemplate: (template: EmailTemplate) => void;
  onOpenIncident: () => void;
  onAiDraft: () => void;
  onToggleRead: () => void;
}) {
  const priority = priorityMeta(email.priority);
  const source = sourceMeta(email.source);

  return (
    <>
      <header className="premium-panel-header">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.1em] ${priority.className}`}
            >
              {priority.label}
            </span>

            <span className="premium-toolbar-pill">
              {source.icon}
              {source.label}
            </span>

            {email.aiGenerated ? (
              <span className="premium-toolbar-pill">
                <Sparkles className="h-3.5 w-3.5 text-[#ff7900]" />
                AI prepared
              </span>
            ) : null}

            {email.status === "unread" ? (
              <span className="premium-toolbar-pill">
                <span className="h-2 w-2 rounded-full bg-[#ff7900]" />
                Unread
              </span>
            ) : null}
          </div>

          <h2 className="mt-3 text-[1.28rem] font-semibold leading-tight tracking-[-0.04em] text-white">
            {email.subject}
          </h2>

          <p className="mt-2 text-sm text-white/42">
            From {email.from.name} · {formatFullDate(email.createdAt)}
          </p>
        </div>

        <button
          onClick={onToggleRead}
          className="premium-button-ghost orange-ring-focus text-white/76 hover:text-white"
        >
          {email.status === "unread" ? "Mark read" : "Mark unread"}
        </button>
      </header>

      <div className="premium-panel-body">
        <div className="grid gap-3 xl:grid-cols-[1fr_280px]">
          <div className="space-y-3">
            <div className="rounded-[1.12rem] border border-white/[0.06] bg-white/[0.025] p-4">
              <ContactLine
                label="From"
                value={`${email.from.name} <${email.from.email}>`}
              />
              <ContactLine
                label="To"
                value={
                  email.to
                    .map((item) => `${item.name} <${item.email}>`)
                    .join(", ") || "No recipients"
                }
              />
              {email.cc?.length ? (
                <ContactLine
                  label="CC"
                  value={email.cc
                    .map((item) => `${item.name} <${item.email}>`)
                    .join(", ")}
                />
              ) : null}
            </div>

            <div className="rounded-[1.12rem] border border-white/[0.06] bg-[linear-gradient(180deg,#10161d_0%,#0b1118_100%)] p-5">
              <div className="whitespace-pre-line text-sm leading-7 text-white/76">
                {email.body}
              </div>
            </div>

            {email.attachments?.length ? (
              <div className="rounded-[1.12rem] border border-white/[0.06] bg-white/[0.025] p-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white/34">
                  Attachments
                </p>

                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  {email.attachments.map((attachment) => (
                    <div
                      key={attachment.id}
                      className="flex items-center gap-3 rounded-[0.95rem] border border-white/[0.06] bg-white/[0.025] px-3 py-3"
                    >
                      <FileText className="h-4 w-4 text-[#ff7900]" />

                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-medium text-white/78">
                          {attachment.name}
                        </p>
                        <p className="text-[10px] text-white/32">
                          {attachment.sizeLabel}
                        </p>
                      </div>

                      <Download className="h-3.5 w-3.5 text-white/34" />
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={onReply}
                className="premium-button-ghost orange-ring-focus text-white/78 hover:text-white"
              >
                <Reply className="h-4 w-4" />
                Reply
              </button>

              <button
                onClick={onForward}
                className="premium-button-ghost orange-ring-focus text-white/78 hover:text-white"
              >
                <Forward className="h-4 w-4" />
                Forward
              </button>

              <button
                onClick={onCompose}
                className="premium-button orange-ring-focus"
              >
                <MailPlus className="h-4 w-4" />
                New message
              </button>
            </div>
          </div>

          <aside className="space-y-3">
            <ContextCard email={email} onOpenIncident={onOpenIncident} />

            <div className="rounded-[1.12rem] border border-sky-500/12 bg-sky-500/[0.045] p-4">
              <div className="flex items-center gap-2">
                <Bot className="h-4 w-4 text-sky-300" />
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-sky-200">
                  AI assistant
                </p>
              </div>

              <div className="mt-3 space-y-2">
                <AiActionButton
                  label="Generate email draft"
                  onClick={onAiDraft}
                />
                <AiActionButton label="Summarize issue" onClick={onAiDraft} />
                <AiActionButton
                  label="Rewrite professionally"
                  onClick={onAiDraft}
                />
                <AiActionButton label="Prepare RCA email" onClick={onAiDraft} />
              </div>

              <p className="mt-3 text-[11px] leading-5 text-white/38">
                UI placeholder. Later this calls your backend AI endpoint, not
                the provider directly from React.
              </p>
            </div>

            <div className="rounded-[1.12rem] border border-white/[0.06] bg-white/[0.025] p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white/34">
                Templates
              </p>

              <div className="mt-3 space-y-2">
                {templates.map((template) => (
                  <button
                    key={template.id}
                    onClick={() => onUseTemplate(template)}
                    className="orange-ring-focus flex w-full items-start gap-3 rounded-[0.95rem] border border-white/[0.055] bg-white/[0.025] px-3 py-3 text-left transition hover:border-orange-400/14 hover:bg-orange-500/[0.055]"
                  >
                    <FileText className="mt-0.5 h-4 w-4 shrink-0 text-[#ff7900]" />
                    <span className="min-w-0">
                      <span className="block text-xs font-medium text-white/78">
                        {template.title}
                      </span>
                      <span className="mt-0.5 line-clamp-2 block text-[11px] leading-4 text-white/34">
                        {template.description}
                      </span>
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </div>
    </>
  );
}

function ContextCard({
  email,
  onOpenIncident,
}: {
  email: InternalEmail;
  onOpenIncident: () => void;
}) {
  const context = email.context;

  return (
    <div className="rounded-[1.12rem] border border-orange-400/12 bg-orange-500/[0.045] p-4">
      <div className="flex items-center gap-2">
        <Radio className="h-4 w-4 text-[#ff7900]" />
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-orange-200">
          Operational context
        </p>
      </div>

      {context ? (
        <div className="mt-3 space-y-2">
          <MiniInfo label="Technology" value={context.technology ?? "—"} />
          <MiniInfo label="Region" value={context.regionCode ?? "—"} />
          <MiniInfo label="Site" value={context.siteName ?? "—"} />
          <MiniInfo label="Ticket" value={context.incidentTicket ?? "—"} />

          {context.impactSummary ? (
            <p className="rounded-[0.9rem] border border-white/[0.06] bg-black/10 px-3 py-2 text-xs leading-5 text-white/50">
              {context.impactSummary}
            </p>
          ) : null}

          {context.incidentId ? (
            <button
              onClick={onOpenIncident}
              className="premium-button-ghost orange-ring-focus mt-2 w-full justify-center text-white/78 hover:text-white"
            >
              Open incident
              <ExternalLink className="h-4 w-4" />
            </button>
          ) : null}
        </div>
      ) : (
        <p className="mt-3 text-xs leading-5 text-white/42">
          No incident, monitoring, or RCA context attached to this message.
        </p>
      )}
    </div>
  );
}

function ComposeWindow({
  mode,
  template,
  sourceEmail,
  prefillDraft,
  onClose,
  onSaveDraft,
  onSend,
}: {
  mode: MailComposeMode;
  template: EmailTemplate | null;
  sourceEmail: InternalEmail | null;
  prefillDraft: AssistantMailDraftPayload | null;
  onClose: () => void;
  onSaveDraft: (payload: ComposePayload) => void;
  onSend: (payload: ComposePayload) => void;
}) {
  const defaults = getComposeDefaults(
    mode,
    template,
    sourceEmail,
    prefillDraft
  );

  const [from] = useState(CURRENT_OPERATOR.email);
  const [to, setTo] = useState(defaults.to);
  const [cc, setCc] = useState(defaults.cc);
  const [subject, setSubject] = useState(defaults.subject);
  const [body, setBody] = useState(defaults.body);

  const title =
    mode === "reply"
      ? "Reply"
      : mode === "forward"
      ? "Forward"
      : mode === "from-template"
      ? "New message from template"
      : mode === "ai-draft"
      ? "AI-assisted draft"
      : "New message";

  const payload = {
    to,
    cc,
    subject,
    body,
  };

  return (
    <div className="fixed inset-0 z-[9999]">
      <button
        aria-label="Close compose overlay"
        onClick={onClose}
        className="absolute inset-0 bg-[rgba(5,9,14,0.42)] backdrop-blur-[4px]"
      />

      <div className="absolute inset-0 flex items-center justify-center p-4 md:p-6">
        <section className="flex h-[min(880px,92vh)] w-[min(1100px,96vw)] flex-col overflow-hidden rounded-[1.35rem] border border-white/[0.08] bg-[linear-gradient(180deg,#121922_0%,#0b1118_100%)] shadow-[0_38px_100px_rgba(0,0,0,0.55)]">
          <header className="flex items-center justify-between gap-3 border-b border-white/[0.06] px-5 py-4">
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/34">
                Compose
              </p>
              <h3 className="mt-1 text-lg font-semibold tracking-[-0.03em] text-white">
                {title}
              </h3>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => onSaveDraft(payload)}
                className="premium-button-ghost orange-ring-focus text-white/76 hover:text-white"
              >
                Save draft
              </button>

              <button
                onClick={() => onSend(payload)}
                className="premium-button orange-ring-focus"
              >
                <Send className="h-4 w-4" />
                Send
              </button>

              <button
                onClick={onClose}
                className="orange-ring-focus rounded-xl border border-white/[0.07] bg-white/[0.035] p-2 text-white/54 transition hover:bg-white/[0.07] hover:text-white"
                aria-label="Close compose"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </header>

          <div className="flex min-h-0 flex-1 flex-col">
            <div className="border-b border-white/[0.06] px-5 py-3">
              <div className="flex flex-wrap items-center gap-2">
                <button className="premium-toolbar-pill">
                  <Paperclip className="h-3.5 w-3.5" />
                  Attach
                </button>

                <button className="premium-toolbar-pill">
                  <FileText className="h-3.5 w-3.5" />
                  Template
                </button>

                <button className="premium-toolbar-pill">
                  <Sparkles className="h-3.5 w-3.5 text-[#ff7900]" />
                  AI assist
                </button>

                <button className="premium-toolbar-pill">
                  <Plus className="h-3.5 w-3.5" />
                  More
                </button>
              </div>
            </div>

            <div className="border-b border-white/[0.06] px-5">
              <ComposeLine label="From">
                <input
                  value={from}
                  readOnly
                  className="w-full bg-transparent py-3 text-sm text-white/58 outline-none"
                />
              </ComposeLine>

              <ComposeLine label="To">
                <input
                  value={to}
                  onChange={(event) => setTo(event.target.value)}
                  placeholder="recipient@orange.tn"
                  className="w-full bg-transparent py-3 text-sm text-white outline-none placeholder:text-white/24"
                />
              </ComposeLine>

              <ComposeLine label="Cc">
                <input
                  value={cc}
                  onChange={(event) => setCc(event.target.value)}
                  placeholder="Optional recipients"
                  className="w-full bg-transparent py-3 text-sm text-white outline-none placeholder:text-white/24"
                />
              </ComposeLine>

              <ComposeLine label="Subject" last>
                <input
                  value={subject}
                  onChange={(event) => setSubject(event.target.value)}
                  placeholder="Add a subject"
                  className="w-full bg-transparent py-3 text-sm text-white outline-none placeholder:text-white/24"
                />
              </ComposeLine>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
              <textarea
                value={body}
                onChange={(event) => setBody(event.target.value)}
                className="h-full min-h-[360px] w-full resize-none rounded-[1rem] border border-white/[0.06] bg-[#0d1620] px-4 py-4 text-sm leading-7 text-white outline-none transition placeholder:text-white/25 focus:border-[#ff7900]/35"
              />
            </div>

            <footer className="border-t border-white/[0.06] px-5 py-3">
              <div className="grid gap-3 xl:grid-cols-[1fr_290px]">
                <div className="flex flex-wrap items-center gap-2">
                  <button className="premium-button-ghost orange-ring-focus text-white/76 hover:text-white">
                    <Bot className="h-4 w-4" />
                    Generate draft
                  </button>

                  <button className="premium-button-ghost orange-ring-focus text-white/76 hover:text-white">
                    <Sparkles className="h-4 w-4" />
                    Improve tone
                  </button>

                  <button className="premium-button-ghost orange-ring-focus text-white/76 hover:text-white">
                    <ShieldAlert className="h-4 w-4" />
                    Summarize incident
                  </button>
                </div>

                <div className="rounded-[1rem] border border-sky-500/12 bg-sky-500/[0.045] px-4 py-3">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-sky-200">
                    Future AI integration
                  </p>
                  <p className="mt-1 text-[11px] leading-5 text-white/40">
                    Later this should call your backend AI endpoint for Gemini or
                    DeepSeek-assisted drafting.
                  </p>
                </div>
              </div>
            </footer>
          </div>
        </section>
      </div>
    </div>
  );
}

function ComposeLine({
  label,
  children,
  last = false,
}: {
  label: string;
  children: ReactNode;
  last?: boolean;
}) {
  return (
    <div
      className={[
        "grid grid-cols-[74px_1fr] items-center gap-3",
        last ? "" : "border-b border-white/[0.06]",
      ].join(" ")}
    >
      <span className="text-xs font-medium text-white/34">{label}</span>
      {children}
    </div>
  );
}

function MailHeroStat({
  label,
  value,
  tone,
  icon,
}: {
  label: string;
  value: number;
  tone: "critical" | "warning" | "ai" | "neutral";
  icon: ReactNode;
}) {
  const toneClass =
    tone === "critical"
      ? "border-red-500/12 bg-red-500/[0.055] text-red-300"
      : tone === "warning"
      ? "border-orange-500/12 bg-orange-500/[0.055] text-orange-300"
      : tone === "ai"
      ? "border-sky-500/12 bg-sky-500/[0.055] text-sky-300"
      : "border-white/[0.06] bg-white/[0.025] text-white/82";

  return (
    <div className={`rounded-[1.15rem] border px-4 py-3 ${toneClass}`}>
      <div className="flex items-center justify-between gap-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white/38">
          {label}
        </p>
        {icon}
      </div>

      <p className="mt-2 text-[1.9rem] font-semibold leading-none tracking-[-0.06em] text-white">
        {value}
      </p>
    </div>
  );
}

function FilterSelect({
  icon,
  value,
  onChange,
  options,
}: {
  icon: ReactNode;
  value: string;
  onChange: (value: string) => void;
  options: string[];
}) {
  return (
    <div className="relative min-w-[150px]">
      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-white/30">
        {icon}
      </span>

      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="orange-ring-focus h-10 w-full rounded-[0.95rem] border border-white/10 bg-[#101925] pl-9 pr-3 text-xs text-white outline-none transition focus:border-[#ff7900]/45 focus:bg-[#121d2a]"
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {formatLabel(option)}
          </option>
        ))}
      </select>
    </div>
  );
}

function EmptyState({
  title,
  description,
  tall = false,
}: {
  title: string;
  description: string;
  tall?: boolean;
}) {
  return (
    <div
      className={[
        "flex flex-col items-center justify-center rounded-[1.15rem] border border-white/[0.06] bg-white/[0.02] px-4 text-center",
        tall ? "min-h-[560px]" : "min-h-[260px]",
      ].join(" ")}
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-[1rem] border border-white/[0.07] bg-white/[0.035] text-white/44">
        <Mail className="h-5 w-5" />
      </div>

      <p className="mt-3 text-sm font-medium text-white/74">{title}</p>
      <p className="mt-1 max-w-sm text-xs leading-5 text-white/38">
        {description}
      </p>
    </div>
  );
}

function ContactLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[72px_1fr] gap-3 py-1 text-xs">
      <span className="text-white/30">{label}</span>
      <span className="min-w-0 truncate text-white/62">{value}</span>
    </div>
  );
}

function MiniInfo({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-[0.85rem] border border-white/[0.055] bg-white/[0.025] px-3 py-2">
      <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-white/30">
        {label}
      </span>
      <span className="truncate text-xs font-medium text-white/72">{value}</span>
    </div>
  );
}

function AiActionButton({
  label,
  onClick,
}: {
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="orange-ring-focus flex w-full items-center justify-between rounded-[0.85rem] border border-sky-500/12 bg-sky-500/[0.045] px-3 py-2 text-left text-xs font-medium text-sky-100/80 transition hover:bg-sky-500/[0.075]"
    >
      {label}
      <ChevronRight className="h-3.5 w-3.5 text-sky-200/60" />
    </button>
  );
}

function sourceMeta(source: MailSource): {
  label: string;
  icon: ReactNode;
} {
  if (source === "incident") {
    return {
      label: "Incident",
      icon: <ShieldAlert className="h-3.5 w-3.5 text-red-300" />,
    };
  }

  if (source === "monitoring") {
    return {
      label: "Monitoring",
      icon: <Radio className="h-3.5 w-3.5 text-orange-300" />,
    };
  }

  if (source === "rca") {
    return {
      label: "RCA",
      icon: <FileText className="h-3.5 w-3.5 text-amber-200" />,
    };
  }

  if (source === "ai") {
    return {
      label: "AI",
      icon: <Bot className="h-3.5 w-3.5 text-sky-300" />,
    };
  }

  if (source === "system") {
    return {
      label: "System",
      icon: <Settings className="h-3.5 w-3.5 text-white/50" />,
    };
  }

  return {
    label: "Manual",
    icon: <Users className="h-3.5 w-3.5 text-white/50" />,
  };
}

function priorityMeta(priority: MailPriority) {
  if (priority === "critical") {
    return {
      label: "Critical",
      className: "border-red-500/20 bg-red-500/12 text-red-300",
    };
  }

  if (priority === "high") {
    return {
      label: "High",
      className: "border-orange-500/20 bg-orange-500/12 text-orange-300",
    };
  }

  if (priority === "low") {
    return {
      label: "Low",
      className: "border-white/10 bg-white/8 text-white/54",
    };
  }

  return {
    label: "Normal",
    className: "border-emerald-500/18 bg-emerald-500/10 text-emerald-300",
    };
}

function getComposeDefaults(
  mode: MailComposeMode,
  template: EmailTemplate | null,
  sourceEmail: InternalEmail | null,
  prefillDraft: AssistantMailDraftPayload | null
) {
  if (prefillDraft) {
    return {
      to: prefillDraft.to ?? "",
      cc: prefillDraft.cc ?? "",
      subject: prefillDraft.subject ?? "",
      body: prefillDraft.body ?? "",
    };
  }

  if (mode === "reply" && sourceEmail) {
    return {
      to: sourceEmail.from.email,
      cc: "",
      subject: sourceEmail.subject.startsWith("Re:")
        ? sourceEmail.subject
        : `Re: ${sourceEmail.subject}`,
      body: `Hello ${sourceEmail.from.name},\n\n\n\nRegards,\nNetwork Operations Center\n\n--- Original message ---\nFrom: ${sourceEmail.from.name} <${sourceEmail.from.email}>\nSubject: ${sourceEmail.subject}\n\n${sourceEmail.body}`,
    };
  }

  if (mode === "forward" && sourceEmail) {
    return {
      to: "",
      cc: "",
      subject: sourceEmail.subject.startsWith("Fwd:")
        ? sourceEmail.subject
        : `Fwd: ${sourceEmail.subject}`,
      body: `Hello,\n\nPlease see the forwarded operational message below.\n\nRegards,\nNetwork Operations Center\n\n--- Forwarded message ---\nFrom: ${sourceEmail.from.name} <${sourceEmail.from.email}>\nTo: ${sourceEmail.to
        .map((item) => item.email)
        .join(", ")}\nDate: ${formatFullDate(sourceEmail.createdAt)}\nSubject: ${sourceEmail.subject}\n\n${sourceEmail.body}`,
    };
  }

  if (mode === "from-template" && template) {
    return {
      to: "",
      cc: "",
      subject: template.subject,
      body: template.body,
    };
  }

  if (mode === "ai-draft" && sourceEmail) {
    const context = sourceEmail.context;

    return {
      to: "",
      cc: "",
      subject: `Operational update: ${
        context?.incidentTicket ?? sourceEmail.subject
      }`,
      body: `Hello,\n\nWe are currently reviewing an operational event related to ${
        context?.incidentTicket ?? "the selected network issue"
      }.\n\nImpact summary:\n${
        context?.impactSummary ??
        "The current issue requires engineering review and stakeholder communication."
      }\n\nCurrent understanding:\n${
        context?.rootCauseSummary ??
        "Root cause is still under investigation. Monitoring and incident context should be reviewed before final communication."
      }\n\nRecommended action plan:\n${(context?.actionPlan ?? [
        "Validate monitoring indicators",
        "Confirm affected scope",
        "Coordinate technical investigation",
        "Prepare next stakeholder update",
      ])
        .map((item) => `- ${item}`)
        .join("\n")}\n\nRegards,\nNetwork Operations Center`,
    };
  }

  return {
    to: "",
    cc: "",
    subject: "",
    body: "Hello,\n\nPlease find below the operational update.\n\nRegards,\nNetwork Operations Center",
  };
}

function parseParticipants(value: string): MailParticipant[] {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
    .map((email) => ({
      name: email.includes("@") ? email.split("@")[0] : email,
      email,
    }));
}

function buildPreview(body: string) {
  const clean = body.replace(/\s+/g, " ").trim();
  if (!clean) return "No message body.";
  return clean.length > 140 ? `${clean.slice(0, 140)}...` : clean;
}

function inferPriorityFromSource(sourceEmail: InternalEmail | null): MailPriority {
  return sourceEmail?.priority ?? "normal";
}

function buildComposeTags(composeState: ComposeState) {
  const tags = new Set<string>();

  tags.add(composeState.mode);

  if (composeState.template?.source) tags.add(composeState.template.source);
  if (composeState.sourceEmail?.source) tags.add(composeState.sourceEmail.source);
  if (composeState.sourceEmail?.context?.incidentTicket) tags.add("incident-linked");
  if (composeState.mode === "ai-draft") tags.add("ai-draft");
  if (composeState.prefillDraft) tags.add("assistant-draft");

  return Array.from(tags);
}

function readAssistantDraftFromStorage(): AssistantMailDraftPayload | null {
  try {
    const raw = localStorage.getItem("assistant_mail_draft");
    if (!raw) return null;

    const parsed = JSON.parse(raw);

    if (
      parsed &&
      typeof parsed === "object" &&
      typeof parsed.subject === "string" &&
      typeof parsed.body === "string"
    ) {
      return {
        subject: parsed.subject,
        body: parsed.body,
        to: typeof parsed.to === "string" ? parsed.to : "",
        cc: typeof parsed.cc === "string" ? parsed.cc : "",
      };
    }

    return null;
  } catch {
    return null;
  }
}

function formatLabel(value: string) {
  return value
    .split("-")
    .join(" ")
    .split("_")
    .join(" ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function formatRelativeTime(input: string) {
  const date = new Date(input);
  if (Number.isNaN(date.getTime())) return "Unknown";

  const diffMs = Math.max(0, Date.now() - date.getTime());
  const minutes = Math.floor(diffMs / 60000);

  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function formatFullDate(input: string) {
  const date = new Date(input);
  if (Number.isNaN(date.getTime())) return "Unknown time";

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}