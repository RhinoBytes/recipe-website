"use client";

import React, { useEffect, useState } from "react";
import { Mail, Lock, Eye, EyeOff, User } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import Button from "@/components/ui/Button";
import { getPasswordErrors, isRequirementMet } from '@/lib/validation/password';
import { useAuth } from "@/context/AuthContext";

// Assuming validateAuthForm is defined elsewhere, e.g., in the password validation file
import { validateAuthForm } from '@/lib/validation/password';

type Mode = "login" | "register";

export default function AuthForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { refreshUser } = useAuth();
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    // Check for tab parameter in URL
    const tab = searchParams.get("tab");
    if (tab === "register") {
      setMode("register");
    } else if (tab === "login") {
      setMode("login");
    }
  }, [searchParams]);

  useEffect(() => {
    async function checkAuth() {
      try {
        const res = await fetch("/api/auth");
        if (res.ok) {
          const body = await res.json();
          if (body.authenticated) {
            router.push("/");
          }
        }
      } catch {
        // ignore
      }
    }
    checkAuth();
  }, [router]);

  function validate() {
    const errors = validateAuthForm(email, password, username, mode === "register");
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function onSubmit(e?: React.FormEvent) {
    e?.preventDefault();
    setFormError(null);

    if (!validate()) return;

    setLoading(true);
    try {
      // Determine API endpoint based on mode
      const endpoint = mode === "login"
        ? "/api/auth/login"
        : "/api/auth/register";

      const requestBody = mode === "register"
        ? { email, password, username }
        : { email, password };

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });

      const data = await res.json();

      if (res.ok) {
        // Refresh user state immediately
        await refreshUser();
        router.push("/");
      } else {
        setFormError(data.error || "Authentication failed. Please try again.");
      }
    } catch {
      setFormError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  // Get the base password requirements to display
  const passwordRequirements = getPasswordErrors('');

  return (
    <div className="w-full max-w-md sm:max-w-lg lg:max-w-xl xl:max-w-2xl mx-auto">
      <div className="bg-bg-secondary rounded-2xl shadow-lg border-2 border-border px-6 py-6">
        <div className="text-center mb-5">
          <div className="inline-flex items-center gap-2 text-2xl font-bold font-heading text-accent">
           <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-chef-hat-icon lucide-chef-hat"><path d="M17 21a1 1 0 0 0 1-1v-5.35c0-.457.316-.844.727-1.041a4 4 0 0 0-2.134-7.589a5 5 0 0 0-9.186 0 4 4 0 0 0-2.134 7.588c.411.198.727.585.727 1.041V20a1 1 0 0 0 1 1Z"/><path d="M6 17h12"/></svg>
            Cookbook
          </div>
          <h1 className="text-2xl font-heading font-semibold mt-2 text-text">{mode === "login" ? "Welcome Back" : "Create an account"}</h1>
          <p className="text-sm text-text-secondary mt-1">
            {mode === "login" ? "Sign in to your account" : "Sign up to start sharing recipes"}
          </p>
        </div>

        {/* Tabs */}
        <div className="flex rounded-2xl bg-accent-light/30 p-1 mb-5">
          <button
            onClick={() => {
              setMode("login");
              setFormError(null);
              setFieldErrors({});
              setUsername("");
            }}
            className={`flex-1 py-2 text-sm font-medium rounded-xl transition-colors ${mode === "login" ? "bg-bg-secondary shadow-md text-text" : "text-text-secondary"}`}
            aria-pressed={mode === "login"}
          >
            Log in
          </button>
          <button
            onClick={() => {
              setMode("register");
              setFormError(null);
              setFieldErrors({});
            }}
            className={`flex-1 py-2 text-sm font-medium rounded-xl transition-colors ${mode === "register" ? "bg-bg-secondary shadow-md text-text" : "text-text-secondary"}`}
            aria-pressed={mode === "register"}
          >
            Register
          </button>
        </div>

        <form onSubmit={onSubmit} noValidate>
          {mode === "register" && (
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2 text-text">Username</label>
              <div className="relative">
                <input
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  type="text"
                  className={`w-full h-11 px-4 pr-12 border-2 rounded-2xl bg-bg focus:outline-none focus:ring-2 focus:ring-accent ${fieldErrors.username ? "border-error" : "border-border"}`}
                  placeholder="johndoe"
                  autoComplete="username"
                  aria-invalid={!!fieldErrors.username}
                />
                <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
                  <User className="w-4 h-4 text-text-muted" />
                </div>
              </div>
              {fieldErrors.username && <p className="text-xs text-error mt-1">{fieldErrors.username}</p>}
              {!fieldErrors.username && (
                <p className="text-xs text-text-muted mt-1">3-30 characters: letters, numbers, underscores, hyphens</p>
              )}
            </div>
          )}

          <div className="mb-4">
            <label className="block text-sm font-medium mb-2 text-text">Email Address</label>
            <div className="relative">
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                type="email"
                className={`w-full h-11 px-4 pr-12 border-2 rounded-2xl bg-bg focus:outline-none focus:ring-2 focus:ring-accent ${fieldErrors.email ? "border-error" : "border-border"}`}
                placeholder="you@example.com"
                autoComplete="email"
                aria-invalid={!!fieldErrors.email}
              />
              <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
                <Mail className="w-4 h-4 text-text-muted" />
              </div>
            </div>
            {fieldErrors.email && <p className="text-xs text-error mt-1">{fieldErrors.email}</p>}
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium mb-2 text-text">Password</label>
            <div className="relative">
              <input
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                type={showPassword ? "text" : "password"}
                className={`w-full h-11 px-4 pr-16 border-2 rounded-2xl bg-bg focus:outline-none focus:ring-2 focus:ring-accent ${fieldErrors.password ? "border-error" : "border-border"}`}
                placeholder="Enter your password"
                autoComplete={mode === "login" ? "current-password" : "new-password"}
                aria-invalid={!!fieldErrors.password}
              />
              <div className="absolute inset-y-0 right-3 flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  className="p-1 rounded-md text-text-secondary hover:text-text focus:outline-none flex-none"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
                <div className="pointer-events-none">
                  <Lock className="w-4 h-4 text-text-muted" />
                </div>
              </div>
            </div>
            {fieldErrors.password && <p className="text-xs text-error mt-1">{fieldErrors.password}</p>}
            {mode === "register" && !fieldErrors.password && (
              <div className="text-xs text-text-muted mt-1">
                <p className="mb-1">Password must include:</p>
                <ul className="list-disc list-inside space-y-0.5">
                  {passwordRequirements.map((requirement, index) => (
                    <li key={index} className={isRequirementMet(requirement, password) ? "line-through opacity-50" : ""}>
                      {requirement}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {formError && <div className="text-sm text-error mb-4">{formError}</div>}

          <div className="mb-2">
            <Button type="submit" size="lg" className="w-full" loading={loading}>
              {mode === "login" ? "Sign In" : "Create Account"}
            </Button>
          </div>

          <div className="text-center text-sm text-text-secondary">
            {mode === "login" ? (
              <>
                Don&apos;t have an account?{" "}
                <button
                  type="button"
                  className="text-accent font-medium underline hover:text-accent-hover"
                  onClick={() => {
                    setMode("register");
                    setFormError(null);
                    setFieldErrors({});
                  }}
                >
                  Sign up
                </button>
              </>
            ) : (
              <>
                Already have an account?{" "}
                <button
                  type="button"
                  className="text-accent font-medium underline hover:text-accent-hover"
                  onClick={() => {
                    setMode("login");
                    setFormError(null);
                    setFieldErrors({});
                    setUsername("");
                  }}
                >
                  Sign in
                </button>
              </>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}