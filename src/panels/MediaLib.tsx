import { useMemo, useRef, useState } from 'react';

type LessonItem = { id: string; label: string };
type UnitItem = { id: string; label: string; lessons: LessonItem[] };
type LevelItem = { id: string; label: string; units: UnitItem[] };
type AssetType = '音频' | '视频' | '图片';
type AssetRow = {
  id: string;
  dirId: string;
  bucket: string;
  name: string;
  type: AssetType;
  format: string;
  size: string;
  duration: string;
  used: string;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
  mediaUrl?: string;
};

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

const defaultAssets: AssetRow[] = [
  { id: 'Y100001', dirId: 'N10101', bucket: '私有桶', name: '米饭.mp3', type: '音频', format: 'mp3', size: '128 KB', duration: '00:00:12', used: '学习资源 · 题库', enabled: true, createdAt: '2026-03-02 09:22', updatedAt: '2026-03-04 12:13' },
  { id: 'Y100005', dirId: 'N10102', bucket: '私有桶', name: '米.mp3', type: '音频', format: 'mp3', size: '64 KB', duration: '00:00:08', used: '学习资源', enabled: false, createdAt: '2026-03-01 16:40', updatedAt: '2026-03-03 18:45' },
  { id: 'V100003', dirId: 'N10201', bucket: '私有桶', name: 'V100003.mp4', type: '视频', format: 'mp4', size: '2.1 MB', duration: '00:00:15', used: '文化内容', enabled: true, createdAt: '2026-02-28 14:10', updatedAt: '2026-03-02 10:20' },
];

function formatNow() {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
}

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function inferType(file: File): AssetType {
  if (file.type.startsWith('audio/')) return '音频';
  if (file.type.startsWith('video/')) return '视频';
  return '图片';
}

