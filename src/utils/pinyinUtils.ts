/**
 * pinyinUtils.ts
 *
 * GB/T 16159-2012《汉语拼音正词法基本规则》适配工具库
 *
 * 核心能力：
 * - 将词级（连写）或字级（分写）拼音输入均规范化为逐字音节数组
 * - 兼容带声调符号（ā á ǎ à）和数字声调（a1 a2 a3 a4）两种格式
 * - 支持 ü 与 v 两种 umlaut 写法
 */

// ─── 声调符号映射表 ────────────────────────────────────────────────────────────

const TONE_MAP: Record<string, string> = {
  ā: 'a', á: 'a', ǎ: 'a', à: 'a',
  ē: 'e', é: 'e', ě: 'e', è: 'e',
  ī: 'i', í: 'i', ǐ: 'i', ì: 'i',
  ō: 'o', ó: 'o', ǒ: 'o', ò: 'o',
  ū: 'u', ú: 'u', ǔ: 'u', ù: 'u',
  ǖ: 'ü', ǘ: 'ü', ǚ: 'ü', ǜ: 'ü',
};

const TONE_REGEX = /[āáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜ]/g;

/** 去掉声调符号，保留 ü（v 也归一化为 ü） */
export function stripToneMarks(s: string): string {
  return s
    .normalize('NFC')
    .replace(TONE_REGEX, (ch) => TONE_MAP[ch] ?? ch)
    .replace(/v/g, 'ü');
}

// ─── 有效普通话音节基形表 ─────────────────────────────────────────────────────
// 按字符串长度降序排列，用于贪心最长匹配
// 支持 ü（nü lü nüe lüe；j/q/x/y 后的 u 代表 ü，已内嵌）

