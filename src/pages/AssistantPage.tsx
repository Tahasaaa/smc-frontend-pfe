import { useEffect, useMemo, useRef, useState } from "react";
import {
  Archive,
  Bot,
  BrainCog,
  Check,
  Copy,
  Edit3,
  History,
  Mail,
  MapPinned,
  Plus,
  Radio,
  Send,
  ShieldAlert,
  Sparkles,
  ThumbsDown,
  ThumbsUp,
  Trash2,
  User,
  X,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import AppShell from "@/components/layout/AppShell";
import NocPromptBox from "@/components/chatbot/NocPromptBox";
import {
  archiveAssistantConversation,
  deleteAssistantConversation,
  getAssistantConversationMessages,
  getAssistantConversations,
  postAssistantChat,
  renameAssistantConversation,
  submitAssistantMessageFeedback,
  type AssistantConversation,
  type AssistantEmailDraft,
  type AssistantMessageRecord,
  type AssistantRcaDraft,
} from "@/services/assistantService";
import { addNotification } from "@/stores/notificationStore";
import type {
  ChatbotAttachment,
  ChatbotMessage,
  ChatbotMode,
} from "@/types/chatbot";

type PromptSuggestion = {
  id: string;
  label: string;
  prompt: string;
};

type AssistantUiMessage = ChatbotMessage & {
  backendId?: number;
  suggestedActions?: string[];
  emailDraft?: AssistantEmailDraft;
  rcaDraft?: AssistantRcaDraft;
};

const modeSuggestions: Record<ChatbotMode, PromptSuggestion[]> = {
  general: [
    {
      id: "general-1",
      label: "Help me understand this issue",
      prompt:
        "Help me understand this operational issue and tell me what I should check first.",
    },
    {
      id: "general-2",
      label: "Summarize current situation",
      prompt:
        "Summarize the current operational situation in a short and clear way.",
    },
    {
      id: "general-3",
      label: "Suggest next actions",
      prompt:
        "Based on the available context, suggest the next operational actions.",
    },
  ],
  incident: [
    {
      id: "incident-1",
      label: "Explain incident",
      prompt:
        "Explain incident 1 clearly: severity, possible impact, affected scope, and first checks.",
    },
    {
      id: "incident-2",
      label: "Impact summary",
      prompt:
        "Write a short impact summary for incident 1 for operational follow-up.",
    },
    {
      id: "incident-3",
      label: "First triage steps",
      prompt:
        "Give me the first triage steps for incident 1 in the 3G NOC workflow.",
    },
  ],
  rca: [
    {
      id: "rca-1",
      label: "Create RCA structure",
      prompt:
        "Prepare a short RCA draft for the critical 3G site issue on ARI_0060_LM.",
    },
    {
      id: "rca-2",
      label: "Root cause summary",
      prompt:
        "Write a concise root cause summary for the degraded 3G site ARI_0060_LM.",
    },
    {
      id: "rca-3",
      label: "Action plan",
      prompt:
        "Suggest a corrective and preventive action plan for the critical 3G site ARI_0060_LM.",
    },
  ],
  email: [
    {
      id: "email-1",
      label: "Draft stakeholder email",
      prompt:
        "Draft a professional stakeholder email about the critical 3G site issue on ARI_0060_LM.",
    },
    {
      id: "email-2",
      label: "Rewrite professionally",
      prompt:
        "Rewrite this operational message in a more professional and executive tone for a stakeholder audience.",
    },
    {
      id: "email-3",
      label: "Short update mail",
      prompt:
        "Write a short operational update email about the degraded 3G site ARI_0060_LM.",
    },
  ],
  monitoring: [
    {
      id: "monitoring-1",
      label: "Interpret KPIs",
      prompt:
        "Interpret the degradation on 3G site ARI_0060_LM and explain what the KPI situation means.",
    },
    {
      id: "monitoring-2",
      label: "Threshold breach analysis",
      prompt:
        "Explain the threshold breach on 3G site ARI_0060_LM and tell me the first checks.",
    },
    {
      id: "monitoring-3",
      label: "Trend explanation",
      prompt:
        "Explain whether the current KPI trend on 3G site ARI_0060_LM indicates degradation or recovery.",
    },
  ],
  map: [
    {
      id: "map-1",
      label: "Investigate site issue",
      prompt:
        "Guide me through investigating the degraded 3G site ARI_0060_LM from the map perspective.",
    },
    {
      id: "map-2",
      label: "Region analysis",
      prompt:
        "Help me analyze degraded sites in TN2RNC3 using map and operational context.",
    },
    {
      id: "map-3",
      label: "Map to incident flow",
      prompt:
        "Show me how to move from the degraded 3G site ARI_0060_LM to incident validation and monitoring confirmation.",
    },
  ],
};

export default function AssistantPage() {
  const navigate = useNavigate();
  const bottomRef = useRef<HTMLDivElement | null>(null);

  const [messages, setMessages] = useState<AssistantUiMessage[]>([]);
  const [input, setInput] = useState("");
  const [activeMode, setActiveMode] = useState<ChatbotMode>("general");
  const [loading, setLoading] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [loadingConversationId, setLoadingConversationId] = useState<
    number | null
  >(null);
  const [suggestionsVisible, setSuggestionsVisible] = useState(true);

  const [conversations, setConversations] = useState<AssistantConversation[]>(
    []
  );
  const [activeConversationId, setActiveConversationId] = useState<
    number | null
  >(null);

  const [renamingConversationId, setRenamingConversationId] = useState<
    number | null
  >(null);
  const [renameInput, setRenameInput] = useState("");
  const [conversationActionLoadingId, setConversationActionLoadingId] =
    useState<number | null>(null);

  const [feedbackSubmittingId, setFeedbackSubmittingId] = useState<
    number | null
  >(null);
  const [feedbackByMessageId, setFeedbackByMessageId] = useState<
    Record<number, 1 | -1>
  >({});

  const hasMessages = messages.length > 0;

  const currentSuggestions = useMemo(() => {
    return modeSuggestions[activeMode] ?? [];
  }, [activeMode]);

  useEffect(() => {
    void bootstrapAssistant();
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "end",
    });
  }, [messages, loading]);

  useEffect(() => {
    setSuggestionsVisible(true);
  }, [activeMode]);

  async function bootstrapAssistant() {
    const token = getStoredToken();

    if (!token) {
      return;
    }

    try {
      setLoadingHistory(true);

      const history = await getAssistantConversations(token);
      setConversations(history);

      if (history.length > 0) {
        const latestConversation = history[0];
        setActiveConversationId(latestConversation.id);
        setActiveMode(latestConversation.mode);
        await openConversation(
          latestConversation.id,
          latestConversation.mode,
          token
        );
      }
    } catch {
      // keep page usable if assistant history is not available
    } finally {
      setLoadingHistory(false);
    }
  }

  async function refreshConversations(preferredConversationId?: number) {
    const token = getStoredToken();
    if (!token) return;

    try {
      const history = await getAssistantConversations(token);
      setConversations(history);

      if (
        preferredConversationId &&
        history.some((item) => item.id === preferredConversationId)
      ) {
        setActiveConversationId(preferredConversationId);
      }
    } catch {
      // ignore refresh error
    }
  }

  async function openConversation(
    conversationId: number,
    forcedMode?: ChatbotMode,
    forcedToken?: string
  ) {
    const token = forcedToken || getStoredToken();
    if (!token) return;

    try {
      setLoadingConversationId(conversationId);
      const response = await getAssistantConversationMessages(
        conversationId,
        token
      );

      const mappedMessages = response.messages.map(mapBackendMessageToUiMessage);

      setMessages(mappedMessages);
      setActiveConversationId(response.conversation.id);
      setActiveMode((forcedMode || response.conversation.mode) as ChatbotMode);
      setSuggestionsVisible(mappedMessages.length === 0);
    } catch (error) {
      const rawMessage = error instanceof Error ? error.message : "Unknown error";

      setMessages([
        {
          id: `history-error-${Date.now()}`,
          role: "assistant",
          mode: "general",
          createdAt: new Date().toISOString(),
          content: `Failed to load conversation history.\n\n${rawMessage}`,
        },
      ]);
    } finally {
      setLoadingConversationId(null);
    }
  }

  function startNewConversation() {
    setMessages([]);
    setInput("");
    setActiveConversationId(null);
    setActiveMode("general");
    setSuggestionsVisible(true);
    setRenamingConversationId(null);
    setRenameInput("");
  }

  async function handleSend(
    message: string,
    mode: ChatbotMode,
    attachments: ChatbotAttachment[]
  ) {
    if (!message.trim() && attachments.length === 0) return;

    const submittedMessage = message || "Attached operational context.";

    const userMessage: AssistantUiMessage = {
      id: `msg-user-${Date.now()}`,
      role: "user",
      mode,
      content: submittedMessage,
      createdAt: new Date().toISOString(),
      attachments,
    };

    setMessages((prev) => [...prev, userMessage]);
    setLoading(true);
    setSuggestionsVisible(false);

    try {
      const token = getStoredToken();

      if (!token) {
        throw new Error(
          "No access token found in localStorage. Please log in again."
        );
      }

      const response = await postAssistantChat(
        {
          message: submittedMessage,
          mode,
          conversationId: activeConversationId,
          context: {
            technology: "3G",
            incidentId: extractIncidentId(submittedMessage),
            selectedSite: extractSelectedSite(submittedMessage),
            kpis: [],
            rca: null,
            emailDraft: null,
          },
        },
        token
      );

      const resolvedConversationId = response.conversationId;

      if (!activeConversationId) {
        setActiveConversationId(resolvedConversationId);
      }

      const assistantMessage: AssistantUiMessage = {
        id: response.assistantMessageId
          ? `backend-msg-${response.assistantMessageId}`
          : `msg-assistant-${Date.now()}`,
        backendId: response.assistantMessageId,
        role: "assistant",
        mode,
        createdAt: new Date().toISOString(),
        content: response.answer?.trim() || "",
        suggestedActions: response.suggestedActions ?? [],
        emailDraft: response.emailDraft,
        rcaDraft: response.rcaDraft,
      };

      setMessages((prev) => [...prev, assistantMessage]);
      await refreshConversations(resolvedConversationId);
    } catch (error) {
      const rawMessage = error instanceof Error ? error.message : "Unknown error";

      const isAuthError =
        rawMessage.includes("Given token not valid for any token type") ||
        rawMessage.includes("Authentication credentials were not provided") ||
        rawMessage.includes("token_not_valid") ||
        rawMessage.includes("401");

      const errorMessage: AssistantUiMessage = {
        id: `msg-assistant-error-${Date.now()}`,
        role: "assistant",
        mode,
        createdAt: new Date().toISOString(),
        content: isAuthError
          ? "Your session has expired. Please log in again, then retry your assistant request."
          : `Assistant request failed.\n\n${rawMessage}`,
      };

      setMessages((prev) => [...prev, errorMessage]);

      if (isAuthError) {
        localStorage.removeItem("assistant_mail_draft");
      }
    } finally {
      setLoading(false);
      setInput("");
    }
  }

  function applySuggestion(prompt: string) {
    setInput(prompt);
  }

  function openDraftInMail(draft: NonNullable<AssistantEmailDraft>) {
    localStorage.setItem("assistant_mail_draft", JSON.stringify(draft));
    navigate("/mail");
  }

  function beginRenameConversation(conversation: AssistantConversation) {
    setRenamingConversationId(conversation.id);
    setRenameInput(conversation.title);
  }

  async function submitRenameConversation(conversationId: number) {
    const token = getStoredToken();
    const cleanTitle = renameInput.trim();

    if (!token || !cleanTitle) return;

    try {
      setConversationActionLoadingId(conversationId);

      const updated = await renameAssistantConversation(
        conversationId,
        cleanTitle,
        token
      );

      setConversations((prev) =>
        prev.map((item) => (item.id === conversationId ? updated : item))
      );

      setRenamingConversationId(null);
      setRenameInput("");

      void addNotification({
        title: "Conversation renamed",
        message: `Assistant conversation renamed to "${cleanTitle}".`,
        severity: "success",
        source: "ai",
        entityLabel: "NOC Assistant",
        action: {
          label: "Open assistant",
          href: "/assistant",
        },
        metadata: {
          module: "assistant",
          action: "rename_conversation",
          conversationId,
        },
      });
    } catch (error) {
      const rawMessage = error instanceof Error ? error.message : "Unknown error";
      alert(`Rename failed: ${rawMessage}`);
    } finally {
      setConversationActionLoadingId(null);
    }
  }

  async function handleArchiveConversation(conversationId: number) {
    const token = getStoredToken();
    if (!token) return;

    const confirmed = window.confirm("Archive this conversation?");
    if (!confirmed) return;

    try {
      setConversationActionLoadingId(conversationId);
      await archiveAssistantConversation(conversationId, token);

      setConversations((prev) =>
        prev.filter((item) => item.id !== conversationId)
      );

      if (activeConversationId === conversationId) {
        startNewConversation();
      }

      void addNotification({
        title: "Conversation archived",
        message: "Assistant conversation archived successfully.",
        severity: "info",
        source: "ai",
        entityLabel: "NOC Assistant",
        action: {
          label: "Open assistant",
          href: "/assistant",
        },
        metadata: {
          module: "assistant",
          action: "archive_conversation",
          conversationId,
        },
      });
    } catch (error) {
      const rawMessage = error instanceof Error ? error.message : "Unknown error";
      alert(`Archive failed: ${rawMessage}`);
    } finally {
      setConversationActionLoadingId(null);
    }
  }

  async function handleDeleteConversation(conversationId: number) {
    const token = getStoredToken();
    if (!token) return;

    const confirmed = window.confirm(
      "Delete this conversation from visible history? It will remain archived in the database."
    );
    if (!confirmed) return;

    try {
      setConversationActionLoadingId(conversationId);
      await deleteAssistantConversation(conversationId, token);

      setConversations((prev) =>
        prev.filter((item) => item.id !== conversationId)
      );

      if (activeConversationId === conversationId) {
        startNewConversation();
      }

      void addNotification({
        title: "Conversation deleted",
        message: "Assistant conversation removed from visible history.",
        severity: "warning",
        source: "ai",
        entityLabel: "NOC Assistant",
        action: {
          label: "Open assistant",
          href: "/assistant",
        },
        metadata: {
          module: "assistant",
          action: "delete_conversation",
          conversationId,
        },
      });
    } catch (error) {
      const rawMessage = error instanceof Error ? error.message : "Unknown error";
      alert(`Delete failed: ${rawMessage}`);
    } finally {
      setConversationActionLoadingId(null);
    }
  }

  async function handleMessageFeedback(messageId: number, rating: 1 | -1) {
    const token = getStoredToken();
    if (!token) return;

    try {
      setFeedbackSubmittingId(messageId);

      await submitAssistantMessageFeedback(
        messageId,
        {
          rating,
          notes: "",
          corrected_answer: "",
          use_for_finetuning: rating === 1,
        },
        token
      );

      setFeedbackByMessageId((prev) => ({
        ...prev,
        [messageId]: rating,
      }));

      void addNotification({
        title:
          rating === 1
            ? "Positive assistant feedback saved"
            : "Assistant feedback saved",
        message:
          rating === 1
            ? "This assistant response was marked as useful and can support future dataset curation."
            : "This assistant response was marked for review and improvement.",
        severity: rating === 1 ? "success" : "warning",
        source: "ai",
        entityLabel: "Assistant Feedback",
        action: {
          label: "Open assistant",
          href: "/assistant",
        },
        metadata: {
          module: "assistant",
          action: "message_feedback",
          messageId,
          rating,
          useForFinetuning: rating === 1,
        },
      });
    } catch (error) {
      const rawMessage = error instanceof Error ? error.message : "Unknown error";
      alert(`Feedback failed: ${rawMessage}`);
    } finally {
      setFeedbackSubmittingId(null);
    }
  }

  return (
    <AppShell>
      <div className="relative min-h-[calc(100vh-116px)] overflow-hidden rounded-[1.7rem] border border-white/[0.07]">
        <div className="absolute inset-0 bg-[radial-gradient(125%_125%_at_50%_101%,rgba(255,121,0,0.96)_8%,rgba(255,121,0,0.62)_18%,rgba(255,172,96,0.35)_28%,rgba(21,24,35,0.84)_58%,rgba(7,11,18,1)_100%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(5,9,14,0.24),rgba(5,9,14,0.56))]" />

        <div className="relative z-10 grid min-h-[calc(100vh-116px)] grid-cols-1 xl:grid-cols-[300px_minmax(0,1fr)]">
          <aside className="border-b border-white/[0.06] bg-black/18 backdrop-blur xl:border-b-0 xl:border-r">
            <div className="flex items-center justify-between border-b border-white/[0.06] px-4 py-4">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/36">
                  Assistant history
                </p>
                <p className="mt-1 text-sm text-white/56">
                  Resume previous operational threads
                </p>
              </div>

              <button
                type="button"
                onClick={startNewConversation}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-white/[0.08] bg-white/[0.04] text-white/72 transition hover:bg-white/[0.08] hover:text-white"
                title="New conversation"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>

            <div className="max-h-[calc(100vh-220px)] overflow-y-auto px-3 py-3">
              {loadingHistory ? (
                <div className="rounded-2xl border border-white/[0.08] bg-black/16 px-4 py-4 text-sm text-white/52">
                  Loading conversation history...
                </div>
              ) : conversations.length === 0 ? (
                <div className="rounded-2xl border border-white/[0.08] bg-black/16 px-4 py-4 text-sm text-white/48">
                  No saved conversation yet. Start a new assistant request.
                </div>
              ) : (
                <div className="space-y-2">
                  {conversations.map((conversation) => {
                    const active = activeConversationId === conversation.id;
                    const isLoadingThis =
                      loadingConversationId === conversation.id;
                    const isActionLoading =
                      conversationActionLoadingId === conversation.id;
                    const isRenaming =
                      renamingConversationId === conversation.id;

                    return (
                      <div
                        key={conversation.id}
                        className={[
                          "w-full rounded-[1.15rem] border px-3 py-3 text-left transition backdrop-blur",
                          active
                            ? "border-orange-300/18 bg-orange-500/12 text-white"
                            : "border-white/[0.07] bg-black/18 text-white/72 hover:bg-black/24 hover:text-white",
                        ].join(" ")}
                      >
                        <div className="mb-2 flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              void openConversation(
                                conversation.id,
                                conversation.mode as ChatbotMode
                              )
                            }
                            className="flex h-8 w-8 items-center justify-center rounded-full bg-white/[0.06] text-white/70 transition hover:bg-white/[0.1] hover:text-white"
                            title="Open conversation"
                          >
                            <History className="h-4 w-4" />
                          </button>

                          <span className="rounded-full border border-white/[0.08] bg-white/[0.04] px-2 py-0.5 text-[10px] uppercase tracking-[0.12em] text-white/40">
                            {conversation.mode}
                          </span>
                        </div>

                        {isRenaming ? (
                          <input
                            value={renameInput}
                            onChange={(event) =>
                              setRenameInput(event.target.value)
                            }
                            onKeyDown={(event) => {
                              if (event.key === "Enter") {
                                event.preventDefault();
                                void submitRenameConversation(conversation.id);
                              }

                              if (event.key === "Escape") {
                                setRenamingConversationId(null);
                                setRenameInput("");
                              }
                            }}
                            className="w-full rounded-xl border border-white/[0.08] bg-black/24 px-3 py-2 text-sm font-semibold text-white outline-none placeholder:text-white/30"
                            autoFocus
                          />
                        ) : (
                          <button
                            type="button"
                            onClick={() =>
                              void openConversation(
                                conversation.id,
                                conversation.mode as ChatbotMode
                              )
                            }
                            className="w-full text-left"
                          >
                            <p className="line-clamp-2 text-sm font-semibold text-inherit">
                              {conversation.title}
                            </p>
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() =>
                            void openConversation(
                              conversation.id,
                              conversation.mode as ChatbotMode
                            )
                          }
                          className="mt-2 w-full text-left"
                        >
                          <p className="line-clamp-2 text-xs leading-5 text-white/42">
                            {conversation.latest_message_preview ||
                              "No preview available"}
                          </p>

                          <div className="mt-3 flex items-center justify-between text-[11px] text-white/34">
                            <span>{conversation.message_count} msgs</span>
                            <span>
                              {isLoadingThis
                                ? "Opening..."
                                : formatRelativeTime(conversation.updated_at)}
                            </span>
                          </div>
                        </button>

                        <div className="mt-3 flex items-center justify-end gap-1 border-t border-white/[0.06] pt-2">
                          {isRenaming ? (
                            <button
                              type="button"
                              onClick={() =>
                                void submitRenameConversation(conversation.id)
                              }
                              disabled={isActionLoading}
                              className="flex h-8 w-8 items-center justify-center rounded-full text-white/56 transition hover:bg-white/[0.08] hover:text-white disabled:opacity-40"
                              title="Save title"
                            >
                              <Check className="h-3.5 w-3.5" />
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() =>
                                beginRenameConversation(conversation)
                              }
                              disabled={isActionLoading}
                              className="flex h-8 w-8 items-center justify-center rounded-full text-white/44 transition hover:bg-white/[0.08] hover:text-white disabled:opacity-40"
                              title="Rename conversation"
                            >
                              <Edit3 className="h-3.5 w-3.5" />
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() =>
                              void handleArchiveConversation(conversation.id)
                            }
                            disabled={isActionLoading}
                            className="flex h-8 w-8 items-center justify-center rounded-full text-white/44 transition hover:bg-white/[0.08] hover:text-white disabled:opacity-40"
                            title="Archive conversation"
                          >
                            <Archive className="h-3.5 w-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              void handleDeleteConversation(conversation.id)
                            }
                            disabled={isActionLoading}
                            className="flex h-8 w-8 items-center justify-center rounded-full text-white/44 transition hover:bg-red-500/12 hover:text-red-200 disabled:opacity-40"
                            title="Delete conversation"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </aside>

          {!hasMessages ? (
            <div className="flex min-h-[calc(100vh-116px)] items-center justify-center px-4">
              <div className="w-full max-w-[620px]">
                <div className="mb-6 text-center">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/42">
                    NOC Assistant
                  </p>
                  <h1 className="mt-2 text-[1.7rem] font-semibold tracking-[-0.06em] text-white md:text-[2rem]">
                    How can I help with operations?
                  </h1>
                  <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-white/48">
                    Ask about incidents, RCA, email drafting, monitoring KPIs, or
                    map investigation.
                  </p>
                </div>

                <div className="relative">
                  {suggestionsVisible ? (
                    <div className="mb-4 flex justify-center">
                      <SuggestionStack
                        mode={activeMode}
                        items={currentSuggestions}
                        onSelect={applySuggestion}
                        onClose={() => setSuggestionsVisible(false)}
                      />
                    </div>
                  ) : null}

                  <NocPromptBox
                    value={input}
                    activeMode={activeMode}
                    isLoading={loading}
                    onChange={setInput}
                    onModeChange={setActiveMode}
                    onSubmit={handleSend}
                    placeholder="Type your message here..."
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="flex min-h-[calc(100vh-116px)] flex-col">
              <div className="mx-auto flex w-full max-w-[880px] flex-1 flex-col gap-4 overflow-y-auto px-4 py-8">
                {messages.map((message) => (
                  <ChatMessageBubble
                    key={message.id}
                    message={message}
                    onOpenDraftInMail={openDraftInMail}
                    onFeedback={handleMessageFeedback}
                    feedbackValue={
                      message.backendId
                        ? feedbackByMessageId[message.backendId]
                        : undefined
                    }
                    feedbackSubmitting={
                      message.backendId
                        ? feedbackSubmittingId === message.backendId
                        : false
                    }
                  />
                ))}

                {loading ? <TypingBubble /> : null}

                <div ref={bottomRef} />
              </div>

              <div className="mx-auto w-full max-w-[760px] px-4 pb-6">
                {suggestionsVisible ? (
                  <div className="mb-4 flex justify-center">
                    <SuggestionStack
                      mode={activeMode}
                      items={currentSuggestions}
                      onSelect={applySuggestion}
                      onClose={() => setSuggestionsVisible(false)}
                    />
                  </div>
                ) : null}

                <NocPromptBox
                  value={input}
                  activeMode={activeMode}
                  isLoading={loading}
                  onChange={setInput}
                  onModeChange={(mode) => {
                    setActiveMode(mode);
                    setSuggestionsVisible(true);
                  }}
                  onSubmit={handleSend}
                  placeholder="Continue the operational conversation..."
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}

function SuggestionStack({
  mode,
  items,
  onSelect,
  onClose,
}: {
  mode: ChatbotMode;
  items: PromptSuggestion[];
  onSelect: (prompt: string) => void;
  onClose: () => void;
}) {
  return (
    <div className="flex max-w-[620px] flex-wrap items-center justify-center gap-2.5">
      {items.map((item, index) => (
        <button
          key={item.id}
          type="button"
          onClick={() => onSelect(item.prompt)}
          style={{ animationDelay: `${index * 70}ms` }}
          className={[
            "group relative flex min-h-[44px] max-w-[260px] items-center gap-3 overflow-hidden rounded-[1rem]",
            "border border-orange-200/12",
            "bg-[linear-gradient(180deg,rgba(36,34,30,0.88)_0%,rgba(20,19,17,0.94)_100%)]",
            "px-4 py-2.5 text-left text-sm font-medium text-[#f4eadb]",
            "shadow-[0_18px_45px_rgba(0,0,0,0.30),inset_0_1px_0_rgba(255,255,255,0.08),inset_0_-1px_0_rgba(0,0,0,0.28)]",
            "backdrop-blur-xl transition-all duration-200 ease-out",
            "animate-[museumSuggestionIn_240ms_ease-out_both]",
            "hover:-translate-y-[1px] hover:border-orange-200/22 hover:bg-[linear-gradient(180deg,rgba(43,39,33,0.92)_0%,rgba(23,21,18,0.96)_100%)]",
            "hover:shadow-[0_22px_56px_rgba(0,0,0,0.36),0_0_0_1px_rgba(255,121,0,0.035),inset_0_1px_0_rgba(255,255,255,0.10)]",
            "active:translate-y-0 active:scale-[0.99]",
          ].join(" ")}
        >
          <span className="pointer-events-none absolute inset-x-4 top-0 h-px bg-gradient-to-r from-transparent via-orange-100/22 to-transparent" />
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[0.75rem] border border-orange-200/10 bg-orange-500/[0.055] text-orange-200/88 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
            {getModeIcon(mode)}
          </span>
          <span className="min-w-0 flex-1 truncate tracking-[-0.01em]">
            {item.label}
          </span>
          <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#ff7900]/70 shadow-[0_0_10px_rgba(255,121,0,0.24)] opacity-70 transition group-hover:opacity-100" />
        </button>
      ))}

      <button
        type="button"
        onClick={onClose}
        className={[
          "flex h-11 w-11 items-center justify-center rounded-full",
          "border border-orange-200/12",
          "bg-[linear-gradient(180deg,rgba(36,34,30,0.88)_0%,rgba(20,19,17,0.94)_100%)]",
          "text-[#f4eadb]",
          "shadow-[0_18px_45px_rgba(0,0,0,0.30),inset_0_1px_0_rgba(255,255,255,0.08)]",
          "backdrop-blur-xl transition-all duration-200",
          "hover:scale-[1.035] hover:border-orange-200/22 hover:bg-[linear-gradient(180deg,rgba(43,39,33,0.92)_0%,rgba(23,21,18,0.96)_100%)]",
          "active:scale-[0.97]",
        ].join(" ")}
        aria-label="Close suggestions"
      >
        <X className="h-5 w-5 text-orange-100/80" />
      </button>

      <style>{`
        @keyframes museumSuggestionIn {
          from {
            opacity: 0;
            transform: translateY(6px) scale(0.985);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
      `}</style>
    </div>
  );
}

function ChatMessageBubble({
  message,
  onOpenDraftInMail,
  onFeedback,
  feedbackValue,
  feedbackSubmitting,
}: {
  message: AssistantUiMessage;
  onOpenDraftInMail: (draft: NonNullable<AssistantEmailDraft>) => void;
  onFeedback: (messageId: number, rating: 1 | -1) => void;
  feedbackValue?: 1 | -1;
  feedbackSubmitting?: boolean;
}) {
  const isUser = message.role === "user";

  return (
    <div
      className={["flex gap-3", isUser ? "justify-end" : "justify-start"].join(
        " "
      )}
    >
      {!isUser ? (
        <span className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-black/30 text-white/72 backdrop-blur">
          <Bot className="h-4 w-4" />
        </span>
      ) : null}

      <div
        className={[
          "max-w-[760px] rounded-[1.25rem] border px-4 py-3 backdrop-blur",
          isUser
            ? "border-orange-400/18 bg-orange-500/16 text-white"
            : "border-white/[0.08] bg-black/24 text-white/78",
        ].join(" ")}
      >
        <div className="mb-1 flex items-center gap-2">
          <span className="text-xs font-semibold text-white/76">
            {isUser ? "You" : "NOC Assistant"}
          </span>
          <span className="rounded-full border border-white/[0.08] bg-white/[0.04] px-2 py-0.5 text-[10px] uppercase tracking-[0.12em] text-white/36">
            {message.mode}
          </span>
        </div>

        {message.content ? (
          <p className="whitespace-pre-line text-sm leading-7">
            {message.content}
          </p>
        ) : null}

        {!isUser && message.suggestedActions?.length ? (
          <div className="mt-4">
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-white/38">
              Suggested actions
            </p>
            <div className="space-y-2">
              {message.suggestedActions.map((action, index) => (
                <div
                  key={`${message.id}-action-${index}`}
                  className="rounded-xl border border-white/[0.06] bg-white/[0.03] px-3 py-2 text-sm text-white/72"
                >
                  <span className="mr-2 text-orange-200/80">{index + 1}.</span>
                  {action}
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {!isUser && message.emailDraft ? (
          <EmailDraftCard
            draft={message.emailDraft}
            onOpenDraftInMail={onOpenDraftInMail}
          />
        ) : null}

        {!isUser && message.rcaDraft ? (
          <RcaDraftCard draft={message.rcaDraft} />
        ) : null}

        {message.attachments?.length ? (
          <div className="mt-3 flex flex-wrap gap-2">
            {message.attachments.map((attachment) => (
              <div
                key={attachment.id}
                className="flex items-center gap-2 rounded-xl border border-white/[0.08] bg-black/20 px-3 py-2"
              >
                {attachment.previewUrl ? (
                  <img
                    src={attachment.previewUrl}
                    alt={attachment.name}
                    className="h-8 w-8 rounded-lg object-cover"
                  />
                ) : null}

                <div className="min-w-0">
                  <p className="max-w-[180px] truncate text-xs text-white/70">
                    {attachment.name}
                  </p>
                  <p className="text-[10px] text-white/35">
                    {attachment.sizeLabel}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : null}

        {!isUser && message.backendId ? (
          <div className="mt-4 flex items-center justify-between border-t border-white/[0.06] pt-3">
            <p className="text-[11px] text-white/36">
              {feedbackValue
                ? "Feedback submitted for future dataset curation."
                : "Was this assistant response useful?"}
            </p>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => onFeedback(message.backendId as number, 1)}
                disabled={feedbackSubmitting}
                className={[
                  "flex h-8 w-8 items-center justify-center rounded-full border transition disabled:opacity-40",
                  feedbackValue === 1
                    ? "border-orange-300/22 bg-orange-500/16 text-orange-100"
                    : "border-white/[0.08] bg-white/[0.03] text-white/46 hover:bg-white/[0.07] hover:text-white",
                ].join(" ")}
                title="Good answer"
              >
                <ThumbsUp className="h-3.5 w-3.5" />
              </button>

              <button
                type="button"
                onClick={() => onFeedback(message.backendId as number, -1)}
                disabled={feedbackSubmitting}
                className={[
                  "flex h-8 w-8 items-center justify-center rounded-full border transition disabled:opacity-40",
                  feedbackValue === -1
                    ? "border-red-300/22 bg-red-500/16 text-red-100"
                    : "border-white/[0.08] bg-white/[0.03] text-white/46 hover:bg-white/[0.07] hover:text-white",
                ].join(" ")}
                title="Bad answer"
              >
                <ThumbsDown className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        ) : null}
      </div>

      {isUser ? (
        <span className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-orange-500/18 text-orange-100 backdrop-blur">
          <User className="h-4 w-4" />
        </span>
      ) : null}
    </div>
  );
}

function EmailDraftCard({
  draft,
  onOpenDraftInMail,
}: {
  draft: NonNullable<AssistantEmailDraft>;
  onOpenDraftInMail: (draft: NonNullable<AssistantEmailDraft>) => void;
}) {
  async function copyText(text: string) {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // ignore clipboard errors
    }
  }

  return (
    <div className="mt-4 overflow-hidden rounded-[1.15rem] border border-orange-300/14 bg-[linear-gradient(180deg,rgba(34,27,21,0.86)_0%,rgba(17,15,14,0.94)_100%)] shadow-[0_18px_50px_rgba(0,0,0,0.28)]">
      <div className="flex items-center justify-between border-b border-white/[0.06] px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-orange-500/14 text-orange-200">
            <Mail className="h-4 w-4" />
          </span>
          <div>
            <p className="text-sm font-semibold text-white">
              Generated email draft
            </p>
            <p className="text-xs text-white/42">
              Ready to review or send to Mail
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => copyText(draft.subject)}
            className="rounded-lg border border-white/[0.08] bg-white/[0.04] px-3 py-2 text-xs text-white/70 transition hover:bg-white/[0.08] hover:text-white"
          >
            Copy subject
          </button>
          <button
            type="button"
            onClick={() => copyText(draft.body)}
            className="rounded-lg border border-white/[0.08] bg-white/[0.04] px-3 py-2 text-xs text-white/70 transition hover:bg-white/[0.08] hover:text-white"
          >
            <Copy className="mr-1 inline h-3.5 w-3.5" />
            Copy body
          </button>
          <button
            type="button"
            onClick={() => onOpenDraftInMail(draft)}
            className="rounded-lg border border-orange-300/20 bg-orange-500/14 px-3 py-2 text-xs font-medium text-orange-100 transition hover:bg-orange-500/22"
          >
            <Send className="mr-1 inline h-3.5 w-3.5" />
            Open in Mail
          </button>
        </div>
      </div>

      <div className="px-4 py-4">
        <div className="mb-3 rounded-xl border border-white/[0.06] bg-black/20 px-3 py-3">
          <p className="mb-1 text-[11px] uppercase tracking-[0.14em] text-white/38">
            Subject
          </p>
          <p className="text-sm font-medium text-white/90">{draft.subject}</p>
        </div>

        <div className="rounded-xl border border-white/[0.06] bg-black/20 px-3 py-3">
          <p className="mb-2 text-[11px] uppercase tracking-[0.14em] text-white/38">
            Message body
          </p>
          <p className="whitespace-pre-line text-sm leading-7 text-white/78">
            {draft.body}
          </p>
        </div>
      </div>
    </div>
  );
}

function RcaDraftCard({ draft }: { draft: NonNullable<AssistantRcaDraft> }) {
  return (
    <div className="mt-4 overflow-hidden rounded-[1.15rem] border border-white/[0.08] bg-[linear-gradient(180deg,rgba(18,18,18,0.80)_0%,rgba(11,11,12,0.92)_100%)] shadow-[0_18px_50px_rgba(0,0,0,0.28)]">
      <div className="border-b border-white/[0.06] px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-orange-500/14 text-orange-200">
            <BrainCog className="h-4 w-4" />
          </span>
          <div>
            <p className="text-sm font-semibold text-white">RCA draft</p>
            <p className="text-xs text-white/42">
              Structured investigation summary
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-3 px-4 py-4">
        <SectionBlock title="Title" content={draft.title} />
        <SectionBlock title="Impact Summary" content={draft.impactSummary} />
        <SectionBlock
          title="Root Cause Summary"
          content={draft.rootCauseSummary}
        />
        <ListBlock title="Action Plan" items={draft.actionPlan} />
        <ListBlock title="Preventive Actions" items={draft.preventiveActions} />
      </div>
    </div>
  );
}

function SectionBlock({ title, content }: { title: string; content: string }) {
  return (
    <div className="rounded-xl border border-white/[0.06] bg-black/20 px-3 py-3">
      <p className="mb-1 text-[11px] uppercase tracking-[0.14em] text-white/38">
        {title}
      </p>
      <p className="whitespace-pre-line text-sm leading-7 text-white/78">
        {content}
      </p>
    </div>
  );
}

function ListBlock({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="rounded-xl border border-white/[0.06] bg-black/20 px-3 py-3">
      <p className="mb-2 text-[11px] uppercase tracking-[0.14em] text-white/38">
        {title}
      </p>
      <div className="space-y-2">
        {items.map((item, index) => (
          <p key={`${title}-${index}`} className="text-sm leading-7 text-white/78">
            <span className="mr-2 text-orange-200/80">{index + 1}.</span>
            {item}
          </p>
        ))}
      </div>
    </div>
  );
}

function TypingBubble() {
  return (
    <div className="flex justify-start gap-3">
      <span className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-black/30 text-white/72 backdrop-blur">
        <Bot className="h-4 w-4" />
      </span>

      <div className="rounded-[1.25rem] border border-white/[0.08] bg-black/24 px-4 py-3 backdrop-blur">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 animate-pulse rounded-full bg-white/70" />
          <span className="h-2 w-2 animate-pulse rounded-full bg-white/50 [animation-delay:120ms]" />
          <span className="h-2 w-2 animate-pulse rounded-full bg-white/30 [animation-delay:240ms]" />
        </div>
      </div>
    </div>
  );
}

function mapBackendMessageToUiMessage(
  message: AssistantMessageRecord
): AssistantUiMessage {
  return {
    id: `backend-msg-${message.id}`,
    backendId: message.id,
    role: message.role === "assistant" ? "assistant" : "user",
    mode: message.mode,
    createdAt: message.created_at,
    content: message.content || "",
    suggestedActions: message.parsed_payload?.suggestedActions ?? [],
    emailDraft: message.parsed_payload?.emailDraft ?? null,
    rcaDraft: message.parsed_payload?.rcaDraft ?? null,
  };
}

function getStoredToken(): string | null {
  const directKeys = [
    "accessToken",
    "access_token",
    "token",
    "authToken",
    "jwt",
    "access",
  ];

  for (const key of directKeys) {
    const value = localStorage.getItem(key);
    if (value && typeof value === "string") return value;
  }

  for (let i = 0; i < localStorage.length; i += 1) {
    const key = localStorage.key(i);
    if (!key) continue;

    const raw = localStorage.getItem(key);
    if (!raw) continue;

    try {
      const parsed = JSON.parse(raw);
      const found = findTokenInObject(parsed);
      if (found) return found;
    } catch {
      // ignore parsing errors
    }
  }

  return null;
}

function findTokenInObject(value: unknown): string | null {
  if (!value || typeof value !== "object") return null;

  const candidateKeys = [
    "accessToken",
    "access_token",
    "token",
    "authToken",
    "jwt",
    "access",
  ];

  const obj = value as Record<string, unknown>;

  for (const key of candidateKeys) {
    const candidate = obj[key];
    if (typeof candidate === "string" && candidate.trim()) {
      return candidate;
    }
  }

  for (const nested of Object.values(obj)) {
    if (typeof nested === "string" && nested.trim().startsWith("{")) {
      try {
        const parsed = JSON.parse(nested);
        const found = findTokenInObject(parsed);
        if (found) return found;
      } catch {
        // ignore nested parse error
      }
    }

    if (nested && typeof nested === "object") {
      const found = findTokenInObject(nested);
      if (found) return found;
    }
  }

  return null;
}

function extractIncidentId(text: string): number | null {
  const match =
    text.match(/incident\s*#?\s*(\d+)/i) ||
    text.match(/ticket\s*#?\s*(\d+)/i) ||
    text.match(/\b#(\d+)\b/);

  if (!match) return null;

  const parsed = Number(match[1]);
  return Number.isNaN(parsed) ? null : parsed;
}

function extractSelectedSite(text: string): string | null {
  const match = text.match(
    /\b([A-Z]{3}_[0-9]{4}_[A-Z0-9]{2,}(?:_[A-Z0-9]+)?)\b/
  );
  return match ? match[1] : null;
}

function getModeIcon(mode: ChatbotMode) {
  if (mode === "incident") return <ShieldAlert className="h-4 w-4" />;
  if (mode === "rca") return <BrainCog className="h-4 w-4" />;
  if (mode === "email") return <Mail className="h-4 w-4" />;
  if (mode === "monitoring") return <Radio className="h-4 w-4" />;
  if (mode === "map") return <MapPinned className="h-4 w-4" />;
  return <Sparkles className="h-4 w-4" />;
}

function formatRelativeTime(iso: string) {
  const date = new Date(iso);
  const diff = Date.now() - date.getTime();

  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes} min ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} h ago`;

  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} d ago`;

  return date.toLocaleDateString();
}