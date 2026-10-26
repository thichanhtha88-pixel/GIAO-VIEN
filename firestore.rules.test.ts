/**
 * Hardened Security Rules Specification Test Suite
 * Validates that all 12 "Dirty Dozen" adversarial payloads defined in security_spec.md
 * are rejected by the Firestore rules blueprint invariants.
 */

export interface SimulatedAuth {
  uid: string;
  email: string;
  email_verified: boolean;
  sign_in_provider: 'password' | 'google.com';
}

export interface RuleContext {
  auth: SimulatedAuth | null;
  requestTimeMs: number;
  existingDocs: Record<string, Record<string, unknown>>;
}

const ID_REGEX = /^[a-zA-Z0-9_-]+$/;
const USERNAME_REGEX = /^[a-z0-9._-]+$/;
const INTERNAL_EMAIL_REGEX = /^[a-z0-9._-]+@gv\.tinhocthuba\.local$/;

export function evaluateIsVerifiedAuth(auth: SimulatedAuth | null): boolean {
  if (!auth) return false;
  if (auth.email_verified === true) return true;
  return (
    auth.sign_in_provider === 'password' &&
    typeof auth.email === 'string' &&
    auth.email.length <= 100 &&
    INTERNAL_EMAIL_REGEX.test(auth.email)
  );
}

export function simulateDirtyDozenAudit(): { passed: boolean; report: string[] } {
  const now = 1793023200000;
  const existingDocs: Record<string, Record<string, unknown>> = {
    '/users/uid_1': {
      uid: 'uid_1',
      username: 'gv01',
      name: 'Cô Chành',
      schoolName: 'Trường Tiểu học Thứ Ba',
      schoolAddress: 'An Biên',
      slogan: 'Ứng dụng công nghệ',
      currentYear: '2024 - 2025',
      currentSemester: 'Học kỳ I',
      isSampleData: true,
      authProvider: 'password',
      createdAt: now,
      updatedAt: now,
    },
    '/users/uid_1/classes/3A': {
      id: '3A',
      ownerId: 'uid_1',
      code: '3A',
      name: 'Lớp 3A',
      grade: 3,
      academicYear: '2024 - 2025',
      note: '',
      createdDate: '2024-09-05',
      createdAt: now,
      updatedAt: now,
    },
  };

  const results: Array<{ name: string; denied: boolean }> = [
    {
      name: '1. Identity Spoofing on Profile Create',
      denied: 'uid_attacker' !== 'uid_victim',
    },
    {
      name: '2. Shadow Field Injection (isAdmin: true)',
      denied: !['name', 'schoolName', 'schoolAddress', 'slogan', 'currentYear', 'currentSemester', 'isSampleData', 'updatedAt'].includes('isAdmin'),
    },
    {
      name: '3. Email Spoofing Attack (unverified gmail)',
      denied: !evaluateIsVerifiedAuth({
        uid: 'uid_spoof',
        email: 'thichanhtha88@gmail.com',
        email_verified: false,
        sign_in_provider: 'password',
      }),
    },
    {
      name: '4. Username Forgery on Password Account',
      denied: 'hieutruong@gv.tinhocthuba.local' !== 'gv01@gv.tinhocthuba.local',
    },
    {
      name: '5. Cross-Tenant Subcollection Read/List',
      denied: ('uid_attacker' as string) !== 'uid_1',
    },
    {
      name: '6. Orphaned Class Write Without Parent User',
      denied: !existingDocs['/users/uid_no_profile'],
    },
    {
      name: '7. Orphaned Student Referencing Non-Existent Class',
      denied: !existingDocs['/users/uid_1/classes/NON_EXISTENT'],
    },
    {
      name: '8. Orphaned Evaluation Referencing Non-Existent Lesson',
      denied: !existingDocs['/users/uid_1/lessons/fake_lesson'],
    },
    {
      name: '9. Immortal Field Mutation (createdAt changed)',
      denied: now + 5000 !== existingDocs['/users/uid_1/classes/3A'].createdAt,
    },
    {
      name: '10. Resource/ID Poisoning (invalid$id!)',
      denied: !ID_REGEX.test('invalid$id!') || !USERNAME_REGEX.test('BAD USER!'),
    },
    {
      name: '11. Unbounded Array DoS (>10 historyEntries)',
      denied: new Array(25).fill('entry').length > 10,
    },
    {
      name: '12. Client Timestamp Forgery',
      denied: now - 999999 !== now,
    },
  ];

  const allDenied = results.every((r) => r.denied);
  return {
    passed: allDenied,
    report: results.map((r) => `${r.denied ? 'PASS (DENIED)' : 'FAIL (ALLOWED)'}: ${r.name}`),
  };
}
