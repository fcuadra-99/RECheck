import { useEffect, useRef, useState } from "react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { supabase } from "@/DB"
import { Send, MessageCircle, X, ArrowLeft } from "lucide-react"
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

export function ChatPopup({ userId }: ChatPopupProps) {
  const [open, setOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  const [users, setUsers] = useState<UserProfile[]>([]) // users with chat history (or search results)
  const [recipient, setRecipient] = useState<UserProfile | null>(null)

  const [messages, setMessages] = useState<Message[]>([])
  const [newMsg, setNewMsg] = useState("")
  const [loading, setLoading] = useState(false)

  const [search, setSearch] = useState("")
  const [unreadCount, setUnreadCount] = useState(0)

  const textareaRef = useRef<HTMLTextAreaElement | null>(null)
  const bottomRef = useRef<HTMLDivElement | null>(null)

  // ————— responsive check —————
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768)
    check()
    window.addEventListener("resize", check)
    return () => window.removeEventListener("resize", check)
  }, [])

  // ————— fetch users (only when opening or requested) —————
  const fetchUsersWithChats = async () => {
    // returns only users you have chat history with
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

  // ————— fetch messages for recipient (no clearing to avoid flicker) —————
  const fetchMessagesForRecipient = async (r: UserProfile | null) => {
    if (!r) {
      setMessages([])
      setLoading(false)
      return
    }
    setLoading(true)
    const { data } = await supabase
      .from("messages")
      .select("*")
      .or(
        `and(sender_id.eq.${userId},recipient_id.eq.${r.id}),and(sender_id.eq.${r.id},recipient_id.eq.${userId})`
      )
      .order("created_at", { ascending: true })
    setMessages((data as Message[]) || [])
    setLoading(false)
    // small delay then scroll to bottom
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 40)
  }

  // ————— realtime subscription (append only) —————
  useEffect(() => {
    if (!userId) return
    let channel: RealtimeChannel | null = null

    // initial load happens when popup opens (see side effect below)
    channel = supabase
      .channel("chat-room")
      .on<Message>(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages" },
        async (payload) => {
          const msg = payload.new as Message

          // if message belongs to current conversation -> append
          if (
            recipient &&
            ((msg.sender_id === userId && msg.recipient_id === recipient.id) ||
              (msg.sender_id === recipient.id && msg.recipient_id === userId))
          ) {
            setMessages((prev) => (prev.some((m) => m.id === msg.id) ? prev : [...prev, msg]))
            // auto scroll
            setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 60)
          } else if (msg.recipient_id === userId) {
            // incoming to me but not in active chat -> increment unread
            setUnreadCount((c) => c + 1)
          }

          // if the message mentions a user not in the users list, fetch that single profile (avoid refetching whole list)
          const otherId = msg.sender_id === userId ? msg.recipient_id : msg.sender_id
          if (otherId) {
            const found = users.find((u) => u.id === otherId)
            if (!found) {
              // fetch single profile and add
              const { data } = await supabase.from("profiles").select("id, fname, lname, email").eq("id", otherId).single()
              if (data) {
                setUsers((prev) => {
                  const already = prev.some((p) => p.id === data.id)
                  if (already) return prev
                  const profile = { ...data, avatar: getAvatarUrl(data.id) }
                  return [profile, ...prev]
                })
              }
            }
          }
        }
      )
      .subscribe()

    return () => {
      if (channel) supabase.removeChannel(channel)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, recipient, users])

  // ————— open popup side-effects —————
  useEffect(() => {
    if (open) {
      // initial load of users when popup opens
      fetchUsersWithChats()
      // if there's a recipient preselected, load messages
      if (recipient) fetchMessagesForRecipient(recipient)
    }
    // do not auto-close when open changes here
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  // when recipient changes load its messages (without touching other state)
  useEffect(() => {
    if (recipient) {
      fetchMessagesForRecipient(recipient)
      // focus after small delay for mobile keyboard
      setTimeout(() => textareaRef.current?.focus(), 120)
    } else {
      setMessages([])
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recipient])

  // autoscroll when messages appended
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  // ————— send message (optimistic + append) —————
  const sendMessage = async () => {
    if (!newMsg.trim() || !recipient) return
    const content = newMsg.trim()

    // optimistic message (temporary id)
    const optimistic: Message = {
      id: `temp-${Math.random().toString(36).slice(2, 9)}`,
      sender_id: userId,
      recipient_id: recipient.id,
      content,
      created_at: new Date().toISOString(),
    }

    // append optimistically and clear input
    setMessages((prev) => [...prev, optimistic])
    setNewMsg("")
    // keep focus stable
    setTimeout(() => textareaRef.current?.focus(), 10)
    // insert to DB (realtime will deliver the saved row; we don't replace optimistic here to avoid re-renders that could cause focus loss)
    await supabase.from("messages").insert({
      sender_id: userId,
      recipient_id: recipient.id,
      content,
    })
    // no additional fetch here — realtime will append the canonical row when it arrives
  }

  // ————— search users (for starting new chat) —————
  const searchUsers = async (term: string) => {
    setSearch(term)
    if (term.length < 2) {
      // show only history
      return fetchUsersWithChats()
    }
    const { data } = await supabase.from("profiles").select("id, fname, lname, email").ilike("fname", `%${term}%`)
    setUsers((data || []).map((u: any) => ({ ...u, avatar: getAvatarUrl(u.id) })))
  }

  // ————— small helpers —————
  const selectUser = (u: UserProfile) => {
    setRecipient(u)
    setUnreadCount(0)
  }

  // ————— UI —————
  return (
    <>
      {/* trigger */}
      <Button
        variant="secondary"
        size="icon"
        className="size-12 fixed bottom-5 right-5 rounded-full shadow-lg bg-primary hover:bg-primary/90"
        onClick={() => {
          setOpen((s) => !s)
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

      {/* popup with entrance animation only */}
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
          {/* left: users */}
          {!isMobile ? (
            <>
              <div className="w-1/3 border-r">
                <div className="flex flex-col h-full">
                  <div className="p-2 border-b flex items-center gap-2">
                    <Input
                      placeholder="Search users..."
                      value={search}
                      onChange={(e) => searchUsers(e.target.value)}
                    />
                  </div>

                  <ScrollArea className="flex-1">
                    <div className="flex flex-col">
                      {users.map((u) => (
                        <button
                          key={u.id}
                          type="button"
                          onClick={() => selectUser(u)}
                          className={`w-full flex items-center gap-2 p-2 text-left hover:bg-accent rounded ${recipient?.id === u.id ? "bg-accent" : ""}`}
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
              </div>

              <div className="flex-1">
                {/* Chat panel */}
                <div className="flex flex-col h-full">
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
                    <div className="flex items-center gap-2">
                      <Button size="icon" variant="ghost" onClick={() => setOpen(false)}>
                        <X className="h-5 w-5" />
                      </Button>
                    </div>
                  </div>

                  <ScrollArea className="flex-1 p-3">
                    <div className="flex flex-col space-y-4">
                      {loading ? (
                        <div className="text-center text-sm text-muted-foreground">Loading...</div>
                      ) : (
                        messages.map((m) => (
                          <motion.div
                            key={m.id}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -6 }}
                            transition={{ duration: 0.16 }}
                            className={`flex ${m.sender_id === userId ? "justify-end" : "justify-start"}`}
                          >
                            <div className={`px-3 py-2 rounded-lg max-w-[70%] text-sm ${m.sender_id === userId ? "bg-primary text-white" : "bg-gray-200 text-black"}`}>
                              <div className="break-words">{m.content}</div>
                              <div className={`text-xs mt-1 ${m.sender_id === userId ? "text-white/70" : "text-gray-600"}`}>
                                {new Date(m.created_at).toLocaleTimeString()}
                              </div>
                            </div>
                          </motion.div>
                        ))
                      )}
                      <div ref={bottomRef} />
                    </div>
                  </ScrollArea>

                  {/* input always mounted to avoid remounting focus loss */}
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
              </div>
            </>
          ) : (
            /* mobile -> single column */
            <div className="flex-1 flex flex-col">
              <div className="p-2 border-b flex items-center gap-2">
                <Input placeholder="Search users..." value={search} onChange={(e) => searchUsers(e.target.value)} />
                <Button size="icon" variant="ghost" onClick={() => setOpen(false)}><X className="h-5 w-5" /></Button>
              </div>

              {!recipient ? (
                <ScrollArea className="flex-1 p-3">
                  <div className="flex flex-col space-y-1">
                    {users.map((u) => (
                      <button
                        key={u.id}
                        type="button"
                        onClick={() => selectUser(u)}
                        className="w-full flex items-center gap-2 p-2 text-left hover:bg-accent rounded"
                      >
                        <Avatar className="h-8 w-8"><AvatarImage src={u.avatar || ""} /><AvatarFallback>{u.fname?.[0] || "U"}</AvatarFallback></Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm truncate">{u.fname} {u.lname}</div>
                          <div className="text-xs text-muted-foreground truncate">{u.email}</div>
                        </div>
                      </button>
                    ))}
                    {users.length === 0 && <div className="p-3 text-sm text-muted-foreground">No chats yet</div>}
                  </div>
                </ScrollArea>
              ) : (
                <>
                  <div className="p-3 border-b flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Button size="icon" variant="ghost" onClick={() => setRecipient(null)}><ArrowLeft className="h-5 w-5" /></Button>
                      <Avatar><AvatarImage src={recipient.avatar || ""} /><AvatarFallback>{recipient.fname?.[0] || "U"}</AvatarFallback></Avatar>
                      <span className="font-semibold">{recipient.fname} {recipient.lname}</span>
                    </div>
                    <Button size="icon" variant="ghost" onClick={() => setOpen(false)}><X className="h-5 w-5" /></Button>
                  </div>

                  <ScrollArea className="flex-1 p-3">
                    <div className="flex flex-col space-y-4">
                      {messages.map((m) => (
                        <motion.div
                          key={m.id}
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -6 }}
                          transition={{ duration: 0.16 }}
                          className={`flex ${m.sender_id === userId ? "justify-end" : "justify-start"}`}
                        >
                          <div className={`px-3 py-2 rounded-lg max-w-[80%] text-sm ${m.sender_id === userId ? "bg-primary text-white" : "bg-gray-200 text-black"}`}>
                            <div className="break-words">{m.content}</div>
                            <div className={`text-xs mt-1 ${m.sender_id === userId ? "text-white/70" : "text-gray-600"}`}>{new Date(m.created_at).toLocaleTimeString()}</div>
                          </div>
                        </motion.div>
                      ))}
                      <div ref={bottomRef} />
                    </div>
                  </ScrollArea>

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
