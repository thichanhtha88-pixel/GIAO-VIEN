import { RealtimeChannel, User as SupabaseUser } from '@supabase/supabase-js';
import {
  ActivityType,
  ClassRoom,
  EvaluationLevel,
  EvaluationRecord,
  Lesson,
  Student,
  TeacherProfile,
} from '../types';
import {
  initialClasses,
  initialEvaluations,
  initialLessons,
  initialProfile,
  initialStudents,
} from '../data/initialData';
import {
  APP_CONSTRAINTS,
  clampStr,
  deriveUsernameFromEmail,
  INTERNAL_AUTH_DOMAIN,
  sanitizeEntityId,
  supabase,
} from '../supabase';

interface PendingRegistrationMeta {
  username: string;
  name: string;
  schoolName: string;
  authProvider: 'password' | 'google';
}

const HISTORY_DELIMITER = ' ||| ';

function sanitizeHistory(
  history?: EvaluationRecord['history']
): NonNullable<EvaluationRecord['history']> {
  if (!history || !Array.isArray(history)) return [];
  return history.slice(0, APP_CONSTRAINTS.EVAL_HISTORY_MAX_ITEMS).map((h) => ({
    updatedAt: clampStr(h.updatedAt, 40, new Date().toISOString()),
    level: (clampStr(h.level, 40, 'Hoàn thành') as EvaluationLevel) || 'Hoàn thành',
    by: clampStr(h.by, 80, 'Giáo viên'),
    comment: clampStr(h.comment, 300, ''),
  }));
}

function parseHistory(raw: unknown): EvaluationRecord['history'] {
  if (!Array.isArray(raw)) return [];
  return raw.map((item) => {
    if (typeof item === 'string') {
      const parts = item.split(HISTORY_DELIMITER);
      return {
        updatedAt: parts[0] || new Date().toISOString(),
        level: (parts[1] as EvaluationLevel) || 'Hoàn thành',
        by: parts[2] || 'Giáo viên',
        comment: parts.slice(3).join(' - ') || '',
      };
    }
    if (item && typeof item === 'object') {
      const obj = item as Record<string, unknown>;
      return {
        updatedAt: typeof obj.updatedAt === 'string' ? obj.updatedAt : new Date().toISOString(),
        level: (typeof obj.level === 'string' ? obj.level : 'Hoàn thành') as EvaluationLevel,
        by: typeof obj.by === 'string' ? obj.by : 'Giáo viên',
        comment: typeof obj.comment === 'string' ? obj.comment : '',
      };
    }
    return {
      updatedAt: new Date().toISOString(),
      level: 'Hoàn thành' as EvaluationLevel,
      by: 'Giáo viên',
      comment: '',
    };
  });
}

function sanitizeGrade(grade: number): number {
  if (grade === 3 || grade === 4 || grade === 5) return grade;
  return 3;
}

function chunkArray<T>(items: T[], size = 200): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }
  return chunks;
}

class StorageService {
  private listeners: Set<() => void> = new Set();
  private activeUid: string | null = null;
  private bindingPromise: Promise<void> | null = null;
  private bindingUid: string | null = null;
  private realtimeChannel: RealtimeChannel | null = null;
  private pendingMeta: PendingRegistrationMeta | null = null;

  // Promise trackers to guarantee relational FK order during rapid synchronous UI operations
  private pendingClassOps: Map<string, Promise<unknown>> = new Map();
  private pendingStudentOps: Map<string, Promise<unknown>> = new Map();

  private profileState: TeacherProfile = {
    ...initialProfile,
    isLoggedIn: false,
    databaseStatus: 'connected',
  };
  private classesState: ClassRoom[] = [];
  private studentsState: Student[] = [];
  private lessonsState: Lesson[] = [];
  private evaluationsState: EvaluationRecord[] = [];

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

  public setPendingRegistrationMeta(meta: PendingRegistrationMeta) {
    this.pendingMeta = meta;
  }

  public clearPendingRegistrationMeta() {
    this.pendingMeta = null;
  }

  public unbindAuthenticatedUser() {
    if (this.realtimeChannel) {
      void supabase.removeChannel(this.realtimeChannel);
      this.realtimeChannel = null;
    }
    this.activeUid = null;
    this.bindingUid = null;
    this.bindingPromise = null;
    this.pendingClassOps.clear();
    this.pendingStudentOps.clear();
    this.classesState = [];
    this.studentsState = [];
    this.lessonsState = [];
    this.evaluationsState = [];
    this.profileState = {
      ...initialProfile,
      isLoggedIn: false,
      databaseStatus: 'connected',
    };
    this.notify();
  }

  public async bindAuthenticatedUser(user: SupabaseUser): Promise<void> {
    if (this.activeUid === user.id) {
      return;
    }
    if (this.bindingUid === user.id && this.bindingPromise) {
      return this.bindingPromise;
    }

    this.bindingUid = user.id;
    this.bindingPromise = this.performBindUser(user).finally(() => {
      this.bindingPromise = null;
      this.bindingUid = null;
    });
    return this.bindingPromise;
  }

