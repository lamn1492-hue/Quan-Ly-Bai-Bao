import React, { useRef, useState, useEffect } from 'react';
import axios from 'axios';

export default function PersonalPage({ 
  viewingUser, 
  user, 
  setUser, 
  setViewingUser, 
  onSelectArticle,
  setSelectedArticle,
  setCurrentView 
}) {
  const fileInputRef = useRef(null);
  const [isUploading, setIsUploading] = useState(false);
  
  // State quản lý bài báo của riêng user này
  const [articles, setArticles] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const isOwnProfile = user && viewingUser && user.id === viewingUser.id;

  const getAvatarUrl = () => {
    if (viewingUser?.avatar) return `http://127.0.0.1:8000/storage/${viewingUser.avatar}`;
    return 'https://via.placeholder.com/150';
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append('avatar', file);

    axios.post(`http://127.0.0.1:8000/api/users/${user.id}/personal-page`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
    .then(res => {
      const updatedUser = res.data.user;
      setUser(updatedUser); 
      setViewingUser(updatedUser); 
      localStorage.setItem('user_session', JSON.stringify(updatedUser));
      setIsUploading(false);
    })
    .catch(err => {
      console.error(err);
      alert("Lỗi khi tải ảnh lên!");
      setIsUploading(false);
    });
  };

  useEffect(() => {
    if (!viewingUser) return;

    axios.get('http://127.0.0.1:8000/api/workspace/published-articles?per_page=100')
      .then(res => { 
        const responseData = res.data;
        const allArticles = Array.isArray(responseData) ? responseData : (responseData.data || []);
        const myArticles = allArticles.filter(a => {
          const matchId = viewingUser.id && Number(a.user_id) === Number(viewingUser.id);
          const articleAuthor = (a.author || a.user?.name || '').trim().toLowerCase();
          const targetName = (viewingUser.name || '').trim().toLowerCase();
          const matchAuthor = targetName && articleAuthor === targetName;

          return matchId || matchAuthor;
        });

        setArticles(myArticles); 
        setIsLoading(false); 
      })
      .catch(err => { 
        console.error("Lỗi lấy bài báo cá nhân:", err);
        setIsLoading(false); 
      });
  }, [viewingUser]);

  const getFileUrl = (path) => path ? `http://127.0.0.1:8000/storage/${path}` : '#';

  const getThumbnailUrl = (article) => {
    if (article.image_path) return getFileUrl(article.image_path);
    const abstractStr = article.abstract || '';
    const cleanStr = abstractStr.replace(/&#91;/g, '[').replace(/&#93;/g, ']');
    const match = cleanStr.match(/\[\s*\[\s*IMAGE_BLOCK\s*:\s*([^\]]+?)\s*\]\s*\]/i);
    if (match && match[1]) {
      const cleanFileName = match[1].replace(/<\/?[^>]+(>|$)/g, "").trim();
      return `http://127.0.0.1:8000/storage/article_media/${cleanFileName}`;
    }
    return null;
  };
  const handleArticleClick = (article) => {
    if (onSelectArticle) {
    onSelectArticle(article);
    }
  };

  return (
    <div className="max-w-6xl mx-auto mt-12 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden animate-fade-in mb-12">
      {/* ẢNH BÌA */}
      <div className="h-56 bg-gradient-to-r from-[#75AFA2] to-[#B8D4CD] w-full relative"></div>

      <div className="px-8 pb-12 relative">
        {/* KHỐI AVATAR */}
        <div className="absolute -top-24 left-10">
          <div className="relative group">
            <img 
              src={getAvatarUrl()} 
              alt="avatar" 
              className={`w-44 h-44 rounded-full border-4 border-white object-cover shadow-xl bg-white ${isOwnProfile ? 'cursor-pointer' : ''}`} 
              onClick={() => isOwnProfile && fileInputRef.current?.click()} 
            />
            {isOwnProfile && (
              <div 
                className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-40 rounded-full text-white opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity border-4 border-transparent" 
                onClick={() => fileInputRef.current?.click()}
              >
                <span className="text-sm font-bold">{isUploading ? 'Đang tải...' : 'Đổi ảnh'}</span>
              </div>
            )}
            <input type="file" className="hidden" ref={fileInputRef} accept="image/*" onChange={handleAvatarChange} />
          </div>
        </div>

        {/* KHỐI THÔNG TIN CHÍNH */}
        <div className="pt-6 pl-[220px] flex flex-col gap-3">
          <h1 className="text-4xl font-black text-gray-900">{viewingUser?.name}</h1>
          {viewingUser?.bio && <p className="text-gray-700 font-medium whitespace-pre-wrap text-lg">{viewingUser.bio}</p>}
          
          <div className="flex flex-col gap-2 mt-2 text-gray-700 font-medium">
            {viewingUser?.phone && <div className="text-lg"><span className="font-bold text-[#579799]">Số điện thoại: </span> {viewingUser.phone}</div>}
            {viewingUser?.location && <div className="text-lg"><span className="font-bold text-[#579799]">📍 Nơi ở: </span> {viewingUser.location}</div>}
            {viewingUser?.school && <div className="text-lg"><span className="font-bold text-[#579799]">🎓 Học vấn/Công tác: </span> {viewingUser.school}</div>}
          </div>
        </div>
      </div>

      {/* DANH SÁCH BÀI BÁO CỦA NGƯỜI NÀY */}
      <div className="px-10 pb-12">
        <h2 className="text-2xl font-black text-[#2F5253] border-l-[6px] border-[#579799] pl-4 mb-6">Bài báo đã xuất bản</h2>
        
        {isLoading ? (
          <div className="text-[#579799] font-bold animate-pulse">Đang tải bài báo...</div>
        ) : articles.length === 0 ? (
          <div className="text-gray-500 py-10 bg-gray-50 rounded-xl text-center border border-dashed border-gray-300">
            Tác giả này chưa có bài báo nào được xuất bản.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {articles.map(article => {
              const thumbUrl = getThumbnailUrl(article);
              return (
                <div 
                  key={article.id} 
                  onClick={() => handleArticleClick(article)}
                  className="bg-white rounded-2xl shadow-sm border border-[#9BBFBA] overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group flex flex-col cursor-pointer"
                >
                  <div className="h-44 bg-white border-b border-[#E5E9DF] overflow-hidden">
                    {thumbUrl ? (
                      <img 
                        src={thumbUrl} 
                        alt={article.title} 
                        className="w-full h-full object-cover transform group-hover:scale-105 transition duration-500" 
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-100 flex items-center justify-center text-gray-400">Không có ảnh</div>
                    )}
                  </div>
                  <div className="p-5 flex flex-col flex-grow">
                    <h3 className="text-lg font-extrabold text-[#2F5253] mb-2 line-clamp-2 group-hover:text-[#579799] transition-colors">
                      {article.title}
                    </h3>
                    <div className="flex justify-between items-center pt-3 border-t border-[#E5E9DF] mt-auto">
                      <button 
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleArticleClick(article);
                        }} 
                        className="text-[#579799] text-sm font-bold hover:underline cursor-pointer"
                      >
                        Đọc ngay →
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}