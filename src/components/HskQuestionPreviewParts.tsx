import type { HskQuestionRow } from '../types/hskExams';

export function resolveQuestionImageUrl(question: HskQuestionRow): string | undefined {
  const content = question.payload?.content as Record<string, unknown> | undefined;
  if (typeof content?.imageUrl === 'string' && content.imageUrl) return content.imageUrl;
  if (typeof content?.image === 'string' && content.image) return content.image;
  const fromRuntime = question.payload?.runtimeOptions?.find((o) => o.image)?.image;
  if (fromRuntime) return fromRuntime;
  const fromOption = question.options.find((o) => o.image)?.image;
  return fromOption || undefined;
}

export function isAudioPending(question: HskQuestionRow, needsAudio: boolean): boolean {
  if (!needsAudio) return false;
  const url = question.payload?.audioUrl ?? question.audioUrl;
  return !url && question.audioStatus !== 'ready';
}

export function isImagePending(question: HskQuestionRow): boolean {
  if (question.imageStatus === 'none') return false;
  if (question.imageStatus === 'ready' && resolveQuestionImageUrl(question)) return false;
  return question.imageStatus === 'pending' || question.imageStatus === 'missing' || !resolveQuestionImageUrl(question);
}

export function PreviewAudioBar({
  pending,
  audioTranscript,
}: {
  pending: boolean;
  audioTranscript?: string;
}) {
  if (pending) {
    return (
      <div className="hsk-preview-audio is-pending">
        <span className="hsk-preview-status-badge">⏳ 待配音</span>
        <button type="button" className="hsk-preview-audio-play is-disabled" disabled aria-hidden>
          ▶
        </button>
        <div className="hsk-preview-audio-meta">
          <div className="hsk-preview-audio-time">0:00 / 0:05</div>
          {audioTranscript && <div className="hsk-preview-audio-sub">{audioTranscript}</div>}
        </div>
      </div>
    );
  }

  return (
    <div className="hsk-preview-audio is-ready">
      <button type="button" className="hsk-preview-audio-play" aria-hidden>
        ▶
      </button>
      <div className="hsk-preview-audio-meta">
        <div className="hsk-preview-audio-time">点击播放音频（每题播放两次）</div>
        {audioTranscript && <div className="hsk-preview-audio-sub">{audioTranscript}</div>}
      </div>
    </div>
  );
}

export function PreviewImageBox({
  pending,
  imageUrl,
  alt,
  size = 'md',
}: {
  pending: boolean;
  imageUrl?: string;
  alt?: string;
  size?: 'md' | 'lg';
}) {
  const boxClass = size === 'lg' ? 'hsk-preview-image-box is-lg' : 'hsk-preview-image-box';

  if (!pending && imageUrl) {
    return (
      <div className="hsk-preview-image-wrap">
        <img src={imageUrl} alt={alt || '题目图片'} className={boxClass} />
      </div>
    );
  }

  return (
    <div className="hsk-preview-image-wrap">
      <div className={`${boxClass} is-placeholder${pending ? ' is-pending' : ''}`}>
        {pending && <span className="hsk-preview-status-badge is-corner">⏳ 待配图</span>}
        <span className="hsk-preview-image-icon" aria-hidden>
          ⏳
        </span>
        <span className="hsk-preview-image-label">待配图</span>
        {alt && !pending && <span className="hsk-preview-image-alt">{alt}</span>}
      </div>
    </div>
  );
}

export function PreviewTrueFalseButtons() {
  return (
    <div className="hsk-preview-tf-row">
      <div className="hsk-preview-tf-btn is-true" aria-hidden>
        ✓
      </div>
      <div className="hsk-preview-tf-btn is-false" aria-hidden>
        ✗
      </div>
    </div>
  );
}

export function PreviewTextOptions({
  options,
}: {
  options: Array<{ key: string; text: string }>;
}) {
  return (
    <div className="hsk-preview-text-options">
      {options.map((opt) => (
        <div key={opt.key} className="hsk-preview-text-option">
          <span className="hsk-preview-text-option-key">{opt.key}</span>
          <span>{opt.text}</span>
        </div>
      ))}
    </div>
  );
}

export function PreviewImageOptionGrid({
  options,
  pending,
}: {
  options: Array<{ key: string; text?: string; image?: string }>;
  pending?: boolean;
}) {
  return (
    <div className="hsk-preview-image-option-grid">
      {options.map((opt) => (
        <div key={opt.key} className="hsk-preview-image-option-card">
          <span className="hsk-preview-image-option-label">{opt.key}</span>
          {opt.image && !pending ? (
            <img src={opt.image} alt={opt.text || opt.key} className="hsk-preview-image-option-img" />
          ) : (
            <div className={`hsk-preview-image-box is-sm is-placeholder${pending ? ' is-pending' : ''}`}>
              {pending && <span className="hsk-preview-status-badge is-corner">⏳ 待配图</span>}
              <span className="hsk-preview-image-icon" aria-hidden>
                ⏳
              </span>
              <span className="hsk-preview-image-label">待配图</span>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
