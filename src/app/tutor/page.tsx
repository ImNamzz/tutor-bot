"use client";
import { useEffect, useRef, useState } from "react";
import Topbar from "@/app/components/Topbar";
import { Card } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { Textarea } from "@/app/components/ui/textarea";
import { ScrollArea } from "@/app/components/ui/scroll-area";
import { Upload, Send } from "lucide-react";

type Role = "user" | "assistant";
interface Message {
  id: string;
  role: Role;
  content: string;
}

export default function TutorPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (messages.length === 0) {
      setMessages([
        {
          id: "greet",
          role: "assistant",
          content: "Welcome to AI Tutor. Upload a lecture or start chatting.",
        },
      ]);
    }
  }, []);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const add = (role: Role, content: string) =>
    setMessages((m) => [
      ...m,
      { id: `${Date.now()}-${Math.random()}`, role, content },
    ]);
  const handleSend = () => {
    if (!input.trim()) return;
    const text = input.trim();
    setInput("");
    add("user", text);
    setIsLoading(true);
    setTimeout(() => {
      add("assistant", "Thanks! (Placeholder response)");
      setIsLoading(false);
    }, 500);
  };
  const handleFile = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0f0f0f]">
      <Topbar />
      <main className="px-4 sm:px-6 lg:px-8 py-8">
        <div className="max-w-4xl mx-auto">
          <Card className="p-4 sm:p-6 space-y-4">
            <div className="flex items-center gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept=".txt,.doc,.docx"
                className="hidden"
              />
              <Button
                onClick={handleFile}
                variant="outline"
                size="sm"
                className="gap-2"
              >
                <Upload className="h-4 w-4" /> Upload lecture
              </Button>
            </div>
            <ScrollArea className="h-[50vh] border border-border rounded-md p-4 bg-card/50 dark:bg-card/40">
              <div className="space-y-4">
                {messages.map((m) => (
                  <div
                    key={m.id}
                    className={m.role === "user" ? "text-right" : "text-left"}
                  >
                    <div
                      className={
                        m.role === "user"
                          ? "inline-block bg-indigo-600 text-white px-4 py-2 rounded-2xl"
                          : "inline-block bg-gray-100 dark:bg-gray-800 px-4 py-2 rounded-2xl"
                      }
                    >
                      {m.content}
                    </div>
                  </div>
                ))}
                <div ref={endRef} />
              </div>
            </ScrollArea>
            <div className="flex gap-2">
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                rows={1}
                placeholder="Type a message..."
                className="resize-none"
              />
              <Button
                onClick={handleSend}
                disabled={!input.trim() || isLoading}
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </Card>
        </div>
      </main>
    </div>
  );
}
