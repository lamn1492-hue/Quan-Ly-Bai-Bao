import { useState, useEffect } from 'react';
import axios from 'axios';

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

export default function WeatherDashboard({ city: initialCity, onClose }) {
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

  return (
    <div className="w-full animate-fade-in pb-8">
      <div className="flex justify-between items-end mb-8 border-b-2 border-[#E5E9DF] pb-4">
        <h1 className="text-3xl font-black text-[#2F5253] border-l-[6px] border-[#579799] pl-4 uppercase tracking-tight">
          Thời tiết
        </h1>
        <button onClick={onClose} className="bg-white text-gray-600 font-bold px-4 py-2 rounded-xl border border-gray-300 shadow-sm hover:bg-red-50 hover:text-red-500 transition flex items-center gap-2 cursor-pointer">
          ✕ Thu gọn bảng
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-3 flex flex-col gap-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden cursor-pointer hover:shadow-lg transition group">
            <img src="https://images.unsplash.com/photo-1515694346937-94d85e41e6f0?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80" alt="Mưa lớn" className="w-full h-40 object-cover group-hover:scale-105 transition duration-500" />
            <div className="p-4">
              <h3 className="text-[17px] font-bold text-gray-800 leading-snug mb-2 group-hover:text-[#579799]">Mùa mưa ở Nam Bộ kết thúc sớm 20 ngày</h3>
              <p className="text-sm text-gray-500 line-clamp-3">Năm nay mùa mưa Nam Bộ dự báo kết thúc sớm 15-20 ngày.</p>
            </div>
          </div>
        </div>

        <div className="lg:col-span-9 flex flex-col gap-6">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 flex flex-col md:flex-row gap-8 items-center justify-between">
            <div className="flex flex-col flex-1 min-w-[250px]">
              <div className="flex items-center gap-2 mb-2 bg-[#F6F7F0] p-2 rounded-xl border border-[#E5E9DF] transition w-fit group">
                <select value={currentCity.name} onChange={(e) => { const newCity = CITIES.find(c => c.name === e.target.value); if(newCity) setCurrentCity(newCity); }} className="text-2xl lg:text-3xl font-black text-[#2F5253] uppercase bg-transparent outline-none cursor-pointer">
                  {CITIES.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
                </select>
              </div>
            </div>
            <div className="flex items-center gap-6">
              <span className="text-8xl">{getWeatherDetails(weatherData.current.weather_code).icon}</span>
              <div className="flex flex-col">
                <span className="text-7xl font-black text-[#2F5253]">{Math.round(weatherData.current.temperature_2m)}°C</span>
                <span className={`text-xl font-bold ${getWeatherDetails(weatherData.current.weather_code).color}`}>{getWeatherDetails(weatherData.current.weather_code).label}</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-xl font-black text-[#2F5253] mb-4">Dự báo 7 ngày tới</h3>
            <div className="flex gap-4 overflow-x-auto custom-scroll pb-4">
              {dailyForecast.map((day, index) => (
                <div key={index} className={`flex-shrink-0 w-40 flex flex-col items-center p-4 rounded-xl border-2 ${index === 0 ? 'border-red-400 bg-red-50' : 'border-gray-200'}`}>
                  <p className="font-bold text-gray-700">{day.date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })}</p>
                  <span className="text-4xl my-2">{getWeatherDetails(day.code).icon}</span>
                  <h4 className="text-2xl font-black text-[#2F5253]">{day.maxTemp}°</h4>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}