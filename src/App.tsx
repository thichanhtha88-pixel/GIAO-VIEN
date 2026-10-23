import React, { useState, useEffect, useCallback } from 'react';
import {
  TabType,
  ClassRoom,
  Student,
  Lesson,
  EvaluationRecord,
  TeacherProfile,
} from './types';
import { storage } from './services/storage';
import { Header } from './components/common/Header';
import { Sidebar } from './components/common/Sidebar';
import { Footer } from './components/common/Footer';
import { ToastContainer, ToastMessage } from './components/common/ConfirmDialog';
import { ConfirmDialog } from './components/common/ConfirmDialog';
import { OverviewView } from './components/dashboard/OverviewView';
import { ClassesView } from './components/classes/ClassesView';
import { ClassModal } from './components/classes/ClassModal';
import { StudentsView } from './components/students/StudentsView';
import { StudentModal } from './components/students/StudentModal';
import { StudentProfileModal } from './components/students/StudentProfileModal';
import { TransferClassModal } from './components/students/TransferClassModal';
import { EvaluationsView } from './components/evaluations/EvaluationsView';
import { EvaluationEditModal } from './components/evaluations/EvaluationEditModal';
import { ProgressView } from './components/progress/ProgressView';
import { ReportsView } from './components/reports/ReportsView';
import { ImportExportView } from './components/import-export/ImportExportView';
import { SettingsView } from './components/settings/SettingsView';
import { LoginView } from './components/auth/LoginView';

