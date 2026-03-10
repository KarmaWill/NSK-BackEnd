type QuestionLike = {
  resId: string;
  typeName?: string;
  knowledge?: string;
  diff?: string;
};

export type QuestionOverride = {
  resId: string;
  typeName?: string;
  knowledge?: string;
  diff?: string;
};

const STORAGE_KEY = 'nsk-question-overrides-v1';
const EVENT_NAME = 'nsk-question-overrides-updated';

function isBrowser() {
  return typeof window !== 'undefined' && typeof localStorage !== 'undefined';
}

export function getQuestionOverrides(): Record<string, QuestionOverride> {
  if (!isBrowser()) return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, QuestionOverride>;
    return parsed ?? {};
  } catch {
    return {};
  }
}

function setQuestionOverrides(next: Record<string, QuestionOverride>) {
  if (!isBrowser()) return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  window.dispatchEvent(new CustomEvent(EVENT_NAME));
}

export function upsertQuestionOverride(override: QuestionOverride) {
  const current = getQuestionOverrides();
  current[override.resId] = { ...(current[override.resId] ?? { resId: override.resId }), ...override };
  setQuestionOverrides(current);
}

export function applyQuestionListOverrides<T extends QuestionLike>(rows: T[]): T[] {
  const overrides = getQuestionOverrides();
  return rows.map((row) => {
    const ov = overrides[row.resId];
    return ov ? { ...row, ...ov } : row;
  });
}

export function subscribeQuestionOverrideUpdates(onChange: () => void): () => void {
  if (!isBrowser()) return () => {};
  const handler = () => onChange();
  window.addEventListener(EVENT_NAME, handler as EventListener);
  return () => window.removeEventListener(EVENT_NAME, handler as EventListener);
}
