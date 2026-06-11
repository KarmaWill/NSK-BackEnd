import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import {
  KLZW_BOOK1_TESTS,
  KLZW_BOOK_TABS,
  type KlzwTestKey,
  getKlzwTemplate,
  getKlzwTemplatesByBook,
  getOfficialTemplateByHskLevel,
} from '../data/hskOfficialTemplates';
import { useHskStore } from '../hooks/useHskStore';
import {
  deleteTemplate,
  loadHskStore,
  publishTemplate,
  saveTemplate,
} from '../stores/hskExams';
import type {
  HskPaperTemplate,
  HskQuestionTypeCode,
  HskQuestionTypeDef,
  HskSectionModule,
  HskTemplateSection,
} from '../types/hskExams';
import {
  computeSectionNumberRanges,
  CUSTOM_COLORS,
  findTypeDef,
  getTemplateColors,
  getTemplateDisplayDuration,
  getTypeCardColorPrefix,
  HSK_LEVEL_COLORS,
  MODULE_META,
  moduleUniqueTypeCount,
  sectionHasExample,
  type SectionRange,
} from '../utils/hskTemplateDisplay';
import { createEmptyTemplate, recalcTemplateTotals } from '../utils/hskPaperUtils';
import { ASSESSMENT_TEMPLATE_ENTRIES } from '../config/assessmentTemplates';
import type { PanelId } from '../types';

type PrimaryTab = 'HSK' | 'KLZW' | 'custom';

type CopyModalState = {
  template: HskPaperTemplate;
};

type NewTemplateModalData = {
  parentCategory: 'HSK' | 'KLZW';
  level?: string;
  book?: string;
  categoryId?: string;
};

type HskCustomCategory = {
  id: string;
  name: string;
};

const HSK_CUSTOM_CATEGORIES_KEY = 'hsk_custom_hsk_categories';

function loadHskCustomCategories(): HskCustomCategory[] {
  try {
    const raw = localStorage.getItem(HSK_CUSTOM_CATEGORIES_KEY);
    return raw ? (JSON.parse(raw) as HskCustomCategory[]) : [];
  } catch {
    return [];
  }
}

function saveHskCustomCategories(categories: HskCustomCategory[]) {
  localStorage.setItem(HSK_CUSTOM_CATEGORIES_KEY, JSON.stringify(categories));
}

function truncateTabLabel(name: string, max = 8): string {
  return name.length > max ? `${name.slice(0, max)}…` : name;
}

function ExamModalPortal({ children }: { children: ReactNode }) {
  return createPortal(children, document.body);
}

function ExamModalOverlay({
  children,
  onClose,
  className = '',
}: {
  children: ReactNode;
  onClose: () => void;
  className?: string;
}) {
  return (
    <ExamModalPortal>
      <div className="hsk-exam-modal-overlay" onClick={onClose} role="presentation">
        <div
          className={`hsk-exam-modal ${className}`.trim()}
          onClick={(e) => e.stopPropagation()}
          role="dialog"
          aria-modal="true"
        >
          {children}
        </div>
      </div>
    </ExamModalPortal>
  );
}

function StatCard({ label, value, unit }: { label: string; value: string | number; unit?: string }) {
  return (
    <div className="hsk-exam-stat-card">
      <span className="hsk-exam-stat-label">{label}</span>
      <span className="hsk-exam-stat-value">{value}</span>
      {unit && <span className="hsk-exam-stat-unit">{unit}</span>}
    </div>
  );
}

function TypeCard({
  section,
  range,
  typeDef,
  readOnly,
  onDelete,
}: {
  section: HskTemplateSection;
  range: string;
  typeDef?: HskQuestionTypeDef;
  readOnly?: boolean;
  onDelete?: () => void;
}) {
  const prefix = getTypeCardColorPrefix(section.questionType);
  const colorClass = prefix === 'R' ? 'is-r' : prefix === 'W' ? 'is-w' : 'is-l';

  return (
    <div className={`hsk-exam-type-card ${colorClass}`}>
      {!readOnly && onDelete && (
        <button type="button" className="hsk-exam-type-card-delete" onClick={onDelete} title="删除此题型">
          ×
        </button>
      )}
      <div className="hsk-exam-type-card-badges">
        <span className="hsk-exam-type-code">{section.questionType}</span>
        {section.isCompound && <span className="hsk-exam-type-tag is-compound">复合</span>}
        {sectionHasExample(section) && <span className="hsk-exam-type-tag is-example">含示例</span>}
      </div>
      <p className="hsk-exam-type-name">{typeDef?.name ?? section.questionType}</p>
      <p className="hsk-exam-type-count">
        {section.scoringCount} 题
        {section.totalCount !== section.scoringCount && (
          <span className="muted">（含{section.totalCount - section.scoringCount}示例）</span>
        )}
      </p>
      <p className="hsk-exam-type-range">{range}</p>
    </div>
  );
}

