import { countHanWordSegments, splitPinyinWord } from '../utils/pinyinUtils';

const HAN_RE_CHAR = /[\u4e00-\u9fff]/;

type RubyItem =
  | { kind: 'word-ruby'; key: string; pinyin: string; chars: string[] }
  | { kind: 'plain'; key: string; char: string };

/** 单段中文 + 单个拼音词 → ruby 条目（段内按音节数分组） */
function buildSegmentRubyItems(segmentText: string, pinyinWord: string, startCounter: number): RubyItem[] {
  const items: RubyItem[] = [];
  let counter = startCounter;
  const wordCharCount = splitPinyinWord(pinyinWord).length;
  const chars = [...segmentText];
  let i = 0;

  while (i < chars.length) {
    const ch = chars[i];

    if (!HAN_RE_CHAR.test(ch)) {
      items.push({ kind: 'plain', key: `p-${counter++}`, char: ch });
      i++;
      continue;
    }

    if (wordCharCount <= 1) {
      items.push({ kind: 'word-ruby', key: `w-${counter++}`, pinyin: pinyinWord, chars: [ch] });
      i++;
      break;
    }

    const groupChars: string[] = [ch];
    let hanCount = 1;
    let j = i + 1;
    while (hanCount < wordCharCount && j < chars.length) {
      const c = chars[j];
      groupChars.push(c);
      if (HAN_RE_CHAR.test(c)) hanCount++;
      j++;
    }
    items.push({ kind: 'word-ruby', key: `w-${counter++}`, pinyin: pinyinWord, chars: groupChars });
    i = j;
    break;
  }

  while (i < chars.length) {
    const ch = chars[i];
    if (HAN_RE_CHAR.test(ch)) {
      items.push({ kind: 'word-ruby', key: `w-${counter++}`, pinyin: '', chars: [ch] });
    } else {
      items.push({ kind: 'plain', key: `p-${counter++}`, char: ch });
    }
    i++;
  }

  return items;
}

export function buildPinyinRubyItems(text: string, pinyinInput: string): RubyItem[] {
  const pinyinWords = pinyinInput?.trim()
    ? pinyinInput.trim().split(/\s+/).filter(Boolean)
    : [];
  const wordCharCounts = pinyinWords.map((w) => splitPinyinWord(w).length);
  const { segmentCount } = countHanWordSegments(text);

  // 中文空格分词 ↔ 拼音词级（如 小雨 今天 + xiaoyu jintian）
  if (segmentCount >= 2 && pinyinWords.length === segmentCount) {
    const items: RubyItem[] = [];
    let counter = 0;
    let wordIdx = 0;
    const parts = text.split(/(\s+)/);

    for (const part of parts) {
      if (/^\s+$/.test(part)) {
        for (const ch of part) {
          items.push({ kind: 'plain', key: `p-${counter++}`, char: ch });
        }
        continue;
      }
      if (!/[\u4e00-\u9fff]/.test(part)) {
        for (const ch of part) {
          items.push({ kind: 'plain', key: `p-${counter++}`, char: ch });
        }
        continue;
      }
      const segmentItems = buildSegmentRubyItems(part, pinyinWords[wordIdx], counter);
      items.push(...segmentItems);
      counter += segmentItems.length;
      wordIdx++;
    }
    return items;
  }

  const items: RubyItem[] = [];
  let wordIdx = 0;
  let counter = 0;
  const chars = [...text];

  for (let i = 0; i < chars.length; ) {
    const ch = chars[i];

    if (!HAN_RE_CHAR.test(ch)) {
      items.push({ kind: 'plain', key: `p-${counter++}`, char: ch });
      i++;
      continue;
    }

    if (!pinyinWords.length || wordIdx >= pinyinWords.length) {
      items.push({ kind: 'word-ruby', key: `w-${counter++}`, pinyin: '', chars: [ch] });
      i++;
      continue;
    }

    const wordPinyin = pinyinWords[wordIdx];
    const wordCharCount = wordCharCounts[wordIdx];

    if (wordCharCount <= 1) {
      items.push({ kind: 'word-ruby', key: `w-${counter++}`, pinyin: wordPinyin, chars: [ch] });
      wordIdx++;
      i++;
    } else {
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

  return items;
}

export function PinyinRubyWordItem({ pinyin, chars }: { pinyin: string; chars: string[] }) {
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

type Props = {
  text: string;
  pinyin: string;
  className?: string;
};

/** 中文 + 词级/字级拼音 → ruby 渲染；无拼音时不渲染 */
export function PinyinRubyText({ text, pinyin, className = 'hsk-preview-r05-passage-text' }: Props) {
  const trimmedPinyin = pinyin.trim();
  const trimmedText = text.trim();
  if (!trimmedPinyin || !trimmedText) return null;

  const items = buildPinyinRubyItems(trimmedText, trimmedPinyin);
  const Wrapper = className ? 'div' : 'span';

  return (
    <Wrapper className={className || undefined}>
      {items.map((item) => {
        if (item.kind === 'plain') {
          return (
            <span key={item.key} className="hsk-preview-r05-plain-ch">
              {item.char}
            </span>
          );
        }
        return <PinyinRubyWordItem key={item.key} pinyin={item.pinyin} chars={item.chars} />;
      })}
    </Wrapper>
  );
}
