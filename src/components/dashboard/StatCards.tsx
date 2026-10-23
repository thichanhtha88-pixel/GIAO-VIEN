import React from 'react';
import { Users2, UserCheck, BookOpen, Award } from 'lucide-react';
import { ClassRoom, Student, Lesson, EvaluationRecord, TabType } from '../../types';

interface StatCardsProps {
  classes: ClassRoom[];
  students: Student[];
  lessons: Lesson[];
  evaluations: EvaluationRecord[];
  onNavigate: (tab: TabType) => void;
}

export const StatCards: React.FC<StatCardsProps> = ({
  classes,
  students,
  lessons,
  evaluations,
  onNavigate,
}) => {
  const classNamesText = classes.length > 0 
    ? `Lớp ${classes.map((c) => c.code).join(', ')}` 
    : 'Chưa có lớp';

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* 1. Tổng số lớp học */}
      <div
        onClick={() => onNavigate('classes')}
        className="bg-white rounded-2xl p-4 shadow-xs border border-sky-100 flex items-center gap-4 hover:shadow-md hover:border-sky-300 transition-all cursor-pointer group"
      >
        <div className="w-14 h-14 rounded-full bg-[#E0F2FE] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
          <Users2 className="w-7 h-7 text-[#0284C7]" />
        </div>
        <div>
          <div className="text-sm font-semibold text-slate-500">Tổng số lớp học</div>
          <div className="text-3xl font-extrabold text-slate-800 leading-tight">
            {classes.length}
          </div>
          <div className="text-xs text-slate-500 font-medium truncate max-w-[140px]">
            {classNamesText}
          </div>
        </div>
      </div>

      {/* 2. Tổng số học sinh */}
      <div
        onClick={() => onNavigate('students')}
        className="bg-white rounded-2xl p-4 shadow-xs border border-emerald-100 flex items-center gap-4 hover:shadow-md hover:border-emerald-300 transition-all cursor-pointer group"
      >
        <div className="w-14 h-14 rounded-full bg-[#DCFCE7] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
          <UserCheck className="w-7 h-7 text-[#16A34A]" />
        </div>
        <div>
          <div className="text-sm font-semibold text-slate-500">Tổng số học sinh</div>
          <div className="text-3xl font-extrabold text-slate-800 leading-tight">
            {students.length}
          </div>
          <div className="text-xs text-slate-500 font-medium">Học sinh</div>
        </div>
      </div>

      {/* 3. Tổng số bài học */}
      <div
        onClick={() => onNavigate('progress')}
        className="bg-white rounded-2xl p-4 shadow-xs border border-purple-100 flex items-center gap-4 hover:shadow-md hover:border-purple-300 transition-all cursor-pointer group"
      >
        <div className="w-14 h-14 rounded-full bg-[#F3E8FF] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
          <BookOpen className="w-7 h-7 text-[#9333EA]" />
        </div>
        <div>
          <div className="text-sm font-semibold text-slate-500">Tổng số bài học</div>
          <div className="text-3xl font-extrabold text-slate-800 leading-tight">
            {lessons.length}
          </div>
          <div className="text-xs text-slate-500 font-medium">Bài học Tin học</div>
        </div>
      </div>

      {/* 4. Tổng số kết quả */}
      <div
        onClick={() => onNavigate('evaluations')}
        className="bg-white rounded-2xl p-4 shadow-xs border border-amber-100 flex items-center gap-4 hover:shadow-md hover:border-amber-300 transition-all cursor-pointer group"
      >
        <div className="w-14 h-14 rounded-full bg-[#FEF3C7] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
          <Award className="w-7 h-7 text-[#D97706]" />
        </div>
        <div>
          <div className="text-sm font-semibold text-slate-500">Tổng số kết quả</div>
          <div className="text-3xl font-extrabold text-slate-800 leading-tight">
            {evaluations.length}
          </div>
          <div className="text-xs text-slate-500 font-medium">Phiếu đánh giá</div>
        </div>
      </div>
    </div>
  );
};
