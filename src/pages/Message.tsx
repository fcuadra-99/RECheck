import { useState, useEffect } from 'react';
import { Phone, X, Paperclip } from 'lucide-react';
import type { Conversation, Message } from '../types/message';
import { fetchConversations, fetchMessages, sendMessage } from '../services/messageService';


const dummyConversations: Conversation[] = [
  {
    id: 1,
    name: 'Alice Johnson',
    avatar: 'img.jpg',
    lastMessage: 'See you soon!',
    preview: 'See you soon!',
    time: '09:15',
  },
  {
    id: 2,
    name: 'Bob Smith',
    avatar: 'img.jpg',
    lastMessage: 'Thanks for the update.',
    preview: 'Thanks for the update.',
    time: 'Yesterday',
  },
];

const dummyMessages: Record<number, Message[]> = {
  1: [
    {
      from: 'Alice Johnson',
      avatar: 'img.jpg',
      text: 'Hey! Are we still meeting at 10?',
      time: '09:10',
    },
    {
      from: 'You',
      avatar: '',
      text: 'Yes, see you soon!',
      time: '09:15',
    },
  ],
  2: [
    {
      from: 'Bob Smith',
      avatar: 'img.jpg',
      text: 'Thanks for the update.',
      time: 'Yesterday',
    },
    {
      from: 'You',
      avatar: '',
      text: 'No problem!',
      time: 'Yesterday',
    },
  ],
};


const filters = [
  'Unread', 'All', 'Students', 'Faculty', 'Staff', 'Today', 'This week'
];

