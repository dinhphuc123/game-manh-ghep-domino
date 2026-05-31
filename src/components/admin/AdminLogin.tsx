import React, { useState } from 'react';
import { Lock, Eye, EyeOff, Sparkles, AlertCircle, Loader2, KeyRound } from 'lucide-react';
import { saveAdminPasswordToCloud } from '../../firebaseService';

interface AdminLoginProps {
  isFirstTimeSetup: boolean;
  savedHashedPassword: string | null;
  onLoginSuccess: () => void;
  checkPassword: (password: string) => boolean;
  onResetConfig: () => void;
  currentProjectId: string;
}

export const AdminLogin: React.FC<AdminLoginProps> = ({
  isFirstTimeSetup,
  onLoginSuccess,
  checkPassword,
  onResetConfig,
  currentProjectId,
}) => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) {
      setError('Vui lòng nhập mật khẩu.');
      return;
    }

    setLoading(true);
    setError(null);

    // Mô phỏng hiệu ứng loading một chút cho chuyên nghiệp
    setTimeout(() => {
      const isValid = checkPassword(password);
      setLoading(false);
      if (isValid) {
        onLoginSuccess();
      } else {
        setError('Mật khẩu quản trị không chính xác. Vui lòng thử lại.');
      }
    }, 800);
  };

  const handleSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      setError('Mật khẩu phải chứa ít nhất 6 ký tự.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Mật khẩu xác nhận không khớp.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const success = await saveAdminPasswordToCloud(password);
      if (success) {
        setSuccessMsg('Thiết lập mật khẩu Admin thành công! Đang chuyển hướng...');
        setTimeout(() => {
          onLoginSuccess();
        }, 1500);
      } else {
        setError('Không thể lưu mật khẩu lên Cloud. Vui lòng kiểm tra lại cấu hình Project ID.');
      }
    } catch (err) {
      setError('Đã xảy ra lỗi kết nối. Hãy thử lại.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden font-sans">
      {/* Hiệu ứng nền Blur phát sáng */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />

      <div className="w-full max-w-md bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 p-8 rounded-3xl shadow-2xl relative z-10">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-tr from-purple-500 to-indigo-500 rounded-2xl flex items-center justify-center shadow-lg shadow-purple-500/30 mb-4 animate-pulse">
            <Lock className="w-8 h-8 text-white" />
          </div>
          
          <h2 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            {isFirstTimeSetup ? 'Thiết Lập Admin' : 'Trang Quản Trị'}
            <Sparkles className="w-5 h-5 text-amber-400 fill-amber-400" />
          </h2>
          
          <div className="mt-2.5 bg-purple-950/40 border border-purple-500/10 px-3.5 py-1 rounded-full text-[10.5px] text-purple-300 font-mono font-bold select-none">
            Project ID: {currentProjectId}
          </div>
          
          <p className="text-slate-400 text-sm text-center mt-2.5 px-4 leading-relaxed font-medium">
            {isFirstTimeSetup 
              ? 'Dự án của bạn chưa có mật khẩu quản lý. Hãy tạo mật khẩu Admin đầu tiên để lưu lên Firestore.' 
              : 'Vui lòng nhập mật khẩu quản lý để truy cập bảng điều khiển hệ thống.'}
          </p>
        </div>

        {error && (
          <div className="mb-6 bg-rose-500/10 border border-rose-500/20 p-4 rounded-2xl flex items-start gap-3 text-rose-400 text-sm animate-shake">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="mb-6 bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-2xl flex items-start gap-3 text-emerald-400 text-sm">
            <Sparkles className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <span>{successMsg}</span>
          </div>
        )}

        <form onSubmit={isFirstTimeSetup ? handleSetup : handleLogin} className="space-y-5">
          <div className="space-y-2">
            <label className="text-slate-300 text-xs font-semibold uppercase tracking-wider pl-1">
              Mật khẩu Admin
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">
                <KeyRound className="w-5 h-5" />
              </span>
              
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={isFirstTimeSetup ? 'Đặt mật khẩu mới (tối thiểu 6 ký tự)' : '••••••••'}
                disabled={loading}
                className="w-full bg-slate-950/80 border border-slate-800 text-white rounded-2xl py-3.5 pl-12 pr-12 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 text-sm transition-all"
              />
              
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {isFirstTimeSetup && (
            <div className="space-y-2">
              <label className="text-slate-300 text-xs font-semibold uppercase tracking-wider pl-1">
                Xác nhận mật khẩu
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">
                  <KeyRound className="w-5 h-5" />
                </span>
                
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Nhập lại mật khẩu"
                  disabled={loading}
                  className="w-full bg-slate-950/80 border border-slate-800 text-white rounded-2xl py-3.5 pl-12 pr-12 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 text-sm transition-all"
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-50 text-white font-semibold py-3.5 rounded-2xl shadow-lg shadow-purple-600/20 active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Đang xử lý...
              </>
            ) : (
              isFirstTimeSetup ? 'Tạo tài khoản & Đăng nhập' : 'Đăng nhập Quản trị'
            )}
          </button>
        </form>

        <div className="mt-8 text-center flex flex-col gap-2.5 items-center justify-center">
          <button
            type="button"
            onClick={onResetConfig}
            className="text-xs text-purple-400 hover:text-purple-300 underline transition-colors cursor-pointer bg-transparent border-none font-bold"
          >
            ⚙️ Cấu hình lại Firebase Project ID
          </button>
          <a
            href="/"
            className="text-xs text-slate-500 hover:text-slate-400 underline transition-colors"
          >
            Quay lại trang chính của giáo viên
          </a>
        </div>
      </div>
    </div>
  );
};
