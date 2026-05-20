import { useMemo, useState, useEffect } from 'react';
import {
  ALL_FEATURE_TAGS,
  EXTENDED_LEVEL_OPTIONS,
  FEATURE_CATEGORIES,
  HSK_LEVELS,
  PUBLISHERS,
  formatHskRange,
  getHskEquivalent,
  parseLegacyLevel,
  publishersByCategory,
} from '../config/bookCatalog';
import {
  LANG_OPTIONS,
  autoTranslateTitleByLang,
  primaryEnglishTitle,
  resolveTitleByLang,
  type LangKey,
  type TitleByLang,
} from '../config/languages';

const KNOWN_PUBLISHERS = new Set(PUBLISHERS.map((p) => p.name));

type BookSeries = {
  id: string;
  name: string;
  nameEn?: string;
  publisher: string;
  hskLevelMin: string;
  hskLevelMax: string;
  description: string;
  coverEmoji?: string;
};

type Book = {
  id: string;
  seriesId: string;
  volumeOrder: number;
  title: string;
  titleEn?: string;
  titleByLang?: TitleByLang;
  publisher: string;
  isbn: string;
  authors: string[];
  hskLevelMin: string;
  hskLevelMax: string;
  features: string[];
  format?: string;
  premium: boolean;
  coverUrl?: string;
  description: string;
  unitCount: number;
  lessonCount: number;
  vocabularyCount: number;
  characterCount: number;
  lastModified: string;
  isPublished: boolean;
};

function bookLevel(book: Pick<Book, 'hskLevelMin' | 'hskLevelMax'>) {
  return formatHskRange(book.hskLevelMin, book.hskLevelMax);
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
  type: 'JWL' | 'JWR' | 'JWRT';
  fileName: string;
  fileSize: string;
  uploadedAt: string;
};

const FORMAT_OPTIONS = ['', 'JWR', 'JWL', 'JWRT'] as const;

const UNIT_RESOURCE_COLUMNS: Array<{ key: keyof BookResourceFlags; label: string }> = [
  { key: 'pointRead', label: '点读' },
  { key: 'newWords', label: '生字词' },
  { key: 'vocabulary', label: '词汇' },
  { key: 'syncTraining', label: '问步训练' },
  { key: 'knowledgeLecture', label: '知识点讲课' },
  { key: 'chapterIntro', label: '章节介绍' },
  { key: 'cultureVideo', label: '文化视频' },
  { key: 'audioReading', label: '有声阅读' },
];

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
  return { audioReading: [], cultureVideo: [], exam: [], cultureRead: [] };
}

function cloneMounted(mounted: UnitMountedResources): UnitMountedResources {
  return {
    audioReading: [...mounted.audioReading],
    cultureVideo: [...mounted.cultureVideo],
    exam: [...mounted.exam],
    cultureRead: [...mounted.cultureRead],
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
      exam: ['EXAM_004'],
      cultureRead: ['CULTURE_003'],
    },
    lessons: [
      { id: 'lesson-4-1', title: '第一课 喜好', page: '36', resources: createEmptyResources() },
      { id: 'lesson-4-2', title: '第二课 评价', page: '42', resources: createEmptyResources() },
    ],
  },
];

