const PROFILE_KEY = 'clingo-admin-profile';
export const ADMIN_PROFILE_UPDATED_EVENT = 'clingo-admin-profile-changed';

export type AdminProfile = {
  displayName: string;
  avatarUrl: string | null;
};

const DEFAULT_PROFILE: AdminProfile = {
  displayName: '群哥',
  avatarUrl: null,
};

export function loadAdminProfile(): AdminProfile {
  try {
    const raw = localStorage.getItem(PROFILE_KEY);
    if (!raw) return { ...DEFAULT_PROFILE };
    const parsed = JSON.parse(raw) as Partial<AdminProfile>;
    return {
      displayName: typeof parsed.displayName === 'string' && parsed.displayName.trim()
        ? parsed.displayName.trim()
        : DEFAULT_PROFILE.displayName,
      avatarUrl: typeof parsed.avatarUrl === 'string' && parsed.avatarUrl ? parsed.avatarUrl : null,
    };
  } catch {
    return { ...DEFAULT_PROFILE };
  }
}

export function saveAdminProfile(profile: AdminProfile): void {
  localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
  window.dispatchEvent(new CustomEvent(ADMIN_PROFILE_UPDATED_EVENT, { detail: profile }));
}
