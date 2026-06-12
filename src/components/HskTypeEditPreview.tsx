import { CHOICE_UI_MODES, type TypeFeatureState, type UiAnswerModeId, uiModeInteraction } from '../config/hskTypeEditConfig';

type Props = {
  answerMode: UiAnswerModeId;
  optionCount: number;
  features: TypeFeatureState;
};

function optionLabels(count: number): string[] {
  if (count <= 0) return [];
  return Array.from({ length: Math.min(count, 6) }, (_, i) => String.fromCharCode(65 + i));
}

function PreviewOptions({
  labels,
  features,
}: {
  labels: string[];
  features: TypeFeatureState;
}) {
  if (labels.length === 0) return null;
  return (
    <div className="hsk-type-edit-preview-options">
      {labels.map((label) => (
        <div key={label} className="hsk-type-edit-preview-option">
          {features.option.image && <span className="hsk-type-edit-preview-option-img">🖼️</span>}
          {features.option.audio && <span className="hsk-type-edit-preview-option-audio">🎧</span>}
          <span className="hsk-type-edit-preview-option-key">{label}.</span>
          {features.option.multilang && <span className="hsk-type-edit-preview-option-sub">翻译</span>}
        </div>
      ))}
    </div>
  );
}

function PreviewStemBlocks({ features }: { features: TypeFeatureState }) {
  return (
    <>
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
      {features.stem.multilang && (
        <div className="hsk-type-edit-preview-block hsk-type-edit-preview-multilang">
          <span className="hsk-type-edit-preview-multilang-icon" aria-hidden>
            🌐
          </span>
          <span>多语言翻译支持</span>
        </div>
      )}
    </>
  );
}

export function HskTypeEditPreview({ answerMode, optionCount, features }: Props) {
  const interaction = uiModeInteraction(answerMode);
  const isChoice = CHOICE_UI_MODES.has(answerMode);
  const labels = optionLabels(optionCount);
  const wordBankLabels = optionLabels(Math.max(optionCount, 6));
  const showWordBank = features.global.hasWordBank;
  const showSubQuestions = features.global.hasSubQuestions;

  const renderNonChoiceBody = () => (
    <>
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
      {answerMode === 'speech_record' && (
        <div className="hsk-type-edit-preview-block hsk-type-edit-preview-speech">
          <span>🎤</span>
          <span>点击录音</span>
        </div>
      )}
    </>
  );

  return (
    <div className="hsk-type-edit-preview-wrap">
      <div className="hsk-type-edit-preview-head">
        <span className="hsk-type-edit-preview-head-icon" aria-hidden>
          🎨
        </span>
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
          {showWordBank && (
            <div className="hsk-type-edit-preview-wordbank-block">
              <div className="hsk-type-edit-preview-wordbank-label">备选选项</div>
              <div className="hsk-type-edit-preview-wordbank">
                {wordBankLabels.map((l) => (
                  <span key={l}>{l}</span>
                ))}
              </div>
            </div>
          )}

          {!showSubQuestions && (
            <>
              <PreviewStemBlocks features={features} />
              {isChoice && labels.length > 0 && <PreviewOptions labels={labels} features={features} />}
              {renderNonChoiceBody()}
            </>
          )}

          {showSubQuestions && (
            <>
              <PreviewStemBlocks features={features} />
              <div className="hsk-type-edit-preview-shared-stem">
                <span className="hsk-type-edit-preview-shared-icon" aria-hidden>
                  📄
                </span>
                <span>公共题干 / 阅读材料</span>
              </div>
              {isChoice && labels.length > 0 ? (
                (['Q1', 'Q2'] as const).map((qid) => (
                  <div key={qid} className="hsk-type-edit-preview-subq">
                    <div className="hsk-type-edit-preview-subq-label">{qid}</div>
                    <PreviewOptions labels={labels} features={features} />
                  </div>
                ))
              ) : (
                renderNonChoiceBody()
              )}
            </>
          )}

          {!answerMode && <p className="hsk-type-edit-preview-empty">选择作答模式后显示对应骨架</p>}
        </div>
      </div>

      <ul className="hsk-type-edit-preview-notes">
        {features.stem.audio && <li>含题干音频播放器</li>}
        {(features.stem.image || features.option.image) && <li>含图片选择区</li>}
        {features.option.audio && <li>含选项独立音频</li>}
        {features.option.multilang && <li>选项支持多语言翻译</li>}
        {features.stem.multilang && <li>题干支持多语言翻译</li>}
        {showWordBank && <li>含词库组件</li>}
        {showSubQuestions && <li>含子题目</li>}
        <li>交互方式：{interaction}</li>
      </ul>
    </div>
  );
}
