import { createClient } from '@supabase/supabase-js';

const DEFAULT_SUPABASE_URL = 'https://qjjullrnxuskrwhbubpu.supabase.co';
const DEFAULT_SUPABASE_ANON_KEY = 'sb_publishable_zPKVq40sbicnfcXhZkOMRg_si6k_yf_';

export const SUPABASE_URL =
  (import.meta.env.VITE_SUPABASE_URL as string | undefined)?.trim() || DEFAULT_SUPABASE_URL;

export const SUPABASE_ANON_KEY =
  (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined)?.trim() ||
  DEFAULT_SUPABASE_ANON_KEY;

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

export function getSupabaseProjectRef(): string {
  try {
    const hostname = new URL(SUPABASE_URL).hostname;
    return hostname.split('.')[0] || 'qjjullrnxuskrwhbubpu';
  } catch {
    return 'qjjullrnxuskrwhbubpu';
  }
}

export function getSupabaseAuthProvidersUrl(): string {
  return `https://supabase.com/dashboard/project/${getSupabaseProjectRef()}/auth/providers?provider=Email`;
}

export function getSupabaseUsersUrl(): string {
  return `https://supabase.com/dashboard/project/${getSupabaseProjectRef()}/auth/users`;
}

// Validation & length constraints
export const APP_CONSTRAINTS = {
  USER_UID_MAX: 128,
  ENTITY_ID_MAX: 64,
  ENTITY_ID_PATTERN: /^[a-zA-Z0-9_-]+$/,
  USERNAME_MIN: 3,
  USERNAME_MAX: 32,
  USERNAME_PATTERN: /^[a-z0-9._-]+$/,
  NAME_MAX: 100,
  SCHOOL_NAME_MAX: 150,
  SCHOOL_ADDRESS_MAX: 250,
  SLOGAN_MAX: 200,
  YEAR_MAX: 30,
  SEMESTER_MAX: 30,
  CLASS_CODE_MAX: 20,
  CLASS_NAME_MAX: 100,
  STUDENT_CODE_MAX: 32,
  STUDENT_NAME_MAX: 100,
  LESSON_CODE_MAX: 30,
  LESSON_TITLE_MAX: 200,
  LESSON_TOPIC_MAX: 200,
  NOTE_MAX: 500,
  DATE_STR_MAX: 20,
  ISO_STR_MAX: 40,
  EVAL_COMMENT_MAX: 1000,
  EVAL_HISTORY_MAX_ITEMS: 10,
  EVAL_HISTORY_ITEM_MAX: 500,
} as const;

// Use a valid ICANN domain suffix (.edu.vn) so Supabase GoTrue email validator accepts mapped usernames
export const INTERNAL_AUTH_DOMAIN = 'tinhocthuba.edu.vn';

export function normalizeUsername(raw: string): string {
  return raw.trim().toLowerCase();
}

export function validateUsername(raw: string): {
  valid: boolean;
  normalized: string;
  error?: string;
} {
  const normalized = normalizeUsername(raw);
  if (normalized.length < APP_CONSTRAINTS.USERNAME_MIN) {
    return {
      valid: false,
      normalized,
      error: `Tên đăng nhập phải có ít nhất ${APP_CONSTRAINTS.USERNAME_MIN} ký tự!`,
    };
  }
  if (normalized.length > APP_CONSTRAINTS.USERNAME_MAX) {
    return {
      valid: false,
      normalized,
      error: `Tên đăng nhập tối đa ${APP_CONSTRAINTS.USERNAME_MAX} ký tự!`,
    };
  }
  if (!APP_CONSTRAINTS.USERNAME_PATTERN.test(normalized)) {
    return {
      valid: false,
      normalized,
      error:
        'Tên đăng nhập chỉ gồm chữ thường không dấu (a-z), chữ số (0-9) và dấu ., _, - (không khoảng trắng)!',
    };
  }
  return { valid: true, normalized };
}

export function toInternalAuthEmail(username: string): string {
  return `${normalizeUsername(username)}@${INTERNAL_AUTH_DOMAIN}`;
}

export function deriveUsernameFromEmail(
  email: string | null | undefined,
  fallbackUid: string
): string {
  const localPart = (email || '').split('@')[0] || '';
  const cleaned = localPart
    .toLowerCase()
    .replace(/[^a-z0-9._-]/g, '')
    .slice(0, APP_CONSTRAINTS.USERNAME_MAX);
  if (cleaned.length >= APP_CONSTRAINTS.USERNAME_MIN) {
    return cleaned;
  }
  const uidPart = fallbackUid
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, '')
    .slice(0, 12);
  return `gv_${uidPart || 'giaovien'}`.slice(0, APP_CONSTRAINTS.USERNAME_MAX);
}

export function sanitizeEntityId(raw: string, fallbackPrefix = 'id'): string {
  const cleaned = raw
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .replace(/[^a-zA-Z0-9_-]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '')
    .slice(0, APP_CONSTRAINTS.ENTITY_ID_MAX);

  if (cleaned.length >= 1 && APP_CONSTRAINTS.ENTITY_ID_PATTERN.test(cleaned)) {
    return cleaned;
  }
  return `${fallbackPrefix}_${Date.now()}`.slice(0, APP_CONSTRAINTS.ENTITY_ID_MAX);
}

export function clampStr(val: string | undefined | null, maxLen: number, fallback = ''): string {
  const str = (val ?? fallback).trim();
  return str.slice(0, maxLen);
}