const INITIAL_BOOK_FILES: BookFileResource[] = [
  { id: 'file-1', type: 'JWL', fileName: '快乐中文第一册.jwl', fileSize: '10.5 MB', uploadedAt: '2024-01-15 10:30' },
  { id: 'file-2', type: 'JWL', fileName: '快乐中文第一册_补充.jwl', fileSize: '3.2 MB', uploadedAt: '2024-02-20 14:15' },
  { id: 'file-3', type: 'JWR', fileName: '快乐中文第一册.jwr', fileSize: '25.8 MB', uploadedAt: '2024-01-15 10:35' },
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

function ResourceSwitch({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  label?: string;
}) {
  return (
    <label className="toggle-wrap library-resource-switch" title={label}>
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span className="toggle-track" />
      <span className="toggle-thumb" />
    </label>
  );
}

type UnitChapterEditorModalProps = {
  unit: BookUnitRow;
  onClose: () => void;
  onSave: (unit: BookUnitRow) => void;
};

function UnitChapterEditorModal({ unit, onClose, onSave }: UnitChapterEditorModalProps) {
  const [draft, setDraft] = useState<BookUnitRow>(() => ({
    ...unit,
    mounted: cloneMounted(unit.mounted),
    lessons: unit.lessons.map((l) => ({ ...l, resources: { ...l.resources } })),
  }));

  const updateDraft = (patch: Partial<BookUnitRow>) => {
    setDraft((prev) => ({ ...prev, ...patch }));
  };

  const updateLesson = (lessonId: string, patch: Partial<BookChapter>) => {
    setDraft((prev) => ({
      ...prev,
      lessons: prev.lessons.map((l) => (l.id === lessonId ? { ...l, ...patch } : l)),
    }));
  };

  const toggleLessonResource = (lessonId: string, key: keyof BookResourceFlags) => {
    setDraft((prev) => ({
      ...prev,
      lessons: prev.lessons.map((l) =>
        l.id === lessonId ? { ...l, resources: { ...l.resources, [key]: !l.resources[key] } } : l,
      ),
    }));
  };

  const addLesson = () => {
    const order = draft.lessons.length + 1;
    setDraft((prev) => ({
      ...prev,
      lessons: [
        ...prev.lessons,
        {
          id: `lesson-${Date.now()}`,
          title: `第 ${order} 课`,
          resources: createEmptyResources(),
        },
      ],
    }));
  };

  const removeLesson = (lessonId: string) => {
    setDraft((prev) => ({
      ...prev,
      lessons: prev.lessons.filter((l) => l.id !== lessonId),
    }));
  };

  return (
    <div className="modal-overlay open" onClick={onClose} role="dialog" aria-modal="true" aria-label="配置章节">
      <div className="modal modal-wide" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">配置章节 · {draft.title}</div>
          <button type="button" className="modal-close" onClick={onClose} aria-label="关闭">✕</button>
        </div>
        <div className="modal-body">
          <div className="section-title" style={{ marginBottom: 12 }}>单元信息</div>
          <div className="form-row">
            <div className="form-group">
              <label>单元中文名称</label>
              <input
                className="form-input"
                value={draft.title}
                onChange={(e) => updateDraft({ title: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>单元英文名称</label>
              <input
                className="form-input"
                value={draft.titleEn ?? ''}
                onChange={(e) => updateDraft({ titleEn: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>页码</label>
              <input
                className="form-input"
                value={draft.page ?? ''}
                onChange={(e) => updateDraft({ page: e.target.value })}
                placeholder="如 12-25"
              />
            </div>
          </div>

          <div className="section-title" style={{ margin: '20px 0 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>章节列表（{draft.lessons.length}）</span>
            <button type="button" className="btn btn-secondary btn-sm" onClick={addLesson}>➕ 新增章节</button>
          </div>
          {draft.lessons.length === 0 ? (
            <div className="library-chapter-empty">暂无章节，点击「新增章节」添加课程</div>
          ) : (
            <div className="paper-table-container">
              <table className="paper-table library-chapter-table">
                <thead>
                  <tr>
                    <th>章节名称</th>
                    <th>页码</th>
                    {UNIT_RESOURCE_COLUMNS.map((col) => (
                      <th key={col.key}>{col.label}</th>
                    ))}
                    <th>操作</th>
                  </tr>
                </thead>
                <tbody>
                  {draft.lessons.map((lesson) => (
                    <tr key={lesson.id}>
                      <td>
                        <input
                          className="form-input"
                          value={lesson.title}
                          onChange={(e) => updateLesson(lesson.id, { title: e.target.value })}
                          placeholder="章节名称"
                        />
                      </td>
                      <td>
                        <input
                          className="form-input library-page-input"
                          value={lesson.page ?? ''}
                          onChange={(e) => updateLesson(lesson.id, { page: e.target.value })}
                          placeholder="页码"
                        />
                      </td>
                      {UNIT_RESOURCE_COLUMNS.map((col) => (
                        <td key={col.key} className="library-resource-cell">
                          <ResourceSwitch
                            checked={lesson.resources[col.key]}
                            onChange={() => toggleLessonResource(lesson.id, col.key)}
                            label={col.label}
                          />
                        </td>
                      ))}
                      <td>
                        <button type="button" className="btn-link" style={{ color: 'var(--rose)' }} onClick={() => removeLesson(lesson.id)}>
                          删除
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        <div className="modal-footer">
          <button type="button" className="btn btn-ghost" onClick={onClose}>取消</button>
          <button type="button" className="btn btn-primary" onClick={() => onSave(draft)} disabled={!draft.title.trim()}>
            保存
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
  { key: 'exam', label: '测试卷', source: '试卷管理处' },
  { key: 'cultureRead', label: '文化点读', source: '文化点读处' },
];

function UnitResourceMountModal({ unit, onClose, onSave }: UnitResourceMountModalProps) {
  const [draft, setDraft] = useState<BookUnitRow>(() => ({
    ...unit,
    mounted: cloneMounted(unit.mounted),
    lessons: unit.lessons.map((l) => ({ ...l, resources: { ...l.resources } })),
  }));

  const removeMounted = (key: keyof UnitMountedResources, resourceId: string) => {
    setDraft((prev) => ({
      ...prev,
      mounted: {
        ...prev.mounted,
        [key]: prev.mounted[key].filter((id) => id !== resourceId),
      },
    }));
  };

  return (
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
                <button type="button" className="btn btn-secondary btn-sm">+ 添加{section.label}</button>
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
                          <td>{resourceId}</td>
                          <td>{section.source}</td>
                          <td>
                            <button type="button" className="btn-link" style={{ color: 'var(--rose)' }} onClick={() => removeMounted(section.key, resourceId)}>
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
          <button type="button" className="btn btn-ghost" onClick={onClose}>取消</button>
          <button type="button" className="btn btn-primary" onClick={() => onSave(draft)}>完成配置</button>
        </div>
      </div>
    </div>
  );
}

const INITIAL_SERIES: BookSeries[] = [
  {
    id: 'series-happy-chinese',
    name: '快乐中文系列',
    nameEn: 'Happy Chinese',
    publisher: '人民教育出版社',
    hskLevelMin: 'HSK1级',
    hskLevelMax: 'HSK3级',
    description: '面向海外母语非汉语的中学生，对标《国际中文教育中文水平等级标准》',
    coverEmoji: '📘',
  },
  {
    id: 'series-hsk-standard',
    name: 'HSK标准教程系列',
    nameEn: 'HSK Standard Course',
    publisher: '北京语言大学出版社',
    hskLevelMin: 'HSK1级',
    hskLevelMax: 'HSK6级',
    description: 'HSK官方标准教程，配套各级别考试',
    coverEmoji: '📗',
  },
  {
    id: 'series-extended',
    name: '拓展阅读系列',
    nameEn: 'Extended Reading',
    publisher: '外语教学与研究出版社',
    hskLevelMin: 'HSK2级',
    hskLevelMax: 'HSK5级',
    description: '商务、情景、文化等专题阅读材料',
    coverEmoji: '📙',
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
    authors: ['李晓琪', '刘晓雨', '王淑红'],
    hskLevelMin: 'HSK1级',
    hskLevelMax: 'HSK2级',
    features: ['综合 (听说读写并重)', '阅读', '拼音'],
    format: 'JWL',
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
    authors: ['李晓琪', '刘晓雨', '王淑红'],
    hskLevelMin: 'HSK2级',
    hskLevelMax: 'HSK3级',
    features: ['综合 (听说读写并重)', '阅读', '拼音'],
    format: 'JWRT',
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
    authors: ['李晓琪', '刘晓雨', '王淑红'],
    hskLevelMin: 'HSK3级',
    hskLevelMax: 'HSK3级',
    features: ['综合 (听说读写并重)', '阅读', '汉字', '拼音'],
    format: 'JWR',
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
    authors: ['姜丽萍'],
    hskLevelMin: 'HSK1级',
    hskLevelMax: 'HSK1级',
    features: ['综合 (听说读写并重)', '听说', '阅读'],
    format: 'JWR',
    premium: false,
    description: 'HSK官方标准教程，配套HSK 1级考试',
    unitCount: 15,
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
    authors: ['张明', '李华'],
    hskLevelMin: 'HSK4级',
    hskLevelMax: 'HSK5级',
    features: ['听说', '阅读', '商务'],
    format: 'JWL',
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
    authors: ['王芳'],
    hskLevelMin: 'HSK2级',
    hskLevelMax: 'HSK3级',
    features: ['阅读', '文化', '旅游'],
    format: 'JWRT',
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

const SERIES_EMOJI_OPTIONS = ['📘', '📗', '📙', '📕', '📚', '📖'];

type CreateSeriesModalProps = {
  open: boolean;
  defaultPublisher?: string;
  onClose: () => void;
  onCreate: (series: BookSeries) => void;
};

function CreateSeriesModal({ open, defaultPublisher, onClose, onCreate }: CreateSeriesModalProps) {
  const [name, setName] = useState('');
  const [nameEn, setNameEn] = useState('');
  const [publisher, setPublisher] = useState('');
  const [hskLevelMin, setHskLevelMin] = useState('HSK1级');
  const [hskLevelMax, setHskLevelMax] = useState('HSK1级');
  const [description, setDescription] = useState('');
  const [coverEmoji, setCoverEmoji] = useState('📚');
  const publisherGroups = useMemo(() => publishersByCategory(), []);

  useEffect(() => {
    if (!open) return;
    setName('');
    setNameEn('');
    setPublisher(defaultPublisher ?? '');
    setHskLevelMin('HSK1级');
    setHskLevelMax('HSK1级');
    setDescription('');
    setCoverEmoji('📚');
  }, [open, defaultPublisher]);

  const handleCreate = () => {
    if (!name.trim() || !publisher) return;
    onCreate({
      id: `series-${Date.now()}`,
      name: name.trim(),
      nameEn: nameEn.trim() || undefined,
      publisher,
      hskLevelMin,
      hskLevelMax,
      description: description.trim(),
      coverEmoji,
    });
  };

  if (!open) return null;

  return (
    <div className="modal-overlay open" onClick={onClose} role="dialog" aria-modal="true" aria-label="新建系列">
      <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 640 }}>
        <div className="modal-header">
          <div className="modal-title">新建系列</div>
          <button type="button" className="modal-close" onClick={onClose} aria-label="关闭">✕</button>
        </div>
        <div className="modal-body">
          <div className="form-row">
            <div className="form-group">
              <label>系列名称<span className="required">*</span></label>
              <input
                className="form-input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="如 快乐中文系列"
              />
            </div>
            <div className="form-group">
              <label>英文名称</label>
              <input
                className="form-input"
                value={nameEn}
                onChange={(e) => setNameEn(e.target.value)}
                placeholder="如 Happy Chinese"
              />
            </div>
          </div>
          <div className="form-group">
            <label>出版社<span className="required">*</span></label>
            <select
              className="form-input form-select"
              value={publisher}
              onChange={(e) => setPublisher(e.target.value)}
            >
              <option value="">请选择出版社</option>
              {[...publisherGroups.entries()].map(([category, pubs]) => (
                <optgroup key={category} label={category}>
                  {pubs.map((p) => (
                    <option key={p.name} value={p.name}>{p.name}</option>
                  ))}
                </optgroup>
              ))}
            </select>
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
            <label>系列图标</label>
            <div className="library-series-emoji-picker">
              {SERIES_EMOJI_OPTIONS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  className={`library-series-emoji-option ${coverEmoji === emoji ? 'selected' : ''}`}
                  onClick={() => setCoverEmoji(emoji)}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
          <div className="form-group">
            <label>系列描述</label>
            <textarea
              className="form-input"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="简要描述系列特点、适用人群等..."
            />
          </div>
        </div>
        <div className="modal-footer">
          <button type="button" className="btn btn-ghost" onClick={onClose}>取消</button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleCreate}
            disabled={!name.trim() || !publisher}
          >
            创建系列
          </button>
        </div>
      </div>
    </div>
  );
}

export function Library() {
  const [seriesList, setSeriesList] = useState<BookSeries[]>(INITIAL_SERIES);
  const [books, setBooks] = useState<Book[]>(MOCK_BOOKS);
  const [view, setView] = useState<ViewMode>('series');
  const [selectedSeriesId, setSelectedSeriesId] = useState<string | null>(null);
  const [filterPublisher, setFilterPublisher] = useState('');
  const [filterHsk, setFilterHsk] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [toast, setToast] = useState<string | null>(null);
  const [editingBook, setEditingBook] = useState<Book | null>(null);
  const [createSeriesOpen, setCreateSeriesOpen] = useState(false);

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
    setSeriesList((prev) => [...prev, series]);
    setCreateSeriesOpen(false);
    showToast(`已创建系列「${series.name}」`);
  };

  const togglePublishStatus = (id: string) => {
    setBooks(books.map(b =>
      b.id === id ? { ...b, isPublished: !b.isPublished } : b
    ));
    const book = books.find(b => b.id === id);
    showToast(`已${book?.isPublished ? '下架' : '上架'} ${book?.title}`);
  };

  const updateBookFormat = (id: string, format: string) => {
    setBooks((prev) => prev.map((b) => (b.id === id ? { ...b, format } : b)));
  };

  const openSeries = (seriesId: string) => {
    setSelectedSeriesId(seriesId);
    setSearchQuery('');
    setView('books');
  };

  const openBookEditor = (book: Book) => {
    setEditingBook(book);
    setView('edit');
  };

  const backToSeries = () => {
    setSelectedSeriesId(null);
    setSearchQuery('');
    setView('series');
  };

  const backToBooks = () => {
    setEditingBook(null);
    setView('books');
  };

  if (view === 'edit' && editingBook) {
    return (
      <>
        <BookEditor
          book={editingBook}
          seriesName={selectedSeries?.name}
          onSave={(updated) => {
            setBooks(books.map(b => b.id === updated.id ? updated : b));
            setEditingBook(updated);
            backToBooks();
            showToast(`已保存 ${updated.title}`);
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
              {selectedSeries.nameEn && `${selectedSeries.nameEn} · `}
              {selectedSeries.publisher} · {seriesBooks.length} 册
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button type="button" className="btn btn-secondary" onClick={() => showToast('批量导入功能开发中')}>
              📥 批量导入
            </button>
            <button type="button" className="btn btn-primary" onClick={() => showToast('新建册次功能开发中')}>
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
            共 {filteredBooks.length} 册
          </div>
        </div>

        <div className="paper-table-container">
          <table>
            <thead>
              <tr>
                <th style={{ width: '60px' }}>册次</th>
                <th style={{ width: '280px' }}>书籍信息</th>
                <th style={{ width: '96px' }}>格式</th>
                <th style={{ width: '100px', whiteSpace: 'nowrap' }}>级别</th>
                <th style={{ width: '180px' }}>功能模块</th>
                <th style={{ width: '140px', whiteSpace: 'nowrap' }}>内容统计</th>
                <th style={{ width: '100px' }}>状态</th>
                <th style={{ width: '160px', whiteSpace: 'nowrap' }}>操作</th>
              </tr>
            </thead>
            <tbody>
              {filteredBooks.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '60px', color: 'var(--ink-light)' }}>
                    {searchQuery ? '未找到匹配的册次' : '该系列暂无书籍'}
                  </td>
                </tr>
              ) : (
                filteredBooks.map(book => (
                  <tr
                    key={book.id}
                    className="library-book-row"
                    onClick={() => openBookEditor(book)}
                    style={{ cursor: 'pointer' }}
                  >
                    <td>
                      <span className="library-volume-badge">第 {book.volumeOrder} 册</span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <div className="paper-name">{book.title}</div>
                        {primaryEnglishTitle(book.titleByLang, book.titleEn) && (
                          <div style={{ fontSize: '12px', color: 'var(--ink-light)' }}>
                            {primaryEnglishTitle(book.titleByLang, book.titleEn)}
                          </div>
                        )}
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
                    <td onClick={(e) => e.stopPropagation()}>
                      <select
                        className="form-input form-select library-format-select"
                        value={book.format ?? ''}
                        onChange={(e) => updateBookFormat(book.id, e.target.value)}
                      >
                        {FORMAT_OPTIONS.map((opt) => (
                          <option key={opt || 'empty'} value={opt}>{opt || '—'}</option>
                        ))}
                      </select>
                    </td>
                    <td>
                      <span className="hsk-badge" style={{ background: 'var(--primary-l)', color: 'var(--primary)' }}>
                        {bookLevel(book)}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                        {book.features.map(f => (
                          <span key={f} className="feature-tag">{f}</span>
                        ))}
                      </div>
                    </td>
                    <td>
                      <div style={{ fontSize: '12px', color: 'var(--ink-light)', lineHeight: '1.6' }}>
                        {book.unitCount} 单元 · {book.lessonCount} 课<br />
                        {book.vocabularyCount} 词 · {book.characterCount} 字
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
                          className="action-btn data"
                          onClick={() => showToast(`查看 ${book.title} 的使用数据`)}
                        >
                          📊 数据
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {toast && <div className="hsk-toast show">{toast}</div>}
      </>
    );
  }

  const filteredSeries = seriesList.filter((s) => {
    if (filterPublisher && s.publisher !== filterPublisher) return false;
    if (filterHsk) {
      const order = HSK_LEVELS.map((l) => l.level);
      const idx = order.indexOf(filterHsk);
      const minIdx = order.indexOf(getHskEquivalent(s.hskLevelMin));
      const maxIdx = order.indexOf(getHskEquivalent(s.hskLevelMax));
      if (idx === -1 || idx < minIdx || idx > maxIdx) return false;
    }
    if (searchQuery === '') return true;
    const query = searchQuery.toLowerCase();
    const bookTitles = books
      .filter((b) => b.seriesId === s.id)
      .map((b) => `${b.title} ${primaryEnglishTitle(b.titleByLang, b.titleEn)} ${Object.values(b.titleByLang ?? {}).join(' ')}`.toLowerCase())
      .join(' ');
    return s.name.toLowerCase().includes(query) ||
      s.nameEn?.toLowerCase().includes(query) ||
      s.publisher.toLowerCase().includes(query) ||
      bookTitles.includes(query);
  });

  return (
    <>
      <div className="page-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div className="page-title">书籍教材管理</div>
          <div className="page-subtitle">按系列管理课程配套书籍与阅读材料</div>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button type="button" className="btn btn-secondary" onClick={() => showToast('批量导入功能开发中')}>
            📥 批量导入
          </button>
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
          <span className="filter-label">HSK级别:</span>
          <select
            className="form-input form-select"
            value={filterHsk}
            onChange={(e) => setFilterHsk(e.target.value)}
            style={{ minWidth: '140px' }}
          >
            <option value="">全部级别</option>
            {[...new Set(HSK_LEVELS.map((l) => l.tier))].map((tier) => (
              <optgroup key={tier} label={tier}>
                {HSK_LEVELS.filter((l) => l.tier === tier).map((l) => (
                  <option key={l.level} value={l.level}>{l.level}</option>
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
        </div>
      </div>

      <div className="library-series-grid">
        {filteredSeries.length === 0 ? (
          <div className="library-series-empty">
            {searchQuery ? '未找到匹配的系列' : '暂无书籍系列'}
          </div>
        ) : (
          filteredSeries.map((series) => {
            const stat = seriesStats.get(series.id)!;
            return (
              <div
                key={series.id}
                className="library-series-card"
                role="button"
                tabIndex={0}
                onClick={() => openSeries(series.id)}
                onKeyDown={(e) => e.key === 'Enter' && openSeries(series.id)}
              >
                <div className="library-series-card-top">
                  <div className="library-series-icon">{series.coverEmoji ?? '📚'}</div>
                  <div className="library-series-info">
                    <div className="library-series-name">{series.name}</div>
                    {series.nameEn && (
                      <div className="library-series-name-en">{series.nameEn}</div>
                    )}
                  </div>
                  <span className="hsk-badge" style={{ background: 'var(--primary-l)', color: 'var(--primary)', flexShrink: 0 }}>
                    {bookLevel(series)}
                  </span>
                </div>
                <div className="library-series-desc">{series.description}</div>
                <div className="library-series-meta">
                  <span>{series.publisher}</span>
                  <span>{stat.total} 册 · {stat.published} 已上架</span>
                </div>
                <div className="library-series-footer">
                  <span className="library-series-stat">
                    {stat.units} 单元 · {stat.lessons} 课
                  </span>
                  <span className="library-series-arrow">进入系列 →</span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {toast && <div className="hsk-toast show">{toast}</div>}

      <CreateSeriesModal
        open={createSeriesOpen}
        defaultPublisher={filterPublisher}
        onClose={() => setCreateSeriesOpen(false)}
        onCreate={handleCreateSeries}
      />
    </>
  );
}

// 书籍编辑器组件
type BookEditorProps = {
  book: Book;
  seriesName?: string;
  onSave: (book: Book) => void;
  onCancel: () => void;
};

function BookEditor({ book, seriesName, onSave, onCancel }: BookEditorProps) {
  const [editedBook, setEditedBook] = useState<Book>(() => {
    const base = book.hskLevelMin
      ? book
      : (() => {
          const legacy = parseLegacyLevel((book as Book & { level?: string }).level ?? '');
          return { ...book, hskLevelMin: legacy.min, hskLevelMax: legacy.max };
        })();
    const titleByLang = resolveTitleByLang(base.title, base.titleEn, base.titleByLang);
    return { ...base, titleByLang, title: titleByLang.CN ?? base.title, titleEn: titleByLang.EN ?? base.titleEn };
  });
  const [activeTab, setActiveTab] = useState<'basic' | 'structure' | 'content' | 'resources'>('basic');
  const [bookUnits, setBookUnits] = useState<BookUnitRow[]>(() =>
    MOCK_BOOK_UNITS.map((u) => ({
      ...u,
      mounted: cloneMounted(u.mounted),
      lessons: u.lessons.map((l) => ({ ...l, resources: { ...l.resources } })),
    })),
  );
  const [bookFiles, setBookFiles] = useState<BookFileResource[]>(INITIAL_BOOK_FILES);
  const [fileTypeFilter, setFileTypeFilter] = useState<'all' | 'JWL' | 'JWR' | 'JWRT'>('all');
  const [editingUnit, setEditingUnit] = useState<BookUnitRow | null>(null);
  const [resourceMountUnit, setResourceMountUnit] = useState<BookUnitRow | null>(null);
  const [titleLangTab, setTitleLangTab] = useState<LangKey>('CN');
  const [customPublishers, setCustomPublishers] = useState<string[]>(() =>
    book.publisher && !KNOWN_PUBLISHERS.has(book.publisher) ? [book.publisher] : [],
  );
  const [customTagsByCategory, setCustomTagsByCategory] = useState<Record<string, string[]>>(() => {
    const orphans = book.features.filter((f) => !ALL_FEATURE_TAGS.includes(f));
    const initial: Record<string, string[]> = {};
    if (orphans.length) initial['生活场景类'] = orphans;
    return initial;
  });
  const [newTagByCategory, setNewTagByCategory] = useState<Record<string, string>>({});
  const [newPublisherName, setNewPublisherName] = useState('');
  const publisherGroups = useMemo(() => publishersByCategory(), []);

  const selectedPublisher = PUBLISHERS.find((p) => p.name === editedBook.publisher);

  const addCustomPublisher = () => {
    const name = newPublisherName.trim();
    if (!name) return;
    setCustomPublishers((prev) => (prev.includes(name) ? prev : [...prev, name]));
    setEditedBook((prev) => ({ ...prev, publisher: name }));
    setNewPublisherName('');
  };

  const addCustomFeatureTag = (category: string) => {
    const tag = (newTagByCategory[category] ?? '').trim();
    if (!tag) return;
    const preset = FEATURE_CATEGORIES.find((c) => c.category === category)?.tags ?? [];
    if (!preset.includes(tag)) {
      setCustomTagsByCategory((prev) => {
        const list = prev[category] ?? [];
        if (list.includes(tag)) return prev;
        return { ...prev, [category]: [...list, tag] };
      });
    }
    setEditedBook((prev) => ({
      ...prev,
      features: prev.features.includes(tag) ? prev.features : [...prev.features, tag],
    }));
    setNewTagByCategory((prev) => ({ ...prev, [category]: '' }));
  };

  const updateHskRange = (field: 'hskLevelMin' | 'hskLevelMax', value: string) => {
    setEditedBook((prev) => ({ ...prev, [field]: value }));
  };

  const toggleFeature = (tag: string) => {
    setEditedBook((prev) => ({
      ...prev,
      features: prev.features.includes(tag)
        ? prev.features.filter((f) => f !== tag)
        : [...prev.features, tag],
    }));
  };

  const titleByLang = editedBook.titleByLang ?? resolveTitleByLang(editedBook.title, editedBook.titleEn);

  const updateTitleByLang = (lang: LangKey, value: string) => {
    const next = { ...titleByLang, [lang]: value };
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
    setEditedBook((prev) => ({
      ...prev,
      titleByLang: next,
      title: next.CN ?? prev.title,
      titleEn: next.EN ?? '',
    }));
  };

  const handleSave = () => {
    if (!editedBook.publisher || editedBook.features.length === 0) return;
    const resolved = resolveTitleByLang(editedBook.title, editedBook.titleEn, editedBook.titleByLang);
    onSave({
      ...editedBook,
      titleByLang: resolved,
      title: resolved.CN?.trim() || editedBook.title,
      titleEn: resolved.EN?.trim() || '',
    });
  };

  const addUnit = () => {
    const order = bookUnits.length + 1;
    setBookUnits((prev) => [
      ...prev,
      {
        id: `unit-${Date.now()}`,
        order,
        title: `U${order} 新单元`,
        mounted: createEmptyMounted(),
        lessons: [],
      },
    ]);
  };

  const openUnitEditor = (unit: BookUnitRow) => {
    setEditingUnit({
      ...unit,
      mounted: cloneMounted(unit.mounted),
      lessons: unit.lessons.map((l) => ({ ...l, resources: { ...l.resources } })),
    });
  };

  const openUnitResourceMount = (unit: BookUnitRow) => {
    setResourceMountUnit({
      ...unit,
      mounted: cloneMounted(unit.mounted),
      lessons: unit.lessons.map((l) => ({ ...l, resources: { ...l.resources } })),
    });
  };

  const saveUnitEditor = (unit: BookUnitRow) => {
    setBookUnits((prev) => prev.map((u) => (u.id === unit.id ? unit : u)));
    setEditingUnit(null);
  };

  const saveUnitResourceMount = (unit: BookUnitRow) => {
    setBookUnits((prev) => prev.map((u) => (u.id === unit.id ? unit : u)));
    setResourceMountUnit(null);
  };

  const filteredBookFiles = bookFiles.filter((file) => fileTypeFilter === 'all' || file.type === fileTypeFilter);

  const bookFileCount = bookFiles.length;

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
              编辑书籍：{book.title}
              {seriesName && (
                <span style={{ fontSize: '14px', fontWeight: 400, color: 'var(--ink-light)', marginLeft: 8 }}>
                  · {seriesName} 第 {book.volumeOrder} 册
                </span>
              )}
            </span>
          </h1>
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
              disabled={!editedBook.publisher || editedBook.features.length === 0 || !(titleByLang.CN ?? editedBook.title).trim()}
            >
              💾 保存
            </button>
          </div>
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
            aria-selected={activeTab === 'structure'}
            className={`type-tab ${activeTab === 'structure' ? 'active' : ''}`}
            onClick={() => setActiveTab('structure')}
          >
            📑 结构配置
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
            aria-selected={activeTab === 'resources'}
            className={`type-tab ${activeTab === 'resources' ? 'active' : ''}`}
            onClick={() => setActiveTab('resources')}
          >
            📝 资源挂载
            {bookFileCount > 0 && <span className="badge">{bookFileCount}</span>}
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
                <div className="library-multilang-panel">
                  <div className="library-multilang-toolbar">
                    <div className="library-multilang-tabs">
                      {LANG_OPTIONS.map((o) => (
                        <button
                          key={o.key}
                          type="button"
                          className={`btn btn-sm ${titleLangTab === o.key ? 'btn-primary' : 'btn-secondary'}`}
                          onClick={() => setTitleLangTab(o.key)}
                        >
                          {o.key} {o.label}
                        </button>
                      ))}
                    </div>
                    <button type="button" className="btn btn-secondary btn-sm" onClick={runAutoTranslateTitle}>
                      自动翻译
                    </button>
                  </div>
                  <input
                    type="text"
                    className="form-input"
                    value={titleByLang[titleLangTab] ?? ''}
                    onChange={(e) => updateTitleByLang(titleLangTab, e.target.value)}
                    placeholder={`${LANG_OPTIONS.find((l) => l.key === titleLangTab)?.label ?? titleLangTab}书名`}
                  />
                  {titleLangTab === 'CN' && !(titleByLang.CN ?? '').trim() && (
                    <div className="form-hint" style={{ color: 'var(--rose)' }}>中文书名为必填项</div>
                  )}
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>册次<span className="required">*</span></label>
                  <select
                    className="form-input form-select"
                    value={editedBook.volumeOrder}
                    onChange={(e) => setEditedBook({ ...editedBook, volumeOrder: Number(e.target.value) })}
                  >
                    {Array.from({ length: 12 }, (_, i) => i + 1).map((n) => (
                      <option key={n} value={n}>第 {n} 册</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>出版社<span className="required">*</span></label>
                  <select
                    className="form-input form-select"
                    value={editedBook.publisher}
                    onChange={(e) => setEditedBook({ ...editedBook, publisher: e.target.value })}
                  >
                    <option value="">请选择出版社</option>
                    {[...publisherGroups.entries()].map(([category, pubs]) => (
                      <optgroup key={category} label={category}>
                        {pubs.map((p) => (
                          <option key={p.name} value={p.name}>{p.name}</option>
                        ))}
                      </optgroup>
                    ))}
                    {customPublishers.length > 0 && (
                      <optgroup label="自定义">
                        {customPublishers.map((name) => (
                          <option key={name} value={name}>{name}</option>
                        ))}
                      </optgroup>
                    )}
                  </select>
                  <div className="library-custom-add">
                    <input
                      type="text"
                      className="form-input"
                      placeholder="输入自定义出版社名称"
                      value={newPublisherName}
                      onChange={(e) => setNewPublisherName(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addCustomPublisher())}
                    />
                    <button type="button" className="btn btn-secondary btn-sm" onClick={addCustomPublisher}>
                      + 添加
                    </button>
                  </div>
                  {selectedPublisher?.representativeBooks && (
                    <div className="form-hint">代表系列：{selectedPublisher.representativeBooks}</div>
                  )}
                </div>
                <div className="form-group">
                  <label>ISBN<span className="required">*</span></label>
                  <input
                    type="text"
                    value={editedBook.isbn}
                    onChange={(e) => setEditedBook({ ...editedBook, isbn: e.target.value })}
                  />
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
                <div className="library-feature-picker">
                  {FEATURE_CATEGORIES.map((cat) => {
                    const customTags = customTagsByCategory[cat.category] ?? [];
                    return (
                    <div key={cat.category} className="library-feature-group">
                      <div className="library-feature-group-title">{cat.category}</div>
                      <div className="library-feature-tags">
                        {cat.tags.map((tag) => (
                          <label key={tag} className={`library-feature-tag ${editedBook.features.includes(tag) ? 'selected' : ''}`}>
                            <input
                              type="checkbox"
                              checked={editedBook.features.includes(tag)}
                              onChange={() => toggleFeature(tag)}
                            />
                            {tag}
                          </label>
                        ))}
                        {customTags.map((tag) => (
                          <label key={tag} className={`library-feature-tag ${editedBook.features.includes(tag) ? 'selected' : ''}`}>
                            <input
                              type="checkbox"
                              checked={editedBook.features.includes(tag)}
                              onChange={() => toggleFeature(tag)}
                            />
                            {tag}
                          </label>
                        ))}
                      </div>
                      <div className="library-custom-add">
                        <input
                          type="text"
                          className="form-input"
                          placeholder="输入自定义标签"
                          value={newTagByCategory[cat.category] ?? ''}
                          onChange={(e) => setNewTagByCategory((prev) => ({ ...prev, [cat.category]: e.target.value }))}
                          onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addCustomFeatureTag(cat.category))}
                        />
                        <button type="button" className="btn btn-secondary btn-sm" onClick={() => addCustomFeatureTag(cat.category)}>
                          + 添加
                        </button>
                      </div>
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
                  value={editedBook.authors.join(', ')}
                  onChange={(e) => setEditedBook({...editedBook, authors: e.target.value.split(',').map(a => a.trim())})}
                  placeholder="多个作者用逗号分隔"
                />
              </div>

              <div className="form-group">
                <label>书籍描述</label>
                <textarea 
                  value={editedBook.description}
                  onChange={(e) => setEditedBook({...editedBook, description: e.target.value})}
                  rows={3}
                  placeholder="简要描述书籍特点、适用人群等..."
                />
              </div>
            </div>
        </div>

        <div className={`config-tab-panel ${activeTab === 'structure' ? 'active' : ''}`} role="tabpanel" hidden={activeTab !== 'structure'}>
          <div className="config-section">
            <div className="section-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>📑 单元列表</span>
              <button type="button" className="btn btn-primary btn-sm" onClick={addUnit}>
                ➕ 新增单元
              </button>
            </div>

            <div className="paper-table-container" style={{ marginTop: '16px' }}>
              <table className="paper-table">
                <thead>
                  <tr>
                    <th style={{ minWidth: '140px' }}>单元</th>
                    <th style={{ minWidth: '120px' }}>有声阅读</th>
                    <th style={{ minWidth: '120px' }}>文化视频</th>
                    <th style={{ minWidth: '120px' }}>测试卷</th>
                    <th style={{ minWidth: '120px' }}>文化点读</th>
                    <th style={{ minWidth: '160px' }}>操作</th>
                  </tr>
                </thead>
                <tbody>
                  {bookUnits.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="library-chapter-empty">
                        暂无单元，点击「新增单元」开始配置
                      </td>
                    </tr>
                  ) : (
                    bookUnits.map((unit) => (
                      <tr key={unit.id}>
                        <td>
                          <button type="button" className="library-unit-link" onClick={() => openUnitEditor(unit)}>
                            {unit.title}
                            {unit.lessons.length > 0 && (
                              <span className="library-unit-lesson-count">{unit.lessons.length} 章</span>
                            )}
                          </button>
                        </td>
                        <td><ResourceIdCell ids={unit.mounted.audioReading} /></td>
                        <td><ResourceIdCell ids={unit.mounted.cultureVideo} /></td>
                        <td><ResourceIdCell ids={unit.mounted.exam} /></td>
                        <td><ResourceIdCell ids={unit.mounted.cultureRead} /></td>
                        <td className="library-action-cell">
                          <button type="button" className="btn btn-secondary btn-sm" onClick={() => openUnitEditor(unit)}>编辑</button>
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
                  测试卷、有声阅读、文化视频、文化点读等资源需要在单元级别配置。点击「配置资源」为单元挂载对应资源。
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className={`config-tab-panel ${activeTab === 'content' ? 'active' : ''}`} role="tabpanel" hidden={activeTab !== 'content'}>
          <div className="config-section">
            <div className="section-title">📋 内容管理</div>
            {bookUnits.length === 0 ? (
              <div className="library-chapter-empty">请先在「结构配置」中新增单元</div>
            ) : (
              <div className="library-content-tree">
                {bookUnits.map((unit) => (
                  <div key={unit.id} className="library-content-unit">
                    <div className="library-content-unit-title">
                      <span>{unit.title}</span>
                      {unit.titleEn && <span className="library-content-unit-en">{unit.titleEn}</span>}
                      <span className="library-unit-lesson-count">{unit.lessons.length} 章</span>
                    </div>
                    {unit.lessons.length === 0 ? (
                      <div className="library-content-lesson empty">暂无章节</div>
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
              章节内容可在「结构配置」中点击「编辑」进行管理
            </div>
          </div>
        </div>

        <div className={`config-tab-panel ${activeTab === 'resources' ? 'active' : ''}`} role="tabpanel" hidden={activeTab !== 'resources'}>
          <div className="config-section">
            <div className="section-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>📝 整本书资源</span>
              <button type="button" className="btn btn-primary btn-sm">➕ 添加资源</button>
            </div>

            <div className="library-file-filter" style={{ marginTop: '16px' }}>
              <span className="filter-label">资源类型筛选：</span>
              <select
                className="form-input form-select"
                value={fileTypeFilter}
                onChange={(e) => setFileTypeFilter(e.target.value as typeof fileTypeFilter)}
                style={{ minWidth: '140px' }}
              >
                <option value="all">全部类型</option>
                <option value="JWL">JWL</option>
                <option value="JWR">JWR</option>
                <option value="JWRT">JWRT</option>
              </select>
            </div>

            <div className="paper-table-container" style={{ marginTop: '12px' }}>
              <table className="paper-table">
                <thead>
                  <tr>
                    <th>资源类型</th>
                    <th>文件名称</th>
                    <th>文件大小</th>
                    <th>上传时间</th>
                    <th>操作</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredBookFiles.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="library-chapter-empty">暂无该类型的资源文件</td>
                    </tr>
                  ) : (
                    filteredBookFiles.map((file) => (
                      <tr key={file.id}>
                        <td><span className={`library-format-badge library-format-badge-${file.type.toLowerCase()}`}>{file.type}</span></td>
                        <td>{file.fileName}</td>
                        <td className="td-mono">{file.fileSize}</td>
                        <td className="td-mono">{file.uploadedAt}</td>
                        <td className="library-action-cell">
                          <button type="button" className="btn-link">下载</button>
                          <button
                            type="button"
                            className="btn-link"
                            style={{ color: 'var(--rose)' }}
                            onClick={() => setBookFiles((prev) => prev.filter((f) => f.id !== file.id))}
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

            <div className="library-info-box" style={{ marginTop: '16px' }}>
              <div className="library-info-box-icon">💡</div>
              <div>
                <div className="library-info-box-title">单元级资源配置</div>
                <div className="library-info-box-text">
                  测试卷、有声阅读、文化视频、文化点读等资源需要在单元级别配置。请在「结构配置」Tab 中点击对应单元的「配置资源」按钮进行设置。
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {editingUnit && (
        <UnitChapterEditorModal
          unit={editingUnit}
          onClose={() => setEditingUnit(null)}
          onSave={saveUnitEditor}
        />
      )}

      {resourceMountUnit && (
        <UnitResourceMountModal
          unit={resourceMountUnit}
          onClose={() => setResourceMountUnit(null)}
          onSave={saveUnitResourceMount}
        />
      )}
    </div>
  );
}
