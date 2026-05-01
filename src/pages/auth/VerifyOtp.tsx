import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

import {
  clearPendingEmail,
  getPendingEmail,
  saveAuthSession,
  verifyOtpCode,
} from "@/services/auth";
import { Button } from "@/components/ui/button";

const OTP_LENGTH = 6;

export default function VerifyOtp() {
  const navigate = useNavigate();
  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);

  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(""));
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const savedEmail = getPendingEmail();

    if (!savedEmail) {
      toast.error("No verification session found. Please login again.");
      navigate("/login");
      return;
    }

    setEmail(savedEmail);

    const timer = setTimeout(() => {
      inputRefs.current[0]?.focus();
    }, 50);

    return () => clearTimeout(timer);
  }, [navigate]);

  const code = useMemo(() => otp.join(""), [otp]);
  const isComplete = code.length === OTP_LENGTH && otp.every((digit) => digit !== "");

  function updateOtpAt(index: number, value: string) {
    setOtp((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  }

  function handleChange(index: number, value: string) {
    const cleanValue = value.replace(/\D/g, "");

    if (!cleanValue) {
      updateOtpAt(index, "");
      return;
    }

    if (cleanValue.length > 1) {
      handlePasteValue(cleanValue);
      return;
    }

    updateOtpAt(index, cleanValue);

    if (index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  }

  function handleKeyDown(
    index: number,
    event: React.KeyboardEvent<HTMLInputElement>
  ) {
    if (event.key === "Backspace") {
      if (otp[index]) {
        updateOtpAt(index, "");
        return;
      }

      if (index > 0) {
        inputRefs.current[index - 1]?.focus();
        updateOtpAt(index - 1, "");
      }
      return;
    }

    if (event.key === "ArrowLeft" && index > 0) {
      inputRefs.current[index - 1]?.focus();
      return;
    }

    if (event.key === "ArrowRight" && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  }

  function handlePaste(event: React.ClipboardEvent<HTMLInputElement>) {
    event.preventDefault();
    const pasted = event.clipboardData.getData("text");
    handlePasteValue(pasted);
  }

  function handlePasteValue(rawValue: string) {
    const clean = rawValue.replace(/\D/g, "").slice(0, OTP_LENGTH);

    if (!clean) return;

    const next = Array(OTP_LENGTH).fill("");
    clean.split("").forEach((digit, idx) => {
      next[idx] = digit;
    });

    setOtp(next);

    const focusIndex = Math.min(clean.length, OTP_LENGTH - 1);
    inputRefs.current[focusIndex]?.focus();
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!email || !isComplete) {
      toast.error("Please enter the 6-digit verification code.");
      return;
    }

    try {
      setLoading(true);

      const data = await verifyOtpCode({ email, code });
      saveAuthSession(data);
      clearPendingEmail();

      toast.success("Login successful.");
      navigate("/dashboard");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Invalid verification code.";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="hero-grid-bg relative min-h-screen overflow-hidden bg-[#04070c] px-6 py-10 text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_20%,rgba(255,121,0,0.15),transparent_34%),radial-gradient(circle_at_80%_80%,rgba(39,79,255,0.08),transparent_32%),linear-gradient(180deg,rgba(255,255,255,0.015),rgba(255,255,255,0))]" />
      <div className="hero-noise absolute inset-0 opacity-35" />

      <div className="absolute left-5 top-5 z-20">
        <Link to="/login">
          <Button
            variant="outline"
            className="h-11 rounded-2xl border-white/10 bg-white/[0.03] px-4 text-white/90 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] hover:bg-white/[0.06]"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Login
          </Button>
        </Link>
      </div>

      <div className="relative z-10 mx-auto flex min-h-[calc(100vh-5rem)] w-full max-w-6xl items-center justify-center">
        <div className="grid w-full items-center gap-10 xl:grid-cols-[0.95fr_520px]">
          <div className="hidden xl:block">
            <div className="max-w-xl">
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-white/36">
                Verification Layer
              </p>

              <h1 className="mt-4 text-[3.25rem] font-semibold leading-[0.95] tracking-[-0.07em] text-white">
                Confirm your
                <span className="block bg-gradient-to-r from-white to-orange-200 bg-clip-text text-transparent">
                  secure access
                </span>
              </h1>

              <p className="mt-5 max-w-lg text-base leading-7 text-white/52">
                Enter the one-time code sent to your email to continue into the
                operational workspace.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <span className="inline-flex items-center gap-2 rounded-full border border-orange-400/18 bg-orange-500/10 px-4 py-2 text-sm text-orange-200">
                  <ShieldCheck className="h-4 w-4" />
                  OTP verification enabled
                </span>

                <span className="inline-flex rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-sm text-white/60">
                  6-digit secure code
                </span>
              </div>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-[520px]">
            <div className="absolute inset-0 rounded-[2rem] bg-[radial-gradient(circle_at_top,rgba(255,121,0,0.14),transparent_45%)] blur-2xl" />

            <div className="relative overflow-hidden rounded-[2rem] border border-orange-400/14 bg-[linear-gradient(180deg,rgba(9,14,24,0.96),rgba(5,9,16,0.96))] p-7 shadow-[0_30px_90px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.04)] backdrop-blur-xl sm:p-8">
              <div className="absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(255,121,0,0.5),transparent)]" />

              <div className="text-center">
                <div className="mx-auto flex h-[74px] w-[74px] items-center justify-center overflow-hidden rounded-[1.6rem] border border-orange-400/25 bg-[linear-gradient(180deg,rgba(255,121,0,0.18),rgba(255,121,0,0.08))] shadow-[0_0_40px_rgba(255,121,0,0.18)]">
                  <img
                    src="/Orange_Logo.svg"
                    alt="Orange"
                    className="h-full w-full object-cover"
                  />
                </div>

                <h2 className="mt-6 text-[2.15rem] font-semibold tracking-[-0.06em] text-white">
                  Verify Code
                </h2>
                <p className="mt-2 text-sm text-white/46">
                  Enter the 6-digit verification code sent to your email
                </p>
                <p className="mt-4 inline-flex items-center gap-2 text-sm text-orange-300">
                  <ShieldCheck className="h-4 w-4" />
                  {email || "Pending email"}
                </p>
              </div>

              <form onSubmit={handleSubmit} className="mt-8 space-y-6">
                <div>
                  <label className="mb-3 block text-[13px] font-medium tracking-[-0.01em] text-white/74">
                    Verification Code
                  </label>

                  <div className="flex items-center justify-between gap-2.5 sm:gap-3">
                    {otp.map((digit, index) => (
                      <input
                        key={index}
                        ref={(el) => {
                          inputRefs.current[index] = el;
                        }}
                        type="text"
                        inputMode="numeric"
                        autoComplete="one-time-code"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleChange(index, e.target.value)}
                        onKeyDown={(e) => handleKeyDown(index, e)}
                        onPaste={handlePaste}
                        className="h-14 w-12 rounded-[1rem] border border-white/10 bg-white/[0.045] text-center text-lg font-semibold text-white outline-none transition focus:border-orange-400/60 focus:bg-white/[0.06] focus:ring-2 focus:ring-orange-400/18 sm:h-16 sm:w-14"
                      />
                    ))}
                  </div>

                  <p className="mt-3 text-xs text-white/40">
                    You can type digit by digit or paste the full code.
                  </p>
                </div>

                <Button
                  type="submit"
                  disabled={loading || !isComplete}
                  className="h-14 w-full rounded-[1.15rem] bg-[linear-gradient(90deg,#ff7900,#ffb000)] text-[1.02rem] font-semibold text-white shadow-[0_18px_40px_rgba(255,121,0,0.26)] transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading ? "Verifying..." : "Verify and Continue"}
                </Button>
              </form>

              <div className="mt-6 rounded-[1rem] border border-white/8 bg-white/[0.025] px-4 py-3 text-center">
                <p className="text-sm text-white/44">
                  Didn’t receive the code? Go back and login again.
                </p>
                <button
                  type="button"
                  onClick={() => navigate("/login")}
                  className="mt-2 text-sm font-medium text-orange-300 transition hover:text-orange-200"
                >
                  Return to login
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}