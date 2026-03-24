"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type AuthConfig = { configured: boolean };

export default function LoginPage() {
  const router = useRouter();
  const [configured, setConfigured] = useState<boolean | null>(null);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const isSetup = configured === false;
  const title = useMemo(() => (isSetup ? "Create secure access" : "Sign in"), [isSetup]);

  useEffect(() => {
    const boot = async () => {
      try {
        const me = await fetch("/api/auth/me", { cache: "no-store" });
        if (me.ok) {
          router.replace("/");
          return;
        }
      } catch {
        // continue to config check
      }
      try {
        const res = await fetch("/api/auth/config", { cache: "no-store" });
        const body = (await res.json()) as AuthConfig;
        setConfigured(Boolean(body.configured));
      } catch {
        setError("Could not load security status. Refresh and try again.");
        setConfigured(true);
      }
    };
    void boot();
  }, [router]);

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setInfo(null);
    if (!username.trim() || !password) {
      setError("Enter both username and password.");
      return;
    }
    if (isSetup && password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    setLoading(true);
    try {
      if (isSetup) {
        const setup = await fetch("/api/auth/setup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username: username.trim(), password }),
        });
        if (!setup.ok) {
          const txt = await setup.text();
          setError(txt || "Setup failed.");
          setLoading(false);
          return;
        }
        setInfo("Credentials saved permanently. Signing you in…");
      }
      const login = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: username.trim(), password }),
      });
      if (!login.ok) {
        const txt = await login.text();
        setError(txt || "Login failed.");
        setLoading(false);
        return;
      }
      router.replace("/");
    } catch {
      setError("Network issue while authenticating. Please retry.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="loginPage">
      <section className="loginCard" aria-label="Authentication">
        <header className="loginCardHeader">
          <p className="loginBrand">HARMONY JEWELS</p>
          <p className="loginBrandSub">CMO Agent</p>
        </header>
        <div className="loginBody">
          <h1 className="loginTitle">{title}</h1>
          <p className="loginLead">
            {isSetup
              ? "Set your one-time admin credential. This setup is permanent."
              : "Use your configured admin credential to access the platform."}
          </p>
          <form onSubmit={submit} className="loginForm">
            <label className="loginLabel" htmlFor="auth-user">
              Username
            </label>
            <input
              id="auth-user"
              className="loginInput"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              required
            />
            <label className="loginLabel" htmlFor="auth-pass">
              Password
            </label>
            <input
              id="auth-pass"
              type="password"
              className="loginInput"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete={isSetup ? "new-password" : "current-password"}
              required
            />
            {isSetup ? (
              <>
                <label className="loginLabel" htmlFor="auth-confirm">
                  Confirm password
                </label>
                <input
                  id="auth-confirm"
                  type="password"
                  className="loginInput"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  autoComplete="new-password"
                  required
                />
              </>
            ) : null}
            {error ? <p className="loginError">{error}</p> : null}
            {info ? <p className="loginInfo">{info}</p> : null}
            <button type="submit" className="loginButton" disabled={loading || configured == null}>
              {loading ? "Please wait…" : isSetup ? "Save credential and continue" : "Enter platform"}
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}
