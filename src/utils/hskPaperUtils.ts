import { validateLevelStandardScore } from './hskCompileDelivery';
import { getLevelStandard } from '../config/hskLevelStandards';
import { getQuestionTypeDef, levelToNumber } from '../config/hskQuestionTypes';
import type {
  HskComposedPaper,
  HskPaperSlot,
  HskPaperTemplate,
  HskQuestionTypeDef,
  HskTemplateModule,
  HskTimeBlocks,
} from '../types/hskExams';

export function calcTimeBlockMinutes(blocks: HskTimeBlocks): number {
  return (blocks.prep || 0) + (blocks.listening || 0) + (blocks.buffer || 0) + (blocks.reading || 0) + (blocks.writing || 0);
}

export function getScorePerQuestion(template: HskPaperTemplate, typeDefs: HskQuestionTypeDef[]): number {
  const level = levelToNumber(String(template.level));
  const standard = level ? getLevelStandard(level) : null;
  if (standard) return standard.scorePerQuestion;
  const firstType = typeDefs[0];
  return firstType?.defaultScore ?? 2;
}

export function recalcTemplateTotals(template: HskPaperTemplate, typeDefs: HskQuestionTypeDef[]): HskPaperTemplate {
  const next = structuredClone(template);
  let totalQuestions = 0;
  let totalScore = 0;
  const scorePer = getScorePerQuestion(next, typeDefs);
  const level = levelToNumber(String(next.level));
  const standard = level ? getLevelStandard(level) : null;

  next.modules.forEach((mod) => {
    let modCount = 0;
    mod.sections.forEach((sec) => {
      sec.totalCount = sec.groups.reduce((sum, g) => sum + g.questionCount, 0);
      sec.scoringCount = sec.groups.reduce((sum, g) => {
        const examples = g.hasExample ? g.exampleCount : 0;
        return sum + Math.max(0, g.questionCount - examples);
      }, 0);
      modCount += sec.totalCount;
      totalScore += sec.scoringCount * scorePer;
    });
    mod.totalQuestions = modCount;
    totalQuestions += modCount;
  });

  next.totalQuestions = totalQuestions;
  next.totalScore = standard?.totalScore ?? totalScore;
  next.totalDuration = standard?.durationMinutes ?? calcTimeBlockMinutes(next.timeBlocks);
  if (standard) {
    next.passScore = standard.passScore;
  }
  return next;
}

export function buildSlotsFromTemplate(
  template: HskPaperTemplate,
  typeDefs: HskQuestionTypeDef[],
  assignments: Record<number, string | null> = {},
): HskPaperSlot[] {
  const slots: HskPaperSlot[] = [];
  let globalIndex = 0;
  const scorePer = getScorePerQuestion(template, typeDefs);

  template.modules.forEach((mod) => {
    mod.sections.forEach((sec) => {
      sec.groups.forEach((group, groupIndex) => {
        for (let slotIndex = 0; slotIndex < group.questionCount; slotIndex += 1) {
          const isExample = group.hasExample && slotIndex < group.exampleCount;
          slots.push({
            moduleId: mod.id,
            moduleName: mod.name,
            sectionId: sec.id,
            sectionName: sec.name,
            questionType: sec.questionType,
            isCompound: sec.isCompound,
            groupIndex,
            slotIndex,
            isExample,
            globalIndex,
            questionNumber: null,
            questionId: assignments[globalIndex] ?? null,
            scorePerQuestion: scorePer,
          });
          globalIndex += 1;
        }
      });
    });
  });

  return assignQuestionNumbers(slots);
}

export function assignQuestionNumbers(slots: HskPaperSlot[]): HskPaperSlot[] {
  let num = 0;
  return slots.map((slot) => {
    if (slot.isExample) return { ...slot, questionNumber: null };
    num += 1;
    return { ...slot, questionNumber: num };
  });
}

export function countFilledSlots(slots: HskPaperSlot[]): number {
  return slots.filter((s) => !s.isExample && s.questionId).length;
}

export function countScoringSlots(slots: HskPaperSlot[]): number {
  return slots.filter((s) => !s.isExample).length;
}

export function calcPaperScore(slots: HskPaperSlot[]): number {
  return slots.filter((s) => !s.isExample).reduce((sum, s) => sum + s.scorePerQuestion, 0);
}

export function validateTemplatePublish(template: HskPaperTemplate): string | null {
  if (!template.name.trim()) return '请填写模板名称';
  if (template.totalQuestions <= 0) return '模板至少需要 1 道题';
  if (template.totalScore <= 0) return '卷面总分必须大于 0';
  if (template.passScore > template.totalScore) return '及格分不能高于卷面总分';
  return null;
}

export function validatePaperPublish(paper: HskComposedPaper): string | null {
  const scoring = countScoringSlots(paper.slots);
  const filled = countFilledSlots(paper.slots);
  if (filled < scoring) return `还有 ${scoring - filled} 道题未从题库选题，无法发布`;
  const score = calcPaperScore(paper.slots);
  if (score !== paper.totalScore) {
    return `卷面总分 ${paper.totalScore} 与选题分值 ${score} 不一致，请调整题型题量或修改模板基础属性中的卷面总分。`;
  }
  const level = levelToNumber(String(paper.level));
  if (level) {
    const err = validateLevelStandardScore(level, paper.totalScore, scoring);
    if (err) return err;
  }
  return null;
}

export function createEmptyTemplate(partial?: Partial<HskPaperTemplate>): HskPaperTemplate {
  const base: HskPaperTemplate = {
    id: `tpl_${Date.now()}`,
    name: '未命名模板',
    category: 'custom',
    level: 'custom',
    parentCategory: null,
    categoryId: null,
    totalQuestions: 0,
    totalDuration: 8,
    totalScore: 0,
    passScore: 0,
    timeBlocks: { prep: 5, listening: 0, buffer: 3, reading: 0, writing: 0 },
    modules: [
      { id: 'listening', name: '听力', totalQuestions: 0, sections: [] },
      { id: 'reading', name: '阅读', totalQuestions: 0, sections: [] },
      { id: 'writing', name: '书写', totalQuestions: 0, sections: [] },
    ],
    status: 'draft',
    updatedAt: new Date().toISOString(),
  };
  return { ...base, ...partial };
}

export function moduleSectionStats(mod: HskTemplateModule) {
  return {
    sections: mod.sections.length,
    questions: mod.totalQuestions,
  };
}

export function getQuestionTypeForSlot(
  slot: HskPaperSlot,
  typeDefs: HskQuestionTypeDef[],
): HskQuestionTypeDef | undefined {
  return typeDefs.find((t) => t.hskTypeCode === slot.questionType) ?? getQuestionTypeDef(slot.questionType);
}