  private async performBindUser(user: SupabaseUser): Promise<void> {
    const uid = user.id;
    const meta = this.pendingMeta;
    this.pendingMeta = null;

    const userMeta = (user.user_metadata || {}) as Record<string, unknown>;
    const metaUsername =
      meta?.username ||
      (typeof userMeta.username === 'string' ? userMeta.username : '') ||
      deriveUsernameFromEmail(user.email, uid);
    const metaFullName =
      meta?.name ||
      (typeof userMeta.full_name === 'string' ? userMeta.full_name : '') ||
      (typeof userMeta.name === 'string' ? userMeta.name : '') ||
      metaUsername;
    const metaSchoolName =
      meta?.schoolName ||
      (typeof userMeta.school_name === 'string' ? userMeta.school_name : '') ||
      initialProfile.schoolName;

    const isPasswordProvider =
      user.app_metadata?.provider === 'email' ||
      (user.email || '').endsWith(`@${INTERNAL_AUTH_DOMAIN}`);
    const resolvedAuthProvider: 'password' | 'google' = isPasswordProvider ? 'password' : 'google';

    // 1. Check existing profile in public.profiles
    const { data: existingProfile, error: fetchProfileErr } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', uid)
      .maybeSingle();

    if (fetchProfileErr) {
      console.error('Supabase error fetching profile:', fetchProfileErr.message);
    }

    let finalProfileRow = existingProfile;

    if (!finalProfileRow) {
      const displayEmail = isPasswordProvider ? `@${metaUsername}` : user.email || '';
      const baseInsertPayload = {
        id: uid,
        username: metaUsername,
        name: clampStr(metaFullName, APP_CONSTRAINTS.NAME_MAX, 'Giáo viên Tin học'),
        email: displayEmail,
        school_name: clampStr(metaSchoolName, APP_CONSTRAINTS.SCHOOL_NAME_MAX, 'Trường Tiểu học Thứ Ba'),
        school_address: clampStr(initialProfile.schoolAddress, APP_CONSTRAINTS.SCHOOL_ADDRESS_MAX, ''),
        slogan: clampStr(initialProfile.slogan, APP_CONSTRAINTS.SLOGAN_MAX, ''),
        current_year: clampStr(initialProfile.currentYear, APP_CONSTRAINTS.YEAR_MAX, '2024 - 2025'),
        current_semester: clampStr(initialProfile.currentSemester, APP_CONSTRAINTS.SEMESTER_MAX, 'Học kỳ I'),
        auth_provider: meta?.authProvider || resolvedAuthProvider,
        is_sample_data: true,
        updated_at: new Date().toISOString(),
      };

      const { data: inserted, error: insertErr } = await supabase
        .from('profiles')
        .upsert(baseInsertPayload, { onConflict: 'id' })
        .select('*')
        .maybeSingle();

      if (insertErr && insertErr.code === '23505') {
        // Fallback if username already taken in profiles table
        const uniqueUsername = `${metaUsername}_${uid.slice(0, 4)}`.slice(
          0,
          APP_CONSTRAINTS.USERNAME_MAX
        );
        const { data: retryInserted } = await supabase
          .from('profiles')
          .upsert(
            {
              ...baseInsertPayload,
              username: uniqueUsername,
              email: isPasswordProvider ? `@${uniqueUsername}` : user.email || '',
            },
            { onConflict: 'id' }
          )
          .select('*')
          .maybeSingle();
        finalProfileRow = retryInserted;
      } else {
        finalProfileRow = inserted;
      }

      // Seed starter curriculum & sample data in strict relational order
      await this.seedDatasetToCloud(uid, {
        classes: initialClasses,
        lessons: initialLessons,
        students: initialStudents,
        evaluations: initialEvaluations,
      });
    }

    this.activeUid = uid;
    const resolvedUsername = (finalProfileRow?.username as string) || metaUsername;
    const displayEmail = isPasswordProvider ? `@${resolvedUsername}` : user.email || '';

    this.profileState = {
      uid,
      username: resolvedUsername,
      authProvider:
        ((finalProfileRow?.auth_provider as 'password' | 'google') || resolvedAuthProvider),
      name: (finalProfileRow?.name as string) || metaFullName || 'Giáo viên',
      email: (finalProfileRow?.email as string) || displayEmail,
      schoolName: (finalProfileRow?.school_name as string) || metaSchoolName,
      schoolAddress: (finalProfileRow?.school_address as string) ?? initialProfile.schoolAddress,
      slogan: (finalProfileRow?.slogan as string) ?? initialProfile.slogan,
      currentYear: (finalProfileRow?.current_year as string) || initialProfile.currentYear,
      currentSemester:
        (finalProfileRow?.current_semester as string) || initialProfile.currentSemester,
      isLoggedIn: true,
      isSampleData:
        finalProfileRow?.is_sample_data !== undefined
          ? Boolean(finalProfileRow.is_sample_data)
          : true,
      databaseStatus: 'connected',
    };

    // Load all relational data for this teacher from Supabase
    await this.fetchAllCloudData(uid);
    this.notify();

    // Subscribe to realtime Postgres changes on Supabase
    this.attachRealtimeChannel(uid, displayEmail);
  }

