import { useState, useEffect, useMemo } from 'react';
import axios from 'axios';

export default function AuthorList({ setCurrentView, setViewingUser }) {
  const [users, setUsers] = useState([]);
  const [searchAuthor, setSearchAuthor] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    axios.get('http://127.0.0.1:8000/api/authors-list')
      .then(res => { 
        setUsers(res.data); 
        setIsLoading(false); 
      })
      .catch(err => { 
        console.error(err);
        setIsLoading(false); 
      });
  }, []);
  
  const filteredAuthors = useMemo(() => {
    return users.filter(u => u.name.toLowerCase().includes(searchAuthor.toLowerCase()));
  }, [users, searchAuthor]);

  if (isLoading) return <div className="text-center mt-12 text-[#579799] font-bold animate-pulse">Đang tải danh sách tác giả...</div>;

  return (
    <div className="max-w-7xl mx-auto mt-8 px-4 animate-fade-in mb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 border-b-2 border-[#E5E9DF] pb-4 gap-4">
        <h2 className="text-3xl font-black text-[#2F5253] border-l-[6px] border-[#579799] pl-4 tracking-tight">
          Danh sách Tác giả
        </h2>
        <div className="relative w-full md:w-80">
          <input
            type="text" placeholder="Tìm kiếm tên tác giả..."
            className="w-full border border-[#9BBFBA] rounded-full py-2.5 pl-5 pr-12 focus:outline-none focus:border-[#579799] focus:ring-1 focus:ring-[#579799] text-gray-700 bg-white shadow-sm"
            value={searchAuthor} onChange={(e) => setSearchAuthor(e.target.value)}
          />
        </div>
      </div>

      {filteredAuthors.length === 0 ? (
        <div className="text-center text-gray-500 py-16 bg-white rounded-2xl shadow-sm border border-[#E5E9DF]">
          <p className="text-lg font-bold">Không tìm thấy tác giả nào phù hợp.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filteredAuthors.map((author, index) => (
            <div 
              key={index} 
              onClick={() => {
                if (setCurrentView && setViewingUser) {
                  setViewingUser(author);
                  setCurrentView('personal_page');
                }
              }}
              className="bg-white p-6 rounded-2xl shadow-sm border border-[#9BBFBA] hover:shadow-xl hover:-translate-y-2 transition-all duration-300 flex flex-col items-center text-center group cursor-pointer"
            >
              {author.avatar ? (
                <img src={`http://127.0.0.1:8000/storage/${author.avatar}`} alt="avatar" className="w-20 h-20 rounded-full object-cover shadow-inner mb-4 border border-[#E5E9DF] group-hover:border-[#579799] transition-colors duration-300" />
              ) : (
                <div className="w-20 h-20 bg-[#F6F7F0] text-[#579799] rounded-full flex items-center justify-center text-3xl font-black shadow-inner mb-4 border border-[#E5E9DF] group-hover:bg-[#579799] group-hover:text-white transition-colors duration-300">
                  {author.name.charAt(0).toUpperCase()}
                </div>
              )}
              
              <h3 className="text-lg font-extrabold text-[#2F5253] line-clamp-1">{author.name}</h3>
              <p className="text-xs text-gray-500 mt-1">{author.email}</p>
              <div className="mt-4 bg-[#E5E9DF] text-[#2F5253] text-xs font-bold px-4 py-1.5 rounded-full group-hover:bg-teal-50">
                {author.published_articles_count || 0} bài báo
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}