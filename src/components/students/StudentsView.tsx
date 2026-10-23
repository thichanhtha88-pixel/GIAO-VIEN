import React, { useState, useMemo } from 'react';
import {
  Plus,
  Search,
  GraduationCap,
  FileSpreadsheet,
  Edit2,
  Trash2,
  Eye,
  ArrowRightLeft,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';
import { Student, ClassRoom, EvaluationRecord, TabType } from '../../types';

interface StudentsViewProps {
  students: Student[];
  classes: ClassRoom[];
  evaluations: EvaluationRecord[];
  initialSelectedClassId?: string;
  onNavigate: (tab: TabType) => void;
  onOpenAddStudent: (classId?: string) => void;
  onOpenEditStudent: (student: Student) => void;
  onDeleteStudent: (studentId: string) => void;
  onOpenStudentProfile: (student: Student) => void;
  onOpenTransferClass: (student: Student) => void;
}

export const StudentsView: React.FC<StudentsViewProps> = ({
  students,
  classes,
  evaluations,
  initialSelectedClassId,
  onNavigate,
  onOpenAddStudent,
  onOpenEditStudent,
  onDeleteStudent,
  onOpenStudentProfile,
  onOpenTransferClass,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [classFilter, setClassFilter] = useState<string>(initialSelectedClassId || 'all');
  const [yearFilter, setYearFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const pageSize = 10;

  // Compute evaluation stats per student
  const studentEvalMap = useMemo(() => {
    const map: Record<
      string,
      { count: number; good: number; completed: number; notCompleted: number; lastEval?: EvaluationRecord }
    > = {};

    evaluations.forEach((e) => {
      if (!map[e.studentId]) {
        map[e.studentId] = { count: 0, good: 0, completed: 0, notCompleted: 0 };
      }
      map[e.studentId].count += 1;
      if (e.level === 'Hoàn thành tốt') map[e.studentId].good += 1;
      else if (e.level === 'Hoàn thành') map[e.studentId].completed += 1;
      else if (e.level === 'Chưa hoàn thành') map[e.studentId].notCompleted += 1;

      if (!map[e.studentId].lastEval) {
        map[e.studentId].lastEval = e;
      }
    });

    return map;
  }, [evaluations]);

  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      const matchSearch =
        !searchQuery.trim() ||
        s.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.studentCode.toLowerCase().includes(searchQuery.toLowerCase());
      const matchClass = classFilter === 'all' || s.classId === classFilter;
      const matchYear = yearFilter === 'all' || s.academicYear === yearFilter;
      return matchSearch && matchClass && matchYear;
    });
  }, [students, searchQuery, classFilter, yearFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredStudents.length / pageSize));
  const paginatedStudents = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredStudents.slice(start, start + pageSize);
  }, [filteredStudents, currentPage]);

  const distinctYears = useMemo(() => {
    const set = new Set(students.map((s) => s.academicYear));
    return Array.from(set);
  }, [students]);

  return (
    <div className="space-y-4">
      {/* Header bar */}
      <div className="bg-white rounded-2xl p-5 shadow-xs border border-sky-100 flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <GraduationCap className="w-6 h-6 text-[#0878D1]" />
            <span>Quản lý Học sinh</span>
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Tổng cộng: <strong className="text-slate-800">{students.length} học sinh</strong> trong danh sách.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => onNavigate('import_export')}
            className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3.5 py-2 rounded-xl text-sm shadow-xs transition-colors cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Nhập từ CSV / Excel</span>
          </button>
          <button
            onClick={() => onOpenAddStudent(classFilter !== 'all' ? classFilter : undefined)}
            className="flex items-center gap-1.5 bg-[#168BF0] hover:bg-blue-600 text-white font-bold px-4 py-2 rounded-xl text-sm shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Thêm học sinh</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl p-4 shadow-xs border border-sky-100 flex flex-col md:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Tìm theo họ tên, mã học sinh (ví dụ: HS001, Minh Anh)..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <select
            value={classFilter}
            onChange={(e) => {
              setClassFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="text-sm py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 font-semibold"
          >
            <option value="all">Tất cả lớp ({students.length})</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          <select
            value={yearFilter}
            onChange={(e) => {
              setYearFilter(e.target.value);
              setCurrentPage(1);
            }}
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

      {/* Students Table */}
      <div className="bg-white rounded-2xl shadow-xs border border-sky-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold">
                <th className="py-3 px-3 text-center w-12">STT</th>
                <th className="py-3 px-4">Mã HS</th>
                <th className="py-3 px-4">Họ và tên</th>
                <th className="py-3 px-3 text-center">Lớp</th>
                <th className="py-3 px-4">Năm học</th>
                <th className="py-3 px-4 text-center">Đã đánh giá</th>
                <th className="py-3 px-4">Đánh giá gần nhất</th>
                <th className="py-3 px-4 text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedStudents.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    Không tìm thấy học sinh nào phù hợp với bộ lọc.
                  </td>
                </tr>
              ) : (
                paginatedStudents.map((s, idx) => {
                  const evalStats = studentEvalMap[s.id];
                  const evalCount = evalStats ? evalStats.count : 0;
                  const lastLevel = evalStats?.lastEval?.level;

                  return (
                    <tr key={s.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-3 text-center text-slate-500 font-medium">
                        {(currentPage - 1) * pageSize + idx + 1}
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-slate-700">
                        {s.studentCode}
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-900">
                        {s.fullName}
                      </td>
                      <td className="py-3 px-3 text-center font-bold text-blue-700">
                        {s.classId}
                      </td>
                      <td className="py-3 px-4 text-slate-600 text-xs">
                        {s.academicYear}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
                          {evalCount} bài
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        {lastLevel ? (
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-xs font-bold inline-block ${
                              lastLevel === 'Hoàn thành tốt'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : lastLevel === 'Hoàn thành'
                                ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                : 'bg-red-50 text-red-700 border border-red-200'
                            }`}
                          >
                            {lastLevel}
                          </span>
                        ) : (
                          <span className="text-xs text-slate-400 italic">Chưa đánh giá</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5 flex-wrap">
                          <button
                            onClick={() => onOpenStudentProfile(s)}
                            className="p-1.5 text-sky-600 hover:bg-sky-50 rounded-lg transition-colors cursor-pointer"
                            title="Xem hồ sơ & lịch sử kết quả chi tiết"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => onOpenTransferClass(s)}
                            className="p-1.5 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors cursor-pointer"
                            title="Chuyển lớp cho học sinh"
                          >
                            <ArrowRightLeft className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => onOpenEditStudent(s)}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                            title="Sửa thông tin học sinh"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => onDeleteStudent(s.id)}
                            className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                            title="Xóa học sinh"
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

        {/* Pagination Bar */}
        <div className="p-4 bg-slate-50/70 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600 font-medium">
          <div>
            Hiển thị {(currentPage - 1) * pageSize + 1} -{' '}
            {Math.min(currentPage * pageSize, filteredStudents.length)} /{' '}
            {filteredStudents.length} học sinh
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 cursor-pointer"
            >
              Trang trước
            </button>
            {Array.from({ length: totalPages }).map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentPage(i + 1)}
                className={`w-8 h-8 rounded-lg font-bold text-xs cursor-pointer ${
                  currentPage === i + 1
                    ? 'bg-[#168BF0] text-white shadow-xs'
                    : 'bg-white hover:bg-slate-100 border border-slate-200 text-slate-700'
                }`}
              >
                {i + 1}
              </button>
            ))}
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 cursor-pointer"
            >
              Trang sau
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
