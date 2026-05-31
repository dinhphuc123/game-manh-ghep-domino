import React, { useState, useEffect } from 'react';
import { 
  RefreshCw, Trash2, Edit3, Plus, Search, FileJson, 
  LogOut, Database, Users, CheckCircle2, Activity, Calendar,
  Sparkles, X, Check, AlertTriangle, Play, HelpCircle
} from 'lucide-react';
import { 
  adminLoadAllSessions, 
  adminDeleteSession, 
  adminLoadAllTemplates, 
  adminSaveTemplate, 
  adminDeleteTemplate 
} from '../../firebaseService';
import { useFirebaseConfigStore } from '../../stores/firebaseConfigStore';
import { MATH_SAMPLE_DATA, GEOGRAPHY_SAMPLE_DATA, ENGLISH_SAMPLE_DATA } from '../../sampleData';

interface AdminDashboardProps {
  onLogout: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onLogout }) => {
  const { projectId, setProjectId } = useFirebaseConfigStore();
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [tempProjectId, setTempProjectId] = useState(projectId);

  const [activeTab, setActiveTab] = useState<'sessions' | 'templates'>('sessions');
  const [sessions, setSessions] = useState<any[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Trạng thái cho Modals
  const [selectedSession, setSelectedSession] = useState<any | null>(null);
  const [jsonEditorData, setJsonEditorData] = useState<{ id: string; text: string; isNew: boolean } | null>(null);
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<{ type: 'session' | 'template'; id: string } | null>(null);

  // Tải dữ liệu ban đầu
  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'sessions') {
        const data = await adminLoadAllSessions();
        setSessions(data);
      } else {
        const data = await adminLoadAllTemplates();
        setTemplates(data);
      }
    } catch (e) {
      console.error('Error fetching admin data', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  // Xử lý Xóa Session
  const handleDeleteSession = async (pin: string) => {
    try {
      const success = await adminDeleteSession(pin);
      if (success) {
        setSessions((prev) => prev.filter((s) => s.pin !== pin));
        setConfirmDelete(null);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Xử lý Xóa Template
  const handleDeleteTemplate = async (id: string) => {
    try {
      const success = await adminDeleteTemplate(id);
      if (success) {
        setTemplates((prev) => prev.filter((t) => t.id !== id));
        setConfirmDelete(null);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Mở JSON Editor để sửa hoặc thêm mới
  const openJsonEditor = (template?: any) => {
    if (template) {
      setJsonEditorData({
        id: template.id,
        text: JSON.stringify(template.data, null, 2),
        isNew: false
      });
    } else {
      // JSON mẫu khi tạo mới
      const defaultJson = {
        settings: {
          title: "Bài Học Mẫu Mới",
          type: "tarsia",
          tarsiaShape: "triangle-12"
        },
        pairs: [
          { id: "1", type: "text", textVal: "Câu hỏi 1", matchVal: "Đáp án 1" },
          { id: "2", type: "text", textVal: "Câu hỏi 2", matchVal: "Đáp án 2" }
        ]
      };
      setJsonEditorData({
        id: 'template_' + Math.floor(1000 + Math.random() * 9000),
        text: JSON.stringify(defaultJson, null, 2),
        isNew: true
      });
    }
    setJsonError(null);
  };

  // Lưu JSON sau khi chỉnh sửa
  const handleSaveJson = async () => {
    if (!jsonEditorData) return;

    try {
      const parsedData = JSON.parse(jsonEditorData.text);
      if (!parsedData.settings || !parsedData.pairs) {
        setJsonError('Lỗi cấu trúc: Đối tượng JSON phải có các trường "settings" và "pairs".');
        return;
      }

      setLoading(true);
      const success = await adminSaveTemplate(jsonEditorData.id, parsedData);
      setLoading(false);
      
      if (success) {
        setJsonEditorData(null);
        fetchData();
      } else {
        setJsonError('Không thể lưu giáo án mẫu lên Cloud. Vui lòng kiểm tra lại kết nối.');
      }
    } catch (err: any) {
      setJsonError('JSON không hợp lệ: ' + err.message);
    }
  };

  // Nạp nhanh giáo án mẫu
  const handleCreateQuickTemplate = async (type: 'math' | 'geo' | 'eng') => {
    setLoading(true);
    let data: any = null;
    let id = '';
    if (type === 'math') {
      data = {
        settings: {
          title: 'Hàm số mũ và logarit',
          type: 'tarsia',
          tarsiaShape: 'triangle-12',
          subject: 'Toán học 12',
          gradeClass: 'Lớp 12',
          saveInk: false
        },
        pairs: MATH_SAMPLE_DATA
      };
      id = 'quick_math_12';
    } else if (type === 'geo') {
      data = {
        settings: {
          title: 'Địa lí Tự nhiên Việt Nam',
          type: 'domino',
          tarsiaShape: 'triangle-12',
          subject: 'Địa lí',
          gradeClass: 'Trung học',
          saveInk: false
        },
        pairs: GEOGRAPHY_SAMPLE_DATA
      };
      id = 'quick_geo_vietnam';
    } else if (type === 'eng') {
      data = {
        settings: {
          title: 'English Vocabulary Quiz',
          type: 'tarsia',
          tarsiaShape: 'triangle-12',
          subject: 'Tiếng Anh',
          gradeClass: 'Trung học',
          saveInk: false
        },
        pairs: ENGLISH_SAMPLE_DATA
      };
      id = 'quick_eng_vocab';
    }

    if (data) {
      try {
        const success = await adminSaveTemplate(id, data);
        if (success) {
          fetchData();
        } else {
          alert('Không thể lưu giáo án mẫu lên Cloud. Vui lòng kiểm tra lại kết nối.');
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
  };

  // Lọc Sessions theo truy vấn tìm kiếm
  const filteredSessions = sessions.filter((s) => {
    const pinMatch = s.pin.toLowerCase().includes(searchQuery.toLowerCase());
    const firstTeamName = s.teams ? Object.keys(s.teams).join(' ').toLowerCase() : '';
    return pinMatch || firstTeamName.includes(searchQuery.toLowerCase());
  });

  // Lọc Templates theo truy vấn tìm kiếm
  const filteredTemplates = templates.filter((t) => {
    const title = t.data?.settings?.title || '';
    const id = t.id || '';
    return title.toLowerCase().includes(searchQuery.toLowerCase()) || id.toLowerCase().includes(searchQuery.toLowerCase());
  });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Header bar */}
      <header className="bg-slate-900/60 backdrop-blur-md border-b border-slate-800/80 px-6 py-4 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-tr from-purple-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/20">
            <Database className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-white flex items-center gap-1.5">
              Admin Control Panel
              <Sparkles className="w-4 h-4 text-amber-400 fill-amber-400" />
            </h1>
            <p className="text-xs text-slate-400">Hệ thống quản lý Cloud của Game Mảnh Ghép</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-2 border-r border-slate-800 pr-4 mr-2">
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider font-sans">Project ID:</span>
            <span className="text-xs font-mono text-purple-400 font-bold bg-purple-500/5 px-2.5 py-1 rounded-xl border border-purple-500/10">
              {projectId || 'Chưa cấu hình'}
            </span>
            <button
              onClick={() => {
                setTempProjectId(projectId);
                setShowConfigModal(true);
              }}
              className="text-[10px] font-bold text-slate-400 hover:text-white hover:bg-slate-850 px-2 py-1 rounded-lg border border-slate-800 transition-colors cursor-pointer"
            >
              Thay đổi
            </button>
          </div>

          <button
            onClick={fetchData}
            disabled={loading}
            className="p-2 text-slate-400 hover:text-white bg-slate-800/60 hover:bg-slate-800 rounded-xl border border-slate-700/50 transition-colors disabled:opacity-50 cursor-pointer"
            title="Tải lại dữ liệu"
          >
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
          
          <button
            onClick={onLogout}
            className="flex items-center gap-2 text-rose-400 hover:text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 px-4 py-2 rounded-xl text-sm font-semibold transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            Đăng xuất
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 flex flex-col gap-6">
        
        {/* Navigation Tabs and Search */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/40 p-3 rounded-2xl border border-slate-800/60">
          <div className="flex items-center gap-2">
            <button
              onClick={() => { setActiveTab('sessions'); setSearchQuery(''); }}
              className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === 'sessions' 
                  ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/15' 
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <Activity className="w-4 h-4" />
              Phiên Chơi Đang Chạy ({sessions.length})
            </button>
            <button
              onClick={() => { setActiveTab('templates'); setSearchQuery(''); }}
              className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === 'templates' 
                  ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/15' 
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <FileJson className="w-4 h-4" />
              Bài Học Mẫu ({templates.length})
            </button>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative flex-1 md:w-64">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500">
                <Search className="w-4 h-4" />
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={activeTab === 'sessions' ? 'Tìm theo PIN hoặc Đội...' : 'Tìm theo Tên hoặc ID...'}
                className="w-full bg-slate-950 border border-slate-800 text-white text-sm rounded-xl py-2 pl-10 pr-4 focus:outline-none focus:border-purple-500 transition-colors"
              />
            </div>

            {activeTab === 'templates' && (
              <button
                onClick={() => openJsonEditor()}
                className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-4 py-2 rounded-xl text-sm transition-colors cursor-pointer shadow-lg shadow-indigo-600/10"
              >
                <Plus className="w-4 h-4" />
                Thêm Bài Mẫu
              </button>
            )}
          </div>
        </div>

        {/* Tab 1: Sessions list */}
        {activeTab === 'sessions' && (
          <div className="bg-slate-900/30 border border-slate-800/80 rounded-2xl overflow-hidden flex-1 shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-900/60 border-b border-slate-800 text-slate-400 text-xs font-semibold uppercase tracking-wider">
                    <th className="px-6 py-4">Mã PIN</th>
                    <th className="px-6 py-4">Số lượng Đội</th>
                    <th className="px-6 py-4">Thời gian khởi tạo</th>
                    <th className="px-6 py-4">Hành động</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {loading ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-12 text-center text-slate-500">
                        <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-purple-500" />
                        Đang tải dữ liệu phòng chơi...
                      </td>
                    </tr>
                  ) : filteredSessions.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-12 text-center text-slate-500">
                        Không tìm thấy phòng chơi nào.
                      </td>
                    </tr>
                  ) : (
                    filteredSessions.map((session) => {
                      const teamsList = session.teams ? Object.keys(session.teams) : [];
                      return (
                        <tr key={session.pin} className="hover:bg-slate-800/20 transition-colors">
                          <td className="px-6 py-4">
                            <span className="text-xl font-black text-indigo-400 tracking-wider font-mono">
                              {session.pin}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            {teamsList.length > 0 ? (
                              <button
                                onClick={() => setSelectedSession(session)}
                                className="flex items-center gap-1.5 px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700/60 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                              >
                                <Users className="w-3.5 h-3.5" />
                                {teamsList.length} đội
                              </button>
                            ) : (
                              <span className="text-xs text-slate-500">Chưa có đội đăng ký</span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-sm text-slate-400 flex items-center gap-1.5 mt-1.5">
                            <Calendar className="w-4 h-4 text-slate-500" />
                            {new Date(session.createdAt).toLocaleString('vi-VN')}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => setSelectedSession(session)}
                                className="p-2 text-indigo-400 hover:text-white bg-indigo-500/10 hover:bg-indigo-500/30 rounded-lg transition-all cursor-pointer"
                                title="Xem chi tiết"
                              >
                                <HelpCircle className="w-4.5 h-4.5" />
                              </button>
                              <button
                                onClick={() => setConfirmDelete({ type: 'session', id: session.pin })}
                                className="p-2 text-rose-400 hover:text-white bg-rose-500/10 hover:bg-rose-500/30 rounded-lg transition-all cursor-pointer"
                                title="Xóa phòng chơi"
                              >
                                <Trash2 className="w-4.5 h-4.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 2: Templates list */}
        {activeTab === 'templates' && (
          <div className="flex flex-col gap-4 flex-1">
            {/* Nạp bài mẫu nhanh */}
            <div className="bg-slate-900/40 border border-slate-800/60 p-5 rounded-3xl flex flex-col md:flex-row md:items-center justify-between gap-4 backdrop-blur-xl">
              <div>
                <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-amber-400 fill-amber-400" />
                  Nạp nhanh giáo án mẫu hệ thống
                </h4>
                <p className="text-xs text-slate-400 mt-0.5">Tự động khởi tạo và đồng bộ các bài mẫu chuẩn lên Cloud Firestore.</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => handleCreateQuickTemplate('math')}
                  disabled={loading}
                  className="bg-slate-850 hover:bg-[#159BAD]/10 hover:text-[#159BAD] border border-slate-800 hover:border-[#159BAD]/20 px-4 py-2 rounded-xl text-xs font-bold text-slate-350 transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                >
                  📐 Toán 12
                </button>
                <button
                  onClick={() => handleCreateQuickTemplate('geo')}
                  disabled={loading}
                  className="bg-slate-850 hover:bg-[#94BF52]/10 hover:text-[#94BF52] border border-slate-800 hover:border-[#94BF52]/20 px-4 py-2 rounded-xl text-xs font-bold text-slate-350 transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                >
                  🗺️ Địa lí
                </button>
                <button
                  onClick={() => handleCreateQuickTemplate('eng')}
                  disabled={loading}
                  className="bg-slate-850 hover:bg-[#F54B32]/10 hover:text-[#F54B32] border border-slate-800 hover:border-[#F54B32]/20 px-4 py-2 rounded-xl text-xs font-bold text-slate-350 transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                >
                  🇬🇧 Anh văn
                </button>
              </div>
            </div>

            <div className="bg-slate-900/30 border border-slate-800/80 rounded-2xl overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-900/60 border-b border-slate-800 text-slate-400 text-xs font-semibold uppercase tracking-wider">
                      <th className="px-6 py-4">Tên bài học mẫu</th>
                      <th className="px-6 py-4">Dạng game</th>
                      <th className="px-6 py-4">Số lượng mảnh ghép</th>
                      <th className="px-6 py-4">ID tài liệu</th>
                      <th className="px-6 py-4">Hành động</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/50">
                    {loading ? (
                      <tr>
                        <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                          <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-purple-500" />
                          Đang tải danh sách bài học mẫu...
                        </td>
                      </tr>
                    ) : filteredTemplates.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                          Không tìm thấy bài học mẫu nào.
                        </td>
                      </tr>
                    ) : (
                      filteredTemplates.map((template) => {
                        const settings = template.data?.settings;
                        const pairs = template.data?.pairs || [];
                        return (
                          <tr key={template.id} className="hover:bg-slate-800/20 transition-colors">
                            <td className="px-6 py-4">
                              <div className="font-semibold text-white">{settings?.title || 'Chưa đặt tên'}</div>
                              <div className="text-xs text-slate-500">Tạo ngày: {new Date(template.createdAt).toLocaleDateString('vi-VN')}</div>
                            </td>
                            <td className="px-6 py-4">
                              <span className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase ${
                                settings?.type === 'domino' 
                                  ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' 
                                  : 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                              }`}>
                                {settings?.type || 'tarsia'}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-sm text-slate-300">
                              {pairs.length} cặp ({settings?.tarsiaShape || 'chuẩn'})
                            </td>
                            <td className="px-6 py-4 text-xs font-mono text-slate-500">
                              {template.id}
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => openJsonEditor(template)}
                                  className="p-2 text-indigo-400 hover:text-white bg-indigo-500/10 hover:bg-indigo-500/30 rounded-lg transition-all cursor-pointer"
                                  title="Chỉnh sửa JSON"
                                >
                                  <Edit3 className="w-4.5 h-4.5" />
                                </button>
                                <button
                                  onClick={() => setConfirmDelete({ type: 'template', id: template.id })}
                                  className="p-2 text-rose-400 hover:text-white bg-rose-500/10 hover:bg-rose-500/30 rounded-lg transition-all cursor-pointer"
                                  title="Xóa bài học mẫu"
                                >
                                  <Trash2 className="w-4.5 h-4.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Modal 1: Chi tiết đội chơi của Session */}
      {selectedSession && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl relative">
            <div className="bg-slate-950 px-6 py-4 border-b border-slate-800/80 flex items-center justify-between">
              <h3 className="text-md font-bold text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-indigo-400" />
                Session PIN: <span className="font-mono text-indigo-300 font-black">{selectedSession.pin}</span>
              </h3>
              <button 
                onClick={() => setSelectedSession(null)}
                className="text-slate-400 hover:text-white p-1 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 max-h-[350px] overflow-y-auto space-y-4">
              {Object.keys(selectedSession.teams || {}).length === 0 ? (
                <div className="text-center text-slate-500 py-8">Không có đội nào tham gia phòng này.</div>
              ) : (
                Object.entries(selectedSession.teams).map(([teamName, tData]: [string, any]) => {
                  const percent = tData.totalPieces > 0 ? Math.round((tData.snappedCount / tData.totalPieces) * 100) : 0;
                  return (
                    <div key={teamName} className="bg-slate-950 p-4 rounded-2xl border border-slate-800/60 flex flex-col gap-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-white">{teamName}</span>
                        <span className="text-xs text-slate-400">Hoạt động: {tData.lastActive ? new Date(tData.lastActive).toLocaleTimeString() : 'N/A'}</span>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <div className="flex-1 bg-slate-800 h-2.5 rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full transition-all duration-500 ${
                              tData.completed ? 'bg-emerald-500' : 'bg-indigo-500'
                            }`}
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                        <span className="text-xs font-mono font-bold text-indigo-400 min-w-10 text-right">
                          {percent}%
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-xs text-slate-400 mt-1">
                        <span>Đã ghép: {tData.snappedCount}/{tData.totalPieces} mảnh</span>
                        {tData.completed && (
                          <span className="text-emerald-400 flex items-center gap-1 font-semibold">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Hoàn thành ({tData.completedTime}s)
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal 2: JSON Editor (Templates) */}
      {jsonEditorData && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl relative flex flex-col max-h-[85vh]">
            <div className="bg-slate-950 px-6 py-4 border-b border-slate-800/80 flex items-center justify-between flex-shrink-0">
              <h3 className="text-md font-bold text-white flex items-center gap-2">
                <FileJson className="w-5 h-5 text-purple-400" />
                {jsonEditorData.isNew ? 'Thêm Giáo Án Mẫu Mới' : `Sửa JSON: ${jsonEditorData.id}`}
              </h3>
              <button 
                onClick={() => setJsonEditorData(null)}
                className="text-slate-400 hover:text-white p-1 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1 flex flex-col gap-4">
              {jsonEditorData.isNew && (
                <div className="space-y-1.5 flex-shrink-0">
                  <label className="text-xs text-slate-300 uppercase tracking-wider pl-1 font-semibold">
                    Định danh (ID tài liệu mẫu)
                  </label>
                  <input
                    type="text"
                    value={jsonEditorData.id}
                    onChange={(e) => setJsonEditorData((prev: any) => ({ ...prev, id: e.target.value.replace(/[^a-zA-Z0-9_-]/g, '') }))}
                    placeholder="ví dụ: domino_toan_lop_6"
                    className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl py-2 px-3 focus:outline-none focus:border-purple-500 text-sm font-mono"
                  />
                </div>
              )}

              <div className="flex-1 flex flex-col space-y-1.5 min-h-[300px]">
                <label className="text-xs text-slate-300 uppercase tracking-wider pl-1 font-semibold flex-shrink-0">
                  Nội dung JSON cấu hình
                </label>
                <textarea
                  value={jsonEditorData.text}
                  onChange={(e) => setJsonEditorData((prev: any) => ({ ...prev, text: e.target.value }))}
                  className="w-full flex-1 bg-slate-950 border border-slate-800 text-emerald-400 text-xs font-mono p-4 rounded-xl focus:outline-none focus:border-purple-500 resize-none min-h-[250px]"
                />
              </div>

              {jsonError && (
                <div className="bg-rose-500/10 border border-rose-500/20 p-4 rounded-xl flex items-start gap-2.5 text-rose-400 text-xs animate-shake">
                  <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span>{jsonError}</span>
                </div>
              )}
            </div>

            <div className="bg-slate-950/60 p-4 border-t border-slate-800/80 flex items-center justify-end gap-3 flex-shrink-0">
              <button
                onClick={() => setJsonEditorData(null)}
                className="px-4 py-2 hover:bg-slate-800 rounded-xl text-xs font-bold text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                onClick={handleSaveJson}
                disabled={loading}
                className="px-5 py-2.5 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 rounded-xl text-xs font-bold text-white flex items-center gap-1.5 transition-colors cursor-pointer shadow-lg shadow-purple-600/15"
              >
                {loading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                Lưu vào Cloud
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 3: Xác nhận xóa */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl p-6 flex flex-col items-center text-center">
            <div className="w-12 h-12 bg-rose-500/10 rounded-full flex items-center justify-center text-rose-400 border border-rose-500/20 mb-4">
              <AlertTriangle className="w-6 h-6 animate-bounce" />
            </div>
            
            <h3 className="text-md font-bold text-white mb-2">Bạn có chắc chắn muốn xóa?</h3>
            <p className="text-xs text-slate-400 mb-6 leading-relaxed">
              Hành động này sẽ xóa vĩnh viễn {confirmDelete.type === 'session' ? 'phòng chơi' : 'bài học mẫu'}{' '}
              <span className="font-mono text-rose-400 font-bold bg-rose-500/5 px-1.5 py-0.5 rounded border border-rose-500/10">
                {confirmDelete.id}
              </span>{' '}
              khỏi Cloud. Dữ liệu không thể khôi phục.
            </p>

            <div className="flex items-center gap-3 w-full">
              <button
                onClick={() => setConfirmDelete(null)}
                className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 rounded-xl text-xs font-bold text-slate-300 transition-colors cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                onClick={() => {
                  if (confirmDelete.type === 'session') {
                    handleDeleteSession(confirmDelete.id);
                  } else {
                    handleDeleteTemplate(confirmDelete.id);
                  }
                }}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-500 rounded-xl text-xs font-bold text-white transition-colors cursor-pointer shadow-lg shadow-rose-600/15"
              >
                Xác nhận Xóa
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal cấu hình Project ID */}
      {showConfigModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl p-6 relative">
            <button 
              onClick={() => setShowConfigModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="w-12 h-12 bg-purple-500/10 rounded-2xl flex items-center justify-center text-purple-400 border border-purple-500/20 mb-4">
              <Database className="w-6 h-6" />
            </div>

            <h3 className="text-md font-bold text-white mb-2">Thay đổi Project ID</h3>
            <p className="text-xs text-slate-400 mb-4 leading-relaxed">
              Nhập Firebase Project ID mới để đồng bộ Cloud. Trang quản trị sẽ tự động tải lại để nhận kết nối mới.
            </p>

            <input
              type="text"
              value={tempProjectId}
              onChange={(e) => setTempProjectId(e.target.value)}
              placeholder="Ví dụ: canva-school-puzzle-demo"
              className="w-full bg-slate-950 border border-slate-850 text-white text-sm rounded-xl py-2.5 px-3.5 focus:outline-none focus:border-purple-500 font-mono mb-4 placeholder-slate-700"
            />

            <div className="flex items-center gap-3 w-full">
              <button
                onClick={() => setShowConfigModal(false)}
                className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 rounded-xl text-xs font-bold text-slate-350 transition-colors cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                onClick={() => {
                  if (tempProjectId.trim()) {
                    setProjectId(tempProjectId.trim());
                    setShowConfigModal(false);
                    window.location.reload();
                  }
                }}
                className="flex-1 py-2.5 bg-purple-600 hover:bg-purple-500 rounded-xl text-xs font-bold text-white transition-colors cursor-pointer shadow-lg shadow-purple-600/15"
              >
                Lưu & Reload
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