function ModuleBlock({
  mod,
  template,
  sectionRanges,
  typeDefs,
  readOnly,
  onDeleteSection,
  onAddSection,
}: {
  mod: HskPaperTemplate['modules'][number];
  template: HskPaperTemplate;
  sectionRanges: SectionRange[];
  typeDefs: HskQuestionTypeDef[];
  readOnly?: boolean;
  onDeleteSection?: (sectionId: string) => void;
  onAddSection?: () => void;
}) {
  const meta = MODULE_META[mod.id] ?? MODULE_META.listening;
  const rangeMap = Object.fromEntries(sectionRanges.map((r) => [r.sectionId, r.range]));
  const tb = template.timeBlocks;

  return (
    <div className="hsk-exam-module">
      <div className="hsk-exam-module-head">
        <span className="hsk-exam-module-dot" style={{ background: meta.primary }} />
        <span className="hsk-exam-module-icon">{meta.icon}</span>
        <span className="hsk-exam-module-title">{meta.label}</span>
        <span className="hsk-exam-module-meta">
          {moduleUniqueTypeCount(mod)}种题型 · {mod.totalQuestions}题
        </span>
        {mod.id === 'listening' && tb.listening > 0 && (
          <span className="hsk-exam-module-time">⏱ {tb.listening} 分钟</span>
        )}
        {mod.id === 'reading' && tb.reading > 0 && (
          <span className="hsk-exam-module-time">⏱ {tb.reading} 分钟</span>
        )}
        {mod.id === 'writing' && tb.writing > 0 && (
          <span className="hsk-exam-module-time">⏱ {tb.writing} 分钟</span>
        )}
      </div>
      <div className="hsk-exam-type-grid">
        {mod.sections.map((sec) => (
          <TypeCard
            key={sec.id}
            section={sec}
            range={rangeMap[sec.id] ?? ''}
            typeDef={findTypeDef(typeDefs, sec.questionType)}
            readOnly={readOnly}
            onDelete={onDeleteSection ? () => onDeleteSection(sec.id) : undefined}
          />
        ))}
        {!readOnly && onAddSection && (
          <button type="button" className="hsk-exam-add-type" onClick={onAddSection}>
            <span className="hsk-exam-add-type-icon">+</span>
            <span>添加题型</span>
          </button>
        )}
      </div>
      {mod.id === 'listening' && tb.buffer > 0 && (
        <p className="hsk-exam-module-hint">
          听力作答后有 {tb.buffer} 分钟缓冲期，期间可检查答案但不可修改
        </p>
      )}
      {mod.id === 'listening' && tb.prep > 0 && (
        <p className="hsk-exam-module-hint">考前 {tb.prep} 分钟准备期，用于音频测试与阅读考纪</p>
      )}
    </div>
  );
}

