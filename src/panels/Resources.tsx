import { useState, useMemo } from 'react';

type LangKey = 'EN' | 'ES' | 'FR' | 'PT' | 'CN' | 'JA' | 'KO' | 'TH' | 'VI' | 'ID' | 'MS' | 'KM';

type ResourceRow = {
  dirId: string;
  type: string;
  resId: string;
  attr: string;
  text: string;
  pinyin: string;
  trans: string;
  audio: string;
  img: string;
  wordType: string;
  hsk: string;
  multiLang: Record<LangKey, string>;
  createdAt: string;
  updatedAt: string;
};

type LessonItem = { id: string; label: string };
type UnitItem = { id: string; label: string; lessons: LessonItem[] };
type LevelItem = { id: string; label: string; units: UnitItem[] };

// LESSON_MAP：用于“级别 → 单元 → 课程”三级联动
const LESSON_MAP: LevelItem[] = [
  {
    id: '1',
    label: 'Level 1',
    units: [
      {
        id: 'N10100',
        label: 'Unit 1 · 日常主食',
        lessons: [
          { id: 'N10101', label: 'Lesson 1 · 米饭' },
          { id: 'N10102', label: 'Lesson 2 · 饺子' },
          { id: 'N10103', label: 'Lesson 3 · 吃包子' },
        ],
      },
      {
        id: 'N10200',
        label: 'Unit 2 · 日常饮品',
        lessons: [
          { id: 'N10201', label: 'Lesson 1 · 水' },
          { id: 'N10202', label: 'Lesson 2 · 茶' },
          { id: 'N10203', label: 'Lesson 3 · 喝牛奶' },
        ],
      },
    ],
  },
];

const defaultRows: ResourceRow[] = [
  { dirId: 'N10101', type: '学习卡片', resId: 'M0200002', attr: '字', text: '米', pinyin: 'mǐ', trans: 'Rice', audio: 'Y100005.mp3', img: 'XUE-100001.png', wordType: 'n.', hsk: 'HSK 1', multiLang: { EN: 'Rice', ES: '', FR: '', PT: '', CN: '', JA: '', KO: '', TH: '', VI: '', ID: '', MS: '', KM: '' }, createdAt: '2026-03-03 09:15', updatedAt: '2026-03-04 14:03' },
];

function formatNow() {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
}

function nextResId(list: ResourceRow[]): string {
  const nums = list.map((r) => {
    const m = r.resId.match(/M0(\d+)/);
    return m ? parseInt(m[1], 10) : 0;
  });
  const next = (Math.max(0, ...nums) + 1).toString().padStart(6, '0');
  return `M0${next}`;
}

function renumberResIds(list: ResourceRow[]): ResourceRow[] {
  return list.map((r, i) => ({
    ...r,
    resId: `M0${(i + 1).toString().padStart(6, '0')}`,
  }));
}

const LANG_LABELS: { key: LangKey; label: string }[] = [
  { key: 'CN', label: '中文' },
  { key: 'EN', label: '英文' },
  { key: 'ES', label: '西语' },
  { key: 'FR', label: '法语' },
  { key: 'PT', label: '葡语' },
  { key: 'JA', label: '日语' },
  { key: 'KO', label: '韩语' },
  { key: 'TH', label: '泰语' },
  { key: 'VI', label: '越南语' },
  { key: 'ID', label: '印尼语' },
  { key: 'MS', label: '马来语' },
  { key: 'KM', label: '高棉语' },
];

const MEDIA_LIBRARY = [
  { id: 'Y100001.mp3', name: '米饭.mp3', type: 'audio', hint: '00:06' },
  { id: 'Y100005.mp3', name: '米.mp3', type: 'audio', hint: '00:03' },
  { id: 'Y100006.mp3', name: '饺子.mp3', type: 'audio', hint: '00:04' },
  { id: 'XUE-100001.png', name: '米.png', type: 'image', hint: '48 KB' },
  { id: 'XUE-100002.png', name: '饺子.png', type: 'image', hint: '52 KB' },
  { id: 'XUE-100003.png', name: '包子.png', type: 'image', hint: '50 KB' },
];

