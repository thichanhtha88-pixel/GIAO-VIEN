import React, { useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Database,
  ExternalLink,
  Eye,
  EyeOff,
  Lock,
  LogIn,
  School,
  ShieldCheck,
  User,
  UserPlus,
} from 'lucide-react';
import { PrimaryITLogo } from '../common/Illustrations';
import {
  getSupabaseAuthProvidersUrl,
  getSupabaseUsersUrl,
  loginWithUsernamePassword,
  registerWithUsernamePassword,
} from '../../services/authService';
import { APP_CONSTRAINTS, validateUsername } from '../../supabase';

interface LoginViewProps {
  onAuthComplete?: (message: string) => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onAuthComplete }) => {
  const [mode, setMode] = useState<'login' | 'register'>('login');

  // Shared fields
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Registration-only fields
  const [fullName, setFullName] = useState('');
  const [schoolName, setSchoolName] = useState('Trường Tiểu học Thứ Ba');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // UI feedback states
  const [error, setError] = useState('');
  const [isEmailConfirmEnabled, setIsEmailConfirmEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const switchMode = (nextMode: 'login' | 'register') => {
    setMode(nextMode);
    setError('');
    setIsEmailConfirmEnabled(false);
    setPassword('');
    setConfirmPassword('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsEmailConfirmEnabled(false);

    const usernameCheck = validateUsername(username);
    if (!usernameCheck.valid) {
      setError(usernameCheck.error || 'Tên đăng nhập không hợp lệ!');
      return;
    }

    if (password.length < 6) {
      setError('Mật khẩu phải có tối thiểu 6 ký tự!');
      return;
    }

    if (mode === 'register') {
      if (!fullName.trim()) {
        setError('Vui lòng nhập họ và tên giáo viên!');
        return;
      }
      if (password !== confirmPassword) {
        setError('Mật khẩu xác nhận không khớp. Vui lòng nhập lại!');
        return;
      }

      setIsLoading(true);
      const res = await registerWithUsernamePassword({
        username: usernameCheck.normalized,
        password,
        fullName: fullName.trim(),
        schoolName: schoolName.trim() || 'Trường Tiểu học Thứ Ba',
      });
      setIsLoading(false);

      if (!res.success) {
        setError(res.error || 'Đăng ký không thành công.');
        setIsEmailConfirmEnabled(Boolean(res.isEmailConfirmEnabled));
        return;
      }

      onAuthComplete?.(`Đăng ký thành công! Chào mừng ${fullName.trim()} đến với hệ thống.`);
    } else {
      setIsLoading(true);
      const res = await loginWithUsernamePassword({
        username: usernameCheck.normalized,
        password,
      });
      setIsLoading(false);

      if (!res.success) {
        setError(res.error || 'Đăng nhập không thành công.');
        setIsEmailConfirmEnabled(Boolean(res.isEmailConfirmEnabled));
        return;
      }

      onAuthComplete?.(`Đăng nhập thành công với tài khoản @${usernameCheck.normalized}!`);
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F8FC] flex flex-col justify-between p-4">
      <div className="flex-1 flex items-center justify-center py-6">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-sky-100 overflow-hidden">
          {/* Header Banner */}
          <div className="bg-[#073B78] text-white p-6 text-center">
            <div className="flex justify-center mb-3">
              <PrimaryITLogo className="w-14 h-14" />
            </div>
            <h2 className="text-xl font-bold tracking-tight">Website Tin học Tiểu học</h2>
            <p className="text-sm text-sky-200 mt-1">Trường Tiểu học Thứ Ba</p>
            <p className="text-xs text-sky-300 italic mt-0.5">
              "Ứng dụng công nghệ – Kiến tạo tương lai"
            </p>
          </div>

          {/* Mode Tabs */}
          <div className="grid grid-cols-2 bg-slate-100 p-1.5 m-6 mb-0 rounded-xl border border-slate-200">
            <button
              type="button"
              onClick={() => switchMode('login')}
              className={`flex items-center justify-center gap-2 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                mode === 'login'
                  ? 'bg-white text-[#073B78] shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <LogIn className="w-4 h-4" />
              <span>Đăng nhập</span>
            </button>
            <button
              type="button"
              onClick={() => switchMode('register')}
              className={`flex items-center justify-center gap-2 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                mode === 'register'
                  ? 'bg-white text-[#073B78] shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <UserPlus className="w-4 h-4" />
              <span>Đăng ký tài khoản</span>
            </button>
          </div>

          {/* Form container */}
          <div className="p-6 space-y-4">
            <div className="text-center">
              <h3 className="text-base font-bold text-slate-800">
                {mode === 'login'
                  ? 'Đăng nhập hệ thống quản lý dạy học'
                  : 'Tạo tài khoản giáo viên mới'}
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                {mode === 'login'
                  ? 'Sử dụng tên đăng nhập và mật khẩu lưu trữ trên Supabase'
                  : 'Mỗi tài khoản có không gian lớp học và dữ liệu học sinh riêng trên Supabase'}
              </p>
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs leading-relaxed">
                <div className="font-bold flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-red-600" />
                  <span>{error}</span>
                </div>
              </div>
            )}

            {isEmailConfirmEnabled && (
              <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-300 text-amber-950 text-xs space-y-2.5 leading-relaxed">
                <div className="font-bold text-amber-900">
                  Cần tắt "Confirm email" trên Supabase (chỉ làm 1 lần duy nhất):
                </div>
                <ol className="list-decimal list-inside space-y-1 text-amber-900">
                  <li>
                    Mở trang cấu hình <strong>Email Provider</strong> của Supabase bằng nút bên dưới.
                  </li>
                  <li>
                    Tìm dòng <strong>Confirm email</strong>, gạt sang <strong>Tắt (OFF)</strong> rồi nhấn{' '}
                    <strong>Save</strong>.
                  </li>
                  <li>
                    Nếu tài khoản vừa tạo đang chờ kích hoạt, mở mục <strong>Users</strong> nhấn vào tài khoản chọn{' '}
                    <strong>Confirm user</strong> (hoặc đăng ký tên đăng nhập mới).
                  </li>
                </ol>
                <div className="flex flex-wrap gap-2 pt-0.5">
                  <a
                    href={getSupabaseAuthProvidersUrl()}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg transition-colors"
                  >
                    <span>1. Tắt Confirm email</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                  <a
                    href={getSupabaseUsersUrl()}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-amber-100 text-amber-900 border border-amber-400 font-bold rounded-lg transition-colors"
                  >
                    <span>2. Quản lý Users</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3.5">
              {mode === 'register' && (
                <>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Họ và tên giáo viên <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        maxLength={APP_CONSTRAINTS.NAME_MAX}
                        placeholder="Ví dụ: Thị Chành Th."
                        required
                        className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold text-slate-800"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Đơn vị trường học
                    </label>
                    <div className="relative">
                      <School className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={schoolName}
                        onChange={(e) => setSchoolName(e.target.value)}
                        maxLength={APP_CONSTRAINTS.SCHOOL_NAME_MAX}
                        placeholder="Trường Tiểu học Thứ Ba"
                        className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800"
                      />
                    </div>
                  </div>
                </>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Tên đăng nhập <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value.replace(/\s+/g, '').toLowerCase())}
                    maxLength={APP_CONSTRAINTS.USERNAME_MAX}
                    placeholder="Ví dụ: cothanh88"
                    autoComplete="username"
                    required
                    className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold text-slate-800"
                  />
                </div>
                {mode === 'register' && (
                  <p className="text-[11px] text-slate-500 mt-1">
                    Viết liền không dấu, từ 3–32 ký tự (a-z, 0-9, dấu chấm, gạch dưới).
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Mật khẩu <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Nhập mật khẩu (tối thiểu 6 ký tự)"
                    autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                    required
                    className="w-full pl-9 pr-10 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {mode === 'register' && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Nhập lại mật khẩu <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <CheckCircle2 className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Nhập lại mật khẩu xác nhận"
                      autoComplete="new-password"
                      required
                      className="w-full pl-9 pr-10 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword((prev) => !prev)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                      tabIndex={-1}
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 px-4 bg-[#168BF0] hover:bg-blue-600 active:bg-blue-700 disabled:opacity-60 text-white font-bold text-sm rounded-xl shadow-md transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                {mode === 'login' ? (
                  <>
                    <LogIn className="w-4 h-4" />
                    <span>{isLoading ? 'Đang đăng nhập...' : 'Đăng nhập vào hệ thống'}</span>
                  </>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4" />
                    <span>{isLoading ? 'Đang khởi tạo tài khoản...' : 'Đăng ký tài khoản mới'}</span>
                  </>
                )}
              </button>
            </form>

            <div className="text-center text-xs text-slate-600 pt-1">
              {mode === 'login' ? (
                <>
                  Chưa có tài khoản giáo viên?{' '}
                  <button
                    type="button"
                    onClick={() => switchMode('register')}
                    className="text-[#0878D1] font-bold hover:underline cursor-pointer"
                  >
                    Đăng ký ngay
                  </button>
                </>
              ) : (
                <>
                  Đã có tài khoản?{' '}
                  <button
                    type="button"
                    onClick={() => switchMode('login')}
                    className="text-[#0878D1] font-bold hover:underline cursor-pointer"
                  >
                    Quay lại đăng nhập
                  </button>
                </>
              )}
            </div>

            <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 flex items-center gap-2.5 text-xs text-emerald-800">
              <Database className="w-4 h-4 text-emerald-600 shrink-0" />
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 -ml-1" />
              <span>
                Toàn bộ tài khoản, lớp học, học sinh và kết quả đánh giá được lưu trữ bảo mật trên Supabase.
              </span>
            </div>
          </div>
        </div>
      </div>

      <footer className="text-center text-xs text-slate-500 py-3">
        Trường Tiểu học Thứ Ba &nbsp;|&nbsp; Hệ thống Quản lý Tin học Tiểu học &nbsp;|&nbsp; Ứng dụng công nghệ trong giảng dạy
      </footer>
    </div>
  );
};
