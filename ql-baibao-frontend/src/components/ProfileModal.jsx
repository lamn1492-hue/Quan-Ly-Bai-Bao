import { useState, useRef } from 'react';
import axios from 'axios';

export default function ProfileModal({ user, onClose, onUpdateSuccess }) {
  const fileInputRef = useRef(null);
  
  const [formData, setFormData] = useState({
    name: user.name || '',
    email: user.email || '',
    phone: user.phone || '',
    bio: user.bio || '',
    current_password: '',
    new_password: '',
    new_password_confirmation: ''
  });

  const [avatarPreview, setAvatarPreview] = useState(
    user?.avatar ? `http://127.0.0.1:8000/storage/${user.avatar}` : null
  );
  const [avatarFile, setAvatarFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleAvatarSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (formData.new_password) {
      if (formData.new_password !== formData.new_password_confirmation) {
        alert("Xác nhận mật khẩu mới không khớp!");
        return;
      }
      if (!formData.current_password && !user.google_id) {
        alert("Vui lòng nhập mật khẩu hiện tại để đổi mật khẩu mới!");
        return;
      }
    }

    setIsSubmitting(true);

    const data = new FormData();
    data.append('name', formData.name);
    data.append('email', formData.email);
    data.append('phone', formData.phone);
    data.append('bio', formData.bio);
    if (formData.current_password) data.append('current_password', formData.current_password);
    if (formData.new_password) data.append('new_password', formData.new_password);
    if (formData.new_password_confirmation) data.append('new_password_confirmation', formData.new_password_confirmation);
    
    if (avatarFile) {
      data.append('avatar', avatarFile);
    }

    axios.post(`http://127.0.0.1:8000/api/users/${user.id}/personal-page`, data, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
      .then(res => {
        alert("Cập nhật thông tin thành công!");
        setIsSubmitting(false);
        onUpdateSuccess(res.data.user);
      })
      .catch(err => {
        setIsSubmitting(false);
        alert(err.response?.data?.message || "Lỗi cập nhật. Vui lòng kiểm tra lại!");
      });
  };

  return (
    <div className="fixed inset-0 z-[100] overflow-y-auto bg-white bg-opacity-80 backdrop-blur-md">
      <div className="flex min-h-full items-center justify-center p-4 py-10">
        <div className="w-full max-w-[500px] shadow-2xl rounded-2xl overflow-hidden flex flex-col bg-white border border-[#9BBFBA]">
          
          <div className="bg-[#F6F7F0] px-6 py-4 flex justify-between items-center border-b border-[#E5E9DF]">
            <h2 className="text-xl font-extrabold text-[#579799]">Cài đặt tài khoản</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-red-500 font-bold text-2xl leading-none transition cursor-pointer">&times;</button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-6">
            
            {/* THAY ĐỔI ẢNH ĐẠI DIỆN */}
            <div className="flex flex-col items-center gap-2 pb-2">
              <div 
                onClick={() => fileInputRef.current?.click()} 
                className="relative w-24 h-24 rounded-full overflow-hidden border-4 border-[#579799] shadow-md group cursor-pointer bg-gray-50 flex items-center justify-center"
                title="Nhấn để đổi ảnh đại diện"
              >
                {avatarPreview ? (
                  <img src={avatarPreview} alt="Avatar Preview" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-[#E5E9DF] text-[#579799] font-black text-3xl flex items-center justify-center">
                    {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                  </div>
                )}
                <div className="absolute inset-0 bg-black/40 text-white text-[11px] font-bold flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                  Đổi ảnh
                </div>
              </div>
              <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleAvatarSelect} />
              <span className="text-xs text-gray-500 font-medium">Bấm vào hình tròn để tải ảnh đại diện</span>
            </div>

            {/* THÔNG TIN CHUNG */}
            <div>
              <h3 className="text-[#579799] font-bold mb-4 border-l-4 border-[#579799] pl-2">1. Thông tin chung</h3>
              <div className="flex flex-col gap-4">
                <div>
                  <label className="block text-gray-700 text-sm font-semibold mb-1">Tên hiển thị</label>
                  <input type="text" name="name" value={formData.name} onChange={handleChange} required className="w-full border border-gray-300 rounded-lg py-2 px-3 focus:outline-none focus:border-[#579799] focus:ring-1 focus:ring-[#579799] bg-white transition" />
                </div>
                <div>
                  <label className="block text-gray-700 text-sm font-semibold mb-1">Tiểu sử (Bio)</label>
                  <textarea rows="2" name="bio" value={formData.bio} onChange={handleChange} placeholder="Viết vài dòng về bạn..." className="w-full border border-gray-300 rounded-lg py-2 px-3 focus:outline-none focus:border-[#579799] focus:ring-1 focus:ring-[#579799] bg-white transition" />
                </div>
                <div>
                  <label className="block text-gray-700 text-sm font-semibold mb-1">Email đăng nhập</label>
                  <input type="email" name="email" value={formData.email} onChange={handleChange} required className="w-full border border-gray-300 rounded-lg py-2 px-3 focus:outline-none focus:border-[#579799] focus:ring-1 focus:ring-[#579799] bg-white transition" />
                </div>
                <div>
                  <label className="block text-gray-700 text-sm font-semibold mb-1">Số điện thoại</label>
                  <input type="text" name="phone" value={formData.phone} onChange={handleChange} className="w-full border border-gray-300 rounded-lg py-2 px-3 focus:outline-none focus:border-[#579799] focus:ring-1 focus:ring-[#579799] bg-white transition" />
                </div>
              </div>
            </div>

            {/* ĐỔI MẬT KHẨU */}
            <div>
              <h3 className="text-red-500 font-bold mb-4 border-l-4 border-red-500 pl-2">
                2. Đổi mật khẩu <span className="text-sm font-normal text-gray-500">(Bỏ trống nếu không đổi)</span>
              </h3>
              <div className="flex flex-col gap-4">
                <div>
                  <input type="password" name="current_password" value={formData.current_password} onChange={handleChange} placeholder="Mật khẩu hiện tại..." className="w-full border border-gray-300 rounded-lg py-2 px-3 focus:outline-none focus:border-red-400 focus:ring-1 focus:ring-red-400 bg-white transition" />
                </div>
                <div>
                  <input type="password" name="new_password" value={formData.new_password} onChange={handleChange} placeholder="Mật khẩu mới..." className="w-full border border-gray-300 rounded-lg py-2 px-3 focus:outline-none focus:border-[#579799] focus:ring-1 focus:ring-[#579799] bg-white transition" />
                </div>
                <div>
                  <input type="password" name="new_password_confirmation" value={formData.new_password_confirmation} onChange={handleChange} placeholder="Xác nhận lại..." className="w-full border border-gray-300 rounded-lg py-2 px-3 focus:outline-none focus:border-[#579799] focus:ring-1 focus:ring-[#579799] bg-white transition" />
                </div>
              </div>
            </div>

            <div className="flex justify-end mt-2 pt-4 border-t border-gray-100">
              <button type="submit" disabled={isSubmitting} className="bg-[#579799] text-white font-bold px-6 py-2.5 rounded-lg shadow-md hover:bg-teal-700 transition cursor-pointer disabled:opacity-60">
                {isSubmitting ? 'Đang lưu...' : 'Lưu cài đặt'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}