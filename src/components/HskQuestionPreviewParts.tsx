import { useCallback, useMemo, useState } from 'react';
import type { HskQuestionRow, HskSubQuestionPayload } from '../types/hskExams';
import { resolveL05SubQuestions } from '../utils/hskChoiceSubQuestions';
import { resolveL02SubQuestions } from '../utils/hskL02SubQuestions';
import { resolveR01Sentences } from '../utils/hskR01Match';
import {
  answerDisplayLabel,
  pairingsFromR02CorrectAnswer,
  resolveR02AnswerItems,
  resolveR02QuestionItems,
  type HskR02AnswerItem,
  type HskR02QuestionItem,
} from '../utils/hskR02Match';
import {
  resolveR03SentenceBlanks,
  resolveR03WordItems,
  pairingsFromR03Data,
  wordDisplayLabel,
} from '../utils/hskR03WordFill';
import {
  parseR04CorrectOrder,
  resolveR04Segments,
  shuffleSegmentsForPreview,
} from '../utils/hskR04SentenceSort';
import {
  resolveR05Content,
  tokenizeR05Paragraph,
} from '../utils/hskR05ParagraphFill';
import { splitPinyinWord } from '../utils/pinyinUtils';
import {
  resolveR06BlankPreviewLabel,
  resolveR06BlankPreviewPinyin,
  resolveR06Content,
  type HskR06Blank,
} from '../utils/hskR06Cloze';
import {
  formatR07SubDisplayId,
  resolveR07Content,
} from '../utils/hskR07Reading';
import { looksLikeRichArticleHtml } from '../utils/hskRichArticleHtml';
import {
  JUDGMENT_TF_OPTIONS,
  judgmentPreviewHint,
  resolveJudgmentContent,
  resolvePreviewStem,
} from '../utils/hskJudgmentQuestions';
import { resolveR09Options, resolveR09SubItems, parseR09Dialogue, sliceR09DialoguePinyinByLines, flattenR09DialogueLines, type R09DialogueToken } from '../utils/hskR09ImageWord';
import { resolveW01ComponentParts, resolveW01WordMatches } from '../utils/hskW01ComponentMatch';
import {
  resolveW02PinyinHints,
  resolveW02ShowFillFeedback,
} from '../utils/hskW02PinyinFill';
import { resolveW03Content } from '../utils/hskW03PictureSentence';
import { parseW04Keywords, resolveW04Content, countW04EssayChars, resolveW04WritingHint } from '../utils/hskW04TopicEssay';
import { PinyinRubyText } from './PinyinRubyText';
import { RichArticlePassagePreview } from './RichArticlePassagePreview';

