import { useState, useEffect, useRef } from 'react';
import { echo } from '../echo';
import axios from 'axios';

export default function ChatWidget({ currentUser }) {
  const [isOpen, setIsOpen] = useState(false);
  const [users, setUsers] = useState([]);
  
  const [searchUser, setSearchUser] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  
  const [showEmoji, setShowEmoji] = useState(false);
  const [minimizedChats, setMinimizedChats] = useState([]);
  const [unreadSenders, setUnreadSenders] = useState([]);
  
  const [file, setFile] = useState(null);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  const emojiList = ['😀', '😂', '😍', '🥰', '😎', '😭', '😡', '👍', '❤️', '🔥', '✨', '🎉', '🤔', '🙌', '👏', '💔', '💯', '👋', '👀', '🥺'];

  // 1. Lấy danh bạ
  useEffect(() => {
    if (currentUser) {
      axios.get(`http://127.0.0.1:8000/api/chat/users/${currentUser.id}`)
        .then(res => setUsers(res.data)).catch(err => console.error(err));
    }
  }, [currentUser]);

  // 2. LẮNG NGHE SỰ KIỆN CLICK VÀO THÔNG BÁO TIN NHẮN ĐỂ MỞ KHUNG CHAT TƯƠNG ỨNG
  useEffect(() => {
    const handleOpenChat = async (e) => {
      const senderId = e.detail;
      if (!senderId || !currentUser) return;
      setIsOpen(true);
      let targetUser = users.find(u => Number(u.id) === Number(senderId));
      if (!targetUser) {
        try {
          const res = await axios.get(`http://127.0.0.1:8000/api/users/${senderId}`);
          targetUser = res.data;
        } catch (err) {
          console.error("Không tìm thấy thông tin người gửi:", err);
          return;
        }
      }

      if (targetUser) {
        setSelectedUser(targetUser);
        setUnreadSenders(prev => prev.filter(id => Number(id) !== Number(senderId)));
      }
    };

    window.addEventListener('openChatWithSender', handleOpenChat);
    return () => window.removeEventListener('openChatWithSender', handleOpenChat);
  }, [currentUser, users]);

  // 3. Lấy lịch sử tin nhắn mỗi khi chọn user hoặc mở khung chat
  useEffect(() => {
    if (currentUser && selectedUser) {
      axios.get(`http://127.0.0.1:8000/api/chat/messages/${currentUser.id}/${selectedUser.id}`)
        .then(res => setMessages(res.data))
        .catch(err => console.error(err));
    } else {
      setMessages([]);
    }
  }, [currentUser, selectedUser]);

  // 4. Lắng nghe WebSocket tin nhắn mới
  useEffect(() => {
    if (!currentUser) return;

    const channel = echo.channel(`chat.${currentUser.id}`);
    
    channel.listen('.message.new', (e) => {
      console.log("Có tin nhắn mới đến qua WebSocket:", e);
      const incomingMessage = e.message;

      const isCurrentChatOpen = selectedUser && Number(selectedUser.id) === Number(incomingMessage.sender_id) && isOpen;

      if (isCurrentChatOpen) {
        setMessages(prev => [...prev, incomingMessage]);
        axios.put(`http://127.0.0.1:8000/api/chat/read/${currentUser.id}/${selectedUser.id}`)
          .catch(err => console.error(err));
      } else {
        setUnreadSenders(prev => {
          const senderId = Number(incomingMessage.sender_id);
          if (!prev.includes(senderId)) {
            return [...prev, senderId];
          }
          return prev;
        });
      }
    });

    return () => {
      echo.leaveChannel(`chat.${currentUser.id}`);
    };
  }, [currentUser?.id, selectedUser?.id, isOpen]);

  // 5. Xóa chấm đỏ khi chọn user
  useEffect(() => {
    if (selectedUser && unreadSenders.includes(Number(selectedUser.id))) {
      axios.put(`http://127.0.0.1:8000/api/chat/read/${currentUser.id}/${selectedUser.id}`)
        .then(() => {
          setUnreadSenders(prev => prev.filter(id => Number(id) !== Number(selectedUser.id)));
        }).catch(err => console.error(err));
    }
  }, [selectedUser, unreadSenders, currentUser]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchMsgs = () => {
    if(currentUser && selectedUser) {
      axios.get(`http://127.0.0.1:8000/api/chat/messages/${currentUser.id}/${selectedUser.id}`)
        .then(res => setMessages(res.data)).catch(err => console.error(err));
    }
  };

  const handleSend = (e) => {
    e.preventDefault();
    if (!text.trim() && !file) return; 

    const data = new FormData();
    data.append('sender_id', currentUser.id);
    data.append('receiver_id', selectedUser.id);
    data.append('content', text);
    if (file) {
      data.append('file', file);
    }

    axios.post('http://127.0.0.1:8000/api/chat/send', data, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }).then(() => {
      fetchMsgs(); 
      setText('');
      setFile(null);
      setShowEmoji(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    });
  };

  const handleMinimize = () => {
    if (selectedUser && !minimizedChats.find(u => Number(u.id) === Number(selectedUser.id))) {
      setMinimizedChats([...minimizedChats, selectedUser]);
    }
    setIsOpen(false);
  };

  const filteredUsers = users.filter(u => 
    (u.name || '').toLowerCase().includes(searchUser.trim().toLowerCase())
  );

  if (!currentUser) return null;

  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col items-end">
      
      <div className="flex flex-col gap-3 mb-4 items-end">
        {minimizedChats.map(u => (
          <div key={u.id} className="relative group flex items-center justify-end">
            <div className="absolute right-16 mr-1 bg-white px-3 py-1.5 rounded-lg shadow-xl border border-gray-100 text-sm font-bold text-gray-700 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
              {u.name}
              <div className="absolute top-1/2 -right-1.5 transform -translate-y-1/2 w-3 h-3 bg-white rotate-45 border-r border-t border-gray-100"></div>
            </div>
            
            <button onClick={(e) => { e.stopPropagation(); setMinimizedChats(minimizedChats.filter(chat => Number(chat.id) !== Number(u.id))); }} className="absolute -top-1 -right-1 bg-white text-gray-500 hover:text-red-600 hover:bg-red-50 w-5 h-5 rounded-full shadow-md border border-gray-200 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-all z-20 font-bold cursor-pointer">✕</button>
            
            <button 
              onClick={() => { setSelectedUser(u); setIsOpen(true); setMinimizedChats(minimizedChats.filter(chat => Number(chat.id) !== Number(u.id))); }}
              className="w-[50px] h-[50px] rounded-full shadow-lg border-2 border-white object-cover bg-[#E5E9DF] flex items-center justify-center text-[#579799] font-black text-xl hover:scale-105 transition transform relative cursor-pointer"
            >
              {u.avatar ? ( <img src={`http://127.0.0.1:8000/storage/${u.avatar}`} alt="avt" className="w-full h-full rounded-full object-cover" /> ) : ( u.name.charAt(0).toUpperCase() )}
              
              {unreadSenders.includes(Number(u.id)) && (
                <span className="absolute top-0 right-0 w-3.5 h-3.5 bg-red-500 border-2 border-white rounded-full animate-pulse shadow-sm z-10"></span>
              )}
            </button>
          </div>
        ))}
      </div>

      {isOpen && (
        <div className="bg-white border border-[#9BBFBA] shadow-2xl rounded-2xl w-80 h-[450px] mb-4 flex flex-col overflow-hidden animate-fade-in relative">
          
          <div className="bg-[#579799] text-white p-3 font-bold flex justify-between items-center shadow-sm z-10">
            <div className="flex items-center gap-2">
              {selectedUser && (
                selectedUser.avatar ? ( <img src={`http://127.0.0.1:8000/storage/${selectedUser.avatar}`} alt="avt" className="w-8 h-8 rounded-full object-cover border border-white/50" /> ) : ( <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-sm">{selectedUser.name.charAt(0).toUpperCase()}</div> )
              )}
              <span className="truncate max-w-[130px]">{selectedUser ? selectedUser.name : 'Danh bạ hệ thống'}</span>
            </div>
            <div className="flex gap-3 items-center">
              {selectedUser && (
                <button onClick={handleMinimize} className="text-white/80 hover:text-white transition font-black text-xl leading-none h-6 flex items-center cursor-pointer">−</button>
              )}
              <button onClick={() => { if (selectedUser) setSelectedUser(null); else setIsOpen(false); setShowEmoji(false); setSearchUser(''); }} className="text-white/80 hover:text-red-300 transition text-lg leading-none h-6 flex items-center cursor-pointer">✕</button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto bg-gray-50 p-0" onClick={() => setShowEmoji(false)}>
            {!selectedUser ? (
              <div className="flex flex-col h-full">
                <div className="p-2.5 bg-gray-50 border-b border-gray-200 sticky top-0 z-10 shadow-sm">
                  <div className="relative flex items-center">
                    <input
                      type="text"
                      placeholder="Tìm theo tên..."
                      value={searchUser}
                      onChange={(e) => setSearchUser(e.target.value)}
                      className="w-full bg-white border border-gray-300 rounded-xl py-2 pl-9 pr-8 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-[#579799] focus:ring-1 focus:ring-[#579799] transition shadow-inner"
                    />
                    <svg className="w-4 h-4 text-gray-400 absolute left-3 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    {searchUser && (
                      <button type="button" onClick={() => setSearchUser('')} className="absolute right-3 text-gray-400 hover:text-red-500 font-bold text-xs cursor-pointer">
                        ✕
                      </button>
                    )}
                  </div>
                </div>

                <div className="flex flex-col gap-2 p-2 pb-4">
                  {filteredUsers.length > 0 ? (
                    filteredUsers.map(u => (
                      <button key={u.id} onClick={() => setSelectedUser(u)} className="p-3 flex items-center gap-3 bg-white border border-gray-100 rounded-xl hover:border-[#579799] hover:bg-teal-50 shadow-sm transition w-full text-left cursor-pointer">
                        <div className="relative">
                          {u.avatar ? ( <img src={`http://127.0.0.1:8000/storage/${u.avatar}`} alt={u.name} className="w-10 h-10 rounded-full object-cover border border-gray-200 shadow-sm" /> ) : ( <div className="w-10 h-10 rounded-full bg-[#E5E9DF] text-[#579799] flex items-center justify-center font-black text-lg shadow-sm border border-gray-200">{u.name.charAt(0).toUpperCase()}</div> )}
                          
                          {unreadSenders.includes(Number(u.id)) ? (
                            <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-red-500 border-2 border-white rounded-full animate-pulse shadow-sm"></span>
                          ) : (
                            <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-white rounded-full"></span>
                          )}
                        </div>
                        <span className={`font-bold truncate ${unreadSenders.includes(Number(u.id)) ? 'text-red-600' : 'text-gray-700'}`}>{u.name}</span>
                      </button>
                    ))
                  ) : (
                    <div className="text-center py-10 text-gray-400 text-sm font-bold italic">
                      Không tìm thấy "{searchUser}"
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-3 p-3">
                {messages.map((m, idx) => (
                  <div key={idx} className={`p-2.5 rounded-xl max-w-[85%] text-sm flex flex-col gap-1.5 ${Number(m.sender_id) === Number(currentUser.id) ? 'bg-[#E3EFF0] text-[#1E3A3B] self-end rounded-br-none shadow-sm border border-[#C6DEE0]' : 'bg-white text-gray-800 self-start rounded-bl-none shadow-sm border border-gray-100'}`}>
                    {m.file_path && (
                      <div className="mb-1">
                        {m.file_type?.startsWith('image/') ? (
                          <img src={`http://127.0.0.1:8000/storage/${m.file_path}`} alt="attachment" className="w-full rounded-lg max-h-48 object-cover border border-white/50 shadow-sm" />
                        ) : m.file_type?.startsWith('video/') ? (
                          <video src={`http://127.0.0.1:8000/storage/${m.file_path}`} controls className="w-full rounded-lg max-h-48 border border-white/50 shadow-sm" />
                        ) : (
                          <a href={`http://127.0.0.1:8000/storage/${m.file_path}`} target="_blank" rel="noreferrer" className={`flex items-center gap-2 p-2.5 rounded-lg transition break-all text-xs font-bold no-underline shadow-sm border ${Number(m.sender_id) === Number(currentUser.id) ? 'bg-white hover:bg-gray-50 border-[#B5D4D6] text-[#2C5254]' : 'bg-gray-50 hover:bg-gray-100 border-gray-200 text-gray-700'}`}>
                            <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"></path></svg>
                            {m.file_name}
                          </a>
                        )}
                      </div>
                    )}
                    {m.content && <span>{m.content}</span>}
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          {selectedUser && (
            <div className="flex flex-col bg-white relative z-20">
              {showEmoji && (
                <div className="absolute bottom-full left-2 mb-2 bg-white border border-gray-200 shadow-xl rounded-xl p-3 grid grid-cols-5 gap-2 z-20 animate-fade-in">
                  {emojiList.map(emoji => ( <button key={emoji} type="button" onClick={() => { setText(prev => prev + emoji); setShowEmoji(false); }} className="text-2xl hover:bg-teal-50 p-1.5 rounded-lg transition transform hover:scale-110 cursor-pointer">{emoji}</button> ))}
                  <div className="absolute -bottom-1.5 left-12 w-3 h-3 bg-white rotate-45 border-b border-r border-gray-200"></div>
                </div>
              )}

              {file && (
                <div className="px-3 py-2 bg-teal-50 text-xs text-[#2F5253] border-t border-gray-200 flex justify-between items-center font-bold">
                  <span className="truncate flex-1">📎 {file.name}</span>
                  <button onClick={() => { setFile(null); fileInputRef.current.value = ''; }} className="text-red-500 hover:text-red-700 ml-2 p-1 rounded-full hover:bg-red-100 transition cursor-pointer">✖</button>
                </div>
              )}

              <form onSubmit={handleSend} className="border-t border-gray-200 p-2 flex gap-1.5 items-center">
                <input type="file" ref={fileInputRef} className="hidden" onChange={(e) => setFile(e.target.files[0])} />
                <button type="button" onClick={() => fileInputRef.current.click()} className="text-gray-400 hover:text-[#579799] transition p-1.5 rounded-full hover:bg-gray-100 cursor-pointer"><svg className="w-5 h-5 transform rotate-45" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"></path></svg></button>
                <button type="button" onClick={() => setShowEmoji(!showEmoji)} className="text-gray-400 hover:text-[#579799] transition p-1 rounded-full hover:bg-gray-100 cursor-pointer"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg></button>
                <input type="text" value={text} onChange={e => setText(e.target.value)} placeholder="Nhập tin nhắn..." className="flex-1 border border-gray-200 rounded-full px-3 py-2 focus:outline-none focus:border-[#579799] text-sm bg-gray-50" />
                <button type="submit" className="bg-[#579799] hover:bg-teal-700 transition text-white px-3 py-2 rounded-full font-bold text-sm shadow-md flex items-center justify-center cursor-pointer"><svg className="w-4 h-4 transform rotate-90" fill="currentColor" viewBox="0 0 20 20"><path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z"></path></svg></button>
              </form>
            </div>
          )}
        </div>
      )}

      <button onClick={() => setIsOpen(!isOpen)} className="relative w-14 h-14 bg-[#579799] rounded-full shadow-xl flex items-center justify-center text-white hover:bg-teal-700 transition transform hover:scale-105 border-2 border-white z-50 cursor-pointer">
        <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"></path></svg>
        {unreadSenders.length > 0 && !isOpen && (
          <span className="absolute top-0 right-0 w-4 h-4 bg-red-500 border-2 border-white rounded-full animate-pulse shadow-sm"></span>
        )}
      </button>
    </div>
  );
}