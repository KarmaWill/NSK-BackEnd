export type LangKey = 'CN' | 'EN' | 'ES' | 'FR' | 'PT' | 'JA' | 'KO' | 'TH' | 'VI' | 'ID' | 'MS' | 'KM';

/** 答案解析编辑 Tab：多语言 + 拼音（对照中文解析） */
export type ExplanationEditorTab = LangKey | 'PY';

export const EXPLANATION_PINYIN_TAB_META = { flag: '🇭🇰', code: 'Pinyin' } as const;

export const LANG_OPTIONS: Array<{ key: LangKey; label: string }> = [
  { key: 'CN', label: '中文' },
  { key: 'EN', label: '英文' },
  { key: 'ES', label: '西语' },
  { key: 'FR', label: '法语' },
  { key: 'PT', label: '葡语' },
  { key: 'JA', label: '日语' },
  { key: 'KO', label: '韩语' },
  { key: 'TH', label: '泰语' },
  { key: 'VI', label: '越南语' },
  { key: 'ID', label: '印尼语' },
  { key: 'MS', label: '马来语' },
  { key: 'KM', label: '高棉语' },
];

/** 题目编辑页多语言标签展示（国旗 + 语言代码，如 🇨🇳CN） */
export const LANG_TAB_META: Record<LangKey, { flag: string; code: LangKey }> = {
  CN: { flag: '🇨🇳', code: 'CN' },
  EN: { flag: '🇺🇸', code: 'EN' },
  ES: { flag: '🇪🇸', code: 'ES' },
  FR: { flag: '🇫🇷', code: 'FR' },
  PT: { flag: '🇵🇹', code: 'PT' },
  JA: { flag: '🇯🇵', code: 'JA' },
  KO: { flag: '🇰🇷', code: 'KO' },
  TH: { flag: '🇹🇭', code: 'TH' },
  VI: { flag: '🇻🇳', code: 'VI' },
  ID: { flag: '🇮🇩', code: 'ID' },
  MS: { flag: '🇲🇾', code: 'MS' },
  KM: { flag: '🇰🇭', code: 'KM' },
};

export type TitleByLang = Partial<Record<LangKey, string>>;

export function createEmptyTitleByLang(cn = '', en = ''): TitleByLang {
  return { CN: cn, EN: en, ES: '', FR: '', PT: '', JA: '', KO: '', TH: '', VI: '', ID: '', MS: '', KM: '' };
}

export function resolveTitleByLang(
  title: string,
  titleEn?: string,
  titleByLang?: TitleByLang,
): TitleByLang {
  return {
    ...createEmptyTitleByLang(title, titleEn ?? ''),
    ...titleByLang,
    CN: titleByLang?.CN ?? title,
    EN: titleByLang?.EN ?? titleEn ?? '',
  };
}

export function formatVolumeLabelCn(order: number): string {
  return `第 ${order} 册`;
}

export function autoTranslateTitleByLang(seed: string): TitleByLang {
  const base = seed.trim();
  if (!base) return createEmptyTitleByLang();
  return {
    CN: base,
    EN: `${base} (English)`,
    ES: `${base} (Español)`,
    FR: `${base} (Français)`,
    PT: `${base} (Português)`,
    JA: `${base} (日本語)`,
    KO: `${base} (한국어)`,
    TH: `${base} (ไทย)`,
    VI: `${base} (Tiếng Việt)`,
    ID: `${base} (Bahasa Indonesia)`,
    MS: `${base} (Bahasa Melayu)`,
    KM: `${base} (ខ្មែរ)`,
  };
}

export function primaryEnglishTitle(titleByLang?: TitleByLang, titleEn?: string): string {
  return titleByLang?.EN?.trim() || titleEn?.trim() || '';
}

export function resolveExplanationByLang(
  explanation: string,
  explanationByLang?: TitleByLang,
): TitleByLang {
  return {
    ...createEmptyTitleByLang(explanation, ''),
    ...explanationByLang,
    CN: explanationByLang?.CN ?? explanation,
  };
}
