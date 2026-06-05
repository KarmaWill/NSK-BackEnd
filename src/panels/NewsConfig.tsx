import { useCallback, useEffect, useMemo, useRef, useState, type MutableRefObject, type ReactNode } from 'react';
import type { DragEndEvent } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { useSortable } from '@dnd-kit/sortable';
import { getActiveProduct, getApiBase, type ProductCode } from '../lib/api';
import {
  BookSortableTableBody,
  LibraryDragHandle,
  reorderBySortOrder,
} from './librarySortable';
import {
  fetchCmsNews,
  cancelCmsNewsSchedule,
  publishCmsNewsNow,
  removeCmsNews,
  reorderCmsNewsDrag,
  saveCmsNews,
  toggleCmsNewsPublish,
} from '../services/cmsNewsService';
import {
  formatNewsBodyLocal,
  formatNewsBodyWithAi,
  isNewsAiFormatEnabled,
} from '../services/newsFormatService';
import {
  findFeaturedNews,
  formatNewsDate,
  NEWS_CATEGORY_PRESETS,
  NEWS_DISPLAY_SLOT_LABELS,
  suggestSlug,
  validateNewsInput,
  type CmsNewsItem,
  type CmsNewsStatus,
  type NewsDisplaySlot,
  type NewsFormInput,
} from '../stores/cmsNews';
import {
  beijingNowDatetimeLocal,
  beijingTodayDate,
  formatScheduleLabel,
  fromBeijingDatetimeLocal,
  NEWS_SCHEDULE_TIMEZONE,
  toBeijingDatetimeLocal,
} from '../stores/cmsNewsSchedule';

const ALL_SLOTS: NewsDisplaySlot[] = ['HOME_GRID', 'NEWS_LIST', 'FEATURED'];