export const SYLLABLE_BASES: readonly string[] = [
  // ── 6 字符 ──
  'zhuang', 'chuang', 'shuang',

  // ── 5 字符 ──
  'zhang', 'zheng', 'zhong', 'zhuan', 'zhuai',
  'chang', 'cheng', 'chong', 'chuan', 'chuai',
  'shang', 'sheng', 'shuan', 'shuai',
  'jiang', 'jiong',
  'qiang', 'qiong',
  'xiang', 'xiong',
  'niang', 'liang',
  'kuang', 'guang', 'huang',

  // ── 4 字符 ──
  // zh-
  'zhao', 'zhou', 'zhai', 'zhen', 'zhan', 'zhua', 'zhui', 'zhun', 'zhuo', 'zhei',
  // ch-
  'chao', 'chou', 'chai', 'chen', 'chan', 'chua', 'chui', 'chun', 'chuo',
  // sh-
  'shao', 'shou', 'shai', 'shen', 'shan', 'shua', 'shui', 'shun', 'shuo',
  // r-
  'rang', 'reng', 'rong', 'ruan',
  // z-
  'zang', 'zeng', 'zong', 'zuan',
  // c-
  'cang', 'ceng', 'cong', 'cuan',
  // s-
  'sang', 'seng', 'song', 'suan',
  // b-
  'bang', 'beng', 'bing', 'bian', 'biao',
  // p-
  'pang', 'peng', 'ping', 'pian', 'piao',
  // m-
  'mang', 'meng', 'ming', 'mian', 'miao',
  // f-
  'fang', 'feng',
  // d-
  'dang', 'deng', 'ding', 'dian', 'diao', 'dong', 'duan',
  // t-
  'tang', 'teng', 'ting', 'tian', 'tiao', 'tong', 'tuan',
  // n-
  'nang', 'neng', 'ning', 'nian', 'niao', 'nong', 'nuan',
  // l-
  'lang', 'leng', 'ling', 'lian', 'liao', 'long', 'luan',
  // g-
  'gang', 'geng', 'gong', 'guai', 'guan',
  // k-
  'kang', 'keng', 'kong', 'kuai', 'kuan',
  // h-
  'hang', 'heng', 'hong', 'huai', 'huan',
  // j-
  'jian', 'jiao', 'jing', 'juan',
  // q-
  'qian', 'qiao', 'qing', 'quan',
  // x-
  'xian', 'xiao', 'xing', 'xuan',
  // y-
  'yang', 'ying', 'yong', 'yuan',
  // w-
  'wang', 'weng',

  // ── 3 字符 ──
  // zh-
  'zha', 'zhe', 'zhi', 'zhu',
  // z-
  'zai', 'zan', 'zao', 'zei', 'zen', 'zui', 'zun', 'zuo', 'zou',
  // ch-
  'cha', 'che', 'chi', 'chu',
  // c-
  'cai', 'can', 'cao', 'cen', 'cou', 'cui', 'cun', 'cuo',
  // sh-
  'sha', 'she', 'shi', 'shu',
  // s-
  'sai', 'san', 'sao', 'sen', 'sou', 'sui', 'sun', 'suo',
  // r-
  'ran', 'rao', 'ren', 'rou', 'rui', 'run', 'ruo',
  // b-
  'bai', 'ban', 'bao', 'bei', 'ben', 'bie', 'bin',
  // p-
  'pai', 'pan', 'pao', 'pei', 'pen', 'pie', 'pin', 'pou',
  // m-
  'mai', 'man', 'mao', 'mei', 'men', 'mie', 'min', 'miu', 'mou',
  // f-
  'fan', 'fei', 'fen', 'fou',
  // d-
  'dai', 'dan', 'dao', 'dei', 'den', 'die', 'diu', 'dou', 'dui', 'dun', 'duo',
  // t-
  'tai', 'tan', 'tao', 'tei', 'tie', 'tou', 'tui', 'tun', 'tuo',
  // n-
  'nai', 'nan', 'nao', 'nei', 'nen', 'nie', 'niu', 'nou', 'nuo',
  // l-
  'lai', 'lan', 'lao', 'lei', 'lie', 'liu', 'lou', 'lun', 'luo',
  // g-
  'gai', 'gan', 'gao', 'gei', 'gen', 'gou', 'gua', 'gui', 'gun', 'guo',
  // k-
  'kai', 'kan', 'kao', 'ken', 'kou', 'kua', 'kui', 'kun', 'kuo',
  // h-
  'hai', 'han', 'hao', 'hei', 'hen', 'hou', 'hua', 'hui', 'hun', 'huo',
  // j-
  'jia', 'jie', 'jin', 'jiu', 'jue', 'jun',
  // q-
  'qia', 'qie', 'qin', 'qiu', 'que', 'qun',
  // x-
  'xia', 'xie', 'xin', 'xiu', 'xue', 'xun',
  // y-
  'yan', 'yao', 'yin', 'you', 'yue', 'yun',
  // w-
  'wai', 'wan', 'wei', 'wen',
  // ü 相关（n/l 后）
  'nüe', 'lüe',
  // 零声母 3 字符
  'ang', 'eng',

  // ── 2 字符 ──
  'ba', 'bo', 'bi', 'bu',
  'pa', 'po', 'pi', 'pu',
  'ma', 'mo', 'me', 'mi', 'mu',
  'fa', 'fo', 'fu',
  'da', 'de', 'di', 'du',
  'ta', 'te', 'ti', 'tu',
  'na', 'ne', 'ni', 'nu', 'nü',
  'la', 'le', 'li', 'lu', 'lü',
  'ga', 'ge', 'gu',
  'ka', 'ke', 'ku',
  'ha', 'he', 'hu',
  'ji', 'ju',
  'qi', 'qu',
  'xi', 'xu',
  're', 'ri', 'ru',
  'za', 'ze', 'zi', 'zu',
  'ca', 'ce', 'ci', 'cu',
  'sa', 'se', 'si', 'su',
  'ya', 'ye', 'yi', 'yu',
  'wa', 'wo', 'wu',
  'ai', 'an', 'ao', 'ei', 'en', 'er', 'ou',

  // ── 1 字符 ──
  'a', 'e', 'o',
];

// 按长度降序的 Set，用于快速查询
const SYLLABLE_SET = new Set(SYLLABLE_BASES);

// ─── 贪心最长匹配拆分器 ───────────────────────────────────────────────────────

function greedySplit(original: string, stripped: string): string[] {
  if (!stripped) return [];
  const lower = stripped.toLowerCase();
  for (const base of SYLLABLE_BASES) {
    if (lower.startsWith(base)) {
      const len = base.length;
      const syllable = original.slice(0, len);
      const restOrig = original.slice(len);
      const restStripped = stripped.slice(len);
      if (!restStripped) return [syllable];
      const rest = greedySplit(restOrig, restStripped);
      return [syllable, ...rest];
    }
  }
  // 没有匹配（可能是儿化 r 或无效字符），作为整体返回
  return [original];
}

/**
 * 拆分单个连写拼音词为音节数组。
 * 例：péngyou → ['péng', 'you']；Zhōngguó → ['Zhōng', 'guó']
 */
