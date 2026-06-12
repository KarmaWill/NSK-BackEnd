import type { HskRuntimeOption } from '../types/hskExams';

export type HskR03SentenceBlank = {
  id: string;
  sentence: string;
  pinyin?: string;
};

export type HskR03WordItem = {
  id: string;
  text: string;
  pinyin?: string;
  /** 干扰项：不参与任何填空的正确配对 */
  isDistractor?: boolean;
};

type LegacySentenceBlank = {
  id?: string;
  sentence?: string;
  answer?: string;
  pinyin?: string;
  position?: number;
};

export function defaultR03SentenceBlanks(count = 3): HskR03SentenceBlank[] {
  return Array.from({ length: count }, (_, idx) => ({
    id: `blank${idx + 1}`,
    sentence: '',
    pinyin: '',
  }));
}

/** 默认比填空数多 1 个词语，末项为干扰项 */
export function defaultR03WordItems(blankCount = 3): HskR03WordItem[] {
  const count = Math.max(blankCount + 1, 4);
  return Array.from({ length: count }, (_, idx) => ({
    id: `w${idx + 1}`,
    text: '',
    pinyin: '',
    isDistractor: idx === count - 1,
  }));
}

export function parseR03AnswerTexts(correctAnswer: string): string[] {
  if (!correctAnswer.trim()) return [];
  if (correctAnswer.includes(':')) return [];
  return correctAnswer
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean);
}

export function buildR03CorrectAnswer(
  pairings: Record<string, string>,
  blanks: HskR03SentenceBlank[],
  words: HskR03WordItem[],
): string {
  return blanks
    .map((blank) => {
      const wordId = pairings[blank.id];
      if (!wordId) return '';
      const word = words.find((item) => item.id === wordId);
      return word?.text?.trim() ?? '';
    })
    .filter(Boolean)
    .join(',');
}

export function pairingsFromR03Data(
  correctAnswer: string,
  blanks: HskR03SentenceBlank[],
  words: HskR03WordItem[],
  legacyBlanks?: LegacySentenceBlank[],
): Record<string, string> {
  const result: Record<string, string> = {};

  if (legacyBlanks?.length) {
    for (const blank of legacyBlanks) {
      const blankId = blank.id ?? `blank${(blank.position ?? 0) + 1}`;
      const answerText = blank.answer?.trim();
      if (!answerText) continue;
      const word = words.find((item) => item.text?.trim() === answerText);
      if (word) result[blankId] = word.id;
    }
    if (Object.keys(result).length > 0) return result;
  }

  const answerTexts = parseR03AnswerTexts(correctAnswer);
  blanks.forEach((blank, idx) => {
    const answerText = answerTexts[idx]?.trim();
    if (!answerText) return;
    const word = words.find((item) => item.text?.trim() === answerText);
    if (word) result[blank.id] = word.id;
  });
  return result;
}

export function resolveR03SentenceBlanks(
  stored: HskR03SentenceBlank[] | LegacySentenceBlank[] | undefined,
  correctAnswer: string,
): HskR03SentenceBlank[] {
  if (stored?.length) {
    return stored.map((item, idx) => ({
      id: item.id ?? `blank${idx + 1}`,
      sentence: item.sentence ?? '',
      pinyin: item.pinyin ?? '',
    }));
  }

  const answerCount = parseR03AnswerTexts(correctAnswer).length;
  return defaultR03SentenceBlanks(Math.max(answerCount, 3));
}

function wordBankFromStrings(wordBank: string[] | undefined): HskR03WordItem[] | undefined {
  if (!wordBank?.length) return undefined;
  return wordBank.map((text, idx) => ({
    id: `w${idx + 1}`,
    text: typeof text === 'string' ? text : '',
    pinyin: '',
    isDistractor: false,
  }));
}

export function resolveR03WordItems(
  stored: HskR03WordItem[] | undefined,
  runtimeOptions: HskRuntimeOption[] | undefined,
  rowOptions: Array<{ label: string; text: string; pinyin?: string }> | undefined,
  wordBank: string[] | undefined,
  correctAnswer: string,
  blankCount: number,
): HskR03WordItem[] {
  if (stored?.length) {
    return normalizeR03WordItems(stored, correctAnswer, blankCount);
  }

  const fromWordBank = wordBankFromStrings(wordBank);
  if (fromWordBank?.length) {
    return normalizeR03WordItems(fromWordBank, correctAnswer, blankCount);
  }

  const opts =
    runtimeOptions?.map((o) => ({
      id: o.key.toLowerCase().startsWith('w') ? o.key : `w${o.key.charCodeAt(0) - 64}`,
      text: o.text ?? '',
      pinyin: o.pinyin ?? '',
    })) ??
    rowOptions?.map((o, idx) => ({
      id: `w${idx + 1}`,
      text: o.text ?? '',
      pinyin: o.pinyin ?? '',
    }));

  if (opts?.length) {
    return normalizeR03WordItems(
      opts.map((item, idx) => ({
        id: item.id || `w${idx + 1}`,
        text: item.text,
        pinyin: item.pinyin,
      })),
      correctAnswer,
      blankCount,
    );
  }

  return defaultR03WordItems(blankCount);
}

export function normalizeR03WordItems(
  items: HskR03WordItem[],
  correctAnswer: string,
  blankCount: number,
): HskR03WordItem[] {
  const pairedTexts = new Set(parseR03AnswerTexts(correctAnswer));
  return items.map((item, idx) => {
    if (item.isDistractor != null) return item;
    const text = item.text?.trim();
    if (pairedTexts.size > 0 && text) {
      return { ...item, isDistractor: !pairedTexts.has(text) };
    }
    return {
      ...item,
      isDistractor: idx === items.length - 1 && items.length > blankCount,
    };
  });
}

export function wordItemsToRuntimeOptions(items: HskR03WordItem[]): HskRuntimeOption[] {
  return items.map((item, idx) => ({
    key: String.fromCharCode(65 + idx),
    text: item.text,
    pinyin: item.pinyin,
  }));
}

export function wordDisplayLabel(_item: HskR03WordItem, index: number): string {
  return String.fromCharCode(65 + index);
}

export function wordPairingOptionLabel(item: HskR03WordItem, index: number): string {
  const label = wordDisplayLabel(item, index);
  const text = item.text?.trim();
  return text ? `${label}. ${text}` : `${label}.`;
}

/** 将句子中的 （） / ___ 替换为预览用虚线空 */
export function renderR03SentencePreviewHtml(sentence: string, filledText?: string): string {
  const blankPattern = /[（(]\s*[）)]|_{2,}/g;
  if (filledText?.trim()) {
    return sentence.replace(
      blankPattern,
      `<span class="hsk-preview-r03-filled">${filledText.trim()}</span>`,
    );
  }
  return sentence.replace(blankPattern, '<span class="hsk-preview-r03-blank">&nbsp;</span>');
}
