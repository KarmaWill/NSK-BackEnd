import { FormEvent, useEffect, useMemo, useState } from 'react';
import { pageMediaAssets, type MediaAsset } from '../services/mediaApi';
import { formatMediaDuration } from '../utils/mediaPresentation';

const PAGE_SIZE = 20;

type Props = {
  open: boolean;
  kind: 'audio' | 'image';
  title?: string;
  selectedUrl?: string;
  onClose: () => void;
  onConfirm: (resource: MediaAsset) => void;
};

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function resourceMeta(resource: MediaAsset): string {
  const parts = [resource.format.toUpperCase(), formatSize(resource.sizeBytes)];
  if (resource.type === 'audio') parts.push(formatMediaDuration(resource.durationSeconds));
  return parts.join(' · ');
}

function selectedResourcePlaceholder(url: string, kind: 'audio' | 'image'): MediaAsset {
  const cleanUrl = url.split(/[?#]/, 1)[0];
  const encodedName = cleanUrl.split('/').pop() || '当前已选资源';
  let name = encodedName;
  try {
    name = decodeURIComponent(encodedName);
  } catch {
    // Keep the encoded filename when the URL contains malformed escape sequences.
  }
  const extension = name.includes('.') ? name.split('.').pop() || kind : kind;
  return {
    id: `selected-url:${url}`,
    dirId: null,
    bucket: '',
    name,
    type: kind,
    format: extension,
    sizeBytes: 0,
    durationSeconds: null,
    url,
    enabled: true,
    usageCount: 0,
    usedBy: [],
    createdAt: '',
    updatedAt: '',
  };
}

export function HskResourceModal({
  open,
  kind,
  title,
  selectedUrl,
  onClose,
  onConfirm,
}: Props) {
  const [resources, setResources] = useState<MediaAsset[]>([]);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [keyword, setKeyword] = useState('');
  const [appliedKeyword, setAppliedKeyword] = useState('');
  const [pickedResource, setPickedResource] = useState<MediaAsset | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);
  const totalPages = useMemo(() => Math.max(1, Math.ceil(total / PAGE_SIZE)), [total]);

  useEffect(() => {
    if (open) {
      setPickedResource(selectedUrl ? selectedResourcePlaceholder(selectedUrl, kind) : null);
      return;
    }
    setResources([]);
    setTotal(0);
    setCurrentPage(1);
    setKeyword('');
    setAppliedKeyword('');
    setPickedResource(null);
  }, [kind, open, selectedUrl]);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setLoading(true);
    setError('');

    void pageMediaAssets({
      current: currentPage,
      size: PAGE_SIZE,
      type: kind,
      enabled: true,
      keyword: appliedKeyword || undefined,
    })
      .then((page) => {
        if (cancelled) return;
        setResources(page.records);
        setTotal(page.total);
        const lastPage = Math.max(1, Math.ceil(page.total / PAGE_SIZE));
        if (currentPage > lastPage) setCurrentPage(lastPage);
        if (selectedUrl) {
          setPickedResource((previous) => {
            if (previous && previous.url !== selectedUrl) return previous;
            return page.records.find((asset) => asset.url === selectedUrl)
              ?? previous
              ?? selectedResourcePlaceholder(selectedUrl, kind);
          });
        }
      })
      .catch((cause) => {
        if (cancelled) return;
        setResources([]);
        setError(cause instanceof Error ? cause.message : '资源加载失败');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [appliedKeyword, currentPage, kind, open, reloadKey, selectedUrl]);

  if (!open) return null;

  const modalTitle = title ?? (kind === 'audio' ? '选择音频资源' : '选择图片资源');
  const icon = kind === 'audio' ? '♪' : '图';
  const pickedResourceOutsidePage = pickedResource
    && !resources.some((resource) => resource.url === pickedResource.url);

  const handleConfirm = () => {
    if (!pickedResource) return;
    onConfirm(pickedResource);
    onClose();
  };

  const handleSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setCurrentPage(1);
    setAppliedKeyword(keyword.trim());
  };

  return (
    <div
      className="modal-overlay open hsk-resource-modal-overlay"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={modalTitle}
    >
      <div className="modal hsk-resource-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">{modalTitle}</div>
          <button type="button" className="modal-close" onClick={onClose} aria-label="关闭">
            ×
          </button>
        </div>

        <div className="modal-body hsk-resource-modal-body">
          <form className="hsk-resource-modal-toolbar" onSubmit={handleSearch}>
            <input
              className="form-input"
              value={keyword}
              onChange={(event) => setKeyword(event.target.value)}
              placeholder="搜索资源名称或文件名"
              aria-label="搜索资源"
            />
            <button type="submit" className="btn btn-secondary btn-sm" disabled={loading}>查询</button>
          </form>
          {loading ? (
            <div className="hsk-resource-modal-state">正在加载资源...</div>
          ) : error ? (
            <div className="hsk-resource-modal-state is-error">
              <span>{error}</span>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => setReloadKey((key) => key + 1)}
              >
                重新加载
              </button>
            </div>
          ) : resources.length === 0 && !pickedResourceOutsidePage ? (
            <div className="hsk-resource-modal-state">
              资源库中暂无可用{kind === 'audio' ? '音频' : '图片'}
            </div>
          ) : (
            <div className="hsk-resource-modal-list">
              {pickedResourceOutsidePage && (
                <button
                  type="button"
                  className="hsk-resource-modal-item is-selected"
                  onClick={() => setPickedResource(pickedResource)}
                >
                  <span className="hsk-resource-modal-item-icon" aria-hidden>{icon}</span>
                  <span className="hsk-resource-modal-item-main">
                    <span className="hsk-resource-modal-item-name">{pickedResource.name}</span>
                    <span className="hsk-resource-modal-item-meta">当前已选资源 · 不在本页</span>
                  </span>
                  <span className="hsk-resource-modal-item-check" aria-hidden>✓</span>
                </button>
              )}
              {resources.map((resource) => {
                const selected = pickedResource?.id === resource.id;
                return (
                  <button
                    key={resource.id}
                    type="button"
                    className={`hsk-resource-modal-item${selected ? ' is-selected' : ''}`}
                    onClick={() => setPickedResource(resource)}
                  >
                    <span className="hsk-resource-modal-item-icon" aria-hidden>
                      {kind === 'image' && resource.url ? (
                        <img src={resource.url} alt="" loading="lazy" decoding="async" />
                      ) : icon}
                    </span>
                    <span className="hsk-resource-modal-item-main">
                      <span className="hsk-resource-modal-item-name">{resource.name}</span>
                      <span className="hsk-resource-modal-item-meta">{resourceMeta(resource)}</span>
                    </span>
                    {selected && <span className="hsk-resource-modal-item-check" aria-hidden>✓</span>}
                  </button>
                );
              })}
            </div>
          )}
          {!loading && !error && total > 0 && (
            <div className="hsk-resource-modal-pagination">
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
              >
                上一页
              </button>
              <span>第 {currentPage} / {totalPages} 页，共 {total} 条</span>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
              >
                下一页
              </button>
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button type="button" className="btn btn-ghost" onClick={onClose}>
            取消
          </button>
          <button
            type="button"
            className="btn btn-primary"
            disabled={!pickedResource || loading}
            onClick={handleConfirm}
          >
            确认选择
          </button>
        </div>
      </div>
    </div>
  );
}
