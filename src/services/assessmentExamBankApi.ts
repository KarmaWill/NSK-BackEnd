import { javaAdminFetch, javaExamFetch, unwrapPageRecords, type JavaPageResult } from '../lib/api';
import type {
  ExamDeliveryPackage,
  HskComposedPaper,
  HskExamInstance,
  HskPaperTemplate,
  HskPublishStatus,
  HskQuestionRow,
  HskQuestionStatus,
  HskQuestionTag,
  HskQuestionTagCatalog,
  HskQuestionTypeCode,
  HskQuestionTypeDef,
  HskSectionModule,
} from '../types/hskExams';

export type QuestionFilters = {
  typeId?: HskQuestionTypeCode | 'all';
  level?: string;
  status?: HskQuestionStatus | 'all';
  difficulty?: number;
  tag?: string;
  keyword?: string;
};

export type TemplateFilters = {
  category?: HskPaperTemplate['category'] | 'all';
  level?: string;
  status?: HskPublishStatus | 'all';
};

export type TemplateCloneInput = {
  fromTemplateId: string;
  id?: string;
  name?: string;
  category?: HskPaperTemplate['category'];
  level?: string;
  parentCategory?: string | null;
  categoryId?: string | null;
};

export type PaperFilters = {
  keyword?: string;
  status?: HskPublishStatus | 'all';
  templateId?: string;
};

export type PaperFromTemplateInput = {
  templateId: string;
  name?: string;
  description?: string;
};

export type ExamFilters = {
  current?: number;
  size?: number;
  paperId?: string;
  level?: string;
  status?: HskPublishStatus | 'all';
  examType?: HskExamInstance['examType'] | 'all';
};

export type ExamCreateInput = Partial<HskExamInstance> & { paperId: string };

export type ExamPublishResult = {
  exam: HskExamInstance;
  delivery: ExamDeliveryPackage;
};

type ApiTemplateGroup = {
  groupUid?: string;
  sortOrder?: number;
  scoringQuestionCount?: number;
  exampleCount?: number;
};

type ApiTemplateSection = {
  sectionUid?: string;
  sectionKey?: string;
  moduleKey?: HskSectionModule;
  name?: string;
  sortOrder?: number;
  questionType?: HskQuestionTypeCode;
  isCompound?: boolean;
  scoringQuestionCount?: number;
  exampleCount?: number;
  scorePerQuestion?: number;
  groups?: ApiTemplateGroup[];
};

type ApiTemplate = HskPaperTemplate & {
  sections?: ApiTemplateSection[];
  sourceTemplateUid?: string | null;
  preparationMinutes?: number;
  listeningMinutes?: number;
  bufferMinutes?: number;
  readingMinutes?: number;
  writingMinutes?: number;
};

const MODULE_NAMES: Record<HskSectionModule, string> = {
  listening: '听力',
  reading: '阅读',
  writing: '书写',
};

function normalizeTemplateFromApi(raw: ApiTemplate): HskPaperTemplate {
  const sections = [...(raw.sections ?? [])].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
  const modules = (['listening', 'reading', 'writing'] as HskSectionModule[]).map((moduleId) => {
    const moduleSections = sections
      .filter((section) => section.moduleKey === moduleId)
      .map((section, sectionIndex) => {
        const groups = [...(section.groups ?? [])]
          .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
          .map((group) => ({
            questionCount: Math.max(0, group.scoringQuestionCount ?? 0),
            hasExample: (group.exampleCount ?? 0) > 0,
            exampleCount: Math.max(0, group.exampleCount ?? 0),
          }));
        const scoringCount = groups.length > 0
          ? groups.reduce((sum, group) => sum + group.questionCount, 0)
          : Math.max(0, section.scoringQuestionCount ?? 0);
        const exampleCount = groups.length > 0
          ? groups.reduce((sum, group) => sum + group.exampleCount, 0)
          : Math.max(0, section.exampleCount ?? 0);
        return {
          id: section.sectionKey ?? section.sectionUid ?? `${moduleId}-${sectionIndex + 1}`,
          name: section.name ?? `第 ${sectionIndex + 1} 部分`,
          questionType: section.questionType ?? 'R07',
          isCompound: Boolean(section.isCompound),
          groups: groups.length > 0 ? groups : [{ questionCount: scoringCount, hasExample: exampleCount > 0, exampleCount }],
          totalCount: scoringCount + exampleCount,
          scoringCount,
          scorePerQuestion: section.scorePerQuestion ?? 0,
        };
      });
    return {
      id: moduleId,
      name: MODULE_NAMES[moduleId],
      totalQuestions: moduleSections.reduce((sum, section) => sum + section.scoringCount, 0),
      sections: moduleSections,
    };
  });
  const templateKind = raw.templateKind ?? (raw.category === 'official' ? 'official' : 'custom');
  const scoringMode = raw.scoringMode ?? (templateKind === 'official' ? 'equal_ratio' : 'per_item');
  return {
    ...raw,
    category: templateKind === 'official' ? 'official' : 'custom',
    parentCategory: 'HSK',
    sourceTemplateId: raw.sourceTemplateUid ?? raw.sourceTemplateId ?? null,
    scoringMode,
    timeBlocks: {
      prep: raw.timeBlocks?.prep ?? raw.preparationMinutes ?? 0,
      listening: raw.timeBlocks?.listening ?? raw.listeningMinutes ?? 0,
      buffer: raw.timeBlocks?.buffer ?? raw.bufferMinutes ?? 0,
      reading: raw.timeBlocks?.reading ?? raw.readingMinutes ?? 0,
      writing: raw.timeBlocks?.writing ?? raw.writingMinutes ?? 0,
    },
    modules: sections.length > 0 ? modules : raw.modules,
  };
}

