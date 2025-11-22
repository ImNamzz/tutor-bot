"use client";
import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Topbar from "@/app/components/Topbar";
import { SocraticChat, type ChatMessage } from "@/app/components/socratic/simple/SocraticChat";
import { API_ENDPOINTS } from "@/app/lib/config";
import { getAccessToken, handleAuthError } from "@/app/lib/auth";
import { toast } from "sonner";

export default function TutorPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const lectureId = searchParams?.get('lectureId');
  const classId = searchParams?.get('classId');
  const sessionId = searchParams?.get('sessionId');
  
  // Must-have state
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [sessionProgress, setSessionProgress] = useState({
    currentQuestion: 1,
    totalQuestions: 12,
  });
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [lectureTranscript, setLectureTranscript] = useState<string>("");
  const [sessionTitle, setSessionTitle] = useState<string>("Chat Session");

  // Fetch lecture transcript if lectureId is provided
  useEffect(() => {
    // First, try to load a saved session if sessionId is provided
    if (sessionId) {
      loadSavedSession(sessionId);
    } else if (lectureId) {
      fetchLectureTranscript(lectureId);
    } else {
      // Initialize with generic first question if no lecture context
      initializeGenericChat();
    }
  }, [lectureId, sessionId]);

  const loadSavedSession = (id: string) => {
    try {
      const sessionKey = `chat_session_${id}`;
      const sessionData = localStorage.getItem(sessionKey);
      
      if (sessionData) {
        const parsed = JSON.parse(sessionData);
        setMessages(parsed.messages || []);
        setSessionTitle(parsed.title || "Chat Session");
        setCurrentSessionId(parsed.id);
        // Update progress based on message count
        const userMessages = (parsed.messages || []).filter((m: any) => m.type === 'user');
        setSessionProgress({
          currentQuestion: userMessages.length + 1,
          totalQuestions: 12,
        });
      } else {
        toast.error('Session not found');
        // Fall back to initializing a new chat
        if (lectureId) {
          fetchLectureTranscript(lectureId);
        } else {
          initializeGenericChat();
        }
      }
    } catch (error) {
      console.error('Error loading saved session:', error);
      toast.error('Failed to load session');
    }
  };

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
    setMessages((m) => [...m, { type: "user", content: text }]);
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

  const saveSession = async () => {
    // Check if there are any user messages (conversations to save)
    const userMessages = messages.filter(m => m.type === 'user');
    if (!userMessages.length) {
      toast.error('Nothing to save');
      return;
    }

    try {
      // Use current session ID or generate a new one
      const sessionId = currentSessionId || `session_${Date.now()}`;
      
      // Update session title in localStorage with timestamp
      const timestamp = new Date().toLocaleString();
      const updatedTitle = `${sessionTitle || 'Chat Session'} - ${timestamp}`;
      
      // Store session locally for quick access
      const sessionKey = `chat_session_${sessionId}`;
      localStorage.setItem(sessionKey, JSON.stringify({
        id: sessionId,
        title: updatedTitle,
        lectureId,
        classId,
        messages,
        timestamp: new Date().toISOString()
      }));

      toast.success('Session saved successfully');
    } catch (error) {
      console.error('Error saving session:', error);
      toast.error('Failed to save session');
    }
  };

  const returnToLecture = () => {
    if (classId && lectureId) {
      router.push(`/dashboard/class/${classId}/lecture/${lectureId}`);
    } else if (classId) {
      router.push(`/dashboard/class/${classId}`);
    } else {
      router.push('/dashboard');
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Topbar />
      <div className="flex items-center justify-center px-4 py-2 h-[calc(100vh-4rem)]">
        <div className="w-full max-w-2xl h-full">
          <SocraticChat
            messages={messages}
            input={input}
            onInput={setInput}
            onSubmit={submitAnswer}
            onSaveSession={saveSession}
            onReturn={returnToLecture}
          />
        </div>
      </div>
    </div>
  );
}
