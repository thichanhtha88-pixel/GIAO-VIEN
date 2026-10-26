import {
  APP_CONSTRAINTS,
  clampStr,
  getSupabaseAuthProvidersUrl,
  getSupabaseUsersUrl,
  supabase,
  toInternalAuthEmail,
  validateUsername,
} from '../supabase';
import { storage } from './storage';

export interface AuthActionResult {
  success: boolean;
  error?: string;
  isEmailConfirmEnabled?: boolean;
}

export { getSupabaseAuthProvidersUrl, getSupabaseUsersUrl };

function mapSupabaseAuthError(err: unknown): {
  message: string;
  isEmailConfirmEnabled?: boolean;
} {
  const code = (err as { code?: string })?.code || '';
  const rawMessage = err instanceof Error ? err.message : String(err);
  const lower = rawMessage.toLowerCase();

  if (code === 'email_not_confirmed' || lower.includes('email not confirmed')) {
    return {
      message:
        'Tài khoản này chưa được kích hoạt vì tùy chọn "Confirm email" trên Supabase hiện đang bật.',
      isEmailConfirmEnabled: true,
    };
  }

  if (
    code === 'over_email_send_rate_limit' ||
    lower.includes('email rate limit exceeded') ||
    lower.includes('for security purposes, you can only request this after')
  ) {
    return {
      message:
        'Supabase đang bật "Confirm email" và đã chạm giới hạn gửi thư xác nhận. Vui lòng tắt "Confirm email" trong Supabase Authentication -> Providers -> Email!',
      isEmailConfirmEnabled: true,
    };
  }

  if (
    code === 'user_already_exists' ||
    lower.includes('user already registered') ||
    lower.includes('already been registered')
  ) {
    return {
      message: 'Tên đăng nhập này đã được đăng ký! Vui lòng chọn một tên đăng nhập khác.',
    };
  }

  if (
    code === 'invalid_credentials' ||
    lower.includes('invalid login credentials') ||
    lower.includes('user not found')
  ) {
    return {
      message: 'Tên đăng nhập hoặc mật khẩu không chính xác. Vui lòng kiểm tra lại!',
    };
  }

  if (code === 'weak_password' || lower.includes('password should be at least')) {
    return {
      message: 'Mật khẩu quá ngắn. Vui lòng đặt mật khẩu tối thiểu 6 ký tự!',
    };
  }

  if (code === 'over_request_rate_limit' || lower.includes('too many requests')) {
    return {
      message: 'Thao tác quá nhiều lần liên tiếp. Vui lòng đợi ít phút rồi thử lại!',
    };
  }

  if (lower.includes('failed to fetch') || lower.includes('network')) {
    return {
      message: 'Không thể kết nối mạng tới máy chủ Supabase. Vui lòng kiểm tra đường truyền Internet!',
    };
  }

  return {
    message: `Không thể xác thực tài khoản (${rawMessage || code || 'lỗi hệ thống'}). Vui lòng thử lại!`,
  };
}