export function resolveQuestionImageUrl(question: HskQuestionRow): string | undefined {
  const content = question.payload?.content as Record<string, unknown> | undefined;
  if (typeof content?.imageUrl === 'string' && content.imageUrl) return content.imageUrl;
  if (typeof content?.image === 'string' && content.image) return content.image;
  const fromRuntime = question.payload?.runtimeOptions?.find((o) => o.image)?.image;
  if (fromRuntime) return fromRuntime;
  const fromOption = (question.options ?? []).find((o) => o.image)?.image;
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

export function PreviewQuestionStem({
  question,
  className = 'hsk-preview-judgment-hint',
  textOverride,
}: {
  question: HskQuestionRow;
  className?: string;
  textOverride?: string;
}) {
  const showStemField = (question.payload?.content as { showStemField?: boolean } | undefined)?.showStemField;
  const text = textOverride !== undefined ? textOverride : resolvePreviewStem(question.stem, showStemField);
  if (!text) return null;
  return <div className={className}>{text}</div>;
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

/** L06 / R08 图片判断：提示 + 图片 + 判断句 + 对/错（对齐 HSK-Exams ExamRenderer） */
export function PreviewJudgmentImage({
  question,
  needsAudio,
  audioPending,
  audioTranscript,
}: {
  question: HskQuestionRow;
  needsAudio?: boolean;
  audioPending?: boolean;
  audioTranscript?: string;
}) {
  const { sentence, sentencePinyin } = resolveJudgmentContent(question);
  const imageUrl = resolveQuestionImageUrl(question);
  const imagePending = isImagePending(question);
  const hint = judgmentPreviewHint(
    question.type_id,
    question.stem,
    (question.payload?.content as { showStemField?: boolean } | undefined)?.showStemField,
  );
  const options =
    question.payload?.runtimeOptions?.filter((o) => o.key === 'A' || o.key === 'B') ??
    JUDGMENT_TF_OPTIONS;

  return (
    <>
      <PreviewQuestionStem question={question} textOverride={hint} />
      {needsAudio && (
        <PreviewAudioBar pending={!!audioPending} audioTranscript={audioTranscript || sentence} />
      )}
      <PreviewImageBox pending={imagePending} imageUrl={imageUrl} alt={sentence ? sentence : undefined} size="lg" />
      {(sentence || sentencePinyin) && (
        <div className="hsk-preview-judgment-sentence">
          {sentencePinyin && <div className="hsk-preview-judgment-sentence-pinyin">{sentencePinyin}</div>}
          {sentence && <div className="hsk-preview-judgment-sentence-text">{sentence}</div>}
        </div>
      )}
      <div className="hsk-preview-judgment-tf-grid">
        {options.map((opt) => {
          const isTrue = opt.key === 'A' || opt.text === '对';
          return (
            <div
              key={opt.key}
              className={`hsk-preview-judgment-tf-btn${isTrue ? ' is-true' : ' is-false'}`}
              aria-hidden
            >
              <span className="hsk-preview-judgment-tf-icon">{isTrue ? '✓' : '✗'}</span>
            </div>
          );
        })}
      </div>
    </>
  );
}

export function PreviewTextOptions({
  options,
  correctAnswer = '',
}: {
  options: Array<{ key: string; text: string; pinyin?: string }>;
  correctAnswer?: string;
}) {
  const correctKey = (correctAnswer ?? '').trim().toUpperCase();
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [resultText, setResultText] = useState('');

  const handleOptionClick = useCallback(
    (key: string) => {
      if (submitted) return;
      setSelectedKey((prev) => (prev === key ? null : key));
    },
    [submitted],
  );

  const handleSubmit = useCallback(() => {
    if (!selectedKey) return;
    const isCorrect = correctKey ? selectedKey === correctKey : false;
    setSubmitted(true);
    setResultText(
      isCorrect
        ? '回答正确'
        : correctKey
          ? `回答错误，正确答案为 ${correctKey}`
          : '已提交（未配置正确答案）',
    );
  }, [correctKey, selectedKey]);

  return (
    <>
      <div className="hsk-preview-text-options">
        {options.map((opt) => {
          const text = opt.text?.trim() || '';
          const pinyin = opt.pinyin?.trim() || '';
          const selected = selectedKey === opt.key;
          const rowClass = [
            'hsk-preview-text-option',
            'hsk-preview-text-option-btn',
            selected ? 'is-selected' : '',
            submitted && correctKey && opt.key === correctKey ? 'is-correct' : '',
            submitted && selected && correctKey && selectedKey !== correctKey ? 'is-wrong' : '',
          ]
            .filter(Boolean)
            .join(' ');
          const keyClass = [
            'hsk-preview-text-option-key',
            selected ? 'is-lit' : '',
            submitted && correctKey && opt.key === correctKey ? 'is-correct' : '',
            submitted && selected && correctKey && selectedKey !== correctKey ? 'is-wrong' : '',
          ]
            .filter(Boolean)
            .join(' ');

          return (
            <button
              key={opt.key}
              type="button"
              className={rowClass}
              onClick={() => handleOptionClick(opt.key)}
              disabled={submitted}
              aria-pressed={selected}
            >
              <span className={keyClass}>{opt.key}</span>
              {pinyin && text ? (
                <PinyinRubyText
                  text={text}
                  pinyin={pinyin}
                  className="hsk-preview-text-option-ruby"
                />
              ) : (
                <span className="hsk-preview-text-option-text">{text || `[选项${opt.key}]`}</span>
              )}
            </button>
          );
        })}
      </div>
      <PreviewSubmitBar
        canSubmit={Boolean(selectedKey)}
        submitted={submitted}
        resultText={resultText}
        onSubmit={handleSubmit}
      />
    </>
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

function PreviewSubmitBar({
  canSubmit,
  submitted,
  resultText,
  onSubmit,
}: {
  canSubmit: boolean;
  submitted: boolean;
  resultText?: string;
  onSubmit: () => void;
}) {
  return (
    <div className="hsk-preview-submit-wrap">
      {submitted && resultText && (
        <p className={`hsk-preview-submit-result${resultText.includes('正确') ? ' is-success' : ' is-error'}`}>
          {resultText}
        </p>
      )}
      <button
        type="button"
        className="hsk-preview-submit-btn"
        disabled={!canSubmit || submitted}
        onClick={onSubmit}
      >
        提交
      </button>
    </div>
  );
}

/** L01 听音选图：可点选 + 提交（对齐 HSK-Exams 答题流程） */
export function PreviewL01ImageChoice({
  question,
  audioPending,
  audioTranscript,
  imagePending,
}: {
  question: HskQuestionRow;
  audioPending: boolean;
  audioTranscript?: string;
  imagePending?: boolean;
}) {
  const options = normalizePreviewOptions(question);
  const correctKey = (question.correctAnswer ?? '').trim().toUpperCase().charAt(0) || 'A';
  const pending = imagePending ?? isImagePending(question);

  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [resultText, setResultText] = useState('');

  const handleOptionClick = useCallback(
    (key: string) => {
      if (submitted) return;
      setSelectedKey((prev) => (prev === key ? null : key));
    },
    [submitted],
  );

  const handleSubmit = useCallback(() => {
    if (!selectedKey) return;
    const isCorrect = selectedKey === correctKey;
    setSubmitted(true);
    setResultText(isCorrect ? '回答正确' : `回答错误，正确答案为 ${correctKey}`);
  }, [correctKey, selectedKey]);

  return (
    <>
      <PreviewQuestionStem question={question} />
      <PreviewAudioBar pending={audioPending} audioTranscript={audioTranscript} />
      <div className="hsk-preview-image-option-grid">
        {options.map((opt) => {
          const selected = selectedKey === opt.key;
          const cardClass = [
            'hsk-preview-image-option-card',
            'hsk-preview-image-option-btn',
            selected ? 'is-selected' : '',
            submitted && opt.key === correctKey ? 'is-correct' : '',
            submitted && selected && selectedKey !== correctKey ? 'is-wrong' : '',
          ]
            .filter(Boolean)
            .join(' ');
          return (
            <button
              key={opt.key}
              type="button"
              className={cardClass}
              onClick={() => handleOptionClick(opt.key)}
              disabled={submitted}
              aria-pressed={selected}
            >
              <span className="hsk-preview-image-option-label">{opt.key}</span>
              {opt.image ? (
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
            </button>
          );
        })}
      </div>
      <PreviewSubmitBar
        canSubmit={Boolean(selectedKey)}
        submitted={submitted}
        resultText={resultText}
        onSubmit={handleSubmit}
      />
    </>
  );
}

function normalizePreviewOptions(question: HskQuestionRow) {
  return (
    question.payload?.runtimeOptions?.map((o) => ({
      key: o.key,
      text: o.text,
      image: o.image,
    })) ??
    (question.options ?? []).map((o) => ({
      key: o.label,
      text: o.text,
      image: o.image,
    }))
  );
}

function l02SubKey(sub: HskSubQuestionPayload, index: number): string {
  return String(sub.id ?? index + 1);
}

/** L02 对话-图片匹配：子题列表 + 共享图片选项（对齐 HSK-Exams wh 渲染器） */
export function PreviewL02Match({
  question,
  audioPending,
  audioTranscript,
}: {
  question: HskQuestionRow;
  audioPending: boolean;
  audioTranscript?: string;
}) {
  const imageOptions = normalizePreviewOptions(question);
  const fallbackOptions =
    imageOptions.length >= 3
      ? imageOptions
      : [
          { key: 'A', text: '图', image: imageOptions[0]?.image },
          { key: 'B', text: '图', image: imageOptions[1]?.image },
          { key: 'C', text: '图', image: imageOptions[2]?.image },
        ];

  const subQuestions = resolveL02SubQuestions(
    question.payload?.subQuestions,
    question.correctAnswer,
    fallbackOptions,
  );

  const fixedExampleAnswers = useMemo(() => {
    const map: Record<string, string> = {};
    subQuestions.forEach((sub, idx) => {
      if (sub.isExample && sub.answer) {
        map[l02SubKey(sub, idx)] = sub.answer;
      }
    });
    return map;
  }, [subQuestions]);

  const scoringCount = subQuestions.filter((sub) => !sub.isExample).length;
  const hasExample = subQuestions.some((sub) => sub.isExample);

  const [selectedSubKey, setSelectedSubKey] = useState<string | null>(null);
  const [selectedImageKey, setSelectedImageKey] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [resultText, setResultText] = useState('');

  const effectiveAnswers = useMemo(
    () => ({ ...fixedExampleAnswers, ...answers }),
    [fixedExampleAnswers, answers],
  );

  const scoringSubs = useMemo(
    () =>
      subQuestions
        .map((sub, idx) => ({ sub, idx, subKey: l02SubKey(sub, idx) }))
        .filter(({ sub }) => !sub.isExample),
    [subQuestions],
  );

  const canSubmit =
    scoringSubs.length > 0 &&
    scoringSubs.every(({ subKey }) => Boolean(effectiveAnswers[subKey]));

  const handleSubmit = useCallback(() => {
    if (!canSubmit) return;
    const wrongCount = scoringSubs.filter(({ sub, subKey }) => {
      const expected = (sub.answer ?? '').trim().toUpperCase();
      const actual = (effectiveAnswers[subKey] ?? '').trim().toUpperCase();
      return expected && actual !== expected;
    }).length;
    setSubmitted(true);
    setSelectedSubKey(null);
    setSelectedImageKey(null);
    setResultText(
      wrongCount === 0
        ? '全部正确'
        : `${wrongCount} 题有误，请检查后重新作答`,
    );
  }, [canSubmit, effectiveAnswers, scoringSubs]);

  const imageToSub = useMemo(() => {
    const map: Record<string, string> = {};
    for (const [subKey, imageKey] of Object.entries(effectiveAnswers)) {
      if (imageKey) map[imageKey] = subKey;
    }
    return map;
  }, [effectiveAnswers]);

  const clearSubAnswer = useCallback((subKey: string) => {
    setAnswers((prev) => {
      if (!prev[subKey]) return prev;
      const next = { ...prev };
      delete next[subKey];
      return next;
    });
  }, []);

  const assignPair = useCallback((subKey: string, imageKey: string) => {
    setAnswers((prev) => {
      const next = { ...prev };
      for (const [key, value] of Object.entries(next)) {
        if (key !== subKey && value === imageKey) {
          delete next[key];
        }
      }
      next[subKey] = imageKey;
      return next;
    });
  }, []);

  const handleSubClick = useCallback(
    (subKey: string, isExample: boolean) => {
      if (submitted || isExample) return;
      if (answers[subKey]) {
        clearSubAnswer(subKey);
        setSelectedSubKey(null);
        setSelectedImageKey(null);
        return;
      }
      if (selectedSubKey === subKey) {
        setSelectedSubKey(null);
        return;
      }
      setSelectedSubKey(subKey);
      setSelectedImageKey(null);
    },
    [answers, clearSubAnswer, selectedSubKey, submitted],
  );

  const handleImageClick = useCallback(
    (imageKey: string) => {
      if (submitted) return;
      const exampleSubKey = imageToSub[imageKey];
      if (exampleSubKey && fixedExampleAnswers[exampleSubKey]) return;

      if (selectedSubKey) {
        assignPair(selectedSubKey, imageKey);
        setSelectedSubKey(null);
        setSelectedImageKey(null);
        return;
      }
      const pairedSubKey = imageToSub[imageKey];
      if (pairedSubKey && !fixedExampleAnswers[pairedSubKey]) {
        clearSubAnswer(pairedSubKey);
        setSelectedImageKey(null);
        return;
      }
      setSelectedImageKey((prev) => (prev === imageKey ? null : imageKey));
    },
    [assignPair, clearSubAnswer, fixedExampleAnswers, imageToSub, selectedSubKey, submitted],
  );

  let scoringIndex = 0;

  return (
    <>
      <PreviewQuestionStem question={question} />
      <PreviewAudioBar pending={audioPending} audioTranscript={audioTranscript} />
      <div className="hsk-preview-l02-range">
        {hasExample && scoringCount > 0
          ? `例如 · 第 1-${scoringCount} 题`
          : hasExample
            ? '例如'
            : `第 1-${subQuestions.length} 题`}
      </div>
      <div className="hsk-preview-l02-body">
        <div className="hsk-preview-l02-questions">
          {subQuestions.map((sub, idx) => {
            const subKey = l02SubKey(sub, idx);
            const isExample = !!sub.isExample;
            const displayIndex = isExample ? 0 : scoringIndex++;
            return (
              <PreviewL02QuestionRow
                key={`${subKey}-${idx}`}
                index={displayIndex}
                sub={sub}
                isExample={isExample}
                answerLabel={effectiveAnswers[subKey] ?? ''}
                selected={!isExample && selectedSubKey === subKey}
                matched={Boolean(effectiveAnswers[subKey])}
                onClick={() => handleSubClick(subKey, isExample)}
                disabled={isExample || submitted}
              />
            );
          })}
        </div>
        <div className="hsk-preview-l02-images">
          {fallbackOptions.map((opt) => {
            const matched = Boolean(imageToSub[opt.key]);
            const matchedToExample = matched && fixedExampleAnswers[imageToSub[opt.key] ?? ''];
            const selected = selectedImageKey === opt.key;
            return (
              <button
                key={opt.key}
                type="button"
                className={`hsk-preview-l02-image-card${matched ? ' is-matched' : ''}${matchedToExample ? ' is-example-match' : ''}${selected ? ' is-selected' : ''}`}
                onClick={() => handleImageClick(opt.key)}
                disabled={submitted}
              >
                <span className="hsk-preview-l02-image-label">{opt.key}</span>
                {opt.image ? (
                  <img src={opt.image} alt={opt.text || opt.key} className="hsk-preview-l02-image-img" />
                ) : (
                  <span className="hsk-preview-l02-image-placeholder">图</span>
                )}
              </button>
            );
          })}
        </div>
      </div>
      <PreviewSubmitBar
        canSubmit={canSubmit}
        submitted={submitted}
        resultText={resultText}
        onSubmit={handleSubmit}
      />
    </>
  );
}

function PreviewL02QuestionRow({
  index,
  sub,
  isExample,
  answerLabel,
  selected,
  matched,
  onClick,
  disabled,
}: {
  index: number;
  sub: HskSubQuestionPayload;
  isExample?: boolean;
  answerLabel: string;
  selected: boolean;
  matched: boolean;
  onClick: () => void;
  disabled?: boolean;
}) {
  const rowClass = [
    'hsk-preview-l02-question-row',
    isExample ? 'is-example' : '',
    selected ? 'is-selected' : '',
    matched ? 'is-matched' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button
      type="button"
      className={rowClass}
      onClick={onClick}
      disabled={disabled ?? isExample}
      aria-label={isExample ? '例题' : `第 ${index + 1} 题`}
    >
      {isExample ? (
        <span className="hsk-preview-l02-example-badge">例如</span>
      ) : (
        <span className="hsk-preview-l02-question-num">{index + 1}.</span>
      )}
      {sub.question?.trim() && (
        <span className="hsk-preview-l02-question-text">{sub.question.trim()}</span>
      )}
      <div className={`hsk-preview-l02-answer-slot${matched ? ' is-filled' : ''}${isExample ? ' is-example-filled' : ''}`}>
        {answerLabel || ''}
      </div>
    </button>
  );
}

/** R01 图文匹配：文字列表 + 图片网格（对齐 HSK-Exams rh 渲染器） */
export function PreviewR01Match({ question }: { question: HskQuestionRow }) {
  const imageOptions = normalizePreviewOptions(question);
  const fallbackOptions =
    imageOptions.length >= 3
      ? imageOptions
      : [
          { key: 'A', text: '图', image: imageOptions[0]?.image },
          { key: 'B', text: '图', image: imageOptions[1]?.image },
          { key: 'C', text: '图', image: imageOptions[2]?.image },
        ];

  const storedSentences = question.payload?.content?.sentences as
    | Array<{ key: string; text: string; pinyin?: string }>
    | undefined;
  const sentences = resolveR01Sentences(storedSentences, question.correctAnswer, fallbackOptions);
  const imagePending = isImagePending(question);

  const [selectedSentenceKey, setSelectedSentenceKey] = useState<string | null>(null);
  const [selectedImageKey, setSelectedImageKey] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});

  const imageToSentence = useMemo(() => {
    const map: Record<string, string> = {};
    for (const [sentenceKey, imageKey] of Object.entries(answers)) {
      if (imageKey) map[imageKey] = sentenceKey;
    }
    return map;
  }, [answers]);

  const clearSentenceAnswer = useCallback((sentenceKey: string) => {
    setAnswers((prev) => {
      if (!prev[sentenceKey]) return prev;
      const next = { ...prev };
      delete next[sentenceKey];
      return next;
    });
  }, []);

  const assignPair = useCallback((sentenceKey: string, imageKey: string) => {
    setAnswers((prev) => {
      const next = { ...prev };
      for (const [key, value] of Object.entries(next)) {
        if (key !== sentenceKey && value === imageKey) {
          delete next[key];
        }
      }
      next[sentenceKey] = imageKey;
      return next;
    });
  }, []);

  const handleSentenceClick = useCallback(
    (sentenceKey: string) => {
      if (answers[sentenceKey]) {
        clearSentenceAnswer(sentenceKey);
        setSelectedSentenceKey(null);
        setSelectedImageKey(null);
        return;
      }
      if (selectedSentenceKey === sentenceKey) {
        setSelectedSentenceKey(null);
        return;
      }
      setSelectedSentenceKey(sentenceKey);
      setSelectedImageKey(null);
    },
    [answers, clearSentenceAnswer, selectedSentenceKey],
  );

  const handleImageClick = useCallback(
    (imageKey: string) => {
      if (selectedSentenceKey) {
        assignPair(selectedSentenceKey, imageKey);
        setSelectedSentenceKey(null);
        setSelectedImageKey(null);
        return;
      }
      const pairedSentenceKey = imageToSentence[imageKey];
      if (pairedSentenceKey) {
        clearSentenceAnswer(pairedSentenceKey);
        setSelectedImageKey(null);
        return;
      }
      setSelectedImageKey((prev) => (prev === imageKey ? null : imageKey));
    },
    [assignPair, clearSentenceAnswer, imageToSentence, selectedSentenceKey],
  );

  return (
    <>
      <PreviewQuestionStem question={question} />
      <div className="hsk-preview-r01-body">
        <div className="hsk-preview-r01-text-col">
          <div className="hsk-preview-r01-col-title">文字</div>
          <div className="hsk-preview-r01-text-list">
            {sentences.map((sentence, idx) => {
              const matched = Boolean(answers[sentence.key]);
              const rowClass = [
                'hsk-preview-r01-text-row',
                selectedSentenceKey === sentence.key ? 'is-selected' : '',
                matched ? 'is-matched' : '',
              ]
                .filter(Boolean)
                .join(' ');
              return (
                <button
                  key={`${sentence.key}-${idx}`}
                  type="button"
                  className={rowClass}
                  onClick={() => handleSentenceClick(sentence.key)}
                >
                  <span className="hsk-preview-r01-text-num">{idx + 1}</span>
                  <div className="hsk-preview-r01-text-content">
                    <span>{sentence.text?.trim() || ''}</span>
                    {sentence.pinyin?.trim() && (
                      <span className="hsk-preview-r01-text-pinyin">{sentence.pinyin}</span>
                    )}
                  </div>
                  <div
                    className={`hsk-preview-r01-answer-slot${matched ? ' is-filled' : ''}`}
                    aria-hidden
                  >
                    {answers[sentence.key] || '?'}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="hsk-preview-r01-image-col">
          <div className="hsk-preview-r01-col-title">图片</div>
          <div className="hsk-preview-r01-image-grid">
            {fallbackOptions.map((opt) => {
              const pending = imagePending || !opt.image;
              const matched = Boolean(imageToSentence[opt.key]);
              const selected = selectedImageKey === opt.key;
              const cardClass = [
                'hsk-preview-r01-image-card',
                matched ? 'is-matched' : '',
                selected ? 'is-selected' : '',
              ]
                .filter(Boolean)
                .join(' ');
              return (
                <button
                  key={opt.key}
                  type="button"
                  className={cardClass}
                  onClick={() => handleImageClick(opt.key)}
                >
                  <span className="hsk-preview-r01-image-label">{opt.key}</span>
                  {opt.image && !pending ? (
                    <img src={opt.image} alt={opt.text || opt.key} className="hsk-preview-r01-image-img" />
                  ) : (
                    <div className="hsk-preview-r01-image-placeholder">
                      {pending && (
                        <span className="hsk-preview-status-badge is-inline">⏳ 待配图</span>
                      )}
                      <span className="hsk-preview-r01-image-placeholder-icon" aria-hidden>
                        图
                      </span>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}

/** R02 问答匹配：问题列表 + 回答列表（对齐 HSK-Exams ah 渲染器） */
export function PreviewR02Match({ question }: { question: HskQuestionRow }) {
  const content = question.payload?.content as
    | { questionItems?: HskR02QuestionItem[]; answerItems?: HskR02AnswerItem[] }
    | undefined;
  const questionItems = resolveR02QuestionItems(content?.questionItems, question.correctAnswer);
  const answerItems = resolveR02AnswerItems(
    content?.answerItems,
    question.correctAnswer,
    questionItems.length,
  );
  const editorPairings = pairingsFromR02CorrectAnswer(question.correctAnswer);

  const fixedExampleAnswers = useMemo(() => {
    const map: Record<string, string> = {};
    questionItems.forEach((item) => {
      if (item.isExample && editorPairings[item.id]) {
        map[item.id] = editorPairings[item.id];
      }
    });
    return map;
  }, [questionItems, editorPairings]);

  const scoringCount = questionItems.filter((item) => !item.isExample).length;
  const hasExample = questionItems.some((item) => item.isExample);

  const answerLabelById = useMemo(() => {
    const map: Record<string, string> = {};
    answerItems.forEach((item, idx) => {
      map[item.id] = answerDisplayLabel(item, idx);
    });
    return map;
  }, [answerItems]);

  const [selectedQuestionId, setSelectedQuestionId] = useState<string | null>(null);
  const [selectedAnswerId, setSelectedAnswerId] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});

  const effectiveAnswers = useMemo(
    () => ({ ...fixedExampleAnswers, ...answers }),
    [fixedExampleAnswers, answers],
  );

  const answerToQuestion = useMemo(() => {
    const map: Record<string, string> = {};
    for (const [questionId, answerId] of Object.entries(effectiveAnswers)) {
      if (answerId) map[answerId] = questionId;
    }
    return map;
  }, [effectiveAnswers]);

  const clearQuestionAnswer = useCallback((questionId: string) => {
    setAnswers((prev) => {
      if (!prev[questionId]) return prev;
      const next = { ...prev };
      delete next[questionId];
      return next;
    });
  }, []);

  const assignPair = useCallback((questionId: string, answerId: string) => {
    setAnswers((prev) => {
      const next = { ...prev };
      for (const [qId, aId] of Object.entries(next)) {
        if (qId !== questionId && aId === answerId) {
          delete next[qId];
        }
      }
      next[questionId] = answerId;
      return next;
    });
  }, []);

  const handleQuestionClick = useCallback(
    (questionId: string, isExample: boolean) => {
      if (isExample) return;
      if (answers[questionId]) {
        clearQuestionAnswer(questionId);
        setSelectedQuestionId(null);
        setSelectedAnswerId(null);
        return;
      }
      if (selectedQuestionId === questionId) {
        setSelectedQuestionId(null);
        return;
      }
      setSelectedQuestionId(questionId);
      setSelectedAnswerId(null);
    },
    [answers, clearQuestionAnswer, selectedQuestionId],
  );

  const handleAnswerClick = useCallback(
    (answerId: string, isDistractor: boolean) => {
      if (isDistractor) return;
      const exampleQuestionId = answerToQuestion[answerId];
      if (exampleQuestionId && fixedExampleAnswers[exampleQuestionId]) return;

      if (selectedQuestionId) {
        assignPair(selectedQuestionId, answerId);
        setSelectedQuestionId(null);
        setSelectedAnswerId(null);
        return;
      }
      const pairedQuestionId = answerToQuestion[answerId];
      if (pairedQuestionId && !fixedExampleAnswers[pairedQuestionId]) {
        clearQuestionAnswer(pairedQuestionId);
        setSelectedAnswerId(null);
        return;
      }
      setSelectedAnswerId((prev) => (prev === answerId ? null : answerId));
    },
    [
      answerToQuestion,
      assignPair,
      clearQuestionAnswer,
      fixedExampleAnswers,
      selectedQuestionId,
    ],
  );

  let scoringIndex = 0;

  return (
    <>
      <PreviewQuestionStem question={question} />
      {hasExample && (
        <div className="hsk-preview-r02-range">
          {scoringCount > 0 ? `例如 · 第 1-${scoringCount} 题` : '例如'}
        </div>
      )}
      <div className="hsk-preview-r01-body">
        <div className="hsk-preview-r01-text-col">
          <div className="hsk-preview-r01-col-title">问题</div>
          <div className="hsk-preview-r01-text-list">
            {questionItems.map((item, idx) => {
              const isExample = !!item.isExample;
              const displayIndex = isExample ? 0 : scoringIndex++;
              const matchedAnswerId = effectiveAnswers[item.id];
              const matchedLabel = matchedAnswerId ? answerLabelById[matchedAnswerId] ?? '?' : '?';
              const rowClass = [
                'hsk-preview-r01-text-row',
                'hsk-preview-r02-question-row',
                isExample ? 'is-example' : '',
                !isExample && selectedQuestionId === item.id ? 'is-selected' : '',
                matchedAnswerId ? 'is-matched' : '',
              ]
                .filter(Boolean)
                .join(' ');

              return (
                <button
                  key={`${item.id}-${idx}`}
                  type="button"
                  className={rowClass}
                  onClick={() => handleQuestionClick(item.id, isExample)}
                  disabled={isExample}
                  aria-label={isExample ? '例题' : `第 ${displayIndex + 1} 题`}
                >
                  {isExample ? (
                    <span className="hsk-preview-l02-example-badge">例如</span>
                  ) : (
                    <span className="hsk-preview-r01-text-num">{displayIndex + 1}</span>
                  )}
                  <div className="hsk-preview-r01-text-content">
                    {item.pinyin?.trim() ? (
                      <PinyinRubyText
                        text={item.text?.trim() || ''}
                        pinyin={item.pinyin}
                        className="hsk-preview-r02-ruby-line"
                      />
                    ) : (
                      <span>{item.text?.trim() || ''}</span>
                    )}
                  </div>
                  <div
                    className={`hsk-preview-r01-answer-slot${matchedAnswerId ? ' is-filled' : ''}${isExample ? ' is-example-filled' : ''}`}
                    aria-hidden
                  >
                    {matchedLabel}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="hsk-preview-r01-text-col">
          <div className="hsk-preview-r01-col-title">回答</div>
          <div className="hsk-preview-r02-answer-list">
            {answerItems.map((item, idx) => {
              const matched = Boolean(answerToQuestion[item.id]);
              const matchedToExample =
                matched && fixedExampleAnswers[answerToQuestion[item.id] ?? ''];
              const selected = selectedAnswerId === item.id;
              const isDistractor = !!item.isDistractor;
              const rowClass = [
                'hsk-preview-r02-answer-row',
                'hsk-preview-r02-answer-btn',
                matched ? 'is-matched' : '',
                matchedToExample ? 'is-example-match' : '',
                selected ? 'is-selected' : '',
                isDistractor ? 'is-distractor' : '',
              ]
                .filter(Boolean)
                .join(' ');

              return (
                <button
                  key={`${item.id}-${idx}`}
                  type="button"
                  className={rowClass}
                  onClick={() => handleAnswerClick(item.id, isDistractor)}
                  disabled={isDistractor}
                >
                  <span className="hsk-preview-r02-answer-label">{answerDisplayLabel(item, idx)}</span>
                  <div className="hsk-preview-r01-text-content">
                    {item.pinyin?.trim() ? (
                      <PinyinRubyText
                        text={item.text?.trim() || ''}
                        pinyin={item.pinyin}
                        className="hsk-preview-r02-ruby-line"
                      />
                    ) : (
                      <span>{item.text?.trim() || ''}</span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}

/** R03 选词填空：句子带空 + 词语池（对齐 HSK-Exams ExamRenderer） */
export function PreviewR03WordFill({ question }: { question: HskQuestionRow }) {
  const content = question.payload?.content as
    | {
        sentenceBlanks?: Array<{ id?: string; sentence?: string; answer?: string; pinyin?: string; isExample?: boolean }>;
        wordItems?: Array<{ id: string; text: string; pinyin?: string; isDistractor?: boolean }>;
        wordBank?: string[];
        pairings?: Record<string, string>;
      }
    | undefined;

  const sentenceBlanks = resolveR03SentenceBlanks(content?.sentenceBlanks, question.correctAnswer);
  const wordItems = resolveR03WordItems(
    content?.wordItems,
    question.payload?.runtimeOptions,
    question.options,
    content?.wordBank,
    question.correctAnswer,
    sentenceBlanks.length,
  );

  const editorPairings = pairingsFromR03Data(
    question.correctAnswer,
    sentenceBlanks,
    wordItems,
    content?.sentenceBlanks,
    content?.pairings,
  );

  const fixedExamplePairings = useMemo(() => {
    const map: Record<string, string> = {};
    sentenceBlanks.forEach((blank) => {
      if (blank.isExample && editorPairings[blank.id]) {
        map[blank.id] = editorPairings[blank.id];
      }
    });
    return map;
  }, [sentenceBlanks, editorPairings]);

  const scoringCount = sentenceBlanks.filter((blank) => !blank.isExample).length;
  const hasExample = sentenceBlanks.some((blank) => blank.isExample);

  const [activeBlankId, setActiveBlankId] = useState<string | null>(null);
  const [userPairings, setUserPairings] = useState<Record<string, string>>({});

  const effectivePairings = useMemo(
    () => ({ ...fixedExamplePairings, ...userPairings }),
    [fixedExamplePairings, userPairings],
  );

  const usedWordIds = useMemo(
    () => new Set(Object.values(effectivePairings)),
    [effectivePairings],
  );

  const handleBlankClick = useCallback(
    (blankId: string, isExample: boolean) => {
      if (isExample) return;
      if (userPairings[blankId]) {
        setUserPairings((prev) => {
          const next = { ...prev };
          delete next[blankId];
          return next;
        });
        setActiveBlankId(blankId);
        return;
      }
      setActiveBlankId((prev) => (prev === blankId ? null : blankId));
    },
    [userPairings],
  );

  const handleWordClick = useCallback(
    (wordId: string, isDistractor: boolean) => {
      if (isDistractor) return;

      const exampleBlankId = Object.entries(fixedExamplePairings).find(
        ([, id]) => id === wordId,
      )?.[0];
      if (exampleBlankId) return;

      const assignedEntry = Object.entries(userPairings).find(([, id]) => id === wordId);
      if (assignedEntry) {
        const [assignedBlankId] = assignedEntry;
        setUserPairings((prev) => {
          const next = { ...prev };
          delete next[assignedBlankId];
          return next;
        });
        setActiveBlankId(assignedBlankId);
        return;
      }
      if (activeBlankId !== null) {
        setUserPairings((prev) => ({ ...prev, [activeBlankId]: wordId }));
        setActiveBlankId(null);
      }
    },
    [activeBlankId, fixedExamplePairings, userPairings],
  );

  const activeScoringIndex = useMemo(() => {
    if (!activeBlankId) return -1;
    let idx = 0;
    for (const blank of sentenceBlanks) {
      if (blank.isExample) continue;
      if (blank.id === activeBlankId) return idx + 1;
      idx++;
    }
    return -1;
  }, [activeBlankId, sentenceBlanks]);

  let scoringIndex = 0;

  return (
    <>
      <PreviewQuestionStem question={question} />
      {hasExample && (
        <div className="hsk-preview-r02-range">
          {scoringCount > 0 ? `例如 · 第 1-${scoringCount} 题` : '例如'}
        </div>
      )}
      <div className="hsk-preview-r03-sentences">
        {sentenceBlanks.map((blank, idx) => {
          const isExample = !!blank.isExample;
          const displayIndex = isExample ? 0 : scoringIndex++;
          const wordId = effectivePairings[blank.id];
          const word = wordId ? wordItems.find((item) => item.id === wordId) : undefined;
          const filledText = word?.text?.trim();
          const rowClass = [
            'hsk-preview-r03-sentence-row',
            isExample ? 'is-example' : 'hsk-preview-r03-sentence-row-btn',
            !isExample && activeBlankId === blank.id ? 'is-selected' : '',
            !isExample && filledText ? 'is-matched' : '',
          ]
            .filter(Boolean)
            .join(' ');
          const rowBody = (
            <>
              {isExample ? (
                <span className="hsk-preview-l02-example-badge">例如</span>
              ) : (
                <span className="hsk-preview-r03-sentence-num">{displayIndex + 1}.</span>
              )}
              <div className="hsk-preview-r03-sentence-content">
                <PreviewR03SentenceBody
                  sentence={blank.sentence}
                  pinyin={blank.pinyin ?? ''}
                  filledText={filledText}
                  isActive={!isExample && activeBlankId === blank.id}
                  isExample={isExample}
                />
              </div>
            </>
          );
          return isExample ? (
            <div key={`${blank.id}-${idx}`} className={rowClass}>
              {rowBody}
            </div>
          ) : (
            <button
              key={`${blank.id}-${idx}`}
              type="button"
              className={rowClass}
              onClick={() => handleBlankClick(blank.id, false)}
              aria-label={`第 ${displayIndex + 1} 句${filledText ? `，已填 ${filledText}` : '，点击选中'}`}
            >
              {rowBody}
            </button>
          );
        })}
      </div>
      <div className="hsk-preview-r03-word-pool">
        <div className="hsk-preview-r03-word-pool-title">请选择词语填入上方句子中：</div>
        <p className="hsk-preview-r03-hint">
          {activeScoringIndex >= 0
            ? `第 ${activeScoringIndex} 句已选中，点击下方词语填入`
            : '点击句子选中，再点击词语填入；点击已填词语可取消'}
        </p>
        <div className="hsk-preview-r03-word-chips">
          {wordItems.map((item, idx) => {
            const used = usedWordIds.has(item.id);
            const usedByExample = Object.values(fixedExamplePairings).includes(item.id);
            const isDistractor = !!item.isDistractor;
            const chipClass = [
              'hsk-preview-r03-word-chip',
              used ? 'is-used' : '',
              usedByExample ? 'is-example-match' : '',
              !used && !isDistractor && activeBlankId !== null ? 'is-available' : '',
              isDistractor ? 'is-distractor' : '',
            ]
              .filter(Boolean)
              .join(' ');
            return (
              <button
                key={`${item.id}-${idx}`}
                type="button"
                className={chipClass}
                onClick={() => handleWordClick(item.id, isDistractor)}
                disabled={usedByExample || isDistractor}
              >
                {item.pinyin?.trim() && (
                  <span className="hsk-preview-r03-word-chip-pinyin">{item.pinyin}</span>
                )}
                <span className="hsk-preview-r03-word-chip-text">
                  {item.text?.trim() || wordDisplayLabel(item, idx)}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
}

/** R04 句子排序：句子卡片 + 排序槽位（对齐原型 preview_content） */
export function PreviewR04Sort({ question }: { question: HskQuestionRow }) {
  const content = question.payload?.content as
    | { segments?: Array<{ id?: string; key?: string; text?: string; pinyin?: string }>; sentences?: Array<{ key?: string; text?: string; pinyin?: string }> }
    | undefined;
  const segments = resolveR04Segments(content?.segments ?? content?.sentences, question.correctAnswer);
  const shuffled = shuffleSegmentsForPreview(segments);
  const slotCount = Math.max(parseR04CorrectOrder(question.correctAnswer).length, segments.length);

  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [slotAssignments, setSlotAssignments] = useState<string[]>(() =>
    Array.from({ length: slotCount }, () => ''),
  );

  const usedKeys = useMemo(
    () => new Set(slotAssignments.filter(Boolean)),
    [slotAssignments],
  );

  const clearKeyFromSlots = useCallback((key: string) => {
    setSlotAssignments((prev) => prev.map((value) => (value === key ? '' : value)));
  }, []);

  const handleSentenceClick = useCallback(
    (key: string) => {
      if (usedKeys.has(key)) {
        clearKeyFromSlots(key);
        setSelectedKey(null);
        return;
      }
      if (selectedKey === key) {
        setSelectedKey(null);
        return;
      }
      setSelectedKey(key);
    },
    [clearKeyFromSlots, selectedKey, usedKeys],
  );

  const handleSlotClick = useCallback(
    (slotIndex: number) => {
      if (selectedKey) {
        setSlotAssignments((prev) => {
          const next = prev.map((value) => (value === selectedKey ? '' : value));
          next[slotIndex] = selectedKey;
          return next;
        });
        setSelectedKey(null);
        return;
      }
      if (slotAssignments[slotIndex]) {
        setSlotAssignments((prev) => {
          const next = [...prev];
          next[slotIndex] = '';
          return next;
        });
      }
    },
    [selectedKey, slotAssignments],
  );

  return (
    <>
      <PreviewQuestionStem question={question} />
      <div className="hsk-preview-r04-sort-list">
        {shuffled.map((segment) => {
          const used = usedKeys.has(segment.key);
          const selected = selectedKey === segment.key;
          const cardClass = [
            'hsk-preview-r04-sort-card',
            selected ? 'is-selected' : '',
            used ? 'is-used' : '',
          ]
            .filter(Boolean)
            .join(' ');
          const displayText =
            segment.text?.trim() || `段落 ${segment.key} 的内容...`;
          return (
            <button
              key={segment.id}
              type="button"
              className={cardClass}
              onClick={() => handleSentenceClick(segment.key)}
            >
              <span className="hsk-preview-r04-letter-badge">{segment.key}</span>
              <span className="hsk-preview-r04-card-text">
                {displayText}
                {segment.pinyin?.trim() && (
                  <span className="hsk-preview-r04-card-pinyin">{segment.pinyin}</span>
                )}
              </span>
            </button>
          );
        })}
      </div>

      <p className="hsk-preview-r04-slot-hint">点击句子，再点击下方选项框进行配对：</p>
      <div className="hsk-preview-r04-slots-row">
        {Array.from({ length: slotCount }, (_, idx) => {
          const value = slotAssignments[idx] ?? '';
          const slotClass = [
            'hsk-preview-r04-sort-slot',
            value ? 'is-filled' : '',
            selectedKey && !value ? 'is-target' : '',
          ]
            .filter(Boolean)
            .join(' ');
          return (
            <span key={`slot-wrap-${idx}`} className="hsk-preview-r04-slot-wrap">
              {idx > 0 && (
                <span className="hsk-preview-r04-slot-arrow" aria-hidden>
                  →
                </span>
              )}
              <button type="button" className={slotClass} onClick={() => handleSlotClick(idx)}>
                <span className="hsk-preview-r04-sort-slot-num">{idx + 1}</span>
                <span className="hsk-preview-r04-sort-slot-value">{value || '?'}</span>
              </button>
            </span>
          );
        })}
      </div>

      <div className="hsk-preview-r04-submit-wrap">
        <button type="button" className="hsk-preview-r04-submit-btn" disabled>
          提交
        </button>
      </div>
    </>
  );
}

// ─── 词级 ruby 渲染工具 ──────────────────────────────────────────────────────

const HAN_RE_CHAR = /[\u4e00-\u9fff]/;

type PinyinRenderItem =
  | { kind: 'word-ruby'; key: string; pinyin: string; chars: string[] }
  | { kind: 'plain'; key: string; char: string }
  | { kind: 'blank-r03'; key: string; embeddedPinyin?: string }
  | { kind: 'blank-r05'; key: string; blankIndex: number; embeddedPinyin?: string }
  | { kind: 'blank-r06'; key: string; blankIndex: number; embeddedPinyin?: string };

/**
 * 将 paragraph tokens + 词级拼音 组合成可渲染的 PinyinRenderItem 列表。
 * 支持词级连写（xiaoyu → 小雨一组）和字级分写（xiao yu → 逐字），以及混合格式。
 */
function buildPinyinRenderItems(
  tokens: ReturnType<typeof tokenizeR05Paragraph>,
  pinyinInput: string,
  blankKind: 'r03' | 'r05' | 'r06' = 'r05',
): PinyinRenderItem[] {
  const pinyinWords = pinyinInput?.trim()
    ? pinyinInput.trim().split(/\s+/).filter(Boolean)
    : [];
  const wordCharCounts = pinyinWords.map((w) => splitPinyinWord(w).length);

  const items: PinyinRenderItem[] = [];
  let wordIdx = 0;
  let counter = 0;

  for (const token of tokens) {
    if (token.type === 'blank') {
      if (blankKind === 'r03') {
        items.push({
          kind: 'blank-r03',
          key: `bl-${counter++}`,
          embeddedPinyin: token.embeddedPinyin,
        });
      } else if (blankKind === 'r06') {
        items.push({
          kind: 'blank-r06',
          key: `bl-${token.index}`,
          blankIndex: token.index,
          embeddedPinyin: token.embeddedPinyin,
        });
      } else {
        items.push({
          kind: 'blank-r05',
          key: `bl-${token.index}`,
          blankIndex: token.index,
          embeddedPinyin: token.embeddedPinyin,
        });
      }
      continue;
    }

    const chars = [...token.text];
    let i = 0;

    while (i < chars.length) {
      const ch = chars[i];

      if (!HAN_RE_CHAR.test(ch)) {
        items.push({ kind: 'plain', key: `p-${counter++}`, char: ch });
        i++;
        continue;
      }

      // Han 字：分配到当前拼音词
      if (!pinyinWords.length || wordIdx >= pinyinWords.length) {
        items.push({ kind: 'word-ruby', key: `w-${counter++}`, pinyin: '', chars: [ch] });
        i++;
        continue;
      }

      const wordPinyin = pinyinWords[wordIdx];
      const wordCharCount = wordCharCounts[wordIdx];

      if (wordCharCount <= 1) {
        // 单字词：单字 ruby
        items.push({ kind: 'word-ruby', key: `w-${counter++}`, pinyin: wordPinyin, chars: [ch] });
        wordIdx++;
        i++;
      } else {
        // 多字词：收集 wordCharCount 个汉字（含其间的非汉字）
        const groupChars: string[] = [ch];
        let hanCount = 1;
        let j = i + 1;
        while (hanCount < wordCharCount && j < chars.length) {
          const c = chars[j];
          groupChars.push(c);
          if (HAN_RE_CHAR.test(c)) hanCount++;
          j++;
        }
        items.push({ kind: 'word-ruby', key: `w-${counter++}`, pinyin: wordPinyin, chars: groupChars });
        wordIdx++;
        i = j;
      }
    }
  }

  return items;
}

/** 渲染单个词级 ruby 条目（单字或多字词，有/无拼音均可） */
function RubyWordItem({ pinyin, chars }: { pinyin: string; chars: string[] }) {
  const hanCount = chars.filter((c) => HAN_RE_CHAR.test(c)).length;
  if (!pinyin) {
    return <span className="hsk-preview-r05-plain-ch">{chars.join('')}</span>;
  }
  if (hanCount <= 1) {
    return (
      <span className="hsk-preview-r05-ruby-unit">
        <span className="hsk-preview-r05-ruby-py">{pinyin}</span>
        <span className="hsk-preview-r05-ruby-ch">{chars[0]}</span>
      </span>
    );
  }
  return (
    <span className="hsk-preview-r05-word-ruby-wrap">
      <span className="hsk-preview-r05-word-ruby-py">{pinyin}</span>
      <span className="hsk-preview-r05-word-ruby-chars">{chars.join('')}</span>
    </span>
  );
}

/** 选项按钮：A. + word-ruby（整词拼音在上，如 xiaoyu ↔ 小雨） */
function PreviewOptionWordRuby({
  optionKey,
  text,
  pinyin,
}: {
  optionKey: string;
  text?: string;
  pinyin?: string;
}) {
  const han = text?.trim() ?? '';
  const py = pinyin?.trim() ?? '';
  if (!han) {
    return <span className="hsk-preview-option-key-label">{optionKey}.</span>;
  }
  return (
    <span className="hsk-preview-option-ruby-row">
      <span className="hsk-preview-option-key">{optionKey}.</span>
      {py ? (
        <RubyWordItem pinyin={py} chars={[...han]} />
      ) : (
        <span className="hsk-preview-option-text">{han}</span>
      )}
    </span>
  );
}

/** R03 每句至少一个可填空白（无（）时句末补默认空） */
function ensureR03SentenceTokens(tokens: ReturnType<typeof tokenizeR05Paragraph>) {
  if (tokens.some((token) => token.type === 'blank')) return tokens;
  if (tokens.length === 0) return [{ type: 'blank' as const, index: 1 }];
  return [...tokens, { type: 'blank' as const, index: 1 }];
}

/** R03 单句正文：词级 ruby + 填空位（与 R05 相同分词逻辑） */
function PreviewR03SentenceBody({
  sentence,
  pinyin,
  filledText,
  isActive,
  isExample,
}: {
  sentence: string;
  pinyin: string;
  filledText?: string;
  isActive?: boolean;
  isExample?: boolean;
}) {
  const tokens = ensureR03SentenceTokens(tokenizeR05Paragraph(sentence));
  const items = buildPinyinRenderItems(tokens, pinyin, 'r03');
  const filledClass = [
    'hsk-preview-r03-filled',
    isActive ? 'is-active' : '',
    isExample ? 'is-example-filled' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className="hsk-preview-r03-sentence-text">
      {items.map((item) => {
        if (item.kind === 'plain') {
          return (
            <span key={item.key} className="hsk-preview-r05-plain-ch">
              {item.char}
            </span>
          );
        }

        if (item.kind === 'blank-r03') {
          if (filledText?.trim()) {
            return (
              <span
                key={item.key}
                className={filledClass}
                aria-hidden
              >
                {filledText.trim()}
              </span>
            );
          }
          const py = item.embeddedPinyin?.trim();
          const blankClass = ['hsk-preview-r03-blank', isActive ? 'is-active' : '']
            .filter(Boolean)
            .join(' ');
          return (
            <span key={item.key} className="hsk-preview-r05-blank-wrap">
              {py && <span className="hsk-preview-r05-blank-py">{py}</span>}
              <span className={blankClass} aria-hidden>
                &nbsp;
              </span>
            </span>
          );
        }

        if (item.kind === 'word-ruby') {
          return <RubyWordItem key={item.key} pinyin={item.pinyin} chars={item.chars} />;
        }

        return null;
      })}
    </div>
  );
}

// ─── R05 段落正文 ─────────────────────────────────────────────────────────────

/** R05 段落正文：词级 ruby 分组（支持词级连写或字级分写拼音输入） */
function PreviewR05ParagraphBody({
  paragraph,
  paragraphPinyin,
  blankPinyins,
  wordBank,
  userAnswers,
  activeBlankIndex,
  onBlankClick,
}: {
  paragraph: string;
  paragraphPinyin: string;
  blankPinyins: Record<number, string>;
  wordBank?: Array<{ key: string; text: string }>;
  userAnswers?: Record<number, string>;
  activeBlankIndex?: number | null;
  onBlankClick?: (blankIndex: number) => void;
}) {
  const tokens = tokenizeR05Paragraph(paragraph);
  const items = buildPinyinRenderItems(tokens, paragraphPinyin, 'r05');

  return (
    <div className="hsk-preview-r05-passage-text" style={{ textIndent: '2em' }}>
      {items.map((item) => {
        if (item.kind === 'plain') {
          return <span key={item.key} className="hsk-preview-r05-plain-ch">{item.char}</span>;
        }

        if (item.kind === 'blank-r05') {
          const answerKey = userAnswers?.[item.blankIndex];
          const filledWord = answerKey ? wordBank?.find((w) => w.key === answerKey) : undefined;
          const filled = Boolean(filledWord);
          const py = filled
            ? ''
            : (blankPinyins[item.blankIndex]?.trim() || item.embeddedPinyin?.trim());
          const active = activeBlankIndex === item.blankIndex;
          const blankClass = [
            'hsk-preview-r05-blank',
            filled ? 'is-filled' : '',
            active ? 'is-active' : '',
          ]
            .filter(Boolean)
            .join(' ');
          return (
            <span key={item.key} className="hsk-preview-r05-blank-wrap">
              {py && <span className="hsk-preview-r05-blank-py">{py}</span>}
              <button
                type="button"
                className={blankClass}
                onClick={() => onBlankClick?.(item.blankIndex)}
                aria-label={`第 ${item.blankIndex} 空${filled ? `，已选 ${filledWord?.text}` : ''}`}
              >
                {filled ? filledWord!.text : `（${item.blankIndex}）`}
              </button>
            </span>
          );
        }

        // word-ruby (kind === 'blank-r05' 不会出现在 r05 模式外，已在上方判断)
        if (item.kind === 'word-ruby') {
          return <RubyWordItem key={item.key} pinyin={item.pinyin} chars={item.chars} />;
        }

        return null;
      })}
    </div>
  );
}

/** R05 段落填空：阅读材料 + 全局词库（对齐 HSK-Exams ExamRenderer） */
export function PreviewR05ParagraphFill({ question }: { question: HskQuestionRow }) {
  const content = question.payload?.content as
    | {
        paragraph?: string;
        paragraphPinyin?: string;
        wordBank?: Array<{ key: string; text: string; pinyin?: string }>;
        blanks?: Array<{ index?: number; answer?: string; options?: Array<{ key?: string; text?: string }> }>;
        blankPinyins?: Record<number | string, string>;
      }
    | undefined;
  const resolved = resolveR05Content(content, question.correctAnswer);
  const imageUrl = resolveQuestionImageUrl(question);

  const [activeBlankIndex, setActiveBlankIndex] = useState<number | null>(null);
  const [userAnswers, setUserAnswers] = useState<Record<number, string>>({});

  const usedKeys = useMemo(() => new Set(Object.values(userAnswers)), [userAnswers]);

  const handleBlankClick = useCallback(
    (blankIndex: number) => {
      if (userAnswers[blankIndex]) {
        setUserAnswers((prev) => {
          const next = { ...prev };
          delete next[blankIndex];
          return next;
        });
        setActiveBlankIndex(blankIndex);
        return;
      }
      setActiveBlankIndex((prev) => (prev === blankIndex ? null : blankIndex));
    },
    [userAnswers],
  );

  const handleWordClick = useCallback(
    (optionKey: string) => {
      const assignedEntry = Object.entries(userAnswers).find(([, k]) => k === optionKey);
      if (assignedEntry) {
        const assignedBlank = Number(assignedEntry[0]);
        setUserAnswers((prev) => {
          const next = { ...prev };
          delete next[assignedBlank];
          return next;
        });
        setActiveBlankIndex(assignedBlank);
        return;
      }
      if (activeBlankIndex !== null) {
        setUserAnswers((prev) => ({ ...prev, [activeBlankIndex]: optionKey }));
        setActiveBlankIndex(null);
      }
    },
    [userAnswers, activeBlankIndex],
  );

  return (
    <>
      <PreviewQuestionStem question={question} />
      <div className="hsk-preview-r05-passage">
        <div className="hsk-preview-r05-section-title">📄 阅读材料</div>
        {imageUrl && (
          <div className="hsk-preview-r05-image-wrap">
            <img src={imageUrl} alt="" className="hsk-preview-r05-image" />
          </div>
        )}
        {resolved.paragraph.trim() ? (
          <PreviewR05ParagraphBody
            paragraph={resolved.paragraph}
            paragraphPinyin={resolved.paragraphPinyin}
            blankPinyins={resolved.blankPinyins}
            wordBank={resolved.wordBank}
            userAnswers={userAnswers}
            activeBlankIndex={activeBlankIndex}
            onBlankClick={handleBlankClick}
          />
        ) : (
          <p className="hsk-preview-r05-passage-empty">暂无段落内容</p>
        )}
      </div>

      <div className="hsk-preview-r05-word-bank">
        <div className="hsk-preview-r05-section-title">📚 全局词库 (Word Bank)</div>
        <p className="hsk-preview-r05-hint">
          {activeBlankIndex !== null
            ? `第 ${activeBlankIndex} 空已选中，点击下方词语填入`
            : '点击段落中的空白选中，再点击词语填入；点击已填词语可取消'}
        </p>
        <div className="hsk-preview-r05-word-list">
          {resolved.wordBank.map((option) => {
            const used = usedKeys.has(option.key);
            const itemClass = [
              'hsk-preview-r05-word-item',
              used ? 'is-used' : '',
              !used && activeBlankIndex !== null ? 'is-available' : '',
            ]
              .filter(Boolean)
              .join(' ');
            return (
              <button
                key={option.key}
                type="button"
                className={itemClass}
                onClick={() => handleWordClick(option.key)}
              >
                <PreviewOptionWordRuby
                  optionKey={option.key}
                  text={option.text}
                  pinyin={option.pinyin}
                />
              </button>
            );
          })}
        </div>
      </div>

      <div className="hsk-preview-r04-submit-wrap">
        <button type="button" className="hsk-preview-r04-submit-btn" disabled>
          提交
        </button>
      </div>
    </>
  );
}

/** R06 文章正文：词级 ruby 分组（支持词级连写或字级分写拼音输入） */
function PreviewR06ArticleBody({
  article,
  articlePinyin,
  blanks,
  answers,
  activeBlankIndex,
  onBlankClick,
}: {
  article: string;
  articlePinyin: string;
  blanks: HskR06Blank[];
  answers: Record<number, string>;
  activeBlankIndex: number | null;
  onBlankClick: (blankIndex: number) => void;
}) {
  const tokens = tokenizeR05Paragraph(article);
  const items = buildPinyinRenderItems(tokens, articlePinyin, 'r06');

  return (
    <div className="hsk-preview-r06-passage-text" style={{ textIndent: '2em' }}>
      {items.map((item) => {
        if (item.kind === 'plain') {
          return <span key={item.key} className="hsk-preview-r05-plain-ch">{item.char}</span>;
        }

        if (item.kind === 'blank-r06') {
          const blank = blanks.find((b) => b.index === item.blankIndex);
          const answerKey = answers[item.blankIndex];
          const filled = Boolean(answerKey);
          const display = resolveR06BlankPreviewLabel(blank, item.blankIndex, answerKey);
          const py = resolveR06BlankPreviewPinyin(
            blank,
            item.blankIndex,
            answerKey,
            item.embeddedPinyin,
          );
          const blankClass = [
            'hsk-preview-r06-blank',
            filled ? 'is-filled' : '',
            activeBlankIndex === item.blankIndex ? 'is-active' : '',
          ]
            .filter(Boolean)
            .join(' ');
          return (
            <span key={item.key} className="hsk-preview-r05-blank-wrap">
              {py && <span className="hsk-preview-r05-blank-py">{py}</span>}
              <button
                type="button"
                className={blankClass}
                onClick={() => onBlankClick(item.blankIndex)}
                aria-label={`第 ${item.blankIndex} 空${filled ? `，已选 ${display}` : ''}`}
              >
                {display}
              </button>
            </span>
          );
        }

        // word-ruby (kind === 'blank-r05' won't appear in r06 mode, but handle gracefully)
        if (item.kind === 'word-ruby') {
          return <RubyWordItem key={item.key} pinyin={item.pinyin} chars={item.chars} />;
        }

        return null;
      })}
    </div>
  );
}

/** R06 完形填空：阅读材料 + 分空选项（对齐 HSK-Exams ExamRenderer ch） */
export function PreviewR06Cloze({ question }: { question: HskQuestionRow }) {
  const content = question.payload?.content as
    | {
        article?: string;
        articlePinyin?: string;
        paragraph?: string;
        blankPinyins?: Record<number | string, string>;
        blanks?: Array<{
          index: number;
          answer?: string;
          options?: Array<{ key?: string; text?: string; pinyin?: string }>;
        }>;
      }
    | undefined;
  const resolved = resolveR06Content(
    content as Parameters<typeof resolveR06Content>[0],
    question.correctAnswer,
  );

  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [activeBlankIndex, setActiveBlankIndex] = useState<number | null>(null);

  const handleBlankClick = useCallback(
    (blankIndex: number) => {
      if (answers[blankIndex]) {
        setAnswers((prev) => {
          const next = { ...prev };
          delete next[blankIndex];
          return next;
        });
        setActiveBlankIndex(blankIndex);
        return;
      }
      setActiveBlankIndex((prev) => (prev === blankIndex ? null : blankIndex));
    },
    [answers],
  );

  const handleOptionClick = useCallback((blankIndex: number, optionKey: string) => {
    setAnswers((prev) => {
      if (prev[blankIndex] === optionKey) {
        const next = { ...prev };
        delete next[blankIndex];
        return next;
      }
      return { ...prev, [blankIndex]: optionKey };
    });
    setActiveBlankIndex(null);
  }, []);

  return (
    <>
      <PreviewQuestionStem question={question} />
      <div className="hsk-preview-r06-panel">
        <div className="hsk-preview-r06-passage">
          <div className="hsk-preview-r05-section-title">📄 阅读材料</div>
          {resolved.article.trim() ? (
            <PreviewR06ArticleBody
              article={resolved.article}
              articlePinyin={resolved.articlePinyin}
              blanks={resolved.blanks}
              answers={answers}
              activeBlankIndex={activeBlankIndex}
              onBlankClick={handleBlankClick}
            />
          ) : (
            <p className="hsk-preview-r05-passage-empty">暂无文章内容</p>
          )}
        </div>

        <div className="hsk-preview-r06-choices">
          <div className="hsk-preview-r05-section-title">✏️ 选择填空</div>
          <p className="hsk-preview-r06-hint">点击下方选项填入文章中的对应空白；再次点击可取消</p>
          {resolved.blanks.map((blank, idx) => {
            const blockActive = activeBlankIndex === blank.index;
            const blockClass = [
              'hsk-preview-r06-choice-block',
              blockActive ? 'is-active' : '',
            ]
              .filter(Boolean)
              .join(' ');
            return (
              <div key={`${blank.index}-${idx}`} className={blockClass}>
                <div className="hsk-preview-r06-choice-title">{idx + 1}.</div>
                <div className="hsk-preview-r06-choice-grid">
                  {blank.options.map((option) => {
                    const selected = answers[blank.index] === option.key;
                    const itemClass = [
                      'hsk-preview-r06-choice-item',
                      selected ? 'is-selected' : '',
                    ]
                      .filter(Boolean)
                      .join(' ');
                    return (
                      <button
                        key={option.key}
                        type="button"
                        className={itemClass}
                        onClick={() => handleOptionClick(blank.index, option.key)}
                      >
                        <PreviewOptionWordRuby
                          optionKey={option.key}
                          text={option.text}
                          pinyin={option.pinyin}
                        />
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        <div className="hsk-preview-r06-submit-wrap">
          <button type="button" className="hsk-preview-r04-submit-btn" disabled>
            提交
          </button>
        </div>
      </div>
    </>
  );
}

function r07SubKey(sub: HskSubQuestionPayload, index: number): string {
  return String(sub.id ?? index + 1);
}

function PreviewR07SubQuestionRow({
  index,
  sub,
  selectedKey,
  submitted,
  onSelect,
}: {
  index: number;
  sub: HskSubQuestionPayload;
  selectedKey: string;
  submitted: boolean;
  onSelect: (optionKey: string) => void;
}) {
  const stem = sub.question?.trim() ?? '';
  const correctKey = (sub.answer ?? '').trim().toUpperCase();
  const options =
    sub.options && sub.options.length >= 2
      ? sub.options
      : [
          { key: 'A', text: '' },
          { key: 'B', text: '' },
          { key: 'C', text: '' },
          { key: 'D', text: '' },
        ];

  const slotClass = [
    'hsk-preview-r07-answer-slot',
    selectedKey ? 'is-filled' : '',
    submitted && selectedKey && selectedKey.toUpperCase() === correctKey ? 'is-correct' : '',
    submitted && selectedKey && correctKey && selectedKey.toUpperCase() !== correctKey
      ? 'is-wrong'
      : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className="hsk-preview-r07-question">
      <div className="hsk-preview-r07-question-head">
        <div className="hsk-preview-r07-question-head-main">
          <span className="hsk-preview-r07-question-id">{formatR07SubDisplayId(sub, index)}.</span>
          {stem ? <span className="hsk-preview-r07-question-stem">{stem}</span> : null}
        </div>
        <div className={slotClass} aria-hidden>
          {selectedKey || '?'}
        </div>
      </div>
      <div className="hsk-preview-r07-option-list">
        {options.map((opt) => {
          const text = opt.text?.trim() || '';
          const pinyin = opt.pinyin?.trim() || '';
          const selected = selectedKey === opt.key;
          const rowClass = [
            'hsk-preview-r07-option-item',
            selected ? 'is-selected' : '',
            submitted && correctKey && opt.key.toUpperCase() === correctKey ? 'is-correct' : '',
            submitted && selected && correctKey && selectedKey.toUpperCase() !== correctKey
              ? 'is-wrong'
              : '',
          ]
            .filter(Boolean)
            .join(' ');
          const keyClass = [
            'hsk-preview-r07-option-key',
            selected ? 'is-lit' : '',
            submitted && correctKey && opt.key.toUpperCase() === correctKey ? 'is-correct' : '',
            submitted && selected && correctKey && selectedKey.toUpperCase() !== correctKey
              ? 'is-wrong'
              : '',
          ]
            .filter(Boolean)
            .join(' ');

          return (
            <button
              key={opt.key}
              type="button"
              className={rowClass}
              onClick={() => onSelect(opt.key)}
              disabled={submitted}
              aria-pressed={selected}
            >
              <span className={keyClass}>{opt.key}</span>
              {pinyin && text ? (
                <PinyinRubyText
                  text={text}
                  pinyin={pinyin}
                  className="hsk-preview-r07-option-ruby"
                />
              ) : (
                <span className="hsk-preview-r07-option-text">{text || `[选项${opt.key}]`}</span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/** R07 阅读理解：文章 + 子题选项（对齐 HSK-Exams ExamRenderer） */
export function PreviewR07Reading({ question }: { question: HskQuestionRow }) {
  const content = question.payload?.content as
    | { article?: string; articlePinyin?: string; paragraph?: string }
    | undefined;
  const resolved = resolveR07Content(
    content,
    question.payload?.subQuestions,
    question.correctAnswer,
  );

  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [resultText, setResultText] = useState('');

  const subKeys = useMemo(
    () => resolved.subQuestions.map((sub, idx) => r07SubKey(sub, idx)),
    [resolved.subQuestions],
  );

  const canSubmit =
    resolved.subQuestions.length > 0 && subKeys.every((key) => Boolean(answers[key]));

  const handleSelect = useCallback(
    (subKey: string, optionKey: string) => {
      if (submitted) return;
      setAnswers((prev) => {
        if (prev[subKey] === optionKey) {
          const next = { ...prev };
          delete next[subKey];
          return next;
        }
        return { ...prev, [subKey]: optionKey };
      });
    },
    [submitted],
  );

  const handleSubmit = useCallback(() => {
    if (!canSubmit) return;
    const wrongCount = resolved.subQuestions.filter((sub, idx) => {
      const expected = (sub.answer ?? '').trim().toUpperCase();
      const actual = (answers[subKeys[idx]] ?? '').trim().toUpperCase();
      return expected && actual !== expected;
    }).length;
    setSubmitted(true);
    setResultText(
      wrongCount === 0 ? '全部正确' : `${wrongCount} 题有误，请检查后重新作答`,
    );
  }, [answers, canSubmit, resolved.subQuestions, subKeys]);

  return (
    <>
      <PreviewQuestionStem question={question} />
      {resolved.article.trim() && (
        <div className="hsk-preview-r07-passage">
          <div className="hsk-preview-r05-section-title">📄 阅读材料</div>
          {looksLikeRichArticleHtml(resolved.article) ? (
            <RichArticlePassagePreview
              html={resolved.article}
              pinyin={resolved.articlePinyin}
              className="hsk-preview-r07-passage-rich"
            />
          ) : (
            <div className="hsk-preview-r07-passage-text" style={{ textIndent: '2em' }}>
              {resolved.articlePinyin?.trim() ? (
                <PinyinRubyText text={resolved.article} pinyin={resolved.articlePinyin} />
              ) : (
                resolved.article
              )}
            </div>
          )}
        </div>
      )}

      <div className="hsk-preview-r07-questions">
        {resolved.subQuestions.map((sub, idx) => (
          <PreviewR07SubQuestionRow
            key={`${subKeys[idx]}-${idx}`}
            index={idx}
            sub={sub}
            selectedKey={answers[subKeys[idx]] ?? ''}
            submitted={submitted}
            onSelect={(optionKey) => handleSelect(subKeys[idx], optionKey)}
          />
        ))}
      </div>

      <PreviewSubmitBar
        canSubmit={canSubmit}
        submitted={submitted}
        resultText={resultText}
        onSubmit={handleSubmit}
      />
    </>
  );
}

/** L05 对话多题：音频 + 子题列表 + 文字选项（对齐 HSK-Exams _h / nh 渲染器） */
export function PreviewL05MultiSub({
  question,
  audioPending,
  audioTranscript,
}: {
  question: HskQuestionRow;
  audioPending: boolean;
  audioTranscript?: string;
}) {
  const subQuestions = resolveL05SubQuestions(question.payload?.subQuestions);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [resultText, setResultText] = useState('');

  const subKeys = useMemo(
    () => subQuestions.map((sub, idx) => l05SubKey(sub, idx)),
    [subQuestions],
  );

  const canSubmit =
    subQuestions.length > 0 && subKeys.every((key) => Boolean(answers[key]));

  const handleSelect = useCallback(
    (subKey: string, optionKey: string) => {
      if (submitted) return;
      setAnswers((prev) => {
        if (prev[subKey] === optionKey) {
          const next = { ...prev };
          delete next[subKey];
          return next;
        }
        return { ...prev, [subKey]: optionKey };
      });
    },
    [submitted],
  );

  const handleSubmit = useCallback(() => {
    if (!canSubmit) return;
    const wrongCount = subQuestions.filter((sub, idx) => {
      const expected = (sub.answer ?? '').trim().toUpperCase();
      const actual = (answers[subKeys[idx]] ?? '').trim().toUpperCase();
      return expected && actual !== expected;
    }).length;
    setSubmitted(true);
    setResultText(
      wrongCount === 0
        ? '全部正确'
        : `${wrongCount} 题有误，请检查后重新作答`,
    );
  }, [answers, canSubmit, subKeys, subQuestions]);

  return (
    <>
      <PreviewQuestionStem question={question} />
      <PreviewAudioBar pending={audioPending} audioTranscript={audioTranscript} />
      <div className="hsk-preview-l05-list">
        {subQuestions.map((sub, idx) => (
          <PreviewL05SubQuestionRow
            key={`${subKeys[idx]}-${idx}`}
            index={idx}
            sub={sub}
            selectedKey={answers[subKeys[idx]] ?? ''}
            submitted={submitted}
            onSelect={(optionKey) => handleSelect(subKeys[idx], optionKey)}
          />
        ))}
      </div>
      <PreviewSubmitBar
        canSubmit={canSubmit}
        submitted={submitted}
        resultText={resultText}
        onSubmit={handleSubmit}
      />
    </>
  );
}

function l05SubKey(sub: HskSubQuestionPayload, index: number): string {
  return String(sub.id ?? index + 1);
}

function PreviewL05SubQuestionRow({
  index,
  sub,
  selectedKey,
  submitted,
  onSelect,
}: {
  index: number;
  sub: HskSubQuestionPayload;
  selectedKey: string;
  submitted: boolean;
  onSelect: (optionKey: string) => void;
}) {
  const stem = sub.question?.trim() ?? '';
  const correctKey = (sub.answer ?? '').trim().toUpperCase();
  const options =
    sub.options && sub.options.length >= 2
      ? sub.options
      : [
          { key: 'A', text: '' },
          { key: 'B', text: '' },
          { key: 'C', text: '' },
          { key: 'D', text: '' },
        ];

  return (
    <div className="hsk-preview-l05-sub">
      <div className="hsk-preview-l05-sub-head">
        <div className="hsk-preview-l05-sub-head-main">
          <span className="hsk-preview-l05-sub-num">{index + 1}.</span>
          {stem ? <span className="hsk-preview-l05-sub-stem">{stem}</span> : null}
        </div>
        <div
          className={`hsk-preview-l05-answer-slot${selectedKey ? ' is-filled' : ''}${submitted && selectedKey && selectedKey.toUpperCase() === correctKey ? ' is-correct' : ''}${submitted && selectedKey && selectedKey.toUpperCase() !== correctKey ? ' is-wrong' : ''}`}
          aria-hidden
        >
          {selectedKey || '?'}
        </div>
      </div>
      <div className="hsk-preview-l05-sub-options">
        {options.map((opt) => {
          const text = opt.text?.trim() || '';
          const pinyin = opt.pinyin?.trim() || '';
          const selected = selectedKey === opt.key;
          const rowClass = [
            'hsk-preview-l05-sub-option',
            'hsk-preview-l05-sub-option-btn',
            selected ? 'is-selected' : '',
            submitted && correctKey && opt.key.toUpperCase() === correctKey ? 'is-correct' : '',
            submitted && selected && correctKey && selectedKey.toUpperCase() !== correctKey
              ? 'is-wrong'
              : '',
          ]
            .filter(Boolean)
            .join(' ');
          const keyClass = [
            'hsk-preview-l05-sub-option-key',
            selected ? 'is-lit' : '',
            submitted && correctKey && opt.key.toUpperCase() === correctKey ? 'is-correct' : '',
            submitted && selected && correctKey && selectedKey.toUpperCase() !== correctKey
              ? 'is-wrong'
              : '',
          ]
            .filter(Boolean)
            .join(' ');

          return (
            <button
              key={opt.key}
              type="button"
              className={rowClass}
              onClick={() => onSelect(opt.key)}
              disabled={submitted}
              aria-pressed={selected}
            >
              <span className={keyClass}>{opt.key}</span>
              {pinyin && text ? (
                <PinyinRubyText
                  text={text}
                  pinyin={pinyin}
                  className="hsk-preview-l05-sub-option-ruby"
                />
              ) : (
                <span className="hsk-preview-l05-sub-option-text">{text || `[选项${opt.key}]`}</span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/** R09 图片选词填空：词语库 + 图片对话卡片网格 */
export function PreviewR09ImageWord({ question }: { question: HskQuestionRow }) {
  const options = resolveR09Options(question);
  const subItems = resolveR09SubItems(question);
  const [activeItemId, setActiveItemId] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});

  const handleBlankClick = useCallback((itemId: string) => {
    setActiveItemId((prev) => (prev === itemId ? null : itemId));
  }, []);

  const handleWordBankClick = useCallback(
    (letter: string) => {
      if (!activeItemId) return;
      setAnswers((prev) => {
        if (prev[activeItemId] === letter) {
          const next = { ...prev };
          delete next[activeItemId];
          return next;
        }
        return { ...prev, [activeItemId]: letter };
      });
      setActiveItemId(null);
    },
    [activeItemId],
  );

  let scoringIndex = 0;

  return (
    <div className="hsk-preview-r09-wrap">
      <PreviewQuestionStem question={question} />
      <div className="hsk-preview-r09-word-bank">
        {options.map((opt) => (
          <button
            key={opt.key}
            type="button"
            className={`hsk-preview-r09-word-item${activeItemId ? ' is-selectable' : ''}`}
            onClick={() => handleWordBankClick(opt.key)}
            disabled={!activeItemId}
          >
            <span className="hsk-preview-r09-word-key">{opt.key}</span>
            <span className="hsk-preview-r09-word-body">
              {opt.pinyin?.trim() && (
                <span className="hsk-preview-r09-word-pinyin">{opt.pinyin.trim()}</span>
              )}
              <span className="hsk-preview-r09-word-text">{opt.text?.trim() || '—'}</span>
            </span>
          </button>
        ))}
      </div>

      <div className="hsk-preview-r09-grid">
        {subItems.map((item, idx) => {
          const label = item.isExample ? '例如' : String(31 + scoringIndex++);
          const filledLetter = item.isExample
            ? item.answer?.trim().toUpperCase()
            : answers[item.id]?.trim().toUpperCase();
          const isActive = activeItemId === item.id;

          return (
            <div
              key={`${item.id}-${idx}`}
              className={`hsk-preview-r09-card${isActive ? ' is-active' : ''}`}
            >
              <div className="hsk-preview-r09-card-label">{label}</div>
              <div className="hsk-preview-r09-card-image">
                {item.imageUrl ? (
                  <img src={item.imageUrl} alt="" />
                ) : (
                  <span className="hsk-preview-r09-card-image-placeholder">待配图</span>
                )}
              </div>
              <div className="hsk-preview-r09-card-dialogue">
                {(() => {
                  const useDialoguePinyin = !!item.dialoguePinyin?.trim();
                  const flatLines = flattenR09DialogueLines(item.dialogue);
                  const pinyinSlices = useDialoguePinyin
                    ? sliceR09DialoguePinyinByLines(item.dialogue, item.dialoguePinyin ?? '')
                    : [];
                  const dialogueLines = parseR09Dialogue(item.dialogue);

                  return dialogueLines.map((line, lineIdx) => (
                    <div key={`${item.id}-line-${lineIdx}`} className="hsk-preview-r09-dialogue-line">
                      {line.speaker && (
                        <span className="hsk-preview-r09-dialogue-speaker">{line.speaker}:</span>
                      )}
                      <span className="hsk-preview-r09-dialogue-text">
                        {useDialoguePinyin ? (
                          <PreviewR09DialogueLineWithPinyin
                            lineBody={flatLines[lineIdx] ?? ''}
                            linePinyin={pinyinSlices[lineIdx] ?? ''}
                            filledLetter={filledLetter}
                            isActive={isActive}
                            onBlankClick={() => handleBlankClick(item.id)}
                          />
                        ) : (
                          line.tokens.map((token, tokenIdx) => (
                            <PreviewR09DialogueToken
                              key={`${item.id}-token-${lineIdx}-${tokenIdx}`}
                              token={token}
                              filledLetter={filledLetter}
                              isActive={isActive}
                              onBlankClick={() => handleBlankClick(item.id)}
                            />
                          ))
                        )}
                      </span>
                    </div>
                  ));
                })()}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function PreviewR09DialogueLineWithPinyin({
  lineBody,
  linePinyin,
  filledLetter,
  isActive,
  onBlankClick,
}: {
  lineBody: string;
  linePinyin: string;
  filledLetter?: string;
  isActive?: boolean;
  onBlankClick?: () => void;
}) {
  const tokens = tokenizeR05Paragraph(lineBody);
  const items = buildPinyinRenderItems(tokens, linePinyin, 'r05');

  return (
    <>
      {items.map((item) => {
        if (item.kind === 'blank-r05' || item.kind === 'blank-r03') {
          const letter = filledLetter || '';
          const blankClass = [
            'hsk-preview-r09-blank',
            isActive ? 'is-active' : '',
            letter ? 'is-filled' : '',
          ]
            .filter(Boolean)
            .join(' ');
          return (
            <span key={item.key} className="hsk-preview-r05-blank-wrap">
              {item.embeddedPinyin && (
                <span className="hsk-preview-r05-blank-py">{item.embeddedPinyin}</span>
              )}
              <button type="button" className={blankClass} onClick={onBlankClick} aria-label="填空位">
                {letter ? ` ${letter} ` : '\u00a0'}
              </button>
            </span>
          );
        }

        if (item.kind === 'plain') {
          return (
            <span key={item.key} className="hsk-preview-r05-plain-ch">
              {item.char}
            </span>
          );
        }

        if (item.kind === 'word-ruby') {
          return <RubyWordItem key={item.key} pinyin={item.pinyin} chars={item.chars} />;
        }

        return null;
      })}
    </>
  );
}

function PreviewR09DialogueToken({
  token,
  filledLetter,
  isActive,
  onBlankClick,
}: {
  token: R09DialogueToken;
  filledLetter?: string;
  isActive?: boolean;
  onBlankClick?: () => void;
}) {
  if (token.type === 'plain') {
    return <span className="hsk-preview-r09-plain">{token.text}</span>;
  }

  if (token.type === 'ruby') {
    const chars = [...token.han];
    if (chars.length <= 1) {
      return (
        <span className="hsk-preview-r05-ruby-unit">
          <span className="hsk-preview-r05-ruby-py">{token.pinyin}</span>
          <span className="hsk-preview-r05-ruby-ch">{token.han}</span>
        </span>
      );
    }
    return (
      <span className="hsk-preview-r05-word-ruby-wrap">
        <span className="hsk-preview-r05-word-ruby-py">{token.pinyin}</span>
        <span className="hsk-preview-r05-word-ruby-chars">{token.han}</span>
      </span>
    );
  }

  const letter = filledLetter || token.presetLetter || '';
  const blankClass = [
    'hsk-preview-r09-blank',
    isActive ? 'is-active' : '',
    letter ? 'is-filled' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <span className="hsk-preview-r05-blank-wrap">
      {token.embeddedPinyin?.trim() && (
        <span className="hsk-preview-r05-blank-py">{token.embeddedPinyin.trim()}</span>
      )}
      <button type="button" className={blankClass} onClick={onBlankClick} aria-label="填空位">
        {letter ? ` ${letter} ` : '\u00a0'}
      </button>
    </span>
  );
}

/** W01 部件选择（对齐 HSK-Exams ExamRenderer） */
export function PreviewW01ComponentMatch({ question }: { question: HskQuestionRow }) {
  const componentParts = resolveW01ComponentParts(question);
  const wordMatches = resolveW01WordMatches(question);

  const [selectedMatchId, setSelectedMatchId] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [resultText, setResultText] = useState('');

  const clearMatchAnswer = useCallback((matchId: string) => {
    setAnswers((prev) => {
      if (!prev[matchId]) return prev;
      const next = { ...prev };
      delete next[matchId];
      return next;
    });
  }, []);

  const assignPart = useCallback((matchId: string, partKey: string) => {
    setAnswers((prev) => {
      const next = { ...prev };
      for (const [id, key] of Object.entries(next)) {
        if (id !== matchId && key === partKey) {
          delete next[id];
        }
      }
      next[matchId] = partKey;
      return next;
    });
  }, []);

  const handleMatchRowClick = useCallback(
    (matchId: string) => {
      if (submitted) return;
      if (answers[matchId]) {
        clearMatchAnswer(matchId);
        setSelectedMatchId(null);
        return;
      }
      setSelectedMatchId((prev) => (prev === matchId ? null : matchId));
    },
    [answers, clearMatchAnswer, submitted],
  );

  const handlePartClick = useCallback(
    (partKey: string) => {
      if (submitted || !selectedMatchId) return;
      assignPart(selectedMatchId, partKey);
      setSelectedMatchId(null);
    },
    [assignPart, selectedMatchId, submitted],
  );

  const canSubmit = wordMatches.length > 0 && wordMatches.every((match) => Boolean(answers[match.id]));

  const handleSubmit = useCallback(() => {
    if (!canSubmit) return;
    const wrongCount = wordMatches.filter((match) => answers[match.id] !== match.componentKey).length;
    setSubmitted(true);
    setResultText(
      wrongCount === 0
        ? '全部正确'
        : `${wrongCount} 题有误，请检查后重新作答`,
    );
  }, [answers, canSubmit, wordMatches]);

  return (
    <div className="hsk-preview-w01-wrap">
      <PreviewQuestionStem question={question} />
      <div className="hsk-preview-w01-parts-label">部件选项</div>
      <div className="hsk-preview-w01-parts-row">
        {componentParts.map((part) => {
          const usedByMatchId = Object.entries(answers).find(([, key]) => key === part.key)?.[0];
          const chipClass = [
            'hsk-preview-w01-part-chip',
            'hsk-preview-w01-part-btn',
            selectedMatchId ? 'is-selectable' : '',
            usedByMatchId ? 'is-used' : '',
          ]
            .filter(Boolean)
            .join(' ');
          return (
            <button
              key={part.key}
              type="button"
              className={chipClass}
              onClick={() => handlePartClick(part.key)}
              disabled={submitted || !selectedMatchId}
            >
              <span className="hsk-preview-w01-part-key">{part.key}</span>
              <span className="hsk-preview-w01-part-text">{part.text || '?'}</span>
            </button>
          );
        })}
      </div>

      <div className="hsk-preview-w01-match-list">
        {wordMatches.map((match, idx) => {
          const assignedKey = answers[match.id] ?? '';
          const isSelected = selectedMatchId === match.id;
          const isMatched = Boolean(assignedKey);
          const isCorrect = submitted && assignedKey === match.componentKey;
          const isWrong = submitted && assignedKey && assignedKey !== match.componentKey;
          const rowClass = [
            'hsk-preview-w01-match-row',
            'hsk-preview-w01-match-row-btn',
            isSelected ? 'is-selected' : '',
            isMatched ? 'is-matched' : '',
            isCorrect ? 'is-correct' : '',
            isWrong ? 'is-wrong' : '',
          ]
            .filter(Boolean)
            .join(' ');
          const answerClass = [
            'hsk-preview-w01-match-answer',
            isMatched ? 'is-filled' : '',
            isCorrect ? 'is-correct' : '',
            isWrong ? 'is-wrong' : '',
          ]
            .filter(Boolean)
            .join(' ');

          return (
            <button
              key={`${match.id}-${idx}`}
              type="button"
              className={rowClass}
              onClick={() => handleMatchRowClick(match.id)}
              disabled={submitted}
            >
              <div className="hsk-preview-w01-match-incomplete">
                {match.incompletePinyin && (
                  <div className="hsk-preview-w01-match-sub">{match.incompletePinyin}</div>
                )}
                <div className="hsk-preview-w01-match-main">{match.incomplete || '?'}</div>
              </div>
              <span className="hsk-preview-w01-match-arrow" aria-hidden>
                →
              </span>
              <div className="hsk-preview-w01-match-complete">
                {match.pinyin && <div className="hsk-preview-w01-match-sub">{match.pinyin}</div>}
                <div className="hsk-preview-w01-match-main">{match.word || '?'}</div>
              </div>
              <div className={answerClass} aria-hidden>
                {assignedKey || '?'}
              </div>
            </button>
          );
        })}
      </div>

      <PreviewSubmitBar
        canSubmit={canSubmit}
        submitted={submitted}
        resultText={resultText}
        onSubmit={handleSubmit}
      />
    </div>
  );
}

function PreviewW02BlankInput({
  expected,
  embeddedPinyin,
  value,
  onChange,
  ariaLabel,
  showFeedback = true,
}: {
  expected: string;
  embeddedPinyin: string;
  value: string;
  onChange: (next: string) => void;
  ariaLabel: string;
  showFeedback?: boolean;
}) {
  const py = embeddedPinyin.trim();
  const expectedLen = expected.trim().length;
  const trimmed = value.trim();

  let feedback: 'empty' | 'typing' | 'correct' | 'wrong' = 'empty';
  if (trimmed) {
    if (trimmed === expected.trim()) feedback = 'correct';
    else if (expectedLen > 0 && trimmed.length >= expectedLen) feedback = 'wrong';
    else feedback = 'typing';
  }

  const inputClass = [
    'hsk-preview-w02-blank-input',
    showFeedback && feedback === 'correct' ? 'is-correct' : '',
    showFeedback && feedback === 'wrong' ? 'is-wrong' : '',
    feedback === 'typing' ? 'is-active' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <span className="hsk-preview-w02-blank-group">
      {py ? <span className="hsk-preview-w02-blank-pinyin">{py}</span> : null}
      <span className="hsk-preview-w02-blank-input-wrap">
        <input
          type="text"
          className={inputClass}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          lang="zh-CN"
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
          maxLength={Math.max(expectedLen, 8) || 8}
          aria-label={ariaLabel}
          placeholder="　"
        />
        {showFeedback && feedback === 'correct' && (
          <span className="hsk-preview-w02-blank-feedback is-correct" aria-hidden>
            ✓
          </span>
        )}
        {showFeedback && feedback === 'wrong' && (
          <span className="hsk-preview-w02-blank-feedback is-wrong" aria-hidden>
            ✗
          </span>
        )}
      </span>
    </span>
  );
}

function PreviewW02SentenceLine({
  hint,
  idx,
  userAnswer,
  onAnswerChange,
  showFeedback,
}: {
  hint: ReturnType<typeof resolveW02PinyinHints>[number];
  idx: number;
  userAnswer: string;
  onAnswerChange: (next: string) => void;
  showFeedback: boolean;
}) {
  const sentence = hint.sentence.trim();
  const tokens = tokenizeR05Paragraph(sentence);
  const items = buildPinyinRenderItems(tokens, hint.sentencePinyin ?? '', 'r05');

  if (!sentence) {
    return (
      <div className="hsk-preview-w02-sentence">
        <span className="hsk-preview-w02-text">…</span>
      </div>
    );
  }

  return (
    <div className="hsk-preview-w02-sentence">
      {items.map((item) => {
        if (item.kind === 'plain') {
          return (
            <span key={item.key} className="hsk-preview-w02-ruby-ch is-punct">
              {item.char}
            </span>
          );
        }

        if (item.kind === 'blank-r05') {
          const py = item.embeddedPinyin?.trim() || hint.pinyin.trim();
          return (
            <PreviewW02BlankInput
              key={item.key}
              expected={hint.answer}
              embeddedPinyin={py}
              value={userAnswer}
              onChange={onAnswerChange}
              ariaLabel={`句子 ${idx + 1} 填空`}
              showFeedback={showFeedback}
            />
          );
        }

        if (item.kind === 'word-ruby') {
          return <RubyWordItem key={item.key} pinyin={item.pinyin} chars={item.chars} />;
        }

        return null;
      })}
    </div>
  );
}

/** W02 填写汉字（对齐 HSK-Exams ExamRenderer / 原型预览） */
export function PreviewW02PinyinFill({ question }: { question: HskQuestionRow }) {
  const hints = resolveW02PinyinHints(question);
  const showFeedback = resolveW02ShowFillFeedback(question);
  const [userAnswers, setUserAnswers] = useState<string[]>(() =>
    Array.from({ length: hints.length }, () => ''),
  );

  const handleAnswerChange = useCallback((index: number, next: string) => {
    setUserAnswers((prev) => {
      const copy = [...prev];
      while (copy.length <= index) copy.push('');
      copy[index] = next;
      return copy;
    });
  }, []);

  return (
    <div className="hsk-preview-w02-wrap">
      <PreviewQuestionStem question={question} />
      <div className="hsk-preview-w02-list">
        {hints.map((hint, idx) => (
          <PreviewW02SentenceLine
            key={`w02-preview-${idx}`}
            hint={hint}
            idx={idx}
            userAnswer={userAnswers[idx] ?? ''}
            onAnswerChange={(next) => handleAnswerChange(idx, next)}
            showFeedback={showFeedback}
          />
        ))}
      </div>
    </div>
  );
}

/** W03 看图造句（对齐 HSK-Exams ExamRenderer） */
export function PreviewW03PictureSentence({ question }: { question: HskQuestionRow }) {
  const { word } = resolveW03Content(question);
  const imageUrl = resolveQuestionImageUrl(question);
  const imagePending = isImagePending(question);

  return (
    <div className="hsk-preview-w03-wrap">
      <PreviewQuestionStem question={question} />
      {imagePending && !imageUrl ? (
        <div className="hsk-preview-w03-image-pending">
          <span className="hsk-preview-status-badge">⏳ 待配图</span>
        </div>
      ) : null}
      {!imagePending && imageUrl ? (
        <div className="hsk-preview-w03-image-wrap">
          <img src={imageUrl} alt="题目图片" className="hsk-preview-w03-image" />
        </div>
      ) : null}
      <div className="hsk-preview-w03-panel">
        <div className={`hsk-preview-w03-word-chip${word ? '' : ' is-placeholder'}`}>
          {word || '关键词'}
        </div>
        <textarea
          className="hsk-preview-w03-writing"
          placeholder="请在此处输入句子…"
          disabled
          rows={4}
        />
      </div>
    </div>
  );
}

/** W04 命题作文（对齐 HSK-Exams ExamRenderer） */
export function PreviewW04TopicEssay({ question }: { question: HskQuestionRow }) {
  const { prompt, keyword, minWords } = resolveW04Content(question);
  const keywords = parseW04Keywords(keyword);
  const writingHint = resolveW04WritingHint(question, minWords);
  const imageUrl = resolveQuestionImageUrl(question);
  const imagePending = isImagePending(question);
  const [essayText, setEssayText] = useState('');
  const charCount = countW04EssayChars(essayText);

  return (
    <div className="hsk-preview-w04-wrap">
      <PreviewQuestionStem question={question} />
      <div className="hsk-preview-w04-panel">
        {prompt && <div className="hsk-preview-w04-prompt">{prompt}</div>}
        {keywords.length > 0 && (
          <div className="hsk-preview-w04-keywords-block">
            <div className="hsk-preview-w04-keywords-label">关键词</div>
            <div className="hsk-preview-w03-keywords">
              {keywords.map((item, idx) => (
                <span key={`${item}-${idx}`} className="hsk-preview-w03-keyword-tag">
                  {item}
                </span>
              ))}
            </div>
          </div>
        )}
        {imagePending && !imageUrl ? (
          <div className="hsk-preview-w04-image-wrap">
            <PreviewImageBox pending={imagePending} alt="题目图片" size="lg" />
          </div>
        ) : null}
        {!imagePending && imageUrl ? (
          <div className="hsk-preview-w04-image-wrap">
            <img src={imageUrl} alt="题目图片" className="hsk-preview-w04-image" />
          </div>
        ) : null}
        <div className="hsk-preview-w04-meta">
          <span className="hsk-preview-w04-meta-hint">{writingHint}</span>
          <span className="hsk-preview-w04-meta-count">已输入 {charCount} 字</span>
        </div>
        <textarea
          className="hsk-preview-w04-writing"
          placeholder="请在此处输入作文…"
          value={essayText}
          onChange={(e) => setEssayText(e.target.value)}
          rows={8}
        />
      </div>
    </div>
  );
}
