"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export function PasswordForm() {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const supabase = createClient();
  const origin =
    typeof window !== "undefined" ? window.location.origin : "";

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${origin}/auth/callback`,
          },
        });
        if (error) throw error;
        toast.success("Check your email to confirm your account.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        window.location.href = "/dashboard";
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Something went wrong";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {mode === "signup" ? (
        <p className="rounded-md border border-border bg-muted/50 px-3 py-2 text-center text-sm text-foreground">
          New account — after you submit, confirm your email if prompted.
        </p>
      ) : null}
      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="password-email">Email</Label>
          <Input
            id="password-email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="password-field">Password</Label>
          <Input
            id="password-field"
            type="password"
            autoComplete={mode === "signup" ? "new-password" : "current-password"}
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <Button type="submit" disabled={loading} className="w-full">
          {loading
            ? "Please wait…"
            : mode === "signup"
              ? "Create account"
              : "Sign in"}
        </Button>
      </form>
      <button
        type="button"
        className={cn(
          buttonVariants({ variant: "ghost", size: "default" }),
          "w-full text-muted-foreground",
        )}
        onClick={() =>
          setMode((m) => (m === "signin" ? "signup" : "signin"))
        }
      >
        {mode === "signin"
          ? "Need an account? Sign up"
          : "Already have an account? Sign in"}
      </button>
    </div>
  );
}
