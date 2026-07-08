import { useMemo, useState, useEffect, useRef, type ReactNode } from 'react';
import type { DragEndEvent } from '@dnd-kit/core';
import { parseCatalogWorkbook, validateCatalogImportFile, type ParsedCatalogUnit } from '../utils/catalogImport';
import {
  applyMultiMediaMappings,
  MULTI_MEDIA_MAPPING_IMPORT_MAX_ROWS,
  parseMultiMediaMappingWorkbook,
  validateMultiMediaMappingImportFile,
  type ParsedMultiMediaMappingRow,
} from '../utils/multiMediaMappingImport';
import { downloadMultiMediaMappingWorkbook } from '../utils/multiMediaMappingExport';
import {
  BookSortableTableBody,
  SeriesSortableGrid,
  SortableBookRow,
  SortableSeriesCard,
  reorderBySortOrder,
  reorderByVolumeOrder,
} from './librarySortable';
import { LibraryInlineAddSelect } from '../components/LibraryInlineAddSelect';
import { BookCoverConfig } from '../components/BookCoverConfig';
import {
  ALL_BOOK_RESOURCE_FILTER_OPTIONS,
  BOOK_RESOURCE_TYPE_SELECT_OPTIONS,
  bookResourceBadgeClass,
  bookResourceNeedsPageNum,
  bookResourcePageNotApplicable,
  formatBookResourcePageDisplay,
  getBookResourceTypeLabel,
  isBookResourceFrameNumValid,
  isBookResourcePageCodeFormatValid,
  isBookResourcePageValid,
  normalizeBookResourcePageCode,
  normalizeBookResourceType,
  type BookResourceType,
} from '../config/bookResourceTypes';
import {
  ALL_FEATURE_TAGS,
  EXTENDED_LEVEL_OPTIONS,
  FEATURE_CATEGORIES,
  PUBLISHERS,
  PUBLISHER_CATEGORIES,
  formatHskRange,
  parseLegacyLevel,
  publishersByCategory,
  type PublisherOption,
} from '../config/bookCatalog';
import {
  LIBRARY_FIELD_HINTS,
  LIBRARY_FIELD_LIMITS,
  parseAuthorsInput,
  sanitizeAuthorsInput,
  sanitizeDescription,
  sanitizeFeatureTagInput,
  sanitizeIsbn,
  sanitizeTitleName,
  sanitizeVersion,
} from '../utils/libraryFieldValidation';
import {
  LANG_OPTIONS,
  autoTranslateTitleByLang,
  createEmptyTitleByLang,
  formatVolumeLabelCn,
  primaryEnglishTitle,
  resolveTitleByLang,
  LANG_TAB_META,
  type LangKey,
  type TitleByLang,
} from '../config/languages';

const KNOWN_PUBLISHERS = new Set(PUBLISHERS.map((p) => p.name));

type BookSeries = {
  id: string;
  sortOrder: number;
  name: string;
  nameEn?: string;
  nameByLang?: TitleByLang;
  publisher: string;
  hskLevelMin: string;
  hskLevelMax: string;
  description: string;
  coverColor?: string;
};

type CustomVolumeOption = {
  order: number;
  label: string;
};

type Book = {
  id: string;
  seriesId: string;
  volumeOrder: number;
  customVolumeOptions?: CustomVolumeOption[];
  hiddenVolumeOrders?: number[];
  title: string;
  titleEn?: string;
  titleByLang?: TitleByLang;
  volumeLabelByLang?: TitleByLang;
  publisher: string;
  publisherByLang?: TitleByLang;
  isbn: string;
  version: string;
  authors: string[];
  hskLevelMin: string;
  hskLevelMax: string;
  features: string[];
  customFeatureTagsByCategory?: Record<string, string[]>;
  hiddenFeatureTagsByCategory?: Record<string, string[]>;
  customPublishersByCategory?: Record<string, string[]>;
  hiddenPublishers?: string[];
  formats?: BookFormat[];
  premium: boolean;
  coverUrl?: string;
  coverImageId?: string;
  description: string;
  unitCount: number;
  lessonCount: number;
  vocabularyCount: number;
  characterCount: number;
  lastModified: string;
  isPublished: boolean;
};

function buildInitialCustomVolumeOptions(book: Book): CustomVolumeOption[] {
  if (book.customVolumeOptions?.length) return [...book.customVolumeOptions];
  if (book.volumeOrder > 12) {
    const cn = book.volumeLabelByLang?.CN ?? formatVolumeLabelCn(book.volumeOrder);
    return [{ order: book.volumeOrder, label: cn }];
  }
  return [];
}

function isPresetVolumeOrder(order: number) {
  return order >= 1 && order <= 12;
}

function buildVolumeSelectOptions(
  hiddenVolumeOrders: number[],
  customVolumeOptions: CustomVolumeOption[],
) {
  const preset = Array.from({ length: 12 }, (_, i) => {
    const order = i + 1;
    if (hiddenVolumeOrders.includes(order)) return null;
    return { value: String(order), label: formatVolumeLabelCn(order) };
  }).filter((item): item is { value: string; label: string } => item !== null);
  const custom = customVolumeOptions.map((item) => ({
    value: String(item.order),
    label: item.label,
  }));
  return [...preset, ...custom].sort((a, b) => Number(a.value) - Number(b.value));
}

function buildBookUnitsFromCatalog(parsed: ParsedCatalogUnit[], previous: BookUnitRow[]): BookUnitRow[] {
  return parsed.map((unit) => {
    const existing = previous.find((row) => row.order === unit.order);
    return {
      id: existing?.id ?? `unit-${unit.order}`,
      order: unit.order,
      title: unit.title,
      titleEn: existing?.titleEn,
      mounted: existing ? cloneMounted(existing.mounted) : createEmptyMounted(),
      lessons: unit.lessons.map((lesson, index) => ({
        id: `lesson-${unit.order}-${index + 1}`,
        title: lesson.title,
        page: lesson.page,
        resources: createEmptyResources(),
      })),
    };
  });
}

function bookLevel(book: Pick<Book, 'hskLevelMin' | 'hskLevelMax'>) {
  return formatHskRange(book.hskLevelMin, book.hskLevelMax);
}

function buildInitialGlobalFeatureTags(sourceBooks: Book[]): Record<string, string[]> {
  const merged: Record<string, string[]> = {};

  const append = (category: string, tag: string) => {
    const list = merged[category] ?? [];
    if (list.includes(tag)) return;
    merged[category] = [...list, tag];
  };

  for (const book of sourceBooks) {
    if (book.customFeatureTagsByCategory) {
      for (const [category, tags] of Object.entries(book.customFeatureTagsByCategory)) {
        for (const tag of tags) append(category, tag);
      }
    }
    for (const tag of book.features) {
      if (ALL_FEATURE_TAGS.includes(tag)) continue;
      const presetCategory = FEATURE_CATEGORIES.find((c) => c.tags.includes(tag))?.category;
      append(presetCategory ?? '生活场景类', tag);
    }
  }

  return merged;
}

function getFeatureTagsForCategory(
  category: string,
  presetTags: string[],
  globalCustomTags: Record<string, string[]>,
  hiddenTags: Record<string, string[]> = {},
): string[] {
  const hidden = new Set(hiddenTags[category] ?? []);
  const seen = new Set<string>();
  const items: string[] = [];
  for (const tag of presetTags) {
    if (seen.has(tag) || hidden.has(tag)) continue;
    seen.add(tag);
    items.push(tag);
  }
  for (const tag of globalCustomTags[category] ?? []) {
    if (seen.has(tag) || hidden.has(tag)) continue;
    seen.add(tag);
    items.push(tag);
  }
  return items;
}

function buildInitialCustomPublishersByCategory(book: Book): Record<string, string[]> {
  if (book.customPublishersByCategory && Object.keys(book.customPublishersByCategory).length > 0) {
    return { ...book.customPublishersByCategory };
  }
  if (book.publisher && !KNOWN_PUBLISHERS.has(book.publisher)) {
    return { 自定义: [book.publisher] };
  }
  return {};
}

function buildInitialCustomPublisherCategories(book: Book): string[] {
  const fromBook = book.customPublishersByCategory ? Object.keys(book.customPublishersByCategory) : [];
  return fromBook.filter((cat) => !PUBLISHER_CATEGORIES.includes(cat));
}

function collectPublisherCategoryOptions(
  customPublisherCategories: string[],
  customPublishersByCategory: Record<string, string[]>,
): string[] {
  const seen = new Set<string>();
  const options: string[] = [];
  for (const cat of PUBLISHER_CATEGORIES) {
    if (seen.has(cat)) continue;
    seen.add(cat);
    options.push(cat);
  }
  for (const cat of customPublisherCategories) {
    if (seen.has(cat)) continue;
    seen.add(cat);
    options.push(cat);
  }
  for (const cat of Object.keys(customPublishersByCategory)) {
    if (seen.has(cat)) continue;
    seen.add(cat);
    options.push(cat);
  }
  return options;
}

function mergePublisherGroups(
  baseGroups: Map<string, PublisherOption[]>,
  customPublishersByCategory: Record<string, string[]>,
): Map<string, PublisherOption[]> {
  const map = new Map(baseGroups);
  for (const [category, names] of Object.entries(customPublishersByCategory)) {
    const existing = map.get(category) ?? [];
    const customOptions: PublisherOption[] = names.map((name) => ({
      category,
      name,
      country: '',
      representativeBooks: '',
    }));
    map.set(category, [...existing, ...customOptions]);
  }
  return map;
}

type BookResourceFlags = {
  pointRead: boolean;
  newWords: boolean;
  vocabulary: boolean;
  syncTraining: boolean;
  knowledgeLecture: boolean;
  chapterIntro: boolean;
  cultureVideo: boolean;
  audioReading: boolean;
};

type UnitMountedResources = {
  audioReading: string[];
  cultureVideo: string[];
  sceneVideo: string[];
  communTraining: string[];
  exam: string[];
  cultureRead: string[];
};

type BookChapter = {
  id: string;
  title: string;
  page?: string;
  resources: BookResourceFlags;
};

type BookUnitRow = {
  id: string;
  order: number;
  title: string;
  titleEn?: string;
  page?: string;
  mounted: UnitMountedResources;
  lessons: BookChapter[];
};

type BookFileResource = {
  id: string;
  type: BookResourceType;
  fileName: string;
  fileSize: string;
  uploadedAt: string;
  meta?: string;
  /** 教材页面编号，如 P002V（rms_study_resource_mapping.page_num） */
  pageCode?: string;
  /** 同页多视频时的帧序号，默认 1 */
  frameNum?: number;
  /** rms_study_resource_mapping.type：1 情景视频 / 2 交际训练 */
  mappingType?: number;
  /** 导入表中的资源名称，用于与已挂载 .mp4 匹配 */
  resourceName?: string;
  /** 业务资源 ID（7 位数字，如 1612935；导入表「资源ID」列） */
  resourceId?: string;
  /** @deprecated 兼容旧数据，请使用 resourceId */
  lessonId?: string;
};

const BOOK_FORMAT_OPTIONS = ['JWR', 'JWL', 'JWRT'] as const;
type BookFormat = (typeof BOOK_FORMAT_OPTIONS)[number];

function createEmptyResources(): BookResourceFlags {
  return {
    pointRead: false,
    newWords: false,
    vocabulary: false,
    syncTraining: false,
    knowledgeLecture: false,
    chapterIntro: false,
    cultureVideo: false,
    audioReading: false,
  };
}

function createEmptyMounted(): UnitMountedResources {
  return {
    audioReading: [],
    cultureVideo: [],
    sceneVideo: [],
    communTraining: [],
    exam: [],
    cultureRead: [],
  };
}

function cloneMounted(mounted: UnitMountedResources): UnitMountedResources {
  const empty = createEmptyMounted();
  return {
    audioReading: [...(mounted.audioReading ?? empty.audioReading)],
    cultureVideo: [...(mounted.cultureVideo ?? empty.cultureVideo)],
    sceneVideo: [...(mounted.sceneVideo ?? empty.sceneVideo)],
    communTraining: [...(mounted.communTraining ?? empty.communTraining)],
    exam: [...(mounted.exam ?? empty.exam)],
    cultureRead: [...(mounted.cultureRead ?? empty.cultureRead)],
  };
}

type BookResourceBundle = {
  units: BookUnitRow[];
  files: BookFileResource[];
};

function cloneBookResourceBundle(bundle: BookResourceBundle): BookResourceBundle {
  return {
    units: bundle.units.map((u) => ({
      ...u,
      mounted: cloneMounted(u.mounted),
      lessons: u.lessons.map((l) => ({ ...l, resources: { ...l.resources } })),
    })),
    files: [...bundle.files],
  };
}

function createEmptyBookResourceBundle(): BookResourceBundle {
  return { units: [], files: [] };
}

function clearBookResourceLinks(bundle: BookResourceBundle): BookResourceBundle {
  return {
    units: bundle.units.map((u) => ({
      ...u,
      mounted: createEmptyMounted(),
      lessons: u.lessons.map((l) => ({
        ...l,
        resources: createEmptyResources(),
      })),
    })),
    files: [],
  };
}

const MOCK_BOOK_UNITS: BookUnitRow[] = [
  {
    id: 'unit-1',
    order: 1,
    title: 'U1 我和你',
    titleEn: 'You and I',
    mounted: {
      audioReading: ['AUDIO_001', 'AUDIO_002'],
      cultureVideo: ['VIDEO_001'],
      sceneVideo: ['SCENE_001'],
      communTraining: ['COMM_001'],
      exam: ['EXAM_001', 'EXAM_002'],
      cultureRead: ['CULTURE_001'],
    },
    lessons: [
      { id: 'lesson-1-1', title: '第一课 你好', page: '12', resources: { ...createEmptyResources(), pointRead: true } },
      { id: 'lesson-1-2', title: '第二课 再见', page: '18', resources: createEmptyResources() },
    ],
  },
  {
    id: 'unit-2',
    order: 2,
    title: 'U2 你叫什么',
    titleEn: "What's Your Name",
    mounted: createEmptyMounted(),
    lessons: [
      { id: 'lesson-2-1', title: '第一课 名字', page: '24', resources: createEmptyResources() },
    ],
  },
  {
    id: 'unit-3',
    order: 3,
    title: 'U3 她是谁',
    titleEn: 'Who is She',
    mounted: {
      audioReading: ['AUDIO_003'],
      cultureVideo: [],
      sceneVideo: [],
      communTraining: [],
      exam: ['EXAM_003'],
      cultureRead: ['CULTURE_002'],
    },
    lessons: [
      { id: 'lesson-3-1', title: '第一课 介绍他人', page: '30', resources: createEmptyResources() },
    ],
  },
  {
    id: 'unit-4',
    order: 4,
    title: 'U4 我很喜欢',
    titleEn: 'I Like It Very Much',
    mounted: {
      audioReading: ['AUDIO_004', 'AUDIO_005'],
      cultureVideo: ['VIDEO_002', 'VIDEO_003'],
      sceneVideo: ['SCENE_002'],
      communTraining: ['COMM_002'],
      exam: ['EXAM_004'],
      cultureRead: ['CULTURE_003'],
    },
    lessons: [
      { id: 'lesson-4-1', title: '第一课 喜好', page: '36', resources: createEmptyResources() },
      { id: 'lesson-4-2', title: '第二课 评价', page: '42', resources: createEmptyResources() },
    ],
  },
];

const BOOK_FILE_RESOURCE_ID_BASE = 1612935;

const INITIAL_BOOK_FILES: BookFileResource[] = [
  { id: 'file-1', resourceId: '1612935', type: 'GUIDANCE', fileName: '快乐中文第一册.jwl', fileSize: '10.5 MB', uploadedAt: '2024-01-15 10:30' },
  { id: 'file-2', resourceId: '1612936', type: 'GUIDANCE', fileName: '快乐中文第一册_补充.jwl', fileSize: '3.2 MB', uploadedAt: '2024-02-20 14:15' },
  { id: 'file-2b', resourceId: '1612937', type: 'KNOWLEDGE_CARD', fileName: '快乐中文第一册_知识卡.jwl', fileSize: '4.1 MB', uploadedAt: '2024-02-22 11:00' },
  { id: 'file-3', resourceId: '1612938', type: 'POINT_READ_JWR', fileName: '快乐中文第一册.jwr', fileSize: '25.8 MB', uploadedAt: '2024-01-15 10:35' },
  { id: 'file-4', resourceId: '1612939', type: 'VIDEO', fileName: 'U1开场视频.mp4', fileSize: '128 MB', uploadedAt: '2024-03-01 09:00' },
  {
    id: 'file-5',
    resourceId: '1612940',
    type: 'MULTI_MEDIA',
    fileName: 'U1单元多媒体.mp4',
    fileSize: '45 MB',
    uploadedAt: '2024-02-28 14:00',
    pageCode: 'P012V',
    frameNum: 1,
    mappingType: 2,
  },
];

function createDefaultBookResourceBundle(): BookResourceBundle {
  return cloneBookResourceBundle({
    units: MOCK_BOOK_UNITS.map((u) => ({
      ...u,
      mounted: cloneMounted(u.mounted),
      lessons: u.lessons.map((l) => ({ ...l, resources: { ...l.resources } })),
    })),
    files: [...INITIAL_BOOK_FILES],
  });
}

