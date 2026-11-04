import { useState, useEffect, useRef } from 'react';
import axios from 'axios';

export default function Navbar({ 
  searchTerm, setSearchTerm, setCurrentPage, 
  setAuthMode, user, setUser, setShowProfile, 
  setCurrentView, categories, filterCategory, setFilterCategory,
  setViewingUser, onOpenArticleFromNotif,
  setShowWeatherDashboard
}) {
  const [notificationCount, setNotificationCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [isSticky, setIsSticky] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);

  const userMenuRef = useRef(null);
  const notifRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setShowUserMenu(false);
      }
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 75) {
        setIsSticky(true);
      } else {
        setIsSticky(false);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const fetchNotifs = () => {
    if (!user) return;
    axios.get(`http://127.0.0.1:8000/api/users/${user.id}/notifications`)
      .then(res => {
        setNotifications(res.data);
        setNotificationCount(res.data.filter(n => !n.is_read).length);
      }).catch(() => {
        axios.get(`http://127.0.0.1:8000/api/notifications/${user.id}`)
          .then(res2 => {
            setNotifications(res2.data);
            setNotificationCount(res2.data.filter(n => !n.is_read).length);
          }).catch(e => console.error(e));
      });
  };

  useEffect(() => {
    let interval;
    if (user) {
      fetchNotifs(); 
      interval = setInterval(fetchNotifs, 4000); 
    } else {
      setNotificationCount(0);
      setNotifications([]);
    }
    return () => clearInterval(interval);
  }, [user]);

  const handleToggleNotifications = () => {
    setShowNotifications(!showNotifications);
  };

  const handleMarkAllAsRead = (e) => {
    e.stopPropagation();
    const unreadList = notifications.filter(n => !n.is_read);
    setNotifications(prev => prev.map(n => ({ ...n, is_read: 1 })));
    setNotificationCount(0);

    unreadList.forEach(n => {
      axios.put(`http://127.0.0.1:8000/api/notifications/${n.id}/read`).catch(() => {});
    });
  };

  const getNotificationBadge = (msg) => {
    const text = (msg || '').toLowerCase();
    
    if (text.includes('từ chối')) {
      return { icon: '❌', label: 'TỪ CHỐI', bg: 'bg-red-100 text-red-700' };
    }
    
    if (text.includes('chỉnh sửa') || text.includes('revision')) {
      return { icon: '⚠️', label: 'CẦN CHỈNH SỬA', bg: 'bg-orange-100 text-orange-700' };
    }

    if (text.includes('nộp') || text.includes('gửi bài') || text.includes('chờ duyệt')) {
      return { icon: '📝', label: 'Bài nộp mới', bg: 'bg-blue-100 text-blue-700' };
    }
    if (text.includes('phản biện') || text.includes('reviewer') || text.includes('chấm')) {
      return { icon: '🔍', label: 'Mời phản biện', bg: 'bg-amber-100 text-amber-700' };
    }
    if (text.includes('xuất bản') || text.includes('duyệt') || text.includes('chấp nhận')) {
      return { icon: '🎉', label: 'Đã xuất bản', bg: 'bg-green-100 text-green-700' };
    }
    if (text.includes('|||sender:')) {
      return { icon: '💬', label: 'Tin nhắn', bg: 'bg-purple-100 text-purple-700' };
    }
    return { icon: '🔔', label: 'Hệ thống', bg: 'bg-teal-100 text-teal-700' };
  };

  const handleNotificationClick = (notif) => {
    let senderId = null;
    const msg = notif.message || '';
    
    if (msg.includes('|||SENDER:')) {
      const parts = msg.split('|||SENDER:');
      senderId = parts.length > 1 ? parseInt(parts[1]) : null;
    } else if (msg.includes('|||sender:')) {
      const parts = msg.split('|||sender:');
      senderId = parts.length > 1 ? parseInt(parts[1]) : null;
    }

    if (!notif.is_read) {
      setNotifications(prev => prev.map(item => item.id === notif.id ? { ...item, is_read: 1 } : item));
      setNotificationCount(prev => Math.max(0, prev - 1));
      axios.put(`http://127.0.0.1:8000/api/notifications/${notif.id}/read`).catch(() => {});
    }

    if (senderId) {
      setShowNotifications(false);
      window.dispatchEvent(new CustomEvent('openChatWithSender', { detail: senderId }));
      return;
    }

    const lowerMsg = msg.toLowerCase();
    if ((lowerMsg.includes('nộp') || lowerMsg.includes('phản biện') || lowerMsg.includes('chờ duyệt') || lowerMsg.includes('thẩm định')) && isInternalStaff) {
      setShowNotifications(false);
      setCurrentView('manage'); 
      if (setShowWeatherDashboard) setShowWeatherDashboard(false);
      
      if ((lowerMsg.includes('thẩm định') || lowerMsg.includes('chấp nhận')) && user?.role === 'admin') {
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent('switchWorkspaceTab', { detail: 'final' }));
        }, 150);
      } else {
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent('switchWorkspaceTab', { detail: 'overview' }));
        }, 150);
      }
      return;
    }

    if (notif.article_id) {
      setShowNotifications(false);
      if (setShowWeatherDashboard) setShowWeatherDashboard(false);
      if (onOpenArticleFromNotif) {
        onOpenArticleFromNotif(notif.article_id);
      } else {
        window.location.href = `/?article_id=${notif.article_id}`;
      }
    } else {
      setShowNotifications(false);
    }
  };

  const isInternalStaff = user && (user.role === 'admin' || user.role === 'moderator');

  return (
    <div className="w-full relative z-30">
      <nav className="w-full bg-[#F6F7F0] border-t-[8px] border-t-[#75AFA2] border-b border-b-gray-300 px-8 py-3 flex items-center justify-between relative z-30">
        <div 
          className="flex items-center gap-4 cursor-pointer" 
          onClick={() => { 
            setCurrentPage(1); 
            setCurrentView('home'); 
            setFilterCategory(''); 
            if (setShowWeatherDashboard) setShowWeatherDashboard(false); 
          }}
        >
          <div className="w-12 h-12 bg-[#B8D4CD] rounded-xl border border-[#9BBFBA] flex items-center justify-center font-bold text-[#579799]">
            {isInternalStaff ? 'SRH' : 'BH'}
          </div>
          <h1 className="text-2xl font-extrabold text-[#579799] tracking-wide drop-shadow-sm">
            {isInternalStaff ? 'Hệ Thống Quản Lý Báo' : 'Báo hay vn'}
          </h1>
        </div>

        <div className="flex-1 max-w-xl mx-8 relative hidden lg:block">
          <input
            type="text" placeholder="Tìm kiếm nhanh..."
            className="w-full border border-[#9BBFBA] rounded-full py-2.5 pl-5 pr-12 focus:outline-none focus:border-[#579799] focus:ring-1 focus:ring-[#579799] text-gray-700 bg-white"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1); 
              if (setCurrentView) setCurrentView('home');
              if (setShowWeatherDashboard) setShowWeatherDashboard(false);
            }}
          />
          <svg className="w-5 h-5 text-gray-500 absolute right-4 top-1/2 transform -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
        </div>

        <div className="flex items-center gap-6 text-gray-700 font-medium text-sm whitespace-nowrap">
          <button 
            onClick={() => { setCurrentView('authors'); if (setShowWeatherDashboard) setShowWeatherDashboard(false); }} 
            className="hover:text-[#579799] focus:outline-none transition duration-200 cursor-pointer"
          >
            Tác giả
          </button>
          
          {user && (
            <button 
              onClick={() => { setCurrentView('submit_article'); if (setShowWeatherDashboard) setShowWeatherDashboard(false); }} 
              className="hover:text-[#579799] focus:outline-none transition duration-200 cursor-pointer"
            >
              Đăng báo
            </button>
          )}

          {isInternalStaff && (
            <button 
              onClick={() => { setCurrentView('manage'); if (setShowWeatherDashboard) setShowWeatherDashboard(false); }} 
              className="hover:text-[#579799] focus:outline-none transition duration-200 flex items-center gap-1 cursor-pointer"
            >
              {user.role === 'admin' ? 'Bảng điều khiển' : 'Chấm bài báo'}
            </button>
          )}

          {user ? (
            <div className="flex items-center gap-4 border-l border-gray-300 pl-4 ml-2">
              <div className="relative" ref={notifRef}>
                <button onClick={handleToggleNotifications} className="relative p-2 text-gray-500 hover:text-[#579799] transition rounded-full hover:bg-gray-100 focus:outline-none cursor-pointer">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path></svg>
                  {notificationCount > 0 && (
                    <span className="absolute top-1 right-1 flex h-4 w-4">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-4 w-4 bg-red-500 text-white text-[10px] font-bold items-center justify-center">{notificationCount}</span>
                    </span>
                  )}
                </button>

                {showNotifications && (
                  <div className="absolute right-0 mt-2 w-96 bg-white border border-gray-200 rounded-2xl shadow-2xl z-50 overflow-hidden animate-fade-in">
                    <div className="bg-[#579799] text-white font-bold px-4 py-3 flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <span>Thông báo hệ thống</span>
                        {notificationCount > 0 && (
                          <span className="bg-red-500 text-white text-[11px] px-2 py-0.5 rounded-full">{notificationCount} mới</span>
                        )}
                      </div>
                      <div className="flex items-center gap-3">
                        {notificationCount > 0 && (
                          <button onClick={handleMarkAllAsRead} className="text-[11px] bg-white/20 hover:bg-white/30 px-2.5 py-1 rounded-lg transition cursor-pointer">
                            ✓ Đọc tất cả
                          </button>
                        )}
                        <button onClick={() => setShowNotifications(false)} className="text-white hover:text-red-200 cursor-pointer">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                        </button>
                      </div>
                    </div>
                    <div className="max-h-96 overflow-y-auto divide-y divide-gray-100">
                      {notifications.length === 0 ? (
                        <div className="p-4 text-center text-gray-400 text-sm py-10 font-bold">Chưa có thông báo nào</div>
                      ) : (
                        notifications.map(n => {
                          const badge = getNotificationBadge(n.message);
                          const parts = (n.message || '').split('|||SENDER:');
                          const displayText = parts[0]; 
                          return (
                            <div key={n.id} onClick={() => handleNotificationClick(n)} className={`p-4 transition cursor-pointer hover:bg-gray-50 ${!n.is_read ? 'bg-teal-50/70 hover:bg-teal-100/60' : ''}`}>
                              <div className="flex gap-3 items-start">
                                <div className="text-xl flex-shrink-0 mt-0.5">{badge.icon}</div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center justify-between gap-2 mb-1">
                                    <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full ${badge.bg}`}>
                                      {badge.label}
                                    </span>
                                    {!n.is_read && <span className="w-2 h-2 rounded-full bg-red-500 flex-shrink-0"></span>}
                                  </div>
                                  <p className={`text-[13.5px] leading-snug break-words whitespace-normal ${!n.is_read ? 'font-bold text-gray-900' : 'text-gray-700'}`}>{displayText}</p>
                                  <p className="text-[11px] font-bold text-gray-400 mt-1.5">{new Date(n.created_at).toLocaleString('vi-VN')}</p>
                                </div>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="relative" ref={userMenuRef}>
                <button 
                  onClick={() => setShowUserMenu(prev => !prev)}
                  className="text-gray-800 font-bold hover:text-[#579799] focus:outline-none transition cursor-pointer flex items-center gap-2 py-2"
                >
                  {user.avatar ? (
                    <img src={`http://127.0.0.1:8000/storage/${user.avatar}`} className="w-8 h-8 rounded-full object-cover border border-gray-200" alt="avt"/>
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-[#E5E9DF] text-[#579799] flex items-center justify-center font-bold">{user.name.charAt(0)}</div>
                  )}
                  {user.name}
                  <svg className={`w-3.5 h-3.5 text-gray-500 transition-transform duration-200 ${showUserMenu ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                </button>

                {showUserMenu && (
                  <div className="absolute right-0 top-full mt-2 w-56 bg-white border border-gray-200 rounded-2xl shadow-2xl z-50 overflow-hidden animate-fade-in py-2">
                    <button 
                      onClick={() => { 
                        setShowUserMenu(false); 
                        if (setViewingUser) setViewingUser(user);
                        setShowProfileModal(true); 
                      }} 
                      className="w-full text-left px-4 py-2.5 text-gray-700 font-bold hover:bg-teal-50 hover:text-[#579799] transition flex items-center gap-3 cursor-pointer"
                    >
                      Trang cá nhân
                    </button>
                    <button 
                      onClick={() => { 
                        setShowUserMenu(false); 
                        if (setShowProfile) setShowProfile(true); 
                      }} 
                      className="w-full text-left px-4 py-2.5 text-gray-700 font-bold hover:bg-teal-50 hover:text-[#579799] transition flex items-center gap-3 cursor-pointer"
                    >
                      Cài đặt tài khoản
                    </button>
                    <div className="border-t border-gray-100 my-1"></div>
                    <button 
                      onClick={() => { 
                        setShowUserMenu(false); 
                        setUser(null); 
                        localStorage.removeItem('user_session'); 
                        setCurrentView('home'); 
                      }} 
                      className="w-full text-left px-4 py-2.5 text-red-600 font-bold hover:bg-red-50 transition flex items-center gap-3 cursor-pointer"
                    >
                      Đăng xuất
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex items-center border border-[#579799] rounded-lg overflow-hidden shadow-sm ml-2">
              <button onClick={() => setAuthMode('login')} className="text-[#579799] font-bold px-4 py-1.5 hover:bg-teal-50 transition duration-200 focus:outline-none cursor-pointer">Đăng nhập</button>
              <div className="w-px h-5 bg-[#579799]"></div>
              <button onClick={() => setAuthMode('register')} className="text-[#579799] font-bold px-4 py-1.5 hover:bg-teal-50 transition duration-200 focus:outline-none cursor-pointer">Đăng ký</button>
            </div>
          )}
        </div>
      </nav>

      <div className={`w-full bg-[#F6F7F0]/95 backdrop-blur-md px-8 py-3 flex items-center gap-8 overflow-x-auto custom-scroll pb-2 border-b border-gray-200 transition-all duration-300 ${isSticky ? 'fixed top-0 left-0 z-40 shadow-lg' : 'relative z-20 shadow-sm'}`}>       
        <button 
          onClick={() => { 
            setFilterCategory(''); 
            if (setCurrentView) setCurrentView('home'); 
            if (setCurrentPage) setCurrentPage(1); 
            if (setShowWeatherDashboard) setShowWeatherDashboard(false);
          }} 
          className={`whitespace-nowrap text-sm font-black uppercase transition focus:outline-none cursor-pointer ${filterCategory === '' ? 'text-[#579799] border-b-2 border-[#579799] pb-1' : 'text-gray-500 hover:text-[#579799]'}`}
        >
          Trang chủ
        </button>

        {categories?.map(c => (
          <button 
            key={c.id} 
            onClick={() => { 
              setFilterCategory(c.id.toString()); 
              if (setCurrentView) setCurrentView('home'); 
              if (setCurrentPage) setCurrentPage(1); 
              if (setShowWeatherDashboard) setShowWeatherDashboard(false);
            }} 
            className={`whitespace-nowrap text-sm font-black uppercase transition focus:outline-none cursor-pointer ${filterCategory === c.id.toString() ? 'text-[#579799] border-b-2 border-[#579799] pb-1' : 'text-gray-500 hover:text-[#579799]'}`}
          >
            {c.name}
          </button>
        ))}
      </div>

      {isSticky && <div className="w-full h-[49px]"></div>}

      {showProfileModal && user && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-gray-100">
            <div className="h-28 bg-gradient-to-r from-[#579799] to-[#2F5253] relative p-4 flex justify-between items-start">
              <span className="text-white/80 text-xs font-bold uppercase tracking-wider">Hồ sơ cá nhân</span>
              <button 
                onClick={() => setShowProfileModal(false)}
                className="text-white hover:text-red-200 bg-black/20 hover:bg-black/40 w-8 h-8 rounded-full flex items-center justify-center transition font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>
            <div className="px-6 pb-6 relative flex flex-col items-center">
              <div className="w-24 h-24 rounded-full border-4 border-white shadow-xl -mt-12 overflow-hidden bg-white flex items-center justify-center">
                {user.avatar ? (
                  <img src={`http://127.0.0.1:8000/storage/${user.avatar}`} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-[#E5E9DF] text-[#579799] font-black text-3xl flex items-center justify-center">
                    {user.name ? user.name.charAt(0) : 'U'}
                  </div>
                )}
              </div>
              <h3 className="text-xl font-black text-[#2F5253] mt-3">{user.name}</h3>
              <span className="text-xs font-extrabold uppercase px-3 py-1 rounded-full mt-1 bg-teal-50 text-[#579799] border border-teal-200">
                {user.role === 'admin' ? 'Quản trị viên (Admin)' : user.role === 'moderator' ? 'Hội đồng phản biện' : 'Tác giả / Thành viên'}
              </span>
              <div className="w-full bg-[#F6F7F0] rounded-2xl p-4 mt-5 space-y-2.5 border border-[#E5E9DF] text-sm">
                <div className="flex justify-between items-center border-b border-gray-200 pb-2">
                  <span className="text-gray-500 font-medium">Email:</span>
                  <span className="font-bold text-[#2F5253]">{user.email || 'Chưa cập nhật'}</span>
                </div>
                <div className="flex justify-between items-center border-b border-gray-200 pb-2">
                  <span className="text-gray-500 font-medium">Số điện thoại:</span>
                  <span className="font-bold text-[#2F5253]">{user.phone || 'Chưa cập nhật'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-500 font-medium">Tiểu sử:</span>
                  <span className="font-bold text-[#2F5253]">{user.bio || 'Chưa có thông tin tiểu sử'}</span>
                </div>
              </div>
              <div className="w-full flex gap-3 mt-5">
                <button
                  onClick={() => {
                    setShowProfileModal(false);
                    if (setShowProfile) setShowProfile(true);
                  }}
                  className="w-full bg-[#579799] hover:bg-[#2F5253] text-white py-2.5 rounded-xl font-bold text-sm shadow transition cursor-pointer"
                >
                  Chỉnh sửa thông tin tài khoản
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}