import React, { useState } from 'react';
import {
  Settings,
  User,
  School,
  Database,
  ShieldCheck,
  CheckCircle2,
  KeyRound,
  ExternalLink,
  Flame,
} from 'lucide-react';
import { TeacherProfile } from '../../types';
import { TeacherAvatar } from '../common/Illustrations';

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

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateProfile({
      name: name.trim() || profile.name,
      schoolName: schoolName.trim() || profile.schoolName,
      schoolAddress: schoolAddress.trim() || profile.schoolAddress,
      slogan: slogan.trim() || profile.slogan,
      currentYear,
      currentSemester,
    });
    onShowToast({
      type: 'success',
      message: 'Đã lưu cấu hình hồ sơ giáo viên thành công!',
    });
  };

  return (
    <div className="space-y-5">
      {/* Header bar */}
      <div className="bg-white rounded-2xl p-5 shadow-xs border border-sky-100 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <Settings className="w-6 h-6 text-[#0878D1]" />
            <span>Cài đặt hệ thống & Hồ sơ giáo viên</span>
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Chỉnh sửa thông tin hiển thị, năm học và kiểm tra trạng thái bảo mật cơ sở dữ liệu.
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
              <div>
                <div className="text-sm font-bold text-slate-800">{profile.name}</div>
                <div className="text-xs text-slate-500">Email: {profile.email}</div>
                <div className="text-xs text-blue-700 font-semibold mt-0.5">
                  Chức vụ: Giáo viên môn Tin học
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
                onChange={(e) => setName(e.target.value)}
                placeholder="Thị Chành Th."
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-bold text-slate-800"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Tên đơn vị trường học
                </label>
                <input
                  type="text"
                  value={schoolName}
                  onChange={(e) => setSchoolName(e.target.value)}
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
                Lưu cấu hình
              </button>
            </div>
          </form>
        </div>

        {/* Right (5 cols): Database Status & Security Information */}
        <div className="lg:col-span-5 space-y-5">
          {/* Database Status Card */}
          <div className="bg-white rounded-2xl p-6 shadow-xs border border-sky-100">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <Database className="w-5 h-5 text-emerald-600" />
              <h3 className="font-bold text-slate-800 text-base">Trạng thái Cơ sở dữ liệu</h3>
            </div>

            <div className="mt-4 space-y-3 text-xs">
              <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-50 border border-emerald-200">
                <div className="flex items-center gap-2 text-emerald-900 font-bold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Bộ nhớ trực tuyến trình duyệt</span>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800">
                  Đang hoạt động
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 leading-relaxed">
                <p>
                  • Toàn bộ lớp học, học sinh và phiếu đánh giá được lưu trực tuyến tự động ngay khi cô thao tác.
                </p>
                <p className="mt-1">
                  • Cô có thể tải lại trang (F5) mà không sợ mất bất kỳ thông tin nào.
                </p>
              </div>

              {/* Firebase Ready status badge */}
              <div className="p-3 rounded-xl bg-orange-50/70 border border-orange-200 text-xs">
                <div className="flex items-center gap-2 text-orange-900 font-bold mb-1">
                  <Flame className="w-4 h-4 text-orange-500" />
                  <span>Sẵn sàng kết nối Firebase Firestore</span>
                </div>
                <div className="text-orange-800 leading-relaxed text-[11px]">
                  Hệ thống được thiết kế theo cấu trúc NoSQL chuẩn Firestore với Collections:
                  <div className="font-mono text-[10px] text-slate-700 bg-white/70 p-1.5 rounded mt-1 border border-orange-200">
                    /classes/{'{classId}'}<br />
                    /students/{'{studentId}'}<br />
                    /evaluations/{'{evaluationId}'}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Security & Access Rights */}
          <div className="bg-white rounded-2xl p-6 shadow-xs border border-sky-100">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <ShieldCheck className="w-5 h-5 text-blue-600" />
              <h3 className="font-bold text-slate-800 text-base">Bảo mật & Quyền truy cập</h3>
            </div>

            <div className="mt-3 text-xs text-slate-700 space-y-2 leading-relaxed">
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                <span>Chỉ giáo viên có tài khoản được cấp phép mới được quyền xem và cập nhật điểm.</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                <span>Không thu thập thông tin nhạy cảm của học sinh tiểu học (chỉ dùng Mã HS và Họ tên).</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                <span>Bảo lưu đầy đủ lịch sử đánh giá khi học sinh chuyển lớp hoặc qua các năm học.</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