function buildInitialBookResources(sourceBooks: Book[]): Record<string, BookResourceBundle> {
  const map: Record<string, BookResourceBundle> = {};
  for (const book of sourceBooks) {
    map[book.id] = createDefaultBookResourceBundle();
  }
  return map;
}

type AvailableBookFile = {
  poolId: string;
  resourceId?: string;
  type: BookResourceType;
  fileName: string;
  fileSize: string;
  uploadedAt: string;
  meta?: string;
};

const AVAILABLE_BOOK_FILES: AvailableBookFile[] = [
  { poolId: 'pool-1', resourceId: '1612941', type: 'GUIDANCE', fileName: '快乐中文第一册.jwl', fileSize: '10.5 MB', uploadedAt: '2024-01-15' },
  { poolId: 'pool-2', resourceId: '1612942', type: 'GUIDANCE', fileName: '快乐中文第一册 修订版.jwl', fileSize: '8.2 MB', uploadedAt: '2024-02-10' },
  { poolId: 'pool-3', resourceId: '1612943', type: 'GUIDANCE', fileName: '快乐中文第一册_补充.jwl', fileSize: '3.2 MB', uploadedAt: '2024-02-20' },
  { poolId: 'pool-3b', resourceId: '1612944', type: 'KNOWLEDGE_CARD', fileName: '快乐中文第一册_知识卡.jwl', fileSize: '4.1 MB', uploadedAt: '2024-02-22' },
  { poolId: 'pool-3c', resourceId: '1612945', type: 'KNOWLEDGE_CARD', fileName: '快乐中文第二册_知识卡.jwl', fileSize: '3.8 MB', uploadedAt: '2024-03-12' },
  { poolId: 'pool-4', resourceId: '1612946', type: 'POINT_READ_JWR', fileName: '快乐中文第一册.jwr', fileSize: '25.8 MB', uploadedAt: '2024-01-15' },
  { poolId: 'pool-5', resourceId: '1612947', type: 'POINT_READ_JWR', fileName: '快乐中文第一册_音频.jwr', fileSize: '18.4 MB', uploadedAt: '2024-03-01' },
  { poolId: 'pool-6', resourceId: '1612948', type: 'POINT_READ', fileName: '快乐中文第一册.jwrt', fileSize: '2.1 MB', uploadedAt: '2024-01-20' },
  { poolId: 'pool-7', resourceId: '1612949', type: 'VIDEO', fileName: 'U1开场视频.mp4', fileSize: '128 MB', uploadedAt: '2024-03-01', meta: '时长 5:20' },
  { poolId: 'pool-8', resourceId: '1612950', type: 'VIDEO', fileName: 'U2文化介绍.mp4', fileSize: '96 MB', uploadedAt: '2024-03-05', meta: '时长 4:10' },
  { poolId: 'pool-9', resourceId: '1612951', type: 'MULTI_MEDIA', fileName: 'U1单元多媒体.mp4', fileSize: '45 MB', uploadedAt: '2024-02-28', meta: '时长 8:30' },
  { poolId: 'pool-10', resourceId: '1612952', type: 'MULTI_MEDIA', fileName: 'U2互动多媒体.mp4', fileSize: '52 MB', uploadedAt: '2024-03-08', meta: '时长 6:15' },
];

function ResourceIdCell({ ids }: { ids: string[] }) {
  if (ids.length === 0) return <span className="library-cell-empty">/</span>;
  return (
    <div className="library-resource-ids">
      {ids.map((id) => (
        <span key={id} className="library-resource-id">{id}</span>
      ))}
    </div>
  );
}

function getBookFileResourceId(file: BookFileResource): string {
  return file.resourceId?.trim() || file.lessonId?.trim() || '';
}

function ensureBookFileResourceIds(files: BookFileResource[]): BookFileResource[] {
  let nextId = BOOK_FILE_RESOURCE_ID_BASE;
  const used = new Set(files.map((file) => getBookFileResourceId(file)).filter(Boolean));
  while (used.has(String(nextId))) nextId += 1;

  return files.map((file) => {
    if (getBookFileResourceId(file)) return file;
    while (used.has(String(nextId))) nextId += 1;
    const resourceId = String(nextId);
    used.add(resourceId);
    nextId += 1;
    return { ...file, resourceId };
  });
}

function BookResourcePageDisplay({ file }: { file: BookFileResource }) {
  if (bookResourcePageNotApplicable(file.type)) {
    return <span className="library-page-na">不适用</span>;
  }

  if (!bookResourceNeedsPageNum(file.type)) {
    return <span className="library-cell-empty">—</span>;
  }

  const display = formatBookResourcePageDisplay(file.pageCode, file.frameNum);
  if (display) {
    return <span className="library-page-code">{display}</span>;
  }

  return <span className="library-page-missing">未配置</span>;
}

type BookResourcePageEditModalProps = {
  file: BookFileResource | null;
  onClose: () => void;
  onSave: (fileId: string, patch: Pick<BookFileResource, 'pageCode' | 'frameNum'>) => void;
};

function BookResourcePageEditModal({ file, onClose, onSave }: BookResourcePageEditModalProps) {
  const [pageDraft, setPageDraft] = useState('');
  const [frameDraft, setFrameDraft] = useState('1');
  const [pageError, setPageError] = useState('');
  const [frameError, setFrameError] = useState('');

  useEffect(() => {
    if (!file) return;
    setPageDraft(file.pageCode ? normalizeBookResourcePageCode(file.pageCode) : '');
    setFrameDraft(String(file.frameNum ?? 1));
    setPageError('');
    setFrameError('');
  }, [file]);

  if (!file) return null;

  const handleConfirm = () => {
    const normalizedPage = normalizeBookResourcePageCode(pageDraft);
    const frameNum = Number(frameDraft);
    let valid = true;

    if (!normalizedPage) {
      setPageError('请填写页面编号');
      valid = false;
    } else if (!isBookResourcePageCodeFormatValid(normalizedPage)) {
      setPageError('格式应为 P + 三位数字 + 字母，如 P002V');
      valid = false;
    } else {
      setPageError('');
    }

    if (!isBookResourceFrameNumValid(frameNum)) {
      setFrameError('frame num 应为大于等于 1 的整数');
      valid = false;
    } else {
      setFrameError('');
    }

    if (!valid) return;
    onSave(file.id, { pageCode: normalizedPage, frameNum });
    onClose();
  };

  return (
    <div
      className="modal-overlay open library-modal-stack"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="配置页面编号"
    >
      <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 460 }}>
          <div className="modal-header">
          <div className="modal-title">配置页面映射</div>
          <button type="button" className="modal-close" onClick={onClose} aria-label="关闭">✕</button>
        </div>
        <div className="modal-body">
          <div className="library-page-edit-meta">
            <span className={`library-format-badge ${bookResourceBadgeClass(file.type)}`}>
              {getBookResourceTypeLabel(file.type)}
            </span>
            <span className="library-page-edit-filename">{file.fileName}</span>
          </div>
          <div className="form-group" style={{ marginTop: 16 }}>
            <label>页面编号</label>
            <input
              type="text"
              className={`form-input${pageError ? ' is-invalid' : ''}`}
              placeholder="P002V"
              value={pageDraft}
              onChange={(e) => {
                setPageDraft(e.target.value.toUpperCase());
                setPageError('');
              }}
              autoFocus
            />
            {pageError ? (
              <div className="form-hint form-hint-error">{pageError}</div>
            ) : (
              <div className="form-hint">输入教材页面编号，格式如 P002V（P + 三位页码 + 版本字母）</div>
            )}
          </div>
          <div className="form-group">
            <label>frame num</label>
            <input
              type="number"
              min={1}
              className={`form-input library-frame-num-input${frameError ? ' is-invalid' : ''}`}
              placeholder="1"
              value={frameDraft}
              onChange={(e) => {
                setFrameDraft(e.target.value);
                setFrameError('');
              }}
            />
            {frameError ? (
              <div className="form-hint form-hint-error">{frameError}</div>
            ) : (
              <div className="form-hint">同页多视频时使用；当前一页一视频，默认填 1</div>
            )}
          </div>
        </div>
        <div className="modal-footer">
          <button type="button" className="btn btn-secondary" onClick={onClose}>取消</button>
          <button type="button" className="btn btn-primary" onClick={handleConfirm}>保存</button>
        </div>
      </div>
    </div>
  );
}

type ConfirmDialogProps = {
  open: boolean;
  title?: string;
  message: ReactNode;
  confirmLabel?: string;
  onCancel: () => void;
  onConfirm: () => void;
};

function ConfirmDialog({
  open,
  title = '确认操作',
  message,
  confirmLabel = '确认',
  onCancel,
  onConfirm,
}: ConfirmDialogProps) {
  if (!open) return null;

  return (
    <div
      className="modal-overlay open library-modal-stack"
      onClick={onCancel}
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 420 }}>
        <div className="modal-header">
          <div className="modal-title">{title}</div>
          <button type="button" className="modal-close" onClick={onCancel} aria-label="关闭">✕</button>
        </div>
        <div className="modal-body">{message}</div>
        <div className="modal-footer">
          <button type="button" className="btn btn-ghost" onClick={onCancel}>取消</button>
          <button type="button" className="btn btn-primary" style={{ background: 'var(--rose)' }} onClick={onConfirm}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

type UnitResourceMountModalProps = {
  unit: BookUnitRow;
  onClose: () => void;
  onSave: (unit: BookUnitRow) => void;
};

const MOUNT_RESOURCE_SECTIONS: Array<{ key: keyof UnitMountedResources; label: string; source: string }> = [
  { key: 'audioReading', label: '有声阅读', source: '有声阅读处' },
  { key: 'cultureVideo', label: '文化视频', source: '资源管理处' },
  { key: 'sceneVideo', label: '情景视频', source: '章节视频处' },
  { key: 'communTraining', label: '交际训练', source: '交际训练处' },
  { key: 'exam', label: '测试卷', source: '试卷管理处' },
  { key: 'cultureRead', label: '文化点读', source: '文化点读处' },
];

type UnitResourcePoolItem = {
  id: string;
  name: string;
  meta: string;
};

const UNIT_RESOURCE_POOL: Record<keyof UnitMountedResources, UnitResourcePoolItem[]> = {
  audioReading: [
    { id: 'AUDIO_001', name: 'U1你好 朗读', meta: '有声阅读处 · 时长 2:30' },
    { id: 'AUDIO_002', name: 'U1再见 朗读', meta: '有声阅读处 · 时长 1:45' },
    { id: 'AUDIO_003', name: 'U2你叫什么 朗读', meta: '有声阅读处 · 时长 2:15' },
    { id: 'AUDIO_004', name: 'U3她是谁 朗读', meta: '有声阅读处 · 时长 2:00' },
  ],
  cultureVideo: [
    { id: 'VIDEO_001', name: '中国问候礼仪', meta: '资源管理处 · 时长 5:30' },
    { id: 'VIDEO_002', name: '汉字的起源', meta: '资源管理处 · 时长 8:20' },
    { id: 'VIDEO_003', name: '中国传统节日', meta: '资源管理处 · 时长 6:45' },
  ],
  sceneVideo: [
    { id: 'SCENE_001', name: 'U1打招呼情景', meta: '章节视频处 · 时长 3:20' },
    { id: 'SCENE_002', name: 'U1自我介绍情景', meta: '章节视频处 · 时长 4:10' },
    { id: 'SCENE_003', name: 'U2购物情景', meta: '章节视频处 · 时长 5:00' },
  ],
  communTraining: [
    { id: 'COMM_001', name: 'U1问候交际练习', meta: '交际训练处 · 6 个场景' },
    { id: 'COMM_002', name: 'U1购物对话训练', meta: '交际训练处 · 8 个场景' },
    { id: 'COMM_003', name: 'U2问路与指路', meta: '交际训练处 · 5 个场景' },
  ],
  exam: [
    { id: 'EXAM_001', name: 'U1单元测试卷', meta: '试卷管理处 · 15题 · 30分钟' },
    { id: 'EXAM_002', name: 'U1口语测试', meta: '试卷管理处 · 5题 · 15分钟' },
    { id: 'EXAM_003', name: 'U2单元测试卷', meta: '试卷管理处 · 15题 · 30分钟' },
    { id: 'EXAM_004', name: '期中综合测试', meta: '试卷管理处 · 30题 · 60分钟' },
  ],
  cultureRead: [
    { id: 'CULTURE_001', name: '汉字起源', meta: '文化点读处 · 12个知识点' },
    { id: 'CULTURE_002', name: '书法艺术', meta: '文化点读处 · 8个知识点' },
    { id: 'CULTURE_003', name: '传统节日', meta: '文化点读处 · 15个知识点' },
  ],
};

function getUnitResourceLabel(key: keyof UnitMountedResources, resourceId: string): string {
  const item = UNIT_RESOURCE_POOL[key].find((r) => r.id === resourceId);
  return item ? `${item.id} - ${item.name}` : resourceId;
}

type UnitResourceSelectorModalProps = {
  open: boolean;
  sectionKey: keyof UnitMountedResources;
  sectionLabel: string;
  existingIds: string[];
  onClose: () => void;
  onConfirm: (ids: string[]) => void;
};

