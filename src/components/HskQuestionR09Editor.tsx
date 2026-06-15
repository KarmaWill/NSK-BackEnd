import { useRef, useState, type ChangeEvent } from 'react';
import type { HskRuntimeOption } from '../types/hskExams';
import { PinyinCountInput } from './PinyinCountInput';
import { countHanInText } from '../utils/pinyinUtils';
import { HskResourceModal } from './HskResourceModal';
import {
  countHanInR09Dialogue,
  createR09SubItem,
  flattenR09DialogueText,
  relabelR09Options,
  type HskR09SubItem,
} from '../utils/hskR09ImageWord';

const OPTION_KEYS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'] as const;

type Props = {
  options: HskRuntimeOption[];
  subItems: HskR09SubItem[];
  levelNumber: number;
  onOptionsChange: (next: HskRuntimeOption[]) => void;
  onSubItemsChange: (next: HskR09SubItem[]) => void;
};

function nextOptionKey(options: HskRuntimeOption[]): string {
  const used = new Set(options.map((o) => o.key));
  return OPTION_KEYS.find((k) => !used.has(k)) ?? 'I';
}

function R09SubItemImageField({
  imageUrl,
  onChange,
}: {
  imageUrl: string;
  onChange: (url: string) => void;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [resourceModalOpen, setResourceModalOpen] = useState(false);

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    onChange(URL.createObjectURL(file));
    event.target.value = '';
  };

  return (
    <div className="hsk-question-r09-sub-image">
      <label>
        图片资源 <span className="required">*</span>
      </label>
      <div className="hsk-question-media-pick-row">
        <button
          type="button"
          className={`hsk-question-media-pick-box hsk-question-image-pick-box${imageUrl ? ' has-value' : ''}`}
          onClick={() => setResourceModalOpen(true)}
        >
          <span className="hsk-question-media-pick-icon" aria-hidden>
            🖼
          </span>
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
        <div className="hsk-question-image-option-preview hsk-question-r09-sub-image-preview">
          {imageUrl ? (
            <img src={imageUrl} alt="子题图片" />
          ) : (
            <>
              <span className="hsk-question-image-option-preview-icon" aria-hidden>
                图
              </span>
              <span className="hsk-question-image-option-preview-label">图片预览区</span>
            </>
          )}
        </div>
        {imageUrl && (
          <button type="button" className="hsk-question-media-remove" onClick={() => onChange('')}>
            ×
          </button>
        )}
      </div>
      <HskResourceModal
        open={resourceModalOpen}
        kind="image"
        selectedUrl={imageUrl}
        onClose={() => setResourceModalOpen(false)}
        onConfirm={(resource) => {
          onChange(resource.url);
          setResourceModalOpen(false);
        }}
      />
    </div>
  );
}

