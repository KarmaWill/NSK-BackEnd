import type {
  HskLevelCode,
  HskQuestionRow,
  HskQuestionStatus,
  HskQuestionTag,
  HskQuestionTypeCode,
  HskQuestionTypeDef,
} from '../types/hskExams';

export type HskQuestionBankFilterInput = {
  questions: HskQuestionRow[];
  types: HskQuestionTypeDef[];
  tags: HskQuestionTag[];
  typeFilter: HskQuestionTypeCode | string | 'all';
  levelFilter: HskLevelCode | string | 'all';
  statusFilter: HskQuestionStatus | 'all';
  tagFilter: string;
  difficultyFilter: 'all' | '1' | '2' | '3' | '4' | '5';
  searchQuery: string;
};

export function countDifficultyStars(difficulty: string | null | undefined): number {
  return (difficulty?.match(/★/g) ?? []).length;
}

export function filterHskQuestionRows(input: HskQuestionBankFilterInput): HskQuestionRow[] {
  const search = input.searchQuery.trim().toLowerCase();
  return input.questions.filter((question) => {
    if (input.typeFilter !== 'all' && question.type_id !== input.typeFilter) return false;
    if (input.levelFilter !== 'all' && question.level !== input.levelFilter) return false;
    if (input.statusFilter !== 'all' && question.status !== input.statusFilter) return false;
    if (input.tagFilter !== 'all') {
      const tag = input.tags.find((item) => item.id === input.tagFilter);
      if (tag && !question.tags.includes(tag.label)) return false;
    }
    if (input.difficultyFilter !== 'all') {
      const typeDef = input.types.find((type) => type.id === question.type_id);
      const stars = countDifficultyStars(typeDef?.difficulty);
      if (String(stars) !== input.difficultyFilter) return false;
    }
    if (!search) return true;
    return (
      question.question_uid.toLowerCase().includes(search) ||
      question.stem.toLowerCase().includes(search) ||
      question.type_id.toLowerCase().includes(search) ||
      question.level.toLowerCase().includes(search) ||
      question.tags.some((tag) => tag.toLowerCase().includes(search))
    );
  });
}