export async function registerWithUsernamePassword(params: {
  username: string;
  password: string;
  fullName: string;
  schoolName?: string;
}): Promise<AuthActionResult> {
  const check = validateUsername(params.username);
  if (!check.valid) {
    return { success: false, error: check.error };
  }

  const trimmedName = clampStr(params.fullName, APP_CONSTRAINTS.NAME_MAX);
  if (!trimmedName) {
    return { success: false, error: 'Vui lòng nhập họ và tên giáo viên!' };
  }

  if (params.password.length < 6) {
    return { success: false, error: 'Mật khẩu phải có từ 6 ký tự trở lên!' };
  }

  const resolvedSchoolName = clampStr(
    params.schoolName || 'Trường Tiểu học Thứ Ba',
    APP_CONSTRAINTS.SCHOOL_NAME_MAX,
    'Trường Tiểu học Thứ Ba'
  );

  try {
    const internalEmail = toInternalAuthEmail(check.normalized);
    storage.setPendingRegistrationMeta({
      username: check.normalized,
      name: trimmedName,
      schoolName: resolvedSchoolName,
      authProvider: 'password',
    });

    const { data, error } = await supabase.auth.signUp({
      email: internalEmail,
      password: params.password,
      options: {
        data: {
          username: check.normalized,
          full_name: trimmedName,
          school_name: resolvedSchoolName,
        },
      },
    });

    if (error) {
      storage.clearPendingRegistrationMeta();
      const mapped = mapSupabaseAuthError(error);
      return {
        success: false,
        error: mapped.message,
        isEmailConfirmEnabled: mapped.isEmailConfirmEnabled,
      };
    }

    // Supabase returns empty identities array when email already exists while Confirm Email is ON
    if (data.user && Array.isArray(data.user.identities) && data.user.identities.length === 0) {
      storage.clearPendingRegistrationMeta();
      return {
        success: false,
        error: 'Tên đăng nhập này đã được đăng ký! Vui lòng chọn một tên đăng nhập khác.',
      };
    }

    // If session is null after signUp, "Confirm email" is still turned ON in Supabase Auth settings
    if (data.user && !data.session) {
      storage.clearPendingRegistrationMeta();
      return {
        success: false,
        error:
          'Tài khoản đã được tạo trên Supabase, nhưng mục "Confirm email" trên Supabase đang BẬT nên chưa thể đăng nhập trực tiếp.',
        isEmailConfirmEnabled: true,
      };
    }

    if (data.user) {
      await storage.bindAuthenticatedUser(data.user);
    }

    return { success: true };
  } catch (err) {
    storage.clearPendingRegistrationMeta();
    const mapped = mapSupabaseAuthError(err);
    return {
      success: false,
      error: mapped.message,
      isEmailConfirmEnabled: mapped.isEmailConfirmEnabled,
    };
  }
}

export async function loginWithUsernamePassword(params: {
  username: string;
  password: string;
}): Promise<AuthActionResult> {
  const check = validateUsername(params.username);
  if (!check.valid) {
    return { success: false, error: check.error };
  }

  if (!params.password) {
    return { success: false, error: 'Vui lòng nhập mật khẩu!' };
  }

  try {
    const internalEmail = toInternalAuthEmail(check.normalized);
    const { data, error } = await supabase.auth.signInWithPassword({
      email: internalEmail,
      password: params.password,
    });

    if (error) {
      const mapped = mapSupabaseAuthError(error);
      return {
        success: false,
        error: mapped.message,
        isEmailConfirmEnabled: mapped.isEmailConfirmEnabled,
      };
    }

    if (data.user) {
      await storage.bindAuthenticatedUser(data.user);
    }

    return { success: true };
  } catch (err) {
    const mapped = mapSupabaseAuthError(err);
    return {
      success: false,
      error: mapped.message,
      isEmailConfirmEnabled: mapped.isEmailConfirmEnabled,
    };
  }
}

export async function changeTeacherPassword(params: {
  currentPassword: string;
  newPassword: string;
}): Promise<AuthActionResult> {
  if (params.newPassword.length < 6) {
    return { success: false, error: 'Mật khẩu mới phải có từ 6 ký tự trở lên!' };
  }

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user || !user.email) {
      return { success: false, error: 'Phiên đăng nhập không hợp lệ. Vui lòng đăng nhập lại!' };
    }

    // Verify current password first
    const { error: verifyErr } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: params.currentPassword,
    });

    if (verifyErr) {
      return { success: false, error: 'Mật khẩu hiện tại không đúng!' };
    }

    const { error: updateErr } = await supabase.auth.updateUser({
      password: params.newPassword,
    });

    if (updateErr) {
      const mapped = mapSupabaseAuthError(updateErr);
      return { success: false, error: mapped.message };
    }

    return { success: true };
  } catch (err) {
    const mapped = mapSupabaseAuthError(err);
    return { success: false, error: mapped.message };
  }
}

export async function logoutTeacher(): Promise<void> {
  storage.unbindAuthenticatedUser();
  await supabase.auth.signOut();
}