  private async fetchAllCloudData(uid: string): Promise<void> {
    const [classesRes, lessonsRes, studentsRes, evaluationsRes] = await Promise.all([
      supabase.from('classes').select('*').eq('owner_id', uid),
      supabase.from('lessons').select('*').eq('owner_id', uid),
      supabase.from('students').select('*').eq('owner_id', uid),
      supabase.from('evaluations').select('*').eq('owner_id', uid),
    ]);

    if (!classesRes.error && classesRes.data) {
      const list: ClassRoom[] = classesRes.data.map((d) => ({
        id: d.id as string,
        code: d.code as string,
        name: d.name as string,
        grade: Number(d.grade) || 3,
        academicYear: (d.academic_year as string) || '2024 - 2025',
        note: (d.note as string) || '',
        createdAt: (d.created_date as string) || '2024-09-05',
      }));
      list.sort((a, b) => a.code.localeCompare(b.code, 'vi'));
      this.classesState = list;
    }

    if (!lessonsRes.error && lessonsRes.data) {
      const list: Lesson[] = lessonsRes.data.map((d) => ({
        id: d.id as string,
        code: d.code as string,
        title: d.title as string,
        grade: Number(d.grade) || 3,
        topic: d.topic as string,
        taughtDate: (d.taught_date as string) || '',
        status: ((d.status as Lesson['status']) || 'planned'),
        note: (d.note as string) || '',
      }));
      list.sort((a, b) => a.id.localeCompare(b.id, 'vi', { numeric: true }));
      this.lessonsState = list;
    }

    if (!studentsRes.error && studentsRes.data) {
      const list: Student[] = studentsRes.data.map((d) => {
        const rawGender = d.gender as string;
        return {
          id: d.id as string,
          studentCode: d.student_code as string,
          fullName: d.full_name as string,
          classId: d.class_id as string,
          academicYear: (d.academic_year as string) || '2024 - 2025',
          gender: rawGender === 'Nữ' ? 'Nữ' : rawGender === 'Nam' ? 'Nam' : undefined,
          note: (d.note as string) || '',
          createdAt: (d.created_date as string) || '2024-09-05',
        };
      });
      list.sort((a, b) => a.studentCode.localeCompare(b.studentCode, 'vi'));
      this.studentsState = list;
    }

    if (!evaluationsRes.error && evaluationsRes.data) {
      const list: EvaluationRecord[] = evaluationsRes.data.map((d) => ({
        id: d.id as string,
        studentId: d.student_id as string,
        studentCode: d.student_code as string,
        studentName: d.student_name as string,
        classId: d.class_id as string,
        lessonId: d.lesson_id as string,
        lessonTitle: d.lesson_title as string,
        evaluationDate: d.evaluation_date as string,
        activityType: d.activity_type as ActivityType,
        level: d.level as EvaluationLevel,
        comment: (d.comment as string) || '',
        updatedAt: (d.updated_at as string) || new Date().toISOString(),
        history: parseHistory(d.history),
      }));
      list.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
      this.evaluationsState = list;
    }
  }

