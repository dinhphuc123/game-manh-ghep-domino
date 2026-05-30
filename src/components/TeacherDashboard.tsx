import React, { useState, useEffect } from 'react';
import { BookOpen, Edit3, Trash2, Printer, Play, Trophy, Plus, ShieldAlert, Award, Calendar, FolderHeart } from 'lucide-react';
import { GameSettings, PuzzlePair } from '../types';

export interface SavedGame {
  id: string;
  title: string;
  subject: string;
  settings: GameSettings;
  pairs: PuzzlePair[];
  publishedPin: string | null;
  createdAt: string;
}

interface TeacherDashboardProps {
  onSelectGame: (game: SavedGame) => void;
  onEditGame: (game: SavedGame) => void;
  onDeleteGame: (id: string) => void;
  onCreateNewGame: () => void;
  onOpenLeaderboard: (pin: string, title: string) => void;
}

const LOCAL_DASHBOARD_KEY = 'canva_puzzle_teacher_games';

export const TeacherDashboard: React.FC<TeacherDashboardProps> = ({
  onSelectGame,
  onEditGame,
  onDeleteGame,
  onCreateNewGame,
  onOpenLeaderboard,
}) => {
  const [savedGames, setSavedGames] = useState<SavedGame[]>([]);

  // Tải danh sách game đã lưu
  useEffect(() => {
    const loadGames = () => {
      try {
        const raw = localStorage.getItem(LOCAL_DASHBOARD_KEY);
        if (raw) {
          setSavedGames(JSON.parse(raw));
        }
      } catch (e) {
        console.error('Error loading saved games', e);
      }
    };
    loadGames();
    
    // Lắng nghe sự kiện storage thay đổi để tự động reload
    window.addEventListener('storage', loadGames);
    return () => window.removeEventListener('storage', loadGames);
  }, []);

  return (
    <div className="min-h-screen bg-[#F4F7F9] flex flex-col font-sans text-slate-800 animate-fade-in pb-12">
      {/* Header Dashboard */}
      <div className="bg-[#2F2A40] text-white py-6 px-8 border-b-4 border-[#FFAE00] shadow-md">
        <div className="max-w-6xl w-full mx-auto flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-black flex items-center gap-2 text-white">
              📂 TRUNG TÂM QUẢN LÝ GIÁO ÁN
              <span className="text-[10px] bg-[#159BAD] text-white px-2 py-0.5 rounded-full font-bold">
                Teacher Panel
              </span>
            </h1>
            <p className="text-xs text-slate-350 mt-1">
              Quản lý các trò chơi ghép mảnh đã tạo, xem kết quả bảng xếp hạng của lớp hoặc in ấn học liệu.
            </p>
          </div>

          <button
            onClick={onCreateNewGame}
            className="flex items-center gap-2 bg-[#94BF52] hover:bg-[#70A627] text-white font-extrabold text-xs px-5 py-3 rounded-2xl transition-all shadow-md hover:shadow-lg cursor-pointer"
          >
            <Plus size={16} /> Thiết Kế Giáo Án Mới
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="flex-grow max-w-6xl w-full mx-auto p-6 flex flex-col">
        {savedGames.length === 0 ? (
          /* Trạng thái trống */
          <div className="flex-grow flex flex-col justify-center items-center py-24 bg-white rounded-3xl border border-slate-200 shadow-sm text-center">
            <div className="w-20 h-20 bg-indigo-50 text-indigo-400 rounded-3xl flex items-center justify-center mb-5 border border-indigo-100">
              <FolderHeart size={36} />
            </div>
            <h3 className="text-lg font-bold text-slate-700">Chưa có giáo án nào được lưu!</h3>
            <p className="text-xs text-slate-400 mt-1.5 max-w-sm leading-relaxed">
              Bạn hãy bắt đầu bằng cách nhấn nút "Thiết kế giáo án mới" để tạo một game ghép hình tương tác học đường tuyệt đẹp cho lớp học của mình.
            </p>
          </div>
        ) : (
          /* Bảng danh sách */
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
            <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <BookOpen size={14} className="text-[#159BAD]" /> Danh sách game học liệu của bạn ({savedGames.length} giáo án)
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50 text-slate-500 font-extrabold uppercase text-[10px] tracking-wider">
                    <th className="py-4 px-6">Tên Giáo Án & Chủ Đề</th>
                    <th className="py-4 px-6">Môn Học</th>
                    <th className="py-4 px-6">Loại Game</th>
                    <th className="py-4 px-6 text-center">Mã PIN Cloud</th>
                    <th className="py-4 px-6">Ngày Tạo</th>
                    <th className="py-4 px-6 text-right">Thao Tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                  {savedGames.map((game) => (
                    <tr key={game.id} className="hover:bg-slate-50/50 transition-colors">
                      {/* Tên Giáo Án */}
                      <td className="py-4 px-6">
                        <div className="font-extrabold text-slate-800 text-sm">{game.title}</div>
                        {game.settings.gradeClass && (
                          <div className="text-[10px] text-slate-400 mt-0.5">Lớp: {game.settings.gradeClass}</div>
                        )}
                      </td>

                      {/* Môn Học */}
                      <td className="py-4 px-6">
                        <span className="bg-slate-100 text-slate-600 px-2.5 py-1 rounded-lg font-bold">
                          {game.subject || 'Tổng hợp'}
                        </span>
                      </td>

                      {/* Loại Game */}
                      <td className="py-4 px-6">
                        <span className="text-slate-600 font-bold flex items-center gap-1">
                          {game.settings.puzzleType === 'tarsia' ? '📐 Tarsia' :
                           game.settings.puzzleType === 'number_jigsaw' ? '🔢 Ghép Số 3D' : '🧩 Jigsaw'}
                        </span>
                      </td>

                      {/* Mã PIN Cloud */}
                      <td className="py-4 px-6 text-center font-mono">
                        {game.publishedPin ? (
                          <span className="bg-yellow-50 text-yellow-800 border border-yellow-200/50 px-3 py-1 rounded-xl font-black text-sm tracking-wider shadow-xs">
                            {game.publishedPin}
                          </span>
                        ) : (
                          <span className="text-slate-400 italic">Chưa xuất bản</span>
                        )}
                      </td>

                      {/* Ngày Tạo */}
                      <td className="py-4 px-6 text-slate-400">
                        <div className="flex items-center gap-1">
                          <Calendar size={12} />
                          {new Date(game.createdAt).toLocaleDateString()}
                        </div>
                      </td>

                      {/* Thao Tác */}
                      <td className="py-4 px-6 text-right">
                        <div className="flex justify-end gap-1.5 items-center">
                          {/* Live Leaderboard nếu đã xuất bản */}
                          {game.publishedPin && (
                            <button
                              onClick={() => onOpenLeaderboard(game.publishedPin!, game.title)}
                              className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 p-2 rounded-xl border border-indigo-200/20 transition-all cursor-pointer"
                              title="Trình chiếu Đua Top Multiplayer"
                            >
                              <Trophy size={14} />
                            </button>
                          )}
                          
                          {/* Chỉnh sửa */}
                          <button
                            onClick={() => onEditGame(game)}
                            className="bg-sky-50 hover:bg-sky-100 text-sky-700 p-2 rounded-xl border border-sky-200/20 transition-all cursor-pointer"
                            title="Mở bảng chỉnh sửa giáo án"
                          >
                            <Edit3 size={14} />
                          </button>

                          {/* In nhanh */}
                          <button
                            onClick={() => onSelectGame(game)}
                            className="bg-slate-100 hover:bg-slate-200 text-slate-600 p-2 rounded-xl border border-slate-300/25 transition-all cursor-pointer"
                            title="Xem chi tiết và In ấn"
                          >
                            <Printer size={14} />
                          </button>

                          {/* Xóa */}
                          <button
                            onClick={() => {
                              if (window.confirm(`Bạn có chắc chắn muốn xóa giáo án "${game.title}" không?`)) {
                                onDeleteGame(game.id);
                              }
                            }}
                            className="bg-rose-50 hover:bg-rose-100 text-rose-600 p-2 rounded-xl border border-rose-200/20 transition-all cursor-pointer"
                            title="Xóa giáo án"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
