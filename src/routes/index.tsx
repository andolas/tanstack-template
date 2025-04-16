import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useState, useRef, useCallback, useMemo } from 'react'
import { Settings } from 'lucide-react'
import {
  SettingsDialog,
  ChatMessage,
  LoadingIndicator,
  ChatInput,
  Sidebar,
  WelcomeScreen
} from '../components'
import { useConversations, useAppState, store, actions } from '../store'
import { genAIResponse, type Message } from '../utils'

function Home() {
  const {
    conversations,
    currentConversationId,
    currentConversation,
    setCurrentConversationId,
    createNewConversation,
    updateConversationTitle,
    deleteConversation,
    addMessage
  } = useConversations()

  const { isLoading, setLoading, getActivePrompt } = useAppState()
  const messages = useMemo(() => currentConversation?.messages || [], [currentConversation])
  const isAnthropicKeyDefined = Boolean(import.meta.env.VITE_ANTHROPIC_API_KEY)

  const [input, setInput] = useState('')
  const [editingChatId, setEditingChatId] = useState<string | null>(null)
  const [editingTitle, setEditingTitle] = useState('')
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const messagesContainerRef = useRef<HTMLDivElement>(null)
  const [pendingMessage, setPendingMessage] = useState<Message | null>(null)
  const [error, setError] = useState<string | null>(null)

  const scrollToBottom = useCallback(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight
    }
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages, isLoading, scrollToBottom])

  const createTitleFromInput = useCallback((text: string) => {
    const words = text.trim().split(/\s+/)
    const firstThreeWords = words.slice(0, 3).join(' ')
    return firstThreeWords + (words.length > 3 ? '...' : '')
  }, [])

  const processAIResponse = useCallback(
    async (conversationId: string, userMessage: Message) => {
      try {
        const activePrompt = getActivePrompt(store.state)
        let systemPrompt
        if (activePrompt) {
          systemPrompt = {
            value: activePrompt.content,
            enabled: true
          }
        }

        const response = await genAIResponse({
          data: {
            messages: [...messages, userMessage],
            systemPrompt
          }
        })

        const reader = response.body?.getReader()
        if (!reader) throw new Error('No reader found in response')

        const decoder = new TextDecoder()
        let done = false
        let newMessage = {
          id: (Date.now() + 1).toString(),
          role: 'assistant' as const,
          content: ''
        }

        while (!done) {
          const out = await reader.read()
          done = out.done
          if (!done) {
            try {
              const json = JSON.parse(decoder.decode(out.value))
              if (json.type === 'content_block_delta') {
                newMessage = {
                  ...newMessage,
                  content: newMessage.content + json.delta.text
                }
                setPendingMessage(newMessage)
              }
            } catch (e) {
              console.error('Error parsing streaming response:', e)
            }
          }
        }

        setPendingMessage(null)
        if (newMessage.content.trim()) {
          await addMessage(conversationId, newMessage)
        }
      } catch (error) {
        console.error('Error in AI response:', error)
        const errorMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: 'Sorry, there was an error generating a response.'
        }
        await addMessage(conversationId, errorMessage)
      }
    },
    [messages, getActivePrompt, addMessage]
  )

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      if (!input.trim() || isLoading) return

      const currentInput = input
      setInput('')
      setLoading(true)
      setError(null)

      const conversationTitle = createTitleFromInput(currentInput)

      try {
        const userMessage: Message = {
          id: Date.now().toString(),
          role: 'user',
          content: currentInput.trim()
        }

        let conversationId = currentConversationId

        if (!conversationId) {
          try {
            const convexId = await createNewConversation(conversationTitle)
            if (convexId) {
              conversationId = convexId
              await addMessage(conversationId, userMessage)
            } else {
              const tempId = Date.now().toString()
              const tempConversation = {
                id: tempId,
                title: conversationTitle,
                messages: []
              }
              actions.addConversation(tempConversation)
              conversationId = tempId
              actions.addMessage(conversationId, userMessage)
            }
          } catch (error) {
            console.error('Error creating conversation:', error)
            throw new Error('Failed to create conversation')
          }
        } else {
          await addMessage(conversationId, userMessage)
        }

        await processAIResponse(conversationId, userMessage)
      } catch (error) {
        console.error('Error:', error)
        const errorMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: 'Sorry, an error occurred.'
        }
        if (currentConversationId) {
          await addMessage(currentConversationId, errorMessage)
        } else {
          setError(error instanceof Error ? error.message : 'Unknown error occurred')
        }
      } finally {
        setLoading(false)
      }
    },
    [
      input,
      isLoading,
      createTitleFromInput,
      currentConversationId,
      createNewConversation,
      addMessage,
      processAIResponse,
      setLoading
    ]
  )

  return (
  <div className="flex justify-center items-center h-screen bg-gray-900">
    <div className="bg-white p-6 rounded shadow max-w-md w-full">
      <h1 className="text-2xl font-bold mb-4 text-gray-800 text-center">Analisi SWOT gratuita</h1>
      <form
        onSubmit={async (e) => {
          e.preventDefault()
          const form = e.currentTarget
          const email = form.email.value
          const idea = form.idea.value

          try {
            const res = await fetch("https://script.google.com/macros/s/AKfycbwfYVjX40hJBeEQOBH_gOe4471P6eDmPfCChq0b5WjENEC_YB8ec2ldc69Ahl-nwvye/exec", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ email, idea })
            })

            if (res.ok) {
              alert("✅ Analisi inviata! Controlla la tua email.")
              form.reset()
            } else {
              alert("❌ Errore nell'invio.")
            }
          } catch {
            alert("⚠️ Errore di rete.")
          }
        }}
      >
        <input name="email" type="email" placeholder="La tua email" required className="mb-3 p-2 border w-full rounded" />
        <textarea name="idea" placeholder="Descrivi la tua idea di business" required rows={5} className="mb-3 p-2 border w-full rounded" />
        <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded w-full hover:bg-blue-700">
          Ricevi la tua analisi SWOT
        </button>
      </form>
    </div>
  </div>
)
}

export const Route = createFileRoute('/')({
  component: Home
})
