import React, { useState, useMemo, useEffect } from 'react';
import {
  ClipboardCheck,
  Calendar,
  Save,
  Search,
  CheckCircle,
  Filter,
  Check,
  Edit2,
  Trash2,
  History,
  Sparkles,
} from 'lucide-react';
import {
  ClassRoom,
  Student,
  Lesson,
  EvaluationRecord,
  EvaluationLevel,
  ActivityType,
} from '../../types';

interface EvaluationsViewProps {
  classes: ClassRoom[];
  students: Student[];
  lessons: Lesson[];
  evaluations: EvaluationRecord[];
  initialClassId?: string;
  onSaveEvaluations: (records: Array<Omit<EvaluationRecord, 'id' | 'updatedAt'>>) => void;
  onDeleteEvaluation: (evalId: string) => void;
  onOpenEditEvaluation: (evaluation: EvaluationRecord) => void;
}

export const EvaluationsView: React.FC<EvaluationsViewProps> = ({
  classes,
  students,
  lessons,
  evaluations,
  initialClassId,
  onSaveEvaluations,
  onDeleteEvaluation,
  onOpenEditEvaluation,
}) => {
  // Mode: 'batch' (Workflow 6 bước nhập kết quả hàng loạt) or 'history' (Tra cứu lịch sử kết quả đã lưu)
  const [activeMode, setActiveMode] = useState<'batch' | 'history'>('batch');

  // Step 1: Chọn lớp
  const [selectedClassId, setSelectedClassId] = useState<string>(
    initialClassId || (classes[0] ? classes[0].id : '3A')
  );

  // Step 2: Chọn bài học
  const [selectedLessonId, setSelectedLessonId] = useState<string>(
    lessons[0] ? lessons[0].id : 'bai-1'
  );

  // Step 3: Chọn ngày đánh giá
  const todayStr = useMemo(() => {
    const d = new Date();
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
  }, []);
  const [evalDate, setEvalDate] = useState<string>(todayStr);

  // Step 4: Loại hoạt động
  const [activityType, setActivityType] = useState<ActivityType>('Bài thực hành');

  // Students in selected class
  const classStudents = useMemo(() => {
    return students.filter((s) => s.classId === selectedClassId);
  }, [students, selectedClassId]);

  // Current lesson details
  const currentLesson = useMemo(() => {
    return lessons.find((l) => l.id === selectedLessonId);
  }, [lessons, selectedLessonId]);

  // Step 5: Form state for each student in the class
  const [studentGrades, setStudentGrades] = useState<
    Record<
      string,
      {
        level: EvaluationLevel;
        comment: string;
      }
    >
  >({});

  // Sync initial student grades when class or lesson changes (loads existing evaluations if already evaluated)
  useEffect(() => {
    const newGrades: Record<string, { level: EvaluationLevel; comment: string }> = {};

    classStudents.forEach((student) => {
      const existing = evaluations.find(
        (e) => e.studentId === student.id && e.lessonId === selectedLessonId
      );
      if (existing) {
        newGrades[student.id] = {
          level: existing.level,
          comment: existing.comment,
        };
      } else {
        newGrades[student.id] = {
          level: 'Hoàn thành tốt', // Default sensible grade
          comment: '',
        };
      }
    });

    setStudentGrades(newGrades);
  }, [selectedClassId, selectedLessonId, classStudents, evaluations]);

  // Quick preset phrases for comments
  const quickRemarks = [
    'Rất tốt!',
    'Thao tác chuột nhanh và chính xác.',
    'Gõ phím 10 ngón đúng vị trí.',
    'Tích cực phát biểu, thực hành tốt.',
    'Vẽ tranh sáng tạo, phối màu đẹp.',
    'Cố gắng hơn nữa!',
    'Cần giáo viên hỗ trợ khi thực hành.',
    'Cần rèn luyện thao tác chuột ở nhà.',
  ];

  // Helper to mass set all students in class
  const handleSetAllLevel = (level: EvaluationLevel) => {
    setStudentGrades((prev) => {
      const updated = { ...prev };
      classStudents.forEach((s) => {
        updated[s.id] = {
          ...updated[s.id],
          level,
        };
      });
      return updated;
    });
  };

  // Step 6: Save all results
  const [saveSuccessNotice, setSaveSuccessNotice] = useState(false);

  const handleSaveAll = () => {
    if (!currentLesson) return;

    const recordsToSave: Array<Omit<EvaluationRecord, 'id' | 'updatedAt'>> = classStudents.map(
      (s) => {
        const grade = studentGrades[s.id] || {
          level: 'Hoàn thành tốt',
          comment: '',
        };

        return {
          studentId: s.id,
          studentCode: s.studentCode,
          studentName: s.fullName,
          classId: selectedClassId,
          lessonId: selectedLessonId,
          lessonTitle: `${currentLesson.code}: ${currentLesson.title}`,
          evaluationDate: evalDate,
          activityType,
          level: grade.level,
          comment: grade.comment.trim(),
        };
      }
    );

    onSaveEvaluations(recordsToSave);
    setSaveSuccessNotice(true);
    setTimeout(() => setSaveSuccessNotice(false), 4000);
  };

  // Save single student result
  const handleSaveSingle = (studentId: string) => {
    const student = classStudents.find((s) => s.id === studentId);
    if (!student || !currentLesson) return;

    const grade = studentGrades[studentId] || {
      level: 'Hoàn thành tốt',
      comment: '',
    };

    onSaveEvaluations([
      {
        studentId: student.id,
        studentCode: student.studentCode,
        studentName: student.fullName,
        classId: selectedClassId,
        lessonId: selectedLessonId,
        lessonTitle: `${currentLesson.code}: ${currentLesson.title}`,
        evaluationDate: evalDate,
        activityType,
        level: grade.level,
        comment: grade.comment.trim(),
      },
    ]);
  };

  // Search & Filters for History Tab
  const [histClassFilter, setHistClassFilter] = useState('all');
  const [histLessonFilter, setHistLessonFilter] = useState('all');
  const [histLevelFilter, setHistLevelFilter] = useState('all');
  const [histSearch, setHistSearch] = useState('');

  const filteredHistory = useMemo(() => {
    return evaluations.filter((e) => {
      const matchClass = histClassFilter === 'all' || e.classId === histClassFilter;
      const matchLesson = histLessonFilter === 'all' || e.lessonId === histLessonFilter;
      const matchLevel = histLevelFilter === 'all' || e.level === histLevelFilter;
      const matchSearch =
        !histSearch.trim() ||
        e.studentName.toLowerCase().includes(histSearch.toLowerCase()) ||
        e.studentCode.toLowerCase().includes(histSearch.toLowerCase());
      return matchClass && matchLesson && matchLevel && matchSearch;
    });
  }, [evaluations, histClassFilter, histLessonFilter, histLevelFilter, histSearch]);

  return (
    <div className="space-y-4">
      {/* Header Bar with Mode Switcher */}
      <div className="bg-white rounded-2xl p-5 shadow-xs border border-sky-100 flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <ClipboardCheck className="w-6 h-6 text-[#0878D1]" />
            <span>Quản lý Kết quả học tập Tin học</span>
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Quy trình cập nhật kết quả sau mỗi tiết học & thực hành theo Thông tư 27/2020/TT-BGDĐT.
          </p>
        </div>

        {/* Tab switcher */}
        <div className="flex items-center p-1 bg-slate-100 rounded-xl border border-slate-200">
          <button
            onClick={() => setActiveMode('batch')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeMode === 'batch'
                ? 'bg-[#168BF0] text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Nhập kết quả theo bài
          </button>
          <button
            onClick={() => setActiveMode('history')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeMode === 'history'
                ? 'bg-[#168BF0] text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Lịch sử & Tra cứu ({evaluations.length})
          </button>
        </div>
      </div>

      {activeMode === 'batch' ? (
        <div className="space-y-4">
          {/* Step 1 to 4: Workflow Control Panel */}
          <div className="bg-white rounded-2xl p-5 shadow-xs border border-sky-100">
            <div className="text-xs font-bold text-blue-800 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold">1</span>
              <span>Thiết lập đánh giá theo bài học</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Step 1: Chọn lớp */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Bước 1: Chọn lớp học
                </label>
                <select
                  value={selectedClassId}
                  onChange={(e) => setSelectedClassId(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl font-bold text-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({students.filter((s) => s.classId === c.id).length} học sinh)
                    </option>
                  ))}
                </select>
              </div>

              {/* Step 2: Chọn bài học */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Bước 2: Chọn bài học Tin học
                </label>
                <select
                  value={selectedLessonId}
                  onChange={(e) => setSelectedLessonId(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {lessons.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.code}: {l.title}
                    </option>
                  ))}
                </select>
              </div>

              {/* Step 3: Ngày đánh giá */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Bước 3: Ngày đánh giá
                </label>
                <div className="relative">
                  <Calendar className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={evalDate}
                    onChange={(e) => setEvalDate(e.target.value)}
                    placeholder="dd/mm/yyyy"
                    className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Step 4: Loại hoạt động */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Bước 4: Loại hoạt động
                </label>
                <select
                  value={activityType}
                  onChange={(e) => setActivityType(e.target.value as ActivityType)}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Bài thực hành">Bài thực hành</option>
                  <option value="Câu hỏi kiểm tra">Câu hỏi kiểm tra</option>
                  <option value="Nhiệm vụ nhóm">Nhiệm vụ nhóm</option>
                  <option value="Sản phẩm học tập">Sản phẩm học tập</option>
                  <option value="Quan sát trong giờ học">Quan sát trong giờ học</option>
                </select>
              </div>
            </div>

            {/* Quick mass action helpers */}
            <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                <span className="text-slate-500 font-semibold">Gán nhanh cả lớp:</span>
                <button
                  type="button"
                  onClick={() => handleSetAllLevel('Hoàn thành tốt')}
                  className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 font-bold cursor-pointer"
                >
                  Tất cả "Hoàn thành tốt"
                </button>
                <button
                  type="button"
                  onClick={() => handleSetAllLevel('Hoàn thành')}
                  className="px-2.5 py-1 rounded-lg bg-sky-50 text-sky-700 border border-sky-200 hover:bg-sky-100 font-bold cursor-pointer"
                >
                  Tất cả "Hoàn thành"
                </button>
              </div>

              <div className="text-slate-500 font-medium">
                Đang hiển thị: <strong className="text-slate-800">{classStudents.length} học sinh</strong> của Lớp {selectedClassId}
              </div>
            </div>
          </div>

          {/* Success Banner Notice */}
          {saveSuccessNotice && (
            <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-2xl flex items-center justify-between text-emerald-900 animate-fadeIn">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-6 h-6 text-emerald-600 shrink-0" />
                <div>
                  <div className="font-bold text-sm">Đã lưu kết quả thành công!</div>
                  <div className="text-xs text-emerald-700">
                    Toàn bộ {classStudents.length} phiếu đánh giá cho {currentLesson?.code} ({selectedClassId}) đã được lưu trực tuyến.
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 5: Table with all students */}
          <div className="bg-white rounded-2xl shadow-xs border border-sky-100 overflow-hidden">
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div className="font-bold text-slate-800 text-sm">
                Danh sách đánh giá: {currentLesson?.code} – {currentLesson?.title}
              </div>
              <button
                onClick={handleSaveAll}
                className="flex items-center gap-2 bg-[#168BF0] hover:bg-blue-600 text-white font-bold px-5 py-2 rounded-xl text-sm shadow-sm transition-colors cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>Lưu toàn bộ kết quả ({classStudents.length} học sinh)</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-100/70 border-b border-slate-200 text-slate-700 font-bold">
                    <th className="py-3 px-3 text-center w-10">STT</th>
                    <th className="py-3 px-3 w-20">Mã HS</th>
                    <th className="py-3 px-4 w-48">Họ và tên</th>
                    <th className="py-3 px-4 w-52">Mức đánh giá</th>
                    <th className="py-3 px-4">Nhận xét của giáo viên</th>
                    <th className="py-3 px-3 text-center w-24">Lưu riêng</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {classStudents.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-slate-400">
                        Chưa có học sinh nào trong lớp {selectedClassId}. Vui lòng thêm học sinh trước.
                      </td>
                    </tr>
                  ) : (
                    classStudents.map((student, idx) => {
                      const grade = studentGrades[student.id] || {
                        level: 'Hoàn thành tốt',
                        comment: '',
                      };

                      return (
                        <tr key={student.id} className="hover:bg-sky-50/40 transition-colors">
                          <td className="py-3 px-3 text-center text-slate-500 font-semibold">
                            {idx + 1}
                          </td>
                          <td className="py-3 px-3 font-mono font-bold text-slate-700">
                            {student.studentCode}
                          </td>
                          <td className="py-3 px-4 font-bold text-slate-900">
                            {student.fullName}
                          </td>
                          <td className="py-3 px-4">
                            <select
                              value={grade.level}
                              onChange={(e) => {
                                const newLvl = e.target.value as EvaluationLevel;
                                setStudentGrades((prev) => ({
                                  ...prev,
                                  [student.id]: {
                                    ...prev[student.id],
                                    level: newLvl,
                                  },
                                }));
                              }}
                              className={`w-full py-1.5 px-2.5 rounded-lg text-xs font-bold border ${
                                grade.level === 'Hoàn thành tốt'
                                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                                  : grade.level === 'Hoàn thành'
                                  ? 'bg-amber-50 text-amber-800 border-amber-300'
                                  : grade.level === 'Chưa hoàn thành'
                                  ? 'bg-red-50 text-red-800 border-red-300'
                                  : 'bg-slate-50 text-slate-600 border-slate-300'
                              }`}
                            >
                              <option value="Hoàn thành tốt">Hoàn thành tốt</option>
                              <option value="Hoàn thành">Hoàn thành</option>
                              <option value="Chưa hoàn thành">Chưa hoàn thành</option>
                              <option value="Chưa đánh giá">Chưa đánh giá</option>
                            </select>
                          </td>
                          <td className="py-3 px-4">
                            <div className="space-y-1.5">
                              <input
                                type="text"
                                placeholder="Ghi nhận xét cụ thể cho học sinh..."
                                value={grade.comment}
                                onChange={(e) => {
                                  const comment = e.target.value;
                                  setStudentGrades((prev) => ({
                                    ...prev,
                                    [student.id]: {
                                      ...prev[student.id],
                                      comment,
                                    },
                                  }));
                                }}
                                className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                              />

                              {/* Quick remarks buttons */}
                              <div className="flex items-center gap-1 flex-wrap">
                                {quickRemarks.slice(0, 4).map((rem) => (
                                  <button
                                    key={rem}
                                    type="button"
                                    onClick={() => {
                                      setStudentGrades((prev) => ({
                                        ...prev,
                                        [student.id]: {
                                          ...prev[student.id],
                                          comment: rem,
                                        },
                                      }));
                                    }}
                                    className="px-1.5 py-0.5 rounded text-[10px] bg-slate-100 hover:bg-blue-100 text-slate-600 hover:text-blue-700 transition-colors cursor-pointer"
                                  >
                                    + {rem}
                                  </button>
                                ))}
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-3 text-center">
                            <button
                              type="button"
                              onClick={() => handleSaveSingle(student.id)}
                              className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-600 hover:text-white font-bold text-xs transition-colors cursor-pointer"
                              title="Lưu kết quả em này"
                            >
                              Lưu
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Bottom Save Bar */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
              <span className="text-xs text-slate-500 font-medium">
                * Mức đánh giá không tự động chuyển thành điểm số, thực hiện đánh giá vì sự tiến bộ của học sinh.
              </span>
              <button
                onClick={handleSaveAll}
                className="flex items-center gap-2 bg-[#168BF0] hover:bg-blue-600 text-white font-bold px-6 py-2.5 rounded-xl text-sm shadow-md transition-colors cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>Lưu toàn bộ kết quả ({classStudents.length} học sinh)</span>
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* History & Audit Tab */
        <div className="space-y-4">
          {/* History Search & Filters */}
          <div className="bg-white rounded-2xl p-4 shadow-xs border border-sky-100 grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
            <div>
              <label className="block text-slate-600 font-bold mb-1">Tìm học sinh</label>
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Tên hoặc mã HS..."
                  value={histSearch}
                  onChange={(e) => setHistSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-600 font-bold mb-1">Lọc theo Lớp</label>
              <select
                value={histClassFilter}
                onChange={(e) => setHistClassFilter(e.target.value)}
                className="w-full py-1.5 px-2 bg-slate-50 border border-slate-200 rounded-lg font-bold"
              >
                <option value="all">Tất cả lớp</option>
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-600 font-bold mb-1">Lọc theo Bài học</label>
              <select
                value={histLessonFilter}
                onChange={(e) => setHistLessonFilter(e.target.value)}
                className="w-full py-1.5 px-2 bg-slate-50 border border-slate-200 rounded-lg font-semibold"
              >
                <option value="all">Tất cả bài học</option>
                {lessons.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.code}: {l.title}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-600 font-bold mb-1">Lọc theo Kết quả</label>
              <select
                value={histLevelFilter}
                onChange={(e) => setHistLevelFilter(e.target.value)}
                className="w-full py-1.5 px-2 bg-slate-50 border border-slate-200 rounded-lg font-semibold"
              >
                <option value="all">Tất cả mức kết quả</option>
                <option value="Hoàn thành tốt">Hoàn thành tốt</option>
                <option value="Hoàn thành">Hoàn thành</option>
                <option value="Chưa hoàn thành">Chưa hoàn thành</option>
              </select>
            </div>
          </div>

          {/* History Results Table */}
          <div className="bg-white rounded-2xl shadow-xs border border-sky-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold">
                    <th className="py-3 px-3 text-center w-10">STT</th>
                    <th className="py-3 px-3">Mã HS</th>
                    <th className="py-3 px-4">Họ và tên</th>
                    <th className="py-3 px-2 text-center">Lớp</th>
                    <th className="py-3 px-4">Bài học</th>
                    <th className="py-3 px-3">Ngày đánh giá</th>
                    <th className="py-3 px-3">Hoạt động</th>
                    <th className="py-3 px-3">Kết quả</th>
                    <th className="py-3 px-4">Nhận xét</th>
                    <th className="py-3 px-3 text-center">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredHistory.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="py-12 text-center text-slate-400">
                        Không tìm thấy phiếu đánh giá nào phù hợp với bộ lọc.
                      </td>
                    </tr>
                  ) : (
                    filteredHistory.map((rec, idx) => (
                      <tr key={rec.id} className="hover:bg-slate-50">
                        <td className="py-3 px-3 text-center text-slate-500">{idx + 1}</td>
                        <td className="py-3 px-3 font-mono font-bold text-slate-700">{rec.studentCode}</td>
                        <td className="py-3 px-4 font-bold text-slate-900">{rec.studentName}</td>
                        <td className="py-3 px-2 text-center font-bold text-blue-700">{rec.classId}</td>
                        <td className="py-3 px-4 text-slate-700 font-medium">{rec.lessonTitle}</td>
                        <td className="py-3 px-3 text-slate-600">{rec.evaluationDate}</td>
                        <td className="py-3 px-3 text-slate-600">{rec.activityType}</td>
                        <td className="py-3 px-3">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                              rec.level === 'Hoàn thành tốt'
                                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                : rec.level === 'Hoàn thành'
                                ? 'bg-amber-50 text-amber-800 border border-amber-200'
                                : 'bg-red-50 text-red-800 border border-red-200'
                            }`}
                          >
                            {rec.level}
                          </span>
                        </td>
                        <td className="py-3 px-4 italic text-slate-600 max-w-xs truncate" title={rec.comment}>
                          {rec.comment || '—'}
                        </td>
                        <td className="py-3 px-3 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => onOpenEditEvaluation(rec)}
                              className="p-1 text-blue-600 hover:bg-blue-50 rounded-lg cursor-pointer"
                              title="Sửa phiếu đánh giá"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => onDeleteEvaluation(rec.id)}
                              className="p-1 text-red-600 hover:bg-red-50 rounded-lg cursor-pointer"
                              title="Xóa phiếu đánh giá"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
