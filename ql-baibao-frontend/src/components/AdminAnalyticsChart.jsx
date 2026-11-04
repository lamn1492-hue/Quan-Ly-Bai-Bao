import React, { useMemo } from 'react';
import {
  ResponsiveContainer,
  BarChart, Bar,
  PieChart, Pie, Cell,
  AreaChart, Area,
  XAxis, YAxis, Tooltip, Legend, CartesianGrid
} from 'recharts';

export default function AdminAnalyticsChart({ articles = [], categories = [] }) {
  // 1. TÍNH TOÁN CÁC CHỈ SỐ NHANH (KPIs)
  const totalArticles = articles.length;
  const totalViews = useMemo(() => {
    return articles.reduce((sum, a) => sum + (parseInt(a.views) || 0), 0);
  }, [articles]);

  const publishedArticles = useMemo(() => {
    return articles.filter(a => a.status === 'published' || a.status === 'accepted');
  }, [articles]);

  const pendingArticles = useMemo(() => {
    return articles.filter(a => ['pending', 'under_review', 'reviewing'].includes(a.status));
  }, [articles]);

  const rejectedArticles = useMemo(() => {
    return articles.filter(a => a.status === 'rejected');
  }, [articles]);

  const revisionArticles = useMemo(() => {
    return articles.filter(a => a.status === 'revision_required');
  }, [articles]);

  const publishRate = totalArticles > 0 ? Math.round((publishedArticles.length / totalArticles) * 100) : 0;

  // 2. DỮ LIỆU BIỂU ĐỒ TRÒN (TRẠNG THÁI)
  const statusPieData = [
    { name: 'Đã xuất bản', value: publishedArticles.length, color: '#10B981' },
    { name: 'Chờ duyệt / Phản biện', value: pendingArticles.length, color: '#F59E0B' },
    { name: 'Yêu cầu sửa', value: revisionArticles.length, color: '#3B82F6' },
    { name: 'Từ chối', value: rejectedArticles.length, color: '#EF4444' }
  ].filter(item => item.value > 0);

  // 3. DỮ LIỆU BIỂU ĐỒ CỘT (TOP 5 BÀI XEM NHIỀU)
  const topViewData = useMemo(() => {
    return [...articles]
      .sort((a, b) => (b.views || 0) - (a.views || 0))
      .slice(0, 5)
      .map(a => ({
        title: a.title.length > 20 ? a.title.substring(0, 20) + '...' : a.title,
        views: a.views || 0
      }));
  }, [articles]);

  // 4. DỮ LIỆU BIỂU ĐỒ VÙNG (SỐ BÀI THEO CHUYÊN MỤC)
  const categoryData = useMemo(() => {
    return categories.map(cat => {
      const count = articles.filter(a => String(a.category_id) === String(cat.id)).length;
      return {
        name: cat.name.length > 15 ? cat.name.substring(0, 15) + '...' : cat.name,
        count: count
      };
    }).filter(c => c.count > 0);
  }, [articles, categories]);

  return (
    <div className="flex flex-col gap-6 animate-fade-in w-full">
      {/* KHỐI 4 THẺ CHỈ SỐ NHANH */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Tổng số bài nộp</p>
            <h3 className="text-3xl font-black text-[#2F5253] mt-1">{totalArticles}</h3>
          </div>
          <div className="w-12 h-12 bg-teal-50 text-[#579799] rounded-2xl flex items-center justify-center text-xl font-bold border border-teal-100">
            📚
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Tổng lượt độc giả đọc</p>
            <h3 className="text-3xl font-black text-blue-600 mt-1">{totalViews.toLocaleString()}</h3>
          </div>
          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center text-xl font-bold border border-blue-100">
            👁️
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Tỷ lệ xuất bản</p>
            <h3 className="text-3xl font-black text-emerald-600 mt-1">{publishRate}%</h3>
          </div>
          <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center text-xl font-bold border border-emerald-100">
            🎯
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Chờ xét duyệt</p>
            <h3 className="text-3xl font-black text-amber-500 mt-1">{pendingArticles.length}</h3>
          </div>
          <div className="w-12 h-12 bg-amber-50 text-amber-500 rounded-2xl flex items-center justify-center text-xl font-bold border border-amber-100">
            ⏳
          </div>
        </div>
      </div>

      {/* KHỐI 2 BIỂU ĐỒ TRÊN: TRẠNG THÁI & TOP BÀI XEM NHIỀU */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Biểu đồ Donut: Trạng thái bài nộp */}
        <div className="lg:col-span-5 bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex flex-col">
          <h4 className="font-extrabold text-sm text-[#2F5253] uppercase border-l-4 border-[#579799] pl-3 mb-2">
            Tỷ lệ phân bổ trạng thái bài viết
          </h4>
          <p className="text-xs text-gray-400 mb-4 pl-4">Thống kê theo tiến trình xét duyệt và xuất bản</p>
          
          <div className="h-64 w-full flex items-center justify-center">
            {statusPieData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusPieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {statusPieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: '1px solid #E5E9DF', fontSize: '12px', fontWeight: 'bold' }} 
                  />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', fontWeight: 'bold', paddingTop: '10px' }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <span className="text-xs font-bold text-gray-400">Chưa đủ dữ liệu hiển thị</span>
            )}
          </div>
        </div>

        {/* Biểu đồ Cột: Top 5 bài xem nhiều nhất */}
        <div className="lg:col-span-7 bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex flex-col">
          <h4 className="font-extrabold text-sm text-[#2F5253] uppercase border-l-4 border-[#579799] pl-3 mb-2">
            Top 5 bài viết có lượt đọc cao nhất
          </h4>
          <p className="text-xs text-gray-400 mb-4 pl-4">Đo lường mức độ quan tâm của độc giả đối với nghiên cứu</p>

          <div className="h-64 w-full">
            {topViewData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topViewData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                  <XAxis dataKey="title" stroke="#94A3B8" fontSize={11} interval={0} angle={-15} textAnchor="end" />
                  <YAxis stroke="#94A3B8" fontSize={11} allowDecimals={false} />
                  <Tooltip 
                    formatter={(val) => [`${val} lượt xem`, 'Lượt xem']}
                    contentStyle={{ borderRadius: '12px', border: '1px solid #E5E9DF', fontSize: '12px', fontWeight: 'bold' }}
                  />
                  <Bar dataKey="views" fill="#579799" radius={[8, 8, 0, 0]} barSize={36} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs font-bold text-gray-400">Chưa có bài viết nào phát sinh lượt xem</div>
            )}
          </div>
        </div>

      </div>

      {/* KHỐI BIỂU ĐỒ DƯỚI: MẬT ĐỘ BÀI VIẾT THEO CHUYÊN MỤC */}
      <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex flex-col">
        <h4 className="font-extrabold text-sm text-[#2F5253] uppercase border-l-4 border-[#579799] pl-3 mb-2">
          Số lượng bài nghiên cứu theo Chuyên mục / Lĩnh vực
        </h4>
        <p className="text-xs text-gray-400 mb-4 pl-4">Đánh giá lĩnh vực nào đang thu hút nhiều bài nộp nhất</p>

        <div className="h-64 w-full">
          {categoryData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={categoryData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#579799" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#579799" stopOpacity={0.0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                <XAxis dataKey="name" stroke="#94A3B8" fontSize={11} />
                <YAxis stroke="#94A3B8" fontSize={11} allowDecimals={false} />
                <Tooltip 
                  formatter={(val) => [`${val} bài`, 'Số lượng bài nộp']}
                  contentStyle={{ borderRadius: '12px', border: '1px solid #E5E9DF', fontSize: '12px', fontWeight: 'bold' }}
                />
                <Area type="monotone" dataKey="count" stroke="#579799" strokeWidth={3} fillOpacity={1} fill="url(#colorCount)" />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-xs font-bold text-gray-400">Chưa có dữ liệu chuyên mục</div>
          )}
        </div>
      </div>
    </div>
  );
}