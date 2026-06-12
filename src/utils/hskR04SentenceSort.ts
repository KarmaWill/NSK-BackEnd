export type HskR04Segment = {
  id: string;
  /** 展示用字母标号 A~D，考试时乱序展示 */
  key: string;
  text: string;
  pinyin?: string;
};

type LegacySentence = {
  id?: string;
  key?: string;
  text?: string;
  pinyin?: string;
};

export function defaultR04Segments(count = 4): HskR04Segment[] {
  return Array.from({ length: count }, (_, idx) => ({
    id: `seg${idx + 1}`,
    key: String.fromCharCode(65 + idx),
    text: '',
    pinyin: '',
  }));
}

export function parseR04CorrectOrder(correctAnswer: string): string[] {
  if (!correctAnswer.trim()) return [];
  return correctAnswer
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean);
}

export function buildR04CorrectAnswer(order: string[]): string {
  return order.filter(Boolean).join(',');
}

export function rekeyR04Segments(segments: HskR04Segment[]): HskR04Segment[] {
  return segments.map((segment, idx) => ({
    ...segment,
    key: String.fromCharCode(65 + idx),
  }));
}

export function resolveR04Segments(
  stored: HskR04Segment[] | LegacySentence[] | undefined,
  correctAnswer: string,
): HskR04Segment[] {
  if (stored?.length) {
    return rekeyR04Segments(
      stored.map((item, idx) => ({
        id: item.id ?? `seg${idx + 1}`,
        key: item.key ?? String.fromCharCode(65 + idx),
        text: item.text ?? '',
        pinyin: item.pinyin ?? '',
      })),
    );
  }

  const orderCount = parseR04CorrectOrder(correctAnswer).length;
  return defaultR04Segments(Math.max(orderCount, 4));
}

export function orderKeysFromCorrectAnswer(
  segments: HskR04Segment[],
  correctAnswer: string,
): string[] {
  const order = parseR04CorrectOrder(correctAnswer);
  return order
    .map((id) => segments.find((segment) => segment.id === id)?.key)
    .filter((key): key is string => Boolean(key));
}

export function buildCorrectAnswerFromKeys(
  segments: HskR04Segment[],
  keys: string[],
): string {
  const ids = keys
    .map((key) => segments.find((segment) => segment.key === key)?.id)
    .filter((id): id is string => Boolean(id));
  return buildR04CorrectAnswer(ids);
}

/** 预览用：按 id 稳定乱序，避免每次渲染跳动 */
export function shuffleSegmentsForPreview(segments: HskR04Segment[]): HskR04Segment[] {
  return [...segments].sort((a, b) => {
    const hash = (s: string) => s.split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
    return (hash(a.id) % 97) - (hash(b.id) % 97);
  });
}
