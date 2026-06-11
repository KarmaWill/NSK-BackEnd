import { useEffect, useMemo, useState } from 'react';
import { PageTabPanel, PageTabs } from './PageTabs';
import type { VideoMarker, VideoRecord, VideoSubtitle } from '../data/videoRecords';
import { statusBadgeClass, statusLabel } from '../data/videoRecords';

type TabId = 'basic' | 'subtitles' | 'markers';

type Props = {
  video: VideoRecord;
  onBack: () => void;
  onSave: (video: VideoRecord) => void;
};

function formatTimestamp(value: string): string {
  const d = new Date(value.replace(' ', 'T'));
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString('zh-CN', { hour12: false });
}

function subtitleStatusMeta(status: VideoSubtitle['status']) {
  if (status === 'ready') return { label: '已就绪', className: 'badge-teal' };
  if (status === 'processing') return { label: '处理中', className: 'badge-amber' };
  return { label: '未上传', className: 'badge-muted' };
}

function parseTimeToSeconds(time: string): number {
  const parts = time.split(':').map(Number);
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  return 0;
}

function MarkerTimeline({ markers, duration }: { markers: VideoMarker[]; duration: string }) {
  const totalSec = Math.max(parseTimeToSeconds(duration), 1);
  return (
    <div className="video-detail-timeline" aria-hidden>
      <div className="video-detail-timeline-track">
        {markers.map((marker) => {
          const pct = Math.min(100, (parseTimeToSeconds(marker.time) / totalSec) * 100);
          return (
            <span
              key={marker.id}
              className="video-detail-timeline-dot"
              style={{ left: `${pct}%` }}
              title={`${marker.time} ${marker.label}`}
            />
          );
        })}
      </div>
      <div className="video-detail-timeline-labels">
        <span>0:00</span>
        <span>{duration}</span>
      </div>
    </div>
  );
}

