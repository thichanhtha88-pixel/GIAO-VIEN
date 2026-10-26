import React from 'react';
import { LogOut, UserCircle2 } from 'lucide-react';
import { TeacherProfile } from '../../types';
import { PrimaryITLogo, TeacherAvatar } from './Illustrations';

interface HeaderProps {
  profile: TeacherProfile;
  onLogout: () => void;
  onOpenSettings: () => void;
}

export const Header: React.FC<HeaderProps> = ({ profile, onLogout, onOpenSettings }) => {
  return (
    <header className="bg-[#073B78] text-white px-4 md:px-6 py-3 shadow-md flex items-center justify-between z-20 border-b border-blue-900/40">
      {/* Left side: Logo & Site Title */}
      <div className="flex items-center gap-3.5">
        <PrimaryITLogo className="w-11 h-11 shadow-sm" />
        <div>
          <h1 className="text-xl md:text-2xl font-bold tracking-tight text-white leading-tight">
            Website Tin học Tiểu học – {profile.schoolName}
          </h1>
          <p className="text-xs md:text-sm text-sky-200 italic font-normal tracking-wide">
            {profile.slogan}
          </p>
        </div>
      </div>

      {/* Right side: Teacher info & Logout */}
      <div className="flex items-center gap-4">
        <div 
          onClick={onOpenSettings}
          className="flex items-center gap-3 bg-white/10 hover:bg-white/15 px-3 py-1.5 rounded-xl cursor-pointer transition-colors border border-white/15"
          title="Nhấp để xem và chỉnh sửa hồ sơ giáo viên"
        >
          <TeacherAvatar className="w-9 h-9" />
          <div className="hidden sm:block text-left">
            <div className="text-sm font-bold text-white flex items-center gap-1.5">
              <span>Giáo viên: {profile.name}</span>
            </div>
            <div className="text-xs text-sky-200">
              {profile.username ? `@${profile.username} • ` : ''}{profile.schoolName}
            </div>
          </div>
        </div>

        {/* Logout Button */}
        <button
          onClick={onLogout}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600/80 hover:bg-red-600 active:bg-red-700 text-white text-sm font-semibold rounded-lg transition-all shadow-sm border border-red-400/40 cursor-pointer"
          title="Đăng xuất khỏi hệ thống"
        >
          <LogOut className="w-4 h-4" />
          <span className="hidden md:inline">Đăng xuất</span>
        </button>
      </div>
    </header>
  );
};
