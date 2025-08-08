import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import React from "react";

const LayoutWrapper = ({
  children,
}: Readonly<{ children: React.ReactNode }>) => {
  return (
    <>
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
      >
        {children}
        <Toaster position="bottom-center" richColors={true} />
      </ThemeProvider>
    </>
  );
};

export default LayoutWrapper;
