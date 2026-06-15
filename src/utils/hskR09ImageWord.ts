import type { HskQuestionRow, HskRuntimeOption, HskSubQuestionPayload } from '../types/hskExams';
import { countHanInText, countHanWordSegments, splitPinyinWord } from './pinyinUtils';

export type HskR09SubItem = {
  id: string;
  imageUrl?: string;
  dialogue: string;
  dialoguePinyin?: string;
  answer: string;
  isExample?: boolean;
  score?: number;
};

export type HskR09Content = {
  subItems?: HskR09SubItem[];
  sentence?: string;
  sentencePinyin?: string;
  imageUrl?: string;
  imageDescription?: string;
};

export type R09DialogueToken =
  | { type: 'plain'; text: string }
  | { type: 'ruby'; han: string; pinyin: string }
  | { type: 'blank'; key: string; presetLetter?: string; embeddedPinyin?: string };

export type R09DialogueLine = {
  speaker: string;
  tokens: R09DialogueToken[];
};

export const DEFAULT_R09_OPTIONS: HskRuntimeOption[] = [
  { key: 'A', text: '', pinyin: '' },
  { key: 'B', text: '', pinyin: '' },
  { key: 'C', text: '', pinyin: '' },
  { key: 'D', text: '', pinyin: '' },
];

const INLINE_RUBY_RE = /\[([^\]]+)\]\{([^}]+)\}/;
const BLANK_PIPE_RE = /\[__\|([^\]]+)\]/;
const BLANK_EMPTY_RE = /\[__\]/;
const BRACKET_PINYIN_BLANK_RE = /\[([^\]\u4e00-\u9fff]+)\]/;
const LEGACY_BLANK_PINYIN_RE = /[（(]\s*([^\u4e00-\u9fff（）()\d][^（）()]*?)\s*[）)]/;
const LEGACY_BLANK_EMPTY_RE = /[（(]\s*[）)]/;
const LEGACY_BLANK_LETTER_RE = /[（(]\s*([A-Za-z])\s*[）)]/;
const R09_BLANK_PIPE = /\[__\|([^\]]+)\]/g;
const R09_BLANK_MARK = /\[__\]/g;
const R09_BRACKET_PINYIN_BLANK = /\[([^\]\u4e00-\u9fff]+)\]/g;
const R09_INLINE_RUBY = /\[([^\]]+)\]\{([^}]+)\}/g;
const R09_SPEAKER_LINE = /^([A-Za-z])[:：]\s*(.*)$/;

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

function normalizeSubItem(item: HskR09SubItem, index: number): HskR09SubItem {
  return {
    id: item.id || String(index + 1),
    imageUrl: item.imageUrl?.trim() || undefined,
    dialogue: item.dialogue ?? '',
    dialoguePinyin: item.dialoguePinyin?.trim() ?? '',
    answer: item.answer?.trim().toUpperCase() ?? '',
    isExample: !!item.isExample,
    score: item.isExample ? 0 : item.score && item.score > 0 ? item.score : 1,
  };
}

function migrateSentenceToDialogue(sentence: string): string {
  return sentence
    .replace(LEGACY_BLANK_PINYIN_RE, '[__|$1]')
    .replace(LEGACY_BLANK_EMPTY_RE, '[__]')
    .replace(LEGACY_BLANK_LETTER_RE, '[__|$1]');
}

export function createR09SubItem(index: number, isExample = false): HskR09SubItem {
  return {
    id: String(index),
    dialogue: '',
    answer: '',
    isExample,
    score: isExample ? 0 : 1,
  };
}

