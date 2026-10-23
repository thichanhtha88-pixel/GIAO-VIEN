import React, { useState, useEffect } from 'react';
import { EvaluationRecord, EvaluationLevel, ActivityType } from '../../types';
import { Modal } from '../common/Modal';

interface EvaluationEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  evaluation: EvaluationRecord | null;
  onSave: (record: EvaluationRecord) => void;
}

export const EvaluationEditModal: React.FC<EvaluationEditModalProps> = ({
  isOpen,
  onClose,
  evaluation,
  onSave,
}) => {
  const [level, setLevel] = useState<EvaluationLevel>('Hoàn thành tốt');
  const [activityType, setActivityType] = useState<ActivityType>('Bài thực hành');
  const [comment, setComment] = useState('');
  const [date, setDate] = useState('');

  useEffect(() => {
    if (evaluation) {
      setLevel(evaluation.level);
      setActivityType(evaluation.activityType);
      setComment(evaluation.comment);
      setDate(evaluation.evaluationDate);
    }
  }, [evaluation, isOpen]);

  if (!evaluation) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...evaluation,
      level,
      activityType,
      comment: comment.trim(),
      evaluationDate: date.trim() || evaluation.evaluationDate,
    });
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Chỉnh sửa kết quả: ${evaluation.studentName}`}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="bg-sky-50 p-3 rounded-xl border border-sky-200 text-xs text-sky-950">
          <div className="font-bold text-sm text-slate-800">{evaluation.studentName} ({evaluation.studentCode})</div>
          <div>Lớp: <strong className="text-blue-700">{evaluation.classId}</strong> | Bài học: <strong>{evaluation.lessonTitle}</strong></div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Mức đánh giá <span className="text-red-500">*</span>
            </label>
            <select
              value={level}
              onChange={(e) => setLevel(e.target.value as EvaluationLevel)}
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-800"
            >
              <option value="Hoàn thành tốt">Hoàn thành tốt</option>
              <option value="Hoàn thành">Hoàn thành</option>
              <option value="Chưa hoàn thành">Chưa hoàn thành</option>
              <option value="Chưa đánh giá">Chưa đánh giá</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Hình thức hoạt động
            </label>
            <select
              value={activityType}
              onChange={(e) => setActivityType(e.target.value as ActivityType)}
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl text-slate-800 font-semibold"
            >
              <option value="Bài thực hành">Bài thực hành</option>
              <option value="Câu hỏi kiểm tra">Câu hỏi kiểm tra</option>
              <option value="Nhiệm vụ nhóm">Nhiệm vụ nhóm</option>
              <option value="Sản phẩm học tập">Sản phẩm học tập</option>
              <option value="Quan sát trong giờ học">Quan sát trong giờ học</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            Ngày đánh giá (dd/mm/yyyy)
          </label>
          <input
            type="text"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            Nhận xét của giáo viên
          </label>
          <textarea
            rows={3}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Ghi nhận xét cụ thể sự tiến bộ hoặc cần rèn thêm..."
            className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl"
          />
        </div>

        {evaluation.history && evaluation.history.length > 0 && (
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs">
            <div className="font-bold text-slate-700 mb-1">Lịch sử thay đổi trước đây:</div>
            <div className="space-y-1 text-slate-500">
              {evaluation.history.map((h, i) => (
                <div key={i}>
                  • {new Date(h.updatedAt).toLocaleDateString('vi-VN')}: Mức "{h.level}" ({h.comment || 'Không có nhận xét'})
                </div>
              ))}
            </div>
          </div>
        )}

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
            Lưu thay đổi
          </button>
        </div>
      </form>
    </Modal>
  );
};
