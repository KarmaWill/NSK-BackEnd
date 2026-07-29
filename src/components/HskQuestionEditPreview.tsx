import { defaultCompoundForType, getRegistryEntry } from '../config/hskQuestionTypeRegistry';
import type { HskQuestionRow, HskQuestionTypeDef, HskQuestionTypeCode } from '../types/hskExams';
import {
  isAudioPending,
  isImagePending,
  PreviewAudioBar,
  PreviewL01ImageChoice,
  PreviewL02Match,
  PreviewL05MultiSub,
  PreviewR01Match,
  PreviewR02Match,
  PreviewR03WordFill,
  PreviewR04Sort,
  PreviewR05ParagraphFill,
  PreviewR06Cloze,
  PreviewR07Reading,
  PreviewR09ImageWord,
  PreviewW01ComponentMatch,
  PreviewW02PinyinFill,
  PreviewW03PictureSentence,
  PreviewW04TopicEssay,
  PreviewJudgmentImage,
  PreviewQuestionStem,
  PreviewTextOptions,
} from './HskQuestionPreviewParts';

type Props = {
  question: HskQuestionRow;
  typeDef?: HskQuestionTypeDef;
  /** 嵌入试卷预览平板框内，不重复渲染外层工具栏与设备框 */
  embedded?: boolean;
  tabletLandscape?: boolean;
  onTabletLandscapeChange?: (value: boolean) => void;
  onFullscreen?: () => void;
  onResetAnswerState?: () => void;
  showToolbarControls?: boolean;
};

const TRUE_FALSE_TYPES = new Set<HskQuestionTypeCode>(['L06', 'R08']);

function normalizeOptions(question: HskQuestionRow) {
  return (
    question.payload?.runtimeOptions?.map((o) => ({
      key: o.key,
      text: o.text || `[选项${o.key}]`,
      pinyin: o.pinyin,
      image: o.image,
    })) ??
    (question.options ?? []).map((o) => ({
      key: o.label,
      text: o.text || `[选项${o.label}]`,
      pinyin: o.pinyin,
      image: o.image,
    }))
  );
}

function renderByType(question: HskQuestionRow, typeDef?: HskQuestionTypeDef) {
  const typeId = question.type_id;
  const registry = getRegistryEntry(typeId, defaultCompoundForType(typeId));
  const needsAudio = registry?.editorFields.includes('audio') ?? false;
  const audioUrl = question.payload?.audioUrl ?? question.audioUrl;
  const audioTranscript = question.payload?.audioTranscript ?? '';
  const audioPending = isAudioPending(question, needsAudio);
  const imagePending = isImagePending(question);
  const options = normalizeOptions(question);

  if (TRUE_FALSE_TYPES.has(typeId)) {
    return (
      <PreviewJudgmentImage
        question={question}
        needsAudio={needsAudio}
        audioPending={audioPending}
        audioTranscript={audioTranscript}
      />
    );
  }

  if (typeId === 'L01') {
    return (
      <PreviewL01ImageChoice
        question={question}
        audioPending={audioPending}
        audioTranscript={audioTranscript}
        imagePending={imagePending || question.imageStatus === 'pending'}
      />
    );
  }

  if (typeId === 'L02') {
    return (
      <PreviewL02Match
        question={question}
        audioPending={audioPending}
        audioTranscript={audioTranscript}
      />
    );
  }

  if (typeId === 'R01') {
    return <PreviewR01Match question={question} />;
  }

  if (typeId === 'R02') {
    return <PreviewR02Match question={question} />;
  }

  if (typeId === 'R03') {
    return <PreviewR03WordFill question={question} />;
  }

  if (typeId === 'R04') {
    return <PreviewR04Sort question={question} />;
  }

  if (typeId === 'R05') {
    return <PreviewR05ParagraphFill question={question} />;
  }

  if (typeId === 'R06') {
    return <PreviewR06Cloze question={question} />;
  }

  if (typeId === 'R07') {
    return <PreviewR07Reading question={question} />;
  }

  if (typeId === 'R09') {
    return <PreviewR09ImageWord question={question} />;
  }

  if (typeId === 'W01') {
    return <PreviewW01ComponentMatch question={question} />;
  }

  if (typeId === 'W02') {
    return <PreviewW02PinyinFill question={question} />;
  }

  if (typeId === 'W03') {
    return <PreviewW03PictureSentence question={question} />;
  }

  if (typeId === 'W04') {
    return <PreviewW04TopicEssay question={question} />;
  }

  if (typeId === 'L05') {
    return (
      <PreviewL05MultiSub
        question={question}
        audioPending={audioPending}
        audioTranscript={audioTranscript}
      />
    );
  }

  if (typeId === 'L03' || typeId === 'L04') {
    return (
      <>
        <PreviewQuestionStem question={question} />
        <PreviewAudioBar pending={audioPending} audioUrl={audioUrl} audioTranscript={audioTranscript} />
        <PreviewTextOptions options={options} correctAnswer={question.correctAnswer ?? ''} />
      </>
    );
  }

  if (needsAudio) {
    return (
      <>
        <PreviewQuestionStem question={question} />
        <PreviewAudioBar pending={audioPending} audioUrl={audioUrl} audioTranscript={audioTranscript} />
        {options.length > 0 ? (
          <PreviewTextOptions options={options} correctAnswer={question.correctAnswer ?? ''} />
        ) : (
          <div className="hsk-preview-writing-area" />
        )}
      </>
    );
  }

  return (
    <>
      <PreviewQuestionStem question={question} />
      {options.length > 0 ? (
        <PreviewTextOptions options={options} correctAnswer={question.correctAnswer ?? ''} />
      ) : (
        <div className="hsk-preview-writing-area" />
      )}
      {typeDef && <p className="hsk-preview-type-hint">{typeDef.name} ({typeDef.id})</p>}
    </>
  );
}