function templateRequestBody(template: Partial<HskPaperTemplate> & { id: string }) {
  let sectionOrder = 0;
  const sections = (template.modules ?? []).flatMap((module) => module.sections.map((section) => {
    const groups = section.groups.map((group, groupIndex) => ({
      groupUid: `${section.id}-group-${groupIndex + 1}`,
      sortOrder: groupIndex,
      scoringQuestionCount: Math.max(0, group.questionCount),
      exampleCount: group.hasExample ? Math.max(0, group.exampleCount) : 0,
    }));
    const result = {
      sectionUid: section.id,
      moduleKey: module.id,
      sectionKey: section.id,
      name: section.name,
      sortOrder: sectionOrder,
      questionType: section.questionType,
      isCompound: section.isCompound,
      scoringQuestionCount: groups.reduce((sum, group) => sum + group.scoringQuestionCount, 0),
      exampleCount: groups.reduce((sum, group) => sum + group.exampleCount, 0),
      scorePerQuestion: section.scorePerQuestion ?? 0,
      groups,
    };
    sectionOrder += 1;
    return result;
  }));
  return {
    ...template,
    scoringMode: template.scoringMode ?? (template.category === 'official' ? 'equal_ratio' : 'per_item'),
    sourceTemplateUid: template.sourceTemplateId ?? null,
    preparationMinutes: template.timeBlocks?.prep,
    listeningMinutes: template.timeBlocks?.listening,
    bufferMinutes: template.timeBlocks?.buffer,
    readingMinutes: template.timeBlocks?.reading,
    writingMinutes: template.timeBlocks?.writing,
    sections,
  };
}

function qs(params: Record<string, string | number | undefined>): string {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== '' && value !== 'all') search.set(key, String(value));
  });
  const raw = search.toString();
  return raw ? `?${raw}` : '';
}

function pageQs(params: Record<string, string | number | undefined>): string {
  return qs({ current: 1, size: 1000, ...params });
}

export function listQuestionTypes(params: { section?: string; keyword?: string } = {}) {
  return javaAdminFetch<JavaPageResult<HskQuestionTypeDef>>(
    `/question-types/page${pageQs(params)}`,
  ).then(unwrapPageRecords);
}

