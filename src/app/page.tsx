// File: src/app/page.tsx
// AI Tutor on Home Page - All-in-one version

'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/app/components/ui/button'
import { Card } from '@/app/components/ui/card'
import { Input } from '@/app/components/ui/input'
import { Textarea } from '@/app/components/ui/textarea'
import { ScrollArea } from '@/app/components/ui/scroll-area'
import { Badge } from '@/app/components/ui/badge'
import { Upload, Send, Loader2, Bot, User, FileText, Sparkles, Clock, MessageSquare, Trash2, PanelLeftClose, PanelLeftOpen, BookOpen, Moon, Sun, Calendar, CheckSquare, LogOut, UserCircle, Plus, ChevronRight, Paperclip, Image } from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { isAuthenticated, removeAccessToken, getAccessToken, handleAuthError } from '@/app/lib/auth'
import { API_ENDPOINTS } from '@/app/lib/config'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

type ChatState = 'idle' | 'uploaded' | 'quizzing' | 'completed'

interface TranscriptSession {
  id: string
  fileName: string
  content: string
  keyPoints: string[]
  messages: Message[]
  score?: number
  createdAt: Date
  updatedAt: Date
}

export default function Home() {
  const router = useRouter()
  const pathname = usePathname()
  
  // Theme state
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [isAuth, setIsAuth] = useState(false)
  
  // Chat state
  const [messages, setMessages] = useState<Message[]>([])
  const [inputMessage, setInputMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [chatState, setChatState] = useState<ChatState>('idle')
  const [fileName, setFileName] = useState<string>('')
  const [transcriptContent, setTranscriptContent] = useState<string>('')
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [totalQuestions, setTotalQuestions] = useState(3)
  const [correctAnswers, setCorrectAnswers] = useState(0)
  const [keyPoints, setKeyPoints] = useState<string[]>([])
  const [sessions, setSessions] = useState<TranscriptSession[]>([])
  const [currentSessionId, setCurrentSessionId] = useState<string>('')
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const [mounted, setMounted] = useState(false)
  const [showUploadMenu, setShowUploadMenu] = useState(false)
  
  const fileInputRef = useRef<HTMLInputElement>(null)
  const imageInputRef = useRef<HTMLInputElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const uploadMenuRef = useRef<HTMLDivElement>(null)

  // Handle client-side only mounting
  useEffect(() => {
    setMounted(true)
    
    // Check authentication (but don't require it)
    const authenticated = isAuthenticated()
    setIsAuth(authenticated)
    
    const savedTheme = localStorage.getItem('theme')
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    setIsDarkMode(savedTheme === 'dark' || (!savedTheme && prefersDark))
    
    const savedSidebar = localStorage.getItem('sidebarOpen')
    if (savedSidebar !== null) {
      setIsSidebarOpen(savedSidebar === 'true')
    }
  }, [])

  // Handle theme changes
  useEffect(() => {
    if (!mounted) return
    
    if (isDarkMode) {
      document.documentElement.classList.add('dark')
      localStorage.setItem('theme', 'dark')
    } else {
      document.documentElement.classList.remove('dark')
      localStorage.setItem('theme', 'light')
    }
  }, [isDarkMode, mounted])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Save sidebar state to localStorage
  useEffect(() => {
    if (mounted) {
      localStorage.setItem('sidebarOpen', String(isSidebarOpen))
    }
  }, [isSidebarOpen, mounted])

  // Close upload menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (uploadMenuRef.current && !uploadMenuRef.current.contains(event.target as Node)) {
        setShowUploadMenu(false)
      }
    }

    if (showUploadMenu) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showUploadMenu])

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode)
  }

  const handleLogout = () => {
    removeAccessToken()
    toast.success('Logged out successfully')
    router.push('/auth/login')
  }

  const addMessage = (role: 'user' | 'assistant', content: string) => {
    const newMessage: Message = {
      id: Date.now().toString() + Math.random(),
      role,
      content,
      timestamp: new Date(),
    }
    setMessages(prev => [...prev, newMessage])
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (!file.name.endsWith('.txt')) {
      toast.error('Please upload a .txt file')
      return
    }

    // Save current session before starting new one
    if (chatState !== 'idle') {
      saveCurrentSession()
    }

    // Reset for new session
    setMessages([])
    setCurrentQuestionIndex(0)
    setCorrectAnswers(0)
    setFileName(file.name)
    setIsLoading(true)
    
    const reader = new FileReader()
    reader.onload = async (e) => {
      const content = e.target?.result as string
      setTranscriptContent(content)
      
      addMessage('user', `📎 Uploaded: ${file.name}`)
      
      try {
        // Call the real backend API to start a session
        const response = await fetch(API_ENDPOINTS.startSession, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${getAccessToken()}`
          },
          body: JSON.stringify({
            title: file.name,
            transcript: content
          })
        })

        if (!response.ok) {
          if (response.status === 401) {
            handleAuthError(401)
            return
          }
          throw new Error('Failed to start session')
        }

        const data = await response.json()
        
        // Set the session ID from backend
        setCurrentSessionId(data.session_id.toString())
        
        addMessage('assistant', 
          `Great! I've analyzed your lecture transcript "${file.name}". I found several key concepts that we should discuss.\n\nLet me ask you some questions to check your understanding. This will help reinforce your learning! 📚\n\nReady? Here's the first question:`
        )
        
        await new Promise(resolve => setTimeout(resolve, 500))
        
        // Use the first question from the backend
        addMessage('assistant', data.first_question)
        
        setChatState('quizzing')
        setIsLoading(false)
        toast.success('Transcript processed! Answer the questions to proceed.')
        
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

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file')
      return
    }

    addMessage('user', `🖼️ Uploaded image: ${file.name}`)
    
    // For now, just show a message that image processing is coming soon
    // You can implement actual image processing with your backend later
    addMessage('assistant', 
      `I've received your image "${file.name}". Image analysis functionality will be available soon! For now, you can describe what you'd like to know about this image, and I'll help you with that.`
    )
    
    setShowUploadMenu(false)
    toast.success('Image uploaded!')
  }

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return

    const userMessage = inputMessage.trim()
    setInputMessage('')
    addMessage('user', userMessage)
    setIsLoading(true)

    if (chatState === 'idle') {
      // User is starting a new session without uploading a file
      // Create a new session with their message as the topic
      setFileName('Chat Session')
      setCurrentSessionId(`session_${Date.now()}`)
      setChatState('completed') // Skip quiz and go straight to conversation mode
      
      addMessage('assistant', 
        `Hi! I'm your AI learning assistant. 👋\n\nI see you want to discuss: "${userMessage}"\n\nI'm here to help! Feel free to ask me anything, and I'll do my best to assist you with your learning. You can also upload a lecture transcript anytime using the upload button if you'd like me to quiz you on specific material.`
      )
      
      setIsLoading(false)
      return
    }

    // For both quizzing and completed states, use the /api/chat endpoint
    if (chatState === 'quizzing' || chatState === 'completed') {
      try {
        const response = await fetch(API_ENDPOINTS.chat, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${getAccessToken()}`
          },
          body: JSON.stringify({
            session_id: parseInt(currentSessionId),
            message: userMessage
          })
        })

        if (!response.ok) {
          if (response.status === 401) {
            handleAuthError(401)
            return
          }
          throw new Error('Failed to send message')
        }

        const data = await response.json()
        
        // Display AI's response
        addMessage('assistant', data.response)
        
        setIsLoading(false)
        
      } catch (error) {
        console.error('Error sending message:', error)
        toast.error('Failed to send message. Please try again.')
        
        addMessage('assistant', 
          "Sorry, I encountered an error processing your message. Please make sure the backend server is running and try again."
        )
        
        setIsLoading(false)
      }
      return
    }

    setIsLoading(false)
  }

  const saveCurrentSession = () => {
    if (!mounted || chatState === 'idle' || !fileName || messages.length <= 1) return

    const score = chatState === 'completed' 
      ? Math.round((correctAnswers / totalQuestions) * 100) 
      : undefined

    const session: TranscriptSession = {
      id: currentSessionId || `session_${Date.now()}`,
      fileName,
      content: transcriptContent,
      keyPoints,
      messages: messages.map(m => ({ ...m, timestamp: new Date(m.timestamp) })),
      score,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const existingSessions = JSON.parse(localStorage.getItem('chatSessions') || '[]')
    const sessionIndex = existingSessions.findIndex((s: TranscriptSession) => s.id === session.id)
    
    if (sessionIndex >= 0) {
      existingSessions[sessionIndex] = session
    } else {
      existingSessions.unshift(session)
    }

    const trimmedSessions = existingSessions.slice(0, 20)
    localStorage.setItem('chatSessions', JSON.stringify(trimmedSessions))
    setSessions(trimmedSessions)
  }

  const loadSessions = () => {
    if (!mounted) return
    
    try {
      const savedSessions = localStorage.getItem('chatSessions')
      if (savedSessions) {
        const parsed = JSON.parse(savedSessions)
        const validSessions = parsed.map((s: any) => ({
          ...s,
          createdAt: s.createdAt ? new Date(s.createdAt) : new Date(),
          updatedAt: s.updatedAt ? new Date(s.updatedAt) : new Date(),
          messages: Array.isArray(s.messages) ? s.messages.map((m: any) => ({ 
            ...m, 
            timestamp: m.timestamp ? new Date(m.timestamp) : new Date() 
          })) : [],
        }))
        setSessions(validSessions)
      }
    } catch (error) {
      console.error('Error loading sessions:', error)
      setSessions([])
    }
  }

  const handleLoadSession = (session: TranscriptSession) => {
    try {
      setMessages(session.messages || [])
      setFileName(session.fileName || 'Untitled')
      setTranscriptContent(session.content || '')
      setKeyPoints(session.keyPoints || [])
      setCurrentSessionId(session.id)
      
      if (session.score !== undefined) {
        setChatState('completed')
      } else {
        setChatState('quizzing')
      }
      
      toast.success('Session loaded!')
    } catch (error) {
      console.error('Error loading session:', error)
      toast.error('Failed to load session')
    }
  }

  const handleDeleteSession = (e: React.MouseEvent, sessionId: string) => {
    e.stopPropagation()
    
    if (!mounted) return
    
    const savedSessions = JSON.parse(localStorage.getItem('chatSessions') || '[]')
    const filtered = savedSessions.filter((s: TranscriptSession) => s.id !== sessionId)
    localStorage.setItem('chatSessions', JSON.stringify(filtered))
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
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
      addMessage('assistant', 
        "Your previous session has been deleted. Feel free to start a new conversation or upload a file! 📚"
      )
    }
    
    toast.success('Session deleted')
  }

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
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
    addMessage('assistant', 
      "Welcome back! Upload a new lecture transcript to start a fresh learning session. 📚"
    )
  }

  const formatRelativeTime = (date: Date | string): string => {
    try {
      const dateObj = date instanceof Date ? date : new Date(date)
      if (isNaN(dateObj.getTime())) {
        return 'Unknown'
      }
      
      const now = new Date()
      const diffMs = now.getTime() - dateObj.getTime()
      const diffMins = Math.floor(diffMs / 60000)
      const diffHours = Math.floor(diffMs / 3600000)
      const diffDays = Math.floor(diffMs / 86400000)

      if (diffMins < 1) return 'Just now'
      if (diffMins < 60) return `${diffMins}m ago`
      if (diffHours < 24) return `${diffHours}h ago`
      if (diffDays < 7) return `${diffDays}d ago`
      
      return dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    } catch (error) {
      return 'Unknown'
    }
  }

  const categorizeSessionsByTime = () => {
    const now = new Date()
    const categories: { [key: string]: TranscriptSession[] } = {
      'Today': [],
      'Yesterday': [],
      '7 Days': [],
      '30 Days': [],
    }
    
    // Add month categories dynamically
    const months: { [key: string]: TranscriptSession[] } = {}
    
    sessions.forEach(session => {
      const sessionDate = session.updatedAt instanceof Date ? session.updatedAt : new Date(session.updatedAt)
      const diffMs = now.getTime() - sessionDate.getTime()
      const diffDays = Math.floor(diffMs / 86400000)
      
      if (diffDays === 0) {
        categories['Today'].push(session)
      } else if (diffDays === 1) {
        categories['Yesterday'].push(session)
      } else if (diffDays <= 7) {
        categories['7 Days'].push(session)
      } else if (diffDays <= 30) {
        categories['30 Days'].push(session)
      } else {
        const monthKey = sessionDate.toLocaleDateString('en-US', { year: 'numeric', month: '2-digit' })
        if (!months[monthKey]) {
          months[monthKey] = []
        }
        months[monthKey].push(session)
      }
    })
    
    // Remove empty categories
    Object.keys(categories).forEach(key => {
      if (categories[key].length === 0) {
        delete categories[key]
      }
    })
    
    return { ...categories, ...months }
  }

  // Load sessions on mount
  useEffect(() => {
    if (mounted) {
      loadSessions()
    }
  }, [mounted])

  // Auto-save session periodically
  useEffect(() => {
    if (mounted && chatState !== 'idle' && fileName) {
      const timer = setTimeout(() => {
        saveCurrentSession()
      }, 5000)
      
      return () => clearTimeout(timer)
    }
  }, [messages, chatState, fileName, mounted])

  // Initial greeting
  useEffect(() => {
    if (mounted && messages.length === 0) {
      addMessage('assistant', 
        "Hi! I'm your AI learning assistant. 👋\n\nTo get started, please upload a lecture transcript or study material using the upload button above. I'll help you understand the content by:\n\n1. Asking you questions to test your comprehension\n2. Grading your understanding\n3. Providing key summaries and clarifications\n4. Answering any questions you have about the material\n\nReady to learn? Upload your file to begin!"
      )
    }
  }, [mounted])

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputMessage(e.target.value)
    
    // Auto-resize textarea
    const textarea = e.target
    textarea.style.height = 'auto'
    textarea.style.height = `${textarea.scrollHeight}px`
  }

  // Auto-resize on mount and when inputMessage changes
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`
    }
  }, [inputMessage])

  // Don't render until mounted to prevent hydration issues
  if (!mounted) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 transition-colors">
      {/* Session History Sidebar - Fixed Left Side, Full Height */}
      <div
        className={`fixed left-0 top-0 h-screen z-40 transition-all duration-300 ease-in-out bg-gray-950 border-r border-gray-800 flex flex-col ${
          isSidebarOpen ? 'w-[280px]' : 'w-16'
        }`}
      >
        {/* Sidebar Header with Toggle */}
        <div className="p-3 border-b border-gray-800 flex items-center justify-between shrink-0">
          {isSidebarOpen && (
            <span className="text-white font-medium text-sm">EduAssist</span>
          )}
          <Button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 hover:bg-gray-800 text-gray-400"
            aria-label={isSidebarOpen ? "Close sidebar" : "Open sidebar"}
          >
            {isSidebarOpen ? <PanelLeftClose className="h-4 w-4" /> : <PanelLeftOpen className="h-4 w-4" />}
          </Button>
        </div>

        {/* New Chat Button */}
        <div className="p-3 border-b border-gray-800 shrink-0">
          <Button
            onClick={handleReset}
            className={`w-full justify-start gap-2 bg-gray-800 hover:bg-gray-700 text-white border-gray-700 ${
              !isSidebarOpen ? 'px-2' : ''
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
                  <div className="text-center text-gray-500 py-8">
                    <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-xs">No chat history</p>
                  </div>
                ) : (
                  Object.entries(categorizeSessionsByTime()).map(([category, categorySessions]) => (
                    <div key={category} className="space-y-2">
                      <h4 className="text-xs font-medium text-gray-500 px-2">{category}</h4>
                      {categorySessions.map((session) => {
                        const isActive = session.id === currentSessionId
                        
                        return (
                          <div
                            key={session.id}
                            className={`group relative p-2.5 rounded-lg cursor-pointer transition-all ${
                              isActive 
                                ? 'bg-gray-800' 
                                : 'hover:bg-gray-800/50'
                            }`}
                          onClick={() => handleLoadSession(session)}
                        >
                          <div className="flex items-start gap-2">
                            <MessageSquare className="h-4 w-4 shrink-0 text-gray-400 mt-0.5" />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm text-gray-200 truncate">
                                {session.fileName}
                              </p>
                            </div>
                            <Button
                              onClick={(e: React.MouseEvent) => handleDeleteSession(e, session.id)}
                              variant="ghost"
                              size="sm"
                              className="opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 p-0 hover:bg-gray-700 absolute right-2 top-2"
                            >
                              <Trash2 className="h-3 w-3 text-gray-400" />
                            </Button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ))
              )}
            </div>
          ) : (
            // Minimized view - just icons
            <div className="p-2 space-y-2">
              {sessions.slice(0, 5).map((session) => {
                const isActive = session.id === currentSessionId
                return (
                  <div
                    key={session.id}
                    className={`p-2 rounded-lg cursor-pointer transition-all ${
                      isActive ? 'bg-gray-800' : 'hover:bg-gray-800/50'
                    }`}
                    onClick={() => handleLoadSession(session)}
                    title={session.fileName}
                  >
                    <MessageSquare className="h-4 w-4 text-gray-400 mx-auto" />
                  </div>
                )
              })}
            </div>
          )}
          </ScrollArea>
        </div>
      </div>

      {/* Main Content Area - Adjusted for sidebar */}
      <div className={`transition-all duration-300 ${isSidebarOpen ? 'ml-[280px]' : 'ml-16'}`}>
        {/* Navigation */}
        <nav className="bg-white dark:bg-gray-950 shadow-sm border-b dark:border-gray-800 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-8">
              <Link href="/" className="flex items-center hover:opacity-80 transition-opacity">
                <BookOpen className="h-8 w-8 text-indigo-600 dark:text-indigo-400" />
                <span className="ml-2 dark:text-white">EduAssist</span>
              </Link>
              
              {/* Navigation Links */}
              <div className="hidden md:flex items-center gap-6">
                <Link 
                  href="/" 
                  className={`hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors flex items-center gap-2 ${
                    pathname === "/" 
                      ? "text-indigo-600 dark:text-indigo-400" 
                      : "text-gray-700 dark:text-gray-300"
                  }`}
                >
                  <BookOpen className="h-4 w-4" />
                  AI Tutor
                </Link>
                <Link 
                  href="/calendar" 
                  className={`hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors flex items-center gap-2 ${
                    pathname === "/calendar" 
                      ? "text-indigo-600 dark:text-indigo-400" 
                      : "text-gray-700 dark:text-gray-300"
                  }`}
                >
                  <Calendar className="h-4 w-4" />
                  Calendar
                </Link>
                <Link 
                  href="/todo" 
                  className={`hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors flex items-center gap-2 ${
                    pathname === "/todo" 
                      ? "text-indigo-600 dark:text-indigo-400" 
                      : "text-gray-700 dark:text-gray-300"
                  }`}
                >
                  <CheckSquare className="h-4 w-4" />
                  Todo
                </Link>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
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
                  <span className="hidden sm:inline">Logout</span>
                </Button>
              ) : (
                <div className="flex items-center gap-2">
                  <Link href="/auth/login">
                    <Button variant="ghost" size="sm">
                      Login
                    </Button>
                  </Link>
                  <Link href="/auth/register">
                    <Button size="sm">
                      Sign Up
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Page Content */}
      <main className="px-4 sm:px-6 lg:px-8 py-8 min-h-[calc(100vh-4rem)]">
        <div className="mb-4 text-center">
          <h1 className="mb-2 text-indigo-600 dark:text-indigo-400">AI Learning Assistant</h1>
          <p className="text-gray-600 dark:text-gray-400">Upload transcripts, get quizzed, and ask questions</p>
        </div>

        <div className="max-w-[1200px] mx-auto">
            {/* Main Chat Area */}
            <Card className="min-h-[600px] flex flex-col dark:bg-gray-900 dark:border-gray-800 transition-all duration-300">
            {/* Header with file info */}
            <div className="p-4 border-b dark:border-gray-800 flex items-center justify-between bg-gray-50 dark:bg-gray-950">
              <div className="flex items-center gap-2">
                {fileName ? (
                  <>
                    <FileText className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                    <span className="text-gray-700 dark:text-gray-300">{fileName}</span>
                    {chatState === 'completed' && (
                      <Badge variant="outline" className="ml-2">
                        <Sparkles className="h-3 w-3 mr-1" />
                        Quiz Complete
                      </Badge>
                    )}
                  </>
                ) : (
                  <span className="text-gray-500 dark:text-gray-400">No file uploaded</span>
                )}
              </div>
              
              <div className="flex gap-2">
                {chatState !== 'idle' && (
                  <Button onClick={handleReset} variant="outline" size="sm">
                    New Session
                  </Button>
                )}
              </div>
            </div>
            
            {/* Hidden file inputs */}
            <input
              ref={fileInputRef}
              type="file"
              accept=".txt"
              onChange={handleFileUpload}
              className="hidden"
              id="file-upload"
            />
            <input
              ref={imageInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
              id="image-upload"
            />

            {/* Chat Messages */}
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4 max-w-3xl mx-auto">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    {message.role === 'assistant' && (
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-indigo-600 dark:bg-indigo-500 flex items-center justify-center">
                        <Bot className="h-5 w-5 text-white" />
                      </div>
                    )}
                    
                    <div
                      className={`px-4 py-3 max-w-[80%] ${
                        message.role === 'user'
                          ? 'bg-indigo-600 dark:bg-indigo-700 text-white rounded-2xl'
                          : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-2xl'
                      }`}
                    >
                      <p className="whitespace-pre-wrap break-words">{message.content}</p>
                      <span className={`text-xs mt-2 block ${
                        message.role === 'user' ? 'text-indigo-200' : 'text-gray-500 dark:text-gray-400'
                      }`}>
                        {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    {message.role === 'user' && (
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-600 dark:bg-gray-700 flex items-center justify-center">
                        <User className="h-5 w-5 text-white" />
                      </div>
                    )}
                  </div>
                ))}
                
                {isLoading && (
                  <div className="flex gap-3 justify-start">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-indigo-600 dark:bg-indigo-500 flex items-center justify-center">
                      <Bot className="h-5 w-5 text-white" />
                    </div>
                    <div className="rounded-2xl px-4 py-3 bg-gray-100 dark:bg-gray-800">
                      <Loader2 className="h-5 w-5 text-indigo-600 dark:text-indigo-400 animate-spin" />
                    </div>
                  </div>
                )}
                
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            {/* Input Area */}
            <div className="p-4">
              <div className="flex gap-2 max-w-3xl mx-auto">
                {/* Upload button with menu */}
                <div className="relative" ref={uploadMenuRef}>
                  <Button 
                    type="button"
                    variant="outline" 
                    size="icon"
                    onClick={() => setShowUploadMenu(!showUploadMenu)}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                  
                  {/* Upload menu */}
                  {showUploadMenu && (
                    <div className="absolute bottom-full left-0 mb-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg overflow-hidden z-50 min-w-[180px]">
                      <button
                        onClick={() => {
                          fileInputRef.current?.click()
                          setShowUploadMenu(false)
                        }}
                        className="w-full px-4 py-2.5 flex items-center gap-3 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-left"
                      >
                        <Paperclip className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                        <span className="text-sm text-gray-700 dark:text-gray-300">Upload file</span>
                      </button>
                      <button
                        onClick={() => {
                          imageInputRef.current?.click()
                          setShowUploadMenu(false)
                        }}
                        className="w-full px-4 py-2.5 flex items-center gap-3 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-left"
                      >
                        <Image className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                        <span className="text-sm text-gray-700 dark:text-gray-300">Upload image</span>
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
                    chatState === 'quizzing' 
                      ? "Type your answer or ask a question..." 
                      : chatState === 'completed'
                      ? "Ask me anything about the material..."
                      : "Type a message..."
                  }
                  rows={1}
                  className="resize-none min-h-11 max-h-32 overflow-y-auto bg-white dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-600"
                />
                <Button 
                  onClick={handleSendMessage} 
                  disabled={!inputMessage.trim() || isLoading}
                  className="shrink-0"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 text-center mt-2">
                Press Enter to send, Shift+Enter for new line
              </p>
            </div>
          </Card>
        </div>
      </main>
      </div>
    </div>
  )
}