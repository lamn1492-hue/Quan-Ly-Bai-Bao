import { useState, useEffect } from 'react';
import axios from 'axios';

export default function UserManagement() {
  const [users, setUsers] = useState([]);

  const [pendingRoles, setPendingRoles] = useState({});

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = () => {
    axios.get('http://127.0.0.1:8000/api/workspace/users')
      .then(res => setUsers(res.data))
      .catch(err => console.error("Lỗi lấy danh sách user:", err));
  };

  const handleRoleChange = (id, currentRole) => {
    const newRole = pendingRoles[id] || currentRole;

    axios.put(`http://127.0.0.1:8000/api/workspace/users/${id}/role`, { role: newRole })
      .then(() => {
        alert("Cập nhật quyền thành công!");
        fetchUsers();
      })
      .catch(() => alert("Lỗi cập nhật quyền. Vui lòng thử lại!"));
  };

  const handleDropdownChange = (id, value) => {
    setPendingRoles(prev => ({ ...prev, [id]: value }));
  };

  return (
    <div className="mt-8 animate-fade-in">
      <h2 className="text-2xl font-extrabold text-[#579799] mb-6 border-b-2 border-[#AACBCA] pb-3 flex items-center gap-2">
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path></svg>
        Quản lý & Phân quyền tài khoản
      </h2>

      <div className="bg-white rounded-xl shadow-sm border border-[#9BBFBA] overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[#F6F7F0] text-[#579799] text-sm uppercase tracking-wide">
              <th className="p-4 border-b border-[#E5E9DF] font-bold">Họ và Tên</th>
              <th className="p-4 border-b border-[#E5E9DF] font-bold">Email</th>
              <th className="p-4 border-b border-[#E5E9DF] font-bold">Phân quyền</th>
              <th className="p-4 border-b border-[#E5E9DF] font-bold text-center">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id} className="border-b border-gray-100 hover:bg-[#FAFBFA] transition">
                <td className="p-4 font-bold text-gray-700">{u.name}</td>
                <td className="p-4 text-gray-500">{u.email}</td>
                <td className="p-4">
                  <select 
                    className="border border-[#9BBFBA] rounded-lg px-3 py-2 focus:outline-none focus:border-[#579799] focus:ring-1 focus:ring-[#579799] bg-white text-gray-700 font-medium w-full max-w-[250px]"
                    value={pendingRoles[u.id] || u.role || 'user'}
                    onChange={(e) => handleDropdownChange(u.id, e.target.value)}
                  >
                    <option value="user">Người dùng (Đăng bài)</option>
                    <option value="moderator">Người duyệt (Chấm điểm)</option>
                    <option value="admin">Admin (Quản trị hệ thống)</option>
                  </select>
                </td>
                <td className="p-4 text-center">
                  <button 
                    onClick={() => handleRoleChange(u.id, u.role || 'user')}
                    className="bg-[#579799] text-white px-5 py-2 rounded-lg text-sm font-bold shadow-sm hover:bg-teal-700 transition"
                  >
                    Lưu quyền
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}