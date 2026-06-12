import type { HskQuestionRow, HskRuntimeOption } from '../types/hskExams';

export type HskR09Content = {
  sentence?: string;
  sentencePinyin?: string;
  imageUrl?: string;
  imageDescription?: string;
};

export const DEFAULT_R09_OPTIONS: HskRuntimeOption[] = [
  { key: 'A', text: '', pinyin: '' },
  { key: 'B', text: '', pinyin: '' },
  { key: 'C', text: '', pinyin: '' },
];

function rowOptionsToRuntime(row: HskQuestionRow): HskRuntimeOption[] {
  const fromPayload = row.payload?.runtimeOptions;
  if (fromPayload?.length) return fromPayload;
  if (!row.options?.length) return DEFAULT_R09_OPTIONS;
  return row.options.map((o, idx) => ({
    key: o.label || (o as { key?: string }).key || String.fromCharCode(65 + idx),
    text: o.text ?? '',
    pinyin: o.pinyin,
  }));
}

export function resolveR09Content(question: HskQuestionRow): Required<Pick<HskR09Content, 'sentence' | 'sentencePinyin'>> {
  const content = (question.payload?.content ?? {}) as HskR09Content;
  return {
    sentence: content.sentence?.trim() ?? '',
    sentencePinyin: content.sentencePinyin?.trim() ?? '',
  };
}

export function resolveR09Options(question: HskQuestionRow): HskRuntimeOption[] {
  const runtime = rowOptionsToRuntime(question);
  return runtime.length >= 2 ? runtime : DEFAULT_R09_OPTIONS;
}

export function normalizeR09Question(question: HskQuestionRow): HskQuestionRow {
  if (question.type_id !== 'R09') return question;

  const runtimeOptions = resolveR09Options(question);
  const resolved = resolveR09Content(question);
  const rowOptions = runtimeOptions.map((opt) => ({
    label: opt.key,
    text: opt.text ?? '',
    pinyin: opt.pinyin,
  }));

  const validAnswer = runtimeOptions.some((o) => o.key === question.correctAnswer)
    ? question.correctAnswer
    : '';

  return {
    ...question,
    correctAnswer: validAnswer,
    options: rowOptions,
    payload: {
      ...question.payload,
      runtimeOptions,
      content: {
        ...(question.payload?.content as HskR09Content | undefined),
        sentence: resolved.sentence,
        sentencePinyin: resolved.sentencePinyin,
      },
    },
  };
}

export function buildR09PayloadPatch(
  question: HskQuestionRow,
  patch: {
    sentence?: string;
    sentencePinyin?: string;
    options?: HskRuntimeOption[];
  },
): HskQuestionRow['payload'] {
  const current = resolveR09Content(question);
  const nextOptions = patch.options ?? resolveR09Options(question);

  return {
    ...question.payload,
    runtimeOptions: nextOptions,
    content: {
      ...(question.payload?.content ?? {}),
      sentence: patch.sentence !== undefined ? patch.sentence : current.sentence,
      sentencePinyin: patch.sentencePinyin !== undefined ? patch.sentencePinyin : current.sentencePinyin,
    },
  };
}

export function relabelR09Options(options: HskRuntimeOption[]): HskRuntimeOption[] {
  return options.map((opt, idx) => ({
    ...opt,
    key: String.fromCharCode(65 + idx),
  }));
}
