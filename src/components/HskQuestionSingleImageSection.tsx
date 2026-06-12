import { useMemo, useRef, useState, type ChangeEvent } from 'react';
import { HskResourceModal } from './HskResourceModal';

type Props = {
  imageUrl: string;
  required?: boolean;
  onChange: (url: string) => void;
};

export function HskQuestionSingleImageSection({ imageUrl, required = false, onChange }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [resourceModalOpen, setResourceModalOpen] = useState(false);

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    onChange(URL.createObjectURL(file));
    event.target.value = '';
  };

  const fileName = useMemo(() => {
    if (!imageUrl) return '';
    try {
      if (imageUrl.startsWith('blob:')) return '本地图片文件';
      const parts = imageUrl.split('/');
      return decodeURIComponent(parts[parts.length - 1] || imageUrl);
    } catch {
      return imageUrl;
    }
  }, [imageUrl]);

  return (
    <div className="hsk-question-single-image-section">
      <div className="hsk-question-edit-section-head">
        <div className="hsk-question-edit-section-head-main">
          <span aria-hidden>🖼</span>
          <h3>图片</h3>
        </div>
      </div>

      <div className="hsk-question-single-image-body">
        <div className="hsk-question-media-pick-row">
          <button
            type="button"
            className={`hsk-question-media-pick-box hsk-question-image-pick-box${imageUrl ? ' has-value' : ''}`}
            onClick={() => setResourceModalOpen(true)}
          >
            <span className="hsk-question-media-pick-icon" aria-hidden>🖼</span>
            <span className="hsk-question-media-pick-text">
              {imageUrl ? fileName : '点击选择图片资源'}
            </span>
          </button>
          <button type="button" className="btn btn-secondary btn-sm" onClick={() => setResourceModalOpen(true)}>
            选择
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hsk-question-media-file-input"
            onChange={handleFileChange}
          />
        </div>

        <div className="hsk-question-image-option-preview-wrap">
          <div className="hsk-question-image-option-preview">
            {imageUrl ? (
              <img src={imageUrl} alt="题目图片" />
            ) : (
              <>
                <span className="hsk-question-single-image-placeholder-icon" aria-hidden>
                  图
                </span>
                <span className="hsk-question-single-image-placeholder-label">图片预览区</span>
              </>
            )}
          </div>
          {imageUrl && (
            <button type="button" className="hsk-question-media-remove" onClick={() => onChange('')}>
              ×
            </button>
          )}
        </div>

        {required && !imageUrl && (
          <div className="form-hint">
            <span className="required">*</span> 请上传题目图片
          </div>
        )}
      </div>

      <HskResourceModal
        open={resourceModalOpen}
        kind="image"
        selectedUrl={imageUrl}
        onClose={() => setResourceModalOpen(false)}
        onConfirm={(resource) => onChange(resource.url)}
      />
    </div>
  );
}
