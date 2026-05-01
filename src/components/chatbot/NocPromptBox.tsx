import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import {
  ArrowUp,
  Bot,
  BrainCog,
  FileText,
  Globe,
  Mail,
  MapPinned,
  Mic,
  Paperclip,
  Radio,
  Settings2,
  ShieldAlert,
  Sparkles,
  X,
} from "lucide-react";

import type { ChatbotAttachment, ChatbotMode } from "@/types/chatbot";

type Props = {
  value: string;
  activeMode: ChatbotMode;
  isLoading?: boolean;
  placeholder?: string;
  onChange: (value: string) => void;
  onModeChange: (mode: ChatbotMode) => void;
  onSubmit: (
    message: string,
    mode: ChatbotMode,
    attachments: ChatbotAttachment[]
  ) => void;
};

const modeOptions: Array<{
  key: ChatbotMode;
  label: string;
  icon: ReactNode;
}> = [
  {
    key: "general",
    label: "General",
    icon: <Sparkles className="h-4 w-4" />,
  },
  {
    key: "incident",
    label: "Incident",
    icon: <ShieldAlert className="h-4 w-4" />,
  },
  {
    key: "rca",
    label: "RCA",
    icon: <BrainCog className="h-4 w-4" />,
  },
  {
    key: "email",
    label: "Email",
    icon: <Mail className="h-4 w-4" />,
  },
  {
    key: "monitoring",
    label: "Monitoring",
    icon: <Radio className="h-4 w-4" />,
  },
  {
    key: "map",
    label: "Map",
    icon: <MapPinned className="h-4 w-4" />,
  },
];

