import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { pageMeta } from "@/lib/page-meta";

export const Route = createFileRoute("/reset-password")({
  head: () => ({ meta: [...pageMeta("Reset your password | McRelish", "Choose a new password for your McRelish customer account."), { name: "robots", content: "noindex" }] }),
  validateSearch: (search: Record<string, unknown>) => ({ token: typeof search["token"] === "string" ? search["token"] : "" }),
  component: ResetPassword,
});

function ResetPassword() {
  const { token } = Route.useSearch();
  const { applySession } = useAuth();
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");
  return <section className="section-pad"><div className="mx-auto max-w-md px-4"><h1 className="font-display text-4xl font-bold">Choose a new password</h1>
    {done ? <><p className="mt-5" role="status">Your password has been updated.</p><Button asChild className="mt-5"><Link to="/account">Go to your account</Link></Button></> : token ? <form className="mt-6 space-y-4" onSubmit={async (e) => {
      e.preventDefault(); setError(""); const data = new FormData(e.currentTarget); const password = String(data.get("password"));
      if (password !== data.get("confirm")) { setError("Your passwords do not match."); return; }
      setBusy(true);
      try { applySession(await api("/api/auth/reset", { body: { token, password } })); setDone(true); }
      catch { setError("This reset link may have expired. Please request a new one."); }
      finally { setBusy(false); }
    }}><label className="block text-sm">New password<input type="password" name="password" required minLength={8} maxLength={72} autoComplete="new-password" className="mt-2 w-full rounded-lg border bg-background px-3 py-3" /></label><label className="block text-sm">Confirm password<input type="password" name="confirm" required minLength={8} maxLength={72} autoComplete="new-password" className="mt-2 w-full rounded-lg border bg-background px-3 py-3" /></label>{error && <p role="alert" className="text-sm text-destructive">{error}</p>}<Button type="submit" disabled={busy} className="min-h-12 w-full">{busy ? "Updating…" : "Update password"}</Button></form> : <><p className="mt-5 text-sm text-muted-foreground">Open the password reset link from your email. If it has expired, request a new link.</p><Button asChild className="mt-5"><Link to="/auth" search={{ next: "account" }}>Back to sign in</Link></Button></>}
  </div></section>;
}
