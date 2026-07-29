import { useEffect, useMemo, useRef, useState } from 'react';
import { getApiBase } from '../lib/api';
import { formatMediaDuration, resolveMediaThumbnailState } from '../utils/mediaPresentation';
import {
  deleteMediaAsset,
  listMediaDirs,
  pageMediaAssets,
  replaceMediaAsset,
  uploadMediaAsset,
  type MediaAsset,
  type MediaAssetType,
  type MediaDirNode,
} from '../services/mediaApi';

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
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
  mediaUrl?: string;
};

const PAGE_SIZE = 20;

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function backendTypeToUi(type: MediaAssetType): AssetType {
  if (type === 'audio') return '音频';
  if (type === 'video') return '视频';
  return '图片';
}

function selectedTypeToBackend(type: '全部' | AssetType): MediaAssetType | undefined {
  if (type === '音频') return 'audio';
  if (type === '视频') return 'video';
  if (type === '图片') return 'image';
  return undefined;
}

function formatTimestamp(value: string) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value || '--';
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
}

function resolveMediaUrl(url: string) {
  if (/^(https?:|blob:|data:)/i.test(url)) return url;
  if (url.startsWith('/uploads/')) return `${getApiBase().replace(/\/$/, '')}${url}`;
  return url;
}

function mapAsset(asset: MediaAsset): AssetRow {
  return {
    id: asset.id,
    dirId: asset.dirId ?? '',
    bucket: asset.bucket,
    name: asset.name,
    type: backendTypeToUi(asset.type),
    format: asset.format,
    size: formatSize(asset.sizeBytes),
    duration: formatMediaDuration(asset.durationSeconds),
    enabled: asset.enabled,
    createdAt: formatTimestamp(asset.createdAt),
    updatedAt: formatTimestamp(asset.updatedAt),
    mediaUrl: asset.url ? resolveMediaUrl(asset.url) : undefined,
  };
}

function sortedDirNodes(nodes: MediaDirNode[] = []) {
  return [...nodes].sort((a, b) => a.sortOrder - b.sortOrder || a.id.localeCompare(b.id));
}

function mapDirTree(nodes: MediaDirNode[]): LevelItem[] {
  return sortedDirNodes(nodes)
    .filter((level) => level.kind === 'level')
    .map((level) => ({
      id: level.id,
      label: level.label,
      units: sortedDirNodes(level.children)
        .filter((unit) => unit.kind === 'unit')
        .map((unit) => ({
          id: unit.id,
          label: unit.label,
          lessons: sortedDirNodes(unit.children)
            .filter((lesson) => lesson.kind === 'lesson')
            .map((lesson) => ({ id: lesson.id, label: lesson.label })),
        })),
    }));
}

function getErrorMessage(err: unknown, fallback: string) {
  if (err instanceof Error && err.message) return err.message;
  if (typeof err === 'string' && err) return err;
  return fallback;
}

function MediaThumbnail({
  asset,
  imageFailed,
  onImageError,
}: {
  asset: AssetRow;
  imageFailed: boolean;
  onImageError: () => void;
}) {
  const state = resolveMediaThumbnailState(asset.type, asset.mediaUrl, imageFailed);
  const frameStyle = {
    width: 64,
    height: 40,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderRadius: 4,
    color: 'var(--ink-light)',
    background: 'var(--mist)',
  } as const;

  if (state === 'image') {
    return (
      <img
        src={asset.mediaUrl}
        alt={`${asset.name} 缩略图`}
        loading="lazy"
        decoding="async"
        style={{ ...frameStyle, display: 'block', objectFit: 'cover' }}
        onError={onImageError}
      />
    );
  }
  if (state === 'image-unavailable') {
    return <span style={{ ...frameStyle, fontSize: 11 }} title="图片预览不可用">图片不可用</span>;
  }
  return <span style={frameStyle} aria-label={state === 'video' ? '视频素材' : '音频素材'}>{state === 'video' ? '🎬' : '🎵'}</span>;
}

