import type { TitleByLang } from '../config/languages';

export type HskSectionModule = 'listening' | 'reading' | 'writing';

export type HskLevelCode =
  | 'HSK1'
  | 'HSK2'
  | 'HSK3'
  | 'HSK4'
  | 'HSK5'
  | 'HSK6'
  | 'HSK7-9'
  | 'custom';

export const HSK_QUESTION_LEVELS = [
  'HSK1',
  'HSK2',
  'HSK3',
  'HSK4',
  'HSK5',
  'HSK6',
  'HSK7-9',
] as const satisfies readonly HskLevelCode[];

export type HskPublishStatus = 'draft' | 'published';

/** 题库题目工作流状态 */
export type HskQuestionStatus = 'draft' | 'pending_review' | 'pending_publish' | 'published';

export type HskQuestionTypeCode =
  | 'L01' | 'L02' | 'L03' | 'L04' | 'L05' | 'L06'
  | 'R01' | 'R02' | 'R03' | 'R04' | 'R05' | 'R06' | 'R07' | 'R08' | 'R09'
  | 'W01' | 'W02' | 'W03' | 'W04';

export type HskQuestionTypeDef = {
  id: HskQuestionTypeCode;
  hskTypeCode: HskQuestionTypeCode;
  name: string;
  section: HskSectionModule;
  description: string;
  defaultScore: number;
  hskLevels: number[];
  difficulty: string;
  isPublished: boolean;
  lastModified: string;
  /** 作答模式（题型模板编辑） */
  answerMode?: string;
  /** 默认选项数量 */
  defaultOptionCount?: number;
  /** 题目编辑页显示的字段区块 */
  editorFieldFlags?: Partial<Record<'audio' | 'image' | 'subQuestions' | 'wordBank' | 'pinyin' | 'writing', boolean>>;
};

export type HskQuestionOption = {
  label: string;
  text: string;
  pinyin?: string;
  image?: string;
};

export type HskRuntimeOption = {
  key: string;
  text?: string;
  pinyin?: string;
  image?: string;
};

export type HskSubQuestionPayload = {
  id?: number;
  answer: string;
  score: number;
  question?: string;
  options?: HskRuntimeOption[];
};

export type HskQuestionPayload = {
  content?: Record<string, unknown>;
  runtimeOptions?: HskRuntimeOption[];
  subQuestions?: HskSubQuestionPayload[];
  audioUrl?: string;
  /** 音频文本稿（选填） */
  audioTranscript?: string;
  renderKey?: string;
};

export type HskQuestionRow = {
  question_uid: string;
  type_id: HskQuestionTypeCode;
  level: HskLevelCode;
  /** 便于识别的题目名称（选填） */
  questionName?: string;
  /** 难度 1–5 星 */
  difficulty?: number;
  /** HSK3+ 是否显示拼音字段 */
  showPinyinFields?: boolean;
  tags: string[];
  stem: string;
  options: HskQuestionOption[];
  correctAnswer: string;
  explanation: string;
  /** 解析多语言文案（CN 与 explanation 同步） */
  explanationByLang?: TitleByLang;
  /** 解析拼音（全局共享，各语言解析共用） */
  explanationPinyin?: string;
  score: number;
  payload?: HskQuestionPayload;
  audioUrl?: string;
  audioStatus: 'none' | 'ready' | 'missing' | 'pending';
  imageStatus: 'none' | 'ready' | 'missing' | 'pending';
  linked_courses: string[];
  linked_papers: string[];
  linked_videos: string[];
  status: HskQuestionStatus;
  createdAt: string;
  updatedAt: string;
};

export type HskRuntimeQuestion = {
  id: number;
  type: string;
  typeName: string;
  category: HskSectionModule;
  section: string;
  content?: Record<string, unknown>;
  options?: HskRuntimeOption[];
  questions?: Array<{ id: number; answer: string; score: number; question?: string; options?: HskRuntimeOption[] }>;
  answer?: string;
  score: number;
  audioUrl?: string;
};

