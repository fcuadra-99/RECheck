import { useEffect, useRef, useState } from "react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { supabase } from "@/DB"
import { Send, MessageCircle, X, ArrowLeft, ChevronUp, ChevronDown } from "lucide-react"
import { motion } from "framer-motion"
import type { RealtimeChannel } from "@supabase/supabase-js"

interface Message {
  id: string
  sender_id: string
  recipient_id: string | null
  content: string
  created_at: string
}

interface UserProfile {
  id: string
  fname: string | null
  lname: string | null
  email: string | null
  avatar?: string | null
}

interface ChatPopupProps {
  userId: string
}

const getAvatarUrl = (id: string) => {
  const { data } = supabase.storage.from("profiles").getPublicUrl(`${id}/avatar.png`)
  return data.publicUrl
}

const formatTime = (dateString: string) => {
  return new Date(dateString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)
  
  if (date.toDateString() === today.toDateString()) return "Today"
  if (date.toDateString() === yesterday.toDateString()) return "Yesterday"
  return date.toLocaleDateString([], { year: 'numeric', month: 'long', day: 'numeric' })
}

const groupMessagesByDay = (messages: Message[]) => {
  const groups: { date: string; messages: Message[] }[] = []
  
  messages.forEach(message => {
    const messageDate = formatDate(message.created_at)
    const lastGroup = groups[groups.length - 1]
    
    if (lastGroup && lastGroup.date === messageDate) {
      lastGroup.messages.push(message)
    } else {
      groups.push({ date: messageDate, messages: [message] })
    }
  })
  
  return groups
}

