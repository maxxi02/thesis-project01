"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { toast } from "sonner";
import { authClient } from "@/lib/auth-client";
import Link from "next/link";
import { useState } from "react";
import { Input } from "@/components/ui/input";

const formSchema = z.object({
  email: z
    .string()
    .min(1, { message: "Email is required." })
    .email({ message: "Please enter a valid email address." }),
});

export function ForgotPasswordForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      setIsLoading(true);
      const { email } = values;

      // First, verify if the email exists in the system
      const verifyResponse = await fetch("/api/auth/verify-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const verifyData = await verifyResponse.json();

      if (!verifyResponse.ok || !verifyData.exists) {
        toast.error("Error", {
          description: "No account found with this email address",
          richColors: true,
        });
        return;
      }

      // If email exists, proceed with password reset
      await authClient.forgetPassword({
        email: email,
        redirectTo: "/reset-password",
      });

      setIsSubmitted(true);
      toast.success("Success", {
        description: "Password reset email sent successfully",
        richColors: true,
      });
    } catch (error) {
      toast.error("Error", {
        description: "Error sending password reset email",
        richColors: true,
      });
      console.log(error);
    } finally {
      setIsLoading(false);
    }
  }

  if (isSubmitted) {
    return (
      <div className={cn("flex flex-col gap-6", className)} {...props}>
        <div className="flex flex-col items-center gap-2 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
            <svg
              className="h-6 w-6 text-green-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-bold">Check your email</h1>
          <p className="text-muted-foreground text-sm text-balance">
            We&#39;ve sent a password reset link to your email address. Please
            check your inbox and follow the instructions to reset your password.
          </p>
        </div>

        <div className="flex flex-col gap-4">
          <Button
            onClick={() => {
              setIsSubmitted(false);
              form.reset();
            }}
            variant="outline"
            className="w-full"
          >
            Send another email
          </Button>

          <div className="text-center text-sm">
            Remember your password?{" "}
            <Link href="/sign-in" className="underline underline-offset-4">
              Back to login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <div className="flex flex-col items-center gap-2 text-center">
        <h1 className="text-2xl font-bold">Forgot your password?</h1>
        <p className="text-muted-foreground text-sm text-balance">
          Enter your email address and we&#39;ll send you a link to reset your
          password
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-6">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input
                    type="email"
                    placeholder="nivekamures@gmail.com"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Sending..." : "Send reset link"}
          </Button>
        </form>
      </Form>

      <div className="text-center text-sm">
        Remember your password?{" "}
        <Link href="/sign-in" className="underline underline-offset-4">
          Back to login
        </Link>
      </div>
    </div>
  );
}
