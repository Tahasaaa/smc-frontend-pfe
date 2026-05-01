import { apiRequest } from "./api";

const ASSISTANT_API_BASE_URL = "http://127.0.0.1:8003/api";

export type AssistantMode =
  | "general"
  | "incident"
  | "rca"
  | "email"
  | "monitoring"
  | "map";

export type AssistantChatPayload = {
  message: string;
  mode: AssistantMode;
  conversationId?: number | null;
  context?: {
    technology?: string | null;
    incidentId?: number | null;
    selectedSite?: string | null;
    kpis?: unknown[];
    rca?: Record<string, unknown> | null;
    emailDraft?: Record<string, unknown> | null;
  };
};

export type AssistantEmailDraft = {
  subject: string;
  body: string;
} | null;

export type AssistantRcaDraft = {
  title: string;
  impactSummary: string;
  rootCauseSummary: string;
  actionPlan: string[];
  preventiveActions: string[];
} | null;

export type AssistantChatResponse = {
  conversationId: number;
  assistantMessageId?: number;
  answer: string;
  suggestedActions: string[];
  emailDraft?: AssistantEmailDraft;
  rcaDraft?: AssistantRcaDraft;
};

export type AssistantConversation = {
  id: number;
  title: string;
  mode: AssistantMode;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
  last_message_at: string | null;
  message_count: number;
  latest_message_preview: string;
};

export type AssistantMessageRecord = {
  id: number;
  conversation_id: number;
  role: "user" | "assistant" | "system";
  mode: AssistantMode;
  content: string;
  context_snapshot: Record<string, unknown>;
  parsed_payload: {
    suggestedActions?: string[];
    emailDraft?: AssistantEmailDraft;
    rcaDraft?: AssistantRcaDraft;
    raw_answer?: string;
  };
  model_name?: string;
  prompt_version?: string;
  is_training_candidate: boolean;
  created_at: string;
};

export type AssistantConversationMessagesResponse = {
  conversation: AssistantConversation;
  messages: AssistantMessageRecord[];
};

export type AssistantFeedbackPayload = {
  rating: 1 | -1;
  notes?: string;
  corrected_answer?: string;
  use_for_finetuning?: boolean;
};

export type AssistantFeedbackResponse = {
  id: number;
  message_id: number;
  rating: 1 | -1;
  use_for_finetuning: boolean;
  created_at: string;
};

export async function postAssistantChat(
  payload: AssistantChatPayload,
  token?: string
) {
  return apiRequest<AssistantChatResponse>("/assistant/chat/", {
    method: "POST",
    body: payload,
    token,
    baseUrl: ASSISTANT_API_BASE_URL,
  });
}

export async function getAssistantConversations(token?: string) {
  return apiRequest<AssistantConversation[]>("/assistant/conversations/", {
    method: "GET",
    token,
    baseUrl: ASSISTANT_API_BASE_URL,
  });
}

export async function getAssistantConversationMessages(
  conversationId: number,
  token?: string
) {
  return apiRequest<AssistantConversationMessagesResponse>(
    `/assistant/conversations/${conversationId}/messages/`,
    {
      method: "GET",
      token,
      baseUrl: ASSISTANT_API_BASE_URL,
    }
  );
}

export async function renameAssistantConversation(
  conversationId: number,
  title: string,
  token?: string
) {
  return apiRequest<AssistantConversation>(
    `/assistant/conversations/${conversationId}/rename/`,
    {
      method: "PATCH",
      body: { title },
      token,
      baseUrl: ASSISTANT_API_BASE_URL,
    }
  );
}

export async function archiveAssistantConversation(
  conversationId: number,
  token?: string
) {
  return apiRequest<{ id: number; is_archived: boolean; message: string }>(
    `/assistant/conversations/${conversationId}/archive/`,
    {
      method: "PATCH",
      token,
      baseUrl: ASSISTANT_API_BASE_URL,
    }
  );
}

export async function deleteAssistantConversation(
  conversationId: number,
  token?: string
) {
  return apiRequest<void>(`/assistant/conversations/${conversationId}/`, {
    method: "DELETE",
    token,
    baseUrl: ASSISTANT_API_BASE_URL,
  });
}

export async function submitAssistantMessageFeedback(
  messageId: number,
  payload: AssistantFeedbackPayload,
  token?: string
) {
  return apiRequest<AssistantFeedbackResponse>(
    `/assistant/messages/${messageId}/feedback/`,
    {
      method: "POST",
      body: payload,
      token,
      baseUrl: ASSISTANT_API_BASE_URL,
    }
  );
}