"use client";

import React, { useEffect, useState } from "react";
import { Mail, Lock, Eye, EyeOff } from "lucide-react";
import { useRouter } from "next/navigation";
import Button from "./Button";

type Mode = "login" | "register";

export default function AuthForm() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

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
    const errors: Record<string, string> = {};
    
    // Email validation
    if (!email) {
      errors.email = "Email is required.";
    } else if (!/^\S+@\S+\.\S+$/.test(email)) {
      errors.email = "Please enter a valid email address.";
    }
    
    // Password validation - matching server requirements
    if (!password) {
      errors.password = "Password is required.";
    } else if (password.length < 8) {
      errors.password = "Password must be at least 8 characters.";
    }
    
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
      
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password,
        }),
      });

      const data = await res.json();
      
      if (res.ok) {
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

  return (
    <div className="w-full max-w-md sm:max-w-lg lg:max-w-xl xl:max-w-2xl mx-auto">
      <div className="bg-white rounded-2xl shadow-md px-6 py-6">
        <div className="text-center mb-5">
          <div className="inline-flex items-center gap-2 text-2xl font-bold text-[#d4735a]">
           <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-chef-hat-icon lucide-chef-hat"><path d="M17 21a1 1 0 0 0 1-1v-5.35c0-.457.316-.844.727-1.041a4 4 0 0 0-2.134-7.589a5 5 0 0 0-9.186 0 4 4 0 0 0-2.134 7.588c.411.198.727.585.727 1.041V20a1 1 0 0 0 1 1Z"/><path d="M6 17h12"/></svg>
            Cookbook
          </div>
          <h1 className="text-2xl font-semibold mt-2">{mode === "login" ? "Welcome Back" : "Create an account"}</h1>
          <p className="text-sm text-gray-500 mt-1">
            {mode === "login" ? "Sign in to your account" : "Sign up to start sharing recipes"}
          </p>
        </div>

        {/* Tabs */}
        <div className="flex rounded-md bg-gray-100 p-1 mb-5">
          <button
            onClick={() => {
              setMode("login");
              setFormError(null);
              setFieldErrors({});
            }}
            className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${mode === "login" ? "bg-white shadow" : "text-gray-600"}`}
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
            className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${mode === "register" ? "bg-white shadow" : "text-gray-600"}`}
            aria-pressed={mode === "register"}
          >
            Register
          </button>
        </div>

        <form onSubmit={onSubmit} noValidate>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Email Address</label>
            <div className="relative">
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                type="email"
                className={`w-full h-11 px-4 pr-12 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#d4735a] ${fieldErrors.email ? "border-red-400" : "border-gray-200"}`}
                placeholder="you@example.com"
                autoComplete="email"
                aria-invalid={!!fieldErrors.email}
              />
              <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
                <Mail className="w-4 h-4 text-gray-400" />
              </div>
            </div>
            {fieldErrors.email && <p className="text-xs text-red-600 mt-1">{fieldErrors.email}</p>}
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Password</label>
            <div className="relative">
              <input
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                type={showPassword ? "text" : "password"}
                className={`w-full h-11 px-4 pr-16 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#d4735a] ${fieldErrors.password ? "border-red-400" : "border-gray-200"}`}
                placeholder="Enter your password"
                autoComplete={mode === "login" ? "current-password" : "new-password"}
                aria-invalid={!!fieldErrors.password}
              />
              <div className="absolute inset-y-0 right-3 flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  className="p-1 rounded-md text-gray-500 hover:text-gray-700 focus:outline-none flex-none"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
                <div className="pointer-events-none">
                  <Lock className="w-4 h-4 text-gray-400" />
                </div>
              </div>
            </div>
            {fieldErrors.password && <p className="text-xs text-red-600 mt-1">{fieldErrors.password}</p>}
            {mode === "register" && !fieldErrors.password && (
              <p className="text-xs text-gray-500 mt-1">Password must be at least 8 characters.</p>
            )}
          </div>

          {formError && <div className="text-sm text-red-600 mb-4">{formError}</div>}

          <div className="mb-2">
            <Button type="submit" size="lg" className="w-full" loading={loading}>
              {mode === "login" ? "Sign In" : "Create Account"}
            </Button>
          </div>

          <div className="text-center text-sm text-gray-500">
            {mode === "login" ? (
              <>
                Don&apos;t have an account?{" "}
                <button type="button" className="text-[#d4735a] font-medium underline" onClick={() => setMode("register")}>
                  Sign up
                </button>
              </>
            ) : (
              <>
                Already have an account?{" "}
                <button type="button" className="text-[#d4735a] font-medium underline" onClick={() => setMode("login")}>
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