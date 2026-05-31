import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useUIStore } from '../../stores/uiStore';

export const PublishModal: React.FC = () => {
  const navigate = useNavigate();
  const {
    showPublishModal,
    setShowPublishModal,
    publishedPin,
    isLocalPublish,
    showFlashMessage,
  } = useUIStore();

  if (!showPublishModal) return null;

  const shareUrl = `${window.location.origin}/play/${publishedPin}`;

  const handleCopyLink = () => {
    const input = document.getElementById('share-link-input') as HTMLInputElement;
    if (input) {
      input.select();
      navigator.clipboard.writeText(input.value);
      showFlashMessage('Đã sao chép liên kết chia sẻ!', 'success');
    }
  };

  const handlePlayDemo = () => {
    setShowPublishModal(false);
    navigate(`/play/${publishedPin}`);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4 backdrop-blur-xs animate-fade-in">
      <div className="bg-[#13112E] border border-indigo-900/60 rounded-3xl p-6 max-w-md w-full shadow-2xl relative text-center text-slate-200">
        <span className="text-4xl block mb-2 animate-bounce">☁️</span>
        <h3 className="text-lg font-bold text-white mb-1 uppercase tracking-wide">
          Xuất bản Cloud thành công!
        </h3>
        <p className="text-xs text-slate-400 mb-6 leading-relaxed">
          {isLocalPublish
            ? 'Đã lưu game cục bộ (Chế độ offline). Bạn có thể chia sẻ mã PIN cho học sinh chơi chung máy tính.'
            : 'Game của bạn đã được tải lên máy chủ lưu trữ trực tuyến đám mây thành công!'}
        </p>

        <div className="bg-slate-950 p-4 rounded-2xl border border-indigo-950 mb-5">
          <span className="text-[10px] text-slate-400 block uppercase font-bold tracking-wider mb-1">MÃ PIN CỦA BẠN</span>
          <span className="text-3xl font-extrabold text-yellow-400 font-mono tracking-widest">{publishedPin}</span>
        </div>

        <div className="mb-6 text-left">
          <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Đường dẫn chơi game (Chia sẻ trực tiếp)</label>
          <div className="flex gap-2">
            <input
              type="text"
              readOnly
              value={shareUrl}
              className="flex-1 bg-slate-900 border border-indigo-950 text-xs rounded-xl p-2.5 font-mono text-slate-300 focus:outline-none"
              id="share-link-input"
            />
            <button
              onClick={handleCopyLink}
              className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition-all cursor-pointer shadow-md"
            >
              Sao chép
            </button>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setShowPublishModal(false)}
            className="flex-1 px-4 py-2.5 bg-slate-900 hover:bg-slate-850 border border-slate-850 font-bold rounded-xl text-slate-300 transition-all cursor-pointer text-xs"
          >
            Đóng lại
          </button>
          <button
            type="button"
            onClick={handlePlayDemo}
            className="flex-1 px-4 py-2.5 bg-yellow-500 hover:bg-yellow-400 text-slate-950 font-extrabold rounded-xl transition-all cursor-pointer text-xs"
          >
            Chơi thử 🚀
          </button>
        </div>
      </div>
    </div>
  );
};
