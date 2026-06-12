import { useEffect, useMemo, useState } from 'react';
import { getHskMediaResources, type HskMediaResource } from '../config/hskMediaResources';

type Props = {
  open: boolean;
  kind: 'audio' | 'image';
  title?: string;
  selectedUrl?: string;
  onClose: () => void;
  onConfirm: (resource: HskMediaResource) => void;
};

export function HskResourceModal({
  open,
  kind,
  title,
  selectedUrl,
  onClose,
  onConfirm,
}: Props) {
  const resources = useMemo(() => getHskMediaResources(kind), [kind]);
  const [pickedId, setPickedId] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    const matched = resources.find((r) => r.url === selectedUrl);
    setPickedId(matched?.id ?? null);
  }, [open, resources, selectedUrl]);

  if (!open) return null;

  const modalTitle = title ?? (kind === 'audio' ? '选择音频资源' : '选择图片资源');
  const icon = kind === 'audio' ? '♪' : '🖼';

  const handleConfirm = () => {
    const picked = resources.find((r) => r.id === pickedId);
    if (!picked) return;
    onConfirm(picked);
    onClose();
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
          <div className="hsk-resource-modal-list">
            {resources.map((resource) => {
              const selected = pickedId === resource.id;
              return (
                <button
                  key={resource.id}
                  type="button"
                  className={`hsk-resource-modal-item${selected ? ' is-selected' : ''}`}
                  onClick={() => setPickedId(resource.id)}
                >
                  <span className="hsk-resource-modal-item-icon" aria-hidden>
                    {icon}
                  </span>
                  <span className="hsk-resource-modal-item-main">
                    <span className="hsk-resource-modal-item-name">{resource.name}</span>
                    <span className="hsk-resource-modal-item-meta">
                      {resource.duration ? `${resource.duration} · ${resource.size}` : resource.size}
                    </span>
                  </span>
                  {selected && <span className="hsk-resource-modal-item-check" aria-hidden>✓</span>}
                </button>
              );
            })}
          </div>
        </div>

        <div className="modal-footer">
          <button type="button" className="btn btn-ghost" onClick={onClose}>
            取消
          </button>
          <button
            type="button"
            className="btn btn-primary"
            disabled={!pickedId}
            onClick={handleConfirm}
          >
            确认选择
          </button>
        </div>
      </div>
    </div>
  );
}