function stripHtml(value: string) {
  return value
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function plainTextToArticleHtml(value: string) {
  return formatNewsBodyLocal(value);
}

function looksLikeHtml(value: string) {
  return /<\/?[a-z][\s\S]*>/i.test(value);
}

function bodyHtmlFromForm(body: string | null) {
  if (!body) return '<p><br></p>';
  if (looksLikeHtml(body)) return body;
  return plainTextToArticleHtml(body) || '<p><br></p>';
}

function normalizeBodyHtml(html: string) {
  const trimmed = html
    .replace(/<p>\s*<br\s*\/?>\s*<\/p>/gi, '')
    .replace(/^<br\s*\/?>$/i, '')
    .trim();
  if (!trimmed) return null;
  return trimmed;
}

function defaultScheduleIso() {
  const local = beijingNowDatetimeLocal();
  const [date, time] = local.split('T');
  const [h, m] = time.split(':').map(Number);
  const nextH = Math.min(h + 1, 23);
  return fromBeijingDatetimeLocal(
    `${date}T${String(nextH).padStart(2, '0')}:${String(m).padStart(2, '0')}`,
  );
}

function reservesFeaturedOnSave(input: NewsFormInput) {
  if (!input.displaySlots.includes('FEATURED')) return false;
  if (input.status === 'PUBLISHED') return true;
  return input.status === 'SCHEDULED' && input.featuredReserveOnSchedule;
}

function newsStatusBadge(row: CmsNewsItem) {
  if (row.status === 'PUBLISHED') return { className: 'badge badge-green', label: '已发布' };
  if (row.status === 'SCHEDULED') {
    return {
      className: 'badge badge-amber',
      label: `定时 · ${formatScheduleLabel(row.scheduledPublishAt)}`,
    };
  }
  return { className: 'badge badge-muted', label: '草稿' };
}

function emptyForm(): NewsFormInput {
  return {
    cardTitle: '',
    heroTitle: null,
    summary: '',
    body: null,
    category: NEWS_CATEGORY_PRESETS[0],
    slug: '',
    coverImageUrl: '',
    coverImageHoverUrl: null,
    heroImageUrl: null,
    featuredBadge: null,
    imageAlt: null,
    displaySlots: ['HOME_GRID', 'NEWS_LIST'],
    status: 'DRAFT',
    publishedAt: null,
    scheduledPublishAt: null,
    featuredReserveOnSchedule: false,
  };
}

function itemToForm(item: CmsNewsItem): NewsFormInput {
  return {
    cardTitle: item.cardTitle,
    heroTitle: item.heroTitle,
    summary: item.summary,
    body: item.body,
    category: item.category,
    slug: item.slug,
    coverImageUrl: item.coverImageUrl,
    coverImageHoverUrl: item.coverImageHoverUrl,
    heroImageUrl: item.heroImageUrl,
    featuredBadge: item.featuredBadge,
    imageAlt: item.imageAlt,
    displaySlots: [...item.displaySlots],
    status: item.status,
    publishedAt: item.publishedAt,
    scheduledPublishAt: item.scheduledPublishAt,
    featuredReserveOnSchedule: item.featuredReserveOnSchedule,
  };
}

function NewsThumb({ src, alt, className }: { src: string; alt?: string; className?: string }) {
  const [failed, setFailed] = useState(false);
  if (!src || failed) {
    return <div className={`news-thumb news-thumb--empty ${className || ''}`.trim()}>无图</div>;
  }
  return (
    <img
      className={`news-thumb ${className || ''}`.trim()}
      src={src.startsWith('http') ? src : `/${src.replace(/^\//, '')}`}
      alt={alt || ''}
      onError={() => setFailed(true)}
    />
  );
}

function SlotBadges({ slots }: { slots: NewsDisplaySlot[] }) {
  return (
    <div className="news-slot-badges">
      {ALL_SLOTS.map((slot) =>
        slots.includes(slot) ? (
          <span key={slot} className={`badge ${slot === 'FEATURED' ? 'badge-teal' : 'badge-muted'}`}>
            {NEWS_DISPLAY_SLOT_LABELS[slot]}
          </span>
        ) : null,
      )}
    </div>
  );
}

type NewsArticleEditorProps = {
  form: NewsFormInput;
  setForm: React.Dispatch<React.SetStateAction<NewsFormInput>>;
  bodyEditorRef: MutableRefObject<HTMLDivElement | null>;
  editorKey: string;
  onTitleBlur: () => void;
  onBodyChange: (html: string | null) => void;
};

function NewsArticleEditor({
  form,
  setForm,
  bodyEditorRef,
  editorKey,
  onTitleBlur,
  onBodyChange,
}: NewsArticleEditorProps) {
  const titleRef = useRef<HTMLHeadingElement>(null);
  const summaryRef = useRef<HTMLParagraphElement>(null);
  const heroImage = form.heroImageUrl?.trim() || form.coverImageUrl;
  const dateLine = `${formatNewsDate(form.publishedAt)} · ${form.category || 'Category'}`;
  const displayTitle = form.heroTitle?.trim() || form.cardTitle;

  useEffect(() => {
    if (titleRef.current) titleRef.current.innerText = displayTitle;
    if (summaryRef.current) summaryRef.current.innerText = form.summary;
    if (bodyEditorRef.current) {
      bodyEditorRef.current.innerHTML = bodyHtmlFromForm(form.body);
    }
  }, [editorKey]);

  return (
    <article className="news-detail-mock news-detail-mock--full news-article-editor">
      <div className="news-article-editor-route">/{form.slug || 'slug'}</div>
      <div className="news-detail-meta">{dateLine}</div>
      <h1
        ref={titleRef}
        className="news-detail-hero news-editable"
        contentEditable
        suppressContentEditableWarning
        data-placeholder="输入标题"
        onInput={(e) => {
          const text = e.currentTarget.innerText.slice(0, 120);
          setForm((f) => ({ ...f, cardTitle: text, heroTitle: null }));
        }}
        onBlur={onTitleBlur}
      />
      <p
        ref={summaryRef}
        className="news-detail-lede news-editable"
        contentEditable
        suppressContentEditableWarning
        data-placeholder="输入摘要"
        onInput={(e) => {
          const text = e.currentTarget.innerText.slice(0, 280);
          setForm((f) => ({ ...f, summary: text }));
        }}
      />
      {heroImage ? (
        <div className="news-detail-lead">
          <NewsThumb src={heroImage} alt={form.imageAlt || displayTitle} className="news-thumb--lead" />
        </div>
      ) : (
        <div className="news-hero-placeholder">在右侧「封面」设置头图</div>
      )}
      <div
        ref={(node) => {
          bodyEditorRef.current = node;
        }}
        className="news-detail-body news-editable news-editable-body"
        contentEditable
        suppressContentEditableWarning
        data-placeholder="输入正文，或使用上方工具插入小标题、列表、引用和图片"
        onInput={(e) => onBodyChange(normalizeBodyHtml(e.currentTarget.innerHTML))}
      />
    </article>
  );
}

function NewsSyncStatus({
  dataSource,
  totalCount,
  publishedCount,
  scheduledCount,
}: {
  dataSource: 'remote' | 'local';
  totalCount: number;
  publishedCount: number;
  scheduledCount: number;
}) {
  const apiBase = getApiBase();
  const apiConnected = dataSource === 'remote';

  return (
    <div className="news-sync-status">
      <span className={`news-sync-pill ${apiConnected ? 'is-ok' : 'is-warn'}`}>
        <span className="news-sync-dot" aria-hidden />
        CMS API {apiConnected ? '已连接' : '未连接'}
        {!apiConnected && <span className="news-sync-meta"> · {apiBase}</span>}
      </span>
      <span className="news-sync-pill">
        本地已存 {totalCount} 条
        {totalCount > 0 && ` · ${publishedCount} 条已发布`}
        {scheduledCount > 0 && ` · ${scheduledCount} 条定时`}
      </span>
      <span className={`news-sync-pill ${apiConnected ? 'is-ok' : 'is-muted'}`}>
        官网 {apiConnected ? '可拉取已发布内容' : '未联通，数据仅在本浏览器'}
      </span>
    </div>
  );
}

function SortableNewsRow({
  id,
  children,
}: {
  id: string;
  children: (parts: { dragHandle: ReactNode }) => ReactNode;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const dragHandle = (
    <LibraryDragHandle
      setActivatorNodeRef={setActivatorNodeRef}
      attributes={attributes}
      listeners={listeners}
    />
  );

  return (
    <tr ref={setNodeRef} style={style} className={`library-book-row${isDragging ? ' is-dragging' : ''}`}>
      {children({ dragHandle })}
    </tr>
  );
}

export function NewsConfig() {
  const [productCode] = useState<ProductCode>(() => getActiveProduct());
  const bodyRef = useRef<HTMLDivElement | null>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const [rows, setRows] = useState<CmsNewsItem[]>([]);
  const [dataSource, setDataSource] = useState<'remote' | 'local'>('local');
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [editOpen, setEditOpen] = useState(false);
  const [form, setForm] = useState<NewsFormInput>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [slugManual, setSlugManual] = useState(false);
  const [filterStatus, setFilterStatus] = useState<'ALL' | CmsNewsStatus>('ALL');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterKeyword, setFilterKeyword] = useState('');
  const [pendingFeaturedReplace, setPendingFeaturedReplace] = useState<{
    existing: CmsNewsItem;
    input: NewsFormInput;
  } | null>(null);
  const [formattingAi, setFormattingAi] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { items, source, autoPublishedIds } = await fetchCmsNews(productCode);
      setRows(items);
      setDataSource(source);
      if (autoPublishedIds?.length) {
        setMessage(
          source === 'local'
            ? `本地模式：${autoPublishedIds.length} 条定时新闻已自动上线（生产环境需后端 Cron）`
            : `已自动上线 ${autoPublishedIds.length} 条到期定时新闻`,
        );
      }
    } finally {
      setLoading(false);
    }
  }, [productCode]);

  useEffect(() => {
    load();
  }, [load]);

  const sortedRows = useMemo(
    () => [...rows].sort((a, b) => a.sortOrder - b.sortOrder),
    [rows],
  );

  const hasActiveFilter =
    filterStatus !== 'ALL' || !!filterCategory.trim() || !!filterKeyword.trim();

  const filteredRows = useMemo(() => {
    const kw = filterKeyword.trim().toLowerCase();
    return sortedRows.filter((row) => {
      if (filterStatus !== 'ALL' && row.status !== filterStatus) return false;
      if (filterCategory && row.category !== filterCategory) return false;
      if (!kw) return true;
      return (
        row.cardTitle.toLowerCase().includes(kw) ||
        row.summary.toLowerCase().includes(kw) ||
        row.slug.toLowerCase().includes(kw)
      );
    });
  }, [sortedRows, filterStatus, filterCategory, filterKeyword]);

  const publishedCount = useMemo(
    () => rows.filter((row) => row.status === 'PUBLISHED').length,
    [rows],
  );

  const scheduledCount = useMemo(
    () => rows.filter((row) => row.status === 'SCHEDULED').length,
    [rows],
  );

  const setPublishMode = (mode: CmsNewsStatus) => {
    setForm((f) => ({
      ...f,
      status: mode,
      publishedAt:
        mode !== 'DRAFT' && !f.publishedAt ? beijingTodayDate() : f.publishedAt,
      scheduledPublishAt:
        mode === 'SCHEDULED'
          ? f.scheduledPublishAt || defaultScheduleIso()
          : null,
      featuredReserveOnSchedule: mode === 'SCHEDULED' ? f.featuredReserveOnSchedule : false,
    }));
  };

  const categories = useMemo(() => {
    const set = new Set<string>(NEWS_CATEGORY_PRESETS);
    rows.forEach((r) => r.category && set.add(r.category));
    return [...set];
  }, [rows]);

  const resetForm = () => {
    setForm(emptyForm());
    setEditingId(null);
    setSlugManual(false);
  };

  const closeEdit = () => {
    setEditOpen(false);
    resetForm();
  };

  const openCreate = () => {
    resetForm();
    setEditOpen(true);
  };

  const openEdit = (row: CmsNewsItem) => {
    setEditingId(row.id);
    setForm(itemToForm(row));
    setSlugManual(true);
    setEditOpen(true);
  };

  const toggleSlot = (slot: NewsDisplaySlot) => {
    setForm((f) => {
      const has = f.displaySlots.includes(slot);
      return {
        ...f,
        displaySlots: has ? f.displaySlots.filter((s) => s !== slot) : [...f.displaySlots, slot],
      };
    });
  };

  const handleCardTitleBlur = () => {
    if (slugManual || !form.cardTitle.trim()) return;
    const slugs = rows.filter((r) => r.id !== editingId).map((r) => r.slug);
    setForm((f) => ({ ...f, slug: suggestSlug(f.cardTitle, slugs) }));
  };

  const syncBodyFromEditor = () => {
    const html = bodyRef.current ? normalizeBodyHtml(bodyRef.current.innerHTML) : form.body;
    setForm((f) => ({ ...f, body: html }));
    return html;
  };

  const insertBodySnippet = (html: string) => {
    const el = bodyRef.current;
    if (!el) return;
    el.focus();
    document.execCommand('insertHTML', false, html);
    syncBodyFromEditor();
  };

  const runBodyCommand = (command: string, value?: string) => {
    const el = bodyRef.current;
    if (!el) return;
    el.focus();
    document.execCommand(command, false, value);
    syncBodyFromEditor();
  };

  const applyFormattedHtml = (html: string) => {
    const el = bodyRef.current;
    if (!el) return;
    el.innerHTML = html || '<p><br></p>';
    syncBodyFromEditor();
  };

  const formatBody = () => {
    const el = bodyRef.current;
    if (!el) return;
    applyFormattedHtml(formatNewsBodyLocal(el.innerText.trim()));
    setMessage('已按空行与段落结构自动分段');
  };

  const formatBodyWithAi = async () => {
    const el = bodyRef.current;
    if (!el) return;
    setFormattingAi(true);
    try {
      const { html, source } = await formatNewsBodyWithAi(el.innerText.trim());
      applyFormattedHtml(html);
      setMessage(source === 'ai' ? 'AI 排版完成' : 'AI 接口未连接，已使用规则排版');
    } catch (err) {
      setMessage(err instanceof Error ? err.message : '排版失败');
    } finally {
      setFormattingAi(false);
    }
  };

  const insertImageByUrl = () => {
    const url = window.prompt('图片地址', 'assets/news-image.png');
    if (!url) return;
    const caption = window.prompt('图片说明（可选）', '') || '';
    const safeUrl = url.replace(/"/g, '&quot;');
    const safeCaption = caption.replace(/"/g, '&quot;');
    insertBodySnippet(
      `<figure><img src="${safeUrl}" alt="${safeCaption || 'image'}" />${caption ? `<figcaption>${safeCaption}</figcaption>` : ''}</figure>`,
    );
  };

  const handleImageFile = (file: File | undefined) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setMessage('请选择图片文件');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result !== 'string') return;
      const caption = window.prompt('图片说明（可选）', '') || '';
      const safeCaption = caption.replace(/"/g, '&quot;');
      insertBodySnippet(
        `<figure><img src="${reader.result}" alt="${safeCaption || file.name.replace(/"/g, '&quot;')}" />${caption ? `<figcaption>${safeCaption}</figcaption>` : ''}</figure>`,
      );
      setMessage('已插入本地图片（本地预览可用；发布前建议上传至媒体库）');
    };
    reader.readAsDataURL(file);
  };

  const fillSummaryFromBody = () => {
    const html = bodyRef.current?.innerHTML || form.body || '';
    setForm((f) => ({
      ...f,
      summary: stripHtml(html).slice(0, 260),
    }));
  };

  const flushEditorToForm = (): NewsFormInput => {
    const body = bodyRef.current ? normalizeBodyHtml(bodyRef.current.innerHTML) : form.body;
    return { ...form, body };
  };

  const persistSave = async (input: NewsFormInput) => {
    setMessage('');
    try {
      await saveCmsNews(productCode, input, editingId);
      setMessage(editingId ? '已更新新闻' : '已创建新闻');
      closeEdit();
      await load();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : '保存失败');
    }
  };

  const handleSubmit = async () => {
    const draft = flushEditorToForm();
    setForm(draft);
    const validation = validateNewsInput(draft, rows, editingId);
    if (!validation.ok) {
      setMessage(validation.message);
      return;
    }
    if (reservesFeaturedOnSave(draft)) {
      const existing = findFeaturedNews(rows, editingId ?? undefined);
      if (existing) {
        setPendingFeaturedReplace({ existing, input: draft });
        return;
      }
    }
    await persistSave(draft);
  };

  const confirmFeaturedReplace = async () => {
    if (!pendingFeaturedReplace) return;
    await persistSave(pendingFeaturedReplace.input);
    setPendingFeaturedReplace(null);
  };

  const handleTogglePublish = async (row: CmsNewsItem) => {
    setMessage('');
    try {
      await toggleCmsNewsPublish(productCode, row);
      setMessage(
        row.status === 'PUBLISHED'
          ? '已下线'
          : row.status === 'SCHEDULED'
            ? '已立即发布'
            : '已发布',
      );
      await load();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : '操作失败');
    }
  };

  const handleCancelSchedule = async (row: CmsNewsItem) => {
    setMessage('');
    try {
      await cancelCmsNewsSchedule(productCode, row);
      setMessage('已取消定时，改为草稿');
      await load();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : '操作失败');
    }
  };

  const handlePublishNow = async (row: CmsNewsItem) => {
    setMessage('');
    try {
      await publishCmsNewsNow(productCode, row);
      setMessage('已立即发布');
      await load();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : '操作失败');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('确定删除这条新闻？')) return;
    setMessage('');
    try {
      await removeCmsNews(productCode, id);
      if (editingId === id) closeEdit();
      setMessage('已删除');
      await load();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : '删除失败');
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const reordered = reorderBySortOrder(rows, String(active.id), String(over.id));
    setRows(reordered.sort((a, b) => a.sortOrder - b.sortOrder));
    await reorderCmsNewsDrag(productCode, String(active.id), String(over.id));
  };

  const renderRowCells = (row: CmsNewsItem, dragHandle: ReactNode) => (
    <>
      <td>{dragHandle}</td>
      <td>
        <NewsThumb src={row.coverImageUrl} alt={row.imageAlt || row.cardTitle} />
      </td>
      <td>
        <b>{row.cardTitle}</b>
        <div className="text-muted" style={{ fontSize: 12 }}>
          {row.category} · /{row.slug}
        </div>
      </td>
      <td>
        <SlotBadges slots={row.displaySlots} />
      </td>
      <td>
        {(() => {
          const badge = newsStatusBadge(row);
          return <span className={badge.className}>{badge.label}</span>;
        })()}
      </td>
      <td>
        {row.status === 'SCHEDULED' ? (
          <span title="官网展示日期">{formatNewsDate(row.publishedAt)}</span>
        ) : (
          formatNewsDate(row.publishedAt)
        )}
      </td>
      <td style={{ whiteSpace: 'nowrap' }}>
        <button type="button" className="btn btn-sm" onClick={() => openEdit(row)}>
          编辑
        </button>{' '}
        {row.status === 'SCHEDULED' ? (
          <>
            <button type="button" className="btn btn-sm" onClick={() => handlePublishNow(row)}>
              立即发布
            </button>{' '}
            <button type="button" className="btn btn-sm" onClick={() => handleCancelSchedule(row)}>
              取消定时
            </button>{' '}
          </>
        ) : (
          <button type="button" className="btn btn-sm" onClick={() => handleTogglePublish(row)}>
            {row.status === 'PUBLISHED' ? '下线' : '发布'}
          </button>
        )}{' '}
        <button type="button" className="btn btn-sm btn-danger" onClick={() => handleDelete(row.id)}>
          删除
        </button>
      </td>
    </>
  );

  const renderSortableRow = (row: CmsNewsItem) => (
    <SortableNewsRow key={row.id} id={row.id}>
      {({ dragHandle }) => renderRowCells(row, dragHandle)}
    </SortableNewsRow>
  );

  const renderPlainRow = (row: CmsNewsItem) => (
    <tr key={row.id}>{renderRowCells(row, <LibraryDragHandle disabled />)}</tr>
  );

  const bodyWordCount = stripHtml(form.body || '').length;
  const editorKey = editingId ?? 'new';

  const featuredReplaceModal = pendingFeaturedReplace && (
    <div
      className="modal-overlay open"
      onClick={() => setPendingFeaturedReplace(null)}
      role="dialog"
      aria-modal="true"
      aria-label="替换 Featured"
    >
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">替换 Featured 头条？</div>
        </div>
        <div className="modal-body">
          <p>
            当前 Featured 为「{pendingFeaturedReplace.existing.cardTitle}」。保存后将自动取消其 Featured
            展示位，仅保留本条为 Featured。
          </p>
        </div>
        <div className="modal-footer">
          <button type="button" className="btn btn-outline" onClick={() => setPendingFeaturedReplace(null)}>
            取消
          </button>
          <button type="button" className="btn btn-primary" onClick={confirmFeaturedReplace}>
            确认替换
          </button>
        </div>
      </div>
    </div>
  );

  if (editOpen) {
    return (
      <div className="news-writer-page">
        <div className="news-writer-topbar">
          <button type="button" className="news-writer-back" onClick={closeEdit}>
            ‹ 返回
          </button>
          <div className="news-writer-tools" aria-label="正文工具栏">
            <input
              ref={imageInputRef}
              type="file"
              accept="image/*"
              hidden
              onChange={(e) => {
                handleImageFile(e.target.files?.[0]);
                e.target.value = '';
              }}
            />
            <button
              type="button"
              className="news-writer-tool-btn"
              title="将当前段落设为二级小标题"
              onClick={() => runBodyCommand('formatBlock', 'h2')}
            >
              小标题
            </button>
            <button
              type="button"
              className="news-writer-tool-btn"
              title="插入无序列表"
              onClick={() => runBodyCommand('insertUnorderedList')}
            >
              列表
            </button>
            <button
              type="button"
              className="news-writer-tool-btn"
              title="将当前段落设为引用块"
              onClick={() => runBodyCommand('formatBlock', 'blockquote')}
            >
              引用
            </button>
            <button
              type="button"
              className="news-writer-tool-btn news-writer-tool-btn--accent"
              title="上传本地图片并插入正文"
              onClick={() => imageInputRef.current?.click()}
            >
              插图
            </button>
            <button
              type="button"
              className="news-writer-tool-btn news-writer-tool-btn--muted"
              title="通过图片 URL 插入正文"
              onClick={insertImageByUrl}
            >
              链接
            </button>
            <span className="news-writer-tool-divider" aria-hidden />
            <button
              type="button"
              className="news-writer-tool-btn news-writer-tool-btn--format"
              title="按空行分段，并识别小标题、列表、引用"
              onClick={formatBody}
            >
              自动分段
            </button>
            <button
              type="button"
              className="news-writer-tool-btn news-writer-tool-btn--ai"
              title={
                isNewsAiFormatEnabled()
                  ? '调用 AI 接口智能排版'
                  : 'AI 排版接口预留（未连接时回退规则排版）'
              }
              disabled={formattingAi}
              onClick={formatBodyWithAi}
            >
              {formattingAi ? '排版中…' : 'AI 排版'}
            </button>
          </div>
          <div className="news-writer-actions">
            <button type="button" className="btn btn-outline" onClick={closeEdit}>
              暂存离开
            </button>
            <button type="button" className="btn btn-primary" onClick={handleSubmit}>
              {editingId ? '保存发布设置' : '保存新闻'}
            </button>
          </div>
        </div>

        {message && (
          <div className={`news-toast ${message.includes('失败') || message.includes('请') ? 'news-toast--error' : ''}`}>
            {message}
          </div>
        )}

        <div className="news-writer-shell">
          <main className="news-writing-canvas">
            <NewsArticleEditor
              key={editorKey}
              editorKey={editorKey}
              form={form}
              setForm={setForm}
              bodyEditorRef={bodyRef}
              onTitleBlur={handleCardTitleBlur}
              onBodyChange={(html) => setForm((f) => ({ ...f, body: html }))}
            />
            <div className="news-writer-bottom">
              <span>字数：{bodyWordCount}</span>
              <span>摘要：{form.summary.length}/280</span>
              <span className="text-muted">所见即所得 · 编辑效果即官网详情页</span>
            </div>
          </main>

          <aside className="news-publish-panel">
            <div className="news-publish-card">
              <div className="news-publish-title">发布设置</div>
              <label className="form-label">分类</label>
              <input
                className="form-input"
                list="news-category-list"
                value={form.category}
                onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
              />
              <datalist id="news-category-list">
                {NEWS_CATEGORY_PRESETS.map((c) => (
                  <option key={c} value={c} />
                ))}
              </datalist>

              <div className="news-publish-mode">
                <div className="form-label">发布方式</div>
                <div className="news-publish-mode-options">
                  {(
                    [
                      ['DRAFT', '保存草稿'],
                      ['PUBLISHED', '立即发布'],
                      ['SCHEDULED', '定时发布'],
                    ] as const
                  ).map(([mode, label]) => (
                    <label key={mode} className="news-publish-mode-option">
                      <input
                        type="radio"
                        name="publish-mode"
                        checked={form.status === mode}
                        onChange={() => setPublishMode(mode)}
                      />
                      {label}
                    </label>
                  ))}
                </div>
              </div>

              {form.status === 'SCHEDULED' && (
                <div className="news-schedule-fields">
                  <label className="form-label">
                    上线时间
                    <span className="news-schedule-tz">北京时间 ({NEWS_SCHEDULE_TIMEZONE})</span>
                  </label>
                  <input
                    type="datetime-local"
                    className="form-input"
                    value={toBeijingDatetimeLocal(form.scheduledPublishAt)}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        scheduledPublishAt: e.target.value
                          ? fromBeijingDatetimeLocal(e.target.value)
                          : null,
                      }))
                    }
                  />
                  <p className="news-schedule-hint">
                    到期后自动变为已发布。本地模式仅在打开本页时检测；生产环境需后端 Cron。
                  </p>
                </div>
              )}

              {form.status !== 'DRAFT' && (
                <div>
                  <label className="form-label">展示日期</label>
                  <input
                    type="date"
                    className="form-input"
                    value={form.publishedAt?.slice(0, 10) || ''}
                    onChange={(e) => setForm((f) => ({ ...f, publishedAt: e.target.value || null }))}
                  />
                  <p className="news-schedule-hint">官网卡片与详情页显示的日期，可与实际上线时间不同。</p>
                </div>
              )}

              <label className="form-label">展示位置</label>
              <div className="news-slot-checks">
                {ALL_SLOTS.map((slot) => (
                  <label key={slot} className="news-slot-check">
                    <input
                      type="checkbox"
                      checked={form.displaySlots.includes(slot)}
                      onChange={() => toggleSlot(slot)}
                    />
                    {NEWS_DISPLAY_SLOT_LABELS[slot]}
                  </label>
                ))}
              </div>

              {form.displaySlots.includes('FEATURED') && form.status === 'SCHEDULED' && (
                <label className="news-featured-reserve">
                  <input
                    type="checkbox"
                    checked={form.featuredReserveOnSchedule}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, featuredReserveOnSchedule: e.target.checked }))
                    }
                  />
                  <span>
                    定时发布时预占 Featured 槽位
                    <span className="news-schedule-hint">
                      开启后，保存时将替换当前 Featured；关闭则上线前不占 Featured。
                    </span>
                  </span>
                </label>
              )}

              {form.displaySlots.includes('FEATURED') && (
                <>
                  <label className="form-label">Featured 角标</label>
                  <input
                    className="form-input"
                    value={form.featuredBadge || ''}
                    placeholder="Launch Event"
                    onChange={(e) =>
                      setForm((f) => ({ ...f, featuredBadge: e.target.value.trim() || null }))
                    }
                  />
                </>
              )}
            </div>

            <div className="news-publish-card">
              <div className="news-publish-title">封面</div>
              <label className="form-label">封面图</label>
              <input
                className="form-input"
                value={form.coverImageUrl}
                placeholder="assets/news-product-matrix.png"
                onChange={(e) => setForm((f) => ({ ...f, coverImageUrl: e.target.value }))}
              />
              {form.coverImageUrl && (
                <NewsThumb src={form.coverImageUrl} alt={form.imageAlt || form.cardTitle} className="news-cover-preview" />
              )}
              <button type="button" className="btn btn-sm" onClick={fillSummaryFromBody}>
                从正文生成摘要
              </button>
            </div>

            <details className="news-publish-card">
              <summary className="news-publish-title">高级设置</summary>
              <label className="form-label">详情页标题</label>
              <input
                className="form-input"
                value={form.heroTitle || ''}
                placeholder="默认同主标题"
                onChange={(e) => setForm((f) => ({ ...f, heroTitle: e.target.value.trim() || null }))}
              />
              <label className="form-label">Slug</label>
              <input
                className="form-input"
                value={form.slug}
                onChange={(e) => {
                  setSlugManual(true);
                  setForm((f) => ({ ...f, slug: e.target.value }));
                }}
              />
              <label className="form-label">详情头图</label>
              <input
                className="form-input"
                value={form.heroImageUrl || ''}
                placeholder="默认同封面"
                onChange={(e) => setForm((f) => ({ ...f, heroImageUrl: e.target.value.trim() || null }))}
              />
              <label className="form-label">悬停图</label>
              <input
                className="form-input"
                value={form.coverImageHoverUrl || ''}
                onChange={(e) =>
                  setForm((f) => ({ ...f, coverImageHoverUrl: e.target.value.trim() || null }))
                }
              />
              <label className="form-label">图片说明 alt</label>
              <input
                className="form-input"
                value={form.imageAlt || ''}
                onChange={(e) => setForm((f) => ({ ...f, imageAlt: e.target.value.trim() || null }))}
              />
            </details>
          </aside>
        </div>

        {featuredReplaceModal}
      </div>
    );
  }

  return (
    <>
      <div className="page-header">
        <div>
          <div className="page-title">新闻配置</div>
          <div className="page-subtitle">C-Lingo 官网 · 管理首页卡片、列表 Featured 与详情页内容</div>
          <NewsSyncStatus
            dataSource={dataSource}
            totalCount={rows.length}
            publishedCount={publishedCount}
            scheduledCount={scheduledCount}
          />
        </div>
        <div className="page-header-actions">
          <button type="button" className="btn btn-primary" onClick={openCreate}>
            + 新建新闻
          </button>
        </div>
      </div>

      {message && (
        <div className={`news-toast ${message.includes('失败') || message.includes('请') ? 'news-toast--error' : ''}`}>
          {message}
        </div>
      )}

      <div className="card">
        <div className="paper-filter-bar">
          <select
            className="form-input form-input-sm"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as typeof filterStatus)}
          >
            <option value="ALL">全部状态</option>
            <option value="PUBLISHED">已发布</option>
            <option value="SCHEDULED">定时发布</option>
            <option value="DRAFT">草稿</option>
          </select>
          <select
            className="form-input form-input-sm"
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
          >
            <option value="">全部分类</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <input
            className="form-input form-input-sm"
            placeholder="搜索标题 / 摘要 / slug"
            value={filterKeyword}
            onChange={(e) => setFilterKeyword(e.target.value)}
          />
          <span className="text-muted">{filteredRows.length} 条</span>
          {hasActiveFilter && (
            <span className="text-muted news-drag-hint">筛选中不可拖拽排序</span>
          )}
        </div>

        <div className="paper-table-container">
          {loading ? (
            <p className="text-muted" style={{ padding: 16 }}>
              加载中…
            </p>
          ) : !filteredRows.length ? (
            <p className="text-muted" style={{ padding: 16 }}>
              暂无新闻
            </p>
          ) : (
            <table className="paper-table">
              <thead>
                <tr>
                  <th style={{ width: 44 }} aria-label="排序" />
                  <th style={{ width: 72 }}>封面</th>
                  <th>标题 / 分类</th>
                  <th>展示位</th>
                  <th>状态</th>
                  <th>发布日期</th>
                  <th>操作</th>
                </tr>
              </thead>
              {!hasActiveFilter ? (
                <BookSortableTableBody
                  itemIds={sortedRows.map((row) => row.id)}
                  onDragEnd={handleDragEnd}
                >
                  {sortedRows.map((row) => renderSortableRow(row))}
                </BookSortableTableBody>
              ) : (
                <tbody>{filteredRows.map((row) => renderPlainRow(row))}</tbody>
              )}
            </table>
          )}
        </div>
      </div>

      {pendingFeaturedReplace && (
        <div
          className="modal-overlay open"
          onClick={() => setPendingFeaturedReplace(null)}
          role="dialog"
          aria-modal="true"
          aria-label="替换 Featured"
        >
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">替换 Featured 头条？</div>
            </div>
            <div className="modal-body">
              <p>
                当前 Featured 为「{pendingFeaturedReplace.existing.cardTitle}」。保存后将自动取消其 Featured
                展示位，仅保留本条为 Featured。
              </p>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-outline" onClick={() => setPendingFeaturedReplace(null)}>
                取消
              </button>
              <button type="button" className="btn btn-primary" onClick={confirmFeaturedReplace}>
                确认替换
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
