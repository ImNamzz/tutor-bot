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
import { Upload, Send, Loader2, Bot, User, FileText, Sparkles, Clock, MessageSquare, Trash2, PanelLeftClose, PanelLeftOpen, BookOpen, Moon, Sun, Calendar, CheckSquare, LogOut, UserCircle } from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { isAuthenticated, removeAccessToken } from '@/app/lib/auth'

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
  
  const fileInputRef = useRef<HTMLInputElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

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
    setCurrentSessionId(`session_${Date.now()}`)
    setIsLoading(true)
    
    const reader = new FileReader()
    reader.onload = async (e) => {
      const content = e.target?.result as string
      setTranscriptContent(content)
      
      addMessage('user', `📎 Uploaded: ${file.name}`)
      
      // Simulate processing
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      // Generate mock key points and questions
      const mockKeyPoints = generateMockKeyPoints(content)
      setKeyPoints(mockKeyPoints)
      
      const numQuestions = Math.min(Math.max(Math.floor(content.split(/\s+/).length / 150), 3), 5)
      setTotalQuestions(numQuestions)
      
      addMessage('assistant', 
        `Great! I've analyzed your lecture transcript "${file.name}". I found several key concepts that we should discuss.\n\nBefore I show you the main points, let me ask you a few questions to check your understanding. This will help reinforce your learning! 📚\n\nReady? Here's question 1 of ${numQuestions}:`
      )
      
      await new Promise(resolve => setTimeout(resolve, 500))
      
      // Ask first question
      const firstQuestion = generateQuestion(content, 0)
      addMessage('assistant', firstQuestion)
      
      setChatState('quizzing')
      setIsLoading(false)
      toast.success('Transcript processed! Answer the questions to proceed.')
    }
    
    reader.readAsText(file)
  }

  const generateMockKeyPoints = (content: string): string[] => {
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 30)
    const numPoints = Math.min(Math.max(Math.floor(sentences.length / 10), 3), 6)
    return sentences.slice(0, numPoints).map(s => s.trim()).filter(s => s.length > 0)
  }

  const generateQuestion = (content: string, index: number): string => {
    const questions = [
      "What do you think is the main topic or theme discussed in this material? Please explain in your own words.",
      "Can you identify 2-3 key concepts or ideas that were emphasized in the lecture?",
      "How would you apply what you learned from this material to a real-world situation?",
      "What connections can you make between this material and other topics you've studied?",
      "If you had to explain the most important takeaway to a friend, what would you say?",
    ]
    return questions[index] || questions[0]
  }

  const evaluateAnswer = (answer: string): boolean => {
    // Mock evaluation - in real app would use AI
    const wordCount = answer.trim().split(/\s+/).length
    const hasKeywords = answer.toLowerCase().includes('key') || 
                       answer.toLowerCase().includes('main') ||
                       answer.toLowerCase().includes('important') ||
                       answer.toLowerCase().includes('concept')
    
    return wordCount >= 15 || hasKeywords
  }

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return

    const userMessage = inputMessage.trim()
    setInputMessage('')
    addMessage('user', userMessage)
    setIsLoading(true)

    await new Promise(resolve => setTimeout(resolve, 1000))

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

    if (chatState === 'quizzing') {
      // Check if this is a question or an answer
      if (userMessage.toLowerCase().includes('?') || 
          userMessage.toLowerCase().startsWith('what') ||
          userMessage.toLowerCase().startsWith('how') ||
          userMessage.toLowerCase().startsWith('why') ||
          userMessage.toLowerCase().startsWith('can you')) {
        // User is asking a question during quiz
        addMessage('assistant', 
          `That's a great question! Based on the material, ${generateContextualAnswer(userMessage, transcriptContent)}\n\nNow, let's continue with the quiz question. Please provide your answer to the previous question.`
        )
        setIsLoading(false)
        return
      }

      // It's an answer to the quiz question
      const isCorrect = evaluateAnswer(userMessage)
      if (isCorrect) {
        setCorrectAnswers(prev => prev + 1)
      }

      const feedback = isCorrect 
        ? "✅ Great answer! You've demonstrated good understanding of the material."
        : "🤔 That's a good attempt, but let me provide some additional context to help clarify..."

      addMessage('assistant', feedback)

      await new Promise(resolve => setTimeout(resolve, 800))

      const nextIndex = currentQuestionIndex + 1
      
      if (nextIndex < totalQuestions) {
        setCurrentQuestionIndex(nextIndex)
        addMessage('assistant', 
          `Question ${nextIndex + 1} of ${totalQuestions}:\n\n${generateQuestion(transcriptContent, nextIndex)}`
        )
      } else {
        // Quiz complete
        const score = Math.round(((correctAnswers + (isCorrect ? 1 : 0)) / totalQuestions) * 100)
        setChatState('completed')
        
        addMessage('assistant', 
          `🎉 Quiz complete! You scored ${score}%\n\n${score >= 70 ? 'Excellent work!' : score >= 50 ? 'Good effort!' : 'Keep studying!'}\n\nHere are the key points from the material:`
        )

        await new Promise(resolve => setTimeout(resolve, 500))

        const keyPointsText = keyPoints.map((point, index) => `${index + 1}. ${point}`).join('\n\n')
        addMessage('assistant', keyPointsText)

        await new Promise(resolve => setTimeout(resolve, 500))

        addMessage('assistant', 
          "Feel free to ask me any questions about the material! I'm here to help clarify concepts or provide more information. 💡"
        )
      }
      setIsLoading(false)
      return
    }

    if (chatState === 'completed') {
      // Post-quiz conversation
      const response = generateContextualAnswer(userMessage, transcriptContent)
      addMessage('assistant', response)
      setIsLoading(false)
      return
    }

    setIsLoading(false)
  }

  const generateContextualAnswer = (question: string, context: string): string => {
    // Mock AI response
    const responses = [
      "Based on the lecture material, this concept relates to the fundamental principles discussed. The key idea is that these elements work together to form a comprehensive understanding.",
      "That's an excellent question! In the context of what we studied, this refers to how the various components interact. Let me break it down further...",
      "From the material we covered, we can see that this topic is important because it connects to several other key concepts. The relationship between these ideas is crucial for your understanding.",
      "Good observation! The lecture emphasized this point because it forms the foundation for more advanced topics. Think of it as a building block for the larger concept.",
      "Let me clarify that based on the transcript. This concept is explained through examples and demonstrations that show its practical application.",
    ]
    return responses[Math.floor(Math.random() * responses.length)]
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

  // Don't render until mounted to prevent hydration issues
  if (!mounted) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 transition-colors">
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
                  href="/transcript" 
                  className={`hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors flex items-center gap-2 ${
                    pathname === "/transcript" 
                      ? "text-indigo-600 dark:text-indigo-400" 
                      : "text-gray-700 dark:text-gray-300"
                  }`}
                >
                  <FileText className="h-4 w-4" />
                  Transcript
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
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 min-h-[calc(100vh-4rem)]">
        <div className="mb-4 text-center">
          <h1 className="mb-2 text-indigo-600 dark:text-indigo-400">AI Learning Assistant</h1>
          <p className="text-gray-600 dark:text-gray-400">Upload transcripts, get quizzed, and ask questions</p>
        </div>

        <div className="relative flex gap-6 min-h-[calc(100vh-16rem)] max-w-[1600px] mx-auto">
            {/* Floating Toggle Button (shown when sidebar is closed) */}
            {!isSidebarOpen && (
              <Button
                onClick={() => setIsSidebarOpen(true)}
                variant="outline"
                size="sm"
                className="absolute top-4 left-4 z-10 shadow-md dark:bg-gray-900"
                aria-label="Open sidebar"
              >
                <PanelLeftOpen className="h-4 w-4" />
              </Button>
            )}

            {/* Session History Sidebar */}
            <div
              className={`transition-all duration-300 ease-in-out flex-shrink-0 ${
                isSidebarOpen ? 'w-[380px] opacity-100' : 'w-0 opacity-0 overflow-hidden'
              }`}
            >
              <Card className="p-6 h-full flex flex-col overflow-hidden dark:bg-gray-900 dark:border-gray-800">
                <div className="mb-3 flex items-center justify-between">
                  <div className="flex-1">
                    <h3 className="dark:text-white">User Sessions</h3>
                  </div>
                  <Button
                    onClick={() => setIsSidebarOpen(false)}
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 flex-shrink-0"
                    aria-label="Close sidebar"
                  >
                    <PanelLeftClose className="h-4 w-4" />
                  </Button>
                </div>
              
              {sessions.length === 0 ? (
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center text-gray-500 dark:text-gray-400">
                    <MessageSquare className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No previous sessions</p>
                    <p className="text-xs mt-1">Your chat history will appear here</p>
                  </div>
                </div>
              ) : (
                <ScrollArea className="flex-1 -mx-6 px-6 py-2">
                  <div className="space-y-2 pr-2">
                    {sessions.map((session) => {
                      const isActive = session.id === currentSessionId
                      const messageCount = session.messages.filter(m => m.role === 'user').length
                      
                      return (
                        <div
                          key={session.id}
                          className={`p-3 border border-solid rounded-lg transition-all cursor-pointer group ${
                            isActive 
                              ? 'bg-indigo-50 dark:bg-indigo-950 border-indigo-300 dark:border-indigo-700 shadow-sm' 
                              : 'border-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-700 dark:border-gray-700'
                          }`}
                          onClick={() => handleLoadSession(session)}
                        >
                          <div className="flex items-start gap-3">
                            <FileText className={`h-4 w-4 mt-0.5 flex-shrink-0 ${
                              isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-600 dark:text-gray-400'
                            }`} />
                            <div className="flex-1 min-w-0">
                              <p className={`text-sm truncate ${
                                isActive ? 'text-indigo-900 dark:text-indigo-300' : 'text-gray-900 dark:text-gray-200'
                              }`}>
                                {session.fileName}
                              </p>
                              <div className="flex items-center gap-2 mt-1 flex-wrap">
                                <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
                                  <Clock className="h-3 w-3 mr-1" />
                                  {formatRelativeTime(session.updatedAt)}
                                </div>
                                {messageCount > 0 && (
                                  <Badge variant="secondary" className="text-xs h-5">
                                    {messageCount} {messageCount === 1 ? 'msg' : 'msgs'}
                                  </Badge>
                                )}
                                {session.score !== undefined && (
                                  <Badge 
                                    variant={session.score >= 70 ? 'default' : 'outline'} 
                                    className="text-xs h-5"
                                  >
                                    {session.score}%
                                  </Badge>
                                )}
                              </div>
                            </div>
                            <Button
                              onClick={(e: React.MouseEvent) => handleDeleteSession(e, session.id)}
                              variant="ghost"
                              size="sm"
                              className="opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 p-0"
                            >
                              <Trash2 className="h-3 w-3 text-red-600 dark:text-red-400" />
                            </Button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </ScrollArea>
              )}
            </Card>
            </div>

            {/* Main Chat Area */}
            <Card className="min-h-[600px] flex flex-col dark:bg-gray-900 dark:border-gray-800 flex-1 transition-all duration-300">
            {/* Header with file info and upload button */}
            <div className={`p-4 border-b dark:border-gray-800 flex items-center justify-between bg-gray-50 dark:bg-gray-950 transition-all duration-300 ${
              !isSidebarOpen ? 'pl-16' : ''
            }`}>
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
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".txt"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="file-upload"
                />
                <label htmlFor="file-upload">
                  <Button asChild size="sm">
                    <span className="cursor-pointer">
                      <Upload className="h-4 w-4 mr-2" />
                      Upload File
                    </span>
                  </Button>
                </label>
              </div>
            </div>

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
            <div className="p-4 border-t dark:border-gray-800 bg-white dark:bg-gray-950">
              <div className="flex gap-2 max-w-3xl mx-auto">
                <Textarea
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyDown={handleKeyPress}
                  placeholder={
                    chatState === 'quizzing' 
                      ? "Type your answer or ask a question..." 
                      : chatState === 'completed'
                      ? "Ask me anything about the material..."
                      : "Type a message..."
                  }
                  rows={1}
                  className="resize-none min-h-[44px] max-h-32"
                />
                <Button 
                  onClick={handleSendMessage} 
                  disabled={!inputMessage.trim() || isLoading}
                  className="flex-shrink-0"
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
  )
}