export default function Message() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  // Fetch conversations on mount
  useEffect(() => {
    fetchConversations().then(data => {
      if (data && data.length > 0) {
        setConversations(data);
        setSelectedId(data[0]?.id ?? null);
      } else {
        setConversations(dummyConversations);
        setSelectedId(dummyConversations[0].id);
      }
      setLoading(false);
    });
  }, []);

  // Fetch messages when selectedId changes 
  useEffect(() => {
    if (selectedId !== null) {
      fetchMessages(selectedId).then(data => {
        if (data && data.length > 0) {
          setMessages(data);
        } else {
          setMessages(dummyMessages[selectedId] || []);
        }
      });
    }
  }, [selectedId]);

  const selected = conversations.find(c => c.id === selectedId) ?? null;

  const handleSend = async () => {
    if (!input.trim() || !selectedId) return;
    setSending(true);
    const newMsg: Message = {
      from: 'You',
      avatar: '',
      text: input,
      time: 'now',
    };
    await sendMessage(selectedId, newMsg);
    setMessages(prev => [...prev, newMsg]);
    setConversations(prev => prev.map(conv =>
      conv.id === selectedId
        ? { ...conv, lastMessage: input, preview: input, time: 'now' }
        : conv
    ));
    setInput('');
    setSending(false);
  };

  //

  return (
    <div className="flex h-[85vh] max-w-6xl mx-auto bg-gradient-to-br from-gray-50 to-purple-50/50 rounded-3xl shadow-2xl overflow-hidden border-2 border-purple-100 mt-6 backdrop-blur-sm">
      {/* Sidebar */}
      <div className="w-[360px] bg-gradient-to-b from-gray-50/95 to-purple-50/95 h-full flex flex-col p-0 border-r border-purple-100/50">
        <div className="p-6 pb-2">
          <h1 className="font-extrabold text-2xl tracking-tight bg-gradient-to-r from-black to-pink-600 bg-clip-text text-transparent">
            Conversations
          </h1>
        </div>
        <div className="px-6 pb-3">
          <input
            className="w-full rounded-full px-4 py-2.5 bg-white/80 border border-purple-100 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300/50 shadow-sm transition-all duration-200 hover:bg-white/90"
            placeholder="Search for messages"
          />
        </div>
        <div className="flex flex-wrap gap-2 px-6 pb-3">
          {filters.map(f => (
            <button
              key={f}
              className={`px-3 py-1 rounded-full text-xs border transition-all duration-150 ${activeFilter === f ? 'bg-purple-200 text-purple-900 font-semibold border-purple-400' : 'bg-white hover:bg-purple-50 border-gray-200'}`}
              onClick={() => setActiveFilter(f)}
            >
              {f}
            </button>
          ))}
        </div>
        <div className="flex-1 overflow-y-auto px-2 pb-2">
          {loading ? (
            <div className="text-center text-gray-400 mt-10">Loading...</div>
          ) : conversations.map(conv => (
            <div
              key={conv.id}
              className={`group flex items-center gap-3 p-4 rounded-xl cursor-pointer mb-2 transition-all duration-200 ${
                selectedId === conv.id 
                  ? 'bg-white shadow-lg border-2 border-purple-300 scale-[0.98]' 
                  : 'hover:bg-white/70 hover:shadow-md border border-transparent hover:border-purple-200'
              }`}
              onClick={() => setSelectedId(conv.id)}
            >
              <div className="relative">
                <img 
                  src={conv.avatar} 
                  alt={conv.name} 
                  className={`w-12 h-12 rounded-full object-cover border-2 transition-all duration-200 ${
                    selectedId === conv.id 
                      ? 'border-purple-400 shadow-md' 
                      : 'border-purple-200 group-hover:border-purple-300'
                  }`} 
                />
                <div className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-green-400 border-2 border-white" />
              </div>
              <div className="flex-1 min-w-0 transition-all duration-200">
                <div className="font-semibold text-base truncate text-purple-900 group-hover:text-purple-700">{conv.name}</div>
                <div className="text-xs text-gray-500 truncate group-hover:text-gray-600">{conv.preview}</div>
              </div>
              <div className="text-xs text-gray-400 whitespace-nowrap font-mono">{conv.time}</div>
            </div>
          ))}
        </div>
      </div>
      {/* Chat area */}
      <div className="flex-1 flex flex-col bg-gradient-to-br from-white to-purple-50">
        {selected ? (
          <>
            {/* Header */}
            <div className="flex items-center px-8 py-5 bg-gradient-to-r from-purple-500 to-pink-400 shadow-md">
              <div className="font-extrabold text-2xl text-white flex-1 tracking-tight">{selected.name}</div>
              <button className="mr-4 hover:bg-white/20 p-2.5 rounded-full transition-all duration-200 hover:scale-105">
                <Phone className="w-5 h-5 text-white" />
              </button>
              <button className="hover:bg-white/20 p-2.5 rounded-full transition-all duration-200 hover:scale-105">
                <X className="w-5 h-5 text-white" />
              </button>
            </div>
            {/* Messages */}
            <div className="flex-1 flex flex-col px-10 py-8 space-y-7 overflow-y-auto">
              {messages.length === 0 ? (
                <div className="text-center text-gray-400 mt-20">No messages yet.</div>
              ) : (
                messages.map((msg, idx) => (
                  <div key={idx} className={`flex items-end ${msg.from === 'You' ? 'justify-end' : 'justify-start'}`}>
                    {msg.from !== 'You' && msg.avatar && (
                      <img src={msg.avatar} alt={msg.from} className="w-10 h-10 rounded-full object-cover mr-3 shadow-md" />
                    )}
                    <div className="flex flex-col items-start max-w-lg">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-base text-purple-900">{msg.from}</span>
                        <span className="text-xs text-gray-400 font-mono">{msg.time}</span>
                      </div>
                      <div className={`relative px-5 py-3 rounded-2xl text-base shadow-md ${msg.from === 'You' ? 'bg-gradient-to-br from-purple-400 to-pink-300 text-white ml-auto' : 'bg-white text-gray-900'} max-w-full`}
                      >
                        {msg.text}
                        {/* Bubble tail */}
                        {msg.from === 'You' ? (
                          <span className="absolute right-0 bottom-0 translate-x-1/2 translate-y-1/2 w-3 h-3 bg-gradient-to-br from-purple-400 to-pink-300 rounded-full" />
                        ) : (
                          <span className="absolute left-0 bottom-0 -translate-x-1/2 translate-y-1/2 w-3 h-3 bg-white rounded-full" />
                        )}
                      </div>
                    </div>
                    {msg.from === 'You' && (
                      <span className="ml-3" />
                    )}
                  </div>
                ))
              )}
            </div>
            {/* Input */}
            <div className="flex items-center px-10 py-5 bg-white border-t gap-3 rounded-b-2xl shadow-inner">
              <input
                className="flex-1 border border-purple-200 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-200 text-base bg-purple-50/40 shadow-sm"
                placeholder="Type Message Here"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') handleSend(); }}
                disabled={sending}
              />
              <button className="p-2 hover:bg-purple-100 rounded-full transition" disabled={sending}><Paperclip className="w-5 h-5 text-purple-400" /></button>
              <button
                className="bg-gradient-to-r from-purple-500 to-pink-400 text-white px-7 py-2 rounded-lg hover:from-purple-600 hover:to-pink-500 font-bold shadow-md transition disabled:opacity-60"
                onClick={handleSend}
                disabled={sending}
              >
                {sending ? 'Sending...' : 'Send'}
              </button>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-400 text-xl">
            No conversation selected.
          </div>
        )}
      </div>
    </div>
  );
}

