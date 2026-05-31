import React, { useState, useRef, useEffect } from 'react';
import { 
  X, Camera, Upload, RefreshCw, Check, Sparkles, 
  AlertTriangle, Play, HelpCircle, FileImage, Settings, Grid
} from 'lucide-react';
import { extractQuestionsFromImage, getAvailableGeminiModels } from '../../services/geminiService';
import { useGeminiConfigStore } from '../../stores/geminiConfigStore';
import { MathJaxWrapper } from '../MathJaxWrapper';

interface OcrImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (extractedPairs: { question: string; answer: string }[], appendMode: boolean) => void;
  requiredCount?: number;
}

export const OcrImportModal: React.FC<OcrImportModalProps> = ({ 
  isOpen, 
  onClose, 
  onImport,
  requiredCount = 9
}) => {
  const { 
    apiKey: geminiApiKey, 
    model: geminiModel,
    provider: aiProvider,
    openRouterApiKey,
    openRouterModel
  } = useGeminiConfigStore();

  // Media & Photo State
  const [useCamera, setUseCamera] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null); // Base64 data url
  const [dragActive, setDragActive] = useState(false);
  
  // Settings & Process State
  const [customPrompt, setCustomPrompt] = useState('');
  const [selectedModel, setSelectedModel] = useState(
    aiProvider === 'openrouter' 
      ? (openRouterModel || 'google/gemini-2.5-flash') 
      : (geminiModel || 'gemini-3.5-flash')
  );
  const [availableModels, setAvailableModels] = useState<string[]>([]);
  const [loadingModels, setLoadingModels] = useState(false);
  const [loadingExtract, setLoadingExtract] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  // Results Checklist State
  const [extractedPairs, setExtractedPairs] = useState<{ question: string; answer: string[] }[]>([]); // answer is key, but format helper
  const [checklist, setChecklist] = useState<{ question: string; answer: string; selected: boolean }[]>([]);
  const [appendMode, setAppendMode] = useState(true);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Tải danh sách model khả dụng khi mở modal
  useEffect(() => {
    if (isOpen) {
      if (aiProvider === 'gemini') {
        const fetchModels = async () => {
          setLoadingModels(true);
          try {
            const list = await getAvailableGeminiModels(geminiApiKey);
            if (list.length > 0) {
              setAvailableModels(list);
              if (!list.includes(selectedModel)) {
                // Tự chọn model đầu tiên khả dụng trong list
                const standardModels = ['gemini-3.5-flash', 'gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash'];
                const found = list.find(m => standardModels.includes(m)) || list[0];
                setSelectedModel(found);
              }
            }
          } catch (e) {
            console.error(e);
          } finally {
            setLoadingModels(false);
          }
        };
        fetchModels();
      } else {
        // OpenRouter models
        const list = [
          'google/gemini-2.5-flash',
          'google/gemini-2.0-flash-exp:free',
          'meta-llama/llama-3.1-8b-instruct:free',
          'google/gemini-1.5-flash'
        ];
        setAvailableModels(list);
        if (!list.includes(selectedModel)) {
          setSelectedModel(list[0]);
        }
      }
    }
  }, [isOpen, geminiApiKey, aiProvider]);

  // Quản lý webcam stream
  useEffect(() => {
    if (useCamera && isOpen) {
      navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } } 
      })
        .then((stream) => {
          setCameraStream(stream);
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
          }
        })
        .catch((err) => {
          console.error("Lỗi khi mở camera:", err);
          setErrorMsg("Không thể truy cập camera. Vui lòng kiểm tra quyền thiết bị hoặc chọn tải ảnh lên.");
          setUseCamera(false);
        });
    } else {
      stopCamera();
    }

    return () => {
      stopCamera();
    };
  }, [useCamera, isOpen]);

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach((track) => track.stop());
      setCameraStream(null);
    }
  };

  if (!isOpen) return null;

  // Xử lý Chụp ảnh từ camera stream
  const handleCapture = () => {
    if (videoRef.current) {
      const video = videoRef.current;
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      const ctx = canvas.getContext('2d');
      if (ctx) {
        // Lật ảnh theo trục Y nếu dùng camera trước (facingMode user)
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg');
        setCapturedImage(dataUrl);
        setUseCamera(false);
        stopCamera();
      }
    }
  };

  // Xử lý Chọn file từ máy tính
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      readAndSetImage(file);
    }
  };

  const readAndSetImage = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setErrorMsg("Vui lòng tải lên một tệp tin hình ảnh hợp lệ (PNG, JPG, JPEG).");
      return;
    }
    setErrorMsg(null);
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setCapturedImage(event.target.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  // Xử lý Kéo thả ảnh
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      readAndSetImage(file);
    }
  };

  // Xử lý Gửi ảnh lên Gemini API để trích xuất
  const handleExtract = async () => {
    if (!capturedImage) return;
    
    setLoadingExtract(true);
    setErrorMsg(null);

    const mimeType = capturedImage.startsWith('data:image/png') ? 'image/png' : 'image/jpeg';
    
    try {
      const pairs = await extractQuestionsFromImage(
        capturedImage,
        mimeType,
        customPrompt,
        geminiApiKey,
        selectedModel,
        aiProvider,
        openRouterApiKey,
        openRouterModel
      );

      if (pairs.length === 0) {
        setErrorMsg("AI không tìm thấy câu hỏi nào trong ảnh. Hãy thử chụp ảnh rõ nét hơn hoặc bổ sung mô tả hướng dẫn.");
      } else {
        // Khởi tạo checklist kết quả
        const initialChecklist = pairs.map((p, idx) => ({
          question: p.question,
          answer: p.answer,
          // Tự động tick chọn tối đa số lượng câu yêu cầu
          selected: idx < requiredCount
        }));
        setChecklist(initialChecklist);
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "Có lỗi xảy ra khi gọi Gemini API trích xuất ảnh.");
    } finally {
      setLoadingExtract(false);
    }
  };

  // Xác nhận Import câu hỏi vào QuestionEditor
  const handleImportConfirm = () => {
    const selectedPairs = checklist
      .filter((item) => item.selected)
      .map((item) => ({
        question: item.question,
        answer: item.answer
      }));

    if (selectedPairs.length === 0) {
      setErrorMsg("Vui lòng tích chọn ít nhất 1 câu hỏi để nạp vào game.");
      return;
    }

    onImport(selectedPairs, appendMode);
    handleResetAll();
    onClose();
  };

  const handleResetAll = () => {
    setCapturedImage(null);
    setUseCamera(false);
    setErrorMsg(null);
    setChecklist([]);
    setCustomPrompt('');
    stopCamera();
  };

  const selectedCount = checklist.filter(c => c.selected).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden text-slate-100 font-sans">
        
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-tr from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/10">
              <Camera className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-1.5 font-sans">
                🤖 AI Trích Xuất Giáo Án (Magic Import)
                <Sparkles className="w-4 h-4 text-amber-400 fill-amber-400 animate-pulse" />
              </h2>
              <p className="text-[10px] text-slate-400">Trích xuất câu hỏi và đáp án kèm công thức LaTeX từ hình ảnh bài tập giấy.</p>
            </div>
          </div>
          <button 
            onClick={() => { handleResetAll(); onClose(); }}
            className="p-2 text-slate-400 hover:text-white bg-slate-800/40 hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Error Banner */}
        {errorMsg && (
          <div className="bg-rose-500/10 border-b border-rose-500/20 px-6 py-3 text-xs font-semibold text-rose-400 flex items-center gap-2 animate-bounce">
            <AlertTriangle className="w-4.5 h-4.5 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Content Body */}
        <div className="flex-grow overflow-y-auto p-6 flex flex-col md:flex-row gap-6">
          
          {/* Cột 1: Nạp ảnh / Preview ảnh */}
          <div className="flex-1 flex flex-col gap-4">
            
            {/* Vùng nạp ảnh */}
            <div className="relative aspect-video w-full bg-slate-950 rounded-2xl border-2 border-dashed border-slate-800 overflow-hidden flex items-center justify-center">
              
              {/* 1. Đang mở Camera */}
              {useCamera && (
                <div className="w-full h-full relative">
                  <video 
                    ref={videoRef} 
                    autoPlay 
                    playsInline 
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-x-0 bottom-4 flex justify-center gap-4">
                    <button
                      onClick={handleCapture}
                      className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-indigo-600/25 transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <Camera className="w-4 h-4" />
                      Chụp hình
                    </button>
                    <button
                      onClick={() => setUseCamera(false)}
                      className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl transition-all cursor-pointer"
                    >
                      Hủy
                    </button>
                  </div>
                </div>
              )}

              {/* 2. Đã chụp/tải ảnh */}
              {!useCamera && capturedImage && (
                <div className="w-full h-full relative group">
                  <img 
                    src={capturedImage} 
                    alt="Captured preview" 
                    className="w-full h-full object-contain"
                  />
                  <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                    <button
                      onClick={() => setCapturedImage(null)}
                      className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-xl shadow-lg transition-all flex items-center gap-1 cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                      Xóa ảnh
                    </button>
                    <button
                      onClick={() => setUseCamera(true)}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-lg transition-all flex items-center gap-1 cursor-pointer"
                    >
                      <Camera className="w-3.5 h-3.5" />
                      Chụp lại
                    </button>
                  </div>
                </div>
              )}

              {/* 3. Trạng thái chờ nạp ảnh */}
              {!useCamera && !capturedImage && (
                <div 
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                  className={`w-full h-full flex flex-col items-center justify-center p-6 text-center transition-all ${
                    dragActive ? 'bg-indigo-600/5 border-indigo-500/40' : 'hover:bg-slate-900/40'
                  }`}
                >
                  <Upload className="w-10 h-10 text-slate-500 mb-3 animate-pulse" />
                  <p className="text-xs text-slate-350 font-bold mb-1">Kéo thả hình ảnh đề kiểm tra vào đây</p>
                  <p className="text-[10px] text-slate-500 mb-4">Hoặc</p>
                  
                  <div className="flex gap-3">
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="px-4 py-2 bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700/60 font-bold text-xs rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      Chọn file ảnh
                    </button>
                    <button
                      onClick={() => setUseCamera(true)}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-indigo-600/10 transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <Camera className="w-3.5 h-3.5" />
                      Chụp trực tiếp
                    </button>
                  </div>
                  
                  <input 
                    ref={fileInputRef}
                    type="file" 
                    accept="image/*" 
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </div>
              )}
            </div>

            {/* Hướng dẫn thêm cho AI */}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1.5 font-sans">
                💡 Yêu cầu bổ sung cho AI (Tùy chọn)
              </label>
              <textarea
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                placeholder="Ví dụ: Chỉ lấy các câu đạo hàm, bỏ qua câu hỏi hình vẽ, hoặc dịch sang tiếng Anh..."
                rows={3}
                className="w-full text-xs bg-slate-950/60 border border-slate-800 rounded-xl p-3 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-white placeholder-slate-700 resize-none font-sans"
              />
            </div>
          </div>

          {/* Cột 2: Cấu hình và Bảng Checklist Kết quả */}
          <div className="flex-1 flex flex-col border-t md:border-t-0 md:border-l border-slate-800 md:pl-6 pt-6 md:pt-0 max-h-[60vh] md:max-h-full">
            
            {/* Cấu hình Model trước khi chạy */}
            {checklist.length === 0 && (
              <div className="space-y-4 flex-1 flex flex-col justify-between">
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Settings className="w-4 h-4 text-slate-400" />
                    <span className="text-xs font-bold text-slate-300">Cấu hình mô hình Gemini AI</span>
                  </div>

                  <div className="bg-slate-950/40 p-4 rounded-2xl border border-slate-800/80 space-y-3">
                    <div>
                      <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wide mb-1">
                        Mô hình xử lý hình ảnh (Multimodal)
                      </label>
                      <select
                        value={selectedModel}
                        onChange={(e) => setSelectedModel(e.target.value)}
                        className="w-full text-xs bg-slate-950 border border-slate-800 rounded-xl p-2.5 focus:outline-none text-white disabled:opacity-50"
                        disabled={loadingModels || loadingExtract}
                      >
                        {availableModels.length > 0 ? (
                          availableModels.map(m => (
                            <option key={m} value={m}>{m}</option>
                          ))
                        ) : (
                          <>
                            <option value="gemini-3.5-flash">gemini-3.5-flash (Mặc định)</option>
                            <option value="gemini-2.0-flash">gemini-2.0-flash</option>
                            <option value="gemini-1.5-flash">gemini-1.5-flash</option>
                          </>
                        )}
                      </select>
                    </div>

                    <div className="text-[9px] text-slate-500 leading-normal leading-relaxed">
                      💡 Gemini-3.5-flash hoặc Gemini-2.0-flash là các mô hình khuyến nghị vì có tốc độ phân tích văn bản trong ảnh cực nhanh và giữ nguyên công thức toán học chuẩn LaTeX tốt nhất.
                    </div>
                  </div>
                </div>

                <button
                  disabled={loadingExtract || !capturedImage}
                  onClick={handleExtract}
                  className="w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:opacity-40 text-white text-xs font-bold rounded-xl transition-all cursor-pointer shadow-lg shadow-indigo-600/10 flex items-center justify-center gap-1.5"
                >
                  {loadingExtract ? (
                    <>
                      <RefreshCw className="w-4.5 h-4.5 animate-spin" />
                      AI đang quét đề và nhận diện LaTeX...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4.5 h-4.5 fill-white" />
                      Bắt đầu trích xuất bằng AI
                    </>
                  )}
                </button>
              </div>
            )}

            {/* Bảng Checklist hiển thị kết quả sau trích xuất */}
            {checklist.length > 0 && (
              <div className="flex flex-col h-full flex-1 justify-between gap-4">
                
                {/* Header Checklist */}
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <div className="text-xs font-bold text-slate-350 flex items-center gap-1">
                    🔍 Đã tìm thấy {checklist.length} câu hỏi
                  </div>
                  <div className={`text-xs font-bold px-2 py-0.5 rounded-lg border ${
                    selectedCount === requiredCount 
                      ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                      : 'bg-amber-500/10 border-amber-500/20 text-amber-400 animate-pulse'
                  }`}>
                    Đã chọn {selectedCount} / {requiredCount} câu
                  </div>
                </div>

                {/* List câu hỏi cuộn */}
                <div className="flex-1 overflow-y-auto max-h-[35vh] md:max-h-[40vh] space-y-2 pr-1 divide-y divide-slate-800/40">
                  {checklist.map((item, idx) => (
                    <div 
                      key={idx} 
                      onClick={() => {
                        const updated = [...checklist];
                        updated[idx].selected = !updated[idx].selected;
                        setChecklist(updated);
                      }}
                      className={`flex items-start gap-3 p-2.5 rounded-xl border transition-all cursor-pointer ${
                        item.selected 
                          ? 'bg-indigo-600/5 border-indigo-500/20 text-white' 
                          : 'bg-slate-950/20 border-transparent text-slate-400 hover:bg-slate-950/40'
                      }`}
                    >
                      <div className="mt-1 flex-shrink-0">
                        <div className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${
                          item.selected 
                            ? 'bg-indigo-600 border-indigo-500 text-white' 
                            : 'border-slate-700'
                        }`}>
                          {item.selected && <Check className="w-3 h-3 stroke-[3]" />}
                        </div>
                      </div>
                      
                      <div className="flex-1 text-xs space-y-1.5 min-w-0">
                        <div className="font-bold flex items-start gap-1">
                          <span className="text-slate-500 text-[10px] bg-slate-800 px-1 rounded">Q{idx + 1}</span>
                          <span className="break-words select-none notranslate" translate="no">
                            {item.question.includes('$') ? (
                              <MathJaxWrapper text={item.question} inline />
                            ) : (
                              item.question
                            )}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-400 flex items-start gap-1">
                          <span className="text-emerald-500/70 text-[10px] bg-emerald-500/5 border border-emerald-500/10 px-1 rounded">A</span>
                          <span className="break-words select-none notranslate" translate="no">
                            {item.answer.includes('$') ? (
                              <MathJaxWrapper text={item.answer} inline />
                            ) : (
                              item.answer
                            )}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Import options */}
                <div className="bg-slate-950/60 p-3 rounded-2xl border border-slate-800 space-y-3">
                  <div>
                    <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">
                      Chế độ nạp câu hỏi vào game
                    </label>
                    <div className="flex gap-4">
                      <label className="flex items-center gap-1.5 text-xs text-slate-300 font-medium cursor-pointer">
                        <input
                          type="radio"
                          name="importMode"
                          checked={appendMode}
                          onChange={() => setAppendMode(true)}
                          className="w-4 h-4 text-indigo-600 focus:ring-indigo-500 border-slate-800 bg-slate-900"
                        />
                        Nối tiếp vào cuối
                      </label>
                      <label className="flex items-center gap-1.5 text-xs text-slate-350 font-medium cursor-pointer">
                        <input
                          type="radio"
                          name="importMode"
                          checked={!appendMode}
                          onChange={() => setAppendMode(false)}
                          className="w-4 h-4 text-indigo-600 focus:ring-indigo-500 border-slate-800 bg-slate-900"
                        />
                        Ghi đè danh sách cũ
                      </label>
                    </div>
                  </div>

                  {selectedCount !== requiredCount && (
                    <div className="text-[10px] text-amber-400 flex items-center gap-1 font-semibold">
                      <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
                      <span>Số câu chọn ({selectedCount}) chưa bằng số mảnh của game ({requiredCount}).</span>
                    </div>
                  )}
                </div>

                {/* Footer Buttons */}
                <div className="flex gap-3">
                  <button
                    onClick={handleResetAll}
                    className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-750 border border-slate-700/60 text-slate-300 text-xs font-bold rounded-xl transition-all cursor-pointer"
                  >
                    Nạp ảnh khác
                  </button>
                  <button
                    onClick={handleImportConfirm}
                    disabled={selectedCount === 0}
                    className="flex-[2] py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition-all cursor-pointer shadow-lg shadow-emerald-600/15"
                  >
                    Xác nhận nạp {selectedCount} câu vào game
                  </button>
                </div>

              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  );
};