  private attachRealtimeChannel(uid: string, displayEmail: string) {
    if (this.realtimeChannel) {
      void supabase.removeChannel(this.realtimeChannel);
      this.realtimeChannel = null;
    }

    const channel = supabase
      .channel(`supabase_sync_${uid}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'profiles', filter: `id=eq.${uid}` },
        async () => {
          if (this.activeUid !== uid) return;
          const { data } = await supabase.from('profiles').select('*').eq('id', uid).maybeSingle();
          if (data) {
            this.profileState = {
              ...this.profileState,
              uid,
              username: (data.username as string) || this.profileState.username,
              authProvider:
                (data.auth_provider as 'password' | 'google') || this.profileState.authProvider,
              name: (data.name as string) || this.profileState.name,
              email: (data.email as string) || displayEmail,
              schoolName: (data.school_name as string) || this.profileState.schoolName,
              schoolAddress: (data.school_address as string) ?? '',
              slogan: (data.slogan as string) ?? '',
              currentYear: (data.current_year as string) || '2024 - 2025',
              currentSemester: (data.current_semester as string) || 'Học kỳ I',
              isLoggedIn: true,
              isSampleData: Boolean(data.is_sample_data),
              databaseStatus: 'connected',
            };
            this.notify();
          }
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'classes', filter: `owner_id=eq.${uid}` },
        async () => {
          if (this.activeUid !== uid) return;
          await this.fetchAllCloudData(uid);
          this.notify();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'students', filter: `owner_id=eq.${uid}` },
        async () => {
          if (this.activeUid !== uid) return;
          await this.fetchAllCloudData(uid);
          this.notify();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'lessons', filter: `owner_id=eq.${uid}` },
        async () => {
          if (this.activeUid !== uid) return;
          await this.fetchAllCloudData(uid);
          this.notify();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'evaluations', filter: `owner_id=eq.${uid}` },
        async () => {
          if (this.activeUid !== uid) return;
          await this.fetchAllCloudData(uid);
          this.notify();
        }
      )
      .subscribe();

    this.realtimeChannel = channel;
  }

  private buildClassRow(uid: string, item: ClassRoom) {
    const id = sanitizeEntityId(item.id || item.code, 'cls');
    const nowIso = new Date().toISOString();
    return {
      id,
      row: {
        owner_id: uid,
        id,
        code: clampStr(item.code, APP_CONSTRAINTS.CLASS_CODE_MAX, id),
        name: clampStr(item.name, APP_CONSTRAINTS.CLASS_NAME_MAX, `Lớp ${id}`),
        grade: sanitizeGrade(item.grade),
        academic_year: clampStr(item.academicYear, APP_CONSTRAINTS.YEAR_MAX, '2024 - 2025'),
        note: clampStr(item.note, APP_CONSTRAINTS.NOTE_MAX, ''),
        created_date: clampStr(
          item.createdAt || nowIso.split('T')[0],
          APP_CONSTRAINTS.DATE_STR_MAX,
          '2024-09-05'
        ),
        updated_at: nowIso,
      },
    };
  }

  private buildLessonRow(uid: string, item: Lesson) {
    const id = sanitizeEntityId(item.id || item.code, 'lesson');
    const nowIso = new Date().toISOString();
    return {
      id,
      row: {
        owner_id: uid,
        id,
        code: clampStr(item.code, APP_CONSTRAINTS.LESSON_CODE_MAX, 'Bài mới'),
        title: clampStr(item.title, APP_CONSTRAINTS.LESSON_TITLE_MAX, 'Bài học Tin học'),
        grade: sanitizeGrade(item.grade),
        topic: clampStr(item.topic, APP_CONSTRAINTS.LESSON_TOPIC_MAX, 'Chủ đề Tin học'),
        taught_date: clampStr(item.taughtDate, APP_CONSTRAINTS.DATE_STR_MAX, ''),
        status: item.status || 'planned',
        note: clampStr(item.note, APP_CONSTRAINTS.NOTE_MAX, ''),
        updated_at: nowIso,
      },
    };
  }

  private buildStudentRow(uid: string, item: Student) {
    const id = sanitizeEntityId(item.id || item.studentCode, 'HS');
    const classId = sanitizeEntityId(item.classId, 'cls');
    const nowIso = new Date().toISOString();
    return {
      id,
      row: {
        owner_id: uid,
        id,
        student_code: clampStr(item.studentCode, APP_CONSTRAINTS.STUDENT_CODE_MAX, id),
        full_name: clampStr(item.fullName, APP_CONSTRAINTS.STUDENT_NAME_MAX, 'Học sinh'),
        class_id: classId,
        academic_year: clampStr(item.academicYear, APP_CONSTRAINTS.YEAR_MAX, '2024 - 2025'),
        gender: item.gender === 'Nữ' ? 'Nữ' : item.gender === 'Nam' ? 'Nam' : '',
        note: clampStr(item.note, APP_CONSTRAINTS.NOTE_MAX, ''),
        created_date: clampStr(
          item.createdAt || nowIso.split('T')[0],
          APP_CONSTRAINTS.DATE_STR_MAX,
          '2024-09-05'
        ),
        updated_at: nowIso,
      },
    };
  }

  private buildEvaluationRow(uid: string, item: EvaluationRecord) {
    const id = sanitizeEntityId(item.id, 'eval');
    const nowIso = item.updatedAt || new Date().toISOString();
    return {
      id,
      row: {
        owner_id: uid,
        id,
        student_id: sanitizeEntityId(item.studentId, 'HS'),
        student_code: clampStr(item.studentCode, APP_CONSTRAINTS.STUDENT_CODE_MAX, 'HS'),
        student_name: clampStr(item.studentName, APP_CONSTRAINTS.STUDENT_NAME_MAX, 'Học sinh'),
        class_id: sanitizeEntityId(item.classId, 'cls'),
        lesson_id: sanitizeEntityId(item.lessonId, 'lesson'),
        lesson_title: clampStr(item.lessonTitle, APP_CONSTRAINTS.LESSON_TITLE_MAX, 'Bài học'),
        evaluation_date: clampStr(
          item.evaluationDate,
          APP_CONSTRAINTS.DATE_STR_MAX,
          nowIso.split('T')[0]
        ),
        activity_type: item.activityType || 'Bài thực hành',
        level: item.level || 'Hoàn thành',
        comment: clampStr(item.comment, APP_CONSTRAINTS.EVAL_COMMENT_MAX, ''),
        history: sanitizeHistory(item.history),
        updated_at: nowIso,
      },
    };
  }

  private async seedDatasetToCloud(
    uid: string,
    dataset: {
      classes: ClassRoom[];
      lessons: Lesson[];
      students: Student[];
      evaluations: EvaluationRecord[];
    }
  ): Promise<void> {
    const validClassIds = new Set<string>();
    const validStudentIds = new Set<string>();

    // Ensure any class referenced by students exists even if omitted in backup JSON
    const classMap = new Map<string, ReturnType<StorageService['buildClassRow']>['row']>();
    dataset.classes.forEach((cls) => {
      const { id, row } = this.buildClassRow(uid, cls);
      validClassIds.add(id);
      classMap.set(id, row);
    });
    dataset.students.forEach((st) => {
      const cid = sanitizeEntityId(st.classId, 'cls');
      if (!classMap.has(cid)) {
        const parsedGrade = parseInt(st.classId, 10);
        const { id, row } = this.buildClassRow(uid, {
          id: cid,
          code: st.classId || cid,
          name: `Lớp ${st.classId || cid}`,
          grade: sanitizeGrade(parsedGrade),
          academicYear: st.academicYear || '2024 - 2025',
          createdAt: new Date().toISOString().split('T')[0],
        });
        validClassIds.add(id);
        classMap.set(id, row);
      }
    });

    // Step 1: Classes & Lessons
    const classRows = Array.from(classMap.values());
    if (classRows.length > 0) {
      for (const chunk of chunkArray(classRows)) {
        const { error } = await supabase
          .from('classes')
          .upsert(chunk, { onConflict: 'owner_id,id' });
        if (error) console.error('Supabase seed classes error:', error.message);
      }
    }

    const lessonRows = dataset.lessons.map((les) => this.buildLessonRow(uid, les).row);
    if (lessonRows.length > 0) {
      for (const chunk of chunkArray(lessonRows)) {
        const { error } = await supabase
          .from('lessons')
          .upsert(chunk, { onConflict: 'owner_id,id' });
        if (error) console.error('Supabase seed lessons error:', error.message);
      }
    }

    // Step 2: Students
    const studentRows = dataset.students
      .filter((st) => validClassIds.has(sanitizeEntityId(st.classId, 'cls')))
      .map((st) => {
        const { id, row } = this.buildStudentRow(uid, st);
        validStudentIds.add(id);
        return row;
      });

    if (studentRows.length > 0) {
      for (const chunk of chunkArray(studentRows)) {
        const { error } = await supabase
          .from('students')
          .upsert(chunk, { onConflict: 'owner_id,id' });
        if (error) console.error('Supabase seed students error:', error.message);
      }
    }

    // Step 3: Evaluations
    const evalRows = dataset.evaluations
      .filter((ev) => validStudentIds.has(sanitizeEntityId(ev.studentId, 'HS')))
      .map((ev) => this.buildEvaluationRow(uid, ev).row);

    if (evalRows.length > 0) {
      for (const chunk of chunkArray(evalRows)) {
        const { error } = await supabase
          .from('evaluations')
          .upsert(chunk, { onConflict: 'owner_id,id' });
        if (error) console.error('Supabase seed evaluations error:', error.message);
      }
    }
  }

  private async clearCloudCollections(uid: string, includeLessons: boolean): Promise<void> {
    await supabase.from('evaluations').delete().eq('owner_id', uid);
    await supabase.from('students').delete().eq('owner_id', uid);
    await supabase.from('classes').delete().eq('owner_id', uid);
    if (includeLessons) {
      await supabase.from('lessons').delete().eq('owner_id', uid);
    }
  }

  // --- Classes ---
  public getClasses(): ClassRoom[] {
    return this.classesState;
  }

  public addClass(item: Omit<ClassRoom, 'createdAt'>): boolean {
    if (this.classesState.some((c) => c.code.toLowerCase() === item.code.trim().toLowerCase())) {
      return false;
    }
    const id = sanitizeEntityId(item.id || item.code, 'cls');
    const newClass: ClassRoom = {
      ...item,
      id,
      code: clampStr(item.code, APP_CONSTRAINTS.CLASS_CODE_MAX, id),
      name: clampStr(item.name, APP_CONSTRAINTS.CLASS_NAME_MAX, `Lớp ${id}`),
      grade: sanitizeGrade(item.grade),
      academicYear: clampStr(item.academicYear, APP_CONSTRAINTS.YEAR_MAX, '2024 - 2025'),
      note: clampStr(item.note, APP_CONSTRAINTS.NOTE_MAX, ''),
      createdAt: new Date().toISOString().split('T')[0],
    };

    this.classesState = [...this.classesState, newClass].sort((a, b) =>
      a.code.localeCompare(b.code, 'vi')
    );
    this.notify();

    if (this.activeUid) {
      const uid = this.activeUid;
      const { row } = this.buildClassRow(uid, newClass);
      const op = (async () => {
        const { error } = await supabase
          .from('classes')
          .upsert(row, { onConflict: 'owner_id,id' });
        if (error) {
          console.error('Supabase addClass error:', error.message);
        }
      })().finally(() => {
        this.pendingClassOps.delete(id);
      });
      this.pendingClassOps.set(id, op);
    }
    return true;
  }

  public updateClass(item: ClassRoom) {
    const updated: ClassRoom = {
      ...item,
      code: clampStr(item.code, APP_CONSTRAINTS.CLASS_CODE_MAX, item.id),
      name: clampStr(item.name, APP_CONSTRAINTS.CLASS_NAME_MAX, item.name),
      grade: sanitizeGrade(item.grade),
      academicYear: clampStr(item.academicYear, APP_CONSTRAINTS.YEAR_MAX, '2024 - 2025'),
      note: clampStr(item.note, APP_CONSTRAINTS.NOTE_MAX, ''),
    };
    this.classesState = this.classesState
      .map((c) => (c.id === updated.id ? updated : c))
      .sort((a, b) => a.code.localeCompare(b.code, 'vi'));
    this.notify();

    if (this.activeUid) {
      const uid = this.activeUid;
      void supabase
        .from('classes')
        .update({
          code: updated.code,
          name: updated.name,
          grade: updated.grade,
          academic_year: updated.academicYear,
          note: updated.note || '',
          updated_at: new Date().toISOString(),
        })
        .eq('owner_id', uid)
        .eq('id', updated.id)
        .then(({ error }) => {
          if (error) console.error('Supabase updateClass error:', error.message);
        });
    }
  }

  public deleteClass(classId: string) {
    this.evaluationsState = this.evaluationsState.filter((e) => e.classId !== classId);
    this.studentsState = this.studentsState.filter((s) => s.classId !== classId);
    this.classesState = this.classesState.filter((c) => c.id !== classId);
    this.notify();

    if (this.activeUid) {
      const uid = this.activeUid;
      void (async () => {
        await supabase.from('evaluations').delete().eq('owner_id', uid).eq('class_id', classId);
        await supabase.from('students').delete().eq('owner_id', uid).eq('class_id', classId);
        const { error } = await supabase
          .from('classes')
          .delete()
          .eq('owner_id', uid)
          .eq('id', classId);
        if (error) console.error('Supabase deleteClass error:', error.message);
      })();
    }
  }

  // --- Students ---
  public getStudents(): Student[] {
    return this.studentsState;
  }

  public addStudent(item: Omit<Student, 'id' | 'createdAt'>): {
    success: boolean;
    message?: string;
  } {
    if (
      this.studentsState.some(
        (s) => s.studentCode.trim().toLowerCase() === item.studentCode.trim().toLowerCase()
      )
    ) {
      return {
        success: false,
        message: `Mã học sinh ${item.studentCode} đã tồn tại trong hệ thống!`,
      };
    }

    const id = sanitizeEntityId(item.studentCode || `HS_${Date.now()}`, 'HS');
    if (this.studentsState.some((s) => s.id === id)) {
      return {
        success: false,
        message: `Mã định danh học sinh ${id} đã tồn tại trong hệ thống!`,
      };
    }

    const cleanClassId = sanitizeEntityId(item.classId, 'cls');

    // Auto-create the class if it doesn't exist yet (e.g. during CSV import into a new class)
    if (!this.classesState.some((c) => c.id === cleanClassId)) {
      const parsedGrade = parseInt(item.classId, 10);
      this.addClass({
        id: cleanClassId,
        code: item.classId.trim() || cleanClassId,
        name: `Lớp ${item.classId.trim() || cleanClassId}`,
        grade: sanitizeGrade(parsedGrade),
        academicYear: item.academicYear || this.profileState.currentYear || '2024 - 2025',
      });
    }

    const newStudent: Student = {
      ...item,
      id,
      studentCode: clampStr(item.studentCode, APP_CONSTRAINTS.STUDENT_CODE_MAX, id),
      fullName: clampStr(item.fullName, APP_CONSTRAINTS.STUDENT_NAME_MAX, 'Học sinh'),
      classId: cleanClassId,
      academicYear: clampStr(item.academicYear, APP_CONSTRAINTS.YEAR_MAX, '2024 - 2025'),
      note: clampStr(item.note, APP_CONSTRAINTS.NOTE_MAX, ''),
      createdAt: new Date().toISOString().split('T')[0],
    };

    this.studentsState = [...this.studentsState, newStudent].sort((a, b) =>
      a.studentCode.localeCompare(b.studentCode, 'vi')
    );
    this.notify();

    if (this.activeUid) {
      const uid = this.activeUid;
      const { row } = this.buildStudentRow(uid, newStudent);
      const pendingClass = this.pendingClassOps.get(cleanClassId);
      const op = (async () => {
        if (pendingClass) {
          await pendingClass;
        }
        const { error } = await supabase
          .from('students')
          .upsert(row, { onConflict: 'owner_id,id' });
        if (error) {
          console.error('Supabase addStudent error:', error.message);
        }
      })().finally(() => {
        this.pendingStudentOps.delete(id);
      });
      this.pendingStudentOps.set(id, op);
    }

    return { success: true };
  }

  public updateStudent(item: Student) {
    const cleanClassId = sanitizeEntityId(item.classId, 'cls');
    const updated: Student = {
      ...item,
      studentCode: clampStr(item.studentCode, APP_CONSTRAINTS.STUDENT_CODE_MAX, item.id),
      fullName: clampStr(item.fullName, APP_CONSTRAINTS.STUDENT_NAME_MAX, item.fullName),
      classId: cleanClassId,
      academicYear: clampStr(item.academicYear, APP_CONSTRAINTS.YEAR_MAX, '2024 - 2025'),
      note: clampStr(item.note, APP_CONSTRAINTS.NOTE_MAX, ''),
    };

    this.studentsState = this.studentsState
      .map((s) => (s.id === updated.id ? updated : s))
      .sort((a, b) => a.studentCode.localeCompare(b.studentCode, 'vi'));

    const hasEvalChanges = this.evaluationsState.some((e) => e.studentId === updated.id);
    if (hasEvalChanges) {
      this.evaluationsState = this.evaluationsState.map((e) =>
        e.studentId === updated.id
          ? { ...e, studentName: updated.fullName, studentCode: updated.studentCode }
          : e
      );
    }
    this.notify();

    if (this.activeUid) {
      const uid = this.activeUid;
      const nowIso = new Date().toISOString();
      void supabase
        .from('students')
        .update({
          student_code: updated.studentCode,
          full_name: updated.fullName,
          class_id: updated.classId,
          academic_year: updated.academicYear,
          gender: updated.gender === 'Nữ' ? 'Nữ' : updated.gender === 'Nam' ? 'Nam' : '',
          note: updated.note || '',
          updated_at: nowIso,
        })
        .eq('owner_id', uid)
        .eq('id', updated.id)
        .then(({ error }) => {
          if (error) console.error('Supabase updateStudent error:', error.message);
        });

      if (hasEvalChanges) {
        void supabase
          .from('evaluations')
          .update({
            student_code: updated.studentCode,
            student_name: updated.fullName,
            updated_at: nowIso,
          })
          .eq('owner_id', uid)
          .eq('student_id', updated.id)
          .then(({ error }) => {
            if (error) console.error('Supabase sync student evaluations error:', error.message);
          });
      }
    }
  }

  public deleteStudent(studentId: string) {
    this.evaluationsState = this.evaluationsState.filter((e) => e.studentId !== studentId);
    this.studentsState = this.studentsState.filter((s) => s.id !== studentId);
    this.notify();

    if (this.activeUid) {
      const uid = this.activeUid;
      void (async () => {
        await supabase.from('evaluations').delete().eq('owner_id', uid).eq('student_id', studentId);
        const { error } = await supabase
          .from('students')
          .delete()
          .eq('owner_id', uid)
          .eq('id', studentId);
        if (error) console.error('Supabase deleteStudent error:', error.message);
      })();
    }
  }

  public transferStudentClass(studentId: string, newClassId: string) {
    const cleanClassId = sanitizeEntityId(newClassId, 'cls');
    this.studentsState = this.studentsState.map((s) =>
      s.id === studentId ? { ...s, classId: cleanClassId } : s
    );
    this.notify();

    if (this.activeUid) {
      const uid = this.activeUid;
      void supabase
        .from('students')
        .update({
          class_id: cleanClassId,
          updated_at: new Date().toISOString(),
        })
        .eq('owner_id', uid)
        .eq('id', studentId)
        .then(({ error }) => {
          if (error) console.error('Supabase transferStudentClass error:', error.message);
        });
    }
  }

  // --- Lessons ---
  public getLessons(): Lesson[] {
    return this.lessonsState;
  }

  public addLesson(item: Lesson) {
    const id = sanitizeEntityId(item.id || item.code, 'lesson');
    const newLesson: Lesson = {
      ...item,
      id,
      code: clampStr(item.code, APP_CONSTRAINTS.LESSON_CODE_MAX, 'Bài mới'),
      title: clampStr(item.title, APP_CONSTRAINTS.LESSON_TITLE_MAX, 'Bài học Tin học'),
      grade: sanitizeGrade(item.grade),
      topic: clampStr(item.topic, APP_CONSTRAINTS.LESSON_TOPIC_MAX, 'Chủ đề Tin học'),
      taughtDate: clampStr(item.taughtDate, APP_CONSTRAINTS.DATE_STR_MAX, ''),
      note: clampStr(item.note, APP_CONSTRAINTS.NOTE_MAX, ''),
    };
    this.lessonsState = [...this.lessonsState, newLesson].sort((a, b) =>
      a.id.localeCompare(b.id, 'vi', { numeric: true })
    );
    this.notify();

    if (this.activeUid) {
      const uid = this.activeUid;
      const { row } = this.buildLessonRow(uid, newLesson);
      void supabase
        .from('lessons')
        .upsert(row, { onConflict: 'owner_id,id' })
        .then(({ error }) => {
          if (error) console.error('Supabase addLesson error:', error.message);
        });
    }
  }

  public updateLesson(item: Lesson) {
    const updated: Lesson = {
      ...item,
      code: clampStr(item.code, APP_CONSTRAINTS.LESSON_CODE_MAX, 'Bài học'),
      title: clampStr(item.title, APP_CONSTRAINTS.LESSON_TITLE_MAX, 'Bài học'),
      grade: sanitizeGrade(item.grade),
      topic: clampStr(item.topic, APP_CONSTRAINTS.LESSON_TOPIC_MAX, 'Chủ đề'),
      taughtDate: clampStr(item.taughtDate, APP_CONSTRAINTS.DATE_STR_MAX, ''),
      note: clampStr(item.note, APP_CONSTRAINTS.NOTE_MAX, ''),
    };
    this.lessonsState = this.lessonsState.map((l) => (l.id === updated.id ? updated : l));
    this.notify();

    if (this.activeUid) {
      const uid = this.activeUid;
      void supabase
        .from('lessons')
        .update({
          code: updated.code,
          title: updated.title,
          grade: updated.grade,
          topic: updated.topic,
          taught_date: updated.taughtDate || '',
          status: updated.status,
          note: updated.note || '',
          updated_at: new Date().toISOString(),
        })
        .eq('owner_id', uid)
        .eq('id', updated.id)
        .then(({ error }) => {
          if (error) console.error('Supabase updateLesson error:', error.message);
        });
    }
  }

  // --- Evaluations ---
  public getEvaluations(): EvaluationRecord[] {
    return this.evaluationsState;
  }

  private applyEvaluationUpsertLocal(
    list: EvaluationRecord[],
    record: Omit<EvaluationRecord, 'id' | 'updatedAt'> & { id?: string },
    now: string
  ): EvaluationRecord {
    const existingIndex = list.findIndex(
      (e) =>
        (record.id && e.id === record.id) ||
        (e.studentId === record.studentId && e.lessonId === record.lessonId)
    );

    if (existingIndex >= 0) {
      const existing = list[existingIndex];
      const history = [...(existing.history || [])];
      history.unshift({
        updatedAt: existing.updatedAt,
        level: existing.level,
        comment: existing.comment,
        by: this.profileState.name || 'Giáo viên',
      });
      const boundedHistory = history.slice(0, APP_CONSTRAINTS.EVAL_HISTORY_MAX_ITEMS);

      const updatedRecord: EvaluationRecord = {
        ...existing,
        ...record,
        id: existing.id,
        comment: clampStr(record.comment, APP_CONSTRAINTS.EVAL_COMMENT_MAX, ''),
        updatedAt: now,
        history: boundedHistory,
      };
      list[existingIndex] = updatedRecord;
      return updatedRecord;
    }

    const newId = sanitizeEntityId(
      record.id || `eval_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      'eval'
    );
    const createdRecord: EvaluationRecord = {
      ...record,
      id: newId,
      comment: clampStr(record.comment, APP_CONSTRAINTS.EVAL_COMMENT_MAX, ''),
      updatedAt: now,
      history: [],
    };
    list.unshift(createdRecord);
    return createdRecord;
  }