export default function NocPromptBox({
  value,
  activeMode,
  isLoading = false,
  placeholder = "Type your message here...",
  onChange,
  onModeChange,
  onSubmit,
}: Props) {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const uploadInputRef = useRef<HTMLInputElement | null>(null);
  const modeMenuRef = useRef<HTMLDivElement | null>(null);

  const [attachments, setAttachments] = useState<ChatbotAttachment[]>([]);
  const [modeMenuOpen, setModeMenuOpen] = useState(false);

  const hasContent = value.trim().length > 0 || attachments.length > 0;
  const activeModeMeta = modeOptions.find((item) => item.key === activeMode);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    textarea.style.height = "auto";
    textarea.style.height = `${Math.min(textarea.scrollHeight, 150)}px`;
  }, [value]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;

      if (!modeMenuRef.current?.contains(target)) {
        setModeMenuOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setModeMenuOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape as unknown as EventListener);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener(
        "keydown",
        handleEscape as unknown as EventListener
      );
    };
  }, []);

  function submit() {
    if (!hasContent || isLoading) return;

    onSubmit(value.trim(), activeMode, attachments);
    onChange("");
    setAttachments([]);
    setModeMenuOpen(false);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      submit();
    }
  }

  async function handleFileSelection(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    const prepared = await Promise.all(files.slice(0, 3).map(createAttachment));

    setAttachments((prev) => [...prev, ...prepared].slice(0, 3));

    if (event.target) {
      event.target.value = "";
    }
  }

  function removeAttachment(id: string) {
    setAttachments((prev) => prev.filter((item) => item.id !== id));
  }

  return (
    <div className="relative w-full">
      {attachments.length > 0 ? (
        <div className="mb-2 flex flex-wrap gap-2">
          {attachments.map((attachment) => (
            <div
              key={attachment.id}
              className="flex max-w-[220px] items-center gap-2 rounded-xl border border-white/[0.08] bg-black/20 px-3 py-2 backdrop-blur"
            >
              {attachment.previewUrl ? (
                <img
                  src={attachment.previewUrl}
                  alt={attachment.name}
                  className="h-9 w-9 rounded-lg object-cover"
                />
              ) : (
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/[0.06] text-white/50">
                  <FileText className="h-4 w-4" />
                </span>
              )}

              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-medium text-white/78">
                  {attachment.name}
                </p>
                <p className="text-[10px] text-white/35">
                  {attachment.sizeLabel}
                </p>
              </div>

              <button
                onClick={() => removeAttachment(attachment.id)}
                className="rounded-md p-1 text-white/36 transition hover:bg-white/[0.08] hover:text-white"
                aria-label="Remove attachment"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      ) : null}

      <div className="rounded-[1.65rem] border border-white/[0.10] bg-[#1b1d21] px-3 py-3 shadow-[0_28px_80px_rgba(0,0,0,0.38),inset_0_1px_0_rgba(255,255,255,0.04)]">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isLoading}
          rows={1}
          placeholder={getPlaceholder(activeMode, placeholder)}
          className="max-h-[150px] min-h-[46px] w-full resize-none bg-transparent px-1 py-2 text-[15px] leading-6 text-white outline-none placeholder:text-white/42 disabled:opacity-60"
        />

        <div className="mt-1 flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-1.5">
            <button
              type="button"
              onClick={() => uploadInputRef.current?.click()}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-white/52 transition hover:bg-white/[0.08] hover:text-white"
              title="Attach file"
            >
              <Paperclip className="h-[18px] w-[18px]" />
            </button>

            <input
              ref={uploadInputRef}
              type="file"
              multiple
              className="hidden"
              accept="image/*,.pdf,.txt,.csv"
              onChange={handleFileSelection}
            />

            <SmallDivider />

            <button
              type="button"
              onClick={() => onModeChange("general")}
              className={iconButtonClass(activeMode === "general")}
              title="General"
            >
              <Globe className="h-[17px] w-[17px]" />
            </button>

            <SmallDivider />

            <div ref={modeMenuRef} className="relative">
              <button
                type="button"
                onClick={() => setModeMenuOpen((prev) => !prev)}
                className={iconButtonClass(activeMode !== "general")}
                title={`Mode: ${activeModeMeta?.label ?? "General"}`}
              >
                <Settings2 className="h-[17px] w-[17px]" />
              </button>

              {modeMenuOpen ? (
                <div className="absolute bottom-11 left-0 z-[80] w-[230px] overflow-hidden rounded-2xl border border-white/[0.10] bg-[#16191f]/95 p-1.5 shadow-[0_24px_70px_rgba(0,0,0,0.45)] backdrop-blur-xl">
                  {modeOptions.map((mode) => {
                    const active = activeMode === mode.key;

                    return (
                      <button
                        key={mode.key}
                        type="button"
                        onClick={() => {
                          onModeChange(mode.key);
                          setModeMenuOpen(false);
                        }}
                        className={[
                          "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition",
                          active
                            ? "bg-orange-500/14 text-orange-200"
                            : "text-white/62 hover:bg-white/[0.06] hover:text-white",
                        ].join(" ")}
                      >
                        <span
                          className={
                            active ? "text-orange-200" : "text-white/42"
                          }
                        >
                          {mode.icon}
                        </span>
                        <span>{mode.label}</span>
                      </button>
                    );
                  })}
                </div>
              ) : null}
            </div>

            <SmallDivider />

            <button
              type="button"
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-white/38 transition hover:bg-white/[0.08] hover:text-white/70"
              title="Backend AI mode later"
            >
              <Bot className="h-[17px] w-[17px]" />
            </button>
          </div>

          <button
            type="button"
            onClick={submit}
            disabled={isLoading}
            className={[
              "flex h-9 w-9 shrink-0 items-center justify-center rounded-full border transition-all duration-200",
              hasContent && !isLoading
                ? "border-orange-200/28 bg-[linear-gradient(180deg,rgba(255,153,54,1),rgba(255,121,0,0.96),rgba(183,78,0,1))] text-white shadow-[0_12px_28px_rgba(255,121,0,0.34),inset_0_1px_0_rgba(255,255,255,0.28)] hover:scale-[1.04] hover:brightness-110"
                : "border-orange-200/18 bg-[linear-gradient(180deg,rgba(255,153,54,0.92),rgba(255,121,0,0.88),rgba(183,78,0,0.92))] text-white shadow-[0_10px_24px_rgba(255,121,0,0.22),inset_0_1px_0_rgba(255,255,255,0.20)] hover:scale-[1.03]",
            ].join(" ")}
            title={hasContent ? "Send message" : "Voice placeholder"}
          >
            {hasContent ? (
              <ArrowUp className="h-4 w-4 stroke-[2.6] text-white drop-shadow-sm" />
            ) : (
              <Mic className="h-[18px] w-[18px] text-white drop-shadow-sm" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

function SmallDivider() {
  return (
    <span className="mx-1 h-5 w-px shrink-0 bg-gradient-to-b from-transparent via-white/18 to-transparent" />
  );
}

function iconButtonClass(active: boolean) {
  return [
    "flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition",
    active
      ? "bg-orange-500/14 text-orange-300"
      : "text-white/52 hover:bg-white/[0.08] hover:text-white",
  ].join(" ");
}

async function createAttachment(file: File): Promise<ChatbotAttachment> {
  const base: ChatbotAttachment = {
    id: `att-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    name: file.name,
    type: file.type || "unknown",
    sizeLabel: formatFileSize(file.size),
  };

  if (!file.type.startsWith("image/")) return base;

  const previewUrl = await readFileAsDataUrl(file);

  return {
    ...base,
    previewUrl,
  };
}

function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve) => {
    const reader = new FileReader();

    reader.onload = () => {
      resolve(typeof reader.result === "string" ? reader.result : "");
    };

    reader.onerror = () => resolve("");
    reader.readAsDataURL(file);
  });
}

function formatFileSize(size: number) {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${Math.round(size / 1024)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

function getPlaceholder(mode: ChatbotMode, fallback: string) {
  if (mode === "incident") {
    return "Explain an incident, severity, impact, or triage...";
  }

  if (mode === "rca") {
    return "Prepare RCA structure, cause, evidence, or action plan...";
  }

  if (mode === "email") {
    return "Draft or rewrite an operational email...";
  }

  if (mode === "monitoring") {
    return "Interpret KPI behavior, thresholds, or degradation...";
  }

  if (mode === "map") {
    return "Investigate site, region, RNC, or map context...";
  }

  return fallback;
}