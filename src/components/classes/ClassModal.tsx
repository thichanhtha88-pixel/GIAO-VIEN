import React, { useState, useEffect } from 'react';
import { ClassRoom } from '../../types';
import { Modal } from '../common/Modal';

interface ClassModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (cls: Omit<ClassRoom, 'createdAt'> & { id?: string }) => void;
  initialClass?: ClassRoom | null;
}

export const ClassModal: React.FC<ClassModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialClass,
}) => {
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [grade, setGrade] = useState<number>(3);
  const [academicYear, setAcademicYear] = useState('2024 - 2025');
  const [note, setNote] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (initialClass) {
      setCode(initialClass.code);
      setName(initialClass.name);
      setGrade(initialClass.grade);
      setAcademicYear(initialClass.academicYear);
      setNote(initialClass.note || '');
    } else {
      setCode('');
      setName('');
      setGrade(3);
      setAcademicYear('2024 - 2025');
      setNote('');
    }
    setError('');
  }, [initialClass, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) {
      setError('Vui lòng nhập Mã lớp (ví dụ: 3A, 4B)!');
      return;
    }
    if (!name.trim()) {
      setError('Vui lòng nhập Tên lớp (ví dụ: Lớp 3A)!');
      return;
    }

    onSave({
      id: initialClass ? initialClass.id : code.trim().toUpperCase(),
      code: code.trim().toUpperCase(),
      name: name.trim(),
      grade,
      academicYear,
      note: note.trim(),
    });
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialClass ? 'Chỉnh sửa thông tin lớp học' : 'Thêm lớp học mới'}
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
              Mã lớp <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="3A, 3B, 4A..."
              value={code}
              onChange={(e) => {
                setCode(e.target.value);
                if (!initialClass && !name) {
                  setName(`Lớp ${e.target.value.toUpperCase()}`);
                }
              }}
              disabled={!!initialClass}
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-100"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Tên lớp <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="Lớp 3A, Lớp 3B..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Khối lớp <span className="text-red-500">*</span>
            </label>
            <select
              value={grade}
              onChange={(e) => setGrade(Number(e.target.value))}
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold"
            >
              <option value={3}>Khối 3</option>
              <option value={4}>Khối 4</option>
              <option value={5}>Khối 5</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Năm học <span className="text-red-500">*</span>
            </label>
            <select
              value={academicYear}
              onChange={(e) => setAcademicYear(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold"
            >
              <option value="2024 - 2025">2024 - 2025</option>
              <option value="2025 - 2026">2025 - 2026</option>
              <option value="2026 - 2027">2026 - 2027</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">Ghi chú (tùy chọn)</label>
          <textarea
            rows={2}
            placeholder="Ví dụ: Phòng máy số 1, buổi sáng..."
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
            {initialClass ? 'Lưu thay đổi' : 'Tạo lớp học'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
