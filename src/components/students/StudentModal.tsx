import React, { useState, useEffect } from 'react';
import { Student, ClassRoom } from '../../types';
import { Modal } from '../common/Modal';

interface StudentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (studentData: Omit<Student, 'id' | 'createdAt'> & { id?: string }) => void;
  classes: ClassRoom[];
  initialStudent?: Student | null;
  defaultClassId?: string;
}

export const StudentModal: React.FC<StudentModalProps> = ({
  isOpen,
  onClose,
  onSave,
  classes,
  initialStudent,
  defaultClassId,
}) => {
  const [studentCode, setStudentCode] = useState('');
  const [fullName, setFullName] = useState('');
  const [classId, setClassId] = useState('');
  const [academicYear, setAcademicYear] = useState('2024 - 2025');
  const [gender, setGender] = useState<'Nam' | 'Nữ'>('Nam');
  const [note, setNote] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (initialStudent) {
      setStudentCode(initialStudent.studentCode);
      setFullName(initialStudent.fullName);
      setClassId(initialStudent.classId);
      setAcademicYear(initialStudent.academicYear);
      setGender(initialStudent.gender || 'Nam');
      setNote(initialStudent.note || '');
    } else {
      setStudentCode('');
      setFullName('');
      setClassId(defaultClassId || (classes[0] ? classes[0].id : '3A'));
      setAcademicYear('2024 - 2025');
      setGender('Nam');
      setNote('');
    }
    setError('');
  }, [initialStudent, defaultClassId, classes, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentCode.trim()) {
      setError('Vui lòng nhập Mã học sinh (ví dụ: HS043)!');
      return;
    }
    if (!fullName.trim()) {
      setError('Vui lòng nhập Họ và tên học sinh!');
      return;
    }
    if (!classId) {
      setError('Vui lòng chọn Lớp học!');
      return;
    }

    onSave({
      id: initialStudent ? initialStudent.id : studentCode.trim().toUpperCase(),
      studentCode: studentCode.trim().toUpperCase(),
      fullName: fullName.trim(),
      classId,
      academicYear,
      gender,
      note: note.trim(),
    });
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialStudent ? 'Chỉnh sửa thông tin học sinh' : 'Thêm học sinh mới'}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl">
            {error}
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Mã học sinh <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="HS001, HS042..."
              value={studentCode}
              onChange={(e) => setStudentCode(e.target.value)}
              disabled={!!initialStudent}
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-100 font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Họ và tên <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="Nguyễn Minh Anh..."
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Lớp học <span className="text-red-500">*</span>
            </label>
            <select
              value={classId}
              onChange={(e) => setClassId(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-bold text-blue-700"
            >
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Giới tính
            </label>
            <select
              value={gender}
              onChange={(e) => setGender(e.target.value as 'Nam' | 'Nữ')}
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="Nam">Nam</option>
              <option value="Nữ">Nữ</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Năm học
            </label>
            <select
              value={academicYear}
              onChange={(e) => setAcademicYear(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="2024 - 2025">2024 - 2025</option>
              <option value="2025 - 2026">2025 - 2026</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">Ghi chú thêm</label>
          <input
            type="text"
            placeholder="Ví dụ: Cần chú ý khi thực hành vẽ..."
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
          >
            Hủy
          </button>
          <button
            type="submit"
            className="px-5 py-2 text-sm font-bold text-white bg-[#168BF0] hover:bg-blue-600 rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            {initialStudent ? 'Lưu cập nhật' : 'Thêm học sinh'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
