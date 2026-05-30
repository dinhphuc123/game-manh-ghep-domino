import { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Plus, 
  Trash2, 
  RefreshCw, 
  Download, 
  Upload, 
  Printer, 
  Image as ImageIcon, 
  FileDown, 
  Code, 
  BookOpen, 
  Settings2, 
  GraduationCap, 
  HelpCircle,
  Scissors,
  CheckCircle2,
  Sparkles,
  Layout,
  Info,
  Maximize2,
  FileCode,
  Palette,
  ChevronLeft,
  ChevronRight,
  SlidersHorizontal,
  EyeOff
} from 'lucide-react';
import * as htmlToImage from 'html-to-image';
import pptxgen from 'pptxgenjs';

import { PuzzlePair, ThemeStyle, ActivityType, GameSettings } from './types';
import { PencilIcon, RulerIcon, BookIcon, StarIcon, GradCapIcon, LightbulbIcon, SchoolBackgroundDoodles } from './components/Doodles';
import { PuzzleCard, getPuzzleGradients } from './components/PuzzleCard';
import { TarsiaView } from './components/TarsiaView';
import { NumberJigsawView } from './components/NumberJigsawView';
import { MATH_SAMPLE_DATA, GEOGRAPHY_SAMPLE_DATA, ENGLISH_SAMPLE_DATA } from './sampleData';

const InteractiveAnswerCard = ({ answer, index, code }: { answer: string; index: number; code: string }) => {
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    setRevealed(false);
  }, [index]);

  return (
    <div 
      onClick={() => setRevealed(!revealed)}
      className={`group cursor-pointer rounded-3xl p-8 border-2 flex flex-col justify-between min-h-[320px] shadow-2xl relative overflow-hidden transition-all duration-300 ${
        revealed 
          ? 'bg-gradient-to-br from-emerald-900/40 to-emerald-950/80 border-emerald-500/40 text-white' 
          : 'bg-[#252136] border-dashed border-white/20 text-slate-500 hover:border-white/40'
      }`}
    >
      <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-bl-full pointer-events-none flex items-center justify-center" />
      <span className={`text-xs uppercase font-extrabold tracking-widest mb-4 block ${revealed ? 'text-emerald-400' : 'text-slate-500'}`}>
        ✨ ĐÁP ÁN #{index + 1}
      </span>
      
      <div className="flex-grow flex items-center justify-center text-center px-4">
        {revealed ? (
          <p className="text-xl sm:text-2xl md:text-3xl font-extrabold tracking-tight leading-snug text-white">
            {answer}
          </p>
        ) : (
          <div className="text-center select-none">
            <span className="text-4xl block mb-2 transition-transform group-hover:scale-110">👁️‍🗨️</span>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Nhấp vào đây</p>
            <p className="text-[10px] text-slate-500 mt-0.5">để hiển thị kết quả đáp án khớp</p>
          </div>
        )}
      </div>

      <div className="mt-4 pt-4 border-t border-white/5 text-[11px] font-mono text-slate-400">
        {revealed ? `Mã đối chiếu: A-${code}` : 'Nhấn hiển thị mã đối chiếu'}
      </div>
    </div>
  );
};

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

