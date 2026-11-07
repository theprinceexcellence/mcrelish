import { useEffect, useRef, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { pageMeta } from "@/lib/page-meta";

type GoogleIdentity = { accounts: { id: { initialize: (c: { client_id: string; callback: (r: { credential: string }) => void }) => void; renderButton: (el: HTMLElement, o: Record<string, unknown>) => void } } };

export const Route = createFileRoute("/auth")({
  head: () => ({ meta: pageMeta("Customer sign in | McRelish", "Sign in or create your McRelish customer account, or continue ordering as a guest.") }),
  validateSearch: (search: Record<string, unknown>) => ({ next: search["next"] === "checkout" ? "checkout" : search["next"] === "admin" ? "admin" : "account" }),
  component: AuthPage,
});

function AuthPage() {
  const { user, ready, signIn, signUp, signInWithGoogle } = useAuth();
  const { next } = Route.useSearch();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup" | "forgot">("signin");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  useEffect(() => {
    if (!ready || !user) return;
    let destination = next;
    try { const saved = sessionStorage.getItem("mcrelish-auth-next"); if (saved === "checkout" || saved === "admin") destination = saved; sessionStorage.removeItem("mcrelish-auth-next"); } catch { /* unavailable */ }
    void navigate({ to: destination === "checkout" ? "/checkout" : destination === "admin" ? "/admin" : "/account", replace: true });
  }, [ready, user, next, navigate]);
  const [googleId, setGoogleId] = useState("");
  const googleButton = useRef<HTMLDivElement>(null);
  useEffect(() => { api<{ google_client_id: string }>("/api/config").then((c) => setGoogleId(c.google_client_id)).catch(() => {}); }, []);
  useEffect(() => {
    if (!googleId || mode === "forgot") return;
    let cancelled = false;
    const render = () => {
      const gsi = (window as unknown as { google?: GoogleIdentity }).google?.accounts.id;
      if (cancelled || !gsi || !googleButton.current) return;
      gsi.initialize({ client_id: googleId, callback: async ({ credential }) => {
        setBusy(true); setError("");
        try { sessionStorage.setItem("mcrelish-auth-next", next); await signInWithGoogle(credential); }
        catch { setError("Sign-in could not be completed. Please try again."); }
        finally { setBusy(false); }
      } });
      gsi.renderButton(googleButton.current, { theme: "outline", size: "large", width: 320, text: "continue_with" });
    };
    if ((window as unknown as { google?: unknown }).google) render();
    else {
      const script = document.createElement("script");
      script.src = "https://accounts.google.com/gsi/client"; script.async = true; script.onload = render;
      document.head.appendChild(script);
    }
    return () => { cancelled = true; };
  }, [googleId, mode, next, signInWithGoogle]);
  return <section className="section-pad"><div className="mx-auto max-w-md px-4 sm:px-6">
    <p className="text-sm font-semibold text-primary">McRelish customer account</p>
    <h1 className="mt-2 font-display text-4xl font-bold">{mode === "signup" ? "Create your account" : mode === "forgot" ? "Reset your password" : "Welcome back"}</h1>
    {mode !== "forgot" && <div className="mt-6 grid grid-cols-2 border-b"><Button variant="ghost" aria-pressed={mode === "signin"} className={mode === "signin" ? "border-b-2 border-primary rounded-none" : ""} onClick={() => { setMode("signin"); setError(""); setMessage(""); }}>Sign in</Button><Button variant="ghost" aria-pressed={mode === "signup"} className={mode === "signup" ? "border-b-2 border-primary rounded-none" : ""} onClick={() => { setMode("signup"); setError(""); setMessage(""); }}>Create account</Button></div>}
    <form className="mt-6 space-y-4" onSubmit={async (e) => {
      e.preventDefault(); setBusy(true); setError(""); setMessage("");
      const data = new FormData(e.currentTarget);
      const email = String(data.get("email") ?? "").trim();
      const password = String(data.get("password") ?? "");
      try {
        if (mode === "forgot") {
          const result = await api<{ dev_link?: string }>("/api/auth/forgot", { body: { email, origin: window.location.origin } });
          if (result.dev_link) console.info("Password reset link (development only):", result.dev_link);
          setMessage("If an account exists for this email, a password reset link is on its way. Check your inbox and spam folder.");
        } else if (mode === "signup") {
          await signUp(email, password, String(data.get("full_name") ?? "").trim());
        } else {
          await signIn(email, password);
        }
      } catch { setError(mode === "signin" ? "Unable to sign in. Check your email and password." : "Unable to complete your request. Please try again shortly."); }
      finally { setBusy(false); }
    }}>
      {mode === "signup" && <AuthInput name="full_name" label="Full name" autoComplete="name" />}
      <AuthInput name="email" label="Email" type="email" autoComplete="email" />
      {mode !== "forgot" && <AuthInput name="password" label="Password" type="password" autoComplete={mode === "signin" ? "current-password" : "new-password"} minLength={8} />}
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      {message && <p role="status" className="text-sm text-primary">{message}</p>}
      <Button type="submit" disabled={busy} className="min-h-12 w-full">{busy ? "Please wait…" : mode === "signup" ? "Create account" : mode === "forgot" ? "Send reset link" : "Sign in"}</Button>
    </form>
    <Button variant="link" className="mt-2 px-0" onClick={() => { setMode(mode === "forgot" ? "signin" : "forgot"); setError(""); setMessage(""); }}>{mode === "forgot" ? "Back to sign in" : "Forgot password?"}</Button>
    {mode !== "forgot" && googleId && <><div className="my-5 flex items-center gap-4 text-xs text-muted-foreground"><span className="h-px flex-1 bg-border" />or<span className="h-px flex-1 bg-border" /></div><div className="flex justify-center" ref={googleButton} /></>}
    <Button asChild variant="ghost" className="mt-5 min-h-12 w-full"><Link to={next === "checkout" ? "/checkout" : "/menu"}>Continue as guest</Link></Button>
  </div></section>;
}

function AuthInput({ name, label, type = "text", autoComplete, minLength }: { name: string; label: string; type?: string; autoComplete: string; minLength?: number }) {
  return <div><label htmlFor={name} className="text-sm font-medium">{label}</label><input id={name} name={name} type={type} autoComplete={autoComplete} minLength={minLength} required className="mt-2 w-full rounded-lg border bg-background px-3 py-3 text-sm" /></div>;
}