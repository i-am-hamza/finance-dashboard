import { signIn } from "@/lib/services/auth";
import { AuthForm } from "@/components/auth/auth-form";

export default function LoginPage({
  searchParams,
}: {
  searchParams: { error?: string };
}) {
  return (
    <AuthForm
      mode="login"
      action={signIn}
      error={searchParams.error === "auth_callback_failed" ? "Authentication failed. Please try again." : undefined}
    />
  );
}
