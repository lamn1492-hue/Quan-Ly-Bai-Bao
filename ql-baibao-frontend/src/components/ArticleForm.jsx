import { useMemo } from 'react';

export default function ArticleForm({ formData, setFormData, setFile, editId, handleSubmit, handleCancel, categories }) {
  const savedJournals = useMemo(() => {
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
  }, []);

  return (
    <div className={`bg-white p-6 rounded-xl shadow-md mb-8 border-t-4 ${editId ? 'border-yellow-500' : 'border-green-500'}`}>
      <h2 className="text-xl font-bold mb-4 text-gray-700">
        {editId ? 'Cập nhật thông tin bài báo' : 'Thêm bài báo mới'}
      </h2>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <input 
          type="text" 
          placeholder="Tên bài báo..." 
          required 
          className="border border-gray-300 p-3 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" 
          value={formData.title || ''} 
          onChange={(e) => setFormData({...formData, title: e.target.value})} 
        />
        <input 
          type="text" 
          placeholder="Tên tác giả..." 
          required 
          className="border border-gray-300 p-3 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" 
          value={formData.author || ''} 
          onChange={(e) => setFormData({...formData, author: e.target.value})} 
        />
        
        {/* Khối chọn chuyên mục / Lĩnh vực */}
        <select 
          className="border border-gray-300 p-3 rounded-lg focus:outline-none focus:border-blue-500 bg-white"
          value={formData.category_id || ''} 
          onChange={(e) => setFormData({...formData, category_id: e.target.value})}
        >
          <option value="">-- Chọn chuyên mục cho bài báo --</option>
          {categories && categories.map(cat => (
            <option key={cat.id} value={cat.id}>{cat.name}</option>
          ))}
        </select>

        {/* Khối chọn Tạp chí Khoa học (ISSN) */}
        <select 
          className="border border-gray-300 p-3 rounded-lg focus:outline-none focus:border-blue-500 bg-white"
          value={formData.journal || ''} 
          onChange={(e) => setFormData({...formData, journal: e.target.value})}
        >
          <option value="">-- Chọn tạp chí khoa học (nếu có) --</option>
          {savedJournals.map(j => (
            <option key={j.id} value={j.name}>
              {j.name} (ISSN: {j.issn})
            </option>
          ))}
        </select>

        <textarea 
          placeholder="Tóm tắt nội dung..." 
          rows="3" 
          className="border border-gray-300 p-3 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" 
          value={formData.abstract || ''} 
          onChange={(e) => setFormData({...formData, abstract: e.target.value})}
        ></textarea>
        
        <div className="flex flex-col gap-1">
          <label className="text-sm font-semibold text-gray-600">
            {editId ? 'Đính kèm tệp mới (PDF, DOCX - Bỏ qua nếu giữ nguyên):' : 'Đính kèm tệp tài liệu (PDF, DOCX):'}
          </label>
          <input 
            id="fileInput" 
            type="file" 
            accept=".pdf,.doc,.docx" 
            className="file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer" 
            onChange={(e) => setFile(e.target.files[0])} 
          />
        </div>
        
        <div className="flex gap-3 mt-2">
          <button 
            type="submit" 
            className={`flex-1 text-white font-bold py-2.5 px-4 rounded-lg transition duration-300 shadow ${editId ? 'bg-yellow-500 hover:bg-yellow-600' : 'bg-green-600 hover:bg-green-700'}`}
          >
            {editId ? 'Lưu thay đổi' : '+ Thêm vào danh sách'}
          </button>
          {editId && (
            <button 
              type="button" 
              onClick={handleCancel} 
              className="bg-gray-400 hover:bg-gray-500 text-white font-bold py-2.5 px-6 rounded-lg transition duration-300 shadow"
            >
              Hủy
            </button>
          )}
        </div>
      </form>
    </div>
  );
}