  public upsertEvaluation(
    record: Omit<EvaluationRecord, 'id' | 'updatedAt'> & { id?: string }
  ): EvaluationRecord {
    const list = [...this.evaluationsState];
    const now = new Date().toISOString();
    const updatedRecord = this.applyEvaluationUpsertLocal(list, record, now);
    list.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
    this.evaluationsState = list;
    this.notify();

    if (this.activeUid) {
      const uid = this.activeUid;
      const cleanStudentId = sanitizeEntityId(updatedRecord.studentId, 'HS');
      const pendingStu = this.pendingStudentOps.get(cleanStudentId);
      const { row } = this.buildEvaluationRow(uid, updatedRecord);
      void (async () => {
        if (pendingStu) {
          await pendingStu;
        }
        const { error } = await supabase
          .from('evaluations')
          .upsert(row, { onConflict: 'owner_id,id' });
        if (error) console.error('Supabase upsertEvaluation error:', error.message);
      })();
    }

    return updatedRecord;
  }

  public bulkSaveEvaluations(
    records: Array<Omit<EvaluationRecord, 'id' | 'updatedAt'> & { id?: string }>
  ) {
    if (records.length === 0) return;
    const list = [...this.evaluationsState];
    const now = new Date().toISOString();
    const savedRecords: EvaluationRecord[] = [];

    records.forEach((rec) => {
      savedRecords.push(this.applyEvaluationUpsertLocal(list, rec, now));
    });

    list.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
    this.evaluationsState = list;
    this.notify();

    if (this.activeUid) {
      const uid = this.activeUid;
      const rows = savedRecords.map((r) => this.buildEvaluationRow(uid, r).row);
      void (async () => {
        for (const chunk of chunkArray(rows)) {
          const { error } = await supabase
            .from('evaluations')
            .upsert(chunk, { onConflict: 'owner_id,id' });
          if (error) console.error('Supabase bulkSaveEvaluations error:', error.message);
        }
      })();
    }
  }

