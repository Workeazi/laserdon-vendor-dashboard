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
  const [searchQuery, setSearchQuery] = useState('')

  const filteredChats = chats.filter(chat => {
    const customerName = chat.users?.full_name || 'Unknown Customer';
    return customerName.toLowerCase().includes(searchQuery.toLowerCase());
  })

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
      
      {/* Search Bar Area */}
      <div className="px-3 py-2 bg-white flex items-center gap-2 border-b border-outline-variant/20">
        <div className="bg-[#f0f2f5] rounded-lg px-3 py-1.5 flex items-center gap-3 flex-1">
          <span className="material-symbols-outlined text-[18px] text-[#54656f]">search</span>
          <input 
            type="text" 
            placeholder="Search or start new chat" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-transparent border-none outline-none text-[15px] w-full text-[#111b21] placeholder:text-[#54656f]" 
          />
        </div>
        <button className="text-[#54656f] hover:bg-[#f0f2f5] p-1.5 rounded-full transition-colors flex items-center justify-center">
          <span className="material-symbols-outlined text-[20px]">filter_list</span>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {filteredChats.length === 0 ? (
          <div className="p-8 text-center text-[#54656f] text-sm">
            {searchQuery ? 'No chats found' : 'No conversations yet'}
          </div>
        ) : (
          filteredChats.map(chat => {
            const isActive = chat.id === activeChatId;
            const customerName = chat.users?.full_name || 'Unknown Customer';
            const initial = customerName.charAt(0).toUpperCase();
            
            let msgRow = null;
            let unreadCount = 0;
            if (chat.messages && chat.messages.length > 0) {
              const sortedMsgs = [...chat.messages].sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
              msgRow = sortedMsgs[0];
              chat.messages.forEach(r => {
                 if (r.vendor_unread_message_count === null || r.vendor_unread_message_count > 0) {
                   unreadCount += (r.vendor_unread_message_count || 1);
                 }
              });
            }
            let realMessages = msgRow?.real_messages || [];
            if (typeof realMessages === 'string') {
              try {
                realMessages = JSON.parse(realMessages);
              } catch (e) {
                realMessages = [{ message: realMessages }];
              }
            }
            if (Array.isArray(realMessages)) {
              let chars = [];
              let other = [];
              realMessages.forEach(m => {
                if (typeof m === 'string' && m.length === 1) chars.push(m);
                else if (typeof m === 'string') other.push({ message: m });
                else if (m !== null && !m.deletedForVendor) other.push(m);
              });
              
              if (chars.length > 0) {
                const joined = chars.join('');
                try {
                   const parsed = JSON.parse(joined);
                   if (Array.isArray(parsed)) other.unshift(...parsed);
                   else other.unshift(parsed);
                } catch(e) {
                   other.unshift({ message: joined });
                }
              }
              realMessages = other;
            }
            const lastMessage = realMessages.length > 0 ? realMessages[realMessages.length - 1].message : 'Started a conversation';

            return (
              <div 
                key={chat.id}
                onClick={() => onSelectChat(chat.id)}
                className={`flex items-center pl-3 cursor-pointer transition-colors ${
                  isActive ? 'bg-[#f0f2f5]' : 'bg-white hover:bg-[#f5f6f6]'
                }`}
              >
                <div className="w-[49px] h-[49px] rounded-full bg-[#dfe5e7] flex items-center justify-center text-[#54656f] font-bold text-xl flex-shrink-0 mr-3">
                  {initial}
                </div>
                <div className="flex-1 min-w-0 border-b border-outline-variant/20 pr-4 py-3">
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
                      <div className="bg-[#ef4444] text-white text-[11px] font-bold px-1.5 py-0.5 rounded-full ml-2 flex-shrink-0 min-w-[20px] text-center">
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

function ChatWindow({ chatId, activeChat, onMarkAsRead, onDeleteChat }) {
  const { messages, isLoading, sendMessage, deleteMsg } = useChatMessages(chatId, onMarkAsRead)
  const [inputText, setInputText] = useState('')
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [activeMessageMenu, setActiveMessageMenu] = useState(null)
  const [replyingTo, setReplyingTo] = useState(null)
  const messagesEndRef = useRef(null)
  const fileInputRef = useRef(null)
  const [selectedFile, setSelectedFile] = useState(null)
  const [isUploading, setIsUploading] = useState(false)
  const menuRef = useRef(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSend = async (e) => {
    e.preventDefault()
    if (!inputText.trim() && !selectedFile) return
    const text = inputText.trim()
    setInputText('')
    setIsUploading(true)
    try {
      await sendMessage(
        text, 
        replyingTo ? { id: replyingTo.id, text: replyingTo.text, is_vendor: replyingTo.is_vendor } : null,
        selectedFile
      )
      setReplyingTo(null)
      setSelectedFile(null)
    } catch (err) {
      console.error(err)
      setInputText(text) // Restore on failure
      alert('Failed to send message: ' + (err.message || JSON.stringify(err)))
    } finally {
      setIsUploading(false)
    }
  }

  const handleDownload = async (url, filename) => {
    if (!url) return;
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = filename || 'attachment';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (err) {
      console.error('Download failed, falling back to new tab', err);
      window.open(url, '_blank');
    }
  }

  const handleDeleteClick = () => {
    setIsMenuOpen(false)
    if (window.confirm('Are you sure you want to delete this chat and all its messages? This cannot be undone.')) {
      onDeleteChat(chatId)
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
    <div className="flex-1 flex flex-col h-full min-w-0 min-h-0 relative border-l border-outline-variant/30 bg-[#efeae2]">
      <div className="absolute inset-0 z-0 opacity-40 pointer-events-none" style={{backgroundImage: 'url("https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png")', backgroundRepeat: 'repeat', backgroundSize: '400px'}}></div>
      
      {/* Chat Header */}
      <div className="h-16 px-4 bg-[#f0f2f5] border-b border-outline-variant/30 flex items-center gap-4 shrink-0 z-10 shadow-sm relative">
        <div className="w-[40px] h-[40px] rounded-full bg-[#d1d7db] flex items-center justify-center text-[#54656f] font-bold text-lg flex-shrink-0">
          {initial}
        </div>
        <div className="flex-1">
          <h2 className="text-[16px] font-medium text-[#111b21]">{customerName}</h2>
        </div>
        <div className="flex gap-4 text-[#54656f]">
          <span className="material-symbols-outlined cursor-pointer">search</span>
          <div className="relative" ref={menuRef}>
            <span 
              className="material-symbols-outlined cursor-pointer" 
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              more_vert
            </span>
            {isMenuOpen && (
              <div className="absolute right-0 top-8 w-40 bg-white border border-outline-variant/30 rounded-md shadow-lg z-50 overflow-hidden">
                <button 
                  onClick={handleDeleteClick}
                  className="w-full text-left px-4 py-3 text-sm text-[#111b21] hover:bg-[#f0f2f5] transition-colors"
                >
                  Delete chat
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {isLoading && messages.length === 0 ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#0084ff] border-t-transparent"></div>
        </div>
      ) : (
        <>
          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto px-6 py-4 flex flex-col gap-0">
            {messages.map((msg, index) => {
              const isVendor = msg.is_vendor;
              // Check if previous message is from same sender to handle tails
              const prevMsg = index > 0 ? messages[index - 1] : null;
              const isFirstInGroup = !prevMsg || prevMsg.is_vendor !== isVendor;

              return (
                <div key={msg.id} className={`flex ${isVendor ? 'justify-end' : 'justify-start'} ${isFirstInGroup ? 'mt-3' : 'mt-[2px]'}`}>
                  <div 
                    className={`relative max-w-[65%] px-3 py-1.5 shadow-sm group z-10 ${
                      isVendor 
                        ? `bg-[#d9fdd3] text-[#111b21] ${isFirstInGroup ? 'rounded-tl-[8px] rounded-bl-[8px] rounded-br-[8px] rounded-tr-none' : 'rounded-[8px]'}` 
                        : `bg-white text-[#111b21] ${isFirstInGroup ? 'rounded-tr-[8px] rounded-br-[8px] rounded-bl-[8px] rounded-tl-none' : 'rounded-[8px]'}`
                    }`}
                  >
                    {/* Message Action Menu */}
                    {!msg.isDeleted && (
                      <div className="absolute right-1 top-1 opacity-0 group-hover:opacity-100 transition-opacity z-20">
                         <button 
                           onClick={() => setActiveMessageMenu(activeMessageMenu === msg.id ? null : msg.id)} 
                           className="bg-transparent text-current opacity-70 hover:opacity-100 rounded-full p-0.5 outline-none"
                         >
                           <span className="material-symbols-outlined text-[20px]">expand_more</span>
                         </button>
                         {activeMessageMenu === msg.id && (
                           <div className="absolute right-0 top-6 w-44 bg-white border border-outline-variant/30 rounded-md shadow-lg z-50 overflow-hidden text-[#111b21] text-sm">
                             <button onClick={() => { setReplyingTo(msg); setActiveMessageMenu(null); }} className="w-full text-left px-4 py-2 hover:bg-[#f0f2f5] transition-colors">Reply</button>
                             <button onClick={() => { deleteMsg(msg.id, 'me'); setActiveMessageMenu(null); }} className="w-full text-left px-4 py-2 hover:bg-[#f0f2f5] transition-colors">Delete for me</button>
                             {isVendor && <button onClick={() => { deleteMsg(msg.id, 'everyone'); setActiveMessageMenu(null); }} className="w-full text-left px-4 py-2 hover:bg-[#f0f2f5] text-[#ef4444] transition-colors">Delete for everyone</button>}
                           </div>
                         )}
                      </div>
                    )}

                    {/* Tail SVG for first message in group */}
                    {isFirstInGroup && isVendor && (
                      <div className="absolute top-0 right-[-8px] text-[#d9fdd3] w-[8px] h-[13px] z-10 pointer-events-none">
                        <svg viewBox="0 0 8 13" width="8" height="13" className="w-full h-full">
                          <path fill="currentColor" d="M5.188 0H0v11.193l6.467-8.625C7.526 1.156 6.958 0 5.188 0z"></path>
                        </svg>
                      </div>
                    )}
                    {isFirstInGroup && !isVendor && (
                      <div className="absolute top-0 left-[-8px] text-white w-[8px] h-[13px] z-10 pointer-events-none">
                        <svg viewBox="0 0 8 13" width="8" height="13" className="w-full h-full">
                          <path fill="currentColor" d="M2.812 0H8v11.193L1.533 2.568C.474 1.156 1.042 0 2.812 0z"></path>
                        </svg>
                      </div>
                    )}
                    
                    <div className="flex flex-wrap items-end gap-2 mt-1">
                      <div className="flex flex-col gap-1 w-full max-w-full">
                        {msg.replyTo && !msg.isDeleted && (
                          <div className={`rounded p-2 text-[13px] border-l-4 opacity-80 ${isVendor ? 'bg-black/5 border-[#128c7e]' : 'bg-[#f0f2f5] border-[#128c7e]'}`}>
                            <div className="font-semibold mb-0.5">{msg.replyTo.is_vendor ? 'You' : customerName}</div>
                            <div className="truncate">{msg.replyTo.text}</div>
                          </div>
                        )}
                        {msg.has_attachment && !msg.isDeleted && (
                          <div 
                            className="flex items-center gap-2 bg-black/10 rounded p-2 mb-1 cursor-pointer hover:bg-black/20 transition-colors mt-1" 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDownload(msg.attachment_ref_id, msg.attachment_name);
                            }}
                            title="Download Attachment"
                          >
                            <span className="material-symbols-outlined text-[20px]">description</span>
                            <span className="text-[13px] truncate font-medium underline flex-1">{msg.attachment_name || 'Attachment'}</span>
                          </div>
                        )}
                        {msg.text && (
                          <p className={`text-[14.2px] leading-[19px] break-words pt-0.5 pb-1 pr-6 ${msg.isDeleted ? 'italic text-current/70' : ''}`}>
                            {msg.text}
                          </p>
                        )}
                      </div>
                      <span className={`text-[11px] leading-[15px] ml-auto pb-0.5 float-right whitespace-nowrap flex items-center gap-0.5 text-[#8696a0]`}>
                        {msg.created_at ? formatTime(msg.created_at) : ''}
                        {isVendor && <span className="material-symbols-outlined text-[14px] text-[#53bdeb] font-semibold">done_all</span>}
                      </span>
                    </div>
                  </div>
                </div>
              )
            })}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="flex flex-col w-full relative z-30">
            {selectedFile && (
              <div className="bg-[#f0f2f5] px-4 py-3 flex items-center justify-between border-t border-outline-variant/30">
                <div className="flex items-center gap-3 text-[#111b21]">
                  <span className="material-symbols-outlined text-[24px] text-[#54656f]">description</span>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">{selectedFile.name}</span>
                    <span className="text-xs text-[#54656f]">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</span>
                  </div>
                </div>
                <button 
                  onClick={() => { setSelectedFile(null); if (fileInputRef.current) fileInputRef.current.value = ''; }}
                  className="text-[#54656f] hover:text-[#ef4444] p-2"
                >
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>
            )}
            {replyingTo && (
              <div className="bg-[#f0f2f5] px-4 py-2 border-l-4 border-[#00a884] flex justify-between items-center text-[#111b21] border-t border-outline-variant/30">
                <div className="flex flex-col text-sm truncate pr-4">
                  <span className="font-semibold text-[#00a884]">{replyingTo.is_vendor ? 'You' : customerName}</span>
                  <span className="truncate opacity-80">{replyingTo.text}</span>
                </div>
                <button onClick={() => setReplyingTo(null)} className="text-[#54656f] hover:text-[#111b21]">
                  <span className="material-symbols-outlined text-[20px]">close</span>
                </button>
              </div>
            )}
            <div className="px-4 py-3 bg-[#f0f2f5] flex items-center gap-4 shrink-0 z-10">
            <label className="cursor-pointer flex items-center mb-0">
              <input 
                type="file" 
                className="hidden" 
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    setSelectedFile(e.target.files[0]);
                  }
                }} 
              />
              <span className="material-symbols-outlined text-[26px] text-[#54656f] rotate-45 transform hover:text-[#111b21]">
                attach_file
              </span>
            </label>
            <form onSubmit={handleSend} className="flex-1">
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Type a message"
                className="w-full bg-white border border-outline-variant/30 rounded-lg px-4 py-2.5 focus:outline-none text-[15px] text-[#111b21] placeholder:text-[#54656f] shadow-sm"
              />
            </form>
            <button
              onClick={handleSend}
              disabled={(!inputText.trim() && !selectedFile) || isUploading}
              className={`flex items-center justify-center transition-colors ${(inputText.trim() || selectedFile) && !isUploading ? 'text-[#54656f] hover:text-[#0084ff]' : 'text-[#54656f] opacity-50 cursor-not-allowed'}`}
            >
              {isUploading ? (
                <div className="w-[26px] h-[26px] border-2 border-[#54656f] border-t-[#0084ff] rounded-full animate-spin"></div>
              ) : (
                <span className="material-symbols-outlined text-[26px]">send</span>
              )}
            </button>
            </div>
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
  const { chats, isLoading: chatsLoading, refetch: refetchChats, startNewChat, removeChat } = useChats()
  const [activeChatId, setActiveChatId] = useState(null)
  const [isNewChatOpen, setIsNewChatOpen] = useState(false)

  useEffect(() => {
    if (!activeChatId && chats.length > 0) {
      const firstUnread = chats.find(c => {
        if (!c.messages) return false;
        return c.messages.some(msgRow => msgRow.vendor_unread_message_count === null || msgRow.vendor_unread_message_count > 0);
      });
      setActiveChatId(firstUnread ? firstUnread.id : chats[0].id)
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

  const handleDeleteChat = async (chatId) => {
    try {
      await removeChat(chatId);
      if (activeChatId === chatId) {
        setActiveChatId(null);
      }
    } catch (err) {
      console.error('Failed to delete chat:', err);
      alert('Failed to delete chat');
    }
  }

  return (
    <div className="flex bg-white overflow-hidden h-[calc(100vh-80px)] -mt-4 lg:-mt-[40px] -mx-4 lg:-mx-[40px] -mb-4 lg:-mb-[40px] relative z-10 border-t border-outline-variant/30">
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
        onDeleteChat={handleDeleteChat}
      />
      <NewChatModal 
        isOpen={isNewChatOpen} 
        onClose={() => setIsNewChatOpen(false)} 
        onSelectCustomer={handleStartNewChat} 
      />
    </div>
  )
}