export default function App() {
  // Main Data States
  const [profile, setProfile] = useState<TeacherProfile>(() => storage.getProfile());
  const [classes, setClasses] = useState<ClassRoom[]>(() => storage.getClasses());
  const [students, setStudents] = useState<Student[]>(() => storage.getStudents());
  const [lessons, setLessons] = useState<Lesson[]>(() => storage.getLessons());
  const [evaluations, setEvaluations] = useState<EvaluationRecord[]>(() => storage.getEvaluations());

  // Current active navigation tab
  const [currentTab, setCurrentTab] = useState<TabType>('overview');

  // Quick initial filters when navigating between views
  const [targetStudentClassId, setTargetStudentClassId] = useState<string | undefined>(undefined);
  const [targetEvalClassId, setTargetEvalClassId] = useState<string | undefined>(undefined);

  // Toast notifications
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = useCallback((msg: { type: 'success' | 'error' | 'info' | 'warning'; message: string; title?: string }) => {
    const id = `toast_${Date.now()}_${Math.random()}`;
    const newToast: ToastMessage = { id, ...msg };
    setToasts((prev) => [...prev, newToast]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Re-fetch all data from storage
  const refreshData = useCallback(() => {
    setProfile(storage.getProfile());
    setClasses(storage.getClasses());
    setStudents(storage.getStudents());
    setLessons(storage.getLessons());
    setEvaluations(storage.getEvaluations());
  }, []);

  // Subscribe to reactive storage changes
  useEffect(() => {
    const unsubscribe = storage.subscribe(() => {
      refreshData();
    });
    return unsubscribe;
  }, [refreshData]);

  // Modal States
  const [isClassModalOpen, setIsClassModalOpen] = useState(false);
  const [editingClass, setEditingClass] = useState<ClassRoom | null>(null);

  const [isStudentModalOpen, setIsStudentModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [studentModalDefaultClassId, setStudentModalDefaultClassId] = useState<string | undefined>(undefined);

  const [isStudentProfileOpen, setIsStudentProfileOpen] = useState(false);
  const [profileStudent, setProfileStudent] = useState<Student | null>(null);

  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [transferStudent, setTransferStudent] = useState<Student | null>(null);

  const [isEvalEditModalOpen, setIsEvalEditModalOpen] = useState(false);
  const [editingEvaluation, setEditingEvaluation] = useState<EvaluationRecord | null>(null);

  // Generic Confirm Dialog State
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type?: 'danger' | 'warning' | 'info';
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  // --- Handlers: Class Management ---
  const handleOpenAddClass = () => {
    setEditingClass(null);
    setIsClassModalOpen(true);
  };

  const handleOpenEditClass = (cls: ClassRoom) => {
    setEditingClass(cls);
    setIsClassModalOpen(true);
  };

  const handleSaveClass = (data: Omit<ClassRoom, 'createdAt'> & { id?: string }) => {
    if (editingClass) {
      storage.updateClass({
        ...editingClass,
        ...data,
        id: editingClass.id,
      });
      showToast({ type: 'success', message: `Đã cập nhật thông tin lớp ${data.code}!` });
    } else {
      const ok = storage.addClass(data as any);
      if (ok) {
        showToast({ type: 'success', message: `Đã thêm lớp ${data.code} thành công!` });
      } else {
        showToast({ type: 'error', message: `Mã lớp ${data.code} đã tồn tại trong hệ thống!` });
      }
    }
  };

  const handleDeleteClass = (classId: string) => {
    const studentCount = students.filter((s) => s.classId === classId).length;
    setConfirmDialog({
      isOpen: true,
      title: `Xác nhận xóa lớp học ${classId}`,
      message: `Bạn có chắc chắn muốn xóa lớp ${classId}? ${
        studentCount > 0 ? `Lưu ý: Có ${studentCount} học sinh trong lớp này cũng sẽ bị xóa khỏi danh sách!` : ''
      }`,
      type: 'danger',
      onConfirm: () => {
        storage.deleteClass(classId);
        setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
        showToast({ type: 'success', message: `Đã xóa lớp học ${classId} thành công!` });
      },
    });
  };

  // --- Handlers: Student Management ---
  const handleOpenAddStudent = (classId?: string) => {
    setEditingStudent(null);
    setStudentModalDefaultClassId(classId || classes[0]?.id);
    setIsStudentModalOpen(true);
  };

  const handleOpenEditStudent = (student: Student) => {
    setEditingStudent(student);
    setIsStudentModalOpen(true);
  };

  const handleSaveStudent = (data: Omit<Student, 'id' | 'createdAt'> & { id?: string }) => {
    if (editingStudent) {
      storage.updateStudent({
        ...editingStudent,
        ...data,
        id: editingStudent.id,
      });
      showToast({ type: 'success', message: `Đã cập nhật thông tin học sinh ${data.fullName}!` });
    } else {
      const res = storage.addStudent(data as any);
      if (res.success) {
        showToast({ type: 'success', message: `Đã thêm học sinh ${data.fullName} (${data.studentCode})!` });
      } else {
        showToast({ type: 'error', message: res.message || 'Lỗi thêm học sinh!' });
      }
    }
  };

  const handleDeleteStudent = (studentId: string) => {
    const student = students.find((s) => s.id === studentId);
    setConfirmDialog({
      isOpen: true,
      title: 'Xác nhận xóa học sinh',
      message: `Bạn có chắc chắn muốn xóa học sinh ${student?.fullName || studentId} (${student?.studentCode}) khỏi cơ sở dữ liệu?`,
      type: 'danger',
      onConfirm: () => {
        storage.deleteStudent(studentId);
        setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
        showToast({ type: 'success', message: 'Đã xóa học sinh thành công!' });
      },
    });
  };

  const handleOpenStudentProfile = (student: Student) => {
    setProfileStudent(student);
    setIsStudentProfileOpen(true);
  };

  const handleOpenTransferClass = (student: Student) => {
    setTransferStudent(student);
    setIsTransferModalOpen(true);
  };

  const handleConfirmTransfer = (studentId: string, newClassId: string) => {
    storage.transferStudentClass(studentId, newClassId);
    showToast({ type: 'success', message: `Đã chuyển học sinh sang lớp ${newClassId} thành công!` });
  };

  // --- Handlers: Evaluations ---
  const handleSaveEvaluations = (records: Array<Omit<EvaluationRecord, 'id' | 'updatedAt'>>) => {
    storage.bulkSaveEvaluations(records);
    showToast({
      type: 'success',
      message: `Đã lưu thành công ${records.length} phiếu đánh giá kết quả học tập!`,
    });
  };

  const handleDeleteEvaluation = (evalId: string) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Xóa phiếu đánh giá',
      message: 'Bạn có chắc chắn muốn xóa phiếu kết quả học tập này?',
      type: 'danger',
      onConfirm: () => {
        storage.deleteEvaluation(evalId);
        setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
        showToast({ type: 'success', message: 'Đã xóa phiếu đánh giá thành công!' });
      },
    });
  };

  const handleOpenEditEvaluation = (evalRec: EvaluationRecord) => {
    setEditingEvaluation(evalRec);
    setIsEvalEditModalOpen(true);
  };

  const handleSaveEditEvaluation = (updated: EvaluationRecord) => {
    storage.upsertEvaluation(updated);
    showToast({ type: 'success', message: `Đã lưu cập nhật kết quả cho em ${updated.studentName}!` });
  };

  // --- Handlers: Lessons ---
  const handleAddLesson = (newLesson: Lesson) => {
    storage.addLesson(newLesson);
    showToast({ type: 'success', message: `Đã thêm bài học ${newLesson.code}: ${newLesson.title}!` });
  };

  const handleUpdateLesson = (updatedLesson: Lesson) => {
    storage.updateLesson(updatedLesson);
    showToast({ type: 'success', message: `Đã cập nhật trạng thái bài ${updatedLesson.code}!` });
  };

  // --- Handlers: Sample Data & Reset ---
  const handleClearSampleData = () => {
    setConfirmDialog({
      isOpen: true,
      title: 'Xóa toàn bộ dữ liệu mẫu minh họa?',
      message:
        'Thao tác này sẽ xóa toàn bộ các lớp và học sinh giả lập để cô có thể nhập danh sách học sinh thật của trường. Cô vẫn có thể khôi phục lại dữ liệu mẫu bất kỳ lúc nào.',
      type: 'warning',
      onConfirm: () => {
        storage.clearAllSampleData();
        setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
        showToast({
          type: 'info',
          message: 'Đã xóa dữ liệu mẫu. Hệ thống sẵn sàng cho việc nhập danh sách học sinh chính thức!',
        });
      },
    });
  };

  const handleRestoreSampleData = () => {
    setConfirmDialog({
      isOpen: true,
      title: 'Khôi phục dữ liệu mẫu minh họa?',
      message:
        'Hệ thống sẽ nạp lại dữ liệu thử nghiệm gồm Lớp 3A, 3B, 42 học sinh và 24 phiếu đánh giá mẫu như ban đầu.',
      type: 'info',
      onConfirm: () => {
        storage.resetToSampleData();
        setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
        showToast({
          type: 'success',
          message: 'Đã khôi phục dữ liệu mẫu thử nghiệm thành công!',
        });
      },
    });
  };

  // --- Auth Handlers ---
  const handleLogout = () => {
    setConfirmDialog({
      isOpen: true,
      title: 'Đăng xuất khỏi hệ thống?',
      message: 'Cô có muốn đăng xuất khỏi Website Tin học Tiểu học – Trường Tiểu học Thứ Ba không?',
      type: 'warning',
      onConfirm: () => {
        storage.updateProfile({ isLoggedIn: false });
        setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
      },
    });
  };

  const handleLoginSuccess = (email: string, name: string) => {
    storage.updateProfile({ isLoggedIn: true, email, name });
    showToast({ type: 'success', message: `Chào mừng cô ${name} đăng nhập thành công!` });
  };

  // If teacher logged out, show Login screen
  if (!profile.isLoggedIn) {
    return (
      <LoginView
        onLoginSuccess={handleLoginSuccess}
        defaultEmail={profile.email}
        defaultName={profile.name}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#F4F8FC] flex flex-col justify-between selection:bg-blue-100 selection:text-blue-900">
      {/* Top Header */}
      <Header
        profile={profile}
        onLogout={handleLogout}
        onOpenSettings={() => setCurrentTab('settings')}
      />

      {/* Main Body with Sidebar & Content */}
      <div className="flex-1 flex flex-col md:flex-row">
        {/* Left Sidebar */}
        <Sidebar currentTab={currentTab} onTabChange={setCurrentTab} />

        {/* Center Main Content Area */}
        <main className="flex-1 p-4 md:p-6 overflow-x-hidden">
          {currentTab === 'overview' && (
            <OverviewView
              classes={classes}
              students={students}
              lessons={lessons}
              evaluations={evaluations}
              profile={profile}
              onNavigate={setCurrentTab}
              onOpenAddClass={handleOpenAddClass}
              onOpenEditClass={handleOpenEditClass}
              onDeleteClass={handleDeleteClass}
              onOpenAddStudent={handleOpenAddStudent}
              onOpenEditStudent={handleOpenEditStudent}
              onDeleteStudent={handleDeleteStudent}
              onOpenAddEvaluation={() => {
                setTargetEvalClassId(classes[0]?.id);
                setCurrentTab('evaluations');
              }}
              onOpenEditEvaluation={handleOpenEditEvaluation}
            />
          )}

          {currentTab === 'classes' && (
            <ClassesView
              classes={classes}
              students={students}
              onNavigate={setCurrentTab}
              onOpenAddClass={handleOpenAddClass}
              onOpenEditClass={handleOpenEditClass}
              onDeleteClass={handleDeleteClass}
              onSelectClassForStudents={(classId) => {
                setTargetStudentClassId(classId);
                setCurrentTab('students');
              }}
              onSelectClassForEvaluation={(classId) => {
                setTargetEvalClassId(classId);
                setCurrentTab('evaluations');
              }}
            />
          )}

          {currentTab === 'students' && (
            <StudentsView
              students={students}
              classes={classes}
              evaluations={evaluations}
              initialSelectedClassId={targetStudentClassId}
              onNavigate={setCurrentTab}
              onOpenAddStudent={handleOpenAddStudent}
              onOpenEditStudent={handleOpenEditStudent}
              onDeleteStudent={handleDeleteStudent}
              onOpenStudentProfile={handleOpenStudentProfile}
              onOpenTransferClass={handleOpenTransferClass}
            />
          )}

          {currentTab === 'evaluations' && (
            <EvaluationsView
              classes={classes}
              students={students}
              lessons={lessons}
              evaluations={evaluations}
              initialClassId={targetEvalClassId}
              onSaveEvaluations={handleSaveEvaluations}
              onDeleteEvaluation={handleDeleteEvaluation}
              onOpenEditEvaluation={handleOpenEditEvaluation}
            />
          )}

          {currentTab === 'progress' && (
            <ProgressView
              lessons={lessons}
              classes={classes}
              students={students}
              evaluations={evaluations}
              onNavigate={setCurrentTab}
              onUpdateLesson={handleUpdateLesson}
              onAddLesson={handleAddLesson}
            />
          )}

          {currentTab === 'reports' && (
            <ReportsView
              classes={classes}
              students={students}
              lessons={lessons}
              evaluations={evaluations}
              profile={profile}
            />
          )}

          {currentTab === 'import_export' && (
            <ImportExportView
              classes={classes}
              students={students}
              evaluations={evaluations}
              profile={profile}
              onClearSampleData={handleClearSampleData}
              onRestoreSampleData={handleRestoreSampleData}
              onRefreshData={refreshData}
              onShowToast={showToast}
            />
          )}

          {currentTab === 'settings' && (
            <SettingsView
              profile={profile}
              onUpdateProfile={(updates) => storage.updateProfile(updates)}
              onShowToast={showToast}
            />
          )}
        </main>
      </div>

      {/* Footer */}
      <Footer profile={profile} />

      {/* Modals & Dialogs */}
      <ClassModal
        isOpen={isClassModalOpen}
        onClose={() => setIsClassModalOpen(false)}
        onSave={handleSaveClass}
        initialClass={editingClass}
      />

      <StudentModal
        isOpen={isStudentModalOpen}
        onClose={() => setIsStudentModalOpen(false)}
        onSave={handleSaveStudent}
        classes={classes}
        initialStudent={editingStudent}
        defaultClassId={studentModalDefaultClassId}
      />

      <StudentProfileModal
        isOpen={isStudentProfileOpen}
        onClose={() => setIsStudentProfileOpen(false)}
        student={profileStudent}
        classes={classes}
        evaluations={evaluations}
      />

      <TransferClassModal
        isOpen={isTransferModalOpen}
        onClose={() => setIsTransferModalOpen(false)}
        student={transferStudent}
        classes={classes}
        onTransfer={handleConfirmTransfer}
      />

      <EvaluationEditModal
        isOpen={isEvalEditModalOpen}
        onClose={() => setIsEvalEditModalOpen(false)}
        evaluation={editingEvaluation}
        onSave={handleSaveEditEvaluation}
      />

      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        type={confirmDialog.type}
        onConfirm={confirmDialog.onConfirm}
        onCancel={() => setConfirmDialog((prev) => ({ ...prev, isOpen: false }))}
      />

      {/* Toast Notification Container */}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  );
}