export function MediaLib() {
  const [assets, setAssets] = useState<AssetRow[]>(defaultAssets);
  const [refreshing, setRefreshing] = useState(false);
  const [toastText, setToastText] = useState('');
  const [selectedType, setSelectedType] = useState<'全部' | AssetType>('全部');
  const [selectedLevel, setSelectedLevel] = useState('');
  const [selectedUnit, setSelectedUnit] = useState('');
  const [selectedLesson, setSelectedLesson] = useState('');
  const [dirKeyword, setDirKeyword] = useState('');
  const [fileNameKeyword, setFileNameKeyword] = useState('');
  const [formatKeyword, setFormatKeyword] = useState('');
  const [globalKeyword, setGlobalKeyword] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [deleteIndex, setDeleteIndex] = useState<number | null>(null);
  const [previewIndex, setPreviewIndex] = useState<number | null>(null);
  const [replaceDraft, setReplaceDraft] = useState<{ index: number; file: File; url: string } | null>(null);
  const uploadInputRef = useRef<HTMLInputElement>(null);
  const replaceInputRef = useRef<HTMLInputElement>(null);

  const unitOptions = useMemo(
    () => (selectedLevel ? LESSON_MAP.find((l) => l.id === selectedLevel)?.units ?? [] : []),
    [selectedLevel],
  );
  const lessonOptions = useMemo(
    () => (selectedUnit ? unitOptions.find((u) => u.id === selectedUnit)?.lessons ?? [] : []),
    [selectedUnit, unitOptions],
  );
  const filteredAssets = useMemo(() => {
    return assets.filter((a) => {
      const typeMatch = selectedType === '全部' ? true : a.type === selectedType;
      const unitMatch = selectedUnit ? a.dirId.startsWith(selectedUnit.slice(0, 4)) || a.dirId === selectedUnit : true;
      const lessonMatch = selectedLesson ? a.dirId === selectedLesson : true;
      const keywordMatch = dirKeyword ? a.dirId.toLowerCase().includes(dirKeyword.toLowerCase()) : true;
      const fileMatch = fileNameKeyword ? a.name.toLowerCase().includes(fileNameKeyword.toLowerCase()) : true;
      const formatMatch = formatKeyword ? a.format.toLowerCase().includes(formatKeyword.toLowerCase()) : true;
      const globalMatch = globalKeyword
        ? [a.name, a.id, a.dirId, a.bucket, a.format].join(' ').toLowerCase().includes(globalKeyword.toLowerCase())
        : true;
      return typeMatch && unitMatch && lessonMatch && keywordMatch && fileMatch && formatMatch && globalMatch;
    });
  }, [assets, selectedType, selectedUnit, selectedLesson, dirKeyword, fileNameKeyword, formatKeyword, globalKeyword]);

  const confirmDelete = () => {
    if (deleteIndex === null) return;
    setAssets((prev) => prev.filter((_, i) => i !== deleteIndex));
    setDeleteIndex(null);
  };
  const toggleSelected = (id: string) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };
  const toggleAllOnCurrentPage = () => {
    const ids = filteredAssets.map((a) => a.id);
    const allSelected = ids.length > 0 && ids.every((id) => selectedIds.includes(id));
    if (allSelected) {
      setSelectedIds((prev) => prev.filter((id) => !ids.includes(id)));
      return;
    }
    setSelectedIds((prev) => [...new Set([...prev, ...ids])]);
  };
  const currentPreview = previewIndex !== null ? assets[previewIndex] : null;

  const onUploadNew = (file?: File) => {
    if (!file) return;
    const now = formatNow();
    const type = inferType(file);
    const prefix = type === '音频' ? 'Y' : type === '视频' ? 'V' : 'I';
    const id = `${prefix}${String(100000 + assets.length + 1)}`;
    const mediaUrl = URL.createObjectURL(file);
    const row: AssetRow = {
      id,
      dirId: selectedLesson || selectedUnit || 'N10101',
      bucket: '私有桶',
      name: file.name,
      type,
      format: file.name.split('.').pop()?.toLowerCase() || '',
      size: formatSize(file.size),
      duration: '--',
      used: '未引用',
      enabled: true,
      createdAt: now,
      updatedAt: now,
      mediaUrl,
    };
    setAssets((prev) => [row, ...prev]);
  };
  const onPickReplace = (file?: File) => {
    if (!file || previewIndex === null) return;
    const url = URL.createObjectURL(file);
    setReplaceDraft({ index: previewIndex, file, url });
  };
  const confirmReplace = () => {
    if (!replaceDraft) return;
    const { index, file, url } = replaceDraft;
    setAssets((prev) =>
      prev.map((a, i) =>
        i === index
          ? {
              ...a,
              name: file.name,
              type: inferType(file),
              format: file.name.split('.').pop()?.toLowerCase() || '',
              size: formatSize(file.size),
              mediaUrl: url,
              updatedAt: formatNow(),
            }
          : a,
      ),
    );
    setReplaceDraft(null);
  };
  const cancelReplace = () => {
    if (replaceDraft?.url) URL.revokeObjectURL(replaceDraft.url);
    setReplaceDraft(null);
  };
  const handleRefresh = () => {
    if (refreshing) return;
    setRefreshing(true);
    window.setTimeout(() => {
      setAssets((prev) => [...prev]);
      setRefreshing(false);
      setToastText('资源库刷新完成');
      window.setTimeout(() => setToastText(''), 1600);
    }, 600);
  };

  return (
    <>
      <div className="page-header">
        <div>
          <div className="page-title">资源库</div>
          <div className="page-subtitle">可按条件检索并勾选资源，一键匹配到课程/学习资源/题库</div>
        </div>
        <div className="page-actions">
          <input ref={uploadInputRef} type="file" accept="audio/*,video/*,image/*" style={{ display: 'none' }} onChange={(e) => onUploadNew(e.target.files?.[0])} />
          <button type="button" className="btn btn-secondary" onClick={handleRefresh} disabled={refreshing}>
            <span className={`spin-icon ${refreshing ? 'spinning' : ''}`}>↻</span>
            刷新
          </button>
          <button type="button" className="btn btn-secondary" onClick={() => uploadInputRef.current?.click()}>上传文件</button>
        </div>
      </div>

      <div
        style={{
          width: '100%',
          display: 'grid',
          gridTemplateColumns: '1fr 1fr auto auto 1fr',
          gap: 12,
          padding: 14,
          border: '1px solid var(--stone-dark)',
          borderRadius: 10,
          background: 'var(--white)',
          marginBottom: 12,
        }}
      >
        <input className="filter-select" placeholder="文件名" value={fileNameKeyword} onChange={(e) => setFileNameKeyword(e.target.value)} />
        <input className="filter-select" placeholder="文件类型（mp3/mp4/png）" value={formatKeyword} onChange={(e) => setFormatKeyword(e.target.value)} />
        <button type="button" className="btn btn-primary btn-sm">查询</button>
        <button
          type="button"
          className="btn btn-secondary btn-sm"
          onClick={() => {
            setFileNameKeyword('');
            setFormatKeyword('');
            setGlobalKeyword('');
            setDirKeyword('');
            setSelectedType('全部');
          }}
        >
          重置
        </button>
        <input className="filter-select" placeholder="检索：在全目录中搜索" value={globalKeyword} onChange={(e) => setGlobalKeyword(e.target.value)} />
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
        <span className={`filter-tag ${selectedType === '全部' ? 'active' : ''}`} onClick={() => setSelectedType('全部')}>全部</span>
        <span className={`filter-tag ${selectedType === '音频' ? 'active' : ''}`} onClick={() => setSelectedType('音频')}>音频</span>
        <span className={`filter-tag ${selectedType === '视频' ? 'active' : ''}`} onClick={() => setSelectedType('视频')}>视频</span>
        <span className={`filter-tag ${selectedType === '图片' ? 'active' : ''}`} onClick={() => setSelectedType('图片')}>图片</span>
        <span style={{ flex: 1 }} />
        <span className="table-count">共 {filteredAssets.length} 个素材</span>
      </div>

      <div className="table-wrap">
        <div className="table-top">
          <span className="table-count">列表</span>
          <span style={{ flex: 1 }} />
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={() => setToastText(selectedIds.length ? `已匹配 ${selectedIds.length} 个资源` : '请先勾选资源')}
          >
            匹配已选资源
          </button>
        </div>
        <table>
          <thead>
            <tr>
              <th style={{ width: 40 }}>
                <input
                  type="checkbox"
                  checked={filteredAssets.length > 0 && filteredAssets.every((a) => selectedIds.includes(a.id))}
                  onChange={toggleAllOnCurrentPage}
                />
              </th>
              <th>文件名</th>
              <th>缩略图</th>
              <th>桶</th>
              <th>格式</th>
              <th>大小</th>
              <th>时长</th>
              <th>创建时间</th>
              <th>操作时间</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {filteredAssets.map((a) => (
              <tr key={a.id}>
                <td>
                  <input type="checkbox" checked={selectedIds.includes(a.id)} onChange={() => toggleSelected(a.id)} />
                </td>
                <td>
                  <div style={{ fontWeight: 500 }}>{a.name}</div>
                  <div className="td-mono">{a.id} · {a.dirId}</div>
                </td>
                <td style={{ color: 'var(--ink-light)' }}>{a.type === '图片' ? '🖼️' : a.type === '视频' ? '🎬' : '🎵'}</td>
                <td>{a.bucket}</td>
                <td className="td-mono">{a.format || '--'}</td>
                <td className="td-mono">{a.size}</td>
                <td className="td-mono">{a.duration}</td>
                <td className="td-mono" style={{ fontSize: 12 }}>{a.createdAt}</td>
                <td className="td-mono" style={{ fontSize: 12 }}>{a.updatedAt}</td>
                <td>
                  <button type="button" className="btn btn-ghost btn-sm" onClick={() => setPreviewIndex(assets.findIndex((x) => x.id === a.id))}>详情</button>
                  <button type="button" className="btn btn-ghost btn-sm" onClick={() => setPreviewIndex(assets.findIndex((x) => x.id === a.id))}>编辑</button>
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    style={{ color: 'var(--rose)' }}
                    onClick={() => setDeleteIndex(assets.findIndex((x) => x.id === a.id))}
                  >
                    删除
                  </button>
                </td>
              </tr>
            ))}
            {filteredAssets.length === 0 && (
              <tr>
                <td colSpan={10} style={{ textAlign: 'center', color: 'var(--ink-light)' }}>
                  无匹配素材，请调整筛选条件
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className={`modal-overlay ${deleteIndex !== null ? 'open' : ''}`} onClick={() => setDeleteIndex(null)} role="dialog" aria-modal="true" aria-label="确认删除素材">
        <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 400 }}>
          <div className="modal-header">
            <div className="modal-title">确认删除</div>
            <button type="button" className="modal-close" onClick={() => setDeleteIndex(null)} aria-label="关闭">✕</button>
          </div>
          <div className="modal-body">
            <p style={{ margin: 0 }}>确认删除该素材？删除后不可恢复。</p>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-ghost" onClick={() => setDeleteIndex(null)}>取消</button>
            <button type="button" className="btn btn-primary" onClick={confirmDelete}>确认删除</button>
          </div>
        </div>
      </div>

      <div className={`modal-overlay ${previewIndex !== null ? 'open' : ''}`} onClick={() => { setPreviewIndex(null); cancelReplace(); }} role="dialog" aria-modal="true" aria-label="预览素材">
        <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 560 }}>
          <div className="modal-header">
            <div className="modal-title">素材预览</div>
            <button type="button" className="modal-close" onClick={() => { setPreviewIndex(null); cancelReplace(); }} aria-label="关闭">✕</button>
          </div>
          <div className="modal-body">
            {currentPreview && (
              <>
                <div style={{ marginBottom: 10, fontSize: 12, color: 'var(--ink-light)' }}>
                  {currentPreview.id} · {currentPreview.name}
                </div>
                {currentPreview.type === '音频' && (
                  currentPreview.mediaUrl ? <audio controls src={currentPreview.mediaUrl} style={{ width: '100%' }} /> : <div className="form-hint">当前音频无在线预览源，替换后可试听。</div>
                )}
                {currentPreview.type === '视频' && (
                  currentPreview.mediaUrl ? <video controls src={currentPreview.mediaUrl} style={{ width: '100%', borderRadius: 8 }} /> : <div className="form-hint">当前视频无在线预览源，替换后可播放。</div>
                )}
                {currentPreview.type === '图片' && (
                  currentPreview.mediaUrl ? <img src={currentPreview.mediaUrl} alt="" style={{ width: '100%', borderRadius: 8 }} /> : <div className="form-hint">当前图片无预览源，替换后可查看。</div>
                )}
                <div style={{ marginTop: 14 }}>
                  <input ref={replaceInputRef} type="file" accept="audio/*,video/*,image/*" style={{ display: 'none' }} onChange={(e) => onPickReplace(e.target.files?.[0])} />
                  <button type="button" className="btn btn-secondary" onClick={() => replaceInputRef.current?.click()}>重新上传并替换</button>
                </div>
                {replaceDraft && (
                  <div style={{ marginTop: 10, padding: 10, border: '1px solid var(--stone-dark)', borderRadius: 8, background: 'var(--mist)' }}>
                    <div className="form-hint" style={{ marginBottom: 8 }}>待替换文件：{replaceDraft.file.name}</div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button type="button" className="btn btn-primary btn-sm" onClick={confirmReplace}>确认替换</button>
                      <button type="button" className="btn btn-ghost btn-sm" onClick={cancelReplace}>取消</button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-ghost" onClick={() => { setPreviewIndex(null); cancelReplace(); }}>关闭</button>
          </div>
        </div>
      </div>
      {toastText && <div className="toast show success">{toastText}</div>}
    </>
  );
}
