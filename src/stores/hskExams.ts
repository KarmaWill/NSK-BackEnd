import { normalizeQuestionLevel, normalizeQuestionStatus } from '../config/hskQuestionWorkflow';
import { resolveExplanationByLang } from '../config/languages';
import { HSK_QUESTION_TYPE_DEFS, ensureQuestionTypes, levelToNumber, migrateLegacyTypeId } from '../config/hskQuestionTypes';
import { getLevelStandard } from '../config/hskLevelStandards';
import { createDefaultQuestionTags, ensureQuestionTags } from '../config/hskQuestionTags';
import { createAdminSeedQuestions, ensureAdminSeedQuestions } from '../data/hskAdminSeedQuestions';
import type {
  ExamDeliveryPackage,
  HskComposedPaper,
  HskExamInstance,
  HskExamStoreSnapshot,
  HskPaperTemplate,
  HskPublishStatus,
  HskQuestionRow,
  HskQuestionTag,
  HskQuestionTypeDef,
} from '../types/hskExams';
import { compileExamDelivery, validateDeliveryCompile } from '../utils/hskCompileDelivery';
import { syncHskDeliveryToServer } from '../services/hskDeliveryService';
import {
  buildSlotsFromTemplate,
  calcPaperScore,
  countScoringSlots,
  createEmptyTemplate,
  recalcTemplateTotals,
  validatePaperPublish,
  validateTemplatePublish,
} from '../utils/hskPaperUtils';

export const HSK_EXAM_STORAGE_KEY = 'nsk-hsk-exams-v1';
export const HSK_EXAMS_UPDATED_EVENT = 'nsk-hsk-exams-updated';

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
    },
    {
      id: 'L_p2',
      name: '第二部分',
      questionType: 'L03',
      isCompound: false,
      groups: [{ questionCount: 5, hasExample: false, exampleCount: 0 }],
      totalCount: 5,
      scoringCount: 5,
    },
    {
      id: 'L_p3',
      name: '第三部分',
      questionType: 'L02',
      isCompound: true,
      groups: [{ questionCount: 5, hasExample: false, exampleCount: 0 }],
      totalCount: 5,
      scoringCount: 5,
    },
    {
      id: 'L_p4',
      name: '第四部分',
      questionType: 'L04',
      isCompound: false,
      groups: [{ questionCount: 5, hasExample: false, exampleCount: 0 }],
      totalCount: 5,
      scoringCount: 5,
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
    },
    {
      id: 'R_p2',
      name: '第二部分',
      questionType: 'R02',
      isCompound: false,
      groups: [{ questionCount: 5, hasExample: false, exampleCount: 0 }],
      totalCount: 5,
      scoringCount: 5,
    },
    {
      id: 'R_p3',
      name: '第三部分',
      questionType: 'R03',
      isCompound: true,
      groups: [{ questionCount: 5, hasExample: false, exampleCount: 0 }],
      totalCount: 5,
      scoringCount: 5,
    },
    {
      id: 'R_p4',
      name: '第四部分',
      questionType: 'R04',
      isCompound: false,
      groups: [{ questionCount: 5, hasExample: false, exampleCount: 0 }],
      totalCount: 5,
      scoringCount: 5,
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
    totalScore: calcPaperScore(slots),
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
    templates: [template],
    templateStatus: { [template.id]: template.status },
    papers: [paper],
    exams,
    deliveryPackages: seedDeliveryPackages(exams, paper, template, questions),
  };
}

function migrateQuestionRows(questions: HskQuestionRow[]): HskQuestionRow[] {
  return questions.map((q) => {
    const next = /^T\d{2}$/.test(q.type_id) ? { ...q, type_id: migrateLegacyTypeId(q.type_id) } : q;
    return {
      ...next,
      level: normalizeQuestionLevel(next.level),
      status: normalizeQuestionStatus(next.status),
      explanationByLang: resolveExplanationByLang(next.explanation, next.explanationByLang),
      explanation: resolveExplanationByLang(next.explanation, next.explanationByLang).CN ?? next.explanation,
    };
  });
}

