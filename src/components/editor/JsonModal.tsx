import React from 'react';
import { Info } from 'lucide-react';
import { useUIStore } from '../../stores/uiStore';
import { useEditorStore } from '../../stores/editorStore';

export const JsonModal: React.FC = () => {
  const {
    showJsonModal,
    setShowJsonModal,
    jsonInput,
    setJsonInput,
    jsonError,
    setJsonError,
    showFlashMessage,
  } = useUIStore();

  const { setPairs, setSettings } = useEditorStore();

  if (!showJsonModal) return null;

  const handleImportJSON = () => {
    try {
      const parsed = JSON.parse(jsonInput);
      if (!parsed.pairs || !Array.isArray(parsed.pairs)) {
        throw new Error('Cấu trúc JSON thiếu mảng "pairs" hợp lệ.');
      }
      if (parsed.settings) {
        setSettings(parsed.settings);
      }
      setPairs(parsed.pairs);
      setShowJsonModal(false);
      setJsonInput('');
      setJsonError('');
      showFlashMessage('Đã nhập dữ liệu từ file cấu hình JSON thành công!', 'success');
    } catch (err: any) {
      setJsonError(err.message || 'Lỗi cú pháp JSON không hợp lệ. Vui lòng kiểm tra kỹ.');
    }
  };

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
        pieceSize: 1.1,
      },
      pairs: [
        { id: 'b1', question: 'Mã di truyền có tính thoái hóa nghĩa là?', answer: 'Nhiều bộ ba cùng mã hóa 1 axit amin', code: 'S1' },
        { id: 'b2', question: 'Quá trình nhân đôi ADN diễn ra ở pha nào?', answer: 'Pha S kì trung gian', code: 'S2' },
        { id: 'b3', question: 'Tác nhân hữu cơ chủ yếu gây đột biến gene?', answer: 'Chất 5-BU (5-Bromuracil)', code: 'S3' },
      ],
    };
    setJsonInput(JSON.stringify(mock, null, 2));
  };

  return (
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
          className="w-full h-56 p-3 text-xs font-mono bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#159BAD] mb-3 resize-none text-slate-700"
          value={jsonInput}
          onChange={(e) => setJsonInput(e.target.value)}
          placeholder="Nhập cấu trúc JSON tại đây..."
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
  );
};
