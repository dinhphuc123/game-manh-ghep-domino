import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  GraduationCap, 
  Palette, 
  ChevronLeft, 
  ChevronRight, 
  Maximize2,
  CheckCircle2,
  Sparkles
} from 'lucide-react';
import { useEditorStore } from '../../stores/editorStore';
import { useUIStore } from '../../stores/uiStore';
import { useGeminiConfigStore } from '../../stores/geminiConfigStore';
import { PencilIcon, RulerIcon, BookIcon, StarIcon } from '../Doodles';
import { QuestionEditor } from './QuestionEditor';
import { PrintPreview } from './PrintPreview';
import { PreviewWorkspace } from './PreviewWorkspace';
import { JsonModal } from './JsonModal';
import { PublishModal } from './PublishModal';
import { MathJaxWrapper, calculateDynamicFontSize } from '../MathJaxWrapper';
import { FontControls } from './FontControls';
import { generateRealWorldScenario } from '../../services/geminiService';

/** Wrapper đơn giản để dùng FontControls full-size trong sidebar EditorPage */
const FontControlsSidebar: React.FC = () => (
  <FontControls compact={false} />
);

const GRADE_SUBJECTS_2018: Record<string, string[]> = {
  'Mẫu giáo / Mầm non': [
    'Làm quen với Toán',
    'Làm quen Văn học (Chuyện, Thơ)',
    'Khám phá Khoa học & Xã hội',
    'Giáo dục Thể chất',
    'Hoạt động Tạo hình (Vẽ, Nặn, Xé dán)',
    'Hoạt động Âm nhạc',
    'Tiếng Anh (Làm quen)'
  ],
  'Lớp 1': [
    'Toán',
    'Tiếng Việt',
    'Tiếng Anh (Ngoại ngữ 1)',
    'Đạo đức',
    'Tự nhiên và Xã hội',
    'Giáo dục Thể chất',
    'Âm nhạc',
    'Mỹ thuật',
    'Hoạt động Trải nghiệm'
  ],
  'Lớp 2': [
    'Toán',
    'Tiếng Việt',
    'Tiếng Anh (Ngoại ngữ 1)',
    'Đạo đức',
    'Tự nhiên và Xã hội',
    'Giáo dục Thể chất',
    'Âm nhạc',
    'Mỹ thuật',
    'Hoạt động Trải nghiệm'
  ],
  'Lớp 3': [
    'Toán',
    'Tiếng Việt',
    'Tiếng Anh (Ngoại ngữ 1)',
    'Đạo đức',
    'Tự nhiên và Xã hội',
    'Tin học và Công nghệ',
    'Giáo dục Thể chất',
    'Âm nhạc',
    'Mỹ thuật',
    'Hoạt động Trải nghiệm'
  ],
  'Lớp 4': [
    'Toán',
    'Tiếng Việt',
    'Tiếng Anh (Ngoại ngữ 1)',
    'Đạo đức',
    'Khoa học',
    'Lịch sử và Địa lí',
    'Tin học',
    'Công nghệ',
    'Giáo dục Thể chất',
    'Âm nhạc',
    'Mỹ thuật',
    'Hoạt động Trải nghiệm'
  ],
  'Lớp 5': [
    'Toán',
    'Tiếng Việt',
    'Tiếng Anh (Ngoại ngữ 1)',
    'Đạo đức',
    'Khoa học',
    'Lịch sử và Địa lí',
    'Tin học',
    'Công nghệ',
    'Giáo dục Thể chất',
    'Âm nhạc',
    'Mỹ thuật',
    'Hoạt động Trải nghiệm'
  ],
  'Lớp 6': [
    'Toán',
    'Ngữ văn',
    'Tiếng Anh (Ngoại ngữ 1)',
    'Khoa học Tự nhiên',
    'Lịch sử và Địa lí',
    'Giáo dục Công dân',
    'Tin học',
    'Công nghệ',
    'Giáo dục Thể chất',
    'Âm nhạc',
    'Mỹ thuật',
    'Hoạt động Trải nghiệm - Hướng nghiệp',
    'Giáo dục Địa phương'
  ],
  'Lớp 7': [
    'Toán',
    'Ngữ văn',
    'Tiếng Anh (Ngoại ngữ 1)',
    'Khoa học Tự nhiên',
    'Lịch sử và Địa lí',
    'Giáo dục Công dân',
    'Tin học',
    'Công nghệ',
    'Giáo dục Thể chất',
    'Âm nhạc',
    'Mỹ thuật',
    'Hoạt động Trải nghiệm - Hướng nghiệp',
    'Giáo dục Địa phương'
  ],
  'Lớp 8': [
    'Toán',
    'Ngữ văn',
    'Tiếng Anh (Ngoại ngữ 1)',
    'Khoa học Tự nhiên',
    'Lịch sử và Địa lí',
    'Giáo dục Công dân',
    'Tin học',
    'Công nghệ',
    'Giáo dục Thể chất',
    'Âm nhạc',
    'Mỹ thuật',
    'Hoạt động Trải nghiệm - Hướng nghiệp',
    'Giáo dục Địa phương'
  ],
  'Lớp 9': [
    'Toán',
    'Ngữ văn',
    'Tiếng Anh (Ngoại ngữ 1)',
    'Khoa học Tự nhiên',
    'Lịch sử và Địa lí',
    'Giáo dục Công dân',
    'Tin học',
    'Công nghệ',
    'Giáo dục Thể chất',
    'Âm nhạc',
    'Mỹ thuật',
    'Hoạt động Trải nghiệm - Hướng nghiệp',
    'Giáo dục Địa phương'
  ],
  'Lớp 10': [
    'Toán',
    'Ngữ văn',
    'Tiếng Anh (Ngoại ngữ 1)',
    'Lịch sử',
    'Địa lí',
    'Giáo dục Kinh tế và Pháp luật',
    'Vật lí',
    'Hóa học',
    'Sinh học',
    'Tin học',
    'Công nghệ',
    'Giáo dục Quốc phòng và An ninh',
    'Giáo dục Thể chất',
    'Âm nhạc',
    'Mỹ thuật',
    'Hoạt động Trải nghiệm - Hướng nghiệp',
    'Giáo dục Địa phương'
  ],
  'Lớp 11': [
    'Toán',
    'Ngữ văn',
    'Tiếng Anh (Ngoại ngữ 1)',
    'Lịch sử',
    'Địa lí',
    'Giáo dục Kinh tế và Pháp luật',
    'Vật lí',
    'Hóa học',
    'Sinh học',
    'Tin học',
    'Công nghệ',
    'Giáo dục Quốc phòng và An ninh',
    'Giáo dục Thể chất',
    'Âm nhạc',
    'Mỹ thuật',
    'Hoạt động Trải nghiệm - Hướng nghiệp',
    'Giáo dục Địa phương'
  ],
  'Lớp 12': [
    'Toán',
    'Ngữ văn',
    'Tiếng Anh (Ngoại ngữ 1)',
    'Lịch sử',
    'Địa lí',
    'Giáo dục Kinh tế và Pháp luật',
    'Vật lí',
    'Hóa học',
    'Sinh học',
    'Tin học',
    'Công nghệ',
    'Giáo dục Quốc phòng và An ninh',
    'Giáo dục Thể chất',
    'Âm nhạc',
    'Mỹ thuật',
    'Hoạt động Trải nghiệm - Hướng nghiệp',
    'Giáo dục Địa phương'
  ]
};

