import { NextRequest, NextResponse } from "next/server";
import { addClient, removeClient } from "@/sse/sse";

// CRITICAL: Tell Next.js this is a long-running route
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs'; // Use Node.js runtime, not Edge

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("userId");
  const userEmail = searchParams.get("userEmail");

  if (!userId || !userEmail) {
    return new NextResponse("User ID and email are required", { status: 400 });
  }

  console.log(`📡 SSE connection request from ${userEmail}`);

  const encoder = new TextEncoder();

  const headers = new Headers({
    "Content-Type": "text/event-stream; charset=utf-8",
    "Connection": "keep-alive",
    "Cache-Control": "no-cache, no-store, must-revalidate, no-transform",
    "X-Accel-Buffering": "no", // CRITICAL for nginx/LiteSpeed
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
      console.log(`✅ SSE Client connected: ${clientId} (${userEmail})`);

      // Send initial connection message
      try {
        const message = `data: ${JSON.stringify({
          type: "CONNECTION_ESTABLISHED",
          clientId: clientId,
          timestamp: new Date().toISOString(),
        })}\n\n`;
        
        controller.enqueue(encoder.encode(message));
        console.log(`📤 Sent CONNECTION_ESTABLISHED to ${clientId}`);
      } catch (error) {
        console.error(`❌ Failed to send initial message:`, error);
      }

      // Heartbeat every 15 seconds
      const heartbeat = setInterval(() => {
        try {
          const message = `data: ${JSON.stringify({
            type: "heartbeat",
            timestamp: new Date().toISOString(),
          })}\n\n`;
          
          controller.enqueue(encoder.encode(message));
          console.log(`💓 Heartbeat sent to ${clientId}`);
        } catch (error) {
          console.error(`❌ Heartbeat error for ${clientId}:`, error);
          clearInterval(heartbeat);
          removeClient(clientId);
        }
      }, 15000);

      // Keep-alive comment every 30 seconds (to prevent proxy timeout)
      const keepAlive = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(`: keep-alive\n\n`));
          console.log(`🔄 Keep-alive sent to ${clientId}`);
        } catch (error) {
          console.error(`❌ Keep-alive error:`, error);
          clearInterval(keepAlive);
        }
      }, 30000);

      // Cleanup on connection close
      request.signal.addEventListener("abort", () => {
        console.log(`🔌 SSE Client disconnected: ${clientId} (${userEmail})`);
        clearInterval(heartbeat);
        clearInterval(keepAlive);
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