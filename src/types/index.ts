/**
 * Data types and interfaces for
 * TIN HỌC TIỂU HỌC – TRƯỜNG TIỂU HỌC THỨ BA
 */

export type EvaluationLevel = 'Hoàn thành tốt' | 'Hoàn thành' | 'Chưa hoàn thành' | 'Chưa đánh giá';

export type ActivityType = 
  | 'Bài thực hành' 
  | 'Câu hỏi kiểm tra' 
  | 'Nhiệm vụ nhóm' 
  | 'Sản phẩm học tập' 
  | 'Quan sát trong giờ học';

export interface ClassRoom {
  id: string; // e.g. "3A"
  code: string; // e.g. "3A"
  name: string; // e.g. "Lớp 3A"
  grade: number; // 3, 4, 5
  academicYear: string; // "2024 - 2025"
  note?: string;
  createdAt: string;
}

export interface Student {
  id: string; // e.g. "HS001"
  studentCode: string; // e.g. "HS001"
  fullName: string;
  classId: string;
  academicYear: string;
  gender?: 'Nam' | 'Nữ';
  note?: string;
  createdAt: string;
}

export interface Lesson {
  id: string; // e.g. "bai-1"
  code: string; // "Bài 1"
  title: string; // "Làm quen với máy tính"
  grade: number; // 3, 4, 5
  topic: string; // e.g. "Chủ đề A: Máy tính và em"
  taughtDate: string; // "12/09/2024"
  status: 'completed' | 'in_progress' | 'planned';
  note?: string;
}

export interface EvaluationRecord {
  id: string;
  studentId: string;
  studentCode: string;
  studentName: string;
  classId: string;
  lessonId: string;
  lessonTitle: string;
  evaluationDate: string; // "YYYY-MM-DD" or "DD/MM/YYYY"
  activityType: ActivityType;
  level: EvaluationLevel;
  comment: string;
  updatedAt: string;
  history?: Array<{
    updatedAt: string;
    level: EvaluationLevel;
    comment: string;
    by: string;
  }>;
}

export interface TeacherProfile {
  uid?: string;
  username?: string;
  authProvider?: 'password' | 'google';
  name: string;
  email: string;
  schoolName: string;
  schoolAddress: string;
  slogan: string;
  currentYear: string;
  currentSemester: string;
  isLoggedIn: boolean;
  isSampleData: boolean;
  databaseStatus: 'connected' | 'syncing' | 'offline';
}

export type TabType = 
  | 'overview' 
  | 'classes' 
  | 'students' 
  | 'evaluations' 
  | 'progress' 
  | 'reports' 
  | 'import_export' 
  | 'settings';
