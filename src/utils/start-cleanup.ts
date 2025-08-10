// lib/startup-cleanup.ts
export async function performStartupCleanup() {
  try {
    await fetch("/api/deliveries/auto-cleanup", { method: "POST" });
    console.log("Startup cleanup completed");
  } catch (error) {
    console.error("Startup cleanup failed:", error);
  }
}
