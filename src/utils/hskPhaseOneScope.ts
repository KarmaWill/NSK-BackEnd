import { HSK_TYPE_CODES } from '../config/hskQuestionTypes';
import type { HskPaperTemplate, HskQuestionRow, HskQuestionTypeCode } from '../types/hskExams';

export const PHASE_ONE_HSK_LEVELS = ['HSK1', 'HSK2'] as const;

const PHASE_ONE_LEVEL_SET = new Set<string>(PHASE_ONE_HSK_LEVELS);
const PHASE_ONE_TYPE_SET = new Set<string>(HSK_TYPE_CODES);

export function isPhaseOneHskLevel(level: string): boolean {
  return PHASE_ONE_LEVEL_SET.has(level);
}

export function isPhaseOneQuestionType(typeCode: string): typeCode is HskQuestionTypeCode {
  return PHASE_ONE_TYPE_SET.has(typeCode);
}

export function isPhaseOneTemplate(template: HskPaperTemplate): boolean {
  return template.parentCategory === 'HSK'
    && isPhaseOneHskLevel(String(template.level))
    && (template.category === 'official' || template.category === 'custom');
}

export function isTemplateAvailableForPaper(template: HskPaperTemplate): boolean {
  return isPhaseOneTemplate(template) && template.status === 'published';
}

export function isQuestionCandidate(input: {
  question: HskQuestionRow;
  level: string;
  questionType: string;
  isExample: boolean;
  isCompound: boolean;
  expectedScoringCount?: number;
  expectedExampleCount?: number;
}): boolean {
  const {
    question,
    level,
    questionType,
    isExample,
    isCompound,
    expectedScoringCount,
    expectedExampleCount,
  } = input;
  const subQuestions = question.payload?.subQuestions ?? [];
  const hasSubQuestions = subQuestions.length > 0;
  const basicMatch = question.status === 'published'
    && question.level === level
    && question.type_id === questionType
    && hasSubQuestions === isCompound;
  if (!basicMatch) return false;
  if (!isCompound) return Boolean(question.isExample) === isExample;

  const scoringCount = subQuestions.filter((subQuestion) => !subQuestion.isExample).length;
  const exampleCount = subQuestions.filter((subQuestion) => subQuestion.isExample).length;
  return (expectedScoringCount === undefined || scoringCount === expectedScoringCount)
    && (expectedExampleCount === undefined || exampleCount === expectedExampleCount);
}
