import { useMemo, useRef, useState, type ChangeEvent } from 'react';
import { HskResourceModal } from './HskResourceModal';

type Props = {
  audioUrl: string;
  audioTranscript: string;
  required?: boolean;
  onAudioUrlChange: (url: string) => void;
  onAudioTranscriptChange: (text: string) => void;
};

const AUDIO_ACCEPT = '.mp3,.wav,.m4a,audio/mpeg,audio/wav,audio/x-m4a,audio/mp4';

export function HskQuestionAudioSection({
  audioUrl,
  audioTranscript,
  required = false,
  onAudioUrlChange,
  onAudioTranscriptChange,
}: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [resourceModalOpen, setResourceModalOpen] = useState(false);

  const openResourceModal = () => {
    setResourceModalOpen(true);
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    onAudioUrlChange(URL.createObjectURL(file));
    event.target.value = '';
  };

  const fileName = useMemo(() => {
    if (!audioUrl) return '';
    try {
      if (audioUrl.startsWith('blob:')) return '本地音频文件';
      const parts = audioUrl.split('/');
      return decodeURIComponent(parts[parts.length - 1] || audioUrl);
    } catch {
      return audioUrl;
    }
  }, [audioUrl]);

  return (
    <div className="hsk-question-audio-section">
      <div className="hsk-question-edit-section-head hsk-question-edit-section-head-split">
        <div className="hsk-question-edit-section-head-main">
          <span aria-hidden>♪</span>
          <h3>音频资源</h3>
        </div>
      </div>

      <div className="hsk-question-audio-fields">
        <div className="hsk-question-media-field">
          <label>
            音频文件 {required && <span className="required">*</span>}
          </label>
          <div className="hsk-question-media-pick-row">
            <button
              type="button"
              className={`hsk-question-media-pick-box${audioUrl ? ' has-value' : ''}`}
              onClick={openResourceModal}
            >
              <span className="hsk-question-media-pick-icon" aria-hidden>♪</span>
              <span className="hsk-question-media-pick-text">
                {audioUrl ? fileName : '点击选择音频资源'}
              </span>
            </button>
            <button type="button" className="btn btn-secondary btn-sm" onClick={openResourceModal}>
              选择
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept={AUDIO_ACCEPT}
              className="hsk-question-media-file-input"
              onChange={handleFileChange}
            />
          </div>
          <div className="form-hint">支持 mp3、wav、m4a 格式</div>
          {audioUrl && (
            <div className="hsk-question-media-selected">
              <span className="hsk-question-media-selected-name">{fileName}</span>
              <button
                type="button"
                className="hsk-question-media-remove"
                onClick={() => onAudioUrlChange('')}
              >
                ×
              </button>
            </div>
          )}
        </div>

        <div className="hsk-question-audio-policy-hint">
          <span aria-hidden>💡</span>
          音频播放控制（自动播放、是否允许暂停、播放次数）在「考试管理 → 考试任务配置」中按考试场景统一设置
        </div>

        <div className="form-group hsk-question-audio-transcript">
          <label>音频文本稿 (选填)</label>
          <textarea
            rows={3}
            value={audioTranscript}
            placeholder="输入音频对应的文字稿，便于审核与无障碍…"
            onChange={(e) => onAudioTranscriptChange(e.target.value)}
          />
        </div>
      </div>

      <HskResourceModal
        open={resourceModalOpen}
        kind="audio"
        selectedUrl={audioUrl}
        onClose={() => setResourceModalOpen(false)}
        onConfirm={(resource) => onAudioUrlChange(resource.url)}
      />
    </div>
  );
}
