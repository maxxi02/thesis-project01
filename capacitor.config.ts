import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.example.app",
  appName: "lgw-warehouse",
  webDir: "out",
  server: {
    url: "https://lgw123.vercel.app/",
    cleartext: true,
  },
  android: {
    allowMixedContent: true,
  },
};

export default config;
