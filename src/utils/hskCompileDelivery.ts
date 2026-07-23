import { getLevelStandard } from '../config/hskLevelStandards';
import { levelToNumber } from '../config/hskQuestionTypes';
import { getRegistryEntry } from '../config/hskQuestionTypeRegistry';
import type {
  ExamDeliveryPackage,
  HskComposedPaper,
  HskExamInstance,
  HskPaperSlot,
  HskPaperTemplate,
  HskQuestionRow,
  HskQuestionTypeDef,
  HskRuntimeOption,
  HskRuntimeQuestion,
} from '../types/hskExams';

function toRuntimeOptions(row: HskQuestionRow): HskRuntimeOption[] | undefined {
  const fromPayload = row.payload?.runtimeOptions;
  if (fromPayload?.length) return fromPayload;
  if (!row.options.length) return undefined;
  return row.options.map((o) => ({
    key: o.label,
    text: o.text || undefined,
    pinyin: o.pinyin,
    image: o.image,
  }));
}

function rowToSingleRuntime(
  row: HskQuestionRow,
  slot: HskPaperSlot,
  registry: ReturnType<typeof getRegistryEntry>,
): HskRuntimeQuestion {
  const score = slot.scorePerQuestion || row.score;
  return {
    id: slot.questionNumber ?? slot.globalIndex + 1,
    questionNumber: slot.questionNumber,
    isExample: slot.isExample,
    type: registry?.renderKey ?? row.type_id,
    typeName: registry?.runtimeTypeName ?? row.type_id,
    category: slot.moduleId,
    section: slot.sectionName,
    content: row.payload?.content ?? (row.stem ? { phrase: row.stem } : undefined),
    options: toRuntimeOptions(row),
    score: slot.isExample ? 0 : score,
    audioUrl: row.payload?.audioUrl ?? row.audioUrl,
  };
}

function compileCompoundGroup(
  slots: HskPaperSlot[],
  rows: HskQuestionRow[],
  registry: ReturnType<typeof getRegistryEntry>,
): HskRuntimeQuestion | null {
  if (!slots.length) return null;
  const firstSlot = slots[0];
  const firstScoringSlot = slots.find((slot) => !slot.isExample) ?? firstSlot;
  const firstRow = rows.find((r) => r.question_uid === firstSlot.questionId);
  const sharedOptions = firstRow ? toRuntimeOptions(firstRow) : undefined;
  const sharedContent = firstRow?.payload?.content;
  const sharedAudio = firstRow?.payload?.audioUrl ?? firstRow?.audioUrl;

  const subFromPayload = firstRow?.payload?.subQuestions;
  const questions = slots.map((slot, idx) => {
    const qNum = slot.questionNumber ?? slot.globalIndex + 1;
    const sub = subFromPayload?.[idx];
    return {
      id: sub?.id ?? qNum,
      questionNumber: slot.questionNumber,
      isExample: slot.isExample || Boolean(sub?.isExample),
      score: slot.isExample || sub?.isExample ? 0 : (sub?.score ?? slot.scorePerQuestion),
      question: sub?.question,
      options: sub?.options,
    };
  });

  return {
    id: firstScoringSlot.questionNumber ?? firstScoringSlot.globalIndex + 1,
    questionNumber: firstScoringSlot.questionNumber,
    type: registry?.renderKey ?? firstSlot.questionType,
    typeName: registry?.runtimeTypeName ?? firstSlot.questionType,
    category: firstSlot.moduleId,
    section: firstSlot.sectionName,
    content: sharedContent,
    options: registry?.sharedOptions ? sharedOptions : undefined,
    questions,
    score: questions.reduce((sum, q) => sum + q.score, 0),
    audioUrl: sharedAudio,
  };
}

type SlotGroup = {
  key: string;
  slots: HskPaperSlot[];
  isCompound: boolean;
  questionType: HskPaperSlot['questionType'];
};

function groupSlots(slots: HskPaperSlot[]): SlotGroup[] {
  const groups: SlotGroup[] = [];

  for (const slot of slots) {
    const compound = slot.isCompound;
    const last = groups[groups.length - 1];
    const sameGroup =
      last &&
      last.isCompound === compound &&
      last.questionType === slot.questionType &&
      last.slots[0]?.sectionId === slot.sectionId &&
      last.slots[0]?.groupIndex === slot.groupIndex;

    if (compound && sameGroup) {
      last.slots.push(slot);
    } else {
      groups.push({
        key: `${slot.sectionId}_${slot.groupIndex}_${slot.globalIndex}`,
        slots: [slot],
        isCompound: compound,
        questionType: slot.questionType,
      });
    }
  }

  return groups;
}

