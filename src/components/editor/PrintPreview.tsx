import React from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Layout, 
  Scissors, 
  Maximize2, 
  RefreshCw, 
  Loader2, 
  Printer, 
  Download, 
  Image as ImageIcon, 
  FileCode 
} from 'lucide-react';
import * as htmlToImage from 'html-to-image';
import pptxgen from 'pptxgenjs';
import { useEditorStore } from '../../stores/editorStore';
import { useUIStore } from '../../stores/uiStore';
import { saveGameToCloud } from '../../firebaseService';

export const PrintPreview: React.FC<{
  onStartProjection: () => void;
}> = ({ onStartProjection }) => {
  const {
    pairs,
    settings,
    currentGameId,
    scramblePairs,
  } = useEditorStore();

  const {
    activeTab,
    setActiveTab,
    isSidebarCollapsed,
    setSidebarCollapsed,
    showTeacherKeyPrint,
    setShowTeacherKeyPrint,
    showCuttingBorders,
    setShowCuttingBorders,
    publishing,
    setPublishing,
    setPublishedPin,
    setIsLocalPublish,
    setShowPublishModal,
    showFlashMessage,
  } = useUIStore();

  const handleScramble = () => {
    scramblePairs();
    showFlashMessage('Đã xáo trộn ngẫu nhiên thứ tự các câu hỏi và đáp án!', 'success');
  };

  const handlePrint = () => {
    window.print();
  };

  // Helper autoSaveGame with PIN update
  const autoSaveGameWithPin = (pin: string) => {
    if (!currentGameId || pairs.length === 0) return;
    try {
      const raw = localStorage.getItem('canva_puzzle_teacher_games');
      const list = raw ? JSON.parse(raw) : [];
      
      const existingIdx = list.findIndex((g: any) => g.id === currentGameId);
      const gameData = {
        id: currentGameId,
        title: settings.title,
        subject: settings.subject,
        settings: settings,
        pairs: pairs,
        publishedPin: pin,
        createdAt: existingIdx >= 0 ? list[existingIdx].createdAt : new Date().toISOString(),
      };

      if (existingIdx >= 0) {
        list[existingIdx] = gameData;
      } else {
        list.push(gameData);
      }
      localStorage.setItem('canva_puzzle_teacher_games', JSON.stringify(list));
    } catch (e) {
      console.error('Error auto saving game with pin', e);
    }
  };

  const handlePublishGame = async () => {
    if (pairs.length === 0) {
      showFlashMessage('Vui lòng thêm các cặp câu hỏi trước khi xuất bản!', 'error');
      return;
    }
    setPublishing(true);
    try {
      const result = await saveGameToCloud(settings, pairs);
      setPublishedPin(result.pin);
      setIsLocalPublish(result.isLocal);
      setShowPublishModal(true);
      
      // Cập nhật mã PIN vừa xuất bản vào bộ game lưu trữ cục bộ
      autoSaveGameWithPin(result.pin);

      showFlashMessage('Xuất bản game thành công!', 'success');
    } catch (err: any) {
      showFlashMessage('Lỗi xuất bản: ' + err.message, 'error');
    } finally {
      setPublishing(false);
    }
  };

  const handleExportPNG = () => {
    const element = document.getElementById('puzzle-preview-canvas');
    if (!element) return;
    showFlashMessage('Đang kết xuất ảnh chất lượng cao PNG...', 'info');
    
    htmlToImage.toPng(element, {
      quality: 0.98,
      backgroundColor: '#FFFFFF',
      style: {
        transform: 'none',
        borderRadius: '0',
      }
    })
      .then((dataUrl) => {
        const link = document.createElement('a');
        link.download = `Game-Ghep-Manh-${settings.title.replace(/\s+/g, '_')}.png`;
        link.href = dataUrl;
        link.click();
        showFlashMessage('Đã tải xuống ảnh PNG siêu rõ nét!', 'success');
      })
      .catch((error) => {
        console.error('DOM to Image PNG error:', error);
        showFlashMessage('Không thể kết xuất PNG. Vui lòng thử lại hoặc sử dụng tính năng In PDF.', 'error');
      });
  };

  const handleExportSVG = () => {
    const element = document.getElementById('puzzle-preview-canvas');
    if (!element) return;
    showFlashMessage('Đang thiết lập định dạng vector SVG...', 'info');

    htmlToImage.toSvg(element, {
      backgroundColor: '#FFFFFF',
    })
      .then((dataUrl) => {
        const link = document.createElement('a');
        link.download = `Game-Ghep-Manh-${settings.title.replace(/\s+/g, '_')}.svg`;
        link.href = dataUrl;
        link.click();
        showFlashMessage('Đã tải xuống file đồ họa Vector SVG thành công!', 'success');
      })
      .catch(() => {
        showFlashMessage('Không thể xuất dạng SVG. Vui lòng thử in hoặc xuất PNG.', 'error');
      });
  };

  const handleExportPPTX = () => {
    if (pairs.length === 0) {
      showFlashMessage('Không có dữ liệu để xuất slide PowerPoint!', 'error');
      return;
    }
    showFlashMessage('Đang khởi tạo slide PowerPoint (PPTX)...', 'info');

    try {
      const pptx = new pptxgen();
      pptx.layout = 'LAYOUT_16x9';

      const shapes = (pptx as any).shapes || (pptx as any).ShapeType || {};

      // --- SLIDE 1: INTRO TITLE ---
      const slide1 = pptx.addSlide();
      const themeBg = settings.style === 'vibrant' ? '2F2A40' : 'F8FAFC';
      const textColor = settings.style === 'vibrant' ? 'FFFFFF' : '1E293B';
      const accentColor = 'FFAE00';
      
      slide1.background = { fill: themeBg };
      
      slide1.addText("🧩 BẢN TRÌNH CHIẾU MATCHING GAME HỌC ĐƯỜNG", {
        x: 0.8,
        y: 0.8,
        w: 11.0,
        h: 0.5,
        fontSize: 14,
        bold: true,
        color: accentColor,
        fontFace: 'Arial'
      });
      
      slide1.addText(settings.title || "Game Ghép Cặp Học Tập", {
        x: 0.8,
        y: 1.4,
        w: 11.0,
        h: 1.6,
        fontSize: 32,
        bold: true,
        color: textColor,
        fontFace: 'Arial'
      });
      
      let metaText = `Môn học: ${settings.subject || 'Tổng hợp'}\n`;
      if (settings.gradeClass) metaText += `Lớp: ${settings.gradeClass}\n`;
      if (settings.teacherName) metaText += `Giáo viên: ${settings.teacherName}\n`;
      metaText += `Hoạt động khóa: ${settings.activityType || 'Luyện tập'}`;
      
      slide1.addText(metaText, {
        x: 0.8,
        y: 3.2,
        w: 6.5,
        h: 2.0,
        fontSize: 14,
        color: settings.style === 'vibrant' ? 'CBD5E1' : '475569',
        fontFace: 'Arial',
        lineSpacing: 24
      });
      
      slide1.addShape(shapes.ROUNDED_RECTANGLE || 'roundedRect', {
        x: 8.5,
        y: 3.2,
        w: 4.0,
        h: 2.0,
        fill: { color: '159BAD' },
        line: { color: '159BAD', width: 1 }
      });
      
      slide1.addText("HƯỚNG DẪN TRÊN LỚP:\n\n1. Ghép nối các mảnh lồi lõm tương ứng giữa Câu hỏi & Đáp án.\n2. Đối chiếu mã số trùng khớp để tự chấm điểm.", {
        x: 8.7,
        y: 3.4,
        w: 3.6,
        h: 1.6,
        fontSize: 11,
        color: 'FFFFFF',
        bold: true,
        align: 'left',
        fontFace: 'Arial'
      });

      // --- SLIDE 2: RULE DECK ---
      const slide2 = pptx.addSlide();
      slide2.background = { fill: 'FFFFFF' };
      
      slide2.addText("QUY TẮC GHÉP HÌNH MỸ THUẬT 🎯", {
        x: 0.8,
        y: 0.6,
        w: 11.5,
        h: 0.6,
        fontSize: 22,
        bold: true,
        color: '2F2A40',
        fontFace: 'Arial'
      });
      
      const rules = [
        { num: "1", text: "Tìm đúng vế ghép: Thẻ câu hỏi lồi (hoặc lõm) sẽ lắp khớp khít với duy nhất thẻ đáp án." },
        { num: "2", text: "Mã số tự kiểm: Dưới chân mỗi mảnh có ký hiệu Q (Question) & A (Answer) đi kèm mã số giống nhau." },
        { num: "3", text: "Trực quan 3D: Lắp đủ các cặp ghép sẽ tái sinh thành khối hình chữ số 3D nghệ thuật hoàn mỹ." },
        { num: "4", text: "Thi đua tính điểm: Đội thi nào lắp ghép hoàn thành nhanh nhất và đúng nhất sẽ chiến thắng!" }
      ];
      
      rules.forEach((rule, idx) => {
        const ry = 1.5 + idx * 0.9;
        slide2.addShape(shapes.OVAL || 'oval', {
          x: 0.8,
          y: ry,
          w: 0.45,
          h: 0.45,
          fill: { color: '159BAD' }
        });
        slide2.addText(rule.num, {
          x: 0.8,
          y: ry,
          w: 0.45,
          h: 0.45,
          fontSize: 13,
          bold: true,
          color: 'FFFFFF',
          align: 'center',
          valign: 'middle'
        });
        slide2.addText(rule.text, {
          x: 1.4,
          y: ry + 0.05,
          w: 10.5,
          h: 0.4,
          fontSize: 13,
          bold: true,
          color: '334155',
          fontFace: 'Arial'
        });
      });

      // --- SLIDES 3+: EACH EXCEL-PAIR GAME CARD ---
      pairs.forEach((pair, idx) => {
        const slide = pptx.addSlide();
        slide.background = { fill: 'F8FAFC' };
        
        slide.addText(`THAO TÁC CẶP GHÉP TRÊN LỚP #${idx + 1} / ${pairs.length}`, {
          x: 0.8,
          y: 0.4,
          w: 11.0,
          h: 0.4,
          fontSize: 12,
          bold: true,
          color: '64748B',
          fontFace: 'Arial'
        });
        
        slide.addShape(shapes.ROUNDED_RECTANGLE || 'roundedRect', {
          x: 0.8,
          y: 1.0,
          w: 5.4,
          h: 3.8,
          fill: { color: 'E0F2FE' },
          line: { color: 'bae6fd', width: 2 }
        });
        
        slide.addText("🏷️ NỘI DUNG CÂU HỎI", {
          x: 1.1,
          y: 1.2,
          w: 4.8,
          h: 0.4,
          fontSize: 11,
          bold: true,
          color: '0369A1',
          fontFace: 'Arial'
        });
        
        slide.addText(pair.question, {
          x: 1.1,
          y: 1.7,
          w: 4.8,
          h: 2.6,
          fontSize: 18,
          bold: true,
          color: '0f172a',
          fontFace: 'Arial',
          align: 'center',
          valign: 'middle'
        });
        
        slide.addShape(shapes.ROUNDED_RECTANGLE || 'roundedRect', {
          x: 7.0,
          y: 1.0,
          w: 5.4,
          h: 3.8,
          fill: { color: 'F0FDF4' },
          line: { color: 'bbf7d0', width: 2 }
        });
        
        slide.addText("✨ ĐÁP ÁN KHỚP KHÍT", {
          x: 7.3,
          y: 1.2,
          w: 4.8,
          h: 0.4,
          fontSize: 11,
          bold: true,
          color: '15803D',
          fontFace: 'Arial'
        });
        
        slide.addText(pair.answer, {
          x: 7.3,
          y: 1.7,
          w: 4.8,
          h: 2.6,
          fontSize: 18,
          bold: true,
          color: '0f172a',
          fontFace: 'Arial',
          align: 'center',
          valign: 'middle'
        });
        
        if (settings.showMatchCode) {
          slide.addShape(shapes.ROUNDED_RECTANGLE || 'roundedRect', {
            x: 5.4,
            y: 5.1,
            w: 2.4,
            h: 0.4,
            fill: { color: 'F1F5F9' },
            line: { color: 'cbd5e1', width: 1 }
          });
          
          slide.addText(`Mã kiểm tra chéo: Q/A-${pair.code}`, {
            x: 5.4,
            y: 5.1,
            w: 2.4,
            h: 0.4,
            fontSize: 9,
            bold: true,
            color: '475569',
            fontFace: 'Arial',
            align: 'center',
            valign: 'middle'
          });
        }
      });
      
      // --- FINAL CONGRATULATIONS ---
      const slideEnd = pptx.addSlide();
      slideEnd.background = { fill: themeBg };
      
      slideEnd.addText("🏆 HOÀN THÀNH HOẠT ĐỘNG XUẤT SẮC!", {
        x: 0.8,
        y: 2.0,
        w: 11.5,
        h: 0.8,
        fontSize: 26,
        bold: true,
        color: accentColor,
        align: 'center',
        fontFace: 'Arial'
      });
      
      slideEnd.addText("Đã ghép đôi và lắp ráp thành công tất cả các mảnh puzzle 3D tinh xảo.", {
        x: 0.8,
        y: 3.0,
        w: 11.5,
        h: 0.6,
        fontSize: 14,
        color: settings.style === 'vibrant' ? 'CBD5E1' : '475569',
        align: 'center',
        fontFace: 'Arial'
      });
      
      const fileName = `SlideGameGhepCap_${settings.title.replace(/\s+/g, '_')}.pptx`;
      pptx.writeFile({ fileName });
      showFlashMessage('Đã tải xuống slide PowerPoint (.pptx) trình chiếu thành công!', 'success');
    } catch (err: any) {
      console.error('PPTX export error:', err);
      showFlashMessage('Lỗi tạo PPTX: ' + err.message, 'error');
    }
  };

  return (
    <>
      {/* FLOATING ACTION TOOLBAR */}
      <div className="bg-white rounded-2xl p-2.5 shadow-[0_4px_20px_rgb(0,0,0,0.02)] border border-slate-200 flex flex-wrap gap-2 items-center justify-between no-print relative z-30">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setSidebarCollapsed(!isSidebarCollapsed)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-950 text-xs font-bold rounded-xl transition-all cursor-pointer border border-indigo-150 shadow-xs"
            title={isSidebarCollapsed ? "Mở rộng bảng cấu hình nhập liệu" : "Thu gọn bảng cấu hình nhập liệu để mở rộng vùng thiết kế"}
          >
            {isSidebarCollapsed ? <ChevronRight size={14} className="text-[#159BAD] animate-pulse" /> : <ChevronLeft size={14} className="text-indigo-600" />}
            <span className="font-extrabold">{isSidebarCollapsed ? "Hiện Bảng Cấu Hình" : "Thu Gọn Cấu Hình"}</span>
          </button>

          {/* VIEW MODE SWAPPERS */}
          <div className="flex flex-wrap items-center bg-slate-100 p-1 rounded-2xl border border-slate-200/50 gap-1">
            <button
              type="button"
              onClick={() => setActiveTab('poster')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                activeTab === 'poster'
                  ? 'bg-white text-[#2F2A40] shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/40'
              }`}
            >
              <Layout size={14} /> Chế độ 16:9 Slide
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('cutout')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                activeTab === 'cutout'
                  ? 'bg-white text-[#2F2A40] shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/40'
              }`}
            >
              <Scissors size={14} /> Phiếu cắt rời (A4 In)
            </button>
            <button
              type="button"
              onClick={onStartProjection}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer text-[#159BAD] hover:bg-[#159BAD]/10"
              title="Bắt đầu chế độ trình chiếu Tivi, bảng tương tác lớp học"
            >
              <Maximize2 size={13} className="text-[#F54B32] animate-pulse" /> 📺 Trình Chiếu TV
            </button>
          </div>
        </div>

        {/* EXPORT ACTION BUTTONS */}
        <div className="flex flex-wrap items-center gap-1.5">
          {activeTab === 'cutout' && (
            <button
              type="button"
              onClick={handleScramble}
              className="flex items-center gap-1.5 bg-yellow-50 hover:bg-yellow-100 text-yellow-800 border border-yellow-200/70 text-xs px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer"
              title="Xáo trộn ngẫu nhiên tất cả các thẻ để học sinh tự cắt rồi tìm lại mảnh khớp"
            >
              <RefreshCw size={13} /> Xáo đáp án
            </button>
          )}

          <button
            type="button"
            onClick={handlePublishGame}
            disabled={publishing}
            className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs px-3.5 py-1.5 rounded-xl font-bold transition-all cursor-pointer shadow-md hover:shadow-indigo-500/20 disabled:opacity-50"
            title="Xuất bản game lên đám mây và nhận mã chia sẻ trực tuyến cho học sinh"
          >
            {publishing ? <Loader2 size={13} className="animate-spin" /> : '☁️ Xuất bản Cloud'}
          </button>

          <button
            type="button"
            onClick={handlePrint}
            className="flex items-center gap-1 bg-[#2F2A40] hover:bg-slate-800 text-white text-xs px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer"
            title="In trực tiếp ra giấy A4 trên lớp"
          >
            <Printer size={13} /> In / Lưu PDF A4
          </button>

          <div className="relative group/export">
            <button
              type="button"
              className="flex items-center gap-1.5 bg-[#159BAD] hover:bg-[#0B7382] text-white text-xs px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer"
            >
              <Download size={13} /> Xuất thiết kế
            </button>
            <div className="absolute right-0 mt-1 w-36 bg-white rounded-xl shadow-lg border border-slate-100 py-1 hidden group-hover/export:block z-50">
              <button
                type="button"
                onClick={handleExportPNG}
                className="w-full text-left text-xs px-3 py-2 hover:bg-slate-50 font-bold text-slate-700 flex items-center gap-1.5 cursor-pointer"
              >
                <ImageIcon size={12} className="text-pink-500" /> Xuất ảnh PNG
              </button>
              <button
                type="button"
                onClick={handleExportSVG}
                className="w-full text-left text-xs px-3 py-2 hover:bg-slate-50 font-bold text-slate-700 flex items-center gap-1.5 cursor-pointer"
              >
                <FileCode size={12} className="text-cyan-500" /> Xuất ảnh SVG
              </button>
              <button
                type="button"
                onClick={handleExportPPTX}
                className="w-full text-left text-xs px-3 py-2 hover:bg-slate-50 font-bold text-slate-700 flex items-center gap-1.5 cursor-pointer"
              >
                <FileCode size={12} className="text-amber-500" /> Xuất Slide PPTX
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* PRINT & OFFLINE OPTIMIZATION TOOLBAR */}
      {activeTab === 'cutout' && (
        <div className="bg-[#FEFAF0] border border-[#FFC928]/40 p-4 rounded-2xl shadow-sm flex flex-col gap-3 no-print animate-fade-in mb-1">
          <div className="flex items-center gap-2 pb-1.5 border-b border-[#FFC928]/20">
            <span className="text-base">✂️</span>
            <div>
              <h3 className="text-xs font-bold text-[#2F2A40]">Hiệu Chỉnh In Ấn & Cắt Học Liệu</h3>
              <p className="text-[10px] text-slate-500">Tùy biến hỗ trợ cho thầy cô in PDF và chuẩn bị phiếu học tập offline lý tưởng.</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-x-6 gap-y-2">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                className="w-4.5 h-4.5 accent-[#FFC928] rounded cursor-pointer"
                checked={showCuttingBorders}
                onChange={(e) => setShowCuttingBorders(e.target.checked)}
              />
              <div>
                <span className="text-[11px] font-bold text-slate-700 block">Kích hoạt viền cắt rời nét đứt & kéo</span>
                <span className="text-[9px] text-slate-400 block -mt-0.5">Tạo các nét đứt chuẩn rành mạch quanh thẻ để định hướng cắt bằng kéo dễ dàng</span>
              </div>
            </label>

            <label className="flex items-center gap-2 cursor-pointer select-none border-l border-slate-200 pl-6">
              <input
                type="checkbox"
                className="w-4.5 h-4.5 accent-[#FFC928] rounded cursor-pointer"
                checked={showTeacherKeyPrint}
                onChange={(e) => setShowTeacherKeyPrint(e.target.checked)}
              />
              <div>
                <span className="text-[11px] font-bold text-slate-700 block">Hiện bảng Đáp Án Đối Chiếu mẫu</span>
                <span className="text-[9px] text-slate-400 block -mt-0.5">Một bảng kết quả thu nhỏ ở đáy trang giúp giáo viên chấm điểm cực nhanh</span>
              </div>
            </label>

            <label className="flex items-center gap-2 cursor-pointer select-none border-l border-slate-200 pl-6">
              <input
                type="checkbox"
                disabled // settings sync ink directly
                className="w-4.5 h-4.5 accent-indigo-600 rounded cursor-pointer opacity-50 cursor-not-allowed"
                checked={settings.saveInk}
              />
              <div>
                <span className="text-[11px] font-bold text-indigo-900 block opacity-50">In trắng đen (GV cấu hình ở Panel Trái) ⭐</span>
                <span className="text-[9px] text-slate-500 block -mt-0.5">Đã được đồng bộ với cài đặt in tiết kiệm mực ở bảng cấu hình trái</span>
              </div>
            </label>
          </div>
        </div>
      )}
    </>
  );
};
