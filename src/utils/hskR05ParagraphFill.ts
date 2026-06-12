export type HskR05WordOption = {
  key: string;
  text: string;
  pinyin?: string;
};

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

/** 从段落中解析填空序号：（1）、(2)、___（1）___、() */
export function parseParagraphBlankIndices(paragraph: string): number[] {
  const indices: number[] = [];
  const numberedPattern = /___[（(]\s*(\d+)\s*[）)]___|[（(]\s*(\d+)\s*[）)]/g;
  let match: RegExpExecArray | null;
  while ((match = numberedPattern.exec(paragraph)) !== null) {
    const num = Number(match[1] || match[2]);
    if (!Number.isNaN(num) && !indices.includes(num)) indices.push(num);
  }
  if (indices.length > 0) return indices.sort((a, b) => a - b);

  const anonymousCount = (paragraph.match(/\(\s*\)/g) ?? []).length;
  if (anonymousCount > 0) {
    return Array.from({ length: anonymousCount }, (_, idx) => idx + 1);
  }
  return [];
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

export function resolveR05Content(
  content:
    | {
        paragraph?: string;
        paragraphPinyin?: string;
        wordBank?: HskR05WordOption[];
        blanks?: LegacyBlank[];
      }
    | undefined,
  correctAnswer: string,
): {
  paragraph: string;
  paragraphPinyin: string;
  wordBank: HskR05WordOption[];
  blankIndices: number[];
  blankAnswers: Record<number, string>;
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

  return { paragraph, paragraphPinyin, wordBank, blankIndices, blankAnswers };
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
