import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type ReactNode,
} from "react";
import { useNavigate } from "react-router-dom";
import {
  Camera,
  LockKeyhole,
  Save,
  ShieldCheck,
  Trash2,
  Upload,
  User2,
} from "lucide-react";

import AppShell from "@/components/layout/AppShell";
import { addNotification } from "@/stores/notificationStore";
import {
  getMyProfile,
  updateMyProfile,
  uploadMyAvatar,
  removeMyAvatar,
} from "@/services/profileService";
import { changePasswordUser, logoutUser,getToken  } from "@/services/auth";

type ProfileState = {
  firstName: string;
  lastName: string;
  email: string;
  username: string;
  timezone: string;
  role: string;
  photo?: string;
};

type PasswordState = {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
};

const DEFAULT_PROFILE: ProfileState = {
  firstName: "",
  lastName: "",
  email: "",
  username: "",
  timezone: "Africa/Tunis",
  role: "NOC Engineer",
  photo: "",
};

const DEFAULT_PASSWORD_STATE: PasswordState = {
  currentPassword: "",
  newPassword: "",
  confirmPassword: "",
};

const TIMEZONE_OPTIONS = [
  "Africa/Tunis",
  "Europe/Paris",
  "UTC",
  "Europe/London",
  "Europe/Berlin",
];

export default function ProfilePage() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [profile, setProfile] = useState<ProfileState>(DEFAULT_PROFILE);
  const [passwordForm, setPasswordForm] =
    useState<PasswordState>(DEFAULT_PASSWORD_STATE);

  const [saved, setSaved] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  const fullName = useMemo(() => {
    return [profile.firstName, profile.lastName].filter(Boolean).join(" ").trim();
  }, [profile.firstName, profile.lastName]);

  const initials = useMemo(() => {
    if (!fullName) return "NO";

    return fullName
      .split(" ")
      .filter(Boolean)
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  }, [fullName]);

