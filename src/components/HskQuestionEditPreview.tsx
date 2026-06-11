import type { HskQuestionRow, HskQuestionTypeDef } from '../types/hskExams';

type Props = {
  question: HskQuestionRow;
  typeDef?: HskQuestionTypeDef;
  /** 嵌入试卷预览平板框内，不重复渲染外层工具栏与设备框 */
  embedded?: boolean;
};

export function HskQuestionEditPreview({ question, typeDef, embedded = false }: Props) {
  const options =
    question.payload?.runtimeOptions?.map((o) => ({
      key: o.key,
      text: o.text || `[选项${o.key}]`,
    })) ??
    question.options.map((o) => ({
      key: o.label,
      text: o.text || `[选项${o.label}]`,
    }));

  const stem = question.stem?.trim() || '[题目内容 — 从题库中抽取]';

  const inner = (
    <>
      {(question.audioUrl || question.payload?.audioUrl || question.audioStatus === 'ready') && (
        <div className="hsk-question-edit-preview-audio">
          <span>▶</span>
          <div className="hsk-question-edit-preview-audio-track" />
          <span>00:00</span>
        </div>
      )}

      <p className="hsk-question-edit-preview-stem">?. {stem}</p>

      {options.length > 0 ? (
        <div className="hsk-question-edit-preview-options">
          {options.map((opt) => (
            <div key={opt.key} className="hsk-question-edit-preview-option">
              <span className="hsk-question-edit-preview-option-key">{opt.key}</span>
              <span>{opt.text}</span>
            </div>
          ))}
        </div>
      ) : (
        <div className="hsk-question-edit-preview-writing-area" />
      )}

      {typeDef && !embedded && (
        <p className="hsk-question-edit-preview-type-hint">
          {typeDef.name} ({typeDef.id})
        </p>
      )}
    </>
  );

  if (embedded) {
    return <div className="hsk-question-edit-preview-embedded">{inner}</div>;
  }

  return (
    <div className="hsk-question-edit-preview-wrap">
      <div className="hsk-question-edit-preview-toolbar">
        <span className="hsk-question-edit-preview-toolbar-title">前端渲染预览</span>
        <span className="hsk-question-edit-preview-toolbar-meta">平板横屏 1024×768</span>
      </div>

      <div className="hsk-question-edit-preview-stage">
        <div className="hsk-question-edit-preview-tablet">
          <div className="hsk-question-edit-preview-tablet-inner">{inner}</div>
        </div>
      </div>
    </div>
  );
}
