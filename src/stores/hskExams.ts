import { normalizeQuestionLevel, normalizeQuestionStatus } from '../config/hskQuestionWorkflow';
import { resolveExplanationByLang } from '../config/languages';
import { ensureQuestionTypes, levelToNumber, migrateLegacyTypeId } from '../config/hskQuestionTypes';
import { getLevelStandard } from '../config/hskLevelStandards';
import { ensureQuestionTags } from '../config/hskQuestionTags';
import type {
  ExamDeliveryPackage,
  HskComposedPaper,
  HskExamInstance,
  HskExamStoreSnapshot,
  HskPaperTemplate,
  HskPublishStatus,
  HskQuestionRow,
  HskQuestionTag,
  HskQuestionTagCatalog,
  HskQuestionTypeDef,
} from '../types/hskExams';
import { compileExamDelivery, validateDeliveryCompile } from '../utils/hskCompileDelivery';
import { fetchHskSnapshot, putHskSnapshot } from '../lib/api';
import { createDefaultHskStore } from '../utils/hskDefaultStore';
import { resolveSnapshotArray } from '../utils/hskStoreSnapshot';
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
const HSK_EXAM_PENDING_SYNC_KEY = `${HSK_EXAM_STORAGE_KEY}:pending-sync`;

const stamp = () => new Date().toISOString();
let remoteSaveQueue: Promise<void> = Promise.resolve();

export { createDefaultHskStore };

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

export function normalizeHskStoreSnapshot(raw: unknown): HskExamStoreSnapshot {
  const fallback = createDefaultHskStore();
  if (!raw || typeof raw !== 'object') return fallback;
  const data = raw as Partial<HskExamStoreSnapshot>;
  const questions = Array.isArray(data.questions) ? data.questions : fallback.questions;
  return {
    questionTypes: ensureQuestionTypes(
      resolveSnapshotArray(data.questionTypes, fallback.questionTypes),
    ),
    questions: migrateQuestionRows(questions),
    tags: ensureQuestionTags(
      resolveSnapshotArray(data.tags, fallback.tags),
    ),
    tagCatalog: {
      customCategories: Array.isArray(data.tagCatalog?.customCategories)
        ? data.tagCatalog.customCategories
        : fallback.tagCatalog?.customCategories ?? [],
      hiddenCategories: Array.isArray(data.tagCatalog?.hiddenCategories)
        ? data.tagCatalog.hiddenCategories
        : fallback.tagCatalog?.hiddenCategories ?? [],
    },
    templates: Array.isArray(data.templates) ? data.templates : fallback.templates,
    templateStatus: data.templateStatus && typeof data.templateStatus === 'object' ? data.templateStatus : fallback.templateStatus,
    papers: Array.isArray(data.papers) ? data.papers : fallback.papers,
    exams: Array.isArray(data.exams) ? data.exams : fallback.exams,
    deliveryPackages: data.deliveryPackages && typeof data.deliveryPackages === 'object'
      ? data.deliveryPackages
      : fallback.deliveryPackages,
  };
}

function writeLocalHskStore(snapshot: HskExamStoreSnapshot, emit = true) {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem(HSK_EXAM_STORAGE_KEY, JSON.stringify(snapshot));
  if (emit && typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(HSK_EXAMS_UPDATED_EVENT));
  }
}

function readPendingHskStore(): HskExamStoreSnapshot | null {
  try {
    if (typeof localStorage === 'undefined') return null;
    const raw = localStorage.getItem(HSK_EXAM_PENDING_SYNC_KEY);
    return raw ? normalizeHskStoreSnapshot(JSON.parse(raw)) : null;
  } catch {
    return null;
  }
}

function writePendingHskStore(snapshot: HskExamStoreSnapshot) {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem(HSK_EXAM_PENDING_SYNC_KEY, JSON.stringify(snapshot));
}

function clearPendingHskStore() {
  if (typeof localStorage === 'undefined') return;
  localStorage.removeItem(HSK_EXAM_PENDING_SYNC_KEY);
}