export function splitPinyinWord(word: string): string[] {
  if (!word.trim()) return [];
  // 处理隔音符号 ' (GB/T 6.6.2)
  if (/['''`]/.test(word)) {
    return word.split(/['''`]/g).flatMap((p) => splitPinyinWord(p)).filter(Boolean);
  }
  const normalized = word.normalize('NFC');
  const stripped = stripToneMarks(normalized);
  return greedySplit(normalized, stripped);
}

/**
 * 将整段拼音输入（词级或字级均可）规范化为逐字音节数组。
 * 例：'péngyou hǎo'  → ['péng', 'you', 'hǎo']
 *     'péng you hǎo' → ['péng', 'you', 'hǎo']
 */
export function splitPinyinInput(pinyin: string): string[] {
  if (!pinyin.trim()) return [];
  return pinyin
    .trim()
    .split(/[\s\u00a0]+/) // 按空白分词
    .filter(Boolean)
    .flatMap((word) => splitPinyinWord(word));
}

// ─── 汉字计数 ─────────────────────────────────────────────────────────────────

const HAN_RE = /[\u4e00-\u9fff]/g;
/** 匹配填空标记：（1）(2) （hao） （） () 等 */
const BLANK_RE = /[（(][^（）()]*[）)]/g;

/** 统计文本中的汉字数（跳过填空标记）*/
export function countHanInText(text: string): number {
  const withoutBlanks = text.replace(BLANK_RE, '');
  return (withoutBlanks.match(HAN_RE) ?? []).length;
}

/** 按空格分词的中文片段（跳过填空标记），用于词级拼音校验 */
export function countHanWordSegments(text: string): {
  segmentCount: number;
  hanPerSegment: number[];
  totalHan: number;
} {
  const withoutBlanks = text.replace(BLANK_RE, '');
  const parts = withoutBlanks.split(/\s+/).filter((part) => /[\u4e00-\u9fff]/.test(part));
  if (parts.length <= 1) {
    return { segmentCount: 0, hanPerSegment: [], totalHan: countHanInText(text) };
  }
  const hanPerSegment = parts.map((part) => (part.match(HAN_RE) ?? []).length);
  return {
    segmentCount: parts.length,
    hanPerSegment,
    totalHan: hanPerSegment.reduce((sum, count) => sum + count, 0),
  };
}

// ─── 拼音对齐校验 ─────────────────────────────────────────────────────────────

export interface PinyinAlignResult {
  ok: boolean;
  syllableCount: number;
  hanCount: number;
  message: string;
}

/**
 * 校验拼音与汉字是否对齐。
 * - 中文有空格分词 + 拼音空格分词：按词组校验（如 小雨 今天 + xiaoyu jintian）
 * - 否则：按音节数与汉字数一一对应（字级分写或词内连写均可）
 */
export function validatePinyinAlign(
  pinyin: string,
  hanCount: number,
  text?: string,
): PinyinAlignResult {
  if (!pinyin.trim()) {
    return { ok: true, syllableCount: 0, hanCount, message: '' };
  }

  const syllableCount = splitPinyinInput(pinyin).length;
  const pinyinWords = pinyin.trim().split(/\s+/).filter(Boolean);
  const effectiveHan = text ? countHanWordSegments(text).totalHan || hanCount : hanCount;

  if (text) {
    const { segmentCount, hanPerSegment } = countHanWordSegments(text);
    if (segmentCount >= 2 && pinyinWords.length === segmentCount) {
      const ok = pinyinWords.every(
        (word, index) => splitPinyinWord(word).length === hanPerSegment[index],
      );
      return {
        ok,
        syllableCount,
        hanCount: effectiveHan,
        message: ok
          ? `${pinyinWords.length} 词 ✓`
          : `${pinyinWords.length} 词 / ${segmentCount} 词组`,
      };
    }
  }

  const ok = syllableCount === effectiveHan;
  return {
    ok,
    syllableCount,
    hanCount: effectiveHan,
    message: ok ? `${syllableCount} 音节 ✓` : `${syllableCount} 音节 / ${effectiveHan} 字`,
  };
}

// ─── 单词拼音格式检查 ─────────────────────────────────────────────────────────

/**
 * 轻量检查：字符串是否「看起来像拼音」（不含汉字、不含无效符号）。
 * 用于单词拼音输入字段的格式提示。
 */
export function isPinyinLike(s: string): boolean {
  if (!s.trim()) return true;
  // 允许：ASCII 字母、ü、声调符号、空格、连字符、隔音符号、中圆点
  return /^[a-zA-ZüÜāáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜ'\-\s·v]+$/u.test(s.trim());
}

/** 判断一个 token 是否是已知有效音节（无调） */
export function isValidSyllable(s: string): boolean {
  const stripped = stripToneMarks(s.normalize('NFC')).toLowerCase();
  return SYLLABLE_SET.has(stripped);
}
