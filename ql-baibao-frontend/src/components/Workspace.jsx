import { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import UserManagement from './UserManagement';
import CategoryManagement from './CategoryManagement';
import EditArticleModal from './EditArticleModal';
import AdminAnalyticsChart from '../components/AdminAnalyticsChart';


// =======================
// TRÌNH SOẠN THẢO VĂN BẢN 
// =======================
function RichTextBlock({ value, onChange, placeholder }) {
  const editorRef = useRef(null);
  const containerRef = useRef(null);
  const [isSticky, setIsSticky] = useState(false);
  const [toolbarStyle, setToolbarStyle] = useState({});

  useEffect(() => {
    if (editorRef.current && value !== editorRef.current.innerHTML) {
      if (document.activeElement !== editorRef.current) {
        editorRef.current.innerHTML = value || '';
      }
    }
  }, [value]);

  useEffect(() => {
    const handleScroll = () => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const editorTop = rect.top;
      const editorBottom = rect.bottom;

      if (editorTop <= 80 && editorBottom >= 150) {
        setIsSticky(true);
        setToolbarStyle({
          position: 'fixed',
          top: '70px',
          width: `${containerRef.current.offsetWidth}px`,
          zIndex: 50,
          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
        });
      } else {
        setIsSticky(false);
        setToolbarStyle({});
      }
    };

    window.addEventListener('scroll', handleScroll);
    window.addEventListener('resize', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
    };
  }, []);
  
  const execCmd = (command, arg = null) => {
    if (!editorRef.current) return;
    editorRef.current.focus();

    const selection = window.getSelection();

    if ((command === 'foreColor' || command === 'hiliteColor') && selection.rangeCount > 0 && selection.isCollapsed) {
       const range = selection.getRangeAt(0);
       const span = document.createElement('span');
       
       if (command === 'foreColor') span.style.color = arg;
       if (command === 'hiliteColor') span.style.backgroundColor = arg;
       span.innerHTML = '&#8203;'; 
       range.insertNode(span);
       range.setStart(span, 1);
       range.collapse(true);
       selection.removeAllRanges();
       selection.addRange(range);
       
       onChange(editorRef.current.innerHTML);
       return;
    }

    if (command === 'removeFormat') {
      if (!selection.rangeCount) return;
      const range = selection.getRangeAt(0);

      if (!range.collapsed) {
        const selectedText = range.extractContents();
        const removeFormattingDeep = (node) => {
          const fragment = document.createDocumentFragment();
          while (node.firstChild) {
            let child = node.firstChild;
            node.removeChild(child);
            if (child.nodeType === Node.ELEMENT_NODE) {
              if (child.tagName === 'BR' || child.tagName === 'P' || child.tagName === 'DIV') {
                fragment.appendChild(child);
              } else {
                fragment.appendChild(removeFormattingDeep(child));
              }
            } else {
              fragment.appendChild(child);
            }
          }
          return fragment;
        };

        const cleanFragment = removeFormattingDeep(selectedText);
        range.insertNode(cleanFragment);
      } else {
        document.execCommand('styleWithCSS', false, true);
        document.execCommand('removeFormat', false, null);
      }
    } else {
      document.execCommand('styleWithCSS', false, true);
      if (command === 'backColor') command = 'hiliteColor';
      document.execCommand(command, false, arg);
    }

    onChange(editorRef.current.innerHTML);
  };

  return (
    <div ref={containerRef} className="border border-gray-300 rounded-xl overflow-visible bg-white focus-within:border-[#579799] transition shadow-sm mt-1 relative">
      {isSticky && <div style={{ height: '48px' }}></div>}

      <div 
        style={toolbarStyle}
        className="bg-[#F6F7F0] border-b border-gray-200 p-2 flex flex-wrap items-center gap-1.5 text-gray-700 select-none transition-all rounded-t-xl"
      >
        <select
          onChange={(e) => { if (e.target.value) execCmd('fontName', e.target.value); }}
          className="border border-gray-300 rounded-lg px-2 py-1 text-xs font-bold bg-white outline-none cursor-pointer hover:border-[#579799]"
          defaultValue=""
        >
          <option value="" disabled>Kiểu chữ</option>
          <option value="Arial, sans-serif">Arial</option>
          <option value="'Times New Roman', serif">Times New Roman</option>
          <option value="Georgia, serif">Georgia</option>
          <option value="Tahoma, sans-serif">Tahoma</option>
          <option value="Verdana, sans-serif">Verdana</option>
        </select>

        <select
          onChange={(e) => { if (e.target.value) execCmd('fontSize', e.target.value); }}
          className="border border-gray-300 rounded-lg px-2 py-1 text-xs font-bold bg-white outline-none cursor-pointer hover:border-[#579799]"
          defaultValue="3"
        >
          <option value="2">Cỡ nhỏ (12pt)</option>
          <option value="3">Cỡ chuẩn (14pt)</option>
          <option value="4">Cỡ vừa (18pt)</option>
          <option value="5">Tiêu đề nhỏ (24pt)</option>
          <option value="6">Tiêu đề lớn (32pt)</option>
        </select>

        <div className="w-[1px] h-5 bg-gray-300 mx-0.5"></div>

        <button type="button" onMouseDown={(e) => { e.preventDefault(); execCmd('bold'); }} className="w-7 h-7 rounded bg-white border border-gray-200 hover:bg-[#579799] hover:text-white font-black text-xs transition cursor-pointer" title="In đậm">B</button>
        <button type="button" onMouseDown={(e) => { e.preventDefault(); execCmd('italic'); }} className="w-7 h-7 rounded bg-white border border-gray-200 hover:bg-[#579799] hover:text-white italic font-serif font-bold text-xs transition cursor-pointer" title="In nghiêng">I</button>
        <button type="button" onMouseDown={(e) => { e.preventDefault(); execCmd('underline'); }} className="w-7 h-7 rounded bg-white border border-gray-200 hover:bg-[#579799] hover:text-white underline font-bold text-xs transition cursor-pointer" title="Gạch chân">U</button>

        <div className="w-[1px] h-5 bg-gray-300 mx-0.5"></div>

        <label className="flex items-center gap-1 px-2 py-1 rounded hover:bg-gray-200 cursor-pointer border border-gray-200 bg-white" title="Màu chữ">
          <span className="text-xs font-black text-[#2F5253]">Màu chữ</span>
          <input type="color" defaultValue="#2F5253" onInput={(e) => execCmd('foreColor', e.target.value)} className="w-4 h-4 cursor-pointer border-0 p-0 bg-transparent" />
        </label>

        <label className="flex items-center gap-1 px-2 py-1 rounded hover:bg-gray-200 cursor-pointer border border-gray-200 bg-white" title="Tô nền chữ">
          <span className="text-xs font-bold">Nền</span>
          <input type="color" defaultValue="#ffff00" onInput={(e) => execCmd('hiliteColor', e.target.value)} className="w-4 h-4 cursor-pointer border-0 p-0 bg-transparent" />
        </label>

        <div className="w-[1px] h-5 bg-gray-300 mx-0.5"></div>

        <button type="button" onMouseDown={(e) => { e.preventDefault(); execCmd('justifyLeft'); }} className="px-2 py-1 rounded bg-white border border-gray-200 hover:bg-[#579799] hover:text-white text-xs font-bold transition cursor-pointer" title="Căn trái">Trái</button>
        <button type="button" onMouseDown={(e) => { e.preventDefault(); execCmd('justifyCenter'); }} className="px-2 py-1 rounded bg-white border border-gray-200 hover:bg-[#579799] hover:text-white text-xs font-bold transition cursor-pointer" title="Căn giữa">Giữa</button>
        {/* ĐÃ ĐỔI ĐỀU THÀNH PHẢI */}
        <button type="button" onMouseDown={(e) => { e.preventDefault(); execCmd('justifyRight'); }} className="px-2 py-1 rounded bg-white border border-gray-200 hover:bg-[#579799] hover:text-white text-xs font-bold transition cursor-pointer" title="Căn phải">Phải</button>

        <button type="button" onMouseDown={(e) => { e.preventDefault(); execCmd('removeFormat'); }} className="px-2 py-1 rounded hover:bg-red-500 hover:text-white text-xs font-bold text-red-500 transition ml-auto cursor-pointer">✕ Xóa format</button>
      </div>

      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        onInput={(e) => onChange(e.currentTarget.innerHTML)}
        onBlur={(e) => onChange(e.currentTarget.innerHTML)}
        data-placeholder={placeholder || "Nhập nội dung đoạn văn bản..."}
        className="w-full min-h-[160px] p-4 outline-none text-gray-800 text-[15px] leading-relaxed overflow-y-auto empty:before:content-[attr(data-placeholder)] empty:before:text-gray-400"
      />
    </div>
  );
}