export function loadHskStore(): HskExamStoreSnapshot {
  try {
    if (typeof localStorage === 'undefined') return createDefaultHskStore();
    const raw = localStorage.getItem(HSK_EXAM_STORAGE_KEY);
    if (!raw) {
      const initial = createDefaultHskStore();
      writeLocalHskStore(initial, false);
      return initial;
    }
    const parsed = JSON.parse(raw) as Partial<HskExamStoreSnapshot>;
    const normalized = normalizeHskStoreSnapshot(parsed);
    if (JSON.stringify(parsed.tags) !== JSON.stringify(normalized.tags)
      || JSON.stringify(parsed.questions) !== JSON.stringify(normalized.questions)
      || JSON.stringify(parsed.questionTypes) !== JSON.stringify(normalized.questionTypes)) {
      writeLocalHskStore(normalized, false);
    }
    return normalized;
  } catch {
    const initial = createDefaultHskStore();
    writeLocalHskStore(initial, false);
    return initial;
  }
}

export async function loadHskStoreFromServer(): Promise<HskExamStoreSnapshot> {
  const pending = readPendingHskStore();
  if (pending) {
    await saveHskStoreToServer(pending);
    clearPendingHskStore();
    writeLocalHskStore(pending);
    return pending;
  }

  const snapshot = normalizeHskStoreSnapshot(await fetchHskSnapshot());
  writeLocalHskStore(snapshot);
  return snapshot;
}

export async function saveHskStoreToServer(snapshot: HskExamStoreSnapshot): Promise<void> {
  await putHskSnapshot(normalizeHskStoreSnapshot(snapshot));
}

function enqueueRemoteSave(snapshot: HskExamStoreSnapshot): Promise<void> {
  const saveTask = remoteSaveQueue
    .catch(() => undefined)
    .then(() => saveHskStoreToServer(snapshot))
    .then(
      () => clearPendingHskStore(),
      (err) => {
        writePendingHskStore(snapshot);
        throw err;
      },
    );
  remoteSaveQueue = saveTask.catch(() => undefined);
  return saveTask;
}

export function saveHskStore(snapshot: HskExamStoreSnapshot): Promise<void> {
  const normalized = normalizeHskStoreSnapshot(snapshot);
  writeLocalHskStore(normalized);
  const remoteSave = enqueueRemoteSave(normalized);
  void remoteSave.catch((err) => {
    console.warn('HSK snapshot 保存到后端失败，已保留本地缓存。', err);
  });
  return remoteSave;
}

export function syncQuestionBankLocalCache(input: {
  questionTypes?: HskQuestionTypeDef[];
  questions?: HskQuestionRow[];
  tags?: HskQuestionTag[];
  tagCatalog?: HskQuestionTagCatalog;
}) {
  const current = loadHskStore();
  writeLocalHskStore({
    ...current,
    questionTypes: input.questionTypes ?? current.questionTypes,
    questions: input.questions ?? current.questions,
    tags: input.tags ?? current.tags,
    tagCatalog: input.tagCatalog ?? current.tagCatalog,
  });
}

export function syncTemplatesPapersLocalCache(input: {
  templates?: HskPaperTemplate[];
  templateStatus?: Record<string, HskPublishStatus>;
  papers?: HskComposedPaper[];
}) {
  const current = loadHskStore();
  writeLocalHskStore({
    ...current,
    templates: input.templates ?? current.templates,
    templateStatus: input.templateStatus ?? current.templateStatus,
    papers: input.papers ?? current.papers,
  });
}

export function syncExamsDeliveryLocalCache(input: {
  exams?: HskExamInstance[];
  deliveryPackages?: Record<string, ExamDeliveryPackage>;
}) {
  const current = loadHskStore();
  writeLocalHskStore({
    ...current,
    exams: input.exams ?? current.exams,
    deliveryPackages: input.deliveryPackages ?? current.deliveryPackages,
  });
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

export function upsertTagCatalog(store: HskExamStoreSnapshot, tagCatalog: HskQuestionTagCatalog) {
  saveHskStore({ ...store, tagCatalog });
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
  const next = {
    ...paper,
    updatedAt: stamp(),
    totalScore: paper.scoringMode === 'equal_ratio' ? paper.totalScore : calcPaperScore(paper.slots),
  };
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
    totalScore: template.totalScore,
    scoringMode: template.scoringMode,
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