const PINYIN_MAP: Record<string, string> = {
  我: 'wǒ',
  爱: 'ài',
  吃: 'chī',
  米: 'mǐ',
  饭: 'fàn',
  饺: 'jiǎo',
  子: 'zi',
  包: 'bāo',
  水: 'shuǐ',
  茶: 'chá',
  牛: 'niú',
  奶: 'nǎi',
  这: 'zhè',
  是: 'shì',
  不: 'bù',
  的: 'de',
};

function autoGeneratePinyin(text: string): string {
  const raw = (text || '').trim();
  if (!raw) return '';
  return raw
    .split('')
    .map((ch) => PINYIN_MAP[ch] ?? ch)
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function autoGenerateMultiLang(text: string): Record<LangKey, string> {
  const base = (text || '').trim();
  return {
    CN: base,
    EN: base ? `${base} (English)` : '',
    ES: base ? `${base} (Español)` : '',
    FR: base ? `${base} (Français)` : '',
    PT: base ? `${base} (Português)` : '',
    JA: base ? `${base} (日本語)` : '',
    KO: base ? `${base} (한국어)` : '',
    TH: base ? `${base} (ไทย)` : '',
    VI: base ? `${base} (Tiếng Việt)` : '',
    ID: base ? `${base} (Bahasa Indonesia)` : '',
    MS: base ? `${base} (Bahasa Melayu)` : '',
    KM: base ? `${base} (ខ្មែរ)` : '',
  };
}

export function Resources() {
  const [resources, setResources] = useState<ResourceRow[]>(defaultRows);
  const [refreshing, setRefreshing] = useState(false);
  const [toastText, setToastText] = useState('');
  const [resourceModalOpen, setResourceModalOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [deleteConfirmIndex, setDeleteConfirmIndex] = useState<number | null>(null);
  const [langTab, setLangTab] = useState<LangKey>('CN');
  const [mediaPicker, setMediaPicker] = useState<{ open: boolean; target: 'audio' | 'image' | null }>({ open: false, target: null });
  const [mediaKeyword, setMediaKeyword] = useState('');
  const [selectedLevel, setSelectedLevel] = useState<string>('');
  const [selectedUnit, setSelectedUnit] = useState<string>('');
  const [selectedLesson, setSelectedLesson] = useState<string>('');
  const [dirKeyword, setDirKeyword] = useState('');

  const nextId = useMemo(() => nextResId(resources), [resources]);
  const isEditing = editingIndex !== null;

  const [form, setForm] = useState<Partial<ResourceRow>>({});
  const openAdd = () => {
    setForm({
      dirId: 'N10101',
      type: '学习卡片',
      resId: nextId,
      attr: '—',
      text: '',
      pinyin: '',
      trans: '',
      audio: '',
      img: '',
      wordType: '—',
      hsk: '—',
      multiLang: { EN: '', ES: '', FR: '', PT: '', CN: '', JA: '', KO: '', TH: '', VI: '', ID: '', MS: '', KM: '' },
      createdAt: formatNow(),
      updatedAt: formatNow(),
    });
    setEditingIndex(-1);
    setLangTab('CN');
    setResourceModalOpen(true);
  };
  const openEdit = (row: ResourceRow, index: number) => {
    setForm({ ...row });
    setLangTab('CN');
    setEditingIndex(index);
    setResourceModalOpen(true);
  };
  const closeResourceModal = () => {
    setResourceModalOpen(false);
    setEditingIndex(null);
    setForm({});
  };

  const handleConfirmResource = () => {
    if (!form.resId || !form.text) return;
    const ids = resources.map((r) => r.resId);
    if (isEditing && editingIndex! >= 0) {
      const otherIds = resources.filter((_, i) => i !== editingIndex).map((r) => r.resId);
      if (otherIds.includes(form.resId)) return;
      const next = resources.map((r, i) => (i === editingIndex!
        ? {
            ...r,
            ...form,
            img: form.img && form.img !== '—' ? form.img : '—',
            type: '学习卡片',
            multiLang: form.multiLang ?? r.multiLang,
            updatedAt: formatNow(),
            createdAt: r.createdAt,
          } as ResourceRow
        : r));
      setResources(renumberResIds(next));
    } else {
      if (ids.includes(form.resId)) return;
      const newRow: ResourceRow = {
        dirId: form.dirId ?? 'N10101',
        type: '学习卡片',
        resId: form.resId,
        attr: form.attr ?? '—',
        text: form.text,
        pinyin: form.pinyin ?? '',
        trans: form.trans ?? form.multiLang?.EN ?? '',
        audio: form.audio ?? '',
        img: form.img && form.img !== '—' ? form.img : '—',
        wordType: form.wordType ?? '—',
        hsk: form.hsk ?? '—',
        multiLang: form.multiLang ?? { EN: form.trans ?? '', ES: '', FR: '', PT: '', CN: '', JA: '', KO: '', TH: '', VI: '', ID: '', MS: '', KM: '' },
        createdAt: formatNow(),
        updatedAt: formatNow(),
      };
      setResources(renumberResIds([...resources, newRow]));
    }
    closeResourceModal();
  };

  const confirmDelete = () => {
    if (deleteConfirmIndex === null) return;
    const next = resources.filter((_, i) => i !== deleteConfirmIndex);
    setResources(renumberResIds(next));
    setDeleteConfirmIndex(null);
  };

  const usedIds = useMemo(() => new Set(resources.map((r) => r.resId)), [resources]);
  const resIdDuplicate = form.resId ? usedIds.has(form.resId) && (editingIndex === null || resources[editingIndex]?.resId !== form.resId) : false;
  const unitOptions = useMemo(
    () => (selectedLevel ? LESSON_MAP.find((l) => l.id === selectedLevel)?.units ?? [] : []),
    [selectedLevel],
  );
  const lessonOptions = useMemo(
    () => (selectedUnit ? unitOptions.find((u) => u.id === selectedUnit)?.lessons ?? [] : []),
    [selectedUnit, unitOptions],
  );
  const filteredResources = useMemo(() => {
    return resources.filter((row) => {
      const unitMatch = selectedUnit ? row.dirId.startsWith(selectedUnit.slice(0, 4)) || row.dirId === selectedUnit : true;
      const lessonMatch = selectedLesson ? row.dirId === selectedLesson : true;
      const keywordMatch = dirKeyword ? row.dirId.toLowerCase().includes(dirKeyword.toLowerCase()) : true;
      return unitMatch && lessonMatch && keywordMatch;
    });
  }, [resources, selectedUnit, selectedLesson, dirKeyword]);
  const mediaOptions = useMemo(() => {
    if (!mediaPicker.target) return [];
    const kw = mediaKeyword.trim().toLowerCase();
    return MEDIA_LIBRARY.filter((m) => m.type === mediaPicker.target).filter((m) =>
      [m.id, m.name, m.hint].join(' ').toLowerCase().includes(kw),
    );
  }, [mediaKeyword, mediaPicker.target]);
  const langBtnStyle = (key: LangKey, active: boolean) => {
    if (key !== 'CN') return undefined;
    return active
      ? { background: '#8a1c2b', borderColor: '#8a1c2b', color: '#fff' }
      : { background: '#fff5f5', borderColor: '#8a1c2b', color: '#8a1c2b' };
  };
  const pickMedia = (id: string) => {
    if (mediaPicker.target === 'audio') setForm((f) => ({ ...f, audio: id }));
    if (mediaPicker.target === 'image') setForm((f) => ({ ...f, img: id }));
    setMediaPicker({ open: false, target: null });
    setMediaKeyword('');
  };
  const runAutoPinyin = () => {
    setForm((f) => ({ ...f, pinyin: autoGeneratePinyin((f.multiLang?.CN ?? f.text ?? '')) }));
  };
  const runAutoMultiLang = () => {
    setForm((f) => {
      const generated = autoGenerateMultiLang(f.text ?? '');
      return { ...f, multiLang: generated, trans: generated.EN };
    });
    setLangTab('EN');
  };
  const handleRefresh = () => {
    if (refreshing) return;
    setRefreshing(true);
    window.setTimeout(() => {
      setResources((prev) => [...prev]);
      setRefreshing(false);
      setToastText('学习资源刷新完成');
      window.setTimeout(() => setToastText(''), 1600);
    }, 600);
  };

  return (
    <>
      <div className="page-header">
        <div>
          <div className="page-title">学习资源管理</div>
          <div className="page-subtitle">共 {resources.length} 条学习卡片资源</div>
        </div>
        <div className="page-actions">
          <button type="button" className="btn btn-secondary" onClick={handleRefresh} disabled={refreshing}>
            <span className={`spin-icon ${refreshing ? 'spinning' : ''}`}>↻</span>
            刷新
          </button>
          <button type="button" className="btn btn-secondary">批量导入</button>
          <button type="button" className="btn btn-primary" onClick={openAdd}>+ 新增资源</button>
        </div>
      </div>
      <div className="filter-bar">
        <select
          className="filter-select"
          value={selectedLevel}
          onChange={(e) => {
            setSelectedLevel(e.target.value);
            setSelectedUnit('');
            setSelectedLesson('');
          }}
        >
          <option value="">全部级别</option>
          {LESSON_MAP.map((lv) => (
            <option key={lv.id} value={lv.id}>{lv.label}</option>
          ))}
        </select>
        <select
          className="filter-select"
          value={selectedUnit}
          onChange={(e) => {
            setSelectedUnit(e.target.value);
            setSelectedLesson('');
          }}
          disabled={!selectedLevel}
        >
          <option value="">全部单元</option>
          {unitOptions.map((u) => (
            <option key={u.id} value={u.id}>{u.id} · {u.label}</option>
          ))}
        </select>
        <select
          className="filter-select"
          value={selectedLesson}
          onChange={(e) => setSelectedLesson(e.target.value)}
          disabled={!selectedUnit}
        >
          <option value="">全部课程</option>
          {lessonOptions.map((ls) => (
            <option key={ls.id} value={ls.id}>{ls.id} · {ls.label}</option>
          ))}
        </select>
        <input
          className="filter-select"
          style={{ minWidth: 170 }}
          placeholder="目录ID，如 N10101"
          value={dirKeyword}
          onChange={(e) => setDirKeyword(e.target.value)}
        />
        <span className="filter-tag active">全部词性</span>
        <span className="filter-tag">字</span>
        <span className="filter-tag">词</span>
        <span className="filter-tag">句</span>
        <span className="filter-sep" />
        <select className="filter-select">
          <option value="">全部 HSK</option>
          <option>HSK 1</option>
          <option>HSK 2</option>
        </select>
      </div>
      <div className="table-wrap">
        <div className="table-top">
          <span className="table-count">共 {filteredResources.length} 条</span>
          <span style={{ flex: 1 }} />
        </div>
        <table>
          <thead>
            <tr>
              <th>目录ID</th>
              <th>资源类别</th>
              <th>资源ID</th>
              <th>词条属性</th>
              <th>原文</th>
              <th>拼音</th>
              <th>多语言</th>
              <th>声音编号</th>
              <th>图片</th>
              <th>词性</th>
              <th>HSK</th>
              <th>创建时间</th>
              <th>更新时间</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {filteredResources.map((row) => {
              const configuredLangs = LANG_LABELS.filter(({ key }) => {
                const val = row.multiLang[key];
                return !!val && val !== '（待翻译）';
              });
              return (
              <tr key={row.resId}>
                <td className="td-mono">{row.dirId}</td>
                <td><span className="badge badge-muted">{row.type}</span></td>
                <td className="td-mono">{row.resId}</td>
                <td>{row.attr === '—' ? '—' : <span className="badge badge-rose">{row.attr}</span>}</td>
                <td>{row.text}</td>
                <td className="text-muted">{row.pinyin}</td>
                <td>
                  <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                    {configuredLangs.length > 0 ? configuredLangs.map((l) => (
                      <span key={l.key} className="badge badge-muted" style={{ fontSize: 10 }}>{l.key}</span>
                    )) : <span style={{ color: 'var(--ink-light)' }}>未配置</span>}
                  </div>
                </td>
                <td className="td-mono">{row.audio}</td>
                <td>{row.img === '—' ? '—' : <span className="td-mono">{row.img}</span>}</td>
                <td>{row.wordType}</td>
                <td>{row.hsk === '—' ? '—' : <span className="badge badge-indigo">{row.hsk}</span>}</td>
                <td className="td-mono" style={{ fontSize: 12 }}>{row.createdAt}</td>
                <td className="td-mono" style={{ fontSize: 12 }}>{row.updatedAt}</td>
                <td>
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    onClick={() => openEdit(row, resources.findIndex((r) => r.resId === row.resId))}
                  >
                    编辑
                  </button>
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    onClick={() => setDeleteConfirmIndex(resources.findIndex((r) => r.resId === row.resId))}
                    style={{ color: 'var(--rose)' }}
                  >
                    删除
                  </button>
                </td>
              </tr>
              );
            })}
            {filteredResources.length === 0 && (
              <tr>
                <td colSpan={14} style={{ textAlign: 'center', color: 'var(--ink-light)' }}>
                  无匹配数据，请调整筛选条件
                </td>
              </tr>
            )}
          </tbody>
        </table>
        <div className="pagination">
          <span className="page-info">第 1 页</span>
          <button type="button" className="page-btn active">1</button>
        </div>
      </div>

      {/* 确认删除弹窗 */}
      <div className={`modal-overlay ${deleteConfirmIndex !== null ? 'open' : ''}`} onClick={() => setDeleteConfirmIndex(null)} role="dialog" aria-modal="true" aria-label="确认删除">
        <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 400 }}>
          <div className="modal-header">
            <div className="modal-title">确认删除</div>
            <button type="button" className="modal-close" onClick={() => setDeleteConfirmIndex(null)} aria-label="关闭">✕</button>
          </div>
          <div className="modal-body">
            <p style={{ margin: 0 }}>确认删除该词条？删除后资源ID将按顺序重新编号。</p>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-ghost" onClick={() => setDeleteConfirmIndex(null)}>取消</button>
            <button type="button" className="btn btn-primary" onClick={confirmDelete}>确认</button>
          </div>
        </div>
      </div>

      {/* 编辑/新增学习资源 弹窗 */}
      <div className={`modal-overlay ${resourceModalOpen ? 'open' : ''}`} onClick={closeResourceModal} role="dialog" aria-modal="true" aria-label={isEditing && editingIndex! >= 0 ? '编辑学习资源' : '新增学习资源'}>
        <div className="modal" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <div className="modal-title">{isEditing && editingIndex! >= 0 ? '编辑学习资源' : '新增学习资源'}</div>
            <button type="button" className="modal-close" onClick={closeResourceModal} aria-label="关闭">✕</button>
          </div>
          <div className="modal-body">
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">资源ID</label>
                <input
                  className="form-input"
                  style={{ fontFamily: 'JetBrains Mono', fontSize: 12 }}
                  value={form.resId ?? ''}
                  onChange={(e) => setForm((f) => ({ ...f, resId: e.target.value }))}
                />
                <div className="form-hint">自动生成，可修改，不可与已有ID重复</div>
                {resIdDuplicate && <div className="form-hint" style={{ color: 'var(--rose)' }}>该ID已存在</div>}
              </div>
              <div className="form-group">
                <label className="form-label">目录ID <span>*</span></label>
                <select className="form-input form-select" value={form.dirId} onChange={(e) => setForm((f) => ({ ...f, dirId: e.target.value }))}>
                  <option value="N10101">N10101 · 米饭</option>
                  <option value="N10102">N10102 · 饺子</option>
                  <option value="N10201">N10201 · 水</option>
                  <option value="N10202">N10202 · 茶</option>
                </select>
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">资源类别 <span>*</span></label>
                <input className="form-input" value="学习卡片" readOnly />
              </div>
              <div className="form-group">
                <label className="form-label">词条属性</label>
                <select className="form-input form-select" value={form.attr} onChange={(e) => setForm((f) => ({ ...f, attr: e.target.value }))}>
                  <option>—</option>
                  <option>字</option>
                  <option>词</option>
                  <option>句</option>
                </select>
              </div>
            </div>
            <div className="form-group">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                <label className="form-label" style={{ marginBottom: 0 }}>多语言内容配置</label>
                <button type="button" className="btn btn-ghost btn-sm" onClick={runAutoMultiLang}>自动翻译</button>
              </div>
              <div style={{ border: '1px solid var(--border)', borderRadius: 8, padding: 12, background: 'var(--mist)' }}>
                <div style={{ display: 'flex', gap: 6, marginBottom: 10, flexWrap: 'wrap' }}>
                  {LANG_LABELS.map(({ key, label }) => (
                    <button
                      key={key}
                      type="button"
                      className={`btn btn-sm ${langTab === key ? 'btn-primary' : 'btn-secondary'}`}
                      onClick={() => setLangTab(key)}
                      style={langBtnStyle(key, langTab === key)}
                    >
                      {key} {label}
                    </button>
                  ))}
                </div>
                {langTab === 'CN' ? (
                  <>
                    <div className="form-group" style={{ marginBottom: 10 }}>
                      <label className="form-label">原文 <span>*</span></label>
                      <input
                        className="form-input"
                        placeholder="输入中文"
                        value={form.text ?? ''}
                        onChange={(e) => {
                          const nextVal = e.target.value;
                          setForm((f) => ({
                            ...f,
                            text: nextVal,
                            multiLang: { ...(f.multiLang ?? { EN: '', ES: '', FR: '', PT: '', CN: '', JA: '', KO: '', TH: '', VI: '', ID: '', MS: '', KM: '' }), CN: nextVal },
                          }));
                        }}
                        style={{ fontFamily: "'Noto Serif SC', serif" }}
                      />
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                        <label className="form-label" style={{ marginBottom: 0 }}>拼音（仅中文）</label>
                        <button type="button" className="btn btn-ghost btn-sm" onClick={runAutoPinyin}>自动生成</button>
                      </div>
                      <input className="form-input" placeholder="pīnyīn" value={form.pinyin ?? ''} onChange={(e) => setForm((f) => ({ ...f, pinyin: e.target.value }))} />
                    </div>
                  </>
                ) : (
                  <textarea
                    className="form-input"
                    rows={3}
                    placeholder={`${LANG_LABELS.find((l) => l.key === langTab)?.label ?? langTab}译文`}
                    value={form.multiLang?.[langTab] ?? ''}
                    onChange={(e) => {
                      const nextVal = e.target.value;
                      setForm((f) => {
                        const base = f.multiLang ?? { EN: '', ES: '', FR: '', PT: '', CN: '', JA: '', KO: '', TH: '', VI: '', ID: '', MS: '', KM: '' };
                        const nextMulti = { ...base, [langTab]: nextVal };
                        return {
                          ...f,
                          multiLang: nextMulti,
                          trans: langTab === 'EN' ? nextVal : f.trans,
                        };
                      });
                    }}
                  />
                )}
              </div>
            </div>
            <div className="form-group">
              <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: 12 }}>
                <div>
                  <label className="form-label">词性</label>
                  <select className="form-input form-select" value={form.wordType ?? ''} onChange={(e) => setForm((f) => ({ ...f, wordType: e.target.value }))}>
                    <option>—</option>
                    <option>n.</option>
                    <option>v.</option>
                    <option>adj.</option>
                    <option>pron.</option>
                  </select>
                </div>
                <div>
                  <label className="form-label">HSK级别</label>
                  <select className="form-input form-select" value={form.hsk ?? ''} onChange={(e) => setForm((f) => ({ ...f, hsk: e.target.value }))}>
                    <option>— 不限</option>
                    <option>HSK 1</option>
                    <option>HSK 2</option>
                    <option>HSK 3</option>
                    <option>HSK 4</option>
                    <option>HSK 5</option>
                    <option>HSK 6</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="form-row" style={{ gridTemplateColumns: '1fr 1fr' }}>
              <div className="form-group">
                <label className="form-label">声音ID</label>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                  <button type="button" className="btn btn-secondary btn-sm" onClick={() => setMediaPicker({ open: true, target: 'audio' })}>{form.audio ? '更改' : '配置'}</button>
                  {!!form.audio && (
                    <>
                      <span className="badge badge-teal">已配置</span>
                      <span className="td-mono">{form.audio}</span>
                      <button type="button" className="btn btn-ghost btn-sm" style={{ color: 'var(--rose)' }} onClick={() => setForm((f) => ({ ...f, audio: '' }))}>删除</button>
                    </>
                  )}
                </div>
                {!form.audio && <div className="form-hint">未配置时点击“配置”从资源库选择声音资源</div>}
              </div>
              <div className="form-group">
                <label className="form-label">图片ID</label>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                  <button type="button" className="btn btn-secondary btn-sm" onClick={() => setMediaPicker({ open: true, target: 'image' })}>{form.img && form.img !== '—' ? '更改' : '配置'}</button>
                  {!!form.img && form.img !== '—' && (
                    <>
                      <span className="badge badge-teal">已配置</span>
                      <span className="td-mono">{form.img}</span>
                      <button type="button" className="btn btn-ghost btn-sm" style={{ color: 'var(--rose)' }} onClick={() => setForm((f) => ({ ...f, img: '' }))}>删除</button>
                    </>
                  )}
                </div>
                {(!form.img || form.img === '—') && <div className="form-hint">未配置时点击“配置”从资源库选择图片资源</div>}
              </div>
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-ghost" onClick={closeResourceModal}>取消</button>
            <button type="button" className="btn btn-primary" onClick={handleConfirmResource} disabled={!form.text || resIdDuplicate}>确认</button>
          </div>
        </div>
      </div>

      {/* 资源库选择（声音/图片） */}
      <div className={`modal-overlay ${mediaPicker.open ? 'open' : ''}`} onClick={() => { setMediaPicker({ open: false, target: null }); setMediaKeyword(''); }} role="dialog" aria-modal="true" aria-label="资源库选择">
        <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 700 }}>
          <div className="modal-header">
            <div className="modal-title">资源库选择 · {mediaPicker.target === 'audio' ? '声音资源' : mediaPicker.target === 'image' ? '图片资源' : ''}</div>
            <button type="button" className="modal-close" onClick={() => { setMediaPicker({ open: false, target: null }); setMediaKeyword(''); }} aria-label="关闭">✕</button>
          </div>
          <div className="modal-body">
            <div className="form-group">
              <label className="form-label">搜索资源</label>
              <input
                className="form-input"
                placeholder="输入资源ID / 文件名关键词"
                value={mediaKeyword}
                onChange={(e) => setMediaKeyword(e.target.value)}
              />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">资源列表（{mediaOptions.length}）</label>
              <div style={{ border: '1px solid var(--border)', borderRadius: 8, maxHeight: 300, overflowY: 'auto' }}>
                {mediaOptions.map((m) => (
                  <div key={m.id} style={{ padding: '10px 12px', borderBottom: '1px solid var(--mist)', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span className="td-mono">{m.id}</span>
                    <span className="text-muted">{m.name}</span>
                    <span className="form-hint">{m.hint}</span>
                    <span style={{ flex: 1 }} />
                    <button type="button" className="btn btn-secondary btn-sm" onClick={() => pickMedia(m.id)}>匹配</button>
                  </div>
                ))}
                {mediaOptions.length === 0 && <div style={{ padding: 16, color: 'var(--ink-light)' }}>无匹配资源，请修改关键词。</div>}
              </div>
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-ghost" onClick={() => { setMediaPicker({ open: false, target: null }); setMediaKeyword(''); }}>取消</button>
          </div>
        </div>
      </div>
      {toastText && <div className="toast show success">{toastText}</div>}
    </>
  );
}
