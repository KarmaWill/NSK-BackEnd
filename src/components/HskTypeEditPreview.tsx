import { CHOICE_UI_MODES, type UiAnswerModeId, uiModeInteraction } from '../config/hskTypeEditConfig';
import type { TypeFeatureState } from '../config/hskTypeEditConfig';

type Props = {
  answerMode: UiAnswerModeId;
  optionCount: number;
  features: TypeFeatureState;
};

function optionLabels(count: number): string[] {
  if (count <= 0) return [];
  return Array.from({ length: Math.min(count, 6) }, (_, i) => String.fromCharCode(65 + i));
}

export function HskTypeEditPreview({ answerMode, optionCount, features }: Props) {
  const interaction = uiModeInteraction(answerMode);
  const isChoice = CHOICE_UI_MODES.has(answerMode);
  const labels = optionLabels(optionCount);

  return (
    <div className="hsk-type-edit-preview-wrap">
      <div className="hsk-type-edit-preview-head">
        <span className="hsk-type-edit-preview-head-icon" aria-hidden>🎨</span>
        <div>
          <h3 className="hsk-type-edit-preview-title">前端 UI 骨架预览</h3>
          <p className="hsk-type-edit-preview-lead">根据左侧配置实时模拟 C 端界面效果</p>
        </div>
      </div>

      <div className="hsk-type-edit-preview-phone">
        <div className="hsk-type-edit-preview-status">
          <span>9:41</span>
          <span className="hsk-type-edit-preview-notch" />
        </div>

        <div className="hsk-type-edit-preview-body">
          {features.stem.audio && (
            <div className="hsk-type-edit-preview-block hsk-type-edit-preview-audio">
              <span>00:00</span>
              <div className="hsk-type-edit-preview-audio-bar" />
            </div>
          )}

          {features.stem.image && (
            <div className="hsk-type-edit-preview-block hsk-type-edit-preview-image">
              <span>🖼️</span>
            </div>
          )}

          {features.stem.prompt && (
            <div className="hsk-type-edit-preview-block hsk-type-edit-preview-prompt" />
          )}

          {isChoice && labels.length > 0 && (
            <div className="hsk-type-edit-preview-options">
              {labels.map((label) => (
                <div key={label} className="hsk-type-edit-preview-option">
                  {features.option.image && <span className="hsk-type-edit-preview-option-img">🖼️</span>}
                  <span>{label}.</span>
                </div>
              ))}
            </div>
          )}

          {!isChoice && answerMode === 'mapping_match' && (
            <div className="hsk-type-edit-preview-match">
              <div className="hsk-type-edit-preview-match-col">A · B · C</div>
              <div className="hsk-type-edit-preview-match-col">1 · 2 · 3</div>
            </div>
          )}

          {!isChoice && answerMode === 'drag_sort' && (
            <div className="hsk-type-edit-preview-sort">
              <div>① 句子片段</div>
              <div>② 句子片段</div>
              <div>③ 句子片段</div>
            </div>
          )}

          {(answerMode === 'fill_blank_controlled' || answerMode === 'fill_blank_open') && (
            <div className="hsk-type-edit-preview-blank">
              今天天气很<span className="hsk-type-edit-preview-gap">____</span>。
            </div>
          )}

          {(answerMode === 'text_production' || answerMode === 'handwriting_trace') && (
            <div className="hsk-type-edit-preview-writing" />
          )}

          {features.global.hasWordBank && (
            <div className="hsk-type-edit-preview-wordbank">
              {optionLabels(3).map((l) => (
                <span key={l}>{l}</span>
              ))}
            </div>
          )}

          {features.global.hasSubQuestions && (
            <div className="hsk-type-edit-preview-sub">子题 1 / 2 / 3</div>
          )}

          {!answerMode && (
            <p className="hsk-type-edit-preview-empty">选择作答模式后显示对应骨架</p>
          )}
        </div>
      </div>

      <ul className="hsk-type-edit-preview-notes">
        {features.stem.audio && <li>含题干音频播放器</li>}
        {(features.stem.image || features.option.image) && <li>含图片选择区</li>}
        <li>交互方式：{interaction}</li>
      </ul>
    </div>
  );
}