const detectGrade = (gradeClass: string): string => {
  if (!gradeClass) return 'Lớp 12';
  if (gradeClass.toLowerCase().includes('mẫu giáo') || gradeClass.toLowerCase().includes('mầm non')) {
    return 'Mẫu giáo / Mầm non';
  }
  for (let i = 12; i >= 1; i--) {
    if (gradeClass.toLowerCase().includes(`lớp ${i}`) || gradeClass.toLowerCase().includes(`lớp  ${i}`)) {
      return `Lớp ${i}`;
    }
  }
  return 'Khác';
};

const getGradeSuffix = (gradeClass: string): string => {
  if (!gradeClass) return '';
  const detected = detectGrade(gradeClass);
  if (detected === 'Khác') return '';
  if (detected === 'Mẫu giáo / Mầm non') return '';
  
  const regex = new RegExp(`lớp\\s*${detected.replace('Lớp ', '')}`, 'i');
  return gradeClass.replace(regex, '').trim();
};

const InteractiveAnswerCard: React.FC<{ answer: string; index: number; code: string }> = ({ answer, index, code }) => {
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
          <MathJaxWrapper
            text={answer}
            className="font-extrabold tracking-tight leading-snug text-white w-full text-center"
            style={{
              fontSize: `${calculateDynamicFontSize(answer, 30, 20, 48)}px`
            }}
          />
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

export const EditorPage: React.FC = () => {
  const navigate = useNavigate();
  const {
    pairs,
    settings,
    currentGameId,
    setPairs,
    setSettings,
    setCurrentGameId,
    showProjection,
    setShowProjection,
    projectionIndex,
    setProjectionIndex,
    loadSampleData,
  } = useEditorStore();

  const [aiTopic, setAiTopic] = useState('');
  const [isGeneratingScenario, setIsGeneratingScenario] = useState(false);
  const geminiConfig = useGeminiConfigStore();

  const handleGenerateScenario = async () => {
    if (!aiTopic.trim()) {
      alert('Vui lòng nhập chủ đề kịch bản thực tế.');
      return;
    }
    setIsGeneratingScenario(true);
    try {
      const response = await generateRealWorldScenario(
        aiTopic,
        geminiConfig.apiKey,
        geminiConfig.model,
        geminiConfig.provider,
        geminiConfig.openRouterApiKey,
        geminiConfig.openRouterModel
      );
      
      if (response && response.pairs && response.pairs.length > 0) {
        setSettings({
          hasScenario: true,
          scenarioTitle: response.scenarioTitle,
          title: response.scenarioTitle
        });
        
        const newPairs = response.pairs.map((p, idx) => ({
          id: `pair-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 6)}`,
          question: p.question,
          answer: p.answer,
          code: `S${p.stepNumber}`,
          stepNumber: p.stepNumber,
          stepDescription: p.stepDescription
        }));
        
        setPairs(newPairs);
        alert(`Đã tự động tạo kịch bản thực tế "${response.scenarioTitle}" thành công!`);
      } else {
        alert('Dữ liệu kịch bản trả về từ AI không đúng cấu trúc.');
      }
    } catch (error: any) {
      console.error(error);
      alert('Lỗi khi gọi AI tạo kịch bản: ' + (error.message || error));
    } finally {
      setIsGeneratingScenario(false);
    }
  };


  const {
    activeTab,
    isSidebarCollapsed,
    message,
  } = useUIStore();

  // Load math sample data on initial mount if empty
  useEffect(() => {
    if (!currentGameId) {
      setCurrentGameId('game-' + Date.now());
    }
    if (pairs.length === 0) {
      loadSampleData('math');
    }
  }, []);

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

          <div className="flex items-center gap-4 font-sans">
            <button
              onClick={() => navigate('/dashboard')}
              className="bg-indigo-950 hover:bg-indigo-900 border border-indigo-900 px-4 py-2 rounded-xl text-xs font-bold text-slate-200 transition-all cursor-pointer shadow-sm flex items-center gap-1.5"
            >
              📂 Quản lý Giáo án
            </button>

            <div className="hidden sm:flex items-center gap-2">
              <span className="w-3.5 h-3.5 rounded-full bg-[#159BAD] shadow-sm" title="Teal Blue" />
              <span className="w-3.5 h-3.5 rounded-full bg-[#FFC928] shadow-sm" title="Sunny Yellow" />
              <span className="w-3.5 h-3.5 rounded-full bg-[#F54B32] shadow-sm" title="Coral Red" />
              <span className="w-3.5 h-3.5 rounded-full bg-[#94BF52] shadow-sm" title="Kiwi Green" />
              <span className="w-3.5 h-3.5 rounded-full bg-[#2F2A40] shadow-sm" title="Dark Purple" />
            </div>
          </div>
        </div>
      </header>

      {/* SYSTEM MESSAGES */}
      {message && (
        <div className="no-print fixed top-5 right-5 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-xl transition-all duration-300 bg-white border-l-4 border-solid text-slate-800 animate-bounce"
             style={{
               borderColor: message.type === 'success' ? '#94BF52' : message.type === 'error' ? '#F54B32' : '#159BAD'
             }}>
          <CheckCircle2 size={20} className={message.type === 'success' ? 'text-[#94BF52]' : message.type === 'error' ? 'text-[#F54B32]' : 'text-[#159BAD]'} />
          <span className="text-xs font-semibold">{message.text}</span>
        </div>
      )}

      {/* TWO PANEL CONTENT */}
      <main className="flex-grow max-w-[1550px] w-full mx-auto p-2.5 lg:p-3.5 grid grid-cols-1 lg:grid-cols-12 gap-4.5 items-start relative transition-all duration-300">
        
        {/* LEFT COLUMN: CONTROL & INPUT TABLE (Lg: 4/12 cols) */}
        {!isSidebarCollapsed && (
          <section className="lg:col-span-4 flex flex-col gap-3.5 no-print transition-all duration-300 animate-fade-in" id="control-panel-column">
          
            {/* LESSON METADATA CARD */}
            <div className="bg-white rounded-2xl p-3 sm:p-3.5 shadow-[0_8px_30px_rgb(0,0,0,0.03)] border border-slate-200/80 relative overflow-hidden">
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
                    className="w-full text-xs font-medium px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#159BAD] text-slate-700"
                    value={settings.title}
                    onChange={(e) => setSettings({ title: e.target.value })}
                    placeholder="Ví dụ: Hàm số lũy thừa"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1">
                    Lớp Học / Khối
                  </label>
                  <div className="grid grid-cols-5 gap-2">
                    <div className="col-span-3">
                      <select
                        className="w-full text-xs font-semibold px-2 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#159BAD] text-slate-700"
                        value={detectGrade(settings.gradeClass)}
                        onChange={(e) => {
                          const newGrade = e.target.value;
                          if (newGrade === 'Khác') {
                            setSettings({ gradeClass: '' });
                          } else if (newGrade === 'Mẫu giáo / Mầm non') {
                            setSettings({ 
                              gradeClass: newGrade,
                              subject: GRADE_SUBJECTS_2018[newGrade]?.[0] || settings.subject
                            });
                          } else {
                            const currentSuffix = getGradeSuffix(settings.gradeClass);
                            setSettings({ 
                              gradeClass: `${newGrade}${currentSuffix ? ' ' + currentSuffix : ''}`,
                              subject: GRADE_SUBJECTS_2018[newGrade]?.[0] || settings.subject
                            });
                          }
                        }}
                      >
                        {Object.keys(GRADE_SUBJECTS_2018).map((g) => (
                          <option key={g} value={g}>{g}</option>
                        ))}
                        <option value="Khác">Khác / Tự nhập...</option>
                      </select>
                    </div>
                    <div className="col-span-2">
                      {detectGrade(settings.gradeClass) !== 'Khác' && detectGrade(settings.gradeClass) !== 'Mẫu giáo / Mầm non' ? (
                        <input
                          type="text"
                          className="w-full text-xs font-medium px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#159BAD] text-slate-700"
                          value={getGradeSuffix(settings.gradeClass)}
                          onChange={(e) => {
                            const gradePrefix = detectGrade(settings.gradeClass);
                            const newSuffix = e.target.value;
                            setSettings({ 
                              gradeClass: `${gradePrefix}${newSuffix ? ' ' + newSuffix : ''}`
                            });
                          }}
                          placeholder="Ví dụ: A1, B"
                        />
                      ) : detectGrade(settings.gradeClass) === 'Khác' ? (
                        <input
                          type="text"
                          className="w-full text-xs font-medium px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#159BAD] text-slate-700"
                          value={settings.gradeClass}
                          onChange={(e) => setSettings({ gradeClass: e.target.value })}
                          placeholder="Nhập tên lớp..."
                        />
                      ) : (
                        <input
                          type="text"
                          disabled
                          className="w-full text-xs font-medium px-3 py-2 bg-slate-100 border border-slate-200 rounded-xl cursor-not-allowed opacity-50 text-center text-slate-400"
                          value="Không có"
                        />
                      )}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1">
                    Môn Học
                  </label>
                  {(() => {
                    const currentGrade = detectGrade(settings.gradeClass);
                    const subjectsList = GRADE_SUBJECTS_2018[currentGrade] || [];
                    const isPreset = subjectsList.includes(settings.subject);
                    
                    return (
                      <div className="flex flex-col gap-1">
                        <select
                          className="w-full text-xs font-semibold px-2 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#159BAD] text-slate-700"
                          value={isPreset ? settings.subject : 'Khác'}
                          onChange={(e) => {
                            const val = e.target.value;
                            if (val === 'Khác') {
                              setSettings({ subject: '' });
                            } else {
                              setSettings({ subject: val });
                            }
                          }}
                        >
                          {subjectsList.map((sub) => (
                            <option key={sub} value={sub}>{sub}</option>
                          ))}
                          <option value="Khác">Tự nhập môn học khác...</option>
                        </select>

                        {(!isPreset || currentGrade === 'Khác') && (
                          <input
                            type="text"
                            className="w-full text-xs font-medium px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#159BAD] text-slate-700 mt-1"
                            value={settings.subject}
                            onChange={(e) => setSettings({ subject: e.target.value })}
                            placeholder="Nhập tên môn học..."
                          />
                        )}
                      </div>
                    );
                  })()}
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1">
                    Tên Giáo Viên
                  </label>
                  <input
                    type="text"
                    className="w-full text-xs font-medium px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#159BAD] text-slate-700"
                    value={settings.teacherName}
                    onChange={(e) => setSettings({ teacherName: e.target.value })}
                    placeholder="Ví dụ: Cô Tuyết Mai"
                  />
                </div>
              </div>

              {/* TOGGLE WORKBOOK HEADER */}
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs font-bold text-slate-650">Hiển thị tiêu đề bài học (Khai báo)</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={settings.showHeader !== false} 
                    onChange={(e) => setSettings({ showHeader: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-350 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#159BAD]"></div>
                </label>
              </div>
            </div>


            {/* PUZZLE ADJUSTMENT & LAYOUTS CARD */}
            <div className="bg-white rounded-2xl p-3 sm:p-3.5 shadow-[0_8px_30px_rgb(0,0,0,0.03)] border border-slate-200/80">
              <h2 className="text-sm font-bold text-[#2F2A40] flex items-center gap-2 mb-3 border-b border-dashed border-slate-100 pb-2">
                <span className="w-2 h-5 rounded-full bg-[#FFC928] inline-block" />
                2. Kiểu Ghép & Thiết Kế Giao Diện
              </h2>

              {/* PUZZLE TYPE SWITCHES */}
              <div className="mb-4">
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">
                  🧩 Lựa Chọn Loại Học Liệu Ghép Hình
                </label>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200/50">
                  <button
                    type="button"
                    onClick={() => setSettings({ puzzleType: 'jigsaw' })}
                    className={`text-center py-2 text-[10px] sm:text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1 ${
                      settings.puzzleType === 'jigsaw'
                        ? 'bg-white text-[#159BAD] shadow'
                        : 'text-slate-600 hover:bg-white/50'
                    }`}
                  >
                    🧩 Jigsaw
                  </button>
                  <button
                    type="button"
                    onClick={() => setSettings({ puzzleType: 'tarsia' })}
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
                    onClick={() => setSettings({ puzzleType: 'number_jigsaw' })}
                    className={`text-center py-2 text-[10px] sm:text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1 ${
                      settings.puzzleType === 'number_jigsaw'
                        ? 'bg-white text-pink-700 shadow'
                        : 'text-slate-600 hover:bg-white/50'
                    }`}
                  >
                    🔢 Số 3D
                  </button>
                  <button
                    type="button"
                    onClick={() => setSettings({ puzzleType: 'domino' })}
                    className={`text-center py-2 text-[10px] sm:text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1 ${
                      settings.puzzleType === 'domino'
                        ? 'bg-white text-emerald-700 shadow'
                        : 'text-slate-600 hover:bg-white/50'
                    }`}
                  >
                    🀄 Domino
                  </button>
                  <button
                    type="button"
                    onClick={() => setSettings({ puzzleType: 'math_maze' })}
                    className={`text-center py-2 text-[10px] sm:text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1 ${
                      settings.puzzleType === 'math_maze'
                        ? 'bg-white text-orange-700 shadow'
                        : 'text-slate-600 hover:bg-white/50'
                    }`}
                  >
                    🌀 Mê Cung
                  </button>
                  <button
                    type="button"
                    onClick={() => setSettings({ puzzleType: 'bingo' })}
                    className={`text-center py-2 text-[10px] sm:text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1 ${
                      settings.puzzleType === 'bingo'
                        ? 'bg-white text-purple-700 shadow'
                        : 'text-slate-600 hover:bg-white/50'
                    }`}
                  >
                    🎯 Bingo
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 gap-3.5 xl:grid-cols-2">
                {/* THEME STYLE BUTTONS */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5 flex items-center gap-1.5">
                    <Palette size={12} className="text-indigo-400" /> Bản Thiết Kế Màu Sắc
                  </label>
                  <div className="flex gap-2 bg-slate-50 p-1.5 rounded-xl border border-slate-100">
                    <button
                      type="button"
                      onClick={() => setSettings({ style: 'vibrant' })}
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
                      onClick={() => setSettings({ style: 'pastel' })}
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
                      onChange={(e: any) => setSettings({ tarsiaShape: e.target.value })}
                    >
                      <option value="triangle_4">🔼 Tarsia Tam Giác Nhỏ (4 mảnh - 3 cặp)</option>
                      <option value="triangle_9">🔼 Tarsia Tam Giác Vừa (9 mảnh - 9 cặp)</option>
                      <option value="triangle_16">🔼 Tarsia Tam Giác Lớn (16 mảnh - 18 cặp)</option>
                      <option value="parallelogram_10">▱ Tarsia Hình Bình Hành (10 mảnh - 11 cặp)</option>
                      <option value="hexagon_6">⬢ Tarsia Lục Giác Đơn Giản (6 mảnh - 6 cặp)</option>
                      <option value="star">⭐ Tarsia Ngôi Sao 6 Cánh (12 mảnh - 12 cặp)</option>
                      <option value="trapezoid_6">⏥ Tarsia Hình Thang Lớn (6 mảnh - 5 cặp)</option>
                      <option value="chevron_12">🪃 Tarsia Hình Chữ V Lớn (12 mảnh - 11 cặp)</option>
                      <option value="chevron_8">🪃 Tarsia Hình Chữ V Nhỏ (8 mảnh - 7 cặp)</option>
                      <option value="trapezoid_5">⏥ Tarsia Hình Thang Nhỏ (5 mảnh - 4 cặp)</option>
                      <option value="fish_12">🐟 Tarsia Hình Cá / Cây Thông (12 mảnh - 12 cặp)</option>
                      <option value="rhombus">♢ Tarsia Hình Thoi Đối Xứng (8 mảnh - 8 cặp)</option>
                      <option value="heart_12">❤️ Tarsia Trái Tim Nhỏ (12 mảnh - 12 cặp)</option>
                      <option value="heart_18">❤️ Tarsia Trái Tim Lớn (18 mảnh - 20 cặp)</option>
                    </select>
                    <span className="text-[10px] text-slate-400 block mt-1 tracking-normal font-sans">
                      *Mép ngoài cùng Tarsia để trống để định vị góc dễ dính keo.
                    </span>
                  </div>
                ) : settings.puzzleType === 'domino' ? (
                  <div className="flex flex-col gap-3">
                    <div>
                      <div className="flex justify-between items-center mb-1.5">
                        <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide flex items-center gap-1 select-none">
                          🀄 Dạng Hình Số Domino
                        </label>
                        <span className="text-[9px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/80 px-2 py-0.5 rounded-lg select-none">
                          {(settings.dominoShape || '26').replace(/[^0-9]/g, '').split('').reduce((sum, d) => {
                            const layouts: {[k:string]: number} = {'0':8,'1':5,'2':7,'3':6,'4':6,'5':6,'6':7,'7':6,'8':9,'9':8};
                            return sum + (layouts[d] || 7);
                          }, 0)} thẻ
                        </span>
                      </div>
                      <input
                        type="text"
                        maxLength={6}
                        className="w-full text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl p-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-700 text-center text-sm tracking-widest font-mono"
                        value={settings.dominoShape || '26'}
                        onChange={(e) => setSettings({ dominoShape: e.target.value.replace(/[^0-9]/g, '') })}
                        placeholder="Nhập chữ số (VD: 2026, 26, 20)"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3.5 mt-1 select-none">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1 flex justify-between">
                          <span>↔ Rộng Thẻ</span>
                          <span className="text-emerald-600 font-bold">{settings.dominoWidth || 160}px</span>
                        </label>
                        <input
                          type="range"
                          min="140"
                          max="300"
                          step="10"
                          className="w-full accent-emerald-500 cursor-pointer h-1.5 bg-slate-100 rounded-lg appearance-none"
                          value={settings.dominoWidth || 160}
                          onChange={(e) => setSettings({ dominoWidth: parseInt(e.target.value) })}
                        />
                        <div className="flex justify-between text-[8px] text-slate-400 px-0.5 mt-0.5 font-mono">
                          <span>140</span><span>220</span><span>300</span>
                        </div>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1 flex justify-between">
                          <span>↕ Cao Thẻ</span>
                          <span className="text-emerald-600 font-bold">{settings.dominoHeight || 68}px</span>
                        </label>
                        <input
                          type="range"
                          min="50"
                          max="150"
                          step="5"
                          className="w-full accent-emerald-500 cursor-pointer h-1.5 bg-slate-100 rounded-lg appearance-none"
                          value={settings.dominoHeight || 68}
                          onChange={(e) => setSettings({ dominoHeight: parseInt(e.target.value) })}
                        />
                        <div className="flex justify-between text-[8px] text-slate-400 px-0.5 mt-0.5 font-mono">
                          <span>50</span><span>100</span><span>150</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : settings.puzzleType === 'number_jigsaw' ? (
                  <div className="flex flex-col gap-3">
                    <div>
                      <div className="flex justify-between items-center mb-1.5">
                        <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide flex items-center gap-1 select-none">
                          🔢 Dạng Hình Số 3D Canva
                        </label>
                        <span className="text-[9px] font-bold bg-[#159BAD]/10 text-[#159BAD] border border-[#159BAD]/20 px-2 py-0.5 rounded-lg select-none">
                          {(settings.numberShape || '2').replace(/[^0-9]/g, '').split('').reduce((sum, d) => {
                            const layouts: {[k:string]: number} = {'1':4,'2':6,'0':6,'5':6,'8':8,'3':6,'9':6,'4':6,'6':8,'7':6};
                            return sum + (layouts[d] || 6);
                          }, 0)} mảnh
                        </span>
                      </div>
                      <input
                        type="text"
                        maxLength={8}
                        className="w-full text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl p-2 focus:outline-none focus:ring-2 focus:ring-[#159BAD] text-slate-700 text-center text-sm tracking-widest font-mono"
                        value={settings.numberShape || '2'}
                        onChange={(e) => setSettings({ numberShape: e.target.value.replace(/[^0-9]/g, '') })}
                        placeholder="Nhập số tùy ý (VD: 20, 2026, 100)"
                      />
                      <span className="text-[9px] text-slate-400 block mt-1 tracking-normal font-sans select-none">
                        *Hỗ trợ 1–8 chữ số tùy ý từ 0–9
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3.5 mt-1 select-none">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1 flex justify-between">
                          <span>↔ Giãn Ngang</span>
                          <span className="text-[#159BAD] font-bold">x{(settings.numberScaleX || 1.0).toFixed(1)}</span>
                        </label>
                        <input
                          type="range"
                          min="0.5"
                          max="2.0"
                          step="0.1"
                          className="w-full accent-[#159BAD] cursor-pointer h-1.5 bg-slate-100 rounded-lg appearance-none"
                          value={settings.numberScaleX || 1.0}
                          onChange={(e) => setSettings({ numberScaleX: parseFloat(e.target.value) })}
                        />
                        <div className="flex justify-between text-[8px] text-slate-400 px-0.5 mt-0.5 font-mono">
                          <span>0.5x</span><span>1.0x</span><span>2.0x</span>
                        </div>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1 flex justify-between">
                          <span>↕ Giãn Dọc</span>
                          <span className="text-[#159BAD] font-bold">x{(settings.numberScaleY || 1.0).toFixed(1)}</span>
                        </label>
                        <input
                          type="range"
                          min="0.5"
                          max="2.0"
                          step="0.1"
                          className="w-full accent-[#159BAD] cursor-pointer h-1.5 bg-slate-100 rounded-lg appearance-none"
                          value={settings.numberScaleY || 1.0}
                          onChange={(e) => setSettings({ numberScaleY: parseFloat(e.target.value) })}
                        />
                        <div className="flex justify-between text-[8px] text-slate-400 px-0.5 mt-0.5 font-mono">
                          <span>0.5x</span><span>1.0x</span><span>2.0x</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : settings.puzzleType === 'math_maze' ? (
                  <div className="flex flex-col gap-3">
                    {/* Rows x Cols Configuration */}
                    <div className="grid grid-cols-2 gap-3.5 select-none">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1 flex justify-between">
                          <span>↔ Số Cột (Cols)</span>
                          <span className="text-orange-600 font-bold">{settings.mazeCols || 5}</span>
                        </label>
                        <select
                          className="w-full text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl p-2 focus:outline-none focus:ring-2 focus:ring-orange-500 cursor-pointer text-slate-700 font-sans"
                          value={settings.mazeCols || 5}
                          onChange={(e) => setSettings({ mazeCols: parseInt(e.target.value) })}
                        >
                          <option value={3}>3 Cột</option>
                          <option value={4}>4 Cột</option>
                          <option value={5}>5 Cột</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1 flex justify-between">
                          <span>↕ Số Hàng (Rows)</span>
                          <span className="text-orange-600 font-bold">{settings.mazeRows || 4}</span>
                        </label>
                        <select
                          className="w-full text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl p-2 focus:outline-none focus:ring-2 focus:ring-orange-500 cursor-pointer text-slate-700 font-sans"
                          value={settings.mazeRows || 4}
                          onChange={(e) => setSettings({ mazeRows: parseInt(e.target.value) })}
                        >
                          <option value={3}>3 Hàng</option>
                          <option value={4}>4 Hàng</option>
                          <option value={5}>5 Hàng</option>
                        </select>
                      </div>
                    </div>

                    {/* Decorator Selector */}
                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5 flex items-center gap-1">
                        🖼️ Phong Cách Mê Cung
                      </label>
                      <select
                        className="w-full text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl p-2 focus:outline-none focus:ring-2 focus:ring-orange-500 cursor-pointer text-slate-700 font-sans"
                        value={settings.mazeStyle || 'animal_cartoon'}
                        onChange={(e) => setSettings({ mazeStyle: e.target.value as any })}
                      >
                        <option value="animal_cartoon">🦖 Hoạt hình động vật dễ thương</option>
                        <option value="classic">🔳 Cổ điển tối giản (in tiết kiệm)</option>
                      </select>
                    </div>

                    {/* Diagonal Path Config */}
                    <div className="mt-1 bg-orange-50/40 border border-orange-100/50 p-2.5 rounded-xl">
                      <label className="flex items-center gap-2 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={settings.allowDiagonal || false}
                          onChange={(e) => setSettings({ allowDiagonal: e.target.checked })}
                          className="w-4 h-4 text-orange-600 border-slate-350 rounded focus:ring-orange-500 cursor-pointer"
                        />
                        <span className="text-xs font-bold text-slate-700">🧭 Đi chéo (Diagonal Path)</span>
                      </label>
                      <p className="text-[10px] text-slate-500 font-sans mt-0.5 ml-6 leading-relaxed">
                        Hỗ trợ di chuyển 8 hướng (ngang, dọc, chéo) kết hợp liên kết chữ X đối xứng.
                      </p>
                    </div>
                  </div>
                ) : settings.puzzleType === 'bingo' ? (
                  <div className="flex flex-col gap-3">
                    <div className="bg-purple-50 border border-purple-200 rounded-xl p-3">
                      <p className="text-[10px] font-bold text-purple-700 flex items-center gap-1 mb-1">🎯 Math Bingo</p>
                      <p className="text-[10px] text-slate-500 font-sans">GV đọc câu hỏi → HS gạch đáp án trên phiếu → Đủ hàng/cột/chéo → BINGO!</p>
                    </div>
                    <div className="grid grid-cols-2 gap-3.5 select-none">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1 flex justify-between">
                          <span>↔ Số Cột</span>
                          <span className="text-purple-600 font-bold">{settings.bingoCols || 5}</span>
                        </label>
                        <select
                          className="w-full text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl p-2 focus:outline-none focus:ring-2 focus:ring-purple-500 cursor-pointer text-slate-700 font-sans"
                          value={settings.bingoCols || 5}
                          onChange={(e) => setSettings({ bingoCols: parseInt(e.target.value) })}
                        >
                          <option value={3}>3 Cột (3×3)</option>
                          <option value={4}>4 Cột (4×4)</option>
                          <option value={5}>5 Cột (5×5)</option>
                          <option value={6}>6 Cột (6×6)</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1 flex justify-between">
                          <span>↕ Số Hàng</span>
                          <span className="text-purple-600 font-bold">{settings.bingoRows || 5}</span>
                        </label>
                        <select
                          className="w-full text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl p-2 focus:outline-none focus:ring-2 focus:ring-purple-500 cursor-pointer text-slate-700 font-sans"
                          value={settings.bingoRows || 5}
                          onChange={(e) => setSettings({ bingoRows: parseInt(e.target.value) })}
                        >
                          <option value={3}>3 Hàng (3×3)</option>
                          <option value={4}>4 Hàng (4×4)</option>
                          <option value={5}>5 Hàng (5×5)</option>
                          <option value={6}>6 Hàng (6×6)</option>
                        </select>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-800">
                    <p className="text-[10px] text-slate-500 font-bold font-sans">
                      📐 Số cột ghép Jigsaw tự động:
                    </p>
                    <p className="text-[10px] text-slate-400 mt-1 font-sans">
                      ≤4 câu → <strong>2 cột</strong> · ≤9 câu → <strong>3 cột</strong> · &gt;9 câu → <strong>4 cột</strong>
                    </p>
                    <p className="text-[10px] text-emerald-600 font-bold mt-1 font-sans">
                      Hiện tại: {pairs.length <= 4 ? 2 : pairs.length <= 9 ? 3 : 4} cột ({pairs.length} câu)
                    </p>
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
                    onChange={(e) => setSettings({ pieceSize: parseFloat(e.target.value) })}
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
                      className="w-4.5 h-4.5 accent-[#F54B32] rounded cursor-pointer"
                      checked={settings.showDoodleIcons}
                      onChange={(e) => setSettings({ showDoodleIcons: e.target.checked })}
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
                      onChange={(e) => setSettings({ saveInk: e.target.checked })}
                    />
                    <div>
                      <span className="text-xs font-bold text-indigo-700 block flex items-center gap-1">
                        🖨️ In tiết kiệm mực (Trắng - Đen)
                      </span>
                      <span className="text-[10px] text-slate-400 block -mt-0.5 font-sans">Lược bỏ màu nền để tránh hút mực khi in ra giấy</span>
                    </div>
                  </label>
                </div>
              </div>
            </div>

            {/* 3. KIỂU CHỮ — Font & Cỡ chữ */}
            <div className="bg-white rounded-2xl p-3 sm:p-3.5 shadow-[0_8px_30px_rgb(0,0,0,0.03)] border border-slate-200/80 mt-3.5">
              <h2 className="text-sm font-bold text-[#2F2A40] flex items-center gap-2 mb-3 border-b border-dashed border-slate-100 pb-2">
                <span className="w-2 h-5 rounded-full bg-violet-500 inline-block" />
                3. Kiểu Chữ &amp; Cỡ Chữ
              </h2>
              <div className="flex flex-col gap-3 text-slate-700">
                {/* FontControls full version */}
                <FontControlsSidebar />
              </div>
            </div>

            {/* 4. KỊCH BẢN THỰC TẾ TÍCH HỢP AI */}
            {settings.puzzleType === 'domino' && (
              <div className="bg-white rounded-2xl p-3 sm:p-3.5 shadow-[0_8px_30px_rgb(0,0,0,0.03)] border border-slate-200/80 mt-3.5">
                <h2 className="text-sm font-bold text-[#2F2A40] flex items-center gap-2 mb-3 border-b border-dashed border-slate-100 pb-2">
                  <span className="w-2 h-5 rounded-full bg-emerald-500 inline-block" />
                  3. Kịch Bản Thực Tế & Quy Trình AI
                </h2>

                <div className="flex flex-col gap-3 select-none">
                  {/* Bật/Tắt tính năng */}
                  <div className="flex items-center justify-between py-1">
                    <div>
                      <span className="text-xs font-bold text-slate-700 block">Kích hoạt kịch bản thực tế</span>
                      <span className="text-[10px] text-slate-400 block -mt-0.5">Mở khóa quy trình khi ghép Domino đúng</span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={settings.hasScenario === true} 
                        onChange={(e) => setSettings({ hasScenario: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-350 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500"></div>
                    </label>
                  </div>

                  {settings.hasScenario && (
                    <div className="flex flex-col gap-3 border-t border-slate-100 pt-3 animate-fade-in">
                      {/* Tiêu đề kịch bản */}
                      <div>
                        <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1">
                          Tên Kịch Bản Thực Tế
                        </label>
                        <input
                          type="text"
                          className="w-full text-xs font-semibold px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-700"
                          value={settings.scenarioTitle || ''}
                          onChange={(e) => setSettings({ scenarioTitle: e.target.value })}
                          placeholder="Ví dụ: Quy trình phanh ABS xe ô tô"
                        />
                      </div>

                      {/* Công cụ sinh AI */}
                      <div className="bg-emerald-50/40 border border-emerald-100/50 p-2.5 rounded-xl">
                        <label className="block text-[11px] font-bold text-emerald-800 uppercase tracking-wide mb-1 flex items-center gap-1">
                          <Sparkles size={12} className="text-emerald-500" /> Tạo Kịch Bản Tự Động Với AI
                        </label>
                        <p className="text-[10px] text-slate-500 font-sans mb-2 leading-relaxed">
                          AI sẽ tự sinh công thức nâng cao kèm ứng dụng thực tiễn của chúng.
                        </p>
                        
                        <div className="flex flex-col gap-2">
                          <input
                            type="text"
                            className="w-full text-xs font-medium px-3 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-750"
                            value={aiTopic}
                            onChange={(e) => setAiTopic(e.target.value)}
                            placeholder="Nhập chủ đề (VD: Lực hướng tâm và thiết kế đường đua F1)..."
                            disabled={isGeneratingScenario}
                          />
                          <button
                            type="button"
                            onClick={handleGenerateScenario}
                            disabled={isGeneratingScenario || !aiTopic.trim()}
                            className={`w-full py-2 px-3 rounded-xl text-xs font-bold text-white transition-all flex items-center justify-center gap-1.5 shadow-sm cursor-pointer ${
                              isGeneratingScenario || !aiTopic.trim()
                                ? 'bg-slate-350 cursor-not-allowed'
                                : 'bg-emerald-500 hover:bg-emerald-600 active:scale-98'
                            }`}
                          >
                            {isGeneratingScenario ? (
                              <>
                                <span className="animate-spin inline-block w-3 h-3 border-2 border-white border-t-transparent rounded-full mr-1" />
                                Đang tạo kịch bản...
                              </>
                            ) : (
                              <>
                                <Sparkles size={14} />
                                Sinh kịch bản và câu hỏi
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

          </section>
        )}

        {/* RIGHT COLUMN: PREVIEW PANEL */}
        <section className={`${isSidebarCollapsed ? 'lg:col-span-12' : 'lg:col-span-8'} flex flex-col gap-3.5 w-full relative transition-all duration-300`}>
          <PrintPreview onStartProjection={() => {
            setShowProjection(true);
            setProjectionIndex(0);
          }} />
          {activeTab === 'questions' ? (
            <QuestionEditor />
          ) : (
            <PreviewWorkspace />
          )}
        </section>

      </main>

      {/* FOOTER */}
      <footer className="no-print bg-[#2F2A40]/5 py-4 text-center border-t border-slate-200 text-xs text-slate-500 mt-12">
        <p>© 2026 Canva School Jigsaw Puzzle Applet • Tùy biến thông minh cho giáo viên học đường</p>
      </footer>

      {/* MODALS */}
      <JsonModal />
      <PublishModal />

      {/* TRÌNH CHIẾU SCREEN MODAL FOR TV/BOARD */}
      {showProjection && pairs.length > 0 && (
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
          {(() => {
            const pair = pairs[projectionIndex];
            if (!pair) return null;
            return (
              <div className="flex-grow flex flex-col justify-between max-w-5xl w-full mx-auto">
                <div className="text-center text-xs font-extrabold text-slate-400 tracking-wider uppercase">
                  CẶP GHÉP #{projectionIndex + 1} TRÊN TỔNG SỐ {pairs.length}
                </div>

                {/* Giant Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full my-auto items-center justify-center py-6">
                  {/* Question card */}
                  <div className="bg-gradient-to-br from-blue-900/40 to-blue-950/80 rounded-3xl p-8 border-2 border-blue-500/30 flex flex-col justify-between min-h-[320px] shadow-2xl relative overflow-hidden group text-slate-200">
                    <div className="absolute top-0 left-0 w-24 h-24 bg-blue-500/5 rounded-br-full pointer-events-none flex items-center justify-center" />
                    <span className="text-xs uppercase font-extrabold tracking-widest text-blue-400 mb-4 block">
                      🏷️ CÂU HỎI #{projectionIndex + 1}
                    </span>
                    <div className="flex-grow flex items-center justify-center text-center w-full">
                      <MathJaxWrapper
                        text={pair.question}
                        className="font-extrabold tracking-tight leading-snug text-white w-full text-center"
                        style={{
                          fontSize: `${calculateDynamicFontSize(pair.question, 30, 20, 48)}px`
                        }}
                      />
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
                  <p className="text-center text-[10px] text-slate-400 mt-2 font-sans">
                    *Sử dụng chuột click hoặc nhấn các phím mũi tên Trái/Phải (← / →) trên bàn phím để chuyển thẻ nhanh.
                  </p>
                </div>
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
};