function TemplateDetailPanel({
  template,
  typeDefs,
  readOnly,
  onChange,
  onSave,
  onPublish,
  publishError,
}: {
  template: HskPaperTemplate;
  typeDefs: HskQuestionTypeDef[];
  readOnly?: boolean;
  onChange?: (t: HskPaperTemplate) => void;
  onSave?: () => void;
  onPublish?: () => void;
  publishError?: string | null;
}) {
  const sectionRanges = useMemo(() => computeSectionNumberRanges(template), [template]);
  const colors = getTemplateColors(template);
  const duration = getTemplateDisplayDuration(template);

  const updateTemplate = (patch: Partial<HskPaperTemplate>) => {
    if (!onChange) return;
    onChange(recalcTemplateTotals({ ...template, ...patch }, typeDefs));
  };

  const deleteSection = (moduleId: HskSectionModule, sectionId: string) => {
    if (!onChange) return;
    const modules = template.modules.map((m) =>
      m.id === moduleId ? { ...m, sections: m.sections.filter((s) => s.id !== sectionId) } : m,
    );
    onChange(recalcTemplateTotals({ ...template, modules }, typeDefs));
  };

  const addSection = (moduleId: HskSectionModule) => {
    if (!onChange) return;
    const defaultType =
      typeDefs.find((t) => t.section === moduleId)?.hskTypeCode ??
      (moduleId === 'listening' ? 'L01' : moduleId === 'reading' ? 'R01' : 'W01');
    const modules = template.modules.map((m) => {
      if (m.id !== moduleId) return m;
      return {
        ...m,
        sections: [
          ...m.sections,
          {
            id: `${moduleId}_s${Date.now()}`,
            name: `第 ${m.sections.length + 1} 部分`,
            questionType: defaultType as HskQuestionTypeCode,
            isCompound: false,
            groups: [{ questionCount: 5, hasExample: false, exampleCount: 0 }],
            totalCount: 5,
            scoringCount: 5,
          },
        ],
      };
    });
    onChange(recalcTemplateTotals({ ...template, modules }, typeDefs));
  };

  return (
    <div className="hsk-exam-template-detail">
      <div className="hsk-exam-template-hero" style={{ borderLeftColor: colors.primary }}>
        <div>
          <div className="hsk-exam-template-hero-badges">
            {readOnly ? (
              <span className="hsk-exam-badge-official">📋 官方模板</span>
            ) : (
              <span className="hsk-exam-badge-custom" style={{ background: CUSTOM_COLORS.gradient }}>
                自定义
              </span>
            )}
            <span
              className={`hsk-exam-status-badge${template.status === 'published' ? ' is-published' : ''}`}
            >
              {template.status === 'published' ? '已发布' : '草稿'}
            </span>
          </div>
          <h2 className="hsk-exam-template-name">{template.name}</h2>
          <p className="hsk-exam-template-level">{template.level}</p>
        </div>
        {!readOnly && (
          <div className="hsk-exam-template-actions">
            <button type="button" className="hsk-exam-btn-secondary" onClick={onSave}>
              保存草稿
            </button>
            <button
              type="button"
              className="hsk-exam-btn-primary"
              style={{ background: CUSTOM_COLORS.gradient }}
              onClick={onPublish}
            >
              发布模板
            </button>
          </div>
        )}
      </div>

      {publishError && <div className="hsk-exam-error">{publishError}</div>}

      {!readOnly && (
        <div className="hsk-exam-meta-form">
          <div className="hsk-exam-meta-grid">
            <label>
              <span>模板名称</span>
              <input
                value={template.name}
                onChange={(e) => updateTemplate({ name: e.target.value })}
              />
            </label>
            <label>
              <span>卷面总分</span>
              <input
                type="number"
                value={template.totalScore}
                onChange={(e) => updateTemplate({ totalScore: Number(e.target.value) || 0 })}
              />
            </label>
            <label>
              <span>合格分数</span>
              <input
                type="number"
                value={template.passScore}
                onChange={(e) => updateTemplate({ passScore: Number(e.target.value) || 0 })}
              />
            </label>
            <label>
              <span>考试总时长 (分钟)</span>
              <input
                type="number"
                value={template.totalDuration}
                onChange={(e) => updateTemplate({ totalDuration: Number(e.target.value) || 0 })}
              />
            </label>
          </div>
        </div>
      )}

      <div className="hsk-exam-stats-row">
        <StatCard label="考试时长" value={duration} unit="分钟" />
        <StatCard label="题目总数" value={template.totalQuestions} unit="道" />
        <StatCard label="卷面总分" value={template.totalScore} unit="分" />
        <StatCard label="合格分数" value={template.passScore} unit="分" />
        <StatCard label="缓冲时间" value={template.timeBlocks.buffer} unit="分钟" />
      </div>

      {template.modules
        .filter((m) => m.sections.length > 0 || !readOnly)
        .map((mod) => (
          <ModuleBlock
            key={mod.id}
            mod={mod}
            template={template}
            sectionRanges={sectionRanges}
            typeDefs={typeDefs}
            readOnly={readOnly}
            onDeleteSection={readOnly ? undefined : (id) => deleteSection(mod.id, id)}
            onAddSection={readOnly ? undefined : () => addSection(mod.id)}
          />
        ))}
    </div>
  );
}

function CopyTemplateModal({
  template,
  onConfirm,
  onClose,
}: {
  template: HskPaperTemplate;
  onConfirm: (name: string) => void;
  onClose: () => void;
}) {
  const [name, setName] = useState(`${template.name} (副本)`);

  return (
    <ExamModalOverlay onClose={onClose}>
      <h3>复制为自定义模板</h3>
      <label className="hsk-exam-modal-field">
        <span>模板名称</span>
        <input value={name} onChange={(e) => setName(e.target.value)} />
      </label>
      <div className="hsk-exam-modal-actions">
        <button type="button" className="hsk-exam-btn-secondary" onClick={onClose}>
          取消
        </button>
        <button
          type="button"
          className="hsk-exam-btn-primary"
          style={{ background: CUSTOM_COLORS.gradient }}
          disabled={!name.trim()}
          onClick={() => onConfirm(name.trim())}
        >
          确认复制
        </button>
      </div>
    </ExamModalOverlay>
  );
}