async function loadProfile() {
  const token = getToken();

  if (!token) {
    navigate("/login", { replace: true });
    return;
  }

  try {
    setLoadingProfile(true);

    const response = await getMyProfile();
    const backendProfile = response.profile;

    const { firstName, lastName } = splitFullName(
      backendProfile.full_name || ""
    );

    setProfile({
      firstName,
      lastName,
      email: backendProfile.email || "",
      username: backendProfile.username || "",
      timezone: backendProfile.timezone || "Africa/Tunis",
      role: backendProfile.role || "NOC Engineer",
      photo: backendProfile.avatar_url || backendProfile.avatar || "",
    });
  } catch (error) {
    if (error instanceof Error && /401|403|Session expired|Invalid token|Token has expired/i.test(error.message)) {
      logoutUser();
      navigate("/login", { replace: true });
      return;
    }

    addNotification({
      title: "Profile load failed",
      message:
        error instanceof Error
          ? error.message
          : "Unable to fetch profile information.",
      severity: "major",
      source: "system",
      entityLabel: "Profile",
    });
  } finally {
    setLoadingProfile(false);
  }
}

  function updateField<K extends keyof ProfileState>(
    key: K,
    value: ProfileState[K]
  ) {
    setSaved(false);
    setProfile((prev) => ({ ...prev, [key]: value }));
  }

  function updatePasswordField<K extends keyof PasswordState>(
    key: K,
    value: PasswordState[K]
  ) {
    setPasswordForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSaveProfile() {
    try {
      setSavingProfile(true);

      const response = await updateMyProfile({
        full_name: fullName,
        timezone: profile.timezone,
      });

      const backendProfile = response.profile;
      const split = splitFullName(backendProfile.full_name || "");

      setProfile((prev) => ({
        ...prev,
        firstName: split.firstName,
        lastName: split.lastName,
        timezone: backendProfile.timezone || prev.timezone,
        role: backendProfile.role || prev.role,
        email: backendProfile.email || prev.email,
        username: backendProfile.username || prev.username,
        photo: backendProfile.avatar_url || backendProfile.avatar || prev.photo,
      }));

      setSaved(true);
      window.dispatchEvent(new Event("profile:updated"));

      addNotification({
        title: "Profile saved",
        message: "Operator profile was saved successfully.",
        severity: "success",
        source: "system",
        entityLabel: "Profile",
      });

      window.setTimeout(() => {
        setSaved(false);
      }, 2200);
    } catch (error) {
      addNotification({
        title: "Save failed",
        message:
          error instanceof Error
            ? error.message
            : "Unable to save profile information.",
        severity: "major",
        source: "system",
        entityLabel: "Profile",
      });
    } finally {
      setSavingProfile(false);
    }
  }

  async function handlePasswordUpdate() {
    if (
      !passwordForm.currentPassword ||
      !passwordForm.newPassword ||
      !passwordForm.confirmPassword
    ) {
      addNotification({
        title: "Missing fields",
        message: "Please fill all password fields.",
        severity: "warning",
        source: "system",
        entityLabel: "Security",
      });
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      addNotification({
        title: "Password mismatch",
        message: "New password and confirmation do not match.",
        severity: "warning",
        source: "system",
        entityLabel: "Security",
      });
      return;
    }

    try {
      setChangingPassword(true);

      const response = await changePasswordUser({
        current_password: passwordForm.currentPassword,
        new_password: passwordForm.newPassword,
        confirm_password: passwordForm.confirmPassword,
      });

      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });

      addNotification({
        title: "Password updated",
        message:
          response.message ||
          "Password updated successfully. Please log in again.",
        severity: "success",
        source: "system",
        entityLabel: "Security",
      });

      setTimeout(() => {
        logoutUser();
        navigate("/login", { replace: true });
      }, 900);
    } catch (error) {
      addNotification({
        title: "Password update failed",
        message:
          error instanceof Error ? error.message : "Unable to update password.",
        severity: "major",
        source: "system",
        entityLabel: "Security",
      });
    } finally {
      setChangingPassword(false);
    }
  }

  function handlePhotoClick() {
    fileInputRef.current?.click();
  }

  async function handlePhotoChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      addNotification({
        title: "Invalid image",
        message: "Please upload a JPG, GIF, PNG, or WEBP image.",
        severity: "warning",
        source: "system",
        entityLabel: "Profile photo",
      });
      return;
    }

    const maxSizeMb = 3;
    const maxSizeBytes = maxSizeMb * 1024 * 1024;

    if (file.size > maxSizeBytes) {
      addNotification({
        title: "Image too large",
        message: `Avatar must be smaller than ${maxSizeMb} MB.`,
        severity: "warning",
        source: "system",
        entityLabel: "Profile photo",
      });
      return;
    }

    const previewUrl = URL.createObjectURL(file);
    setProfile((prev) => ({ ...prev, photo: previewUrl }));

    try {
      setUploadingAvatar(true);

      const response = await uploadMyAvatar(file);
      const backendProfile = response.profile;

      setProfile((prev) => ({
        ...prev,
        photo: backendProfile.avatar_url || backendProfile.avatar || prev.photo,
      }));

      window.dispatchEvent(new Event("profile:updated"));

      addNotification({
        title: "Avatar updated",
        message: "Profile avatar was updated successfully.",
        severity: "success",
        source: "system",
        entityLabel: "Profile photo",
      });
    } catch (error) {
      await loadProfile();

      addNotification({
        title: "Avatar upload failed",
        message:
          error instanceof Error ? error.message : "Unable to upload avatar.",
        severity: "major",
        source: "system",
        entityLabel: "Profile photo",
      });
    } finally {
      setUploadingAvatar(false);
      event.target.value = "";
    }
  }

  async function removePhoto() {
    try {
      setUploadingAvatar(true);

      const response = await removeMyAvatar();
      const backendProfile = response.profile;

      setProfile((prev) => ({
        ...prev,
        photo: backendProfile.avatar_url || backendProfile.avatar || "",
      }));

      window.dispatchEvent(new Event("profile:updated"));

      addNotification({
        title: "Avatar removed",
        message: "Profile avatar was removed successfully.",
        severity: "success",
        source: "system",
        entityLabel: "Profile photo",
      });
    } catch (error) {
      addNotification({
        title: "Avatar removal failed",
        message:
          error instanceof Error ? error.message : "Unable to remove avatar.",
        severity: "major",
        source: "system",
        entityLabel: "Profile photo",
      });
    } finally {
      setUploadingAvatar(false);
    }
  }

  return (
    <AppShell>
      <div className="space-y-3 px-1 pb-3 pt-1 text-white">
        <section className="premium-panel overflow-hidden rounded-[1.2rem]">
          <div className="premium-panel-body relative px-5 py-5 md:px-6 md:py-6">
            <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(8,14,22,0.98),rgba(10,17,26,0.98))]" />
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_78%_16%,rgba(255,121,0,0.12),transparent_22%),radial-gradient(circle_at_14%_100%,rgba(56,189,248,0.05),transparent_22%)]" />
            <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(255,121,0,0.32),transparent)]" />

            <div className="relative z-10 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div className="min-w-0">
                <p className="section-eyebrow">Operator Identity</p>
                <h1 className="mt-2 text-[1.45rem] font-semibold tracking-[-0.055em] text-white md:text-[1.7rem]">
                  Profile Command Surface
                </h1>
                <p className="mt-2 max-w-3xl text-sm leading-6 text-white/52">
                  Manage your operator identity, account details, avatar, and
                  security posture inside the SMC QoS cockpit.
                </p>
              </div>

              <div className="flex items-center gap-2">
                {saved ? (
                  <span className="inline-flex items-center gap-2 rounded-full border border-emerald-500/18 bg-emerald-500/10 px-3 py-2 text-xs font-medium text-emerald-300">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    Saved
                  </span>
                ) : null}

                <button
                  onClick={handleSaveProfile}
                  disabled={savingProfile || loadingProfile}
                  className="inline-flex min-h-[42px] items-center justify-center gap-2 rounded-[0.85rem] border border-orange-400/20 bg-[linear-gradient(180deg,#ff7900,#f06a00)] px-4 py-2.5 text-sm font-semibold text-white shadow-[0_12px_24px_rgba(255,121,0,0.22)] transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Save className="h-4 w-4" />
                  {savingProfile ? "Saving..." : "Save changes"}
                </button>
              </div>
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 gap-3 xl:grid-cols-[320px_minmax(0,1fr)]">
          <aside className="premium-panel overflow-hidden rounded-[1.1rem]">
            <div className="premium-panel-body relative px-5 py-5">
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,121,0,0.08),transparent_42%)]" />

              <div className="relative z-10">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/32">
                  Identity Card
                </p>

                <div className="mt-5 flex flex-col items-center text-center">
                  {loadingProfile ? (
                    <div className="flex h-24 w-24 items-center justify-center rounded-[1rem] border border-white/[0.08] bg-white/[0.03] text-sm text-white/40">
                      Loading...
                    </div>
                  ) : (
                    <div className="relative">
                      {profile.photo ? (
                        <img
                          src={profile.photo}
                          alt={fullName || "Profile"}
                          className="h-24 w-24 rounded-[1rem] border border-white/[0.08] object-cover shadow-[0_18px_34px_rgba(0,0,0,0.28)]"
                        />
                      ) : (
                        <div className="flex h-24 w-24 items-center justify-center rounded-[1rem] border border-orange-400/14 bg-[linear-gradient(135deg,rgba(255,121,0,0.22),rgba(255,180,80,0.10))] text-[1.35rem] font-semibold tracking-[-0.04em] text-white shadow-[0_16px_30px_rgba(255,121,0,0.12)]">
                          {initials}
                        </div>
                      )}

                      <button
                        type="button"
                        onClick={handlePhotoClick}
                        disabled={uploadingAvatar}
                        className="orange-ring-focus absolute -bottom-2 -right-2 flex h-9 w-9 items-center justify-center rounded-[0.85rem] border border-orange-400/20 bg-[#ff7900] text-black shadow-[0_12px_22px_rgba(255,121,0,0.24)] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
                        aria-label="Change avatar"
                      >
                        <Camera className="h-4 w-4" />
                      </button>
                    </div>
                  )}

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/jpg,image/gif,image/webp"
                    className="hidden"
                    onChange={handlePhotoChange}
                  />

                  <h2 className="mt-5 text-[1.2rem] font-semibold tracking-[-0.04em] text-white">
                    {fullName || "Unknown Operator"}
                  </h2>

                  <p className="mt-1 text-sm text-white/44">
                    {profile.email || "No email configured"}
                  </p>

                  <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-orange-400/14 bg-orange-500/10 px-3 py-2 text-xs font-medium text-orange-200">
                    <User2 className="h-3.5 w-3.5" />
                    {profile.role || "NOC Profile"}
                  </div>

                  <div className="mt-5 grid w-full gap-2">
                    <button
                      type="button"
                      onClick={handlePhotoClick}
                      disabled={uploadingAvatar}
                      className="premium-button-ghost orange-ring-focus w-full rounded-[0.85rem] border-white/[0.08] text-white/84 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <Upload className="h-4 w-4" />
                      {uploadingAvatar ? "Uploading..." : "Change avatar"}
                    </button>

                    {profile.photo ? (
                      <button
                        type="button"
                        onClick={removePhoto}
                        disabled={uploadingAvatar}
                        className="orange-ring-focus inline-flex min-h-[42px] w-full items-center justify-center gap-2 rounded-[0.85rem] border border-red-500/16 bg-red-500/10 px-3.5 py-2 text-sm font-medium text-red-200 transition hover:bg-red-500/14 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        <Trash2 className="h-4 w-4" />
                        Remove avatar
                      </button>
                    ) : null}
                  </div>

                  <p className="mt-4 text-center text-xs leading-5 text-white/34">
                    JPG, GIF, PNG or WEBP. 3MB max.
                  </p>
                </div>
              </div>
            </div>
          </aside>

          <div className="grid grid-cols-1 gap-3">
            <section className="premium-panel overflow-hidden rounded-[1.1rem]">
              <div className="premium-panel-header">
                <div>
                  <h2 className="panel-title">Personal Information</h2>
                  <p className="panel-subtitle">
                    Main account identity fields
                  </p>
                </div>
              </div>

              <div className="premium-panel-body">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <Field label="First name">
                    <ProfileInput
                      value={profile.firstName}
                      onChange={(value) => updateField("firstName", value)}
                    />
                  </Field>

                  <Field label="Last name">
                    <ProfileInput
                      value={profile.lastName}
                      onChange={(value) => updateField("lastName", value)}
                    />
                  </Field>

                  <Field label="Email address" className="md:col-span-2">
                    <ProfileInput
                      value={profile.email}
                      onChange={() => {}}
                      disabled
                    />
                  </Field>

                  <Field label="Username" className="md:col-span-2">
                    <ProfileInput
                      value={profile.username}
                      onChange={() => {}}
                      disabled
                    />
                  </Field>

                  <Field label="Timezone" className="md:col-span-2">
                    <ProfileSelect
                      value={profile.timezone}
                      onChange={(value) => updateField("timezone", value)}
                      options={TIMEZONE_OPTIONS}
                    />
                  </Field>
                </div>

                <div className="mt-5 flex justify-end">
                  <button
                    onClick={handleSaveProfile}
                    disabled={savingProfile || loadingProfile}
                    className="inline-flex min-h-[42px] items-center justify-center gap-2 rounded-[0.85rem] border border-orange-400/20 bg-[linear-gradient(180deg,#ff7900,#f06a00)] px-5 py-2.5 text-sm font-semibold text-white shadow-[0_12px_24px_rgba(255,121,0,0.22)] transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <Save className="h-4 w-4" />
                    {savingProfile ? "Saving..." : "Save"}
                  </button>
                </div>
              </div>
            </section>

            <section className="premium-panel overflow-hidden rounded-[1.1rem]">
              <div className="premium-panel-header">
                <div>
                  <h2 className="panel-title">Password & Security</h2>
                  <p className="panel-subtitle">
                    Secure credential update
                  </p>
                </div>
              </div>

              <div className="premium-panel-body">
                <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-xs text-white/58">
                  <LockKeyhole className="h-3.5 w-3.5 text-orange-300" />
                  Password changes require re-authentication
                </div>

                <div className="grid grid-cols-1 gap-4">
                  <Field label="Current password">
                    <ProfileInput
                      type="password"
                      value={passwordForm.currentPassword}
                      onChange={(value) =>
                        updatePasswordField("currentPassword", value)
                      }
                    />
                  </Field>

                  <Field label="New password">
                    <ProfileInput
                      type="password"
                      value={passwordForm.newPassword}
                      onChange={(value) =>
                        updatePasswordField("newPassword", value)
                      }
                    />
                  </Field>

                  <Field label="Confirm new password">
                    <ProfileInput
                      type="password"
                      value={passwordForm.confirmPassword}
                      onChange={(value) =>
                        updatePasswordField("confirmPassword", value)
                      }
                    />
                  </Field>
                </div>

                <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
                  <p className="text-xs text-white/42">
                    You will be redirected to login after a successful password
                    change.
                  </p>

                  <button
                    type="button"
                    onClick={handlePasswordUpdate}
                    disabled={changingPassword}
                    className="inline-flex min-h-[42px] items-center justify-center gap-2 rounded-[0.85rem] border border-orange-400/20 bg-[linear-gradient(180deg,#ff7900,#f06a00)] px-5 py-2.5 text-sm font-semibold text-white shadow-[0_12px_24px_rgba(255,121,0,0.22)] transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <ShieldCheck className="h-4 w-4" />
                    {changingPassword ? "Updating..." : "Update password"}
                  </button>
                </div>
              </div>
            </section>
          </div>
        </section>
      </div>
    </AppShell>
  );
}

