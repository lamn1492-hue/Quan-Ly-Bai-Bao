import { useEffect, useState } from 'react';
import axios from 'axios';
import Home from './components/Home';
import Navbar from './components/Navbar';
import AuthModal from './components/AuthModal';
import ArticleForm from './components/ArticleForm';
import ArticleList from './components/ArticleList';
import './index.css';
import ProfileModal from './components/ProfileModal';
import UserManagement from './components/UserManagement';
import Workspace from './components/Workspace';
import Profile from './components/Profile';
import AuthorList from './components/AuthorList';
import ChatWidget from './components/ChatWidget';
import PersonalPage from './components/PersonalPage';

export default function App() {
  const [articles, setArticles] = useState([]);
  const [categories, setCategories] = useState([]);
  const [formData, setFormData] = useState({ title: '', author: '', abstract: '', category_id: '', journal: '' });
  const [file, setFile] = useState(null);
  const [editId, setEditId] = useState(null);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showWeatherDashboard, setShowWeatherDashboard] = useState(false);

  const [selectedArticle, setSelectedArticle] = useState(null);

  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('user_session');
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [viewingUser, setViewingUser] = useState(null);
  const [authMode, setAuthMode] = useState(null); 
  const [showProfile, setShowProfile] = useState(false);

  const [currentView, setCurrentView] = useState('home');

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const articleId = urlParams.get('article_id');
    if (articleId) {
      axios.get(`http://127.0.0.1:8000/api/articles/${articleId}`)
        .then(res => {
          setSelectedArticle(res.data);
          setCurrentView('home');
        })
        .catch(err => console.error("Lỗi lấy bài viết từ URL:", err));
    }
  }, []);

  const handleLogin = (credentials, googleUser = null) => {
    if (googleUser) {
      setUser(googleUser);
      localStorage.setItem('user_session', JSON.stringify(googleUser));
      setAuthMode(null);
      alert("Đăng nhập bằng Google thành công!");
      return;
    }

    axios.post('http://127.0.0.1:8000/api/login', credentials, {
      headers: { 'Accept': 'application/json' }
    })
      .then(res => {
        setUser(res.data.user); 
        localStorage.setItem('user_session', JSON.stringify(res.data.user));
        setAuthMode(null); 
        alert("Đăng nhập thành công!");
      })
      .catch(err => {
        alert("Đăng nhập thất bại: Sai email hoặc mật khẩu.");
      });
  };

  const handleRegister = (data) => {
    axios.post('http://127.0.0.1:8000/api/register', data, {
      headers: { 'Accept': 'application/json' }
    })
      .then(res => {
        setUser(res.data.user); 
        localStorage.setItem('user_session', JSON.stringify(res.data.user));
        setAuthMode(null);
        alert("Đăng ký thành công!");
      })
      .catch(err => {
        alert(err.response?.data?.message || "Đăng ký thất bại.");
      });
  };

  useEffect(() => {
    axios.get('http://127.0.0.1:8000/api/categories')
      .then(res => setCategories(res.data))
      .catch(err => console.error("Lỗi lấy danh mục:", err));
  }, []);

  useEffect(() => {
    fetchArticles(currentPage, searchTerm, filterCategory);
  }, [currentPage, searchTerm, filterCategory]);

  const fetchArticles = (page, search, category) => {
    axios.get(`http://127.0.0.1:8000/api/articles?page=${page}&search=${search}&category_id=${category}`)
      .then(response => {
        const list = Array.isArray(response.data) ? response.data : (response.data.data || []);
        setArticles(list); 
        setCurrentPage(response.data.current_page || 1);
        setTotalPages(response.data.last_page || 1);
      }).catch(error => console.error("Lỗi lấy dữ liệu:", error));
  };

  const handleCancel = () => {
    setEditId(null);
    setFormData({ title: '', author: '', abstract: '', category_id: '', journal: '' });
    setFile(null);
    if (document.getElementById('fileInput')) document.getElementById('fileInput').value = '';
  };

  const handleSelectArticle = (article) => {
    setSelectedArticle(article);
    setCurrentView('home');
  };
 
  const handleOpenArticleFromNotif = (articleId) => {
    if (!articleId) {
      alert("Thông báo này là thông báo cũ, không chứa dữ liệu bài báo!");
      return;
    }

    axios.get('http://127.0.0.1:8000/api/workspace/published-articles')
      .then(res => {
        const responseData = res.data;
        const articlesList = Array.isArray(responseData) ? responseData : (responseData.data || []);
        
        const targetArticle = articlesList.find(a => String(a.id) === String(articleId));
        
        if (targetArticle) {
          targetArticle.autoScrollToComments = true; 
          setSelectedArticle(targetArticle); 
          setCurrentView('home'); 
          window.scrollTo({ top: 0, behavior: 'smooth' });
        } else {
          alert("Bài báo này có thể đã bị xóa hoặc chưa được xuất bản công khai!");
        }
      })
      .catch(err => console.error("Lỗi khi mở bài viết từ thông báo:", err));
  };

  return (
    <div className="min-h-screen bg-[#FAFBFA] font-sans relative">
      
      {authMode && (
        <AuthModal initialMode={authMode} onClose={() => setAuthMode(null)} onLogin={handleLogin} onRegister={handleRegister} />
      )}

      {showProfile && user && (
        <ProfileModal 
          user={user} 
          onClose={() => setShowProfile(false)} 
          onUpdateSuccess={(updatedUser) => { 
            setUser(updatedUser); 
            if (viewingUser && viewingUser.id === updatedUser.id) {
              setViewingUser(updatedUser);
            }
            setShowProfile(false); 
          }} 
        />
      )}
      
      {/* NAVBAR TRUYỀN ĐỦ PROPS */}
      <Navbar 
        searchTerm={searchTerm} setSearchTerm={setSearchTerm} setCurrentPage={setCurrentPage} 
        setAuthMode={setAuthMode} user={user} setUser={setUser} 
        setShowProfile={setShowProfile}
        setCurrentView={setCurrentView} 
        categories={categories}
        filterCategory={filterCategory}
        setFilterCategory={setFilterCategory}
        setViewingUser={setViewingUser} 
        onOpenArticleFromNotif={handleOpenArticleFromNotif}
        showWeatherDashboard={showWeatherDashboard}
        setShowWeatherDashboard={setShowWeatherDashboard}
      />

      <div className="max-w-6xl mx-auto px-8 pb-12">
        
        {currentView === 'home' && (
          <div className="animate-fade-in">
            <Home 
              user={user} 
              categories={categories} 
              searchTerm={searchTerm} 
              setSearchTerm={setSearchTerm}
              filterCategory={filterCategory} 
              setFilterCategory={setFilterCategory}
              showWeatherDashboard={showWeatherDashboard}
              setShowWeatherDashboard={setShowWeatherDashboard}
              selectedArticle={selectedArticle}
              setSelectedArticle={setSelectedArticle}
            />
          </div>
        )}

        {currentView === 'manage' && user && (
          <Workspace user={user} categories={categories} />
        )}

        {currentView === 'profile' && user && (
          <Profile user={user} />
        )}

        {currentView === 'submit_article' && user && (
          <Workspace user={user} categories={categories} forceAuthorView={true} />
        )}

        {currentView === 'authors' && (
          <div className="animate-fade-in">
            <AuthorList setCurrentView={setCurrentView} setViewingUser={setViewingUser} />
          </div>
        )}

      </div>
      
      {(currentView === 'personal_page' || currentView === 'personal') && viewingUser && (
        <PersonalPage 
          viewingUser={viewingUser} 
          user={user} 
          setUser={setUser} 
          setViewingUser={setViewingUser}
          setCurrentView={setCurrentView}
          setSelectedArticle={setSelectedArticle}
          onSelectArticle={handleSelectArticle}
        />
      )}
      
      <ChatWidget currentUser={user} />
      
    </div>
  );
}