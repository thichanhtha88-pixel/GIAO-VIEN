import React, { useEffect, useState } from 'react';
import {
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  Settings,
  ShieldCheck,
  User,
} from 'lucide-react';
import { TeacherProfile } from '../../types';
import { TeacherAvatar } from '../common/Illustrations';
import { changeTeacherPassword } from '../../services/authService';
import { APP_CONSTRAINTS } from '../../supabase';

interface SettingsViewProps {
  profile: TeacherProfile;
  onUpdateProfile: (profile: Partial<TeacherProfile>) => void;
  onShowToast: (msg: { type: 'success' | 'error' | 'info' | 'warning'; message: string }) => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  profile,
  onUpdateProfile,
  onShowToast,
}) => {
  const [name, setName] = useState(profile.name);
  const [schoolName, setSchoolName] = useState(profile.schoolName);
  const [schoolAddress, setSchoolAddress] = useState(profile.schoolAddress);
  const [slogan, setSlogan] = useState(profile.slogan);
  const [currentYear, setCurrentYear] = useState(profile.currentYear);
  const [currentSemester, setCurrentSemester] = useState(profile.currentSemester);

  // Password Change States
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  useEffect(() => {
    setName(profile.name);
    setSchoolName(profile.schoolName);
    setSchoolAddress(profile.schoolAddress);
    setSlogan(profile.slogan);
    setCurrentYear(profile.currentYear);
    setCurrentSemester(profile.currentSemester);
  }, [profile]);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateProfile({
      name: name.trim() || profile.name,
      schoolName: schoolName.trim() || profile.schoolName,
      schoolAddress: schoolAddress.trim(),
      slogan: slogan.trim(),
      currentYear,
      currentSemester,
    });
    onShowToast({
      type: 'success',
      message: 'Đã lưu cấu hình hồ sơ giáo viên lên đám mây thành công!',
    });
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword) {
      onShowToast({ type: 'error', message: 'Vui lòng nhập mật khẩu hiện tại!' });
      return;
    }
    if (newPassword.length < 6) {
      onShowToast({ type: 'error', message: 'Mật khẩu mới phải có từ 6 ký tự trở lên!' });
      return;
    }
    if (newPassword !== confirmNewPassword) {
      onShowToast({ type: 'error', message: 'Mật khẩu mới nhập lại không khớp!' });
      return;
    }

    setIsChangingPassword(true);
    const res = await changeTeacherPassword({ currentPassword, newPassword });
    setIsChangingPassword(false);

    if (!res.success) {
      onShowToast({ type: 'error', message: res.error || 'Không thể đổi mật khẩu.' });
      return;
    }

    setCurrentPassword('');
    setNewPassword('');
    setConfirmNewPassword('');
    onShowToast({ type: 'success', message: 'Đã cập nhật mật khẩu mới thành công!' });
  };

  return (
    <div className="space-y-5">
      {/* Header bar */}
      <div className="bg-white rounded-2xl p-5 shadow-xs border border-sky-100 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <Settings className="w-6 h-6 text-[#0878D1]" />
            <span>Cài đặt tài khoản & Hồ sơ giáo viên</span>
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Quản lý thông tin hiển thị, năm học và mật khẩu đăng nhập tài khoản.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left (7 cols): Profile Configuration Form */}
        <div className="lg:col-span-7 bg-white rounded-2xl p-6 shadow-xs border border-sky-100">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100 mb-5">
            <User className="w-5 h-5 text-blue-600" />
            <h3 className="font-bold text-slate-800 text-base">Hồ sơ giáo viên Tin học</h3>
          </div>

          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div className="flex items-center gap-4 p-4 rounded-xl bg-sky-50/60 border border-sky-200">
              <TeacherAvatar className="w-14 h-14" />
              <div className="space-y-0.5">
                <div className="text-sm font-bold text-slate-800">{profile.name}</div>
                <div className="text-xs text-slate-600">
                  Tên đăng nhập: <span className="font-bold text-slate-800">@{profile.username || 'giaovien'}</span>
                </div>
                <div className="text-xs text-blue-700 font-semibold">
                  Phương thức xác thực:{' '}
                  {profile.authProvider === 'google' ? 'Tài khoản Google' : 'Tên đăng nhập & Mật khẩu'}
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Tên hiển thị giáo viên <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={name}
                maxLength={APP_CONSTRAINTS.NAME_MAX}
                onChange={(e) => setName(e.target.value)}
                placeholder="Thị Chành Th."
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-bold text-slate-800"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Tên đơn vị trường học
                </label>
                <input
                  type="text"
                  value={schoolName}
                  maxLength={APP_CONSTRAINTS.SCHOOL_NAME_MAX}
                  onChange={(e) => setSchoolName(e.target.value)}
                  required
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Khẩu hiệu sư phạm
                </label>
                <input
                  type="text"
                  value={slogan}
                  maxLength={APP_CONSTRAINTS.SLOGAN_MAX}
                  onChange={(e) => setSlogan(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl italic"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Địa chỉ trường
              </label>
              <input
                type="text"
                value={schoolAddress}
                maxLength={APP_CONSTRAINTS.SCHOOL_ADDRESS_MAX}
                onChange={(e) => setSchoolAddress(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Năm học hiện tại
                </label>
                <select
                  value={currentYear}
                  onChange={(e) => setCurrentYear(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-800"
                >
                  <option value="2024 - 2025">2024 - 2025</option>
                  <option value="2025 - 2026">2025 - 2026</option>
                  <option value="2026 - 2027">2026 - 2027</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Học kỳ hiện tại
                </label>
                <select
                  value={currentSemester}
                  onChange={(e) => setCurrentSemester(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-800"
                >
                  <option value="Học kỳ I">Học kỳ I</option>
                  <option value="Học kỳ II">Học kỳ II</option>
                </select>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end">
              <button
                type="submit"
                className="px-6 py-2.5 bg-[#168BF0] hover:bg-blue-600 text-white font-bold text-sm rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                Lưu cấu hình hồ sơ
              </button>
            </div>
          </form>
        </div>

        {/* Right (5 cols): Password Management & Security */}
        <div className="lg:col-span-5 space-y-5">
          {profile.authProvider === 'password' && (
            <div className="bg-white rounded-2xl p-6 shadow-xs border border-sky-100">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
                <div className="flex items-center gap-2">
                  <KeyRound className="w-5 h-5 text-amber-600" />
                  <h3 className="font-bold text-slate-800 text-base">Đổi mật khẩu đăng nhập</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowPass((p) => !p)}
                  className="text-xs text-slate-500 hover:text-slate-700 flex items-center gap-1 cursor-pointer"
                >
                  {showPass ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  <span>{showPass ? 'Ẩn' : 'Hiện'}</span>
                </button>
              </div>

              <form onSubmit={handlePasswordChange} className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Mật khẩu hiện tại
                  </label>
                  <input
                    type={showPass ? 'text' : 'password'}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Nhập mật khẩu đang dùng"
                    required
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Mật khẩu mới
                  </label>
                  <input
                    type={showPass ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Từ 6 ký tự trở lên"
                    required
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Xác nhận mật khẩu mới
                  </label>
                  <input
                    type={showPass ? 'text' : 'password'}
                    value={confirmNewPassword}
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                    placeholder="Nhập lại mật khẩu mới"
                    required
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isChangingPassword}
                    className="w-full py-2.5 px-4 bg-slate-800 hover:bg-slate-900 disabled:opacity-60 text-white font-bold text-sm rounded-xl transition-colors cursor-pointer"
                  >
                    {isChangingPassword ? 'Đang cập nhật...' : 'Cập nhật mật khẩu mới'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Security & Access Rights */}
          <div className="bg-white rounded-2xl p-6 shadow-xs border border-sky-100">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <ShieldCheck className="w-5 h-5 text-blue-600" />
              <h3 className="font-bold text-slate-800 text-base">Bảo mật & Quyền riêng tư</h3>
            </div>

            <div className="mt-3 text-xs text-slate-700 space-y-2.5 leading-relaxed">
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                <span>
                  Tài khoản giáo viên được xác thực trực tuyến và tự động đồng bộ giữa các thiết bị.
                </span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                <span>
                  Mỗi tài khoản chỉ có quyền truy cập và chỉnh sửa lớp học, học sinh thuộc phạm vi quản lý của mình.
                </span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                <span>
                  Bảo lưu đầy đủ lịch sử đánh giá khi học sinh chuyển lớp hoặc qua các năm học.
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
