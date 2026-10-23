import React, { useState } from 'react';
import {
  ArrowDownUp,
  Download,
  Upload,
  FileSpreadsheet,
  AlertTriangle,
  CheckCircle2,
  Trash2,
  RotateCcw,
  Database,
  FileDown,
} from 'lucide-react';
import { ClassRoom, Student, EvaluationRecord, TeacherProfile } from '../../types';
import { storage } from '../../services/storage';

interface ImportExportViewProps {
  classes: ClassRoom[];
  students: Student[];
  evaluations: EvaluationRecord[];
  profile: TeacherProfile;
  onClearSampleData: () => void;
  onRestoreSampleData: () => void;
  onRefreshData: () => void;
  onShowToast: (msg: { type: 'success' | 'error' | 'info' | 'warning'; message: string }) => void;
}

interface ParsedStudentRow {
  studentCode: string;
  fullName: string;
  classId: string;
  academicYear: string;
  gender?: 'Nam' | 'Nữ';
  isValid: boolean;
  errorMessage?: string;
}

export const ImportExportView: React.FC<ImportExportViewProps> = ({
  classes,
  students,
  evaluations,
  profile,
  onClearSampleData,
  onRestoreSampleData,
  onRefreshData,
  onShowToast,
}) => {
  // CSV Preview State
  const [parsedRows, setParsedRows] = useState<ParsedStudentRow[]>([]);
  const [fileName, setFileName] = useState<string>('');
  const [importTargetClass, setImportTargetClass] = useState<string>(classes[0]?.id || '3A');

  // Trigger helper to download file with UTF-8 BOM
  const triggerDownload = (content: string, filename: string, mimeType = 'text/csv;charset=utf-8;') => {
    const bom = '\uFEFF';
    const blob = new Blob([bom + content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // 1. Download CSV Template
  const handleDownloadTemplate = () => {
    const csvContent =
      'MaHS,HoVaTen,Lop,NamHoc,GioiTinh,GhiChu\n' +
      'HS043,Nguyễn Hoàng Nam,3A,2024 - 2025,Nam,Thao tác tốt\n' +
      'HS044,Trần Ngọc Mai,3A,2024 - 2025,Nữ,Cần rèn luyện thêm\n' +
      'HS045,Lê Quốc Bảo,3B,2024 - 2025,Nam,Tích cực';

    triggerDownload(csvContent, 'Mau_Danh_Sach_Hoc_Sinh_Tin_Hoc.csv');
    onShowToast({
      type: 'success',
      message: 'Đã tải tệp mẫu CSV học sinh chuẩn tiếng Việt!',
    });
  };

  // 2. Parse uploaded CSV file
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    const reader = new FileReader();

    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const lines = text.split(/\r?\n/).filter((line) => line.trim().length > 0);

        if (lines.length <= 1) {
          onShowToast({
            type: 'error',
            message: 'Tệp CSV không có dữ liệu học sinh!',
          });
          return;
        }

        // Header check
        const dataLines = lines.slice(1);
        const existingCodes = new Set(students.map((s) => s.studentCode.toLowerCase()));
        const parsed: ParsedStudentRow[] = [];

        dataLines.forEach((line, idx) => {
          // split commas, handling quotes if any
          const cols = line.split(',').map((c) => c.trim().replace(/^["']|["']$/g, ''));
          const studentCode = cols[0] || '';
          const fullName = cols[1] || '';
          const classId = cols[2] || importTargetClass;
          const academicYear = cols[3] || profile.currentYear || '2024 - 2025';
          const gender = cols[4] === 'Nữ' ? 'Nữ' : 'Nam';

          let isValid = true;
          let errorMessage = '';

          if (!studentCode) {
            isValid = false;
            errorMessage = 'Thiếu mã học sinh';
          } else if (existingCodes.has(studentCode.toLowerCase())) {
            isValid = false;
            errorMessage = `Mã ${studentCode} đã tồn tại trong hệ thống`;
          } else if (!fullName) {
            isValid = false;
            errorMessage = 'Thiếu họ và tên học sinh';
          }

          parsed.push({
            studentCode,
            fullName,
            classId,
            academicYear,
            gender,
            isValid,
            errorMessage,
          });
        });

        setParsedRows(parsed);
      } catch (err: any) {
        onShowToast({
          type: 'error',
          message: `Lỗi đọc tệp: ${err.message}`,
        });
      }
    };

    reader.readAsText(file);
  };

  // Confirm and save previewed students
  const handleConfirmImport = () => {
    const validRows = parsedRows.filter((r) => r.isValid);
    if (validRows.length === 0) {
      onShowToast({
        type: 'error',
        message: 'Không có dòng dữ liệu hợp lệ nào để nhập!',
      });
      return;
    }

    let successCount = 0;
    validRows.forEach((row) => {
      const res = storage.addStudent({
        studentCode: row.studentCode,
        fullName: row.fullName,
        classId: row.classId,
        academicYear: row.academicYear,
        gender: row.gender,
      });
      if (res.success) successCount++;
    });

    onRefreshData();
    onShowToast({
      type: 'success',
      message: `Đã nhập thành công ${successCount} học sinh vào hệ thống!`,
    });
    setParsedRows([]);
    setFileName('');
  };

  // 3. Export Students to CSV
  const handleExportStudents = (classId?: string) => {
    const list = classId
      ? students.filter((s) => s.classId === classId)
      : students;

    if (list.length === 0) {
      onShowToast({ type: 'warning', message: 'Không có dữ liệu học sinh để xuất!' });
      return;
    }

    let csv = 'STT,MaHS,HoVaTen,Lop,NamHoc,GioiTinh\n';
    list.forEach((s, i) => {
      csv += `${i + 1},${s.studentCode},"${s.fullName}",${s.classId},${s.academicYear},${s.gender || 'Nam'}\n`;
    });

    const name = classId
      ? `Danh_Sach_Hoc_Sinh_Lop_${classId}.csv`
      : 'Danh_Sach_Toan_Bo_Hoc_Sinh.csv';
    triggerDownload(csv, name);
    onShowToast({ type: 'success', message: `Đã xuất ${list.length} học sinh thành tệp CSV!` });
  };

  // 4. Export Evaluations to CSV
  const handleExportEvaluations = () => {
    if (evaluations.length === 0) {
      onShowToast({ type: 'warning', message: 'Chưa có kết quả đánh giá nào để xuất!' });
      return;
    }

    let csv = 'STT,MaHS,HoVaTen,Lop,BaiHoc,NgayDanhGia,HinhThuc,KetQua,NhanXet\n';
    evaluations.forEach((e, i) => {
      csv += `${i + 1},${e.studentCode},"${e.studentName}",${e.classId},"${e.lessonTitle}",${e.evaluationDate},"${e.activityType}","${e.level}","${e.comment.replace(/"/g, '""')}"\n`;
    });

    triggerDownload(csv, 'Ket_Qua_Danh_Gia_Tin_Hoc.csv');
    onShowToast({
      type: 'success',
      message: `Đã xuất ${evaluations.length} phiếu đánh giá thành tệp CSV!`,
    });
  };

  // 5. System JSON Backup & Restore
  const handleExportSystemBackup = () => {
    const jsonStr = storage.exportFullBackupJSON();
    const dateStr = new Date().toISOString().split('T')[0];
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Sao_Luu_Tin_Hoc_Tieu_Hoc_Thu_Ba_${dateStr}.json`;
    link.click();
    URL.revokeObjectURL(url);
    onShowToast({ type: 'success', message: 'Đã tải bản sao lưu dữ liệu hệ thống (JSON)!' });
  };

  const handleImportSystemBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const res = storage.importFullBackupJSON(text);
      if (res.success) {
        onRefreshData();
        onShowToast({ type: 'success', message: res.message });
      } else {
        onShowToast({ type: 'error', message: res.message });
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-5">
      {/* Header bar */}
      <div className="bg-white rounded-2xl p-5 shadow-xs border border-sky-100 flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <ArrowDownUp className="w-6 h-6 text-[#0878D1]" />
            <span>Nhập & Xuất Dữ liệu</span>
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Nhập danh sách học sinh từ file Excel/CSV, xuất báo cáo và quản lý sao lưu an toàn.
          </p>
        </div>

        <button
          onClick={handleDownloadTemplate}
          className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2.5 rounded-xl shadow-xs transition-colors cursor-pointer text-xs"
        >
          <Download className="w-4 h-4" />
          <span>Tải file CSV mẫu (Excel)</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Section A: Nhập danh sách học sinh từ CSV */}
        <div className="bg-white rounded-2xl p-5 shadow-xs border border-sky-100 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <Upload className="w-5 h-5 text-blue-600" />
              <h3 className="font-bold text-slate-800 text-base">
                1. Nhập danh sách học sinh từ CSV
              </h3>
            </div>

            <p className="text-xs text-slate-600 mt-3 leading-relaxed">
              Tải file CSV chứa danh sách học sinh (Mã HS, Họ tên, Lớp, Năm học). Hệ thống sẽ tự động kiểm tra trùng mã và cho cô xem trước trước khi lưu.
            </p>

            <div className="mt-4 p-4 border-2 border-dashed border-sky-200 rounded-2xl bg-sky-50/50 text-center hover:border-blue-400 transition-colors">
              <input
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
                id="csv-file-input"
                className="hidden"
              />
              <label
                htmlFor="csv-file-input"
                className="cursor-pointer flex flex-col items-center justify-center gap-2"
              >
                <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div className="text-sm font-bold text-blue-700">
                  {fileName ? `Đã chọn: ${fileName}` : 'Bấm để chọn file CSV từ máy tính'}
                </div>
                <div className="text-[11px] text-slate-400">
                  Hỗ trợ định dạng CSV chuẩn tiếng Việt có dấu UTF-8
                </div>
              </label>
            </div>
          </div>

          {/* Preview Section if rows parsed */}
          {parsedRows.length > 0 && (
            <div className="mt-4 pt-3 border-t border-slate-100">
              <div className="flex items-center justify-between mb-2 text-xs">
                <span className="font-bold text-slate-800">
                  Xem trước dữ liệu ({parsedRows.length} dòng):
                </span>
                <span className="text-emerald-700 font-bold">
                  {parsedRows.filter((r) => r.isValid).length} dòng hợp lệ
                </span>
              </div>

              <div className="max-h-48 overflow-y-auto border border-slate-200 rounded-xl text-xs custom-scrollbar">
                <table className="w-full text-left">
                  <thead className="bg-slate-100 text-slate-700 sticky top-0 font-bold">
                    <tr>
                      <th className="py-1.5 px-2">Mã HS</th>
                      <th className="py-1.5 px-2">Họ và tên</th>
                      <th className="py-1.5 px-2">Lớp</th>
                      <th className="py-1.5 px-2">Trạng thái</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {parsedRows.map((r, i) => (
                      <tr
                        key={i}
                        className={r.isValid ? 'hover:bg-slate-50' : 'bg-red-50/60'}
                      >
                        <td className="py-1.5 px-2 font-mono">{r.studentCode}</td>
                        <td className="py-1.5 px-2 font-semibold">{r.fullName}</td>
                        <td className="py-1.5 px-2">{r.classId}</td>
                        <td className="py-1.5 px-2">
                          {r.isValid ? (
                            <span className="text-emerald-700 font-bold flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5" /> Hợp lệ
                            </span>
                          ) : (
                            <span className="text-red-600 font-semibold text-[11px]">
                              {r.errorMessage}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex justify-end gap-2 mt-3">
                <button
                  onClick={() => setParsedRows([])}
                  className="px-3 py-1.5 text-xs text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  onClick={handleConfirmImport}
                  className="px-4 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs cursor-pointer"
                >
                  Lưu vào hệ thống
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Section B: Xuất dữ liệu ra Excel/CSV */}
        <div className="bg-white rounded-2xl p-5 shadow-xs border border-sky-100 space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <Download className="w-5 h-5 text-emerald-600" />
            <h3 className="font-bold text-slate-800 text-base">
              2. Xuất dữ liệu học sinh & kết quả
            </h3>
          </div>

          <div className="space-y-3 text-xs">
            {/* Export all students */}
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
              <div>
                <div className="font-bold text-slate-800">Xuất toàn bộ học sinh</div>
                <div className="text-slate-500">Tệp CSV gồm đầy đủ {students.length} học sinh</div>
              </div>
              <button
                onClick={() => handleExportStudents()}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-[#168BF0] hover:bg-blue-600 text-white rounded-lg font-bold transition-colors cursor-pointer"
              >
                <FileDown className="w-4 h-4" />
                <span>Xuất CSV</span>
              </button>
            </div>

            {/* Export student by class */}
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="font-bold text-slate-800">Xuất danh sách theo từng lớp:</div>
              <div className="flex flex-wrap gap-2">
                {classes.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => handleExportStudents(c.id)}
                    className="px-3 py-1 bg-white hover:bg-blue-50 border border-slate-300 hover:border-blue-300 text-blue-700 rounded-lg font-semibold transition-colors cursor-pointer"
                  >
                    Lớp {c.code} ({students.filter((s) => s.classId === c.id).length} HS)
                  </button>
                ))}
              </div>
            </div>

            {/* Export evaluations */}
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
              <div>
                <div className="font-bold text-slate-800">Xuất bảng kết quả học tập</div>
                <div className="text-slate-500">Gồm {evaluations.length} phiếu đánh giá và nhận xét</div>
              </div>
              <button
                onClick={handleExportEvaluations}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold transition-colors cursor-pointer"
              >
                <FileDown className="w-4 h-4" />
                <span>Xuất kết quả</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Section C: Quản lý Dữ liệu Thử nghiệm & Sao lưu toàn hệ thống */}
      <div className="bg-white rounded-2xl p-5 shadow-xs border border-sky-100">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
          <Database className="w-5 h-5 text-purple-600" />
          <h3 className="font-bold text-slate-800 text-base">
            3. Quản lý dữ liệu thử nghiệm & Sao lưu toàn bộ hệ thống
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          {/* Sample Data Management */}
          <div className="p-4 rounded-xl bg-amber-50/60 border border-amber-200 space-y-3">
            <div className="flex items-center gap-2 text-amber-900 font-bold text-sm">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>Dữ liệu thử nghiệm minh họa</span>
            </div>
            <p className="text-xs text-amber-800 leading-relaxed">
              Hệ thống đang có dữ liệu mẫu (Lớp 3A, 3B và 42 học sinh giả định). Trước khi đưa vào dạy chính thức, cô có thể xóa dữ liệu mẫu để bắt đầu với cơ sở dữ liệu trống.
            </p>
            <div className="flex flex-wrap gap-2 pt-1">
              <button
                onClick={onClearSampleData}
                className="flex items-center gap-1.5 px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Xóa sạch dữ liệu mẫu (Về 0)</span>
              </button>
              <button
                onClick={onRestoreSampleData}
                className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition-colors cursor-pointer border border-slate-300"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Khôi phục dữ liệu mẫu minh họa</span>
              </button>
            </div>
          </div>

          {/* System Backup JSON */}
          <div className="p-4 rounded-xl bg-sky-50/60 border border-sky-200 space-y-3">
            <div className="text-blue-900 font-bold text-sm">
              Sao lưu & Khôi phục toàn diện (Tệp JSON)
            </div>
            <p className="text-xs text-blue-800 leading-relaxed">
              Sao lưu toàn bộ hồ sơ lớp học, danh sách học sinh và kết quả học tập về máy tính của cô để lưu trữ an toàn hoặc chuyển sang máy tính khác.
            </p>
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <button
                onClick={handleExportSystemBackup}
                className="flex items-center gap-1.5 px-3 py-2 bg-[#0878D1] hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Tải tệp sao lưu (.json)</span>
              </button>

              <label className="flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer border border-slate-300">
                <Upload className="w-3.5 h-3.5" />
                <span>Khôi phục từ tệp sao lưu</span>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImportSystemBackup}
                  className="hidden"
                />
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
