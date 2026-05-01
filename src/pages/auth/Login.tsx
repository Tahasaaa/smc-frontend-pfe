import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Lock, Mail, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

import { loginUser, savePendingEmail } from "@/services/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function Login() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!formData.email || !formData.password) {
      toast.error("Please fill in email and password.");
      return;
    }

    try {
      setLoading(true);

      const data = await loginUser(formData);

      if (data.requires_verification) {
        savePendingEmail(data.email);
        toast.success(data.message || "Verification code sent to your email.");
        navigate("/verify-otp");
        return;
      }

      toast.error("Unexpected login response.");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Login failed.";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="hero-grid-bg relative min-h-screen overflow-hidden bg-[#04070c] px-6 py-10 text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_20%,rgba(255,121,0,0.16),transparent_34%),radial-gradient(circle_at_80%_80%,rgba(39,79,255,0.09),transparent_32%),linear-gradient(180deg,rgba(255,255,255,0.015),rgba(255,255,255,0))]" />
      <div className="hero-noise absolute inset-0 opacity-35" />

      <div className="absolute left-5 top-5 z-20">
        <Link to="/">
          <Button
            variant="outline"
            className="h-11 rounded-2xl border-white/10 bg-white/[0.03] px-4 text-white/90 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] hover:bg-white/[0.06]"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Button>
        </Link>
      </div>

      <div className="relative z-10 mx-auto flex min-h-[calc(100vh-5rem)] w-full max-w-6xl items-center justify-center">
        <div className="grid w-full items-center gap-10 xl:grid-cols-[0.95fr_520px]">
          <div className="hidden xl:block">
            <div className="max-w-xl">
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-white/36">
                Secure Operations Access
              </p>

              <h1 className="mt-4 text-[3.4rem] font-semibold leading-[0.95] tracking-[-0.07em] text-white">
                Enter the
                <span className="block bg-gradient-to-r from-white to-orange-200 bg-clip-text text-transparent">
                  SMC QoS Portal
                </span>
              </h1>

              <p className="mt-5 max-w-lg text-base leading-7 text-white/52">
                Premium network monitoring access for dashboard supervision,
                incidents handling, geo-investigation, and operational control.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <span className="inline-flex items-center gap-2 rounded-full border border-orange-400/18 bg-orange-500/10 px-4 py-2 text-sm text-orange-200">
                  <ShieldCheck className="h-4 w-4" />
                  Orange Tunisia · NOC
                </span>

                <span className="inline-flex rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-sm text-white/60">
                  Email verification enabled
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

                <h2 className="mt-6 text-[2.25rem] font-semibold tracking-[-0.06em] text-white">
                  SMC QoS Portal
                </h2>
                <p className="mt-2 text-sm text-white/46">
                  Network Monitoring & Management
                </p>
                <p className="mt-4 inline-flex items-center gap-2 text-sm text-orange-300">
                  <ShieldCheck className="h-4 w-4" />
                  Orange Tunisia · NOC
                </p>
              </div>

              <form onSubmit={handleSubmit} className="mt-8 space-y-5">
                <div>
                  <label className="mb-2 block text-[13px] font-medium tracking-[-0.01em] text-white/74">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
                    <Input
                      name="email"
                      type="email"
                      placeholder="engineer@orange.tn"
                      value={formData.email}
                      onChange={handleChange}
                      className="h-14 rounded-[1.1rem] border-white/10 bg-white/[0.045] pl-11 text-[15px] text-white placeholder:text-white/24 focus:border-orange-400/45 focus:bg-white/[0.06]"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-[13px] font-medium tracking-[-0.01em] text-white/74">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
                    <Input
                      name="password"
                      type="password"
                      placeholder="••••••••"
                      value={formData.password}
                      onChange={handleChange}
                      className="h-14 rounded-[1.1rem] border-white/10 bg-white/[0.045] pl-11 text-[15px] text-white placeholder:text-white/24 focus:border-orange-400/45 focus:bg-white/[0.06]"
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="h-14 w-full rounded-[1.15rem] bg-[linear-gradient(90deg,#ff7900,#ffb000)] text-[1.02rem] font-semibold text-white shadow-[0_18px_40px_rgba(255,121,0,0.26)] transition hover:brightness-105"
                >
                  {loading ? "Sending code..." : "Sign In to Portal"}
                </Button>
              </form>

              <div className="mt-6 rounded-[1rem] border border-white/8 bg-white/[0.025] px-4 py-3 text-center">
                <p className="text-sm text-white/44">
                  Secure login with email verification code.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}