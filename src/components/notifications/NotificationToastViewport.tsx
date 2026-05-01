import {
  Bot,
  CheckCircle2,
  Info,
  Mail,
  ShieldCheck,
  X,
} from "lucide-react";

import {
  dismissToast,
  useNotificationToasts,
  type NotificationToast,
} from "@/stores/notificationStore";

export default function NotificationToastViewport() {
  const toasts = useNotificationToasts();

  if (toasts.length === 0) return null;

  return (
    <div className="pointer-events-none fixed left-1/2 top-5 z-[10000] flex w-[min(420px,calc(100vw-24px))] -translate-x-1/2 flex-col items-center gap-2">
      {toasts.map((toast) => (
        <NotificationToastCard key={toast.id} toast={toast} />
      ))}
    </div>
  );
}

function NotificationToastCard({ toast }: { toast: NotificationToast }) {
  const meta = toastMeta(toast);

  return (
    <div className="pointer-events-auto flex w-full items-center gap-3 rounded-xl border border-white/[0.08] bg-[rgba(18,24,31,0.96)] px-4 py-3 shadow-[0_14px_38px_rgba(0,0,0,0.34)] backdrop-blur-xl animate-[toastAppear_180ms_ease-out]">
      <div
        className={[
          "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border",
          meta.iconClass,
        ].join(" ")}
      >
        {meta.icon}
      </div>

      <p className="min-w-0 flex-1 truncate text-sm font-medium text-white/88">
        {getToastMessage(toast)}
      </p>

      <button
        onClick={() => dismissToast(toast.id)}
        className="orange-ring-focus rounded-lg p-1.5 text-white/32 transition hover:bg-white/[0.06] hover:text-white/76"
        aria-label="Dismiss notification"
      >
        <X className="h-3.5 w-3.5" />
      </button>

      <style>{`
        @keyframes toastAppear {
          from {
            opacity: 0;
            transform: translateY(-8px) scale(0.98);
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

function getToastMessage(toast: NotificationToast) {
  const title = toast.title.toLowerCase();

  if (title.includes("draft saved")) {
    return "Draft saved successfully";
  }

  if (title.includes("email sent") || title.includes("internal email sent")) {
    return "Email sent successfully";
  }

  if (title.includes("ai draft")) {
    return "AI draft prepared successfully";
  }

  if (toast.severity === "success") {
    return `${toast.title} successfully`;
  }

  return toast.title;
}

function toastMeta(toast: NotificationToast) {
  if (toast.source === "email") {
    return {
      icon: <Mail className="h-4 w-4" />,
      iconClass: "border-emerald-500/16 bg-emerald-500/10 text-emerald-300",
    };
  }

  if (toast.source === "ai") {
    return {
      icon: <Bot className="h-4 w-4" />,
      iconClass: "border-sky-500/16 bg-sky-500/10 text-sky-300",
    };
  }

  if (toast.severity === "success") {
    return {
      icon: <CheckCircle2 className="h-4 w-4" />,
      iconClass: "border-emerald-500/16 bg-emerald-500/10 text-emerald-300",
    };
  }

  if (toast.severity === "info") {
    return {
      icon: <Info className="h-4 w-4" />,
      iconClass: "border-white/[0.08] bg-white/[0.04] text-white/64",
    };
  }

  return {
    icon: <ShieldCheck className="h-4 w-4" />,
    iconClass: "border-orange-500/16 bg-orange-500/10 text-orange-300",
  };
}