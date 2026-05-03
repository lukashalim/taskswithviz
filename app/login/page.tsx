import Link from "next/link";
import { GoogleSignInButton } from "@/components/auth/google-sign-in-button";
import { LoginAuthError } from "@/components/auth/login-auth-error";
import { LoginAuthRedirect } from "@/components/auth/login-auth-redirect";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;
  const authFailed = params.error === "auth";

  return (
    <div
      className="flex min-h-screen flex-col items-center justify-center bg-muted/40 p-4"
      style={{
        minHeight: "100vh",
        backgroundColor: "#f4f4f5",
        color: "#171717",
      }}
    >
      <LoginAuthRedirect />
      <div className="mb-8 text-center">
        <Link
          href="/"
          className="text-xl font-semibold tracking-tight text-foreground"
        >
          Task Tracker
        </Link>
        <p className="mt-1 text-sm text-muted-foreground">
          Organize work with clarity
        </p>
      </div>
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader>
          <CardTitle>Welcome</CardTitle>
          <CardDescription>
            Sign in with your Google account to continue.
          </CardDescription>
          <LoginAuthError show={authFailed} />
        </CardHeader>
        <CardContent>
          <GoogleSignInButton />
        </CardContent>
      </Card>
    </div>
  );
}
