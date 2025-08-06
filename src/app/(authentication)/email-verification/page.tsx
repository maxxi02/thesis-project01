import { EmailVerificationForm } from "@/forms/email-verification";
import React from "react";

const page = () => {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-background p-6 md:p-10">
      <div className="w-full max-w-sm">
        <EmailVerificationForm />
      </div>
    </div>
  );
};

export default page;