export function VideoDetailPage({ video, onBack, onSave }: Props) {
  const [draft, setDraft] = useState<VideoRecord>(() => structuredClone(video));
  const [activeTab, setActiveTab] = useState<TabId>('basic');
  const [editingBasic, setEditingBasic] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    setDraft(structuredClone(video));
    setEditingBasic(false);
    setActiveTab('basic');
  }, [video]);

  const tabs = useMemo(
    () => [
      { id: 'basic', label: '基本信息' },
      { id: 'subtitles', label: '字幕管理', badge: draft.subtitles.length },
      { id: 'markers', label: '视频打点 V2', badge: draft.markers.length },
    ],
    [draft.subtitles.length, draft.markers.length],
  );

  const subtitleStats = useMemo(() => {
    const ready = draft.subtitles.filter((s) => s.status === 'ready').length;
    const processing = draft.subtitles.filter((s) => s.status === 'processing').length;
    const missing = draft.subtitles.filter((s) => s.status === 'missing').length;
    return { ready, processing, missing };
  }, [draft.subtitles]);

  const showToast = (msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(null), 2200);
  };

  const update = <K extends keyof VideoRecord>(key: K, value: VideoRecord[K]) => {
    setDraft((prev) => ({
      ...prev,
      [key]: value,
      updatedAt: new Date().toISOString().replace('T', ' ').slice(0, 19),
    }));
  };

  const handlePublish = () => {
    const next: VideoRecord = {
      ...draft,
      status: 'published',
      publishAt: new Date().toISOString().slice(0, 10),
      updatedAt: new Date().toISOString().replace('T', ' ').slice(0, 19),
    };
    setDraft(next);
    onSave(next);
    showToast('视频已发布');
  };

  const handleSaveBasic = () => {
    onSave(draft);
    setEditingBasic(false);
    showToast('基本信息已保存');
  };

  const isPublished = draft.status === 'published';
  const isUnpublished = draft.status === 'unpublished';

  return (
    <div className="video-detail-page">
      <header className="video-detail-toolbar">
        <div className="video-detail-toolbar-main">
          <nav className="video-detail-breadcrumb" aria-label="面包屑">
            <button type="button" className="video-detail-back" onClick={onBack}>
              ← 返回列表
            </button>
            <span className="video-detail-breadcrumb-sep">/</span>
            <span className="video-detail-breadcrumb-current">{draft.titleZh}</span>
          </nav>

          <div className="video-detail-headline">
            <div className="video-detail-headline-text">
              <span className="video-detail-id">{draft.id}</span>
              <h1 className="video-detail-title">{draft.titleZh}</h1>
            </div>
            <div className="video-detail-toolbar-actions">
              <span className={`badge ${statusBadgeClass(draft.status)}`}>{statusLabel(draft.status)}</span>
              {!isPublished && (
                <button type="button" className="btn btn-primary" onClick={handlePublish}>
                  {isUnpublished ? '重新发布' : '发布视频'}
                </button>
              )}
            </div>
          </div>

          <div className="video-detail-meta-row">
            <span className="video-detail-chip">{draft.videoType}</span>
            <span className="video-detail-chip">{draft.category}</span>
            <span className="video-detail-chip video-detail-chip-mono">{draft.duration}</span>
            <span className="video-detail-chip">{draft.position}</span>
          </div>

          <p className="video-detail-timestamps">
            创建于 {formatTimestamp(draft.createdAt)} · 最后修改 {formatTimestamp(draft.updatedAt)}
            {isPublished && <> · 发布于 {draft.publishAt}</>}
          </p>
        </div>
      </header>

      <PageTabs tabs={tabs} activeTab={activeTab} onTabChange={(id) => setActiveTab(id as TabId)}>
        <PageTabPanel id="basic" activeTab={activeTab}>
          <div className="video-detail-basic-layout">
            <div className="video-detail-main">
              <div className="card video-detail-preview-card">
                <div className="card-body">
                  <div className="video-detail-preview">
                    <div className="video-detail-preview-inner">
                      <span className="video-detail-preview-play" aria-hidden>
                        ▶
                      </span>
                      <span className="video-detail-preview-duration">{draft.duration}</span>
                    </div>
                    <p className="video-detail-preview-hint">视频预览 · {draft.titleEn || draft.titleZh}</p>
                  </div>
                </div>
              </div>

              <div className="card">
                <div className="card-header video-detail-card-header">
                  <div>
                    <div className="card-title">基本信息</div>
                    <div className="video-detail-card-desc">视频元数据与展示配置</div>
                  </div>
                  {!editingBasic ? (
                    <button type="button" className="btn btn-secondary btn-sm" onClick={() => setEditingBasic(true)}>
                      编辑
                    </button>
                  ) : (
                    <div className="video-detail-card-actions">
                      <button type="button" className="btn btn-secondary btn-sm" onClick={() => setEditingBasic(false)}>
                        取消
                      </button>
                      <button type="button" className="btn btn-primary btn-sm" onClick={handleSaveBasic}>
                        保存
                      </button>
                    </div>
                  )}
                </div>
                <div className="card-body">
                  {editingBasic ? (
                    <div className="video-detail-form">
                      <div className="form-row">
                        <div className="form-group">
                          <label>视频 ID</label>
                          <input className="form-input" value={draft.id} readOnly />
                        </div>
                        <div className="form-group">
                          <label>中文名称</label>
                          <input
                            className="form-input"
                            value={draft.titleZh}
                            onChange={(e) => update('titleZh', e.target.value)}
                          />
                        </div>
                      </div>
                      <div className="form-row">
                        <div className="form-group">
                          <label>视频类型</label>
                          <select
                            className="form-input form-select"
                            value={draft.videoType}
                            onChange={(e) => update('videoType', e.target.value)}
                          >
                            <option value="教学视频">教学视频</option>
                            <option value="宣传视频">宣传视频</option>
                            <option value="文化视频">文化视频</option>
                          </select>
                        </div>
                        <div className="form-group">
                          <label>分类</label>
                          <input
                            className="form-input"
                            value={draft.category}
                            onChange={(e) => update('category', e.target.value)}
                          />
                        </div>
                      </div>
                      <div className="form-row">
                        <div className="form-group">
                          <label>时长</label>
                          <input
                            className="form-input"
                            value={draft.duration}
                            onChange={(e) => update('duration', e.target.value)}
                          />
                        </div>
                        <div className="form-group">
                          <label>展示位置</label>
                          <input
                            className="form-input"
                            value={draft.position}
                            onChange={(e) => update('position', e.target.value)}
                          />
                        </div>
                      </div>
                      <div className="form-group">
                        <label>简介</label>
                        <textarea
                          className="form-input"
                          rows={3}
                          value={draft.description}
                          onChange={(e) => update('description', e.target.value)}
                        />
                      </div>
                    </div>
                  ) : (
                    <dl className="video-detail-dl">
                      <div className="video-detail-dl-row">
                        <dt>视频 ID</dt>
                        <dd>
                          <code>{draft.id}</code>
                        </dd>
                      </div>
                      <div className="video-detail-dl-row">
                        <dt>中文名称</dt>
                        <dd>{draft.titleZh}</dd>
                      </div>
                      <div className="video-detail-dl-row">
                        <dt>视频类型</dt>
                        <dd>{draft.videoType}</dd>
                      </div>
                      <div className="video-detail-dl-row">
                        <dt>分类</dt>
                        <dd>{draft.category}</dd>
                      </div>
                      <div className="video-detail-dl-row">
                        <dt>时长</dt>
                        <dd>
                          <span className="td-mono">{draft.duration}</span>
                        </dd>
                      </div>
                      <div className="video-detail-dl-row">
                        <dt>展示位置</dt>
                        <dd>{draft.position}</dd>
                      </div>
                      <div className="video-detail-dl-row video-detail-dl-row-full">
                        <dt>简介</dt>
                        <dd>{draft.description || '—'}</dd>
                      </div>
                    </dl>
                  )}
                </div>
              </div>
            </div>

            <aside className="video-detail-aside">
              <div className="card">
                <div className="card-header">
                  <div className="card-title">发布状态</div>
                </div>
                <div className="card-body video-detail-aside-status">
                  <span className={`badge ${statusBadgeClass(draft.status)}`}>{statusLabel(draft.status)}</span>
                  <p className="video-detail-aside-hint">
                    {isPublished
                      ? `已于 ${draft.publishAt} 对外发布`
                      : isUnpublished
                        ? '已下架，学员端不可见'
                        : '当前为草稿，学员端不可见'}
                  </p>
                  {!isPublished && (
                    <button type="button" className="btn btn-primary btn-sm video-detail-aside-btn" onClick={handlePublish}>
                      {isUnpublished ? '重新发布' : '发布视频'}
                    </button>
                  )}
                </div>
              </div>

              <div className="card">
                <div className="card-header">
                  <div className="card-title">视频封面</div>
                </div>
                <div className="card-body">
                  {draft.coverUrl ? (
                    <img src={draft.coverUrl} alt="" className="video-detail-cover-img" />
                  ) : (
                    <div className="video-detail-cover-empty">
                      <span className="video-detail-cover-icon" aria-hidden>
                        🖼
                      </span>
                      <span>未上传封面</span>
                      <button type="button" className="btn btn-secondary btn-sm">
                        上传封面
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </aside>
          </div>
        </PageTabPanel>

        <PageTabPanel id="subtitles" activeTab={activeTab}>
          <div className="video-detail-tab-panel">
            <div className="video-detail-tab-intro">
              <h2 className="video-detail-tab-title">字幕轨道</h2>
              <p className="video-detail-tab-desc">为视频配置多语言字幕，支持 VTT / SRT 格式上传与替换。</p>
            </div>

            <div className="video-detail-stats-row">
              <div className="video-detail-stat">
                <span className="video-detail-stat-val">{subtitleStats.ready}</span>
                <span className="video-detail-stat-label">已就绪</span>
              </div>
              <div className="video-detail-stat">
                <span className="video-detail-stat-val">{subtitleStats.processing}</span>
                <span className="video-detail-stat-label">处理中</span>
              </div>
              <div className="video-detail-stat">
                <span className="video-detail-stat-val">{subtitleStats.missing}</span>
                <span className="video-detail-stat-label">未上传</span>
              </div>
            </div>

            <div className="card">
              <div className="card-header video-detail-card-header">
                <div className="card-title">字幕列表</div>
                <button type="button" className="btn btn-primary btn-sm">
                  + 上传字幕
                </button>
              </div>
              <div className="card-body video-detail-table-wrap">
                {draft.subtitles.length === 0 ? (
                  <div className="video-detail-empty">暂无字幕轨道，点击右上角上传字幕文件。</div>
                ) : (
                  <table className="video-detail-table">
                    <thead>
                      <tr>
                        <th>语言</th>
                        <th>文件</th>
                        <th>状态</th>
                        <th className="video-detail-th-actions">操作</th>
                      </tr>
                    </thead>
                    <tbody>
                      {draft.subtitles.map((sub: VideoSubtitle) => {
                        const meta = subtitleStatusMeta(sub.status);
                        return (
                          <tr key={sub.id}>
                            <td>
                              <span className="video-detail-lang">{sub.lang}</span>
                            </td>
                            <td>
                              {sub.fileName ? (
                                <code className="video-detail-file">{sub.fileName}</code>
                              ) : (
                                <span className="video-detail-muted">—</span>
                              )}
                            </td>
                            <td>
                              <span className={`badge ${meta.className}`}>{meta.label}</span>
                            </td>
                            <td>
                              <button type="button" className="btn btn-secondary btn-sm">
                                管理
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>
        </PageTabPanel>

        <PageTabPanel id="markers" activeTab={activeTab}>
          <div className="video-detail-tab-panel">
            <div className="video-detail-tab-intro">
              <h2 className="video-detail-tab-title">视频打点</h2>
              <p className="video-detail-tab-desc">
                在时间轴上标记关键节点，用于章节跳转、互动触发与课程关联。
              </p>
            </div>

            {draft.markers.length > 0 && (
              <div className="card video-detail-timeline-card">
                <div className="card-body">
                  <div className="video-detail-card-label">时间轴预览</div>
                  <MarkerTimeline markers={draft.markers} duration={draft.duration} />
                </div>
              </div>
            )}

            <div className="card">
              <div className="card-header video-detail-card-header">
                <div className="card-title">打点列表</div>
                <button type="button" className="btn btn-primary btn-sm">
                  + 新增打点
                </button>
              </div>
              <div className="card-body video-detail-table-wrap">
                {draft.markers.length === 0 ? (
                  <div className="video-detail-empty">暂无打点，可新增第一个时间节点。</div>
                ) : (
                  <table className="video-detail-table">
                    <thead>
                      <tr>
                        <th>时间点</th>
                        <th>标签</th>
                        <th>说明</th>
                        <th className="video-detail-th-actions">操作</th>
                      </tr>
                    </thead>
                    <tbody>
                      {draft.markers.map((marker: VideoMarker) => (
                        <tr key={marker.id}>
                          <td>
                            <span className="video-detail-time">{marker.time}</span>
                          </td>
                          <td>
                            <b>{marker.label}</b>
                          </td>
                          <td className="video-detail-note">{marker.note}</td>
                          <td>
                            <button type="button" className="btn btn-secondary btn-sm">
                              编辑
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>
        </PageTabPanel>
      </PageTabs>

      {toast && <div className="hsk-toast show">{toast}</div>}
    </div>
  );
}
