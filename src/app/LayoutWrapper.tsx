import { Toaster } from "@/components/ui/sonner";
import React from "react";

const LayoutWrapper = ({
  children,
}: Readonly<{ children: React.ReactNode }>) => {
  return (
    <>
      {children}
      <Toaster position="bottom-center" richColors={true} />
    </>
  );
};

export default LayoutWrapper;