export function compilePaperQuestions(
  paper: HskComposedPaper,
  questions: HskQuestionRow[],
): HskRuntimeQuestion[] {
  const runtime: HskRuntimeQuestion[] = [];

  for (const group of groupSlots(paper.slots)) {
    const registry = getRegistryEntry(group.questionType, group.isCompound);
    if (group.isCompound && registry?.isCompoundGroup) {
      const compound = compileCompoundGroup(group.slots, questions, registry);
      if (compound) runtime.push(compound);
      continue;
    }

    for (const slot of group.slots) {
      const row = questions.find((q) => q.question_uid === slot.questionId);
      if (!row) continue;
      const reg = getRegistryEntry(slot.questionType, false);
      runtime.push(rowToSingleRuntime(row, slot, reg));
    }
  }

  return runtime;
}

export function buildSectionSummary(
  paper: HskComposedPaper,
  template: HskPaperTemplate,
): ExamDeliveryPackage['sectionSummary'] {
  return template.modules
    .filter((mod) => paper.slots.some((s) => s.moduleId === mod.id && !s.isExample))
    .map((mod) => {
      const minutes =
        mod.id === 'listening'
          ? template.timeBlocks.listening
          : mod.id === 'reading'
            ? template.timeBlocks.reading
            : template.timeBlocks.writing;
      return {
        module: mod.name,
        count: paper.slots.filter((s) => s.moduleId === mod.id && !s.isExample).length,
        minutes: minutes || undefined,
      };
    });
}

export function compileExamDelivery(
  exam: HskExamInstance,
  paper: HskComposedPaper,
  template: HskPaperTemplate,
  questions: HskQuestionRow[],
  _typeDefs?: HskQuestionTypeDef[],
): ExamDeliveryPackage {
  const levelNum = levelToNumber(String(exam.level)) ?? 1;
  const standard = getLevelStandard(levelNum);
  const compiledQuestions = compilePaperQuestions(paper, questions);

  return {
    examId: exam.id,
    level: levelNum,
    title: exam.name || standard?.title || `HSK ${levelNum} 模拟卷`,
    durationMinutes: exam.duration || template.totalDuration,
    totalScore: exam.totalScore || template.totalScore,
    passScore: exam.passScore || template.passScore,
    showPinyin: exam.showPinyin ?? true,
    maxPlayCount: 2,
    noticeRules: exam.noticeRules?.length
      ? exam.noticeRules
      : standard?.defaultNoticeRules ?? [],
    sectionSummary: buildSectionSummary(paper, template),
    questions: compiledQuestions,
  };
}

export function validateLevelStandardScore(
  level: number,
  totalScore: number,
  totalQuestions: number,
): string | null {
  const standard = getLevelStandard(level);
  if (!standard) return null;
  if (totalScore !== standard.totalScore) {
    return `卷面总分 ${totalScore} 与 HSK${level} 标准 ${standard.totalScore} 分不一致`;
  }
  if (totalQuestions !== standard.totalQuestions) {
    return `题量 ${totalQuestions} 与 HSK${level} 标准 ${standard.totalQuestions} 题不一致`;
  }
  return null;
}

export function validateDeliveryCompile(
  paper: HskComposedPaper,
  questions: HskQuestionRow[],
  template: HskPaperTemplate,
): string | null {
  const scoring = paper.slots.filter((s) => !s.isExample);
  const missing = scoring.filter((s) => !s.questionId);
  if (missing.length) return `还有 ${missing.length} 道题未选题，无法编译`;
  const missingExamples = paper.slots.filter((slot) => slot.isExample && !slot.questionId);
  if (missingExamples.length) return `还有 ${missingExamples.length} 道示例未选题，无法编译`;

  for (const slot of scoring) {
    const row = questions.find((q) => q.question_uid === slot.questionId);
    if (!row) return `槽位第 ${slot.questionNumber} 题关联的题目不存在`;
    const registry = getRegistryEntry(slot.questionType, slot.isCompound);
    if (registry?.editorFields.includes('audio') && !row.audioUrl && !row.payload?.audioUrl) {
      if (row.audioStatus === 'missing') {
        return `题目 ${row.question_uid} 缺少听力音频`;
      }
    }
  }

  if (template.passScore > template.totalScore) {
    return '模板及格分不能高于卷面总分';
  }

  return null;
}

export function previewExamDelivery(
  paper: HskComposedPaper,
  template: HskPaperTemplate,
  questions: HskQuestionRow[],
): ExamDeliveryPackage {
  const levelNum = levelToNumber(String(paper.level)) ?? 1;
  const standard = getLevelStandard(levelNum);
  const fakeExam: HskExamInstance = {
    id: 'preview',
    name: paper.name,
    paperId: paper.id,
    templateId: paper.templateId,
    level: paper.level,
    examType: 'mock',
    duration: paper.duration,
    totalScore: paper.totalScore,
    passScore: template.passScore,
    status: 'draft',
    scheduledAt: null,
    noticeRules: standard?.defaultNoticeRules,
    showPinyin: true,
    updatedAt: new Date().toISOString(),
  };
  return compileExamDelivery(fakeExam, paper, template, questions);
}