function CustomTemplateCard({
  template,
  onEdit,
}: {
  template: HskPaperTemplate;
  onEdit: () => void;
}) {
  const duration = getTemplateDisplayDuration(template);
  const isPublished = template.status === 'published';

  return (
    <div className="hsk-exam-custom-card">
      <div className="hsk-exam-custom-card-top">
        <span className="hsk-exam-badge-custom-sm" style={{ background: CUSTOM_COLORS.gradient }}>
          自定义
        </span>
        {template.parentCategory && (
          <span className="hsk-exam-parent-badge">{template.parentCategory}</span>
        )}
        <span className={`hsk-exam-status-badge${isPublished ? ' is-published' : ''}`}>
          {isPublished ? '已发布' : '草稿'}
        </span>
      </div>
      <h3>{template.name}</h3>
      <div className="hsk-exam-custom-card-meta">
        <p>
          ⏱ {duration} 分钟 · 📋 {template.totalQuestions} 题 · 📊 {template.totalScore} 分
        </p>
        <p>
          合格 {template.passScore} 分 · 缓冲 {template.timeBlocks.buffer} 分钟
        </p>
        <p className="muted">{template.modules.filter((m) => m.sections.length > 0).length} 个模块</p>
      </div>
      <button type="button" className="hsk-exam-custom-edit-btn" onClick={onEdit}>
        编辑
      </button>
    </div>
  );
}

function AssessmentTemplateCard({
  title,
  description,
  icon,
  onConfigure,
}: {
  title: string;
  description: string;
  icon: string;
  onConfigure: () => void;
}) {
  return (
    <div className="hsk-exam-assess-card">
      <div className="hsk-exam-assess-card-top">
        <span className="hsk-exam-assess-icon" aria-hidden>
          {icon}
        </span>
      </div>
      <h3>{title}</h3>
      <p className="hsk-exam-assess-desc">{description}</p>
      <button type="button" className="hsk-exam-custom-edit-btn" onClick={onConfigure}>
        配置
      </button>
    </div>
  );
}

function NewHskCategoryModal({
  onConfirm,
  onClose,
}: {
  onConfirm: (name: string) => void;
  onClose: () => void;
}) {
  const [name, setName] = useState('');

  const submit = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    onConfirm(trimmed);
  };

  return (
    <ExamModalOverlay onClose={onClose} className="hsk-exam-category-modal">
      <h3 className="hsk-exam-category-modal-title">新建分类</h3>
      <label className="hsk-exam-category-modal-field">
        <span>分类名称</span>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="例如：HSK 8"
          autoFocus
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              submit();
            }
          }}
        />
      </label>
      <div className="hsk-exam-category-modal-actions">
        <button type="button" className="hsk-exam-btn-secondary" onClick={onClose}>
          取消
        </button>
        <button
          type="button"
          className="hsk-exam-category-modal-confirm"
          disabled={!name.trim()}
          onClick={submit}
        >
          确认创建
        </button>
      </div>
    </ExamModalOverlay>
  );
}

function CreateTemplateZone({ onClick }: { onClick: () => void }) {
  return (
    <button type="button" className="hsk-exam-new-template-zone" onClick={onClick}>
      <span className="hsk-exam-new-template-zone-icon">＋</span>
      <span>+ 在当前分类下新建模板</span>
    </button>
  );
}

