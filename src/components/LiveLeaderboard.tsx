import React, { useEffect, useState, useMemo } from 'react';
import { Trophy, RefreshCw, X, Users, Timer, ShieldAlert, Award } from 'lucide-react';
import { loadSessionProgress, SessionTeams, TeamProgress, listenToSessionRealtime } from '../firebaseService';

interface LiveLeaderboardProps {
  pin: string;
  gameTitle: string;
  onClose: () => void;
}

export const LiveLeaderboard: React.FC<LiveLeaderboardProps> = ({ pin, gameTitle, onClose }) => {
  const [teams, setTeams] = useState<SessionTeams>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string>('');

  useEffect(() => {
    // 1. Tải dữ liệu ban đầu
    const fetchInitial = async () => {
      try {
        const data = await loadSessionProgress(pin);
        setTeams(data);
        setLastUpdated(new Date().toLocaleTimeString());
        setError(null);
      } catch (e: any) {
        console.error('Error fetching initial leaderboard progress', e);
        setError('Lỗi kết nối đồng bộ dữ liệu ban đầu.');
      } finally {
        setLoading(false);
      }
    };

    fetchInitial();

    // 2. Lắng nghe cập nhật thời gian thực qua EventSource (SSE)
    const unsubscribe = listenToSessionRealtime(pin, (event) => {
      setLastUpdated(new Date().toLocaleTimeString());
      setError(null);

      // TH1: Ghi đè toàn bộ hoặc toàn bộ teams
      if (event.path === '/' && event.data) {
        setTeams(event.data.teams || {});
      } else if (event.path === '/teams' && event.data) {
        setTeams(event.data);
      } 
      // TH2: Cập nhật một đội cụ thể
      else {
        // Kiểm tra xem path có dạng: /teams/TeamName
        const teamMatch = event.path.match(/^\/teams\/([^/]+)$/);
        if (teamMatch && event.data) {
          const teamName = teamMatch[1];
          setTeams((prev) => ({
            ...prev,
            [teamName]: {
              ...prev[teamName],
              ...event.data,
            },
          }));
        } 
        // Kiểm tra xem path có dạng: /teams/TeamName/fieldName
        else {
          const fieldMatch = event.path.match(/^\/teams\/([^/]+)\/([^/]+)$/);
          if (fieldMatch && event.data !== undefined) {
            const teamName = fieldMatch[1];
            const field = fieldMatch[2];
            // Chỉ cập nhật các field của team progress
            if (['snappedCount', 'completed', 'completedTime', 'lastActive', 'totalPieces'].includes(field)) {
              setTeams((prev) => ({
                ...prev,
                [teamName]: {
                  ...prev[teamName],
                  [field]: event.data,
                },
              }));
            }
          }
        }
      }
    });

    return () => {
      unsubscribe();
    };
  }, [pin]);

  // Sắp xếp thứ hạng các đội
  const sortedTeams = useMemo(() => {
    const list = Object.entries(teams).map(([name, progress]) => {
      const p = progress as TeamProgress;
      return {
        name,
        snappedCount: p.snappedCount,
        totalPieces: p.totalPieces,
        completed: p.completed,
        completedTime: p.completedTime,
        lastActive: p.lastActive,
      };
    });

    return list.sort((a, b) => {
      // 1. Nếu cả hai đã hoàn thành -> xếp theo thời gian hoàn thành (ít thời gian hơn đứng trước)
      if (a.completed && b.completed) {
        return (a.completedTime ?? 999999) - (b.completedTime ?? 999999);
      }
      // 2. Nếu một đội hoàn thành -> đội hoàn thành đứng trước
      if (a.completed) return -1;
      if (b.completed) return 1;

      // 3. Nếu chưa hoàn thành -> xếp theo số mảnh đã snap (nhiều hơn đứng trước)
      return b.snappedCount - a.snappedCount;
    });
  }, [teams]);

  // Định dạng thời gian hoàn thành (ví dụ: 45.2s -> 45 giây)
  const formatTime = (seconds: number | null): string => {
    if (seconds === null) return '--';
    if (seconds < 60) return `${seconds.toFixed(1)}s`;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs.toFixed(0)}s`;
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#0B081E] text-white flex flex-col p-6 animate-fade-in select-none">
      {/* HEADER BANNER */}
      <div className="flex justify-between items-center border-b border-indigo-950 pb-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-yellow-500/10 text-yellow-400 rounded-2xl flex items-center justify-center border border-yellow-500/20 shadow-md">
            <Trophy size={26} className="animate-pulse" />
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-extrabold tracking-tight text-white flex items-center gap-2">
              BẢNG XẾP HẠNG ĐUA TOP THỜI GIAN THỰC
              <span className="text-[9px] bg-red-500 text-white px-2 py-0.5 rounded-full font-bold uppercase tracking-wider animate-pulse">
                Multiplayer Live
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              Bài học: <span className="text-slate-200 font-bold">{gameTitle}</span> • Mã PIN Game: <span className="text-yellow-400 font-extrabold tracking-wider">{pin}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-[10px] text-slate-500 font-mono">Cập nhật: {lastUpdated || 'Đang tải...'}</span>
          <button
            onClick={onClose}
            className="bg-red-500/15 hover:bg-red-500/30 text-red-400 border border-red-950 text-xs font-bold px-4 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
          >
            <X size={14} /> Thoát Trình Chiếu
          </button>
        </div>
      </div>

      {/* BODY CONTENT GRID */}
      <div className="flex-grow grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        
        {/* LEADERBOARD CHÍNH (Cột rộng: 8/12) */}
        <div className="lg:col-span-8 bg-[#120F33] rounded-3xl border border-indigo-950/80 p-6 flex flex-col shadow-2xl relative overflow-hidden">
          <div className="flex justify-between items-center mb-4 pb-3 border-b border-indigo-950">
            <span className="text-xs font-bold text-indigo-400 flex items-center gap-1.5 uppercase tracking-wider">
              <Users size={14} /> Bảng Điểm Các Đội Nhóm ({sortedTeams.length} đội)
            </span>
            {error && (
              <span className="text-[10px] text-rose-400 font-semibold bg-rose-500/10 px-2.5 py-0.5 rounded-full border border-rose-950/20 flex items-center gap-1">
                <ShieldAlert size={10} /> {error}
              </span>
            )}
          </div>

          {loading && sortedTeams.length === 0 ? (
            <div className="flex-grow flex flex-col justify-center items-center py-20 text-slate-400">
              <RefreshCw className="animate-spin text-indigo-400 mb-3" size={32} />
              <span className="text-xs font-bold">Đang đồng bộ dữ liệu Cloud...</span>
            </div>
          ) : sortedTeams.length === 0 ? (
            <div className="flex-grow flex flex-col justify-center items-center py-20 text-slate-400 text-center">
              <span className="text-5xl mb-4 block">🏁</span>
              <p className="text-sm font-extrabold text-slate-300">Chưa có đội nào tham gia chơi!</p>
              <p className="text-[11px] text-slate-500 mt-1 max-w-sm">Học sinh quét mã QR hoặc truy cập link chia sẻ và nhập mã PIN để bắt đầu đua top.</p>
            </div>
          ) : (
            <div className="flex-grow flex flex-col gap-4 overflow-y-auto pr-1 max-h-[580px] custom-scrollbar">
              {sortedTeams.map((team, idx) => {
                const percentage = team.totalPieces > 0 ? (team.snappedCount / team.totalPieces) * 100 : 0;
                
                // Xác định màu sắc theo thứ hạng
                const isGold = idx === 0 && team.completed;
                const isSilver = idx === 1 && team.completed;
                const isBronze = idx === 2 && team.completed;

                return (
                  <div
                    key={team.name}
                    className={`p-4 rounded-2xl border transition-all flex flex-col gap-2.5 relative overflow-hidden ${
                      team.completed
                        ? 'bg-gradient-to-r from-emerald-950/20 to-slate-900/40 border-emerald-900/40'
                        : 'bg-slate-950/40 border-indigo-950/50'
                    }`}
                  >
                    {/* Rank Badge Indicator */}
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-3">
                        <span 
                          className={`w-7 h-7 rounded-full flex items-center justify-center font-extrabold text-xs font-mono border ${
                            idx === 0 ? 'bg-yellow-500 text-slate-950 border-yellow-400' :
                            idx === 1 ? 'bg-slate-300 text-slate-950 border-slate-200' :
                            idx === 2 ? 'bg-amber-600 text-white border-amber-500' : 'bg-slate-900 text-slate-400 border-slate-800'
                          }`}
                        >
                          {idx + 1}
                        </span>
                        
                        <span className="font-extrabold text-white text-sm sm:text-base tracking-tight flex items-center gap-1.5">
                          {team.name}
                          {isGold && <Award size={16} className="text-yellow-400 animate-bounce" />}
                          {isSilver && <Award size={16} className="text-slate-300" />}
                          {isBronze && <Award size={16} className="text-amber-600" />}
                        </span>
                      </div>

                      <div className="flex items-center gap-4 text-xs font-bold font-mono">
                        <span className="text-slate-400 flex items-center gap-1">
                          🧩 {team.snappedCount}/{team.totalPieces} mảnh
                        </span>
                        
                        {team.completed ? (
                          <span className="text-emerald-400 flex items-center gap-1 bg-emerald-500/10 px-2 py-0.5 rounded-lg border border-emerald-950/20">
                            <Timer size={12} /> {formatTime(team.completedTime)}
                          </span>
                        ) : (
                          <span className="text-indigo-400 animate-pulse">Đang chơi...</span>
                        )}
                      </div>
                    </div>

                    {/* Progress Bar Track */}
                    <div className="w-full h-3 bg-slate-950 rounded-full border border-indigo-950/50 overflow-hidden relative">
                      <div
                        className={`h-full rounded-full transition-all duration-1000 ${
                          team.completed
                            ? 'bg-gradient-to-r from-emerald-500 to-teal-400 shadow-md shadow-emerald-500/10'
                            : 'bg-gradient-to-r from-indigo-500 to-purple-400 shadow-md shadow-indigo-500/10'
                        }`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* THÔNG TIN HỌC SINH JOIN (Cột hẹp: 4/12) */}
        <div className="lg:col-span-4 flex flex-col gap-5 justify-between">
          {/* HƯỚNG DẪN DÀNH CHO HỌC SINH CARD */}
          <div className="bg-[#120F33] rounded-3xl border border-indigo-950/80 p-6 flex flex-col justify-center text-center shadow-xl flex-1 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-bl-full pointer-events-none" />
            
            <div className="text-5xl block mb-4 animate-bounce">📱</div>
            <h3 className="text-base font-extrabold text-white mb-2 uppercase tracking-wide">LÀM THẾ NÀO ĐỂ THAM GIA?</h3>
            
            <p className="text-xs text-slate-400 leading-relaxed mb-6">
              Học sinh truy cập vào đường dẫn chơi game bằng máy tính hoặc quét mã PIN bên dưới trên máy tính bảng/điện thoại di động để bắt đầu giải đố.
            </p>

            <div className="bg-slate-950 p-4 rounded-2xl border border-indigo-950/80 shadow-inner mb-4">
              <span className="text-[10px] text-slate-400 block uppercase font-bold tracking-wider mb-1.5">Trang chủ học sinh chơi game</span>
              <span className="text-xs font-bold text-indigo-400 font-mono tracking-wide">
                {window.location.origin}/?mode=play
              </span>
            </div>

            <div className="bg-slate-950 p-5 rounded-2xl border border-indigo-950/80 shadow-inner">
              <span className="text-[10px] text-slate-400 block uppercase font-bold tracking-wider mb-1.5">NHẬP MÃ PIN GAME</span>
              <span className="text-4xl font-black text-yellow-400 font-mono tracking-widest">{pin}</span>
            </div>
          </div>
          
          {/* MOTIVATION / CHAMPION PANEL */}
          {sortedTeams.length > 0 && sortedTeams[0].completed && (
            <div className="bg-gradient-to-br from-yellow-500/10 to-[#120F33] rounded-3xl border border-yellow-500/20 p-5 text-center shadow-lg relative overflow-hidden">
              <span className="text-3xl block mb-1">👑</span>
              <h4 className="text-xs font-bold text-yellow-400 uppercase tracking-widest mb-1">ĐỘI DẪN ĐẦU CHIẾN THẮNG</h4>
              <p className="text-base font-extrabold text-white">{sortedTeams[0].name}</p>
              <p className="text-[11px] text-slate-400 mt-1 font-mono">Thời gian hoàn thành: {formatTime(sortedTeams[0].completedTime)}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
