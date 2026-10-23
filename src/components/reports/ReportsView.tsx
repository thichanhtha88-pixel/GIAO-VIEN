import React, { useState, useMemo } from 'react';
import {
  BarChart3,
  Printer,
  Download,
  Filter,
  FileText,
  AlertTriangle,
  CheckCircle,
  HelpCircle,
  Users,
} from 'lucide-react';
import {
  ClassRoom,
  Student,
  Lesson,
  EvaluationRecord,
  TeacherProfile,
} from '../../types';

interface ReportsViewProps {
  classes: ClassRoom[];
  students: Student[];
  lessons: Lesson[];
  evaluations: EvaluationRecord[];
  profile: TeacherProfile;
}

type ReportType =
  | 'summary_quality' // Báo cáo chất lượng giáo dục môn Tin học
  | 'students_needing_support' // Danh sách học sinh cần hỗ trợ thêm
  | 'unassessed_students' // Danh sách học sinh chưa đánh giá
  | 'lesson_results'; // Kết quả đánh giá theo bài học

export const ReportsView: React.FC<ReportsViewProps> = ({
  classes,
  students,
  lessons,
  evaluations,
  profile,
}) => {
  const [selectedReport, setSelectedReport] = useState<ReportType>('summary_quality');
  const [selectedClassId, setSelectedClassId] = useState<string>('all');
  const [selectedLessonId, setSelectedLessonId] = useState<string>('all');
  const [selectedSemester, setSelectedSemester] = useState<string>('Học kỳ I');
  const [academicYear, setAcademicYear] = useState<string>(profile.currentYear || '2024 - 2025');

  // Trigger browser print
  const handlePrint = () => {
    window.print();
  };

  // Quality summary by class
  const classQualitySummary = useMemo(() => {
    const targetClasses = selectedClassId === 'all' 
      ? classes 
      : classes.filter((c) => c.id === selectedClassId);

    return targetClasses.map((c) => {
      const classStudents = students.filter((s) => s.classId === c.id);
      const studentIds = new Set(classStudents.map((s) => s.id));
      const classEvals = evaluations.filter((e) => studentIds.has(e.studentId));

      const good = classEvals.filter((e) => e.level === 'Hoàn thành tốt').length;
      const completed = classEvals.filter((e) => e.level === 'Hoàn thành').length;
      const notCompleted = classEvals.filter((e) => e.level === 'Chưa hoàn thành').length;
      const totalEvaluated = good + completed + notCompleted;

      const totalStudents = classStudents.length;
      const goodRate = totalEvaluated > 0 ? Math.round((good / totalEvaluated) * 100) : 0;
      const compRate = totalEvaluated > 0 ? Math.round((completed / totalEvaluated) * 100) : 0;
      const notRate = totalEvaluated > 0 ? Math.round((notCompleted / totalEvaluated) * 100) : 0;

      return {
        classCode: c.code,
        className: c.name,
        grade: c.grade,
        totalStudents,
        totalEvaluated,
        good,
        goodRate,
        completed,
        compRate,
        notCompleted,
        notRate,
      };
    });
  }, [classes, students, evaluations, selectedClassId]);

  // Students needing extra help
  const studentsNeedingSupport = useMemo(() => {
    const list: Array<{
      student: Student;
      lessonTitle: string;
      evaluationDate: string;
      comment: string;
      remedy: string;
    }> = [];

    evaluations.forEach((e) => {
      if (e.level === 'Chưa hoàn thành') {
        const student = students.find((s) => s.id === e.studentId);
        if (student && (selectedClassId === 'all' || student.classId === selectedClassId)) {
          let remedy = 'Cho học sinh thực hành thêm trong tiết tự chọn hoặc phân công bạn kèm cặp.';
          if (e.comment.includes('chuột')) {
            remedy = 'Luyện các bài tập di chuyển và nháy đúp chuột với phần mềm trò chơi luyện chuột.';
          } else if (e.comment.includes('bàn phím') || e.comment.includes('gõ')) {
            remedy = 'Rèn luyện đặt tay đúng hàng phím cơ sở và gõ phím nhẹ nhàng.';
          } else if (e.comment.includes('Paint') || e.comment.includes('vẽ')) {
            remedy = 'Hướng dẫn thao tác đóng kín nét vẽ trước khi bấm công cụ đổ màu.';
          }

          list.push({
            student,
            lessonTitle: e.lessonTitle,
            evaluationDate: e.evaluationDate,
            comment: e.comment || 'Chưa đạt yêu cầu bài học',
            remedy,
          });
        }
      }
    });

    return list;
  }, [evaluations, students, selectedClassId]);

  // Students not assessed in the selected lesson
  const unassessedStudents = useMemo(() => {
    if (selectedLessonId === 'all') return [];

    const assessedStudentIds = new Set(
      evaluations.filter((e) => e.lessonId === selectedLessonId).map((e) => e.studentId)
    );

    return students.filter((s) => {
      const matchClass = selectedClassId === 'all' || s.classId === selectedClassId;
      return matchClass && !assessedStudentIds.has(s.id);
    });
  }, [students, evaluations, selectedLessonId, selectedClassId]);

  return (
    <div className="space-y-4">
      {/* Top action bar (hidden during print) */}
      <div className="bg-white rounded-2xl p-5 shadow-xs border border-sky-100 flex flex-col md:flex-row items-center justify-between gap-4 no-print">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-[#0878D1]" />
            <span>Báo cáo – Thống kê chất lượng Tin học</span>
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Tổng hợp số liệu báo cáo gửi Ban Giám Hiệu và Tổ chuyên môn {profile.schoolName}.
          </p>
        </div>

        <button
          onClick={handlePrint}
          className="flex items-center gap-2 bg-[#0878D1] hover:bg-blue-700 text-white font-bold px-4 py-2.5 rounded-xl shadow-xs transition-colors cursor-pointer"
        >
          <Printer className="w-4 h-4" />
          <span>In báo cáo chuẩn A4</span>
        </button>
      </div>

      {/* Filter and Report Type Selection (hidden during print) */}
      <div className="bg-white rounded-2xl p-4 shadow-xs border border-sky-100 space-y-3 no-print">
        <div className="flex flex-wrap items-center gap-2 border-b border-slate-100 pb-3">
          <button
            onClick={() => setSelectedReport('summary_quality')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              selectedReport === 'summary_quality'
                ? 'bg-[#168BF0] text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            1. Bảng chất lượng theo lớp
          </button>
          <button
            onClick={() => setSelectedReport('students_needing_support')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              selectedReport === 'students_needing_support'
                ? 'bg-[#168BF0] text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            2. Danh sách học sinh cần hỗ trợ ({studentsNeedingSupport.length})
          </button>
          <button
            onClick={() => setSelectedReport('unassessed_students')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              selectedReport === 'unassessed_students'
                ? 'bg-[#168BF0] text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            3. Học sinh chưa được đánh giá
          </button>
        </div>

        {/* Filter controls */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
          <div>
            <label className="block text-slate-600 font-bold mb-1">Năm học</label>
            <select
              value={academicYear}
              onChange={(e) => setAcademicYear(e.target.value)}
              className="w-full py-1.5 px-2 bg-slate-50 border border-slate-200 rounded-lg font-semibold"
            >
              <option value="2024 - 2025">2024 - 2025</option>
              <option value="2025 - 2026">2025 - 2026</option>
            </select>
          </div>

          <div>
            <label className="block text-slate-600 font-bold mb-1">Học kỳ</label>
            <select
              value={selectedSemester}
              onChange={(e) => setSelectedSemester(e.target.value)}
              className="w-full py-1.5 px-2 bg-slate-50 border border-slate-200 rounded-lg font-semibold"
            >
              <option value="Học kỳ I">Học kỳ I</option>
              <option value="Học kỳ II">Học kỳ II</option>
              <option value="Cả năm">Cả năm học</option>
            </select>
          </div>

          <div>
            <label className="block text-slate-600 font-bold mb-1">Lớp học</label>
            <select
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
              className="w-full py-1.5 px-2 bg-slate-50 border border-slate-200 rounded-lg font-semibold"
            >
              <option value="all">Tất cả lớp học</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-slate-600 font-bold mb-1">Bài học (Dành cho mục 3)</label>
            <select
              value={selectedLessonId}
              onChange={(e) => setSelectedLessonId(e.target.value)}
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
        </div>
      </div>

      {/* Main Printable Document Sheet (Format A4) */}
      <div className="bg-white rounded-2xl shadow-xs border border-sky-100 p-8 printable-sheet">
        {/* Formal Vietnamese School Document Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start text-xs text-slate-800 pb-6 border-b border-slate-200">
          <div className="text-center sm:text-left">
            <div className="font-bold uppercase tracking-wide">PHÒNG GD&ĐT HUYỆN AN BIÊN</div>
            <div className="font-black text-sm uppercase text-blue-900 mt-0.5">{profile.schoolName}</div>
            <div className="italic text-slate-500">Môn: Tin học Tiểu học</div>
          </div>

          <div className="text-center sm:text-right mt-3 sm:mt-0">
            <div className="font-bold uppercase">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</div>
            <div className="font-bold underline decoration-1 underline-offset-4">Độc lập – Tự do – Hạnh phúc</div>
            <div className="italic text-slate-500 mt-1">
              Thứ Ba, ngày {new Date().getDate()} tháng {new Date().getMonth() + 1} năm {new Date().getFullYear()}
            </div>
          </div>
        </div>

        {/* Title of Report */}
        <div className="text-center my-6">
          <h3 className="text-xl font-bold uppercase text-slate-900 tracking-tight">
            {selectedReport === 'summary_quality' && 'BÁO CÁO CHẤT LƯỢNG GIÁO DỤC MÔN TIN HỌC TIỂU HỌC'}
            {selectedReport === 'students_needing_support' && 'DANH SÁCH HỌC SINH CẦN HỖ TRỢ & BIỆN PHÁP KHẮC PHỤC'}
            {selectedReport === 'unassessed_students' && 'DANH SÁCH HỌC SINH CHƯA ĐÁNH GIÁ KẾT QUẢ'}
          </h3>
          <div className="text-xs text-slate-600 mt-1 font-medium">
            Năm học: <strong>{academicYear}</strong> | {selectedSemester} | Giáo viên phụ trách: <strong>{profile.name}</strong>
          </div>
        </div>

        {/* Report Content 1: Summary Quality */}
        {selectedReport === 'summary_quality' && (
          <div className="space-y-6">
            <div className="overflow-x-auto">
              <table className="w-full text-center text-xs border-collapse border border-slate-300">
                <thead>
                  <tr className="bg-slate-100 font-bold text-slate-800">
                    <th rowSpan={2} className="border border-slate-300 py-2 px-2 text-left">Lớp</th>
                    <th rowSpan={2} className="border border-slate-300 py-2 px-1">Sĩ số</th>
                    <th rowSpan={2} className="border border-slate-300 py-2 px-1">Tổng phiếu ĐG</th>
                    <th colSpan={2} className="border border-slate-300 py-1 px-1 bg-emerald-50 text-emerald-900">Hoàn thành tốt</th>
                    <th colSpan={2} className="border border-slate-300 py-1 px-1 bg-sky-50 text-sky-900">Hoàn thành</th>
                    <th colSpan={2} className="border border-slate-300 py-1 px-1 bg-red-50 text-red-900">Chưa hoàn thành</th>
                  </tr>
                  <tr className="bg-slate-50 font-bold text-slate-700 text-[11px]">
                    <th className="border border-slate-300 py-1 px-1">Số lượng</th>
                    <th className="border border-slate-300 py-1 px-1">Tỉ lệ %</th>
                    <th className="border border-slate-300 py-1 px-1">Số lượng</th>
                    <th className="border border-slate-300 py-1 px-1">Tỉ lệ %</th>
                    <th className="border border-slate-300 py-1 px-1">Số lượng</th>
                    <th className="border border-slate-300 py-1 px-1">Tỉ lệ %</th>
                  </tr>
                </thead>
                <tbody>
                  {classQualitySummary.map((r) => (
                    <tr key={r.classCode} className="hover:bg-slate-50">
                      <td className="border border-slate-300 py-2 px-2 text-left font-bold text-slate-900">
                        {r.className}
                      </td>
                      <td className="border border-slate-300 py-2 px-1 font-semibold">{r.totalStudents}</td>
                      <td className="border border-slate-300 py-2 px-1 text-slate-600">{r.totalEvaluated}</td>
                      <td className="border border-slate-300 py-2 px-1 font-bold text-emerald-700">{r.good}</td>
                      <td className="border border-slate-300 py-2 px-1 text-emerald-700">{r.goodRate}%</td>
                      <td className="border border-slate-300 py-2 px-1 font-bold text-sky-700">{r.completed}</td>
                      <td className="border border-slate-300 py-2 px-1 text-sky-700">{r.compRate}%</td>
                      <td className="border border-slate-300 py-2 px-1 font-bold text-red-700">{r.notCompleted}</td>
                      <td className="border border-slate-300 py-2 px-1 text-red-700">{r.notRate}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* General evaluation remarks */}
            <div className="text-xs text-slate-700 space-y-1.5 leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div className="font-bold text-slate-900">Đánh giá chung của giáo viên bộ môn:</div>
              <p>
                - Học sinh các lớp có thái độ hào hứng, tích cực tham gia các tiết thực hành môn Tin học tại phòng máy.
              </p>
              <p>
                - Đa số học sinh đã nắm được kỹ năng cầm chuột, di chuyển con trỏ chuột và tư thế ngồi gõ phím đúng quy chuẩn.
              </p>
              <p>
                - Một số học sinh còn hạn chế về thao tác nháy đúp và gõ mổ cò hai ngón, giáo viên đã lập kế hoạch bồi dưỡng thêm trong các tiết tự học có hướng dẫn.
              </p>
            </div>
          </div>
        )}

        {/* Report Content 2: Students Needing Support */}
        {selectedReport === 'students_needing_support' && (
          <div className="space-y-4">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse border border-slate-300">
                <thead>
                  <tr className="bg-slate-100 font-bold text-slate-800">
                    <th className="border border-slate-300 py-2 px-2 text-center w-8">STT</th>
                    <th className="border border-slate-300 py-2 px-2">Mã HS</th>
                    <th className="border border-slate-300 py-2 px-3">Họ và tên</th>
                    <th className="border border-slate-300 py-2 px-2 text-center">Lớp</th>
                    <th className="border border-slate-300 py-2 px-3">Nội dung chưa đạt</th>
                    <th className="border border-slate-300 py-2 px-3">Biện pháp hỗ trợ của giáo viên</th>
                  </tr>
                </thead>
                <tbody>
                  {studentsNeedingSupport.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="border border-slate-300 py-8 text-center text-slate-400">
                        Không có học sinh nào ở mức Chưa hoàn thành trong đợt đánh giá này.
                      </td>
                    </tr>
                  ) : (
                    studentsNeedingSupport.map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="border border-slate-300 py-2.5 px-2 text-center text-slate-500">{idx + 1}</td>
                        <td className="border border-slate-300 py-2.5 px-2 font-mono font-bold text-slate-700">{item.student.studentCode}</td>
                        <td className="border border-slate-300 py-2.5 px-3 font-bold text-slate-900">{item.student.fullName}</td>
                        <td className="border border-slate-300 py-2.5 px-2 text-center font-bold text-blue-700">{item.student.classId}</td>
                        <td className="border border-slate-300 py-2.5 px-3">
                          <div className="font-semibold text-slate-800">{item.lessonTitle}</div>
                          <div className="text-[11px] text-red-600 italic mt-0.5">{item.comment}</div>
                        </td>
                        <td className="border border-slate-300 py-2.5 px-3 text-slate-700 font-medium">
                          {item.remedy}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Report Content 3: Unassessed Students */}
        {selectedReport === 'unassessed_students' && (
          <div className="space-y-4">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse border border-slate-300">
                <thead>
                  <tr className="bg-slate-100 font-bold text-slate-800">
                    <th className="border border-slate-300 py-2 px-2 text-center w-8">STT</th>
                    <th className="border border-slate-300 py-2 px-2">Mã HS</th>
                    <th className="border border-slate-300 py-2 px-4">Họ và tên</th>
                    <th className="border border-slate-300 py-2 px-2 text-center">Lớp</th>
                    <th className="border border-slate-300 py-2 px-4">Tình trạng</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedLessonId === 'all' ? (
                    <tr>
                      <td colSpan={5} className="border border-slate-300 py-8 text-center text-slate-500">
                        Vui lòng chọn một bài học cụ thể ở thanh bộ lọc phía trên để kiểm tra học sinh chưa đánh giá.
                      </td>
                    </tr>
                  ) : unassessedStudents.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="border border-slate-300 py-8 text-center text-emerald-600 font-bold">
                        100% học sinh đã được đánh giá cho bài học này!
                      </td>
                    </tr>
                  ) : (
                    unassessedStudents.map((s, idx) => (
                      <tr key={s.id} className="hover:bg-slate-50">
                        <td className="border border-slate-300 py-2 px-2 text-center text-slate-500">{idx + 1}</td>
                        <td className="border border-slate-300 py-2 px-2 font-mono font-bold text-slate-700">{s.studentCode}</td>
                        <td className="border border-slate-300 py-2 px-4 font-bold text-slate-900">{s.fullName}</td>
                        <td className="border border-slate-300 py-2 px-2 text-center font-bold text-blue-700">{s.classId}</td>
                        <td className="border border-slate-300 py-2 px-4 text-amber-700 font-medium">
                          Chưa có phiếu đánh giá cho bài học này
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Signatures section for formal educational paper */}
        <div className="grid grid-cols-2 gap-8 mt-12 pt-6 text-xs text-center text-slate-800">
          <div>
            <div className="font-bold uppercase">DUYỆT CỦA BAN GIÁM HIỆU</div>
            <div className="italic text-slate-400 mt-1">(Ký và ghi rõ họ tên)</div>
            <div className="h-20"></div>
            <div className="font-bold text-slate-600">...................................................</div>
          </div>

          <div>
            <div className="font-bold uppercase">GIÁO VIÊN BỘ MÔN TIN HỌC</div>
            <div className="italic text-slate-400 mt-1">(Ký và ghi rõ họ tên)</div>
            <div className="h-20"></div>
            <div className="font-bold text-slate-900 text-sm">{profile.name}</div>
          </div>
        </div>
      </div>
    </div>
  );
};
