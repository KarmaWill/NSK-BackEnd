import { useEffect, useMemo, useState } from 'react';

type LangKey = 'EN' | 'ES' | 'FR' | 'PT' | 'CN' | 'JA' | 'KO' | 'TH' | 'VI' | 'ID' | 'MS' | 'KM';
type AudioRef = { id: string; name: string; duration: string; size: string };
type ReadingSegment = {
  id: string;
  textByLang: Partial<Record<LangKey, string>>;
  audioId: string;
  pinyin: string;
};
type ReadingRow = {
  id: string;
  seq: number;
  level: string;
  unitName: string;
  nameByLang: Partial<Record<LangKey, string>>;
  namePinyin: string;
  segments: ReadingSegment[];
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
};

const STORAGE_KEY = 'nsk-audio-reading-lines-v3';
const LEVELS = [{ id: '1', label: 'Level 1' }];
const UNITS = [
  { id: 'U1', levelId: '1', label: 'Unit 1' },
  { id: 'U2', levelId: '1', label: 'Unit 2' },
  { id: 'U3', levelId: '1', label: 'Unit 3' },
  { id: 'U4', levelId: '1', label: 'Unit 4' },
  { id: 'U5', levelId: '1', label: 'Unit 5' },
  { id: 'U6', levelId: '1', label: 'Unit 6' },
];

const AUDIO_LIBRARY: AudioRef[] = [
  { id: 'Y100001', name: 'Unit1-MainFoods.mp3', duration: '00:00:18', size: '420 KB' },
  { id: 'Y100002', name: 'Unit2-DailyDrinks.mp3', duration: '00:00:19', size: '440 KB' },
  { id: 'Y100003', name: 'Unit3-WhatIsThis.mp3', duration: '00:00:24', size: '520 KB' },
  { id: 'Y100004', name: 'Unit4-SelfIntro.mp3', duration: '00:00:20', size: '460 KB' },
  { id: 'Y100005', name: 'Unit5-MyPet.mp3', duration: '00:00:22', size: '500 KB' },
  { id: 'Y100006', name: 'Unit6-FamilyMembers.mp3', duration: '00:00:23', size: '510 KB' },
];

const LANG_LABELS: { key: LangKey; label: string }[] = [
  { key: 'CN', label: 'CN 中文' },
  { key: 'EN', label: 'EN 英文' },
  { key: 'ES', label: 'ES 西语' },
  { key: 'FR', label: 'FR 法语' },
  { key: 'PT', label: 'PT 葡萄牙语' },
  { key: 'JA', label: 'JA 日语' },
  { key: 'KO', label: 'KO 韩语' },
  { key: 'TH', label: 'TH 泰语' },
  { key: 'VI', label: 'VI 越南语' },
  { key: 'ID', label: 'ID 印尼语' },
  { key: 'MS', label: 'MS 马来语' },
  { key: 'KM', label: 'KM 高棉语' },
];

const seedRows: ReadingRow[] = [
  {
    id: 'AR-0001',
    seq: 1,
    level: 'Level 1',
    unitName: 'Unit 1',
    nameByLang: { CN: '日常主食', EN: 'Main Foods' },
    segments: [
      {
        id: 'S1',
        textByLang: {
          CN: '我爱吃米饭，我爱吃饺子，我也爱吃包子。',
          EN: 'I love eating rice, I love eating dumplings, and I also love eating baozi.',
        },
        audioId: 'Y100001',
        pinyin: 'wo ai chi mi fan, wo ai chi jiao zi, wo ye ai chi bao zi.',
      },
      {
        id: 'S2',
        textByLang: {
          CN: '我的肚子说："太好了！"',
          EN: 'My tummy says: "Great!"',
        },
        audioId: 'Y100002',
        pinyin: 'wo de du zi shuo: tai hao le!',
      },
    ],
    namePinyin: 'ri chang zhu shi',
    enabled: true,
    createdAt: '2026-03-01 10:20',
    updatedAt: '2026-03-04 16:10',
  },
  {
    id: 'AR-0002',
    seq: 2,
    level: 'Level 1',
    unitName: 'Unit 2',
    nameByLang: { CN: '日常饮品', EN: 'Daily Drinks' },
    segments: [
      {
        id: 'S1',
        textByLang: {
          CN: '早上我喝牛奶，中午我喝水，晚上我喝茶。',
          EN: 'In the morning I drink milk, at noon I drink water, in the evening I drink tea.',
        },
        audioId: 'Y100003',
        pinyin: 'zao shang wo he niu nai, zhong wu wo he shui, wan shang wo he cha.',
      },
      {
        id: 'S2',
        textByLang: {
          CN: '我是一条小鱼吗？',
          EN: 'Am I a little fish?',
        },
        audioId: 'Y100004',
        pinyin: 'wo shi yi tiao xiao yu ma?',
      },
    ],
    namePinyin: 'ri chang yin pin',
    enabled: false,
    createdAt: '2026-03-02 12:11',
    updatedAt: '2026-03-05 09:35',
  },
];

