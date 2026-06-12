import { defaultCompoundForType, getRegistryEntry } from '../config/hskQuestionTypeRegistry';
import type { HskQuestionRow, HskQuestionTypeDef, HskQuestionTypeCode } from '../types/hskExams';
import {
  isAudioPending,
  isImagePending,
  PreviewAudioBar,
  PreviewImageBox,
  PreviewImageOptionGrid,
  PreviewTextOptions,
  PreviewTrueFalseButtons,
  resolveQuestionImageUrl,
} from './HskQuestionPreviewParts';

type Props = {
  question: HskQuestionRow;
  typeDef?: HskQuestionTypeDef;
  /** 嵌入试卷预览平板框内，不重复渲染外层工具栏与设备框 */
  embedded?: boolean;
};

const TRUE_FALSE_TYPES = new Set<HskQuestionTypeCode>(['L06', 'R08']);

function normalizeOptions(question: HskQuestionRow) {
  return (
    question.payload?.runtimeOptions?.map((o) => ({
      key: o.key,
      text: o.text || `[选项${o.key}]`,
      image: o.image,
    })) ??
    question.options.map((o) => ({
      key: o.label,
      text: o.text || `[选项${o.label}]`,
      image: o.image,
    }))
  );
}

function renderByType(question: HskQuestionRow, typeDef?: HskQuestionTypeDef) {
  const typeId = question.type_id;
  const registry = getRegistryEntry(typeId, defaultCompoundForType(typeId));
  const needsAudio = registry?.editorFields.includes('audio') ?? false;
  const audioTranscript = question.payload?.audioTranscript ?? '';
  const audioPending = isAudioPending(question, needsAudio);
  const imageUrl = resolveQuestionImageUrl(question);
  const imagePending = isImagePending(question);
  const options = normalizeOptions(question);
  const stem = question.stem?.trim() || '[题目内容 — 从题库中抽取]';

  if (TRUE_FALSE_TYPES.has(typeId)) {
    return (
      <>
        {needsAudio && <PreviewAudioBar pending={audioPending} audioTranscript={audioTranscript} />}
        <PreviewImageBox pending={imagePending} imageUrl={imageUrl} alt={stem} size="lg" />
        <PreviewTrueFalseButtons />
      </>
    );
  }

  if (typeId === 'L01') {
    return (
      <>
        <PreviewAudioBar pending={audioPending} audioTranscript={audioTranscript} />
        <PreviewImageOptionGrid options={options} pending={imagePending || question.imageStatus === 'pending'} />
      </>
    );
  }

  if (typeId === 'L02') {
    return (
      <>
        <PreviewAudioBar pending={audioPending} audioTranscript={audioTranscript} />
        <PreviewImageOptionGrid
          options={options.length > 0 ? options : [{ key: 'A' }, { key: 'B' }, { key: 'C' }]}
          pending={imagePending}
        />
      </>
    );
  }

  if (typeId === 'L03' || typeId === 'L04') {
    return (
      <>
        <PreviewAudioBar pending={audioPending} audioTranscript={audioTranscript} />
        {stem && typeId === 'L04' && <p className="hsk-preview-prompt">{stem}</p>}
        <PreviewTextOptions options={options} />
      </>
    );
  }

  if (needsAudio) {
    return (
      <>
        <PreviewAudioBar pending={audioPending} audioTranscript={audioTranscript} />
        <p className="hsk-preview-stem">{stem}</p>
        {options.length > 0 ? (
          <PreviewTextOptions options={options} />
        ) : (
          <div className="hsk-preview-writing-area" />
        )}
      </>
    );
  }

  return (
    <>
      <p className="hsk-preview-stem">{stem}</p>
      {options.length > 0 ? (
        <PreviewTextOptions options={options} />
      ) : (
        <div className="hsk-preview-writing-area" />
      )}
      {typeDef && <p className="hsk-preview-type-hint">{typeDef.name} ({typeDef.id})</p>}
    </>
  );
}

export function HskQuestionEditPreview({ question, typeDef, embedded = false }: Props) {
  const inner = renderByType(question, typeDef);

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
        <div className="hsk-question-edit-preview-card">{inner}</div>
      </div>
    </div>
  );
}
