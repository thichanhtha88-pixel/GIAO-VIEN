import React, { useState } from 'react';
import { ArrowRightLeft } from 'lucide-react';
import { Student, ClassRoom } from '../../types';
import { Modal } from '../common/Modal';

interface TransferClassModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: Student | null;
  classes: ClassRoom[];
  onTransfer: (studentId: string, newClassId: string) => void;
}

export const TransferClassModal: React.FC<TransferClassModalProps> = ({
  isOpen,
  onClose,
  student,
  classes,
  onTransfer,
}) => {
  const [newClassId, setNewClassId] = useState<string>('');

  if (!student) return null;

  const currentClass = classes.find((c) => c.id === student.classId);
  const availableClasses = classes.filter((c) => c.id !== student.classId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClassId) return;
    onTransfer(student.id, newClassId);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Chuyển lớp học cho học sinh"
      maxWidth="max-w-md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="p-3 bg-purple-50 border border-purple-200 rounded-xl flex items-center gap-3">
          <ArrowRightLeft className="w-5 h-5 text-purple-600 shrink-0" />
          <div className="text-xs text-purple-900">
            Học sinh: <strong className="text-purple-950 font-bold">{student.fullName}</strong> ({student.studentCode})
            <div className="text-purple-700">
              Lớp hiện tại: <strong>{currentClass?.name || student.classId}</strong>
            </div>
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            Chọn lớp chuyển đến <span className="text-red-500">*</span>
          </label>
          <select
            value={newClassId}
            onChange={(e) => setNewClassId(e.target.value)}
            required
            className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 font-bold text-purple-800"
          >
            <option value="">-- Chọn lớp học mới --</option>
            {availableClasses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.academicYear})
              </option>
            ))}
          </select>
        </div>

        <div className="text-xs text-slate-500 bg-slate-50 p-3 rounded-xl border border-slate-200 leading-relaxed">
          * Khi chuyển lớp, toàn bộ phiếu đánh giá và lịch sử học tập trước đó của học sinh vẫn được lưu giữ đầy đủ để đảm bảo tính liên tục của dữ liệu.
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
            disabled={!newClassId}
            className="px-5 py-2 text-sm font-bold text-white bg-purple-600 hover:bg-purple-700 disabled:opacity-50 rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            Xác nhận chuyển lớp
          </button>
        </div>
      </form>
    </Modal>
  );
};
