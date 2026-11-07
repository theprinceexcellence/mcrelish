import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { pageMeta } from "@/lib/page-meta";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/account")({ head: () => ({ meta: [...pageMeta("Your customer profile | McRelish", "Manage your McRelish customer name and phone number for checkout."), { name: "robots", content: "noindex" }] }), component: AccountPage });
function AccountPage() {
  const { user, profile, ready, refreshProfile, updateProfile, signOut } = useAuth();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  if (!ready) return <section className="section-pad px-4 text-center" role="status">Loading your account…</section>;
  if (!user) return <section className="section-pad px-4 text-center"><h1 className="font-display text-4xl font-bold">Your McRelish account</h1><Button asChild className="mt-6"><Link to="/auth" search={{ next: "account" }}>Sign in</Link></Button></section>;
  return <section className="section-pad"><div className="mx-auto max-w-lg px-4 sm:px-6"><h1 className="font-display text-4xl font-bold">Your profile</h1><p className="mt-3 break-all text-sm text-muted-foreground">{user.email}</p>
    {!profile ? <p className="mt-5 text-sm">Loading your profile… <Button variant="link" onClick={() => void refreshProfile().catch(() => setError("Your profile could not be loaded. Please retry."))}>Retry</Button></p> : <form key={profile.id + profile.full_name + profile.phone} className="mt-6 space-y-4" onSubmit={async (e) => {
      e.preventDefault(); setBusy(true); setMessage(""); setError("");
      const data = new FormData(e.currentTarget);
      try {
        await updateProfile(String(data.get("full_name") ?? "").trim(), String(data.get("phone") ?? "").trim());
        setMessage("Your profile has been saved.");
      } catch { setError("Your profile could not be saved. Please try again."); } finally { setBusy(false); }
    }}>
      <label className="block text-sm font-medium">Full name<input name="full_name" autoComplete="name" required defaultValue={profile.full_name} className="mt-2 w-full rounded-lg border bg-background px-3 py-3" /></label>
      <label className="block text-sm font-medium">Phone number<input name="phone" type="tel" autoComplete="tel" defaultValue={profile.phone} className="mt-2 w-full rounded-lg border bg-background px-3 py-3" /></label>
      <Button type="submit" disabled={busy} className="min-h-12 w-full">{busy ? "Saving…" : "Save profile"}</Button>
    </form>}
    {message && <p role="status" className="mt-4 text-sm text-primary">{message}</p>}{error && <p role="alert" className="mt-4 text-sm text-destructive">{error}</p>}
    <div className="mt-6 flex flex-wrap gap-3"><Button asChild variant="outline"><Link to="/menu">Browse menu</Link></Button>{user.roles.length > 0 && <Button asChild><Link to="/admin">Open dashboard</Link></Button>}<Button variant="ghost" onClick={() => void signOut().catch(() => setError("Unable to sign out. Please retry."))}>Sign out</Button></div>
  </div></section>;
}