import { useState } from 'react';

/** Android 客户端书籍封面尺寸（px） */
export const BOOK_COVER_SIZE = {
  large: { width: 450, height: 626 },
  small: { width: 314, height: 439.6 },
  dictionaryPen: { width: 420, height: 600 },
} as const;

export const BOOK_COVER_ASPECT = BOOK_COVER_SIZE.large.width / BOOK_COVER_SIZE.large.height;

export type BookCoverImage = {
  id: string;
  name: string;
  url: string;
};

/** 资源库封面图片（快乐中文官方封面，后续可对接资源管理 API） */
export const BOOK_COVER_IMAGE_LIBRARY: BookCoverImage[] = [
  { id: 'cover-hc-1', name: '快乐中文 · 第一册', url: '/book-covers/happy-chinese-vol1.png' },
  { id: 'cover-hc-2', name: '快乐中文 · 第二册', url: '/book-covers/happy-chinese-vol2.png' },
  { id: 'cover-hc-3', name: '快乐中文 · 第三册', url: '/book-covers/happy-chinese-vol3.png' },
];

type BookCoverConfigProps = {
  coverUrl?: string;
  coverImageId?: string;
  onChange: (next: { coverUrl?: string; coverImageId?: string }) => void;
};

function CoverPreviewFrame({
  label,
  width,
  height,
  url,
}: {
  label: string;
  width: number;
  height: number;
  url?: string;
}) {
  const scale = Math.min(1, 180 / width);
  const displayW = Math.round(width * scale);
  const displayH = Math.round(height * scale);

  return (
    <div className="book-cover-preview-block">
      <div className="book-cover-preview-label">{label}</div>
      <div
        className="book-cover-preview-frame"
        style={{ width: displayW, height: displayH }}
      >
        {url ? (
          <img src={url} alt="" className="book-cover-preview-img" />
        ) : (
          <div className="book-cover-preview-placeholder">
            <span>暂无封面</span>
            <span className="book-cover-preview-dim">{width}×{height}</span>
          </div>
        )}
      </div>
      <div className="form-hint">{width} × {height} px</div>
    </div>
  );
}

export function BookCoverConfig({ coverUrl, coverImageId, onChange }: BookCoverConfigProps) {
  const [pickerOpen, setPickerOpen] = useState(false);

  const clearCover = () => onChange({ coverUrl: undefined, coverImageId: undefined });

  return (
    <>
      <div className="book-cover-config">
        <div className="book-cover-preview-row">
          <CoverPreviewFrame
            label="主界面展示"
            width={BOOK_COVER_SIZE.large.width}
            height={BOOK_COVER_SIZE.large.height}
            url={coverUrl}
          />
          <CoverPreviewFrame
            label="其他页展示"
            width={BOOK_COVER_SIZE.small.width}
            height={BOOK_COVER_SIZE.small.height}
            url={coverUrl}
          />
          <CoverPreviewFrame
            label="词典笔展示"
            width={BOOK_COVER_SIZE.dictionaryPen.width}
            height={BOOK_COVER_SIZE.dictionaryPen.height}
            url={coverUrl}
          />
        </div>
        <div className="book-cover-actions">
          <button type="button" className="btn btn-primary btn-sm" onClick={() => setPickerOpen(true)}>
            从资源库选择
          </button>
          {coverUrl && (
            <button type="button" className="btn btn-ghost btn-sm" onClick={clearCover}>
              清除封面
            </button>
          )}
        </div>
        <div className="form-hint">
          封面源图按 {BOOK_COVER_SIZE.large.width}:{BOOK_COVER_SIZE.large.height} 比例配置；客户端在平板主界面（
          {BOOK_COVER_SIZE.large.width}×{BOOK_COVER_SIZE.large.height}）、其他页（
          {BOOK_COVER_SIZE.small.width}×{BOOK_COVER_SIZE.small.height}）与词典笔（
          {BOOK_COVER_SIZE.dictionaryPen.width}×{BOOK_COVER_SIZE.dictionaryPen.height}）等比缩放展示。
          {coverImageId ? ` · 资源 ID：${coverImageId}` : ''}
        </div>
      </div>

      {pickerOpen && (
        <div
          className="modal-overlay open"
          onClick={() => setPickerOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-label="选择书籍封面"
        >
          <div className="modal" style={{ maxWidth: 560 }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">资源库 · 封面图片</div>
              <button type="button" className="modal-close" onClick={() => setPickerOpen(false)} aria-label="关闭">
                ✕
              </button>
            </div>
            <div className="modal-body">
              <p className="form-hint" style={{ marginBottom: 12 }}>
                选择竖版封面图，预览按 {BOOK_COVER_SIZE.large.width}×{BOOK_COVER_SIZE.large.height} 比例裁切展示。
              </p>
              <div className="book-cover-picker-list">
                {BOOK_COVER_IMAGE_LIBRARY.map((img) => (
                  <div key={img.id} className="book-cover-picker-item">
                    <div
                      className="book-cover-picker-thumb"
                      style={{ aspectRatio: `${BOOK_COVER_SIZE.large.width} / ${BOOK_COVER_SIZE.large.height}` }}
                    >
                      <img src={img.url} alt="" />
                    </div>
                    <div className="book-cover-picker-info">
                      <div className="book-cover-picker-name">{img.name}</div>
                      <div className="font-mono form-hint">{img.id}</div>
                    </div>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={() => {
                        onChange({ coverUrl: img.url, coverImageId: img.id });
                        setPickerOpen(false);
                      }}
                    >
                      使用
                    </button>
                  </div>
                ))}
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-ghost" onClick={() => setPickerOpen(false)}>
                取消
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
