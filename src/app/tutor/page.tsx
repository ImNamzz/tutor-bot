"use client";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Topbar from "@/app/components/Topbar";
import { FloatingScratchpad } from "@/app/components/socratic/FloatingScratchpad";
import { SessionOverview } from "@/app/components/socratic/simple/SessionOverview";
import { LearningDashboard } from "@/app/components/socratic/simple/LearningDashboard";
import {
  SocraticChat,
  type ChatMessage,
} from "@/app/components/socratic/simple/SocraticChat";
import { API_ENDPOINTS } from "@/app/lib/config";
import { getAccessToken, handleAuthError } from "@/app/lib/auth";
import { toast } from "sonner";

export default function TutorPage() {
  const searchParams = useSearchParams();
  const lectureId = searchParams?.get('lectureId');
  
  // Must-have state
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [confidence, setConfidence] = useState(0.7);
  const [sessionProgress, setSessionProgress] = useState({
    currentQuestion: 1,
    totalQuestions: 12,
  });
  const [scratchpad, setScratchpad] = useState("");
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [lectureTranscript, setLectureTranscript] = useState<string>("");

  // Fetch lecture transcript if lectureId is provided
  useEffect(() => {
    if (lectureId) {
      fetchLectureTranscript(lectureId);
    } else {
      // Initialize with generic first question if no lecture context
      initializeGenericChat();
    }
  }, [lectureId]);

  const fetchLectureTranscript = async (id: string) => {
    try {
      const response = await fetch(API_ENDPOINTS.getLecture(id), {
        headers: {
          'Authorization': `Bearer ${getAccessToken()}`
        }
      });

      if (response.ok) {
        const lecture = await response.json();
        if (lecture.transcript) {
          setLectureTranscript(lecture.transcript);
          // Initialize chat with lecture context
          initializeChatWithLecture(lecture.transcript);
        } else {
          initializeGenericChat();
        }
      } else {
        initializeGenericChat();
      }
    } catch (error) {
      console.error('Error fetching lecture:', error);
      initializeGenericChat();
    }
  };

  const initializeChatWithLecture = async (transcript: string) => {
    try {
      setIsLoading(true);
      // Create a focused prompt for generating Socratic questions
      const contextMessage = `You are a Socratic tutor. Based on this lecture transcript, generate ONE thoughtful Socratic question that encourages critical thinking and deeper understanding. The question should be open-ended and help students explore the key concepts.\n\nLecture content:\n${transcript.substring(0, 2500)}\n\nGenerate a Socratic question:`;
      
      const response = await fetch(API_ENDPOINTS.chat, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getAccessToken()}`
        },
        body: JSON.stringify({
          message: contextMessage,
          session_id: currentSessionId
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.session_id) {
          setCurrentSessionId(data.session_id);
        }
        
        setMessages([{
          type: "ai",
          content: data.response || "What key concepts from this lecture would you like to explore further?",
          questionType: "evidence",
        }]);
      } else {
        initializeGenericChat();
      }
    } catch (error) {
      console.error('Error initializing chat:', error);
      initializeGenericChat();
    } finally {
      setIsLoading(false);
    }
  };

  const initializeGenericChat = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(API_ENDPOINTS.chat, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getAccessToken()}`
        },
        body: JSON.stringify({
          message: "You are a Socratic tutor. Generate ONE thoughtful open-ended question to help me learn about a scientific concept.",
          session_id: currentSessionId
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.session_id) {
          setCurrentSessionId(data.session_id);
        }
        
        setMessages([{
          type: "ai",
          content: data.response || "What topic or concept would you like to explore today?",
          questionType: "evidence",
        }]);
      } else {
        // Fallback to default question
        setMessages([{
          type: "ai",
          content: "What topic or concept would you like to explore today?",
          questionType: "evidence",
        }]);
      }
    } catch (error) {
      console.error('Error initializing chat:', error);
      // Fallback to default question
      setMessages([{
        type: "ai",
        content: "What topic or concept would you like to explore today?",
        questionType: "evidence",
      }]);
    } finally {
      setIsLoading(false);
    }
  };  const submitAnswer = async () => {
    if (!input.trim() || isLoading) return;
    
    const text = input.trim();
    setMessages((m) => [...m, { type: "user", content: text, confidence }]);
    setInput("");
    setSessionProgress((p) => ({
      ...p,
      currentQuestion: Math.min(p.currentQuestion + 1, p.totalQuestions),
    }));
    
    try {
      setIsLoading(true);
      const response = await fetch(API_ENDPOINTS.chat, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getAccessToken()}`
        },
        body: JSON.stringify({
          message: text,
          session_id: currentSessionId
        })
      });

      if (!response.ok) {
        if (response.status === 401) {
          handleAuthError(401);
          return;
        }
        throw new Error('Failed to send message');
      }

      const data = await response.json();
      
      if (data.session_id) {
        setCurrentSessionId(data.session_id);
      }
      
      setMessages((m) => [
        ...m,
        {
          type: "ai",
          content: data.response || "How might an alternative mechanism explain the observations?",
          questionType: "perspective",
        },
      ]);
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
      // Remove user message on error
      setMessages((m) => m.slice(0, -1));
    } finally {
      setIsLoading(false);
    }
  };

  const requestHint = async () => {
    if (isLoading) return;
    
    try {
      setIsLoading(true);
      const response = await fetch(API_ENDPOINTS.chat, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getAccessToken()}`
        },
        body: JSON.stringify({
          message: "Can you provide a hint to help me answer the previous question?",
          session_id: currentSessionId
        })
      });

      if (response.ok) {
        const data = await response.json();
        
        if (data.session_id) {
          setCurrentSessionId(data.session_id);
        }
        
        setMessages((m) => [
          ...m,
          {
            type: "ai",
            content: data.response || "Think about enzymatic specificity and binding domains.",
            questionType: "clarification",
          },
        ]);
      } else {
        // Fallback hint
        setMessages((m) => [
          ...m,
          {
            type: "ai",
            content: "Think about enzymatic specificity and binding domains.",
            questionType: "clarification",
          },
        ]);
      }
    } catch (error) {
      console.error('Error requesting hint:', error);
      // Fallback hint
      setMessages((m) => [
        ...m,
        {
          type: "ai",
          content: "Think about enzymatic specificity and binding domains.",
          questionType: "clarification",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const addNote = () =>
    setScratchpad(
      (s) => s + (s ? "\n" : "") + `Note ${new Date().toLocaleTimeString()}: `
    );

  return (
    <div className="min-h-screen bg-background">
      <Topbar />
      <div className="flex h-[calc(100vh-4rem)] bg-background">
        {/* Left: Session Overview (25%) */}
        <div className="w-1/4 border-r border-border overflow-auto">
          <SessionOverview />
        </div>
        {/* Center: Learning Dashboard (35%) */}
        <div className="w-2/5 border-r border-border overflow-auto">
          <LearningDashboard />
        </div>
        {/* Right: Socratic Dialogue (40%) */}
        <div className="w-2/5 overflow-hidden">
          <SocraticChat
            messages={messages}
            confidence={confidence}
            onConfidence={setConfidence}
            input={input}
            onInput={setInput}
            onSubmit={submitAnswer}
            onHint={requestHint}
            onNote={addNote}
          />
        </div>
      </div>
      <FloatingScratchpad notes={scratchpad} onChange={setScratchpad} />
    </div>
  );
}
