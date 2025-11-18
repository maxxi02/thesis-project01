"use client";

import { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Send, RefreshCw, List, FileText, Lightbulb } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Message {
  role: "user" | "assistant";
  content: string;
  isTyping?: boolean;
}

interface AIChatWidgetProps {
  analytics: unknown;
}

const PROMPT_SUGGESTIONS = [
  "What products should I restock urgently?",
  "Which products are performing best?",
  "How can I improve my inventory turnover?",
  "What's my best selling category?",
  "Are there any slow-moving items?",
  "What's my average profit margin?",
  "Should I order more stock?",
  "Which products are overstocked?",
];

export function AIChatWidget({ analytics }: AIChatWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [input, setInput] = useState("");
  const [format, setFormat] = useState<"paragraph" | "bullets">("paragraph");
  const [showSuggestions, setShowSuggestions] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Hide suggestions after first user message
    if (messages.some(msg => msg.role === 'user')) {
      setShowSuggestions(false);
    }
  }, [messages]);

  const typeMessage = async (text: string) => {
    setMessages((prev) => [
      ...prev,
      { role: "assistant", content: "", isTyping: true },
    ]);

    const words = text.split(" ");
    let currentText = "";

    for (let i = 0; i < words.length; i++) {
      currentText += (i > 0 ? " " : "") + words[i];

      setMessages((prev) => {
        const newMessages = [...prev];
        const lastMessage = newMessages[newMessages.length - 1];
        if (lastMessage && lastMessage.isTyping) {
          lastMessage.content = currentText;
        }
        return newMessages;
      });

      await new Promise((resolve) => setTimeout(resolve, Math.random() * 50 + 30));
    }

    setMessages((prev) => {
      const newMessages = [...prev];
      const lastMessage = newMessages[newMessages.length - 1];
      if (lastMessage) {
        lastMessage.isTyping = false;
      }
      return newMessages;
    });
  };

  const generateInsights = async (customPrompt?: string): Promise<void> => {
    if (!analytics) return;

    setLoading(true);

    if (customPrompt) {
      const userMessage: Message = {
        role: "user",
        content: customPrompt,
      };
      setMessages((prev) => [...prev, userMessage]);
    }

    try {
      const response = await fetch("/api/ai-analytics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          analytics,
          customPrompt,
          format
        }),
      });

      if (!response.ok) throw new Error("Failed to generate insights");

      const data: { insights: string } = await response.json();
      await typeMessage(data.insights);

    } catch (err) {
      console.error("Error generating insights:", err);
      await typeMessage(
        "Sorry, I couldn't analyze your inventory right now. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSend = (promptText?: string) => {
    const messageText = promptText || input.trim();
    if (!messageText || loading) return;

    setInput("");
    setShowSuggestions(false);
    generateInsights(messageText);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    handleSend(suggestion);
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
        <Card className="fixed bottom-6 right-6 w-[450px] h-[600px] shadow-2xl z-50 flex flex-col">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 border-b">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              🤖 Nivek's Analysis
            </CardTitle>
            <div className="flex items-center gap-2">
              <Select value={format} onValueChange={(v: any) => setFormat(v)}>
                <SelectTrigger className="w-[130px] h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="paragraph">
                    <div className="flex items-center gap-2">
                      <FileText className="h-3 w-3" />
                      <span>Paragraph</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="bullets">
                    <div className="flex items-center gap-2">
                      <List className="h-3 w-3" />
                      <span>Bullets</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsOpen(false)}
                className="h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>

          <CardContent className="flex-1 p-4 overflow-hidden flex flex-col">
            {/* Messages */}
            <div className="flex-1 overflow-auto pr-2 space-y-4">
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex ${message.role === "user" ? "justify-end" : "justify-start"
                    }`}
                >
                  <div
                    className={`rounded-lg px-4 py-2 max-w-[90%] ${message.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-foreground"
                      }`}
                  >
                    <p className="text-sm whitespace-pre-wrap leading-relaxed">
                      {message.content}
                      {message.isTyping && (
                        <span className="inline-block w-1 h-4 ml-1 bg-current animate-pulse" />
                      )}
                    </p>
                  </div>
                </div>
              ))}

              {loading && messages[messages.length - 1]?.isTyping !== true && (
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
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="mt-4 space-y-2 flex-shrink-0">
              {showSuggestions ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                    <Lightbulb className="h-3 w-3" />
                    <span>Try asking:</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 max-h-[200px] overflow-y-auto pr-1">
                    {PROMPT_SUGGESTIONS.map((suggestion, index) => (
                      <Button
                        key={index}
                        variant="outline"
                        size="sm"
                        onClick={() => handleSuggestionClick(suggestion)}
                        disabled={loading}
                        className="text-xs h-auto py-2 px-3 text-left justify-start whitespace-normal"
                      >
                        {suggestion}
                      </Button>
                    ))}
                  </div>
                  <Button
                    onClick={() => setShowSuggestions(false)}
                    variant="ghost"
                    size="sm"
                    className="w-full text-xs"
                  >
                    Type your own question
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <Input
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Ask about your inventory..."
                      disabled={loading}
                      className="flex-1"
                    />
                    <Button
                      onClick={() => handleSend()}
                      disabled={loading || !input.trim()}
                      size="sm"
                      className="px-3"
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => setShowSuggestions(true)}
                      variant="ghost"
                      size="sm"
                      className="flex-1 text-xs"
                    >
                      <Lightbulb className="h-3 w-3 mr-1" />
                      Show suggestions
                    </Button>
                    <Button
                      onClick={() => generateInsights()}
                      disabled={loading}
                      variant="outline"
                      size="sm"
                      className="flex-1 text-xs"
                    >
                      <RefreshCw className="h-3 w-3 mr-1" />
                      Refresh Analysis
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </>
  );
}