  public deleteEvaluation(evalId: string) {
    this.evaluationsState = this.evaluationsState.filter((e) => e.id !== evalId);
    this.notify();

    if (this.activeUid) {
      const uid = this.activeUid;
      void supabase
        .from('evaluations')
        .delete()
        .eq('owner_id', uid)
        .eq('id', evalId)
        .then(({ error }) => {
          if (error) console.error('Supabase deleteEvaluation error:', error.message);
        });
    }
  }

  // --- Profile ---
  public getProfile(): TeacherProfile {
    return this.profileState;
  }

  public updateProfile(updates: Partial<TeacherProfile>) {
    const merged: TeacherProfile = {
      ...this.profileState,
      ...updates,
      name: clampStr(
        updates.name ?? this.profileState.name,
        APP_CONSTRAINTS.NAME_MAX,
        this.profileState.name
      ),
      schoolName: clampStr(
        updates.schoolName ?? this.profileState.schoolName,
        APP_CONSTRAINTS.SCHOOL_NAME_MAX,
        this.profileState.schoolName
      ),
      schoolAddress: clampStr(
        updates.schoolAddress ?? this.profileState.schoolAddress,
        APP_CONSTRAINTS.SCHOOL_ADDRESS_MAX,
        ''
      ),
      slogan: clampStr(
        updates.slogan ?? this.profileState.slogan,
        APP_CONSTRAINTS.SLOGAN_MAX,
        ''
      ),
      currentYear: clampStr(
        updates.currentYear ?? this.profileState.currentYear,
        APP_CONSTRAINTS.YEAR_MAX,
        '2024 - 2025'
      ),
      currentSemester: clampStr(
        updates.currentSemester ?? this.profileState.currentSemester,
        APP_CONSTRAINTS.SEMESTER_MAX,
        'Học kỳ I'
      ),
    };
    this.profileState = merged;
    this.notify();

    if (this.activeUid) {
      const uid = this.activeUid;
      void supabase
        .from('profiles')
        .update({
          name: merged.name,
          school_name: merged.schoolName,
          school_address: merged.schoolAddress,
          slogan: merged.slogan,
          current_year: merged.currentYear,
          current_semester: merged.currentSemester,
          is_sample_data: Boolean(merged.isSampleData),
          updated_at: new Date().toISOString(),
        })
        .eq('id', uid)
        .then(({ error }) => {
          if (error) console.error('Supabase updateProfile error:', error.message);
        });
    }
  }

