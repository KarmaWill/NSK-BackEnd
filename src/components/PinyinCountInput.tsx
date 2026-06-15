/**
 * PinyinCountInput / PinyinInlineField
 *
 * 两种拼音输入组件：
 * - PinyinCountInput：整段拼音输入，带实时「N 音节 / M 字」匹配指示
 * - PinyinInlineField：单词拼音输入，带轻量格式校验红点
 */

import { useMemo } from 'react';
import { isPinyinLike, validatePinyinAlign } from '../utils/pinyinUtils';

// ─── PinyinCountInput ─────────────────────────────────────────────────────────

type PinyinCountInputProps = {
  value: string;
  onChange: (next: string) => void;
  /** 对应文本中的汉字数；传入则显示匹配指示 */
  targetHanCount?: number;
  /** 对应中文文本；有空格分词时启用词级校验（如 小雨 今天 ↔ xiaoyu jintian） */
  targetText?: string;
  placeholder?: string;
  className?: string;
};

/**
 * 整段拼音输入框，右侧实时显示「N 音节 / M 字 ✓/✗」。
 * 接受词级（péngyou hǎo）或字级（péng you hǎo）输入，均可正确计数。
 */
export function PinyinCountInput({
  value,
  onChange,
  targetHanCount,
  targetText,
  placeholder,
  className = 'hsk-question-r02-item-text',
}: PinyinCountInputProps) {
  const result = useMemo(() => {
    if (targetHanCount == null) return null;
    return validatePinyinAlign(value, targetHanCount, targetText);
  }, [value, targetHanCount, targetText]);

  const showBadge = targetHanCount != null && value.trim().length > 0;

  return (
    <div className="hsk-pinyin-count-wrap">
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={
          placeholder ?? '词级或字级均可，如：péngyou hǎo 或 péng you hǎo'
        }
        className={className}
      />
      {showBadge && result && (
        <span
          className={`hsk-pinyin-count-badge${result.ok ? ' is-ok' : ' is-err'}`}
          title={result.ok ? '音节数与汉字数匹配' : '音节数与汉字数不匹配，请检查'}
        >
          {result.message}
        </span>
      )}
    </div>
  );
}

// ─── PinyinInlineField ────────────────────────────────────────────────────────

type PinyinInlineFieldProps = {
  value: string;
  onChange: (next: string) => void;
  placeholder?: string;
  className?: string;
  /** 是否必填；影响占位符文字 */
  required?: boolean;
};

/**
 * 单词拼音输入框，右侧带轻量格式校验红点。
 * 用于选项拼音、填空拼音等单字 / 单词拼音字段。
 */
export function PinyinInlineField({
  value,
  onChange,
  placeholder,
  className = 'hsk-question-r02-item-pinyin',
  required = false,
}: PinyinInlineFieldProps) {
  const valid = useMemo(() => isPinyinLike(value), [value]);
  const showDot = value.trim().length > 0 && !valid;

  return (
    <div className="hsk-pinyin-inline-wrap">
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder ?? (required ? '拼音 *' : '拼音')}
        className={className}
      />
      {showDot && (
        <span
          className="hsk-pinyin-invalid-dot"
          title="含无效字符，请检查拼音格式（如：píngyǒu）"
          aria-label="拼音格式有误"
        />
      )}
    </div>
  );
}

// ─── 兼容性辅助：从拼音输入规范化为音节数组 ──────────────────────────────────

/**
 * 在预览渲染时，将编辑者输入的拼音（词级或字级均可）
 * 规范化为逐字音节数组。
 * 替代原来的 `pinyin.split(/\s+/)`。
 */
export { splitPinyinInput as normalizePinyinToSyllables } from '../utils/pinyinUtils';