function normalizeStore(raw: unknown): HskExamStoreSnapshot {
  const fallback = createDefaultHskStore();
  if (!raw || typeof raw !== 'object') return fallback;
  const data = raw as Partial<HskExamStoreSnapshot>;
  return {
    questionTypes: ensureQuestionTypes(
      Array.isArray(data.questionTypes) && data.questionTypes.length ? data.questionTypes : fallback.questionTypes,
    ),
    questions: migrateQuestionRows(
      ensureAdminSeedQuestions(Array.isArray(data.questions) ? data.questions : fallback.questions),
    ),
    tags: ensureQuestionTags(
      Array.isArray(data.tags) && data.tags.length ? data.tags : fallback.tags,
    ),
    templates: Array.isArray(data.templates) && data.templates.length ? data.templates : fallback.templates,
    templateStatus: data.templateStatus && typeof data.templateStatus === 'object' ? data.templateStatus : fallback.templateStatus,
    papers: Array.isArray(data.papers) ? data.papers : fallback.papers,
    exams: Array.isArray(data.exams) ? data.exams : fallback.exams,
    deliveryPackages: data.deliveryPackages && typeof data.deliveryPackages === 'object'
      ? data.deliveryPackages
      : fallback.deliveryPackages,
  };
}

export function loadHskStore(): HskExamStoreSnapshot {
  try {
    const raw = localStorage.getItem(HSK_EXAM_STORAGE_KEY);
    if (!raw) {
      const initial = createDefaultHskStore();
      saveHskStore(initial);
      return initial;
    }
    const parsed = JSON.parse(raw) as Partial<HskExamStoreSnapshot>;
    const normalized = normalizeStore(parsed);
    if (JSON.stringify(parsed.tags) !== JSON.stringify(normalized.tags)
      || JSON.stringify(parsed.questions) !== JSON.stringify(normalized.questions)
      || JSON.stringify(parsed.questionTypes) !== JSON.stringify(normalized.questionTypes)) {
      saveHskStore(normalized);
    }
    return normalized;
  } catch {
    const initial = createDefaultHskStore();
    saveHskStore(initial);
    return initial;
  }
}

export function saveHskStore(snapshot: HskExamStoreSnapshot) {
  localStorage.setItem(HSK_EXAM_STORAGE_KEY, JSON.stringify(snapshot));
  window.dispatchEvent(new CustomEvent(HSK_EXAMS_UPDATED_EVENT));
}

export function countQuestionsByType(questions: HskQuestionRow[], typeId: string) {
  return questions.filter((q) => q.type_id === typeId).length;
}

export function mergeTypeCounts(types: HskQuestionTypeDef[], questions: HskQuestionRow[]) {
  return types.map((t) => ({
    ...t,
    questionCount: countQuestionsByType(questions, t.id),
    totalQuestions: Math.max(countQuestionsByType(questions, t.id), 50),
  }));
}

export function upsertQuestionTypes(store: HskExamStoreSnapshot, types: HskQuestionTypeDef[]) {
  saveHskStore({ ...store, questionTypes: types });
}

export function upsertQuestions(store: HskExamStoreSnapshot, questions: HskQuestionRow[]) {
  saveHskStore({ ...store, questions });
}

export function upsertTags(store: HskExamStoreSnapshot, tags: HskQuestionTag[]) {
  saveHskStore({ ...store, tags });
}

export function saveTemplate(store: HskExamStoreSnapshot, template: HskPaperTemplate) {
  const recalced = recalcTemplateTotals({ ...template, updatedAt: stamp() }, store.questionTypes);
  const templates = store.templates.some((t) => t.id === recalced.id)
    ? store.templates.map((t) => (t.id === recalced.id ? recalced : t))
    : [...store.templates, recalced];
  saveHskStore({
    ...store,
    templates,
    templateStatus: { ...store.templateStatus, [recalced.id]: recalced.status },
  });
  return recalced;
}

