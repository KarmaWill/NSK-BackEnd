import type { HskQuestionRow, HskRuntimeOption } from '../types/hskExams';

export type HskW01ComponentPart = {
  key: string;
  text: string;
};

export type HskW01WordMatch = {
  id: string;
  incomplete: string;
  incompletePinyin?: string;
  word: string;
  pinyin: string;
  componentKey: string;
};

export type HskW01LegacyComponents = {
  left?: string[];
  right?: string[];
};

export type HskW01LegacyCompleteWord = {
  left?: string;
  right?: string;
  word?: string;
  pinyin?: string;
};

export type HskW01Content = {
  componentParts?: HskW01ComponentPart[];
  wordMatches?: HskW01WordMatch[];
  components?: HskW01LegacyComponents;
  completeWords?: HskW01LegacyCompleteWord[];
  incompleteWords?: string[];
};

export const DEFAULT_W01_COMPONENT_PARTS: HskW01ComponentPart[] = [
  { key: 'A', text: '' },
  { key: 'B', text: '' },
  { key: 'C', text: '' },
];

export const DEFAULT_W01_WORD_MATCHES: HskW01WordMatch[] = [
  {
    id: 'm1',
    incomplete: '',
    incompletePinyin: '',
    word: '',
    pinyin: '',
    componentKey: 'A',
  },
];

function relabelParts(parts: HskW01ComponentPart[]): HskW01ComponentPart[] {
  return parts.map((part, idx) => ({
    ...part,
    key: String.fromCharCode(65 + idx),
  }));
}

function relabelMatches(
  matches: HskW01WordMatch[],
  parts: HskW01ComponentPart[],
): HskW01WordMatch[] {
  const validKeys = new Set(parts.map((p) => p.key));
  const fallback = parts[0]?.key ?? 'A';
  return matches.map((match, idx) => ({
    ...match,
    id: match.id || `m${idx + 1}`,
    componentKey: validKeys.has(match.componentKey) ? match.componentKey : fallback,
  }));
}

function migrateLegacyContent(content: HskW01Content): {
  componentParts: HskW01ComponentPart[];
  wordMatches: HskW01WordMatch[];
} {
  const left = content.components?.left ?? [];
  const completeWords = content.completeWords ?? [];
  const incompleteWords = content.incompleteWords ?? [];

  const partTexts = left.length
    ? left
    : [...new Set(completeWords.map((cw) => cw.left).filter(Boolean) as string[])];
  const componentParts =
    partTexts.length > 0
      ? partTexts.map((text, idx) => ({ key: String.fromCharCode(65 + idx), text }))
      : DEFAULT_W01_COMPONENT_PARTS;

  const leftToKey = Object.fromEntries(componentParts.map((p) => [p.text, p.key]));

  if (!completeWords.length) {
    return { componentParts, wordMatches: DEFAULT_W01_WORD_MATCHES };
  }

  const wordMatches = completeWords.map((cw, idx) => {
    const incompleteFromList = incompleteWords[idx]?.replace(/（[^）]*）/g, '').trim();
    const incomplete =
      incompleteFromList ||
      (cw.left && cw.right ? `${cw.left}${cw.right}`.replace(cw.word ?? '', '＿') : `＿${cw.right ?? ''}`) ||
      '';
    return {
      id: `m${idx + 1}`,
      incomplete,
      incompletePinyin: '',
      word: cw.word ?? '',
      pinyin: cw.pinyin ?? '',
      componentKey: leftToKey[cw.left ?? ''] ?? componentParts[0]?.key ?? 'A',
    };
  });

  return { componentParts, wordMatches };
}

export function resolveW01ComponentParts(question: HskQuestionRow): HskW01ComponentPart[] {
  const content = (question.payload?.content ?? {}) as HskW01Content;
  if (content.componentParts?.length) return content.componentParts;

  const fromRuntime = question.payload?.runtimeOptions?.map((o, idx) => ({
    key: o.key || String.fromCharCode(65 + idx),
    text: o.text ?? '',
  }));
  if (fromRuntime?.length) return fromRuntime;

  if (content.components?.left?.length || content.completeWords?.length) {
    return migrateLegacyContent(content).componentParts;
  }

  return DEFAULT_W01_COMPONENT_PARTS;
}

export function resolveW01WordMatches(question: HskQuestionRow): HskW01WordMatch[] {
  const content = (question.payload?.content ?? {}) as HskW01Content;
  const parts = resolveW01ComponentParts(question);

  if (content.wordMatches?.length) {
    return relabelMatches(content.wordMatches, parts);
  }

  if (content.completeWords?.length || content.components?.left?.length) {
    return migrateLegacyContent(content).wordMatches;
  }

  return DEFAULT_W01_WORD_MATCHES;
}

export function buildW01CorrectAnswer(matches: HskW01WordMatch[]): string {
  return matches
    .filter((m) => m.word.trim())
    .map((m) => `${m.componentKey}:${m.word.trim()}`)
    .join(',');
}

export function normalizeW01Question(question: HskQuestionRow): HskQuestionRow {
  if (question.type_id !== 'W01') return question;

  const content = (question.payload?.content ?? {}) as HskW01Content;
  const componentParts = resolveW01ComponentParts(question);
  const wordMatches = resolveW01WordMatches(question);
  const runtimeOptions: HskRuntimeOption[] = componentParts.map((p) => ({
    key: p.key,
    text: p.text,
  }));

  return {
    ...question,
    correctAnswer: buildW01CorrectAnswer(wordMatches) || question.correctAnswer,
    options: runtimeOptions.map((o) => ({
      label: o.key,
      text: o.text ?? '',
    })),
    payload: {
      ...question.payload,
      runtimeOptions,
      content: {
        ...content,
        componentParts,
        wordMatches,
      },
    },
  };
}

export function buildW01PayloadPatch(
  question: HskQuestionRow,
  patch: {
    componentParts?: HskW01ComponentPart[];
    wordMatches?: HskW01WordMatch[];
  },
): HskQuestionRow['payload'] {
  const componentParts = relabelParts(patch.componentParts ?? resolveW01ComponentParts(question));
  const wordMatches = relabelMatches(
    patch.wordMatches ?? resolveW01WordMatches(question),
    componentParts,
  );
  const runtimeOptions = componentParts.map((p) => ({ key: p.key, text: p.text }));

  return {
    ...question.payload,
    runtimeOptions,
    content: {
      ...(question.payload?.content ?? {}),
      componentParts,
      wordMatches,
    },
  };
}

export function relabelW01ComponentParts(parts: HskW01ComponentPart[]): HskW01ComponentPart[] {
  return relabelParts(parts);
}

export function relabelW01WordMatches(
  matches: HskW01WordMatch[],
  parts: HskW01ComponentPart[],
): HskW01WordMatch[] {
  return relabelMatches(matches, parts);
}
