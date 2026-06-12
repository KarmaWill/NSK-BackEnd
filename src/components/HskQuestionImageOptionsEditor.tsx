import { useRef, useState, type ChangeEvent } from 'react';
import type { HskRuntimeOption } from '../types/hskExams';
import { HskResourceModal } from './HskResourceModal';

const OPTION_KEYS = ['A', 'B', 'C', 'D', 'E', 'F'] as const;

type Props = {
  options: HskRuntimeOption[];
  correctAnswer: string;
  showCorrectToggle: boolean;
  onChange: (next: HskRuntimeOption[]) => void;
  onCorrectAnswerChange: (answer: string) => void;
};

function nextOptionKey(options: HskRuntimeOption[]): string {
  const used = new Set(options.map((o) => o.key));
  return OPTION_KEYS.find((k) => !used.has(k)) ?? 'G';
}

type RowProps = {
  option: HskRuntimeOption;
  showCorrectToggle: boolean;
  isCorrect: boolean;
  canRemove: boolean;
  onImageChange: (url: string) => void;
  onRemove: () => void;
  onCorrectToggle: () => void;
};

function ImageOptionRow({
  option,
  showCorrectToggle,
  isCorrect,
  canRemove,
  onImageChange,
  onRemove,
  onCorrectToggle,
}: RowProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [resourceModalOpen, setResourceModalOpen] = useState(false);
  const imageUrl = option.image ?? '';

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    onImageChange(URL.createObjectURL(file));
    event.target.value = '';
  };

  return (
    <div className="hsk-question-image-option-card">
      <div className="hsk-question-image-option-card-head">
        <span className="hsk-question-image-option-label">{option.key}</span>
      </div>

      <div className="hsk-question-media-pick-row">
        <button
          type="button"
          className={`hsk-question-media-pick-box hsk-question-image-pick-box${imageUrl ? ' has-value' : ''}`}
          onClick={() => setResourceModalOpen(true)}
        >
          <span className="hsk-question-media-pick-icon" aria-hidden>🖼</span>
          <span className="hsk-question-media-pick-text">
            {imageUrl ? '已选择图片' : '点击选择图片资源'}
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
            <img src={imageUrl} alt={`选项 ${option.key}`} />
          ) : (
            <>
              <span className="hsk-question-image-option-preview-icon" aria-hidden>
                图
              </span>
              <span className="hsk-question-image-option-preview-label">图片预览区</span>
            </>
          )}
        </div>
        <div className="hsk-question-image-option-actions">
          {showCorrectToggle && (
            <button
              type="button"
              className={`hsk-question-image-correct-btn${isCorrect ? ' is-active' : ''}`}
              onClick={onCorrectToggle}
            >
              {isCorrect ? '●' : '○'} 设为正确答案
            </button>
          )}
          {canRemove && (
            <button
              type="button"
              className="hsk-question-image-option-remove"
              aria-label={`移除选项 ${option.key}`}
              onClick={onRemove}
            >
              ×
            </button>
          )}
        </div>
      </div>

      <HskResourceModal
        open={resourceModalOpen}
        kind="image"
        selectedUrl={imageUrl}
        onClose={() => setResourceModalOpen(false)}
        onConfirm={(resource) => onImageChange(resource.url)}
      />
    </div>
  );
}

export function HskQuestionImageOptionsEditor({
  options,
  correctAnswer,
  showCorrectToggle,
  onChange,
  onCorrectAnswerChange,
}: Props) {
  const addOption = () => {
    const key = nextOptionKey(options);
    onChange([...options, { key, text: `图片${key}`, image: '' }]);
  };

  const updateImage = (index: number, image: string) => {
    const next = [...options];
    next[index] = { ...next[index], image, text: next[index].text || `图片${next[index].key}` };
    onChange(next);
  };

  const removeOption = (index: number) => {
    const removed = options[index];
    const next = options.filter((_, i) => i !== index);
    onChange(next);
    if (showCorrectToggle && correctAnswer === removed.key && next.length > 0) {
      onCorrectAnswerChange(next[0].key);
    }
  };

  return (
    <div className="hsk-question-image-options">
      <div className="hsk-question-edit-section-head hsk-question-edit-section-head-split">
        <div className="hsk-question-edit-section-head-main">
          <span aria-hidden>☑</span>
          <h3>图片选项（{options.length}个）</h3>
        </div>
        <button type="button" className="btn btn-secondary btn-sm" onClick={addOption}>
          + 添加图片选项
        </button>
      </div>

      <div className="hsk-question-image-options-list">
        {options.map((opt, idx) => (
          <ImageOptionRow
            key={opt.key}
            option={opt}
            showCorrectToggle={showCorrectToggle}
            isCorrect={correctAnswer === opt.key}
            canRemove={options.length > 2}
            onImageChange={(url) => updateImage(idx, url)}
            onRemove={() => removeOption(idx)}
            onCorrectToggle={() => onCorrectAnswerChange(opt.key)}
          />
        ))}
      </div>
    </div>
  );
}
