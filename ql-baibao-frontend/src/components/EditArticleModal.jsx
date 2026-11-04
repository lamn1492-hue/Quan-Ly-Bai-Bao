import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';

// =======================
// TRÌNH SOẠN THẢO VĂN BẢN
// =======================
function RichTextBlock({ value, onChange, placeholder }) {
  const editorRef = useRef(null);

  useEffect(() => {
    if (editorRef.current && value !== editorRef.current.innerHTML) {
      if (document.activeElement !== editorRef.current) {
        editorRef.current.innerHTML = value || '';
      }
    }
  }, [value]);

  const execCmd = (command, arg = null) => {
    if (!editorRef.current) return;
    editorRef.current.focus();
    
    const selection = window.getSelection();
    
    if ((command === 'foreColor' || command === 'hiliteColor') && selection.rangeCount > 0 && selection.isCollapsed) {
       const range = selection.getRangeAt(0);
       const span = document.createElement('span');
       
       if (command === 'foreColor') span.style.color = arg;
       if (command === 'hiliteColor') span.style.backgroundColor = arg;
       
       span.innerHTML = '&#8203;'; 
       range.insertNode(span);
       
       range.setStart(span, 1);
       range.collapse(true);
       selection.removeAllRanges();
       selection.addRange(range);
       
       onChange(editorRef.current.innerHTML);
       return;
    }

    if (command === 'removeFormat') {
      if (!selection.rangeCount) return;
      const range = selection.getRangeAt(0);
      if (!range.collapsed) {
        document.execCommand('styleWithCSS', false, true);
        document.execCommand('removeFormat', false, null);
        const text = selection.toString();
        document.execCommand('insertText', false, text);
      }
    } else {
      document.execCommand('styleWithCSS', false, true);
      if (command === 'backColor') command = 'hiliteColor';
      document.execCommand(command, false, arg);
    }
    
    onChange(editorRef.current.innerHTML);
  };

  return (
    <div className="border border-gray-300 rounded-xl overflow-visible bg-white focus-within:border-[#579799] transition shadow-sm mt-1 relative">
      <div className="bg-[#F6F7F0] border-b border-gray-200 p-2 flex flex-wrap items-center gap-1.5 text-gray-700 select-none rounded-t-xl sticky top-0 z-10">
        <select
          onChange={(e) => { if (e.target.value) execCmd('fontName', e.target.value); }}
          className="border border-gray-300 rounded-lg px-2 py-1 text-xs font-bold bg-white outline-none cursor-pointer hover:border-[#579799]"
          defaultValue=""
        >
          <option value="" disabled>Kiểu chữ</option>
          <option value="Arial, sans-serif">Arial</option>
          <option value="'Times New Roman', serif">Times New Roman</option>
          <option value="Georgia, serif">Georgia</option>
          <option value="Tahoma, sans-serif">Tahoma</option>
          <option value="Verdana, sans-serif">Verdana</option>
        </select>

        <select
          onChange={(e) => { if (e.target.value) execCmd('fontSize', e.target.value); }}
          className="border border-gray-300 rounded-lg px-2 py-1 text-xs font-bold bg-white outline-none cursor-pointer hover:border-[#579799]"
          defaultValue="3"
        >
          <option value="2">Cỡ nhỏ (12pt)</option>
          <option value="3">Cỡ chuẩn (14pt)</option>
          <option value="4">Cỡ vừa (18pt)</option>
          <option value="5">Tiêu đề nhỏ (24pt)</option>
          <option value="6">Tiêu đề lớn (32pt)</option>
        </select>

        <div className="w-[1px] h-5 bg-gray-300 mx-0.5"></div>

        <button type="button" onMouseDown={(e) => { e.preventDefault(); execCmd('bold'); }} className="w-7 h-7 rounded bg-white border border-gray-200 hover:bg-[#579799] hover:text-white font-black text-xs transition cursor-pointer" title="In đậm">B</button>
        <button type="button" onMouseDown={(e) => { e.preventDefault(); execCmd('italic'); }} className="w-7 h-7 rounded bg-white border border-gray-200 hover:bg-[#579799] hover:text-white italic font-serif font-bold text-xs transition cursor-pointer" title="In nghiêng">I</button>
        <button type="button" onMouseDown={(e) => { e.preventDefault(); execCmd('underline'); }} className="w-7 h-7 rounded bg-white border border-gray-200 hover:bg-[#579799] hover:text-white underline font-bold text-xs transition cursor-pointer" title="Gạch chân">U</button>

        <div className="w-[1px] h-5 bg-gray-300 mx-0.5"></div>

        <label className="flex items-center gap-1 px-2 py-1 rounded hover:bg-gray-200 cursor-pointer border border-gray-200 bg-white" title="Màu chữ">
          <span className="text-xs font-black text-[#2F5253]">Màu chữ</span>
          <input type="color" defaultValue="#2F5253" onInput={(e) => execCmd('foreColor', e.target.value)} className="w-4 h-4 cursor-pointer border-0 p-0 bg-transparent" />
        </label>

        <label className="flex items-center gap-1 px-2 py-1 rounded hover:bg-gray-200 cursor-pointer border border-gray-200 bg-white" title="Tô nền chữ">
          <span className="text-xs font-bold">Nền</span>
          <input type="color" defaultValue="#ffff00" onInput={(e) => execCmd('hiliteColor', e.target.value)} className="w-4 h-4 cursor-pointer border-0 p-0 bg-transparent" />
        </label>

        <div className="w-[1px] h-5 bg-gray-300 mx-0.5"></div>

        <button type="button" onMouseDown={(e) => { e.preventDefault(); execCmd('justifyLeft'); }} className="px-2 py-1 rounded bg-white border border-gray-200 hover:bg-[#579799] hover:text-white text-xs font-bold transition cursor-pointer" title="Căn trái">Trái</button>
        <button type="button" onMouseDown={(e) => { e.preventDefault(); execCmd('justifyCenter'); }} className="px-2 py-1 rounded bg-white border border-gray-200 hover:bg-[#579799] hover:text-white text-xs font-bold transition cursor-pointer" title="Căn giữa">Giữa</button>
        <button type="button" onMouseDown={(e) => { e.preventDefault(); execCmd('justifyRight'); }} className="px-2 py-1 rounded bg-white border border-gray-200 hover:bg-[#579799] hover:text-white text-xs font-bold transition cursor-pointer" title="Căn phải">Phải</button>

        <button type="button" onMouseDown={(e) => { e.preventDefault(); execCmd('removeFormat'); }} className="px-2 py-1 rounded hover:bg-red-500 hover:text-white text-xs font-bold text-red-500 transition ml-auto cursor-pointer">✕ Xóa format</button>
      </div>

      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        onInput={(e) => onChange(e.currentTarget.innerHTML)}
        onBlur={(e) => onChange(e.currentTarget.innerHTML)}
        data-placeholder={placeholder || "Nhập nội dung đoạn văn bản..."}
        className="w-full min-h-[160px] p-4 outline-none text-gray-800 text-[15px] leading-relaxed overflow-y-auto empty:before:content-[attr(data-placeholder)] empty:before:text-gray-400"
      />
    </div>
  );
}