export function deleteTemplate(store: HskExamStoreSnapshot, templateId: string) {
  const { [templateId]: _removed, ...templateStatus } = store.templateStatus;
  saveHskStore({
    ...store,
    templates: store.templates.filter((t) => t.id !== templateId),
    templateStatus,
    papers: store.papers.filter((p) => p.templateId !== templateId),
    exams: store.exams.filter((e) => e.templateId !== templateId),
  });
}

export function publishTemplate(store: HskExamStoreSnapshot, templateId: string): string | null {
  const template = store.templates.find((t) => t.id === templateId);
  if (!template) return '模板不存在';
  const err = validateTemplatePublish(template);
  if (err) return err;
  saveTemplate(store, { ...template, status: 'published' });
  return null;
}

export function savePaper(store: HskExamStoreSnapshot, paper: HskComposedPaper) {
  const next = { ...paper, updatedAt: stamp(), totalScore: calcPaperScore(paper.slots) };
  const papers = store.papers.some((p) => p.id === next.id)
    ? store.papers.map((p) => (p.id === next.id ? next : p))
    : [...store.papers, next];
  saveHskStore({ ...store, papers });
  return next;
}

export function publishPaper(store: HskExamStoreSnapshot, paperId: string): string | null {
  const paper = store.papers.find((p) => p.id === paperId);
  if (!paper) return '试卷不存在';
  const err = validatePaperPublish(paper);
  if (err) return err;
  savePaper(store, { ...paper, status: 'published' });
  return null;
}

export function unpublishPaper(store: HskExamStoreSnapshot, paperId: string) {
  const paper = store.papers.find((p) => p.id === paperId);
  if (!paper || paper.status !== 'published') return;
  savePaper(store, { ...paper, status: 'draft' });
}

export function deletePaper(store: HskExamStoreSnapshot, paperId: string) {
  const linkedExams = store.exams.filter((e) => e.paperId === paperId);
  const examIds = new Set(linkedExams.map((e) => e.id));
  const deliveryPackages = { ...store.deliveryPackages };
  for (const examId of examIds) {
    delete deliveryPackages[examId];
  }
  saveHskStore({
    ...store,
    papers: store.papers.filter((p) => p.id !== paperId),
    exams: store.exams.filter((e) => e.paperId !== paperId),
    deliveryPackages,
  });
}

export function createPaperFromTemplate(store: HskExamStoreSnapshot, templateId: string, name?: string) {
  const template = store.templates.find((t) => t.id === templateId);
  if (!template) return null;
  const slots = buildSlotsFromTemplate(template, store.questionTypes);
  const now = stamp();
  const seq = store.papers.length + 1;
  const paper: HskComposedPaper = {
    id: `PAP-${String(seq).padStart(3, '0')}`,
    templateId: template.id,
    name: name ?? `${template.name} — ${new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: 'long' })}`,
    description: `基于 ${template.name} 模板生成的正式考试试卷`,
    level: template.level,
    slots,
    totalScore: calcPaperScore(slots),
    totalQuestions: countScoringSlots(slots),
    duration: template.totalDuration,
    status: 'draft',
    linkedCourses: 0,
    createdAt: now,
    updatedAt: now,
  };
  savePaper(store, paper);
  return paper;
}

export function saveExam(store: HskExamStoreSnapshot, exam: HskExamInstance) {
  const next = { ...exam, updatedAt: stamp() };
  const exams = store.exams.some((e) => e.id === next.id)
    ? store.exams.map((e) => (e.id === next.id ? next : e))
    : [...store.exams, next];
  saveHskStore({ ...store, exams });
}

