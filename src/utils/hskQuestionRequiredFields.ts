import { defaultCompoundForType, getRegistryEntry } from '../config/hskQuestionTypeRegistry';
import { isJudgmentQuestionType } from '../config/hskQuestionTypeGroups';
import type { HskQuestionTypeCode } from '../types/hskExams';

/** 对齐 HSK-Exams QuestionEditPage 底部必填提示 */
export function getQuestionRequiredFieldSummary(typeId: HskQuestionTypeCode) {
  const registry = getRegistryEntry(typeId, defaultCompoundForType(typeId));
  const needsAudio = registry?.editorFields.includes('audio') ?? false;

  const parts: string[] = [];
  if (!/^L0[126]/.test(typeId)) parts.push('题干 (stem)');
  if (needsAudio) parts.push('音频文件');
  if (typeId === 'L02') {
    parts.push('至少1张图片');
    parts.push('至少1道子题');
  }
  if (isJudgmentQuestionType(typeId)) {
    parts.push('题干 (stem)');
    parts.push('判断句');
    parts.push('题目图片');
    parts.push('正确答案');
  }
  if (typeId === 'R01') {
    parts.push('至少1张图片');
    parts.push('至少1条句子');
  }
  if (typeId === 'R02') {
    parts.push('至少2个问题');
    parts.push('回答列表（含干扰项）');
  }
  if (typeId === 'R03') {
    parts.push('至少1条填空句子');
    parts.push('词库（含干扰项）');
  }
  if (typeId === 'R04') {
    parts.push('至少2个句子片段');
    parts.push('正确排序');
  }
  if (typeId === 'R05') {
    parts.push('段落文本');
    parts.push('全局选项池');
    parts.push('正确答案映射');
  }
  if (typeId === 'R06') {
    parts.push('文章文本');
    parts.push('填空选项');
  }
  if (typeId === 'R07') {
    parts.push('阅读文章');
    parts.push('阅读理解题目');
  }
  if (typeId === 'R09') {
    parts.push('填空句');
    parts.push('词语选项');
    parts.push('题目图片');
    parts.push('正确答案');
  }
  if (typeId === 'W01') {
    parts.push('部件选项');
    parts.push('词语匹配');
  }
  if (typeId === 'W02') {
    parts.push('挖空句子');
    parts.push('拼音提示');
    parts.push('正确答案');
  }
  if (typeId === 'W03') {
    parts.push('题目图片');
    parts.push('关键词');
  }
  if (typeId === 'W04') {
    parts.push('主题 / 题目');
    parts.push('关键词');
    parts.push('最低字数');
  }

  return {
    parts,
    text: parts.join(' · '),
    count: parts.length,
  };
}
