import { parseParagraphBlankIndices } from './hskR05ParagraphFill';

export type HskR06BlankOption = {
  key: string;
  text: string;
  pinyin?: string;
};

export type HskR06Blank = {
  index: number;
  answer: string;
  options: HskR06BlankOption[];
};

export function defaultR06BlankOptions(count = 4): HskR06BlankOption[] {
  return Array.from({ length: count }, (_, idx) => ({
    key: String.fromCharCode(65 + idx),
    text: '',
    pinyin: '',
  }));
}

export function defaultR06Blank(index: number): HskR06Blank {
  return {
    index,
    answer: '',
    options: defaultR06BlankOptions(),
  };
}

export function rekeyR06BlankOptions(options: HskR06BlankOption[]): HskR06BlankOption[] {
  return options.map((option, idx) => ({
    ...option,
    key: String.fromCharCode(65 + idx),
  }));
}

export function parseR06CorrectAnswer(correctAnswer: string): string[] {
  if (!correctAnswer.trim()) return [];
  return correctAnswer
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean);
}

export function buildR06CorrectAnswer(blanks: HskR06Blank[]): string {
  return blanks
    .slice()
    .sort((a, b) => a.index - b.index)
    .map((blank) => blank.answer?.trim() ?? '')
    .filter(Boolean)
    .join(',');
}

export function resolveR06BlankIndices(article: string, correctAnswer: string): number[] {
  const fromArticle = parseParagraphBlankIndices(article);
  if (fromArticle.length > 0) return fromArticle;
  const answers = parseR06CorrectAnswer(correctAnswer);
  if (answers.length > 0) return answers.map((_, idx) => idx + 1);
  return [1, 2];
}

export function syncR06Blanks(
  article: string,
  existing: Array<Partial<HskR06Blank> & { index: number }> | undefined,
  correctAnswer: string,
): HskR06Blank[] {
  const indices = resolveR06BlankIndices(article, correctAnswer);
  const byIndex = new Map(
    (existing ?? []).map((blank) => [
      blank.index,
      {
        index: blank.index,
        answer: blank.answer ?? '',
        options:
          blank.options && blank.options.length >= 2
            ? rekeyR06BlankOptions(
                blank.options.map((option, idx) => ({
                  key: option.key ?? String.fromCharCode(65 + idx),
                  text: option.text ?? '',
                  pinyin: option.pinyin ?? '',
                })),
              )
            : defaultR06BlankOptions(),
      } satisfies HskR06Blank,
    ]),
  );
  const answerKeys = parseR06CorrectAnswer(correctAnswer);

  return indices.map((index, idx) => {
    const stored = byIndex.get(index);
    if (stored) {
      return {
        ...stored,
        answer: stored.answer || answerKeys[idx] || '',
        options:
          stored.options?.length >= 2
            ? rekeyR06BlankOptions(stored.options)
            : defaultR06BlankOptions(),
      };
    }
    return {
      ...defaultR06Blank(index),
      answer: answerKeys[idx] ?? '',
    };
  });
}

export function resolveR06Content(
  content:
    | {
        article?: string;
        articlePinyin?: string;
        paragraph?: string;
        paragraphPinyin?: string;
        blanks?: Array<Partial<HskR06Blank> & { index: number }>;
      }
    | undefined,
  correctAnswer: string,
): {
  article: string;
  articlePinyin: string;
  blanks: HskR06Blank[];
} {
  const article = content?.article ?? content?.paragraph ?? '';
  const articlePinyin = content?.articlePinyin ?? content?.paragraphPinyin ?? '';
  const blanks = syncR06Blanks(article, content?.blanks, correctAnswer);
  return { article, articlePinyin, blanks };
}

export function renderR06ArticlePreviewHtml(article: string): string {
  if (!article.trim()) return '';

  let anonymousIndex = 0;
  return article
    .replace(/___[（(]\s*(\d+)\s*[）)]___/g, (_, num) => {
      return `<span class="hsk-preview-r06-blank">${num}</span>`;
    })
    .replace(/[（(]\s*(\d+)\s*[）)]/g, (_, num) => {
      return `<span class="hsk-preview-r06-blank">${num}</span>`;
    })
    .replace(/\(\s*\)/g, () => {
      anonymousIndex += 1;
      return `<span class="hsk-preview-r06-blank">${anonymousIndex}</span>`;
    });
}

export function blankOptionLabel(option: HskR06BlankOption): string {
  const text = option.text?.trim();
  return text ? `${option.key}. ${text}` : `${option.key}.`;
}
