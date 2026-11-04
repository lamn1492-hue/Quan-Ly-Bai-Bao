import { useState, useEffect, useMemo, useRef } from 'react';
import axios from 'axios';
import html2pdf from 'html2pdf.js';
import { Helmet } from 'react-helmet-async';

// =======================================================================
// 1. DỮ LIỆU DÙNG CHUNG CỦA HỆ THỐNG
// =======================================================================
const CITIES = [
  { name: 'Đắk Lắk', lat: 12.6667, lon: 108.0500 },
  { name: 'TP. Hồ Chí Minh', lat: 10.7769, lon: 106.7009 },
  { name: 'Hà Nội', lat: 21.0285, lon: 105.8542 },
  { name: 'Đà Nẵng', lat: 16.0544, lon: 108.2022 },
  { name: 'Cần Thơ', lat: 10.0452, lon: 105.7469 },
  { name: 'An Giang', lat: 10.5255, lon: 105.4322 },
  { name: 'Bắc Ninh', lat: 21.1861, lon: 106.0763 },
  { name: 'Cao Bằng', lat: 22.6667, lon: 106.2500 },
  { name: 'Cà Mau', lat: 9.1769, lon: 105.1524 },
  { name: 'Điện Biên', lat: 21.3833, lon: 103.0167 },
  { name: 'Đồng Nai', lat: 10.9574, lon: 106.8427 },
  { name: 'Đồng Tháp', lat: 10.4578, lon: 105.6826 },
  { name: 'Gia Lai', lat: 13.9833, lon: 108.0000 },
  { name: 'Hà Tĩnh', lat: 18.3429, lon: 105.9056 },
  { name: 'Hưng Yên', lat: 20.6464, lon: 106.0511 },
  { name: 'Hải Phòng', lat: 20.8449, lon: 106.6881 },
  { name: 'Khánh Hòa', lat: 12.2388, lon: 109.1967 },
  { name: 'Lai Châu', lat: 22.3997, lon: 103.4750 },
  { name: 'Lào Cai', lat: 22.4856, lon: 103.9704 },
  { name: 'Lâm Đồng', lat: 11.9404, lon: 108.4383 },
  { name: 'Lạng Sơn', lat: 21.8490, lon: 106.7623 },
  { name: 'Nghệ An', lat: 18.6701, lon: 105.6852 },
  { name: 'Ninh Bình', lat: 20.2547, lon: 105.9750 },
  { name: 'Phú Thọ', lat: 21.3218, lon: 105.2030 },
  { name: 'Quảng Ngãi', lat: 15.1214, lon: 108.7923 },
  { name: 'Quảng Ninh', lat: 21.0064, lon: 107.2925 },
  { name: 'Quảng Trị', lat: 16.7511, lon: 107.1849 },
  { name: 'Sơn La', lat: 21.3281, lon: 103.9147 },
  { name: 'Thanh Hóa', lat: 19.8067, lon: 105.7852 },
  { name: 'Thái Nguyên', lat: 21.5942, lon: 105.8481 },
  { name: 'Thừa Thiên Huế', lat: 16.4637, lon: 107.5909 },
  { name: 'Tuyên Quang', lat: 21.8256, lon: 105.2107 },
  { name: 'Tây Ninh', lat: 11.3620, lon: 106.0964 },
  { name: 'Vĩnh Long', lat: 10.2542, lon: 105.9722 }
];

const getWeatherDetails = (code) => {
  if (code === 0) return { label: 'Trời quang đãng', icon: '☀️', color: 'text-yellow-500' };
  if ([1, 2, 3].includes(code)) return { label: 'Có mây rải rác', icon: '⛅', color: 'text-gray-500' };
  if ([45, 48].includes(code)) return { label: 'Sương mù', icon: '🌫️', color: 'text-gray-400' };
  if ([51, 53, 55, 61, 63, 65].includes(code)) return { label: 'Có mưa nhỏ', icon: '🌧️', color: 'text-blue-500' };
  if ([71, 73, 75].includes(code)) return { label: 'Tuyết rơi', icon: '❄️', color: 'text-cyan-400' };
  if ([95, 96, 99].includes(code)) return { label: 'Dông sét', icon: '⛈️', color: 'text-purple-600' };
  return { label: 'Nhiều mây', icon: '☁️', color: 'text-gray-500' };
};

