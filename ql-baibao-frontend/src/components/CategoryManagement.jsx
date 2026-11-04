import { useState, useEffect, useMemo } from 'react';
import axios from 'axios';

export default function CategoryManagement() {
  const [subTab, setSubTab] = useState('analytics');

  const [categories, setCategories] = useState([]);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [editingCatId, setEditingCatId] = useState(null);
  const [editingCatName, setEditingCatName] = useState('');

  const [allArticles, setAllArticles] = useState([]);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const [journals, setJournals] = useState(() => {
    try {
      const saved = localStorage.getItem('srh_journals');
      return saved ? JSON.parse(saved) : [
        { id: 1, name: 'Tạp chí Khoa học Đại học Tây Nguyên', issn: '1859-4611', level: 'Quốc gia (HĐGSNN)' },
        { id: 2, name: 'Tạp chí Phát triển Khoa học & Công nghệ', issn: '1859-0128', level: 'Quốc gia' }
      ];
    } catch {
      return [];
    }
  });
  const [journalForm, setJournalForm] = useState({ name: '', issn: '', level: 'Quốc gia (HĐGSNN)' });

  const [publishers, setPublishers] = useState(() => {
    try {
      const saved = localStorage.getItem('srh_publishers');
      return saved ? JSON.parse(saved) : [
        { id: 1, name: 'Nhà xuất bản Khoa học và Kỹ thuật', website: 'nxbkhkt.com.vn', status: 'Đang hợp tác' }
      ];
    } catch {
      return [];
    }
  });
  const [publisherForm, setPublisherForm] = useState({ name: '', website: '', status: 'Đang hợp tác' });

  useEffect(() => {
    localStorage.setItem('srh_journals', JSON.stringify(journals));
  }, [journals]);

  useEffect(() => {
    localStorage.setItem('srh_publishers', JSON.stringify(publishers));
  }, [publishers]);

  const fetchCategories = () => {
    axios.get('http://127.0.0.1:8000/api/categories')
      .then(res => setCategories(Array.isArray(res.data) ? res.data : []))
      .catch(err => console.error('Lỗi tải danh mục:', err));
  };

  const fetchAllArticlesForAnalytics = () => {
    axios.get('http://127.0.0.1:8000/api/articles')
      .then(res => {
        const data = Array.isArray(res.data) ? res.data : (res.data.data || []);
        setAllArticles(data);
      })
      .catch(() => {
        axios.get('http://127.0.0.1:8000/api/workspace/published-articles')
          .then(res2 => {
            const data2 = Array.isArray(res2.data) ? res2.data : (res2.data.data || []);
            setAllArticles(data2);
          })
          .catch(err => console.error(err));
      });
  };

  useEffect(() => {
    fetchCategories();
    fetchAllArticlesForAnalytics();
  }, []);

  const stats = useMemo(() => {
    const safeArticles = Array.isArray(allArticles) ? allArticles : [];
    const total = safeArticles.length;
    const published = safeArticles.filter(a => a.status === 'published' || a.status === 'approved').length;
    const rejected = safeArticles.filter(a => a.status === 'rejected' || a.status === 'revision_required').length;
    const pending = Math.max(0, total - published - rejected);

    const pubPercent = total > 0 ? Math.round((published / total) * 100) : 0;
    const rejPercent = total > 0 ? Math.round((rejected / total) * 100) : 0;
    const penPercent = total > 0 ? Math.max(0, 100 - pubPercent - rejPercent) : 0;

    const monthlyCounts = Array(12).fill(0);
    safeArticles.forEach(a => {
      const d = new Date(a.created_at || a.updated_at);
      if (!isNaN(d) && d.getFullYear() === Number(selectedYear)) {
        monthlyCounts[d.getMonth()] += 1;
      }
    });
    const maxMonthCount = Math.max(...monthlyCounts, 1);

    return { total, published, pending, rejected, pubPercent, rejPercent, penPercent, monthlyCounts, maxMonthCount };
  }, [allArticles, selectedYear]);

  const getCategoryName = (id) => {
    const cat = categories.find(c => String(c.id) === String(id));
    return cat ? cat.name : 'Chưa phân loại';
  };

  const getStatusLabel = (status) => {
    if (status === 'published' || status === 'approved') return 'Đã xuất bản';
    if (status === 'rejected') return 'Từ chối';
    if (status === 'revision_required') return 'Yêu cầu chỉnh sửa';
    return 'Đang chờ duyệt / Phản biện';
  };

  const handleExportExcel = () => {
    const safeArticles = Array.isArray(allArticles) ? allArticles : [];
    if (safeArticles.length === 0) return alert('Chưa có dữ liệu bài báo để xuất!');
    const headers = ['Mã ID', 'Tiêu đề bài báo', 'Tác giả', 'Lĩnh vực', 'Trạng thái', 'Lượt xem', 'Ngày cập nhật'];
    const rows = safeArticles.map(a => [
      a.id,
      `"${(a.title || '').replace(/"/g, '""')}"`,
      `"${(a.user?.name || a.author || 'Khuyết danh').replace(/"/g, '""')}"`,
      `"${getCategoryName(a.category_id)}"`,
      `"${getStatusLabel(a.status)}"`,
      a.views || 0,
      new Date(a.updated_at || a.created_at).toLocaleDateString('vi-VN')
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Bao_Cao_Bai_Bao_SRH_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrintPDF = () => {
    const safeArticles = Array.isArray(allArticles) ? allArticles : [];
    const printWindow = window.open('', '_blank', 'width=1000,height=800');
    if (!printWindow) return alert('Vui lòng cho phép mở cửa sổ popup để in báo cáo!');

    const rowsHtml = safeArticles.map((a, idx) => `
      <tr>
        <td style="text-align:center;">${idx + 1}</td>
        <td>#${a.id}</td>
        <td style="font-weight:bold;">${a.title || ''}</td>
        <td>${a.user?.name || a.author || 'Khuyết danh'}</td>
        <td>${getCategoryName(a.category_id)}</td>
        <td>${getStatusLabel(a.status)}</td>
        <td style="text-align:center;">${a.views || 0}</td>
        <td style="text-align:center;">${new Date(a.updated_at || a.created_at).toLocaleDateString('vi-VN')}</td>
      </tr>
    `).join('');

    printWindow.document.write(`
      <html>
        <head>
          <title>Báo cáo Thống kê Bài báo Khoa học - SRH Portal</title>
          <style>
            body { font-family: "Times New Roman", Times, serif; padding: 30px; color: #000; }
            .header { display: flex; justify-content: space-between; margin-bottom: 25px; }
            .title { text-align: center; margin: 20px 0; }
            .summary { display: flex; justify-content: space-around; margin: 20px 0; border: 1px solid #000; padding: 12px; }
            table { width: 100%; border-collapse: collapse; margin-top: 15px; font-size: 13px; }
            th, td { border: 1px solid #000; padding: 8px; text-align: left; }
            th { background-color: #f0f0f0; text-align: center; }
            .footer-sign { margin-top: 40px; display: flex; justify-content: flex-end; text-align: center; }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <strong>TRƯỜNG ĐẠI HỌC TÂY NGUYÊN</strong><br/>
              <span>HỆ THỐNG QUẢN LÝ BÁO & NGHIÊN CỨU (SRH)</span>
              <hr style="width: 120px; border: 0.5px solid #000;"/>
            </div>
            <div>
              <strong>CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</strong><br/>
              <strong>Độc lập - Tự do - Hạnh phúc</strong>
              <hr style="width: 150px; border: 0.5px solid #000;"/>
            </div>
          </div>
          <div class="title">
            <h2 style="margin:0; text-transform:uppercase;">BÁO CÁO THỐNG KÊ DANH MỤC BÀI BÁO & CÔNG TRÌNH KHOA HỌC</h2>
            <p style="margin:5px 0; font-style:italic;">Ngày xuất: ${new Date().toLocaleDateString('vi-VN')}</p>
          </div>
          <div class="summary">
            <div><strong>Tổng số:</strong> ${stats.total}</div>
            <div><strong>Đã xuất bản:</strong> ${stats.published} (${stats.pubPercent}%)</div>
            <div><strong>Chờ duyệt:</strong> ${stats.pending} (${stats.penPercent}%)</div>
            <div><strong>Từ chối:</strong> ${stats.rejected} (${stats.rejPercent}%)</div>
          </div>
          <table>
            <thead>
              <tr>
                <th>STT</th><th>Mã ID</th><th>Tên Bài báo</th><th>Tác giả</th><th>Chuyên mục</th><th>Trạng thái</th><th>Lượt xem</th><th>Ngày cập nhật</th>
              </tr>
            </thead>
            <tbody>${rowsHtml}</tbody>
          </table>
          <div class="footer-sign">
            <div>
              <em>Đắk Lắk, ngày ${new Date().getDate()} tháng ${new Date().getMonth() + 1} năm ${new Date().getFullYear()}</em><br/>
              <strong>QUẢN TRỊ VIÊN / TỔNG BIÊN TẬP</strong><br/><br/><br/><br/>
              <strong>NGUYỄN THÀNH LÂM</strong>
            </div>
          </div>
          <script>window.onload = function() { window.print(); }</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handleAddCategory = (e) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;
    axios.post('http://127.0.0.1:8000/api/categories', { name: newCategoryName })
      .then(() => { setNewCategoryName(''); fetchCategories(); alert('Đã thêm lĩnh vực thành công!'); })
      .catch(() => alert('Lỗi khi thêm lĩnh vực!'));
  };

  const handleUpdateCategory = (id) => {
    if (!editingCatName.trim()) return;
    axios.put(`http://127.0.0.1:8000/api/categories/${id}`, { name: editingCatName })
      .then(() => { setEditingCatId(null); setEditingCatName(''); fetchCategories(); })
      .catch(() => alert('Lỗi khi cập nhật!'));
  };

  const handleDeleteCategory = (id) => {
    if (window.confirm('Xóa lĩnh vực này?')) {
      axios.delete(`http://127.0.0.1:8000/api/categories/${id}`)
        .then(() => fetchCategories())
        .catch(() => alert('Không thể xóa lĩnh vực đang có bài báo!'));
    }
  };

  const handleAddJournal = (e) => {
    e.preventDefault();
    if (!journalForm.name.trim() || !journalForm.issn.trim()) return;
    setJournals([...journals, { id: Date.now(), ...journalForm }]);
    setJournalForm({ name: '', issn: '', level: 'Quốc gia (HĐGSNN)' });
  };

  const handleDeleteJournal = (id) => {
    if (window.confirm('Xóa tạp chí này?')) setJournals(journals.filter(j => j.id !== id));
  };

  const handleAddPublisher = (e) => {
    e.preventDefault();
    if (!publisherForm.name.trim()) return;
    setPublishers([...publishers, { id: Date.now(), ...publisherForm }]);
    setPublisherForm({ name: '', website: '', status: 'Đang hợp tác' });
  };

  const handleDeletePublisher = (id) => {
    if (window.confirm('Xóa nhà xuất bản này?')) setPublishers(publishers.filter(p => p.id !== id));
  };

  return (
    <div className="mt-8 bg-white p-6 rounded-2xl shadow-sm border border-[#9BBFBA] animate-fade-in">
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 border-b border-gray-200 pb-4 mb-6">
        <div>
          <h3 className="text-xl font-black text-[#2F5253] uppercase tracking-tight">
            Trung tâm Cấu hình Danh mục & Báo cáo
          </h3>
          <p className="text-xs text-gray-500 font-medium mt-1">
            Xuất báo cáo Excel/PDF và Quản lý Lĩnh vực, Tạp chí, NXB
          </p>
        </div>

        <div className="flex items-center flex-nowrap shrink-0 overflow-x-auto bg-[#F6F7F0] p-1.5 rounded-2xl border border-[#E5E9DF] gap-1.5">
          <button 
            type="button"
            onClick={() => setSubTab('analytics')} 
            className={`px-3.5 py-2 rounded-xl text-xs font-extrabold whitespace-nowrap transition cursor-pointer shrink-0 ${
              subTab === 'analytics' ? 'bg-[#579799] text-white shadow-sm' : 'text-gray-600 hover:text-[#579799]'
            }`}
          >
            Báo cáo hệ thống
          </button>

          <button 
            type="button"
            onClick={() => setSubTab('fields')} 
            className={`px-3.5 py-2 rounded-xl text-xs font-extrabold whitespace-nowrap transition cursor-pointer shrink-0 ${
              subTab === 'fields' ? 'bg-[#579799] text-white shadow-sm' : 'text-gray-600 hover:text-[#579799]'
            }`}
          >
            Lĩnh vực ({Array.isArray(categories) ? categories.length : 0})
          </button>

          <button 
            type="button"
            onClick={() => setSubTab('journals')} 
            className={`px-3.5 py-2 rounded-xl text-xs font-extrabold whitespace-nowrap transition cursor-pointer shrink-0 ${
              subTab === 'journals' ? 'bg-[#579799] text-white shadow-sm' : 'text-gray-600 hover:text-[#579799]'
            }`}
          >
            Tạp chí ({journals.length})
          </button>

          <button 
            type="button"
            onClick={() => setSubTab('publishers')} 
            className={`px-3.5 py-2 rounded-xl text-xs font-extrabold whitespace-nowrap transition cursor-pointer shrink-0 ${
              subTab === 'publishers' ? 'bg-[#579799] text-white shadow-sm' : 'text-gray-600 hover:text-[#579799]'
            }`}
          >
            Nhà xuất bản ({publishers.length})
          </button>
        </div>
      </div>

      {subTab === 'analytics' && (
        <div className="space-y-6 animate-fade-in">
          <div className="flex flex-wrap items-center justify-between gap-4 bg-[#F6F7F0] p-4 rounded-xl border border-[#E5E9DF]">
            <div className="flex items-center gap-3">
              <span className="text-sm font-black text-[#2F5253] uppercase">Năm thống kê:</span>
              <select value={selectedYear} onChange={(e) => setSelectedYear(Number(e.target.value))} className="bg-white border border-[#9BBFBA] rounded-lg px-3 py-1.5 text-sm font-bold text-[#2F5253] outline-none">
                <option value={2026}>Năm 2026</option>
                <option value={2025}>Năm 2025</option>
              </select>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={handleExportExcel} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-sm transition flex items-center gap-2 cursor-pointer">Xuất Excel (.CSV)</button>
              <button onClick={handlePrintPDF} className="bg-[#2F5253] hover:bg-[#579799] text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-sm transition flex items-center gap-2 cursor-pointer">In Báo cáo PDF</button>
            </div>
          </div>
          <div className="bg-teal-50 text-teal-700 p-6 rounded-xl border border-teal-200 text-center shadow-sm">
            <h4 className="text-lg font-bold mb-2">Trình trích xuất Báo cáo Hệ thống</h4>
            <p className="text-sm">Vui lòng chọn năm thống kê và sử dụng các nút chức năng phía trên để tải xuống danh sách chi tiết các công trình nghiên cứu thuộc hệ thống (Hỗ trợ định dạng Excel và PDF).</p>
          </div>
        </div>
      )}

      {subTab === 'fields' && (
        <div className="space-y-6 animate-fade-in">
          <form onSubmit={handleAddCategory} className="flex gap-3">
            <input type="text" placeholder="Nhập tên lĩnh vực nghiên cứu mới..." className="flex-1 border border-[#9BBFBA] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#579799]" value={newCategoryName} onChange={(e) => setNewCategoryName(e.target.value)} required />
            <button type="submit" className="bg-[#579799] text-white px-6 py-2.5 rounded-xl font-bold text-sm hover:bg-teal-700 transition cursor-pointer">+ Thêm lĩnh vực</button>
          </form>
          <div className="overflow-hidden rounded-xl border border-gray-200">
            <table className="w-full text-left border-collapse">
              <thead><tr className="bg-[#F6F7F0] text-[#579799] text-xs uppercase"><th className="p-3.5 font-bold w-20 text-center">ID</th><th className="p-3.5 font-bold">Tên Lĩnh vực</th><th className="p-3.5 font-bold text-center w-48">Thao tác</th></tr></thead>
              <tbody>
                {Array.isArray(categories) && categories.map((cat, index) => (
                  <tr key={cat.id} className="border-t border-gray-100 hover:bg-gray-50">
                    <td className="p-3.5 text-center font-bold text-gray-400">#{index + 1}</td>
                    <td className="p-3.5 font-bold text-gray-800">
                      {editingCatId === cat.id ? <input type="text" className="border border-[#579799] rounded-lg px-3 py-1 text-sm w-full max-w-md" value={editingCatName} onChange={(e) => setEditingCatName(e.target.value)} /> : cat.name}
                    </td>
                    <td className="p-3.5 text-center flex justify-center gap-3">
                      {editingCatId === cat.id ? (
                        <>
                          <button onClick={() => handleUpdateCategory(cat.id)} className="text-green-600 font-bold text-xs cursor-pointer">Lưu</button>
                          <button onClick={() => setEditingCatId(null)} className="text-gray-500 font-bold text-xs cursor-pointer">Hủy</button>
                        </>
                      ) : (
                        <>
                          <button onClick={() => { setEditingCatId(cat.id); setEditingCatName(cat.name); }} className="text-blue-600 font-bold text-xs cursor-pointer">Đổi tên</button>
                          <button onClick={() => handleDeleteCategory(cat.id)} className="text-red-500 font-bold text-xs cursor-pointer">Xóa</button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {subTab === 'journals' && (
        <div className="space-y-6 animate-fade-in">
          <form onSubmit={handleAddJournal} className="grid grid-cols-1 md:grid-cols-4 gap-3 bg-[#F6F7F0] p-4 rounded-xl border border-[#E5E9DF]">
            <input type="text" placeholder="Tên tạp chí *" required className="border border-[#9BBFBA] bg-white rounded-lg px-3 py-2 text-sm" value={journalForm.name} onChange={e => setJournalForm({ ...journalForm, name: e.target.value })} />
            <input type="text" placeholder="Mã ISSN (VD: 1859-4611) *" required className="border border-[#9BBFBA] bg-white rounded-lg px-3 py-2 text-sm" value={journalForm.issn} onChange={e => setJournalForm({ ...journalForm, issn: e.target.value })} />
            <button type="submit" className="bg-[#579799] text-white font-bold text-sm rounded-lg px-4 py-2 hover:bg-teal-700 transition cursor-pointer">+ Thêm Tạp chí</button>
          </form>
          <div className="overflow-hidden rounded-xl border border-gray-200">
            <table className="w-full text-left border-collapse">
              <thead><tr className="bg-[#F6F7F0] text-[#579799] text-xs uppercase"><th className="p-3.5 font-bold">Tên Tạp chí</th><th className="p-3.5 font-bold text-center">Mã ISSN</th><th className="p-3.5 font-bold text-center">Thao tác</th></tr></thead>
              <tbody>
                {journals.map(j => (
                  <tr key={j.id} className="border-t border-gray-100 hover:bg-gray-50">
                    <td className="p-3.5 font-bold text-gray-800">{j.name}</td>
                    <td className="p-3.5 text-center font-mono text-xs font-bold text-[#579799]">{j.issn}</td>
                    <td className="p-3.5 text-center"><button onClick={() => handleDeleteJournal(j.id)} className="text-red-500 font-bold text-xs cursor-pointer">Xóa</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {subTab === 'publishers' && (
        <div className="space-y-6 animate-fade-in">
          <form onSubmit={handleAddPublisher} className="grid grid-cols-1 md:grid-cols-3 gap-3 bg-[#F6F7F0] p-4 rounded-xl border border-[#E5E9DF]">
            <input type="text" placeholder="Tên Nhà xuất bản *" required className="border border-[#9BBFBA] bg-white rounded-lg px-3 py-2 text-sm" value={publisherForm.name} onChange={e => setPublisherForm({ ...publisherForm, name: e.target.value })} />
            <input type="text" placeholder="Website" className="border border-[#9BBFBA] bg-white rounded-lg px-3 py-2 text-sm" value={publisherForm.website} onChange={e => setPublisherForm({ ...publisherForm, website: e.target.value })} />
            <button type="submit" className="bg-[#579799] text-white font-bold text-sm rounded-lg px-4 py-2 hover:bg-teal-700 transition cursor-pointer">+ Thêm NXB</button>
          </form>
          <div className="overflow-hidden rounded-xl border border-gray-200">
            <table className="w-full text-left border-collapse">
              <thead><tr className="bg-[#F6F7F0] text-[#579799] text-xs uppercase"><th className="p-3.5 font-bold">Tên NXB</th><th className="p-3.5 font-bold text-center">Website</th><th className="p-3.5 font-bold text-center">Thao tác</th></tr></thead>
              <tbody>
                {publishers.map(p => (
                  <tr key={p.id} className="border-t border-gray-100 hover:bg-gray-50">
                    <td className="p-3.5 font-bold text-gray-800">{p.name}</td>
                    <td className="p-3.5 text-center text-xs text-blue-600 font-semibold">{p.website || '-'}</td>
                    <td className="p-3.5 text-center"><button onClick={() => handleDeletePublisher(p.id)} className="text-red-500 font-bold text-xs cursor-pointer">Xóa</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}