  // --- Reset & Sample Data ---
  public resetToSampleData() {
    this.classesState = [...initialClasses];
    this.lessonsState = [...initialLessons];
    this.studentsState = [...initialStudents];
    this.evaluationsState = [...initialEvaluations];
    this.updateProfile({ isSampleData: true });

    if (this.activeUid) {
      const uid = this.activeUid;
      void (async () => {
        await this.clearCloudCollections(uid, true);
        await this.seedDatasetToCloud(uid, {
          classes: initialClasses,
          lessons: initialLessons,
          students: initialStudents,
          evaluations: initialEvaluations,
        });
      })();
    }
  }

  public clearAllSampleData() {
    if (this.activeUid) {
      const uid = this.activeUid;
      void this.clearCloudCollections(uid, false);
    }
    this.classesState = [];
    this.studentsState = [];
    this.evaluationsState = [];
    this.updateProfile({ isSampleData: false });
  }

  // --- Export / Import JSON ---
  public exportFullBackupJSON(): string {
    const backup = {
      version: '2.0',
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
      if (
        !Array.isArray(data.classes) ||
        !Array.isArray(data.students) ||
        !Array.isArray(data.evaluations)
      ) {
        return { success: false, message: 'Tệp JSON không đúng định dạng dữ liệu hệ thống!' };
      }
      const nextLessons: Lesson[] =
        Array.isArray(data.lessons) && data.lessons.length > 0
          ? data.lessons
          : this.lessonsState.length > 0
            ? this.lessonsState
            : initialLessons;

      if (this.activeUid) {
        const uid = this.activeUid;
        void (async () => {
          await this.clearCloudCollections(uid, true);
          await this.seedDatasetToCloud(uid, {
            classes: data.classes,
            lessons: nextLessons,
            students: data.students,
            evaluations: data.evaluations,
          });
        })();
      }

      this.classesState = data.classes;
      this.lessonsState = nextLessons;
      this.studentsState = data.students;
      this.evaluationsState = data.evaluations;
      if (data.profile) {
        this.updateProfile({
          name: data.profile.name || this.profileState.name,
          schoolName: data.profile.schoolName || this.profileState.schoolName,
          schoolAddress: data.profile.schoolAddress ?? this.profileState.schoolAddress,
          slogan: data.profile.slogan ?? this.profileState.slogan,
          currentYear: data.profile.currentYear || this.profileState.currentYear,
          currentSemester: data.profile.currentSemester || this.profileState.currentSemester,
          isSampleData: Boolean(data.profile.isSampleData),
        });
      } else {
        this.notify();
      }
      return {
        success: true,
        message: 'Khôi phục toàn bộ dữ liệu từ bản sao lưu lên Supabase thành công!',
      };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      return { success: false, message: `Lỗi đọc tệp sao lưu: ${msg}` };
    }
  }
}

export const storage = new StorageService();