export function resolveR09Content(
  question: HskQuestionRow,
): Required<Pick<HskR09Content, 'sentence' | 'sentencePinyin'>> {
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

export function resolveR09SubItems(question: HskQuestionRow): HskR09SubItem[] {
  const content = (question.payload?.content ?? {}) as HskR09Content;
  if (content.subItems?.length) {
    return content.subItems.map((item, idx) => normalizeSubItem(item, idx));
  }

  const { sentence, sentencePinyin } = resolveR09Content(question);
  const legacyImage =
    typeof content.imageUrl === 'string'
      ? content.imageUrl
      : typeof question.payload?.content?.imageUrl === 'string'
        ? (question.payload.content as { imageUrl?: string }).imageUrl
        : undefined;

  if (sentence.trim() || legacyImage) {
    return [
      normalizeSubItem(
        {
          id: '1',
          imageUrl: legacyImage,
          dialogue: migrateSentenceToDialogue(sentence),
          dialoguePinyin: sentencePinyin,
          answer: question.correctAnswer?.split(',')[0]?.trim() ?? '',
          score: question.score || 1,
        },
        0,
      ),
    ];
  }

  return [createR09SubItem(1, true), createR09SubItem(2)];
}

export function buildR09CorrectAnswer(subItems: HskR09SubItem[]): string {
  return subItems
    .filter((item) => !item.isExample)
    .map((item) => item.answer?.trim().toUpperCase() ?? '')
    .filter(Boolean)
    .join(',');
}

export function buildR09SubQuestions(subItems: HskR09SubItem[]): HskSubQuestionPayload[] {
  return subItems.map((item, idx) => ({
    id: Number(item.id) || idx + 1,
    question: item.dialogue,
    answer: item.answer,
    score: item.isExample ? 0 : item.score && item.score > 0 ? item.score : 1,
  }));
}

export function syncR09AggregatedScore(subItems: HskR09SubItem[]): number {
  return subItems
    .filter((item) => !item.isExample)
    .reduce((sum, item) => sum + (item.score && item.score > 0 ? item.score : 1), 0);
}

export function relabelR09Options(options: HskRuntimeOption[]): HskRuntimeOption[] {
  return options.map((opt, idx) => ({
    ...opt,
    key: String.fromCharCode(65 + idx),
  }));
}

export function normalizeR09Question(question: HskQuestionRow): HskQuestionRow {
  if (question.type_id !== 'R09') return question;

  const runtimeOptions = resolveR09Options(question);
  const subItems = resolveR09SubItems(question);
  const correctAnswer = buildR09CorrectAnswer(subItems);
  const rowOptions = runtimeOptions.map((opt) => ({
    label: opt.key,
    text: opt.text ?? '',
    pinyin: opt.pinyin,
  }));
  const totalScore = syncR09AggregatedScore(subItems) || question.score;
  const hasImages = subItems.some((item) => !!item.imageUrl?.trim());

  return {
    ...question,
    score: totalScore,
    correctAnswer,
    options: rowOptions,
    imageStatus: hasImages ? 'ready' : question.imageStatus === 'none' ? 'none' : 'pending',
    payload: {
      ...question.payload,
      runtimeOptions,
      subQuestions: buildR09SubQuestions(subItems),
      content: {
        ...(question.payload?.content as HskR09Content | undefined),
        subItems,
      },
    },
  };
}

export function buildR09PayloadPatch(
  question: HskQuestionRow,
  patch: {
    options?: HskRuntimeOption[];
    subItems?: HskR09SubItem[];
  },
): HskQuestionRow['payload'] {
  const nextOptions = patch.options ?? resolveR09Options(question);
  const nextSubItems = patch.subItems ?? resolveR09SubItems(question);

  return {
    ...question.payload,
    runtimeOptions: nextOptions,
    subQuestions: buildR09SubQuestions(nextSubItems),
    content: {
      ...(question.payload?.content ?? {}),
      subItems: nextSubItems,
    },
  };
}

function nextBlankKey(tokens: R09DialogueToken[]): string {
  return `blank-${tokens.filter((t) => t.type === 'blank').length}`;
}

function tokenizeR09DialogueText(text: string): R09DialogueToken[] {
  const tokens: R09DialogueToken[] = [];
  let cursor = 0;

  while (cursor < text.length) {
    const slice = text.slice(cursor);
    const matchers: Array<{
      kind: 'ruby' | 'blankPipe' | 'blankEmpty' | 'bracketPinyin' | 'legacyPinyin' | 'legacyEmpty' | 'legacyLetter';
      index: number;
      match: RegExpMatchArray;
    }> = [];

    const rubyMatch = slice.match(INLINE_RUBY_RE);
    if (rubyMatch && rubyMatch.index != null) {
      matchers.push({ kind: 'ruby', index: rubyMatch.index, match: rubyMatch });
    }

    const blankPipeMatch = slice.match(BLANK_PIPE_RE);
    if (blankPipeMatch && blankPipeMatch.index != null) {
      matchers.push({ kind: 'blankPipe', index: blankPipeMatch.index, match: blankPipeMatch });
    }

    const blankEmptyMatch = slice.match(BLANK_EMPTY_RE);
    if (blankEmptyMatch && blankEmptyMatch.index != null) {
      matchers.push({ kind: 'blankEmpty', index: blankEmptyMatch.index, match: blankEmptyMatch });
    }

    const bracketPinyinMatch = slice.match(BRACKET_PINYIN_BLANK_RE);
    if (bracketPinyinMatch && bracketPinyinMatch.index != null) {
      matchers.push({ kind: 'bracketPinyin', index: bracketPinyinMatch.index, match: bracketPinyinMatch });
    }

    const legacyPinyinMatch = slice.match(LEGACY_BLANK_PINYIN_RE);
    if (legacyPinyinMatch && legacyPinyinMatch.index != null) {
      matchers.push({ kind: 'legacyPinyin', index: legacyPinyinMatch.index, match: legacyPinyinMatch });
    }

    const legacyEmptyMatch = slice.match(LEGACY_BLANK_EMPTY_RE);
    if (legacyEmptyMatch && legacyEmptyMatch.index != null) {
      matchers.push({ kind: 'legacyEmpty', index: legacyEmptyMatch.index, match: legacyEmptyMatch });
    }

    const legacyLetterMatch = slice.match(LEGACY_BLANK_LETTER_RE);
    if (legacyLetterMatch && legacyLetterMatch.index != null) {
      matchers.push({ kind: 'legacyLetter', index: legacyLetterMatch.index, match: legacyLetterMatch });
    }

    matchers.sort((a, b) => a.index - b.index);
    const next = matchers[0];

    if (!next || next.index > 0) {
      const plainEnd = next ? cursor + next.index : text.length;
      const plain = text.slice(cursor, plainEnd);
      if (plain) tokens.push({ type: 'plain', text: plain });
      cursor = plainEnd;
      if (!next) break;
      continue;
    }

    if (next.kind === 'ruby') {
      tokens.push({ type: 'ruby', han: next.match[1], pinyin: next.match[2].trim() });
      cursor += next.match[0].length;
      continue;
    }

    if (next.kind === 'blankPipe' || next.kind === 'bracketPinyin' || next.kind === 'legacyPinyin') {
      const inner = next.match[1].trim();
      if (next.kind === 'legacyPinyin' && /^[A-Za-z]$/.test(inner)) {
        tokens.push({
          type: 'blank',
          key: nextBlankKey(tokens),
          presetLetter: inner.toUpperCase(),
        });
      } else {
        tokens.push({
          type: 'blank',
          key: nextBlankKey(tokens),
          embeddedPinyin: inner,
        });
      }
      cursor += next.match[0].length;
      continue;
    }

    if (next.kind === 'legacyLetter') {
      tokens.push({
        type: 'blank',
        key: nextBlankKey(tokens),
        presetLetter: next.match[1].toUpperCase(),
      });
      cursor += next.match[0].length;
      continue;
    }

    tokens.push({ type: 'blank', key: nextBlankKey(tokens) });
    cursor += next.match[0].length;
  }

  return tokens;
}

export function parseR09Dialogue(dialogue: string): R09DialogueLine[] {
  return dialogue
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const speakerMatch = line.match(/^([A-Za-z])[:：]\s*(.*)$/);
      if (speakerMatch) {
        return {
          speaker: speakerMatch[1].toUpperCase(),
          tokens: tokenizeR09DialogueText(speakerMatch[2]),
        };
      }
      return { speaker: '', tokens: tokenizeR09DialogueText(line) };
    });
}