export function ChatPopup({ userId }: ChatPopupProps) {
  const [open, setOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [users, setUsers] = useState<UserProfile[]>([])
  const [recipient, setRecipient] = useState<UserProfile | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMsg, setNewMsg] = useState("")
  const [loading, setLoading] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(false)
  const [page, setPage] = useState(0)
  const [search, setSearch] = useState("")
  const [unreadCount, setUnreadCount] = useState(0)
  const [showScrollToBottom, setShowScrollToBottom] = useState(false)

  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const channelRef = useRef<RealtimeChannel | null>(null)
  const lastScrollTopRef = useRef<number>(0)

  const messageGroups = groupMessagesByDay(messages)

  // Responsive check
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768)
    check()
    window.addEventListener("resize", check)
    return () => window.removeEventListener("resize", check)
  }, [])

  // Fetch users with chat history
  const fetchUsersWithChats = async () => {
    const { data: msgData } = await supabase.from("messages").select("sender_id, recipient_id")
    const ids = new Set<string>()
    
    msgData?.forEach((m: any) => {
      if (m.sender_id === userId && m.recipient_id) ids.add(m.recipient_id)
      if (m.recipient_id === userId && m.sender_id) ids.add(m.sender_id)
    })
    
    if (ids.size === 0) {
      setUsers([])
      return
    }
    
    const { data } = await supabase.from("profiles").select("id, fname, lname, email").in("id", Array.from(ids))
    setUsers((data || []).map((u: any) => ({ ...u, avatar: getAvatarUrl(u.id) })))
  }

  // Fetch messages with pagination
  const fetchMessagesForRecipient = async (r: UserProfile | null, pageNum: number = 0, loadMore: boolean = false) => {
    if (!r) {
      setMessages([])
      setLoading(false)
      setHasMore(false)
      return
    }

    if (!loadMore) {
      setLoading(true)
    } else {
      setLoadingMore(true)
    }

    const PAGE_SIZE = 50
    const from = pageNum * PAGE_SIZE
    const to = from + PAGE_SIZE - 1

    const { data, error, count } = await supabase
      .from("messages")
      .select("*", { count: 'exact' })
      .or(`and(sender_id.eq.${userId},recipient_id.eq.${r.id}),and(sender_id.eq.${r.id},recipient_id.eq.${userId})`)
      .order("created_at", { ascending: false })
      .range(from, to)

    if (error) {
      console.error("Error fetching messages:", error)
      setLoading(false)
      setLoadingMore(false)
      return
    }

    const messagesData = (data as Message[]) || []
    
    if (!loadMore) {
      setMessages(messagesData.reverse())
    } else {
      setMessages(prev => [...messagesData.reverse(), ...prev])
    }

    const totalCount = count || 0
    setHasMore(totalCount > (pageNum + 1) * PAGE_SIZE)
    setLoading(false)
    setLoadingMore(false)

    if (!loadMore) {
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 40)
    }
  }

  // Load more messages on scroll
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const element = e.currentTarget
    const scrollTop = element.scrollTop
    const scrollHeight = element.scrollHeight
    const clientHeight = element.clientHeight
    
    // Track scroll direction
    const isScrollingUp = scrollTop < lastScrollTopRef.current
    lastScrollTopRef.current = scrollTop
    
    // Load more when near top and scrolling up
    if (scrollTop <= 100 && isScrollingUp && !loadingMore && hasMore && !loading && recipient) {
      const nextPage = page + 1
      setPage(nextPage)
      fetchMessagesForRecipient(recipient, nextPage, true)
    }

    // Show scroll to bottom button when scrolled up more than 300px from bottom
    const distanceFromBottom = scrollHeight - scrollTop - clientHeight
    setShowScrollToBottom(distanceFromBottom > 300)
  }

  // Load more messages manually
  const loadMoreMessages = () => {
    if (!loadingMore && hasMore && recipient) {
      const nextPage = page + 1
      setPage(nextPage)
      fetchMessagesForRecipient(recipient, nextPage, true)
    }
  }

  // Scroll to bottom
  const scrollToBottom = () => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  // Real-time subscription
  useEffect(() => {
    if (!userId || !open) return

    channelRef.current = supabase
      .channel("chat-room")
      .on<Message>(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages" },
        async (payload) => {
          const msg = payload.new as Message

          // Add to current conversation
          if (recipient && ((msg.sender_id === userId && msg.recipient_id === recipient.id) ||
              (msg.sender_id === recipient.id && msg.recipient_id === userId))) {
            setMessages(prev => (prev.some(m => m.id === msg.id) ? prev : [...prev, msg]))
            setTimeout(() => {
              bottomRef.current?.scrollIntoView({ behavior: "smooth" })
              setShowScrollToBottom(false)
            }, 60)
          } 
          // Increment unread count for incoming messages
          else if (msg.recipient_id === userId) {
            setUnreadCount(c => c + 1)
          }

          // Add new user to users list if needed
          const otherId = msg.sender_id === userId ? msg.recipient_id : msg.sender_id
          if (otherId && !users.find(u => u.id === otherId)) {
            const { data } = await supabase.from("profiles").select("id, fname, lname, email").eq("id", otherId).single()
            if (data) {
              setUsers(prev => {
                if (prev.some(p => p.id === data.id)) return prev
                return [{ ...data, avatar: getAvatarUrl(data.id) }, ...prev]
              })
            }
          }
        }
      )
      .subscribe()

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
      }
    }
  }, [userId, recipient, users, open])

  // Open popup effects
  useEffect(() => {
    if (open) {
      fetchUsersWithChats()
      if (recipient) fetchMessagesForRecipient(recipient)
    }
  }, [open])

  // Recipient change effects
  useEffect(() => {
    if (recipient) {
      setPage(0)
      fetchMessagesForRecipient(recipient, 0, false)
      setTimeout(() => textareaRef.current?.focus(), 120)
    } else {
      setMessages([])
      setHasMore(false)
    }
  }, [recipient])

  // Auto-scroll for new messages
  useEffect(() => {
    if (page === 0) {
      setTimeout(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" })
        setShowScrollToBottom(false)
      }, 100)
    }
  }, [messages, page])

  // Send message
  const sendMessage = async () => {
    if (!newMsg.trim() || !recipient) return
    const content = newMsg.trim()

    const optimistic: Message = {
      id: `temp-${Math.random().toString(36).slice(2, 9)}`,
      sender_id: userId,
      recipient_id: recipient.id,
      content,
      created_at: new Date().toISOString(),
    }

    setMessages(prev => [...prev, optimistic])
    setNewMsg("")
    setTimeout(() => textareaRef.current?.focus(), 10)
    
    await supabase.from("messages").insert({
      sender_id: userId,
      recipient_id: recipient.id,
      content,
    })
  }

  // Search users
  const searchUsers = async (term: string) => {
    setSearch(term)
    if (term.length < 2) {
      return fetchUsersWithChats()
    }
    const { data } = await supabase.from("profiles").select("id, fname, lname, email").ilike("fname", `%${term}%`)
    setUsers((data || []).map((u: any) => ({ ...u, avatar: getAvatarUrl(u.id) })))
  }

  const selectUser = (u: UserProfile) => {
    setRecipient(u)
    setUnreadCount(0)
  }

  // Check if we should show the load more button (always show if we have messages and recipient)
  const shouldShowLoadMore = recipient && messages.length > 0

  return (
    <>
      {/* Trigger Button */}
      <Button
        variant="secondary"
        size="icon"
        className="size-12 fixed bottom-5 right-5 rounded-full shadow-lg bg-primary hover:bg-primary/90"
        onClick={() => {
          setOpen(s => !s)
          if (!open) setUnreadCount(0)
        }}
        aria-label="Open chat"
      >
        <MessageCircle className="h-6 w-6" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
            {unreadCount}
          </span>
        )}
      </Button>

      {/* Chat Popup */}
      {open && (
        <motion.div
          initial={{ opacity: 0, scale: 0.98, y: 18 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          className={`${isMobile ? "fixed inset-0" : "fixed bottom-20 right-5 max-w-[700px] h-[520px] w-full"} bg-background border rounded-lg shadow-xl flex z-50`}
          role="dialog"
          aria-modal="true"
        >
          {!isMobile ? (
            // Desktop Layout
            <>
              {/* Users Sidebar */}
              <div className="w-1/3 border-r flex flex-col">
                <div className="p-2 border-b">
                  <Input
                    placeholder="Search users..."
                    value={search}
                    onChange={(e) => searchUsers(e.target.value)}
                  />
                </div>
                <ScrollArea className="flex-1 min-h-0">
                  <div className="flex flex-col">
                    {users.map((u) => (
                      <button
                        key={u.id}
                        type="button"
                        onClick={() => selectUser(u)}
                        className={`w-full flex items-center gap-2 p-2 text-left hover:bg-accent rounded ${
                          recipient?.id === u.id ? "bg-accent" : ""
                        }`}
                      >
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={u.avatar || ""} />
                          <AvatarFallback>{u.fname?.[0] || "U"}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm truncate">{u.fname} {u.lname}</div>
                          <div className="text-xs text-muted-foreground truncate">{u.email}</div>
                        </div>
                      </button>
                    ))}
                    {users.length === 0 && (
                      <div className="p-3 text-sm text-muted-foreground">No chats yet</div>
                    )}
                  </div>
                </ScrollArea>
              </div>

              {/* Chat Area */}
              <div className="flex-1 flex flex-col relative">
                <div className="p-3 border-b flex items-center justify-between sticky top-0 bg-background z-10">
                  <div className="flex items-center gap-2">
                    {recipient ? (
                      <>
                        <Avatar>
                          <AvatarImage src={recipient.avatar || ""} />
                          <AvatarFallback>{recipient.fname?.[0] || "U"}</AvatarFallback>
                        </Avatar>
                        <span className="font-semibold">{recipient.fname} {recipient.lname}</span>
                      </>
                    ) : (
                      <span className="text-muted-foreground">Select a user</span>
                    )}
                  </div>
                  <Button size="icon" variant="ghost" onClick={() => setOpen(false)}>
                    <X className="h-5 w-5" />
                  </Button>
                </div>

                <ScrollArea 
                  className="flex-1 p-3 min-h-0" 
                  onScroll={handleScroll}
                  ref={scrollAreaRef}
                >
                  <div className="flex flex-col">
                    {/* Load More Button - Always show if we have messages */}
                    {shouldShowLoadMore && (
                      <div className="flex justify-center mb-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={loadMoreMessages}
                          disabled={loadingMore || !hasMore}
                          className="flex items-center gap-2"
                        >
                          {loadingMore ? (
                            <>
                              <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                              Loading...
                            </>
                          ) : hasMore ? (
                            <>
                              <ChevronUp className="h-4 w-4" />
                              Load older messages
                            </>
                          ) : (
                            <>
                              <ChevronUp className="h-4 w-4" />
                              No older messages
                            </>
                          )}
                        </Button>
                      </div>
                    )}
                    
                    {loadingMore && (
                      <div className="text-center text-sm text-muted-foreground py-4">
                        Loading older messages...
                      </div>
                    )}
                    {loading ? (
                      <div className="text-center text-sm text-muted-foreground py-8">Loading...</div>
                    ) : (
                      messageGroups.map((group, groupIndex) => (
                        <div key={group.date + groupIndex}>
                          {/* Day separator */}
                          <div className="flex items-center justify-center my-6">
                            <div className="flex items-center">
                              <div className="h-px bg-border flex-1" />
                              <span className="px-3 text-xs text-muted-foreground font-medium">
                                {group.date}
                              </span>
                              <div className="h-px bg-border flex-1" />
                            </div>
                          </div>
                          {/* Messages for this day */}
                          {group.messages.map((m) => (
                            <motion.div
                              key={m.id}
                              initial={{ opacity: 0, y: 8 }}
                              animate={{ opacity: 1, y: 0 }}
                              className={`flex mb-1 ${m.sender_id === userId ? "justify-end" : "justify-start"}`}
                            >
                              <div className={`px-4 py-3 rounded-lg max-w-[70%] text-sm ${
                                m.sender_id === userId ? "bg-primary text-white" : "bg-muted"
                              }`}>
                                <div className="break-words">{m.content}</div>
                                <div className={`text-xs mt-2 ${
                                  m.sender_id === userId ? "text-white/70" : "text-muted-foreground"
                                }`}>
                                  {formatTime(m.created_at)}
                                </div>
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      ))
                    )}
                    <div ref={bottomRef} />
                  </div>
                </ScrollArea>

                {/* Back to bottom button */}
                {showScrollToBottom && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className="absolute bottom-20 right-4"
                  >
                    <Button
                      size="icon"
                      className="rounded-full shadow-lg bg-primary hover:bg-primary/90"
                      onClick={scrollToBottom}
                    >
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                  </motion.div>
                )}

                <div className="p-3 border-t flex gap-2 bg-background">
                  <textarea
                    ref={textareaRef}
                    value={newMsg}
                    onChange={(e) => setNewMsg(e.target.value)}
                    placeholder={recipient ? "Type a message..." : "Select a user to chat"}
                    className="flex-1 resize-none rounded-md border px-3 py-2 min-h-[44px] focus:outline-none"
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault()
                        sendMessage()
                      }
                    }}
                    disabled={!recipient}
                  />
                  <Button onClick={sendMessage} size="icon" disabled={!newMsg.trim() || !recipient}>
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          ) : (
            // Mobile Layout
            <div className="flex-1 flex flex-col relative">
              <div className="p-2 border-b flex items-center gap-2">
                <Input 
                  placeholder="Search users..." 
                  value={search} 
                  onChange={(e) => searchUsers(e.target.value)} 
                />
                <Button size="icon" variant="ghost" onClick={() => setOpen(false)}>
                  <X className="h-5 w-5" />
                </Button>
              </div>

              {!recipient ? (
                <ScrollArea className="flex-1 p-3 min-h-0">
                  <div className="flex flex-col space-y-1">
                    {users.map((u) => (
                      <button
                        key={u.id}
                        type="button"
                        onClick={() => selectUser(u)}
                        className="w-full flex items-center gap-2 p-2 text-left hover:bg-accent rounded"
                      >
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={u.avatar || ""} />
                          <AvatarFallback>{u.fname?.[0] || "U"}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm truncate">{u.fname} {u.lname}</div>
                          <div className="text-xs text-muted-foreground truncate">{u.email}</div>
                        </div>
                      </button>
                    ))}
                    {users.length === 0 && (
                      <div className="p-3 text-sm text-muted-foreground">No chats yet</div>
                    )}
                  </div>
                </ScrollArea>
              ) : (
                <>
                  <div className="p-3 border-b flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Button size="icon" variant="ghost" onClick={() => setRecipient(null)}>
                        <ArrowLeft className="h-5 w-5" />
                      </Button>
                      <Avatar>
                        <AvatarImage src={recipient.avatar || ""} />
                        <AvatarFallback>{recipient.fname?.[0] || "U"}</AvatarFallback>
                      </Avatar>
                      <span className="font-semibold">{recipient.fname} {recipient.lname}</span>
                    </div>
                    <Button size="icon" variant="ghost" onClick={() => setOpen(false)}>
                      <X className="h-5 w-5" />
                    </Button>
                  </div>

                  <ScrollArea 
                    className="flex-1 p-3 min-h-0"
                    onScroll={handleScroll}
                    ref={scrollAreaRef}
                  >
                    <div className="flex flex-col">
                      {/* Load More Button - Always show if we have messages */}
                      {shouldShowLoadMore && (
                        <div className="flex justify-center mb-4">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={loadMoreMessages}
                            disabled={loadingMore || !hasMore}
                            className="flex items-center gap-2"
                          >
                            {loadingMore ? (
                              <>
                                <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                                Loading...
                              </>
                            ) : hasMore ? (
                              <>
                                <ChevronUp className="h-4 w-4" />
                                Load older messages
                              </>
                            ) : (
                              <>
                                <ChevronUp className="h-4 w-4" />
                                No older messages
                              </>
                            )}
                          </Button>
                        </div>
                      )}
                      
                      {loadingMore && (
                        <div className="text-center text-sm text-muted-foreground py-4">
                          Loading older messages...
                        </div>
                      )}
                      {messageGroups.map((group, groupIndex) => (
                        <div key={group.date + groupIndex}>
                          <div className="flex items-center justify-center my-6">
                            <div className="flex items-center">
                              <div className="h-px bg-border flex-1" />
                              <span className="px-3 text-xs text-muted-foreground font-medium">
                                {group.date}
                              </span>
                              <div className="h-px bg-border flex-1" />
                            </div>
                          </div>
                          {group.messages.map((m) => (
                            <motion.div
                              key={m.id}
                              initial={{ opacity: 0, y: 8 }}
                              animate={{ opacity: 1, y: 0 }}
                              className={`flex mb-3 ${m.sender_id === userId ? "justify-end" : "justify-start"}`}
                            >
                              <div className={`px-4 py-3 rounded-lg max-w-[80%] text-sm ${
                                m.sender_id === userId ? "bg-primary text-white" : "bg-muted"
                              }`}>
                                <div className="break-words">{m.content}</div>
                                <div className={`text-xs mt-2 ${
                                  m.sender_id === userId ? "text-white/70" : "text-muted-foreground"
                                }`}>
                                  {formatTime(m.created_at)}
                                </div>
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      ))}
                      <div ref={bottomRef} />
                    </div>
                  </ScrollArea>

                  {/* Back to bottom button for mobile */}
                  {showScrollToBottom && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      className="absolute bottom-20 right-4"
                    >
                      <Button
                        size="icon"
                        className="rounded-full shadow-lg bg-primary hover:bg-primary/90"
                        onClick={scrollToBottom}
                      >
                        <ChevronDown className="h-4 w-4" />
                      </Button>
                    </motion.div>
                  )}

                  <div className="p-3 border-t flex gap-2 bg-background">
                    <textarea
                      ref={textareaRef}
                      value={newMsg}
                      onChange={(e) => setNewMsg(e.target.value)}
                      placeholder="Type a message..."
                      className="flex-1 resize-none rounded-md border px-3 py-2 min-h-[44px] focus:outline-none"
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault()
                          sendMessage()
                        }
                      }}
                    />
                    <Button onClick={sendMessage} size="icon" disabled={!newMsg.trim()}>
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </>
              )}
            </div>
          )}
        </motion.div>
      )}
    </>
  )
}