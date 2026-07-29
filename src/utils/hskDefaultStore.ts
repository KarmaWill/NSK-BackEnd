import { getLevelStandard } from '../config/hskLevelStandards';
import { HSK_QUESTION_TYPE_DEFS } from '../config/hskQuestionTypes';
import { createDefaultQuestionTags } from '../config/hskQuestionTags';
import { createAdminSeedQuestions } from '../data/hskAdminSeedQuestions';
import type {
  ExamDeliveryPackage,
  HskComposedPaper,
  HskExamInstance,
  HskExamStoreSnapshot,
  HskPaperTemplate,
  HskQuestionRow,
  HskQuestionTag,
} from '../types/hskExams';
import { DEFAULT_HSK_QUESTION_TAG_CATALOG } from '../types/hskExams';
import { compileExamDelivery } from './hskCompileDelivery';
import {
  buildSlotsFromTemplate,
  countScoringSlots,
  createEmptyTemplate,
  recalcTemplateTotals,
} from './hskPaperUtils';

const stamp = () => new Date().toISOString();

function seedQuestions(): HskQuestionRow[] {
  return createAdminSeedQuestions();
}

function seedTags(): HskQuestionTag[] {
  return createDefaultQuestionTags();
}

function seedTemplate(): HskPaperTemplate {
  const standard = getLevelStandard(1)!;
  let tpl = createEmptyTemplate({
    id: 'tpl-hsk1-official',
    name: 'HSK1 官方模板',
    category: 'official',
    level: 'HSK1',
    parentCategory: 'HSK',
    passScore: standard.passScore,
    totalScore: standard.totalScore,
    scoringMode: 'equal_ratio',
    timeBlocks: { prep: 5, listening: 17, buffer: 3, reading: 15, writing: 0 },
    status: 'published',
  });
  tpl.modules[0].sections = [
    {
      id: 'L_p1',
      name: '第一部分',
      questionType: 'L01',
      isCompound: false,
      groups: [{ questionCount: 5, hasExample: false, exampleCount: 0 }],
      totalCount: 5,
      scoringCount: 5,
      scorePerQuestion: 5,
    },
    {
      id: 'L_p2',
      name: '第二部分',
      questionType: 'L03',
      isCompound: false,
      groups: [{ questionCount: 5, hasExample: false, exampleCount: 0 }],
      totalCount: 5,
      scoringCount: 5,
      scorePerQuestion: 5,
    },
    {
      id: 'L_p3',
      name: '第三部分',
      questionType: 'L02',
      isCompound: true,
      groups: [{ questionCount: 5, hasExample: false, exampleCount: 0 }],
      totalCount: 5,
      scoringCount: 5,
      scorePerQuestion: 5,
    },
    {
      id: 'L_p4',
      name: '第四部分',
      questionType: 'L03',
      isCompound: false,
      groups: [{ questionCount: 5, hasExample: false, exampleCount: 0 }],
      totalCount: 5,
      scoringCount: 5,
      scorePerQuestion: 5,
    },
  ];
  tpl.modules[1].sections = [
    {
      id: 'R_p1',
      name: '第一部分',
      questionType: 'R01',
      isCompound: false,
      groups: [{ questionCount: 5, hasExample: false, exampleCount: 0 }],
      totalCount: 5,
      scoringCount: 5,
      scorePerQuestion: 5,
    },
    {
      id: 'R_p2',
      name: '第二部分',
      questionType: 'R02',
      isCompound: false,
      groups: [{ questionCount: 5, hasExample: false, exampleCount: 0 }],
      totalCount: 5,
      scoringCount: 5,
      scorePerQuestion: 5,
    },
    {
      id: 'R_p3',
      name: '第三部分',
      questionType: 'R03',
      isCompound: true,
      groups: [{ questionCount: 5, hasExample: false, exampleCount: 0 }],
      totalCount: 5,
      scoringCount: 5,
      scorePerQuestion: 5,
    },
    {
      id: 'R_p4',
      name: '第四部分',
      questionType: 'R07',
      isCompound: false,
      groups: [{ questionCount: 5, hasExample: false, exampleCount: 0 }],
      totalCount: 5,
      scoringCount: 5,
      scorePerQuestion: 5,
    },
  ];
  tpl = recalcTemplateTotals(tpl, HSK_QUESTION_TYPE_DEFS);
  return tpl;
}

function seedPaper(template: HskPaperTemplate): HskComposedPaper {
  const assignments: Record<number, string | null> = {
    0: 'Q-L01-01',
    1: 'Q-L01-02',
    2: 'Q-L01-03',
    3: 'Q-L01-04',
    4: 'Q-L01-05',
    5: 'Q-L03-01',
    10: 'Q-L02-GROUP',
    11: 'Q-L02-S02',
    12: 'Q-L02-S03',
    13: 'Q-L02-S04',
    14: 'Q-L02-S05',
    20: 'Q-R01-01',
  };
  const slots = buildSlotsFromTemplate(template, HSK_QUESTION_TYPE_DEFS, assignments);
  const now = stamp();
  return {
    id: 'PAP-001',
    templateId: template.id,
    name: 'HSK1 基础测试卷 — 2026年3月',
    description: '基于 HSK1 基础测试卷模板生成的正式考试试卷',
    level: 'HSK1',
    slots,
    totalScore: template.totalScore,
    scoringMode: template.scoringMode,
    totalQuestions: countScoringSlots(slots),
    duration: template.totalDuration,
    status: 'draft',
    linkedCourses: 0,
    createdAt: now,
    updatedAt: now,
  };
}

function seedExams(paper: HskComposedPaper, template: HskPaperTemplate): HskExamInstance[] {
  const standard = getLevelStandard(1);
  return [
    {
      id: 'exam-001',
      name: 'HSK1 模拟考试 · 2024 春季',
      paperId: paper.id,
      templateId: template.id,
      level: 'HSK1',
      examType: 'mock',
      duration: template.totalDuration,
      totalScore: template.totalScore,
      passScore: template.passScore,
      status: 'draft',
      scheduledAt: '2024-04-01T09:00:00',
      noticeRules: standard?.defaultNoticeRules,
      showPinyin: true,
      deliveryCompiledAt: null,
      updatedAt: stamp(),
    },
  ];
}

function seedDeliveryPackages(
  exams: HskExamInstance[],
  paper: HskComposedPaper,
  template: HskPaperTemplate,
  questions: HskQuestionRow[],
): Record<string, ExamDeliveryPackage> {
  const packages: Record<string, ExamDeliveryPackage> = {};
  for (const exam of exams) {
    packages[exam.id] = compileExamDelivery(exam, paper, template, questions, HSK_QUESTION_TYPE_DEFS);
  }
  return packages;
}

export function createDefaultHskStore(): HskExamStoreSnapshot {
  const template = seedTemplate();
  const questions = seedQuestions();
  const paper = seedPaper(template);
  const exams = seedExams(paper, template);
  return {
    questionTypes: structuredClone(HSK_QUESTION_TYPE_DEFS),
    questions,
    tags: seedTags(),
    tagCatalog: { ...DEFAULT_HSK_QUESTION_TAG_CATALOG },
    templates: [template],
    templateStatus: { [template.id]: template.status },
    papers: [paper],
    exams,
    deliveryPackages: seedDeliveryPackages(exams, paper, template, questions),
  };
}
