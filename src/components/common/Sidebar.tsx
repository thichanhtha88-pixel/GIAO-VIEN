import React from 'react';
import {
  LayoutDashboard,
  School,
  GraduationCap,
  ClipboardCheck,
  TrendingUp,
  BarChart3,
  ArrowDownUp,
  Settings,
  BookOpen,
} from 'lucide-react';
import { TabType } from '../../types';
import { StudentSidebarIllustration } from './Illustrations';

interface SidebarProps {
  currentTab: TabType;
  onTabChange: (tab: TabType) => void;
}

interface MenuItem {
  id: TabType;
  label: string;
  icon: React.ReactNode;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentTab, onTabChange }) => {
  const menuItems: MenuItem[] = [
    {
      id: 'overview',
      label: 'Tổng quan',
      icon: <LayoutDashboard className="w-5 h-5 shrink-0" />,
    },
    {
      id: 'classes',
      label: 'Lớp học',
      icon: <School className="w-5 h-5 shrink-0" />,
    },
    {
      id: 'students',
      label: 'Học sinh',
      icon: <GraduationCap className="w-5 h-5 shrink-0" />,
    },
    {
      id: 'evaluations',
      label: 'Kết quả học tập',
      icon: <ClipboardCheck className="w-5 h-5 shrink-0" />,
    },
    {
      id: 'progress',
      label: 'Tiến độ học tập',
      icon: <TrendingUp className="w-5 h-5 shrink-0" />,
    },
    {
      id: 'reports',
      label: 'Báo cáo - Thống kê',
      icon: <BarChart3 className="w-5 h-5 shrink-0" />,
    },
    {
      id: 'import_export',
      label: 'Nhập/Xuất dữ liệu',
      icon: <ArrowDownUp className="w-5 h-5 shrink-0" />,
    },
    {
      id: 'settings',
      label: 'Cài đặt',
      icon: <Settings className="w-5 h-5 shrink-0" />,
    },
  ];

  return (
    <aside className="w-64 bg-[#06457F] text-white flex flex-col justify-between shrink-0 shadow-lg min-h-[calc(100vh-65px)]">
      {/* Navigation items list */}
      <div className="p-3.5 space-y-1.5">
        {menuItems.map((item) => {
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left text-base font-semibold transition-all cursor-pointer ${
                isActive
                  ? 'bg-[#168BF0] text-white shadow-md shadow-blue-900/30 font-bold translate-x-1'
                  : 'text-sky-100 hover:bg-white/10 hover:text-white'
              }`}
            >
              {item.icon}
              <span className="tracking-wide">{item.label}</span>
            </button>
          );
        })}
      </div>

      {/* Sidebar bottom with cute illustration and quote */}
      <div className="p-4 mx-3 mb-4 rounded-2xl bg-gradient-to-b from-[#073B78]/70 to-[#042852]/90 border border-sky-400/20 text-center flex flex-col items-center">
        <StudentSidebarIllustration className="w-32 h-32" />
        <p className="text-xs italic text-sky-200 mt-2 font-medium leading-relaxed px-1">
          "Tin học không chỉ là kỹ năng mà còn là hành trang cho tương lai! 💙"
        </p>
      </div>
    </aside>
  );
};