function normalizeSegment(seg: any, idx: number): ReadingSegment {
  const textByLang =
    seg?.textByLang && typeof seg.textByLang === 'object'
      ? seg.textByLang
      : { CN: typeof seg?.text === 'string' ? seg.text : '' };
  return {
    id: typeof seg?.id === 'string' && seg.id ? seg.id : `S${idx + 1}`,
    textByLang,
    audioId: typeof seg?.audioId === 'string' ? seg.audioId : '',
    pinyin: typeof seg?.pinyin === 'string' ? seg.pinyin : '',
  };
}

function normalizeRow(row: any, idx: number): ReadingRow {
  const segmentsRaw = Array.isArray(row?.segments) ? row.segments : [];
  const segments = (segmentsRaw.length ? segmentsRaw : [{ id: 'S1', textByLang: {}, audioId: '', pinyin: '' }]).map(normalizeSegment);
  const nameByLang =
    row?.nameByLang && typeof row.nameByLang === 'object'
      ? row.nameByLang
      : {
          CN: typeof row?.nameCn === 'string' ? row.nameCn : '',
          EN: typeof row?.nameEn === 'string' ? row.nameEn : '',
        };
  return {
    id: typeof row?.id === 'string' && row.id ? row.id : `AR-${String(idx + 1).padStart(4, '0')}`,
    seq: Number(row?.seq ?? idx + 1),
    level: typeof row?.level === 'string' ? row.level : 'Level 1',
    unitName: typeof row?.unitName === 'string' ? row.unitName : 'Unit 1',
    nameByLang,
    namePinyin: typeof row?.namePinyin === 'string' ? row.namePinyin : '',
    segments,
    enabled: typeof row?.enabled === 'boolean' ? row.enabled : true,
    createdAt: typeof row?.createdAt === 'string' ? row.createdAt : '',
    updatedAt: typeof row?.updatedAt === 'string' ? row.updatedAt : '',
  };
}

function loadRows() {
  if (typeof window === 'undefined') return seedRows;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return seedRows;
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed) || !parsed.length) return seedRows;
    return parsed.map(normalizeRow);
  } catch {
    return seedRows;
  }
}

