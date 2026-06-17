import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { HskQuestionAudioSection } from '../components/HskQuestionAudioSection';
import { HskQuestionEditPreview } from '../components/HskQuestionEditPreview';
import { HskQuestionExplanationSection } from '../components/HskQuestionExplanationSection';
import { HskQuestionImageOptionsEditor } from '../components/HskQuestionImageOptionsEditor';
import { HskQuestionJudgmentEditor } from '../components/HskQuestionJudgmentEditor';
import { HskQuestionSingleImageSection } from '../components/HskQuestionSingleImageSection';
import { HskQuestionTagsLinksSection } from '../components/HskQuestionTagsLinksSection';
import { HskQuestionDifficultySelect } from '../components/HskQuestionDifficultySelect';
import { HskQuestionEditTypeSelect } from '../components/HskQuestionEditTypeSelect';
import {
  autoTranslateTitleByLang,
  resolveExplanationByLang,
  type ExplanationEditorTab,
  type LangKey,
} from '../config/languages';
import { isImageOptionQuestionType, isJudgmentQuestionType, supportsQuestionExampleFlag } from '../config/hskQuestionTypeGroups';
import { HskQuestionWorkflowProgress } from '../components/HskQuestionWorkflowProgress';
import { defaultCompoundForType, getRegistryEntry } from '../config/hskQuestionTypeRegistry';
import type { HskLevelCode, HskQuestionRow, HskQuestionStatus, HskQuestionTag, HskQuestionTagCatalog, HskQuestionTypeDef, HskRuntimeOption, HskSubQuestionPayload } from '../types/hskExams';
import { DEFAULT_HSK_QUESTION_TAG_CATALOG } from '../types/hskExams';
import { HSK_QUESTION_LEVELS } from '../types/hskExams';
import { HskQuestionChoiceSubQuestionsEditor } from '../components/HskQuestionChoiceSubQuestionsEditor';
import { HskQuestionL02SubQuestionsEditor } from '../components/HskQuestionL02SubQuestionsEditor';
import { HskQuestionR01MatchEditor } from '../components/HskQuestionR01MatchEditor';
import { HskQuestionR02MatchEditor } from '../components/HskQuestionR02MatchEditor';
import { HskQuestionR03WordFillEditor } from '../components/HskQuestionR03WordFillEditor';
import { HskQuestionR04SortEditor } from '../components/HskQuestionR04SortEditor';
import { HskQuestionR05ParagraphEditor } from '../components/HskQuestionR05ParagraphEditor';
import { HskQuestionR06ClozeEditor } from '../components/HskQuestionR06ClozeEditor';
import { HskQuestionR07ReadingEditor } from '../components/HskQuestionR07ReadingEditor';
import { HskQuestionR09Editor } from '../components/HskQuestionR09Editor';
import { HskQuestionW01Editor } from '../components/HskQuestionW01Editor';
import { HskQuestionW02Editor } from '../components/HskQuestionW02Editor';
import { HskQuestionW03Editor } from '../components/HskQuestionW03Editor';
import { HskQuestionW04Editor } from '../components/HskQuestionW04Editor';
import { resolveL05SubQuestions } from '../utils/hskChoiceSubQuestions';
import { HskQuestionTextOptionsEditor, defaultTextOptionsForType } from '../components/HskQuestionTextOptionsEditor';
import { getQuestionRequiredFieldSummary } from '../utils/hskQuestionRequiredFields';
import {
  applyL02ImagePairings,
  buildLegacyL02CorrectAnswer,
  pairingsFromL02SubQuestions,
  resolveL02SubQuestions,
  sumSubQuestionScores,
} from '../utils/hskL02SubQuestions';
import {
  buildR01CorrectAnswer,
  pairingsFromR01CorrectAnswer,
  resolveR01Sentences,
  type HskMatchSentence,
} from '../utils/hskR01Match';
import {
  buildR02CorrectAnswer,
  pairingsFromR02CorrectAnswer,
  resolveR02AnswerItems,
  resolveR02QuestionItems,
  type HskR02AnswerItem,
  type HskR02QuestionItem,
} from '../utils/hskR02Match';
import {
  buildR03CorrectAnswer,
  pairingsFromR03Data,
  resolveR03SentenceBlanks,
  resolveR03WordItems,
  wordItemsToRuntimeOptions,
  type HskR03SentenceBlank,
  type HskR03WordItem,
} from '../utils/hskR03WordFill';
import {
  buildR04CorrectAnswer,
  parseR04CorrectOrder,
  rekeyR04Segments,
  resolveR04Segments,
  type HskR04Segment,
} from '../utils/hskR04SentenceSort';
import {
  buildR05CorrectAnswer,
  rekeyR05WordBank,
  resolveR05BlankIndices,
  resolveR05Content,
  type HskR05WordOption,
} from '../utils/hskR05ParagraphFill';
import {
  buildR06CorrectAnswer,
  resolveR06Content,
  syncR06Blanks,
  type HskR06Blank,
} from '../utils/hskR06Cloze';
import {
  buildR07CorrectAnswer,
  resolveR07Content,
  syncR07AggregatedScore,
} from '../utils/hskR07Reading';
import { buildJudgmentContentPatch, normalizeJudgmentQuestion, resolveJudgmentContent } from '../utils/hskJudgmentQuestions';
import { applyPinyinParagraphIndent, applyRichArticleParagraphIndent } from '../utils/hskRichArticleHtml';
import {
  buildR09CorrectAnswer,
  buildR09PayloadPatch,
  normalizeR09Question,
  relabelR09Options,
  resolveR09Options,
  resolveR09SubItems,
  syncR09AggregatedScore,
  type HskR09SubItem,
} from '../utils/hskR09ImageWord';
import {
  buildW01CorrectAnswer,
  buildW01PayloadPatch,
  normalizeW01Question,
  relabelW01ComponentParts,
  relabelW01WordMatches,
  resolveW01ComponentParts,
  resolveW01WordMatches,
  type HskW01ComponentPart,
  type HskW01WordMatch,
} from '../utils/hskW01ComponentMatch';
import {
  buildW02CorrectAnswer,
  buildW02PayloadPatch,
  isW02HintComplete,
  normalizeW02Question,
  resolveW02PinyinHints,
  resolveW02ShowFillFeedback,
  type HskW02PinyinHint,
} from '../utils/hskW02PinyinFill';
import {
  buildW03PayloadPatch,
  normalizeW03Question,
  resolveW03Content,
} from '../utils/hskW03PictureSentence';
import {
  buildW04PayloadPatch,
  normalizeW04Question,
  resolveW04Content,
} from '../utils/hskW04TopicEssay';
import { resolveQuestionImageUrl } from '../components/HskQuestionPreviewParts';
import { levelToNumber } from '../config/hskQuestionTypes';

type Props = {
  question: HskQuestionRow;
  types: HskQuestionTypeDef[];
  tags: HskQuestionTag[];
  tagCatalog?: HskQuestionTagCatalog;
  onBack: () => void;
  onSave: (question: HskQuestionRow) => void;
  onGlobalTagsChange?: (nextTags: HskQuestionTag[]) => void;
  onTagCatalogChange?: (nextCatalog: HskQuestionTagCatalog) => void;
};

function SectionHeader({
  icon,
  title,
  extra,
}: {
  icon: string;
  title: string;
  extra?: ReactNode;
}) {
  return (
    <div className={`hsk-question-edit-section-head${extra ? ' hsk-question-edit-section-head-split' : ''}`}>
      <div className="hsk-question-edit-section-head-main">
        <span aria-hidden>{icon}</span>
        <h3>{title}</h3>
      </div>
      {extra}
    </div>
  );
}

const DEFAULT_IMAGE_OPTIONS: HskRuntimeOption[] = [
  { key: 'A', text: '图片A', image: '' },
  { key: 'B', text: '图片B', image: '' },
  { key: 'C', text: '图片C', image: '' },
];

