// File: src/app/page.tsx
// AI Tutor on Home Page - All-in-one version

"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/app/components/ui/button";
import { Card } from "@/app/components/ui/card";
import { Input } from "@/app/components/ui/input";
import { Textarea } from "@/app/components/ui/textarea";
import { ScrollArea } from "@/app/components/ui/scroll-area";
import { Badge } from "@/app/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/app/components/ui/dialog'
import { Label } from '@/app/components/ui/label'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/app/components/ui/tooltip'
import {
  Upload,
  Send,
  Loader2,
  Bot,
  User,
  FileText,
  Sparkles,
  Clock,
  MessageSquare,
  Trash2,
  PanelLeftClose,
  PanelLeftOpen,
  BookOpen,
  Moon,
  Sun,
  Calendar,
  CheckSquare,
  LogOut,
  UserCircle,
  Plus,
  ChevronRight,
  Paperclip,
  Image,
  Lock,
  MoreVertical,
  Pin,
  Edit2,
  ArrowDown, Music, File, X, Settings, Eye, EyeOff, Info, Check,
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import {
  isAuthenticated,
  removeAccessToken,
  getAccessToken,
  handleAuthError,
} from "@/app/lib/auth";
import { API_ENDPOINTS } from "@/app/lib/config";
import { validatePassword, checkPasswordRequirements } from '@/app/lib/passwordValidation'

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

type ChatState = "idle" | "uploaded" | "quizzing" | "completed";

interface TranscriptSession {
  id: string;
  fileName: string;
  content: string;
  keyPoints: string[];
  messages: Message[];
  score?: number;
  pinned?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export default function Home() {
  const router = useRouter();
  const pathname = usePathname();

  // Theme state
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isAuth, setIsAuth] = useState(false);
  const [userId, setUserId] = useState<string | null>(null)

  // Chat state
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [chatState, setChatState] = useState<ChatState>("idle");
  const [fileName, setFileName] = useState<string>("");
  const [transcriptContent, setTranscriptContent] = useState<string>("");
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [totalQuestions, setTotalQuestions] = useState(3);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [keyPoints, setKeyPoints] = useState<string[]>([]);
  const [sessions, setSessions] = useState<TranscriptSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string>("");
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [showUploadMenu, setShowUploadMenu] = useState(false);
  const [openSessionMenu, setOpenSessionMenu] = useState<string | null>(null);
  const [renamingSessionId, setRenamingSessionId] = useState<string | null>(
    null
  );
  const [newSessionName, setNewSessionName] = useState("");
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editedMessageContent, setEditedMessageContent] = useState("");
  const [hoveredMessageId, setHoveredMessageId] = useState<string | null>(null);
  const [showScrollButton, setShowScrollButton] = useState(false);
const [attachedFile, setAttachedFile] = useState<File | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [settingsTab, setSettingsTab] = useState<'customization' | 'security'>('customization')
  const [isChangingEmail, setIsChangingEmail] = useState(false)
  const [tempTheme, setTempTheme] = useState<boolean>(false) // Temporary theme state for preview
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [settingsData, setSettingsData] = useState({
    username: '',
    email: '',
    newEmail: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    hasPassword: true,
    isGoogleAccount: false
  })
  
  const audioInputRef = useRef<HTMLInputElement>(null);
  const textInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const uploadMenuRef = useRef<HTMLDivElement>(null);
  const sessionMenuRef = useRef<HTMLDivElement>(null);
  const editTextareaRef = useRef<HTMLTextAreaElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  // Helper function to get user-specific localStorage key
  const getChatSessionsKey = () => {
    return userId ? `chatSessions_${userId}` : 'chatSessions_guest'
  }

  // Handle client-side only mounting
  useEffect(() => {
    setMounted(true);

    // Check authentication (but don't require it)
    const authenticated = isAuthenticated()
    setIsAuth(authenticated)
    
    // Fetch user profile to get userId
    if (authenticated) {
      fetch(API_ENDPOINTS.getUserProfile, {
        headers: {
          'Authorization': `Bearer ${getAccessToken()}`
        }
      })
      .then(res => {
        if (res.status === 401) {
          // Token is invalid or expired
          handleAuthError(401)
          setIsAuth(false)
          return null
        }
        return res.ok ? res.json() : null
      })
      .then(data => {
        if (data?.id) {
          setUserId(data.id)
        }
      })
      .catch(err => console.error('Error fetching user profile:', err))
    }
    
    const savedTheme = localStorage.getItem('theme')
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    setIsDarkMode(savedTheme === 'dark' || (!savedTheme && prefersDark))
    
    const savedSidebar = localStorage.getItem('sidebarOpen')
    if (savedSidebar !== null) {
      setIsSidebarOpen(savedSidebar === "true");
    }
  }, [])

  // Fetch user profile when settings dialog opens
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (isSettingsOpen && isAuth) {
        try {
          const response = await fetch(API_ENDPOINTS.getUserProfile, {
            headers: {
              'Authorization': `Bearer ${getAccessToken()}`
            }
          })
          
          if (response.ok) {
            const data = await response.json()
            setSettingsData(prev => ({
              ...prev,
              username: data.username,
              email: data.email,
              newEmail: '',
              hasPassword: data.has_password,
              isGoogleAccount: data.is_google_account
            }))
            setIsChangingEmail(false)
            setSettingsTab('customization')
            setTempTheme(isDarkMode) // Initialize temp theme with current theme
          }
        } catch (error) {
          console.error('Error fetching user profile:', error)
        }
      }
    }
    
    fetchUserProfile()
  }, [isSettingsOpen, isAuth])

  // Handle theme changes
  useEffect(() => {
    if (!mounted) return;

    if (isDarkMode) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [isDarkMode, mounted]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    setShowScrollButton(false);
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    setShowScrollButton(false);
  };

  // Save sidebar state to localStorage
  useEffect(() => {
    if (mounted) {
      localStorage.setItem("sidebarOpen", String(isSidebarOpen));
    }
  }, [isSidebarOpen, mounted]);

  // Close upload menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        uploadMenuRef.current &&
        !uploadMenuRef.current.contains(event.target as Node)
      ) {
        setShowUploadMenu(false);
      }
      if (
        sessionMenuRef.current &&
        !sessionMenuRef.current.contains(event.target as Node)
      ) {
        setOpenSessionMenu(null);
      }
    };

    if (showUploadMenu || openSessionMenu) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showUploadMenu, openSessionMenu]);

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
  };

  const handleLogout = () => {
    removeAccessToken();
    setUserId(null)
    setSessions([])
    setMessages([])
    setChatState('idle')
    setCurrentSessionId('')
    toast.success("Signed out successfully");
    router.push("/auth/login");
  };

  const addMessage = (role: "user" | "assistant", content: string) => {
    const newMessage: Message = {
      id: Date.now().toString() + Math.random(),
      role,
      content,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, newMessage]);
  };

  const generateSessionName = async (content: string): Promise<string> => {
    try {
      // Generate a concise session name based on content
      const response = await fetch(API_ENDPOINTS.chat, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getAccessToken()}`,
        },
        body: JSON.stringify({
          chat_session_id: null,
          message: `Generate a very short, concise title (3-5 words max) for a chat session based on this content: "${content.substring(0, 200)}...". Only respond with the title, nothing else.`
        })
      })

      if (response.ok) {
        const data = await response.json();
        // Clean up the response and limit length
        let title = data.response.replace(/['"]/g, "").trim();
        if (title.length > 50) {
          title = title.substring(0, 47) + "...";
        }
        // Store the session ID if returned
        if (data.chat_session_id) {
          setCurrentSessionId(data.chat_session_id.toString())
        }
        return title
      }
    } catch (error) {
      console.error("Error generating session name:", error);
    }

    // Fallback to a default name with timestamp
    return `Chat Session ${new Date().toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })}`;
  };

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const validExtensions = [".txt", ".doc", ".docx"];
    const fileExtension = file.name
      .toLowerCase()
      .substring(file.name.lastIndexOf("."));

    if (!validExtensions.includes(fileExtension)) {
      toast.error("Please upload a .txt, .doc, or .docx file");
      return;
    }

    // Save current session before starting new one
    if (chatState !== "idle") {
      saveCurrentSession();
    }

    // Reset for new session
    setMessages([]);
    setCurrentQuestionIndex(0);
    setCorrectAnswers(0);
    setFileName(file.name);
    setIsLoading(true);

    addMessage("user", `📎 Uploaded: ${file.name}`);

    // For .doc and .docx files, send directly to backend for processing
    if (fileExtension === ".doc" || fileExtension === ".docx") {
      try {
        const formData = new FormData()
        formData.append('file', file)
        
        // Note: Backend may need to support .doc/.docx parsing
        // For now, sending as is - backend should handle extraction
        const reader = new FileReader()
        reader.onload = async (e) => {
          const content = e.target?.result as string
          
          try {
            // Start chat session directly with the document content
            const initialMessage = `I've uploaded a document titled "${file.name}". Here's the content:\n\n${content}\n\nPlease help me understand this content by asking me questions.`
            
            const chatResponse = await fetch(API_ENDPOINTS.chat, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${getAccessToken()}`
              },
              body: JSON.stringify({
                message: initialMessage
              })
            })

            if (!chatResponse.ok) {
              if (chatResponse.status === 401) {
                handleAuthError(401)
                return
              }
              throw new Error('Failed to start chat session')
            }

            const chatData = await chatResponse.json()
            
            // Set the session ID from backend
            setCurrentSessionId(chatData.chat_session_id.toString())
            
            // Generate AI-based session name in the background
            generateSessionName(content).then(generatedName => {
              setFileName(generatedName)
            })
            
            setTranscriptContent(content)
            
            // Use the response from the backend
            addMessage('assistant', chatData.response)
            
            setChatState('quizzing')
            setIsLoading(false)
            toast.success('Document processed! Answer the questions to proceed.')
            
          } catch (error) {
            console.error('Error processing document:', error)
            toast.error('Failed to process document. Please try again.')
            setIsLoading(false)
            
            // Reset to idle state on error
            setMessages([])
            setChatState('idle')
            setFileName('')
            addMessage('assistant', 
              "Sorry, I encountered an error processing your document. Please make sure the backend server is running."
            )
          }
        }
        
        reader.onerror = () => {
          toast.error('Failed to read file')
          setIsLoading(false)
          setMessages([])
          setChatState('idle')
          setFileName('')
        }
        
        reader.readAsText(file)
        
      } catch (error) {
        console.error('Error reading document:', error)
        toast.error('Failed to read document. Please try again.')
        setIsLoading(false)
        
        // Reset to idle state on error
        setMessages([])
        setChatState('idle')
        setFileName('')
      }
      return;
    }

    // For .txt files, read as text
    const reader = new FileReader();
    reader.onload = async (e) => {
      const content = e.target?.result as string;
      setTranscriptContent(content);

      addMessage("user", `📎 Uploaded: ${file.name}`);

      try {
        // Use chat endpoint directly with the transcript content
        const chatResponse = await fetch(API_ENDPOINTS.chat, {
          method: 'POST',
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${getAccessToken()}`,
          },
          body: JSON.stringify({
            message: `I've uploaded a transcript file. Here's the content:\n\n${content}\n\nPlease help me understand this material by asking me questions about it.`
          })
        })

        if (!chatResponse.ok) {
          if (chatResponse.status === 401) {
            handleAuthError(401)
            return
          }
          throw new Error('Failed to process transcript')
        }

        const chatData = await chatResponse.json()
        
        // Set the session ID from backend
        if (chatData.chat_session_id) {
          setCurrentSessionId(chatData.chat_session_id.toString())
        }
        
        // Generate AI-based session name
        const generatedName = await generateSessionName(content)
        setFileName(generatedName)
        
        // Add AI response
        addMessage('assistant', chatData.response)
        
        setChatState('quizzing')
        setIsLoading(false)
        toast.success('Transcript processed! Ready to discuss.')
        
      } catch (error) {
        console.error('Error starting session:', error)
        toast.error('Failed to process transcript. Please try again.')
        setIsLoading(false)
        
        // Reset to idle state on error
        setMessages([])
        setChatState('idle')
        setFileName('')
        addMessage('assistant', 
          "Sorry, I encountered an error processing your file. Please make sure the backend server is running and try again."
        )
      }
    }
    
    reader.readAsText(file)
  }

  // Helper function to get or create a default class for uploads
  const getOrCreateDefaultClass = async (): Promise<string> => {
    try {
      // Try to fetch existing classes
      const response = await fetch(API_ENDPOINTS.classes, {
        headers: {
          'Authorization': `Bearer ${getAccessToken()}`
        }
      })
      
      if (response.ok) {
        const classes = await response.json()
        // If user has classes, return the first one
        if (classes && classes.length > 0) {
          return classes[0].id
        }
      }
      
      // No classes exist, create a default one
      const createResponse = await fetch(API_ENDPOINTS.classes, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getAccessToken()}`
        },
        body: JSON.stringify({ title: 'General' })
      })
      
      if (!createResponse.ok) {
        throw new Error('Failed to create default class')
      }
      
      const newClass = await createResponse.json()
      return newClass.id
    } catch (error) {
      console.error('Error getting/creating default class:', error)
      throw error
    }
  }

  const processFileUpload = async (file: File, userMessage: string = '') => {
    const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'))
    const validTextExtensions = ['.txt', '.doc', '.docx']
    const validAudioExtensions = ['.mp3', '.m4a', '.wav', '.ogg', '.flac', '.aac', '.wma']

    setIsLoading(true)
    
    const fileTypeIcon = validAudioExtensions.includes(fileExtension) ? '🎵' : '📄'
    const messageContent = userMessage ? `${fileTypeIcon} ${file.name}\n\n${userMessage}` : `${fileTypeIcon} Uploaded: ${file.name}`
    addMessage('user', messageContent)
    
    // Handle audio files
    if (validAudioExtensions.includes(fileExtension)) {
      try {
        // Get or create a default class for the upload
        const classId = await getOrCreateDefaultClass()
        
        const formData = new FormData()
        formData.append('media', file)
        formData.append('class_id', classId)
        formData.append('title', file.name)
        formData.append('language', 'en-US') // Default to English
        
        const response = await fetch(API_ENDPOINTS.uploadAudio, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${getAccessToken()}`
          },
          body: formData
        })

        if (!response.ok) {
          if (response.status === 401) {
            handleAuthError(401);
            return;
          }
          throw new Error('Failed to process audio')
        }

        const data = await response.json()
        const transcript = data.transcript || ''
        setTranscriptContent(transcript)
        
        // Start a chat session with the transcript as context
        const initialMessage = `I've uploaded an audio file titled "${file.name}". Here's the transcript:\n\n${transcript}\n\nPlease help me understand this content by asking me questions.`
        
        const chatResponse = await fetch(API_ENDPOINTS.chat, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${getAccessToken()}`
          },
          body: JSON.stringify({
            message: initialMessage
          })
        })

        if (!chatResponse.ok) {
          if (chatResponse.status === 401) {
            handleAuthError(401)
            return
          }
          throw new Error('Failed to start chat session')
        }

        const chatData = await chatResponse.json()
        setCurrentSessionId(chatData.chat_session_id.toString())
        
        generateSessionName(file.name).then(generatedName => {
          setFileName(generatedName)
        })
        
        addMessage('assistant', chatData.response)
        
        setChatState('quizzing')
        setIsLoading(false)
        toast.success('Audio transcribed successfully!')
        
      } catch (error) {
        console.error('Error processing audio:', error)
        toast.error('Failed to process audio. Please try again.')
        setIsLoading(false)
        setMessages([])
        setChatState('idle')
        setFileName('')
      }
      return
    }
    
    // For text files, use existing handleFileUpload logic by reading the file
    if (validTextExtensions.includes(fileExtension)) {
      // Create a synthetic event to reuse existing logic
      const reader = new FileReader()
      reader.onload = async (e) => {
        const content = e.target?.result as string
        setTranscriptContent(content)
        
        try {
          // Start chat session directly with the text content
          const initialMessage = `I've uploaded a document titled "${file.name}". Here's the content:\n\n${content}\n\nPlease help me understand this content by asking me questions.`
          
          const chatResponse = await fetch(API_ENDPOINTS.chat, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${getAccessToken()}`
            },
            body: JSON.stringify({
              message: initialMessage
            })
          })

          if (!chatResponse.ok) {
            if (chatResponse.status === 401) {
              handleAuthError(401)
              return
            }
            throw new Error('Failed to start chat session')
          }

          const chatData = await chatResponse.json()
          setCurrentSessionId(chatData.chat_session_id.toString())
          
          generateSessionName(content).then(generatedName => {
            setFileName(generatedName)
          })
          
          addMessage('assistant', chatData.response)
          
          setChatState('quizzing')
          setIsLoading(false)
          toast.success('Transcript processed! Answer the questions to proceed.')
          
        } catch (error) {
          console.error('Error starting session:', error)
          toast.error('Failed to process transcript. Please try again.')
          setIsLoading(false)
          setMessages([])
          setChatState('idle')
          setFileName('')
        }
      }
      
      reader.readAsText(file)
    }
  }

  const removeAttachedFile = () => {
    setAttachedFile(null)
    if (audioInputRef.current) audioInputRef.current.value = ''
    if (textInputRef.current) textInputRef.current.value = ''
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (isAuth) {
      setIsDragging(true)
    }
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)

    if (!isAuth) {
      toast.error('Please sign in to upload files')
      return
    }

    const file = e.dataTransfer.files?.[0]
    if (!file) return

    const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'))
    const validExtensions = ['.txt', '.doc', '.docx', '.mp3', '.m4a', '.wav', '.ogg', '.flac', '.aac', '.wma']
    
    if (!validExtensions.includes(fileExtension)) {
      toast.error('Unsupported file format. Please upload audio (mp3, m4a, wav, etc.) or text files (txt, doc, docx)')
      return
    }

    setAttachedFile(file)
  }

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const validAudioExtensions = ['.mp3', '.m4a', '.wav', '.ogg', '.flac', '.aac', '.wma']
    const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'))
    
    if (!validAudioExtensions.includes(fileExtension)) {
      toast.error('Please upload a valid audio file (mp3, m4a, wav, ogg, flac, aac, wma)')
      return
    }

    // Attach file and allow user to add a message
    setAttachedFile(file)
    setShowUploadMenu(false)
  }

  const handleSendMessage = async () => {
    // If there's an attached file, process it with the message
    if (attachedFile) {
      const userMessage = inputMessage.trim()
      const fileToUpload = attachedFile
      
      // Clear UI immediately
      setAttachedFile(null)
      setInputMessage('')
      if (audioInputRef.current) audioInputRef.current.value = ''
      if (textInputRef.current) textInputRef.current.value = ''
      toast.dismiss() // Dismiss all toast notifications
      
      await processFileUpload(fileToUpload, userMessage)
      return
    }

    if (!inputMessage.trim()) return

    const userMessage = inputMessage.trim();
    setInputMessage("");
    addMessage("user", userMessage);
    setIsLoading(true);

    if (chatState === "idle") {
      // User is starting a new session without uploading a file
      // Send to backend to create a proper session
      setFileName("Chat Session");

      try {
        const response = await fetch(API_ENDPOINTS.chat, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${getAccessToken()}`,
          },
          body: JSON.stringify({
            chat_session_id: null, // Let backend create a new session
            message: userMessage
          })
        })

        if (!response.ok) {
          if (response.status === 401) {
            handleAuthError(401);
            return;
          }
          throw new Error("Failed to send message");
        }

        const data = await response.json();

        // Update session ID from backend and set state to completed
        setCurrentSessionId(data.chat_session_id.toString())
        setChatState('completed') // Now in conversation mode
        
        // Generate AI-based session name from the first message
        generateSessionName(userMessage).then((generatedName) => {
          setFileName(generatedName);
        });

        // Display AI's response
        addMessage("assistant", data.response);

        setIsLoading(false);
      } catch (error) {
        console.error("Error sending message:", error);
        toast.error("Failed to send message. Please try again.");

        addMessage(
          "assistant",
          "Sorry, I encountered an error processing your message. Please make sure the backend server is running and try again."
        );

        setIsLoading(false);
      }
      return;
    }

    // For both quizzing and completed states, use the /api/chat endpoint
    if (chatState === "quizzing" || chatState === "completed") {
      try {
        const response = await fetch(API_ENDPOINTS.chat, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${getAccessToken()}`,
          },
          body: JSON.stringify({
            chat_session_id: currentSessionId ? Number(currentSessionId) : null,
            message: userMessage
          })
        })

        if (!response.ok) {
          if (response.status === 401) {
            handleAuthError(401);
            return;
          }
          throw new Error("Failed to send message");
        }

        const data = await response.json();

        // Update session ID from backend (in case it was created or changed)
        if (data.chat_session_id) {
          setCurrentSessionId(data.chat_session_id.toString())
        }

        // Display AI's response
        addMessage("assistant", data.response);

        setIsLoading(false);
      } catch (error) {
        console.error("Error sending message:", error);
        toast.error("Failed to send message. Please try again.");

        addMessage(
          "assistant",
          "Sorry, I encountered an error processing your message. Please make sure the backend server is running and try again."
        );

        setIsLoading(false);
      }
      return;
    }

    setIsLoading(false);
  };

  const handleCopyMessage = (content: string) => {
    navigator.clipboard.writeText(content);
    toast.success("Message copied to clipboard!");
  };

  const handleStartEditMessage = (messageId: string, content: string) => {
    setEditingMessageId(messageId);
    setEditedMessageContent(content);
  };

  const handleCancelEdit = () => {
    setEditingMessageId(null);
    setEditedMessageContent("");
  };

  const handleSaveEdit = async (messageId: string) => {
    if (!editedMessageContent.trim()) return;

    // Find the message index
    const messageIndex = messages.findIndex((m) => m.id === messageId);
    if (messageIndex === -1) return;

    // Update the message
    const updatedMessages = [...messages];
    updatedMessages[messageIndex] = {
      ...updatedMessages[messageIndex],
      content: editedMessageContent.trim(),
    };

    // Remove all messages after the edited one
    const messagesToKeep = updatedMessages.slice(0, messageIndex + 1);
    setMessages(messagesToKeep);

    setEditingMessageId(null);
    setEditedMessageContent("");
    setIsLoading(true);

    // Get AI response to the edited message
    try {
      const response = await fetch(API_ENDPOINTS.chat, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getAccessToken()}`,
        },
        body: JSON.stringify({
          chat_session_id: currentSessionId ? Number(currentSessionId) : null,
          message: editedMessageContent.trim()
        })
      })

      if (!response.ok) {
        if (response.status === 401) {
          handleAuthError(401);
          return;
        }
        throw new Error("Failed to get response");
      }

      const data = await response.json();

      // Add AI response
      addMessage("assistant", data.response);

      setIsLoading(false);
    } catch (error) {
      console.error("Error getting AI response:", error);
      toast.error("Failed to get AI response. Please try again.");
      addMessage(
        "assistant",
        "Sorry, I encountered an error processing your edited message. Please try again."
      );
      setIsLoading(false);
    }
  };

  const saveCurrentSession = () => {
    if (!mounted || chatState === "idle" || !fileName || messages.length <= 1)
      return;

    const score =
      chatState === "completed"
        ? Math.round((correctAnswers / totalQuestions) * 100)
        : undefined;

    const session: TranscriptSession = {
      id: currentSessionId || `session_${Date.now()}`,
      fileName,
      content: transcriptContent,
      keyPoints,
      messages: messages.map((m) => ({
        ...m,
        timestamp: new Date(m.timestamp),
      })),
      score,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const existingSessions = JSON.parse(
      localStorage.getItem("chatSessions") || "[]"
    );
    const sessionIndex = existingSessions.findIndex(
      (s: TranscriptSession) => s.id === session.id
    );

    if (sessionIndex >= 0) {
      existingSessions[sessionIndex] = session;
    } else {
      existingSessions.unshift(session);
    }

    const trimmedSessions = existingSessions.slice(0, 20)
    localStorage.setItem(getChatSessionsKey(), JSON.stringify(trimmedSessions))
    setSessions(trimmedSessions)
  }

  const loadSessions = () => {
    if (!mounted) return;

    try {
      const savedSessions = localStorage.getItem(getChatSessionsKey())
      if (savedSessions) {
        const parsed = JSON.parse(savedSessions);
        const validSessions = parsed.map((s: any) => ({
          ...s,
          createdAt: s.createdAt ? new Date(s.createdAt) : new Date(),
          updatedAt: s.updatedAt ? new Date(s.updatedAt) : new Date(),
          messages: Array.isArray(s.messages)
            ? s.messages.map((m: any) => ({
                ...m,
                timestamp: m.timestamp ? new Date(m.timestamp) : new Date(),
              }))
            : [],
        }));
        setSessions(validSessions);
      }
    } catch (error) {
      console.error("Error loading sessions:", error);
      setSessions([]);
    }
  };

  const handleLoadSession = (session: TranscriptSession) => {
    try {
      setMessages(session.messages || []);
      setFileName(session.fileName || "Untitled");
      setTranscriptContent(session.content || "");
      setKeyPoints(session.keyPoints || []);
      setCurrentSessionId(session.id);

      if (session.score !== undefined) {
        setChatState("completed");
      } else {
        setChatState("quizzing");
      }

      toast.success("Session loaded!");
    } catch (error) {
      console.error("Error loading session:", error);
      toast.error("Failed to load session");
    }
  };

  const handleDeleteSession = (e: React.MouseEvent, sessionId: string) => {
    e.stopPropagation()
    
    if (!mounted) return
    
    const savedSessions = JSON.parse(localStorage.getItem(getChatSessionsKey()) || '[]')
    const filtered = savedSessions.filter((s: TranscriptSession) => s.id !== sessionId)
    localStorage.setItem(getChatSessionsKey(), JSON.stringify(filtered))
    setSessions(filtered)
    
    // If user is deleting the currently active session, create a new session
    if (sessionId === currentSessionId) {
      setMessages([])
      setChatState('idle')
      setFileName('')
      setTranscriptContent('')
      setCurrentQuestionIndex(0)
      setCorrectAnswers(0)
      setKeyPoints([])
      setCurrentSessionId('')
      if (textInputRef.current) {
        textInputRef.current.value = ''
      }
      if (audioInputRef.current) {
        audioInputRef.current.value = ''
      }
      addMessage(
        "assistant",
        "Your previous session has been deleted. Feel free to start a new conversation or upload a file! 📚"
      );
    }

    toast.success("Session deleted");
  };

  const handlePinSession = (e: React.MouseEvent, sessionId: string) => {
    e.stopPropagation()
    setOpenSessionMenu(null)
    
    if (!mounted) return
    
    const savedSessions = JSON.parse(localStorage.getItem(getChatSessionsKey()) || '[]')
    const updated = savedSessions.map((s: TranscriptSession) => 
      s.id === sessionId ? { ...s, pinned: !s.pinned } : s
    )
    localStorage.setItem(getChatSessionsKey(), JSON.stringify(updated))
    setSessions(updated)
    
    const session = updated.find((s: TranscriptSession) => s.id === sessionId)
    toast.success(session?.pinned ? 'Session pinned' : 'Session unpinned')
  }

  const handleRenameSession = (e: React.MouseEvent, sessionId: string) => {
    e.stopPropagation();
    setOpenSessionMenu(null);

    const session = sessions.find((s) => s.id === sessionId);
    if (session) {
      setRenamingSessionId(sessionId);
      setNewSessionName(session.fileName);
    }
  };

  const saveRename = (sessionId: string) => {
    if (!mounted || !newSessionName.trim()) return
    
    const savedSessions = JSON.parse(localStorage.getItem(getChatSessionsKey()) || '[]')
    const updated = savedSessions.map((s: TranscriptSession) => 
      s.id === sessionId ? { ...s, fileName: newSessionName.trim() } : s
    )
    localStorage.setItem(getChatSessionsKey(), JSON.stringify(updated))
    localStorage.setItem('chatSessions', JSON.stringify(updated))
    setSessions(updated)
    
    if (sessionId === currentSessionId) {
      setFileName(newSessionName.trim());
    }

    setRenamingSessionId(null);
    setNewSessionName("");
    toast.success("Session renamed");
  };

  const cancelRename = () => {
    setRenamingSessionId(null);
    setNewSessionName("");
  };

  const handleReset = () => {
    saveCurrentSession()
    
    setMessages([])
    setChatState('idle')
    setFileName('')
    setTranscriptContent('')
    setCurrentQuestionIndex(0)
    setCorrectAnswers(0)
    setKeyPoints([])
    setCurrentSessionId('')
    if (textInputRef.current) {
      textInputRef.current.value = ''
    }
    if (audioInputRef.current) {
      audioInputRef.current.value = ''
    }
    addMessage(
      "assistant",
      "Welcome back! Upload a new lecture transcript to start a fresh learning session. 📚"
    );
  };

  const formatRelativeTime = (date: Date | string): string => {
    try {
      const dateObj = date instanceof Date ? date : new Date(date);
      if (isNaN(dateObj.getTime())) {
        return "Unknown";
      }

      const now = new Date();
      const diffMs = now.getTime() - dateObj.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);

      if (diffMins < 1) return "Just now";
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      if (diffDays < 7) return `${diffDays}d ago`;

      return dateObj.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });
    } catch (error) {
      return "Unknown";
    }
  };

  const categorizeSessionsByTime = () => {
    const now = new Date();
    const categories: { [key: string]: TranscriptSession[] } = {
      Today: [],
      Yesterday: [],
      "7 Days": [],
      "30 Days": [],
    };

    // Add month categories dynamically
    const months: { [key: string]: TranscriptSession[] } = {};

    sessions.forEach((session) => {
      const sessionDate =
        session.updatedAt instanceof Date
          ? session.updatedAt
          : new Date(session.updatedAt);
      const diffMs = now.getTime() - sessionDate.getTime();
      const diffDays = Math.floor(diffMs / 86400000);

      if (diffDays === 0) {
        categories["Today"].push(session);
      } else if (diffDays === 1) {
        categories["Yesterday"].push(session);
      } else if (diffDays <= 7) {
        categories["7 Days"].push(session);
      } else if (diffDays <= 30) {
        categories["30 Days"].push(session);
      } else {
        const monthKey = sessionDate.toLocaleDateString("en-US", {
          year: "numeric",
          month: "2-digit",
        });
        if (!months[monthKey]) {
          months[monthKey] = [];
        }
        months[monthKey].push(session);
      }
    });

    // Remove empty categories
    Object.keys(categories).forEach((key) => {
      if (categories[key].length === 0) {
        delete categories[key];
      }
    });

    return { ...categories, ...months };
  };

  // Load sessions on mount and when userId changes
  useEffect(() => {
    if (mounted) {
      loadSessions();
    }
  }, [mounted, userId])

  // Auto-save session periodically
  useEffect(() => {
    if (mounted && chatState !== "idle" && fileName) {
      const timer = setTimeout(() => {
        saveCurrentSession();
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [messages, chatState, fileName, mounted]);

  // Initial greeting
  useEffect(() => {
    if (mounted && messages.length === 0) {
      if (!isAuth) {
        // Show sign in prompt if user is not authenticated
        addMessage(
          "assistant",
          "Hi! I'm your AI learning assistant. 👋\n\n🔒 You need to sign in to use the chatbot.\n\nPlease sign in or create an account to:\n\n1. Upload lecture transcripts and study materials\n2. Get personalized quizzes based on your content\n3. Receive AI-powered explanations and summaries\n4. Save your learning sessions and track progress\n\nClick the 'Sign In' or 'Sign Up' button in the top right to get started!"
        );
      } else {
        // Show normal greeting if user is authenticated
        addMessage(
          "assistant",
          "Hi! I'm your AI learning assistant. 👋\n\nTo get started, please upload a lecture transcript or study material using the upload button above. I'll help you understand the content by:\n\n1. Asking you questions to test your comprehension\n2. Grading your understanding\n3. Providing key summaries and clarifications\n4. Answering any questions you have about the material\n\nReady to learn? Upload your file to begin!"
        );
      }
    }
  }, [mounted, isAuth]);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputMessage(e.target.value);

    // Auto-resize textarea
    const textarea = e.target;
    textarea.style.height = "auto";
    textarea.style.height = `${textarea.scrollHeight}px`;
  };

  // Auto-resize on mount and when inputMessage changes
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [inputMessage]);

  // Handle scroll detection for scroll-to-bottom button
  useEffect(() => {
    const scrollContainer = scrollAreaRef.current?.querySelector(
      "[data-radix-scroll-area-viewport]"
    );
    if (!scrollContainer) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = scrollContainer;
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 20;
      setShowScrollButton(!isNearBottom && messages.length > 0);
    };

    scrollContainer.addEventListener("scroll", handleScroll);
    return () => scrollContainer.removeEventListener("scroll", handleScroll);
  }, [messages.length]);

  // Don't render until mounted to prevent hydration issues
  if (!mounted) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0f0f0f] transition-colors">
      {/* Session History Sidebar - Fixed Left Side, Full Height */}
      <div
        className={`fixed left-0 top-0 h-screen z-50 transition-all duration-300 ease-in-out flex flex-col bg-card/95 dark:bg-card/95 backdrop-blur-sm border-r border-border dark:border-border ${
          isSidebarOpen ? "w-[280px]" : "w-16"
        }`}
      >
        {/* Sidebar Header with Toggle */}
        <div className="h-16 px-4 flex items-center justify-between shrink-0">
          {isSidebarOpen && (
            <div className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              <span className="text-gray-900 dark:text-white font-medium text-sm">EduAssist</span>
            </div>
          )}
          <Button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 hover:bg-gray-200 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400"
            aria-label={isSidebarOpen ? "Close sidebar" : "Open sidebar"}
          >
            {isSidebarOpen ? (
              <PanelLeftClose className="h-4 w-4" />
            ) : (
              <PanelLeftOpen className="h-4 w-4" />
            )}
          </Button>
        </div>

        {/* New Chat Button */}
        <div className="p-3 border-b border-gray-100 dark:border-gray-800 shrink-0">
          <Button
            onClick={handleReset}
            className={`w-full justify-start gap-2 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 ${
              !isSidebarOpen ? "px-2" : ""
            }`}
            variant="outline"
          >
            <Plus className="h-4 w-4 shrink-0" />
            {isSidebarOpen && <span>New chat</span>}
          </Button>
        </div>

        {/* Sessions List - Scrollable */}
        <div className="flex-1 overflow-hidden">
          <ScrollArea className="h-full">
            {isSidebarOpen ? (
              <div className="p-3 space-y-4">
                {sessions.length === 0 ? (
                  <div className="text-center text-gray-500 dark:text-gray-500 py-8">
                    <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-xs">No chat history</p>
                  </div>
                ) : (
                  Object.entries(categorizeSessionsByTime()).map(
                    ([category, categorySessions]) => (
                      <div key={category} className="space-y-2">
                        <h4 className="text-xs font-medium text-gray-600 dark:text-gray-500 px-2">
                          {category}
                        </h4>
                        {categorySessions.map((session) => {
                          const isActive = session.id === currentSessionId;

                          return (
                            <div
                              key={session.id}
                              className={`group relative p-2.5 rounded-lg cursor-pointer transition-all ${
                                isActive
                                  ? "bg-gray-200 dark:bg-gray-800"
                                  : "hover:bg-gray-100 dark:hover:bg-gray-800/50"
                              }`}
                              onClick={() => handleLoadSession(session)}
                            >
                              <div className="flex items-start gap-2">
                                <MessageSquare className="h-4 w-4 shrink-0 text-gray-600 dark:text-gray-400 mt-0.5" />
                                <div className="flex-1 min-w-0 pr-8">
                                  {renamingSessionId === session.id ? (
                                    <input
                                      type="text"
                                      value={newSessionName}
                                      onChange={(e) =>
                                        setNewSessionName(e.target.value)
                                      }
                                      onKeyDown={(e) => {
                                        if (e.key === "Enter")
                                          saveRename(session.id);
                                        if (e.key === "Escape") cancelRename();
                                      }}
                                      onBlur={() => saveRename(session.id)}
                                      onClick={(e) => e.stopPropagation()}
                                      className="w-full text-sm bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-200 px-2 py-1 rounded border border-gray-300 dark:border-gray-600 focus:outline-none focus:border-gray-400"
                                      autoFocus
                                    />
                                  ) : (
                                    <div className="flex items-center gap-1">
                                      {session.pinned && (
                                        <Pin className="h-3 w-3 text-gray-600 dark:text-gray-400" />
                                      )}
                                      <p className="text-sm text-gray-900 dark:text-gray-200 break-words">
                                        {session.fileName}
                                      </p>
                                    </div>
                                  )}
                                </div>
                                <div className="relative">
                                  <Button
                                    onClick={(e: React.MouseEvent) => {
                                      e.stopPropagation();
                                      setOpenSessionMenu(
                                        openSessionMenu === session.id
                                          ? null
                                          : session.id
                                      );
                                    }}
                                    variant="ghost"
                                    size="sm"
                                    className="opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 p-0 hover:bg-gray-200 dark:hover:bg-gray-700 absolute right-0 top-0"
                                  >
                                    <MoreVertical className="h-3 w-3 text-gray-600 dark:text-gray-400" />
                                  </Button>

                                  {/* Dropdown Menu */}
                                  {openSessionMenu === session.id && (
                                    <div
                                      ref={sessionMenuRef}
                                      className="absolute right-0 top-6 bg-card dark:bg-card border border-border dark:border-border rounded-lg shadow-lg overflow-hidden z-50 min-w-[140px]"
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                      <button
                                        onClick={(e) =>
                                          handlePinSession(e, session.id)
                                        }
                                        className="w-full px-3 py-2 flex items-center gap-2 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-left text-sm text-gray-900 dark:text-gray-200"
                                      >
                                        <Pin className="h-3 w-3" />
                                        <span>
                                          {session.pinned ? "Unpin" : "Pin"}
                                        </span>
                                      </button>
                                      <button
                                        onClick={(e) =>
                                          handleRenameSession(e, session.id)
                                        }
                                        className="w-full px-3 py-2 flex items-center gap-2 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-left text-sm text-gray-900 dark:text-gray-200"
                                      >
                                        <Edit2 className="h-3 w-3" />
                                        <span>Rename</span>
                                      </button>
                                      <button
                                        onClick={(e) =>
                                          handleDeleteSession(e, session.id)
                                        }
                                        className="w-full px-3 py-2 flex items-center gap-2 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-left text-sm text-red-600 dark:text-red-400"
                                      >
                                        <Trash2 className="h-3 w-3" />
                                        <span>Delete</span>
                                      </button>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )
                  )
                )}
              </div>
            ) : (
              // Minimized view - just icons
              <div className="p-2 space-y-2">
                {sessions.slice(0, 5).map((session) => {
                  const isActive = session.id === currentSessionId;
                  return (
                    <div
                      key={session.id}
                      className={`p-2 rounded-lg cursor-pointer transition-all ${
                        isActive ? "bg-gray-800" : "hover:bg-gray-800/50"
                      }`}
                      onClick={() => handleLoadSession(session)}
                      title={session.fileName}
                    >
                      <MessageSquare className="h-4 w-4 text-gray-400 mx-auto" />
                    </div>
                  );
                })}
              </div>
            )}
          </ScrollArea>
        </div>
      </div>

      {/* Fixed Topbar aligned with sidebar */}
      <nav
        className={`fixed top-0 left-0 right-0 z-50 bg-card/80 dark:bg-card/80 backdrop-blur-sm border-b border-border dark:border-border transition-colors ${
          isSidebarOpen ? "ml-[280px]" : "ml-16"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-8">
              <Link
                href="/dashboard"
                className="flex items-center hover:opacity-80 transition-opacity"
              >
                <BookOpen className="h-8 w-8 text-indigo-600 dark:text-indigo-400" />
                <span className="ml-2 dark:text-white">EduAssist</span>
              </Link>

              {/* Navigation Links */}
              <div className="hidden md:flex items-center gap-6">
                <Link
                  href="/"
                  className={`transition-colors flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 ${
                    pathname === "/" ? "font-medium" : "font-normal"
                  }`}
                >
                  <BookOpen className="h-4 w-4" />
                  AI Tutor
                </Link>
                <Link
                  href="/calendar"
                  className={`transition-colors flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 ${
                    pathname === "/calendar" ? "font-medium" : "font-normal"
                  }`}
                >
                  <Calendar className="h-4 w-4" />
                  Calendar
                </Link>
                <Link
                  href="/todo"
                  className={`transition-colors flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 ${
                    pathname === "/todo" ? "font-medium" : "font-normal"
                  }`}
                >
                  <CheckSquare className="h-4 w-4" />
                  Todo
                </Link>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {isAuth && (
                <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
                  <DialogTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="rounded-full w-9 h-9 p-0"
                      aria-label="Settings"
                    >
                      <Settings className="h-5 w-5 text-gray-600 dark:text-gray-300" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-hidden bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-white">
                    <DialogHeader>
                      <DialogTitle className="text-xl font-semibold">Account Settings</DialogTitle>
                    </DialogHeader>
                    
                    <div className="flex h-[500px]">
                      {/* Left Sidebar - Tabs */}
                      <div className="w-48 border-r border-gray-200 dark:border-gray-700 pr-4">
                        <nav className="space-y-1">
                          <button
                            onClick={() => setSettingsTab('customization')}
                            className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                              settingsTab === 'customization'
                                ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400'
                                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                            }`}
                          >
                            Customization
                          </button>
                          <button
                            onClick={() => setSettingsTab('security')}
                            className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                              settingsTab === 'security'
                                ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400'
                                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                            }`}
                          >
                            Security
                          </button>
                        </nav>
                      </div>

                      {/* Right Content Area */}
                      <div className="flex-1 pl-6 pr-5 overflow-y-auto">
                        {settingsTab === 'customization' && (
                          <div className="space-y-6">
                            <div>
                              <h3 className="text-lg font-semibold mb-4">Customization</h3>
                              
                              {/* Username */}
                              <div className="space-y-2 mb-6">
                                <Label htmlFor="username" className="text-sm font-medium">
                                  Username
                                </Label>
                                <Input
                                  id="username"
                                  type="text"
                                  placeholder="Enter username"
                                  value={settingsData.username}
                                  onChange={(e) => setSettingsData({...settingsData, username: e.target.value})}
                                  className="bg-gray-50 dark:bg-[#212121] border-gray-300 dark:border-gray-700"
                                />
                              </div>

                              {/* Theme Toggle */}
                              <div className="space-y-2">
                                <Label className="text-sm font-medium">
                                  Appearance
                                </Label>
                                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-[#212121] rounded-lg border border-gray-300 dark:border-gray-700">
                                  <span className="text-sm">Dark Mode</span>
                                  <button
                                    onClick={() => setTempTheme(!tempTheme)}
                                    className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                                    style={{
                                      backgroundColor: tempTheme ? '#6366f1' : '#d1d5db'
                                    }}
                                  >
                                    <span
                                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                        tempTheme ? 'translate-x-6' : 'translate-x-1'
                                      }`}
                                    />
                                  </button>
                                </div>
                              </div>
                            </div>

                            {/* Save Button */}
                            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                              <Button
                                variant="outline"
                                onClick={() => {
                                  setIsSettingsOpen(false)
                                  setTempTheme(isDarkMode) // Reset temp theme on cancel
                                }}
                                className="border-gray-300 dark:border-gray-700"
                              >
                                Cancel
                              </Button>
                              <Button
                                onClick={async () => {
                                  try {
                                    // Apply theme change
                                    if (tempTheme !== isDarkMode) {
                                      setIsDarkMode(tempTheme)
                                      localStorage.setItem('theme', tempTheme ? 'dark' : 'light')
                                      if (tempTheme) {
                                        document.documentElement.classList.add('dark')
                                      } else {
                                        document.documentElement.classList.remove('dark')
                                      }
                                    }

                                    // Update username if changed
                                    if (settingsData.username) {
                                      const response = await fetch(API_ENDPOINTS.updateUsername, {
                                        method: 'PATCH',
                                        headers: {
                                          'Content-Type': 'application/json',
                                          'Authorization': `Bearer ${getAccessToken()}`
                                        },
                                        body: JSON.stringify({ username: settingsData.username })
                                      })

                                      if (!response.ok) {
                                        const data = await response.json()
                                        if (response.status === 401) {
                                          handleAuthError(401)
                                          return
                                        }
                                        toast.error(data.detail || 'Failed to update username')
                                        return
                                      }
                                    }

                                    toast.success('Profile updated successfully!')
                                    setIsSettingsOpen(false)
                                  } catch (error) {
                                    console.error('Error updating profile:', error)
                                    toast.error('Failed to update profile')
                                  }
                                }}
                                className="bg-indigo-600 hover:bg-indigo-700 text-white"
                              >
                                Save Changes
                              </Button>
                            </div>
                          </div>
                        )}

                        {settingsTab === 'security' && (
                          <div className="space-y-6">
                            <div>
                              <h3 className="text-lg font-semibold mb-4">Security</h3>
                              
                              {/* Email Section */}
                              <div className="space-y-2 mb-6">
                                <Label htmlFor="current-email" className="text-sm font-medium">
                                  Current Email
                                </Label>
                                {!isChangingEmail ? (
                                  <div className="flex items-center gap-2">
                                    <Input
                                      id="current-email"
                                      type="email"
                                      value={settingsData.email}
                                      readOnly={!settingsData.isGoogleAccount}
                                      disabled={settingsData.isGoogleAccount}
                                      className={settingsData.isGoogleAccount 
                                        ? "bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-700 cursor-not-allowed text-gray-500 dark:text-gray-400" 
                                        : "bg-gray-50 dark:bg-[#212121] border-gray-300 dark:border-gray-700 cursor-default"}
                                    />
                                    {!settingsData.isGoogleAccount && (
                                      <Button
                                        variant="outline"
                                        onClick={() => setIsChangingEmail(true)}
                                        className="border-gray-300 dark:border-gray-700 whitespace-nowrap"
                                      >
                                        Change Email
                                      </Button>
                                    )}
                                  </div>
                                ) : (
                                  <div className="space-y-2">
                                    <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                                      Current: {settingsData.email}
                                    </div>
                                    <Input
                                      id="new-email"
                                      type="email"
                                      placeholder="Enter new email"
                                      value={settingsData.newEmail}
                                      onChange={(e) => setSettingsData({...settingsData, newEmail: e.target.value})}
                                      className="bg-gray-50 dark:bg-[#212121] border-gray-300 dark:border-gray-700"
                                    />
                                    <div className="flex gap-2">
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => {
                                          setIsChangingEmail(false)
                                          setSettingsData({...settingsData, newEmail: ''})
                                        }}
                                        className="border-gray-300 dark:border-gray-700"
                                      >
                                        Cancel
                                      </Button>
                                    </div>
                                  </div>
                                )}
                                {settingsData.isGoogleAccount && (
                                  <p className="text-xs text-gray-500 dark:text-gray-400">
                                    Email cannot be changed for Google accounts
                                  </p>
                                )}
                              </div>

                              {/* Password Section */}
                              <div className="space-y-4 border-t border-gray-200 dark:border-gray-700 pt-6">
                                <h4 className="text-sm font-semibold">
                                  {settingsData.hasPassword ? 'Change Password' : 'Set Password'}
                                </h4>
                                
                                {!settingsData.hasPassword && (
                                  <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 text-sm text-blue-800 dark:text-blue-200">
                                    You signed in with Google. Set a password to enable email/password login as a backup.
                                  </div>
                                )}

                                {/* Current Password - only show if user has password */}
                                {settingsData.hasPassword && (
                                  <div className="space-y-2">
                                    <Label htmlFor="currentPassword" className="text-sm font-medium">
                                      Current Password
                                    </Label>
                                    <div className="relative">
                                      <Input
                                        id="currentPassword"
                                        type={showCurrentPassword ? "text" : "password"}
                                        placeholder="Enter current password"
                                        value={settingsData.currentPassword}
                                        onChange={(e) => setSettingsData({...settingsData, currentPassword: e.target.value})}
                                        className="bg-gray-50 dark:bg-[#212121] border-gray-300 dark:border-gray-700 pr-10"
                                      />
                                      <button
                                        type="button"
                                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                                      >
                                        {showCurrentPassword ? (
                                          <EyeOff className="h-5 w-5" />
                                        ) : (
                                          <Eye className="h-5 w-5" />
                                        )}
                                      </button>
                                    </div>
                                  </div>
                                )}

                                {/* New Password */}
                                <div className="space-y-2">
                                  <Label htmlFor="newPassword" className="text-sm font-medium">
                                    New Password
                                  </Label>
                                  <div className="relative">
                                    <Input
                                      id="newPassword"
                                      type={showNewPassword ? "text" : "password"}
                                      placeholder="Enter new password"
                                      value={settingsData.newPassword}
                                      onChange={(e) => setSettingsData({...settingsData, newPassword: e.target.value})}
                                      className="bg-gray-50 dark:bg-[#212121] border-gray-300 dark:border-gray-700 pr-10"
                                    />
                                    <button
                                      type="button"
                                      onClick={() => setShowNewPassword(!showNewPassword)}
                                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                                    >
                                      {showNewPassword ? (
                                        <EyeOff className="h-5 w-5" />
                                      ) : (
                                        <Eye className="h-5 w-5" />
                                      )}
                                    </button>
                                  </div>
                                </div>

                                {/* Confirm New Password */}
                                <div className="space-y-2">
                                  <div className="flex items-center gap-2">
                                    <Label htmlFor="confirmPassword" className="text-sm font-medium">
                                      Confirm New Password
                                    </Label>
                                    <TooltipProvider delayDuration={0}>
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <button type="button" className="focus:outline-none">
                                            <Info className="h-4 w-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 cursor-help" />
                                          </button>
                                        </TooltipTrigger>
                                        <TooltipContent className="max-w-xs">
                                          <div className="text-xs space-y-1">
                                            <p className="font-medium mb-2">Password must contain:</p>
                                            <div className="space-y-1.5">
                                              {checkPasswordRequirements(settingsData.newPassword, settingsData.username, settingsData.email).map((requirement, index) => (
                                                <div key={index} className="flex items-center gap-2">
                                                  {requirement.isSatisfied ? (
                                                    <Check className="h-4 w-4 text-green-500 shrink-0" />
                                                  ) : (
                                                    <X className="h-4 w-4 text-red-500 shrink-0" />
                                                  )}
                                                  <span className={requirement.isSatisfied ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}>
                                                    {requirement.label}
                                                  </span>
                                                </div>
                                              ))}
                                            </div>
                                          </div>
                                        </TooltipContent>
                                      </Tooltip>
                                    </TooltipProvider>
                                  </div>
                                  <div className="relative">
                                    <Input
                                      id="confirmPassword"
                                      type={showConfirmPassword ? "text" : "password"}
                                      placeholder="Confirm new password"
                                      value={settingsData.confirmPassword}
                                      onChange={(e) => setSettingsData({...settingsData, confirmPassword: e.target.value})}
                                      onPaste={(e) => {
                                        e.preventDefault();
                                        toast.error("Please type your password confirmation manually");
                                      }}
                                      className="bg-gray-50 dark:bg-[#212121] border-gray-300 dark:border-gray-700 pr-10"
                                    />
                                    <button
                                      type="button"
                                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                                    >
                                      {showConfirmPassword ? (
                                        <EyeOff className="h-5 w-5" />
                                      ) : (
                                        <Eye className="h-5 w-5" />
                                      )}
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Save Button */}
                            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                              <Button
                                variant="outline"
                                onClick={() => {
                                  setIsSettingsOpen(false)
                                  setIsChangingEmail(false)
                                  setTempTheme(isDarkMode) // Reset temp theme on cancel
                                  setSettingsData(prev => ({
                                    ...prev,
                                    newEmail: '',
                                    currentPassword: '',
                                    newPassword: '',
                                    confirmPassword: ''
                                  }))
                                }}
                                className="border-gray-300 dark:border-gray-700"
                              >
                                Cancel
                              </Button>
                              <Button
                                onClick={async () => {
                                  try {
                                    let hasChanges = false;
                                    let updatedEmail = settingsData.email;

                                    // Handle email change
                                    if (isChangingEmail && settingsData.newEmail) {
                                      if (settingsData.newEmail === settingsData.email) {
                                        toast.error('New email must be different from current email')
                                        return
                                      }
                                      
                                      const emailResponse = await fetch(API_ENDPOINTS.updateEmail, {
                                        method: 'PATCH',
                                        headers: {
                                          'Content-Type': 'application/json',
                                          'Authorization': `Bearer ${getAccessToken()}`
                                        },
                                        body: JSON.stringify({ email: settingsData.newEmail })
                                      })

                                      if (!emailResponse.ok) {
                                        const data = await emailResponse.json()
                                        if (emailResponse.status === 401) {
                                          handleAuthError(401)
                                          return
                                        }
                                        toast.error(data.detail || 'Failed to update email')
                                        return
                                      }
                                      updatedEmail = settingsData.newEmail
                                      hasChanges = true
                                    }

                                    // Handle password change
                                    if (settingsData.newPassword || settingsData.confirmPassword || settingsData.currentPassword) {
                                      if (settingsData.hasPassword && !settingsData.currentPassword) {
                                        toast.error('Please enter your current password to change it')
                                        return
                                      }
                                      if (!settingsData.newPassword) {
                                        toast.error('Please enter a new password')
                                        return
                                      }
                                      if (settingsData.newPassword !== settingsData.confirmPassword) {
                                        toast.error('New passwords do not match')
                                        return
                                      }
                                      
                                      // Validate password requirements
                                      const validation = validatePassword(
                                        settingsData.newPassword, 
                                        settingsData.username, 
                                        settingsData.newEmail || settingsData.email
                                      )
                                      if (!validation.isValid) {
                                        validation.errors.forEach(error => toast.error(error))
                                        return
                                      }

                                      const passwordResponse = await fetch(API_ENDPOINTS.updatePassword, {
                                        method: 'PUT',
                                        headers: {
                                          'Content-Type': 'application/json',
                                          'Authorization': `Bearer ${getAccessToken()}`
                                        },
                                        body: JSON.stringify({
                                          old_password: settingsData.currentPassword || '',
                                          new_password: settingsData.newPassword
                                        })
                                      })

                                      if (!passwordResponse.ok) {
                                        const data = await passwordResponse.json()
                                        if (passwordResponse.status === 401) {
                                          handleAuthError(401)
                                          return
                                        }
                                        toast.error(data.detail || 'Failed to update password')
                                        return
                                      }
                                      hasChanges = true
                                    }

                                    if (!hasChanges) {
                                      toast.error('No changes to save')
                                      return
                                    }

                                    toast.success('Security settings updated successfully!')
                                    setIsSettingsOpen(false)
                                    setIsChangingEmail(false)
                                    setSettingsData(prev => ({
                                      ...prev,
                                      email: updatedEmail,
                                      newEmail: '',
                                      currentPassword: '',
                                      newPassword: '',
                                      confirmPassword: '',
                                      hasPassword: prev.hasPassword || (settingsData.newPassword ? true : prev.hasPassword)
                                    }))
                                  } catch (error) {
                                    console.error('Error updating security settings:', error)
                                    toast.error('Failed to update security settings')
                                  }
                                }}
                                className="bg-indigo-600 hover:bg-indigo-700 text-white"
                              >
                                Save Changes
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              )}
              
              <Button
                onClick={toggleTheme}
                variant="ghost"
                size="sm"
                className="rounded-full w-9 h-9 p-0"
                aria-label="Toggle theme"
              >
                {isDarkMode ? (
                  <Sun className="h-5 w-5 text-gray-300" />
                ) : (
                  <Moon className="h-5 w-5 text-gray-600" />
                )}
              </Button>

              {isAuth ? (
                <Button
                  onClick={handleLogout}
                  variant="ghost"
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <LogOut className="h-4 w-4" />
                  <span className="hidden sm:inline">Sign Out</span>
                </Button>
              ) : (
                <div className="flex items-center gap-2">
                  <Link href="/auth/login">
                    <Button variant="ghost" size="sm">
                      Sign In
                    </Button>
                  </Link>
                  <Link href="/auth/register">
                    <Button size="sm">Sign Up</Button>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content Area - Adjusted for sidebar and fixed bars */}
      <div
        className={`transition-all duration-300 ${
          isSidebarOpen ? "ml-[280px]" : "ml-16"
        } pt-16 pb-24`}
      >
        {/* Page Content */}
        <main className="px-4 sm:px-6 lg:px-8 py-8">
          <div className="max-w-[1200px] mx-auto">
            {/* Main Chat Area */}
            <Card 
              className={`min-h-[600px] flex flex-col dark:border-gray-800 transition-all duration-300 bg-transparent border-0 shadow-none relative ${
                isDragging ? 'ring-2 ring-indigo-500 ring-offset-2' : ''
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
            {/* Hidden file inputs */}
            <input
              ref={textInputRef}
              type="file"
              accept=".txt,.doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              onChange={handleFileUpload}
              className="hidden"
              id="file-upload"
            />
            <input
              ref={audioInputRef}
              type="file"
              accept="audio/*,.mp3,.m4a,.wav,.ogg,.flac,.aac,.wma"
              onChange={handleImageUpload}
              className="hidden"
              id="audio-upload"
            />

              {/* Chat Messages */}
              <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
                <div className="space-y-6 pb-4">
                  {messages.map((message, index) => (
                    <div
                      key={message.id}
                      className={`group relative ${
                        message.role === "user"
                          ? "flex justify-end"
                          : "flex justify-start"
                      }`}
                      onMouseEnter={() => setHoveredMessageId(message.id)}
                      onMouseLeave={() => setHoveredMessageId(null)}
                    >
                      {editingMessageId === message.id ? (
                        // Edit mode
                        <div className="w-full">
                          <Textarea
                            ref={editTextareaRef}
                            value={editedMessageContent}
                            onChange={(e) =>
                              setEditedMessageContent(e.target.value)
                            }
                            className="w-full resize-none min-h-[100px] bg-card dark:bg-card border-2 border-primary/50 text-foreground dark:text-foreground"
                            autoFocus
                          />
                          <div className="flex gap-2 mt-2 justify-end">
                            <Button
                              onClick={handleCancelEdit}
                              variant="outline"
                              size="sm"
                            >
                              Cancel
                            </Button>
                            <Button
                              onClick={() => handleSaveEdit(message.id)}
                              size="sm"
                            >
                              Save & Submit
                            </Button>
                          </div>
                        </div>
                      ) : (
                        // Display mode
                        <>
                          <div
                            className={
                              message.role === "user"
                                ? "flex flex-col items-end gap-1"
                                : ""
                            }
                          >
                            <div
                              className={`px-4 py-3 max-w-[85%] break-all rounded-xl ${
                                message.role === "user"
                                  ? "bg-gray-900 text-white"
                                  : "text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-800"
                              }`}
                            >
                              <p className="whitespace-pre-wrap">
                                {message.content}
                              </p>
                              {message.role === "assistant" && (
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                                  {message.timestamp instanceof Date
                                    ? message.timestamp.toLocaleTimeString(
                                        "en-US",
                                        { hour: "2-digit", minute: "2-digit" }
                                      )
                                    : new Date(
                                        message.timestamp
                                      ).toLocaleTimeString("en-US", {
                                        hour: "2-digit",
                                        minute: "2-digit",
                                      })}
                                </p>
                              )}
                            </div>

                            {/* Action buttons below user messages */}
                            {message.role === "user" && (
                              <div className="flex gap-2 px-2">
                                <button
                                  onClick={() =>
                                    handleCopyMessage(message.content)
                                  }
                                  className="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 flex items-center gap-1"
                                  title="Copy"
                                >
                                  <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    width="12"
                                    height="12"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  >
                                    <rect
                                      x="9"
                                      y="9"
                                      width="13"
                                      height="13"
                                      rx="2"
                                      ry="2"
                                    ></rect>
                                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                                  </svg>
                                  Copy
                                </button>
                                <button
                                  onClick={() =>
                                    handleStartEditMessage(
                                      message.id,
                                      message.content
                                    )
                                  }
                                  className="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 flex items-center gap-1"
                                  title="Edit"
                                >
                                  <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    width="12"
                                    height="12"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  >
                                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                                  </svg>
                                  Edit
                                </button>
                              </div>
                            )}
                          </div>

                          {/* Action buttons on hover for AI messages */}
                          {message.role === "assistant" &&
                            hoveredMessageId === message.id && (
                              <div className="absolute top-0 left-0 -translate-x-full mr-2 pr-2 flex gap-1 transition-opacity opacity-100">
                                <Button
                                  onClick={() =>
                                    handleCopyMessage(message.content)
                                  }
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0 hover:bg-gray-200 dark:hover:bg-gray-700"
                                  title="Copy"
                                >
                                  <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    width="16"
                                    height="16"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  >
                                    <rect
                                      x="9"
                                      y="9"
                                      width="13"
                                      height="13"
                                      rx="2"
                                      ry="2"
                                    ></rect>
                                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                                  </svg>
                                </Button>
                              </div>
                            )}
                        </>
                      )}
                    </div>
                  ))}

                  {isLoading && (
                    <div className="flex justify-start">
                      <div className="px-4 py-3">
                        <Loader2 className="h-5 w-5 text-gray-600 dark:text-gray-400 animate-spin" />
                      </div>
                    </div>
                  )}

                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>

              {/* Input moved to fixed bottom bar */}
            </Card>
          </div>
        </main>
      </div>

      {/* Fixed Input Area aligned with sidebar */}
      <div
        className={`fixed bottom-0 left-0 right-0 bg-card/80 dark:bg-card/80 backdrop-blur-sm border-t border-border dark:border-border transition-colors ${
          isSidebarOpen ? "ml-[280px]" : "ml-16"
        }`}
      >
        <div className="p-4">
          <div className="max-w-[1200px] mx-auto">
            {/* Scroll to bottom button */}
            {messages.length > 0 && (
              <div className="flex justify-end mb-2">
                <Button
                  onClick={scrollToBottom}
                  variant="outline"
                  size="sm"
                  className="gap-2 text-xs"
                  title="Scroll to latest message"
                >
                  <ArrowDown className="h-4 w-4" />
                  Latest message
                </Button>
              </div>
            )}

            <div className="flex gap-2 max-w-3xl mx-auto">
              {/* Upload button with menu or Lock icon */}
              <div className="relative" ref={uploadMenuRef}>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => isAuth && setShowUploadMenu(!showUploadMenu)}
                  disabled={!isAuth}
                  className={`min-h-11 h-11 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 ${
                    !isAuth ? "cursor-not-allowed opacity-50" : ""
                  }`}
                >
                  {isAuth ? (
                    <Plus className="h-4 w-4" />
                  ) : (
                    <Lock className="h-5 w-5" />
                  )}
                </Button>

                {/* Upload menu */}
                {showUploadMenu && isAuth && (
                  <div className="absolute bottom-full left-0 mb-2 bg-card dark:bg-card border border-border dark:border-border rounded-lg shadow-lg overflow-hidden z-50 min-w-[180px]">
                    <button
                      onClick={() => {
                        textInputRef.current?.click();
                        setShowUploadMenu(false);
                      }}
                      className="w-full px-4 py-2.5 flex items-center gap-3 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-left"
                    >
                      <Paperclip className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        Upload file
                      </span>
                    </button>
                    <button
                      onClick={() => {
                        audioInputRef.current?.click();
                        setShowUploadMenu(false);
                      }}
                      className="w-full px-4 py-2.5 flex items-center gap-3 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-left"
                    >
                      <Image className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        Upload image
                      </span>
                    </button>
                  </div>
                )}
              </div>

              <Textarea
                ref={textareaRef}
                value={inputMessage}
                onChange={handleInputChange}
                onKeyDown={handleKeyPress}
                placeholder={
                  !isAuth
                    ? "You need to sign in to use the chatbot."
                    : chatState === "quizzing"
                    ? "Type your answer or ask a question..."
                    : chatState === "completed"
                    ? "Ask me anything about the material..."
                    : "Type a message..."
                }
                rows={1}
                disabled={!isAuth}
                className={`resize-none min-h-11 max-h-32 overflow-y-auto bg-card dark:bg-card border-2 border-border text-foreground dark:text-foreground ${
                  !isAuth ? "cursor-not-allowed opacity-50" : ""
                }`}
              />
              <Button
                onClick={handleSendMessage}
                disabled={!isAuth || !inputMessage.trim() || isLoading}
                className={`shrink-0 min-h-11 h-11 ${
                  !isAuth ? "cursor-not-allowed opacity-50" : ""
                }`}
              >
                {isAuth ? (
                  <Send className="h-4 w-4" />
                ) : (
                  <Lock className="h-4 w-4" />
                )}
              </Button>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 text-center mt-2">
              {isAuth
                ? "Press Enter to send, Shift+Enter for new line"
                : "Please sign in to start chatting"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