export function MediaLib() {
  const [assets, setAssets] = useState<AssetRow[]>([]);
  const [totalAssets, setTotalAssets] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [jumpPage, setJumpPage] = useState('1');
  const [lessonMap, setLessonMap] = useState<LevelItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
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
  const [appliedFilters, setAppliedFilters] = useState({ name: '', format: '', global: '', dirId: '' });
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [deleteAssetId, setDeleteAssetId] = useState<string | null>(null);
  const [previewAssetId, setPreviewAssetId] = useState<string | null>(null);
  const [replaceDraft, setReplaceDraft] = useState<{ assetId: string; file: File } | null>(null);
  const [imagePreviewFailures, setImagePreviewFailures] = useState<Record<string, string>>({});
  const uploadInputRef = useRef<HTMLInputElement>(null);
  const replaceInputRef = useRef<HTMLInputElement>(null);
  const requestIdRef = useRef(0);
  const toastTimerRef = useRef<number | null>(null);

  const unitOptions = useMemo(
    () => (selectedLevel ? lessonMap.find((l) => l.id === selectedLevel)?.units ?? [] : []),
    [lessonMap, selectedLevel],
  );
  const lessonOptions = useMemo(
    () => (selectedUnit ? unitOptions.find((u) => u.id === selectedUnit)?.lessons ?? [] : []),
    [selectedUnit, unitOptions],
  );
  const selectedDirIds = useMemo(() => {
    if (selectedLesson) return [selectedLesson];
    if (selectedUnit) {
      return [selectedUnit, ...lessonOptions.map((lesson) => lesson.id)];
    }
    if (selectedLevel) {
      const level = lessonMap.find((item) => item.id === selectedLevel);
      return level
        ? [level.id, ...level.units.flatMap((unit) => [unit.id, ...unit.lessons.map((lesson) => lesson.id)])]
        : [];
    }
    return [];
  }, [lessonMap, lessonOptions, selectedLesson, selectedLevel, selectedUnit]);
  const filteredAssets = useMemo(() => {
    return assets;
  }, [assets]);
  const totalPages = Math.max(1, Math.ceil(totalAssets / PAGE_SIZE));
  const latestLoadStateRef = useRef({
    currentPage,
    selectedType,
    appliedFilters,
    selectedDirIds,
    hasDirTree: lessonMap.length > 0,
  });
  latestLoadStateRef.current = {
    currentPage,
    selectedType,
    appliedFilters,
    selectedDirIds,
    hasDirTree: lessonMap.length > 0,
  };

  useEffect(() => {
    setJumpPage(String(currentPage));
  }, [currentPage]);

  const confirmDelete = async () => {
    if (!deleteAssetId) return;
    const targetId = deleteAssetId;
    setDeleteAssetId(null);
    try {
      await deleteMediaAsset(targetId);
      setSelectedIds((previous) => previous.filter((id) => id !== targetId));
      await loadRemote();
      showToast('素材删除成功');
    } catch (err) {
      setError(getErrorMessage(err, '素材删除失败'));
    }
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
  const currentPreview = previewAssetId ? assets.find((asset) => asset.id === previewAssetId) ?? null : null;

  const showToast = (text: string) => {
    if (toastTimerRef.current !== null) window.clearTimeout(toastTimerRef.current);
    setToastText(text);
    toastTimerRef.current = window.setTimeout(() => setToastText(''), 1600);
  };
  const clearUploadInput = () => {
    if (uploadInputRef.current) uploadInputRef.current.value = '';
  };

  const loadRemote = async (options: { asRefresh?: boolean } = {}) => {
    const loadState = latestLoadStateRef.current;
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;
    if (options.asRefresh) setRefreshing(true);
    else setLoading(true);
    setError('');

    try {
      const shouldLoadDirs = !loadState.hasDirTree || options.asRefresh;
      const [dirs, remotePage] = await Promise.all([
        shouldLoadDirs ? listMediaDirs() : Promise.resolve(null),
        pageMediaAssets({
          current: loadState.currentPage,
          size: PAGE_SIZE,
          type: selectedTypeToBackend(loadState.selectedType),
          dirId: loadState.appliedFilters.dirId || undefined,
          dirIds: loadState.appliedFilters.dirId ? undefined : loadState.selectedDirIds,
          name: loadState.appliedFilters.name || undefined,
          format: loadState.appliedFilters.format || undefined,
          keyword: loadState.appliedFilters.global || undefined,
        }),
      ]);
      if (requestIdRef.current !== requestId) return false;

      const nextAssets = remotePage.records.map(mapAsset);
      const validIds = new Set(nextAssets.map((asset) => asset.id));

      if (dirs) setLessonMap(mapDirTree(dirs));
      setAssets(nextAssets);
      setTotalAssets(remotePage.total);
      const lastPage = Math.max(1, Math.ceil(remotePage.total / PAGE_SIZE));
      if (loadState.currentPage > lastPage) setCurrentPage(lastPage);
      setImagePreviewFailures((previous) => {
        const retained: Record<string, string> = {};
        nextAssets.forEach((asset) => {
          if (previous[asset.id] === asset.mediaUrl) retained[asset.id] = asset.mediaUrl || '';
        });
        return retained;
      });
      setPreviewAssetId((prev) => (prev && validIds.has(prev) ? prev : null));
      setDeleteAssetId((prev) => (prev && validIds.has(prev) ? prev : null));
      setReplaceDraft((prev) => (prev && validIds.has(prev.assetId) ? prev : null));
      return true;
    } catch (err) {
      if (requestIdRef.current === requestId) {
        setError(getErrorMessage(err, '资源库加载失败'));
      }
      return false;
    } finally {
      if (requestIdRef.current === requestId) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  };

  useEffect(() => {
    void loadRemote();
  }, [appliedFilters, currentPage, selectedDirIds.join(','), selectedType]);

  useEffect(() => {
    return () => {
      if (toastTimerRef.current !== null) window.clearTimeout(toastTimerRef.current);
    };
  }, []);

  const onUploadNew = async (file?: File) => {
    if (!file) return;

    try {
      await uploadMediaAsset(file, {
        dirId: selectedLesson || undefined,
        bucket: '私有桶',
        name: file.name,
      });
      await loadRemote();
      showToast('文件上传成功');
    } catch (err) {
      setError(getErrorMessage(err, '文件上传失败'));
    } finally {
      clearUploadInput();
    }
  };
  const onPickReplace = (file?: File) => {
    if (!file || !previewAssetId) return;
    setReplaceDraft({ assetId: previewAssetId, file });
  };
  const confirmReplace = async () => {
    if (!replaceDraft) return;
    const target = assets.find((asset) => asset.id === replaceDraft.assetId);
    if (!target) {
      setReplaceDraft(null);
      setError('未找到要替换的素材');
      return;
    }
    try {
      await replaceMediaAsset(target.id, replaceDraft.file);
      setReplaceDraft(null);
      setPreviewAssetId(null);
      await loadRemote();
      showToast('素材替换成功');
    } catch (err) {
      setError(getErrorMessage(err, '素材替换失败'));
    } finally {
      if (replaceInputRef.current) replaceInputRef.current.value = '';
    }
  };
  const cancelReplace = () => {
    if (replaceInputRef.current) replaceInputRef.current.value = '';
    setReplaceDraft(null);
  };
  const handleRefresh = async () => {
    if (refreshing) return;
    const ok = await loadRemote({ asRefresh: true });
    if (ok) showToast('资源库刷新完成');
  };
  const applySearchFilters = () => {
    const requestedDirId = dirKeyword.trim();
    if (requestedDirId && !/^\d+$/.test(requestedDirId)) {
      setError('目录 ID 只能输入数字');
      return;
    }
    setError('');
    setCurrentPage(1);
    if (requestedDirId) {
      setSelectedLevel('');
      setSelectedUnit('');
      setSelectedLesson('');
    }
    setAppliedFilters({
      name: fileNameKeyword.trim(),
      format: formatKeyword.trim(),
      global: globalKeyword.trim(),
      dirId: requestedDirId,
    });
  };

  return (
    <>
      <div className="page-header">
        <div>
          <div className="page-title">资源库</div>
          <div className="page-subtitle">可按条件检索并勾选资源，一键匹配到课程/学习资源/题库</div>
        </div>
        <div className="page-actions">
          <input ref={uploadInputRef} type="file" accept="audio/*,video/*,image/*" style={{ display: 'none' }} onChange={(e) => { void onUploadNew(e.target.files?.[0]); }} />
          <button type="button" className="btn btn-secondary" onClick={() => { void handleRefresh(); }} disabled={refreshing}>
            <span className={`spin-icon ${refreshing ? 'spinning' : ''}`}>↻</span>
            刷新
          </button>
          <button type="button" className="btn btn-secondary" onClick={() => uploadInputRef.current?.click()}>上传文件</button>
        </div>
      </div>

      {(loading || error) && (
        <div
          style={{
            marginBottom: 12,
            padding: '8px 12px',
            border: `1px solid ${error ? 'var(--rose)' : 'var(--stone-dark)'}`,
            borderRadius: 8,
            background: 'var(--white)',
            color: error ? 'var(--rose)' : 'var(--ink-light)',
            fontSize: 13,
          }}
        >
          {error || '正在加载资源库...'}
        </div>
      )}

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
        <button type="button" className="btn btn-primary btn-sm" onClick={applySearchFilters}>查询</button>
        <button
          type="button"
          className="btn btn-secondary btn-sm"
          onClick={() => {
            setFileNameKeyword('');
            setFormatKeyword('');
            setGlobalKeyword('');
            setDirKeyword('');
            setSelectedType('全部');
            setSelectedLevel('');
            setSelectedUnit('');
            setSelectedLesson('');
            setAppliedFilters({ name: '', format: '', global: '', dirId: '' });
            setCurrentPage(1);
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
            setDirKeyword('');
            setAppliedFilters((previous) => ({ ...previous, dirId: '' }));
            setCurrentPage(1);
          }}
        >
          <option value="">全部级别</option>
          {lessonMap.map((lv) => (
            <option key={lv.id} value={lv.id}>{lv.label}</option>
          ))}
        </select>
        <select
          className="filter-select"
          value={selectedUnit}
          onChange={(e) => {
            setSelectedUnit(e.target.value);
            setSelectedLesson('');
            setDirKeyword('');
            setAppliedFilters((previous) => ({ ...previous, dirId: '' }));
            setCurrentPage(1);
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
          onChange={(e) => {
            setSelectedLesson(e.target.value);
            setDirKeyword('');
            setAppliedFilters((previous) => ({ ...previous, dirId: '' }));
            setCurrentPage(1);
          }}
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
          placeholder="按目录 ID 搜索"
          value={dirKeyword}
          onChange={(e) => setDirKeyword(e.target.value)}
        />
        <span className={`filter-tag ${selectedType === '全部' ? 'active' : ''}`} onClick={() => { setSelectedType('全部'); setCurrentPage(1); }}>全部</span>
        <span className={`filter-tag ${selectedType === '音频' ? 'active' : ''}`} onClick={() => { setSelectedType('音频'); setCurrentPage(1); }}>音频</span>
        <span className={`filter-tag ${selectedType === '视频' ? 'active' : ''}`} onClick={() => { setSelectedType('视频'); setCurrentPage(1); }}>视频</span>
        <span className={`filter-tag ${selectedType === '图片' ? 'active' : ''}`} onClick={() => { setSelectedType('图片'); setCurrentPage(1); }}>图片</span>
        <span style={{ flex: 1 }} />
        <span className="table-count">共 {totalAssets} 个素材</span>
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
                <td>
                  <MediaThumbnail
                    asset={a}
                    imageFailed={imagePreviewFailures[a.id] === a.mediaUrl}
                    onImageError={() => setImagePreviewFailures((previous) => ({
                      ...previous,
                      [a.id]: a.mediaUrl || '',
                    }))}
                  />
                </td>
                <td>{a.bucket}</td>
                <td className="td-mono">{a.format || '--'}</td>
                <td className="td-mono">{a.size}</td>
                <td className="td-mono">{a.duration}</td>
                <td className="td-mono" style={{ fontSize: 12 }}>{a.createdAt}</td>
                <td className="td-mono" style={{ fontSize: 12 }}>{a.updatedAt}</td>
                <td>
                  <button type="button" className="btn btn-ghost btn-sm" onClick={() => setPreviewAssetId(a.id)}>详情</button>
                  <button type="button" className="btn btn-ghost btn-sm" onClick={() => setPreviewAssetId(a.id)}>编辑</button>
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    style={{ color: 'var(--rose)' }}
                    onClick={() => setDeleteAssetId(a.id)}
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

      <form
        onSubmit={(event) => {
          event.preventDefault();
          const target = Math.min(totalPages, Math.max(1, Number.parseInt(jumpPage, 10) || 1));
          setCurrentPage(target);
          setJumpPage(String(target));
        }}
        style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 8, marginTop: 12 }}
      >
        <button
          type="button"
          className="btn btn-secondary btn-sm"
          disabled={loading || currentPage <= 1}
          onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
        >
          上一页
        </button>
        <span className="table-count">第 {currentPage} / {totalPages} 页</span>
        <button
          type="button"
          className="btn btn-secondary btn-sm"
          disabled={loading || currentPage >= totalPages}
          onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
        >
          下一页
        </button>
        <span className="table-count">跳至</span>
        <input
          type="number"
          className="form-input"
          min={1}
          max={totalPages}
          value={jumpPage}
          onChange={(event) => setJumpPage(event.target.value)}
          aria-label="跳转页码"
          style={{ width: 72, height: 32, padding: '4px 8px' }}
        />
        <button type="submit" className="btn btn-secondary btn-sm" disabled={loading}>跳转</button>
      </form>

      <div className={`modal-overlay ${deleteAssetId !== null ? 'open' : ''}`} onClick={() => setDeleteAssetId(null)} role="dialog" aria-modal="true" aria-label="确认删除素材">
        <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 400 }}>
          <div className="modal-header">
            <div className="modal-title">确认删除</div>
            <button type="button" className="modal-close" onClick={() => setDeleteAssetId(null)} aria-label="关闭">✕</button>
          </div>
          <div className="modal-body">
            <p style={{ margin: 0 }}>确认删除该素材？删除后不可恢复。</p>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-ghost" onClick={() => setDeleteAssetId(null)}>取消</button>
            <button type="button" className="btn btn-primary" onClick={() => { void confirmDelete(); }}>确认删除</button>
          </div>
        </div>
      </div>

      <div className={`modal-overlay ${previewAssetId !== null ? 'open' : ''}`} onClick={() => { setPreviewAssetId(null); cancelReplace(); }} role="dialog" aria-modal="true" aria-label="预览素材">
        <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 560 }}>
          <div className="modal-header">
            <div className="modal-title">素材预览</div>
            <button type="button" className="modal-close" onClick={() => { setPreviewAssetId(null); cancelReplace(); }} aria-label="关闭">✕</button>
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
                      <button type="button" className="btn btn-primary btn-sm" onClick={() => { void confirmReplace(); }}>确认替换</button>
                      <button type="button" className="btn btn-ghost btn-sm" onClick={cancelReplace}>取消</button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-ghost" onClick={() => { setPreviewAssetId(null); cancelReplace(); }}>关闭</button>
          </div>
        </div>
      </div>
      {toastText && <div className="toast show success">{toastText}</div>}
    </>
  );
}
