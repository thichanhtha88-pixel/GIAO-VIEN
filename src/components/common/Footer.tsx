import React, { useEffect, useState } from 'react';
import { Clock } from 'lucide-react';
import { TeacherProfile } from '../../types';

interface FooterProps {
  profile: TeacherProfile;
}

export const Footer: React.FC<FooterProps> = ({ profile }) => {
  const [currentTime, setCurrentTime] = useState<string>('');

  useEffect(() => {
    const update = () => {
      const now = new Date();
      const pad = (n: number) => n.toString().padStart(2, '0');
      const dateStr = `${pad(now.getDate())}/${pad(now.getMonth() + 1)}/${now.getFullYear()}`;
      const timeStr = `${pad(now.getHours())}:${pad(now.getMinutes())}`;
      setCurrentTime(`${dateStr} ${timeStr}`);
    };
    update();
    const interval = setInterval(update, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <footer className="bg-[#06457F] text-white text-xs py-2.5 px-6 flex flex-col md:flex-row items-center justify-between gap-2 border-t border-sky-900/50 shadow-inner z-10">
      <div className="font-medium text-center md:text-left text-sky-100">
        {profile.schoolName} &nbsp;|&nbsp; Giáo viên: <span className="text-white font-bold">{profile.name}</span> &nbsp;|&nbsp; Website Tin học Tiểu học – {profile.slogan}
      </div>

      <div className="flex items-center gap-1.5 text-sky-200 font-semibold shrink-0">
        <Clock className="w-3.5 h-3.5 text-sky-300" />
        <span>{currentTime || '23/10/2026 14:00'}</span>
      </div>
    </footer>
  );
};