function NewTemplateModal({
  initialData,
  onConfirm,
  onClose,
}: {
  initialData: NewTemplateModalData;
  onConfirm: (template: HskPaperTemplate) => void;
  onClose: () => void;
}) {
  const [name, setName] = useState('');
  const [totalDuration, setTotalDuration] = useState(30);
  const [totalQuestions, setTotalQuestions] = useState(20);
  const [fullScore, setFullScore] = useState('');
  const [passScore, setPassScore] = useState('');
  const [modules, setModules] = useState([{ name: '听力', count: '10' }, { name: '阅读', count: '10' }]);

  const parentLabel =
    initialData.parentCategory === 'HSK'
      ? `HSK ${initialData.level ?? ''} 级`
      : initialData.book
        ? `快乐中文 · 第${initialData.book}册`
        : '快乐中文';

  const updateModule = (index: number, field: 'name' | 'count', value: string) => {
    setModules((prev) => prev.map((m, i) => (i === index ? { ...m, [field]: value } : m)));
  };

  const handleSubmit = () => {
    if (!name.trim() || !totalDuration || !totalQuestions) return;
    const moduleRows = modules
      .filter((m) => m.name.trim())
      .map((m, i) => ({
        id: (['listening', 'reading', 'writing'][i] ?? `mod_${i}`) as HskSectionModule,
        name: m.name.trim(),
        totalQuestions: Number(m.count) || 0,
        sections: [] as HskPaperTemplate['modules'][number]['sections'],
      }));
    const tpl = createEmptyTemplate({
      id: `custom_${Date.now()}`,
      name: name.trim(),
      category: 'custom',
      level: initialData.parentCategory === 'HSK' ? `HSK${initialData.level}` : 'custom',
      parentCategory: initialData.parentCategory,
      categoryId: initialData.categoryId ?? (initialData.book ? `book-${initialData.book}` : null),
      totalQuestions: Number(totalQuestions) || 0,
      totalDuration: Number(totalDuration) || 30,
      totalScore: fullScore ? Number(fullScore) : 0,
      passScore: passScore ? Number(passScore) : 0,
      modules:
        moduleRows.length > 0
          ? moduleRows
          : [
              { id: 'listening', name: '听力', totalQuestions: 0, sections: [] },
              { id: 'reading', name: '阅读', totalQuestions: 0, sections: [] },
              { id: 'writing', name: '书写', totalQuestions: 0, sections: [] },
            ],
      status: 'draft',
    });
    onConfirm(tpl);
  };

  return (
    <ExamModalOverlay onClose={onClose} className="hsk-exam-modal-lg">
        <h3>在 {parentLabel} 分类下新建模板</h3>
        <div className="hsk-exam-new-tpl-form">
          <label className="hsk-exam-modal-field">
            <span>
              模板名称 <em>*</em>
            </span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Tab 中最多显示8字，全名在 hover tooltip 显示"
              autoFocus
            />
          </label>
          <div className="hsk-exam-new-tpl-row">
            <label className="hsk-exam-modal-field">
              <span>
                考试时长 <em>*</em>
              </span>
              <div className="hsk-exam-input-with-unit">
                <input
                  type="number"
                  min={1}
                  value={totalDuration}
                  onChange={(e) => setTotalDuration(Number(e.target.value) || 0)}
                />
                <span>分钟</span>
              </div>
            </label>
            <label className="hsk-exam-modal-field">
              <span>
                总题数 <em>*</em>
              </span>
              <div className="hsk-exam-input-with-unit">
                <input
                  type="number"
                  min={1}
                  value={totalQuestions}
                  onChange={(e) => setTotalQuestions(Number(e.target.value) || 0)}
                />
                <span>题</span>
              </div>
            </label>
          </div>
          <div className="hsk-exam-new-tpl-row">
            <label className="hsk-exam-modal-field">
              <span>满分</span>
              <div className="hsk-exam-input-with-unit">
                <input value={fullScore} onChange={(e) => setFullScore(e.target.value)} placeholder="自动" />
                <span>分</span>
              </div>
            </label>
            <label className="hsk-exam-modal-field">
              <span>合格分</span>
              <div className="hsk-exam-input-with-unit">
                <input value={passScore} onChange={(e) => setPassScore(e.target.value)} placeholder="自动" />
                <span>分</span>
              </div>
            </label>
          </div>
          <div className="hsk-exam-new-tpl-modules">
            <div className="hsk-exam-new-tpl-modules-head">
              <span>模块配置（可增减，每行一个模块）</span>
              <button
                type="button"
                className="hsk-exam-new-tpl-add-module"
                onClick={() => setModules((prev) => [...prev, { name: '', count: '' }])}
              >
                + 添加模块
              </button>
            </div>
            {modules.map((mod, i) => (
              <div key={i} className="hsk-exam-new-tpl-module-row">
                <input
                  value={mod.name}
                  onChange={(e) => updateModule(i, 'name', e.target.value)}
                  placeholder="模块名称"
                />
                <input
                  type="number"
                  min={0}
                  value={mod.count}
                  onChange={(e) => updateModule(i, 'count', e.target.value)}
                  placeholder="题数"
                />
                {modules.length > 1 && (
                  <button type="button" className="hsk-exam-new-tpl-remove" onClick={() => setModules((prev) => prev.filter((_, j) => j !== i))}>
                    ×
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
        <div className="hsk-exam-modal-actions">
          <button type="button" className="hsk-exam-btn-secondary" onClick={onClose}>
            取消
          </button>
          <button
            type="button"
            className="hsk-exam-btn-primary"
            style={{ background: CUSTOM_COLORS.gradient }}
            disabled={!name.trim() || !totalDuration || !totalQuestions}
            onClick={handleSubmit}
          >
            创建模板
          </button>
        </div>
    </ExamModalOverlay>
  );
}

function KlzwTestCard({
  label,
  icon,
  template,
  colorIndex,
  onClick,
}: {
  label: string;
  icon: string;
  template?: HskPaperTemplate;
  colorIndex: number;
  onClick: () => void;
}) {
  const isAvailable = Boolean(template);
  const palette = [HSK_LEVEL_COLORS[4], HSK_LEVEL_COLORS[5], HSK_LEVEL_COLORS[3], HSK_LEVEL_COLORS[2]];
  const colors = palette[colorIndex % palette.length];

  return (
    <button
      type="button"
      className="hsk-exam-klzw-card"
      disabled={!isAvailable}
      onClick={onClick}
    >
      <div className="hsk-exam-klzw-card-head">
        <div
          className="hsk-exam-klzw-icon"
          style={{ background: isAvailable ? colors.gradient : '#e5e7eb' }}
        >
          {icon}
        </div>
        <div>
          <h4>{label}</h4>
          {!isAvailable && <span className="hsk-exam-coming-soon">即将推出</span>}
        </div>
      </div>
      {isAvailable && template && (
        <div className="hsk-exam-klzw-meta">
          <p>
            ⏱ {getTemplateDisplayDuration(template)} 分钟 · 📋 {template.totalQuestions} 题
          </p>
          <p>{template.modules.length} 个模块</p>
        </div>
      )}
    </button>
  );
}

export function HskExamManager({ onNavigate }: { onNavigate?: (id: PanelId) => void }) {
  const { store, refresh } = useHskStore();
  const [primaryTab, setPrimaryTab] = useState<PrimaryTab>('HSK');
  const [hskActiveTab, setHskActiveTab] = useState<number | string>(1);
  const [customHskCategories, setCustomHskCategories] = useState<HskCustomCategory[]>(() =>
    loadHskCustomCategories(),
  );
  const [klzwBook, setKlzwBook] = useState('1');
  const [klzwTest, setKlzwTest] = useState<KlzwTestKey | null>(null);
  const [editingCustom, setEditingCustom] = useState<HskPaperTemplate | null>(null);
  const [copyModal, setCopyModal] = useState<CopyModalState | null>(null);
  const [newTemplateModal, setNewTemplateModal] = useState<NewTemplateModalData | null>(null);
  const [showNewHskCategoryModal, setShowNewHskCategoryModal] = useState(false);
  const [publishError, setPublishError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    saveHskCustomCategories(customHskCategories);
  }, [customHskCategories]);

  const showToast = (msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(null), 2200);
  };

  const customTemplates = useMemo(
    () => store.templates.filter((t) => t.category === 'custom' || t.category === 'practice'),
    [store.templates],
  );

  const hskCategoryTemplate = useMemo(() => {
    if (typeof hskActiveTab !== 'string') return undefined;
    return store.templates.find(
      (t) => t.parentCategory === 'HSK' && t.categoryId === hskActiveTab,
    );
  }, [hskActiveTab, store.templates]);

  const officialTemplate = useMemo(() => {
    if (primaryTab === 'HSK') {
      if (typeof hskActiveTab === 'number') return getOfficialTemplateByHskLevel(hskActiveTab);
      return hskCategoryTemplate;
    }
    if (primaryTab === 'KLZW' && klzwTest) return getKlzwTemplate(klzwTest, klzwBook);
    return undefined;
  }, [primaryTab, hskActiveTab, klzwTest, klzwBook, hskCategoryTemplate]);

  const isViewingOfficialTemplate = officialTemplate?.category === 'official';

  const openNewTemplateModal = () => {
    if (primaryTab === 'HSK') {
      if (typeof hskActiveTab === 'number') {
        setNewTemplateModal({ parentCategory: 'HSK', level: String(hskActiveTab) });
      } else {
        setNewTemplateModal({
          parentCategory: 'HSK',
          level: 'custom',
          categoryId: hskActiveTab,
        });
      }
      return;
    }
    if (primaryTab === 'KLZW') {
      setNewTemplateModal({ parentCategory: 'KLZW', book: klzwBook });
    }
  };

  const handleCreateHskCategory = (name: string) => {
    const newCat: HskCustomCategory = { id: `hsk_cat_${Date.now()}`, name };
    setCustomHskCategories((prev) => [...prev, newCat]);
    setShowNewHskCategoryModal(false);
    setHskActiveTab(newCat.id);
    showToast(`已创建分类「${name}」`);
  };

  const handleNewTemplateConfirm = (template: HskPaperTemplate) => {
    saveTemplate(store, template);
    refresh();
    setNewTemplateModal(null);
    if (template.parentCategory === 'HSK' && template.categoryId?.startsWith('hsk_cat_')) {
      setPrimaryTab('HSK');
      setHskActiveTab(template.categoryId);
      setEditingCustom(template);
    } else {
      setPrimaryTab('custom');
      setEditingCustom(template);
    }
    showToast('模板已创建');
  };

  const viewingTemplate = editingCustom ?? officialTemplate;

  const handleCopyConfirm = (name: string) => {
    if (!copyModal) return;
    const source = copyModal.template;
    const clone = structuredClone(source);
    clone.id = `custom_${Date.now()}`;
    clone.name = name;
    clone.category = 'custom';
    clone.status = 'draft';
    clone.parentCategory = source.parentCategory;
    clone.updatedAt = new Date().toISOString();
    saveTemplate(store, clone);
    refresh();
    setCopyModal(null);
    setPrimaryTab('custom');
    setEditingCustom(clone);
    showToast('已复制为自定义模板');
  };

  const handleCreateCustom = () => {
    const tpl = createEmptyTemplate({
      name: '未命名模板',
      category: 'custom',
      parentCategory: null,
    });
    saveTemplate(store, tpl);
    refresh();
    setPrimaryTab('custom');
    setEditingCustom(tpl);
    showToast('已创建空白自定义模板');
  };

  const handleSaveCustom = () => {
    if (!editingCustom) return;
    saveTemplate(store, { ...editingCustom, status: 'draft' });
    refresh();
    showToast('模板草稿已保存');
  };

  const handlePublishCustom = () => {
    if (!editingCustom) return;
    saveTemplate(store, editingCustom);
    const err = publishTemplate(loadHskStore(), editingCustom.id);
    if (err) {
      setPublishError(err);
      return;
    }
    setPublishError(null);
    refresh();
    setEditingCustom(null);
    showToast('模板已发布');
  };

  const handleDeleteCustom = () => {
    if (!editingCustom) return;
    if (!window.confirm(`确认删除模板「${editingCustom.name}」？`)) return;
    deleteTemplate(store, editingCustom.id);
    refresh();
    setEditingCustom(null);
    showToast('模板已删除');
  };

  if (editingCustom) {
    return (
      <div className="hsk-exam-mgmt">
        <div className="hsk-exam-mgmt-header">
          <button
            type="button"
            className="hsk-exam-back"
            onClick={() => {
              setEditingCustom(null);
              setPublishError(null);
            }}
          >
            ← 返回列表
          </button>
          <button type="button" className="hsk-exam-btn-danger-text" onClick={handleDeleteCustom}>
            删除模板
          </button>
        </div>
        <TemplateDetailPanel
          template={editingCustom}
          typeDefs={store.questionTypes}
          onChange={setEditingCustom}
          onSave={handleSaveCustom}
          onPublish={handlePublishCustom}
          publishError={publishError}
        />
        {toast && <div className="hsk-toast show">{toast}</div>}
      </div>
    );
  }

  return (
    <div className="hsk-exam-mgmt">
      <div className="hsk-exam-mgmt-header">
        <div>
          <h1 className="hsk-exam-mgmt-title">考试管理</h1>
          <p className="hsk-exam-mgmt-subtitle">模板配置中心 — 定义、预览、发布考试模板</p>
        </div>
        {viewingTemplate && primaryTab !== 'custom' && isViewingOfficialTemplate && (
          <div className="hsk-exam-mgmt-header-actions">
            <span className="hsk-exam-badge-official">📋 官方模板</span>
            <button
              type="button"
              className="hsk-exam-copy-btn"
              style={{ background: CUSTOM_COLORS.gradient }}
              onClick={() => setCopyModal({ template: viewingTemplate })}
            >
              复制为自定义模板
            </button>
          </div>
        )}
      </div>

      <div className="hsk-exam-primary-tabs">
        {(['HSK', 'KLZW', 'custom'] as PrimaryTab[]).map((tab) => (
          <button
            key={tab}
            type="button"
            className={`hsk-exam-primary-tab${primaryTab === tab ? ' is-active' : ''}`}
            onClick={() => {
              setPrimaryTab(tab);
              setKlzwTest(null);
              setKlzwBook('1');
            }}
          >
            {tab === 'HSK' ? 'HSK' : tab === 'KLZW' ? '快乐中文' : '✦自定义模板'}
          </button>
        ))}
      </div>

      {primaryTab === 'HSK' && (
        <div className="hsk-exam-level-tabs">
          {[1, 2, 3, 4, 5, 6].map((lv) => (
            <button
              key={lv}
              type="button"
              className={`hsk-exam-level-tab${hskActiveTab === lv ? ' is-active' : ''}`}
              style={
                hskActiveTab === lv
                  ? { background: HSK_LEVEL_COLORS[lv]?.gradient, color: '#fff' }
                  : undefined
              }
              onClick={() => setHskActiveTab(lv)}
            >
              HSK {lv}
            </button>
          ))}
          {customHskCategories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              className={`hsk-exam-level-tab hsk-exam-level-tab-custom${hskActiveTab === cat.id ? ' is-active' : ''}`}
              title={cat.name}
              onClick={() => setHskActiveTab(cat.id)}
            >
              {truncateTabLabel(cat.name)}
            </button>
          ))}
          <button
            type="button"
            className="hsk-exam-level-tab is-add"
            title="新建分类"
            onClick={(e) => {
              e.stopPropagation();
              setShowNewHskCategoryModal(true);
            }}
          >
            ＋
          </button>
          <button type="button" className="hsk-exam-version-btn" onClick={() => showToast('版本历史功能即将上线')}>
            版本历史
          </button>
        </div>
      )}

      {primaryTab === 'KLZW' && (
        <div className="hsk-exam-level-tabs">
          {KLZW_BOOK_TABS.map((book) => (
            <button
              key={book.id}
              type="button"
              className={`hsk-exam-level-tab${klzwBook === book.id ? ' is-active' : ''}`}
              style={
                klzwBook === book.id
                  ? { background: CUSTOM_COLORS.gradient, color: '#fff', borderColor: 'transparent' }
                  : undefined
              }
              onClick={() => {
                setKlzwBook(book.id);
                setKlzwTest(null);
              }}
            >
              {book.label}
            </button>
          ))}
          <button
            type="button"
            className="hsk-exam-level-tab is-add"
            title="新建册次"
            onClick={(e) => {
              e.stopPropagation();
              setNewTemplateModal({ parentCategory: 'KLZW', book: klzwBook });
            }}
          >
            ＋
          </button>
        </div>
      )}

      {primaryTab === 'KLZW' && klzwTest && (
        <div className="hsk-exam-klzw-back">
          <button type="button" className="hsk-exam-back" onClick={() => setKlzwTest(null)}>
            ← 返回快乐中文
          </button>
        </div>
      )}

      {primaryTab === 'KLZW' && !klzwTest && getKlzwTemplatesByBook(klzwBook).length > 0 && (
        <div className="hsk-exam-klzw-grid hsk-exam-klzw-grid-4">
          {KLZW_BOOK1_TESTS.map((test, index) => (
            <KlzwTestCard
              key={test.key}
              label={test.label}
              icon={test.icon}
              colorIndex={index}
              template={getKlzwTemplate(test.key, klzwBook)}
              onClick={() => setKlzwTest(test.key)}
            />
          ))}
        </div>
      )}

      {primaryTab === 'KLZW' && !klzwTest && getKlzwTemplatesByBook(klzwBook).length === 0 && (
        <>
          <div className="hsk-exam-empty">
            <p>{KLZW_BOOK_TABS.find((b) => b.id === klzwBook)?.label ?? `第${klzwBook}册`}暂无模板</p>
            <p className="muted">点击下方创建第一个模板</p>
          </div>
          <CreateTemplateZone onClick={openNewTemplateModal} />
        </>
      )}

      {primaryTab === 'custom' && (
        <>
          <section className="hsk-exam-assess-section">
            <div className="hsk-exam-assess-section-head">
              <h2 className="hsk-exam-assess-section-title">测评类模板</h2>
              <p className="hsk-exam-assess-section-desc">
                入门诊断、多元智能、学习风格、MBTI 等非 HSK 标准卷，统一在此入口配置
              </p>
            </div>
            <div className="hsk-exam-assess-grid">
              {ASSESSMENT_TEMPLATE_ENTRIES.map((entry) => (
                <AssessmentTemplateCard
                  key={entry.panel}
                  title={entry.title}
                  description={entry.description}
                  icon={entry.icon}
                  onConfigure={() => onNavigate?.(entry.panel)}
                />
              ))}
            </div>
          </section>

          <section className="hsk-exam-custom-section">
            <div className="hsk-exam-custom-toolbar">
              <div>
                <h2 className="hsk-exam-custom-section-title">试卷自定义模板</h2>
                <p className="hsk-exam-custom-section-desc">基于 HSK / 快乐中文结构复制的可编辑试卷模板</p>
              </div>
              <button
                type="button"
                className="hsk-exam-btn-primary"
                style={{ background: CUSTOM_COLORS.gradient }}
                onClick={handleCreateCustom}
              >
                + 新建自定义模板
              </button>
            </div>

            {customTemplates.length === 0 ? (
              <div className="hsk-exam-empty hsk-exam-empty-compact">
                <p className="muted">暂无试卷自定义模板，可从官方模板复制或新建空白模板</p>
              </div>
            ) : (
              <div className="hsk-exam-custom-grid">
                {customTemplates.map((tpl) => (
                  <CustomTemplateCard
                    key={tpl.id}
                    template={tpl}
                    onEdit={() => setEditingCustom(structuredClone(tpl))}
                  />
                ))}
              </div>
            )}
          </section>
        </>
      )}

      {primaryTab === 'custom' ? null : primaryTab === 'KLZW' && !klzwTest ? null : viewingTemplate ? (
        <>
          <TemplateDetailPanel template={viewingTemplate} typeDefs={store.questionTypes} readOnly />
          <CreateTemplateZone onClick={openNewTemplateModal} />
        </>
      ) : primaryTab === 'HSK' && typeof hskActiveTab === 'string' ? (
        <>
          <div className="hsk-exam-empty">
            <p>该分类下暂无模板</p>
            <p className="muted">点击下方创建第一个模板</p>
          </div>
          <CreateTemplateZone onClick={openNewTemplateModal} />
        </>
      ) : primaryTab === 'HSK' ? (
        <div className="hsk-exam-empty">
          <p>暂无该级别官方模板数据</p>
        </div>
      ) : null}

      {copyModal && (
        <CopyTemplateModal
          template={copyModal.template}
          onConfirm={handleCopyConfirm}
          onClose={() => setCopyModal(null)}
        />
      )}

      {newTemplateModal && (
        <NewTemplateModal
          initialData={newTemplateModal}
          onConfirm={handleNewTemplateConfirm}
          onClose={() => setNewTemplateModal(null)}
        />
      )}

      {showNewHskCategoryModal && (
        <NewHskCategoryModal
          onConfirm={handleCreateHskCategory}
          onClose={() => setShowNewHskCategoryModal(false)}
        />
      )}

      {toast && <div className="hsk-toast show">{toast}</div>}
    </div>
  );
}
