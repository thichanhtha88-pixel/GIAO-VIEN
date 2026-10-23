import {
  ClassRoom,
  Student,
  Lesson,
  EvaluationRecord,
  TeacherProfile,
} from '../types';
import {
  initialClasses,
  initialStudents,
  initialLessons,
  initialEvaluations,
  initialProfile,
} from '../data/initialData';

const STORAGE_KEYS = {
  CLASSES: 'th_primary_classes_v1',
  STUDENTS: 'th_primary_students_v1',
  LESSONS: 'th_primary_lessons_v1',
  EVALUATIONS: 'th_primary_evaluations_v1',
  PROFILE: 'th_primary_profile_v1',
};

class StorageService {
  private listeners: Set<() => void> = new Set();

  constructor() {
    this.ensureInitialized();
  }

  public subscribe(callback: () => void): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  private notify() {
    this.listeners.forEach((cb) => {
      try {
        cb();
      } catch (err) {
        console.error('Storage listener error:', err);
      }
    });
  }

  private ensureInitialized() {
    if (typeof window === 'undefined') return;

    if (!localStorage.getItem(STORAGE_KEYS.CLASSES)) {
      localStorage.setItem(STORAGE_KEYS.CLASSES, JSON.stringify(initialClasses));
    }
    if (!localStorage.getItem(STORAGE_KEYS.STUDENTS)) {
      localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(initialStudents));
    }
    if (!localStorage.getItem(STORAGE_KEYS.LESSONS)) {
      localStorage.setItem(STORAGE_KEYS.LESSONS, JSON.stringify(initialLessons));
    }
    if (!localStorage.getItem(STORAGE_KEYS.EVALUATIONS)) {
      localStorage.setItem(STORAGE_KEYS.EVALUATIONS, JSON.stringify(initialEvaluations));
    }
    if (!localStorage.getItem(STORAGE_KEYS.PROFILE)) {
      localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(initialProfile));
    }
  }

  // --- Classes ---
  public getClasses(): ClassRoom[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.CLASSES);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  public saveClasses(classes: ClassRoom[]) {
    localStorage.setItem(STORAGE_KEYS.CLASSES, JSON.stringify(classes));
    this.notify();
  }

  public addClass(item: Omit<ClassRoom, 'createdAt'>): boolean {
    const classes = this.getClasses();
    if (classes.some((c) => c.code.toLowerCase() === item.code.toLowerCase())) {
      return false; // Code exists
    }
    const newClass: ClassRoom = {
      ...item,
      createdAt: new Date().toISOString().split('T')[0],
    };
    this.saveClasses([...classes, newClass]);
    return true;
  }

  public updateClass(item: ClassRoom) {
    const classes = this.getClasses().map((c) => (c.id === item.id ? item : c));
    this.saveClasses(classes);
  }

  public deleteClass(classId: string) {
    const classes = this.getClasses().filter((c) => c.id !== classId);
    this.saveClasses(classes);
    // Remove students in class
    const students = this.getStudents().filter((s) => s.classId !== classId);
    this.saveStudents(students);
    // Remove evaluations
    const evals = this.getEvaluations().filter((e) => e.classId !== classId);
    this.saveEvaluations(evals);
  }

  // --- Students ---
  public getStudents(): Student[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.STUDENTS);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  public saveStudents(students: Student[]) {
    localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(students));
    this.notify();
  }

  public addStudent(item: Omit<Student, 'id' | 'createdAt'>): { success: boolean; message?: string } {
    const students = this.getStudents();
    if (students.some((s) => s.studentCode.trim().toLowerCase() === item.studentCode.trim().toLowerCase())) {
      return { success: false, message: `Mã học sinh ${item.studentCode} đã tồn tại trong hệ thống!` };
    }
    const newStudent: Student = {
      ...item,
      id: item.studentCode.trim() || `HS_${Date.now()}`,
      createdAt: new Date().toISOString().split('T')[0],
    };
    this.saveStudents([...students, newStudent]);
    return { success: true };
  }

  public updateStudent(item: Student) {
    const students = this.getStudents().map((s) => (s.id === item.id ? item : s));
    this.saveStudents(students);
    // Update studentName in evaluations
    const evals = this.getEvaluations().map((e) =>
      e.studentId === item.id ? { ...e, studentName: item.fullName, studentCode: item.studentCode } : e
    );
    this.saveEvaluations(evals);
  }

  public deleteStudent(studentId: string) {
    const students = this.getStudents().filter((s) => s.id !== studentId);
    this.saveStudents(students);
    const evals = this.getEvaluations().filter((e) => e.studentId !== studentId);
    this.saveEvaluations(evals);
  }

  public transferStudentClass(studentId: string, newClassId: string) {
    const students = this.getStudents().map((s) =>
      s.id === studentId ? { ...s, classId: newClassId } : s
    );
    this.saveStudents(students);
  }

  // --- Lessons ---
  public getLessons(): Lesson[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.LESSONS);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  public saveLessons(lessons: Lesson[]) {
    localStorage.setItem(STORAGE_KEYS.LESSONS, JSON.stringify(lessons));
    this.notify();
  }

  public addLesson(item: Lesson) {
    const lessons = this.getLessons();
    this.saveLessons([...lessons, item]);
  }

  public updateLesson(item: Lesson) {
    const lessons = this.getLessons().map((l) => (l.id === item.id ? item : l));
    this.saveLessons(lessons);
  }

  // --- Evaluations ---
  public getEvaluations(): EvaluationRecord[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.EVALUATIONS);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  public saveEvaluations(evaluations: EvaluationRecord[]) {
    localStorage.setItem(STORAGE_KEYS.EVALUATIONS, JSON.stringify(evaluations));
    this.notify();
  }

  public upsertEvaluation(record: Omit<EvaluationRecord, 'id' | 'updatedAt'> & { id?: string }): EvaluationRecord {
    const list = this.getEvaluations();
    const now = new Date().toISOString();

    const existingIndex = list.findIndex(
      (e) =>
        e.studentId === record.studentId &&
        e.lessonId === record.lessonId
    );

    let updatedRecord: EvaluationRecord;

    if (existingIndex >= 0) {
      const existing = list[existingIndex];
      const history = existing.history || [];
      history.unshift({
        updatedAt: existing.updatedAt,
        level: existing.level,
        comment: existing.comment,
        by: 'Thị Chành Th.',
      });

      updatedRecord = {
        ...existing,
        ...record,
        id: existing.id,
        updatedAt: now,
        history,
      };
      list[existingIndex] = updatedRecord;
    } else {
      updatedRecord = {
        ...record,
        id: record.id || `eval_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        updatedAt: now,
        history: [],
      };
      list.unshift(updatedRecord);
    }

    this.saveEvaluations(list);
    return updatedRecord;
  }

  public bulkSaveEvaluations(records: Array<Omit<EvaluationRecord, 'id' | 'updatedAt'> & { id?: string }>) {
    records.forEach((rec) => {
      this.upsertEvaluation(rec);
    });
  }

  public deleteEvaluation(evalId: string) {
    const list = this.getEvaluations().filter((e) => e.id !== evalId);
    this.saveEvaluations(list);
  }

  // --- Profile ---
  public getProfile(): TeacherProfile {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.PROFILE);
      return data ? JSON.parse(data) : initialProfile;
    } catch {
      return initialProfile;
    }
  }

  public updateProfile(profile: Partial<TeacherProfile>) {
    const current = this.getProfile();
    const updated = { ...current, ...profile };
    localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(updated));
    this.notify();
  }

  // --- Reset & Sample Data ---
  public resetToSampleData() {
    localStorage.setItem(STORAGE_KEYS.CLASSES, JSON.stringify(initialClasses));
    localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(initialStudents));
    localStorage.setItem(STORAGE_KEYS.LESSONS, JSON.stringify(initialLessons));
    localStorage.setItem(STORAGE_KEYS.EVALUATIONS, JSON.stringify(initialEvaluations));
    localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(initialProfile));
    this.notify();
  }

  public clearAllSampleData() {
    localStorage.setItem(STORAGE_KEYS.CLASSES, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.EVALUATIONS, JSON.stringify([]));
    const currentProfile = this.getProfile();
    this.updateProfile({ isSampleData: false });
    this.notify();
  }

  // --- Export / Import JSON ---
  public exportFullBackupJSON(): string {
    const backup = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      profile: this.getProfile(),
      classes: this.getClasses(),
      students: this.getStudents(),
      lessons: this.getLessons(),
      evaluations: this.getEvaluations(),
    };
    return JSON.stringify(backup, null, 2);
  }

  public importFullBackupJSON(jsonStr: string): { success: boolean; message: string } {
    try {
      const data = JSON.parse(jsonStr);
      if (!data.classes || !data.students || !data.evaluations) {
        return { success: false, message: 'Tệp JSON không đúng định dạng dữ liệu hệ thống!' };
      }
      if (data.classes) localStorage.setItem(STORAGE_KEYS.CLASSES, JSON.stringify(data.classes));
      if (data.students) localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(data.students));
      if (data.lessons) localStorage.setItem(STORAGE_KEYS.LESSONS, JSON.stringify(data.lessons));
      if (data.evaluations) localStorage.setItem(STORAGE_KEYS.EVALUATIONS, JSON.stringify(data.evaluations));
      if (data.profile) localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(data.profile));
      this.notify();
      return { success: true, message: 'Khôi phục toàn bộ dữ liệu thành công!' };
    } catch (err: any) {
      return { success: false, message: `Lỗi đọc dữ liệu tệp: ${err.message}` };
    }
  }
}

export const storage = new StorageService();