export default function Workspace({ user, categories, forceAuthorView = false }) {
  const [activeTab, setActiveTab] = useState('overview');
  const [dashboardData, setDashboardData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [finalSearch, setFinalSearch] = useState('');
  // Tự động chuyển tab khi click thông báo
  useEffect(() => {
    const handleSwitchTab = (e) => {
      if (e.detail) setActiveTab(e.detail);
    };
    window.addEventListener('switchWorkspaceTab', handleSwitchTab);
    return () => window.removeEventListener('switchWorkspaceTab', handleSwitchTab);
  }, []);

  const [showInviteModal, setShowInviteModal] = useState(false);
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [reviewers, setReviewers] = useState([]);
  const [assignData, setAssignData] = useState({ reviewer_id: '', deadline: '' });

  const [showAuthorForm, setShowAuthorForm] = useState(false);
  const [authorFormData, setAuthorFormData] = useState({ title: '', category_id: '' });
  const [selectedJournal, setSelectedJournal] = useState('');
  const [authorFile, setAuthorFile] = useState(null);

  const [blocks, setBlocks] = useState([{ type: 'text', content: '', id: Date.now() }]);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [detailArticle, setDetailArticle] = useState(null);

  const [showReviewModal, setShowReviewModal] = useState(false);
  const [currentReview, setCurrentReview] = useState(null);
  const [reviewData, setReviewData] = useState({ comments: '', decision: '' });

  const [editingArticle, setEditingArticle] = useState(null);

  const getSavedJournals = () => {
    try {
      const saved = localStorage.getItem('srh_journals');
      return saved ? JSON.parse(saved) : [
        { id: 1, name: 'Tạp chí Khoa học Đại học Tây Nguyên', issn: '1859-4611' },
        { id: 2, name: 'Tạp chí Phát triển Khoa học & Công nghệ', issn: '1859-0128' },
        { id: 3, name: 'IEEE Access / Computing Journal', issn: '2169-3536' }
      ];
    } catch {
      return [];
    }
  };
  const savedJournals = getSavedJournals();

  const getFileUrl = (path) => path ? `http://127.0.0.1:8000/storage/${path}` : '#';

  const addTextBlock = () => setBlocks(prev => [...prev, { type: 'text', content: '', id: Date.now() }]);
  const handleAddImageBlock = (e) => {
    const file = e.target.files[0];
    if (file) setBlocks(prev => [...prev, { type: 'image', file, preview: URL.createObjectURL(file), id: Date.now() }]);
    e.target.value = '';
  };
  const handleAddVideoBlock = (e) => {
    const file = e.target.files[0];
    if (file) setBlocks(prev => [...prev, { type: 'video', file, preview: URL.createObjectURL(file), id: Date.now() }]);
    e.target.value = '';
  };
  const removeBlock = (id) => setBlocks(prev => prev.filter(b => b.id !== id));
  const updateBlockContent = (id, value) => setBlocks(prev => prev.map(b => b.id === id ? { ...b, content: value } : b));

  const buildFinalAbstract = () => {
    return blocks.map(b => {
      if (b.type === 'text') return b.content;
      if (b.type === 'image') return `[[IMAGE_BLOCK:${b.file.name}]]`;
      if (b.type === 'video') return `[[VIDEO_BLOCK:${b.file.name}]]`;
      return '';
    }).join('\n\n');
  };

  const renderFormattedContent = (article) => {
    const raw = article.abstract || '';
    const cleanRaw = raw.replace(/&#91;/g, '[').replace(/&#93;/g, ']');
    const parts = cleanRaw.split(/(\[\s*\[\s*[A-Z]+_BLOCK\s*:\s*[^\]]+?\s*\]\s*\])/gi);
    let imageCount = 0;

    return (
      <div className="flex flex-col gap-3 text-gray-700 text-sm leading-relaxed">
        {parts.map((part, idx) => {
          const trimmedPart = part.trim();
          if (!trimmedPart) return null;

          const imgMatch = trimmedPart.match(/\[\s*\[\s*IMAGE_BLOCK\s*:\s*([^\]]+?)\s*\]\s*\]/i);
          if (imgMatch) {
            imageCount++;
            const cleanFileName = imgMatch[1].replace(/<\/?[^>]+(>|$)/g, "").trim();
            const url = (imageCount === 1 && article.image_path) 
              ? `http://127.0.0.1:8000/storage/${article.image_path}` 
              : `http://127.0.0.1:8000/storage/article_media/${cleanFileName}`;
            return (
              <div key={idx} className="flex justify-center my-4 w-full">
                <img src={url} alt="media" className="w-full max-h-[450px] object-cover rounded-xl shadow-md border border-gray-200" onError={(e) => { e.target.onerror = null; e.target.outerHTML = '<div class="p-4 bg-red-50 text-red-500 font-bold rounded-lg text-center">❌ Ảnh chưa được tải lên</div>'; }} />
              </div>
            );
          }

          const vidMatch = trimmedPart.match(/\[\s*\[\s*VIDEO_BLOCK\s*:\s*([^\]]+?)\s*\]\s*\]/i);
          if (vidMatch) {
            const cleanFileName = vidMatch[1].replace(/<\/?[^>]+(>|$)/g, "").trim();
            const url = article.video_path ? `http://127.0.0.1:8000/storage/${article.video_path}` : `http://127.0.0.1:8000/storage/article_media/${cleanFileName}`;
            return (
              <div key={idx} className="flex justify-center my-4 w-full">
                <video src={url} controls className="w-full max-h-[450px] bg-black rounded-xl" onError={(e) => { e.target.onerror = null; e.target.outerHTML = '<div class="p-4 bg-red-50 text-red-500 font-bold rounded-lg text-center">🎥 Video chưa được tải lên</div>'; }}></video>
              </div>
            );
          }
          return (
            <div 
              key={idx} 
              className="text-justify text-gray-800 leading-relaxed space-y-3 [&_p]:mb-3 [&_a]:text-blue-600 [&_a]:underline"
              dangerouslySetInnerHTML={{ __html: trimmedPart }}
            />
          );
        })}
      </div>
    );
  };

  const fetchDashboardData = useCallback(() => {
    let url = '';
    if (forceAuthorView || user.role === 'user') url = `http://127.0.0.1:8000/api/workspace/author/${user.id}`;
    else if (user.role === 'admin') url = `http://127.0.0.1:8000/api/workspace/admin`;
    else if (user.role === 'moderator') url = `http://127.0.0.1:8000/api/workspace/reviewer/${user.id}`;

    if (url) {
      axios.get(url).then(res => { setDashboardData(res.data); setIsLoading(false); }).catch(() => { setIsLoading(false); });
    }
  }, [user, forceAuthorView]);

  useEffect(() => { fetchDashboardData(); }, [fetchDashboardData]);

  useEffect(() => {
    if (user.role === 'admin') {
      axios.get('http://127.0.0.1:8000/api/reviewers').then(res => setReviewers(res.data)).catch(err => console.error(err));
    }
  }, [user]);

  // Nộp bài mới
  const handleAuthorSubmit = (e) => {
    e.preventDefault();
    const data = new FormData();
    data.append('title', authorFormData.title);
    
    const rawContent = buildFinalAbstract();
    const finalAbstract = selectedJournal 
      ? `${rawContent}\n\n[Tạp chí: ${selectedJournal}]` 
      : rawContent;

    data.append('abstract', finalAbstract);
    data.append('journal', selectedJournal || '');
    data.append('category_id', authorFormData.category_id);
    data.append('user_id', user.id); 
    data.append('author', user.name); 
    if (authorFile) data.append('file', authorFile);

    const firstImage = blocks.find(b => b.type === 'image');
    if (firstImage) data.append('image', firstImage.file);
    const firstVideo = blocks.find(b => b.type === 'video');
    if (firstVideo) data.append('video', firstVideo.file);
    
    blocks.filter(b => b.type === 'image').forEach((img, idx) => data.append(`content_images[${idx}]`, img.file));
    blocks.filter(b => b.type === 'video').forEach((vid, idx) => data.append(`content_videos[${idx}]`, vid.file));

    axios.post('http://127.0.0.1:8000/api/articles', data, { headers: { 'Content-Type': 'multipart/form-data' } })
      .then(() => {
        alert("Nộp bài thành công! Bài báo đang chờ sơ duyệt.");
        setShowAuthorForm(false);
        setAuthorFormData({ title: '', category_id: '' });
        setSelectedJournal('');
        setBlocks([{ type: 'text', content: '', id: Date.now() }]);
        setAuthorFile(null);
        fetchDashboardData();
      }).catch(() => alert("Lỗi khi nộp bài! Vui lòng thử lại."));
  };

  const viewAuthorDetails = (article) => { setDetailArticle(article); setShowDetailModal(true); };
  
  const handleDeleteArticle = (id) => {
    if (window.confirm("CẢNH BÁO: Bạn có chắc chắn muốn xóa bài báo này vĩnh viễn không? Hành động này không thể hoàn tác!")) {
      axios.delete(`http://127.0.0.1:8000/api/articles/${id}`)
        .then(() => {
          alert("Đã xóa bài báo thành công!");
          fetchDashboardData();
        })
        .catch(() => alert("Lỗi khi xóa bài báo! Vui lòng thử lại."));
    }
  };

  const handleDeskReject = (id) => { 
    if (window.confirm("Từ chối bài báo này ngay lập tức?")) { 
      axios.put(`http://127.0.0.1:8000/api/workspace/desk-reject/${id}`).then(res => { 
        alert(res.data.message); 
        fetchDashboardData(); 
      }); 
    } 
  };

  const openInviteModal = (article) => { 
    setSelectedArticle(article); 
    setAssignData({ reviewer_id: '', deadline: '' }); 
    setShowInviteModal(true); 
  };

  const submitAssignReviewer = (e) => {
    e.preventDefault();
    if (!assignData.reviewer_id || !assignData.deadline) return alert("Vui lòng nhập đủ thông tin!");
    axios.post('http://127.0.0.1:8000/api/workspace/assign-reviewer', { article_id: selectedArticle.id, reviewer_id: assignData.reviewer_id, deadline: assignData.deadline })
      .then(res => { alert(res.data.message); setShowInviteModal(false); fetchDashboardData(); });
  };

  const handlePublish = (id) => { 
    if (window.confirm("Xác nhận xuất bản bài báo này?")) { 
      axios.put(`http://127.0.0.1:8000/api/workspace/publish/${id}`).then(res => { 
        alert(res.data.message); 
        fetchDashboardData(); 
      }); 
    } 
  };

  const handleLockArticle = (id) => {
    if (window.confirm("Khóa bài báo này? Bài báo sẽ tạm thời bị ẩn khỏi Trang chủ!")) {
      axios.put(`http://127.0.0.1:8000/api/workspace/lock/${id}`)
        .then(res => {
          alert(res.data.message || "Đã khóa bài báo thành công!");
          fetchDashboardData();
        })
        .catch(() => alert("Lỗi khi khóa bài báo!"));
    }
  };

  const handleUnlockArticle = (id) => {
    if (window.confirm("Mở khóa và cho phép bài báo này hiển thị lại trên Trang chủ?")) {
      axios.put(`http://127.0.0.1:8000/api/workspace/publish/${id}`)
        .then(() => {
          alert("Đã mở khóa và xuất bản lại bài báo!");
          fetchDashboardData();
        })
        .catch(() => alert("Lỗi khi mở khóa bài báo!"));
    }
  };

  const handleOpenReview = (review) => { 
    setCurrentReview(review); 
    setReviewData({ comments: review.comments || '', decision: review.decision || '' }); 
    setShowReviewModal(true); 
  };

  const submitReviewScore = (e) => {
    e.preventDefault();
    if(!reviewData.decision) return alert("Vui lòng chọn quyết định!");
    axios.put(`http://127.0.0.1:8000/api/workspace/submit-review/${currentReview.id}`, reviewData)
      .then(res => { alert(res.data.message); setShowReviewModal(false); fetchDashboardData(); });
  };

  const getCategoryName = (id) => { const cat = categories?.find(c => c.id === id); return cat ? cat.name : 'Chưa phân loại'; };

  const renderStatusBadge = (status) => {
    const baseClass = "inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap shadow-sm border";
    switch(status) {
      case 'pending': 
        return <span className={`${baseClass} bg-amber-100 text-amber-800 border-amber-200`}><span>⏳</span><span>Chờ sơ duyệt</span></span>;
      case 'reviewing': 
        return <span className={`${baseClass} bg-blue-100 text-blue-700 border-blue-200`}><span>🔍</span><span>Đang phản biện</span></span>;
      case 'revision': 
        return <span className={`${baseClass} bg-orange-100 text-orange-700 border-orange-200`}><span>⚠️</span><span>Cần chỉnh sửa</span></span>;
      case 'accepted': 
        return <span className={`${baseClass} bg-green-100 text-green-700 border-green-200`}><span>✅</span><span>Đã chấp nhận</span></span>;
      case 'published': 
        return <span className={`${baseClass} bg-teal-100 text-teal-700 border-teal-200`}><span>🌐</span><span>Đã xuất bản</span></span>;
      case 'locked': 
        return <span className={`${baseClass} bg-gray-800 text-white border-gray-900`}><span>🔒</span><span>Đã bị khóa</span></span>;
      case 'rejected': 
        return <span className={`${baseClass} bg-red-100 text-red-700 border-red-200`}><span>❌</span><span>Bị từ chối</span></span>;
      default: 
        return <span className={`${baseClass} bg-gray-100 text-gray-700 border-gray-200`}><span>📝</span><span>Bản nháp</span></span>;
    }
  };

  if (isLoading) return <div className="mt-12 text-center text-[#579799] font-bold animate-pulse">Đang tải dữ liệu...</div>;

  const renderAuthorDashboard = () => {
    const stats = dashboardData?.stats || { total: 0, reviewing: 0, published: 0 };
    const articles = dashboardData?.articles || [];
    return (
      <div className="animate-fade-in flex flex-col gap-6">
        <div className="flex justify-between items-end border-b-2 border-[#AACBCA] pb-4">
          <div><h2 className="text-2xl font-extrabold text-[#579799]">Quản lý công trình khoa học</h2></div>
          <button 
            onClick={() => {
              if (showAuthorForm) setSelectedJournal('');
              setShowAuthorForm(!showAuthorForm);
            }} 
            className="bg-[#579799] text-white font-bold px-6 py-2.5 rounded-lg shadow-md hover:bg-teal-700 transition cursor-pointer"
          >
            {showAuthorForm ? 'Hủy nộp bài' : 'Nộp bài báo mới'}
          </button>
        </div>

        {showAuthorForm && (
          <div className="bg-white p-6 rounded-xl border border-[#9BBFBA] shadow-sm">
            <form onSubmit={handleAuthorSubmit} className="flex flex-col gap-4">
              <h3 className="text-lg font-bold text-[#579799] border-b pb-2">Nộp công trình nghiên cứu mới</h3>
              <input type="text" placeholder="Tiêu đề bài báo *" required className="w-full border border-[#9BBFBA] rounded-lg p-2.5 font-bold text-gray-800 focus:outline-none focus:ring-1 focus:ring-[#579799]" value={authorFormData.title} onChange={e => setAuthorFormData({...authorFormData, title: e.target.value})} />
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex flex-col">
                  <label className="text-xs font-bold text-gray-500 mb-1">Chuyên mục *</label>
                  <select required className="border border-[#9BBFBA] rounded-lg p-2.5 bg-white text-gray-700 focus:outline-none focus:ring-1 focus:ring-[#579799]" value={authorFormData.category_id} onChange={e => setAuthorFormData({...authorFormData, category_id: e.target.value})}>
                    <option value="">-- Chọn chuyên mục --</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>

                <div className="flex flex-col">
                  <label className="text-xs font-bold text-gray-500 mb-1">Tạp chí Khoa học (Ấn phẩm)</label>
                  <select 
                    className="border border-[#9BBFBA] rounded-lg p-2.5 bg-white text-gray-700 focus:outline-none focus:ring-1 focus:ring-[#579799]" 
                    value={selectedJournal} 
                    onChange={e => setSelectedJournal(e.target.value)}
                  >
                    <option value="">-- Chọn tạp chí đăng tải (nếu có) --</option>
                    {savedJournals.map(j => (
                      <option key={j.id} value={j.name}>{j.name} (ISSN: {j.issn})</option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col">
                  <label className="text-xs font-bold text-gray-500 mb-1">File bản thảo gốc (Word/PDF) - Tùy chọn</label>
                  <input type="file" className="border border-[#9BBFBA] rounded-lg p-1.5 text-sm bg-gray-50" onChange={e => setAuthorFile(e.target.files[0])} accept=".pdf,.doc,.docx" />
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <div className="flex justify-between items-center bg-[#F6F7F0] px-4 py-2.5 rounded-xl border border-[#E5E9DF]">
                  <span className="text-xs font-extrabold text-[#2F5253] uppercase">Nội dung bài báo</span>
                  <div className="flex gap-2">
                    <button type="button" onClick={addTextBlock} className="bg-white hover:bg-teal-50 text-[#579799] border border-[#9BBFBA] px-3 py-1.5 rounded-lg text-xs font-bold shadow-sm transition">Thêm chữ</button>
                    <label className="cursor-pointer bg-white hover:bg-teal-50 text-[#579799] border border-[#9BBFBA] px-3 py-1.5 rounded-lg text-xs font-bold shadow-sm transition">
                      Thêm ảnh<input type="file" className="hidden" accept="image/*" onChange={handleAddImageBlock} />
                    </label>
                    <label className="cursor-pointer bg-white hover:bg-teal-50 text-[#579799] border border-[#9BBFBA] px-3 py-1.5 rounded-lg text-xs font-bold shadow-sm transition">
                      Thêm video<input type="file" className="hidden" accept="video/*" onChange={handleAddVideoBlock} />
                    </label>
                  </div>
                </div>

                <div className="flex flex-col gap-3 p-3 border border-[#9BBFBA] rounded-xl bg-gray-50/50 min-h-[220px]">
                  {blocks.map((block, index) => (
                    <div key={block.id} className="relative bg-white p-3 rounded-xl border border-gray-200 shadow-sm flex flex-col gap-2">
                      <div className="flex justify-between items-center text-xs font-bold text-gray-400">
                        <span>Khối #{index + 1} ({block.type === 'text' ? 'Văn bản' : block.type === 'image' ? 'Hình ảnh' : 'Video'})</span>
                        {blocks.length > 1 && <button type="button" onClick={() => removeBlock(block.id)} className="text-red-500 hover:text-red-700 font-bold px-1.5 py-0.5 rounded bg-red-50">Xóa khối ✕</button>}
                      </div>
                      {block.type === 'text' && (<RichTextBlock value={block.content} onChange={(val) => updateBlockContent(block.id, val)} placeholder="Nhập nội dung đoạn văn bản..." />)}
                      {block.type === 'image' && <div className="flex justify-center bg-gray-50 p-2 rounded-lg"><img src={block.preview} alt="uploaded preview" className="max-h-60 rounded-lg object-contain" /></div>}
                      {block.type === 'video' && <div className="flex justify-center bg-black p-2 rounded-lg"><video src={block.preview} controls className="max-h-60 rounded-lg" /></div>}
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="flex justify-end gap-3 mt-4 pt-2">
                <button type="button" onClick={() => { setShowAuthorForm(false); setSelectedJournal(''); }} className="px-5 py-2.5 text-gray-500 font-bold hover:bg-gray-100 rounded-lg transition cursor-pointer">Hủy bỏ</button>
                <button type="submit" className="bg-[#579799] text-white px-8 py-2.5 rounded-lg font-bold shadow-md hover:bg-teal-700 transition cursor-pointer">Gửi bài lên Hội đồng</button>
              </div>
            </form>
          </div>
        )}

        {!showAuthorForm && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-5 rounded-xl border border-[#9BBFBA] shadow-sm"><div><p className="text-sm font-bold text-gray-500">Tổng bài</p><h3 className="text-2xl font-extrabold text-[#579799]">{stats.total}</h3></div></div>
            <div className="bg-white p-5 rounded-xl border border-[#9BBFBA] shadow-sm"><div><p className="text-sm font-bold text-gray-500">Đang phản biện</p><h3 className="text-2xl font-extrabold text-blue-600">{stats.reviewing}</h3></div></div>
            <div className="bg-white p-5 rounded-xl border border-[#9BBFBA] shadow-sm"><div><p className="text-sm font-bold text-gray-500">Đã xuất bản</p><h3 className="text-2xl font-extrabold text-green-600">{stats.published}</h3></div></div>
          </div>
        )}

        <div className="bg-white rounded-xl shadow-sm border border-[#9BBFBA] overflow-hidden">
          <table className="w-full text-left border-collapse table-auto">
            <thead>
              <tr className="bg-[#F6F7F0] text-[#579799] text-sm uppercase">
                <th className="p-4 font-bold">Tiêu đề bài báo</th>
                <th className="p-4 font-bold text-center w-48 whitespace-nowrap">Trạng thái</th>
                <th className="p-4 font-bold text-right w-56 whitespace-nowrap">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {articles.map(article => (
                <tr key={article.id} className="border-b border-gray-100 hover:bg-[#FAFBFA] transition">
                  <td className="p-4 font-bold text-gray-800 pr-6">
                    <p className="leading-snug">{article.title}</p>
                  </td>
                  
                  <td className="p-4 text-center w-48 whitespace-nowrap">
                    {renderStatusBadge(article.status)}
                  </td>
                  
                  <td className="p-4 text-right w-56 whitespace-nowrap">
                    <div className="flex items-center justify-end gap-3 text-sm font-bold">
                      <button onClick={() => viewAuthorDetails(article)} className="text-[#579799] hover:underline cursor-pointer">Xem chi tiết</button>
                      <button onClick={() => setEditingArticle(article)} className="text-blue-500 hover:underline cursor-pointer">Sửa bài</button>
                      <button onClick={() => handleDeleteArticle(article.id)} className="text-red-500 hover:underline cursor-pointer">Xóa bài</button>
                    </div>
                  </td> 
                </tr>
              ))}
              {articles.length === 0 && (
                <tr>
                  <td colSpan="3" className="p-8 text-center text-gray-400 font-bold">
                    Bạn chưa nộp bài báo nào.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderAdminDashboard = () => {
    const pendingArticles = dashboardData?.pending_articles || [];
    const reviewedArticles = dashboardData?.reviewed_articles || []; 
    const stats = dashboardData?.stats || { total: 0, published: 0, rejected: 0, pending: 0 };

    return (
      <div className="animate-fade-in flex flex-col gap-6 relative">
        {/* CỤM NÚT TAB CỦA ADMIN */}
        <div className="flex flex-wrap gap-4 border-b border-gray-200">
          <button onClick={() => setActiveTab('overview')} className={`pb-3 px-2 font-bold cursor-pointer transition ${activeTab === 'overview' ? 'text-[#579799] border-b-2 border-[#579799]' : 'text-gray-500 hover:text-gray-700'}`}>Sơ duyệt & Phân công</button>
          <button onClick={() => setActiveTab('categories')} className={`pb-3 px-2 font-bold cursor-pointer transition ${activeTab === 'categories' ? 'text-[#579799] border-b-2 border-[#579799]' : 'text-gray-500 hover:text-gray-700'}`}>Cấu hình Danh mục</button>
          <button onClick={() => setActiveTab('final')} className={`pb-3 px-2 font-bold cursor-pointer transition ${activeTab === 'final' ? 'text-[#579799] border-b-2 border-[#579799]' : 'text-gray-500 hover:text-gray-700'}`}>Quyết định Xuất bản & Khóa bài</button>
          <button onClick={() => setActiveTab('users')} className={`pb-3 px-2 font-bold cursor-pointer transition ${activeTab === 'users' ? 'text-[#579799] border-b-2 border-[#579799]' : 'text-gray-500 hover:text-gray-700'}`}>Quản lý Người dùng</button>
          <button 
            onClick={() => setActiveTab('analytics')} 
            className={`pb-3 px-2 font-bold cursor-pointer flex items-center gap-1.5 transition ${activeTab === 'analytics' ? 'text-[#579799] border-b-2 border-[#579799]' : 'text-gray-500 hover:text-gray-700'}`}
          >
            <span>Thống kê & Báo cáo</span>
          </button>
        </div>

        <div className="mt-4">
          {activeTab === 'overview' && (
            <div className="bg-white rounded-xl shadow-sm border border-[#9BBFBA] overflow-hidden">
              <table className="w-full text-left border-collapse table-auto">
                <thead>
                  <tr className="bg-[#F6F7F0] text-[#579799] text-sm uppercase">
                    <th className="p-4 font-bold">Bài báo mới nộp</th>
                    <th className="p-4 font-bold text-center w-36 whitespace-nowrap">Bản thảo</th>
                    <th className="p-4 font-bold text-center w-52 whitespace-nowrap">Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingArticles.map(article => (
                    <tr key={article.id} className="border-b border-gray-100 hover:bg-[#FAFBFA] transition">
                      <td className="p-4 font-bold text-gray-700">
                        {article.title} <br/>
                        <span className="text-xs font-normal text-gray-500">Tác giả: {article.user?.name}</span>
                      </td>
                      <td className="p-4 text-center w-36 whitespace-nowrap">
                        {article.file_path ? <a href={getFileUrl(article.file_path)} target="_blank" rel="noreferrer" className="text-blue-600 text-sm font-bold hover:underline">Xem File</a> : '-'}
                      </td>
                      <td className="p-4 text-center w-52 whitespace-nowrap">
                        <div className="flex justify-center gap-2">
                          <button onClick={() => openInviteModal(article)} className="bg-[#579799] text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-teal-700 cursor-pointer shadow-sm">Mời Reviewer</button>
                          <button onClick={() => handleDeskReject(article.id)} className="bg-red-50 text-red-600 border border-red-200 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-red-100 cursor-pointer">Reject</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {pendingArticles.length === 0 && <tr><td colSpan="3" className="p-8 text-center text-gray-400">Không có bài báo chờ duyệt.</td></tr>}
                </tbody>
              </table>
            </div>
          )}

          {/* TAB CẤU HÌNH DANH MỤC: ĐÃ GỠ BỎ HOÀN TOÀN PHẦN THỐNG KÊ THỪA THÃI */}
          {activeTab === 'categories' && <div className="w-full"><CategoryManagement categories={categories} /></div>}

          {activeTab === 'final' && (() => {
            // Khai báo state tìm kiếm riêng cho tab này (hoặc đặt ở đầu component Workspace)
            // Nếu chưa có state, bạn có thể tạo: const [finalSearch, setFinalSearch] = useState('');
            const filteredFinalArticles = reviewedArticles.filter(article => {
              const title = (article.title || '').toLowerCase();
              const reviewer = (article.reviewer_name || '').toLowerCase();
              const query = (finalSearch || '').toLowerCase();
              return title.includes(query) || reviewer.includes(query);
            });

            return (
              <div className="flex flex-col gap-4">
                {/* THANH TÌM KIẾM RIÊNG CHO TAB XUẤT BẢN */}
                <div className="flex justify-between items-center bg-[#F6F7F0] p-4 rounded-xl border border-[#E5E9DF]">
                  <div className="relative w-full max-w-md">
                    <input
                      type="text"
                      placeholder="Tìm kiếm theo tiêu đề bài báo hoặc tên Reviewer..."
                      value={finalSearch}
                      onChange={(e) => setFinalSearch(e.target.value)}
                      className="w-full bg-white border border-[#9BBFBA] rounded-xl py-2 pl-4 pr-10 text-sm focus:outline-none focus:border-[#579799]"
                    />
                    <svg className="w-4 h-4 text-gray-400 absolute right-3.5 top-1/2 transform -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                    </svg>
                  </div>
                  <span className="text-xs font-bold text-[#579799]">
                    Hiển thị: {filteredFinalArticles.length} / {reviewedArticles.length} bài
                  </span>
                </div>

                {/* BẢNG DANH SÁCH BÀI BÁO */}
                <div className="bg-white rounded-xl shadow-sm border border-[#9BBFBA] overflow-hidden">
                  <table className="w-full text-left border-collapse table-auto">
                    <thead>
                      <tr className="bg-[#F6F7F0] text-[#579799] text-sm uppercase">
                        <th className="p-4 font-bold">Tên bài báo</th>
                        <th className="p-4 font-bold text-center w-48 whitespace-nowrap">Trạng thái</th>
                        <th className="p-4 font-bold text-center w-64 whitespace-nowrap">Thao tác Quản trị</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredFinalArticles.map(article => (
                        <tr key={article.id} className="border-b border-gray-100 hover:bg-[#FAFBFA] transition">
                          <td className="p-4 font-bold text-gray-700 pr-6">
                            {article.title}
                            <p className="text-xs font-normal text-gray-400 mt-0.5">Chuyên mục: {getCategoryName(article.category_id)}</p>

                            {article.review_comment && (
                              <div className="mt-2.5 p-2.5 bg-amber-50/90 border border-amber-200 rounded-xl text-xs flex flex-col gap-1 shadow-sm">
                                <div className="flex items-center gap-1.5 text-amber-800 font-extrabold uppercase text-[10px]">
                                  <span>Đánh giá từ Reviewer ({article.reviewer_name || 'Reviewer'}):</span>
                                </div>
                                <p className="text-800 italic font-medium text-xs text-gray-800">
                                  "{article.review_comment}"
                                </p>
                              </div>
                            )}
                          </td>
                          <td className="p-4 text-center w-48 whitespace-nowrap">
                            {renderStatusBadge(article.status)}
                          </td>
                          <td className="p-4 font-bold text-center w-64 whitespace-nowrap">
                            <div className="flex items-center justify-center gap-2">
                              {article.status === 'accepted' && (
                                <button onClick={() => handlePublish(article.id)} className="bg-green-600 text-white px-3.5 py-1.5 rounded-lg text-xs font-bold hover:bg-green-700 shadow-sm transition cursor-pointer">
                                  Xuất bản ngay
                                </button>
                              )}

                              {article.status === 'published' && (
                                <button onClick={() => handleLockArticle(article.id)} className="bg-amber-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-amber-700 shadow-sm transition flex items-center gap-1 cursor-pointer">
                                  🔒 Khóa bài báo
                                </button>
                              )}

                              {article.status === 'locked' && (
                                <button onClick={() => handleUnlockArticle(article.id)} className="bg-teal-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-teal-700 shadow-sm transition flex items-center gap-1 cursor-pointer">
                                  🔓 Mở khóa
                                </button>
                              )}

                              <button onClick={() => viewAuthorDetails(article)} className="bg-gray-100 text-gray-700 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-gray-200 transition cursor-pointer">
                                Xem bài
                              </button>

                              <button onClick={() => handleDeleteArticle(article.id)} className="bg-red-50 text-red-600 border border-red-200 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-red-500 hover:text-white transition cursor-pointer">
                                Xóa
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {filteredFinalArticles.length === 0 && (
                        <tr>
                          <td colSpan="3" className="p-8 text-center text-gray-400">Không tìm thấy bài báo nào phù hợp.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })()}

          {activeTab === 'users' && <div className="-mt-8"><UserManagement /></div>}

          {/* RENDER TAB THỐNG KÊ & BIỂU ĐỒ TRỰC QUAN */}
          {activeTab === 'analytics' && (
            <div className="w-full mt-2">
              <AdminAnalyticsChart 
                articles={dashboardData?.all_articles || dashboardData?.articles || [...(dashboardData?.pending_articles || []), ...(dashboardData?.reviewed_articles || [])].filter((v,i,a)=>a.findIndex(t=>(t.id === v.id))===i)} 
                categories={categories || []} 
              />
            </div>
          )}
        </div>

        {showInviteModal && selectedArticle && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-white bg-opacity-80 backdrop-blur-sm">
            <div className="bg-white p-6 rounded-2xl shadow-xl w-full max-w-md border border-[#9BBFBA]">
              <h3 className="text-xl font-bold text-[#579799] mb-4">Giao phó Thẩm định</h3>
              <form onSubmit={submitAssignReviewer} className="flex flex-col gap-4">
                <select required className="w-full border border-[#9BBFBA] rounded-lg p-2.5" value={assignData.reviewer_id} onChange={(e) => setAssignData({...assignData, reviewer_id: e.target.value})}>
                  <option value="">-- Chọn người duyệt --</option>
                  {reviewers.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                </select>
                <input required type="date" className="w-full border border-[#9BBFBA] rounded-lg p-2.5" value={assignData.deadline} onChange={(e) => setAssignData({...assignData, deadline: e.target.value})} />
                <div className="flex justify-end gap-3 mt-4">
                  <button type="button" onClick={() => setShowInviteModal(false)} className="px-4 py-2 text-gray-500 font-bold hover:bg-gray-100 rounded-lg">Hủy bỏ</button>
                  <button type="submit" className="bg-[#579799] text-white px-5 py-2 rounded-lg font-bold hover:bg-teal-700">Giao việc</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderReviewerDashboard = () => {
    const assignedReviews = dashboardData?.assigned_reviews || [];
    return (
      <div className="animate-fade-in flex flex-col gap-6 relative">
        <h2 className="text-2xl font-extrabold text-[#579799] border-b-2 border-[#AACBCA] pb-4">Khu vực Thẩm định chuyên môn</h2>
        <div className="bg-white rounded-xl shadow-sm border border-[#9BBFBA] overflow-hidden">
          <table className="w-full text-left border-collapse table-auto">
            <thead>
              <tr className="bg-[#F6F7F0] text-[#579799] text-sm uppercase">
                <th className="p-4 font-bold">Tiêu đề (Ẩn danh)</th>
                <th className="p-4 font-bold text-center w-36 whitespace-nowrap">Bản thảo</th>
                <th className="p-4 font-bold text-center w-52 whitespace-nowrap">Hành động</th>
              </tr>
            </thead>
            <tbody>
              {assignedReviews.map(review => (
                <tr key={review.id} className="border-b border-gray-100 hover:bg-[#FAFBFA] transition">
                  <td className="p-4 font-bold text-gray-700 pr-6">
                    {review.article?.title} <br/>
                    <span className="text-xs text-red-500">Hạn: {new Date(review.deadline).toLocaleDateString()}</span>
                  </td>
                  <td className="p-4 text-center w-36 whitespace-nowrap">
                    {review.article?.file_path ? <a href={getFileUrl(review.article?.file_path)} target="_blank" rel="noreferrer" className="text-blue-600 text-sm font-bold hover:underline">Đọc File PDF</a> : '-'}
                  </td>
                  
                  <td className="p-4 text-center w-52 whitespace-nowrap">
                    <div className="flex items-center justify-center gap-2">
                      <button 
                        onClick={() => viewAuthorDetails(review.article)} 
                        className="bg-gray-100 text-gray-700 px-3 py-1.5 rounded-lg text-sm font-bold hover:bg-gray-200 transition cursor-pointer"
                      >
                        Xem bài
                      </button>
                      
                      <button 
                        onClick={() => handleOpenReview(review)} 
                        className="bg-[#579799] text-white px-3 py-1.5 rounded-lg text-sm font-bold hover:bg-teal-700 transition cursor-pointer"
                      >
                        {review.status === 'pending' ? 'Thẩm định' : 'Sửa đánh giá'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {assignedReviews.length === 0 && (
                <tr>
                  <td colSpan="3" className="p-8 text-center text-gray-400">Không có bài phản biện nào được phân công.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {showReviewModal && currentReview && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-white bg-opacity-80 backdrop-blur-sm">
            <div className="bg-white p-6 rounded-2xl shadow-xl w-full max-w-2xl border border-[#9BBFBA]">
              <h3 className="text-xl font-bold text-[#579799] mb-4 border-b pb-2">Báo cáo Thẩm định Chuyên môn</h3>
              <form onSubmit={submitReviewScore} className="flex flex-col gap-5">
                <textarea required rows="6" placeholder="Nhận xét chi tiết (Ưu/Nhược điểm, các lỗi cần sửa)..." className="w-full border border-[#9BBFBA] rounded-lg p-3" value={reviewData.comments} onChange={(e) => setReviewData({...reviewData, comments: e.target.value})} disabled={currentReview.status === 'submitted'}></textarea>
                <select className="w-full border border-[#9BBFBA] rounded-lg p-3 font-medium" value={reviewData.decision} onChange={(e) => setReviewData({...reviewData, decision: e.target.value})} disabled={currentReview.status === 'submitted'}>
                  <option value="">-- Lựa chọn quyết định --</option>
                  <option value="accept">✅ Chấp nhận xuất bản (Accept)</option>
                  <option value="revision">⚠️ Cần chỉnh sửa (Revision)</option>
                  <option value="reject">❌ Từ chối bài viết (Reject)</option>
                </select>
                <div className="flex justify-end gap-3 mt-4">
                  <button type="button" onClick={() => setShowReviewModal(false)} className="px-5 py-2 text-gray-500 font-bold hover:bg-gray-100 rounded-lg cursor-pointer">Đóng</button>
                  {currentReview.status !== 'submitted' && <button type="submit" className="bg-[#579799] text-white px-6 py-2 rounded-lg font-bold hover:bg-teal-700 cursor-pointer">Gửi Báo Cáo</button>}
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="mt-8 relative">
      {(forceAuthorView || user.role === 'user') && renderAuthorDashboard()}
      {(!forceAuthorView && user.role === 'moderator') && renderReviewerDashboard()}
      {(!forceAuthorView && user.role === 'admin') && renderAdminDashboard()}

      {editingArticle && (
        <EditArticleModal 
          article={editingArticle} 
          categories={categories} 
          onClose={() => setEditingArticle(null)} 
          onRefresh={fetchDashboardData} 
        />
      )}

      {showDetailModal && detailArticle && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl relative flex flex-col max-h-[90vh] overflow-hidden border border-[#9BBFBA]">
            
            <div className="bg-[#579799] px-6 py-4 flex justify-between items-center flex-shrink-0">
              <h3 className="text-xl font-black text-white uppercase tracking-wide">Chi tiết bài báo</h3>
              <button 
                onClick={() => setShowDetailModal(false)} 
                className="text-white hover:text-red-200 font-bold text-2xl transition cursor-pointer"
              >
                &times;
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto custom-scroll bg-[#F6F7F0] flex flex-col gap-4">
              <div>
                <p className="text-xs text-gray-400 font-bold uppercase mb-1">Tiêu đề bài báo:</p>
                <h2 className="text-2xl font-extrabold text-[#2F5253] leading-snug">{detailArticle.title}</h2>
              </div>

              <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
                <p className="text-xs text-gray-400 font-bold uppercase mb-3 border-b pb-2">Nội dung chi tiết:</p>
                {renderFormattedContent(detailArticle)}
              </div>

              <div className="flex flex-col gap-3 bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs text-gray-400 font-bold uppercase block mb-1">Trạng thái:</span>
                    {renderStatusBadge(detailArticle.status)}
                  </div>
                  {detailArticle.file_path && (
                    <div>
                      <span className="text-xs text-gray-400 font-bold uppercase block mb-1">Bản thảo gốc:</span>
                      <a href={getFileUrl(detailArticle.file_path)} target="_blank" rel="noreferrer" className="text-blue-600 font-bold hover:underline text-sm flex items-center gap-1">
                        📥 Tải file PDF/Word
                      </a>
                    </div>
                  )}
                </div>

                {detailArticle.review_comment && (
                  <div className="mt-2 pt-3 border-t border-dashed border-gray-200">
                    <span className="text-xs text-amber-800 font-extrabold uppercase block mb-1">
                      Đánh giá từ Reviewer ({detailArticle.reviewer_name || 'Reviewer'}):
                    </span>
                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-sm text-gray-800 italic font-medium">
                      "{detailArticle.review_comment}"
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="border-t border-gray-200 bg-white p-4 flex justify-end flex-shrink-0">
              <button 
                onClick={() => setShowDetailModal(false)} 
                className="bg-gray-100 text-gray-700 px-6 py-2.5 rounded-xl font-bold hover:bg-gray-200 transition cursor-pointer"
              >
                Đóng
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}