export function HskQuestionEditPreview({
  question,
  typeDef,
  embedded = false,
  tabletLandscape = false,
  onTabletLandscapeChange,
  onFullscreen,
  onResetAnswerState,
  showToolbarControls = false,
}: Props) {
  const inner = renderByType(question, typeDef);

  if (embedded) {
    return <div className="hsk-question-edit-preview-embedded">{inner}</div>;
  }

  const previewBody = tabletLandscape ? (
    <div className="hsk-question-edit-preview-tablet-frame">
      <div className="hsk-question-edit-preview-tablet-chrome">
        <span>9:41</span>
        <span>📶 📡 🔋</span>
      </div>
      <div className="hsk-question-edit-preview-tablet-screen">
        <div className="hsk-question-edit-preview-card is-tablet">
          {question.isExample && <div className="hsk-preview-example-badge">例如</div>}
          {inner}
        </div>
      </div>
    </div>
  ) : (
    <div className="hsk-question-edit-preview-card">
      {question.isExample && <div className="hsk-preview-example-badge">例如</div>}
      {inner}
    </div>
  );

  return (
    <div className="hsk-question-edit-preview-wrap">
      <div className="hsk-question-edit-preview-toolbar">
        <span className="hsk-question-edit-preview-toolbar-title">前端渲染预览</span>
        {showToolbarControls ? (
          <div className="hsk-question-edit-preview-toolbar-actions">
            <span className="hsk-question-edit-preview-mode">preview 模式</span>
            {onTabletLandscapeChange && (
              <label className="hsk-question-edit-preview-tablet-toggle">
                <input
                  type="checkbox"
                  checked={tabletLandscape}
                  onChange={(e) => onTabletLandscapeChange(e.target.checked)}
                />
                <span>平板横屏 1024×768</span>
              </label>
            )}
            {onFullscreen && (
              <button type="button" className="hsk-question-edit-fullscreen-btn" onClick={onFullscreen}>
                全屏预览
              </button>
            )}
          </div>
        ) : (
          <span className="hsk-question-edit-preview-toolbar-meta">平板横屏 1024×768</span>
        )}
      </div>

      <div className="hsk-question-edit-preview-stage">{previewBody}</div>
      {onResetAnswerState && (
        <div className="hsk-question-edit-preview-reset">
          <button type="button" onClick={onResetAnswerState}>
            ↺ 重置答题状态
          </button>
        </div>
      )}
    </div>
  );
}
