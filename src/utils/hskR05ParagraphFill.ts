export type HskR05WordOption = {
  key: string;
  text: string;
  pinyin?: string;
};

/** 段落分词结果：普通文本片段 或 填空标记（带空号 + 可选内嵌拼音） */
export type HskR05ParagraphToken =
  | { type: 'text'; text: string }
  | { type: 'blank'; index: number; embeddedPinyin?: string };

type LegacyBlank = {
  index?: number;
  answer?: string;
  options?: Array<{ key?: string; text?: string; pinyin?: string }>;
};

export function defaultR05WordBank(count = 4): HskR05WordOption[] {
  return Array.from({ length: count }, (_, idx) => ({
    key: String.fromCharCode(65 + idx),
    text: '',
    pinyin: '',
  }));
}

export function rekeyR05WordBank(options: HskR05WordOption[]): HskR05WordOption[] {
  return options.map((option, idx) => ({
    ...option,
    key: String.fromCharCode(65 + idx),
  }));
}

export function parseR05CorrectAnswer(correctAnswer: string): string[] {
  if (!correctAnswer.trim()) return [];
  return correctAnswer
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean);
}

export function buildR05CorrectAnswer(
  blankAnswers: Record<number, string>,
  indices: number[],
): string {
  return indices
    .map((index) => blankAnswers[index]?.trim() ?? '')
    .filter(Boolean)
    .join(',');
}

/**
 * 从段落中解析填空序号：（1）、(2)、___（1）___、() 或 （pinyin） 形式的匿名空
 * 注意：（pinyin）中允许用拼音（不含汉字、不含括号）作为嵌入拼音提示
 */
export function parseParagraphBlankIndices(paragraph: string): number[] {
  const indices: number[] = [];
  const numberedPattern = /___[（(]\s*(\d+)\s*[）)]___|[（(]\s*(\d+)\s*[）)]/g;
  let match: RegExpExecArray | null;
  while ((match = numberedPattern.exec(paragraph)) !== null) {
    const num = Number(match[1] || match[2]);
    if (!Number.isNaN(num) && !indices.includes(num)) indices.push(num);
  }
  if (indices.length > 0) return indices.sort((a, b) => a - b);

  // 匹配匿名空：（）或 （拼音提示）—— 内容为非汉字、非括号的非空字符串
  const anonymousPattern = /[（(]\s*([^\u4e00-\u9fff（）()\d]*?)\s*[）)]/g;
  let anonymousCount = 0;
  while ((match = anonymousPattern.exec(paragraph)) !== null) {
    anonymousCount += 1;
  }
  if (anonymousCount > 0) {
    return Array.from({ length: anonymousCount }, (_, idx) => idx + 1);
  }
  return [];
}

/**
 * 将段落拆为有序的「文本 / 填空」片段，供逐字 ruby 渲染。
 * 支持三种填空写法：
 *   - （1）/ (1) / ___（1）___ — 编号空
 *   - （）/ ()               — 匿名空
 *   - （hao）/ (nǐ hǎo)     — 匿名空 + 内嵌拼音提示（括号内为非汉字内容）
 */
export function tokenizeR05Paragraph(paragraph: string): HskR05ParagraphToken[] {
  if (!paragraph) return [];
  const tokens: HskR05ParagraphToken[] = [];
  // group 1: 编号（含下划线）; group 2: 编号（不含）; group 3: 非汉字内容（可作为嵌入拼音）; 最后分支: 空括号
  const re = /___[（(]\s*(\d+)\s*[）)]___|[（(]\s*(\d+)\s*[）)]|[（(]\s*([^\u4e00-\u9fff（）()\d][^（）()]*?)\s*[）)]|[（(]\s*[）)]/g;
  let lastIndex = 0;
  let anonymous = 0;
  let match: RegExpExecArray | null;
  while ((match = re.exec(paragraph)) !== null) {
    if (match.index > lastIndex) {
      tokens.push({ type: 'text', text: paragraph.slice(lastIndex, match.index) });
    }
    const num = match[1] ?? match[2];
    const embeddedPinyin = match[3];
    if (num != null) {
      tokens.push({ type: 'blank', index: Number(num) });
    } else if (embeddedPinyin != null) {
      anonymous += 1;
      tokens.push({ type: 'blank', index: anonymous, embeddedPinyin: embeddedPinyin.trim() });
    } else {
      anonymous += 1;
      tokens.push({ type: 'blank', index: anonymous });
    }
    lastIndex = re.lastIndex;
  }
  if (lastIndex < paragraph.length) {
    tokens.push({ type: 'text', text: paragraph.slice(lastIndex) });
  }
  return tokens;
}

export function resolveR05BlankIndices(paragraph: string, correctAnswer: string): number[] {
  const fromParagraph = parseParagraphBlankIndices(paragraph);
  if (fromParagraph.length > 0) return fromParagraph;
  const answers = parseR05CorrectAnswer(correctAnswer);
  if (answers.length > 0) return answers.map((_, idx) => idx + 1);
  return [1, 2];
}

