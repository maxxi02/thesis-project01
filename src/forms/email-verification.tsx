"use client";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import Link from "next/link";
import { Loader2, CheckCircle, XCircle } from "lucide-react";
import { authClient } from "@/lib/auth-client";

export function EmailVerificationForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [verificationStatus, setVerificationStatus] = useState<
    "idle" | "success" | "error"
  >("idle");
  const { push } = useRouter();

  const verifyEmail = useCallback(
    async (verificationToken: string) => {
      try {
        setIsLoading(true);

        await authClient.verifyEmail({
          query: {
            token: verificationToken,
          },
        });

        setVerificationStatus("success");
        toast.success("Success", {
          description: "Email verified successfully! You can now sign in.",
          richColors: true,
        });

        // Redirect to sign-in page after successful verification
        setTimeout(() => {
          push("/sign-in");
        }, 2000);
      } catch (error) {
        setVerificationStatus("error");
        toast.error("Error", {
          description:
            "Failed to verify email. The link may be invalid or expired.",
          richColors: true,
        });
        console.error("Email verification error:", error);
      } finally {
        setIsLoading(false);
      }
    },
    [push]
  );

  useEffect(() => {
    // Get token and email from URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const urlToken = urlParams.get("token");
    const urlEmail = urlParams.get("email");

    if (urlToken) {
      setToken(urlToken);
      setEmail(urlEmail);
      verifyEmail(urlToken);
    }
  }, [verifyEmail]);

  async function resendVerificationEmail() {
    if (!email) {
      toast.error("Error", {
        description: "Email address not found. Please try signing up again.",
        richColors: true,
      });
      return;
    }

    try {
      setIsResending(true);

      await authClient.sendVerificationEmail({
        email: email,
        callbackURL: "/dashboard",
      });

      toast.success("Success", {
        description: "Verification email sent! Please check your inbox.",
        richColors: true,
      });
    } catch (error) {
      toast.error("Error", {
        description: "Failed to resend verification email. Please try again.",
        richColors: true,
      });
      console.error("Resend verification error:", error);
    } finally {
      setIsResending(false);
    }
  }

  // Show success state
  if (verificationStatus === "success") {
    return (
      <div className={cn("flex flex-col gap-6", className)} {...props}>
        <div className="flex flex-col items-center gap-2 text-center">
          <CheckCircle className="h-12 w-12 text-green-600" />
          <h1 className="text-2xl font-bold">Email Verified!</h1>
          <p className="text-muted-foreground text-sm text-balance">
            Your email has been successfully verified. You will be redirected to
            the sign-in page shortly.
          </p>
        </div>

        <Button asChild className="w-full">
          <Link href="/sign-in">Continue to Sign In</Link>
        </Button>

        <div className="text-center text-sm">
          Want to explore more?{" "}
          <Link href="/dashboard" className="underline underline-offset-4">
            Go to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  // Show error state
  if (verificationStatus === "error" || (!token && !isLoading)) {
    return (
      <div className={cn("flex flex-col gap-6", className)} {...props}>
        <div className="flex flex-col items-center gap-2 text-center">
          <XCircle className="h-12 w-12 text-red-600" />
          <h1 className="text-2xl font-bold">Verification Failed</h1>
          <p className="text-muted-foreground text-sm text-balance">
            This verification link is invalid or has expired. Please request a
            new verification email.
          </p>
        </div>

        {email && (
          <Button
            onClick={resendVerificationEmail}
            disabled={isResending}
            className="w-full"
          >
            {isResending ? (
              <Loader2 className="animate-spin" />
            ) : (
              "Resend Verification Email"
            )}
          </Button>
        )}

        <div className="after:border-border relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t">
          <span className="bg-background text-muted-foreground relative z-10 px-2">
            Or try these options
          </span>
        </div>

        <Button asChild variant="outline" className="w-full">
          <Link href="/sign-up">Back to Sign Up</Link>
        </Button>

        <div className="text-center text-sm">
          Already verified?{" "}
          <Link href="/sign-in" className="underline underline-offset-4">
            Sign in here
          </Link>
        </div>
      </div>
    );
  }

  // Show loading state
  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <div className="flex flex-col items-center gap-2 text-center">
        <Loader2 className="h-12 w-12 text-blue-600 animate-spin" />
        <h1 className="text-2xl font-bold">Verifying Email</h1>
        <p className="text-muted-foreground text-sm text-balance">
          Please wait while we verify your email address...
        </p>
      </div>
    </div>
  );
}
