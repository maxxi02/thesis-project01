"use client";

import { useState } from "react";
import { MessageCircle, X, Send } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface AIChatWidgetProps {
  analytics: unknown;
}

export function AIChatWidget({ analytics }: AIChatWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);

  const generateInsights = async (): Promise<void> => {
    if (!analytics) return;

    // Don't show user message anymore
    setLoading(true);

    try {
      const response = await fetch("/api/ai-analytics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ analytics }),
      });

      if (!response.ok) throw new Error("Failed to generate insights");

      const data: { insights: string } = await response.json();

      const assistantMessage: Message = {
        role: "assistant",
        content: data.insights,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err) {
      console.error("Error generating insights:", err);
      const errorMessage: Message = {
        role: "assistant",
        content:
          "Sorry, I couldn't analyze your inventory right now. Please try again.",
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Floating Button */}
      {!isOpen && (
        <button
          onClick={() => {
            setIsOpen(true);
            if (messages.length === 0) {
              generateInsights();
            }
          }}
          className="fixed bottom-6 right-6 h-14 w-14 rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 transition-all hover:scale-110 flex items-center justify-center z-50 cursor-pointer"
        >
          <MessageCircle className="h-6 w-6" />
        </button>
      )}
      {/* Chat Window */}
      {isOpen && (
        <Card className="fixed bottom-6 right-6 w-[400px] h-[500px] shadow-2xl z-50 flex flex-col">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 border-b">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              🤖 Nivek&#39;s Analysis
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsOpen(false)}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </CardHeader>

          <CardContent className="flex-1 p-4 overflow-hidden flex flex-col">
            {/* Fixed ScrollArea with proper height */}
            <div className="flex-1 overflow-auto pr-2">
              <div className="space-y-4">
                {messages.map((message, index) => (
                  <div key={index} className="flex justify-start">
                    <div className="rounded-lg px-4 py-2 max-w-[95%] bg-muted text-foreground">
                      <p className="text-sm whitespace-pre-wrap leading-relaxed">
                        {message.content}
                      </p>
                    </div>
                  </div>
                ))}

                {loading && (
                  <div className="flex justify-start">
                    <div className="bg-muted rounded-lg px-4 py-2">
                      <div className="flex gap-1">
                        <div className="w-2 h-2 bg-foreground/50 rounded-full animate-bounce" />
                        <div className="w-2 h-2 bg-foreground/50 rounded-full animate-bounce [animation-delay:0.2s]" />
                        <div className="w-2 h-2 bg-foreground/50 rounded-full animate-bounce [animation-delay:0.4s]" />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-4 flex gap-2 flex-shrink-0">
              <Button
                onClick={generateInsights}
                disabled={loading}
                className="flex-1"
                size="sm"
              >
                <Send className="h-4 w-4 mr-2" />
                {loading ? "Analyzing..." : "Refresh Analysis"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </>
  );
}
