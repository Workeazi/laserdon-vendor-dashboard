import React, { useState, useEffect, useRef } from 'react'
import { useChats, useChatMessages } from '../../controllers/chatController'
import { useAuth } from '../../controllers/authController'
import { useCustomers } from '../../controllers/customerController'
import Modal from '../../components/ui/Modal'

const formatTime = (isoString) => {
  if (!isoString) return ''
  const date = new Date(isoString)
  return new Intl.DateTimeFormat('en-US', { hour: '2-digit', minute: '2-digit' }).format(date)
}

function ChatList({ chats, activeChatId, onSelectChat, onNewChat }) {
  return (
    <div className="w-1/3 border-r border-outline-variant/30 flex flex-col bg-white relative min-h-0">
      {/* Header */}
      <div className="h-16 px-4 bg-[#f0f2f5] border-b border-outline-variant/30 flex justify-between items-center shrink-0">
        <h2 className="text-[19px] font-semibold text-[#111b21]">Chats</h2>
        <button 
          onClick={onNewChat}
          className="w-10 h-10 rounded-full text-[#54656f] flex items-center justify-center hover:bg-[#d1d7db]/40 transition-colors"
          title="New Chat"
        >
          <span className="material-symbols-outlined text-[24px]">chat</span>
        </button>
      </div>
      
      {/* Search Bar Area (Placeholder) */}
      <div className="px-3 py-2 bg-white border-b border-outline-variant/30">
        <div className="bg-[#f0f2f5] rounded-lg px-4 py-1.5 flex items-center gap-4">
          <span className="material-symbols-outlined text-[18px] text-[#54656f]">search</span>
          <input type="text" placeholder="Search or start new chat" className="bg-transparent border-none outline-none text-sm w-full text-[#111b21] placeholder:text-[#54656f]" />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {chats.length === 0 ? (
          <div className="p-8 text-center text-[#54656f] text-sm">
            No conversations yet
          </div>
        ) : (
          chats.map(chat => {
            const isActive = chat.id === activeChatId;
            const customerName = chat.users?.full_name || 'Unknown Customer';
            const initial = customerName.charAt(0).toUpperCase();
            
            const msgRow = chat.messages && chat.messages.length > 0 ? chat.messages[0] : null;
            const unreadCount = msgRow?.vendor_unread_message_count || 0;
            const realMessages = msgRow?.real_messages || [];
            const lastMessage = realMessages.length > 0 ? realMessages[realMessages.length - 1].message : 'Started a conversation';

            return (
              <div 
                key={chat.id}
                onClick={() => onSelectChat(chat.id)}
                className={`flex items-center gap-3 px-3 py-2 cursor-pointer transition-colors ${
                  isActive ? 'bg-[#f0f2f5]' : 'bg-white hover:bg-[#f5f6f6]'
                }`}
              >
                <div className="w-[49px] h-[49px] rounded-full bg-[#dfe5e7] flex items-center justify-center text-[#54656f] font-bold text-xl flex-shrink-0">
                  {initial}
                </div>
                <div className="flex-1 min-w-0 border-b border-outline-variant/20 pb-3 pt-1">
                  <div className="flex justify-between items-baseline mb-0.5">
                    <h3 className="text-[17px] text-[#111b21] truncate leading-tight">{customerName}</h3>
                    {chat.updated_at && (
                      <span className={`text-xs whitespace-nowrap ml-2 ${unreadCount > 0 ? 'text-[#00a884] font-medium' : 'text-[#667781]'}`}>
                        {formatTime(chat.updated_at)}
                      </span>
                    )}
                  </div>
                  <div className="flex justify-between items-center">
                    <p className={`text-[14px] truncate leading-tight flex-1 ${unreadCount > 0 ? 'text-[#111b21] font-medium' : 'text-[#667781]'}`}>
                      {lastMessage}
                    </p>
                    {unreadCount > 0 && (
                      <div className="bg-[#00a884] text-white text-[11px] font-bold px-1.5 py-0.5 rounded-full ml-2 flex-shrink-0 min-w-[20px] text-center">
                        {unreadCount}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}

function ChatWindow({ chatId, activeChat, onMarkAsRead }) {
  const { messages, isLoading, sendMessage } = useChatMessages(chatId, onMarkAsRead)
  const [inputText, setInputText] = useState('')
  const messagesEndRef = useRef(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSend = async (e) => {
    e.preventDefault()
    if (!inputText.trim()) return
    const text = inputText.trim()
    setInputText('')
    try {
      await sendMessage(text)
    } catch (err) {
      console.error(err)
      setInputText(text) // Restore on failure
    }
  }

  if (!chatId) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#f0f2f5] border-l border-outline-variant/30">
        <div className="text-center text-[#54656f] max-w-sm">
          <span className="material-symbols-outlined text-[72px] font-light mb-6 block opacity-50">chat</span>
          <h2 className="text-[32px] font-light mb-4 text-[#41525d]">LaserDon Web</h2>
          <p className="text-sm leading-relaxed">Select a conversation to send messages to your customers and manage requests.</p>
        </div>
      </div>
    )
  }

  const customerName = activeChat?.users?.full_name || 'Customer'
  const initial = customerName.charAt(0).toUpperCase()

  return (
    <div className="flex-1 flex flex-col bg-[#efeae2] h-full min-w-0 min-h-0 relative border-l border-outline-variant/30" style={{backgroundImage: 'url("https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png")', backgroundRepeat: 'repeat', backgroundSize: '400px', backgroundBlendMode: 'overlay', backgroundColor: 'rgba(239,234,226,0.9)'}}>
      
      {/* Chat Header */}
      <div className="h-16 px-4 bg-[#f0f2f5] border-b border-outline-variant/30 flex items-center gap-4 shrink-0 z-10 shadow-sm">
        <div className="w-[40px] h-[40px] rounded-full bg-[#dfe5e7] flex items-center justify-center text-[#54656f] font-bold text-lg flex-shrink-0">
          {initial}
        </div>
        <div className="flex-1">
          <h2 className="text-[16px] font-medium text-[#111b21]">{customerName}</h2>
        </div>
        <div className="flex gap-4 text-[#54656f]">
          <span className="material-symbols-outlined cursor-pointer">search</span>
          <span className="material-symbols-outlined cursor-pointer">more_vert</span>
        </div>
      </div>

      {isLoading && messages.length === 0 ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#00a884] border-t-transparent"></div>
        </div>
      ) : (
        <>
          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-[5%] flex flex-col gap-[2px]">
            {messages.map((msg, index) => {
              const isVendor = msg.is_vendor;
              // Check if previous message is from same sender to handle tails
              const prevMsg = index > 0 ? messages[index - 1] : null;
              const isFirstInGroup = !prevMsg || prevMsg.is_vendor !== isVendor;

              return (
                <div key={msg.id} className={`flex ${isVendor ? 'justify-end' : 'justify-start'} ${isFirstInGroup ? 'mt-2' : ''}`}>
                  <div 
                    className={`relative max-w-[65%] px-2.5 py-1.5 shadow-[0_1px_0.5px_rgba(11,20,26,.13)] ${
                      isVendor 
                        ? 'bg-[#dcf8c6] rounded-lg' 
                        : 'bg-white rounded-lg'
                    } ${isFirstInGroup && isVendor ? 'rounded-tr-none' : ''} ${isFirstInGroup && !isVendor ? 'rounded-tl-none' : ''}`}
                  >
                    {/* Tail SVG for first message in group */}
                    {isFirstInGroup && isVendor && (
                      <span className="absolute top-0 -right-2 text-[#dcf8c6]">
                        <svg viewBox="0 0 8 13" width="8" height="13" className=""><path opacity=".13" d="M5.188 1H0v11.193l6.467-8.625C7.526 2.156 6.958 1 5.188 1z"></path><path fill="currentColor" d="M5.188 0H0v11.193l6.467-8.625C7.526 1.156 6.958 0 5.188 0z"></path></svg>
                      </span>
                    )}
                    {isFirstInGroup && !isVendor && (
                      <span className="absolute top-0 -left-2 text-white">
                        <svg viewBox="0 0 8 13" width="8" height="13" className=""><path opacity=".13" fill="#0000000" d="M1.533 3.568 8 12.193V1H2.812C1.042 1 .474 2.156 1.533 3.568z"></path><path fill="currentColor" d="M1.533 2.568 8 11.193V0H2.812C1.042 0 .474 1.156 1.533 2.568z"></path></svg>
                      </span>
                    )}
                    
                    <div className="flex flex-wrap items-end gap-2">
                      <p className="text-[14.2px] text-[#111b21] leading-[19px] break-words pt-0.5 pb-1">{msg.text}</p>
                      <span className="text-[11px] text-[#667781] leading-[15px] ml-auto pb-0.5 mt-1 float-right whitespace-nowrap">
                        {msg.created_at ? formatTime(msg.created_at) : ''}
                        {isVendor && <span className="material-symbols-outlined text-[14px] ml-1 text-[#53bdeb] align-bottom">done_all</span>}
                      </span>
                    </div>
                  </div>
                </div>
              )
            })}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="px-4 py-3 bg-[#f0f2f5] flex items-center gap-4 shrink-0">
            <span className="material-symbols-outlined text-[26px] text-[#54656f] cursor-pointer">mood</span>
            <span className="material-symbols-outlined text-[26px] text-[#54656f] cursor-pointer rotate-45 transform">attach_file</span>
            <form onSubmit={handleSend} className="flex-1">
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Type a message"
                className="w-full bg-white border-none rounded-lg px-4 py-2.5 focus:outline-none text-[15px] text-[#111b21] placeholder:text-[#54656f] shadow-sm"
              />
            </form>
            {inputText.trim() ? (
              <button
                onClick={handleSend}
                className="text-[#54656f] flex items-center justify-center hover:text-[#00a884] transition-colors"
              >
                <span className="material-symbols-outlined text-[26px]">send</span>
              </button>
            ) : (
              <span className="material-symbols-outlined text-[26px] text-[#54656f] cursor-pointer">mic</span>
            )}
          </div>
        </>
      )}
    </div>
  )
}

function NewChatModal({ isOpen, onClose, onSelectCustomer }) {
  const { data: customers, isLoading } = useCustomers()

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Start New Chat">
      {isLoading ? (
        <div className="p-8 text-center text-on-surface-variant/60 animate-pulse">Loading customers...</div>
      ) : customers?.length === 0 ? (
        <div className="p-8 text-center text-on-surface-variant/60">
          No customers found. Customers will appear here once they send a request.
        </div>
      ) : (
        <div className="max-h-[60vh] overflow-y-auto space-y-2 p-2">
          {customers?.map(customer => (
            <div 
              key={customer.id} 
              onClick={() => onSelectCustomer(customer.id)}
              className="p-4 rounded-xl border border-outline-variant/30 hover:border-primary/50 hover:bg-primary/5 cursor-pointer flex items-center gap-4 transition-colors"
            >
              <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold">
                {customer.name?.charAt(0).toUpperCase() || 'C'}
              </div>
              <div>
                <h3 className="font-semibold text-on-surface">{customer.name}</h3>
                <p className="text-sm text-on-surface-variant">{customer.email}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </Modal>
  )
}

export default function ChatPage() {
  const { chats, isLoading: chatsLoading, refetch: refetchChats, startNewChat } = useChats()
  const [activeChatId, setActiveChatId] = useState(null)
  const [isNewChatOpen, setIsNewChatOpen] = useState(false)

  // Auto-select first chat if none selected
  useEffect(() => {
    if (!activeChatId && chats.length > 0) {
      setActiveChatId(chats[0].id)
    }
  }, [chats, activeChatId])

  const handleStartNewChat = async (userId) => {
    try {
      const newChat = await startNewChat(userId)
      if (newChat) {
        setActiveChatId(newChat.id)
      }
      setIsNewChatOpen(false)
    } catch (err) {
      console.error('Failed to start chat', err)
    }
  }

  return (
    <div className="fixed inset-0 lg:left-[260px] top-20 bg-white border-t border-outline-variant/60 flex overflow-hidden z-10">
      <ChatList 
        chats={chats} 
        activeChatId={activeChatId} 
        onSelectChat={setActiveChatId} 
        onNewChat={() => setIsNewChatOpen(true)}
      />
      <ChatWindow 
        chatId={activeChatId} 
        activeChat={chats.find(c => c.id === activeChatId)} 
        onMarkAsRead={refetchChats}
      />
      <NewChatModal 
        isOpen={isNewChatOpen} 
        onClose={() => setIsNewChatOpen(false)} 
        onSelectCustomer={handleStartNewChat} 
      />
    </div>
  )
}
