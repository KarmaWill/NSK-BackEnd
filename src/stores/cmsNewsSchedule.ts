export const NEWS_SCHEDULE_TIMEZONE = 'Asia/Shanghai';

/** datetime-local 值 ↔ ISO（按北京时间解析） */
export function fromBeijingDatetimeLocal(value: string): string {
  return new Date(`${value}:00+08:00`).toISOString();
}

export function toBeijingDatetimeLocal(iso: string | null): string {
  if (!iso) return '';
  return new Date(iso)
    .toLocaleString('sv-SE', { timeZone: NEWS_SCHEDULE_TIMEZONE })
    .replace(' ', 'T')
    .slice(0, 16);
}

export function beijingNowDatetimeLocal(): string {
  return toBeijingDatetimeLocal(new Date().toISOString());
}

export function formatScheduleLabel(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('zh-CN', {
    timeZone: NEWS_SCHEDULE_TIMEZONE,
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

export function isScheduleInFuture(iso: string | null): boolean {
  if (!iso) return false;
  return new Date(iso).getTime() > Date.now();
}

export function beijingTodayDate(): string {
  return new Date().toLocaleDateString('sv-SE', { timeZone: NEWS_SCHEDULE_TIMEZONE });
}