export function HskQuestionEditPage({
  question,
  types,
  tags,
  tagCatalog = DEFAULT_HSK_QUESTION_TAG_CATALOG,
  onBack,
  onSave,
  onGlobalTagsChange,
  onTagCatalogChange,
}: Props) {
  const [draft, setDraft] = useState<HskQuestionRow>(() => structuredClone(question));
  const [fullscreenPreview, setFullscreenPreview] = useState(false);
  const [tabletPreview, setTabletPreview] = useState(false);
  const [previewResetKey, setPreviewResetKey] = useState(0);
  const [toast, setToast] = useState<string | null>(null);
  const [explanationLangTab, setExplanationLangTab] = useState<ExplanationEditorTab>('CN');

  useEffect(() => {
    let next = structuredClone(question);
    if (next.type_id === 'L02') {
      const keys =
        next.payload?.runtimeOptions?.map((o) => o.key) ??
        (next.options ?? []).map((o) => o.label);
      const imageOpts =
        next.payload?.runtimeOptions ??
        (next.options ?? []).map((o) => ({ key: o.label, text: o.text, image: o.image }));
      const subs = resolveL02SubQuestions(next.payload?.subQuestions, next.correctAnswer, imageOpts);
      const totalScore = sumSubQuestionScores(subs);
      setDraft({
        ...next,
        score: totalScore || next.score,
        correctAnswer: buildLegacyL02CorrectAnswer(subs, keys),
        payload: { ...next.payload, subQuestions: subs },
      });
      return;
    }
    if (next.type_id === 'L05') {
      const subs = resolveL05SubQuestions(next.payload?.subQuestions);
      const totalScore = sumSubQuestionScores(subs);
      setDraft({
        ...next,
        score: totalScore || next.score,
        payload: { ...next.payload, subQuestions: subs },
      });
      return;
    }
    if (next.type_id === 'R01') {
      const imageOpts =
        next.payload?.runtimeOptions ??
        (next.options ?? []).map((o) => ({ key: o.label, text: o.text, image: o.image }));
      const keys = imageOpts.map((o) => o.key);
      const storedSentences = next.payload?.content?.sentences as HskMatchSentence[] | undefined;
      const sentences = resolveR01Sentences(storedSentences, next.correctAnswer, imageOpts);
      setDraft({
        ...next,
        payload: {
          ...next.payload,
          runtimeOptions: imageOpts.length >= 2 ? imageOpts : undefined,
          content: { ...(next.payload?.content ?? {}), sentences },
        },
        correctAnswer: next.correctAnswer || buildR01CorrectAnswer(pairingsFromR01CorrectAnswer(next.correctAnswer, keys.length >= 2 ? keys : ['A', 'B', 'C']), keys.length >= 2 ? keys : ['A', 'B', 'C']),
      });
      return;
    }
    if (next.type_id === 'R02') {
      const content = next.payload?.content as
        | { questionItems?: HskR02QuestionItem[]; answerItems?: HskR02AnswerItem[] }
        | undefined;
      const questionItems = resolveR02QuestionItems(content?.questionItems, next.correctAnswer);
      const answerItems = resolveR02AnswerItems(
        content?.answerItems,
        next.correctAnswer,
        questionItems.length,
      );
      setDraft({
        ...next,
        payload: {
          ...next.payload,
          content: { ...(next.payload?.content ?? {}), questionItems, answerItems },
        },
        correctAnswer:
          next.correctAnswer ||
          buildR02CorrectAnswer(pairingsFromR02CorrectAnswer(next.correctAnswer)),
      });
      return;
    }
    if (next.type_id === 'R03') {
      const content = next.payload?.content as
        | {
            sentenceBlanks?: HskR03SentenceBlank[];
            wordItems?: HskR03WordItem[];
            wordBank?: string[];
            pairings?: Record<string, string>;
          }
        | undefined;
      const sentenceBlanks = resolveR03SentenceBlanks(
        content?.sentenceBlanks,
        next.correctAnswer,
      );
      const wordItems = resolveR03WordItems(
        content?.wordItems,
        next.payload?.runtimeOptions,
        next.options,
        content?.wordBank,
        next.correctAnswer,
        sentenceBlanks.length,
      );
      const pairings = pairingsFromR03Data(
        next.correctAnswer,
        sentenceBlanks,
        wordItems,
        content?.sentenceBlanks,
        content?.pairings,
      );
      const runtimeOptions = wordItemsToRuntimeOptions(wordItems);
      setDraft({
        ...next,
        options: runtimeOptions.map((o) => ({
          label: o.key,
          text: o.text ?? '',
          pinyin: o.pinyin,
        })),
        payload: {
          ...next.payload,
          runtimeOptions,
          content: {
            ...(next.payload?.content ?? {}),
            sentenceBlanks,
            wordItems,
            pairings,
          },
        },
        correctAnswer:
          next.correctAnswer || buildR03CorrectAnswer(pairings, sentenceBlanks, wordItems),
      });
      return;
    }
    if (next.type_id === 'R04') {
      const content = next.payload?.content as
        | {
            segments?: HskR04Segment[];
            sentences?: Array<{ id?: string; key?: string; text?: string; pinyin?: string }>;
          }
        | undefined;
      const segments = resolveR04Segments(
        content?.segments ?? content?.sentences,
        next.correctAnswer,
      );
      setDraft({
        ...next,
        payload: {
          ...next.payload,
          content: { ...(next.payload?.content ?? {}), segments },
        },
      });
      return;
    }
    if (next.type_id === 'R05') {
      const resolved = resolveR05Content(
        next.payload?.content as Parameters<typeof resolveR05Content>[0],
        next.correctAnswer,
      );
      const runtimeOptions = resolved.wordBank.map((option) => ({
        key: option.key,
        text: option.text,
        pinyin: option.pinyin,
      }));
      setDraft({
        ...next,
        options: runtimeOptions.map((option) => ({
          label: option.key,
          text: option.text ?? '',
          pinyin: option.pinyin,
        })),
        correctAnswer:
          next.correctAnswer ||
          buildR05CorrectAnswer(resolved.blankAnswers, resolved.blankIndices),
        payload: {
          ...next.payload,
          runtimeOptions,
          content: {
            ...(next.payload?.content ?? {}),
            paragraph: resolved.paragraph,
            paragraphPinyin: resolved.paragraphPinyin,
            wordBank: resolved.wordBank,
          },
        },
      });
      return;
    }
    if (next.type_id === 'R06') {
      const resolved = resolveR06Content(
        next.payload?.content as Parameters<typeof resolveR06Content>[0],
        next.correctAnswer,
      );
      setDraft({
        ...next,
        correctAnswer: next.correctAnswer || buildR06CorrectAnswer(resolved.blanks),
        payload: {
          ...next.payload,
          content: {
            ...(next.payload?.content ?? {}),
            article: resolved.article,
            articlePinyin: resolved.articlePinyin,
            blanks: resolved.blanks,
          },
        },
      });
      return;
    }
    if (next.type_id === 'R07') {
      const resolved = resolveR07Content(
        next.payload?.content as Parameters<typeof resolveR07Content>[0],
        next.payload?.subQuestions,
        next.correctAnswer,
      );
      const totalScore = syncR07AggregatedScore(resolved.subQuestions);
      setDraft({
        ...next,
        score: totalScore || next.score,
        correctAnswer: next.correctAnswer || buildR07CorrectAnswer(resolved.subQuestions),
        payload: {
          ...next.payload,
          subQuestions: resolved.subQuestions,
          content: {
            ...(next.payload?.content ?? {}),
            article: resolved.article,
            articlePinyin: resolved.articlePinyin,
            paragraphIndent: resolved.paragraphIndent,
          },
        },
      });
      return;
    }
    if (isJudgmentQuestionType(next.type_id)) {
      setDraft(normalizeJudgmentQuestion(next));
      return;
    }
    if (next.type_id === 'R09') {
      setDraft(normalizeR09Question(next));
      return;
    }
    if (next.type_id === 'W01') {
      setDraft(normalizeW01Question(next));
      return;
    }
    if (next.type_id === 'W02') {
      setDraft(normalizeW02Question(next));
      return;
    }
    if (next.type_id === 'W03') {
      setDraft(normalizeW03Question(next));
      return;
    }
    if (next.type_id === 'W04') {
      setDraft(normalizeW04Question(next));
      return;
    }
    setDraft(next);
  }, [question]);

  const typeDef = types.find((t) => t.id === draft.type_id);
  const registry = getRegistryEntry(draft.type_id, defaultCompoundForType(draft.type_id));

  const visibleTypes = useMemo(
    () => types.filter((t) => !t.id.startsWith('T')),
    [types],
  );

  const explanationByLang = useMemo(
    () => resolveExplanationByLang(draft.explanation, draft.explanationByLang),
    [draft.explanation, draft.explanationByLang],
  );

  const levelNumber = useMemo(() => {
    if (draft.level === 'HSK7-9') return 7;
    return levelToNumber(draft.level) ?? 1;
  }, [draft.level]);

  const difficulty = draft.difficulty && draft.difficulty >= 1 ? draft.difficulty : 2;

  const requiredSummary = useMemo(
    () => getQuestionRequiredFieldSummary(draft.type_id),
    [draft.type_id],
  );

  const options =
    draft.payload?.runtimeOptions ??
    (draft.options ?? []).map((o) => ({
      key: o.label,
      text: o.text,
      pinyin: o.pinyin,
      image: o.image,
    }));

  const usesImageOptions = isImageOptionQuestionType(draft.type_id);
  const isJudgment = isJudgmentQuestionType(draft.type_id);
  const isL02 = draft.type_id === 'L02';
  const isR01 = draft.type_id === 'R01';
  const isR02 = draft.type_id === 'R02';
  const isR03 = draft.type_id === 'R03';
  const isR04 = draft.type_id === 'R04';
  const isR05 = draft.type_id === 'R05';
  const isR06 = draft.type_id === 'R06';
  const isR07 = draft.type_id === 'R07';
  const isR08 = draft.type_id === 'R08';
  const isR09 = draft.type_id === 'R09';
  const isW01 = draft.type_id === 'W01';
  const isW02 = draft.type_id === 'W02';
  const isW03 = draft.type_id === 'W03';
  const isW04 = draft.type_id === 'W04';
  const isL05 = draft.type_id === 'L05';
  const usesChoiceSubQuestions = isL05;
  const usesAggregatedScore = isL02 || isL05 || isR07;
  const supportsExampleFlag = supportsQuestionExampleFlag(draft.type_id);
  const usesTextOptions =
    !usesImageOptions &&
    !isJudgment &&
    !isL02 &&
    !isR01 &&
    !isR02 &&
    !isR03 &&
    !isR04 &&
    !isR05 &&
    !isR06 &&
    !isR07 &&
    !isR09 &&
    !isW01 &&
    !isW02 &&
    !isW03 &&
    !isW04 &&
    !usesChoiceSubQuestions &&
    (registry?.editorFields.includes('options') ?? false);
  const imageOptions = useMemo(() => {
    if (!usesImageOptions) return options;
    if (options.length >= 2) return options;
    return DEFAULT_IMAGE_OPTIONS;
  }, [usesImageOptions, options]);

  const textOptions = useMemo(() => {
    if (!usesTextOptions) return options;
    if (options.length >= 2) return options;
    return defaultTextOptionsForType(draft.type_id);
  }, [usesTextOptions, options, draft.type_id]);

  const l02SubQuestions = draft.payload?.subQuestions ?? [];
  const choiceSubQuestions = isL05 ? l02SubQuestions : [];
  const r07SubQuestions = isR07 ? l02SubQuestions : [];
  const compoundSubQuestions = isL02 ? l02SubQuestions : isR07 ? r07SubQuestions : choiceSubQuestions;
  const compoundTotalScore = useMemo(
    () => sumSubQuestionScores(compoundSubQuestions),
    [compoundSubQuestions],
  );

  const imageOptionKeys = useMemo(() => imageOptions.map((o) => o.key), [imageOptions]);

  const r01Sentences = useMemo(() => {
    if (!isR01) return [];
    const stored = draft.payload?.content?.sentences as HskMatchSentence[] | undefined;
    return resolveR01Sentences(stored, draft.correctAnswer, imageOptions);
  }, [isR01, draft.payload?.content, draft.correctAnswer, imageOptions]);

  const r01Pairings = useMemo(() => {
    if (!isR01) return {};
    return pairingsFromR01CorrectAnswer(draft.correctAnswer, imageOptionKeys);
  }, [isR01, draft.correctAnswer, imageOptionKeys]);

  const l02Pairings = useMemo(() => {
    if (!isL02) return {};
    return pairingsFromL02SubQuestions(l02SubQuestions, imageOptionKeys);
  }, [isL02, l02SubQuestions, imageOptionKeys]);

  const r02QuestionItems = useMemo(() => {
    if (!isR02) return [];
    const content = draft.payload?.content as { questionItems?: HskR02QuestionItem[] } | undefined;
    return resolveR02QuestionItems(content?.questionItems, draft.correctAnswer);
  }, [isR02, draft.payload?.content, draft.correctAnswer]);

  const r02AnswerItems = useMemo(() => {
    if (!isR02) return [];
    const content = draft.payload?.content as { answerItems?: HskR02AnswerItem[] } | undefined;
    return resolveR02AnswerItems(content?.answerItems, draft.correctAnswer, r02QuestionItems.length);
  }, [isR02, draft.payload?.content, draft.correctAnswer, r02QuestionItems.length]);

  const r02Pairings = useMemo(() => {
    if (!isR02) return {};
    return pairingsFromR02CorrectAnswer(draft.correctAnswer);
  }, [isR02, draft.correctAnswer]);

  const r03SentenceBlanks = useMemo(() => {
    if (!isR03) return [];
    const content = draft.payload?.content as { sentenceBlanks?: HskR03SentenceBlank[] } | undefined;
    return resolveR03SentenceBlanks(content?.sentenceBlanks, draft.correctAnswer);
  }, [isR03, draft.payload?.content, draft.correctAnswer]);

  const r03WordItems = useMemo(() => {
    if (!isR03) return [];
    const content = draft.payload?.content as
      | { wordItems?: HskR03WordItem[]; wordBank?: string[] }
      | undefined;
    return resolveR03WordItems(
      content?.wordItems,
      draft.payload?.runtimeOptions,
      draft.options,
      content?.wordBank,
      draft.correctAnswer,
      r03SentenceBlanks.length,
    );
  }, [isR03, draft.payload, draft.options, draft.correctAnswer, r03SentenceBlanks.length]);

  const r03Pairings = useMemo(() => {
    if (!isR03) return {};
    const content = draft.payload?.content as
      | { sentenceBlanks?: HskR03SentenceBlank[]; pairings?: Record<string, string> }
      | undefined;
    return pairingsFromR03Data(
      draft.correctAnswer,
      r03SentenceBlanks,
      r03WordItems,
      content?.sentenceBlanks,
      content?.pairings,
    );
  }, [isR03, draft.correctAnswer, r03SentenceBlanks, r03WordItems, draft.payload?.content]);

  const r04Segments = useMemo(() => {
    if (!isR04) return [];
    const content = draft.payload?.content as
      | {
          segments?: HskR04Segment[];
          sentences?: Array<{ id?: string; key?: string; text?: string; pinyin?: string }>;
        }
      | undefined;
    return resolveR04Segments(content?.segments ?? content?.sentences, draft.correctAnswer);
  }, [isR04, draft.payload?.content, draft.correctAnswer]);

  const r05Content = useMemo(() => {
    if (!isR05) return null;
    return resolveR05Content(
      draft.payload?.content as Parameters<typeof resolveR05Content>[0],
      draft.correctAnswer,
    );
  }, [isR05, draft.payload?.content, draft.correctAnswer]);

  const r06Content = useMemo(() => {
    if (!isR06) return null;
    return resolveR06Content(
      draft.payload?.content as Parameters<typeof resolveR06Content>[0],
      draft.correctAnswer,
    );
  }, [isR06, draft.payload?.content, draft.correctAnswer]);

  const r07Content = useMemo(() => {
    if (!isR07) return null;
    return resolveR07Content(
      draft.payload?.content as Parameters<typeof resolveR07Content>[0],
      draft.payload?.subQuestions,
      draft.correctAnswer,
    );
  }, [isR07, draft.payload?.content, draft.payload?.subQuestions, draft.correctAnswer]);

  const r09Options = useMemo(() => {
    if (!isR09) return [];
    return resolveR09Options(draft);
  }, [isR09, draft.payload?.runtimeOptions, draft.options]);

  const r09SubItems = useMemo(() => {
    if (!isR09) return [] as HskR09SubItem[];
    return resolveR09SubItems(draft);
  }, [isR09, draft.payload?.content, draft.correctAnswer, draft.score]);

  const w01ComponentParts = useMemo(() => {
    if (!isW01) return [];
    return resolveW01ComponentParts(draft);
  }, [isW01, draft.payload?.content, draft.payload?.runtimeOptions]);

  const w01WordMatches = useMemo(() => {
    if (!isW01) return [];
    return resolveW01WordMatches(draft);
  }, [isW01, draft.payload?.content, draft.payload?.runtimeOptions]);

  const w02Hints = useMemo(() => {
    if (!isW02) return [] as HskW02PinyinHint[];
    return resolveW02PinyinHints(draft);
  }, [isW02, draft.payload?.content, draft.correctAnswer, draft.question_uid]);

  const w02ShowFillFeedback = useMemo(() => {
    if (!isW02) return true;
    return resolveW02ShowFillFeedback(draft);
  }, [isW02, draft.payload?.content]);

  const w03Content = useMemo(() => {
    if (!isW03) return { keywords: [] as string[], sampleAnswer: '', word: '' };
    return resolveW03Content(draft);
  }, [isW03, draft.payload?.content, draft.explanation]);

  const w04Content = useMemo(() => {
    if (!isW04) return { topic: '', keyword: '', minWords: 50, prompt: '', instruction: '' };
    return resolveW04Content(draft);
  }, [isW04, draft.payload?.content]);

  const judgmentContent = useMemo(
    () => resolveJudgmentContent(draft),
    [draft.payload?.content, draft.payload?.audioTranscript],
  );

  const showAudioSection = registry?.editorFields.includes('audio') || !!draft.audioUrl;
  const audioUrl = draft.payload?.audioUrl ?? draft.audioUrl ?? '';
  const audioTranscript = draft.payload?.audioTranscript ?? '';
  const questionImageUrl = resolveQuestionImageUrl(draft);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2200);
  };

  const update = <K extends keyof HskQuestionRow>(key: K, value: HskQuestionRow[K]) => {
    setDraft((prev) => ({ ...prev, [key]: value, updatedAt: new Date().toISOString() }));
  };

  const syncIsExample = (isExample: boolean) => {
    setDraft((prev) => ({
      ...prev,
      isExample,
      score: isExample ? 0 : prev.score > 0 ? prev.score : typeDef?.defaultScore ?? 1,
      updatedAt: new Date().toISOString(),
    }));
  };

  const stemFieldEnabled =
    (draft.payload?.content as { showStemField?: boolean } | undefined)?.showStemField ??
    Boolean(draft.stem.trim());

  const syncStemFieldEnabled = (enabled: boolean) => {
    setDraft((prev) => ({
      ...prev,
      stem: enabled ? prev.stem : '',
      payload: {
        ...prev.payload,
        content: { ...(prev.payload?.content ?? {}), showStemField: enabled },
      },
      updatedAt: new Date().toISOString(),
    }));
  };

  const syncRuntimeOptions = (next: HskRuntimeOption[]) => {
    const rowOptions = next.map((o) => ({
      label: o.key,
      text: o.text ?? '',
      pinyin: o.pinyin,
      image: o.image,
    }));
    setDraft((prev) => {
      const patch: Partial<HskQuestionRow> = {
        options: rowOptions,
        payload: { ...prev.payload, runtimeOptions: next },
        imageStatus: next.some((o) => o.image) ? 'ready' : prev.imageStatus,
        updatedAt: new Date().toISOString(),
      };
      if (prev.type_id === 'L02' && prev.payload?.subQuestions?.length) {
        const keys = next.map((o) => o.key);
        patch.correctAnswer = buildLegacyL02CorrectAnswer(prev.payload.subQuestions, keys);
      }
      return { ...prev, ...patch };
    });
  };

  const syncL02SubQuestions = (next: HskSubQuestionPayload[]) => {
    setDraft((prev) => {
      const keys =
        prev.payload?.runtimeOptions?.map((o) => o.key) ??
        (prev.options ?? []).map((o) => o.label);
      const totalScore = sumSubQuestionScores(next);
      return {
        ...prev,
        score: totalScore,
        correctAnswer: buildLegacyL02CorrectAnswer(next, keys),
        payload: { ...prev.payload, subQuestions: next },
        updatedAt: new Date().toISOString(),
      };
    });
  };

  const syncL02Pairings = (pairings: Record<string, string | 'distractor' | ''>) => {
    setDraft((prev) => {
      const keys =
        prev.payload?.runtimeOptions?.map((o) => o.key) ??
        (prev.options ?? []).map((o) => o.label);
      const subs = prev.payload?.subQuestions ?? [];
      const nextSubs = applyL02ImagePairings(subs, keys, pairings);
      const totalScore = sumSubQuestionScores(nextSubs);
      return {
        ...prev,
        score: totalScore,
        correctAnswer: buildLegacyL02CorrectAnswer(nextSubs, keys),
        payload: { ...prev.payload, subQuestions: nextSubs },
        updatedAt: new Date().toISOString(),
      };
    });
  };

  const syncR01Sentences = (sentences: HskMatchSentence[]) => {
    setDraft((prev) => ({
      ...prev,
      payload: {
        ...prev.payload,
        content: { ...(prev.payload?.content ?? {}), sentences },
      },
      updatedAt: new Date().toISOString(),
    }));
  };

  const syncR01Pairings = (pairings: Record<string, string | 'distractor' | ''>) => {
    setDraft((prev) => ({
      ...prev,
      correctAnswer: buildR01CorrectAnswer(pairings, imageOptionKeys),
      updatedAt: new Date().toISOString(),
    }));
  };

  const syncR02QuestionItems = (questionItems: HskR02QuestionItem[]) => {
    setDraft((prev) => ({
      ...prev,
      payload: {
        ...prev.payload,
        content: { ...(prev.payload?.content ?? {}), questionItems },
      },
      updatedAt: new Date().toISOString(),
    }));
  };

  const syncR02AnswerItems = (answerItems: HskR02AnswerItem[]) => {
    setDraft((prev) => ({
      ...prev,
      payload: {
        ...prev.payload,
        content: { ...(prev.payload?.content ?? {}), answerItems },
      },
      updatedAt: new Date().toISOString(),
    }));
  };

  const syncR02Pairings = (pairings: Record<string, string>) => {
    setDraft((prev) => ({
      ...prev,
      correctAnswer: buildR02CorrectAnswer(pairings),
      updatedAt: new Date().toISOString(),
    }));
  };

  const syncR03Payload = (
    sentenceBlanks: HskR03SentenceBlank[],
    wordItems: HskR03WordItem[],
    pairings: Record<string, string>,
  ) => {
    const runtimeOptions = wordItemsToRuntimeOptions(wordItems);
    setDraft((prev) => ({
      ...prev,
      options: runtimeOptions.map((o) => ({
        label: o.key,
        text: o.text ?? '',
        pinyin: o.pinyin,
      })),
      correctAnswer: buildR03CorrectAnswer(pairings, sentenceBlanks, wordItems),
      payload: {
        ...prev.payload,
        runtimeOptions,
        content: {
          ...(prev.payload?.content ?? {}),
          sentenceBlanks,
          wordItems,
          pairings,
        },
      },
      updatedAt: new Date().toISOString(),
    }));
  };

  const syncR03All = (
    sentenceBlanks: HskR03SentenceBlank[],
    wordItems: HskR03WordItem[],
    pairings: Record<string, string>,
  ) => {
    const selectedIds = new Set(Object.values(pairings).filter(Boolean));
    const nextWordItems =
      selectedIds.size > 0
        ? wordItems.map((item) =>
            selectedIds.has(item.id) && item.isDistractor
              ? { ...item, isDistractor: false }
              : item,
          )
        : wordItems;
    syncR03Payload(sentenceBlanks, nextWordItems, pairings);
  };

  const syncR03SentenceBlanks = (sentenceBlanks: HskR03SentenceBlank[]) => {
    syncR03All(sentenceBlanks, r03WordItems, r03Pairings);
  };

  const syncR03WordItems = (wordItems: HskR03WordItem[]) => {
    syncR03All(r03SentenceBlanks, wordItems, r03Pairings);
  };

  const syncR03Pairings = (pairings: Record<string, string>) => {
    syncR03All(r03SentenceBlanks, r03WordItems, pairings);
  };

  const syncR04Segments = (segments: HskR04Segment[]) => {
    const rekeyed = rekeyR04Segments(segments);
    setDraft((prev) => {
      const validIds = new Set(rekeyed.map((segment) => segment.id));
      const filteredOrder = parseR04CorrectOrder(prev.correctAnswer).filter((id) =>
        validIds.has(id),
      );
      return {
        ...prev,
        correctAnswer: buildR04CorrectAnswer(filteredOrder),
        payload: {
          ...prev.payload,
          content: { ...(prev.payload?.content ?? {}), segments: rekeyed },
        },
        updatedAt: new Date().toISOString(),
      };
    });
  };

  const syncR05Content = (patch: {
    paragraph?: string;
    paragraphPinyin?: string;
    wordBank?: HskR05WordOption[];
    blankAnswers?: Record<number, string>;
    blankPinyins?: Record<number, string>;
  }) => {
    setDraft((prev) => {
      const current = resolveR05Content(
        prev.payload?.content as Parameters<typeof resolveR05Content>[0],
        prev.correctAnswer,
      );
      const paragraph = patch.paragraph ?? current.paragraph;
      const paragraphPinyin = patch.paragraphPinyin ?? current.paragraphPinyin;
      const wordBank = rekeyR05WordBank(patch.wordBank ?? current.wordBank);
      const blankIndices = resolveR05BlankIndices(paragraph, prev.correctAnswer);
      const sourceAnswers = patch.blankAnswers ?? current.blankAnswers;
      const blankAnswers: Record<number, string> = {};
      for (const index of blankIndices) {
        if (sourceAnswers[index]) blankAnswers[index] = sourceAnswers[index];
      }
      const sourcePinyins = patch.blankPinyins ?? current.blankPinyins;
      const blankPinyins: Record<number, string> = {};
      for (const index of blankIndices) {
        if (sourcePinyins[index]?.trim()) blankPinyins[index] = sourcePinyins[index].trim();
      }
      const runtimeOptions = wordBank.map((option) => ({
        key: option.key,
        text: option.text,
        pinyin: option.pinyin,
      }));
      return {
        ...prev,
        correctAnswer: buildR05CorrectAnswer(blankAnswers, blankIndices),
        options: runtimeOptions.map((option) => ({
          label: option.key,
          text: option.text ?? '',
          pinyin: option.pinyin,
        })),
        payload: {
          ...prev.payload,
          runtimeOptions,
          content: {
            ...(prev.payload?.content ?? {}),
            paragraph,
            paragraphPinyin,
            wordBank,
            blankPinyins,
          },
        },
        updatedAt: new Date().toISOString(),
      };
    });
  };

  const syncR06Content = (patch: {
    article?: string;
    articlePinyin?: string;
    blanks?: HskR06Blank[];
  }) => {
    setDraft((prev) => {
      const current = resolveR06Content(
        prev.payload?.content as Parameters<typeof resolveR06Content>[0],
        prev.correctAnswer,
      );
      const article = patch.article ?? current.article;
      const articlePinyin = patch.articlePinyin ?? current.articlePinyin;
      const blanks = syncR06Blanks(
        article,
        patch.blanks ?? current.blanks,
        prev.correctAnswer,
      );
      const { blankPinyins: _legacyBlankPinyins, ...restContent } =
        (prev.payload?.content as Record<string, unknown> | undefined) ?? {};
      return {
        ...prev,
        correctAnswer: buildR06CorrectAnswer(blanks),
        payload: {
          ...prev.payload,
          content: {
            ...restContent,
            article,
            articlePinyin,
            blanks,
          },
        },
        updatedAt: new Date().toISOString(),
      };
    });
  };

  const syncR07Content = (patch: {
    article?: string;
    articlePinyin?: string;
    paragraphIndent?: boolean;
    subQuestions?: HskSubQuestionPayload[];
  }) => {
    setDraft((prev) => {
      const current = resolveR07Content(
        prev.payload?.content as Parameters<typeof resolveR07Content>[0],
        prev.payload?.subQuestions,
        prev.correctAnswer,
      );
      const article = patch.article ?? current.article;
      const articlePinyin = patch.articlePinyin ?? current.articlePinyin;
      const paragraphIndent = patch.paragraphIndent ?? current.paragraphIndent;
      const subQuestions = patch.subQuestions ?? current.subQuestions;
      const totalScore = syncR07AggregatedScore(subQuestions);
      return {
        ...prev,
        score: totalScore,
        correctAnswer: buildR07CorrectAnswer(subQuestions),
        payload: {
          ...prev.payload,
          subQuestions,
          content: {
            ...(prev.payload?.content ?? {}),
            article,
            articlePinyin,
            paragraphIndent,
          },
        },
        updatedAt: new Date().toISOString(),
      };
    });
  };

  const syncChoiceSubQuestions = (next: HskSubQuestionPayload[]) => {
    const totalScore = sumSubQuestionScores(next);
    setDraft((prev) => ({
      ...prev,
      score: totalScore,
      payload: { ...prev.payload, subQuestions: next },
      updatedAt: new Date().toISOString(),
    }));
  };

  const updateAudioUrl = (url: string) => {
    setDraft((prev) => ({
      ...prev,
      audioUrl: url,
      audioStatus: url ? 'ready' : 'none',
      payload: { ...prev.payload, audioUrl: url },
      updatedAt: new Date().toISOString(),
    }));
  };

  const updateAudioTranscript = (text: string) => {
    setDraft((prev) => {
      const payload = {
        ...prev.payload,
        audioTranscript: text,
        content: { ...(prev.payload?.content ?? {}) },
      };
      if (prev.type_id === 'L06') {
        payload.content = { ...payload.content, sentence: text };
      }
      return {
        ...prev,
        payload,
        updatedAt: new Date().toISOString(),
      };
    });
  };

  const updateJudgmentSentence = (sentence: string) => {
    setDraft((prev) => ({
      ...prev,
      payload: buildJudgmentContentPatch(prev, { sentence }),
      updatedAt: new Date().toISOString(),
    }));
  };

  const updateJudgmentSentencePinyin = (sentencePinyin: string) => {
    setDraft((prev) => ({
      ...prev,
      payload: buildJudgmentContentPatch(prev, { sentencePinyin }),
      updatedAt: new Date().toISOString(),
    }));
  };

  const updateImageUrl = (url: string) => {
    setDraft((prev) => ({
      ...prev,
      imageStatus: url ? 'ready' : 'pending',
      payload: {
        ...prev.payload,
        content: { ...(prev.payload?.content ?? {}), imageUrl: url },
      },
      updatedAt: new Date().toISOString(),
    }));
  };

  const syncR09Options = (next: HskRuntimeOption[]) => {
    setDraft((prev) => {
      const relabeled = relabelR09Options(next);
      const rowOptions = relabeled.map((opt) => ({
        label: opt.key,
        text: opt.text ?? '',
        pinyin: opt.pinyin,
      }));
      const subItems = resolveR09SubItems(prev).map((item) =>
        relabeled.some((opt) => opt.key === item.answer) ? item : { ...item, answer: '' },
      );
      return {
        ...prev,
        correctAnswer: buildR09CorrectAnswer(subItems),
        options: rowOptions,
        payload: buildR09PayloadPatch(prev, { options: relabeled, subItems }),
        updatedAt: new Date().toISOString(),
      };
    });
  };

  const syncR09SubItems = (next: HskR09SubItem[]) => {
    setDraft((prev) => {
      const subItems = next;
      const totalScore = syncR09AggregatedScore(subItems);
      const hasImages = subItems.some((item) => !!item.imageUrl?.trim());
      return {
        ...prev,
        score: totalScore || prev.score,
        correctAnswer: buildR09CorrectAnswer(subItems),
        imageStatus: hasImages ? 'ready' : prev.imageStatus === 'none' ? 'none' : 'pending',
        payload: buildR09PayloadPatch(prev, { subItems }),
        updatedAt: new Date().toISOString(),
      };
    });
  };

  const syncW01ComponentParts = (next: HskW01ComponentPart[]) => {
    setDraft((prev) => {
      const relabeled = relabelW01ComponentParts(next);
      const wordMatches = relabelW01WordMatches(resolveW01WordMatches(prev), relabeled);
      const rowOptions = relabeled.map((p) => ({ label: p.key, text: p.text }));
      return {
        ...prev,
        correctAnswer: buildW01CorrectAnswer(wordMatches),
        options: rowOptions,
        payload: buildW01PayloadPatch(prev, { componentParts: relabeled, wordMatches }),
        updatedAt: new Date().toISOString(),
      };
    });
  };

  const syncW01WordMatches = (next: HskW01WordMatch[]) => {
    setDraft((prev) => {
      const parts = resolveW01ComponentParts(prev);
      const wordMatches = relabelW01WordMatches(next, parts);
      return {
        ...prev,
        correctAnswer: buildW01CorrectAnswer(wordMatches),
        payload: buildW01PayloadPatch(prev, { wordMatches }),
        updatedAt: new Date().toISOString(),
      };
    });
  };

  const syncW02Hints = (pinyinHints: HskW02PinyinHint[]) => {
    setDraft((prev) => ({
      ...prev,
      correctAnswer: buildW02CorrectAnswer(pinyinHints),
      payload: buildW02PayloadPatch(prev, { pinyinHints }),
      updatedAt: new Date().toISOString(),
    }));
  };

  const syncW02ShowFillFeedback = (showFillFeedback: boolean) => {
    setDraft((prev) => ({
      ...prev,
      payload: buildW02PayloadPatch(prev, { showFillFeedback }),
      updatedAt: new Date().toISOString(),
    }));
  };

  const syncW03Keywords = (keywords: string[]) => {
    setDraft((prev) => ({
      ...prev,
      payload: buildW03PayloadPatch(prev, { keywords }),
      updatedAt: new Date().toISOString(),
    }));
  };

  const syncW03SampleAnswer = (sampleAnswer: string) => {
    setDraft((prev) => ({
      ...prev,
      payload: buildW03PayloadPatch(prev, { sampleAnswer }),
      updatedAt: new Date().toISOString(),
    }));
  };

  const syncW04Topic = (topic: string) => {
    setDraft((prev) => ({
      ...prev,
      payload: buildW04PayloadPatch(prev, { topic }),
      updatedAt: new Date().toISOString(),
    }));
  };

  const syncW04Keyword = (keyword: string) => {
    setDraft((prev) => ({
      ...prev,
      payload: buildW04PayloadPatch(prev, { keyword }),
      updatedAt: new Date().toISOString(),
    }));
  };

  const syncW04MinWords = (minWords: number) => {
    setDraft((prev) => ({
      ...prev,
      payload: buildW04PayloadPatch(prev, { minWords }),
      updatedAt: new Date().toISOString(),
    }));
  };

  const updateTags = (nextTags: string[]) => {
    setDraft((prev) => ({ ...prev, tags: nextTags, updatedAt: new Date().toISOString() }));
  };

  const handleGlobalTagsChange = (nextTags: HskQuestionTag[]) => {
    onGlobalTagsChange?.(nextTags);
    const labelSet = new Set(nextTags.map((tag) => tag.label));
    setDraft((prev) => ({
      ...prev,
      tags: prev.tags.filter((label) => labelSet.has(label)),
      updatedAt: new Date().toISOString(),
    }));
  };

  const handleTagCatalogChange = (nextCatalog: HskQuestionTagCatalog) => {
    onTagCatalogChange?.(nextCatalog);
  };

  const updateExplanationLang = (lang: LangKey, value: string) => {
    setDraft((prev) => {
      const nextByLang = {
        ...resolveExplanationByLang(prev.explanation, prev.explanationByLang),
        [lang]: value,
      };
      return {
        ...prev,
        explanationByLang: nextByLang,
        explanation: lang === 'CN' ? value : (nextByLang.CN ?? prev.explanation),
        updatedAt: new Date().toISOString(),
      };
    });
  };

  const handleAutoTranslateExplanation = () => {
    if (explanationLangTab === 'PY') return;
    const seed = (explanationByLang.CN ?? explanationByLang[explanationLangTab as LangKey] ?? '').trim();
    if (!seed) return;
    const next = autoTranslateTitleByLang(seed);
    setDraft((prev) => ({
      ...prev,
      explanationByLang: next,
      explanation: next.CN ?? prev.explanation,
      updatedAt: new Date().toISOString(),
    }));
  };

  const handleSave = (status: HskQuestionStatus) => {
    if (isJudgment && !questionImageUrl) {
      showToast('请上传题目图片');
      return;
    }
    if (isJudgment && draft.correctAnswer !== 'A' && draft.correctAnswer !== 'B') {
      showToast('请选择正确答案');
      return;
    }
    if (isR08) {
      const { sentence, sentencePinyin } = resolveJudgmentContent(draft);
      if (!sentence.trim()) {
        showToast('请填写判断句');
        return;
      }
      if (levelNumber <= 2 && sentence.trim() && !sentencePinyin.trim()) {
        showToast('请填写判断句拼音');
        return;
      }
    }
    if (isR09 && r09Options.filter((o) => o.text?.trim()).length < 2) {
      showToast('请至少填写 2 个词语选项');
      return;
    }
    if (isR09 && levelNumber <= 2 && r09Options.some((o) => o.text?.trim() && !o.pinyin?.trim())) {
      showToast('请为每个词语填写拼音');
      return;
    }
    if (isR09 && r09SubItems.filter((item) => !item.isExample).length === 0) {
      showToast('请至少添加 1 道计分题目');
      return;
    }
    if (isR09 && r09SubItems.some((item) => !item.isExample && !item.dialogue.trim())) {
      showToast('请填写每道题的对话内容');
      return;
    }
    if (
      isR09 &&
      levelNumber <= 2 &&
      r09SubItems.some((item) => item.dialogue.trim() && !item.dialoguePinyin?.trim())
    ) {
      showToast('请为每道题填写对话拼音');
      return;
    }
    if (isR09 && r09SubItems.some((item) => !item.isExample && !item.imageUrl?.trim())) {
      showToast('请为每道题上传图片');
      return;
    }
    if (isR09 && r09SubItems.some((item) => !item.isExample && !item.answer)) {
      showToast('请为每道题选择正确答案');
      return;
    }
    if (isW01 && w01ComponentParts.filter((p) => p.text.trim()).length < 2) {
      showToast('请至少填写 2 个部件选项');
      return;
    }
    if (isW01 && w01WordMatches.some((m) => !m.incomplete.trim() || !m.word.trim() || !m.componentKey)) {
      showToast('请完善词语匹配配置');
      return;
    }
    if (isW02 && w02Hints.some((h) => !isW02HintComplete(h))) {
      showToast('请完善每条挖空句：句子文本需含（pinyin）挖空标记，并填写正确答案');
      return;
    }
    if (isW03 && !questionImageUrl) {
      showToast('请上传题目图片');
      return;
    }
    if (isW03 && w03Content.keywords.length === 0) {
      showToast('请至少添加 1 个关键词');
      return;
    }
    if (isW04 && !w04Content.topic.trim()) {
      showToast('请填写主题 / 题目');
      return;
    }
    if (isW04 && w04Content.minWords < 1) {
      showToast('最低字数至少为 1');
      return;
    }
    if (isL02 && compoundSubQuestions.length === 0) {
      showToast('请至少添加 1 道子题');
      return;
    }
    if (isL05 && compoundSubQuestions.length === 0) {
      showToast('请至少添加 1 道子题');
      return;
    }
    onSave({ ...draft, status });
  };

  const exampleFieldEditor = supportsExampleFlag ? (
    <div className="hsk-question-edit-example-field">
      <div className={`hsk-question-edit-stem-toggle-bar${draft.isExample ? ' is-on' : ' is-off'}`}>
        <div className="hsk-question-edit-stem-toggle-info">
          <span className="hsk-question-edit-stem-toggle-title">设为例题</span>
          <span className="hsk-question-edit-stem-toggle-status">
            {draft.isExample
              ? '已开启 · 不计分，预览显示「例如」'
              : '已关闭 · 正常计分题目'}
          </span>
        </div>
        <button
          type="button"
          className={`hsk-question-edit-stem-switch${draft.isExample ? ' is-on' : ' is-off'}`}
          aria-pressed={!!draft.isExample}
          onClick={() => syncIsExample(!draft.isExample)}
        >
          <span className="hsk-question-edit-stem-switch-track" aria-hidden>
            <span className="hsk-question-edit-stem-switch-thumb" />
          </span>
          <span className="hsk-question-edit-stem-switch-label">
            {draft.isExample ? '开启' : '关闭'}
          </span>
        </button>
      </div>
    </div>
  ) : null;

  const stemFieldEditor = (
    <div className="form-group hsk-question-edit-stem-field">
      <div className={`hsk-question-edit-stem-toggle-bar${stemFieldEnabled ? ' is-on' : ' is-off'}`}>
        <div className="hsk-question-edit-stem-toggle-info">
          <span className="hsk-question-edit-stem-toggle-title">题干 (stem)</span>
          <span className="hsk-question-edit-stem-toggle-status">
            {stemFieldEnabled
              ? isJudgment
                ? '已开启 · 预览显示顶部说明'
                : '已开启 · 预览显示题干'
              : isJudgment
                ? '已关闭 · 预览不显示顶部说明'
                : '已关闭 · 预览不显示题干'}
          </span>
        </div>
        <button
          type="button"
          className={`hsk-question-edit-stem-switch${stemFieldEnabled ? ' is-on' : ' is-off'}`}
          aria-pressed={stemFieldEnabled}
          onClick={() => syncStemFieldEnabled(!stemFieldEnabled)}
        >
          <span className="hsk-question-edit-stem-switch-track" aria-hidden>
            <span className="hsk-question-edit-stem-switch-thumb" />
          </span>
          <span className="hsk-question-edit-stem-switch-label">
            {stemFieldEnabled ? '显示' : '隐藏'}
          </span>
        </button>
      </div>
      {stemFieldEnabled ? (
        <textarea
          rows={isJudgment ? 2 : 3}
          value={draft.stem}
          onChange={(e) => update('stem', e.target.value)}
          placeholder={
            isJudgment
              ? draft.type_id === 'L06'
                ? '如：请听句子，判断与图片内容是否一致。'
                : '如：请看图片和句子，判断句子描述是否与图片一致。'
              : '如需显示文字提示可填写，否则关闭开关'
          }
        />
      ) : (
        <p className="hsk-question-edit-stem-hint">
          {isJudgment
            ? '题干已隐藏：右侧预览不再显示绿色说明条；可重新打开开关后再编辑。'
            : '题干已隐藏：右侧预览不再显示题干，仅保留音频、选项等内容。'}
        </p>
      )}
    </div>
  );

  const stemSectionEditors = (
    <div className="hsk-question-edit-stem-block">
      {exampleFieldEditor}
      {stemFieldEditor}
    </div>
  );

  if (fullscreenPreview) {
    return (
      <div className="hsk-question-edit-page hsk-question-edit-page-fullscreen">
        <header className="hsk-question-edit-topbar">
          <button type="button" className="hsk-question-edit-back" onClick={() => setFullscreenPreview(false)}>
            ← 返回编辑
          </button>
          <span className="hsk-question-edit-topbar-title">全屏预览 · {draft.question_uid}</span>
        </header>
        <div className="hsk-question-edit-fullscreen-preview">
          <HskQuestionEditPreview
            question={draft}
            typeDef={typeDef}
            tabletLandscape={tabletPreview}
            onTabletLandscapeChange={setTabletPreview}
            onFullscreen={() => setFullscreenPreview(false)}
            showToolbarControls
          />
        </div>
      </div>
    );
  }

  return (
    <div className="hsk-question-edit-page">
      <header className="hsk-question-edit-topbar">
        <div className="hsk-question-edit-topbar-left">
          <button type="button" className="hsk-question-edit-back" onClick={onBack}>
            返回
          </button>
          <h1 className="hsk-question-edit-title">编辑题目 {draft.question_uid}</h1>
          {typeDef && (
            <span className="hsk-question-edit-type-badge">
              {typeDef.name}
              <span className="hsk-question-edit-type-code">({draft.type_id})</span>
            </span>
          )}
        </div>
        <div className="hsk-question-edit-topbar-right">
          <HskQuestionWorkflowProgress status={draft.status} />
        </div>
      </header>

      <div className="hsk-question-edit-body">
        <div className="hsk-question-edit-form-col">
          <div className="hsk-question-edit-form-inner">
            <SectionHeader icon="📋" title="元数据" />

            <div className="hsk-question-edit-meta-grid">
              <div className="hsk-question-edit-meta-field">
                <label>题目ID</label>
                <input type="text" value={draft.question_uid} readOnly className="input-readonly" />
              </div>
              <div className="hsk-question-edit-meta-field">
                <label>题型</label>
                <HskQuestionEditTypeSelect
                  value={draft.type_id}
                  types={visibleTypes}
                  onChange={(typeId) => {
                    setDraft((prev) => {
                      const next = { ...prev, type_id: typeId, updatedAt: new Date().toISOString() };
                      if (isJudgmentQuestionType(typeId)) return normalizeJudgmentQuestion(next);
                      if (typeId === 'R09') return normalizeR09Question(next);
                      if (typeId === 'W01') return normalizeW01Question(next);
                      if (typeId === 'W02') return normalizeW02Question(next);
                      if (typeId === 'W03') return normalizeW03Question(next);
                      if (typeId === 'W04') return normalizeW04Question(next);
                      return next;
                    });
                  }}
                />
              </div>
              <div className="hsk-question-edit-meta-field is-span-2">
                <label>题目名称</label>
                <input
                  type="text"
                  value={draft.questionName ?? ''}
                  onChange={(e) => update('questionName', e.target.value)}
                  placeholder="为题目起一个便于识别的名称（选填）"
                />
              </div>
              <div className="hsk-question-edit-meta-field">
                <label>HSK级别</label>
                <select
                  value={draft.level}
                  onChange={(e) => update('level', e.target.value as HskLevelCode)}
                >
                  {HSK_QUESTION_LEVELS.map((level) => (
                    <option key={level} value={level}>
                      {level === 'HSK7-9' ? 'HSK 7-9' : level.replace('HSK', 'HSK ')}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="hsk-question-edit-meta-extra">
              {levelNumber >= 3 ? (
                <label className="hsk-question-edit-pinyin-toggle">
                  <input
                    type="checkbox"
                    checked={draft.showPinyinFields ?? false}
                    onChange={(e) => update('showPinyinFields', e.target.checked)}
                  />
                  <span>显示拼音字段</span>
                </label>
              ) : (
                <p className="hsk-question-edit-pinyin-hint">
                  拼音字段：<span className="is-required">HSK1-2 必填 *</span>
                </p>
              )}

              <div className="hsk-question-edit-meta-field">
                <label>难度</label>
                <HskQuestionDifficultySelect
                  value={difficulty}
                  onChange={(value) => update('difficulty', value)}
                />
              </div>
            </div>

            <SectionHeader icon="📝" title="题干与作答" />

            {isJudgment ? (
              <>
                {stemSectionEditors}

                {showAudioSection && (
                  <HskQuestionAudioSection
                    audioUrl={audioUrl}
                    audioTranscript={audioTranscript}
                    required={registry?.editorFields.includes('audio') ?? false}
                    onAudioUrlChange={updateAudioUrl}
                    onAudioTranscriptChange={updateAudioTranscript}
                  />
                )}

                <HskQuestionJudgmentEditor
                  typeId={draft.type_id}
                  correctAnswer={draft.correctAnswer}
                  sentence={judgmentContent.sentence}
                  sentencePinyin={judgmentContent.sentencePinyin}
                  levelNumber={levelNumber}
                  showPinyinFields={draft.showPinyinFields}
                  onCorrectAnswerChange={(answer) => update('correctAnswer', answer)}
                  onSentenceChange={updateJudgmentSentence}
                  onSentencePinyinChange={updateJudgmentSentencePinyin}
                />

                <HskQuestionSingleImageSection
                  imageUrl={questionImageUrl ?? ''}
                  required
                  onChange={updateImageUrl}
                />
              </>
            ) : (
              <>
                {stemSectionEditors}

            {showAudioSection && (
              <HskQuestionAudioSection
                audioUrl={audioUrl}
                audioTranscript={audioTranscript}
                required={registry?.editorFields.includes('audio') ?? false}
                onAudioUrlChange={updateAudioUrl}
                onAudioTranscriptChange={updateAudioTranscript}
              />
            )}

            {usesImageOptions && (
              <HskQuestionImageOptionsEditor
                options={imageOptions}
                correctAnswer={draft.correctAnswer}
                showCorrectToggle={draft.type_id === 'L01'}
                onChange={syncRuntimeOptions}
                onCorrectAnswerChange={(answer) => update('correctAnswer', answer)}
              />
            )}

            {isR01 && (
              <HskQuestionR01MatchEditor
                sentences={r01Sentences}
                imageOptions={imageOptions}
                pairings={r01Pairings}
                levelNumber={levelNumber}
                showPinyinFields={draft.showPinyinFields}
                onSentencesChange={syncR01Sentences}
                onPairingsChange={syncR01Pairings}
              />
            )}

            {isR02 && (
              <HskQuestionR02MatchEditor
                questionItems={r02QuestionItems}
                answerItems={r02AnswerItems}
                pairings={r02Pairings}
                levelNumber={levelNumber}
                showPinyinFields={draft.showPinyinFields}
                onQuestionItemsChange={syncR02QuestionItems}
                onAnswerItemsChange={syncR02AnswerItems}
                onPairingsChange={syncR02Pairings}
              />
            )}

            {isR03 && (
              <HskQuestionR03WordFillEditor
                sentenceBlanks={r03SentenceBlanks}
                wordItems={r03WordItems}
                pairings={r03Pairings}
                levelNumber={levelNumber}
                showPinyinFields={draft.showPinyinFields}
                onSentenceBlanksChange={syncR03SentenceBlanks}
                onWordItemsChange={syncR03WordItems}
                onPairingsChange={syncR03Pairings}
                onBatchSync={syncR03All}
              />
            )}

            {isR04 && (
              <HskQuestionR04SortEditor
                segments={r04Segments}
                correctAnswer={draft.correctAnswer}
                levelNumber={levelNumber}
                showPinyinFields={draft.showPinyinFields}
                onSegmentsChange={syncR04Segments}
                onCorrectAnswerChange={(answer) => update('correctAnswer', answer)}
              />
            )}

            {isR05 && r05Content && (
              <>
                <HskQuestionR05ParagraphEditor
                  paragraph={r05Content.paragraph}
                  paragraphPinyin={r05Content.paragraphPinyin}
                  wordBank={r05Content.wordBank}
                  blankIndices={r05Content.blankIndices}
                  blankAnswers={r05Content.blankAnswers}
                  blankPinyins={r05Content.blankPinyins}
                  levelNumber={levelNumber}
                  showPinyinFields={draft.showPinyinFields}
                  onParagraphChange={(paragraph) => syncR05Content({ paragraph })}
                  onParagraphPinyinChange={(paragraphPinyin) => syncR05Content({ paragraphPinyin })}
                  onWordBankChange={(wordBank) => syncR05Content({ wordBank })}
                  onBlankAnswersChange={(blankAnswers) => syncR05Content({ blankAnswers })}
                  onBlankPinyinsChange={(blankPinyins) => syncR05Content({ blankPinyins })}
                />
                <HskQuestionSingleImageSection
                  imageUrl={questionImageUrl ?? ''}
                  onChange={updateImageUrl}
                />
              </>
            )}

            {isR06 && r06Content && (
              <HskQuestionR06ClozeEditor
                article={r06Content.article}
                articlePinyin={r06Content.articlePinyin}
                blanks={r06Content.blanks}
                onArticleChange={(article) => syncR06Content({ article })}
                onArticlePinyinChange={(articlePinyin) => syncR06Content({ articlePinyin })}
                onBlanksChange={(blanks) => syncR06Content({ blanks })}
              />
            )}

            {isR07 && r07Content && (
              <>
                <HskQuestionR07ReadingEditor
                  article={r07Content.article}
                  articlePinyin={r07Content.articlePinyin}
                  paragraphIndent={r07Content.paragraphIndent}
                  subQuestions={r07Content.subQuestions}
                  levelNumber={levelNumber}
                  showPinyinFields={draft.showPinyinFields}
                  questionUid={draft.question_uid}
                  presetImageUrl={questionImageUrl ?? ''}
                  onArticleChange={(article) => syncR07Content({ article })}
                  onArticlePinyinChange={(articlePinyin) => syncR07Content({ articlePinyin })}
                  onParagraphIndentChange={(paragraphIndent) => {
                    if (!r07Content) return;
                    syncR07Content({
                      paragraphIndent,
                      article: applyRichArticleParagraphIndent(r07Content.article, paragraphIndent),
                      articlePinyin: applyPinyinParagraphIndent(
                        r07Content.articlePinyin,
                        paragraphIndent,
                      ),
                    });
                  }}
                  onSubQuestionsChange={(subQuestions) => syncR07Content({ subQuestions })}
                />
                <HskQuestionSingleImageSection
                  imageUrl={questionImageUrl ?? ''}
                  onChange={updateImageUrl}
                />
              </>
            )}

            {isR09 && (
              <HskQuestionR09Editor
                options={r09Options}
                subItems={r09SubItems}
                levelNumber={levelNumber}
                onOptionsChange={syncR09Options}
                onSubItemsChange={syncR09SubItems}
              />
            )}

            {isW01 && (
              <HskQuestionW01Editor
                componentParts={w01ComponentParts}
                wordMatches={w01WordMatches}
                onComponentPartsChange={syncW01ComponentParts}
                onWordMatchesChange={syncW01WordMatches}
              />
            )}

            {isW02 && (
              <HskQuestionW02Editor
                hints={w02Hints}
                levelNumber={levelNumber}
                showPinyinFields={draft.showPinyinFields}
                showFillFeedback={w02ShowFillFeedback}
                onChange={syncW02Hints}
                onShowFillFeedbackChange={syncW02ShowFillFeedback}
              />
            )}

            {isW03 && (
              <>
                <HskQuestionSingleImageSection
                  imageUrl={questionImageUrl ?? ''}
                  required
                  onChange={updateImageUrl}
                />
                <HskQuestionW03Editor
                  keywords={w03Content.keywords}
                  sampleAnswer={w03Content.sampleAnswer}
                  onKeywordsChange={syncW03Keywords}
                  onSampleAnswerChange={syncW03SampleAnswer}
                />
              </>
            )}

            {isW04 && (
              <>
                <HskQuestionSingleImageSection
                  imageUrl={questionImageUrl ?? ''}
                  onChange={updateImageUrl}
                />
                <HskQuestionW04Editor
                  topic={w04Content.topic}
                  keyword={w04Content.keyword}
                  minWords={w04Content.minWords}
                  onTopicChange={syncW04Topic}
                  onKeywordChange={syncW04Keyword}
                  onMinWordsChange={syncW04MinWords}
                />
              </>
            )}

            {isL02 && (
              <HskQuestionL02SubQuestionsEditor
                subQuestions={l02SubQuestions}
                imageOptions={imageOptions}
                pairings={l02Pairings}
                onChange={syncL02SubQuestions}
                onPairingsChange={syncL02Pairings}
              />
            )}

            {usesChoiceSubQuestions && (
              <HskQuestionChoiceSubQuestionsEditor
                subQuestions={choiceSubQuestions}
                levelNumber={levelNumber}
                showPinyinFields={draft.showPinyinFields}
                onChange={syncChoiceSubQuestions}
              />
            )}

            {usesTextOptions && (
              <HskQuestionTextOptionsEditor
                options={textOptions}
                correctAnswer={draft.correctAnswer}
                typeId={draft.type_id}
                levelNumber={levelNumber}
                showPinyinFields={draft.showPinyinFields}
                onChange={syncRuntimeOptions}
                onCorrectAnswerChange={(answer) => update('correctAnswer', answer)}
              />
            )}

              </>
            )}

            <div className="hsk-question-edit-section-divider" />
            <SectionHeader icon="◎" title="评分参数" />
            <div className="hsk-question-edit-scoring-body">
              {usesAggregatedScore ? (
                <div className="hsk-question-edit-scoring-total">
                  <label>大题总分</label>
                  <p className="hsk-question-edit-scoring-total-value">
                    {draft.isExample ? 0 : compoundTotalScore} 分
                  </p>
                  <p className="hsk-question-edit-scoring-total-hint">
                    {draft.isExample
                      ? '例题不计分'
                      : '由各子题分值累加，不可手动修改'}
                  </p>
                </div>
              ) : (
                <div className="hsk-question-edit-meta-field">
                  <label>
                    分值 <span className="required">*</span>
                  </label>
                  <input
                    type="number"
                    min={draft.isExample ? 0 : 1}
                    max={100}
                    value={draft.isExample ? 0 : draft.score}
                    disabled={!!draft.isExample}
                    onChange={(e) => update('score', Number(e.target.value) || 1)}
                  />
                </div>
              )}
            </div>

            <div className="hsk-question-edit-section-divider" />
            <HskQuestionExplanationSection
              langTab={explanationLangTab}
              onLangTabChange={setExplanationLangTab}
              valueByLang={explanationByLang}
              explanationPinyin={draft.explanationPinyin ?? ''}
              onChange={updateExplanationLang}
              onExplanationPinyinChange={(value) => update('explanationPinyin', value)}
              onAutoTranslate={handleAutoTranslateExplanation}
            />

            <HskQuestionTagsLinksSection
              question={draft}
              tags={tags}
              tagCatalog={tagCatalog}
              onTagsChange={updateTags}
              onGlobalTagsChange={handleGlobalTagsChange}
              onTagCatalogChange={handleTagCatalogChange}
              onToast={showToast}
            />
          </div>
        </div>

        <div className="hsk-question-edit-preview-col">
          <HskQuestionEditPreview
            key={previewResetKey}
            question={draft}
            typeDef={typeDef}
            tabletLandscape={tabletPreview}
            onTabletLandscapeChange={setTabletPreview}
            onFullscreen={() => setFullscreenPreview(true)}
            onResetAnswerState={() => setPreviewResetKey((k) => k + 1)}
            showToolbarControls
          />
        </div>
      </div>

      <footer className="hsk-question-edit-footer">
        <span className="hsk-question-edit-footer-hint">
          <span className="required">*</span> 必填：{requiredSummary.text || '—'} （共 {requiredSummary.count} 项）
        </span>
        <div className="hsk-question-edit-footer-actions">
          <button type="button" className="btn btn-secondary btn-sm" onClick={onBack}>
            取消
          </button>
          <button type="button" className="btn btn-secondary btn-sm" onClick={() => handleSave('draft')}>
            保存草稿
          </button>
          <button
            type="button"
            className="btn btn-primary btn-sm"
            disabled={draft.status === 'published'}
            onClick={() => handleSave('published')}
          >
            {draft.status === 'published' ? '已发布' : '发布'}
          </button>
        </div>
      </footer>

      {toast && <div className="hsk-toast show">{toast}</div>}
    </div>
  );
}
