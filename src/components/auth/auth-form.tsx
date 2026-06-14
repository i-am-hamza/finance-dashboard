"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

type Mode = "login" | "signup";

interface AuthFormProps {
  mode: Mode;
  action: (formData: FormData) => Promise<{ error?: string; success?: string } | void>;
  error?: string;
}

export function AuthForm({ mode, action, error: initialError }: AuthFormProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState(initialError ?? "");
  const [success, setSuccess] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (mode === "signup" && password !== confirm) {
      setError("Passwords do not match.");
      return;
    }

    setError("");
    setSuccess("");
    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      try {
        const result = await action(formData);
        if (result?.error) setError(result.error);
        if (result?.success) setSuccess(result.success);
      } catch {
        // redirect() throws — that is fine
      }
    });
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <Card className="w-full max-w-sm shadow-sm rounded-xl">
        <CardHeader className="space-y-1 pb-4">
          <CardTitle className="text-2xl font-semibold tracking-tight">
            {mode === "login" ? "Sign in" : "Create account"}
          </CardTitle>
          <CardDescription className="text-muted-foreground text-sm">
            {mode === "login"
              ? "Enter your email and password to continue."
              : "Fill in the details below to get started."}
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "signup" && (
              <div className="space-y-1.5">
                <Label htmlFor="displayName">Name</Label>
                <Input
                  id="displayName"
                  name="displayName"
                  type="text"
                  placeholder="Your name"
                  autoComplete="name"
                  className="rounded-lg"
                />
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="you@example.com"
                autoComplete="email"
                required
                className="rounded-lg"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder={mode === "signup" ? "Min. 8 characters" : "••••••••"}
                autoComplete={mode === "login" ? "current-password" : "new-password"}
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="rounded-lg"
              />
            </div>

            {mode === "signup" && (
              <div className="space-y-1.5">
                <Label htmlFor="confirm">Confirm password</Label>
                <Input
                  id="confirm"
                  name="confirm"
                  type="password"
                  placeholder="Repeat password"
                  autoComplete="new-password"
                  required
                  minLength={8}
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  className="rounded-lg"
                />
              </div>
            )}

            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}
            {success && (
              <p className="text-sm text-green-600 dark:text-green-400">{success}</p>
            )}

            <Button
              type="submit"
              className="w-full rounded-lg"
              disabled={isPending}
            >
              {isPending
                ? mode === "login" ? "Signing in…" : "Creating account…"
                : mode === "login" ? "Sign in" : "Create account"}
            </Button>
          </form>

          <p className="mt-5 text-center text-sm text-muted-foreground">
            {mode === "login" ? (
              <>
                No account?{" "}
                <Link href="/signup" className="underline underline-offset-4 hover:text-foreground">
                  Sign up
                </Link>
              </>
            ) : (
              <>
                Already have an account?{" "}
                <Link href="/login" className="underline underline-offset-4 hover:text-foreground">
                  Sign in
                </Link>
              </>
            )}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
