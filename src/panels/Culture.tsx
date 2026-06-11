import { useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { VideoAddForm } from '../components/VideoAddForm';
import { VideoDetailPage } from '../components/VideoDetailPage';
import {
  VIDEO_RECORDS,
  formatRelativeUpdatedAt,
  statusBadgeClass,
  statusLabel,
  subtitleLangSummary,
  type VideoRecord,
  type VideoStatus,
} from '../data/videoRecords';

export function Culture() {
  const [records, setRecords] = useState<VideoRecord[]>(() => VIDEO_RECORDS);
  const [editingVideo, setEditingVideo] = useState<VideoRecord | null>(null);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<VideoRecord | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const sortedRecords = useMemo(
    () => [...records].sort((a, b) => b.id.localeCompare(a.id)),
    [records],
  );

  const showToast = (msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(null), 2200);
  };

  const touchRecord = (id: string, patch: Partial<VideoRecord>) => {
    const now = new Date('2026-06-05T12:00:00').toISOString().replace('T', ' ').slice(0, 19);
    setRecords((prev) =>
      prev.map((r) => (r.id === id ? { ...r, ...patch, updatedAt: patch.updatedAt ?? now } : r)),
    );
  };

  const closeModal = () => setAddModalOpen(false);

  const handleSaveNew = (_mode: 'publish' | 'draft') => {
    closeModal();
    showToast('视频已创建');
  };

  const handleSaveVideo = (updated: VideoRecord) => {
    setRecords((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
    setEditingVideo(updated);
  };

  const handleStatusChange = (id: string, status: VideoStatus) => {
    const publishAt =
      status === 'published' ? new Date('2026-06-05').toISOString().slice(0, 10) : undefined;
    touchRecord(id, {
      status,
      ...(publishAt ? { publishAt } : {}),
    });
    const labels: Record<VideoStatus, string> = {
      published: '已发布',
      draft: '已存为草稿',
      unpublished: '已下架',
    };
    showToast(labels[status]);
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    const title = deleteTarget.titleZh;
    setRecords((prev) => prev.filter((r) => r.id !== deleteTarget.id));
    setDeleteTarget(null);
    showToast(`已删除 ${title}`);
  };

  if (editingVideo) {
    const current = records.find((r) => r.id === editingVideo.id) ?? editingVideo;
    return (
      <VideoDetailPage
        video={current}
        onBack={() => setEditingVideo(null)}
        onSave={handleSaveVideo}
      />
    );
  }

  return (
    <>
      <div className="page-header">
        <div>
          <div className="page-title">视频列表</div>
          <div className="page-subtitle">管理课程视频、字幕与发布状态</div>
        </div>
        <div className="page-actions">
          <button type="button" className="btn btn-primary btn-sm" onClick={() => setAddModalOpen(true)}>
            + 新建内容
          </button>
        </div>
      </div>

      <div className="card video-list-card">
        <div className="video-list-table-wrap">
          <table className="video-list-table">
            <thead>
              <tr>
                <th>视频</th>
                <th>时长</th>
                <th>类型</th>
                <th>字幕</th>
                <th>状态</th>
                <th>更新时间</th>
                <th className="video-list-th-actions">操作</th>
              </tr>
            </thead>
            <tbody>
              {sortedRecords.map((row) => (
                <tr key={row.id}>
                  <td>
                    <div className="video-list-video-cell">
                      <span className="video-list-thumb" aria-hidden>
                        🎬
                      </span>
                      <div className="video-list-video-text">
                        <button
                          type="button"
                          className="video-list-title-btn"
                          onClick={() => setEditingVideo(row)}
                        >
                          {row.titleZh}
                        </button>
                        <span className="video-list-id">{row.id}</span>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className="td-mono video-list-duration">{row.duration}</span>
                  </td>
                  <td>{row.videoType}</td>
                  <td>
                    <span className="video-list-subtitle">{subtitleLangSummary(row)}</span>
                  </td>
                  <td>
                    <span className={`badge ${statusBadgeClass(row.status)}`}>{statusLabel(row.status)}</span>
                  </td>
                  <td>
                    <span className="video-list-updated">{formatRelativeUpdatedAt(row.updatedAt)}</span>
                  </td>
                  <td>
                    <div className="video-list-actions">
                      <button
                        type="button"
                        className="video-list-action-btn"
                        onClick={() => setEditingVideo(row)}
                      >
                        编辑
                      </button>
                      {row.status === 'draft' && (
                        <button
                          type="button"
                          className="video-list-action-btn video-list-action-primary"
                          onClick={() => handleStatusChange(row.id, 'published')}
                        >
                          发布
                        </button>
                      )}
                      {row.status === 'unpublished' && (
                        <button
                          type="button"
                          className="video-list-action-btn video-list-action-primary"
                          onClick={() => handleStatusChange(row.id, 'published')}
                        >
                          重新发布
                        </button>
                      )}
                      {row.status === 'published' && (
                        <button
                          type="button"
                          className="video-list-action-btn"
                          onClick={() => handleStatusChange(row.id, 'unpublished')}
                        >
                          下架
                        </button>
                      )}
                      <button
                        type="button"
                        className="video-list-action-btn video-list-action-danger"
                        onClick={() => setDeleteTarget(row)}
                      >
                        删除
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {addModalOpen &&
        createPortal(
          <div
            className="modal-overlay open"
            onClick={closeModal}
            role="dialog"
            aria-modal="true"
            aria-label="新增视频"
          >
            <div className="modal modal-wide" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 720 }}>
              <div className="modal-header">
                <div>
                  <div className="modal-title">新增视频</div>
                  <div className="form-hint" style={{ marginTop: 4 }}>
                    上传或录入视频元数据，配置类型、标签与发布状态
                  </div>
                </div>
                <button type="button" className="modal-close" onClick={closeModal} aria-label="关闭">
                  ✕
                </button>
              </div>
              <div className="modal-body">
                <VideoAddForm onCancel={closeModal} onSave={handleSaveNew} />
              </div>
            </div>
          </div>,
          document.body,
        )}

      {deleteTarget &&
        createPortal(
          <div
            className="modal-overlay open"
            onClick={() => setDeleteTarget(null)}
            role="dialog"
            aria-modal="true"
            aria-label="删除视频"
          >
            <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 420 }}>
              <div className="modal-header">
                <div className="modal-title">删除视频</div>
                <button
                  type="button"
                  className="modal-close"
                  onClick={() => setDeleteTarget(null)}
                  aria-label="关闭"
                >
                  ✕
                </button>
              </div>
              <div className="modal-body">
                <p>
                  确定删除 <b>{deleteTarget.titleZh}</b>（{deleteTarget.id}）？此操作不可撤销。
                </p>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => setDeleteTarget(null)}>
                  取消
                </button>
                <button type="button" className="btn btn-danger btn-sm" onClick={handleDelete}>
                  删除
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}

      {toast && <div className="hsk-toast show">{toast}</div>}
    </>
  );
}