export function publishExam(store: HskExamStoreSnapshot, examId: string): string | null {
  const exam = store.exams.find((e) => e.id === examId);
  if (!exam) return '考试不存在';
  const paper = store.papers.find((p) => p.id === exam.paperId);
  if (!paper) return '关联试卷不存在';
  if (paper.status !== 'published') return '请先发布关联试卷';
  const template = store.templates.find((t) => t.id === exam.templateId);
  if (!template) return '关联模板不存在';

  const compileErr = validateDeliveryCompile(paper, store.questions, template);
  if (compileErr) return compileErr;

  const delivery = compileExamDelivery(exam, paper, template, store.questions, store.questionTypes);
  const nextExam: HskExamInstance = {
    ...exam,
    status: 'published',
    deliveryCompiledAt: stamp(),
    totalScore: delivery.totalScore,
    passScore: delivery.passScore,
    duration: delivery.durationMinutes,
  };

  const deliveryPackages = { ...store.deliveryPackages, [examId]: delivery };
  saveHskStore({ ...store, exams: store.exams.map((e) => (e.id === examId ? nextExam : e)), deliveryPackages });
  void syncHskDeliveryToServer(examId, delivery);
  return null;
}

export function getExamDelivery(store: HskExamStoreSnapshot, examId: string): ExamDeliveryPackage | null {
  return store.deliveryPackages[examId] ?? null;
}

export function createExamFromPaper(
  store: HskExamStoreSnapshot,
  paperId: string,
  partial?: Partial<HskExamInstance>,
) {
  const paper = store.papers.find((p) => p.id === paperId);
  if (!paper) return null;
  const template = store.templates.find((t) => t.id === paper.templateId);
  const levelNum = levelToNumber(String(paper.level)) ?? 1;
  const exam: HskExamInstance = {
    id: `exam_${Date.now()}`,
    name: partial?.name ?? `${paper.name} · 考试`,
    paperId: paper.id,
    templateId: paper.templateId,
    level: paper.level,
    examType: partial?.examType ?? 'mock',
    duration: paper.duration,
    totalScore: paper.totalScore,
    passScore: template?.passScore ?? Math.round(paper.totalScore * 0.6),
    status: 'draft',
    scheduledAt: partial?.scheduledAt ?? null,
    noticeRules: partial?.noticeRules ?? getLevelStandard(levelNum)?.defaultNoticeRules,
    showPinyin: partial?.showPinyin ?? true,
    deliveryCompiledAt: null,
    updatedAt: stamp(),
  };
  saveExam(store, exam);
  return exam;
}

export function setTemplateStatus(store: HskExamStoreSnapshot, templateId: string, status: HskPublishStatus) {
  const template = store.templates.find((t) => t.id === templateId);
  if (!template) return;
  saveTemplate(store, { ...template, status });
}

export function importAnalyzeResultAsTemplate(
  store: HskExamStoreSnapshot,
  result: import('../types/hskExams').HskExamAnalyzeResult,
) {
  let tpl = createEmptyTemplate({
    name: result.examMeta.title || '导入模板',
    level: result.examMeta.level || 'custom',
    passScore: result.examMeta.totalScore ? Math.round(result.examMeta.totalScore * 0.6) : 60,
    timeBlocks: { prep: 5, listening: 20, buffer: 3, reading: 25, writing: 15 },
  });
  const moduleMap: Record<string, typeof tpl.modules[number]> = Object.fromEntries(
    tpl.modules.map((m) => [m.id, m]),
  );
  result.sections.forEach((sec, idx) => {
    const code = sec.questionType;
    const typeDef = store.questionTypes.find((t) => t.hskTypeCode === code);
    const mod = typeDef ? moduleMap[typeDef.section] : moduleMap.listening;
    mod.sections.push({
      id: `imp_${idx}`,
      name: sec.sectionName || `第 ${idx + 1} 部分`,
      questionType: code,
      isCompound: false,
      groups: [{ questionCount: sec.questionCount, hasExample: false, exampleCount: 0 }],
      totalCount: sec.questionCount,
      scoringCount: sec.questionCount,
    });
  });
  tpl = recalcTemplateTotals(tpl, store.questionTypes);
  saveTemplate(store, tpl);
  return tpl;
}
