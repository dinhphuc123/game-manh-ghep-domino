import React, { useState, useEffect, useRef } from 'react';
import { Scissors, Cpu, AlertTriangle, Loader2, Sparkles } from 'lucide-react';
import { useEditorStore } from '../../stores/editorStore';
import { useUIStore } from '../../stores/uiStore';
import { useGeminiConfigStore } from '../../stores/geminiConfigStore';
import { generateAIDistractors } from '../../services/geminiService';
import { SchoolBackgroundDoodles } from '../Doodles';
import { TarsiaView } from '../TarsiaView';
import { DominoView } from '../DominoView';
import { NumberJigsawView } from '../NumberJigsawView';
import { MathMazeView } from '../MathMazeView';
import { BingoView } from '../BingoView';
import { PuzzleCard } from '../PuzzleCard';
import { MathJaxWrapper } from '../MathJaxWrapper';

export const PreviewWorkspace: React.FC = () => {
  const {
    pairs,
    settings,
    questionOrder,
    answerOrder,
    swapCutoutItems,
  } = useEditorStore();

  const {
    activeTab,
    showCuttingBorders,
    showTeacherKeyPrint,
    showFlashMessage,
  } = useUIStore();

  const [draggedItem, setDraggedItem] = useState<{ type: 'question' | 'answer'; index: number } | null>(null);

  // Gemini/OpenRouter AI distractors state
  const { 
    apiKey: geminiApiKey, 
    model: geminiModel,
    provider: aiProvider,
    openRouterApiKey,
    openRouterModel
  } = useGeminiConfigStore();
  const [aiDistractors, setAiDistractors] = useState<Map<string, string[]> | undefined>(undefined);
  const [loadingAI, setLoadingAI] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const lastPairsRef = useRef<string>('');

  useEffect(() => {
    const fetchDistractors = async () => {
      // Chỉ chạy khi là puzzleType math_maze, có các pairs hợp lệ
      if (settings.puzzleType !== 'math_maze' || pairs.length === 0) {
        setAiDistractors(undefined);
        return;
      }

      const pairsJson = JSON.stringify(pairs);
      if (pairsJson === lastPairsRef.current) {
        return;
      }

      setLoadingAI(true);
      setAiError(null);

      try {
        const result = await generateAIDistractors(
          pairs, 
          geminiApiKey, 
          geminiModel,
          aiProvider,
          openRouterApiKey,
          openRouterModel
        );
        setAiDistractors(result);
        lastPairsRef.current = pairsJson;
      } catch (err: any) {
        console.error(err);
        setAiError(err.message || 'Lỗi không xác định khi kết nối với AI.');
        setAiDistractors(undefined);
      } finally {
        setLoadingAI(false);
      }
    };

    fetchDistractors();
  }, [pairs, settings.puzzleType, geminiApiKey, geminiModel, aiProvider, openRouterApiKey, openRouterModel]);


  const handleDragStart = (e: React.DragEvent, type: 'question' | 'answer', index: number) => {
    setDraggedItem({ type, index });
    e.dataTransfer.setData('text/plain', JSON.stringify({ type, index }));
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDrop = (e: React.DragEvent, targetType: 'question' | 'answer', targetIdx: number) => {
    e.preventDefault();
    if (!draggedItem) return;
    if (draggedItem.type !== targetType) {
      showFlashMessage('Bạn chỉ có thể sắp xếp các vế cùng loại với nhau!', 'error');
      return;
    }
    const fromIdx = draggedItem.index;
    if (fromIdx === targetIdx) return;
    
    swapCutoutItems(targetType, fromIdx, targetIdx);
    setDraggedItem(null);
    showFlashMessage('Đã chuyển đổi vị trí vế ghép câu đối thành công!', 'success');
  };

  return (
    <div className="w-full overflow-x-auto select-none rounded-2xl bg-slate-300/50 p-3 md:p-6 relative min-h-[400px] border border-slate-300/70 shadow-inner">
      <div
        id="puzzle-preview-canvas"
        className="printable-area bg-white mx-auto shadow-2xl rounded-2xl border border-slate-200/60 p-6 md:p-8 shrink-0 relative overflow-hidden transition-all grid-school"
        style={{
          width: activeTab === 'poster' ? '100%' : '210mm',
          maxWidth: '100%',
          minHeight: activeTab === 'poster' ? '520px' : '297mm',
          aspectRatio: 'unset',
        }}
      >
        {/* CUTE SCHOOL DOODLE BACKGROUND IF ENABLED */}
        {settings.showDoodleIcons && <SchoolBackgroundDoodles />}

        {/* CANVA WORKBOOK HEADER */}
        {settings.showHeader !== false && (
          <div className="relative z-10 border-b-2 border-slate-300 pb-4 mb-6 flex flex-col md:flex-row md:justify-between md:items-end gap-3">
            <div className="flex-1 text-slate-800">
              {/* Subject Tag */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-widest bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                  📝 {settings.subject || 'Môn học'}
                </span>
              </div>

              {/* Title */}
              <h3 className="text-2xl sm:text-3xl font-extrabold text-[#2F2A40] mt-2 tracking-tight">
                {settings.title || 'Bộ Game Ghép Cặp'}
              </h3>

              {/* Mini description / instructions */}
              <p className="text-xs text-slate-500 mt-1 font-medium italic">
                {activeTab === 'poster'
                  ? 'Hướng dẫn: Thảo luận cặp đôi để tìm các vế tương thích và khớp nối hoàn chỉnh.'
                  : 'Hướng dẫn cho GV: In màu ra giấy A4, cắt rời theo đường nét đứt, xáo trộn và phát cho học sinh.'}
              </p>
            </div>

            {/* Teacher / Class metadata cards */}
            <div className="flex flex-row md:flex-col gap-2 shrink-0 justify-start sm:items-end text-[11px] font-bold text-slate-600 font-sans">
              {settings.gradeClass && (
                <div className="bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-lg flex items-center gap-1 shadow-sm">
                  <span className="text-[#159BAD]">🏫</span> {settings.gradeClass}
                </div>
              )}
              {settings.teacherName && (
                <div className="bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-lg flex items-center gap-1 shadow-sm">
                  <span className="text-[#F54B32]">👩‍🏫</span> GV: {settings.teacherName}
                </div>
              )}
            </div>
          </div>
        )}


        {settings.puzzleType === 'tarsia' ? (
          <TarsiaView
            pairs={pairs}
            shape={settings.tarsiaShape}
            style={settings.style}
            showMatchCode={settings.showMatchCode}
            showDoodleIcons={settings.showDoodleIcons}
            saveInk={settings.saveInk}
            pieceSize={settings.pieceSize}
            activeTab={activeTab}
          />
        ) : settings.puzzleType === 'domino' ? (
          <DominoView
            pairs={pairs}
            style={settings.style}
            showDoodleIcons={settings.showDoodleIcons}
            saveInk={settings.saveInk}
            pieceSize={settings.pieceSize}
            activeTab={activeTab}
            dominoShape={settings.dominoShape}
            dominoWidth={settings.dominoWidth || 160}
            dominoHeight={settings.dominoHeight || 68}
          />
        ) : settings.puzzleType === 'number_jigsaw' ? (
          <NumberJigsawView
            pairs={pairs}
            numberShape={settings.numberShape}
            style={settings.style}
            showMatchCode={settings.showMatchCode}
            showDoodleIcons={settings.showDoodleIcons}
            saveInk={settings.saveInk}
            pieceSize={settings.pieceSize}
            activeTab={activeTab}
            numberScaleX={settings.numberScaleX || 1.0}
            numberScaleY={settings.numberScaleY || 1.0}
          />
        ) : settings.puzzleType === 'math_maze' ? (
          <div className="flex flex-col gap-4 w-full relative z-10">
            {/* Gemini AI Status Header */}
            <div className="no-print w-full flex flex-col gap-2 mb-2">
              {loadingAI && (
                <div className="flex items-center gap-2.5 bg-slate-900/5 border border-slate-200 p-3 rounded-2xl animate-pulse">
                  <Loader2 className="w-4 h-4 text-emerald-600 animate-spin" />
                  <span className="text-xs font-semibold text-slate-700">
                    🤖 Gemini AI đang phân tích câu hỏi và sinh phương án nhiễu thông minh...
                  </span>
                </div>
              )}
              {aiError && (
                <div className="flex items-start gap-2.5 bg-rose-50 border border-rose-100 p-3.5 rounded-2xl">
                  <AlertTriangle className="w-4 h-4 text-rose-500 mt-0.5 shrink-0" />
                  <div className="flex-grow">
                    <div className="text-xs font-bold text-rose-855 flex items-center gap-1.5">
                      Không thể tạo phương án nhiễu bằng Gemini AI
                      <span className="bg-rose-100 text-rose-700 text-[9px] font-bold px-1.5 py-0.5 rounded">Dự phòng hoạt động</span>
                    </div>
                    <p className="text-[10px] text-rose-600 mt-0.5 leading-relaxed">
                      {aiError} <br />
                      Hệ thống đang tự động chuyển sang chế độ tạo đáp án nhiễu ngẫu nhiên để trò chơi vẫn có thể chạy bình thường.
                      Bạn có thể cấu hình lại API Key trong phần{' '}
                      <a href="/admin" className="font-bold underline text-rose-750 hover:text-rose-900">Admin Panel</a>.
                    </p>
                  </div>
                </div>
              )}
              {!loadingAI && !aiError && aiDistractors && (
                <div className="flex items-center justify-between bg-emerald-50/60 border border-emerald-100/80 px-4 py-2.5 rounded-2xl">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-emerald-600 animate-bounce" />
                    <span className="text-xs font-semibold text-emerald-800">
                      Đã áp dụng phương án nhiễu thông minh do Gemini AI sinh tự động!
                    </span>
                  </div>
                  <span className="text-[9px] bg-emerald-100 text-emerald-700 font-bold px-2 py-0.5 rounded-md">
                    Gemini 2.0 Flash
                  </span>
                </div>
              )}
            </div>

            <MathMazeView
              pairs={pairs}
              style={settings.style}
              mazeRows={settings.mazeRows || 4}
              mazeCols={settings.mazeCols || 5}
              mazeStyle={settings.mazeStyle || 'animal_cartoon'}
              saveInk={settings.saveInk}
              pieceSize={settings.pieceSize}
              activeTab={activeTab}
              aiDistractors={aiDistractors}
            />
          </div>

        ) : settings.puzzleType === 'bingo' ? (
          <BingoView
            pairs={pairs}
            settings={settings}
            interactive={false}
          />
        ) : (
          <>
            {/* CORE RENDERING WORKSPACE - TAB 1: POSTER GAME (PAIR CONCURRENT) */}
            {activeTab === 'poster' && (
              <div className="relative z-10 w-full flex flex-col justify-center py-4">
                {pairs.length === 0 ? (
                  <div className="text-center py-16 text-slate-800">
                    <span className="text-5xl text-slate-300 block mb-3">🧩</span>
                    <p className="text-xs text-slate-400 font-bold block">Không có dữ liệu ghép. Vui lòng thêm cặp hoặc tải dữ liệu mẫu ở bảng trái!</p>
                  </div>
                ) : (
                  <div
                    className="grid gap-x-12 gap-y-6 justify-center justify-items-center items-center mx-auto"
                    style={{
                      gridTemplateColumns: `repeat(${Math.min(pairs.length <= 4 ? 2 : pairs.length <= 9 ? 3 : 4, pairs.length)}, minmax(0, max-content))`,
                    }}
                  >
                    {pairs.map((pair, index) => (
                      <div
                        key={pair.id}
                        className="flex items-center justify-center relative outline-none"
                        style={{
                          transform: `scale(${settings.pieceSize})`,
                          margin: `${(settings.pieceSize - 1) * 30}px`,
                          transformOrigin: 'center center',
                        }}
                      >
                        {/* Question Piece */}
                        <PuzzleCard
                          text={pair.question}
                          type="question"
                          index={index}
                          code={pair.code}
                          style={settings.style}
                          showCode={false}
                          showIcon={settings.showDoodleIcons}
                          size={1.0}
                          saveInk={settings.saveInk}
                        />
                        {/* Answer Piece */}
                        <PuzzleCard
                          text={pair.answer}
                          type="answer"
                          index={index}
                          code={pair.code}
                          style={settings.style}
                          showCode={false}
                          showIcon={settings.showDoodleIcons}
                          size={1.0}
                          saveInk={settings.saveInk}
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* CORE RENDERING WORKSPACE - TAB 2: SEPARATED PRINT CUTOUT SHEET */}
            {activeTab === 'cutout' && (
              <div className="relative z-10 w-full flex flex-col justify-center py-2 text-slate-800">
                {pairs.length === 0 ? (
                  <div className="text-center py-16">
                    <span className="text-5xl text-slate-300 block mb-3">✂️</span>
                    <p className="text-xs text-slate-400 font-bold block">Hãy nạp cặp ghép ở bảng bên để tự động sinh phiếu cắt rời học liệu!</p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-10">
                    <div className="grid grid-cols-2 gap-x-6 gap-y-12 items-start justify-center justify-items-center">
                      
                      {/* Left: Shuffled Question Pieces Block */}
                      <div className="w-full flex flex-col gap-6 items-center border-r-2 border-dashed border-slate-300 pr-3 relative">
                        <div className="absolute top-2 left-2 bg-[#159BAD] text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm">
                          MẢNH CÂU HỎI (XÁO TRỘN) 🏷️
                        </div>

                        <div className="flex flex-wrap gap-8 items-center justify-center pt-8 w-full">
                          {questionOrder.map((origIndex, currentIndex) => {
                            if (origIndex >= pairs.length) return null;
                            const pair = pairs[origIndex];
                            return (
                              <div
                                key={`cut-q-${pair.id}`}
                                draggable={true}
                                onDragStart={(e) => handleDragStart(e, 'question', currentIndex)}
                                onDragOver={(e) => e.preventDefault()}
                                onDrop={(e) => handleDrop(e, 'question', currentIndex)}
                                className={`group relative p-2 rounded-2xl flex items-center justify-center cursor-grab active:cursor-grabbing transition-all hover:bg-slate-100 hover:shadow-md ${
                                  showCuttingBorders
                                    ? 'border-2 border-dashed border-slate-400 bg-slate-50/50 shadow-sm'
                                    : 'bg-transparent'
                                }`}
                                style={{
                                  transform: `scale(${settings.pieceSize})`,
                                  margin: `${(settings.pieceSize - 1) * 35}px`,
                                }}
                              >
                                {showCuttingBorders && (
                                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-white rounded-full p-1 border border-slate-300 text-slate-500 z-30 shadow-xs" title="Cắt theo nét đứt">
                                    <Scissors size={10} className="rotate-180" />
                                  </div>
                                )}
                                
                                <PuzzleCard
                                  text={pair.question}
                                  type="question"
                                  index={origIndex}
                                  code={pair.code}
                                  style={settings.style}
                                  showCode={settings.showMatchCode}
                                  showIcon={settings.showDoodleIcons}
                                  size={1.0}
                                  isScrambled={true}
                                  saveInk={settings.saveInk || activeTab === 'cutout'}
                                />

                                {/* Move Arrows HUD Overlay - Hide on Print */}
                                <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 flex items-center bg-indigo-900 text-white rounded-lg px-2 py-0.5 shadow-md border border-indigo-700 font-sans text-[10px] gap-1 z-30 opacity-0 group-hover:opacity-100 transition-all duration-200 no-print">
                                  <button
                                    type="button"
                                    disabled={currentIndex === 0}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      swapCutoutItems('question', currentIndex, currentIndex - 1);
                                    }}
                                    className="hover:scale-125 hover:text-yellow-300 px-1 font-extrabold cursor-pointer disabled:opacity-30 disabled:pointer-events-none"
                                    title="Di chuyển sang trái / lên trên"
                                  >
                                    ◀
                                  </button>
                                  <span className="text-[9px] select-none text-slate-200 whitespace-nowrap">Đổi chỗ (#{currentIndex + 1})</span>
                                  <button
                                    type="button"
                                    disabled={currentIndex === questionOrder.length - 1}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      swapCutoutItems('question', currentIndex, currentIndex + 1);
                                    }}
                                    className="hover:scale-125 hover:text-yellow-300 px-1 font-extrabold cursor-pointer disabled:opacity-30 disabled:pointer-events-none"
                                    title="Di chuyển sang phải / xuống dưới"
                                  >
                                    ▶
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Right: Shuffled Answer Pieces Block */}
                      <div className="w-full flex flex-col gap-6 items-center pl-3 relative">
                        <div className="absolute top-2 right-2 bg-[#94BF52] text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm">
                          MẢNH ĐÁP ÁN (XÁO TRỘN) ✨
                        </div>

                        <div className="flex flex-wrap gap-8 items-center justify-center pt-8 w-full">
                          {answerOrder.map((origIndex, currentIndex) => {
                            if (origIndex >= pairs.length) return null;
                            const pair = pairs[origIndex];
                            return (
                              <div
                                key={`cut-a-${pair.id}`}
                                draggable={true}
                                onDragStart={(e) => handleDragStart(e, 'answer', currentIndex)}
                                onDragOver={(e) => e.preventDefault()}
                                onDrop={(e) => handleDrop(e, 'answer', currentIndex)}
                                className={`group relative p-2 rounded-2xl flex items-center justify-center cursor-grab active:cursor-grabbing transition-all hover:bg-slate-100 hover:shadow-md ${
                                  showCuttingBorders
                                    ? 'border-2 border-dashed border-slate-400 bg-slate-50/50 shadow-sm'
                                    : 'bg-transparent'
                                }`}
                                style={{
                                  transform: `scale(${settings.pieceSize})`,
                                  margin: `${(settings.pieceSize - 1) * 35}px`,
                                }}
                              >
                                {showCuttingBorders && (
                                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-white rounded-full p-1 border border-slate-300 text-slate-500 z-30 shadow-xs" title="Cắt theo nét đứt">
                                    <Scissors size={10} className="rotate-180" />
                                  </div>
                                )}
                                
                                <PuzzleCard
                                  text={pair.answer}
                                  type="answer"
                                  index={origIndex}
                                  code={pair.code}
                                  style={settings.style}
                                  showCode={settings.showMatchCode}
                                  showIcon={settings.showDoodleIcons}
                                  size={1.0}
                                  isScrambled={true}
                                  saveInk={settings.saveInk || activeTab === 'cutout'}
                                />

                                {/* Move Arrows HUD Overlay - Hide on Print */}
                                <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 flex items-center bg-indigo-900 text-white rounded-lg px-2 py-0.5 shadow-md border border-indigo-700 font-sans text-[10px] gap-1 z-30 opacity-0 group-hover:opacity-100 transition-all duration-200 no-print">
                                  <button
                                    type="button"
                                    disabled={currentIndex === 0}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      swapCutoutItems('answer', currentIndex, currentIndex - 1);
                                    }}
                                    className="hover:scale-125 hover:text-yellow-300 px-1 font-extrabold cursor-pointer disabled:opacity-30 disabled:pointer-events-none"
                                    title="Di chuyển sang trái / lên trên"
                                  >
                                    ◀
                                  </button>
                                  <span className="text-[9px] select-none text-slate-200 whitespace-nowrap">Đổi chỗ (#{currentIndex + 1})</span>
                                  <button
                                    type="button"
                                    disabled={currentIndex === answerOrder.length - 1}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      swapCutoutItems('answer', currentIndex, currentIndex + 1);
                                    }}
                                    className="hover:scale-125 hover:text-yellow-300 px-1 font-extrabold cursor-pointer disabled:opacity-30 disabled:pointer-events-none"
                                    title="Di chuyển sang phải / xuống dưới"
                                  >
                                    ▶
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                    </div>
                  </div>
                )}
              </div>
            )}

            {/* UNIVERSAL MASTER REFERENCE SHEET FOR OFFLINE PRINTING */}
            {showTeacherKeyPrint && activeTab === 'cutout' && pairs.length > 0 && (
              <div className="mt-14 pt-8 border-t-2 border-dashed border-slate-300 w-full page-break-before-avoid select-none notranslate text-slate-800" translate="no">
                <div className="flex items-center gap-2 mb-4 bg-indigo-50 border border-indigo-100 p-3.5 rounded-2xl">
                  <span className="text-xl">👩‍🏫</span>
                  <div>
                    <h4 className="text-xs font-bold text-indigo-900 uppercase tracking-wide">Bản Đáp Án Đối Chiếu Nhanh (Dành Cho Giáo Viên & Chấm Thi Offline)</h4>
                    <p className="text-[10px] text-indigo-700">Mẫu kết quả khớp nối chuẩn giúp thầy cô đối chiếu đáp án với học sinh tức tức thì trong lớp học.</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 w-full">
                  {pairs.map((pair, index) => (
                    <div key={`key-ref-${pair.id}`} className="bg-slate-50 border border-slate-200 p-3 rounded-xl flex items-start gap-4 text-xs transition-colors hover:bg-slate-100">
                      <span className="bg-slate-200 text-slate-800 font-extrabold w-6.5 h-6.5 rounded-full flex items-center justify-center font-mono text-[10.5px] shrink-0 self-center">
                        #{index + 1}
                      </span>
                      <div className="flex-grow grid grid-cols-1 xs:grid-cols-2 gap-2 min-w-0">
                        <div className="min-w-0">
                          <div className="text-[9px] uppercase tracking-wider font-extrabold text-slate-400">Câu Hỏi / Vế Một</div>
                          <MathJaxWrapper text={pair.question} className="font-extrabold text-slate-700 font-sans break-words mt-0.5 leading-snug" />
                        </div>
                        <div className="min-w-0 border-l border-slate-200 pl-3.5">
                          <div className="text-[9px] uppercase tracking-wider font-extrabold text-slate-400">Đáp Án / Vế Hai</div>
                          <MathJaxWrapper text={pair.answer} className="font-extrabold text-[#159BAD] font-sans break-words mt-0.5 leading-snug" />
                        </div>
                      </div>
                      <div className="shrink-0 flex items-center self-center justify-end font-mono">
                        <span className="text-[9px] bg-slate-100 text-slate-600 font-bold border border-slate-300 px-2 py-0.5 rounded-md">
                          Mã: {pair.code}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* CANVA WORKBOOK FOOTER */}
        <div className="relative z-10 border-t border-dashed border-slate-300 mt-12 pt-4 flex flex-col sm:flex-row justify-between items-center text-[10px] sm:text-xs text-slate-400 font-medium">
          <span className="flex items-center gap-1 text-slate-500">
            <span>Học thông qua trò chơi ghép cặp</span>
            <span className="text-[#F54B32] animate-pulse">❤️</span>
            <span>Thiết lập bằng Canva School Puzzle Generator</span>
          </span>
          <span className="font-mono mt-1 sm:mt-0 text-[10px] uppercase tracking-wider bg-slate-100 border border-slate-200 px-2 py-0.5 rounded">
            Mức độ bài tập: Trung bình / Khá
          </span>
        </div>
      </div>
    </div>
  );
};