export default function App() {
  // --- STATE ---
  const [pairs, setPairs] = useState<PuzzlePair[]>([]);
  const [showProjection, setShowProjection] = useState(false);
  const [projectionIndex, setProjectionIndex] = useState(0);
  const [settings, setSettings] = useState<GameSettings>({
    title: 'Hàm số mũ và logarit',
    subject: 'Toán học 12',
    gradeClass: 'Lớp 12A1',
    teacherName: 'Thầy Minh',
    style: 'vibrant',
    showMatchCode: true,
    showDoodleIcons: true,
    activityType: 'Luyện tập',
    columns: 2,
    pieceSize: 1.0,
    saveInk: false,
    puzzleType: 'jigsaw',
    tarsiaShape: 'triangle_18',
    numberShape: '20',
  });

  const [activeTab, setActiveTab] = useState<'poster' | 'cutout'>('poster');
  const [jsonInput, setJsonInput] = useState('');
  const [showJsonModal, setShowJsonModal] = useState(false);
  const [jsonError, setJsonError] = useState('');
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);

  // MathJax specialized states
  const [focusedField, setFocusedField] = useState<{ id: string; field: 'question' | 'answer' } | null>(null);
  const [selectedMathCategory, setSelectedMathCategory] = useState<string>('Tất cả');

  // Print & PDF Offline helper states
  const [showTeacherKeyPrint, setShowTeacherKeyPrint] = useState(true);
  const [showCuttingBorders, setShowCuttingBorders] = useState(true);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // Scramble states for cutout sheets (shuffled indices list)
  const [questionOrder, setQuestionOrder] = useState<number[]>([]);
  const [answerOrder, setAnswerOrder] = useState<number[]>([]);

  // DOM Refs for exporting
  const previewRef = useRef<HTMLDivElement>(null);

  // Drag and drop tracking state for reordering cutout cards
  const [draggedItem, setDraggedItem] = useState<{ type: 'question' | 'answer'; index: number } | null>(null);

  const swapCutoutItems = (type: 'question' | 'answer', fromIdx: number, toIdx: number) => {
    if (fromIdx < 0 || fromIdx >= pairs.length || toIdx < 0 || toIdx >= pairs.length) return;
    if (type === 'question') {
      const newOrder = [...questionOrder];
      const temp = newOrder[fromIdx];
      newOrder[fromIdx] = newOrder[toIdx];
      newOrder[toIdx] = temp;
      setQuestionOrder(newOrder);
    } else {
      const newOrder = [...answerOrder];
      const temp = newOrder[fromIdx];
      newOrder[fromIdx] = newOrder[toIdx];
      newOrder[toIdx] = temp;
      setAnswerOrder(newOrder);
    }
  };

  const handleDragStart = (e: any, type: 'question' | 'answer', index: number) => {
    setDraggedItem({ type, index });
    e.dataTransfer.setData('text/plain', JSON.stringify({ type, index }));
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDrop = (e: any, targetType: 'question' | 'answer', targetIdx: number) => {
    e.preventDefault();
    if (!draggedItem) return;
    if (draggedItem.type !== targetType) {
      showFlashMessage('Bạn chỉ có thể sắp xếp các vế cùng loại với nhau!', 'error');
      return;
    }
    const fromIdx = draggedItem.index;
    if (fromIdx === targetIdx) return;
    
    if (targetType === 'question') {
      const newOrder = [...questionOrder];
      const temp = newOrder[fromIdx];
      newOrder[fromIdx] = newOrder[targetIdx];
      newOrder[targetIdx] = temp;
      setQuestionOrder(newOrder);
    } else {
      const newOrder = [...answerOrder];
      const temp = newOrder[fromIdx];
      newOrder[fromIdx] = newOrder[targetIdx];
      newOrder[targetIdx] = temp;
      setAnswerOrder(newOrder);
    }
    setDraggedItem(null);
    showFlashMessage('Đã chuyển đổi vị trí vế ghép câu đối thành công!', 'success');
  };

  // Filtered templates list for the Toolbar helper
  const filteredMathTemplates = useMemo(() => {
    if (selectedMathCategory === 'Tất cả') return mathTemplates;
    return mathTemplates.filter(t => t.category === selectedMathCategory);
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
    
    // Support wrapping selected text elegantly inside math delimiters or templates
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
        cursorOffset = insertion.indexOf('}') + 2; // Position in second curly braces
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
    
    handleUpdatePair(focusedField.id, focusedField.field, newValue);
    
    // Maintain focused field target across state shifts and focus updates
    setTimeout(() => {
      element.focus();
      element.setSelectionRange(start + cursorOffset, start + cursorOffset);
    }, 50);
  };

  // --- INITIALIZE & SAMPLE DATA ---
  useEffect(() => {
    // Load math sample data on initial mount
    handleLoadSample('math');
  }, []);

  // Update scramble orders when pairs change
  useEffect(() => {
    resetScrambleOrders();
  }, [pairs]);

  // MathJax live typesetting for the active input preview and all dynamic panels
  useEffect(() => {
    if (focusedField) {
      const timer = setTimeout(() => {
        const previewId = `preview-math-${focusedField.id}-${focusedField.field}`;
        const previewEl = document.getElementById(previewId);
        if (previewEl && (window as any).MathJax?.typesetPromise) {
          (window as any).MathJax.typesetPromise([previewEl]).catch((err: any) => {
            console.warn('MathJax typesetting live preview error:', err);
          });
        }
      }, 80);
      return () => clearTimeout(timer);
    }
  }, [pairs, focusedField]);

  // Global MathJax typesetting effect to cover all dynamic panels, tables, and views immediately on state shift
  useEffect(() => {
    if (typeof window !== 'undefined' && (window as any).MathJax?.typesetPromise) {
      // First quick pass as elements mount
      const timer1 = setTimeout(() => {
        (window as any).MathJax.typesetPromise()
          .catch((err: any) => console.warn('Global MathJax typesetting quick-pass error:', err));
      }, 100);

      // Second deep pass once layouts settle
      const timer2 = setTimeout(() => {
        (window as any).MathJax.typesetPromise()
          .catch((err: any) => console.warn('Global MathJax typesetting deep-pass error:', err));
      }, 500);

      return () => {
        clearTimeout(timer1);
        clearTimeout(timer2);
      };
    }
  }, [pairs, activeTab, settings, showProjection, projectionIndex, showTeacherKeyPrint, showCuttingBorders]);

  const resetScrambleOrders = () => {
    const indices = Array.from({ length: pairs.length }, (_, i) => i);
    setQuestionOrder([...indices]);
    setAnswerOrder([...indices]);
  };

  // Keyboard listeners for presentation mode
  useEffect(() => {
    if (!showProjection) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') {
        setProjectionIndex(prev => Math.min(pairs.length - 1, prev + 1));
      } else if (e.key === 'ArrowLeft') {
        setProjectionIndex(prev => Math.max(0, prev - 1));
      } else if (e.key === 'Escape') {
        setShowProjection(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showProjection, pairs.length]);

  const showFlashMessage = (text: string, type: 'success' | 'error' | 'info' = 'success') => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 4000);
  };

  // --- ACTIONS & HANDLERS ---
  const handleLoadSample = (type: 'math' | 'geo' | 'eng') => {
    let sample: PuzzlePair[] = [];
    if (type === 'math') {
      sample = [...MATH_SAMPLE_DATA];
      setSettings(prev => ({
        ...prev,
        title: 'Hàm số mũ và logarit',
        subject: 'Toán học 12',
        gradeClass: 'Cánh Diều - Lớp 12',
      }));
    } else if (type === 'geo') {
      sample = [...GEOGRAPHY_SAMPLE_DATA];
      setSettings(prev => ({
        ...prev,
        title: 'Địa lí Tự nhiên Việt Nam',
        subject: 'Địa lí 12',
        gradeClass: 'Ôn thi THPT Quốc gia',
      }));
    } else {
      sample = [...ENGLISH_SAMPLE_DATA];
      setSettings(prev => ({
        ...prev,
        title: 'Past Tense & Vocabulary Match-up',
        subject: 'Tiếng Anh 12',
        gradeClass: 'Lớp 12D',
      }));
    }
    setPairs(sample);
    showFlashMessage(`Đã tải bộ dữ liệu mẫu bài học ${type === 'math' ? 'Toán học' : type === 'geo' ? 'Địa lí' : 'Tiếng anh'}!`);
  };

  const handleAddPair = () => {
    const nextIndex = pairs.length + 1;
    const newPair: PuzzlePair = {
      id: `pair-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      question: `Câu hỏi số ${nextIndex}`,
      answer: `Đáp án số ${nextIndex}`,
      code: `Z${nextIndex}`,
    };
    setPairs([...pairs, newPair]);
    showFlashMessage('Đã thêm một cặp ghép mới!');
  };

  const handleRemovePair = (id: string) => {
    setPairs(pairs.filter(p => p.id !== id));
    showFlashMessage('Đã xóa cặp ghép!', 'info');
  };

  const handleUpdatePair = (id: string, field: 'question' | 'answer' | 'code', value: string) => {
    setPairs(pairs.map(p => p.id === id ? { ...p, [field]: value } : p));
  };

  const handleScramble = () => {
    // Independent random shuffles
    const qShuffled = [...questionOrder].sort(() => Math.random() - 0.5);
    const aShuffled = [...answerOrder].sort(() => Math.random() - 0.5);
    setQuestionOrder(qShuffled);
    setAnswerOrder(aShuffled);
    showFlashMessage('Đã xáo trộn ngẫu nhiên thứ tự các câu hỏi và đáp án!', 'success');
  };

  // Export JSON string
  const handleExportJSON = () => {
    const dataStr = JSON.stringify({ settings, pairs }, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.download = `canva-puzzle-${settings.title.toLowerCase().replace(/\s+/g, '-')}.json`;
    link.href = url;
    link.click();
    showFlashMessage('Đã tải xuống file cấu hình JSON!');
  };

  // Import JSON string
  const handleImportJSON = () => {
    try {
      const parsed = JSON.parse(jsonInput);
      if (!parsed.pairs || !Array.isArray(parsed.pairs)) {
        throw new Error('Cấu trúc JSON thiếu mảng "pairs" hợp lệ.');
      }
      if (parsed.settings) {
        setSettings(prev => ({
          ...prev,
          ...parsed.settings
        }));
      }
      setPairs(parsed.pairs);
      setShowJsonModal(false);
      setJsonInput('');
      setJsonError('');
      showFlashMessage('Đã nhập dữ liệu từ file cấu hình JSON thành công!');
    } catch (err: any) {
      setJsonError(err.message || 'Lỗi cú pháp JSON không hợp lệ. Vui lòng kiểm tra kỹ.');
    }
  };

  // Helper template config for import standard paste
  const handleLoadSamplePasteStructure = () => {
    const mock = {
      settings: {
        title: 'Từ vựng Sinh học',
        subject: 'Sinh học 12',
        gradeClass: 'Lớp 12B3',
        teacherName: 'Cô Linh',
        style: 'pastel',
        showMatchCode: true,
        showDoodleIcons: true,
        activityType: 'Khởi động',
        columns: 2,
        pieceSize: 1.1
      },
      pairs: [
        { id: 'b1', question: 'Mã di truyền có tính thoái hóa nghĩa là?', answer: 'Nhiều bộ ba cùng mã hóa 1 axit amin', code: 'S1' },
        { id: 'b2', question: 'Quá trình nhân đôi ADN diễn ra ở pha nào?', answer: 'Pha S kì trung gian', code: 'S2' },
        { id: 'b3', question: 'Tác nhân hữu cơ chủ yếu gây đột biến gene?', answer: 'Chất 5-BU (5-Bromuracil)', code: 'S3' }
      ]
    };
    setJsonInput(JSON.stringify(mock, null, 2));
  };

  // --- ACTIONS EXPORT ---
  const handlePrint = () => {
    window.print();
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
        console.error('DoM to Image PNG error:', error);
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
      
      // Set aspect ratio/layout to standard 16x9
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
      
      // Sidebar card info
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
        // Oval number
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
        // Label text
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
        
        // --- Left Side: Question box ---
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
        
        // --- Right Side: Answer box ---
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
        
        // --- Footer verification tag ---
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
      showFlashMessage('Đã tải xuống slide PowerPoint (.pptx) trình chiếu thành công!');
    } catch (err: any) {
      console.error('PPTX export error:', err);
      showFlashMessage('Lỗi tạo PPTX: ' + err.message, 'error');
    }
  };

  return (
    <div className="min-h-screen bg-[#f4f7f9] flex flex-col font-sans text-slate-800 grid-school animate-fade-in">
      {/* HEADER BANNER */}
      <header className="bg-[#2F2A40] text-white py-3 px-6 relative overflow-hidden shadow-md no-print border-b-4 border-[#FFAE00]">
        <div className="absolute inset-0 opacity-15 pointer-events-none">
          <div className="absolute top-2 left-10 text-yellow-300 transform -rotate-12"><PencilIcon size={32} /></div>
          <div className="absolute bottom-2 right-12 text-lime-400 transform rotate-45"><RulerIcon size={36} /></div>
          <div className="absolute top-1 right-24 text-red-400"><BookIcon size={30} /></div>
          <div className="absolute top-8 left-1/3 text-amber-300 animate-pulse"><StarIcon size={24} /></div>
        </div>

        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center relative z-10 gap-3">
          <div className="flex items-center gap-3">
            <span className="text-3xl">🧩</span>
            <div>
              <h1 className="text-lg sm:text-xl font-bold font-sans tracking-tight flex items-center gap-2 text-[#FFFFFF]">
                BỘ SINH GAME GHÉP MẢNH HỌC ĐƯỜNG
                <span className="text-[10px] bg-[#159BAD] text-white px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                  Canva Style
                </span>
              </h1>
              <p className="text-[11px] text-slate-300 mt-0.5 font-sans">
                Thiết kế học liệu Jigsaw Puzzle lồi/lõm trực quan cho giáo viên mầm non, tiểu học & phổ thông
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="w-3.5 h-3.5 rounded-full bg-[#159BAD] shadow-sm" title="Teal Blue" />
            <span className="w-3.5 h-3.5 rounded-full bg-[#FFC928] shadow-sm" title="Sunny Yellow" />
            <span className="w-3.5 h-3.5 rounded-full bg-[#F54B32] shadow-sm" title="Coral Red" />
            <span className="w-3.5 h-3.5 rounded-full bg-[#94BF52] shadow-sm" title="Kiwi Green" />
            <span className="w-3.5 h-3.5 rounded-full bg-[#2F2A40] shadow-sm" title="Dark Purple" />
          </div>
        </div>
      </header>

      {/* SYSTEM MESSAGES */}
      {message && (
        <div className="no-print fixed top-5 right-5 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-xl transition-all duration-300 animate-bounce bg-white border-l-4 border-solid text-slate-800"
             style={{
               borderColor: message.type === 'success' ? '#94BF52' : message.type === 'error' ? '#F54B32' : '#159BAD'
             }}>
          <CheckCircle2 size={20} className={message.type === 'success' ? 'text-[#94BF52]' : message.type === 'error' ? 'text-[#F54B32]' : 'text-[#159BAD]'} />
          <span className="text-xs font-semibold">{message.text}</span>
        </div>
      )}

      {/* TWO PANEL CONTENT */}
      <main className="flex-grow max-w-[1550px] w-full mx-auto p-4 lg:p-5 grid grid-cols-1 lg:grid-cols-12 gap-5 items-start relative transition-all duration-300">
        
        {/* LEFT COLUMN: CONTROL & INPUT TABLE (Lg: 4/12 cols) */}
        {!isSidebarCollapsed && (
          <section className="lg:col-span-4 flex flex-col gap-4 no-print transition-all duration-300" id="control-panel-column">
          
          {/* LESSON METADATA CARD */}
          <div className="bg-white rounded-2xl p-4 shadow-[0_8px_30px_rgb(0,0,0,0.03)] border border-slate-200/80 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-16 h-16 bg-[#159BAD]/5 rounded-bl-full pointer-events-none flex items-center justify-center">
              <GraduationCap className="text-[#159BAD] opacity-30 -mr-2 -mt-2" size={24} />
            </div>

            <h2 className="text-sm font-bold text-[#2F2A40] flex items-center gap-2 mb-3 border-b border-dashed border-slate-100 pb-2">
              <span className="w-2 h-5 rounded-full bg-[#159BAD] inline-block" />
              1. Thông Tin Giáo Án & Bài Học
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1">
                  Đề Tài / Tên Bài Học
                </label>
                <input
                  type="text"
                  className="w-full text-xs font-medium px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#159BAD] focus:border-transparent transition-all"
                  value={settings.title}
                  onChange={(e) => setSettings({ ...settings, title: e.target.value })}
                  placeholder="Ví dụ: Hàm số lũy thừa"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1">
                  Môn Học
                </label>
                <input
                  type="text"
                  className="w-full text-xs font-medium px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#159BAD] focus:border-transparent transition-all"
                  value={settings.subject}
                  onChange={(e) => setSettings({ ...settings, subject: e.target.value })}
                  placeholder="Ví dụ: Toán giải tích 12"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1">
                  Lớp Học / Khối
                </label>
                <input
                  type="text"
                  className="w-full text-xs font-medium px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#159BAD] focus:border-transparent transition-all"
                  value={settings.gradeClass}
                  onChange={(e) => setSettings({ ...settings, gradeClass: e.target.value })}
                  placeholder="Ví dụ: Lớp 12A3"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1">
                  Tên Giáo Viên
                </label>
                <input
                  type="text"
                  className="w-full text-xs font-medium px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#159BAD] focus:border-transparent transition-all"
                  value={settings.teacherName}
                  onChange={(e) => setSettings({ ...settings, teacherName: e.target.value })}
                  placeholder="Ví dụ: Cô Tuyết Mai"
                />
              </div>
            </div>

            {/* ACTIVITY TYPE CHIPS */}
            <div className="mt-4">
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-2">
                Kiểu Hoạt Động Lớp Học
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['Khởi động', 'Luyện tập', 'Vận dụng'] as ActivityType[]).map((type) => {
                  const isActive = settings.activityType === type;
                  const colors = {
                    'Khởi động': { bg: 'bg-[#F2FBFD] text-[#159BAD] border-[#159BAD]/30', active: 'bg-[#159BAD] text-white border-[#159BAD]' },
                    'Luyện tập': { bg: 'bg-[#FEFAF0] text-[#FFC928] border-[#FFC928]/30', active: 'bg-[#FFC928] text-slate-900 border-[#FFC928]' },
                    'Vận dụng': { bg: 'bg-[#FDF3F1] text-[#F54B32] border-[#F54B32]/30', active: 'bg-[#F54B32] text-white border-[#F54B32]' }
                  };
                  return (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setSettings({ ...settings, activityType: type })}
                      className={`text-xs py-2 px-3 rounded-xl border text-center font-bold tracking-tight transition-all cursor-pointer ${
                        isActive ? colors[type].active : colors[type].bg
                      }`}
                    >
                      {type}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* PUZZLE ADJUSTMENT & LAYOUTS CARD */}
          <div className="bg-white rounded-2xl p-4 shadow-[0_8px_30px_rgb(0,0,0,0.03)] border border-slate-200/80">
            <h2 className="text-sm font-bold text-[#2F2A40] flex items-center gap-2 mb-3 border-b border-dashed border-slate-100 pb-2">
              <span className="w-2 h-5 rounded-full bg-[#FFC928] inline-block" />
              2. Kiểu Ghép & Thiết Kế Giao Diện
            </h2>

            {/* PUZZLE TYPE SWITCHES */}
            <div className="mb-4">
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">
                🧩 Lựa Chọn Loại Học Liệu Ghép Hình
              </label>
              <div className="grid grid-cols-3 gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200/50">
                <button
                  type="button"
                  onClick={() => setSettings({ ...settings, puzzleType: 'jigsaw' })}
                  className={`text-center py-2 text-[10px] sm:text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1 ${
                    settings.puzzleType === 'jigsaw'
                      ? 'bg-white text-[#159BAD] shadow'
                      : 'text-slate-600 hover:bg-white/50'
                  }`}
                >
                  🧩 Jigsaw Lồi
                </button>
                <button
                  type="button"
                  onClick={() => setSettings({ ...settings, puzzleType: 'tarsia' })}
                  className={`text-center py-2 text-[10px] sm:text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1 ${
                    settings.puzzleType === 'tarsia'
                      ? 'bg-white text-indigo-700 shadow'
                      : 'text-slate-600 hover:bg-white/50'
                  }`}
                >
                  📐 Tarsia
                </button>
                <button
                  type="button"
                  onClick={() => setSettings({ ...settings, puzzleType: 'number_jigsaw' })}
                  className={`text-center py-2 text-[10px] sm:text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1 ${
                    settings.puzzleType === 'number_jigsaw'
                      ? 'bg-white text-pink-700 shadow'
                      : 'text-slate-600 hover:bg-white/50'
                  }`}
                >
                  🔢 Ghép Số 3D
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {/* THEME STYLE BUTTONS */}
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5 flex items-center gap-1.5">
                  <Palette size={12} className="text-indigo-400" /> Bản Thiết Kế Màu Sắc
                </label>
                <div className="flex gap-2 bg-slate-50 p-1.5 rounded-xl border border-slate-100">
                  <button
                    type="button"
                    onClick={() => setSettings({ ...settings, style: 'vibrant' })}
                    className={`flex-1 text-center py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                      settings.style === 'vibrant'
                        ? 'bg-[#159BAD] text-white shadow-sm'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    🌈 Rực rỡ
                  </button>
                  <button
                    type="button"
                    onClick={() => setSettings({ ...settings, style: 'pastel' })}
                    className={`flex-1 text-center py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                      settings.style === 'pastel'
                        ? 'bg-[#94BF52] text-white shadow-sm'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    🌸 Pastel dịu
                  </button>
                </div>
              </div>

              {/* TARSIA SHAPE SELECTOR OR COLUMNS SLIDER OR NUMBER SHAPE SELECTOR */}
              {settings.puzzleType === 'tarsia' ? (
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5 flex items-center gap-1">
                    📐 Hình Dạng Tarsia Thảo Luận
                  </label>
                  <select
                    className="w-full text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl p-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer text-slate-700"
                    value={settings.tarsiaShape}
                    onChange={(e: any) => setSettings({ ...settings, tarsiaShape: e.target.value })}
                  >
                    <option value="triangle_9">🔼 Tarsia Tam Giác (9 mảnh - 9 cặp)</option>
                    <option value="triangle_18">🔺 Tarsia Tam Giác Lớn (16 mảnh - 18 cặp)</option>
                    <option value="hexagon">⬡ Tarsia Lục Giác (24 mảnh - 30 cặp)</option>
                    <option value="rhombus">♢ Tarsia Hình Thoi (8 mảnh - 9 cặp)</option>
                  </select>
                  <span className="text-[10px] text-slate-400 block mt-1 tracking-normal font-sans">
                    *Mép ngoài cùng Tarsia để trống để định vị góc dễ dính keo.
                  </span>
                </div>
              ) : settings.puzzleType === 'number_jigsaw' ? (
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5 flex items-center gap-1">
                    🔢 Dạng Hình Số 3D Canva
                  </label>
                  <select
                    className="w-full text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl p-2 focus:outline-none focus:ring-2 focus:ring-[#159BAD] cursor-pointer text-slate-700"
                    value={settings.numberShape}
                    onChange={(e: any) => setSettings({ ...settings, numberShape: e.target.value })}
                  >
                    <option value="0">🎈 Số 0 (Khép kín khối - Cần 3 mảnh đôi)</option>
                    <option value="1">🌱 Số 1 (Đơn giản thanh tao - Cần 2 mảnh đôi)</option>
                    <option value="2">📚 Số 2 (Dễ xếp - Cần 3 mảnh đôi)</option>
                    <option value="3">🎯 Số 3 (Mềm mại uốn - Cần 3 mảnh đôi)</option>
                    <option value="4">🚀 Số 4 (Mũi tên đột phá - Cần 3 mảnh đôi)</option>
                    <option value="5">🔥 Số 5 (Múp míp ngộ nghĩnh - Cần 3 mảnh đôi)</option>
                    <option value="6">☘️ Số 6 (Bụng bự may mắn - Cần 3 mảnh đôi)</option>
                    <option value="7">⚡ Số 7 (Góc cạnh tia sét - Cần 3 mảnh đôi)</option>
                    <option value="8">🌟 Số 8 (Vô cực chất chơi - Cần 4 mảnh đôi)</option>
                    <option value="9">🧁 Số 9 (Dễ thương đáng yêu - Cần 3 mảnh đôi)</option>
                    <option value="10">🏆 Số 10 (Điểm Vàng học tập - Cần 5 mảnh đôi)</option>
                    <option value="20">🎉 Số 20 (Tri ân ngày 20/11 - Cần 6 mảnh đôi)</option>
                  </select>
                  <span className="text-[10px] text-slate-400 block mt-1 tracking-normal font-sans">
                    *Thỏa thích in rời tháo lắp các vế chữ số 3D siêu dễ thương.
                  </span>
                </div>
              ) : (
                /* COLUMNS SLIDER FOR JIGSAW */
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1 flex justify-between">
                    <span>Số Cột Ghép Jigsaw</span>
                    <span className="text-[#159BAD] font-bold">{settings.columns} Cột</span>
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="4"
                    step="1"
                    className="w-full accent-[#159BAD] cursor-pointer h-1.5 bg-slate-100 rounded-lg appearance-none mt-2"
                    value={settings.columns}
                    onChange={(e) => setSettings({ ...settings, columns: parseInt(e.target.value) })}
                  />
                  <div className="flex justify-between text-[9px] text-slate-400 px-1 mt-1 font-mono">
                    <span>1</span>
                    <span>2</span>
                    <span>3</span>
                    <span>4</span>
                  </div>
                </div>
              )}

              {/* PIECE SIZE SLIDER */}
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1 flex justify-between">
                  <span>Cỡ Mảnh Ghép (In Kéo)</span>
                  <span className="text-[#94BF52] font-bold">x{settings.pieceSize.toFixed(1)}</span>
                </label>
                <input
                  type="range"
                  min="0.7"
                  max="1.4"
                  step="0.1"
                  className="w-full accent-[#94BF52] cursor-pointer h-1.5 bg-slate-100 rounded-lg appearance-none mt-2"
                  value={settings.pieceSize}
                  onChange={(e) => setSettings({ ...settings, pieceSize: parseFloat(e.target.value) })}
                />
                <div className="flex justify-between text-[9px] text-slate-400 px-1 mt-1 font-mono">
                  <span>Cỡ Nhỏ (0.7x)</span>
                  <span>Vừa (1.0x)</span>
                  <span>Cỡ To (1.4x)</span>
                </div>
              </div>

              {/* ALIGN CONFIG TOGGLES */}
              <div className="flex flex-col gap-2.5 justify-center">
                <label className="flex items-center gap-2 cursor-pointer py-1 select-none">
                  <input
                    type="checkbox"
                    className="w-4.5 h-4.5 accent-[#159BAD] rounded cursor-pointer"
                    checked={settings.showMatchCode}
                    onChange={(e) => setSettings({ ...settings, showMatchCode: e.target.checked })}
                  />
                  <div>
                    <span className="text-xs font-bold text-slate-700 block">Hiện mã kiểm tra nhanh</span>
                    <span className="text-[10px] text-slate-400 block -mt-0.5">Giúp tự đối chiếu góc thẻ</span>
                  </div>
                </label>

                <label className="flex items-center gap-2 cursor-pointer py-1 select-none">
                  <input
                    type="checkbox"
                    className="w-4.5 h-4.5 accent-[#F54B32] rounded cursor-pointer"
                    checked={settings.showDoodleIcons}
                    onChange={(e) => setSettings({ ...settings, showDoodleIcons: e.target.checked })}
                  />
                  <div>
                    <span className="text-xs font-bold text-slate-700 block">Hiện icon & họa tiết học đường</span>
                    <span className="text-[10px] text-slate-400 block -mt-0.5">Trang trí góc mỗi mảnh ghép</span>
                  </div>
                </label>

                <label className="flex items-center gap-2 cursor-pointer py-1 select-none border-t border-slate-100 pt-1.5 mt-0.5">
                  <input
                    type="checkbox"
                    className="w-4.5 h-4.5 accent-indigo-600 rounded cursor-pointer"
                    checked={settings.saveInk}
                    onChange={(e) => setSettings({ ...settings, saveInk: e.target.checked })}
                  />
                  <div>
                    <span className="text-xs font-bold text-indigo-700 block flex items-center gap-1">
                      🖨️ In tiết kiệm mực (Trắng - Đen)
                    </span>
                    <span className="text-[10px] text-slate-400 block -mt-0.5">Lược bỏ màu nền để tránh hút mực khi in ra giấy</span>
                  </div>
                </label>
              </div>
            </div>

            {/* EXTRA ACTION BAR */}
            <div className="mt-4 pt-3.5 border-t border-slate-100 flex flex-wrap gap-2 justify-between items-center text-xs">
              <span className="text-slate-500 font-medium">Mẫu nhanh bài học khác:</span>
              <div className="flex flex-wrap gap-1">
                <button
                  type="button"
                  onClick={() => handleLoadSample('math')}
                  className="bg-slate-100 hover:bg-[#159BAD]/10 hover:text-[#159BAD] px-2.5 py-1 rounded-lg font-bold text-slate-700 transition-all cursor-pointer"
                >
                  📐 Toán 12
                </button>
                <button
                  type="button"
                  onClick={() => handleLoadSample('geo')}
                  className="bg-slate-100 hover:bg-[#94BF52]/10 hover:text-[#94BF52] px-2.5 py-1 rounded-lg font-bold text-slate-700 transition-all cursor-pointer"
                >
                  🗺️ Địa lí
                </button>
                <button
                  type="button"
                  onClick={() => handleLoadSample('eng')}
                  className="bg-slate-100 hover:bg-[#F54B32]/10 hover:text-[#F54B32] px-2.5 py-1 rounded-lg font-bold text-slate-700 transition-all cursor-pointer"
                >
                  🇬🇧 Anh văn
                </button>
              </div>
            </div>
          </div>

          {/* DYNAMIC PAIR EDITOR */}
          <div className="bg-white rounded-2xl p-4 shadow-[0_8px_30px_rgb(0,0,0,0.03)] border border-slate-200/80">
            <div className="flex justify-between items-center mb-3 pb-2 border-b border-dashed border-slate-100">
              <h2 className="text-sm font-bold text-[#2F2A40] flex items-center gap-2">
                <span className="w-2 h-5 rounded-full bg-[#F54B32] inline-block" />
                3. Danh Sách Câu Hỏi - Đáp Án
              </h2>
              <span className="text-[11px] bg-slate-100 text-slate-600 font-mono font-bold px-2.5 py-0.5 rounded-full">
                Sỹ số: {pairs.length} cặp
              </span>
            </div>

            {/* BULK EXPORT/IMPORT DIALOG ACTION */}
            <div className="flex gap-2 mb-3">
              <button
                type="button"
                onClick={() => setShowJsonModal(true)}
                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-[11px] font-bold rounded-xl border border-indigo-200/40 transition-all cursor-pointer"
              >
                <Upload size={12} /> Nhập / Xuất bảng JSON
              </button>
              <button
                type="button"
                onClick={handleExportJSON}
                className="flex items-center justify-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-[11px] font-bold rounded-xl border border-emerald-200/40 transition-all cursor-pointer"
                title="Sao lưu ra file json để chỉnh sửa sau này"
              >
                <Download size={12} /> Tải file backup
              </button>
            </div>

            {/* INTERACTIVE MATHJAX FORMULA EDITOR TOOLBAR */}
            <div className="bg-gradient-to-br from-slate-50 to-indigo-50/30 rounded-2xl border border-indigo-150 p-3 mb-4 shadow-sm">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-1.5 mb-2 pb-1.5 border-b border-indigo-100">
                <div className="flex items-center gap-1.5">
                  <span className="text-base">📐</span>
                  <span className="text-xs font-extrabold text-indigo-900 tracking-tight">Trợ Lý Công Thức Toán (MathJax)</span>
                </div>
                {focusedField ? (
                  <span className="text-[10px] text-emerald-700 font-extrabold bg-emerald-100 px-2 py-0.5 rounded-full flex items-center gap-1 shadow-xs border border-emerald-200 uppercase tracking-wide">
                    🟢 Cặp #{pairs.findIndex(p => p.id === focusedField.id) + 1} ({focusedField.field === 'question' ? 'Hỏi' : 'Đáp'})
                  </span>
                ) : (
                  <span className="text-[10px] text-slate-400 font-medium font-sans">
                    *Nhấp ô bên dưới để chọn con trỏ
                  </span>
                )}
              </div>

              {/* Category pills */}
              <div className="flex gap-1.5 overflow-x-auto pb-1.5 mb-2 no-scrollbar scroll-smooth">
                {MATH_CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setSelectedMathCategory(cat)}
                    className={`text-[10px] shrink-0 px-2.5 py-0.5 rounded-full font-bold cursor-pointer transition-all ${
                      selectedMathCategory === cat
                        ? 'bg-[#159BAD] text-white shadow-sm'
                        : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Symbol Buttons Grid */}
              <div className="grid grid-cols-4 sm:grid-cols-5 gap-1.5 max-h-[110px] overflow-y-auto pr-0.5 custom-scrollbar">
                {filteredMathTemplates.map((tmpl) => (
                  <button
                    key={tmpl.label}
                    type="button"
                    onClick={() => insertMathSymbol(tmpl.code)}
                    disabled={!focusedField}
                    className={`text-center py-1 rounded-lg border text-[10px] font-sans font-bold transition-all duration-200 ${
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
              
              <p className="text-[9.5px] text-slate-400 mt-2 flex items-center gap-1">
                <span>💡 <b>Gõ:</b> Bao quanh bởi dấu</span>
                <code className="bg-slate-200 px-1 py-0.2 rounded text-[10px] font-bold font-mono">$...$</code>
                <span>để kích hoạt MathJax đẹp</span>
              </p>
            </div>

            {/* PAIRS TABLE INPUTS */}
            <div className="max-h-[380px] overflow-y-auto pr-1 flex flex-col gap-2.5 custom-scrollbar">
              {pairs.length === 0 ? (
                <div className="text-center py-10 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                  <p className="text-xs text-slate-400 font-medium">Bảng trống. Hãy nạp dữ liệu mẫu hoặc nhấn Thêm cặp!</p>
                </div>
              ) : (
                pairs.map((pair, index) => {
                  const gradient = getPuzzleGradients(index, settings.style);
                  return (
                    <div
                      key={pair.id}
                      className="group p-2.5 rounded-xl bg-slate-50/60 border border-slate-200/60 hover:border-[#159BAD]/40 hover:bg-slate-50 relative transition-all"
                    >
                      <div className="absolute left-0 top-0 bottom-0 w-1 rounded-l-xl" style={{ backgroundColor: gradient.from }} />
                      
                      <div className="flex justify-between items-center mb-1.5 pl-1.5">
                        <span className="text-[11px] font-bold text-slate-500 flex items-center gap-1">
                          <span className="w-4 h-4 rounded-full flex items-center justify-center text-[9px] text-white" style={{ backgroundColor: gradient.to }}>
                            {index + 1}
                          </span>
                          Cặp ghép #{index + 1}
                        </span>

                        <div className="flex items-center gap-1.5">
                          {/* SELF CHECK CODE */}
                          <div className="flex items-center gap-1">
                            <span className="text-[9px] text-slate-400 font-bold uppercase">Mã:</span>
                            <input
                              type="text"
                              value={pair.code}
                              onChange={(e) => handleUpdatePair(pair.id, 'code', e.target.value.toUpperCase())}
                              className="w-9 text-[10px] text-center font-mono font-bold py-0.5 bg-white border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#159BAD]"
                              title="Mã kiểm tra giúp học sinh đối chiếu xem ghép đúng hay sai"
                            />
                          </div>

                          <button
                            type="button"
                            onClick={() => handleRemovePair(pair.id)}
                            className="text-slate-400 hover:text-[#F54B32] p-1 rounded-lg hover:bg-slate-200/50 transition-all cursor-pointer"
                            title="Xóa cặp ghép này"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pl-1.5">
                        <div className="flex flex-col">
                          <textarea
                            id={`input-${pair.id}-question`}
                            rows={2}
                            onFocus={() => setFocusedField({ id: pair.id, field: 'question' })}
                            className="w-full text-xs p-1.5 bg-white border border-slate-200 rounded-lg resize-none focus:outline-none focus:ring-1 focus:ring-[#159BAD]"
                            value={pair.question}
                            onChange={(e) => handleUpdatePair(pair.id, 'question', e.target.value)}
                            placeholder="Nhập câu hỏi... (VD: Đạo hàm của $e^x$)"
                          />
                          {focusedField?.id === pair.id && focusedField?.field === 'question' && (
                            <div className="mt-1 p-1.5 bg-sky-50 border border-sky-100 rounded-lg text-[10px] text-sky-850">
                              <span className="font-extrabold text-[8px] text-sky-500 uppercase tracking-widest block mb-0.5">XEM TRƯỚC (MATHJAX):</span>
                              <div id={`preview-math-${pair.id}-question`} className="min-h-[1.2rem] items-center text-[10px] overflow-x-auto custom-scrollbar font-sans font-bold">
                                {pair.question.trim() ? pair.question : '(Trống)'}
                              </div>
                            </div>
                          )}
                        </div>

                        <div className="flex flex-col">
                          <textarea
                            id={`input-${pair.id}-answer`}
                            rows={2}
                            onFocus={() => setFocusedField({ id: pair.id, field: 'answer' })}
                            className="w-full text-xs p-1.5 bg-white border border-slate-200 rounded-lg resize-none focus:outline-none focus:ring-1 focus:ring-[#159BAD]"
                            value={pair.answer}
                            onChange={(e) => handleUpdatePair(pair.id, 'answer', e.target.value)}
                            placeholder="Nhập đáp án... (VD: $e^x$)"
                          />
                          {focusedField?.id === pair.id && focusedField?.field === 'answer' && (
                            <div className="mt-1 p-1.5 bg-emerald-50 border border-emerald-100 rounded-lg text-[10px] text-emerald-850">
                              <span className="font-extrabold text-[8px] text-emerald-555 uppercase tracking-widest block mb-0.5">XEM TRƯỚC (MATHJAX):</span>
                              <div id={`preview-math-${pair.id}-answer`} className="min-h-[1.2rem] items-center text-[10px] overflow-x-auto custom-scrollbar font-sans font-bold">
                                {pair.answer.trim() ? pair.answer : '(Trống)'}
                              </div>
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
            <div className="mt-3.5 flex gap-2">
              <button
                type="button"
                onClick={handleAddPair}
                className="flex-grow flex items-center justify-center gap-1.5 py-2 px-4 bg-[#159BAD] hover:bg-[#0B7382] text-white text-xs font-bold rounded-xl transition-all shadow-sm hover:shadow cursor-pointer font-sans"
              >
                <Plus size={15} /> Thêm Cặp Ghép
              </button>
              <button
                type="button"
                onClick={resetScrambleOrders}
                className="py-2 px-4 bg-[#94BF52] hover:bg-[#70A627] text-white text-xs font-bold rounded-xl transition-all shadow-sm cursor-pointer flex items-center justify-center gap-1.5 font-sans"
                title="Khôi phục sắp xếp câu hỏi & đáp án khớp nhau"
              >
                <RefreshCw size={13} /> Khớp lại
              </button>
            </div>
          </div>
        </section>
        )}

        {/* RIGHT COLUMN: PREVIEW PANEL (Lg: 8/12 cols or Lg: 12/12 cols when collapsed) */}
        <section className={`${isSidebarCollapsed ? 'lg:col-span-12' : 'lg:col-span-8'} flex flex-col gap-3.5 w-full relative transition-all duration-300`}>
          
          {/* FLOATING ACTION TOOLBAR */}
          <div className="bg-white rounded-2xl p-2.5 shadow-[0_4px_20px_rgb(0,0,0,0.02)] border border-slate-200 flex flex-wrap gap-2 items-center justify-between no-print relative z-30">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-950 text-xs font-bold rounded-xl transition-all cursor-pointer border border-indigo-150 shadow-xs"
                title={isSidebarCollapsed ? "Mở rộng bảng cấu hình nhập liệu" : "Thu gọn bảng cấu hình nhập liệu để mở rộng vùng thiết kế"}
              >
                {isSidebarCollapsed ? <ChevronRight size={14} className="text-[#159BAD] animate-pulse" /> : <ChevronLeft size={14} className="text-indigo-600" />}
                <span className="font-extrabold">{isSidebarCollapsed ? "Hiện Bảng Đóng Góp" : "Thu Gọn Nhật Ký"}</span>
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
                onClick={() => {
                  setShowProjection(true);
                  setProjectionIndex(0);
                }}
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
                  <RefreshCw size={13} className="animate-spin-slow" /> Xáo đáp án
                </button>
              )}

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
                    className="w-4.5 h-4.5 accent-indigo-600 rounded cursor-pointer"
                    checked={settings.saveInk}
                    onChange={(e) => setSettings({ ...settings, saveInk: e.target.checked })}
                  />
                  <div>
                    <span className="text-[11px] font-bold text-indigo-900 block">In trắng đen (Kinh tế & Tiết kiệm mực) ⭐</span>
                    <span className="text-[9px] text-slate-500 block -mt-0.5">Chuyển sang viền đen, nền trắng, không đổ màu để photocopy cực rẻ</span>
                  </div>
                </label>
              </div>
            </div>
          )}

          {/* VIEWPORT CANVAS */}
          <div className="w-full overflow-x-auto select-none rounded-2xl bg-slate-300/50 p-3 md:p-6 relative min-h-[400px] border border-slate-300/70 shadow-inner">
            <div
              id="puzzle-preview-canvas"
              className="printable-area bg-white mx-auto shadow-2xl rounded-2xl border border-slate-200/60 p-6 md:p-8 shrink-0 relative overflow-hidden transition-all grid-school"
              style={{
                width: activeTab === 'poster' ? '100%' : '210mm', // standard A4 is 210mm
                maxWidth: '100%',
                minHeight: activeTab === 'poster' ? 'auto' : '297mm', // standard A4 is 297mm aspect ratio
                aspectRatio: activeTab === 'poster' ? '16/9' : 'unset',
              }}
            >
              {/* CUTE SCHOOL DOODLE BACKGROUND IF ENABLED */}
              {settings.showDoodleIcons && <SchoolBackgroundDoodles />}

              {/* CANVA WORKBOOK HEADER */}
              <div className="relative z-10 border-b-2 border-slate-300 pb-4 mb-6 flex flex-col md:flex-row md:justify-between md:items-end gap-3">
                <div className="flex-1">
                  {/* Subject Tag */}
                  <div className="flex items-center gap-2">
                    <span 
                      className="text-[10px] font-bold text-white px-2.5 py-0.5 rounded-full uppercase tracking-wider shadow-sm"
                      style={{
                        backgroundColor: 
                          settings.activityType === 'Khởi động' ? '#159BAD' : 
                          settings.activityType === 'Luyện tập' ? '#FFC928' : '#F54B32',
                        color: settings.activityType === 'Luyện tập' ? '#2F2A40' : '#FFFFFF'
                      }}
                    >
                      💡 Hoạt động {settings.activityType}
                    </span>
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
                />
              ) : (
                <>
                  {/* CORE RENDERING WORKSPACE - TAB 1: POSTER GAME (PAIR CONCURRENT) */}
                  {activeTab === 'poster' && (
                    <div className="relative z-10 w-full flex flex-col justify-center py-4">
                      {pairs.length === 0 ? (
                        <div className="text-center py-16">
                          <span className="text-5xl text-slate-300 block mb-3">🧩</span>
                          <p className="text-xs text-slate-400 font-bold block">Không có dữ liệu ghép. Vui lòng thêm cặp hoặc tải dữ liệu mẫuở bảng trái!</p>
                        </div>
                      ) : (
                        <div 
                          className="grid gap-x-12 gap-y-6 justify-center justify-items-center items-center mx-auto"
                          style={{
                            gridTemplateColumns: `repeat(${Math.min(settings.columns, pairs.length)}, minmax(0, max-content))`,
                          }}
                        >
                          {pairs.map((pair, index) => (
                            <div 
                              key={pair.id} 
                              className="flex items-center justify-center relative outline-none"
                              style={{
                                // scale overall sizing based on teacher's preference slider
                                transform: `scale(${settings.pieceSize})`,
                                margin: `${(settings.pieceSize - 1) * 30}px`,
                                transformOrigin: 'center center'
                              }}
                            >
                              {/* Question Piece */}
                              <PuzzleCard
                                text={pair.question}
                                type="question"
                                index={index}
                                code={pair.code}
                                style={settings.style}
                                showCode={settings.showMatchCode}
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
                                showCode={settings.showMatchCode}
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
                    <div className="relative z-10 w-full flex flex-col justify-center py-2">
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
                                          ? "border-2 border-dashed border-slate-400 bg-slate-50/50 shadow-sm" 
                                          : "bg-transparent"
                                      }`}
                                      style={{
                                        transform: `scale(${settings.pieceSize})`,
                                        margin: `${(settings.pieceSize - 1) * 35}px`,
                                      }}
                                    >
                                      {/* Scissor icon guide */}
                                      {showCuttingBorders && (
                                        <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-white rounded-full p-1 border border-slate-300 text-slate-500 z-30 shadow-xs" title="Cắt theo nét đứt">
                                          <Scissors size={10} className="rotate-90 animate-pulse" />
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
                            <div className="w-full flex flex-col gap-6 items-center pl-3">
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
                                          ? "border-2 border-dashed border-slate-400 bg-slate-50/50 shadow-sm" 
                                          : "bg-transparent"
                                      }`}
                                      style={{
                                        transform: `scale(${settings.pieceSize})`,
                                        margin: `${(settings.pieceSize - 1) * 35}px`,
                                      }}
                                    >
                                      {/* Scissor icon guide */}
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

                  {/* UNIVERSAL MASTER REFERENCE SHEET FOR OFFLINE PRINTING (SUPPORTS JIGSAW, TARSIA, AND NUMBER JIGSAW) */}
                  {showTeacherKeyPrint && activeTab === 'cutout' && pairs.length > 0 && (
                    <div className="mt-14 pt-8 border-t-2 border-dashed border-slate-300 w-full page-break-before-avoid select-text">
                      <div className="flex items-center gap-2 mb-4 bg-indigo-50 border border-indigo-100 p-3.5 rounded-2xl">
                        <span className="text-xl">👩‍🏫</span>
                        <div>
                          <h4 className="text-xs font-bold text-indigo-900 uppercase tracking-wide">Bản Đáp Án Đối Chiếu Nhanh (Dành Cho Giáo Viên & Chấm Thi Offline)</h4>
                          <p className="text-[10px] text-indigo-700">Mẫu kết quả khớp nối chuẩn giúp thầy cô đối chiếu đáp án với học sinh tức thì trong lớp học.</p>
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
                                <div className="font-extrabold text-slate-700 font-sans break-words mt-0.5 leading-snug">{pair.question}</div>
                              </div>
                              <div className="min-w-0 border-l border-slate-200 pl-3.5">
                                <div className="text-[9px] uppercase tracking-wider font-extrabold text-slate-400">Đáp Án / Vế Hai</div>
                                <div className="font-extrabold text-[#159BAD] font-sans break-words mt-0.5 leading-snug">{pair.answer}</div>
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
        </section>

      </main>

      {/* FOOTER */}
      <footer className="no-print bg-[#2F2A40]/5 py-4 text-center border-t border-slate-200 text-xs text-slate-500 mt-12">
        <p>© 2026 Canva School Jigsaw Puzzle Applet • Tùy biến thông minh cho giáo viên học đường</p>
      </footer>

      {/* BULK POPUP JSON MODAL */}
      {showJsonModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-xl w-full shadow-2xl relative animate-fade-in border border-slate-100">
            <h3 className="text-base font-bold text-slate-800 flex items-center gap-2 mb-2">
              <span className="text-xl">⚙️</span>
              Sao lưu & Nhập bảng cấu hình JSON
            </h3>
            <p className="text-[11px] text-slate-500 mb-4 leading-relaxed font-sans">
              Giúp giáo viên đồng bộ hóa nội dung câu hỏi nhanh chóng, lưu trữ sang tệp văn bản khác hoặc chia sẻ bộ Puzzle game cho các giáo viên cùng môn trong trường!
            </p>

            <textarea
              className="w-full h-56 p-3 text-xs font-mono bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#159BAD] mb-3 resize-none"
              value={jsonInput}
              onChange={(e) => setJsonInput(e.target.value)}
              placeholder='Nhập cấu trúc JSON tại đây...'
            />

            {jsonError && (
              <div className="p-3 bg-red-50 text-red-600 rounded-xl mb-3 text-xs flex items-center gap-2 border border-red-100">
                <Info size={14} className="shrink-0" />
                <span className="font-semibold">{jsonError}</span>
              </div>
            )}

            <div className="flex gap-2 justify-between items-center text-xs">
              <button
                type="button"
                onClick={handleLoadSamplePasteStructure}
                className="bg-sky-50 text-sky-700 hover:bg-sky-100 border border-sky-200/50 px-3 py-2 rounded-xl font-bold font-sans transition-all cursor-pointer"
              >
                📋 Sử dụng cấu trúc mẫu
              </button>
              
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowJsonModal(false);
                    setJsonError('');
                    setJsonInput('');
                  }}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 font-bold rounded-xl text-slate-600 transition-all cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="button"
                  onClick={handleImportJSON}
                  className="px-4 py-2 bg-[#159BAD] hover:bg-[#0B7382] font-bold text-white rounded-xl transition-all shadow-sm cursor-pointer"
                >
                  Nhập dữ liệu
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TRÌNH CHIẾU SCREEN MODAL FOR TV/BOARD */}
      {showProjection && (
        <div className="fixed inset-0 z-50 bg-[#14121F] text-white flex flex-col p-6 animate-fade-in select-none">
          {/* Floating Header */}
          <div className="flex justify-between items-center border-b border-white/10 pb-4 mb-6">
            <div className="flex items-center gap-3">
              <span className="text-3xl">📺</span>
              <div>
                <h2 className="text-sm font-extrabold tracking-tight text-white flex items-center gap-2">
                  CHẾ ĐỘ TRÌNH CHIẾU TIVI / MÁY CHIẾU LỚP HỌC
                  <span className="text-[9px] bg-red-500 text-white px-2 py-0.5 rounded-full font-bold uppercase tracking-wider animate-pulse">
                    Live
                  </span>
                </h2>
                <p className="text-[10px] text-slate-400">
                  {settings.title} • Môn học: {settings.subject}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  if (document.fullscreenElement) {
                    document.exitFullscreen();
                  } else {
                    document.documentElement.requestFullscreen();
                  }
                }}
                className="bg-white/5 hover:bg-white/10 text-xs font-bold px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer border border-white/10"
              >
                <Maximize2 size={12} /> Toàn màn hình
              </button>
              <button
                type="button"
                onClick={() => setShowProjection(false)}
                className="bg-red-500 hover:bg-red-600 text-xs font-bold px-4 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shadow-md"
              >
                Thoát Trình Chiếu [x]
              </button>
            </div>
          </div>

          {/* Big Presentation Deck Sandbox */}
          {pairs.length === 0 ? (
            <div className="flex-grow flex flex-col justify-center items-center text-center">
              <span className="text-5xl block mb-3">🧩</span>
              <p className="text-sm text-slate-400 font-bold block">Hãy nạp hoặc nhập dữ liệu câu hỏi trước khi trình chiếu.</p>
            </div>
          ) : (
            (() => {
              const pair = pairs[projectionIndex];
              return (
                <div className="flex-grow flex flex-col justify-between max-w-5xl w-full mx-auto">
                  {/* Top summary row */}
                  <div className="text-center text-xs font-extrabold text-slate-400 tracking-wider">
                    CẶP GHÉP #{projectionIndex + 1} TRÊN TỔNG SỐ {pairs.length}
                  </div>

                  {/* Giant Cards Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full my-auto items-center justify-center py-6">
                    {/* Question card */}
                    <div className="bg-gradient-to-br from-blue-900/40 to-blue-950/80 rounded-3xl p-8 border-2 border-blue-500/30 flex flex-col justify-between min-h-[320px] shadow-2xl relative overflow-hidden group">
                      <div className="absolute top-0 left-0 w-24 h-24 bg-blue-500/5 rounded-br-full pointer-events-none flex items-center justify-center" />
                      <span className="text-xs uppercase font-extrabold tracking-widest text-blue-400 mb-4 block">
                        🏷️ CÂU HỎI #{projectionIndex + 1}
                      </span>
                      <div className="flex-grow flex items-center justify-center text-center">
                        <p className="text-xl sm:text-2xl md:text-3xl font-extrabold tracking-tight leading-snug">
                          {pair.question}
                        </p>
                      </div>
                      <div className="mt-4 pt-4 border-t border-white/5 text-[11px] text-slate-400 font-mono">
                        Mã đối chiếu: Q-{pair.code}
                      </div>
                    </div>

                    {/* Answer card with optional tap-to-reveal */}
                    <InteractiveAnswerCard answer={pair.answer} index={projectionIndex} code={pair.code} />
                  </div>

                  {/* Bottom Keyboard + Click Controls */}
                  <div className="max-w-md w-full mx-auto pb-4">
                    <div className="flex gap-3 justify-between items-center bg-white/5 p-3 rounded-2xl border border-white/10 shadow-lg">
                      <button
                        type="button"
                        disabled={projectionIndex === 0}
                        onClick={() => setProjectionIndex(prev => Math.max(0, prev - 1))}
                        className={`px-5 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center gap-1.5 cursor-pointer ${
                          projectionIndex === 0 ? 'bg-white/5 text-white/20 cursor-not-allowed' : 'bg-white/10 hover:bg-white/20'
                        }`}
                      >
                        ◀ Câu Trước
                      </button>
                      
                      <span className="text-xs font-bold font-mono tracking-wider bg-white/10 text-yellow-400 px-3 py-1 rounded-lg">
                        {projectionIndex + 1} / {pairs.length}
                      </span>

                      <button
                        type="button"
                        disabled={projectionIndex === pairs.length - 1}
                        onClick={() => setProjectionIndex(prev => Math.min(pairs.length - 1, prev + 1))}
                        className={`px-5 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center gap-1.5 cursor-pointer ${
                          projectionIndex === pairs.length - 1 ? 'bg-white/5 text-white/20 cursor-not-allowed' : 'bg-sky-500 hover:bg-sky-600 shadow-md text-white'
                        }`}
                      >
                        Câu Tiếp ▶
                      </button>
                    </div>
                    <p className="text-center text-[10px] text-slate-400 mt-2">
                      *Sử dụng chuột click hoặc nhấn các phím mũi tên Trái/Phải (← / →) trên bàn phím để chuyển thẻ nhanh.
                    </p>
                  </div>
                </div>
              );
            })()
          )}
        </div>
      )}
    </div>
  );
}
