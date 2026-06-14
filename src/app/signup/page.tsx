import { signUp } from "@/lib/services/auth";
import { AuthForm } from "@/components/auth/auth-form";

export default function SignupPage() {
  return <AuthForm mode="signup" action={signUp} />;
}