export function HskQuestionR09Editor({
  options,
  subItems,
  levelNumber,
  onOptionsChange,
  onSubItemsChange,
}: Props) {
  const pinyinRequired = levelNumber <= 2;
  const canAddOption = options.length < 8;
  const canRemoveOption = options.length > 2;
  const optionKeys = options.map((opt) => opt.key);

  const updateOption = (index: number, patch: Partial<HskRuntimeOption>) => {
    const next = [...options];
    next[index] = { ...next[index], ...patch };
    onOptionsChange(next);
  };

  const removeOption = (index: number) => {
    if (!canRemoveOption) return;
    const removed = options[index];
    const nextOptions = relabelR09Options(options.filter((_, i) => i !== index));
    onOptionsChange(nextOptions);
    const nextItems = subItems.map((item) =>
      item.answer === removed.key ? { ...item, answer: '' } : item,
    );
    onSubItemsChange(nextItems);
  };

  const addOption = () => {
    if (!canAddOption) return;
    onOptionsChange([...options, { key: nextOptionKey(options), text: '', pinyin: '' }]);
  };

  const updateSubItem = (index: number, patch: Partial<HskR09SubItem>) => {
    const next = [...subItems];
    next[index] = { ...next[index], ...patch };
    onSubItemsChange(next);
  };

  const removeSubItem = (index: number) => {
    if (subItems.length <= 1) return;
    onSubItemsChange(subItems.filter((_, idx) => idx !== index));
  };

  const addSubItem = () => {
    onSubItemsChange([...subItems, createR09SubItem(subItems.length + 1)]);
  };

  const setExample = (index: number) => {
    onSubItemsChange(
      subItems.map((item, idx) => ({
        ...item,
        isExample: idx === index,
        score: idx === index ? 0 : item.score && item.score > 0 ? item.score : 1,
      })),
    );
  };

  const scoringCount = subItems.filter((item) => !item.isExample).length;

  return (
    <>
      <div className="hsk-question-edit-section-divider" />
      <div className="hsk-question-r09-body">
        <div className="hsk-question-r09-word-section">
          <div className="hsk-question-edit-section-head hsk-question-edit-section-head-split">
            <div className="hsk-question-edit-section-head-main">
              <span aria-hidden>📚</span>
              <h3>词语选项（{options.length}个）</h3>
            </div>
            {canAddOption && (
              <button type="button" className="hsk-question-edit-sub-add-btn" onClick={addOption}>
                + 添加词语
              </button>
            )}
          </div>
          <label className="hsk-question-r09-word-label">
            词语库 <span className="required">*</span>
          </label>
          <span className="hsk-question-r02-block-hint">
            每个词语需配置拼音；词级连写或字级分写均可，如：búkèqi 或 bú kè qi
          </span>
          <div className="hsk-question-r09-option-list">
            {options.map((opt, idx) => (
              <div key={`word-${opt.key}-${idx}`} className="hsk-question-r09-option-row is-word-bank">
                <span className="hsk-question-r09-option-key">{opt.key}</span>
                <div className="hsk-question-r09-option-fields">
                  <input
                    type="text"
                    value={opt.text ?? ''}
                    onChange={(e) => updateOption(idx, { text: e.target.value })}
                    placeholder="词语"
                    className="hsk-question-r09-option-text"
                  />
                  <PinyinCountInput
                    value={opt.pinyin ?? ''}
                    onChange={(v) => updateOption(idx, { pinyin: v })}
                    targetHanCount={countHanInText(opt.text ?? '') || undefined}
                    targetText={opt.text ?? ''}
                    placeholder={pinyinRequired ? '拼音 *' : '拼音（选填）'}
                    className="hsk-question-r09-option-pinyin"
                  />
                </div>
                {canRemoveOption && (
                  <button
                    type="button"
                    className="hsk-question-r09-option-remove"
                    aria-label={`移除选项 ${opt.key}`}
                    onClick={() => removeOption(idx)}
                  >
                    ×
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="hsk-question-r09-sub-section">
          <div className="hsk-question-edit-section-head hsk-question-edit-section-head-split">
            <div className="hsk-question-edit-section-head-main">
              <span aria-hidden>📋</span>
              <h3>题目列表（{scoringCount}道）</h3>
            </div>
            <button type="button" className="hsk-question-edit-sub-add-btn" onClick={addSubItem}>
              + 添加题目
            </button>
          </div>

          <div className="hsk-question-r09-sub-list">
            {subItems.map((item, idx) => (
              <div key={`${item.id}-${idx}`} className="hsk-question-r09-sub-card">
                <div className="hsk-question-r09-sub-head">
                  <span className="hsk-question-r09-sub-title">
                    [{idx + 1}] {item.isExample ? '例题' : `第${idx + 1}题`}
                  </span>
                  <div className="hsk-question-r09-sub-head-actions">
                    {!item.isExample && (
                      <button
                        type="button"
                        className="hsk-question-r09-sub-example-btn"
                        onClick={() => setExample(idx)}
                      >
                        设为例题
                      </button>
                    )}
                    <button
                      type="button"
                      className="hsk-question-r09-sub-remove"
                      onClick={() => removeSubItem(idx)}
                      disabled={subItems.length <= 1}
                      aria-label={`删除第 ${idx + 1} 题`}
                    >
                      删除
                    </button>
                  </div>
                </div>

                <R09SubItemImageField
                  imageUrl={item.imageUrl ?? ''}
                  onChange={(url) => updateSubItem(idx, { imageUrl: url })}
                />

                <div className="hsk-question-r05-field hsk-question-r09-sub-dialogue">
                  <label>
                    对话内容 <span className="required">*</span>
                  </label>
                  <span className="hsk-question-r02-block-hint">
                    填空用 [__]、[__|拼音] 或 （拼音）；正文可空格分词，如：小雨 今天 去 吃
                  </span>
                  <textarea
                    value={item.dialogue}
                    onChange={(e) => updateSubItem(idx, { dialogue: e.target.value })}
                    rows={4}
                    placeholder={'A: 小雨 今天 去 吃\nB: 我 [__|bú kèqi]。'}
                    className="hsk-question-r05-textarea"
                  />
                </div>

                <div className="hsk-question-r05-field">
                  <label>
                    对话拼音
                    {pinyinRequired ? (
                      <span className="required"> *</span>
                    ) : (
                      <span className="is-optional"> （选填 · 整句逐字 ruby）</span>
                    )}
                  </label>
                  <span className="hsk-question-r02-block-hint">
                    与正文空格分词一一对应，如：xiaoyu jintian qu chi；填空处不算字、自动跳过
                  </span>
                  <PinyinCountInput
                    value={item.dialoguePinyin ?? ''}
                    onChange={(v) => updateSubItem(idx, { dialoguePinyin: v })}
                    targetHanCount={countHanInR09Dialogue(item.dialogue)}
                    targetText={flattenR09DialogueText(item.dialogue)}
                    placeholder="如：xiaoyu jintian qu chi"
                  />
                </div>

                {!item.isExample && (
                  <div className="hsk-question-r09-answer-section">
                    <label className="hsk-question-r09-answer-label">
                      正确答案（填入对应词语字母） <span className="required">*</span>
                    </label>
                    <select
                      value={item.answer}
                      onChange={(e) => updateSubItem(idx, { answer: e.target.value })}
                      className="hsk-question-r09-answer-select"
                    >
                      <option value="">— 选择正确答案 —</option>
                      {optionKeys.map((key) => (
                        <option key={key} value={key}>
                          {key}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
