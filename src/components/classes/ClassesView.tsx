import React, { useState, useMemo } from 'react';
import { Plus, Search, School, Users, ClipboardCheck, Edit2, Trash2, ArrowRight } from 'lucide-react';
import { ClassRoom, Student, TabType } from '../../types';

interface ClassesViewProps {
  classes: ClassRoom[];
  students: Student[];
  onNavigate: (tab: TabType) => void;
  onOpenAddClass: () => void;
  onOpenEditClass: (cls: ClassRoom) => void;
  onDeleteClass: (classId: string) => void;
  onSelectClassForStudents: (classId: string) => void;
  onSelectClassForEvaluation: (classId: string) => void;
}

export const ClassesView: React.FC<ClassesViewProps> = ({
  classes,
  students,
  onNavigate,
  onOpenAddClass,
  onOpenEditClass,
  onDeleteClass,
  onSelectClassForStudents,
  onSelectClassForEvaluation,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [gradeFilter, setGradeFilter] = useState<string>('all');
  const [yearFilter, setYearFilter] = useState<string>('all');

  // Compute student counts per class
  const studentCountMap = useMemo(() => {
    const map: Record<string, number> = {};
    students.forEach((s) => {
      map[s.classId] = (map[s.classId] || 0) + 1;
    });
    return map;
  }, [students]);

  const filteredClasses = useMemo(() => {
    return classes.filter((c) => {
      const matchSearch =
        !searchQuery.trim() ||
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.code.toLowerCase().includes(searchQuery.toLowerCase());
      const matchGrade = gradeFilter === 'all' || c.grade.toString() === gradeFilter;
      const matchYear = yearFilter === 'all' || c.academicYear === yearFilter;
      return matchSearch && matchGrade && matchYear;
    });
  }, [classes, searchQuery, gradeFilter, yearFilter]);

  const distinctYears = useMemo(() => {
    const set = new Set(classes.map((c) => c.academicYear));
    return Array.from(set);
  }, [classes]);

  return (
    <div className="space-y-4">
      {/* Header bar */}
      <div className="bg-white rounded-2xl p-5 shadow-xs border border-sky-100 flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <School className="w-6 h-6 text-[#0878D1]" />
            <span>Quản lý Lớp học</span>
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Quản lý các lớp Tin học khối 3, khối 4, khối 5 tại Trường Tiểu học Thứ Ba.
          </p>
        </div>

        <button
          onClick={onOpenAddClass}
          className="flex items-center gap-2 bg-[#168BF0] hover:bg-blue-600 text-white font-bold px-4 py-2.5 rounded-xl shadow-xs transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Thêm lớp mới</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl p-4 shadow-xs border border-sky-100 flex flex-col md:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Tìm theo mã lớp, tên lớp (ví dụ: 3A, Lớp 3B)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <select
            value={gradeFilter}
            onChange={(e) => setGradeFilter(e.target.value)}
            className="text-sm py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 font-semibold"
          >
            <option value="all">Tất cả khối lớp</option>
            <option value="3">Khối 3</option>
            <option value="4">Khối 4</option>
            <option value="5">Khối 5</option>
          </select>

          <select
            value={yearFilter}
            onChange={(e) => setYearFilter(e.target.value)}
            className="text-sm py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 font-semibold"
          >
            <option value="all">Tất cả năm học</option>
            {distinctYears.map((yr) => (
              <option key={yr} value={yr}>
                {yr}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Classes Table */}
      <div className="bg-white rounded-2xl shadow-xs border border-sky-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold">
                <th className="py-3 px-4">Mã lớp</th>
                <th className="py-3 px-4">Tên lớp</th>
                <th className="py-3 px-4">Khối lớp</th>
                <th className="py-3 px-4">Năm học</th>
                <th className="py-3 px-4 text-center">Sĩ số</th>
                <th className="py-3 px-4">Ghi chú</th>
                <th className="py-3 px-4 text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredClasses.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    Chưa tìm thấy lớp học nào phù hợp. Hãy nhấn "+ Thêm lớp mới".
                  </td>
                </tr>
              ) : (
                filteredClasses.map((c) => {
                  const studentCount = studentCountMap[c.id] || 0;
                  return (
                    <tr key={c.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-slate-900">{c.code}</td>
                      <td className="py-3.5 px-4 font-semibold text-blue-700">{c.name}</td>
                      <td className="py-3.5 px-4 text-slate-600">Khối {c.grade}</td>
                      <td className="py-3.5 px-4 text-slate-600">{c.academicYear}</td>
                      <td className="py-3.5 px-4 text-center">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
                          {studentCount} học sinh
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-xs text-slate-500 italic max-w-xs truncate">
                        {c.note || '—'}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5 flex-wrap">
                          <button
                            onClick={() => onSelectClassForStudents(c.id)}
                            className="flex items-center gap-1 px-2.5 py-1.5 bg-sky-50 text-sky-700 hover:bg-sky-100 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                            title="Xem danh sách học sinh của lớp"
                          >
                            <Users className="w-3.5 h-3.5" />
                            <span>Học sinh</span>
                          </button>
                          <button
                            onClick={() => onSelectClassForEvaluation(c.id)}
                            className="flex items-center gap-1 px-2.5 py-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                            title="Nhập kết quả học tập lớp này"
                          >
                            <ClipboardCheck className="w-3.5 h-3.5" />
                            <span>Nhập điểm</span>
                          </button>
                          <button
                            onClick={() => onOpenEditClass(c)}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                            title="Sửa thông tin lớp"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => onDeleteClass(c.id)}
                            className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                            title="Xóa lớp học"
                          >
                            <Trash2 className="w-4 h-4" />
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
  );
};