export function blankAnswersFromCorrectAnswer(
  indices: number[],
  correctAnswer: string,
): Record<number, string> {
  const keys = parseR05CorrectAnswer(correctAnswer);
  const result: Record<number, string> = {};
  indices.forEach((index, idx) => {
    if (keys[idx]) result[index] = keys[idx];
  });
  return result;
}

function migrateLegacyBlanks(blanks: LegacyBlank[]): {
  wordBank: HskR05WordOption[];
  blankAnswers: Record<number, string>;
} {
  const textToKey = new Map<string, string>();
  const wordBank: HskR05WordOption[] = [];

  for (const blank of blanks) {
    for (const option of blank.options ?? []) {
      const text = option.text?.trim();
      if (!text || textToKey.has(text)) continue;
      const key = String.fromCharCode(65 + wordBank.length);
      textToKey.set(text, key);
      wordBank.push({ key, text, pinyin: option.pinyin ?? '' });
    }
  }

  const blankAnswers: Record<number, string> = {};
  for (const blank of blanks) {
    const index = blank.index ?? blanks.indexOf(blank) + 1;
    const answerKey = blank.answer?.trim();
    const answerText = blank.options?.find((option) => option.key === answerKey)?.text?.trim();
    if (answerText && textToKey.has(answerText)) {
      blankAnswers[index] = textToKey.get(answerText)!;
    } else if (answerKey) {
      blankAnswers[index] = answerKey;
    }
  }

  return { wordBank: wordBank.length > 0 ? wordBank : defaultR05WordBank(), blankAnswers };
}

export function resolveR05WordBank(
  stored: HskR05WordOption[] | undefined,
  legacyBlanks: LegacyBlank[] | undefined,
  runtimeOptions: Array<{ key: string; text?: string; pinyin?: string }> | undefined,
  rowOptions: Array<{ label: string; text: string; pinyin?: string }> | undefined,
): HskR05WordOption[] {
  if (stored?.length) return rekeyR05WordBank(stored);

  if (legacyBlanks?.length) {
    return migrateLegacyBlanks(legacyBlanks).wordBank;
  }

  const opts =
    runtimeOptions?.map((o) => ({
      key: o.key,
      text: o.text ?? '',
      pinyin: o.pinyin ?? '',
    })) ??
    rowOptions?.map((o) => ({
      key: o.label,
      text: o.text ?? '',
      pinyin: o.pinyin ?? '',
    }));

  if (opts?.length) return rekeyR05WordBank(opts);
  return defaultR05WordBank();
}

export function normalizeBlankPinyins(
  raw: Record<number | string, string> | undefined,
  indices: number[],
): Record<number, string> {
  const result: Record<number, string> = {};
  if (!raw) return result;
  for (const index of indices) {
    const value = raw[index] ?? raw[String(index)];
    if (typeof value === 'string' && value.trim()) result[index] = value.trim();
  }
  return result;
}

export function resolveR05Content(
  content:
    | {
        paragraph?: string;
        paragraphPinyin?: string;
        wordBank?: HskR05WordOption[];
        blanks?: LegacyBlank[];
        blankPinyins?: Record<number | string, string>;
      }
    | undefined,
  correctAnswer: string,
): {
  paragraph: string;
  paragraphPinyin: string;
  wordBank: HskR05WordOption[];
  blankIndices: number[];
  blankAnswers: Record<number, string>;
  blankPinyins: Record<number, string>;
} {
  const paragraph = content?.paragraph ?? '';
  const paragraphPinyin = content?.paragraphPinyin ?? '';
  const blankIndices = resolveR05BlankIndices(paragraph, correctAnswer);
  const wordBank = resolveR05WordBank(
    content?.wordBank,
    content?.blanks,
    undefined,
    undefined,
  );

  let blankAnswers = blankAnswersFromCorrectAnswer(blankIndices, correctAnswer);
  if (content?.blanks?.length && Object.keys(blankAnswers).length === 0) {
    blankAnswers = migrateLegacyBlanks(content.blanks).blankAnswers;
  }

  const blankPinyins = normalizeBlankPinyins(content?.blankPinyins, blankIndices);

  return { paragraph, paragraphPinyin, wordBank, blankIndices, blankAnswers, blankPinyins };
}

export function wordOptionLabel(option: HskR05WordOption): string {
  const text = option.text?.trim();
  return text ? `${option.key}. ${text}` : `${option.key}.`;
}

export function renderR05ParagraphPreviewHtml(paragraph: string): string {
  if (!paragraph.trim()) return '';

  let anonymousIndex = 0;
  return paragraph
    .replace(/___[（(]\s*(\d+)\s*[）)]___/g, (_, num) => {
      return `<span class="hsk-preview-r05-blank">（${num}）</span>`;
    })
    .replace(/[（(]\s*(\d+)\s*[）)]/g, (_, num) => {
      return `<span class="hsk-preview-r05-blank">（${num}）</span>`;
    })
    .replace(/\(\s*\)/g, () => {
      anonymousIndex += 1;
      return `<span class="hsk-preview-r05-blank">（${anonymousIndex}）</span>`;
    });
}
