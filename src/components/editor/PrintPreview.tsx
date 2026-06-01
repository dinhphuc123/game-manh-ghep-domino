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
      .catch((error) => {
        console.error('DOM to Image SVG error:', error);
        showFlashMessage('Không thể kết xuất SVG. Vui lòng thử lại hoặc sử dụng tính năng In PDF.', 'error');
      });
  };

  const handleExportPPTX = () => {
    if (pairs.length === 0) {
      showFlashMessage('Không có dữ liệu để xuất slide PowerPoint!', 'error');
      return;
    }
    showFlashMessage('Đã bắt đầu xuất slide mảnh ghép PowerPoint (PPTX)...', 'info');

    try {
      const pptx = new pptxgen();
      pptx.layout = 'LAYOUT_16x9';

      const shapes = (pptx as any).shapes || (pptx as any).ShapeType || {};

      if (settings.puzzleType === 'domino') {
        // --- PPTX DOMINO MODE ---
        // 1. Sinh danh sách quân Domino nối tiếp
        const dominoPieces: { left: string; right: string; id: number }[] = [];
        dominoPieces.push({
          id: 0,
          left: 'START',
          right: pairs[0]?.question || ''
        });
        for (let i = 0; i < pairs.length - 1; i++) {
          dominoPieces.push({
            id: i + 1,
            left: pairs[i]?.answer || '',
            right: pairs[i+1]?.question || ''
          });
        }
        if (pairs.length > 0) {
          dominoPieces.push({
            id: pairs.length,
            left: pairs[pairs.length - 1]?.answer || '',
            right: 'END'
          });
        }

        // 2. Chia các quân Domino vào các slide, mỗi slide tối đa 4 quân (lưới 2x2)
        const piecesPerSlide = 4;
        const totalSlides = Math.ceil(dominoPieces.length / piecesPerSlide);

        for (let s = 0; s < totalSlides; s++) {
          const slide = pptx.addSlide();
          slide.background = { fill: 'F8FAFC' };

          // Tiêu đề slide nhỏ gọn
          slide.addText(`MẢNH GHÉP DOMINO - SLIDE ${s + 1} / ${totalSlides}`, {
            x: 0.8,
            y: 0.3,
            w: 11.0,
            h: 0.3,
            fontSize: 11,
            bold: true,
            color: '64748B',
            fontFace: 'Arial'
          });

          const slidePieces = dominoPieces.slice(s * piecesPerSlide, (s + 1) * piecesPerSlide);
          slidePieces.forEach((piece, idx) => {
            const col = idx % 2;
            const row = Math.floor(idx / 2);

            const px = col === 0 ? 0.8 : 6.8;
            const py = row === 0 ? 0.8 : 4.0;
            const pw = 5.6;
            const ph = 2.4;

            // Vẽ viền quân Domino
            slide.addShape(shapes.ROUNDED_RECTANGLE || 'roundedRect', {
              x: px,
              y: py,
              w: pw,
              h: ph,
              fill: { color: 'FFFFFF' },
              line: { color: '1E293B', width: 2.5 }
            });

            // Vẽ nét đứt chia đôi ở giữa
            slide.addShape(shapes.LINE || 'line', {
              x: px + pw / 2,
              y: py + 0.1,
              w: 0,
              h: ph - 0.2,
              line: { color: '64748B', width: 1.5, dashType: 'dash' }
            });

            // Nhãn số thứ tự quân Domino
            slide.addShape(shapes.ROUNDED_RECTANGLE || 'roundedRect', {
              x: px + pw / 2 - 0.4,
              y: py + 0.08,
              w: 0.8,
              h: 0.25,
              fill: { color: 'E2E8F0' },
              line: { color: 'CBD5E1', width: 1 }
            });
            slide.addText(`#${piece.id + 1}`, {
              x: px + pw / 2 - 0.4,
              y: py + 0.08,
              w: 0.8,
              h: 0.25,
              fontSize: 8,
              bold: true,
              color: '475569',
              align: 'center',
              valign: 'middle',
              fontFace: 'Arial'
            });

            // Nửa trái: text left (đáp án / START)
            slide.addText(piece.left, {
              x: px + 0.1,
              y: py + 0.3,
              w: pw / 2 - 0.2,
              h: ph - 0.4,
              fontSize: 13,
              bold: true,
              color: piece.left === 'START' ? 'DC2626' : '0F172A',
              align: 'center',
              valign: 'middle',
              fontFace: 'Arial'
            });

            // Nửa phải: text right (câu hỏi / END)
            slide.addText(piece.right, {
              x: px + pw / 2 + 0.1,
              y: py + 0.3,
              w: pw / 2 - 0.2,
              h: ph - 0.4,
              fontSize: 13,
              bold: true,
              color: piece.right === 'END' ? 'DC2626' : '0F172A',
              align: 'center',
              valign: 'middle',
              fontFace: 'Arial'
            });
          });
        }
      } else {
        // --- PPTX JIGSAW / TARSIA / NUMBER / MAZE / BINGO MODE ---
        // Chia các cặp vào các slide, mỗi slide tối đa 2 cặp (tức là 4 mảnh ghép: 2 câu hỏi, 2 đáp án)
        const pairsPerSlide = 2;
        const totalSlides = Math.ceil(pairs.length / pairsPerSlide);

        for (let s = 0; s < totalSlides; s++) {
          const slide = pptx.addSlide();
          slide.background = { fill: 'F8FAFC' };

          slide.addText(`MẢNH GHÉP TRÒ CHƠI - SLIDE ${s + 1} / ${totalSlides}`, {
            x: 0.8,
            y: 0.3,
            w: 11.0,
            h: 0.3,
            fontSize: 11,
            bold: true,
            color: '64748B',
            fontFace: 'Arial'
          });

          const slidePairs = pairs.slice(s * pairsPerSlide, (s + 1) * pairsPerSlide);
          slidePairs.forEach((pair, idx) => {
            const row = idx;

            // Thẻ Câu hỏi ở cột bên trái
            const qx = 0.8;
            const qy = row === 0 ? 0.8 : 4.0;
            const qw = 5.6;
            const qh = 2.8;

            slide.addShape(shapes.ROUNDED_RECTANGLE || 'roundedRect', {
              x: qx,
              y: qy,
              w: qw,
              h: qh,
              fill: { color: 'E0F2FE' },
              line: { color: 'BAE6FD', width: 2 }
            });

            slide.addText("🏷️ NỘI DUNG CÂU HỎI", {
              x: qx + 0.3,
              y: qy + 0.2,
              w: qw - 0.6,
              h: 0.3,
              fontSize: 10,
              bold: true,
              color: '0369A1',
              fontFace: 'Arial'
            });

            slide.addText(pair.question, {
              x: qx + 0.3,
              y: qy + 0.6,
              w: qw - 0.6,
              h: qh - 1.2,
              fontSize: 15,
              bold: true,
              color: '0F172A',
              align: 'center',
              valign: 'middle',
              fontFace: 'Arial'
            });

            slide.addText(`Mã câu hỏi: Q-${pair.code}`, {
              x: qx + 0.3,
              y: qy + qh - 0.4,
              w: qw - 0.6,
              h: 0.3,
              fontSize: 8,
              bold: true,
              color: '0369A1',
              align: 'left',
              fontFace: 'Arial'
            });

            // Thẻ Đáp án ở cột bên phải
            const ax = 6.8;
            const ay = row === 0 ? 0.8 : 4.0;
            const aw = 5.6;
            const ah = 2.8;

            slide.addShape(shapes.ROUNDED_RECTANGLE || 'roundedRect', {
              x: ax,
              y: ay,
              w: aw,
              h: ah,
              fill: { color: 'F0FDF4' },
              line: { color: 'BBF7D0', width: 2 }
            });

            slide.addText("✨ ĐÁP ÁN KHỚP KHÍT", {
              x: ax + 0.3,
              y: ay + 0.2,
              w: aw - 0.6,
              h: 0.3,
              fontSize: 10,
              bold: true,
              color: '15803D',
              fontFace: 'Arial'
            });

            slide.addText(pair.answer, {
              x: ax + 0.3,
              y: ay + 0.6,
              w: aw - 0.6,
              h: ah - 1.2,
              fontSize: 15,
              bold: true,
              color: '0F172A',
              align: 'center',
              valign: 'middle',
              fontFace: 'Arial'
            });

            slide.addText(`Mã đáp án: A-${pair.code}`, {
              x: ax + 0.3,
              y: ay + ah - 0.4,
              w: aw - 0.6,
              h: 0.3,
              fontSize: 8,
              bold: true,
              color: '15803D',
              align: 'right',
              fontFace: 'Arial'
            });
          });
        }
      }

      // --- SLIDE ĐÁP ÁN ĐỐI CHIẾU (TEACHER KEY) ---
      if (settings.puzzleType === 'domino') {
        const dominoPieces: { left: string; right: string; id: number }[] = [];
        dominoPieces.push({
          id: 0,
          left: 'START',
          right: pairs[0]?.question || ''
        });
        for (let i = 0; i < pairs.length - 1; i++) {
          dominoPieces.push({
            id: i + 1,
            left: pairs[i]?.answer || '',
            right: pairs[i+1]?.question || ''
          });
        }
        if (pairs.length > 0) {
          dominoPieces.push({
            id: pairs.length,
            left: pairs[pairs.length - 1]?.answer || '',
            right: 'END'
          });
        }

        const keyPiecesPerSlide = 12;
        const totalKeySlides = Math.ceil(dominoPieces.length / keyPiecesPerSlide);

        for (let ks = 0; ks < totalKeySlides; ks++) {
          const keySlide = pptx.addSlide();
          keySlide.background = { fill: 'F1F5F9' };

          keySlide.addText(`ĐÁP ÁN ĐỐI CHIẾU DOMINO - TRANG ${ks + 1} / ${totalKeySlides}`, {
            x: 0.8,
            y: 0.4,
            w: 11.5,
            h: 0.4,
            fontSize: 16,
            bold: true,
            color: '0F172A',
            fontFace: 'Arial'
          });

          keySlide.addText('Chuỗi kết quả ghép nối quân bài liên tiếp chính xác từ START đến END:', {
            x: 0.8,
            y: 0.9,
            w: 11.5,
            h: 0.3,
            fontSize: 10,
            color: '475569',
            fontFace: 'Arial'
          });

          const slideKeyPieces = dominoPieces.slice(ks * keyPiecesPerSlide, (ks + 1) * keyPiecesPerSlide);
          const keyPieceW = 2.2;
          const keyPieceH = 0.9;
          const arrowW = 0.4;
          const itemsPerRow = 4;

          slideKeyPieces.forEach((piece, idx) => {
            const col = idx % itemsPerRow;
            const row = Math.floor(idx / itemsPerRow);

            const px = 0.8 + col * (keyPieceW + arrowW);
            const py = 1.4 + row * (keyPieceH + 0.6);

            keySlide.addShape(shapes.ROUNDED_RECTANGLE || 'roundedRect', {
              x: px,
              y: py,
              w: keyPieceW,
              h: keyPieceH,
              fill: { color: 'FFFFFF' },
              line: { color: '475569', width: 1.5 }
            });

            keySlide.addShape(shapes.LINE || 'line', {
              x: px + keyPieceW / 2,
              y: py + 0.05,
              w: 0,
              h: keyPieceH - 0.1,
              line: { color: '94A3B8', width: 1, dashType: 'dash' }
            });

            const globalIdx = ks * keyPiecesPerSlide + idx;
            keySlide.addText(`#${globalIdx + 1}`, {
              x: px,
              y: py - 0.25,
              w: keyPieceW,
              h: 0.2,
              fontSize: 7.5,
              bold: true,
              color: '64748B',
              align: 'center',
              fontFace: 'Arial'
            });

            keySlide.addText(piece.left, {
              x: px + 0.05,
              y: py + 0.05,
              w: keyPieceW / 2 - 0.1,
              h: keyPieceH - 0.1,
              fontSize: 9,
              bold: true,
              color: piece.left === 'START' ? 'DC2626' : '1E293B',
              align: 'center',
              valign: 'middle',
              fontFace: 'Arial'
            });

            keySlide.addText(piece.right, {
              x: px + keyPieceW / 2 + 0.05,
              y: py + 0.05,
              w: keyPieceW / 2 - 0.1,
              h: keyPieceH - 0.1,
              fontSize: 9,
              bold: true,
              color: piece.right === 'END' ? 'DC2626' : '1E293B',
              align: 'center',
              valign: 'middle',
              fontFace: 'Arial'
            });

            if (globalIdx < dominoPieces.length - 1) {
              const isLastInRow = col === itemsPerRow - 1;
              if (!isLastInRow) {
                keySlide.addText('➔', {
                  x: px + keyPieceW,
                  y: py,
                  w: arrowW,
                  h: keyPieceH,
                  fontSize: 14,
                  color: '94A3B8',
                  align: 'center',
                  valign: 'middle',
                  fontFace: 'Arial'
                });
              } else {
                keySlide.addText('↴', {
                  x: px + keyPieceW - 0.4,
                  y: py + keyPieceH - 0.1,
                  w: 0.4,
                  h: 0.3,
                  fontSize: 12,
                  color: '94A3B8',
                  align: 'center',
                  fontFace: 'Arial'
                });
              }
            }
          });
        }
      } else {
        const rowsPerSlide = 8;
        const totalKeySlides = Math.ceil(pairs.length / rowsPerSlide);

        for (let ks = 0; ks < totalKeySlides; ks++) {
          const keySlide = pptx.addSlide();
          keySlide.background = { fill: 'F1F5F9' };

          keySlide.addText(`ĐÁP ÁN ĐỐI CHIẾU CẶP GHÉP - TRANG ${ks + 1} / ${totalKeySlides}`, {
            x: 0.8,
            y: 0.4,
            w: 11.5,
            h: 0.4,
            fontSize: 16,
            bold: true,
            color: '0F172A',
            fontFace: 'Arial'
          });

          keySlide.addText('Danh sách các cặp Câu hỏi & Đáp án đúng khớp khít nhau:', {
            x: 0.8,
            y: 0.9,
            w: 11.5,
            h: 0.3,
            fontSize: 10,
            color: '475569',
            fontFace: 'Arial'
          });

          const tableRows: any[] = [];
          tableRows.push([
            { text: 'STT', options: { bold: true, fill: '2F2A40', color: 'FFFFFF', align: 'center' } },
            { text: 'Nội dung Câu hỏi (Vế 1)', options: { bold: true, fill: '2F2A40', color: 'FFFFFF', align: 'left' } },
            { text: 'Đáp án chuẩn (Vế 2)', options: { bold: true, fill: '159BAD', color: 'FFFFFF', align: 'left' } },
            { text: 'Mã khớp', options: { bold: true, fill: '2F2A40', color: 'FFFFFF', align: 'center' } }
          ]);

          const slidePairs = pairs.slice(ks * rowsPerSlide, (ks + 1) * rowsPerSlide);
          slidePairs.forEach((pair, idx) => {
            const globalIdx = ks * rowsPerSlide + idx;
            tableRows.push([
              { text: `${globalIdx + 1}`, options: { align: 'center' } },
              { text: pair.question, options: { align: 'left' } },
              { text: pair.answer, options: { align: 'left', color: '159BAD', bold: true } },
              { text: pair.code, options: { align: 'center' } }
            ]);
          });

          keySlide.addTable(tableRows, {
            x: 0.8,
            y: 1.3,
            w: 11.7,
            colW: [0.8, 5.0, 5.0, 0.9],
            border: { type: 'solid', color: 'CBD5E1', pt: 1 },
            fill: { color: 'FFFFFF' },
            fontSize: 10,
            fontFace: 'Arial',
            valign: 'middle'
          });
        }
      }

      const fileName = `SlideGameGhepCap_${settings.title.replace(/\s+/g, '_')}.pptx`;
      pptx.writeFile({ fileName });
      showFlashMessage('Đã tải xuống slide PowerPoint (.pptx) chỉ chứa mảnh ghép thành công!', 'success');
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
              onClick={() => setActiveTab('questions')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                activeTab === 'questions'
                  ? 'bg-white text-[#2F2A40] shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/40'
              }`}
            >
              📝 Biên tập câu hỏi
            </button>
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
    </>
  );
};
