import React, { useState, useMemo } from 'react';
import {
  TrendingUp,
  BookOpen,
  CheckCircle2,
  Clock,
  Plus,
  Edit2,
  Users,
  AlertTriangle,
  Award,
} from 'lucide-react';
import { Lesson, ClassRoom, Student, EvaluationRecord, TabType } from '../../types';

interface ProgressViewProps {
  lessons: Lesson[];
  classes: ClassRoom[];
  students: Student[];
  evaluations: EvaluationRecord[];
  onNavigate: (tab: TabType) => void;
  onUpdateLesson: (lesson: Lesson) => void;
  onAddLesson: (lesson: Lesson) => void;
}

export const ProgressView: React.FC<ProgressViewProps> = ({
  lessons,
  classes,
  students,
  evaluations,
  onNavigate,
  onUpdateLesson,
  onAddLesson,
}) => {
  const [gradeFilter, setGradeFilter] = useState<number>(3);
  const [selectedClassId, setSelectedClassId] = useState<string>(classes[0]?.id || '3A');

  // Filter lessons by grade
  const gradeLessons = useMemo(() => {
    return lessons.filter((l) => l.grade === gradeFilter);
  }, [lessons, gradeFilter]);

  // Overall syllabus completion rate
  const completedLessons = gradeLessons.filter((l) => l.status === 'completed').length;
  const inProgressLessons = gradeLessons.filter((l) => l.status === 'in_progress').length;
  const plannedLessons = gradeLessons.filter((l) => l.status === 'planned').length;
  const completionPercent =
    gradeLessons.length > 0 ? Math.round((completedLessons / gradeLessons.length) * 100) : 0;

  // Selected class students and their evaluation coverage
  const targetClassStudents = useMemo(() => {
    return students.filter((s) => s.classId === selectedClassId);
  }, [students, selectedClassId]);

  // Modal to add lesson
  const [showAddLessonModal, setShowAddLessonModal] = useState(false);
  const [newCode, setNewCode] = useState(`Bài ${lessons.length + 1}`);
  const [newTitle, setNewTitle] = useState('');
  const [newTopic, setNewTopic] = useState('Chủ đề E: Ứng dụng tin học');
  const [newDate, setNewDate] = useState('24/10/2024');

  const handleCreateLesson = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    const newLesson: Lesson = {
      id: `bai-${Date.now()}`,
      code: newCode.trim(),
      title: newTitle.trim(),
      grade: gradeFilter,
      topic: newTopic,
      taughtDate: newDate,
      status: 'planned',
      note: '',
    };
    onAddLesson(newLesson);
    setShowAddLessonModal(false);
    setNewTitle('');
  };

  return (
    <div className="space-y-4">
      {/* Header bar */}
      <div className="bg-white rounded-2xl p-5 shadow-xs border border-sky-100 flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-[#0878D1]" />
            <span>Tiến độ giảng dạy và đánh giá môn Tin học</span>
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Theo dõi chương trình Tin học Tiểu học (Chương trình GDPT 2018) và mức độ bao phủ đánh giá.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              onClick={() => setGradeFilter(3)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                gradeFilter === 3 ? 'bg-[#168BF0] text-white' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Khối 3
            </button>
            <button
              onClick={() => setGradeFilter(4)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                gradeFilter === 4 ? 'bg-[#168BF0] text-white' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Khối 4
            </button>
            <button
              onClick={() => setGradeFilter(5)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                gradeFilter === 5 ? 'bg-[#168BF0] text-white' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Khối 5
            </button>
          </div>

          <button
            onClick={() => setShowAddLessonModal(true)}
            className="flex items-center gap-1.5 bg-[#168BF0] hover:bg-blue-600 text-white font-bold px-3.5 py-2 rounded-xl text-xs shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Thêm bài học</span>
          </button>
        </div>
      </div>

      {/* Progress Metric Card */}
      <div className="bg-white rounded-2xl p-5 shadow-xs border border-sky-100">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-3">
          <div>
            <div className="text-sm font-bold text-slate-800">
              Tiến độ thực hiện kế hoạch dạy học (Khối {gradeFilter})
            </div>
            <div className="text-xs text-slate-500 mt-0.5">
              Đã dạy {completedLessons}/{gradeLessons.length} bài ({completionPercent}%) • Đang dạy: {inProgressLessons} bài • Kế hoạch: {plannedLessons} bài
            </div>
          </div>
          <div className="text-2xl font-black text-[#0878D1]">
            {completionPercent}%
          </div>
        </div>

        {/* Multi-segmented Progress Bar */}
        <div className="h-4 w-full bg-slate-100 rounded-full overflow-hidden flex shadow-inner">
          <div
            style={{ width: `${(completedLessons / (gradeLessons.length || 1)) * 100}%` }}
            className="bg-emerald-500 h-full transition-all"
            title="Đã dạy và đánh giá"
          />
          <div
            style={{ width: `${(inProgressLessons / (gradeLessons.length || 1)) * 100}%` }}
            className="bg-amber-400 h-full transition-all"
            title="Đang giảng dạy"
          />
        </div>

        <div className="flex items-center gap-4 mt-3 text-xs text-slate-600">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
            <span>Đã dạy hoàn thành ({completedLessons})</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-amber-400"></span>
            <span>Đang dạy ({inProgressLessons})</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-slate-200"></span>
            <span>Chưa dạy ({plannedLessons})</span>
          </div>
        </div>
      </div>

      {/* Lessons List with Status Toggles and Student Coverage */}
      <div className="bg-white rounded-2xl shadow-xs border border-sky-100 overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="font-bold text-slate-800 text-sm flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-blue-600" />
            <span>Danh mục bài học Tin học Khối {gradeFilter}</span>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-500">Xem tiến độ theo lớp:</span>
            <select
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
              className="py-1 px-2.5 bg-white border border-slate-300 rounded-lg font-bold text-blue-700"
            >
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="divide-y divide-slate-100">
          {gradeLessons.map((lesson) => {
            // Count evaluations for this lesson in target class
            const lessonEvalsInClass = evaluations.filter(
              (e) => e.lessonId === lesson.id && e.classId === selectedClassId
            );
            const totalStudentsInClass = targetClassStudents.length || 1;
            const evalPercent = Math.min(
              100,
              Math.round((lessonEvalsInClass.length / totalStudentsInClass) * 100)
            );

            const goodInClass = lessonEvalsInClass.filter((e) => e.level === 'Hoàn thành tốt').length;
            const needHelpInClass = lessonEvalsInClass.filter((e) => e.level === 'Chưa hoàn thành').length;

            return (
              <div
                key={lesson.id}
                className="p-4 hover:bg-slate-50 transition-colors flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
              >
                {/* Left: Lesson Details */}
                <div className="flex-1">
                  <div className="flex items-center gap-2.5">
                    <span className="px-2.5 py-0.5 rounded-md bg-blue-100 text-blue-800 font-bold text-xs">
                      {lesson.code}
                    </span>
                    <h4 className="text-base font-bold text-slate-900">{lesson.title}</h4>
                  </div>

                  <div className="text-xs text-slate-500 mt-1 flex items-center gap-4 flex-wrap">
                    <span>{lesson.topic}</span>
                    <span>• Ngày dạy: <strong>{lesson.taughtDate}</strong></span>
                    {lesson.note && <span className="italic">• {lesson.note}</span>}
                  </div>
                </div>

                {/* Middle: Assessment Coverage for selected class */}
                <div className="w-full md:w-56 shrink-0 bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-xs">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-slate-600 font-semibold">Lớp {selectedClassId}:</span>
                    <span className="font-bold text-blue-700">
                      {lessonEvalsInClass.length}/{totalStudentsInClass} HS ({evalPercent}%)
                    </span>
                  </div>
                  <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
                    <div
                      style={{ width: `${evalPercent}%` }}
                      className={`h-full ${
                        evalPercent >= 90
                          ? 'bg-emerald-500'
                          : evalPercent > 0
                          ? 'bg-blue-500'
                          : 'bg-slate-300'
                      }`}
                    />
                  </div>
                  {needHelpInClass > 0 && (
                    <div className="mt-1 text-[11px] text-amber-700 flex items-center gap-1 font-semibold">
                      <AlertTriangle className="w-3 h-3 text-amber-500" />
                      <span>{needHelpInClass} em cần hỗ trợ thêm</span>
                    </div>
                  )}
                </div>

                {/* Right: Status Switcher */}
                <div className="flex items-center gap-2 shrink-0">
                  <select
                    value={lesson.status}
                    onChange={(e) => {
                      onUpdateLesson({
                        ...lesson,
                        status: e.target.value as any,
                      });
                    }}
                    className={`text-xs font-bold py-1.5 px-3 rounded-xl border ${
                      lesson.status === 'completed'
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                        : lesson.status === 'in_progress'
                        ? 'bg-amber-50 text-amber-800 border-amber-300'
                        : 'bg-slate-100 text-slate-700 border-slate-300'
                    }`}
                  >
                    <option value="completed">Đã dạy xong</option>
                    <option value="in_progress">Đang dạy</option>
                    <option value="planned">Chưa dạy (Kế hoạch)</option>
                  </select>

                  <button
                    onClick={() => onNavigate('evaluations')}
                    className="px-3 py-1.5 bg-[#168BF0] hover:bg-blue-600 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
                  >
                    Đánh giá
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Add Lesson Modal */}
      {showAddLessonModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 border border-slate-200">
            <h3 className="text-lg font-bold text-slate-800 mb-4">
              Thêm bài học Tin học (Khối {gradeFilter})
            </h3>
            <form onSubmit={handleCreateLesson} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Mã bài</label>
                <input
                  type="text"
                  value={newCode}
                  onChange={(e) => setNewCode(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Tên bài học</label>
                <input
                  type="text"
                  placeholder="Ví dụ: Em tập trình chiếu bài thuyết trình..."
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Chủ đề</label>
                <select
                  value={newTopic}
                  onChange={(e) => setNewTopic(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl font-semibold"
                >
                  <option value="Chủ đề A: Máy tính và em">Chủ đề A: Máy tính và em</option>
                  <option value="Chủ đề B: Mạng máy tính và Internet">Chủ đề B: Mạng máy tính và Internet</option>
                  <option value="Chủ đề C: Tổ chức lưu trữ, tìm kiếm thông tin">Chủ đề C: Tổ chức lưu trữ, tìm kiếm thông tin</option>
                  <option value="Chủ đề D: Đạo đức, pháp luật môi trường số">Chủ đề D: Đạo đức, pháp luật môi trường số</option>
                  <option value="Chủ đề E: Ứng dụng tin học">Chủ đề E: Ứng dụng tin học</option>
                  <option value="Chủ đề F: Giải quyết vấn đề với máy tính">Chủ đề F: Giải quyết vấn đề với máy tính</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Ngày dự kiến dạy</label>
                <input
                  type="text"
                  value={newDate}
                  onChange={(e) => setNewDate(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddLessonModal(false)}
                  className="px-4 py-2 text-sm font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-sm font-bold text-white bg-[#168BF0] hover:bg-blue-600 rounded-xl shadow-xs"
                >
                  Thêm bài học
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
