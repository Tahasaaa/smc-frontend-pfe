export type ChatbotMode =
  | "general"
  | "incident"
  | "rca"
  | "email"
  | "monitoring"
  | "map";

export type ChatbotRole = "assistant" | "user";

export type ChatbotAttachment = {
  id: string;
  name: string;
  type: string;
  sizeLabel: string;
  previewUrl?: string;
};

export type ChatbotAction = {
  label: string;
  prompt: string;
  mode?: ChatbotMode;
};

export type ChatbotContextCard = {
  label: string;
  value: string;
  tone?: "neutral" | "good" | "warning" | "critical" | "ai";
};

export type ChatbotMessage = {
  id: string;
  role: ChatbotRole;
  content: string;
  createdAt: string;
  mode: ChatbotMode;
  attachments?: ChatbotAttachment[];
  contextCards?: ChatbotContextCard[];
  actions?: ChatbotAction[];
};

export type ChatbotQuickPrompt = {
  id: string;
  label: string;
  prompt: string;
  mode: ChatbotMode;
  description: string;
};

export type ChatbotModeMeta = {
  key: ChatbotMode;
  label: string;
  description: string;
};