export type ExamDeliveryPackage = {
  examId: string;
  level: number;
  title: string;
  durationMinutes: number;
  totalScore: number;
  passScore: number;
  showPinyin: boolean;
  noticeRules: string[];
  sectionSummary: Array<{ module: string; count: number; minutes?: number }>;
  questions: HskRuntimeQuestion[];
};

export type HskQuestionTag = {
  id: string;
  label: string;
  description?: string;
};

export type HskSectionGroup = {
  questionCount: number;
  hasExample: boolean;
  exampleCount: number;
};

export type HskTemplateSection = {
  id: string;
  name: string;
  questionType: HskQuestionTypeCode;
  isCompound: boolean;
  groups: HskSectionGroup[];
  totalCount: number;
  scoringCount: number;
  writingConfig?: Record<string, unknown> | null;
};

export type HskTemplateModule = {
  id: HskSectionModule;
  name: string;
  totalQuestions: number;
  sections: HskTemplateSection[];
};

export type HskTimeBlocks = {
  prep: number;
  listening: number;
  buffer: number;
  reading: number;
  writing: number;
};

export type HskAudioRules = {
  autoPlayOnEnter: boolean;
  allowPause: boolean;
  /** null = 不限播放次数 */
  maxPlayCount: number | null;
};

export type HskPaperTemplate = {
  id: string;
  name: string;
  category: 'official' | 'practice' | 'custom';
  level: HskLevelCode | string;
  parentCategory: string | null;
  categoryId: string | null;
  totalQuestions: number;
  totalDuration: number;
  totalScore: number;
  passScore: number;
  timeBlocks: HskTimeBlocks;
  modules: HskTemplateModule[];
  status: HskPublishStatus;
  updatedAt: string;
  audioRules?: HskAudioRules;
  /** 自定义模板可覆盖默认单题分值 */
  customScorePerQuestion?: number;
};

export type HskPaperSlot = {
  moduleId: HskSectionModule;
  moduleName: string;
  sectionId: string;
  sectionName: string;
  questionType: HskQuestionTypeCode;
  isCompound: boolean;
  groupIndex: number;
  slotIndex: number;
  isExample: boolean;
  globalIndex: number;
  questionNumber: number | null;
  questionId: string | null;
  scorePerQuestion: number;
};

export type HskComposedPaper = {
  id: string;
  templateId: string;
  name: string;
  description?: string;
  level: HskLevelCode | string;
  slots: HskPaperSlot[];
  totalScore: number;
  totalQuestions: number;
  duration: number;
  status: HskPublishStatus;
  linkedCourses: number;
  createdAt?: string;
  updatedAt: string;
};

export type HskExamInstance = {
  id: string;
  name: string;
  paperId: string;
  templateId: string;
  level: HskLevelCode | string;
  examType: 'mock' | 'formal' | 'practice';
  duration: number;
  totalScore: number;
  passScore: number;
  status: HskPublishStatus;
  scheduledAt: string | null;
  noticeRules?: string[];
  showPinyin?: boolean;
  deliveryCompiledAt?: string | null;
  updatedAt: string;
};

export type HskExamAnalyzeResult = {
  examMeta: {
    title: string;
    level: HskLevelCode | string;
    totalScore?: number;
    duration?: number;
  };
  sections: Array<{
    questionType: HskQuestionTypeCode;
    questionCount: number;
    sectionName?: string;
  }>;
  questions: Array<{
    type: string;
    sectionName: string;
    questionNumber: number;
    stem: string;
    options: HskQuestionOption[];
    answer: string;
  }>;
};

export type HskExamStoreSnapshot = {
  questionTypes: HskQuestionTypeDef[];
  questions: HskQuestionRow[];
  tags: HskQuestionTag[];
  templates: HskPaperTemplate[];
  templateStatus: Record<string, HskPublishStatus>;
  papers: HskComposedPaper[];
  exams: HskExamInstance[];
  deliveryPackages: Record<string, ExamDeliveryPackage>;
};
