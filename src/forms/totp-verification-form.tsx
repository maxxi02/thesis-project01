"use client";

import React, { useState } from "react";
import QRCode from "react-qr-code";
import { useQuery } from "@tanstack/react-query";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { authClient } from "@/lib/auth-client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const totpCodeSchema = z.object({
  code: z.string().min(6).max(6),
});

const passwordSchema = z.object({
  password: z.string().min(1),
});

type TotpCodeForm = z.infer<typeof totpCodeSchema>;
type PasswordForm = z.infer<typeof passwordSchema>;

function TOTPVerificationPage() {
  const [enteredPassword, setEnteredPassword] = useState("");
  const [showPasswordModal, setShowPasswordPasswordModal] = useState(true);
  const router = useRouter();

  const passwordForm = useForm<PasswordForm>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      password: "",
    },
  });

  const { data: qr } = useQuery({
    queryKey: ["two-factor-qr"],
    queryFn: async () => {
      const res = await authClient.twoFactor.getTotpUri({
        password: enteredPassword,
      });
      if (res.error) {
        console.log(res.error);
      }
      return res.data;
    },
    enabled: !!enteredPassword,
  });

  const form = useForm<TotpCodeForm>({
    resolver: zodResolver(totpCodeSchema),
    defaultValues: {
      code: "",
    },
  });

  const {
    formState: { isSubmitting },
  } = form;

  async function onPasswordSubmit(values: PasswordForm) {
    setEnteredPassword(values.password);
    setShowPasswordPasswordModal(false);
  }

  async function onSubmit(values: TotpCodeForm) {
    try {
      await authClient.twoFactor.verifyTotp({
        code: values.code,
      });
      toast.success("2FA Enabled");
      router.push("/dashboard");
    } catch (error) {
      toast.error("Invalid code");
    }
  }

  if (showPasswordModal) {
    return (
      <Dialog
        open={showPasswordModal}
        onOpenChange={setShowPasswordPasswordModal}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Enter Password</DialogTitle>
            <DialogDescription>
              Please re-enter your password to set up the authenticator app.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)}>
            <Input
              type="password"
              placeholder="••••••••••"
              {...passwordForm.register("password")}
            />
            <DialogFooter className="mt-4">
              <Button type="submit" className="w-full">
                Continue
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    );
  }

  if (!qr?.totpURI) {
    return <div>Loading...</div>;
  }

  return (
    <div className="flex flex-col items-center gap-6 p-6">
      <h1 className="text-2xl font-bold">Set up Authenticator App</h1>
      <p className="text-center">
        Scan the QR code with your authenticator app.
      </p>
      <QRCode value={qr.totpURI} />
      <form onSubmit={form.handleSubmit(onSubmit)} className="flex gap-2">
        <Input
          {...form.register("code")}
          placeholder="Enter 6-digit code"
          type="text"
          maxLength={6}
        />
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? <Loader2 className="animate-spin" /> : "Verify"}
        </Button>
      </form>
    </div>
  );
}

export function TotpVerificationPage() {
  const queryClient = useState(() => new QueryClient())[0];

  return (
    <QueryClientProvider client={queryClient}>
      <TOTPVerificationPage />
    </QueryClientProvider>
  );
}
