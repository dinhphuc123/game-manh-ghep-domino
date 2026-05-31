import React, { useState, useEffect } from 'react';
import { Loader2, Database, AlertCircle, ArrowLeft } from 'lucide-react';
import { getAdminPasswordFromCloud, getFirebaseConfig } from '../../firebaseService';
import { useFirebaseConfigStore } from '../../stores/firebaseConfigStore';
import { AdminLogin } from './AdminLogin';
import { AdminDashboard } from './AdminDashboard';

export const AdminPage: React.FC = () => {
  const { setProjectId: saveProjectIdToStore } = useFirebaseConfigStore();
  const [initLoading, setInitLoading] = useState(true);
  const [isConfigured, setIsConfigured] = useState(false);
  const [projectId, setProjectId] = useState('');
  const [isFirstTimeSetup, setIsFirstTimeSetup] = useState(false);
  const [savedPassword, setSavedPassword] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Kiểm tra trạng thái cấu hình và mật khẩu lưu trên Cloud
  const checkAdminStatus = async () => {
    setInitLoading(true);
    const config = getFirebaseConfig();
    
    if (!config.projectId || config.projectId === '') {
      setIsConfigured(false);
      setInitLoading(false);
      return;
    }

    setIsConfigured(true);
    setProjectId(config.projectId);

    try {
      const password = await getAdminPasswordFromCloud();
      if (password === null) {
        // Chưa thiết lập mật khẩu lần nào
        setIsFirstTimeSetup(true);
        setSavedPassword(null);
      } else {
        setIsFirstTimeSetup(false);
        setSavedPassword(password);
      }
    } catch (e) {
      console.error('Failed to connect to Firebase Admin Config', e);
    } finally {
      setInitLoading(false);
    }
  };

  useEffect(() => {
    checkAdminStatus();
    
    // Kiểm tra xem đã đăng nhập trong session này chưa
    const authStatus = sessionStorage.getItem('admin_authenticated');
    if (authStatus === 'true') {
      setIsAuthenticated(true);
    }
  }, []);

  // So sánh mật khẩu nhập vào
  const checkPassword = (password: string): boolean => {
    if (!savedPassword) return false;
    return password === savedPassword;
  };

  // Đăng nhập thành công
  const handleLoginSuccess = () => {
    sessionStorage.setItem('admin_authenticated', 'true');
    setIsAuthenticated(true);
    // Khi thiết lập xong, reload nhẹ lại trạng thái mật khẩu
    checkAdminStatus();
  };

  // Đăng xuất
  const handleLogout = () => {
    sessionStorage.removeItem('admin_authenticated');
    setIsAuthenticated(false);
  };

  // Trường hợp đang load cấu hình
  if (initLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
        <Loader2 className="w-10 h-10 text-purple-500 animate-spin mb-4" />
        <p className="text-slate-400 text-sm">Đang kết nối cơ sở dữ liệu Cloud...</p>
      </div>
    );
  }

  // Trường hợp giáo viên chưa cấu hình Project ID
  const handleSaveConfig = (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectId.trim()) return;
    saveProjectIdToStore(projectId.trim());
    checkAdminStatus();
  };

  if (!isConfigured) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-slate-900/60 border border-slate-800/80 p-8 rounded-3xl text-left shadow-2xl backdrop-blur-xl">
          <div className="w-14 h-14 bg-purple-500/10 rounded-2xl flex items-center justify-center text-purple-400 border border-purple-500/20 mb-6">
            <Database className="w-7 h-7 animate-pulse" />
          </div>
          
          <h2 className="text-xl font-bold text-white mb-2">Cấu Hình Kết Nối Firebase</h2>
          <p className="text-slate-400 text-xs mb-6 leading-relaxed">
            Hệ thống Quản trị yêu cầu cấu hình **Firebase Project ID** của trường/lớp bạn để đồng bộ các bài học, kết quả và thiết lập lên Cloud.
          </p>

          <form onSubmit={handleSaveConfig} className="space-y-5">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1.5">
                ☁️ Firebase Project ID
              </label>
              <input
                type="text"
                placeholder="Ví dụ: canva-school-puzzle-demo"
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                className="w-full text-sm font-mono bg-slate-950/60 border border-slate-800 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-purple-500 text-white placeholder-slate-600 transition-all"
                required
              />
              <span className="text-[10px] text-slate-500 block mt-1.5 leading-normal">
                💡 Tạo dự án trên <a href="https://console.firebase.google.com/" target="_blank" rel="noreferrer" className="text-purple-400 hover:underline">Firebase Console</a>, sao chép mã Project ID và dán vào đây.
              </span>
            </div>

            <button
              type="submit"
              className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold py-3.5 rounded-2xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-purple-600/15"
            >
              Lưu & Kết nối Cloud
            </button>
          </form>

          <div className="border-t border-slate-800/80 pt-4 mt-6">
            <a
              href="/"
              className="text-xs text-slate-500 hover:text-slate-300 flex items-center gap-1.5 justify-center transition-all cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Quay lại trang thiết kế giáo viên
            </a>
          </div>
        </div>
      </div>
    );
  }

  // Nếu đã xác thực thành công, hiển thị Dashboard quản trị
  if (isAuthenticated) {
    return <AdminDashboard onLogout={handleLogout} />;
  }

  // Ngược lại, hiển thị màn hình Login (hoặc Setup)
  return (
    <AdminLogin
      isFirstTimeSetup={isFirstTimeSetup}
      savedHashedPassword={savedPassword}
      onLoginSuccess={handleLoginSuccess}
      checkPassword={checkPassword}
    />
  );
};