export function createQuestionType(input: HskQuestionTypeDef) {
  return javaAdminFetch<HskQuestionTypeDef>('/question-types', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function patchQuestionType(id: string, patch: Partial<HskQuestionTypeDef>) {
  return javaAdminFetch<HskQuestionTypeDef>('/question-types', {
    method: 'PUT',
    body: JSON.stringify({ id, ...patch }),
  });
}

export async function deleteQuestionType(id: string) {
  await javaAdminFetch<boolean>(`/question-types/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  });
}

export function listQuestions(params: QuestionFilters = {}) {
  return javaAdminFetch<JavaPageResult<HskQuestionRow>>(
    `/questions/page${pageQs(params as Record<string, string | number | undefined>)}`,
  ).then(unwrapPageRecords);
}

export function createQuestion(input: HskQuestionRow) {
  return javaAdminFetch<HskQuestionRow>('/questions', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function patchQuestion(id: string, patch: Partial<HskQuestionRow>) {
  return javaAdminFetch<HskQuestionRow>('/questions', {
    method: 'PUT',
    body: JSON.stringify({ question_uid: id, ...patch }),
  });
}

export function patchQuestionStatus(id: string, status: HskQuestionStatus) {
  return javaAdminFetch<HskQuestionRow>(`/questions/${encodeURIComponent(id)}/status`, {
    method: 'PUT',
    body: JSON.stringify({ status }),
  });
}

export async function deleteQuestion(id: string) {
  await javaAdminFetch<boolean>(`/questions/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  });
}

export function listTags() {
  return javaAdminFetch<HskQuestionTag[]>('/tags/list');
}

export function createTag(input: HskQuestionTag) {
  return javaAdminFetch<HskQuestionTag>('/tags', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function patchTag(id: string, patch: Partial<HskQuestionTag>) {
  return javaAdminFetch<HskQuestionTag>('/tags', {
    method: 'PUT',
    body: JSON.stringify({ id, ...patch }),
  });
}

export function deleteTag(id: string) {
  return javaAdminFetch<{ affectedQuestions: number }>(`/tags/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  });
}

export function getTagCatalog() {
  return javaAdminFetch<HskQuestionTagCatalog>('/tag-catalog');
}

export function patchTagCatalog(input: HskQuestionTagCatalog) {
  return javaAdminFetch<HskQuestionTagCatalog>('/tag-catalog', {
    method: 'PUT',
    body: JSON.stringify(input),
  });
}

export function listTemplates(params: TemplateFilters = {}) {
  return javaAdminFetch<JavaPageResult<HskPaperTemplate>>(
    `/templates/page${pageQs(params as Record<string, string | number | undefined>)}`,
  ).then(unwrapPageRecords).then((templates) => templates.map((template) => normalizeTemplateFromApi(template as ApiTemplate)));
}

export function createTemplate(input: HskPaperTemplate | TemplateCloneInput) {
  const isClone = 'fromTemplateId' in input;
  return javaAdminFetch<HskPaperTemplate>(isClone ? '/templates/clone' : '/templates', {
    method: 'POST',
    body: JSON.stringify(input),
  }).then((template) => normalizeTemplateFromApi(template as ApiTemplate));
}

export function patchTemplate(id: string, patch: Partial<HskPaperTemplate>) {
  return javaAdminFetch<HskPaperTemplate>('/templates', {
    method: 'PUT',
    body: JSON.stringify(templateRequestBody({ id, ...patch })),
  }).then((template) => normalizeTemplateFromApi(template as ApiTemplate));
}

export async function deleteTemplate(id: string) {
  await javaAdminFetch<boolean>(`/templates/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  });
}

export function publishTemplateApi(id: string) {
  return javaAdminFetch<HskPaperTemplate>(`/templates/${encodeURIComponent(id)}/publish`, {
    method: 'POST',
  }).then((template) => normalizeTemplateFromApi(template as ApiTemplate));
}

export function unpublishTemplateApi(id: string) {
  return javaAdminFetch<HskPaperTemplate>(`/templates/${encodeURIComponent(id)}/unpublish`, {
    method: 'POST',
  }).then((template) => normalizeTemplateFromApi(template as ApiTemplate));
}

export function listPapers(params: PaperFilters = {}) {
  return javaAdminFetch<JavaPageResult<HskComposedPaper>>(
    `/papers/page${pageQs(params as Record<string, string | number | undefined>)}`,
  ).then(unwrapPageRecords);
}

export function createPaperFromTemplateApi(input: PaperFromTemplateInput) {
  return javaAdminFetch<HskComposedPaper>('/papers/from-template', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function patchPaper(id: string, patch: Partial<HskComposedPaper>) {
  return javaAdminFetch<HskComposedPaper>('/papers', {
    method: 'PUT',
    body: JSON.stringify({ id, ...patch }),
  });
}

export async function deletePaper(id: string) {
  await javaAdminFetch<boolean>(`/papers/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  });
}

export function publishPaperApi(id: string) {
  return javaAdminFetch<HskComposedPaper>(`/papers/${encodeURIComponent(id)}/publish`, {
    method: 'POST',
  });
}

export function unpublishPaperApi(id: string) {
  return javaAdminFetch<HskComposedPaper>(`/papers/${encodeURIComponent(id)}/unpublish`, {
    method: 'POST',
  });
}

export function listExams(params: ExamFilters = {}) {
  return javaAdminFetch<JavaPageResult<HskExamInstance>>(
    `/exams/page${pageQs(params as Record<string, string | number | undefined>)}`,
  ).then(unwrapPageRecords);
}

export function getPaperExamImpactCount(paperId: string) {
  return javaAdminFetch<JavaPageResult<HskExamInstance>>(
    `/exams/page${pageQs({ paperId, current: 1, size: 1 })}`,
  ).then((page) => page.total);
}

export function createExam(input: ExamCreateInput) {
  return javaAdminFetch<HskExamInstance>('/exams', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function patchExam(id: string, patch: Partial<HskExamInstance>) {
  return javaAdminFetch<HskExamInstance>('/exams', {
    method: 'PUT',
    body: JSON.stringify({ id, ...patch }),
  });
}

export async function deleteExam(id: string) {
  await javaAdminFetch<boolean>(`/exams/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  });
}

export function publishExamApi(id: string) {
  return javaAdminFetch<ExamPublishResult>(`/exams/${encodeURIComponent(id)}/publish`, {
    method: 'POST',
  });
}

export function unpublishExamApi(id: string) {
  return javaAdminFetch<HskExamInstance>(`/exams/${encodeURIComponent(id)}/unpublish`, {
    method: 'POST',
  });
}

export function getExamDeliveryApi(id: string) {
  return javaExamFetch<ExamDeliveryPackage>(`/exams/${encodeURIComponent(id)}/delivery`);
}