// =============================
// MODAL CHỈNH SỬA BÀI BÁO CHÍNH
// =============================
export default function EditArticleModal({ article, categories, onClose, onRefresh }) {
  const [title, setTitle] = useState(article.title || '');
  const [categoryId, setCategoryId] = useState(article.category_id || '');
  const [imageFile, setImageFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [blocks, setBlocks] = useState([]);
  useEffect(() => {
    if (article?.abstract) {
      const raw = article.abstract.replace(/&#91;/g, '[').replace(/&#93;/g, ']');
      const parts = raw.split(/(\[\s*\[\s*[A-Z]+_BLOCK\s*:\s*[^\]]+?\s*\]\s*\])/gi);
      const initialBlocks = [];

      parts.forEach(part => {
        const trimmed = part.trim();
        if (!trimmed) return;

        const imgMatch = trimmed.match(/\[\s*\[\s*IMAGE_BLOCK\s*:\s*([^\]]+?)\s*\]\s*\]/i);
        if (imgMatch) {
          const cleanFileName = imgMatch[1].replace(/<\/?[^>]+(>|$)/g, "").trim();
          initialBlocks.push({ 
            type: 'image', 
            file: null,
            fileName: cleanFileName,
            preview: `http://127.0.0.1:8000/storage/article_media/${cleanFileName}`, 
            id: Date.now() + Math.random() 
          });
          return;
        }

        const vidMatch = trimmed.match(/\[\s*\[\s*VIDEO_BLOCK\s*:\s*([^\]]+?)\s*\]\s*\]/i);
        if (vidMatch) {
          const cleanFileName = vidMatch[1].replace(/<\/?[^>]+(>|$)/g, "").trim();
          initialBlocks.push({ 
            type: 'video', 
            file: null, 
            fileName: cleanFileName,
            preview: `http://127.0.0.1:8000/storage/article_media/${cleanFileName}`, 
            id: Date.now() + Math.random() 
          });
          return;
        }

        if (trimmed.match(/^\[Tạp chí: /i)) return;

        initialBlocks.push({ type: 'text', content: part, id: Date.now() + Math.random() });
      });

      if (initialBlocks.length > 0) {
        setBlocks(initialBlocks);
      } else {
        setBlocks([{ type: 'text', content: '', id: Date.now() }]);
      }
    } else {
      setBlocks([{ type: 'text', content: '', id: Date.now() }]);
    }
  }, [article]);

  const addTextBlock = () => setBlocks(prev => [...prev, { type: 'text', content: '', id: Date.now() }]);
  
  const handleAddImageBlock = (e) => {
    const file = e.target.files[0];
    if (file) setBlocks(prev => [...prev, { type: 'image', file, preview: URL.createObjectURL(file), id: Date.now() }]);
    e.target.value = '';
  };
  
  const handleAddVideoBlock = (e) => {
    const file = e.target.files[0];
    if (file) setBlocks(prev => [...prev, { type: 'video', file, preview: URL.createObjectURL(file), id: Date.now() }]);
    e.target.value = '';
  };
  
  const removeBlock = (id) => setBlocks(prev => prev.filter(b => b.id !== id));
  const updateBlockContent = (id, value) => setBlocks(prev => prev.map(b => b.id === id ? { ...b, content: value } : b));

  const handleUpdate = (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    const formData = new FormData();
    formData.append('_method', 'PUT');
    formData.append('title', title);
    formData.append('category_id', categoryId);
    formData.append('author', article.author); 
    if (imageFile) formData.append('image', imageFile);

    const finalAbstract = blocks.map(b => {
      if (b.type === 'text') return b.content;
      if (b.type === 'image') return `[[IMAGE_BLOCK:${b.file ? b.file.name : b.fileName}]]`;
      if (b.type === 'video') return `[[VIDEO_BLOCK:${b.file ? b.file.name : b.fileName}]]`;
      return '';
    }).join('\n\n');

    formData.append('abstract', finalAbstract);
    blocks.filter(b => b.type === 'image' && b.file).forEach((img, idx) => formData.append(`content_images[${idx}]`, img.file));
    blocks.filter(b => b.type === 'video' && b.file).forEach((vid, idx) => formData.append(`content_videos[${idx}]`, vid.file));

    axios.post(`http://127.0.0.1:8000/api/articles/${article.id}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
    .then(() => {
      alert("Cập nhật bài báo thành công!");
      setIsSubmitting(false);
      onRefresh();
      onClose();
    })
    .catch(err => {
      console.error(err);
      alert("Lỗi khi cập nhật bài báo!");
      setIsSubmitting(false);
    });
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden border border-[#9BBFBA] flex flex-col max-h-[95vh]">
        
        {/* Header */}
        <div className="bg-[#579799] px-6 py-4 flex justify-between items-center text-white flex-shrink-0">
          <h3 className="text-lg font-black uppercase flex items-center gap-2">
            Chỉnh sửa bài báo
          </h3>
          <button onClick={onClose} className="text-2xl font-bold hover:text-red-200 cursor-pointer">
            &times;
          </button>
        </div>

        {/* Form Body (Scrollable) */}
        <form onSubmit={handleUpdate} className="p-6 overflow-y-auto custom-scroll space-y-5 flex-grow">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-gray-600 uppercase block mb-1">Tiêu đề bài báo *</label>
              <input 
                type="text" required
                value={title} onChange={e => setTitle(e.target.value)}
                className="w-full border border-gray-300 rounded-lg p-2.5 font-bold text-gray-800 focus:outline-none focus:border-[#579799]"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-600 uppercase block mb-1">Chuyên mục *</label>
              <select 
                required value={categoryId} onChange={e => setCategoryId(e.target.value)}
                className="w-full border border-gray-300 rounded-lg p-2.5 bg-white text-gray-700 focus:outline-none focus:border-[#579799]"
              >
                <option value="">-- Chọn chuyên mục --</option>
                {categories?.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-gray-600 uppercase block mb-1">Đổi ảnh bìa mới (Bỏ trống nếu muốn giữ ảnh cũ)</label>
            <div className="flex gap-4 items-center">
              <input 
                type="file" accept="image/*" onChange={e => setImageFile(e.target.files[0])}
                className="flex-grow border border-dashed border-gray-300 rounded-lg p-2 text-sm bg-gray-50"
              />
              {article.image_path && (
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="text-xs text-gray-500 font-medium">Bìa cũ:</span>
                  <img src={`http://127.0.0.1:8000/storage/${article.image_path}`} alt="cover" className="w-12 h-8 object-cover rounded border" />
                </div>
              )}
            </div>
          </div>

          {/* BUILDER AREA */}
          <div className="flex flex-col gap-3">
            <div className="flex justify-between items-center bg-[#F6F7F0] px-4 py-2.5 rounded-xl border border-[#E5E9DF] sticky top-0 z-20 shadow-sm">
              <span className="text-xs font-extrabold text-[#2F5253] uppercase">Nội dung bài báo (Dạng khối)</span>
              <div className="flex gap-2">
                <button type="button" onClick={addTextBlock} className="bg-white hover:bg-teal-50 text-[#579799] border border-[#9BBFBA] px-3 py-1.5 rounded-lg text-xs font-bold shadow-sm transition">Thêm chữ</button>
                <label className="cursor-pointer bg-white hover:bg-teal-50 text-[#579799] border border-[#9BBFBA] px-3 py-1.5 rounded-lg text-xs font-bold shadow-sm transition">
                  Thêm ảnh<input type="file" className="hidden" accept="image/*" onChange={handleAddImageBlock} />
                </label>
                <label className="cursor-pointer bg-white hover:bg-teal-50 text-[#579799] border border-[#9BBFBA] px-3 py-1.5 rounded-lg text-xs font-bold shadow-sm transition">
                  Thêm video<input type="file" className="hidden" accept="video/*" onChange={handleAddVideoBlock} />
                </label>
              </div>
            </div>

            <div className="flex flex-col gap-3 p-3 border border-[#9BBFBA] rounded-xl bg-gray-50/50 min-h-[220px]">
              {blocks.map((block, index) => (
                <div key={block.id} className="relative bg-white p-3 rounded-xl border border-gray-200 shadow-sm flex flex-col gap-2 transition hover:border-[#579799]">
                  <div className="flex justify-between items-center text-xs font-bold text-gray-400 border-b border-gray-100 pb-2">
                    <span>Khối #{index + 1} ({block.type === 'text' ? 'Văn bản' : block.type === 'image' ? 'Hình ảnh' : 'Video'})</span>
                    {blocks.length > 1 && <button type="button" onClick={() => removeBlock(block.id)} className="text-red-500 hover:text-red-700 font-bold px-1.5 py-0.5 rounded bg-red-50">Xóa khối ✕</button>}
                  </div>
                  {block.type === 'text' && (<RichTextBlock value={block.content} onChange={(val) => updateBlockContent(block.id, val)} placeholder="Nhập nội dung đoạn văn bản..." />)}
                  {block.type === 'image' && <div className="flex justify-center bg-gray-50 p-2 rounded-lg"><img src={block.preview} alt="preview" className="max-h-60 rounded-lg object-contain" onError={(e) => { e.target.onerror = null; e.target.outerHTML = '<span class="text-red-500">Lỗi hiển thị ảnh</span>'; }}/></div>}
                  {block.type === 'video' && <div className="flex justify-center bg-black p-2 rounded-lg"><video src={block.preview} controls className="max-h-60 rounded-lg" onError={(e) => { e.target.onerror = null; e.target.outerHTML = '<span class="text-red-500">Lỗi hiển thị video</span>'; }}/></div>}
                </div>
              ))}
            </div>
          </div>

          {/* Footer Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t flex-shrink-0">
            <button 
              type="button" 
              onClick={onClose} 
              className="px-5 py-2 text-sm font-bold text-gray-500 hover:bg-gray-100 rounded-lg transition"
            >
              Hủy bỏ
            </button>
            <button 
              type="submit" 
              disabled={isSubmitting}
              className="px-8 py-2 text-sm font-bold text-white bg-[#579799] hover:bg-[#2F5253] rounded-lg shadow transition"
            >
              {isSubmitting ? 'Đang lưu...' : 'Lưu và nộp lại ✓'}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}