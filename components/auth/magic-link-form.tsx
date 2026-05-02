"use client";

import { useState } from "react";
import { getAuthSiteOrigin } from "@/lib/auth/site-origin";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export function MagicLinkForm() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${getAuthSiteOrigin()}/auth/callback`,
        },
      });
      if (error) throw error;
      toast.success("Magic link sent. Check your inbox.");
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Something went wrong";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="magic-email">Email</Label>
        <Input
          id="magic-email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
        />
      </div>
      <p className="text-sm text-muted-foreground">
        We&apos;ll email you a secure link. No password required.
      </p>
      <Button type="submit" disabled={loading} className="w-full">
        {loading ? "Sending…" : "Send magic link"}
      </Button>
    </form>
  );
}