export function AudioReading() {
  const [rows, setRows] = useState<ReadingRow[]>(() => loadRows());
  const [refreshing, setRefreshing] = useState(false);
  const [toastText, setToastText] = useState('');
  const [levelId, setLevelId] = useState('');
  const [unitId, setUnitId] = useState('');
  const [keyword, setKeyword] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [audioPickerOpen, setAudioPickerOpen] = useState(false);
  const [audioKeyword, setAudioKeyword] = useState('');
  const [audioSegmentIndex, setAudioSegmentIndex] = useState<number | null>(null);
  const [nameLangTab, setNameLangTab] = useState<LangKey>('CN');
  const [segmentLangTab, setSegmentLangTab] = useState<LangKey>('CN');
  const [showBilingual, setShowBilingual] = useState(false);

  const autoTranslateByLang = (seed: string): Partial<Record<LangKey, string>> => {
    const base = seed.trim();
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
  };

  const langBtnStyle = (key: LangKey, active: boolean) => {
    if (key !== 'CN') return undefined;
    return active
      ? {
          background: '#8a1c2b',
          borderColor: '#8a1c2b',
          color: '#fff',
        }
      : {
          background: '#fff5f5',
          borderColor: '#8a1c2b',
          color: '#8a1c2b',
        };
  };

  const unitOptions = useMemo(() => (levelId ? UNITS.filter((u) => u.levelId === levelId) : []), [levelId]);
  const editing = useMemo(() => rows.find((r) => r.id === editingId) ?? null, [rows, editingId]);
  useEffect(() => { setShowBilingual(false); }, [editingId]);
  const audioOptions = useMemo(
    () => AUDIO_LIBRARY.filter((a) => [a.id, a.name].join(' ').toLowerCase().includes(audioKeyword.toLowerCase())),
    [audioKeyword],
  );

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      const byUnit = unitId ? r.unitName === unitId.replace('U', 'Unit ') : true;
      const byKeyword = keyword
        ? [
            r.id,
            r.level,
            r.unitName,
            ...Object.values(r.nameByLang),
            ...r.segments.map((s) => `${Object.values(s.textByLang).join(' ')} ${s.audioId}`),
          ]
            .join(' ')
            .toLowerCase()
            .includes(keyword.toLowerCase())
        : true;
      return byUnit && byKeyword;
    });
  }, [rows, unitId, keyword]);

  const saveRows = (next: ReadingRow[]) => {
    setRows(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  };

  const patchEditing = (patch: Partial<ReadingRow>) => {
    if (!editing) return;
    const next = rows.map((r) => (r.id === editing.id ? { ...r, ...patch } : r));
    saveRows(next);
  };
  const patchEditingSegment = (idx: number, patch: Partial<ReadingSegment>) => {
    if (!editing) return;
    const nextSegs = editing.segments.map((s, i) => (i === idx ? { ...s, ...patch } : s));
    patchEditing({ segments: nextSegs });
  };
  const patchEditingSegmentLangText = (idx: number, lang: LangKey, text: string) => {
    if (!editing) return;
    const nextSegs = editing.segments.map((s, i) => (i === idx ? { ...s, textByLang: { ...s.textByLang, [lang]: text } } : s));
    patchEditing({ segments: nextSegs });
  };
  const addSegment = () => {
    if (!editing) return;
    const next = [...editing.segments, { id: `S${editing.segments.length + 1}`, textByLang: {}, audioId: '', pinyin: '' }];
    patchEditing({ segments: next });
  };
  const removeSegment = (idx: number) => {
    if (!editing) return;
    const next = editing.segments.filter((_, i) => i !== idx).map((s, i) => ({ ...s, id: `S${i + 1}` }));
    patchEditing({ segments: next });
  };

  const addLine = () => {
    const nextId = `AR-${String(rows.length + 1).padStart(4, '0')}`;
    const now = new Date().toISOString().slice(0, 16).replace('T', ' ');
    const unit = unitId ? unitId.replace('U', 'Unit ') : 'Unit 1';
    const nextRow: ReadingRow = {
      id: nextId,
      seq: rows.length + 1,
      level: 'Level 1',
      unitName: unit,
      nameByLang: {},
      namePinyin: '',
      segments: [{ id: 'S1', textByLang: {}, audioId: '', pinyin: '' }],
      enabled: true,
      createdAt: now,
      updatedAt: now,
    };
    const next = [nextRow, ...rows];
    saveRows(next);
    setEditingId(nextId);
  };

  const deleteRow = (id: string) => {
    const next = rows.filter((r) => r.id !== id);
    saveRows(next);
    if (editingId === id) setEditingId(null);
  };

  const handleRefresh = () => {
    if (refreshing) return;
    setRefreshing(true);
    window.setTimeout(() => {
      setRows((prev) => [...prev]);
      setRefreshing(false);
      setToastText('有声阅读配置刷新完成');
      window.setTimeout(() => setToastText(''), 1500);
    }, 600);
  };

  return (
    <>
      <div className="page-header">
        <div>
          <div className="page-title">有声阅读配置</div>
          <div className="page-subtitle">按 CSV 维度配置：级别/单元/名称中英/文章中英拼音 + 资源库音频挂载 + 多语言</div>
        </div>
        <div className="page-actions">
          <button type="button" className="btn btn-secondary" onClick={handleRefresh} disabled={refreshing}>
            <span className={`spin-icon ${refreshing ? 'spinning' : ''}`}>↻</span>
            刷新
          </button>
          <button type="button" className="btn btn-secondary">导入</button>
          <button type="button" className="btn btn-primary" onClick={addLine}>+ 新增文章</button>
        </div>
      </div>

      <div className="filter-bar">
        <select className="filter-select" value={levelId} onChange={(e) => { setLevelId(e.target.value); setUnitId(''); }}>
          <option value="">全部级别</option>
          {LEVELS.map((l) => <option key={l.id} value={l.id}>{l.label}</option>)}
        </select>
        <select className="filter-select" value={unitId} onChange={(e) => setUnitId(e.target.value)} disabled={!levelId}>
          <option value="">全部单元</option>
          {unitOptions.map((u) => <option key={u.id} value={u.id}>{u.label}</option>)}
        </select>
        <input className="filter-select" placeholder="搜索：名称/文章/音频ID" value={keyword} onChange={(e) => setKeyword(e.target.value)} />
      </div>

      <div className="table-wrap">
        <div className="table-top">
          <span className="table-count">共 {filtered.length} 条有声阅读句子配置</span>
        </div>
        <table>
          <thead>
            <tr>
              <th>序号</th>
              <th>NAMEID</th>
              <th>级别</th>
              <th>单元名称</th>
              <th>名称(中文)</th>
              <th>句子音频映射（包含句子数量）</th>
              <th>状态</th>
              <th>创建时间</th>
              <th>更新时间</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((r, i) => (
              <tr key={r.id}>
                <td className="td-mono">{String(r.seq || i + 1).padStart(3, '0')}</td>
                <td className="td-mono">{r.id}</td>
                <td>{r.level}</td>
                <td>{r.unitName}</td>
                <td>{r.nameByLang.CN ?? '—'}</td>
                <td className="td-mono">{r.segments.filter((s) => s.audioId).length}/{r.segments.length}</td>
                <td>{r.enabled ? '已启用' : '已停用'}</td>
                <td className="td-mono">{r.createdAt}</td>
                <td className="td-mono">{r.updatedAt}</td>
                <td>
                  <button type="button" className="btn btn-ghost btn-sm" onClick={() => setEditingId(r.id)}>编辑</button>
                  <button type="button" className="btn btn-ghost btn-sm" style={{ color: 'var(--rose)' }} onClick={() => deleteRow(r.id)}>删除</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className={`modal-overlay ${editing ? 'open' : ''}`} onClick={() => setEditingId(null)} role="dialog" aria-modal="true" aria-label="配置有声阅读">
        <div className="modal modal-wide" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 980 }}>
          <div className="modal-header">
            <div className="modal-title">编辑有声阅读文章</div>
            <button type="button" className="modal-close" onClick={() => setEditingId(null)} aria-label="关闭">✕</button>
          </div>
          {editing && (
            <div className="modal-body" style={{ display: 'flex', padding: 0 }}>
              <div style={{ flex: 1, padding: 24, borderRight: '1px solid var(--stone-dark)', maxHeight: '75vh', overflowY: 'auto' }}>
                <div className="section-title">内容所属（CSV 维度）</div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">序号</label>
                    <input className="form-input td-mono" value={String(editing.seq)} onChange={(e) => patchEditing({ seq: Number(e.target.value || 0), updatedAt: new Date().toISOString().slice(0, 16).replace('T', ' ') })} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">级别</label>
                    <input className="form-input" value={editing.level} onChange={(e) => patchEditing({ level: e.target.value })} />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">单元名称</label>
                    <input className="form-input" value={editing.unitName} onChange={(e) => patchEditing({ unitName: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">NameId</label>
                    <input className="form-input td-mono" value={editing.id} readOnly />
                  </div>
                </div>
                <div className="section-title">名称（多语言）</div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 8 }}>
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    onClick={() => {
                      const seed = (editing.nameByLang.CN ?? '').trim();
                      patchEditing({ nameByLang: { ...editing.nameByLang, ...autoTranslateByLang(seed) } });
                    }}
                  >
                    自动翻译
                  </button>
                </div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
                  {LANG_LABELS.map((o) => (
                    <button
                      key={o.key}
                      type="button"
                      className={`btn btn-sm ${nameLangTab === o.key ? 'btn-primary' : 'btn-secondary'}`}
                      onClick={() => setNameLangTab(o.key)}
                      style={langBtnStyle(o.key, nameLangTab === o.key)}
                    >
                      {o.key}
                    </button>
                  ))}
                </div>
                <div className="form-group">
                  <label className="form-label">{LANG_LABELS.find((l) => l.key === nameLangTab)?.label} 名称</label>
                  <input
                    className="form-input"
                    value={editing.nameByLang[nameLangTab] ?? ''}
                    onChange={(e) => patchEditing({ nameByLang: { ...editing.nameByLang, [nameLangTab]: e.target.value } })}
                    placeholder={`请输入 ${nameLangTab} 名称`}
                  />
                </div>
                {nameLangTab === 'CN' && (
                  <div className="form-group">
                    <label className="form-label">中文拼音</label>
                    <input
                      className="form-input"
                      value={editing.namePinyin}
                      onChange={(e) => patchEditing({ namePinyin: e.target.value })}
                      placeholder="仅中文配置拼音"
                    />
                  </div>
                )}

                <div className="section-title">句子与音频一一对应</div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 8 }}>
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    onClick={() => {
                      const next = editing.segments.map((seg) => ({
                        ...seg,
                        textByLang: { ...seg.textByLang, ...autoTranslateByLang(seg.textByLang.CN ?? '') },
                      }));
                      patchEditing({ segments: next });
                    }}
                  >
                    自动翻译（按中文生成）
                  </button>
                </div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
                  {LANG_LABELS.map((o) => (
                    <button
                      key={o.key}
                      type="button"
                      className={`btn btn-sm ${segmentLangTab === o.key ? 'btn-primary' : 'btn-secondary'}`}
                      onClick={() => setSegmentLangTab(o.key)}
                      style={langBtnStyle(o.key, segmentLangTab === o.key)}
                    >
                      {o.key}
                    </button>
                  ))}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 12 }}>
                  {editing.segments.map((seg, idx) => (
                    <div key={seg.id} style={{ border: '1px solid var(--stone-dark)', borderRadius: 10, padding: 10, background: 'var(--white)' }}>
                      <div className="td-mono" style={{ marginBottom: 6 }}>{seg.id}</div>
                      <textarea
                        className="form-input"
                        rows={2}
                        value={seg.textByLang[segmentLangTab] ?? ''}
                        onChange={(e) => patchEditingSegmentLangText(idx, segmentLangTab, e.target.value)}
                        placeholder={`该句${segmentLangTab}内容`}
                        style={{ marginBottom: 8 }}
                      />
                      {segmentLangTab === 'CN' ? (
                        <div style={{ display: 'grid', gap: 8 }}>
                          <input
                            className="form-input"
                            value={seg.pinyin}
                            onChange={(e) => patchEditingSegment(idx, { pinyin: e.target.value })}
                            placeholder="该句中文拼音"
                          />
                          <div style={{ display: 'flex', gap: 8 }}>
                            <input
                              className="form-input td-mono"
                              value={seg.audioId}
                              onChange={(e) => patchEditingSegment(idx, { audioId: e.target.value })}
                              placeholder="音频ID"
                            />
                            <button
                              type="button"
                              className="btn btn-secondary btn-sm"
                              onClick={() => {
                                setAudioSegmentIndex(idx);
                                setAudioPickerOpen(true);
                              }}
                            >
                              资源库选择
                            </button>
                            <button type="button" className="btn btn-ghost btn-sm" style={{ color: 'var(--rose)' }} onClick={() => removeSegment(idx)}>
                              删除
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span className="form-hint">当前语言仅配置文字，不配置音频。</span>
                          <button type="button" className="btn btn-ghost btn-sm" style={{ color: 'var(--rose)' }} onClick={() => removeSegment(idx)}>
                            删除
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                <button type="button" className="btn btn-secondary btn-sm" onClick={addSegment}>+ 新增句子音频映射</button>
              </div>

              <div style={{ width: 320, flexShrink: 0, padding: 22, background: 'var(--mist)', display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ border: '1px solid var(--stone-dark)', borderRadius: 14, background: 'var(--white)', padding: 14 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                    <div>
                      <div style={{ fontSize: 12, color: 'var(--ink-light)' }}>{editing.nameByLang.EN || 'Untitled'}</div>
                      <div className="td-mono" style={{ marginTop: 2 }}>{editing.unitName}</div>
                    </div>
                    <button type="button" className={`badge ${showBilingual ? 'badge-teal' : 'badge-muted'}`} onClick={() => setShowBilingual((v) => !v)} style={{ cursor: 'pointer', border: 'none' }} title={showBilingual ? '再点一次隐藏' : '点击显示双语内容'}>Bilingual</button>
                  </div>
                  {(editing.segments.length ? editing.segments : [{ id: 'S1', textByLang: {}, audioId: '', pinyin: '' }]).map((seg, idx) => (
                    <div
                      key={seg.id}
                      style={{
                        border: idx === 0 ? '2px solid #22b8a7' : '1px solid var(--stone-dark)',
                        borderRadius: 10,
                        padding: 10,
                        marginBottom: 8,
                        background: '#fff',
                      }}
                    >
                      {showBilingual && (
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 8 }}>
                          <div style={{ fontSize: 13, lineHeight: 1.6 }}>{seg.textByLang.CN || '（未填写中文）'}</div>
                          <div style={{ fontSize: 13, lineHeight: 1.6 }}>{seg.textByLang.EN || '—'}</div>
                        </div>
                      )}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: showBilingual ? 0 : 0 }}>
                        <span className="td-mono" style={{ marginTop: 6 }}>Audio: {seg.audioId || '—'}</span>
                        <button type="button" className="btn btn-secondary btn-sm" style={{ marginTop: 4 }} title="播放" aria-label="播放">▶ 播放</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
          <div className="modal-footer">
            <button type="button" className="btn btn-ghost" onClick={() => setEditingId(null)}>关闭</button>
            <button type="button" className="btn btn-primary" onClick={() => { setToastText('有声阅读配置已保存'); window.setTimeout(() => setToastText(''), 1400); setEditingId(null); }}>保存配置</button>
          </div>
        </div>
      </div>

      <div className={`modal-overlay ${audioPickerOpen ? 'open' : ''}`} onClick={() => setAudioPickerOpen(false)} role="dialog" aria-modal="true" aria-label="选择资源库音频">
        <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 560 }}>
          <div className="modal-header">
            <div className="modal-title">从资源库选择音频</div>
            <button type="button" className="modal-close" onClick={() => setAudioPickerOpen(false)} aria-label="关闭">✕</button>
          </div>
          <div className="modal-body">
            <input className="form-input" placeholder="搜索音频ID或文件名" value={audioKeyword} onChange={(e) => setAudioKeyword(e.target.value)} style={{ marginBottom: 10 }} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 320, overflowY: 'auto' }}>
              {audioOptions.map((a) => (
                <div key={a.id} style={{ border: '1px solid var(--stone-dark)', borderRadius: 8, padding: 10, display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ flex: 1 }}>
                    <div className="td-mono">{a.id}</div>
                    <div>{a.name}</div>
                    <div className="form-hint">{a.duration} · {a.size}</div>
                  </div>
                  <button
                    type="button"
                    className="btn btn-primary btn-sm"
                    onClick={() => {
                      if (editing && audioSegmentIndex !== null) patchEditingSegment(audioSegmentIndex, { audioId: a.id });
                      setAudioPickerOpen(false);
                      setAudioSegmentIndex(null);
                    }}
                  >
                    选择
                  </button>
                </div>
              ))}
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-ghost" onClick={() => setAudioPickerOpen(false)}>关闭</button>
          </div>
        </div>
      </div>

      {toastText && <div className="toast show success">{toastText}</div>}
    </>
  );
}

