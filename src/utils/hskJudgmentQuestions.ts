import type { HskQuestionRow, HskRuntimeOption, HskQuestionTypeCode } from '../types/hskExams';
import { isJudgmentQuestionType } from '../config/hskQuestionTypeGroups';

export const JUDGMENT_TF_OPTIONS: HskRuntimeOption[] = [
  { key: 'A', text: '对', pinyin: 'duì' },
  { key: 'B', text: '错', pinyin: 'cuò' },
];

export type HskJudgmentContent = {
  sentence?: string;
  sentencePinyin?: string;
  imageUrl?: string;
  image?: string;
};

export function resolveJudgmentContent(
  question: HskQuestionRow,
): Required<Pick<HskJudgmentContent, 'sentence' | 'sentencePinyin'>> {
  const content = (question.payload?.content ?? {}) as HskJudgmentContent;
  const fromContent = content.sentence?.trim() ?? '';
  const fromAudio = question.payload?.audioTranscript?.trim() ?? '';
  return {
    sentence: fromContent || fromAudio,
    sentencePinyin: content.sentencePinyin?.trim() ?? '',
  };
}

export function judgmentPreviewHint(typeId: HskQuestionTypeCode, stem?: string): string {
  const trimmed = stem?.trim();
  if (trimmed) return trimmed.replace(/[。．.!！?？]+$/, '');
  return typeId === 'L06'
    ? '请听句子，判断与图片内容是否一致'
    : '看图片和句子，判断句子描述是否与图片一致';
}

export function normalizeJudgmentQuestion(question: HskQuestionRow): HskQuestionRow {
  if (!isJudgmentQuestionType(question.type_id)) return question;

  const resolved = resolveJudgmentContent(question);
  const rowOptions = JUDGMENT_TF_OPTIONS.map((opt) => ({
    label: opt.key,
    text: opt.text ?? '',
    pinyin: opt.pinyin,
  }));

  const validAnswer = question.correctAnswer === 'A' || question.correctAnswer === 'B'
    ? question.correctAnswer
    : '';

  const nextContent: HskJudgmentContent = {
    ...(question.payload?.content as HskJudgmentContent | undefined),
    sentence: resolved.sentence,
    sentencePinyin: resolved.sentencePinyin,
  };

  return {
    ...question,
    correctAnswer: validAnswer,
    options: rowOptions,
    payload: {
      ...question.payload,
      runtimeOptions: JUDGMENT_TF_OPTIONS,
      content: nextContent,
      audioTranscript:
        question.type_id === 'L06'
          ? resolved.sentence || question.payload?.audioTranscript
          : question.payload?.audioTranscript,
    },
  };
}

export function buildJudgmentContentPatch(
  question: HskQuestionRow,
  patch: Partial<Pick<HskJudgmentContent, 'sentence' | 'sentencePinyin'>>,
): HskQuestionRow['payload'] {
  const current = resolveJudgmentContent(question);
  const sentence = patch.sentence !== undefined ? patch.sentence : current.sentence;
  const sentencePinyin = patch.sentencePinyin !== undefined ? patch.sentencePinyin : current.sentencePinyin;

  return {
    ...question.payload,
    content: {
      ...(question.payload?.content ?? {}),
      sentence,
      sentencePinyin,
    },
    audioTranscript: question.type_id === 'L06' ? sentence : question.payload?.audioTranscript,
  };
}
