import { NextRequest, NextResponse } from "next/server";
import { addClient, removeClient } from "@/sse/sse";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("userId");
  const userEmail = searchParams.get("userEmail");

  if (!userId || !userEmail) {
    return new NextResponse("User ID and email are required", { status: 400 });
  }

  const headers = new Headers({
    "Content-Type": "text/event-stream",
    Connection: "keep-alive",
    "Cache-Control": "no-cache, no-transform",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Cache-Control",
  });

  const stream = new ReadableStream({
    start(controller) {
      const clientId = `${Date.now()}-${Math.random()}`;

      const newClient = {
        id: clientId,
        userId,
        userEmail,
        controller,
      };

      addClient(newClient);

      controller.enqueue(
        `data: ${JSON.stringify({
          type: "CONNECTION_ESTABLISHED",
          timestamp: new Date().toISOString(),
        })}\n\n`
      );

      const heartbeat = setInterval(() => {
        try {
          controller.enqueue(
            `data: ${JSON.stringify({
              type: "heartbeat",
              timestamp: new Date().toISOString(),
            })}\n\n`
          );
        } catch (error) {
          console.log("Error sending heartbeat:", error);
          clearInterval(heartbeat);
          removeClient(clientId);
        }
      }, 30000);

      request.signal.addEventListener("abort", () => {
        clearInterval(heartbeat);
        removeClient(clientId);
        try {
          controller.close();
        } catch (error) {
          console.error("Error closing controller:", error);
        }
      });
    },
  });

  return new NextResponse(stream, { headers });
}
