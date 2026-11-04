import { useState } from 'react';
import axios from 'axios';
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';
import { jwtDecode } from "jwt-decode";

// Client ID Google OAuth
const GOOGLE_CLIENT_ID = "140340634970-frv8rnc371tshpjton2frpt0iogdmuag.apps.googleusercontent.com"; 

export default function AuthModal({ initialMode, onClose, onLogin, onRegister }) {
  const [mode, setMode] = useState(initialMode || 'login'); 
  const [isLoading, setIsLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    password_confirmation: '',
    role: 'user'
  });

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = (e) => {
    e.preventDefault();

    if (mode === 'login') {
      onLogin({ email: formData.email, password: formData.password });
    } 
    else if (mode === 'register') {
      if (formData.password !== formData.password_confirmation) {
        alert("Mật khẩu nhập lại không khớp!");
        return;
      }

      setIsLoading(true);

      const registerPayload = {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        password_confirmation: formData.password_confirmation,
        role: 'user'
      };

      axios.post('http://127.0.0.1:8000/api/register', registerPayload)
        .then(res => {
          setIsLoading(false);
          alert("Đăng ký tài khoản thành công! Vui lòng đăng nhập.");
          setMode('login');
          setFormData(prev => ({ ...prev, password: '', password_confirmation: '' }));
        })
        .catch(err => {
          setIsLoading(false);
          console.error(err);
          const errorMsg = err.response?.data?.message || "Lỗi khi đăng ký tài khoản!";
          alert(errorMsg);
        });
    } 
    // 3. XỬ LÝ QUÊN MẬT KHẨU
    else if (mode === 'forgot') {
      setIsLoading(true);
      axios.post('http://127.0.0.1:8000/api/forgot-password', { email: formData.email })
        .then(res => {
          setIsLoading(false);
          alert(res.data.message);
          setMode('login');
        })
        .catch(err => {
          setIsLoading(false);
          alert(err.response?.data?.message || "Lỗi xử lý!");
        });
    }
  };

  const handleGoogleSuccess = (credentialResponse) => {
    const decoded = jwtDecode(credentialResponse.credential);

    axios.post('http://127.0.0.1:8000/api/google-login', {
      email: decoded.email,
      name: decoded.name,
      google_id: decoded.sub
    })
    .then(res => {
      onLogin(null, res.data.user); 
    })
    .catch(err => alert("Lỗi kết nối Google: " + err));
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
      <div className="w-full max-w-[420px] bg-[#F6F7F0] rounded-2xl shadow-2xl relative overflow-hidden flex flex-col border border-[#9BBFBA]">
        
        {/* Nút X đóng popup */}
        <button 
          onClick={onClose} 
          className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-gray-200 text-gray-600 hover:bg-red-100 hover:text-red-500 font-bold transition z-10 cursor-pointer"
        >
          ✕
        </button>
        
        <div className="p-8 pb-6 flex flex-col items-center">
          <h2 className="text-2xl font-extrabold text-[#579799] mb-1">
            {mode === 'login' ? 'Chào mừng trở lại!' : (mode === 'register' ? 'Tạo tài khoản' : 'Khôi phục mật khẩu')}
          </h2>
          <p className="text-gray-500 text-sm mb-6 text-center">
            {mode === 'login' ? 'Đăng nhập để truy cập kho tài liệu' : (mode === 'register' ? 'Tham gia hệ thống quản lý bài báo khoa học' : 'Nhập email để nhận mật khẩu mới')}
          </p>

          <form onSubmit={handleSubmit} className="w-full flex flex-col gap-4">
            {mode === 'register' && (
              <div>
                <label className="block text-gray-700 text-sm font-bold mb-1">Họ và Tên</label>
                <input 
                  type="text" 
                  name="name" 
                  value={formData.name} 
                  onChange={handleChange} 
                  required 
                  placeholder="Nhập họ và tên..."
                  className="w-full border border-gray-300 rounded-lg py-2.5 px-3 focus:outline-none focus:border-[#579799] bg-white text-gray-800" 
                />
              </div>
            )}

            <div>
              <label className="block text-gray-700 text-sm font-bold mb-1">Email {mode === 'login' ? 'đăng nhập' : ''}</label>
              <input 
                type="email" 
                name="email" 
                value={formData.email} 
                onChange={handleChange} 
                required 
                placeholder="example@gmail.com"
                className="w-full border border-gray-300 rounded-lg py-2.5 px-3 focus:outline-none focus:border-[#579799] bg-white text-gray-800" 
              />
            </div>

            {mode !== 'forgot' && (
              <>
                <div>
                  <label className="block text-gray-700 text-sm font-bold mb-1">Mật khẩu</label>
                  <input 
                    type="password" 
                    name="password" 
                    value={formData.password} 
                    onChange={handleChange} 
                    required 
                    placeholder="••••••••"
                    className="w-full border border-gray-300 rounded-lg py-2.5 px-3 focus:outline-none focus:border-[#579799] bg-white text-gray-800" 
                  />
                </div>
                {mode === 'register' && (
                  <div>
                    <label className="block text-gray-700 text-sm font-bold mb-1">Nhập lại mật khẩu</label>
                    <input 
                      type="password" 
                      name="password_confirmation" 
                      value={formData.password_confirmation} 
                      onChange={handleChange} 
                      required 
                      placeholder="••••••••"
                      className="w-full border border-gray-300 rounded-lg py-2.5 px-3 focus:outline-none focus:border-[#579799] bg-white text-gray-800" 
                    />
                  </div>
                )}
              </>
            )}

            {mode === 'login' && (
              <div className="flex justify-between items-center mt-1">
                <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                  <input type="checkbox" className="rounded text-[#579799] focus:ring-[#579799]" />
                  Ghi nhớ tôi
                </label>
                <button type="button" onClick={() => setMode('forgot')} className="text-sm text-[#579799] hover:underline font-medium cursor-pointer">
                  Quên mật khẩu?
                </button>
              </div>
            )}

            <button 
              type="submit" 
              disabled={isLoading}
              className="w-full bg-[#579799] text-white font-bold py-2.5 rounded-lg hover:bg-teal-700 transition mt-2 shadow-md cursor-pointer disabled:opacity-60"
            >
              {isLoading ? 'Đang xử lý...' : (mode === 'login' ? 'Đăng nhập' : (mode === 'register' ? 'Đăng ký tài khoản' : 'Gửi yêu cầu khôi phục'))}
            </button>
          </form>
          
          {mode !== 'forgot' && (
            <>
              <div className="w-full flex items-center gap-4 my-6">
                <div className="flex-1 h-px bg-gray-300"></div>
                <span className="text-sm text-gray-400">Hoặc tiếp tục với</span>
                <div className="flex-1 h-px bg-gray-300"></div>
              </div>
              <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
                <div className="w-full flex justify-center">
                  <GoogleLogin 
                    onSuccess={handleGoogleSuccess}
                    onError={() => alert('Đăng nhập Google thất bại')}
                    useOneTap
                    shape="rectangular"
                    theme="outline"
                  />
                </div>
              </GoogleOAuthProvider>
            </>
          )}
        </div>

        <div className="bg-[#EBECE1] py-4 text-center border-t border-gray-200">
          <p className="text-sm text-gray-600">
            {mode === 'login' || mode === 'forgot' ? "Chưa có tài khoản? " : "Đã có tài khoản? "}
            <button 
              type="button"
              onClick={() => setMode(mode === 'login' || mode === 'forgot' ? 'register' : 'login')} 
              className="text-[#579799] font-bold hover:underline cursor-pointer ml-1"
            >
              {mode === 'login' || mode === 'forgot' ? 'Đăng ký ngay' : 'Đăng nhập'}
            </button>
          </p>
        </div>

      </div>
    </div>
  );
}