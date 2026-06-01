import React, { useMemo, useState } from 'react';
import { Plus, Trash2, RefreshCw, Upload, Download, X, Cpu, Camera } from 'lucide-react';
import { useEditorStore } from '../../stores/editorStore';
import { useUIStore } from '../../stores/uiStore';
import { PuzzlePair } from '../../types';
import { getPuzzleGradients } from '../PuzzleCard';
import { MathJaxWrapper } from '../MathJaxWrapper';
import { OcrImportModal } from './OcrImportModal';

const MATH_CATEGORIES = ['Tất cả', 'Cơ bản', 'Giải tích', 'Lượng giác', 'Hình học', 'Ký hiệu'];

const mathTemplates = [
  { label: '$...$', code: '$ $', description: 'Công thức nội dòng (Inline)', category: 'Cơ bản' },
  { label: '$$...$$', code: '$$ $$', description: 'Công thức riêng dòng (Block)', category: 'Cơ bản' },
  { label: 'Phân số \u2105', code: '\\frac{}{}', description: 'Phân số \\frac{a}{b}', category: 'Cơ bản' },
  { label: 'Căn hai \u221a', code: '\\sqrt{}', description: 'Căn bậc hai \\sqrt{x}', category: 'Cơ bản' },
  { label: 'Căn ba \u00b3\u221a', code: '\\sqrt[3]{}', description: 'Căn bậc ba \\sqrt[3]{x}', category: 'Cơ bản' },
  { label: 'Số mũ x\u207f', code: '^{}', description: 'Mũ lũy thừa x^n', category: 'Cơ bản' },
  { label: 'Chỉ số x\u2094', code: '_{}', description: 'Chỉ số dưới x_n', category: 'Cơ bản' },
  { label: 'Log_a', code: '\\log_{}{}', description: 'Logarit cơ số a log_a(b)', category: 'Cơ bản' },
  { label: 'Tích phân \u222b', code: '\\int_{}^{} {} ', description: 'Tích phân cận từ a đến b', category: 'Giải tích' },
  { label: 'Đạo hàm y\'', code: '\\prime', description: 'Đạo hàm y\'', category: 'Giải tích' },
  { label: 'Tổng \u2211', code: '\\sum_{}^{} {}', description: 'Tổng xích ma', category: 'Giải tích' },
  { label: 'Giới hạn', code: '\\lim_{ \\to }', description: 'Giới hạn', category: 'Giải tích' },
  { label: 'Vô cực \u221e', code: '\\infty', description: 'Vô cực', category: 'Giải tích' },
  { label: 'Hàm Sin', code: '\\sin({})', description: 'Hàm số sin(x)', category: 'Lượng giác' },
  { label: 'Hàm Cos', code: '\\cos({})', description: 'Hàm số cos(x)', category: 'Lượng giác' },
  { label: 'Hàm Tan', code: '\\tan({})', description: 'Hàm số tan(x)', category: 'Lượng giác' },
  { label: 'Hàm Cot', code: '\\cot({})', description: 'Hàm số cot(x)', category: 'Lượng giác' },
  { label: 'Pi \u03c0', code: '\\pi', description: 'Ký hiệu Pi (3.14...)', category: 'Lượng giác' },
  { label: 'Vectơ \u2192', code: '\\vec{}', description: 'Véctơ', category: 'Hình học' },
  { label: 'Song song', code: '\\parallel', description: 'Quan hệ song song', category: 'Hình học' },
  { label: 'Vuông góc', code: '\\perp', description: 'Quan hệ vuông góc', category: 'Hình học' },
  { label: 'Góc', code: '\\widehat{}', description: 'Ký hiệu góc', category: 'Hình học' },
  { label: 'Tam giác \u25b3', code: '\\triangle', description: 'Ký hiệu tam giác', category: 'Hình học' },
  { label: 'Alpha \u03b1', code: '\\alpha', description: 'Ký hiệu alpha', category: 'Ký hiệu' },
  { label: 'Beta \u03b2', code: '\\beta', description: 'Ký hiệu beta', category: 'Ký hiệu' },
  { label: 'Delta \u0394', code: '\\Delta', description: 'Ký hiệu biệt thức Delta', category: 'Ký hiệu' },
  { label: 'Cộng trừ \u00b1', code: '\\pm', description: 'Cộng trừ', category: 'Ký hiệu' },
  { label: 'Dấu nhân', code: '\\times', description: 'Dấu nhân \\times', category: 'Ký hiệu' },
  { label: 'Dấu chia', code: '\\div', description: 'Dấu chia \\div', category: 'Ký hiệu' },
  { label: 'Khác \u2260', code: '\\neq', description: 'Quan hệ khác \\neq', category: 'Ký hiệu' },
  { label: 'Xấp xỉ \u2248', code: '\\approx', description: 'Quan hệ xấp xỉ \\approx', category: 'Ký hiệu' },
  { label: 'Hệ PT', code: '\\begin{cases}  \\\\  \\end{cases}', description: 'Hệ phương trình 2 dòng', category: 'Ký hiệu' },
];