function Field({
  label,
  className = "",
  children,
}: {
  label: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-2 block text-[13px] font-semibold text-white">
        {label}
      </span>
      {children}
    </label>
  );
}

function ProfileInput({
  value,
  onChange,
  placeholder = "",
  type = "text",
  disabled = false,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
  disabled?: boolean;
}) {
  return (
    <input
      type={type}
      value={value}
      placeholder={placeholder}
      disabled={disabled}
      onChange={(event) => onChange(event.target.value)}
      className="h-11 w-full rounded-[0.8rem] border border-white/[0.09] bg-[linear-gradient(180deg,#141f2d_0%,#13202f_100%)] px-4 text-sm font-medium text-white outline-none transition placeholder:text-white/25 focus:border-[#ff7900]/42 focus:bg-[#172536] focus:shadow-[0_0_0_1px_rgba(255,121,0,0.08)] disabled:cursor-not-allowed disabled:opacity-55"
    />
  );
}

function ProfileSelect({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (value: string) => void;
  options: string[];
}) {
  return (
    <select
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="h-11 w-full rounded-[0.8rem] border border-white/[0.09] bg-[linear-gradient(180deg,#141f2d_0%,#13202f_100%)] px-4 text-sm font-medium text-white outline-none transition focus:border-[#ff7900]/42 focus:bg-[#172536] focus:shadow-[0_0_0_1px_rgba(255,121,0,0.08)]"
    >
      {options.map((option) => (
        <option key={option} value={option} className="bg-[#0f1722] text-white">
          {formatTimezone(option)}
        </option>
      ))}
    </select>
  );
}

function splitFullName(fullname: string) {
  const clean = fullname.trim();
  if (!clean) {
    return { firstName: "", lastName: "" };
  }

  const parts = clean.split(" ").filter(Boolean);
  if (parts.length === 1) {
    return { firstName: parts[0], lastName: "" };
  }

  return {
    firstName: parts[0],
    lastName: parts.slice(1).join(" "),
  };
}

function formatTimezone(value: string) {
  return value.replace("_", " ");
}