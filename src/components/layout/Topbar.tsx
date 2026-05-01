import {
  CalendarDays,
  Mail,
  Search,
  Settings,
  User,
  LogOut,
} from "lucide-react";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { getStoredUser, getToken, logoutUser } from "@/services/auth";
import NotificationBell from "@/components/notifications/NotificationBell";
import {
  setTechnologyScope,
  useTechnologyScope,
  type TechnologyScope,
} from "@/stores/technologyScopeStore";
import { getCartographyFilterOptions } from "@/services/cartography";
import { getMyProfile } from "@/services/profileService";

const technologyOptions: TechnologyScope[] = ["3G", "4G", "5G"];

type TopbarProfileIdentity = {
  fullName: string;
  email: string;
  role: string;
  avatarUrl: string;
};

export default function Topbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const storedUser = getStoredUser();
  const technology = useTechnologyScope();

  const [dateValue, setDateValue] = useState(() => {
    const now = new Date();
    return now.toISOString().slice(0, 10);
  });
  const [availableDates, setAvailableDates] = useState<string[]>([]);
  const [loadingDates, setLoadingDates] = useState(false);

  const [profileIdentity, setProfileIdentity] = useState<TopbarProfileIdentity>({
    fullName: storedUser?.fullname || "",
    email: storedUser?.email || "",
    role: storedUser?.role || "",
    avatarUrl: "",
  });
  const [loadingProfileIdentity, setLoadingProfileIdentity] = useState(false);

  const [openMenu, setOpenMenu] = useState(false);
  const [menuStyle, setMenuStyle] = useState<{
    top: number;
    left: number;
    width: number;
  } | null>(null);

  const menuRef = useRef<HTMLDivElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);

  const sortedAvailableDates = useMemo(() => {
    return [...availableDates].sort((a, b) => a.localeCompare(b));
  }, [availableDates]);

  const minDate = sortedAvailableDates[0] || undefined;
  const maxDate = sortedAvailableDates[sortedAvailableDates.length - 1] || undefined;

  const isMapPage = location.pathname === "/map";

  const displayName = profileIdentity.fullName || storedUser?.fullname || "User";
  const displayEmail = profileIdentity.email || storedUser?.email || "No email";
  const displayRole = profileIdentity.role || storedUser?.role || "Operator";

  const initials = useMemo(() => {
    const source =
      profileIdentity.fullName ||
      storedUser?.fullname ||
      storedUser?.email ||
      "U";

    return source
      .split(" ")
      .filter(Boolean)
      .map((part: string) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  }, [profileIdentity.fullName, storedUser]);

  function handleLogout() {
    logoutUser();
    navigate("/login");
  }

  async function loadProfileIdentity() {
    const token = getToken();

    if (!token) {
      setProfileIdentity({
        fullName: storedUser?.fullname || "",
        email: storedUser?.email || "",
        role: storedUser?.role || "",
        avatarUrl: "",
      });
      return;
    }

    try {
      setLoadingProfileIdentity(true);

      const response = await getMyProfile();
      const backendProfile = response.profile;

      setProfileIdentity({
        fullName: backendProfile.full_name || storedUser?.fullname || "",
        email: backendProfile.email || storedUser?.email || "",
        role: backendProfile.role || storedUser?.role || "",
        avatarUrl: backendProfile.avatar_url || backendProfile.avatar || "",
      });
    } catch {
      setProfileIdentity({
        fullName: storedUser?.fullname || "",
        email: storedUser?.email || "",
        role: storedUser?.role || "",
        avatarUrl: "",
      });
    } finally {
      setLoadingProfileIdentity(false);
    }
  }

  useEffect(() => {
    loadProfileIdentity();
  }, [location.pathname]);

  useEffect(() => {
    if (openMenu) {
      loadProfileIdentity();
    }
  }, [openMenu]);

  useEffect(() => {
    function handleFocus() {
      loadProfileIdentity();
    }

    function handleProfileUpdated() {
      loadProfileIdentity();
    }

    window.addEventListener("focus", handleFocus);
    window.addEventListener("profile:updated", handleProfileUpdated as EventListener);

    return () => {
      window.removeEventListener("focus", handleFocus);
      window.removeEventListener(
        "profile:updated",
        handleProfileUpdated as EventListener
      );
    };
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      const clickedInsideMenu = menuRef.current?.contains(target);
      const clickedTrigger = triggerRef.current?.contains(target);

      if (!clickedInsideMenu && !clickedTrigger) {
        setOpenMenu(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpenMenu(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  useEffect(() => {
    if (!openMenu || !triggerRef.current) return;

    function updateMenuPosition() {
      if (!triggerRef.current) return;

      const rect = triggerRef.current.getBoundingClientRect();
      const menuWidth = 290;
      const margin = 12;

      let left = rect.right - menuWidth;
      if (left < margin) left = margin;
      if (left + menuWidth > window.innerWidth - margin) {
        left = window.innerWidth - menuWidth - margin;
      }

      const top = rect.bottom + 12;

      setMenuStyle({
        top,
        left,
        width: menuWidth,
      });
    }

    updateMenuPosition();

    window.addEventListener("resize", updateMenuPosition);
    window.addEventListener("scroll", updateMenuPosition, true);

    return () => {
      window.removeEventListener("resize", updateMenuPosition);
      window.removeEventListener("scroll", updateMenuPosition, true);
    };
  }, [openMenu]);

  useEffect(() => {
    if (!isMapPage || technology !== "3G") return;

    let active = true;

    async function loadDates() {
      try {
        setLoadingDates(true);
        const options = await getCartographyFilterOptions();

        if (!active) return;

        const dates = Array.isArray(options?.dates) ? options.dates : [];
        const normalized = dates.filter(Boolean).sort((a, b) => a.localeCompare(b));

        setAvailableDates(normalized);

        const params = new URLSearchParams(location.search);
        const urlDate = params.get("date");

        if (urlDate) {
          const resolved = resolveNearestAvailableDate(urlDate, normalized);
          setDateValue(resolved);
        } else if (normalized.length) {
          const latest = normalized[normalized.length - 1];
          setDateValue(latest);

          params.set("date", latest);
          navigate(
            {
              pathname: location.pathname,
              search: `?${params.toString()}`,
            },
            { replace: true }
          );
        }
      } catch {
        if (!active) return;
        setAvailableDates([]);
      } finally {
        if (active) setLoadingDates(false);
      }
    }

    loadDates();

    return () => {
      active = false;
    };
  }, [isMapPage, technology, location.pathname, location.search, navigate]);

  useEffect(() => {
    if (!isMapPage) return;

    const params = new URLSearchParams(location.search);
    const urlDate = params.get("date");

    if (urlDate && urlDate !== dateValue) {
      setDateValue(urlDate);
    }
  }, [isMapPage, location.search, dateValue]);

  function handleDateChange(nextRawDate: string) {
    if (!nextRawDate) return;

    let finalDate = nextRawDate;

    if (availableDates.length) {
      finalDate = resolveNearestAvailableDate(nextRawDate, availableDates);
    }

    setDateValue(finalDate);

    if (isMapPage) {
      const params = new URLSearchParams(location.search);
      params.set("date", finalDate);

      navigate(
        {
          pathname: location.pathname,
          search: `?${params.toString()}`,
        },
        { replace: true }
      );
    }
  }

  return (
    <header className="premium-panel relative z-[80] overflow-visible rounded-[1.45rem]">
      <div className="premium-panel-body px-4 py-3 md:px-5">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div className="min-w-0 flex-1">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
              <div className="min-w-0 flex-1">
                <SearchBar />
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <div className="premium-segmented shrink-0">
                  {technologyOptions.map((item) => {
                    const active = technology === item;
                    const comingSoon = item !== "3G";

                    return (
                      <button
                        key={item}
                        onClick={() => setTechnologyScope(item)}
                        className={[
                          "premium-segmented-item orange-ring-focus min-w-[56px]",
                          active ? "is-active" : "",
                        ].join(" ")}
                        title={
                          comingSoon
                            ? `${item} scope is coming soon`
                            : "3G live scope"
                        }
                      >
                        {item}
                      </button>
                    );
                  })}
                </div>

                <label className="premium-toolbar-pill orange-ring-focus shrink-0 gap-2.5 rounded-xl border-white/[0.08] bg-white/[0.035] px-3 py-2 text-white/76">
                  <CalendarDays className="h-4 w-4 text-[#ff7900]" />
                  <input
                    type="date"
                    value={dateValue}
                    min={minDate}
                    max={maxDate}
                    onChange={(e) => handleDateChange(e.target.value)}
                    className="bg-transparent text-sm text-white/82 outline-none"
                    title={
                      loadingDates
                        ? "Loading dataset dates..."
                        : availableDates.length
                        ? `Available dataset range: ${minDate} → ${maxDate}`
                        : "Choose a date"
                    }
                  />
                </label>
              </div>
            </div>
          </div>

          <div className="flex shrink-0 items-center justify-end gap-2">
            <NotificationBell />

            <button
              onClick={() => navigate("/mail")}
              className="premium-icon-button orange-ring-focus"
              aria-label="Open internal mail"
            >
              <Mail className="h-[18px] w-[18px]" />
            </button>

            <button
              ref={triggerRef}
              onClick={() => setOpenMenu((prev) => !prev)}
              className="orange-ring-focus relative flex h-11 w-11 items-center justify-center rounded-full border border-white/[0.08] bg-[linear-gradient(180deg,rgba(255,255,255,0.045),rgba(255,255,255,0.02))] shadow-[0_8px_20px_rgba(0,0,0,0.22)] transition hover:border-white/[0.12] hover:bg-white/[0.055]"
              aria-label="Open profile menu"
            >
              {profileIdentity.avatarUrl ? (
                <img
                  src={profileIdentity.avatarUrl}
                  alt={displayName}
                  className="h-9 w-9 rounded-full border border-orange-400/18 object-cover shadow-[0_8px_20px_rgba(255,121,0,0.12)]"
                />
              ) : (
                <div className="flex h-9 w-9 items-center justify-center rounded-full border border-orange-400/18 bg-[linear-gradient(180deg,rgba(255,121,0,0.22),rgba(255,121,0,0.12))] text-sm font-semibold text-white shadow-[0_8px_20px_rgba(255,121,0,0.12)]">
                  {initials}
                </div>
              )}

              <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-[#0b1016] bg-emerald-400" />
            </button>
          </div>
        </div>
      </div>

      {openMenu && menuStyle
        ? createPortal(
            <div
              ref={menuRef}
              style={{
                position: "fixed",
                top: menuStyle.top,
                left: menuStyle.left,
                width: menuStyle.width,
                zIndex: 9999,
              }}
              className="overflow-hidden rounded-[1.25rem] border border-white/[0.08] bg-[linear-gradient(180deg,rgba(18,23,30,0.98),rgba(12,17,24,0.98))] shadow-[0_22px_50px_rgba(0,0,0,0.42)] backdrop-blur-xl"
            >
              <div className="border-b border-white/[0.06] px-4 py-4">
                <div className="flex items-center gap-3">
                  {profileIdentity.avatarUrl ? (
                    <img
                      src={profileIdentity.avatarUrl}
                      alt={displayName}
                      className="h-12 w-12 rounded-[0.95rem] border border-white/[0.08] object-cover"
                    />
                  ) : (
                    <div className="flex h-12 w-12 items-center justify-center rounded-[0.95rem] border border-white/[0.08] bg-[linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.025))] text-base font-semibold text-white">
                      {initials}
                    </div>
                  )}

                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-white">
                      {displayName}
                    </p>
                    <p className="mt-1 truncate text-xs text-white/44">
                      {displayEmail}
                    </p>
                    <p className="mt-1 truncate text-[11px] text-orange-200/80">
                      {loadingProfileIdentity ? "Loading..." : displayRole}
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-1 p-2">
                <MenuLink
                  to="/profile"
                  icon={<User className="h-4 w-4" />}
                  label="Profile"
                  description="Personal information and role context"
                  onClick={() => setOpenMenu(false)}
                />

                <MenuLink
                  to="/settings"
                  icon={<Settings className="h-4 w-4" />}
                  label="Settings"
                  description="Interface, preferences, and system options"
                  onClick={() => setOpenMenu(false)}
                />

                <button
                  onClick={handleLogout}
                  className="flex w-full items-start gap-3 rounded-[1rem] px-3 py-3 text-left transition hover:bg-red-500/10"
                >
                  <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-[0.85rem] border border-red-500/16 bg-red-500/10 text-red-300">
                    <LogOut className="h-4 w-4" />
                  </span>

                  <span className="min-w-0">
                    <span className="block text-sm font-medium text-red-200">
                      Logout
                    </span>
                    <span className="mt-0.5 block text-xs text-red-200/60">
                      End current session
                    </span>
                  </span>
                </button>
              </div>
            </div>,
            document.body
          )
        : null}
    </header>
  );
}

function SearchBar() {
  return (
    <div className="relative">
      <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/32" />
      <input
        type="search"
        placeholder="Search sites, cells, incidents, regions..."
        className="premium-input orange-ring-focus w-full pl-11 pr-4 text-sm placeholder:text-white/28"
      />
    </div>
  );
}

function MenuLink({
  to,
  icon,
  label,
  description,
  onClick,
}: {
  to: string;
  icon: ReactNode;
  label: string;
  description: string;
  onClick: () => void;
}) {
  return (
    <Link
      to={to}
      onClick={onClick}
      className="flex items-start gap-3 rounded-[1rem] px-3 py-3 transition hover:bg-white/[0.05]"
    >
      <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-[0.85rem] border border-white/[0.07] bg-white/[0.04] text-white/72">
        {icon}
      </span>

      <span className="min-w-0">
        <span className="block text-sm font-medium text-white/88">
          {label}
        </span>
        <span className="mt-0.5 block text-xs text-white/42">
          {description}
        </span>
      </span>
    </Link>
  );
}

function resolveNearestAvailableDate(inputDate: string, dates: string[]) {
  if (!dates.length) return inputDate;
  if (dates.includes(inputDate)) return inputDate;

  const inputTime = new Date(inputDate).getTime();
  if (Number.isNaN(inputTime)) return dates[dates.length - 1];

  let nearest = dates[0];
  let minDiff = Infinity;

  for (const date of dates) {
    const currentTime = new Date(date).getTime();
    const diff = Math.abs(currentTime - inputTime);

    if (diff < minDiff) {
      minDiff = diff;
      nearest = date;
    }
  }

  return nearest;
}