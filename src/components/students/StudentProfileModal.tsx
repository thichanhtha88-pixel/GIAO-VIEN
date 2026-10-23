import React from 'react';
import {
  GraduationCap,
  Award,
  CheckCircle,
  AlertTriangle,
  History,
  Calendar,
  BookOpen,
} from 'lucide-react';
import { Student, EvaluationRecord, ClassRoom } from '../../types';
import { Modal } from '../common/Modal';

interface StudentProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: Student | null;
  classes: ClassRoom[];
  evaluations: EvaluationRecord[];
}

export const StudentProfileModal: React.FC<StudentProfileModalProps> = ({
  isOpen,
  onClose,
  student,
  classes,
  evaluations,
}) => {
  if (!student) return null;

  const currentClass = classes.find((c) => c.id === student.classId);
  const studentEvals = evaluations.filter((e) => e.studentId === student.id);

  const goodCount = studentEvals.filter((e) => e.level === 'Hoàn thành tốt').length;
  const completedCount = studentEvals.filter((e) => e.level === 'Hoàn thành').length;
  const notCompletedCount = studentEvals.filter((e) => e.level === 'Chưa hoàn thành').length;
  const totalCount = studentEvals.length;

  const goodPercent = totalCount > 0 ? Math.round((goodCount / totalCount) * 100) : 0;
  const compPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
  const notPercent = totalCount > 0 ? Math.round((notCompletedCount / totalCount) * 100) : 0;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Hồ sơ học sinh: ${student.fullName}`}
      maxWidth="max-w-2xl"
    >
      <div className="space-y-5">
        {/* Basic Student Info Card */}
        <div className="bg-sky-50/70 border border-sky-200 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-[#0878D1] text-white flex items-center justify-center font-bold text-xl shadow-xs">
              {student.fullName.charAt(0)}
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-800">{student.fullName}</h3>
              <div className="text-xs text-slate-500 font-mono">Mã số: {student.studentCode}</div>
            </div>
          </div>

          <div className="flex items-center gap-3 text-xs">
            <div className="bg-white px-3 py-1.5 rounded-xl border border-sky-200">
              <span className="text-slate-500">Lớp:</span>{' '}
              <strong className="text-blue-700 font-bold">{student.classId}</strong>
            </div>
            <div className="bg-white px-3 py-1.5 rounded-xl border border-sky-200">
              <span className="text-slate-500">Năm học:</span>{' '}
              <strong className="text-slate-800 font-bold">{student.academicYear}</strong>
            </div>
          </div>
        </div>

        {/* Learning Progress Summary */}
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <h4 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
            <Award className="w-4 h-4 text-amber-500" />
            <span>Tiến độ và kết quả môn Tin học</span>
          </h4>

          {/* Counters */}
          <div className="grid grid-cols-3 gap-3 text-center mb-3">
            <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200">
              <div className="text-xs text-emerald-800 font-semibold">Hoàn thành tốt</div>
              <div className="text-xl font-extrabold text-emerald-600">{goodCount}</div>
            </div>
            <div className="p-2.5 rounded-xl bg-sky-50 border border-sky-200">
              <div className="text-xs text-sky-800 font-semibold">Hoàn thành</div>
              <div className="text-xl font-extrabold text-sky-600">{completedCount}</div>
            </div>
            <div className="p-2.5 rounded-xl bg-red-50 border border-red-200">
              <div className="text-xs text-red-800 font-semibold">Cần hỗ trợ thêm</div>
              <div className="text-xl font-extrabold text-red-600">{notCompletedCount}</div>
            </div>
          </div>

          {/* Progress bar */}
          {totalCount > 0 ? (
            <div>
              <div className="flex justify-between text-xs text-slate-500 mb-1">
                <span>Tỉ lệ đánh giá</span>
                <span>{totalCount} bài học đã hoàn thành</span>
              </div>
              <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden flex">
                <div style={{ width: `${goodPercent}%` }} className="bg-emerald-500 h-full" title={`Hoàn thành tốt: ${goodPercent}%`} />
                <div style={{ width: `${compPercent}%` }} className="bg-sky-400 h-full" title={`Hoàn thành: ${compPercent}%`} />
                <div style={{ width: `${notPercent}%` }} className="bg-red-400 h-full" title={`Chưa hoàn thành: ${notPercent}%`} />
              </div>
            </div>
          ) : (
            <div className="text-xs text-slate-400 italic text-center py-2">
              Học sinh chưa có bài học nào được đánh giá.
            </div>
          )}
        </div>

        {/* Detailed Evaluation History Table */}
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <h4 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
            <History className="w-4 h-4 text-blue-600" />
            <span>Lịch sử đánh giá từng bài học</span>
          </h4>

          {studentEvals.length === 0 ? (
            <p className="text-xs text-slate-400 italic text-center py-4">
              Chưa có dữ liệu đánh giá cho em {student.fullName}.
            </p>
          ) : (
            <div className="space-y-3">
              {studentEvals.map((e) => {
                const badgeColor =
                  e.level === 'Hoàn thành tốt'
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : e.level === 'Hoàn thành'
                    ? 'bg-amber-50 text-amber-700 border-amber-200'
                    : 'bg-red-50 text-red-700 border-red-200';

                return (
                  <div
                    key={e.id}
                    className="p-3 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="text-sm font-bold text-slate-800">{e.lessonTitle}</div>
                        <div className="text-xs text-slate-500 flex items-center gap-3 mt-1">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5 text-slate-400" />
                            {e.evaluationDate}
                          </span>
                          <span>Hình thức: <strong className="text-slate-700">{e.activityType}</strong></span>
                        </div>
                      </div>

                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${badgeColor}`}>
                        {e.level}
                      </span>
                    </div>

                    <div className="mt-2 text-xs bg-white p-2.5 rounded-lg border border-slate-200 text-slate-700">
                      <span className="font-semibold text-slate-900">Nhận xét của giáo viên:</span>{' '}
                      <span className="italic text-slate-700">{e.comment || 'Không có nhận xét thêm.'}</span>
                    </div>

                    {e.history && e.history.length > 0 && (
                      <div className="mt-2 pt-2 border-t border-slate-200 text-[11px] text-slate-400">
                        Lịch sử cập nhật: Đã sửa {e.history.length} lần (lần trước: {e.history[0].level} – "{e.history[0].comment}")
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Close Button */}
        <div className="flex justify-end pt-2">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm rounded-xl transition-colors cursor-pointer"
          >
            Đóng hồ sơ
          </button>
        </div>
      </div>
    </Modal>
  );
};
