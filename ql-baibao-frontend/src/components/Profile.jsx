import { useState } from 'react';
import axios from 'axios';

export default function Profile({ user }) {
  const [formData, setFormData] = useState({
    name: user.name,
    password: '',
    confirmPassword: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (formData.password && formData.password !== formData.confirmPassword) {
      return alert("Mật khẩu xác nhận không khớp!");
    }

    axios.put(`http://127.0.0.1:8000/api/workspace/profile/${user.id}`, formData)
      .then(res => {
        alert(res.data.message);
        window.location.reload(); 
      })
      .catch(err => alert("Lỗi khi cập nhật hồ sơ!"));
  };

  return (
    <div className="max-w-2xl mx-auto mt-12 animate-fade-in">
      <div className="bg-white rounded-2xl shadow-sm border border-[#9BBFBA] overflow-hidden">
        <div className="bg-[#F6F7F0] p-6 border-b border-[#E5E9DF] flex items-center gap-4">
          <div className="w-16 h-16 bg-[#579799] text-white rounded-full flex items-center justify-center text-2xl font-black shadow-inner">
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <h2 className="text-2xl font-black text-[#2F5253]">Hồ sơ cá nhân</h2>
            <p className="text-gray-500 text-sm">{user.email} • Vai trò: <strong className="uppercase">{user.role}</strong></p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-8 flex flex-col gap-6">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Họ và tên hiển thị</label>
            <input 
              type="text" required
              className="w-full border border-[#9BBFBA] rounded-lg p-3 focus:outline-none focus:border-[#579799] bg-gray-50"
              value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})}
            />
          </div>

          <div className="border-t border-gray-100 pt-6">
            <h3 className="text-lg font-bold text-[#579799] mb-4">Đổi mật khẩu (Bỏ trống nếu không đổi)</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Mật khẩu mới</label>
                <input 
                  type="password" placeholder="••••••••"
                  className="w-full border border-[#9BBFBA] rounded-lg p-3 focus:outline-none focus:border-[#579799]"
                  value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Xác nhận mật khẩu</label>
                <input 
                  type="password" placeholder="••••••••"
                  className="w-full border border-[#9BBFBA] rounded-lg p-3 focus:outline-none focus:border-[#579799]"
                  value={formData.confirmPassword} onChange={e => setFormData({...formData, confirmPassword: e.target.value})}
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <button type="submit" className="bg-[#579799] text-white px-8 py-3 rounded-lg font-bold shadow-md hover:bg-teal-700 hover:shadow-lg transition">
              Lưu thay đổi
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}