import type { ReactNode } from "react";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import NotificationToastViewport from "@/components/notifications/NotificationToastViewport";
import ComingSoonScope from "@/components/system/ComingSoonScope";
import {
  setTechnologyScope,
  useTechnologyScope,
} from "@/stores/technologyScopeStore";

type Props = {
  children: ReactNode;
};

export default function AppShell({ children }: Props) {
  const technology = useTechnologyScope();
  const scopeIsLive = technology === "3G";

  return (
    <div className="min-h-screen bg-transparent text-white">
      <NotificationToastViewport />

      <div className="flex min-h-screen bg-transparent">
        <Sidebar />

        <div className="min-w-0 flex-1 bg-transparent">
          <div className="relative z-[70] px-3 pb-3 pt-3 md:px-4">
            <Topbar />
          </div>

          <main className="relative z-[10] min-w-0 px-3 pb-4 md:px-4 md:pb-5">
            <div className="mx-auto max-w-none">
              {scopeIsLive ? (
                children
              ) : (
                <ComingSoonScope
                  technology={technology}
                  onReturnToLive={() => setTechnologyScope("3G")}
                />
              )}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}