export const QuestionEditor: React.FC = () => {
  const {
    pairs,
    settings,
    focusedField,
    selectedMathCategory,
    addPair,
    removePair,
    updatePair,
    resetScrambleOrders,
    setFocusedField,
    setSelectedMathCategory,
    setPairs,
  } = useEditorStore();

  const { setShowJsonModal, showFlashMessage } = useUIStore();
  const [showAssistantPopup, setShowAssistantPopup] = useState(false);
  const [showOcrModal, setShowOcrModal] = useState(false);

  // Tính số lượng câu hỏi yêu cầu dựa trên dạng game và hình dạng
  const requiredCount = useMemo(() => {
    if (settings.puzzleType === 'math_maze') {
      return 8; // Mê cung mặc định 8 câu
    }
    if (settings.puzzleType === 'domino') {
      return parseInt(settings.dominoShape) || 12;
    }
    if (settings.puzzleType === 'jigsaw') {
      return parseInt(settings.numberShape) || 12;
    }
    if (settings.puzzleType === 'tarsia') {
      const shape = settings.tarsiaShape;
      if (shape === 'triangle_4') return 3;
      if (shape === 'triangle_9') return 9;
      if (shape === 'triangle_16') return 18;
      if (shape === 'parallelogram_10') return 11;
      if (shape === 'hexagon_6') return 6;
      if (shape === 'star') return 12;
      if (shape === 'trapezoid_6') return 5;
      if (shape === 'chevron_12') return 11;
      if (shape === 'chevron_8') return 7;
      if (shape === 'trapezoid_5') return 4;
      if (shape === 'fish_12') return 12;
      if (shape === 'rhombus') return 8;
      if (shape === 'heart_12') return 12;
      if (shape === 'heart_18') return 20;
      return 9;
    }
    return 9;
  }, [settings.puzzleType, settings.tarsiaShape, settings.dominoShape, settings.numberShape]);

  // Xử lý nạp câu hỏi trích xuất bằng AI OCR
  const handleOcrImport = (extracted: { question: string; answer: string }[], append: boolean) => {
    const generateRandomCode = () => {
      const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
      return chars[Math.floor(Math.random() * chars.length)] + chars[Math.floor(Math.random() * chars.length)];
    };

    const newPairs: PuzzlePair[] = extracted.map((p, idx) => ({
      id: `pair-${Date.now()}-${Math.random().toString(36).substring(2, 6)}-${idx}`,
      question: p.question,
      answer: p.answer,
      code: generateRandomCode(),
    }));

    if (append) {
      setPairs([...pairs, ...newPairs]);
      showFlashMessage(`Đã nạp thêm ${newPairs.length} câu hỏi mới bằng AI OCR!`, 'success');
    } else {
      setPairs(newPairs);
      showFlashMessage(`Đã nạp mới ${newPairs.length} câu hỏi trích xuất từ AI OCR!`, 'success');
    }
  };

  const filteredMathTemplates = useMemo(() => {
    if (selectedMathCategory === 'Tất cả') return mathTemplates;
    return mathTemplates.filter((t) => t.category === selectedMathCategory);
  }, [selectedMathCategory]);

  // Kiểm tra xem có hiển thị nút Trợ lý Toán không (khi môn học là toán/lý/hóa hoặc game mê cung)
  const showAssistantButton = useMemo(() => {
    if (settings.puzzleType === 'math_maze') return true;
    const sub = (settings.subject || '').toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    return ['toan', 'math', 'ly', 'phy', 'hoa', 'chem'].some(k => sub.includes(k));
  }, [settings.subject, settings.puzzleType]);

  const insertMathSymbol = (symbol: string) => {
    if (!focusedField) return;

    const elementId = `input-${focusedField.id}-${focusedField.field}`;
    const element = document.getElementById(elementId) as HTMLTextAreaElement;
    if (!element) return;

    const start = element.selectionStart;
    const end = element.selectionEnd;
    const text = element.value;
    const selectedText = text.substring(start, end);

    let insertion = symbol;
    let cursorOffset = symbol.length;

    if (selectedText.length > 0) {
      if (symbol === '$ $') {
        insertion = `$${selectedText}$`;
        cursorOffset = insertion.length;
      } else if (symbol === '$$ $$') {
        insertion = `$$\n${selectedText}\n$$`;
        cursorOffset = insertion.length;
      } else if (symbol === '\\sqrt{}') {
        insertion = `\\sqrt{${selectedText}}`;
        cursorOffset = insertion.length;
      } else if (symbol === '\\frac{}{}') {
        insertion = `\\frac{${selectedText}}{}`;
        cursorOffset = insertion.indexOf('}') + 2;
      } else if (symbol.includes('{}') && !symbol.includes('cases')) {
        const firstCurly = symbol.indexOf('{}');
        insertion = symbol.substring(0, firstCurly + 1) + selectedText + symbol.substring(firstCurly + 1);
        cursorOffset = firstCurly + 1 + selectedText.length;
      }
    } else {
      if (symbol.includes('{}')) {
        cursorOffset = symbol.indexOf('{}') + 1;
      } else if (symbol === '$ $') {
        cursorOffset = 1;
      } else if (symbol === '$$ $$') {
        cursorOffset = 3;
      }
    }

    const before = text.substring(0, start);
    const after = text.substring(end, text.length);
    const newValue = before + insertion + after;

    updatePair(focusedField.id, focusedField.field, newValue);

    setTimeout(() => {
      element.focus();
      element.setSelectionRange(start + cursorOffset, start + cursorOffset);
    }, 50);
  };

  const handleExportJSON = () => {
    const dataStr = JSON.stringify({ settings, pairs }, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.download = `canva-puzzle-${settings.title.toLowerCase().replace(/\s+/g, '-')}.json`;
    link.href = url;
    link.click();
    showFlashMessage('Đã tải xuống file cấu hình JSON!', 'success');
  };

  return (
    <div className="w-full relative">
      {/* FULL-WIDTH COLUMN: PAIRS INPUT LIST */}
      <div className="w-full bg-white rounded-2xl p-4 sm:p-5 shadow-[0_8px_30px_rgb(0,0,0,0.03)] border border-slate-200/80 flex flex-col">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4 pb-2.5 border-b border-dashed border-slate-100">
          <h2 className="text-sm font-bold text-[#2F2A40] flex items-center gap-2">
            <span className="w-2 h-5 rounded-full bg-[#F54B32] inline-block" />
            3. Danh Sách Câu Hỏi - Đáp Án
          </h2>
          <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
            {showAssistantButton && (
              <button
                type="button"
                onClick={() => setShowAssistantPopup(true)}
                className="flex items-center justify-center gap-1.5 px-3.5 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 text-xs font-bold rounded-xl border border-purple-200/40 transition-all cursor-pointer shadow-xs animate-pulse"
              >
                📐 Trợ lý Công thức
              </button>
            )}
            <span className="text-[11px] bg-slate-100 text-slate-600 font-mono font-bold px-2.5 py-1 rounded-full">
              Sỹ số: {pairs.length} cặp
            </span>
          </div>
        </div>

        {/* BULK EXPORT/IMPORT DIALOG ACTION */}
        <div className="flex flex-wrap gap-2 mb-4">
          <button
            type="button"
            onClick={() => setShowJsonModal(true)}
            className="flex-grow md:flex-initial flex items-center justify-center gap-1.5 px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold rounded-xl border border-indigo-200/40 transition-all cursor-pointer shadow-xs"
          >
            <Upload size={13} /> Nhập / Xuất bảng JSON
          </button>
          <button
            type="button"
            onClick={() => setShowOcrModal(true)}
            className="flex-grow md:flex-initial flex items-center justify-center gap-1.5 px-4 py-2 bg-purple-50 hover:bg-purple-100 text-purple-750 text-xs font-bold rounded-xl border border-purple-200/40 transition-all cursor-pointer shadow-xs"
            title="Trích xuất các câu hỏi từ hình ảnh/camera chụp trực tiếp bằng AI OCR"
          >
            <Camera size={13} /> 📸 Trích xuất bằng AI (OCR)
          </button>
          <button
            type="button"
            onClick={handleExportJSON}
            className="flex-grow md:flex-initial flex items-center justify-center gap-1.5 px-4 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold rounded-xl border border-emerald-200/40 transition-all cursor-pointer shadow-xs"
            title="Sao lưu ra file json để chỉnh sửa sau này"
          >
            <Download size={13} /> Tải file backup
          </button>
        </div>

        {/* PAIRS TABLE INPUTS - HIGH RESOLUTION WORKSPACE SCROLL */}
        <div className="max-h-[620px] overflow-y-auto pr-1 flex flex-col gap-3.5 custom-scrollbar">
          {pairs.length === 0 ? (
            <div className="text-center py-16 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
              <p className="text-xs text-slate-400 font-medium">Bảng trống. Hãy nạp dữ liệu mẫu hoặc nhấn Thêm cặp!</p>
            </div>
          ) : (
            pairs.map((pair, index) => {
              const gradient = getPuzzleGradients(index, settings.style);
              return (
                <div
                  key={pair.id}
                  className="group p-3 rounded-xl bg-slate-55/40 border border-slate-200/60 hover:border-[#159BAD]/40 hover:bg-slate-50 relative transition-all"
                >
                  <div className="absolute left-0 top-0 bottom-0 w-1.5 rounded-l-xl" style={{ backgroundColor: gradient.from }} />

                  <div className="flex justify-between items-center mb-2 pl-2">
                    <span className="text-xs font-bold text-slate-600 flex items-center gap-1.5 select-none">
                      <span className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] text-white font-extrabold" style={{ backgroundColor: gradient.to }}>
                        {index + 1}
                      </span>
                      Cặp ghép #{index + 1}
                    </span>

                    <div className="flex items-center gap-2">
                      {/* SELF CHECK CODE */}
                      <div className="flex items-center gap-1">
                        <span className="text-[10px] text-slate-400 font-bold uppercase select-none">Mã:</span>
                        <input
                          type="text"
                          value={pair.code}
                          onChange={(e) => updatePair(pair.id, 'code', e.target.value.toUpperCase())}
                          className="w-11 text-xs text-center font-mono font-bold py-0.5 bg-white border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#159BAD]"
                          title="Mã kiểm tra giúp học sinh đối chiếu xem ghép đúng hay sai"
                        />
                      </div>

                      <button
                        type="button"
                        onClick={() => removePair(pair.id)}
                        className="text-slate-400 hover:text-[#F54B32] p-1 rounded-lg hover:bg-slate-200/50 transition-all cursor-pointer"
                        title="Xóa cặp ghép này"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pl-2">
                    <div className="flex flex-col">
                      <textarea
                        id={`input-${pair.id}-question`}
                        rows={2}
                        onFocus={() => setFocusedField({ id: pair.id, field: 'question' })}
                        className="w-full text-xs p-2 bg-white border border-slate-200 rounded-lg resize-none focus:outline-none focus:ring-1 focus:ring-[#159BAD] text-slate-700 font-semibold"
                        value={pair.question}
                        onChange={(e) => updatePair(pair.id, 'question', e.target.value)}
                        placeholder="Nhập câu hỏi... (VD: Đạo hàm của $e^x$)"
                      />
                      {pair.question.trim() !== '' && (
                        <div className="mt-1.5 p-2 bg-sky-50 border border-sky-100 rounded-lg text-xs text-sky-850">
                          <span className="font-extrabold text-[8px] text-sky-500 uppercase tracking-widest block mb-1 select-none">XEM TRƯỚC:</span>
                          <MathJaxWrapper
                            text={pair.question}
                            debounceMs={300}
                            className="min-h-[1.2rem] items-center text-xs font-sans font-bold text-sky-950"
                          />
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col">
                      <textarea
                        id={`input-${pair.id}-answer`}
                        rows={2}
                        onFocus={() => setFocusedField({ id: pair.id, field: 'answer' })}
                        className="w-full text-xs p-2 bg-white border border-slate-200 rounded-lg resize-none focus:outline-none focus:ring-1 focus:ring-[#159BAD] text-slate-700 font-semibold"
                        value={pair.answer}
                        onChange={(e) => updatePair(pair.id, 'answer', e.target.value)}
                        placeholder="Nhập đáp án... (VD: $e^x$)"
                      />
                      {pair.answer.trim() !== '' && (
                        <div className="mt-1.5 p-2 bg-emerald-50 border border-emerald-100 rounded-lg text-xs text-emerald-850">
                          <span className="font-extrabold text-[8px] text-emerald-500 uppercase tracking-widest block mb-1 select-none">XEM TRƯỚC:</span>
                          <MathJaxWrapper
                            text={pair.answer}
                            debounceMs={300}
                            className="min-h-[1.2rem] items-center text-xs font-sans font-bold text-emerald-950"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* BUTTON BAR */}
        <div className="mt-4 flex gap-2">
          <button
            type="button"
            onClick={addPair}
            className="flex-grow flex items-center justify-center gap-1.5 py-2.5 px-4 bg-[#159BAD] hover:bg-[#0B7382] text-white text-xs font-bold rounded-xl transition-all shadow-sm hover:shadow cursor-pointer font-sans"
          >
            <Plus size={15} /> Thêm Cặp Ghép
          </button>
          <button
            type="button"
            onClick={resetScrambleOrders}
            className="py-2.5 px-4 bg-[#94BF52] hover:bg-[#70A627] text-white text-xs font-bold rounded-xl transition-all shadow-sm cursor-pointer flex items-center justify-center gap-1.5 font-sans"
            title="Khôi phục sắp xếp câu hỏi & đáp án khớp nhau"
          >
            <RefreshCw size={14} /> Khớp lại
          </button>
        </div>
      </div>

      {/* FLOATING MATH ASSISTANT POPUP PANEL */}
      {showAssistantButton && showAssistantPopup && (
        <div className="fixed bottom-6 right-6 md:right-12 z-50 w-[320px] sm:w-[350px] bg-white/95 backdrop-blur-md border border-slate-200/90 rounded-3xl p-5 shadow-2xl animate-fade-in flex flex-col">
          <div className="flex justify-between items-center mb-3 pb-2 border-b border-indigo-100">
            <div className="flex items-center gap-1.5">
              <span className="text-lg">📐</span>
              <span className="text-xs font-extrabold text-indigo-900 tracking-tight uppercase select-none">Trợ Lý Công Thức</span>
            </div>
            <button
              onClick={() => setShowAssistantPopup(false)}
              className="text-slate-400 hover:text-slate-650 p-1 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            >
              <X size={15} />
            </button>
          </div>

          <div className="text-[10px] text-slate-500 mb-3 bg-indigo-50/50 p-2.5 rounded-xl border border-indigo-100/30">
            {focusedField ? (
              <span className="text-emerald-750 font-extrabold flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping inline-block"></span>
                🟢 Cặp #{pairs.findIndex((p) => p.id === focusedField.id) + 1} ({focusedField.field === 'question' ? 'Hỏi' : 'Đáp'})
              </span>
            ) : (
              <span className="text-slate-550 italic block">
                *Nhấp vào bất kỳ ô nhập câu hỏi/đáp án nào để bắt đầu chèn ký hiệu.
              </span>
            )}
          </div>

          {/* Category pills */}
          <div className="flex gap-1.5 overflow-x-auto pb-2 mb-3 no-scrollbar scroll-smooth">
            {MATH_CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedMathCategory(cat)}
                className={`text-[9.5px] shrink-0 px-2.5 py-1 rounded-full font-bold cursor-pointer transition-all ${
                  selectedMathCategory === cat
                    ? 'bg-[#159BAD] text-white shadow-sm'
                    : 'bg-slate-100 text-slate-500 hover:bg-slate-200 border border-slate-200/20'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Symbol Buttons Grid */}
          <div className="grid grid-cols-4 gap-1.5 max-h-[160px] overflow-y-auto pr-0.5 custom-scrollbar mb-3">
            {filteredMathTemplates.map((tmpl) => (
              <button
                key={tmpl.label}
                type="button"
                onClick={() => insertMathSymbol(tmpl.code)}
                disabled={!focusedField}
                className={`text-center py-1.5 rounded-lg border text-[10px] font-sans font-bold transition-all duration-200 ${
                  focusedField
                    ? 'bg-white hover:bg-indigo-600 hover:text-white border-slate-200 hover:border-indigo-600 text-slate-700 shadow-xs cursor-pointer'
                    : 'bg-slate-50 text-slate-350 border-slate-200 cursor-not-allowed opacity-40'
                }`}
                title={`${tmpl.description} (Nhấp để chèn tại con trỏ)`}
              >
                {tmpl.label}
              </button>
            ))}
          </div>

          <p className="text-[9.5px] text-slate-400 flex items-center gap-1 select-none border-t border-slate-100 pt-2.5">
            <span>💡 Viết công thức trong</span>
            <code className="bg-slate-100 px-1 py-0.2 rounded font-bold font-mono text-indigo-600">$...$</code>
            <span>để hiển thị toán.</span>
          </p>
        </div>
      )}

      <OcrImportModal
        isOpen={showOcrModal}
        onClose={() => setShowOcrModal(false)}
        onImport={handleOcrImport}
        requiredCount={requiredCount}
      />
    </div>
  );
};