export function countR09Blanks(dialogue: string): number {
  return parseR09Dialogue(dialogue).reduce(
    (sum, line) => sum + line.tokens.filter((token) => token.type === 'blank').length,
    0,
  );
}

/** 将对话正文压平为 R05 分词格式（保留空格分词；填空→（拼音）或（）） */
export function flattenR09DialogueLineBody(line: string): string {
  const speakerMatch = line.trim().match(R09_SPEAKER_LINE);
  const body = speakerMatch ? speakerMatch[2] : line.trim();
  return body
    .replace(R09_INLINE_RUBY, '$1')
    .replace(R09_BLANK_PIPE, '（$1）')
    .replace(R09_BLANK_MARK, '（）')
    .replace(R09_BRACKET_PINYIN_BLANK, '（$1）');
}

export function flattenR09DialogueText(dialogue: string): string {
  return dialogue
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map(flattenR09DialogueLineBody)
    .join('\n');
}

export function countHanInR09Dialogue(dialogue: string): number {
  return countHanInText(flattenR09DialogueText(dialogue));
}

export function flattenR09DialogueLines(dialogue: string): string[] {
  return dialogue
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map(flattenR09DialogueLineBody);
}

/** 按行分配词级/字级拼音（中文空格分词 ↔ 拼音空格分词） */
export function sliceR09DialoguePinyinByLines(dialogue: string, dialoguePinyin: string): string[] {
  const lines = flattenR09DialogueLines(dialogue);
  if (!dialoguePinyin.trim()) return lines.map(() => '');

  const pinyinWords = dialoguePinyin.trim().split(/\s+/).filter(Boolean);
  let wordIdx = 0;

  return lines.map((line) => {
    const { segmentCount } = countHanWordSegments(line);
    if (segmentCount >= 2) {
      const slice = pinyinWords.slice(wordIdx, wordIdx + segmentCount);
      wordIdx += segmentCount;
      return slice.join(' ');
    }

    const hanCount = countHanInText(line);
    if (hanCount === 0) return '';

    const parts: string[] = [];
    let hanLeft = hanCount;
    while (hanLeft > 0 && wordIdx < pinyinWords.length) {
      parts.push(pinyinWords[wordIdx]);
      hanLeft -= splitPinyinWord(pinyinWords[wordIdx]).length;
      wordIdx += 1;
    }
    return parts.join(' ');
  });
}

/** 对话正文是否含空格分词（用于编辑器校验提示） */
export function hasR09DialogueWordSegments(dialogue: string): boolean {
  return flattenR09DialogueLines(dialogue).some(
    (line) => countHanWordSegments(line).segmentCount >= 2,
  );
}
