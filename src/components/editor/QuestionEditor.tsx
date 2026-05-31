import React, { useMemo } from 'react';
import { Plus, Trash2, RefreshCw, Upload, Download } from 'lucide-react';
import { useEditorStore } from '../../stores/editorStore';
import { useUIStore } from '../../stores/uiStore';
import { getPuzzleGradients } from '../PuzzleCard';
import { MathJaxWrapper } from '../MathJaxWrapper';

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
  } = useEditorStore();

  const { setShowJsonModal, showFlashMessage } = useUIStore();

  const filteredMathTemplates = useMemo(() => {
    if (selectedMathCategory === 'Tất cả') return mathTemplates;
    return mathTemplates.filter((t) => t.category === selectedMathCategory);
  }, [selectedMathCategory]);

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
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start w-full">
      {/* LEFT COLUMN: PAIRS INPUT LIST (lg:col-span-7) */}
      <div className="lg:col-span-7 bg-white rounded-2xl p-4 sm:p-5 shadow-[0_8px_30px_rgb(0,0,0,0.03)] border border-slate-200/80 w-full flex flex-col">
        <div className="flex justify-between items-center mb-4 pb-2.5 border-b border-dashed border-slate-100">
          <h2 className="text-sm font-bold text-[#2F2A40] flex items-center gap-2">
            <span className="w-2 h-5 rounded-full bg-[#F54B32] inline-block" />
            3. Danh Sách Câu Hỏi - Đáp Án
          </h2>
          <span className="text-[11px] bg-slate-100 text-slate-600 font-mono font-bold px-2.5 py-0.5 rounded-full">
            Sỹ số: {pairs.length} cặp
          </span>
        </div>

        {/* BULK EXPORT/IMPORT DIALOG ACTION */}
        <div className="flex gap-2 mb-4">
          <button
            type="button"
            onClick={() => setShowJsonModal(true)}
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold rounded-xl border border-indigo-200/40 transition-all cursor-pointer shadow-xs"
          >
            <Upload size={13} /> Nhập / Xuất bảng JSON
          </button>
          <button
            type="button"
            onClick={handleExportJSON}
            className="flex items-center justify-center gap-1.5 px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold rounded-xl border border-emerald-200/40 transition-all cursor-pointer shadow-xs"
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
                  className="group p-3 rounded-xl bg-slate-50/60 border border-slate-200/60 hover:border-[#159BAD]/40 hover:bg-slate-50 relative transition-all"
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

      {/* RIGHT COLUMN: STICKY MATH ASSISTANT & HELPER (lg:col-span-5) */}
      <div className="lg:col-span-5 lg:sticky lg:top-4 flex flex-col gap-4">
        {/* INTERACTIVE MATHJAX FORMULA EDITOR TOOLBAR */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 shadow-[0_8px_30px_rgb(0,0,0,0.03)] flex flex-col">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-1.5 mb-3 pb-2 border-b border-indigo-100">
            <div className="flex items-center gap-1.5">
              <span className="text-lg">📐</span>
              <span className="text-xs font-extrabold text-indigo-900 tracking-tight uppercase select-none">Trợ Lý Công Thức Toán (MathJax)</span>
            </div>
            {focusedField ? (
              <span className="text-[9px] text-emerald-700 font-extrabold bg-emerald-100 px-2 py-0.5 rounded-full flex items-center gap-1 shadow-xs border border-emerald-200 uppercase tracking-wide">
                🟢 Cặp #{pairs.findIndex((p) => p.id === focusedField.id) + 1} ({focusedField.field === 'question' ? 'Hỏi' : 'Đáp'})
              </span>
            ) : (
              <span className="text-[9.5px] text-slate-400 font-medium font-sans select-none">
                *Nhấp ô nhập để kích hoạt trợ lý
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
                className={`text-[10px] shrink-0 px-2.5 py-1 rounded-full font-bold cursor-pointer transition-all ${
                  selectedMathCategory === cat
                    ? 'bg-[#159BAD] text-white shadow-sm'
                    : 'bg-slate-100 text-slate-500 hover:bg-slate-250 border border-slate-250/20'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Symbol Buttons Grid */}
          <div className="grid grid-cols-4 sm:grid-cols-4 gap-1.5 max-h-[170px] overflow-y-auto pr-0.5 custom-scrollbar">
            {filteredMathTemplates.map((tmpl) => (
              <button
                key={tmpl.label}
                type="button"
                onClick={() => insertMathSymbol(tmpl.code)}
                disabled={!focusedField}
                className={`text-center py-1.5 rounded-lg border text-[10px] font-sans font-bold transition-all duration-200 ${
                  focusedField
                    ? 'bg-white hover:bg-indigo-600 hover:text-white border-slate-200 hover:border-indigo-600 text-slate-700 shadow-xs cursor-pointer'
                    : 'bg-slate-50 text-slate-300 border-slate-200 cursor-not-allowed opacity-40'
                }`}
                title={`${tmpl.description} (Nhập để chèn tại con trỏ)`}
              >
                {tmpl.label}
              </button>
            ))}
          </div>

          <p className="text-[10px] text-slate-400 mt-3 flex items-center gap-1 select-none">
            <span>💡 <b>Mẹo:</b> Viết công thức trong ký hiệu</span>
            <code className="bg-slate-100 px-1.5 py-0.5 rounded text-[10.5px] font-bold font-mono text-indigo-600">$...$</code>
            <span>để hiển thị toán.</span>
          </p>
        </div>

        {/* CẨM NANG HƯỚNG DẪN SOẠN THẢO NHANH */}
        <div className="bg-[#FEFAF0] border border-[#FFC928]/30 rounded-2xl p-4 sm:p-5 shadow-[0_8px_30px_rgb(0,0,0,0.02)] select-none">
          <h3 className="text-xs font-bold text-[#2F2A40] flex items-center gap-1.5 mb-2.5 pb-1.5 border-b border-[#FFC928]/20">
            <span>📝</span> CẨM NANG SOẠN THẢO
          </h3>
          <ul className="text-[10px] text-slate-650 space-y-2 font-medium">
            <li className="flex gap-1.5">
              <span className="text-[#94BF52] font-bold">✔</span>
              <span><strong>Mỗi dòng một cặp:</strong> Hãy điền câu hỏi ở cột bên trái và câu đáp án tương ứng ở cột bên phải.</span>
            </li>
            <li className="flex gap-1.5">
              <span className="text-[#94BF52] font-bold">✔</span>
              <span><strong>Mã đối chiếu:</strong> Mã tự kiểm tra (VD: A1, B2...) giúp học sinh tự khớp chéo đáp án offline khi in ra giấy.</span>
            </li>
            <li className="flex gap-1.5">
              <span className="text-[#94BF52] font-bold">✔</span>
              <span><strong>Định dạng toán học:</strong> Trợ lý công thức bên trên hỗ trợ các biểu thức từ cơ bản đến nâng cao. Nhấp đúp vào ô nhập liệu để chọn vị trí chèn.</span>
            </li>
            <li className="flex gap-1.5">
              <span className="text-[#94BF52] font-bold">✔</span>
              <span><strong>Lưu trữ tự động:</strong> Dữ liệu bài học được tự động đồng bộ hóa xuống trình duyệt của bạn sau mỗi thao tác.</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};