function UnitResourceSelectorModal({
  open,
  sectionKey,
  sectionLabel,
  existingIds,
  onClose,
  onConfirm,
}: UnitResourceSelectorModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  useEffect(() => {
    if (!open) return;
    setSearchQuery('');
    setSelectedIds([]);
  }, [open, sectionKey]);

  const mountedSet = useMemo(() => new Set(existingIds), [existingIds]);

  const filteredAvailable = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return UNIT_RESOURCE_POOL[sectionKey].filter((item) => {
      if (mountedSet.has(item.id)) return false;
      if (!query) return true;
      return item.name.toLowerCase().includes(query) || item.id.toLowerCase().includes(query);
    });
  }, [sectionKey, searchQuery, mountedSet]);

  const selectedItems = useMemo(
    () => UNIT_RESOURCE_POOL[sectionKey].filter((item) => selectedIds.includes(item.id)),
    [sectionKey, selectedIds],
  );

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  if (!open) return null;

  return (
    <div className="modal-overlay open library-modal-stack" onClick={onClose} role="dialog" aria-modal="true" aria-label={`添加${sectionLabel}`}>
      <div className="modal modal-wide" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">添加{sectionLabel}</div>
          <button type="button" className="modal-close" onClick={onClose} aria-label="关闭">✕</button>
        </div>
        <div className="modal-body">
          <div className="library-resource-picker">
            <div className="library-resource-picker-panel">
              <div className="library-resource-picker-header">可选资源</div>
              <div className="library-resource-picker-search">
                <input
                  type="text"
                  className="form-input"
                  placeholder="搜索资源名称..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="library-resource-picker-list">
                {filteredAvailable.length === 0 ? (
                  <div className="library-chapter-empty" style={{ padding: 24 }}>暂无可选资源</div>
                ) : (
                  filteredAvailable.map((item) => {
                    const checked = selectedIds.includes(item.id);
                    return (
                      <label
                        key={item.id}
                        className={`library-resource-picker-item ${checked ? 'selected' : ''}`}
                      >
                        <input type="checkbox" checked={checked} onChange={() => toggleSelect(item.id)} />
                        <div className="library-resource-picker-item-info">
                          <div className="library-resource-picker-item-name">{item.name}</div>
                          <div className="library-resource-picker-item-meta">{item.meta}</div>
                        </div>
                      </label>
                    );
                  })
                )}
              </div>
            </div>

            <div className="library-resource-picker-panel">
              <div className="library-resource-picker-header">已选资源 ({selectedItems.length})</div>
              <div className="library-resource-picker-selected">
                {selectedItems.length === 0 ? (
                  <div className="library-chapter-empty" style={{ padding: 24 }}>请从左侧选择资源</div>
                ) : (
                  selectedItems.map((item) => (
                    <div key={item.id} className="library-resource-picker-selected-item">
                      <span className="library-resource-picker-selected-name">{item.name}</span>
                      <button type="button" className="btn-link" onClick={() => toggleSelect(item.id)}>移除</button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
        <div className="modal-footer">
          <button type="button" className="btn btn-ghost" onClick={onClose}>取消</button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => onConfirm(selectedIds)}
            disabled={selectedIds.length === 0}
          >
            确认挂载
          </button>
        </div>
      </div>
    </div>
  );
}

function UnitResourceMountModal({ unit, onClose, onSave }: UnitResourceMountModalProps) {
  const [draft, setDraft] = useState<BookUnitRow>(() => ({
    ...unit,
    mounted: cloneMounted(unit.mounted),
    lessons: unit.lessons.map((l) => ({ ...l, resources: { ...l.resources } })),
  }));
  const [selectorSection, setSelectorSection] = useState<keyof UnitMountedResources | null>(null);
  const [removeTarget, setRemoveTarget] = useState<{ key: keyof UnitMountedResources; resourceId: string } | null>(null);

  const confirmRemoveMounted = () => {
    if (!removeTarget) return;
    const { key, resourceId } = removeTarget;
    setDraft((prev) => ({
      ...prev,
      mounted: {
        ...prev.mounted,
        [key]: prev.mounted[key].filter((id) => id !== resourceId),
      },
    }));
    setRemoveTarget(null);
  };

  const addMounted = (key: keyof UnitMountedResources, ids: string[]) => {
    setDraft((prev) => ({
      ...prev,
      mounted: {
        ...prev.mounted,
        [key]: [...new Set([...prev.mounted[key], ...ids])],
      },
    }));
    setSelectorSection(null);
  };

  const activeSection = MOUNT_RESOURCE_SECTIONS.find((s) => s.key === selectorSection);
  const removeTargetSection = removeTarget
    ? MOUNT_RESOURCE_SECTIONS.find((item) => item.key === removeTarget.key)
    : null;

  return (
    <>
    <div className="modal-overlay open" onClick={onClose} role="dialog" aria-modal="true" aria-label="配置单元资源">
      <div className="modal modal-wide" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">配置单元资源 · {draft.title}</div>
          <button type="button" className="modal-close" onClick={onClose} aria-label="关闭">✕</button>
        </div>
        <div className="modal-body">
          {MOUNT_RESOURCE_SECTIONS.map((section) => (
            <div key={section.key} className="library-mount-section">
              <div className="library-mount-section-header">
                <span className="library-mount-section-title">{section.label}</span>
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => setSelectorSection(section.key)}>
                  + 添加{section.label}
                </button>
              </div>
              {draft.mounted[section.key].length === 0 ? (
                <div className="library-chapter-empty" style={{ padding: '16px' }}>暂未挂载资源</div>
              ) : (
                <div className="paper-table-container">
                  <table className="paper-table">
                    <thead>
                      <tr>
                        <th>资源名称</th>
                        <th>来源系统</th>
                        <th>操作</th>
                      </tr>
                    </thead>
                    <tbody>
                      {draft.mounted[section.key].map((resourceId) => (
                        <tr key={resourceId}>
                          <td>{getUnitResourceLabel(section.key, resourceId)}</td>
                          <td>{section.source}</td>
                          <td>
                            <button
                              type="button"
                              className="btn-link"
                              style={{ color: 'var(--rose)' }}
                              onClick={() => setRemoveTarget({ key: section.key, resourceId })}
                            >
                              移除
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ))}
        </div>
        <div className="modal-footer">
          <button type="button" className="btn btn-primary" onClick={() => onSave(draft)}>完成配置</button>
        </div>
      </div>
    </div>

    {activeSection && (
      <UnitResourceSelectorModal
        open
        sectionKey={activeSection.key}
        sectionLabel={activeSection.label}
        existingIds={draft.mounted[activeSection.key]}
        onClose={() => setSelectorSection(null)}
        onConfirm={(ids) => addMounted(activeSection.key, ids)}
      />
    )}

    <ConfirmDialog
      open={removeTarget !== null}
      title="确认移除"
      message={
        removeTarget ? (
          <p style={{ margin: 0 }}>
            确认移除「{getUnitResourceLabel(removeTarget.key, removeTarget.resourceId)}」
            {removeTargetSection ? `（${removeTargetSection.label}）` : ''}吗？
          </p>
        ) : null
      }
      confirmLabel="确认移除"
      onCancel={() => setRemoveTarget(null)}
      onConfirm={confirmRemoveMounted}
    />
    </>
  );
}

type AddBookResourceModalProps = {
  open: boolean;
  existingFiles: BookFileResource[];
  onClose: () => void;
  onConfirm: (files: BookFileResource[]) => void;
};

function AddBookResourceModal({ open, existingFiles, onClose, onConfirm }: AddBookResourceModalProps) {
  const [resourceType, setResourceType] = useState<BookResourceType>('VIDEO');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPoolIds, setSelectedPoolIds] = useState<string[]>([]);

  useEffect(() => {
    if (!open) return;
    setResourceType('VIDEO');
    setSearchQuery('');
    setSelectedPoolIds([]);
  }, [open]);

  const mountedNames = useMemo(
    () => new Set(existingFiles.map((f) => `${f.type}:${f.fileName}`)),
    [existingFiles],
  );

  const filteredAvailable = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return AVAILABLE_BOOK_FILES.filter((file) => {
      if (file.type !== resourceType) return false;
      if (mountedNames.has(`${file.type}:${file.fileName}`)) return false;
      if (!query) return true;
      return file.fileName.toLowerCase().includes(query);
    });
  }, [resourceType, searchQuery, mountedNames]);

  const selectedFiles = useMemo(
    () => AVAILABLE_BOOK_FILES.filter((file) => selectedPoolIds.includes(file.poolId)),
    [selectedPoolIds],
  );

  const toggleSelect = (poolId: string) => {
    setSelectedPoolIds((prev) =>
      prev.includes(poolId) ? prev.filter((id) => id !== poolId) : [...prev, poolId],
    );
  };

  const removeSelected = (poolId: string) => {
    setSelectedPoolIds((prev) => prev.filter((id) => id !== poolId));
  };

  const handleConfirm = () => {
    if (selectedFiles.length === 0) return;
    onConfirm(
      selectedFiles.map((file) => ({
        id: `file-${Date.now()}-${file.poolId}`,
        resourceId: file.resourceId,
        type: file.type,
        fileName: file.fileName,
        fileSize: file.fileSize,
        uploadedAt: `${file.uploadedAt} 10:00`,
        meta: file.meta,
      })),
    );
  };

  if (!open) return null;

  return (
    <div className="modal-overlay open" onClick={onClose} role="dialog" aria-modal="true" aria-label="添加书籍资源">
      <div className="modal modal-wide" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">添加书籍资源</div>
          <button type="button" className="modal-close" onClick={onClose} aria-label="关闭">✕</button>
        </div>
        <div className="modal-body">
          <div className="form-group">
            <label>资源类型<span className="required">*</span></label>
            <select
              className="form-input form-select"
              value={resourceType}
              onChange={(e) => {
                setResourceType(e.target.value as BookResourceType);
                setSelectedPoolIds([]);
              }}
            >
              {BOOK_RESOURCE_TYPE_SELECT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

            <div className="library-info-box" style={{ marginBottom: 16 }}>
            <div className="library-info-box-icon">📋</div>
            <div className="library-info-box-text">
              从资源管理处选择已上传的文件资源，支持多选。多媒体（.mp4）挂载后请在列表中点击「编辑」配置页面编号；视频不适用页码映射。
            </div>
          </div>

          <div className="library-resource-picker">
            <div className="library-resource-picker-panel">
              <div className="library-resource-picker-header">可选资源</div>
              <div className="library-resource-picker-search">
                <input
                  type="text"
                  className="form-input"
                  placeholder="搜索文件名称..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="library-resource-picker-list">
                {filteredAvailable.length === 0 ? (
                  <div className="library-chapter-empty" style={{ padding: 24 }}>暂无可选资源</div>
                ) : (
                  filteredAvailable.map((file) => {
                    const checked = selectedPoolIds.includes(file.poolId);
                    return (
                      <label
                        key={file.poolId}
                        className={`library-resource-picker-item ${checked ? 'selected' : ''}`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleSelect(file.poolId)}
                        />
                        <div className="library-resource-picker-item-info">
                          <div className="library-resource-picker-item-name">{file.fileName}</div>
                          <div className="library-resource-picker-item-meta">
                            {file.fileSize} · {file.uploadedAt}
                            {file.meta ? ` · ${file.meta}` : ''}
                          </div>
                        </div>
                      </label>
                    );
                  })
                )}
              </div>
            </div>

            <div className="library-resource-picker-panel">
              <div className="library-resource-picker-header">已选资源 ({selectedFiles.length})</div>
              <div className="library-resource-picker-selected">
                {selectedFiles.length === 0 ? (
                  <div className="library-chapter-empty" style={{ padding: 24 }}>请从左侧选择资源</div>
                ) : (
                  selectedFiles.map((file) => (
                    <div key={file.poolId} className="library-resource-picker-selected-item">
                      <span className="library-resource-picker-selected-name">{file.fileName}</span>
                      <button type="button" className="btn-link" onClick={() => removeSelected(file.poolId)}>移除</button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
        <div className="modal-footer">
          <button type="button" className="btn btn-ghost" onClick={onClose}>取消</button>
          <button type="button" className="btn btn-primary" onClick={handleConfirm} disabled={selectedFiles.length === 0}>
            确认挂载
          </button>
        </div>
      </div>
    </div>
  );
}

const INITIAL_SERIES: BookSeries[] = [
  {
    id: 'series-happy-chinese',
    sortOrder: 1,
    name: '快乐中文系列',
    nameEn: 'Happy Chinese',
    publisher: '人民教育出版社',
    hskLevelMin: 'HSK1级',
    hskLevelMax: 'HSK3级',
    description: '面向海外母语非汉语的中学生，对标《国际中文教育中文水平等级标准》',
    coverColor: '#2563EB',
  },
  {
    id: 'series-hsk-standard',
    sortOrder: 2,
    name: 'HSK标准教程系列',
    nameEn: 'HSK Standard Course',
    publisher: '北京语言大学出版社',
    hskLevelMin: 'HSK1级',
    hskLevelMax: 'HSK6级',
    description: 'HSK官方标准教程，配套各级别考试',
    coverColor: '#059669',
  },
  {
    id: 'series-extended',
    sortOrder: 3,
    name: '拓展阅读系列',
    nameEn: 'Extended Reading',
    publisher: '外语教学与研究出版社',
    hskLevelMin: 'HSK2级',
    hskLevelMax: 'HSK5级',
    description: '商务、情景、文化等专题阅读材料',
    coverColor: '#D97706',
  },
];

const MOCK_BOOKS: Book[] = [
  {
    id: 'book-001',
    seriesId: 'series-happy-chinese',
    volumeOrder: 1,
    title: '快乐中文 第一册',
    titleEn: 'Happy Chinese Book 1',
    publisher: '人民教育出版社',
    isbn: '978-7-107-37765-5',
    version: '1.0',
    authors: ['李晓琪', '刘晓雨', '王淑红'],
    hskLevelMin: 'HSK1级',
    hskLevelMax: 'HSK2级',
    features: ['综合 (听说读写并重)', '阅读', '拼音'],
    formats: ['JWL'],
    premium: false,
    description: '面向海外母语非汉语的中学生，对标《国际中文教育中文水平等级标准》',
    unitCount: 8,
    lessonCount: 24,
    vocabularyCount: 340,
    characterCount: 120,
    lastModified: '2024-03-15',
    isPublished: true,
  },
  {
    id: 'book-005',
    seriesId: 'series-happy-chinese',
    volumeOrder: 2,
    title: '快乐中文 第二册',
    titleEn: 'Happy Chinese Book 2',
    publisher: '人民教育出版社',
    isbn: '978-7-107-37766-2',
    version: '1.0',
    authors: ['李晓琪', '刘晓雨', '王淑红'],
    hskLevelMin: 'HSK2级',
    hskLevelMax: 'HSK3级',
    features: ['综合 (听说读写并重)', '阅读', '拼音'],
    formats: ['JWRT'],
    premium: false,
    description: '快乐中文系列第二册，继续深化听说读写能力',
    unitCount: 8,
    lessonCount: 24,
    vocabularyCount: 380,
    characterCount: 150,
    lastModified: '2024-03-12',
    isPublished: true,
  },
  {
    id: 'book-006',
    seriesId: 'series-happy-chinese',
    volumeOrder: 3,
    title: '快乐中文 第三册',
    titleEn: 'Happy Chinese Book 3',
    publisher: '人民教育出版社',
    isbn: '978-7-107-37767-9',
    version: '1.0',
    authors: ['李晓琪', '刘晓雨', '王淑红'],
    hskLevelMin: 'HSK3级',
    hskLevelMax: 'HSK3级',
    features: ['综合 (听说读写并重)', '阅读', '汉字', '拼音'],
    formats: ['JWR'],
    premium: false,
    description: '快乐中文系列第三册，完成初级到中级过渡',
    unitCount: 8,
    lessonCount: 24,
    vocabularyCount: 420,
    characterCount: 180,
    lastModified: '2024-03-10',
    isPublished: false,
  },
  {
    id: 'book-002',
    seriesId: 'series-hsk-standard',
    volumeOrder: 1,
    title: 'HSK 1 Standard Course',
    titleEn: 'HSK Standard Course 1',
    publisher: '北京语言大学出版社',
    isbn: '978-7-5619-4019-6',
    version: '2.0',
    authors: ['姜丽萍'],
    hskLevelMin: 'HSK1级',
    hskLevelMax: 'HSK1级',
    features: ['综合 (听说读写并重)', '听说', '阅读'],
    formats: ['JWR'],
    premium: false,
    description: 'HSK官方标准教程，配套HSK 1级考试',
    unitCount: 1,
    lessonCount: 15,
    vocabularyCount: 150,
    characterCount: 100,
    lastModified: '2024-03-14',
    isPublished: true,
  },
  {
    id: 'book-003',
    seriesId: 'series-extended',
    volumeOrder: 1,
    title: 'Business Chinese for Traders',
    titleEn: 'Business Chinese for International Trade',
    publisher: '商务印书馆 (香港)',
    isbn: '978-7-100-18234-1',
    version: '1.0',
    authors: ['张明', '李华'],
    hskLevelMin: 'HSK4级',
    hskLevelMax: 'HSK5级',
    features: ['听说', '阅读', '商务'],
    formats: ['JWL'],
    premium: true,
    description: '针对商务人士的实用中文教材',
    unitCount: 12,
    lessonCount: 36,
    vocabularyCount: 800,
    characterCount: 400,
    lastModified: '2024-03-10',
    isPublished: true,
  },
  {
    id: 'book-004',
    seriesId: 'series-extended',
    volumeOrder: 2,
    title: 'Daily Life in Beijing',
    titleEn: 'Experiencing Beijing Life',
    publisher: '外语教学与研究出版社',
    isbn: '978-7-5600-9234-8',
    version: '1.0',
    authors: ['王芳'],
    hskLevelMin: 'HSK2级',
    hskLevelMax: 'HSK3级',
    features: ['阅读', '文化', '旅游'],
    formats: ['JWRT'],
    premium: false,
    description: '通过北京日常生活场景学习中文',
    unitCount: 10,
    lessonCount: 30,
    vocabularyCount: 500,
    characterCount: 250,
    lastModified: '2024-03-08',
    isPublished: true,
  },
];

type ViewMode = 'series' | 'books' | 'edit';

const SERIES_COVER_COLORS = [
  { value: '#2563EB', label: '蓝色' },
  { value: '#059669', label: '绿色' },
  { value: '#D97706', label: '琥珀' },
  { value: '#E11D48', label: '玫红' },
  { value: '#7C3AED', label: '紫色' },
  { value: '#475569', label: '石墨' },
] as const;

type SeriesCoverColor = (typeof SERIES_COVER_COLORS)[number]['value'];

const DEFAULT_SERIES_COVER_COLOR: SeriesCoverColor = SERIES_COVER_COLORS[0].value;

type CreateSeriesModalProps = {
  open: boolean;
  series?: BookSeries | null;
  defaultPublisher?: string;
  onClose: () => void;
  onSubmit: (series: BookSeries) => void;
};

function CreateSeriesModal({ open, series, defaultPublisher, onClose, onSubmit }: CreateSeriesModalProps) {
  const isEdit = !!series;
  const [nameLangTab, setNameLangTab] = useState<LangKey>('CN');
  const [nameByLang, setNameByLang] = useState<TitleByLang>(() => createEmptyTitleByLang());
  const [publisher, setPublisher] = useState('');
  const [hskLevelMin, setHskLevelMin] = useState('HSK1级');
  const [hskLevelMax, setHskLevelMax] = useState('HSK1级');
  const [description, setDescription] = useState('');
  const [coverColor, setCoverColor] = useState<string>(DEFAULT_SERIES_COVER_COLOR);
  const publisherGroups = useMemo(() => publishersByCategory(), []);

  useEffect(() => {
    if (!open) return;
    if (series) {
      setNameByLang(resolveTitleByLang(series.name, series.nameEn, series.nameByLang));
      setPublisher(series.publisher);
      setHskLevelMin(series.hskLevelMin);
      setHskLevelMax(series.hskLevelMax);
      setDescription(series.description);
      setCoverColor(series.coverColor ?? DEFAULT_SERIES_COVER_COLOR);
      return;
    }
    setNameByLang(createEmptyTitleByLang());
    setNameLangTab('CN');
    setPublisher(defaultPublisher ?? '');
    setHskLevelMin('HSK1级');
    setHskLevelMax('HSK1级');
    setDescription('');
    setCoverColor(DEFAULT_SERIES_COVER_COLOR);
  }, [open, series, defaultPublisher]);

  const updateNameByLang = (lang: LangKey, value: string) => {
    setNameByLang((prev) => ({ ...prev, [lang]: value }));
  };

  const runAutoTranslateSeriesName = () => {
    const seed = (nameByLang.CN ?? nameByLang[nameLangTab] ?? '').trim();
    if (!seed) return;
    const next = autoTranslateTitleByLang(seed);
    setNameByLang(
      Object.fromEntries(
        Object.entries(next).map(([key, val]) => [key, sanitizeTitleName(val ?? '')]),
      ) as TitleByLang,
    );
  };

  const handleSubmit = () => {
    const cn = (nameByLang.CN ?? '').trim();
    if (!cn || !publisher) return;
    const normalizedByLang: TitleByLang = {
      ...createEmptyTitleByLang(),
      ...nameByLang,
      CN: cn,
    };
    const en = (normalizedByLang.EN ?? '').trim();
    onSubmit({
      id: series?.id ?? `series-${Date.now()}`,
      sortOrder: series?.sortOrder ?? 0,
      name: cn,
      nameEn: en || undefined,
      nameByLang: normalizedByLang,
      publisher,
      hskLevelMin,
      hskLevelMax,
      description: description.trim(),
      coverColor,
    });
  };

  if (!open) return null;

  return (
    <div className="modal-overlay open" onClick={onClose} role="dialog" aria-modal="true" aria-label={isEdit ? '编辑系列' : '新建系列'}>
      <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 640 }}>
        <div className="modal-header">
          <div className="modal-title">{isEdit ? '编辑系列' : '新建系列'}</div>
          <button type="button" className="modal-close" onClick={onClose} aria-label="关闭">✕</button>
        </div>
        <div className="modal-body">
          <div className="form-group">
            <label>系列名称（多语言）<span className="required">*</span></label>
            <LibraryMultilangPanel
              langTab={nameLangTab}
              onLangTabChange={setNameLangTab}
              valueByLang={nameByLang}
              onChange={updateNameByLang}
              onAutoTranslate={runAutoTranslateSeriesName}
              sanitizeValue={sanitizeTitleName}
              maxLength={LIBRARY_FIELD_LIMITS.title}
              fieldHint={LIBRARY_FIELD_HINTS.title}
              placeholder={`${LANG_OPTIONS.find((l) => l.key === nameLangTab)?.label ?? nameLangTab}系列名称`}
              hint={
                nameLangTab === 'CN' && !(nameByLang.CN ?? '').trim() ? (
                  <div className="form-hint" style={{ color: 'var(--rose)', marginTop: 8 }}>
                    中文系列名称为必填项
                  </div>
                ) : undefined
              }
            />
          </div>
          <div className="form-group">
            <label>出版社<span className="required">*</span></label>
            <LibraryInlineAddSelect
              value={publisher}
              placeholder="请选择出版社"
              groups={[...publisherGroups.entries()].map(([label, pubs]) => ({
                label,
                options: pubs.map((p) => ({ value: p.name, label: p.name })),
              }))}
              onSelect={setPublisher}
            />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>最低级别<span className="required">*</span></label>
              <select
                className="form-input form-select"
                value={hskLevelMin}
                onChange={(e) => setHskLevelMin(e.target.value)}
              >
                {[...new Set(EXTENDED_LEVEL_OPTIONS.map((o) => o.category))].map((category) => (
                  <optgroup key={category} label={category}>
                    {EXTENDED_LEVEL_OPTIONS.filter((o) => o.category === category).map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>最高级别<span className="required">*</span></label>
              <select
                className="form-input form-select"
                value={hskLevelMax}
                onChange={(e) => setHskLevelMax(e.target.value)}
              >
                {[...new Set(EXTENDED_LEVEL_OPTIONS.map((o) => o.category))].map((category) => (
                  <optgroup key={category} label={category}>
                    {EXTENDED_LEVEL_OPTIONS.filter((o) => o.category === category).map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>适用级别预览</label>
              <div className="library-level-preview">{formatHskRange(hskLevelMin, hskLevelMax)}</div>
            </div>
          </div>
          <div className="form-group">
            <label>封面色</label>
            <div className="library-series-color-picker">
              {SERIES_COVER_COLORS.map((color) => (
                <button
                  key={color.value}
                  type="button"
                  className={`library-series-color-option ${coverColor === color.value ? 'selected' : ''}`}
                  style={{ backgroundColor: color.value }}
                  onClick={() => setCoverColor(color.value)}
                  aria-label={color.label}
                  title={color.label}
                />
              ))}
            </div>
          </div>
          <div className="form-group">
            <label>系列描述</label>
            <textarea
              className="form-input"
              value={description}
              maxLength={LIBRARY_FIELD_LIMITS.description}
              onChange={(e) => setDescription(sanitizeDescription(e.target.value))}
              rows={3}
              placeholder="简要描述系列特点、适用人群等..."
            />
            <div className="form-hint">
              {LIBRARY_FIELD_HINTS.description} · {description.length}/{LIBRARY_FIELD_LIMITS.description}
            </div>
          </div>
        </div>
        <div className="modal-footer">
          <button type="button" className="btn btn-ghost" onClick={onClose}>取消</button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleSubmit}
            disabled={!(nameByLang.CN ?? '').trim() || !publisher}
          >
            {isEdit ? '保存' : '创建系列'}
          </button>
        </div>
      </div>
    </div>
  );
}

export function Library() {
  const [seriesList, setSeriesList] = useState<BookSeries[]>(INITIAL_SERIES);
  const [books, setBooks] = useState<Book[]>(MOCK_BOOKS);
  const [bookResourcesById, setBookResourcesById] = useState<Record<string, BookResourceBundle>>(() =>
    buildInitialBookResources(MOCK_BOOKS),
  );
  const [globalFeatureTagsByCategory, setGlobalFeatureTagsByCategory] = useState<Record<string, string[]>>(
    () => buildInitialGlobalFeatureTags(MOCK_BOOKS),
  );
  const [hiddenFeatureTagsByCategory, setHiddenFeatureTagsByCategory] = useState<Record<string, string[]>>({});
  const [view, setView] = useState<ViewMode>('series');
  const [selectedSeriesId, setSelectedSeriesId] = useState<string | null>(null);
  const [filterPublisher, setFilterPublisher] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [toast, setToast] = useState<string | null>(null);
  const [editingBook, setEditingBook] = useState<Book | null>(null);
  const [createSeriesOpen, setCreateSeriesOpen] = useState(false);
  const [editingSeries, setEditingSeries] = useState<BookSeries | null>(null);
  const [deleteSeriesTarget, setDeleteSeriesTarget] = useState<BookSeries | null>(null);
  const [deleteSeriesConfirmText, setDeleteSeriesConfirmText] = useState('');
  const [isCreatingBook, setIsCreatingBook] = useState(false);
  const [deleteBookTarget, setDeleteBookTarget] = useState<Book | null>(null);
  const [deleteBookConfirmText, setDeleteBookConfirmText] = useState('');
  const [deleteBookBlocked, setDeleteBookBlocked] = useState(false);

  const publisherGroups = useMemo(() => publishersByCategory(), []);

  const selectedSeries = useMemo(
    () => seriesList.find((s) => s.id === selectedSeriesId) ?? null,
    [seriesList, selectedSeriesId],
  );

  const seriesStats = useMemo(() => {
    const map = new Map<string, { total: number; published: number; units: number; lessons: number }>();
    for (const series of seriesList) {
      map.set(series.id, { total: 0, published: 0, units: 0, lessons: 0 });
    }
    for (const book of books) {
      const stat = map.get(book.seriesId);
      if (!stat) continue;
      stat.total += 1;
      if (book.isPublished) stat.published += 1;
      stat.units += book.unitCount;
      stat.lessons += book.lessonCount;
    }
    return map;
  }, [books, seriesList]);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2200);
  };

  const handleCreateSeries = (series: BookSeries) => {
    setSeriesList((prev) => [
      ...prev,
      {
        ...series,
        sortOrder: prev.length ? Math.max(...prev.map((item) => item.sortOrder)) + 1 : 1,
      },
    ]);
    setCreateSeriesOpen(false);
    showToast(`已创建系列「${series.name}」`);
  };

  const handleUpdateSeries = (series: BookSeries) => {
    setSeriesList((prev) => prev.map((item) => (item.id === series.id ? series : item)));
    setEditingSeries(null);
    showToast(`已更新系列「${series.name}」`);
  };

  const closeDeleteSeries = () => {
    setDeleteSeriesTarget(null);
    setDeleteSeriesConfirmText('');
  };

  const openDeleteSeries = (series: BookSeries) => {
    setDeleteSeriesTarget(series);
    setDeleteSeriesConfirmText('');
  };

  const handleDeleteSeries = () => {
    if (!deleteSeriesTarget) return;
    if (deleteSeriesConfirmText !== deleteSeriesTarget.name) return;
    const target = deleteSeriesTarget;
    setSeriesList((prev) => prev.filter((item) => item.id !== target.id));
    setBooks((prev) => prev.filter((book) => book.seriesId !== target.id));
    setBookResourcesById((prev) => {
      const next = { ...prev };
      for (const book of books) {
        if (book.seriesId === target.id) delete next[book.id];
      }
      return next;
    });
    if (selectedSeriesId === target.id) {
      setSelectedSeriesId(null);
      setView('series');
    }
    closeDeleteSeries();
    showToast(`已删除系列「${target.name}」`);
  };

  const openEditSeries = (series: BookSeries) => {
    setEditingSeries(series);
  };

  const handleSeriesDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    setSeriesList((prev) => reorderBySortOrder(prev, String(active.id), String(over.id)));
  };

  const handleBookDragEnd = (seriesId: string) => (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    setBooks((prev) => {
      const inSeries = prev.filter((book) => book.seriesId === seriesId);
      const reordered = reorderByVolumeOrder(inSeries, String(active.id), String(over.id));
      const orderMap = new Map(reordered.map((book) => [book.id, book.volumeOrder]));
      return prev.map((book) => (
        book.seriesId === seriesId
          ? { ...book, volumeOrder: orderMap.get(book.id) ?? book.volumeOrder }
          : book
      ));
    });
  };

  const openNewBookEditor = () => {
    if (!selectedSeries) return;
    setEditingBook({
      id: `book-${Date.now()}`,
      seriesId: selectedSeries.id,
      volumeOrder: 0,
      title: '',
      publisher: selectedSeries.publisher,
      isbn: '',
      version: '',
      authors: [],
      hskLevelMin: selectedSeries.hskLevelMin,
      hskLevelMax: selectedSeries.hskLevelMax,
      features: [],
      premium: false,
      description: '',
      unitCount: 0,
      lessonCount: 0,
      vocabularyCount: 0,
      characterCount: 0,
      lastModified: new Date().toISOString().slice(0, 10),
      isPublished: false,
    });
    setIsCreatingBook(true);
    setView('edit');
  };

  const togglePublishStatus = (id: string) => {
    const book = books.find((b) => b.id === id);
    if (!book) return;
    const nextPublished = !book.isPublished;
    setBooks((prev) =>
      prev.map((b) => (b.id === id ? { ...b, isPublished: nextPublished } : b)),
    );
    if (book.isPublished && !nextPublished) {
      setBookResourcesById((prev) => ({
        ...prev,
        [id]: clearBookResourceLinks(prev[id] ?? createEmptyBookResourceBundle()),
      }));
      showToast(`已下架 ${book.title}，关联资源已解除`);
      return;
    }
    showToast(`已上架 ${book.title}`);
  };

  const requestDeleteBook = (book: Book) => {
    if (book.isPublished) {
      setDeleteBookBlocked(true);
      setDeleteBookTarget(book);
      setDeleteBookConfirmText('');
      return;
    }
    setDeleteBookBlocked(false);
    setDeleteBookTarget(book);
    setDeleteBookConfirmText('');
  };

  const closeDeleteBook = () => {
    setDeleteBookTarget(null);
    setDeleteBookConfirmText('');
    setDeleteBookBlocked(false);
  };

  const handleDeleteBook = () => {
    if (!deleteBookTarget || deleteBookBlocked) return;
    if (deleteBookConfirmText !== deleteBookTarget.title) return;
    const target = deleteBookTarget;
    setBooks((prev) => prev.filter((b) => b.id !== target.id));
    setBookResourcesById((prev) => {
      const next = { ...prev };
      delete next[target.id];
      return next;
    });
    closeDeleteBook();
    showToast(`已删除《${target.title}》，关联资源已解除`);
  };

  const openSeries = (seriesId: string) => {
    setSelectedSeriesId(seriesId);
    setSearchQuery('');
    setView('books');
  };

  const openBookEditor = (book: Book) => {
    setEditingBook(book);
    setIsCreatingBook(false);
    setView('edit');
  };

  const backToSeries = () => {
    setSelectedSeriesId(null);
    setSearchQuery('');
    setView('series');
  };

  const backToBooks = () => {
    setEditingBook(null);
    setIsCreatingBook(false);
    setView('books');
  };

  if (view === 'edit' && editingBook) {
    return (
      <>
        <BookEditor
          book={editingBook}
          isNew={isCreatingBook}
          seriesName={selectedSeries?.name}
          resourceBundle={
            bookResourcesById[editingBook.id] ??
            (isCreatingBook ? createEmptyBookResourceBundle() : createDefaultBookResourceBundle())
          }
          globalFeatureTagsByCategory={globalFeatureTagsByCategory}
          onGlobalFeatureTagsChange={setGlobalFeatureTagsByCategory}
          hiddenFeatureTagsByCategory={hiddenFeatureTagsByCategory}
          onHiddenFeatureTagsChange={setHiddenFeatureTagsByCategory}
          onSave={(updated, resources) => {
            const wasCreating = isCreatingBook;
            setBooks((prev) => {
              const exists = prev.some((b) => b.id === updated.id);
              return exists ? prev.map((b) => (b.id === updated.id ? updated : b)) : [...prev, updated];
            });
            setBookResourcesById((prev) => ({ ...prev, [updated.id]: resources }));
            setIsCreatingBook(false);
            backToBooks();
            showToast(wasCreating ? `已创建 ${updated.title}` : `已保存 ${updated.title}`);
          }}
          onCancel={backToBooks}
        />
        {toast && (
          <div className="hsk-toast show">{toast}</div>
        )}
      </>
    );
  }

  if (view === 'books' && selectedSeries) {
    const seriesBooks = books
      .filter((b) => b.seriesId === selectedSeries.id)
      .sort((a, b) => a.volumeOrder - b.volumeOrder);

    const filteredBooks = seriesBooks.filter((b) => {
      if (searchQuery === '') return true;
      const query = searchQuery.toLowerCase();
      return b.title.toLowerCase().includes(query) ||
        primaryEnglishTitle(b.titleByLang, b.titleEn).toLowerCase().includes(query) ||
        Object.values(b.titleByLang ?? {}).some((v) => v?.toLowerCase().includes(query)) ||
        b.isbn.includes(query) ||
        b.authors.some(a => a.toLowerCase().includes(query));
    });

    const canReorderBooks = !searchQuery;
    const booksForTable = canReorderBooks ? seriesBooks : filteredBooks;

    return (
      <>
        <div className="page-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div className="page-title" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <button
                type="button"
                className="back-btn"
                onClick={backToSeries}
                style={{ marginRight: 4 }}
              >
                ← 返回
              </button>
              <span>{selectedSeries.name}</span>
            </div>
            <div className="page-subtitle">
              {selectedSeries.nameEn && `${primaryEnglishTitle(selectedSeries.nameByLang, selectedSeries.nameEn)} · `}
              {selectedSeries.publisher} · {seriesBooks.length} 册
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button type="button" className="btn btn-primary" onClick={openNewBookEditor}>
              ➕ 添加册次
            </button>
          </div>
        </div>

        <div className="paper-filter-bar">
          <div className="filter-group">
            <span className="filter-label">搜索:</span>
            <input
              type="text"
              className="search-input"
              placeholder="搜索册次、ISBN、作者..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ minWidth: '320px' }}
            />
          </div>
          <div style={{ marginLeft: 'auto', fontSize: '13px', color: 'var(--ink-light)' }}>
            共 {filteredBooks.length} 册{searchQuery ? ' · 清除搜索后可拖拽排序' : ' · 拖拽左侧手柄排序'}
          </div>
        </div>

        <div className="paper-table-container">
          <table>
            <thead>
              <tr>
                <th style={{ width: '72px', whiteSpace: 'nowrap' }}>排序</th>
                <th style={{ width: '60px' }}>册次</th>
                <th style={{ width: '280px' }}>书籍信息</th>
                <th style={{ width: '100px', whiteSpace: 'nowrap' }}>级别</th>
                <th style={{ width: '180px' }}>功能模块</th>
                <th style={{ width: '100px' }}>状态</th>
                <th style={{ width: '220px', whiteSpace: 'nowrap' }}>操作</th>
              </tr>
            </thead>
            {filteredBooks.length === 0 ? (
              <tbody>
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '60px', color: 'var(--ink-light)' }}>
                    {searchQuery ? '未找到匹配的册次' : '该系列暂无书籍'}
                  </td>
                </tr>
              </tbody>
            ) : (
              <BookSortableTableBody
                itemIds={seriesBooks.map((book) => book.id)}
                dragDisabled={!canReorderBooks}
                onDragEnd={handleBookDragEnd(selectedSeries.id)}
              >
                {booksForTable.map((book) => (
                  <SortableBookRow
                    key={book.id}
                    id={book.id}
                    volumeOrder={book.volumeOrder}
                    dragDisabled={!canReorderBooks}
                    onOpen={() => openBookEditor(book)}
                  >
                    {({ dragHandle, volumeBadge }) => (
                      <>
                        <td>{dragHandle}</td>
                        <td>{volumeBadge}</td>
                        <td>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <div className="paper-name">{book.title}</div>
                            <div style={{ fontSize: '11px', color: 'var(--ink-lighter)', fontFamily: 'JetBrains Mono, monospace' }}>
                              ISBN: {book.isbn}
                            </div>
                            {book.premium && (
                              <span className="badge" style={{ background: 'var(--amber-l)', color: 'var(--amber)', width: 'fit-content', fontSize: '10px', padding: '2px 6px' }}>
                                Premium
                              </span>
                            )}
                          </div>
                        </td>
                        <td>
                          <span className="hsk-badge" style={{ background: 'var(--primary-l)', color: 'var(--primary)' }}>
                            {bookLevel(book)}
                          </span>
                        </td>
                        <td>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                            {book.features.map((f) => (
                              <span key={f} className="feature-tag">{f}</span>
                            ))}
                          </div>
                        </td>
                        <td onClick={(e) => e.stopPropagation()}>
                          <label className="status-toggle">
                            <input
                              type="checkbox"
                              checked={book.isPublished}
                              onChange={() => togglePublishStatus(book.id)}
                            />
                            <span className="toggle-slider"></span>
                          </label>
                        </td>
                        <td onClick={(e) => e.stopPropagation()}>
                          <div className="actions">
                            <button
                              type="button"
                              className="action-btn edit"
                              onClick={() => openBookEditor(book)}
                            >
                              ✏️ 编辑
                            </button>
                            <button
                              type="button"
                              className="action-btn delete"
                              onClick={() => requestDeleteBook(book)}
                            >
                              🗑 删除
                            </button>
                          </div>
                        </td>
                      </>
                    )}
                  </SortableBookRow>
                ))}
              </BookSortableTableBody>
            )}
          </table>
        </div>

        {toast && <div className="hsk-toast show">{toast}</div>}

        <div
          className={`modal-overlay${deleteBookTarget ? ' open' : ''}`}
          onClick={closeDeleteBook}
          role="dialog"
          aria-modal="true"
          aria-label="删除册次"
        >
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 480 }}>
            <div className="modal-header">
              <div className="modal-title">{deleteBookBlocked ? '无法删除' : '删除册次'}</div>
              <button type="button" className="modal-close" onClick={closeDeleteBook} aria-label="关闭">✕</button>
            </div>
            <div className="modal-body">
              {deleteBookTarget && deleteBookBlocked && (
                <p style={{ margin: 0 }}>
                  该书籍当前处于上架状态。请先将其下架，方可删除。
                </p>
              )}
              {deleteBookTarget && !deleteBookBlocked && (
                <>
                  <p style={{ margin: '0 0 12px' }}>
                    确认删除《{deleteBookTarget.title}》吗？删除后数据不可恢复，且系统将同步解除该书关联的所有资源。
                  </p>
                  <label className="form-label">请输入书籍名称以确认删除</label>
                  <input
                    className="form-input"
                    value={deleteBookConfirmText}
                    placeholder={deleteBookTarget.title}
                    onChange={(e) => setDeleteBookConfirmText(e.target.value)}
                    onKeyDown={(e) => {
                      if (
                        e.key === 'Enter' &&
                        deleteBookConfirmText === deleteBookTarget.title
                      ) {
                        e.preventDefault();
                        handleDeleteBook();
                      }
                    }}
                    autoFocus
                  />
                </>
              )}
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-ghost" onClick={closeDeleteBook}>
                {deleteBookBlocked ? '知道了' : '取消'}
              </button>
              {!deleteBookBlocked && (
                <button
                  type="button"
                  className="btn btn-danger"
                  disabled={!deleteBookTarget || deleteBookConfirmText !== deleteBookTarget.title}
                  onClick={handleDeleteBook}
                >
                  确认删除
                </button>
              )}
            </div>
          </div>
        </div>
      </>
    );
  }

  const filteredSeries = seriesList.filter((s) => {
    if (filterPublisher && s.publisher !== filterPublisher) return false;
    if (searchQuery === '') return true;
    const query = searchQuery.toLowerCase();
    const bookTitles = books
      .filter((b) => b.seriesId === s.id)
      .map((b) => `${b.title} ${primaryEnglishTitle(b.titleByLang, b.titleEn)} ${Object.values(b.titleByLang ?? {}).join(' ')}`.toLowerCase())
      .join(' ');
    return s.name.toLowerCase().includes(query) ||
      s.nameEn?.toLowerCase().includes(query) ||
      Object.values(resolveTitleByLang(s.name, s.nameEn, s.nameByLang))
        .join(' ')
        .toLowerCase()
        .includes(query) ||
      s.publisher.toLowerCase().includes(query) ||
      bookTitles.includes(query);
  }).sort((a, b) => a.sortOrder - b.sortOrder);

  const canReorderSeries = !searchQuery && !filterPublisher;
  const sortedSeriesList = [...seriesList].sort((a, b) => a.sortOrder - b.sortOrder);

  return (
    <>
      <div className="page-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div className="page-title">书籍教材管理</div>
          <div className="page-subtitle">按系列管理课程配套书籍与阅读材料</div>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button type="button" className="btn btn-primary" onClick={() => setCreateSeriesOpen(true)}>
            ➕ 新建系列
          </button>
        </div>
      </div>

      <div className="paper-filter-bar">
        <div className="filter-group">
          <span className="filter-label">出版社:</span>
          <select
            className="form-input form-select"
            value={filterPublisher}
            onChange={(e) => setFilterPublisher(e.target.value)}
            style={{ minWidth: '200px' }}
          >
            <option value="">全部出版社</option>
            {[...publisherGroups.entries()].map(([category, pubs]) => (
              <optgroup key={category} label={category}>
                {pubs.map((p) => (
                  <option key={p.name} value={p.name}>{p.name}</option>
                ))}
              </optgroup>
            ))}
          </select>
        </div>
        <div className="filter-group">
          <span className="filter-label">搜索:</span>
          <input
            type="text"
            className="search-input"
            placeholder="搜索系列名称..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ minWidth: '240px' }}
          />
        </div>
        <div style={{ marginLeft: 'auto', fontSize: '13px', color: 'var(--ink-light)' }}>
          共 {filteredSeries.length} 个系列 · {books.length} 册
          {!canReorderSeries && ' · 清除筛选后可拖拽排序'}
          {canReorderSeries && ' · 拖拽卡片左侧手柄排序'}
        </div>
      </div>

      {filteredSeries.length === 0 ? (
        <div className="library-series-empty">
          {searchQuery ? '未找到匹配的系列' : '暂无书籍系列'}
        </div>
      ) : (
        <SeriesSortableGrid
          itemIds={sortedSeriesList.map((series) => series.id)}
          dragDisabled={!canReorderSeries}
          onDragEnd={handleSeriesDragEnd}
        >
          {filteredSeries.map((series) => {
            const stat = seriesStats.get(series.id)!;
            return (
              <SortableSeriesCard
                key={series.id}
                id={series.id}
                dragDisabled={!canReorderSeries}
                onEnter={() => openSeries(series.id)}
                onEdit={() => openEditSeries(series)}
                onDelete={() => openDeleteSeries(series)}
                footerStat={<>{stat.units} 单元 · {stat.lessons} 课</>}
              >
                <div
                  className="library-series-icon"
                  style={{ backgroundColor: series.coverColor ?? DEFAULT_SERIES_COVER_COLOR }}
                  aria-hidden
                />
                <div className="library-series-text">
                  <div className="library-series-title-row">
                    <div className="library-series-info">
                      <div className="library-series-name">{series.name}</div>
                      {primaryEnglishTitle(series.nameByLang, series.nameEn) && (
                        <div className="library-series-name-en">
                          {primaryEnglishTitle(series.nameByLang, series.nameEn)}
                        </div>
                      )}
                    </div>
                    <span className="hsk-badge" style={{ background: 'var(--primary-l)', color: 'var(--primary)', flexShrink: 0 }}>
                      {bookLevel(series)}
                    </span>
                  </div>
                  <div className="library-series-detail-row">
                    <span className="library-series-desc">{series.description}</span>
                    <span className="library-series-meta">
                      <span>{series.publisher}</span>
                      <span>{stat.total} 册 · {stat.published} 已上架</span>
                    </span>
                  </div>
                </div>
              </SortableSeriesCard>
            );
          })}
        </SeriesSortableGrid>
      )}

      {toast && <div className="hsk-toast show">{toast}</div>}

      <CreateSeriesModal
        open={createSeriesOpen}
        defaultPublisher={filterPublisher}
        onClose={() => setCreateSeriesOpen(false)}
        onSubmit={handleCreateSeries}
      />

      <CreateSeriesModal
        open={!!editingSeries}
        series={editingSeries}
        onClose={() => setEditingSeries(null)}
        onSubmit={handleUpdateSeries}
      />

      <div
        className={`modal-overlay${deleteSeriesTarget ? ' open' : ''}`}
        onClick={closeDeleteSeries}
        role="dialog"
        aria-modal="true"
        aria-label="删除系列"
      >
        <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 430 }}>
          <div className="modal-header">
            <div className="modal-title">删除系列</div>
            <button type="button" className="modal-close" onClick={closeDeleteSeries} aria-label="关闭">✕</button>
          </div>
          <div className="modal-body">
            {deleteSeriesTarget && (
              <>
                <p style={{ margin: '0 0 8px' }}>
                  该系列下的所有册次将一并删除，且不可恢复。请输入系列名称{' '}
                  <strong>{deleteSeriesTarget.name}</strong> 以确认删除。
                </p>
                <input
                  className="form-input"
                  value={deleteSeriesConfirmText}
                  placeholder={deleteSeriesTarget.name}
                  onChange={(e) => setDeleteSeriesConfirmText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && deleteSeriesConfirmText === deleteSeriesTarget.name) {
                      e.preventDefault();
                      handleDeleteSeries();
                    }
                  }}
                  autoFocus
                />
              </>
            )}
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-ghost" onClick={closeDeleteSeries}>取消</button>
            <button
              type="button"
              className="btn btn-danger"
              disabled={!deleteSeriesTarget || deleteSeriesConfirmText !== deleteSeriesTarget.name}
              onClick={handleDeleteSeries}
            >
              确认删除
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

// 书籍编辑器组件
type LibraryMultilangPanelProps = {
  langTab: LangKey;
  onLangTabChange: (lang: LangKey) => void;
  valueByLang: TitleByLang;
  onChange: (lang: LangKey, value: string) => void;
  onAutoTranslate: () => void;
  placeholder?: string;
  hint?: ReactNode;
  sanitizeValue?: (value: string) => string;
  maxLength?: number;
  fieldHint?: string;
  /** 需点击确认后才写入书籍数据（便于多语言单独提交后端） */
  requireConfirm?: boolean;
  onConfirm?: (values: TitleByLang) => void;
  confirmHint?: string;
};

function titleByLangEqual(a: TitleByLang, b: TitleByLang) {
  return LANG_OPTIONS.every(({ key }) => (a[key] ?? '') === (b[key] ?? ''));
}

function LibraryMultilangPanel({
  langTab,
  onLangTabChange,
  valueByLang,
  onChange,
  onAutoTranslate,
  placeholder,
  hint,
  sanitizeValue,
  maxLength,
  fieldHint,
  requireConfirm = false,
  onConfirm,
  confirmHint = '确认后将写入本书数据，随整体保存提交后端',
}: LibraryMultilangPanelProps) {
  const [draftByLang, setDraftByLang] = useState<TitleByLang>(valueByLang);
  const displayByLang = requireConfirm ? draftByLang : valueByLang;
  const isDirty = requireConfirm && !titleByLangEqual(draftByLang, valueByLang);
  const savedKey = JSON.stringify(valueByLang);

  useEffect(() => {
    if (requireConfirm) setDraftByLang(valueByLang);
  }, [requireConfirm, savedKey, valueByLang]);

  const applyValue = (lang: LangKey, raw: string) => {
    const nextValue = sanitizeValue ? sanitizeValue(raw) : raw;
    if (requireConfirm) {
      setDraftByLang((prev) => ({ ...prev, [lang]: nextValue }));
      return;
    }
    onChange(lang, nextValue);
  };

  const handleAutoTranslate = () => {
    if (requireConfirm) {
      const seed = (draftByLang.CN ?? draftByLang[langTab] ?? '').trim();
      if (!seed) return;
      const next = autoTranslateTitleByLang(seed);
      const sanitized = sanitizeValue
        ? (Object.fromEntries(
            Object.entries(next).map(([key, val]) => [key, sanitizeValue(val ?? '')]),
          ) as TitleByLang)
        : next;
      setDraftByLang(sanitized);
      return;
    }
    onAutoTranslate();
  };

  const handleConfirm = () => {
    if (!requireConfirm || !onConfirm || !isDirty) return;
    onConfirm(draftByLang);
  };

  const currentValue = displayByLang[langTab] ?? '';
  return (
    <div className={`library-multilang-panel${isDirty ? ' is-dirty' : ''}`}>
      <div className="library-multilang-toolbar">
        <div className="library-multilang-tabs">
          {LANG_OPTIONS.map((o) => {
            const meta = LANG_TAB_META[o.key];
            return (
              <button
                key={o.key}
                type="button"
                className={`library-multilang-tab${langTab === o.key ? ' is-active' : ''}`}
                onClick={() => onLangTabChange(o.key)}
                aria-label={o.label}
              >
                <span className="library-multilang-tab-flag" aria-hidden>
                  {meta.flag}
                </span>
                <span className="library-multilang-tab-code">{meta.code}</span>
              </button>
            );
          })}
        </div>
        <button type="button" className="btn btn-secondary btn-sm" onClick={handleAutoTranslate}>
          自动翻译
        </button>
      </div>
      <input
        type="text"
        className="form-input"
        value={currentValue}
        maxLength={maxLength}
        onChange={(e) => applyValue(langTab, e.target.value)}
        placeholder={placeholder ?? `${LANG_OPTIONS.find((l) => l.key === langTab)?.label ?? langTab}`}
      />
      {hint}
      {fieldHint && (
        <div className="form-hint" style={{ marginTop: hint ? 8 : 0 }}>
          {fieldHint}
          {maxLength != null ? ` · ${currentValue.length}/${maxLength}` : ''}
        </div>
      )}
      {requireConfirm && (
        <div className="library-multilang-footer">
          <span className="form-hint library-multilang-confirm-hint">
            {isDirty ? '有未确认的多语言修改' : confirmHint}
          </span>
          <button
            type="button"
            className="btn btn-primary btn-sm"
            disabled={!isDirty}
            onClick={handleConfirm}
          >
            确认保存
          </button>
        </div>
      )}
    </div>
  );
}

type BookEditorProps = {
  book: Book;
  isNew?: boolean;
  seriesName?: string;
  resourceBundle: BookResourceBundle;
  globalFeatureTagsByCategory: Record<string, string[]>;
  onGlobalFeatureTagsChange: (next: Record<string, string[]>) => void;
  hiddenFeatureTagsByCategory: Record<string, string[]>;
  onHiddenFeatureTagsChange: (next: Record<string, string[]>) => void;
  onSave: (book: Book, resources: BookResourceBundle) => void;
  onCancel: () => void;
};

function BookEditor({
  book,
  isNew = false,
  seriesName,
  resourceBundle,
  globalFeatureTagsByCategory,
  onGlobalFeatureTagsChange,
  hiddenFeatureTagsByCategory,
  onHiddenFeatureTagsChange,
  onSave,
  onCancel,
}: BookEditorProps) {
  const [editedBook, setEditedBook] = useState<Book>(() => {
    const base = book.hskLevelMin
      ? book
      : (() => {
          const legacy = parseLegacyLevel((book as Book & { level?: string }).level ?? '');
          return { ...book, hskLevelMin: legacy.min, hskLevelMax: legacy.max };
        })();
    const titleByLang = resolveTitleByLang(base.title, base.titleEn, base.titleByLang);
    const volumeLabelByLang =
      base.volumeOrder > 0
        ? resolveTitleByLang(formatVolumeLabelCn(base.volumeOrder), undefined, base.volumeLabelByLang)
        : resolveTitleByLang('', undefined, base.volumeLabelByLang);
    const publisherByLang = resolveTitleByLang(base.publisher, undefined, base.publisherByLang);
    const legacyFormat = (base as Book & { format?: string }).format;
    const formats = base.formats ?? (legacyFormat ? [legacyFormat as BookFormat] : []);
    return {
      ...base,
      volumeOrder: isNew ? 0 : base.volumeOrder,
      formats,
      titleByLang,
      volumeLabelByLang,
      publisherByLang,
      title: titleByLang.CN ?? base.title,
      titleEn: titleByLang.EN ?? base.titleEn,
      version: base.version ?? '',
    };
  });
  const [activeTab, setActiveTab] = useState<'basic' | 'structure' | 'content' | 'resources'>('basic');
  const [bookUnits, setBookUnits] = useState<BookUnitRow[]>(() =>
    cloneBookResourceBundle(resourceBundle).units,
  );
  const [bookFiles, setBookFiles] = useState<BookFileResource[]>(() =>
    ensureBookFileResourceIds([...resourceBundle.files]),
  );
  const [fileTypeFilter, setFileTypeFilter] = useState<'all' | BookResourceType>('all');
  const [resourceMountUnit, setResourceMountUnit] = useState<BookUnitRow | null>(null);
  const [addBookResourceOpen, setAddBookResourceOpen] = useState(false);
  const [catalogImportOpen, setCatalogImportOpen] = useState(false);
  const [catalogImportFileName, setCatalogImportFileName] = useState('');
  const [catalogImportLoading, setCatalogImportLoading] = useState(false);
  const [catalogImportParsed, setCatalogImportParsed] = useState<ParsedCatalogUnit[] | null>(null);
  const [editorToast, setEditorToast] = useState<string | null>(null);
  const [fileToRemove, setFileToRemove] = useState<BookFileResource | null>(null);
  const [fileToEditPage, setFileToEditPage] = useState<BookFileResource | null>(null);
  const [mediaMappingImportOpen, setMediaMappingImportOpen] = useState(false);
  const [mediaMappingImportFileName, setMediaMappingImportFileName] = useState('');
  const [mediaMappingImportLoading, setMediaMappingImportLoading] = useState(false);
  const [mediaMappingImportParsed, setMediaMappingImportParsed] = useState<ParsedMultiMediaMappingRow[] | null>(null);
  const mediaMappingImportInputRef = useRef<HTMLInputElement>(null);
  const catalogImportInputRef = useRef<HTMLInputElement>(null);
  const [titleLangTab, setTitleLangTab] = useState<LangKey>('CN');
  const [volumeLangTab, setVolumeLangTab] = useState<LangKey>('CN');
  const [customVolumeOptions, setCustomVolumeOptions] = useState<CustomVolumeOption[]>(() =>
    buildInitialCustomVolumeOptions(book),
  );
  const [hiddenVolumeOrders, setHiddenVolumeOrders] = useState<number[]>(() => book.hiddenVolumeOrders ?? []);
  const [publisherLangTab, setPublisherLangTab] = useState<LangKey>('CN');
  const [customPublishersByCategory, setCustomPublishersByCategory] = useState<Record<string, string[]>>(() =>
    buildInitialCustomPublishersByCategory(book),
  );
  const [customPublisherCategories, setCustomPublisherCategories] = useState<string[]>(() =>
    buildInitialCustomPublisherCategories(book),
  );
  const [hiddenPublishers, setHiddenPublishers] = useState<string[]>(() => book.hiddenPublishers ?? []);
  const [authorsInput, setAuthorsInput] = useState(() => sanitizeAuthorsInput(book.authors.join(', ')));
  const [newPublisherCategory, setNewPublisherCategory] = useState('');
  const [newPublisherParentName, setNewPublisherParentName] = useState('');
  const publisherGroups = useMemo(() => publishersByCategory(), []);
  const publisherCategoryOptions = useMemo(
    () => collectPublisherCategoryOptions(customPublisherCategories, customPublishersByCategory),
    [customPublisherCategories, customPublishersByCategory],
  );
  const mergedPublisherGroups = useMemo(
    () => mergePublisherGroups(publisherGroups, customPublishersByCategory),
    [publisherGroups, customPublishersByCategory],
  );
  const publisherSelectGroups = useMemo(
    () =>
      [...mergedPublisherGroups.entries()]
        .map(([label, pubs]) => ({
          label,
          options: pubs
            .filter((p) => !hiddenPublishers.includes(p.name))
            .map((p) => ({ value: p.name, label: p.name })),
        }))
        .filter((group) => group.options.length > 0),
    [mergedPublisherGroups, hiddenPublishers],
  );

  const volumeSelectOptions = useMemo(
    () => buildVolumeSelectOptions(hiddenVolumeOrders, customVolumeOptions),
    [hiddenVolumeOrders, customVolumeOptions],
  );

  const selectedPublisher = PUBLISHERS.find((p) => p.name === editedBook.publisher);

  const addCustomPublisherCategory = () => {
    const name = newPublisherParentName.trim();
    if (!name) return;
    if (!PUBLISHER_CATEGORIES.includes(name) && !customPublisherCategories.includes(name)) {
      setCustomPublisherCategories((prev) => [...prev, name]);
    }
    setNewPublisherCategory(name);
    setNewPublisherParentName('');
  };

  const addCustomPublisher = (name: string) => {
    const trimmed = name.trim();
    const category = newPublisherCategory.trim();
    if (!trimmed || !category) return;
    const knownNames = new Set([
      ...PUBLISHERS.map((p) => p.name),
      ...Object.values(customPublishersByCategory).flat(),
    ]);
    if (knownNames.has(trimmed)) {
      handlePublisherChange(trimmed);
      return;
    }
    setCustomPublishersByCategory((prev) => {
      const list = prev[category] ?? [];
      if (list.includes(trimmed)) return prev;
      return { ...prev, [category]: [...list, trimmed] };
    });
    setEditedBook((prev) => ({
      ...prev,
      publisher: trimmed,
      publisherByLang: {
        ...(prev.publisherByLang ?? resolveTitleByLang(prev.publisher)),
        CN: trimmed,
      },
    }));
  };

  const isCustomPublisher = (name: string) =>
    Object.values(customPublishersByCategory).some((list) => list.includes(name));

  const removePublisher = (name: string) => {
    if (isCustomPublisher(name)) {
      setCustomPublishersByCategory((prev) => {
        const next = { ...prev };
        for (const cat of Object.keys(next)) {
          next[cat] = next[cat].filter((n) => n !== name);
          if (next[cat].length === 0) delete next[cat];
        }
        return next;
      });
    } else {
      setHiddenPublishers((prev) => (prev.includes(name) ? prev : [...prev, name]));
    }
    if (editedBook.publisher === name) {
      setEditedBook((prev) => ({
        ...prev,
        publisher: '',
        publisherByLang: resolveTitleByLang(''),
      }));
    }
  };

  const selectFeatureTag = (tag: string) => {
    if (!tag) return;
    setEditedBook((prev) => ({
      ...prev,
      features: prev.features.includes(tag) ? prev.features : [...prev.features, tag],
    }));
  };

  const removeBookFeatureTag = (tag: string) => {
    setEditedBook((prev) => ({
      ...prev,
      features: prev.features.filter((f) => f !== tag),
    }));
  };

  const removeFeatureTag = (category: string, tag: string) => {
    const presetTags = FEATURE_CATEGORIES.find((c) => c.category === category)?.tags ?? [];
    const isCustom = (globalFeatureTagsByCategory[category] ?? []).includes(tag);

    if (isCustom) {
      onGlobalFeatureTagsChange({
        ...globalFeatureTagsByCategory,
        [category]: (globalFeatureTagsByCategory[category] ?? []).filter((t) => t !== tag),
      });
    } else if (presetTags.includes(tag)) {
      onHiddenFeatureTagsChange({
        ...hiddenFeatureTagsByCategory,
        [category]: [...new Set([...(hiddenFeatureTagsByCategory[category] ?? []), tag])],
      });
    }

    removeBookFeatureTag(tag);
  };

  const addGlobalFeatureTag = (category: string, tag: string) => {
    const sanitized = sanitizeFeatureTagInput(tag);
    if (!sanitized) return;

    const presetTags = FEATURE_CATEGORIES.find((c) => c.category === category)?.tags ?? [];
    const existingTags = getFeatureTagsForCategory(
      category,
      presetTags,
      globalFeatureTagsByCategory,
      hiddenFeatureTagsByCategory,
    );
    if (existingTags.includes(sanitized)) {
      setEditedBook((prev) => ({
        ...prev,
        features: prev.features.includes(sanitized) ? prev.features : [...prev.features, sanitized],
      }));
      return;
    }

    onGlobalFeatureTagsChange({
      ...globalFeatureTagsByCategory,
      [category]: [...(globalFeatureTagsByCategory[category] ?? []), sanitized],
    });
    setEditedBook((prev) => ({
      ...prev,
      features: prev.features.includes(sanitized) ? prev.features : [...prev.features, sanitized],
    }));
  };

  const renderPublisherAddExtras = () => (
    <div className="library-inline-add-extras">
      <select
        className="form-input form-select"
        value={newPublisherCategory}
        onChange={(e) => setNewPublisherCategory(e.target.value)}
      >
        <option value="">选择父级目录</option>
        {publisherCategoryOptions.map((cat) => (
          <option key={cat} value={cat}>{cat}</option>
        ))}
      </select>
      <div className="library-inline-add-extras-row">
        <input
          type="text"
          className="form-input"
          placeholder="新父级目录名称"
          value={newPublisherParentName}
          onChange={(e) => setNewPublisherParentName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addCustomPublisherCategory())}
        />
        <button type="button" className="btn btn-secondary btn-sm" onClick={addCustomPublisherCategory}>
          + 目录
        </button>
      </div>
    </div>
  );

  const updateHskRange = (field: 'hskLevelMin' | 'hskLevelMax', value: string) => {
    setEditedBook((prev) => ({ ...prev, [field]: value }));
  };

  const titleByLang = editedBook.titleByLang ?? resolveTitleByLang(editedBook.title, editedBook.titleEn);
  const volumeLabelByLang =
    editedBook.volumeLabelByLang ?? resolveTitleByLang(formatVolumeLabelCn(editedBook.volumeOrder));
  const publisherByLang =
    editedBook.publisherByLang ?? resolveTitleByLang(editedBook.publisher);

  const updateTitleByLang = (lang: LangKey, value: string) => {
    const next = { ...titleByLang, [lang]: sanitizeTitleName(value) };
    setEditedBook((prev) => ({
      ...prev,
      titleByLang: next,
      title: next.CN ?? prev.title,
      titleEn: next.EN ?? '',
    }));
  };

  const runAutoTranslateTitle = () => {
    const seed = (titleByLang.CN ?? titleByLang[titleLangTab] ?? editedBook.title).trim();
    if (!seed) return;
    const next = autoTranslateTitleByLang(seed);
    const sanitized = Object.fromEntries(
      Object.entries(next).map(([key, val]) => [key, sanitizeTitleName(val ?? '')]),
    ) as TitleByLang;
    setEditedBook((prev) => ({
      ...prev,
      titleByLang: sanitized,
      title: sanitized.CN ?? prev.title,
      titleEn: sanitized.EN ?? '',
    }));
  };

  const updateVolumeLabelByLang = (lang: LangKey, value: string) => {
    const next = { ...volumeLabelByLang, [lang]: value };
    setEditedBook((prev) => ({ ...prev, volumeLabelByLang: next }));
  };

  const runAutoTranslateVolume = () => {
    const seed = (
      volumeLabelByLang.CN ??
      volumeLabelByLang[volumeLangTab] ??
      formatVolumeLabelCn(editedBook.volumeOrder)
    ).trim();
    if (!seed) return;
    const next = autoTranslateTitleByLang(seed);
    setEditedBook((prev) => ({ ...prev, volumeLabelByLang: next }));
  };

  const updatePublisherByLang = (lang: LangKey, value: string) => {
    const next = { ...publisherByLang, [lang]: value };
    setEditedBook((prev) => ({
      ...prev,
      publisherByLang: next,
      publisher: lang === 'CN' ? value : prev.publisher,
    }));
  };

  const runAutoTranslatePublisher = () => {
    const seed = (publisherByLang.CN ?? publisherByLang[publisherLangTab] ?? editedBook.publisher).trim();
    if (!seed) return;
    const next = autoTranslateTitleByLang(seed);
    setEditedBook((prev) => ({
      ...prev,
      publisherByLang: next,
      publisher: next.CN ?? prev.publisher,
    }));
  };

  const handleVolumeOrderChange = (volumeOrder: number) => {
    const custom = customVolumeOptions.find((item) => item.order === volumeOrder);
    const cnLabel = custom?.label ?? formatVolumeLabelCn(volumeOrder);
    setEditedBook((prev) => ({
      ...prev,
      volumeOrder,
      volumeLabelByLang: {
        ...(prev.volumeLabelByLang ?? resolveTitleByLang(formatVolumeLabelCn(prev.volumeOrder))),
        CN: cnLabel,
      },
    }));
  };

  const addCustomVolume = (label: string) => {
    const trimmed = sanitizeTitleName(label);
    if (!trimmed) return;
    const maxOrder = Math.max(
      12,
      editedBook.volumeOrder,
      ...customVolumeOptions.map((item) => item.order),
    );
    const nextOrder = maxOrder + 1;
    setCustomVolumeOptions((prev) => [...prev, { order: nextOrder, label: trimmed }]);
    setEditedBook((prev) => ({
      ...prev,
      volumeOrder: nextOrder,
      volumeLabelByLang: {
        ...(prev.volumeLabelByLang ?? resolveTitleByLang(formatVolumeLabelCn(prev.volumeOrder))),
        CN: trimmed,
      },
    }));
  };

  const removeVolumeOption = (value: string) => {
    const order = Number(value);
    if (!Number.isFinite(order) || order <= 0) return;

    const nextHidden =
      isPresetVolumeOrder(order) && !hiddenVolumeOrders.includes(order)
        ? [...hiddenVolumeOrders, order]
        : hiddenVolumeOrders;
    const nextCustom = isPresetVolumeOrder(order)
      ? customVolumeOptions
      : customVolumeOptions.filter((item) => item.order !== order);

    if (isPresetVolumeOrder(order)) {
      setHiddenVolumeOrders(nextHidden);
    } else {
      setCustomVolumeOptions(nextCustom);
    }

    if (editedBook.volumeOrder !== order) return;

    const remaining = buildVolumeSelectOptions(nextHidden, nextCustom);
    if (remaining.length === 0) {
      setEditedBook((prev) => ({
        ...prev,
        volumeOrder: 0,
        volumeLabelByLang: resolveTitleByLang(''),
      }));
      return;
    }
    handleVolumeOrderChange(Number(remaining[0].value));
  };

  const handlePublisherChange = (publisher: string) => {
    setEditedBook((prev) => ({
      ...prev,
      publisher,
      publisherByLang: {
        ...(prev.publisherByLang ?? resolveTitleByLang(prev.publisher)),
        CN: publisher,
      },
    }));
  };

  const handleSave = () => {
    if (!editedBook.publisher || editedBook.features.length === 0) return;
    if (!editedBook.isbn.trim() || !editedBook.version.trim()) return;
    if (!editedBook.coverUrl?.trim()) {
      showEditorToast('请选择书籍封面');
      return;
    }
    const parsedAuthors = parseAuthorsInput(authorsInput);
    if (parsedAuthors.length === 0) return;
    const invalidMedia = bookFiles.find(
      (file) =>
        bookResourceNeedsPageNum(file.type) &&
        !isBookResourcePageValid(file.type, file.pageCode, file.frameNum),
    );
    if (invalidMedia) {
      showEditorToast(`请为多媒体「${invalidMedia.fileName}」配置页面编号`);
      return;
    }
    const resolved = resolveTitleByLang(editedBook.title, editedBook.titleEn, editedBook.titleByLang);
    const resolvedTitleByLang = Object.fromEntries(
      Object.entries(resolved).map(([key, val]) => [key, sanitizeTitleName(val ?? '')]),
    ) as TitleByLang;
    const volumeCnSeed =
      editedBook.volumeOrder > 0
        ? (customVolumeOptions.find((item) => item.order === editedBook.volumeOrder)?.label ??
          formatVolumeLabelCn(editedBook.volumeOrder))
        : '';
    const resolvedVolume = resolveTitleByLang(volumeCnSeed, undefined, editedBook.volumeLabelByLang);
    const resolvedPublisher = resolveTitleByLang(editedBook.publisher, undefined, editedBook.publisherByLang);
    const resources: BookResourceBundle = {
      units: bookUnits,
      files: bookFiles,
    };
    onSave(
      {
        ...editedBook,
        titleByLang: resolvedTitleByLang,
        volumeLabelByLang: resolvedVolume,
        publisherByLang: resolvedPublisher,
        customPublishersByCategory,
        hiddenPublishers,
        title: resolvedTitleByLang.CN?.trim() || editedBook.title,
        titleEn: resolvedTitleByLang.EN?.trim() || '',
        publisher: resolvedPublisher.CN?.trim() || editedBook.publisher,
        isbn: sanitizeIsbn(editedBook.isbn),
        version: sanitizeVersion(editedBook.version),
        authors: parsedAuthors,
        description: sanitizeDescription(editedBook.description),
        customVolumeOptions,
        hiddenVolumeOrders,
      },
      resources,
    );
  };

  const openUnitResourceMount = (unit: BookUnitRow) => {
    setResourceMountUnit({
      ...unit,
      mounted: cloneMounted(unit.mounted),
      lessons: unit.lessons.map((l) => ({ ...l, resources: { ...l.resources } })),
    });
  };

  const saveUnitResourceMount = (unit: BookUnitRow) => {
    setBookUnits((prev) => prev.map((u) => (u.id === unit.id ? unit : u)));
    setResourceMountUnit(null);
  };

  const filteredBookFiles = bookFiles.filter((file) => {
    if (fileTypeFilter === 'all') return true;
    return normalizeBookResourceType(file.type) === fileTypeFilter;
  });

  const handleAddBookResources = (files: BookFileResource[]) => {
    setBookFiles((prev) => [...prev, ...files]);
    setAddBookResourceOpen(false);
  };

  const handleUpdateBookFilePageMapping = (
    fileId: string,
    patch: Pick<BookFileResource, 'pageCode' | 'frameNum'>,
  ) => {
    setBookFiles((prev) =>
      prev.map((file) => (file.id === fileId ? { ...file, ...patch } : file)),
    );
  };

  const showEditorToast = (msg: string) => {
    setEditorToast(msg);
    window.setTimeout(() => setEditorToast(null), 2200);
  };

  const catalogImportLessonCount = useMemo(
    () => catalogImportParsed?.reduce((sum, unit) => sum + unit.lessons.length, 0) ?? 0,
    [catalogImportParsed],
  );

  const openCatalogImportModal = () => {
    setCatalogImportFileName('');
    setCatalogImportParsed(null);
    setCatalogImportLoading(false);
    setCatalogImportOpen(true);
  };

  const closeCatalogImportModal = () => {
    setCatalogImportOpen(false);
    setCatalogImportFileName('');
    setCatalogImportParsed(null);
    setCatalogImportLoading(false);
  };

  const handleCatalogImportFile = async (file?: File) => {
    if (!file || catalogImportLoading) return;
    const validation = validateCatalogImportFile(file);
    if (!validation.ok) {
      showEditorToast(validation.message);
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      showEditorToast('文件大小不能超过 10MB');
      return;
    }
    setCatalogImportLoading(true);
    setCatalogImportParsed(null);
    setCatalogImportFileName('');
    try {
      const buffer = await file.arrayBuffer();
      const parsed = parseCatalogWorkbook(buffer, { bookTitle: editedBook.title });
      setCatalogImportFileName(file.name);
      setCatalogImportParsed(parsed);
    } catch {
      setCatalogImportParsed(null);
      setCatalogImportFileName('');
      showEditorToast('上传失败，请重新上传');
    } finally {
      setCatalogImportLoading(false);
    }
  };

  const confirmCatalogImport = () => {
    if (!catalogImportParsed?.length) return;
    const units = buildBookUnitsFromCatalog(catalogImportParsed, bookUnits);
    setBookUnits(units);
    closeCatalogImportModal();
    showEditorToast(
      `上传成功，已导入 ${catalogImportParsed.length} 个单元、${catalogImportLessonCount} 课`,
    );
  };

  const openMediaMappingImportModal = () => {
    setMediaMappingImportFileName('');
    setMediaMappingImportParsed(null);
    setMediaMappingImportLoading(false);
    setMediaMappingImportOpen(true);
  };

  const closeMediaMappingImportModal = () => {
    setMediaMappingImportOpen(false);
    setMediaMappingImportFileName('');
    setMediaMappingImportParsed(null);
    setMediaMappingImportLoading(false);
  };

  const handleMediaMappingImportFile = async (file?: File) => {
    if (!file || mediaMappingImportLoading) return;
    const validation = validateMultiMediaMappingImportFile(file);
    if (!validation.ok) {
      showEditorToast(validation.message);
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      showEditorToast('文件不能超过 10MB');
      return;
    }

    setMediaMappingImportLoading(true);
    setMediaMappingImportFileName(file.name);
    setMediaMappingImportParsed(null);
    try {
      const buffer = await file.arrayBuffer();
      const parsed = parseMultiMediaMappingWorkbook(buffer);
      if (!parsed.ok) {
        showEditorToast(parsed.message);
        setMediaMappingImportFileName('');
        return;
      }
      setMediaMappingImportParsed(parsed.rows);
    } catch {
      showEditorToast('解析失败，请检查表格格式');
      setMediaMappingImportFileName('');
    } finally {
      setMediaMappingImportLoading(false);
    }
  };

  const confirmMediaMappingImport = () => {
    if (!mediaMappingImportParsed?.length) return;
    const result = applyMultiMediaMappings(mediaMappingImportParsed, bookFiles, {
      bookIsbn: editedBook.isbn,
      bookTitle: editedBook.title,
    });
    setBookFiles(result.files);
    closeMediaMappingImportModal();
    const skipHint = result.skipped.length > 0 ? `，跳过 ${result.skipped.length} 条` : '';
    showEditorToast(`导入完成，已更新 ${result.updated} 条页面编号与 Frame${skipHint}`);
  };

  const handleExportMediaMapping = () => {
    const mediaCount = downloadMultiMediaMappingWorkbook(bookFiles, {
      bookTitle: (titleByLang.CN ?? editedBook.title).trim() || editedBook.title,
      isbn: editedBook.isbn,
    });
    if (mediaCount === 0) {
      showEditorToast('请先添加多媒体（.mp4）资源');
      return;
    }
    showEditorToast(`已导出 ${mediaCount} 条多媒体映射，请填写「页码」与「按钮编号」后导入`);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 56px)' }}>
      {/* 顶部操作栏 */}
      <div className="config-header">
        <div className="config-header-top">
          <h1>
            <button 
              type="button" 
              className="back-btn"
              onClick={onCancel}
            >
              ← 返回
            </button>
            <span>
              {isNew ? '新增数据' : `编辑书籍：${book.title}`}
              {seriesName && editedBook.volumeOrder > 0 && (
                <span style={{ fontSize: '14px', fontWeight: 400, color: 'var(--ink-light)', marginLeft: 8 }}>
                  · {seriesName} 第 {editedBook.volumeOrder} 册
                </span>
              )}
            </span>
          </h1>
          {activeTab === 'basic' && (
            <div style={{ display: 'flex', gap: '8px' }}>
              <button 
                type="button" 
                className="btn btn-secondary btn-sm"
                onClick={onCancel}
              >
                取消
              </button>
              <button 
                type="button" 
                className="btn btn-primary btn-sm"
                onClick={handleSave}
                disabled={
                  !editedBook.publisher ||
                  editedBook.features.length === 0 ||
                  !(titleByLang.CN ?? editedBook.title).trim() ||
                  !editedBook.isbn.trim() ||
                  !editedBook.version.trim() ||
                  !editedBook.coverUrl?.trim() ||
                  parseAuthorsInput(authorsInput).length === 0
                }
              >
                💾 保存
              </button>
            </div>
          )}
        </div>

        {/* 标签页 */}
        <div className="type-tabs" role="tablist" aria-label="书籍编辑">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'basic'}
            className={`type-tab ${activeTab === 'basic' ? 'active' : ''}`}
            onClick={() => setActiveTab('basic')}
          >
            📚 基本信息
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'content'}
            className={`type-tab ${activeTab === 'content' ? 'active' : ''}`}
            onClick={() => setActiveTab('content')}
          >
            📋 内容管理
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'structure'}
            className={`type-tab ${activeTab === 'structure' ? 'active' : ''}`}
            onClick={() => setActiveTab('structure')}
          >
            📑 结构配置
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'resources'}
            className={`type-tab ${activeTab === 'resources' ? 'active' : ''}`}
            onClick={() => setActiveTab('resources')}
          >
            📝 资源挂载
          </button>
        </div>
      </div>

      {/* 内容区域：各 Tab 保持挂载，仅切换可见性，避免切换后内容丢失 */}
      <div className="config-body" style={{ flex: 1, overflow: 'auto' }}>
        <div className={`config-tab-panel ${activeTab === 'basic' ? 'active' : ''}`} role="tabpanel" hidden={activeTab !== 'basic'}>
            <div className="config-section">
              <div className="section-title">📖 书籍基本信息</div>
              
              <div className="form-group">
                <label>书名（多语言）<span className="required">*</span></label>
                <LibraryMultilangPanel
                  langTab={titleLangTab}
                  onLangTabChange={setTitleLangTab}
                  valueByLang={titleByLang}
                  onChange={updateTitleByLang}
                  onAutoTranslate={runAutoTranslateTitle}
                  sanitizeValue={sanitizeTitleName}
                  maxLength={LIBRARY_FIELD_LIMITS.title}
                  fieldHint={LIBRARY_FIELD_HINTS.title}
                  placeholder={`${LANG_OPTIONS.find((l) => l.key === titleLangTab)?.label ?? titleLangTab}书名`}
                  hint={
                    titleLangTab === 'CN' && !(titleByLang.CN ?? '').trim() ? (
                      <div className="form-hint" style={{ color: 'var(--rose)', marginTop: 8 }}>中文书名为必填项</div>
                    ) : undefined
                  }
                />
              </div>

              <div className="form-group">
                <label>册次</label>
                <LibraryInlineAddSelect
                  value={editedBook.volumeOrder > 0 ? String(editedBook.volumeOrder) : ''}
                  placeholder="请选择册次"
                  options={volumeSelectOptions}
                  addLabel="+ 新建册次"
                  addPlaceholder="输入册次名称，如 第 13 册"
                  onSelect={(value) => handleVolumeOrderChange(Number(value))}
                  onAdd={addCustomVolume}
                  sanitizeAdd={sanitizeTitleName}
                  maxLength={LIBRARY_FIELD_LIMITS.title}
                  addHint={LIBRARY_FIELD_HINTS.title}
                  canDeleteOption={() => true}
                  onDeleteOption={removeVolumeOption}
                  deleteConfirmHint={(label) => (
                    <>请输入 <strong>{label}</strong> 以确认删除该册次选项，此操作不可恢复。</>
                  )}
                  style={{ maxWidth: 360, marginBottom: 10 }}
                />
                <LibraryMultilangPanel
                  langTab={volumeLangTab}
                  onLangTabChange={setVolumeLangTab}
                  valueByLang={volumeLabelByLang}
                  onChange={updateVolumeLabelByLang}
                  onAutoTranslate={runAutoTranslateVolume}
                  requireConfirm
                  onConfirm={(next) => {
                    setEditedBook((prev) => ({ ...prev, volumeLabelByLang: next }));
                    showEditorToast('册次多语言已确认，保存书籍时将提交后端');
                  }}
                  confirmHint="选定册次后在此维护各语言译名；编辑或自动翻译后请点击确认保存"
                  placeholder={`${LANG_OPTIONS.find((l) => l.key === volumeLangTab)?.label ?? volumeLangTab}册次译名`}
                />
              </div>

              <div className="form-group">
                <label>封面配置<span className="required">*</span></label>
                <BookCoverConfig
                  coverUrl={editedBook.coverUrl}
                  coverImageId={editedBook.coverImageId}
                  required
                  onChange={({ coverUrl, coverImageId }) =>
                    setEditedBook((prev) => ({ ...prev, coverUrl, coverImageId }))
                  }
                />
              </div>

              <div className="form-group">
                <label>出版社<span className="required">*</span></label>
                <LibraryInlineAddSelect
                  value={editedBook.publisher}
                  placeholder="请选择出版社"
                  groups={publisherSelectGroups}
                  addLabel="+ 新建出版社"
                  addPlaceholder="输入出版社名称"
                  onSelect={handlePublisherChange}
                  onAdd={addCustomPublisher}
                  canConfirmAdd={(name) => !!name.trim() && !!newPublisherCategory.trim()}
                  renderAddExtras={renderPublisherAddExtras}
                  canDeleteOption={() => true}
                  onDeleteOption={removePublisher}
                  deleteConfirmHint={(label) => (
                    <>请输入 <strong>{label}</strong> 以确认删除该出版社，此操作不可恢复。</>
                  )}
                  style={{ marginBottom: 10 }}
                />
                {selectedPublisher?.representativeBooks && (
                  <div className="form-hint" style={{ marginBottom: 10 }}>
                    代表系列：{selectedPublisher.representativeBooks}
                  </div>
                )}
                <LibraryMultilangPanel
                  langTab={publisherLangTab}
                  onLangTabChange={setPublisherLangTab}
                  valueByLang={publisherByLang}
                  onChange={updatePublisherByLang}
                  onAutoTranslate={runAutoTranslatePublisher}
                  requireConfirm
                  onConfirm={(next) => {
                    setEditedBook((prev) => ({
                      ...prev,
                      publisherByLang: next,
                      publisher: next.CN?.trim() || prev.publisher,
                    }));
                    showEditorToast('出版社多语言已确认，保存书籍时将提交后端');
                  }}
                  confirmHint="编辑或自动翻译后，请点击确认保存再提交后端"
                  placeholder={`${LANG_OPTIONS.find((l) => l.key === publisherLangTab)?.label ?? publisherLangTab}出版社名称`}
                  hint={
                    publisherLangTab === 'CN' && !editedBook.publisher ? (
                      <div className="form-hint" style={{ color: 'var(--rose)', marginTop: 8 }}>请先选择或添加出版社</div>
                    ) : undefined
                  }
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>ISBN<span className="required">*</span></label>
                  <input
                    type="text"
                    value={editedBook.isbn}
                    maxLength={LIBRARY_FIELD_LIMITS.isbn}
                    onChange={(e) => setEditedBook({ ...editedBook, isbn: sanitizeIsbn(e.target.value) })}
                  />
                  <div className="form-hint">
                    {LIBRARY_FIELD_HINTS.isbn} · {editedBook.isbn.length}/{LIBRARY_FIELD_LIMITS.isbn}
                  </div>
                </div>
                <div className="form-group">
                  <label>版本号<span className="required">*</span></label>
                  <input
                    type="text"
                    value={editedBook.version}
                    maxLength={LIBRARY_FIELD_LIMITS.version}
                    placeholder="如 1.0"
                    onChange={(e) =>
                      setEditedBook({ ...editedBook, version: sanitizeVersion(e.target.value) })
                    }
                  />
                  <div className="form-hint">
                    {LIBRARY_FIELD_HINTS.version} · {editedBook.version.length}/{LIBRARY_FIELD_LIMITS.version}
                  </div>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>最低级别<span className="required">*</span></label>
                  <select
                    className="form-input form-select"
                    value={editedBook.hskLevelMin}
                    onChange={(e) => updateHskRange('hskLevelMin', e.target.value)}
                  >
                    {[...new Set(EXTENDED_LEVEL_OPTIONS.map((o) => o.category))].map((category) => (
                      <optgroup key={category} label={category}>
                        {EXTENDED_LEVEL_OPTIONS.filter((o) => o.category === category).map((opt) => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>最高级别<span className="required">*</span></label>
                  <select
                    className="form-input form-select"
                    value={editedBook.hskLevelMax}
                    onChange={(e) => updateHskRange('hskLevelMax', e.target.value)}
                  >
                    {[...new Set(EXTENDED_LEVEL_OPTIONS.map((o) => o.category))].map((category) => (
                      <optgroup key={category} label={category}>
                        {EXTENDED_LEVEL_OPTIONS.filter((o) => o.category === category).map((opt) => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>适用级别预览</label>
                  <div className="library-level-preview">{bookLevel(editedBook)}</div>
                </div>
              </div>

              <div className="form-group">
                <label>功能模块标签<span className="required">*</span></label>
                <div className="form-hint" style={{ marginBottom: 12 }}>
                  标签为全库共用；在此新增后，所有书籍的下拉选项中均可见。
                </div>
                <div className="library-feature-picker">
                  {FEATURE_CATEGORIES.map((cat) => {
                    const allTags = getFeatureTagsForCategory(
                      cat.category,
                      cat.tags,
                      globalFeatureTagsByCategory,
                      hiddenFeatureTagsByCategory,
                    );
                    const selectedInCategory = editedBook.features.filter((tag) => allTags.includes(tag));
                    return (
                      <div key={cat.category} className="library-feature-category-block">
                        <div className="library-feature-group-title">{cat.category}</div>
                        <LibraryInlineAddSelect
                          value=""
                          placeholder="请选择标签"
                          options={allTags.map((tag) => ({ value: tag, label: tag }))}
                          addLabel="+ 新建标签"
                          addPlaceholder={`输入${cat.category}标签`}
                          onSelect={selectFeatureTag}
                          onAdd={(tag) => addGlobalFeatureTag(cat.category, tag)}
                          sanitizeAdd={sanitizeFeatureTagInput}
                          maxLength={LIBRARY_FIELD_LIMITS.featureTag}
                          canDeleteOption={() => true}
                          onDeleteOption={(tag) => removeFeatureTag(cat.category, tag)}
                          deleteConfirmHint={(label) => (
                            <>请输入 <strong>{label}</strong> 以确认删除该标签，此操作对全库生效且不可恢复。</>
                          )}
                          addHint={
                            <>
                              {LIBRARY_FIELD_HINTS.featureTag} · 全库共用
                            </>
                          }
                          style={{ marginBottom: 10 }}
                        />
                        {selectedInCategory.length > 0 && (
                          <div className="library-feature-selected-tags">
                            {selectedInCategory.map((tag) => (
                              <span key={tag} className="library-feature-selected-tag">
                                {tag}
                                <button
                                  type="button"
                                  className="library-feature-selected-tag-remove"
                                  aria-label={`移除 ${tag}`}
                                  onClick={() => removeBookFeatureTag(tag)}
                                >
                                  ×
                                </button>
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
                {editedBook.features.length === 0 && (
                  <div className="form-hint" style={{ color: 'var(--rose)' }}>请至少选择一个功能模块标签</div>
                )}
              </div>

              <div className="form-group">
                <label>作者/主编<span className="required">*</span></label>
                <input
                  type="text"
                  value={authorsInput}
                  maxLength={LIBRARY_FIELD_LIMITS.authors}
                  onChange={(e) => setAuthorsInput(sanitizeAuthorsInput(e.target.value))}
                  placeholder="多个作者用逗号分隔"
                />
                <div className="form-hint">
                  {LIBRARY_FIELD_HINTS.authors} · {authorsInput.length}/{LIBRARY_FIELD_LIMITS.authors}
                </div>
              </div>

              <div className="form-group">
                <label>书籍描述</label>
                <textarea
                  value={editedBook.description}
                  maxLength={LIBRARY_FIELD_LIMITS.description}
                  onChange={(e) => setEditedBook({ ...editedBook, description: sanitizeDescription(e.target.value) })}
                  rows={3}
                  placeholder="简要描述书籍特点、适用人群等..."
                />
                <div className="form-hint">
                  {LIBRARY_FIELD_HINTS.description} · {editedBook.description.length}/{LIBRARY_FIELD_LIMITS.description}
                </div>
              </div>
            </div>
        </div>

        <div className={`config-tab-panel ${activeTab === 'structure' ? 'active' : ''}`} role="tabpanel" hidden={activeTab !== 'structure'}>
          <div className="config-section">
            <div className="section-title">
              <span>📑 单元列表</span>
            </div>

            <div className="paper-table-container" style={{ marginTop: '16px' }}>
              <table className="paper-table">
                <thead>
                  <tr>
                    <th style={{ minWidth: '140px' }}>单元</th>
                    <th style={{ minWidth: '120px' }}>有声阅读</th>
                    <th style={{ minWidth: '120px' }}>文化视频</th>
                    <th style={{ minWidth: '120px' }}>情景视频</th>
                    <th style={{ minWidth: '120px' }}>交际训练</th>
                    <th style={{ minWidth: '120px' }}>测试卷</th>
                    <th style={{ minWidth: '120px' }}>文化点读</th>
                    <th style={{ minWidth: '160px' }}>操作</th>
                  </tr>
                </thead>
                <tbody>
                  {bookUnits.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="library-chapter-empty">
                        暂无单元配置
                      </td>
                    </tr>
                  ) : (
                    bookUnits.map((unit) => (
                      <tr key={unit.id}>
                        <td>
                          <div className="library-unit-link" style={{ cursor: 'default' }}>
                            {unit.title}
                            {unit.lessons.length > 0 && (
                              <span className="library-unit-lesson-count">{unit.lessons.length} 课</span>
                            )}
                          </div>
                        </td>
                        <td><ResourceIdCell ids={unit.mounted.audioReading} /></td>
                        <td><ResourceIdCell ids={unit.mounted.cultureVideo} /></td>
                        <td><ResourceIdCell ids={unit.mounted.sceneVideo ?? []} /></td>
                        <td><ResourceIdCell ids={unit.mounted.communTraining ?? []} /></td>
                        <td><ResourceIdCell ids={unit.mounted.exam} /></td>
                        <td><ResourceIdCell ids={unit.mounted.cultureRead} /></td>
                        <td className="library-action-cell">
                          <button type="button" className="btn btn-primary btn-sm" onClick={() => openUnitResourceMount(unit)}>配置资源</button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="library-info-box" style={{ marginTop: '16px' }}>
              <div className="library-info-box-icon">💡</div>
              <div>
                <div className="library-info-box-title">单元级资源配置</div>
                <div className="library-info-box-text">
                  测试卷、有声阅读、文化视频、情景视频、交际训练、文化点读等资源需要在单元级别配置。点击「配置资源」为单元挂载对应资源。
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className={`config-tab-panel ${activeTab === 'content' ? 'active' : ''}`} role="tabpanel" hidden={activeTab !== 'content'}>
          <div className="config-section">
            <div className="section-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>📋 内容管理</span>
              <button type="button" className="btn btn-primary btn-sm" onClick={openCatalogImportModal}>
                📥 导入教材目录
              </button>
            </div>
            {bookUnits.length === 0 ? (
              <div className="library-chapter-empty">点击「导入教材目录」上传 Excel，自动生成单元与课程</div>
            ) : (
              <div className="library-content-tree">
                {bookUnits.map((unit) => (
                  <div key={unit.id} className="library-content-unit">
                    <div className="library-content-unit-title">
                      <span>{unit.title}</span>
                      {unit.titleEn && <span className="library-content-unit-en">{unit.titleEn}</span>}
                      <span className="library-unit-lesson-count">{unit.lessons.length} 课</span>
                    </div>
                    {unit.lessons.length === 0 ? (
                      <div className="library-content-lesson empty">暂无课程</div>
                    ) : (
                      unit.lessons.map((lesson) => (
                        <div key={lesson.id} className="library-content-lesson">
                          <span>{lesson.title}</span>
                          {lesson.page && <span className="library-content-lesson-page">P.{lesson.page}</span>}
                        </div>
                      ))
                    )}
                  </div>
                ))}
              </div>
            )}
            <div className="form-hint" style={{ marginTop: '16px' }}>
              一级目录为单元、二级目录为课（如快乐中文）；若教材只有一层目录（如 HSK），整本书作为一个单元，各课归入其下。重新导入会覆盖当前结构，已挂载的单元资源按序号保留。
            </div>
          </div>
        </div>

        <div className={`config-tab-panel ${activeTab === 'resources' ? 'active' : ''}`} role="tabpanel" hidden={activeTab !== 'resources'}>
          <div className="config-section">
            <div className="section-title library-resource-section-title">
              <span>📝 整本书资源</span>
              <div className="library-resource-workflow">
                <button type="button" className="btn btn-primary btn-sm" onClick={() => setAddBookResourceOpen(true)}>
                  ① 添加资源
                </button>
                <button type="button" className="btn btn-secondary btn-sm" onClick={handleExportMediaMapping}>
                  ② 导出映射表
                </button>
                <button type="button" className="btn btn-secondary btn-sm" onClick={openMediaMappingImportModal}>
                  ③ 导入映射
                </button>
              </div>
            </div>

            <div className="library-file-filter" style={{ marginTop: '16px' }}>
              <span className="filter-label">资源类型筛选：</span>
              <select
                className="form-input form-select"
                value={fileTypeFilter}
                onChange={(e) => setFileTypeFilter(e.target.value as typeof fileTypeFilter)}
                style={{ minWidth: '160px' }}
              >
                {ALL_BOOK_RESOURCE_FILTER_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            <div className="paper-table-container" style={{ marginTop: '12px' }}>
              <table className="paper-table">
                <thead>
                  <tr>
                    <th style={{ minWidth: 108 }}>资源ID</th>
                    <th>资源类型</th>
                    <th>文件名称</th>
                    <th style={{ minWidth: 120 }}>页面编号</th>
                    <th style={{ width: 88 }}>frame</th>
                    <th>文件大小</th>
                    <th>上传时间</th>
                    <th>操作</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredBookFiles.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="library-chapter-empty">暂无该类型的资源文件</td>
                    </tr>
                  ) : (
                    filteredBookFiles.map((file) => (
                      <tr key={file.id}>
                        <td className="td-mono">
                          {getBookFileResourceId(file) ? (
                            <span className="library-resource-id">{getBookFileResourceId(file)}</span>
                          ) : (
                            <span className="library-cell-empty">—</span>
                          )}
                        </td>
                        <td>
                          <span className={`library-format-badge ${bookResourceBadgeClass(file.type)}`}>
                            {getBookResourceTypeLabel(file.type)}
                          </span>
                        </td>
                        <td>{file.fileName}</td>
                        <td>
                          <BookResourcePageDisplay file={file} />
                        </td>
                        <td className="td-mono">
                          {bookResourceNeedsPageNum(file.type) ? (file.frameNum ?? 1) : '—'}
                        </td>
                        <td className="td-mono">{file.fileSize}</td>
                        <td className="td-mono">{file.uploadedAt}</td>
                        <td className="library-action-cell">
                          {bookResourceNeedsPageNum(file.type) && (
                            <button
                              type="button"
                              className="btn-link"
                              onClick={() => setFileToEditPage(file)}
                            >
                              编辑
                            </button>
                          )}
                          <button type="button" className="btn-link">下载</button>
                          <button
                            type="button"
                            className="btn-link"
                            style={{ color: 'var(--rose)' }}
                            onClick={() => setFileToRemove(file)}
                          >
                            移除
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="library-info-box" style={{ marginTop: 16 }}>
              <div className="library-info-box-icon">💡</div>
              <div className="library-info-box-text">
                推荐流程：① 添加多媒体（.mp4）→ ② 导出映射表，在 Excel 中填写「页码」（如 P002V）与「按钮编号」（Frame，默认 1）→ ③ 导入映射更新。也可在操作列「编辑」逐条配置。
              </div>
            </div>
          </div>
        </div>
      </div>

      {resourceMountUnit && (
        <UnitResourceMountModal
          unit={resourceMountUnit}
          onClose={() => setResourceMountUnit(null)}
          onSave={saveUnitResourceMount}
        />
      )}

      <BookResourcePageEditModal
        file={fileToEditPage}
        onClose={() => setFileToEditPage(null)}
        onSave={handleUpdateBookFilePageMapping}
      />

      <div
        className={`modal-overlay ${mediaMappingImportOpen ? 'open' : ''}`}
        onClick={closeMediaMappingImportModal}
        role="dialog"
        aria-modal="true"
        aria-label="导入多媒体映射"
      >
        <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 700 }}>
          <div className="modal-header">
            <div className="modal-title">③ 导入映射表</div>
            <button type="button" className="modal-close" onClick={closeMediaMappingImportModal} aria-label="关闭">✕</button>
          </div>
          <div className="modal-body">
            <input
              ref={mediaMappingImportInputRef}
              type="file"
              accept=".xlsx,.xls"
              style={{ display: 'none' }}
              disabled={mediaMappingImportLoading}
              onChange={(e) => {
                void handleMediaMappingImportFile(e.target.files?.[0]);
                e.target.value = '';
              }}
            />
            <div
              className={`library-catalog-import-dropzone${mediaMappingImportLoading ? ' is-loading' : ''}${mediaMappingImportParsed ? ' is-ready' : ''}`}
              onClick={() => !mediaMappingImportLoading && mediaMappingImportInputRef.current?.click()}
              onDragOver={(e) => {
                e.preventDefault();
                if (!mediaMappingImportLoading) e.currentTarget.classList.add('is-dragover');
              }}
              onDragLeave={(e) => {
                e.preventDefault();
                e.currentTarget.classList.remove('is-dragover');
              }}
              onDrop={(e) => {
                e.preventDefault();
                e.currentTarget.classList.remove('is-dragover');
                if (!mediaMappingImportLoading) void handleMediaMappingImportFile(e.dataTransfer.files?.[0]);
              }}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && !mediaMappingImportLoading && mediaMappingImportInputRef.current?.click()}
            >
              {mediaMappingImportLoading ? (
                <div className="library-catalog-import-loading">
                  <span className="library-catalog-import-spinner" aria-hidden />
                  <div>正在解析表格…</div>
                </div>
              ) : mediaMappingImportParsed ? (
                <>
                  <div className="library-catalog-import-drop-icon" aria-hidden>✓</div>
                  <div className="library-catalog-import-drop-title">
                    解析完成 {mediaMappingImportParsed.length} 条映射
                  </div>
                  {mediaMappingImportFileName && (
                    <div className="form-hint" style={{ marginTop: 6 }}>{mediaMappingImportFileName}</div>
                  )}
                  <div className="form-hint" style={{ marginTop: 8 }}>确认无误后，请点击下方「保存并导入」</div>
                </>
              ) : (
                <>
                  <div className="library-catalog-import-drop-icon" aria-hidden>↑</div>
                  <div className="library-catalog-import-drop-title">点击上传或拖拽 Excel 文件至此</div>
                  <div className="form-hint">
                    支持 .xlsx / .xls · 最大 10MB · 单次最多 {MULTI_MEDIA_MAPPING_IMPORT_MAX_ROWS} 行 · 请使用「② 导出映射表」填写后再导入
                  </div>
                </>
              )}
            </div>

            <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 8, marginTop: 16 }}>表格格式（与导出映射表一致）</div>
            <ul style={{ margin: 0, paddingLeft: 18, color: 'var(--ink-light)', lineHeight: 1.9 }}>
              <li><b style={{ color: 'var(--ink)' }}>序号 / 教材名称 / ISBN / ID / 资源名称</b>：导出时自动填充，请勿改动 ID</li>
              <li><b style={{ color: 'var(--ink)' }}>页码</b>：页面编号，如 P002V（导入必填）</li>
              <li><b style={{ color: 'var(--ink)' }}>按钮编号</b>：Frame 序号，一页一视频填 1，留空视为 1</li>
              <li><b style={{ color: 'var(--ink)' }}>资源类型</b>：导出默认为 video，一般无需修改</li>
              <li>单次导入有效数据行不超过 <b>{MULTI_MEDIA_MAPPING_IMPORT_MAX_ROWS}</b> 行</li>
            </ul>

            <div className="form-hint" style={{ marginTop: 12 }}>
              尚未导出？请关闭此窗口，先点击「② 导出映射表」生成 Excel。
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary btn-sm" onClick={closeMediaMappingImportModal}>
              取消
            </button>
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={confirmMediaMappingImport}
              disabled={!mediaMappingImportParsed?.length || mediaMappingImportLoading}
            >
              保存并导入
            </button>
          </div>
        </div>
      </div>

      <AddBookResourceModal
        open={addBookResourceOpen}
        existingFiles={bookFiles}
        onClose={() => setAddBookResourceOpen(false)}
        onConfirm={handleAddBookResources}
      />

      <div
        className={`modal-overlay ${catalogImportOpen ? 'open' : ''}`}
        onClick={closeCatalogImportModal}
        role="dialog"
        aria-modal="true"
        aria-label="导入教材目录"
      >
        <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 700 }}>
          <div className="modal-header">
            <div className="modal-title">导入教材目录</div>
            <button type="button" className="modal-close" onClick={closeCatalogImportModal} aria-label="关闭">✕</button>
          </div>
          <div className="modal-body">
            <input
              ref={catalogImportInputRef}
              type="file"
              accept=".xlsx,.xls"
              style={{ display: 'none' }}
              disabled={catalogImportLoading}
              onChange={(e) => {
                void handleCatalogImportFile(e.target.files?.[0]);
                e.target.value = '';
              }}
            />
            <div
              className={`library-catalog-import-dropzone${catalogImportLoading ? ' is-loading' : ''}${catalogImportParsed ? ' is-ready' : ''}`}
              onClick={() => !catalogImportLoading && catalogImportInputRef.current?.click()}
              onDragOver={(e) => {
                e.preventDefault();
                if (!catalogImportLoading) e.currentTarget.classList.add('is-dragover');
              }}
              onDragLeave={(e) => {
                e.preventDefault();
                e.currentTarget.classList.remove('is-dragover');
              }}
              onDrop={(e) => {
                e.preventDefault();
                e.currentTarget.classList.remove('is-dragover');
                if (!catalogImportLoading) void handleCatalogImportFile(e.dataTransfer.files?.[0]);
              }}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && !catalogImportLoading && catalogImportInputRef.current?.click()}
            >
              {catalogImportLoading ? (
                <div className="library-catalog-import-loading">
                  <span className="library-catalog-import-spinner" aria-hidden />
                  <div>正在解析表格…</div>
                </div>
              ) : catalogImportParsed ? (
                <>
                  <div className="library-catalog-import-drop-icon" aria-hidden>✓</div>
                  <div className="library-catalog-import-drop-title">
                    解析完成 {catalogImportParsed.length} 个单元 · {catalogImportLessonCount} 课
                  </div>
                  {catalogImportFileName && (
                    <div className="form-hint" style={{ marginTop: 6 }}>{catalogImportFileName}</div>
                  )}
                  <div className="form-hint" style={{ marginTop: 8 }}>确认无误后，请点击下方「保存并导入」</div>
                </>
              ) : (
                <>
                  <div className="library-catalog-import-drop-icon" aria-hidden>↑</div>
                  <div className="library-catalog-import-drop-title">点击上传或拖拽 Excel 文件至此</div>
                  <div className="form-hint">
                    支持 .xlsx / .xls · 最大 10MB · 不支持 doc / pdf / png / zip 等非表格文件
                  </div>
                </>
              )}
            </div>

            <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>表格格式</div>
            <ul style={{ margin: 0, paddingLeft: 18, color: 'var(--ink-light)', lineHeight: 1.9 }}>
              <li><b style={{ color: 'var(--ink)' }}>双层目录</b>（快乐中文等）：一级目录填单元，如「第一单元 我和你」；二级目录填课，如「1 你好」；第三列填页码</li>
              <li><b style={{ color: 'var(--ink)' }}>单层目录</b>（HSK 等）：仅填写课程行，如「1 你好」+ 页码；整本书作为一个单元，单元名取当前书名</li>
              <li>解析后需点击「保存并导入」才会写入「结构配置」与「内容管理」</li>
            </ul>

            <div style={{ marginTop: 12 }}>
              <a
                href="/教材目录导入模板.xlsx"
                download="教材目录导入模板.xlsx"
                className="btn btn-ghost"
                style={{ gap: 6, textDecoration: 'none' }}
              >
                <span>⇩</span>
                下载导入模板
              </a>
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary btn-sm" onClick={closeCatalogImportModal}>
              取消
            </button>
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={confirmCatalogImport}
              disabled={!catalogImportParsed?.length || catalogImportLoading}
            >
              保存并导入
            </button>
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={fileToRemove !== null}
        title="确认移除"
        message={
          fileToRemove ? (
            <p style={{ margin: 0 }}>确认移除「{fileToRemove.fileName}」吗？</p>
          ) : null
        }
        confirmLabel="确认移除"
        onCancel={() => setFileToRemove(null)}
        onConfirm={() => {
          if (!fileToRemove) return;
          setBookFiles((prev) => prev.filter((f) => f.id !== fileToRemove.id));
          setFileToRemove(null);
        }}
      />

      {editorToast && <div className="hsk-toast show">{editorToast}</div>}
    </div>
  );
}