// =======================================================================
// 2. COMPONENT TRUNG TÂM KHÍ TƯỢNG
// =======================================================================
const WeatherDashboard = ({ city: initialCity, onClose, categories, articles, setSelectedArticle }) => {
  const [currentCity, setCurrentCity] = useState(initialCity || CITIES[0]);
  const [weatherData, setWeatherData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('hourly');
  
  useEffect(() => {
    setIsLoading(true);
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${currentCity.lat}&longitude=${currentCity.lon}&current=temperature_2m,relative_humidity_2m,precipitation,weather_code,wind_speed_10m&hourly=temperature_2m,weather_code&daily=weather_code,temperature_2m_max,temperature_2m_min,uv_index_max&timezone=Asia%2FHo_Chi_Minh`;
    
    axios.get(url)
      .then(res => { setWeatherData(res.data); setIsLoading(false); })
      .catch(err => { console.error(err); setIsLoading(false); });
  }, [currentCity]);

  if (isLoading || !weatherData) {
    return (
      <div className="w-full py-32 flex flex-col items-center justify-center gap-4 bg-white rounded-2xl border border-gray-200 animate-pulse animate-fade-in">
        <div className="w-16 h-16 border-4 border-[#579799] border-t-transparent rounded-full animate-spin"></div>
        <div className="text-2xl font-bold text-[#579799]">Đang kết nối trạm khí tượng {currentCity.name}...</div>
      </div>
    );
  }

  const dailyForecast = weatherData.daily.time.map((time, index) => ({
    date: new Date(time),
    maxTemp: Math.round(weatherData.daily.temperature_2m_max[index]),
    minTemp: Math.round(weatherData.daily.temperature_2m_min[index]),
    code: weatherData.daily.weather_code[index],
    uv: weatherData.daily.uv_index_max[index]
  }));

  const currentHourIndex = new Date().getHours();
  const hourlyData = weatherData.hourly.time.slice(currentHourIndex, currentHourIndex + 12).map((time, idx) => ({
    time: `${new Date(time).getHours()}:00`,
    temp: Math.round(weatherData.hourly.temperature_2m[currentHourIndex + idx])
  }));

  const maxHourlyTemp = Math.max(...hourlyData.map(d => d.temp));
  const minHourlyTemp = Math.min(...hourlyData.map(d => d.temp));
  
  const weatherCategory = categories?.find(c => c.name.toLowerCase().includes('thời tiết'));
  const weatherArticles = weatherCategory && articles
    ? articles
        .filter(a => a.category_id === weatherCategory.id && (a.status === 'published' || a.status === 'accepted'))
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        .slice(0, 2)
    : [];

  return (
    <div className="w-full animate-fade-in pb-8">
      <div className="flex justify-between items-end mb-8 border-b-2 border-[#E5E9DF] pb-4">
        <h1 className="text-3xl font-black text-[#2F5253] border-l-[6px] border-[#579799] pl-4 uppercase tracking-tight">
          Thời Tiết
        </h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-3 flex flex-col gap-6">
          {weatherArticles && weatherArticles.length > 0 ? (
            weatherArticles.map(article => (
              <div 
                key={article.id} 
                className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden cursor-pointer hover:shadow-lg transition group"
                onClick={() => setSelectedArticle && setSelectedArticle(article)}
              >
                {article.image_path ? (
                  <img 
                    src={`http://127.0.0.1:8000/storage/${article.image_path}`} 
                    alt={article.title} 
                    className="w-full h-40 object-cover"
                  />
                ) : (
                  <div className="w-full h-40 bg-gradient-to-r from-[#579799] to-[#9BBFBA] flex items-center justify-center">
                    <span className="text-white font-bold opacity-75">Bản tin Thời tiết</span>
                  </div>
                )}
                
                <div className="p-4">
                  <h3 className="text-[17px] font-bold text-gray-800 leading-snug mb-2 group-hover:text-[#579799] line-clamp-2">
                    {article.title}
                  </h3>
                  <p className="text-sm text-gray-500 line-clamp-3 leading-relaxed">
                    {article.abstract?.replace(/\[\[.*?\]\]/g, '') || 'Nhấn để xem chi tiết bản tin...'}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 text-center h-[350px] flex flex-col justify-center items-center">
              <span className="text-5xl mb-3">🌤️</span>
              <p className="text-sm font-bold text-gray-400">Chưa có bản tin thời tiết nào</p>
            </div>
          )}
        </div>

        <div className="lg:col-span-9 flex flex-col gap-6">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 flex flex-col md:flex-row gap-8 items-center justify-between">
            <div className="flex flex-col flex-1 min-w-[250px]">
              <div className="flex items-center gap-2 mb-2 bg-[#F6F7F0] p-2 rounded-xl border border-[#E5E9DF] hover:border-[#579799] transition w-fit group">
                <svg className="w-6 h-6 text-[#579799]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path></svg>
                <select value={currentCity.name} onChange={(e) => { const newCity = CITIES.find(c => c.name === e.target.value); if(newCity) setCurrentCity(newCity); }} className="text-2xl lg:text-3xl font-black text-[#2F5253] uppercase bg-transparent outline-none cursor-pointer tracking-tight group-hover:text-[#579799] transition">
                  {CITIES.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
                </select>
              </div>
              <p className="text-gray-500 font-medium ml-2">Hôm nay, {new Date().toLocaleDateString('vi-VN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>
            </div>
            
            <div className="flex items-center gap-6">
              <span className="text-8xl drop-shadow-md">{getWeatherDetails(weatherData.current.weather_code).icon}</span>
              <div className="flex flex-col">
                <div className="flex items-start">
                  <span className="text-7xl font-black text-[#2F5253] tracking-tighter leading-none">{Math.round(weatherData.current.temperature_2m)}</span>
                  <span className="text-3xl font-black text-gray-400 mt-2">°C</span>
                </div>
                <span className={`text-xl font-bold mt-2 ${getWeatherDetails(weatherData.current.weather_code).color}`}>{getWeatherDetails(weatherData.current.weather_code).label}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-x-8 gap-y-4 text-sm font-bold text-gray-700 bg-gray-50 p-6 rounded-xl border border-gray-200 min-w-[300px]">
              <p>Độ ẩm: <span className="text-blue-500 text-lg">{weatherData.current.relative_humidity_2m}%</span></p>
              <p>Gió: <span className="text-[#579799] text-lg">{weatherData.current.wind_speed_10m} km/h</span></p>
              <p>UV Max: <span className="text-purple-500 text-lg">{Math.round(dailyForecast[0].uv)}/11</span></p>
              <p>Lượng mưa: <span className="text-indigo-500 text-lg">{weatherData.current.precipitation} mm</span></p>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 overflow-hidden relative group">
            <h3 className="text-xl font-black text-[#2F5253] mb-4 flex items-center gap-2">
              <svg className="w-6 h-6 text-[#579799]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
              Dự báo {dailyForecast.length} ngày tới
            </h3>
            <div className="flex gap-4 overflow-x-auto custom-scroll pb-4 snap-x">
              {dailyForecast.map((day, index) => (
                <div key={index} className={`relative snap-center flex-shrink-0 w-40 flex flex-col items-center justify-center p-4 rounded-xl border-2 transition cursor-pointer ${index === 0 ? 'border-red-400 bg-red-50' : 'border-gray-200 hover:border-[#579799]'}`}>
                  {index === 0 && <span className="bg-red-500 text-white text-[10px] font-bold px-2.5 py-1 rounded-bl-xl rounded-tr-lg absolute top-0 right-0 shadow-sm">Hôm nay</span>}
                  <p className="font-bold text-gray-700 mb-2 mt-1">{day.date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })}</p>
                  <span className="text-5xl mb-2 drop-shadow-sm">{getWeatherDetails(day.code).icon}</span>
                  <h4 className="text-3xl font-black text-[#2F5253]">{day.maxTemp}°</h4>
                  <p className="text-xs text-gray-500 text-center font-medium mt-1 leading-tight">{getWeatherDetails(day.code).label}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 flex flex-col">
              <div className="flex gap-4 border-b border-gray-200 mb-2">
                <button onClick={() => setActiveTab('hourly')} className={`pb-2 font-bold text-lg transition ${activeTab === 'hourly' ? 'text-[#579799] border-b-4 border-[#579799]' : 'text-gray-400 hover:text-gray-600'}`}>Theo giờ</button>
                <button onClick={() => setActiveTab('daily')} className={`pb-2 font-bold text-lg transition ${activeTab === 'daily' ? 'text-[#579799] border-b-4 border-[#579799]' : 'text-gray-400 hover:text-gray-600'}`}>Biểu đồ Tuần</button>
              </div>

              {(() => {
                const generateSmoothPath = (points) => {
                  if (points.length === 0) return '';
                  let d = `M ${points[0].x} ${points[0].y}`;
                  for (let i = 0; i < points.length - 1; i++) {
                    const p1 = points[i];
                    const p2 = points[i + 1];
                    const mx = (p1.x + p2.x) / 2;
                    d += ` C ${mx} ${p1.y}, ${mx} ${p2.y}, ${p2.x} ${p2.y}`;
                  }
                  return d;
                };

                const tempDiffHourly = maxHourlyTemp - minHourlyTemp;
                const hourlyPoints = hourlyData.map((data, idx) => ({
                  x: (idx + 0.5) * (100 / hourlyData.length),
                  y: 100 - (tempDiffHourly === 0 ? 50 : ((data.temp - minHourlyTemp) / tempDiffHourly) * 50 + 25) 
                }));
                const hourlyLinePath = generateSmoothPath(hourlyPoints);
                const hourlyAreaPath = hourlyPoints.length > 0 ? `${hourlyLinePath} L ${hourlyPoints[hourlyPoints.length - 1].x} 100 L ${hourlyPoints[0].x} 100 Z` : '';

                const maxDailyTempLimit = Math.max(...dailyForecast.map(d => d.maxTemp));
                const minDailyTempLimit = Math.min(...dailyForecast.map(d => d.minTemp));
                const dailyDiff = maxDailyTempLimit - minDailyTempLimit;

                const dailyMaxPoints = dailyForecast.map((day, idx) => ({
                  x: (idx + 0.5) * (100 / dailyForecast.length),
                  y: 100 - (dailyDiff === 0 ? 70 : ((day.maxTemp - minDailyTempLimit) / dailyDiff) * 45 + 40)
                }));
                const dailyMinPoints = dailyForecast.map((day, idx) => ({
                  x: (idx + 0.5) * (100 / dailyForecast.length),
                  y: 100 - (dailyDiff === 0 ? 30 : ((day.minTemp - minDailyTempLimit) / dailyDiff) * 45 + 25)
                }));
                const dailyMaxLinePath = generateSmoothPath(dailyMaxPoints);
                const dailyMinLinePath = generateSmoothPath(dailyMinPoints);

                return (
                  <div className="flex-grow flex flex-col h-72 pt-24 pb-8 relative z-10">
                    <div className="flex-1 relative w-full border-b border-gray-100">
                      <svg className="absolute inset-0 w-full h-full z-0 pointer-events-none overflow-visible" viewBox="0 0 100 100" preserveAspectRatio="none">
                        {activeTab === 'hourly' ? (
                          <>
                            <defs><linearGradient id="hourlyGradientFix" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="#f7a452" stopOpacity="0.4" /><stop offset="100%" stopColor="#f7a452" stopOpacity="0.0" /></linearGradient></defs>
                            <path d={hourlyAreaPath} fill="url(#hourlyGradientFix)" />
                            <path d={hourlyLinePath} fill="none" stroke="#f7a452" strokeWidth="3" vectorEffect="non-scaling-stroke" />
                          </>
                        ) : (
                          <>
                            <path d={dailyMaxLinePath} fill="none" stroke="#ef4444" strokeWidth="2.5" vectorEffect="non-scaling-stroke" />
                            <path d={dailyMinLinePath} fill="none" stroke="#8b5cf6" strokeWidth="2.5" vectorEffect="non-scaling-stroke" />
                          </>
                        )}
                      </svg>

                      <div className="absolute inset-0 flex justify-between w-full h-full z-10">
                        {activeTab === 'hourly' ? hourlyData.map((data, idx) => {
                          const code = weatherData.hourly.weather_code[currentHourIndex + idx];
                          const detail = getWeatherDetails(code);
                          const yPos = hourlyPoints[idx].y;

                          const isFirst = idx === 0;
                          const isLast = idx === hourlyData.length - 1;
                          const tooltipPos = isFirst ? 'left-0' : isLast ? 'right-0' : 'left-1/2 -translate-x-1/2';
                          const arrowPos = isFirst ? 'left-4' : isLast ? 'right-4' : 'left-1/2 -translate-x-1/2';

                          return (
                            <div key={`hour-fix-${idx}`} className="flex flex-col items-center flex-1 relative group cursor-pointer h-full justify-end z-10 hover:z-50">
                              <div className="absolute inset-y-0 w-[1px] bg-red-400 opacity-0 group-hover:opacity-100 transition-opacity z-0"></div>
                              <div className={`absolute bg-white border border-gray-200 shadow-2xl rounded-xl p-3 flex flex-col items-center w-24 opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none transform -translate-y-2 group-hover:-translate-y-4 z-50 ${tooltipPos}`} style={{ bottom: `calc(${100 - yPos}% + 15px)` }}>
                                <div className={`absolute -bottom-2 w-4 h-4 bg-white border-b border-r border-gray-200 transform rotate-45 ${arrowPos}`}></div>
                                <p className="text-[#579799] font-bold text-[11px] mb-1">{data.time}</p>
                                <div className="flex items-center gap-1 mb-1"><span className="text-xl">{detail.icon}</span><span className="text-xl font-black text-[#2F5253]">{data.temp}°</span></div>
                                <p className="text-gray-500 font-bold text-[10px] text-center">{detail.label}</p>
                              </div>

                              <div className="absolute w-3.5 h-3.5 bg-white rounded-full border-2 border-[#f7a452] shadow-md z-30 group-hover:scale-125 transition-transform" style={{ top: `calc(${yPos}% - 7px)` }}></div>
                              <span className="text-[14px] font-black text-[#2F5253] absolute transition-transform group-hover:-translate-y-2 group-hover:opacity-0 z-20" style={{ top: `calc(${yPos}% - 28px)` }}>{data.temp}°</span>
                              <span className="text-[11px] text-gray-500 font-bold absolute -bottom-6 bg-white z-10 px-1 w-full text-center">{data.time}</span>
                            </div>
                          );
                        }) : dailyForecast.map((day, idx) => {
                          const yMaxPos = dailyMaxPoints[idx].y;
                          const yMinPos = dailyMinPoints[idx].y;
                          const detail = getWeatherDetails(day.code);

                          const isFirst = idx === 0;
                          const isLast = idx === dailyForecast.length - 1;
                          const isSecondLast = idx === dailyForecast.length - 2;
                          const tooltipPos = isFirst ? 'left-0' : (isLast || isSecondLast) ? 'right-0' : 'left-1/2 -translate-x-1/2';
                          const arrowPos = isFirst ? 'left-8' : isLast ? 'right-8' : isSecondLast ? 'right-[5.5rem]' : 'left-1/2 -translate-x-1/2';

                          return (
                            <div key={`day-${idx}`} className="flex flex-col items-center flex-1 relative group cursor-pointer h-full justify-end z-10 hover:z-50">
                              <div className="absolute inset-y-0 w-[1px] bg-gray-800 opacity-0 group-hover:opacity-100 transition-opacity z-0"></div>
                              <div className={`absolute bg-white border border-gray-200 shadow-2xl rounded-xl p-3 flex flex-col items-center min-w-[180px] opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none transform -translate-y-2 group-hover:-translate-y-4 z-50 ${tooltipPos}`} style={{ bottom: `calc(${100 - yMaxPos}% + 15px)` }}>
                                <div className={`absolute -bottom-2 w-4 h-4 bg-white border-b border-r border-gray-200 transform rotate-45 ${arrowPos}`}></div>
                                <div className="flex justify-between items-end w-full mb-2 border-b border-gray-100 pb-1">
                                  <div>
                                    <p className="text-[#579799] font-bold text-[11px]">{idx === 0 ? 'Hôm nay' : day.date.toLocaleDateString('vi-VN', { weekday: 'long' })}</p>
                                    <p className="text-gray-400 font-medium text-[9px]">{day.date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })}</p>
                                  </div>
                                  <span className="text-xl">{detail.icon}</span>
                                </div>
                                <div className="flex items-center justify-between w-full mb-1"><span className="text-gray-500 font-bold text-[10px] uppercase">Cao nhất:</span><span className="text-lg font-black text-red-500">{day.maxTemp}°</span></div>
                                <div className="flex items-center justify-between w-full mb-1"><span className="text-gray-500 font-bold text-[10px] uppercase">Thấp nhất:</span><span className="text-lg font-black text-[#8b5cf6]">{day.minTemp}°</span></div>
                                <p className="text-[#2F5253] font-bold text-[11px] w-full text-center bg-[#F6F7F0] py-1 rounded mt-1">{detail.label}</p>
                              </div>

                              <div className="absolute w-2.5 h-2.5 bg-red-500 rounded-full border border-white shadow-sm z-30 group-hover:scale-150 transition-transform" style={{ top: `calc(${yMaxPos}% - 5px)` }}></div>
                              <span className="text-[13px] font-black text-red-500 absolute transition-opacity group-hover:opacity-0 z-20" style={{ top: `calc(${yMaxPos}% - 22px)` }}>{day.maxTemp}°</span>
                              
                              <div className="absolute w-2.5 h-2.5 bg-[#8b5cf6] rounded-full border border-white shadow-sm z-30 group-hover:scale-150 transition-transform" style={{ top: `calc(${yMinPos}% - 5px)` }}></div>
                              <span className="text-[13px] font-black text-[#8b5cf6] absolute transition-opacity group-hover:opacity-0 z-20" style={{ top: `calc(${yMinPos}% + 8px)` }}>{day.minTemp}°</span>
                              
                              <div className="absolute bottom-0 w-1 bg-gray-100 rounded-t-full group-hover:bg-gray-300 transition-colors z-0" style={{ height: `${100 - yMaxPos}%` }}></div>
                              <span className="text-[11px] text-gray-500 font-bold absolute -bottom-6 bg-white w-full text-center z-10 px-1 border-b-2 border-transparent group-hover:border-gray-800 transition-colors">{idx === 0 ? 'H.nay' : day.date.toLocaleDateString('vi-VN', { weekday: 'short' })}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 flex flex-col">
              <div className="border-b border-gray-200 mb-4 flex items-center gap-2">
                <h3 className="pb-2 font-bold text-lg text-[#579799]">Bản đồ Vệ tinh & Nhiệt độ</h3>
              </div>
              <div className="flex-grow relative rounded-xl overflow-hidden min-h-[250px] border border-gray-200 shadow-inner">
                <iframe width="100%" height="100%" src={`https://embed.windy.com/embed.html?type=map&location=coordinates&metricRain=mm&metricTemp=°C&metricWind=km/h&zoom=6&overlay=temp&product=ecmwf&level=surface&lat=${currentCity.lat}&lon=${currentCity.lon}`} frameBorder="0" className="absolute inset-0 w-full h-full" title="Bản đồ thời tiết thực tế"></iframe>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// =======================================================================
// 3. COMPONENT HOME
// =======================================================================
export default function Home({ user, categories, searchTerm, setSearchTerm, filterCategory, setFilterCategory, selectedArticle, setSelectedArticle, showWeatherDashboard, setShowWeatherDashboard }) {
  const [articles, setArticles] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const commentsSectionRef = useRef(null);
  const [commentText, setCommentText] = useState('');
  const [articleComments, setArticleComments] = useState({});
  const [replyingTo, setReplyingTo] = useState(null); 
  const [replyText, setReplyText] = useState(''); 
  const [commentFile, setCommentFile] = useState(null);
  const [replyFile, setReplyFile] = useState(null);
  const [expandedComments, setExpandedComments] = useState({});
  const [selectedCity, setSelectedCity] = useState(CITIES[0]);
  const [weatherData, setWeatherData] = useState(null);
  const [isWeatherLoading, setIsWeatherLoading] = useState(true);
  const [footerSortMode, setFooterSortMode] = useState('default');
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [footerModal, setFooterModal] = useState(null);
  const [feedbackData, setFeedbackData] = useState({ name: '', email: '', message: '' });
  const [showAdvSearch, setShowAdvSearch] = useState(false);
  const [advAuthor, setAdvAuthor] = useState('');
  const [advDateFrom, setAdvDateFrom] = useState('');
  const [advDateTo, setAdvDateTo] = useState('');
  const [advJournal, setAdvJournal] = useState('');
  const [showCitationModal, setShowCitationModal] = useState(false);
  const [citationFormat, setCitationFormat] = useState('apa');
  const [copiedText, setCopiedText] = useState(false);
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

  const [likedArticles, setLikedArticles] = useState(() => {
    const saved = localStorage.getItem('db_liked_articles');
    return saved ? JSON.parse(saved) : {};
  });
  
  const [likedComments, setLikedComments] = useState(() => {
    const saved = localStorage.getItem('db_liked_comments');
    return saved ? JSON.parse(saved) : {};
  });

  useEffect(() => {
    document.body.style.overflowX = 'hidden';
    const handleScroll = () => { setShowBackToTop(window.scrollY > 300); };
    window.addEventListener('scroll', handleScroll);
    return () => { document.body.style.overflowX = 'auto'; window.removeEventListener('scroll', handleScroll); };
  }, []);

  useEffect(() => { localStorage.setItem('db_liked_articles', JSON.stringify(likedArticles)); }, [likedArticles]);
  useEffect(() => { localStorage.setItem('db_liked_comments', JSON.stringify(likedComments)); }, [likedComments]);

  const fetchWeatherByCoords = (latitude, longitude) => {
    setIsWeatherLoading(true);
    axios.get(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,precipitation,weather_code,wind_speed_10m&timezone=Asia%2FHo_Chi_Minh`)
      .then(res => { setWeatherData(res.data.current); setIsWeatherLoading(false); })
      .catch(err => { console.error("Lỗi tải thời tiết", err); setIsWeatherLoading(false); });
  };

  useEffect(() => { fetchWeatherByCoords(selectedCity.lat, selectedCity.lon); }, [selectedCity]);

  const getLoggedInUser = () => {
    if (user && user.name) return user;
    try { const storedUser = localStorage.getItem('user_session'); return storedUser ? JSON.parse(storedUser) : null; } catch (e) { return null; }
  };

  const getCurrentUserAvatar = () => {
    const activeUser = getLoggedInUser();
    if (activeUser?.avatar) return `http://127.0.0.1:8000/storage/${activeUser.avatar}`;
    const fallbackName = activeUser?.name || 'Khách';
    return `https://ui-avatars.com/api/?name=${fallbackName}&background=579799&color=fff`;
  };

  const getCurrentUserName = () => {
    const activeUser = getLoggedInUser();
    return activeUser?.name || 'Khách truy cập';
  };

  const fetchComments = (articleId) => {
    axios.get(`http://127.0.0.1:8000/api/articles/${articleId}/comments`)
      .then(res => setArticleComments(prev => ({ ...prev, [articleId]: res.data })))
      .catch(err => console.error(err));
  };

  const fetchPublishedArticles = (page = 1, isAppend = false) => {
    if (isAppend) {
      setIsLoadingMore(true);
    } else {
      setIsLoading(true);
    }

    axios.get(`http://127.0.0.1:8000/api/workspace/published-articles?page=${page}&per_page=6`)
      .then(res => {
        const incomingArticles = res.data.data || (Array.isArray(res.data) ? res.data : []);
        const curPage = res.data.current_page || 1;
        const totalPages = res.data.last_page || 1;

        if (isAppend) {
          setArticles(prev => [...prev, ...incomingArticles]);
        } else {
          setArticles(incomingArticles);
        }

        setCurrentPage(curPage);
        setLastPage(totalPages);

        incomingArticles.forEach(article => fetchComments(article.id));

        const urlParams = new URLSearchParams(window.location.search);
        const articleIdFromUrl = urlParams.get('article_id');
        if (articleIdFromUrl) {
          const articleToOpen = incomingArticles.find(a => String(a.id) === String(articleIdFromUrl));
          if (articleToOpen) {
            setSelectedArticle(articleToOpen);
            window.history.replaceState({}, document.title, window.location.pathname);
          }
        }
      })
      .catch(err => console.error("Lỗi khi tải bài viết:", err))
      .finally(() => {
        setIsLoading(false);
        setIsLoadingMore(false);
      });
  };

  useEffect(() => {
    fetchPublishedArticles(1, false);
  }, []);

  useEffect(() => {
    if (selectedArticle && selectedArticle.autoScrollToComments) {
      setTimeout(() => {
        commentsSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 300);
    }
  }, [selectedArticle]);
  
  const getFileUrl = (path) => path ? `http://127.0.0.1:8000/storage/${path}` : '#';

  const getThumbnailUrl = (article) => {
    if (article.image_path) return getFileUrl(article.image_path);
    const abstractStr = article.abstract || '';
    const cleanStr = abstractStr.replace(/&#91;/g, '[').replace(/&#93;/g, ']');
    const match = cleanStr.match(/\[\s*\[\s*IMAGE_BLOCK\s*:\s*([^\]]+?)\s*\]\s*\]/i);
    if (match && match[1]) {
      const cleanFileName = match[1].replace(/<\/?[^>]+(>|$)/g, "").trim();
      return `http://127.0.0.1:8000/storage/article_media/${cleanFileName}`;
    }
    return null;
  };

  const isNewArticle = (dateString) => {
    if (!dateString) return false;
    const articleDate = new Date(dateString);
    const currentDate = new Date();
    const diffTime = Math.abs(currentDate - articleDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
    return diffDays <= 3;
  };

  // LOGIC TRÍCH DẪN CHUẨN KHOA HỌC
  const generateCitation = (article, format) => {
    if (!article) return '';
    const author = article.user?.name || article.author || 'Khuyết danh';
    const year = new Date(article.updated_at || article.created_at || Date.now()).getFullYear();
    const title = article.title || '';
    const journal = article.journal || 'Tạp chí Khoa học & Đời sống SRH';
    const url = window.location.origin + `/?article_id=${article.id}`;

    switch (format) {
      case 'ieee':
        return `[1] ${author}, "${title}," ${journal}, ${year}. [Trực tuyến]. Khả dụng: ${url}`;
      case 'harvard':
        return `${author} (${year}) '${title}', ${journal}. Có tại: ${url}`;
      case 'apa':
      default:
        return `${author}. (${year}). ${title}. ${journal}. Lấy từ ${url}`;
    }
  };

  const handleCopyCitation = (text) => {
    navigator.clipboard.writeText(text);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2000);
  };

  const handleExportPDF = (article) => {
    if (!article) return;

    const element = document.createElement('div');
    element.style.padding = '25px';
    element.style.fontFamily = '"Times New Roman", Times, serif';
    element.style.color = '#000';
    element.style.lineHeight = '1.6';

    const cleanAbstract = (article.abstract || '')
      .replace(/\[\[.*?\]\]/g, '')
      .replace(/<[^>]*>/g, '')
      .trim();

    element.innerHTML = `
      <div style="text-align: center; border-bottom: 2px solid #2F5253; padding-bottom: 15px; margin-bottom: 25px;">
        <h2 style="text-transform: uppercase; margin: 0; color: #2F5253; font-size: 18px; font-weight: bold;">Tạp chí Khoa học & Đời sống SRH</h2>
        <p style="font-size: 12px; color: #555; margin: 5px 0 0 0;">
          ISSN: 1859-4611 | Ngày xuất bản: ${new Date(article.updated_at || article.created_at).toLocaleDateString('vi-VN')}
        </p>
      </div>
      
      <h1 style="font-size: 20px; text-align: center; margin-bottom: 15px; font-weight: bold; color: #111;">
        ${article.title}
      </h1>
      
      <div style="text-align: center; margin-bottom: 30px; font-size: 14px; font-style: italic;">
        <strong>Tác giả:</strong> ${article.user?.name || article.author || 'Khuyết danh'}
      </div>
      
      <div style="background: #f9f9f9; padding: 15px; border-left: 4px solid #579799; margin-bottom: 25px;">
        <h3 style="margin-top: 0; font-size: 14px; text-transform: uppercase;">Tóm tắt (Abstract)</h3>
        <p style="font-size: 13px; text-align: justify; margin: 0;">${cleanAbstract || 'Không có tóm tắt.'}</p>
      </div>
      
      <div style="font-size: 14px; text-align: justify; white-space: pre-wrap;">
        ${typeof article.content === 'string' ? article.content.replace(/<[^>]*>/g, '') : 'Nội dung chi tiết đang được biên tập...'}
      </div>
    `;

    const opt = {
      margin:       15,
      filename:     `Nghien_cuu_${article.id}.pdf`,
      image:        { type: 'jpeg', quality: 0.98 },
      html2canvas:  { scale: 2, useCORS: true },
      jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    html2pdf().set(opt).from(element).save();
  };

  const renderFormattedContent = (article) => {
    const raw = article.abstract || '';
    const cleanRaw = raw.replace(/&#91;/g, '[').replace(/&#93;/g, ']');
    const parts = cleanRaw.split(/(\[\s*\[\s*[A-Z]+_BLOCK\s*:\s*[^\]]+?\s*\]\s*\])/gi);
    let imageCount = 0;

    return (
      <div className="flex flex-col gap-4 text-gray-800 text-[16px] leading-relaxed">
        {parts.map((part, idx) => {
          const trimmedPart = part.trim();
          if (!trimmedPart) return null;
          const imgMatch = trimmedPart.match(/\[\s*\[\s*IMAGE_BLOCK\s*:\s*([^\]]+?)\s*\]\s*\]/i);
          if (imgMatch) {
            imageCount++;
            const cleanFileName = imgMatch[1].replace(/<\/?[^>]+(>|$)/g, "").trim();
            const url = (imageCount === 1 && article.image_path) ? `http://127.0.0.1:8000/storage/${article.image_path}` : `http://127.0.0.1:8000/storage/article_media/${cleanFileName}`;
            return (
              <div key={idx} className="flex justify-center my-3 w-full">
                <img src={url} alt="Ảnh bài viết" className="w-auto max-w-[500px] max-h-[300px] object-contain rounded-xl shadow-md border border-gray-200" onError={(e) => { e.target.onerror = null; e.target.outerHTML = '<div style="padding:20px; color:#ef4444; text-align:center;">❌ Ảnh chưa được tải lên</div>'; }} />
              </div>
            );
          }

          const vidMatch = trimmedPart.match(/\[\s*\[\s*VIDEO_BLOCK\s*:\s*([^\]]+?)\s*\]\s*\]/i);
          if (vidMatch) {
            const cleanFileName = vidMatch[1].replace(/<\/?[^>]+(>|$)/g, "").trim();
            const videoPath = article.video_path ? article.video_path : `article_media/${cleanFileName}`;
            const url = `http://127.0.0.1:8000/api/video-stream?path=${encodeURIComponent(videoPath)}`;
            
            return (
              <div key={idx} className="flex justify-center my-3 w-full">
                <div className="w-full max-w-[500px] bg-black rounded-xl shadow-md overflow-hidden aspect-video flex items-center justify-center">
                  <video 
                    src={url} 
                    controls 
                    preload="metadata"
                    playsInline
                    className="w-full h-full object-contain" 
                    onError={(e) => { e.target.onerror = null; e.target.outerHTML = '<div style="padding:20px; color:#ef4444; text-align:center; background:white; width:100%;">🎥 Lỗi tải video</div>'; }}
                  ></video>
                </div>
              </div>
            );
          }
          return <div key={idx} className="whitespace-pre-wrap text-justify text-[15px]" dangerouslySetInnerHTML={{ __html: trimmedPart }} />;
        })}
      </div>
    );
  };

  const handleOpenArticle = (article) => {
    setSelectedArticle(article);
    axios.post(`http://127.0.0.1:8000/api/articles/${article.id}/view`)
      .then(res => setArticles(prev => prev.map(a => a.id === article.id ? { ...a, views: res.data.views } : a)))
      .catch(err => console.log(err));
  };

  const handleSubmitComment = () => {
    if (!commentText.trim() && !commentFile) return alert("Vui lòng nhập nội dung hoặc đính kèm file!");
    const currentUser = getLoggedInUser();
    if (!currentUser) return alert("Vui lòng đăng nhập để bình luận!");

    const formData = new FormData();
    formData.append('article_id', selectedArticle.id);
    formData.append('user_id', currentUser.id);
    formData.append('content', commentText || ' '); 
    if (commentFile) formData.append('attachment', commentFile);

    axios.post('http://127.0.0.1:8000/api/comments', formData, { headers: { 'Content-Type': 'multipart/form-data' } })
      .then(() => { setCommentText(''); setCommentFile(null); fetchComments(selectedArticle.id); })
      .catch(() => alert("Lỗi khi gửi bình luận"));
  };

  const handleSubmitReply = (commentId) => {
    if (!replyText.trim() && !replyFile) return alert("Vui lòng nhập nội dung hoặc đính kèm file!");
    const currentUser = getLoggedInUser();
    if (!currentUser) return alert("Vui lòng đăng nhập để phản hồi!");

    const formData = new FormData();
    formData.append('article_id', selectedArticle.id);
    formData.append('user_id', currentUser.id);
    formData.append('content', replyText || ' ');
    formData.append('parent_id', commentId);
    if (replyFile) formData.append('attachment', replyFile);

    axios.post('http://127.0.0.1:8000/api/comments', formData, { headers: { 'Content-Type': 'multipart/form-data' } })
      .then(() => {
        setReplyingTo(null); setReplyText(''); setReplyFile(null); 
        setExpandedComments(prev => ({ ...prev, [commentId]: true }));
        fetchComments(selectedArticle.id);
      }).catch(() => alert("Lỗi khi gửi phản hồi"));
  };

  const handleDeleteComment = (commentId) => {
    if (window.confirm("Xóa vĩnh viễn bình luận này khỏi hệ thống?")) {
      axios.delete(`http://127.0.0.1:8000/api/comments/${commentId}`)
        .then(() => fetchComments(selectedArticle.id)).catch(() => alert("Lỗi khi xóa bình luận!"));
    }
  };

  const handleLikeArticle = (articleId) => {
    const currentUser = getLoggedInUser();
    if (!currentUser) return alert("Vui lòng đăng nhập để thích!");
    const key = `${articleId}_${currentUser.id}`;
    setLikedArticles(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleLikeComment = (commentId) => {
    const currentUser = getLoggedInUser();
    if (!currentUser) return alert("Vui lòng đăng nhập để thích!");
    const key = `${commentId}_${currentUser.id}`;
    setLikedComments(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const toggleReplies = (commentId) => {
    setExpandedComments(prev => ({ ...prev, [commentId]: !prev[commentId] }));
  };

  const getCategoryName = (id) => {
    const cat = categories?.find(c => c.id === id);
    return cat ? cat.name : 'Chưa phân loại';
  };

  const filteredArticles = useMemo(() => {
    let list = articles.filter(article => {
      const titleSafe = (article.title || '').toLowerCase();
      const abstractSafe = (article.abstract || '').toLowerCase();
      const authorSafe = (article.user?.name || article.author || 'Khuyết danh').toLowerCase();
      const keyword = (searchTerm || '').toLowerCase();
      const matchSearch = !keyword || titleSafe.includes(keyword) || abstractSafe.includes(keyword) || authorSafe.includes(keyword);
      const matchCategory = !filterCategory || (article.category_id && String(article.category_id) === String(filterCategory));   
      const matchAdvAuthor = !advAuthor.trim() || authorSafe.includes(advAuthor.trim().toLowerCase());
      const rawDateString = article.published_date || article.created_at || '';
      const safeDateString = rawDateString.includes(' ') ? rawDateString.replace(' ', 'T') : rawDateString;
      const articleDate = new Date(safeDateString);

      let matchDateFrom = true;
      if (advDateFrom) {
        const fromDate = new Date(advDateFrom + 'T00:00:00');
        matchDateFrom = articleDate >= fromDate;
      }

      let matchDateTo = true;
      if (advDateTo) {
        const toDate = new Date(advDateTo + 'T23:59:59');
        matchDateTo = articleDate <= toDate;
      }
      // ==============================================================

      const cleanJournal = advJournal ? advJournal.split('(ISSN:')[0].trim().toLowerCase() : '';
      const contentSafe = typeof article.content === 'string' 
        ? article.content.toLowerCase() 
        : JSON.stringify(article.content || '').toLowerCase();
      const matchJournal = !cleanJournal || 
        (article.journal && article.journal.toLowerCase().includes(cleanJournal)) ||
        titleSafe.includes(cleanJournal) ||
        abstractSafe.includes(cleanJournal) ||
        contentSafe.includes(cleanJournal);

      return matchSearch && matchCategory && matchAdvAuthor && matchDateFrom && matchDateTo && matchJournal;
    });

    if (footerSortMode === 'video') list = list.filter(a => a.video_path || (a.abstract && a.abstract.includes('VIDEO_BLOCK')));
    else if (footerSortMode === 'trending') list = [...list].sort((a, b) => (b.views || 0) - (a.views || 0));
    else if (footerSortMode === 'latest') list = [...list].sort((a, b) => new Date(b.published_date || b.created_at) - new Date(a.published_date || a.created_at));
    
    return list;
  }, [articles, searchTerm, filterCategory, footerSortMode, advAuthor, advDateFrom, advDateTo, advJournal]);

  const recentArticles = articles.slice(0, 5);
  const featuredArticles = useMemo(() => [...articles].sort((a, b) => (b.views || 0) - (a.views || 0)).slice(0, 5), [articles]);

  const scrollToTop = () => { window.scrollTo({ top: 0, behavior: 'smooth' }); };
  const handleFooterNav = (type, categoryId = '') => {
    if (setSearchTerm) setSearchTerm('');
    if (setFilterCategory) setFilterCategory(categoryId);
    setFooterSortMode(type);
    setShowWeatherDashboard(false);
    scrollToTop();
  };

  const resetAdvSearch = () => {
    setAdvAuthor('');
    setAdvDateFrom('');
    setAdvDateTo('');
    setAdvJournal('');
    setFooterSortMode('default');
    if (setSearchTerm) setSearchTerm('');
    if (setFilterCategory) setFilterCategory('');
  };

  const renderFilePreview = (file, clearFn) => {
    if (!file) return null;
    const isImage = file.type.startsWith('image/');
    return (
      <div className="relative inline-block mb-3 animate-fade-in group ml-4 mt-2">
        {isImage ? (
          <img src={URL.createObjectURL(file)} alt="preview" className="h-24 w-auto rounded-lg border-2 border-[#579799] object-cover shadow-sm" />
        ) : (
          <div className="flex items-center gap-2 bg-teal-50 text-teal-800 px-4 py-2 rounded-lg border border-teal-200 shadow-sm">
            <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"></path></svg>
            <span className="text-sm font-bold truncate max-w-[200px]">{file.name}</span>
          </div>
        )}
        <button onClick={() => clearFn(null)} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold shadow-md hover:bg-red-600 transition opacity-0 group-hover:opacity-100">✕</button>
      </div>
    );
  };

  const renderAttachment = (url) => {
    if (!url) return null;
    const ext = url.split('.').pop().toLowerCase();
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) return <img src={url} alt="đính kèm" className="mt-3 max-h-48 rounded-xl border border-gray-200 object-contain shadow-sm cursor-pointer hover:opacity-90 transition" onClick={() => window.open(url, '_blank')} />;
    if (['mp4', 'webm', 'ogg'].includes(ext)) return <video src={url} controls className="mt-3 max-h-48 rounded-xl border border-gray-200 bg-black shadow-sm"></video>;
    return (
      <a href={url} target="_blank" rel="noreferrer" className="mt-3 flex items-center gap-2 bg-gray-50 hover:bg-gray-100 p-2.5 rounded-xl border border-gray-200 transition inline-flex w-fit shadow-sm group">
        <div className="bg-[#579799] p-1.5 rounded-lg text-white group-hover:scale-110 transition"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"></path></svg></div>
        <span className="text-sm font-bold text-[#2F5253] underline decoration-transparent group-hover:decoration-[#579799] transition">Xem tài liệu đính kèm</span>
      </a>
    );
  };

  const getMainHeading = () => {
    if (filterCategory) return getCategoryName(parseInt(filterCategory));
    if (footerSortMode === 'trending') return 'Bài báo xem nhiều nhất 🔥';
    if (footerSortMode === 'video') return 'Tin tức Video 🎥';
    return 'Tin tức';
  };

  const activeUser = getLoggedInUser();
  const isInternalStaff = activeUser && (activeUser.role === 'admin' || activeUser.role === 'moderator');
  const isShowAllNews = !filterCategory;
  const hasActiveAdvFilter = advAuthor || advDateFrom || advDateTo || advJournal || footerSortMode !== 'default';

  if (isLoading) return <div className="text-center mt-12 text-[#579799] font-bold animate-pulse">Đang tải...</div>;

  return (
    <>
      <style>{`
        .custom-scroll::-webkit-scrollbar { width: 6px; height: 6px; }
        .custom-scroll::-webkit-scrollbar-track { background: #f1f1f1; border-radius: 8px; }
        .custom-scroll::-webkit-scrollbar-thumb { background: #9BBFBA; border-radius: 8px; }
        .custom-scroll::-webkit-scrollbar-thumb:hover { background: #579799; }
      `}</style>

      {/* KHỐI SEO & META TAGS ĐỘNG (DÀNH CHO CHIA SẺ FACEBOOK/ZALO) */}
      <Helmet>
        {selectedArticle ? (
          <>
            <title>{selectedArticle.title} - Tạp chí Khoa học SRH</title>
            <meta name="description" content={(selectedArticle.abstract || '').replace(/\[\[.*?\]\]/g, '').replace(/<[^>]*>/g, '').substring(0, 160)} />
            <meta property="og:type" content="article" />
            <meta property="og:title" content={selectedArticle.title} />
            <meta property="og:description" content={(selectedArticle.abstract || '').replace(/\[\[.*?\]\]/g, '').replace(/<[^>]*>/g, '').substring(0, 160)} />
            <meta property="og:image" content={getThumbnailUrl(selectedArticle) || "http://127.0.0.1:8000/default-thumbnail.jpg"} />
            <meta property="og:url" content={window.location.origin + `/?article_id=${selectedArticle.id}`} />
            <meta name="twitter:card" content="summary_large_image" />
          </>
        ) : (
          <>
            <title>Trang chủ - Tạp chí Khoa học & Công nghệ Báo Hay VN</title>
            <meta name="description" content="Hệ thống quản lý báo chí và công bố các công trình nghiên cứu khoa học trực tuyến uy tín tại Việt Nam." />
            <meta property="og:title" content="Tạp chí Khoa học & Công nghệ Báo Hay VN" />
            <meta property="og:description" content="Hệ thống quản lý báo chí và công bố các công trình nghiên cứu khoa học." />
            <meta property="og:image" content="http://127.0.0.1:8000/default-logo.png" />
          </>
        )}
      </Helmet>
      
      <div 
        className="mt-8 animate-fade-in mb-16 min-h-[60vh]"
        style={{ width: '100vw', marginLeft: 'calc(50% - 50vw)', marginRight: 'calc(50% - 50vw)', paddingLeft: '2rem', paddingRight: '2rem', boxSizing: 'border-box' }}
      >
        <div className="w-full">
          
          { !showWeatherDashboard ? (
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 relative animate-fade-in">
              <div className="hidden lg:flex flex-col gap-6 w-full lg:col-span-1 relative">
                <div className="sticky top-20">
                  <div 
                    onClick={() => setShowWeatherDashboard(true)}
                    className="bg-white rounded-2xl shadow-sm border border-[#9BBFBA] p-4 text-center overflow-hidden relative mb-4 cursor-pointer hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 group"
                  >
                    <div className="absolute -top-10 -right-10 w-24 h-24 bg-[#579799] opacity-10 rounded-full blur-xl group-hover:opacity-20 transition-all duration-500"></div>

                    <div className="flex justify-between items-center mb-3 relative z-10 border-b border-gray-100 pb-2">
                      <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                        <svg className="w-3.5 h-3.5 text-[#579799]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path></svg>
                        <select 
                          value={selectedCity.name} 
                          onClick={(e) => e.stopPropagation()}
                          onChange={(e) => {
                            const city = CITIES.find(c => c.name === e.target.value);
                            if (city) setSelectedCity(city);
                          }}
                          className="font-extrabold text-[#2F5253] text-[11px] uppercase tracking-wider bg-transparent outline-none cursor-pointer border-b border-dotted border-[#579799] group-hover:text-[#579799] transition-colors"
                        >
                          {CITIES.map(c => (
                            <option key={c.name} value={c.name}>{c.name}, VN</option>
                          ))}
                        </select>
                      </div>
                      <button 
                        onClick={(e) => { e.stopPropagation(); fetchWeatherByCoords(selectedCity.lat, selectedCity.lon); }} 
                        className="text-gray-400 hover:text-[#579799] transition transform hover:rotate-180 duration-500 cursor-pointer" 
                        title="Cập nhật thời tiết mới nhất"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
                      </button>
                    </div>

                    {isWeatherLoading ? (
                      <div className="py-6 animate-pulse text-[#579799] text-xs font-bold">Đang tải thời tiết...</div>
                    ) : weatherData ? (
                      <div className="flex flex-col items-center relative z-10">
                        <div className="flex items-center justify-center gap-3 my-1">
                          <span className="text-4xl drop-shadow-sm">{getWeatherDetails(weatherData.weather_code).icon}</span>
                          <div className="flex items-start">
                            <span className="text-4xl font-black text-[#2F5253] leading-none tracking-tight group-hover:text-[#579799] transition-colors">
                              {Math.round(weatherData.temperature_2m)}
                            </span>
                            <span className="text-lg font-black text-gray-400 ml-0.5">°C</span>
                          </div>
                        </div>

                        <p className={`text-xs font-bold mb-3 ${getWeatherDetails(weatherData.weather_code).color}`}>
                          {getWeatherDetails(weatherData.weather_code).label}
                        </p>

                        <div className="grid grid-cols-3 w-full border-t border-gray-100 pt-2.5 gap-1 text-center">
                          <div className="flex flex-col items-center gap-0.5">
                            <span className="text-[10px] text-gray-400 font-semibold">Gió</span>
                            <span className="text-xs font-black text-[#2F5253]">{weatherData.wind_speed_10m}</span>
                          </div>
                          <div className="flex flex-col items-center gap-0.5 border-x border-gray-100">
                            <span className="text-[10px] text-gray-400 font-semibold">Độ ẩm</span>
                            <span className="text-xs font-black text-[#2F5253]">{weatherData.relative_humidity_2m}%</span>
                          </div>
                          <div className="flex flex-col items-center gap-0.5">
                            <span className="text-[10px] text-gray-400 font-semibold">Mưa</span>
                            <span className="text-xs font-black text-[#2F5253]">{weatherData.precipitation}</span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="py-4 text-xs text-gray-400">Lỗi dữ liệu</div>
                    )}
                  </div>

                  <div onClick={() => setFooterModal('media')} className="bg-[#F6F7F0] rounded-2xl border border-[#E5E9DF] p-4 text-center flex flex-col items-center justify-center min-h-[160px] shadow-inner group cursor-pointer hover:border-[#579799] transition">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 group-hover:text-[#579799] transition">Quảng Cáo</span>
                    <p className="text-gray-500 font-medium text-xs leading-relaxed">Khu vực trống<br/>dành cho tài trợ</p>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-3 flex flex-col w-full">
                <div className="flex flex-wrap items-center justify-between gap-4 mb-6 border-b-2 border-[#E5E9DF] pb-4">
                  <h2 className="text-3xl font-black text-[#2F5253] border-l-[6px] border-[#579799] pl-4 tracking-tight">{getMainHeading()}</h2>
                  <div className="flex items-center gap-3">
                    {hasActiveAdvFilter && (
                      <button onClick={resetAdvSearch} className="text-xs font-bold text-red-600 bg-red-50 border border-red-200 px-3 py-2 rounded-xl hover:bg-red-100 transition cursor-pointer">
                        ✕ Đặt lại bộ lọc ({filteredArticles.length})
                      </button>
                    )}
                    <button 
                      onClick={() => setShowAdvSearch(!showAdvSearch)} 
                      className={`text-xs font-extrabold px-4 py-2 rounded-xl border transition flex items-center gap-2 cursor-pointer ${showAdvSearch ? 'bg-[#579799] text-white border-[#579799] shadow-sm' : 'bg-white text-[#2F5253] border-[#9BBFBA] hover:border-[#579799]'}`}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"></path></svg>
                      Tìm kiếm nâng cao
                    </button>
                  </div>
                </div>

                {showAdvSearch && (
                  <div className="bg-[#F6F7F0] border border-[#9BBFBA] rounded-2xl p-5 mb-8 shadow-sm animate-fade-in">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-sm font-black text-[#2F5253] uppercase tracking-wider flex items-center gap-2">
                        Bộ lọc tra cứu bài báo & tài liệu khoa học chuyên sâu
                      </h4>
                      <span className="text-xs font-bold text-[#579799] bg-white px-3 py-1 rounded-full border border-[#E5E9DF]">
                        Tìm thấy: {filteredArticles.length} kết quả
                      </span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div>
                        <label className="block text-[11px] font-extrabold text-gray-600 uppercase mb-1">Tên tác giả</label>
                        <input 
                          type="text"  
                          value={advAuthor} 
                          onChange={(e) => setAdvAuthor(e.target.value)} 
                          className="w-full bg-white border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#579799]" 
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-extrabold text-gray-600 uppercase mb-1">Từ ngày</label>
                        <input 
                          type="date" 
                          value={advDateFrom} 
                          onChange={(e) => setAdvDateFrom(e.target.value)} 
                          className="w-full bg-white border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#579799]" 
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-extrabold text-gray-600 uppercase mb-1">Đến ngày</label>
                        <input 
                          type="date" 
                          value={advDateTo} 
                          onChange={(e) => setAdvDateTo(e.target.value)} 
                          className="w-full bg-white border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#579799]" 
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-extrabold text-gray-600 uppercase mb-1">Tạp chí Khoa học (ISSN)</label>
                        <select 
                          value={advJournal} 
                          onChange={(e) => setAdvJournal(e.target.value)} 
                          className="w-full bg-white border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#579799]" 
                        >
                          <option value="">-- Tất cả tạp chí --</option>
                          {savedJournals.map(j => (
                            <option key={j.id} value={j.name}>{j.name} (ISSN: {j.issn})</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  <div className={isShowAllNews ? "lg:col-span-2 w-full" : "lg:col-span-3 w-full"}>
                    {filteredArticles.length === 0 ? (
                      <div className="text-center text-gray-500 py-16 bg-white rounded-2xl shadow-sm border border-[#E5E9DF]"><p className="text-lg font-bold">Không tìm thấy bài báo nào phù hợp.</p></div>
                    ) : (
                      <>
                        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-2">
                          {filteredArticles.map(article => {
                            const thumbUrl = getThumbnailUrl(article);
                            const currentUser = getLoggedInUser();
                            const likeKey = `${article.id}_${currentUser?.id}`;
                            const isArticleLiked = likedArticles[likeKey];
                            const totalArticleLikes = Object.keys(likedArticles).filter(k => k.startsWith(`${article.id}_`) && likedArticles[k]).length;
                            let commentCount = 0;
                            const cmts = articleComments[article.id] || [];
                            cmts.forEach(cmt => { commentCount += 1; if (cmt.replies) commentCount += cmt.replies.length; });

                            return (
                            <div key={article.id} className="bg-white rounded-2xl shadow-sm border border-[#9BBFBA] overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group flex flex-col">
                              <div className="h-44 bg-gray-100 border-b border-[#E5E9DF] flex items-center justify-center text-[#9BBFBA] group-hover:bg-gray-50 transition relative overflow-hidden">
                                {thumbUrl ? (
                                  <img src={thumbUrl} alt={article.title} className="w-full h-full object-cover transform group-hover:scale-105 transition duration-500" onError={(e) => { e.target.onerror = null; e.target.src = 'https://placehold.co/600x400/fef2f2/ef4444?text=Loi+Anh+Tren+Backend'; }} />
                                ) : article.video_path || (article.abstract && article.abstract.includes('VIDEO_BLOCK')) ? (
                                    (() => {
                                        let vidUrl = article.video_path ? `http://127.0.0.1:8000/storage/${article.video_path}` : '';
                                        if (!vidUrl && article.abstract) {
                                            const vidMatch = article.abstract.match(/\[\s*\[\s*VIDEO_BLOCK\s*:\s*([^\]]+?)\s*\]\s*\]/i);
                                            if (vidMatch && vidMatch[1]) {
                                                const cleanFileName = vidMatch[1].replace(/<\/?[^>]+(>|$)/g, "").trim();
                                                vidUrl = `http://127.0.0.1:8000/storage/article_media/${cleanFileName}`;
                                            }
                                        }
                                        return vidUrl ? (
                                            <div className="relative w-full h-full overflow-hidden">
                                                <video 
                                                    src={`${vidUrl}#t=0.1`} 
                                                    className="w-full h-full object-cover transform group-hover:scale-105 transition duration-500 absolute inset-0 z-0" 
                                                    muted 
                                                    playsInline 
                                                    loop 
                                                    onMouseEnter={(e) => {
                                                        e.target.currentTime = 0;
                                                        e.target.play().catch(() => {});
                                                    }}
                                                    onMouseLeave={(e) => {
                                                        e.target.pause();
                                                        e.target.currentTime = 0.1;
                                                    }}
                                                />
                                                <div className="absolute top-2 right-2 bg-black/50 text-white rounded-full p-1.5 z-10 pointer-events-none">
                                                    <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                                                </div>
                                            </div>
                                        ) : (
                                            <svg className="w-16 h-16 transform group-hover:scale-110 transition duration-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg>
                                        );
                                    })()
                                ) : (
                                  <svg className="w-16 h-16 transform group-hover:scale-110 transition duration-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path></svg>
                                )}
                              </div>
                              <div className="p-5 flex flex-col flex-grow">
                                <span className="text-xs font-black text-[#579799] uppercase tracking-wider mb-2 block line-clamp-1">{getCategoryName(article.category_id)}</span>
                                <h3 onClick={() => handleOpenArticle(article)} className="text-lg font-extrabold text-[#2F5253] mb-2 line-clamp-2 group-hover:text-[#579799] transition cursor-pointer">{article.title}</h3>
                                <p className="text-sm text-gray-600 line-clamp-3 mb-4 overflow-hidden">{article.abstract ? article.abstract.replace(/&#91;/g, '[').replace(/&#93;/g, ']').replace(/\[\s*\[\s*[A-Z]+_BLOCK:[^\]]+\]\s*\]/gi, ' ').replace(/<\/?[^>]+(>|$)/g, "").trim() : "Nội dung đang cập nhật..."}</p>
                                <div className="flex justify-between items-center pt-3 border-t border-[#E5E9DF] mt-auto">
                                  <span className="font-bold text-gray-700 text-xs">{article.user?.name || article.author || 'Khuyết danh'}</span>
                                  <div className="flex items-center gap-3">
                                    <button onClick={() => handleLikeArticle(article.id)} className={`flex items-center gap-1 transition ${isArticleLiked ? 'text-blue-600' : 'text-gray-400 hover:text-blue-600'}`}><svg className="w-4 h-4" fill={isArticleLiked ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5"></path></svg><span className="text-xs font-bold">{totalArticleLikes}</span></button>
                                    <button onClick={() => handleOpenArticle(article)} className="text-gray-400 hover:text-[#579799] transition flex items-center gap-1"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path></svg><span className="text-xs font-bold">{commentCount}</span></button>
                                    <button onClick={() => handleOpenArticle(article)} className="text-[#579799] text-sm font-bold hover:underline ml-1">Đọc ngay</button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )})}
                        </div>

                        {/* NÚT XEM THÊM BÀI VIẾT */}
                        {currentPage < lastPage && (
                          <div className="flex justify-center mt-10 w-full">
                            <button
                              type="button"
                              onClick={() => fetchPublishedArticles(currentPage + 1, true)}
                              disabled={isLoadingMore}
                              className="px-6 py-2.5 bg-white border-2 border-[#579799] text-[#579799] hover:bg-[#579799] hover:text-white font-extrabold text-sm rounded-xl shadow-sm transition-all duration-300 flex items-center gap-2 cursor-pointer disabled:opacity-50"
                            >
                              {isLoadingMore ? (
                                <>
                                  <div className="w-4 h-4 border-2 border-[#579799] border-t-transparent rounded-full animate-spin"></div>
                                  <span>Đang tải thêm tin...</span>
                                </>
                              ) : (
                                <>
                                  <span>Xem thêm bài viết</span>
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
                                  </svg>
                                </>
                              )}
                            </button>
                          </div>
                        )}
                      </>
                    )}
                  </div>

                  {isShowAllNews && (
                    <div className="lg:col-span-1 flex flex-col gap-8 w-full">
                      <div className="bg-white rounded-2xl shadow-sm border border-[#9BBFBA] p-5">
                        <h3 className="text-lg font-black text-[#2F5253] mb-4 border-l-[4px] border-red-500 pl-3 uppercase">Bài báo nổi bật</h3>
                        <div className="flex flex-col gap-4 max-h-[350px] overflow-y-auto pr-2 custom-scroll">
                          {featuredArticles.map(article => {
                            const thumbUrl = getThumbnailUrl(article);
                            return (
                            <div key={`feat-${article.id}`} onClick={() => handleOpenArticle(article)} className="flex gap-3 items-center group cursor-pointer hover:bg-gray-50 p-2 rounded-lg transition">
                              <div className="w-16 h-16 bg-[#F6F7F0] rounded-lg flex-shrink-0 flex items-center justify-center text-[#9BBFBA] border border-[#E5E9DF] group-hover:border-[#579799] overflow-hidden relative">
                                {thumbUrl ? <img src={thumbUrl} alt={article.title} className="w-full h-full object-cover" /> : <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"></path></svg>}
                                {isNewArticle(article.created_at || article.updated_at) && (
                                  <div className="absolute top-1 right-1 bg-[#579799] text-white text-[9px] font-black px-1.5 py-0.5 rounded shadow-sm">Mới</div>
                                )}
                              </div>
                              <div>
                                <h4 className="text-sm font-bold text-gray-800 line-clamp-2 group-hover:text-[#579799] transition leading-tight">{article.title}</h4>
                                <div className="flex items-center gap-3 mt-1.5"><p className="text-xs text-gray-500">{new Date(article.updated_at).toLocaleDateString('vi-VN')}</p><div className="flex items-center gap-1 text-gray-400 text-[11px] font-bold"><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg>{article.views || 0}</div></div>
                              </div>
                            </div>
                          )})}
                        </div>
                      </div>   

                      <div className="bg-white rounded-2xl shadow-sm border border-[#9BBFBA] p-5">
                        <h3 className="text-lg font-black text-[#2F5253] mb-4 border-l-[4px] border-[#579799] pl-3 uppercase">Mới nhất gần đây</h3>
                        <div className="flex flex-col gap-4 max-h-[350px] overflow-y-auto pr-2 custom-scroll">
                          {recentArticles.map(article => (
                            <div key={`rec-${article.id}`} onClick={() => handleOpenArticle(article)} className="flex gap-3 items-center group cursor-pointer border-b border-gray-100 last:border-0 pb-3 last:pb-0 relative">
                              <div className="w-2.5 h-2.5 rounded-full bg-[#579799] flex-shrink-0 group-hover:scale-125 transition-transform"></div>
                              <div className="flex-1 pr-6">
                                <h4 className="text-sm font-bold text-gray-700 line-clamp-1 group-hover:text-[#579799] transition">{article.title}</h4>
                                <p className="text-xs text-gray-400 mt-1">{getCategoryName(article.category_id)}</p>
                              </div>
                              {isNewArticle(article.created_at || article.updated_at) && (
                                <div className="absolute right-0 top-1/2 -translate-y-1/2 bg-amber-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded shadow-sm">Mới</div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <WeatherDashboard 
              city={selectedCity} 
              onClose={() => setShowWeatherDashboard(false)} 
              categories={categories}
              articles={articles}
              setSelectedArticle={setSelectedArticle}
            />
          ) }

        </div>
      </div>

      <footer className="bg-[#F6F7F0] border-t border-gray-200 pt-8 pb-10 text-gray-700 mt-16 select-none" style={{ width: '100vw', marginLeft: 'calc(50% - 50vw)', marginRight: 'calc(50% - 50vw)', paddingLeft: '2rem', paddingRight: '2rem', boxSizing: 'border-box' }}>
        <div className="max-w-[1400px] mx-auto">
          <div className="flex items-center justify-between gap-5 overflow-x-auto pb-5 custom-scroll">
            <button onClick={() => handleFooterNav('default', '')} className={`text-[13px] font-extrabold uppercase whitespace-nowrap transition cursor-pointer ${!filterCategory && footerSortMode === 'default' ? 'text-[#579799]' : 'text-[#2F5253] hover:text-[#579799]'}`}>TRANG CHỦ</button>
            <button onClick={() => handleFooterNav('latest', '')} className={`text-[13px] font-extrabold uppercase whitespace-nowrap transition cursor-pointer ${footerSortMode === 'latest' ? 'text-[#579799]' : 'text-[#2F5253] hover:text-[#579799]'}`}>MỚI NHẤT</button>
            <button onClick={() => handleFooterNav('trending', '')} className={`text-[13px] font-extrabold uppercase whitespace-nowrap transition cursor-pointer ${footerSortMode === 'trending' ? 'text-red-600' : 'text-[#2F5253] hover:text-red-600'}`}>XEM NHIỀU</button>
            <button onClick={() => handleFooterNav('video', '')} className={`text-[13px] font-extrabold uppercase whitespace-nowrap transition cursor-pointer ${footerSortMode === 'video' ? 'text-[#579799]' : 'text-[#2F5253] hover:text-[#579799]'}`}>VIDEO</button>
            {categories?.map(c => <button key={`footer-cat-${c.id}`} onClick={() => handleFooterNav('default', c.id.toString())} className={`text-[13px] font-extrabold uppercase whitespace-nowrap transition cursor-pointer ${filterCategory === c.id.toString() ? 'text-[#579799] underline underline-offset-4' : 'text-[#2F5253] hover:text-[#579799]'}`}>{c.name}</button>)}
          </div>
          <div className="w-full h-[3px] bg-[#579799] mb-8"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8 items-start pb-8">
            <div onClick={() => handleFooterNav('default', '')} className="lg:col-span-3 flex flex-col items-start cursor-pointer group">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-14 h-14 bg-[#B8D4CD] rounded-2xl border-2 border-[#75AFA2] flex items-center justify-center font-black text-xl text-[#2F5253] shadow-sm group-hover:scale-105 transition">{isInternalStaff ? 'SRH' : 'BH'}</div>
                <div>
                  <h2 className="text-3xl font-black text-[#579799] tracking-tight leading-none group-hover:text-[#2F5253] transition">{isInternalStaff ? 'SRH Portal' : 'báo hay'}</h2>
                  <span className="text-[11px] font-extrabold text-[#2F5253] uppercase tracking-widest">Hệ Thống Quản Lý Báo</span>
                </div>
              </div>
              <p className="text-[11px] font-bold text-gray-500 uppercase tracking-tight mt-1">CƠ QUAN TIN TỨC & CÔNG TRÌNH NGHIÊN CỨU KHOA HỌC</p>
            </div>
            <div className="lg:col-span-4 text-[13px] leading-relaxed text-gray-600 space-y-1">
              <p>Tổng biên tập: <strong className="text-gray-800 uppercase">{activeUser?.name || 'NGUYỄN THÀNH LÂM'}</strong></p>
              <p>Cổng thông tin điện tử Báo Hay VN (baohay.vn)</p>
              <p>Cơ quan Quản lý Báo chí và Công trình Nghiên cứu Khoa học</p>
              <p>Giấy phép hoạt động báo điện tử tiếng Việt, tiếng Anh Số 561/GP-BTTTT, cấp ngày 25-11-2025.</p>
              <div className="pt-1"><button onClick={() => setFooterModal('editorial')} className="font-bold text-gray-800 hover:text-[#579799] transition underline-offset-2 hover:underline block">Thông tin tòa soạn</button><p className="font-bold text-gray-800 mt-0.5">Đơn vị vận hành: Trường Đại Học Tây Nguyên</p></div>
            </div>
            <div className="lg:col-span-3 text-[13px] leading-relaxed text-gray-600 space-y-1">
              <p>Địa chỉ: 196/10 Ywang, Thành phố Buôn Ma Thuột, Tỉnh Đắk Lắk</p>
              <p>Hotline: <a href="tel:0388439726" className="font-semibold text-gray-800 hover:text-[#579799]">0388.439.726</a> - Email: <a href="mailto:lamn1492@gmail.com" className="font-semibold text-gray-800 hover:text-[#579799]">lamn1492@gmail.com</a></p>
              <p>Phòng Quảng cáo & Truyền thông: <span className="font-semibold text-gray-800">1234.1234.1234.1234</span></p>
              <div className="pt-2 flex flex-wrap items-center gap-x-2 gap-y-1 font-bold text-gray-800 text-[12.5px]">
                <button onClick={() => setFooterModal('media')} className="hover:text-[#579799] transition cursor-pointer">Dịch vụ truyền thông</button><span className="text-gray-300">|</span>
                <button onClick={() => setFooterModal('privacy')} className="hover:text-[#579799] transition cursor-pointer">Điều khoản bảo mật</button><span className="text-gray-300">|</span>
                <button onClick={() => setFooterModal('feedback')} className="hover:text-[#579799] transition cursor-pointer">Liên hệ góp ý</button><span className="text-gray-300">|</span>
                <button onClick={() => setFooterModal('rss')} className="hover:text-[#579799] transition cursor-pointer">RSS</button>
              </div>
            </div>
            <div className="lg:col-span-2 flex items-center lg:justify-end gap-3">
              <a href="https://youtube.com" target="_blank" rel="noreferrer" title="Kênh YouTube chính thức" className="w-10 h-10 rounded-full border border-gray-400 flex items-center justify-center text-gray-600 hover:border-red-600 hover:text-red-600 hover:bg-white transition shadow-sm"><svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg></a>
              <a href="https://facebook.com" target="_blank" rel="noreferrer" title="Fanpage Facebook" className="w-10 h-10 rounded-full border border-gray-400 flex items-center justify-center text-gray-600 hover:border-blue-600 hover:text-blue-600 hover:bg-white transition shadow-sm"><svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M14 13.5h2.5l1-4H14v-2c0-1.03 0-2 2-2h1.5V2.14c-.326-.043-1.557-.14-2.857-.14C11.928 2 10 3.657 10 6.7v2.8H7v4h3V22h4v-8.5z"/></svg></a>
              <button onClick={() => setFooterModal('rss')} title="Kênh RSS" className="w-10 h-10 rounded-full border border-gray-400 flex items-center justify-center text-gray-600 hover:border-[#579799] hover:text-[#579799] hover:bg-white transition shadow-sm cursor-pointer"><svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M6.18 15.64a2.18 2.18 0 0 1 2.18 2.18C8.36 19 7.38 20 6.18 20C5 20 4 19 4 17.82a2.18 2.18 0 0 1 2.18-2.18M4 4.44A15.56 15.56 0 0 1 19.56 20h-2.83A12.73 12.73 0 0 0 4 7.27V4.44m0 5.66a9.9 9.9 0 0 1 9.9 9.9h-2.83A7.07 7.07 0 0 0 4 12.93V10.1Z"/></svg></button>
            </div>
          </div>
          <div className="border-t border-dashed border-gray-300 pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-gray-500 gap-2">
            <p>© Copyright 2026 Hệ Thống Quản Lý Báo - Báo hay vn, All rights reserved ® Giữ bản quyền nội dung trên website này</p>
            <p className="text-gray-400 font-semibold">Phát triển bởi Nguyễn Thành Lâm</p>
          </div>
        </div>
      </footer>

      {showBackToTop && (
        <button onClick={scrollToTop} title="Lên đầu trang" className="fixed bottom-24 right-6 z-40 w-12 h-12 rounded-full bg-white border border-gray-300 shadow-lg flex items-center justify-center text-gray-700 hover:bg-[#579799] hover:text-white hover:border-[#579799] transition-all duration-300 cursor-pointer">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 10l7-7m0 0l7 7m-7-7v18"></path></svg>
        </button>
      )}

      {footerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(3px)' }}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-gray-200 animate-fade-in">
            <div className="bg-[#579799] text-white px-6 py-4 flex justify-between items-center"><h3 className="font-black text-lg uppercase">{footerModal === 'editorial' && 'Thông tin Tòa soạn'}{footerModal === 'media' && 'Dịch vụ Truyền thông & Quảng cáo'}{footerModal === 'privacy' && 'Điều khoản Bảo mật'}{footerModal === 'feedback' && 'Liên hệ & Góp ý Tòa soạn'}{footerModal === 'rss' && 'Kênh cấp tin RSS'}</h3><button onClick={() => setFooterModal(null)} className="text-white hover:text-red-200 font-bold text-xl">✕</button></div>
            <div className="p-6 text-sm text-gray-700 space-y-3 leading-relaxed">
              {footerModal === 'editorial' && (<><p><strong>Tên cơ quan:</strong> Hệ Thống Quản Lý Báo & Công trình Nghiên cứu (SRH)</p><p><strong>Tổng biên tập:</strong> Nguyễn Thành Lâm</p><p><strong>Trụ sở chính:</strong> TP. Buôn Ma Thuột, Tỉnh Đắk Lắk, Việt Nam</p><p><strong>Sứ mệnh:</strong> Cung cấp tin tức thời sự chính xác, nhanh chóng và là nền tảng lưu trữ, phản biện các công trình nghiên cứu khoa học uy tín.</p></>)}
              {footerModal === 'media' && (<><p>Hệ Thống Quản Lý Báo cung cấp các giải pháp truyền thông, đặt banner quảng cáo (vị trí cột trái trang chủ) và bài viết PR chuyên sâu.</p><div className="bg-[#F6F7F0] p-4 rounded-xl border border-[#9BBFBA]"><p className="font-bold text-[#2F5253]">Liên hệ báo giá quảng cáo:</p><p>📞 Điện thoại: 0262.3997.4848 - 0918.033.133</p><p>✉️ Email: quangcao@baohay.vn</p></div></>)}
              {footerModal === 'privacy' && (<><p>1. Mọi thông tin cá nhân của độc giả và tác giả gửi bài đều được mã hóa và bảo mật tuyệt đối trên hệ thống.</p><p>2. Các bình luận, tệp đính kèm vi phạm tiêu chuẩn cộng đồng sẽ bị Kiểm duyệt viên hoặc Quản trị viên gỡ bỏ không cần báo trước.</p><p>3. Nghiêm cấm sao chép nội dung các công trình nghiên cứu khi chưa có sự đồng ý bằng văn bản của Tòa soạn.</p></>)}
              {footerModal === 'rss' && (<div className="space-y-2"><p className="text-gray-600 mb-3">Chọn chuyên mục bên dưới để lọc nhanh nguồn tin RSS:</p>{categories?.map(c => (<div key={`rss-${c.id}`} onClick={() => { setFooterModal(null); handleFooterNav('default', c.id.toString()); }} className="flex justify-between items-center p-2.5 bg-gray-50 hover:bg-teal-50 rounded-lg border border-gray-200 cursor-pointer transition"><span className="font-bold text-[#2F5253]">{c.name}</span><span className="text-xs font-mono text-[#579799]">/rss/{c.id}.xml ➔</span></div>))}</div>)}
              {footerModal === 'feedback' && (<div className="space-y-3"><input type="text" placeholder="Họ và tên của bạn..." className="w-full border border-gray-300 rounded-xl px-4 py-2.5 outline-none focus:border-[#579799]" value={feedbackData.name} onChange={e => setFeedbackData({...feedbackData, name: e.target.value})} /><input type="email" placeholder="Email liên hệ..." className="w-full border border-gray-300 rounded-xl px-4 py-2.5 outline-none focus:border-[#579799]" value={feedbackData.email} onChange={e => setFeedbackData({...feedbackData, email: e.target.value})} /><textarea rows="3" placeholder="Nội dung góp ý hoặc phản ánh tin bài..." className="w-full border border-gray-300 rounded-xl px-4 py-2.5 outline-none focus:border-[#579799] resize-none" value={feedbackData.message} onChange={e => setFeedbackData({...feedbackData, message: e.target.value})}></textarea><button onClick={() => { if (!feedbackData.message.trim()) return alert('Vui lòng nhập nội dung góp ý!'); alert('Cảm ơn bạn! Ý kiến đóng góp đã được gửi tới Ban biên tập.'); setFeedbackData({ name: '', email: '', message: '' }); setFooterModal(null); }} className="w-full bg-[#579799] text-white font-bold py-2.5 rounded-xl hover:bg-[#2F5253] transition cursor-pointer">Gửi góp ý tới Tòa soạn</button></div>)}
            </div>
          </div>
        </div>
      )}

      {/* MODAL CHI TIẾT BÀI BÁO */}
      {selectedArticle && (
        <div 
          onClick={() => setSelectedArticle(null)} 
          className="fixed inset-0 z-[9999] flex items-center justify-center p-3 lg:p-6" 
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.65)', backdropFilter: 'blur(5px)' }}
        >
          <div 
            onClick={(e) => e.stopPropagation()} 
            className="bg-white text-gray-900 rounded-3xl shadow-2xl w-full max-w-4xl h-[92vh] max-h-[92vh] flex flex-col animate-fade-in overflow-hidden border border-gray-100"
          >
            
            {/* 1. THANH HEADER TINH GỌN */}
            <div className="flex justify-between items-center px-6 py-3.5 border-b border-gray-200 bg-white flex-shrink-0 z-10">
              <div className="flex items-center gap-3">
                <span className="text-xs font-black text-white bg-[#579799] px-3 py-1 rounded-full uppercase tracking-wider">
                  {getCategoryName(selectedArticle.category_id)}
                </span>
                <span className="text-xs font-bold text-gray-400 hidden sm:inline">
                  Ngày đăng: {selectedArticle?.published_date 
                      ? new Date(selectedArticle.published_date).toLocaleDateString('vi-VN') 
                      : new Date(selectedArticle?.created_at).toLocaleDateString('vi-VN')}
                </span>
              </div>

              <button 
                onClick={() => setSelectedArticle(null)} 
                className="text-gray-400 hover:text-red-500 hover:bg-red-50 p-2 rounded-full transition cursor-pointer"
                title="Đóng cửa sổ"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>
            </div>

            {/* 2. VÙNG NỘI DUNG CUỘN TỰ DO */}
            <div className="overflow-y-auto flex-grow custom-scroll p-6 lg:p-8 flex flex-col gap-6 bg-white">
              
              {/* TIÊU ĐỀ & THÔNG TIN BÀI BÁO */}
              <div className="flex flex-col gap-3 border-b border-gray-100 pb-5">
                <h2 className="text-2xl lg:text-3xl font-black text-[#2F5253] leading-snug">
                  {selectedArticle.title}
                </h2>
                
                <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-gray-500 pt-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-gray-400">Tác giả:</span>
                    <span className="font-extrabold text-[#579799] bg-teal-50 px-2.5 py-1 rounded-lg border border-teal-100">
                      {selectedArticle.user?.name || selectedArticle.author || 'Khuyết danh'}
                    </span>
                  </div>

                  {/* CỤM NÚT CÔNG CỤ: TRÍCH DẪN, TẢI PDF & CHIA SẺ */}
                  <div className="flex items-center gap-2">
                    <button 
                      type="button"
                      onClick={() => setShowCitationModal(true)}
                      className="flex items-center gap-1 px-3 py-1.5 bg-teal-50 text-[#579799] border border-[#9BBFBA] hover:bg-[#579799] hover:text-white rounded-lg text-xs font-bold transition shadow-sm cursor-pointer"
                      title="Trích dẫn bài báo theo chuẩn khoa học"
                    >
                      Trích dẫn
                    </button>
                    <button 
                      type="button"
                      onClick={() => handleExportPDF(selectedArticle)}
                      className="flex items-center gap-1 px-3 py-1.5 bg-rose-50 text-rose-600 border border-rose-200 hover:bg-rose-600 hover:text-white rounded-lg text-xs font-bold transition shadow-sm cursor-pointer"
                      title="Tải bài báo dạng PDF"
                    >
                      Tải PDF
                    </button>
                    <button 
                      type="button"
                      onClick={() => {
                        const url = encodeURIComponent(window.location.origin + `/?article_id=${selectedArticle.id}`);
                        window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`, '_blank', 'width=600,height=400');
                      }}
                      className="flex items-center gap-1 px-3 py-1.5 bg-blue-50 text-blue-600 border border-blue-200 hover:bg-blue-600 hover:text-white rounded-lg text-xs font-bold transition shadow-sm cursor-pointer"
                      title="Chia sẻ lên Facebook"
                    >
                      Chia sẻ
                    </button>
                  </div>
                </div>
              </div>

              {/* KHU VỰC HIỂN THỊ VIDEO / HÌNH ẢNH / NỘI DUNG */}
              <div className="py-2">
                {renderFormattedContent(selectedArticle)}
              </div>

              {/* 3. KHU VỰC BÌNH LUẬN NẰM DƯỚI BÀI BÁO */}
              <div ref={commentsSectionRef} className="mt-6 pt-6 border-t border-gray-200 flex flex-col gap-6">
                
                {/* THANH TƯƠNG TÁC LIKE & SỐ LƯỢNG CMT */}
                {(() => {
                  const currentUser = getLoggedInUser();
                  const likeKey = `${selectedArticle.id}_${currentUser?.id}`;
                  const isLiked = likedArticles[likeKey];
                  const totalArticleLikes = Object.keys(likedArticles).filter(k => k.startsWith(`${selectedArticle.id}_`) && likedArticles[k]).length;
                  let totalCommentsInPopup = 0;
                  const currentCommentsForPopup = articleComments[selectedArticle.id] || [];
                  currentCommentsForPopup.forEach(cmt => { totalCommentsInPopup += 1; if (cmt.replies) totalCommentsInPopup += cmt.replies.length; });
                  return (
                    <div className="flex items-center gap-6">
                      <button 
                        onClick={() => handleLikeArticle(selectedArticle.id)} 
                        className={`flex items-center gap-2 font-bold px-4 py-2 rounded-xl transition cursor-pointer border ${isLiked ? 'bg-blue-50 text-blue-600 border-blue-200' : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'}`}
                      >
                        <svg className="w-5 h-5" fill={isLiked ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5"></path></svg>
                        <span>{isLiked ? 'Đã thích' : 'Thích'} ({totalArticleLikes})</span>
                      </button>
                      <div className="flex items-center gap-2 text-gray-700 font-bold text-sm">
                        <svg className="w-5 h-5 text-[#579799]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path></svg>
                        Bình luận ({totalCommentsInPopup})
                      </div>
                    </div>
                  );
                })()}

                {/* KHUNG NHẬP BÌNH LUẬN */}
                <div className="flex gap-3.5 items-start bg-gray-50 p-4 rounded-2xl border border-gray-200">
                  <img src={getCurrentUserAvatar()} alt="avatar" className="w-10 h-10 rounded-full object-cover shadow-sm border border-gray-200 flex-shrink-0" />
                  <div className="flex-1 bg-white border border-gray-300 rounded-xl overflow-hidden focus-within:border-[#579799] focus-within:ring-1 focus-within:ring-[#579799] transition shadow-sm">
                    {renderFilePreview(commentFile, setCommentFile)}
                    <textarea 
                      rows="2" 
                      placeholder="Viết bình luận hoặc ý kiến của bạn về bài viết..." 
                      className="w-full p-3.5 resize-none outline-none text-sm text-gray-800 bg-transparent" 
                      value={commentText} 
                      onChange={(e) => setCommentText(e.target.value)} 
                      onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmitComment(); } }}
                    />
                    <div className="flex justify-between items-center bg-[#F6F7F0] px-3.5 py-2 border-t border-gray-200">
                      <div className="flex gap-1.5">
                        <label className="cursor-pointer text-gray-500 hover:text-[#579799] hover:bg-gray-200 rounded-lg p-1.5 transition" title="Đính kèm Hình ảnh">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                          <input type="file" className="hidden" accept="image/*" onChange={(e) => setCommentFile(e.target.files[0])} />
                        </label>
                        <label className="cursor-pointer text-gray-500 hover:text-[#579799] hover:bg-gray-200 rounded-lg p-1.5 transition" title="Đính kèm Video">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg>
                          <input type="file" className="hidden" accept="video/*" onChange={(e) => setCommentFile(e.target.files[0])} />
                        </label>
                        <label className="cursor-pointer text-gray-500 hover:text-[#579799] hover:bg-gray-200 rounded-lg p-1.5 transition" title="Đính kèm File">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"></path></svg>
                          <input type="file" className="hidden" accept=".pdf,.doc,.docx" onChange={(e) => setCommentFile(e.target.files[0])} />
                        </label>
                      </div>
                      <button 
                        onClick={handleSubmitComment} 
                        className="bg-[#579799] text-white px-5 py-1.5 rounded-lg text-xs font-bold shadow hover:bg-teal-700 transition flex items-center gap-1.5 cursor-pointer"
                      >
                        Gửi bình luận
                      </button>
                    </div>
                  </div>
                </div>

                {/* DANH SÁCH BÌNH LUẬN */}
                {articleComments[selectedArticle.id] && articleComments[selectedArticle.id].length > 0 ? (
                  <div className="flex flex-col gap-5 mt-2">
                    {articleComments[selectedArticle.id].map(cmt => (
                      <div key={cmt.id} className="flex flex-col gap-2 animate-fade-in">
                        <div className="flex gap-3.5 items-start w-full">
                          <img src={cmt.avatar} alt="avatar" className="w-9 h-9 rounded-full shadow-sm object-cover border border-gray-200" />
                          <div className="flex flex-col items-start max-w-[85%] w-full">
                            <div className="bg-gray-50 border border-gray-200 rounded-2xl rounded-tl-none px-4 py-2.5 shadow-sm inline-block">
                              <p className="text-xs font-black text-[#2F5253] mb-1">{cmt.author}</p>
                              {cmt.text && cmt.text.trim() !== '' && <p className="text-sm text-gray-800 whitespace-pre-wrap">{cmt.text}</p>}
                              {renderAttachment(cmt.attachment)}
                            </div>
                            <div className="flex items-center gap-4 mt-1.5 ml-2">
                              <span className="text-[11px] font-bold text-gray-400">{cmt.time}</span>
                              {(() => { 
                                const currentUser = getLoggedInUser(); 
                                const likeKey = `${cmt.id}_${currentUser?.id}`; 
                                const isLiked = likedComments[likeKey]; 
                                return ( 
                                  <button onClick={() => handleLikeComment(cmt.id)} className={`text-xs font-bold transition ${isLiked ? 'text-blue-600' : 'text-gray-500 hover:text-blue-600'}`}>
                                    {isLiked ? 'Đã thích' : 'Thích'}
                                  </button> 
                                ); 
                              })()}
                              <button onClick={() => { setReplyingTo(cmt.id); setReplyText(''); setReplyFile(null); }} className="text-xs font-bold text-gray-500 hover:text-[#579799] transition">
                                Phản hồi
                              </button>
                              {cmt.author === getCurrentUserName() && ( 
                                <button onClick={() => handleDeleteComment(cmt.id)} className="text-xs font-bold text-red-400 hover:text-red-600 transition">
                                  Xóa
                                </button> 
                              )}
                            </div>
                          </div>
                        </div>

                        {/* DANH SÁCH REPLIES */}
                        {cmt.replies && cmt.replies.length > 0 && (
                          <div className="ml-12 mt-1">
                            {!expandedComments[cmt.id] ? (
                              <button onClick={() => toggleReplies(cmt.id)} className="flex items-center gap-1.5 text-xs font-bold text-[#579799] hover:underline transition">
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                                Xem {cmt.replies.length} phản hồi
                              </button>
                            ) : (
                              <div className="flex flex-col gap-3.5 border-l-2 border-gray-200 pl-4 pt-2 animate-fade-in">
                                {cmt.replies.map(reply => (
                                  <div key={reply.id} className="flex gap-3 items-start">
                                    <img src={reply.avatar} alt="avatar" className="w-7 h-7 rounded-full shadow-sm object-cover border border-gray-200" />
                                    <div className="flex flex-col items-start max-w-[90%] w-full">
                                      <div className="bg-gray-100 border border-gray-200 rounded-2xl rounded-tl-none px-3.5 py-2 shadow-sm inline-block">
                                        <p className="text-xs font-black text-[#2F5253] mb-0.5">{reply.author}</p>
                                        {reply.text && reply.text.trim() !== '' && <p className="text-xs text-gray-800 whitespace-pre-wrap">{reply.text}</p>}
                                        {renderAttachment(reply.attachment)}
                                      </div>
                                      <div className="flex items-center gap-3.5 mt-1 ml-2">
                                        <span className="text-[10px] font-bold text-gray-400">{reply.time}</span>
                                        <button onClick={() => { setReplyingTo(cmt.id); setReplyText(`@${reply.author} `); setReplyFile(null); }} className="text-xs font-bold text-gray-500 hover:text-[#579799] transition">
                                          Phản hồi
                                        </button>
                                        {reply.author === getCurrentUserName() && ( 
                                          <button onClick={() => handleDeleteComment(reply.id)} className="text-xs font-bold text-red-400 hover:text-red-600 transition">
                                            Xóa
                                          </button> 
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                ))}
                                <button onClick={() => toggleReplies(cmt.id)} className="text-xs font-bold text-gray-400 hover:text-[#579799] mt-1 w-fit">
                                  Thu gọn phản hồi
                                </button>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Ô NHẬP PHẢN HỒI */}
                        {replyingTo === cmt.id && (
                          <div className="flex gap-3 items-start ml-12 mt-3 animate-fade-in">
                            <img src={getCurrentUserAvatar()} alt="avatar" className="w-7 h-7 rounded-full shadow-sm object-cover border border-gray-200 mt-1" />
                            <div className="flex-1 bg-white border border-gray-300 rounded-xl overflow-hidden focus-within:border-[#579799] transition shadow-sm">
                              {renderFilePreview(replyFile, setReplyFile)}
                              <textarea 
                                rows="2" 
                                placeholder="Trả lời bình luận..." 
                                className="w-full p-2.5 resize-none outline-none text-xs text-gray-800 bg-transparent" 
                                value={replyText} 
                                onChange={(e) => setReplyText(e.target.value)} 
                                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmitReply(cmt.id); } }}
                              />
                              <div className="flex justify-between items-center bg-[#F6F7F0] px-3 py-1.5 border-t border-gray-200">
                                <div className="flex gap-1">
                                  <label className="cursor-pointer text-gray-500 hover:text-[#579799] rounded p-1" title="Đính kèm ảnh">
                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                                    <input type="file" className="hidden" accept="image/*" onChange={(e) => setReplyFile(e.target.files[0])} />
                                  </label>
                                  <label className="cursor-pointer text-gray-500 hover:text-[#579799] rounded p-1" title="Đính kèm file">
                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"></path></svg>
                                    <input type="file" className="hidden" accept=".pdf,.doc,.docx" onChange={(e) => setReplyFile(e.target.files[0])} />
                                  </label>
                                </div>
                                <div className="flex items-center gap-2">
                                  <button onClick={() => { setReplyingTo(null); setReplyText(''); setReplyFile(null); }} className="text-gray-400 text-xs font-bold hover:text-red-500 px-1">
                                    Hủy
                                  </button>
                                  <button onClick={() => handleSubmitReply(cmt.id)} className="bg-[#579799] text-white px-3 py-1 rounded-md text-xs font-bold shadow hover:bg-teal-700 transition">
                                    Gửi
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center text-gray-400 py-6 font-bold text-xs italic bg-gray-50 rounded-xl">
                    Chưa có bình luận nào. Hãy là người đầu tiên nêu ý kiến!
                  </div>
                )}
              </div>

            </div>

          </div>
        </div>
      )}

      {/* POPUP TRÍCH DẪN KHOA HỌC */}
      {showCitationModal && selectedArticle && (
        <div 
          onClick={() => setShowCitationModal(false)}
          className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-[#9BBFBA]"
          >
            <div className="bg-[#579799] text-white px-5 py-3.5 flex justify-between items-center">
              <h3 className="font-bold text-sm tracking-wide flex items-center gap-2">
                Trích dẫn công trình nghiên cứu
              </h3>
              <button 
                onClick={() => setShowCitationModal(false)}
                className="text-white hover:text-red-200 font-bold text-lg leading-none cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-5 flex flex-col gap-4">
              <div className="flex items-center gap-2 border-b border-gray-200 pb-3">
                <span className="text-xs font-bold text-gray-500 uppercase">Định dạng chuẩn:</span>
                <div className="flex gap-1.5">
                  {['apa', 'ieee', 'harvard'].map((fmt) => (
                    <button
                      key={fmt}
                      type="button"
                      onClick={() => setCitationFormat(fmt)}
                      className={`px-3 py-1 rounded-lg text-xs font-extrabold uppercase transition cursor-pointer ${
                        citationFormat === fmt 
                          ? 'bg-[#579799] text-white shadow-sm' 
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {fmt}
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-4 bg-[#F6F7F0] border border-[#E5E9DF] rounded-xl text-sm font-serif leading-relaxed text-gray-800 break-words select-all">
                {generateCitation(selectedArticle, citationFormat)}
              </div>

              <div className="flex justify-end gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setShowCitationModal(false)}
                  className="px-4 py-2 text-gray-500 font-bold text-xs hover:bg-gray-100 rounded-lg cursor-pointer"
                >
                  Đóng
                </button>
                <button
                  type="button"
                  onClick={() => handleCopyCitation(generateCitation(selectedArticle, citationFormat))}
                  className="px-5 py-2 bg-[#579799] hover:bg-teal-700 text-white font-bold text-xs rounded-lg shadow-sm transition flex items-center gap-1.5 cursor-pointer"
                >
                  {copiedText ? (
                    <>
                      <span>✓</span>
                      <span>Đã chép vào bộ nhớ!</span>
                    </>
                  ) : (
                    <>
                      <span>Sao chép trích dẫn</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}