import type { HskQuestionRow, HskSubQuestionPayload } from '../types/hskExams';
import { formatL05SubDisplayId, resolveL05SubQuestions } from '../utils/hskChoiceSubQuestions';
import { resolveL02SubQuestions } from '../utils/hskL02SubQuestions';
import { resolveR01Sentences } from '../utils/hskR01Match';
import {
  answerDisplayLabel,
  resolveR02AnswerItems,
  resolveR02QuestionItems,
  type HskR02AnswerItem,
  type HskR02QuestionItem,
} from '../utils/hskR02Match';
import {
  pairingsFromR03Data,
  renderR03SentencePreviewHtml,
  resolveR03SentenceBlanks,
  resolveR03WordItems,
  wordDisplayLabel,
} from '../utils/hskR03WordFill';
import {
  parseR04CorrectOrder,
  resolveR04Segments,
  shuffleSegmentsForPreview,
} from '../utils/hskR04SentenceSort';
import {
  renderR05ParagraphPreviewHtml,
  resolveR05Content,
  wordOptionLabel,
} from '../utils/hskR05ParagraphFill';
import {
  blankOptionLabel,
  renderR06ArticlePreviewHtml,
  resolveR06Content,
} from '../utils/hskR06Cloze';
import {
  formatR07SubDisplayId,
  resolveR07Content,
} from '../utils/hskR07Reading';
import {
  JUDGMENT_TF_OPTIONS,
  judgmentPreviewHint,
  resolveJudgmentContent,
} from '../utils/hskJudgmentQuestions';
import { resolveR09Content, resolveR09Options } from '../utils/hskR09ImageWord';
import { resolveW01ComponentParts, resolveW01WordMatches } from '../utils/hskW01ComponentMatch';
import { resolveW03Content, W03_PREVIEW_HINT } from '../utils/hskW03PictureSentence';
import { formatW04MinWordsHint, resolveW04Content } from '../utils/hskW04TopicEssay';

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
  const hint = judgmentPreviewHint(question.type_id, question.stem);
  const options =
    question.payload?.runtimeOptions?.filter((o) => o.key === 'A' || o.key === 'B') ??
    JUDGMENT_TF_OPTIONS;

  return (
    <>
      {needsAudio && (
        <PreviewAudioBar pending={!!audioPending} audioTranscript={audioTranscript || sentence} />
      )}
      <div className="hsk-preview-judgment-hint">{hint}</div>
      <PreviewImageBox pending={imagePending} imageUrl={imageUrl} alt={sentence || hint} size="lg" />
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
              <span className="hsk-preview-judgment-tf-text">{opt.text ?? (isTrue ? '对' : '错')}</span>
              {opt.pinyin && <span className="hsk-preview-judgment-tf-pinyin">{opt.pinyin}</span>}
            </div>
          );
        })}
      </div>
    </>
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

  return (
    <>
      <PreviewAudioBar pending={audioPending} audioTranscript={audioTranscript} />
      <div className="hsk-preview-l02-range">第 1-{subQuestions.length} 题</div>
      <div className="hsk-preview-l02-body">
        <div className="hsk-preview-l02-questions">
          {subQuestions.map((sub, idx) => (
            <PreviewL02QuestionRow key={`${sub.id ?? idx}-${idx}`} index={idx} sub={sub} />
          ))}
        </div>
        <div className="hsk-preview-l02-images">
          {fallbackOptions.map((opt) => (
            <div key={opt.key} className="hsk-preview-l02-image-card">
              <span className="hsk-preview-l02-image-label">{opt.key}</span>
              {opt.image ? (
                <img src={opt.image} alt={opt.text || opt.key} className="hsk-preview-l02-image-img" />
              ) : (
                <span className="hsk-preview-l02-image-placeholder">图</span>
              )}
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

function PreviewL02QuestionRow({ index, sub }: { index: number; sub: HskSubQuestionPayload }) {
  const answerLabel = sub.answer?.trim();
  return (
    <div className="hsk-preview-l02-question-row">
      <span className="hsk-preview-l02-question-num">{index + 1}.</span>
      <div className="hsk-preview-l02-answer-slot">{answerLabel || ''}</div>
    </div>
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

  return (
    <>
      <div className="hsk-preview-r01-hint">
        请将文字与对应的图片点击匹配，每个图片只能使用一次
      </div>
      <div className="hsk-preview-r01-body">
        <div className="hsk-preview-r01-text-col">
          <div className="hsk-preview-r01-col-title">文字</div>
          <div className="hsk-preview-r01-text-list">
            {sentences.map((sentence, idx) => (
              <div key={`${sentence.key}-${idx}`} className="hsk-preview-r01-text-row">
                <span className="hsk-preview-r01-text-num">{idx + 1}</span>
                <div className="hsk-preview-r01-text-content">
                  <span>{sentence.text?.trim() || ''}</span>
                  {sentence.pinyin?.trim() && (
                    <span className="hsk-preview-r01-text-pinyin">{sentence.pinyin}</span>
                  )}
                </div>
                <div className="hsk-preview-r01-answer-slot" aria-hidden>
                  ?
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="hsk-preview-r01-image-col">
          <div className="hsk-preview-r01-col-title">图片</div>
          <div className="hsk-preview-r01-image-grid">
            {fallbackOptions.map((opt) => {
              const pending = imagePending || !opt.image;
              return (
                <div key={opt.key} className="hsk-preview-r01-image-card">
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
                </div>
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

  return (
    <>
      <div className="hsk-preview-r01-hint">
        请将问题与对应的回答匹配，每个回答只能使用一次
      </div>
      <div className="hsk-preview-r01-body">
        <div className="hsk-preview-r01-text-col">
          <div className="hsk-preview-r01-col-title">问题</div>
          <div className="hsk-preview-r01-text-list">
            {questionItems.map((item, idx) => (
              <div key={`${item.id}-${idx}`} className="hsk-preview-r01-text-row">
                <span className="hsk-preview-r01-text-num">{idx + 1}</span>
                <div className="hsk-preview-r01-text-content">
                  <span>{item.text?.trim() || ''}</span>
                  {item.pinyin?.trim() && (
                    <span className="hsk-preview-r01-text-pinyin">{item.pinyin}</span>
                  )}
                </div>
                <div className="hsk-preview-r01-answer-slot" aria-hidden>
                  ?
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="hsk-preview-r01-text-col">
          <div className="hsk-preview-r01-col-title">回答</div>
          <div className="hsk-preview-r02-answer-list">
            {answerItems.map((item, idx) => (
              <div key={`${item.id}-${idx}`} className="hsk-preview-r02-answer-row">
                <span className="hsk-preview-r02-answer-label">{answerDisplayLabel(item, idx)}</span>
                <div className="hsk-preview-r01-text-content">
                  <span>{item.text?.trim() || ''}</span>
                  {item.pinyin?.trim() && (
                    <span className="hsk-preview-r01-text-pinyin">{item.pinyin}</span>
                  )}
                </div>
              </div>
            ))}
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
        sentenceBlanks?: Array<{ id?: string; sentence?: string; answer?: string; pinyin?: string }>;
        wordItems?: Array<{ id: string; text: string; pinyin?: string; isDistractor?: boolean }>;
        wordBank?: string[];
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
  const pairings = pairingsFromR03Data(
    question.correctAnswer,
    sentenceBlanks,
    wordItems,
    content?.sentenceBlanks,
  );

  return (
    <>
      <div className="hsk-preview-r01-hint">
        请为每个句子选择正确的词语，每个词语只能使用一次
      </div>
      <div className="hsk-preview-r03-sentences">
        {sentenceBlanks.map((blank, idx) => {
          const wordId = pairings[blank.id];
          const word = wordItems.find((item) => item.id === wordId);
          const filledText = word?.text?.trim();
          return (
            <div key={`${blank.id}-${idx}`} className="hsk-preview-r03-sentence-row">
              <span className="hsk-preview-r03-sentence-num">{idx + 1}.</span>
              <div className="hsk-preview-r03-sentence-content">
                {blank.pinyin?.trim() && (
                  <div className="hsk-preview-r03-sentence-pinyin">
                    {blank.pinyin.replace(/[（(]\s*[）)]|_{2,}/g, '      ')}
                  </div>
                )}
                <div
                  className="hsk-preview-r03-sentence-text"
                  dangerouslySetInnerHTML={{
                    __html: renderR03SentencePreviewHtml(blank.sentence, filledText),
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
      <div className="hsk-preview-r03-word-pool">
        <div className="hsk-preview-r03-word-pool-title">请选择词语填入上方句子中：</div>
        <div className="hsk-preview-r03-word-chips">
          {wordItems.map((item, idx) => (
            <div key={`${item.id}-${idx}`} className="hsk-preview-r03-word-chip">
              {item.pinyin?.trim() && (
                <span className="hsk-preview-r03-word-chip-pinyin">{item.pinyin}</span>
              )}
              <span className="hsk-preview-r03-word-chip-text">{item.text?.trim() || wordDisplayLabel(item, idx)}</span>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

/** R04 句子排序：待排序片段 + 排序空位（对齐 HSK-Exams ExamRenderer Ph） */
export function PreviewR04Sort({ question }: { question: HskQuestionRow }) {
  const content = question.payload?.content as
    | { segments?: Array<{ id?: string; key?: string; text?: string; pinyin?: string }>; sentences?: Array<{ key?: string; text?: string; pinyin?: string }> }
    | undefined;
  const segments = resolveR04Segments(content?.segments ?? content?.sentences, question.correctAnswer);
  const shuffled = shuffleSegmentsForPreview(segments);
  const slotCount = Math.max(parseR04CorrectOrder(question.correctAnswer).length, segments.length);

  return (
    <>
      <div className="hsk-preview-r04-hint">
        请将下面的句子按正确的顺序排列 — 先点击上方句子，再点击下方位置
      </div>
      <div className="hsk-preview-r04-section">
        <div className="hsk-preview-r04-section-title">待排序句子</div>
        {shuffled.map((segment) => (
          <div key={segment.id} className="hsk-preview-r04-segment-row">
            <span className="hsk-preview-r04-segment-key">{segment.key}</span>
            <div className="hsk-preview-r04-segment-content">
              <span>{segment.text?.trim() || ''}</span>
              {segment.pinyin?.trim() && (
                <span className="hsk-preview-r04-segment-pinyin">{segment.pinyin}</span>
              )}
            </div>
          </div>
        ))}
      </div>
      <div className="hsk-preview-r04-section">
        <div className="hsk-preview-r04-section-title">排序结果</div>
        <div className="hsk-preview-r04-slots">
          {Array.from({ length: slotCount }, (_, idx) => (
            <div key={`slot-${idx}`} className="hsk-preview-r04-slot">
              <span className="hsk-preview-r04-slot-num">{idx + 1}.</span>
              <span className="hsk-preview-r04-slot-placeholder">?</span>
            </div>
          ))}
        </div>
      </div>
    </>
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
      }
    | undefined;
  const resolved = resolveR05Content(content, question.correctAnswer);
  const paragraphHtml = renderR05ParagraphPreviewHtml(resolved.paragraph);
  const imageUrl = resolveQuestionImageUrl(question);

  return (
    <>
      <div className="hsk-preview-r05-passage">
        <div className="hsk-preview-r05-section-title">📄 阅读材料</div>
        {imageUrl && (
          <div className="hsk-preview-r05-image-wrap">
            <img src={imageUrl} alt="" className="hsk-preview-r05-image" />
          </div>
        )}
        {paragraphHtml ? (
          <>
            {resolved.paragraphPinyin?.trim() && (
              <div className="hsk-preview-r05-passage-pinyin">{resolved.paragraphPinyin}</div>
            )}
            <div
              className="hsk-preview-r05-passage-text"
              style={{ textIndent: '2em' }}
              dangerouslySetInnerHTML={{ __html: paragraphHtml }}
            />
          </>
        ) : (
          <p className="hsk-preview-r05-passage-empty">暂无段落内容</p>
        )}
      </div>

      <div className="hsk-preview-r05-word-bank">
        <div className="hsk-preview-r05-section-title">📚 全局词库 (Word Bank)</div>
        <div className="hsk-preview-r05-word-list">
          {resolved.wordBank.map((option) => (
            <div key={option.key} className="hsk-preview-r05-word-item">
              {wordOptionLabel(option)}
            </div>
          ))}
        </div>
      </div>

      <p className="hsk-preview-r05-hint">请先在上方段落中点击一个填空位置</p>
    </>
  );
}

/** R06 完形填空：阅读材料 + 分空选项（对齐 HSK-Exams ExamRenderer ch） */
export function PreviewR06Cloze({ question }: { question: HskQuestionRow }) {
  const content = question.payload?.content as
    | {
        article?: string;
        articlePinyin?: string;
        paragraph?: string;
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
  const articleHtml = renderR06ArticlePreviewHtml(resolved.article);

  return (
    <>
      <div className="hsk-preview-r06-passage">
        <div className="hsk-preview-r05-section-title">📄 阅读材料</div>
        {articleHtml ? (
          <>
            {resolved.articlePinyin?.trim() && (
              <div className="hsk-preview-r05-passage-pinyin">{resolved.articlePinyin}</div>
            )}
            <div
              className="hsk-preview-r06-passage-text"
              style={{ textIndent: '2em' }}
              dangerouslySetInnerHTML={{ __html: articleHtml }}
            />
          </>
        ) : (
          <p className="hsk-preview-r05-passage-empty">暂无文章内容</p>
        )}
      </div>

      <div className="hsk-preview-r06-choices">
        <div className="hsk-preview-r05-section-title">✏️ 选择填空</div>
        {resolved.blanks.map((blank, idx) => (
          <div key={`${blank.index}-${idx}`} className="hsk-preview-r06-choice-block">
            <div className="hsk-preview-r06-choice-title">{idx + 1}.</div>
            <div className="hsk-preview-r06-choice-grid">
              {blank.options.map((option) => (
                <div key={option.key} className="hsk-preview-r06-choice-item">
                  {blankOptionLabel(option)}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </>
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

  return (
    <>
      {resolved.article.trim() && (
        <div className="hsk-preview-r07-passage">
          <div className="hsk-preview-r05-section-title">📄 阅读材料</div>
          {resolved.articlePinyin?.trim() && (
            <div className="hsk-preview-r05-passage-pinyin">{resolved.articlePinyin}</div>
          )}
          <div className="hsk-preview-r07-passage-text" style={{ textIndent: '2em' }}>
            {resolved.article}
          </div>
        </div>
      )}

      <div className="hsk-preview-r07-questions">
        {resolved.subQuestions.map((sub, idx) => {
          const displayId = formatR07SubDisplayId(sub, idx);
          const stem = sub.question?.trim();
          const options = sub.options ?? [];
          return (
            <div key={`${displayId}-${idx}`} className="hsk-preview-r07-question">
              <div className="hsk-preview-r07-question-head">
                <span className="hsk-preview-r07-question-id">{displayId}.</span>
                {stem && <span className="hsk-preview-r07-question-stem">{stem}</span>}
                <span className="hsk-preview-r07-answer-slot" aria-hidden>
                  ?
                </span>
              </div>
              <div className="hsk-preview-r07-option-keys">
                {options.map((option) => (
                  <span key={option.key} className="hsk-preview-r07-option-key">
                    {option.key}
                  </span>
                ))}
              </div>
            </div>
          );
        })}
      </div>
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

  return (
    <>
      <PreviewAudioBar pending={audioPending} audioTranscript={audioTranscript} />
      <div className="hsk-preview-l05-list">
        {subQuestions.map((sub, idx) => (
          <PreviewL05SubQuestionRow key={`${formatL05SubDisplayId(sub, idx)}-${idx}`} index={idx} sub={sub} />
        ))}
      </div>
    </>
  );
}

function PreviewL05SubQuestionRow({ index, sub }: { index: number; sub: HskSubQuestionPayload }) {
  const displayId = formatL05SubDisplayId(sub, index);
  const stem = sub.question?.trim() ?? '';
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
        <span className="hsk-preview-l05-sub-title">
          {displayId}.{stem ? ` ${stem}` : ''}
        </span>
        <div className="hsk-preview-l05-answer-slot" aria-hidden>
          ?
        </div>
      </div>
      <div className="hsk-preview-l05-sub-options">
        {options.map((opt) => (
          <div key={opt.key} className="hsk-preview-l05-sub-option">
            <span className="hsk-preview-l05-sub-option-key">{opt.key}</span>
            <span className="hsk-preview-l05-sub-option-text">{opt.text?.trim() || ''}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/** R09 图片选词填空（对齐 HSK-Exams ExamRenderer 占位预览） */
export function PreviewR09ImageWord({ question }: { question: HskQuestionRow }) {
  const { sentence } = resolveR09Content(question);
  const options = resolveR09Options(question);
  const content = question.payload?.content as { imageDescription?: string } | undefined;
  const imageDescription = content?.imageDescription?.trim();
  const imagePending = isImagePending(question);

  return (
    <div className="hsk-preview-r09-wrap">
      <div className="hsk-preview-r09-title">🖼️ 图片选词填空</div>
      <p className="hsk-preview-r09-subtitle">渲染器开发中</p>
      {imagePending && imageDescription && (
        <div className="hsk-preview-r09-image-desc">⏳ 图片：{imageDescription}</div>
      )}
      {imagePending && !imageDescription && (
        <div className="hsk-preview-r09-image-desc">⏳ 待配图</div>
      )}
      {sentence && <p className="hsk-preview-r09-sentence">{sentence}</p>}
      <div className="hsk-preview-r09-options">
        {options.map((opt) => (
          <span key={opt.key} className="hsk-preview-r09-option-chip">
            {opt.key}. {opt.text?.trim() || '—'}
          </span>
        ))}
      </div>
    </div>
  );
}

/** W01 部件选择（对齐 HSK-Exams ExamRenderer） */
export function PreviewW01ComponentMatch({ question }: { question: HskQuestionRow }) {
  const componentParts = resolveW01ComponentParts(question);
  const wordMatches = resolveW01WordMatches(question);

  return (
    <div className="hsk-preview-w01-wrap">
      <div className="hsk-preview-w01-parts-label">部件选项</div>
      <div className="hsk-preview-w01-parts-row">
        {componentParts.map((part) => (
          <span key={part.key} className="hsk-preview-w01-part-chip">
            <span className="hsk-preview-w01-part-text">{part.text || '?'}</span>
            <span className="hsk-preview-w01-part-key">{part.key}</span>
          </span>
        ))}
      </div>

      <div className="hsk-preview-w01-match-list">
        {wordMatches.map((match, idx) => (
          <div key={`${match.id}-${idx}`} className="hsk-preview-w01-match-row">
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
            <div className="hsk-preview-w01-match-answer">{match.componentKey || '?'}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

/** W03 看图造句（对齐 HSK-Exams ExamRenderer） */
export function PreviewW03PictureSentence({ question }: { question: HskQuestionRow }) {
  const { keywords } = resolveW03Content(question);
  const imageUrl = resolveQuestionImageUrl(question);
  const imagePending = isImagePending(question);
  const displayWord = keywords.length ? keywords.join('、') : '';

  return (
    <div className="hsk-preview-w03-wrap">
      {imagePending && !imageUrl && (
        <PreviewImageBox pending={imagePending} alt="题目图片" size="lg" />
      )}
      {!imagePending && imageUrl && (
        <div className="hsk-preview-w03-image-wrap">
          <img src={imageUrl} alt="题目图片" className="hsk-preview-w03-image" />
        </div>
      )}
      <div className="hsk-preview-w03-panel">
        <div className="hsk-preview-w03-hint">{W03_PREVIEW_HINT}</div>
        {displayWord && <div className="hsk-preview-w03-word-chip">{displayWord}</div>}
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
  const { prompt, instruction, minWords } = resolveW04Content(question);
  const imageUrl = resolveQuestionImageUrl(question);
  const imagePending = isImagePending(question);

  return (
    <div className="hsk-preview-w04-wrap">
      {imagePending && !imageUrl && (
        <PreviewImageBox pending={imagePending} alt="题目图片" size="lg" />
      )}
      {!imagePending && imageUrl && (
        <div className="hsk-preview-w04-image-wrap">
          <img src={imageUrl} alt="题目图片" className="hsk-preview-w04-image" />
        </div>
      )}
      <div className="hsk-preview-w04-panel">
        {prompt && <div className="hsk-preview-w04-prompt">{prompt}</div>}
        {instruction && <div className="hsk-preview-w04-instruction">{instruction}</div>}
        <div className="hsk-preview-w04-meta">
          <span className="hsk-preview-w04-meta-hint">{formatW04MinWordsHint(minWords)}</span>
          <span className="hsk-preview-w04-meta-count">已输入 0 字</span>
        </div>
        <textarea
          className="hsk-preview-w04-writing"
          placeholder="请在此处输入作文…"
          disabled
          rows={8}
        />
      </div>
    </div>
  );
}
