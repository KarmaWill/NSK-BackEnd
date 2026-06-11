import type { PanelId } from '../types';

/** 从侧栏移除、改由「考试管理 → ✦自定义模板」入口配置的测评类模板 */
export type AssessmentTemplateEntry = {
  panel: PanelId;
  title: string;
  description: string;
  phase: 'P0' | 'P1';
  icon: string;
};

export const ASSESSMENT_TEMPLATE_ENTRIES: AssessmentTemplateEntry[] = [
  {
    panel: 'hsk-diagnostic',
    title: '入门诊断',
    description: '新用户水平摸底，配置题目范围与分级规则',
    phase: 'P0',
    icon: '🎯',
  },
  {
    panel: 'assess-mi',
    title: '多元智能测评',
    description: 'MI 维度测评入口与结果展示配置',
    phase: 'P1',
    icon: '✦',
  },
  {
    panel: 'assess-style',
    title: '学习风格测评',
    description: '视觉 / 听觉 / 动觉等学习偏好测评',
    phase: 'P1',
    icon: '◈',
  },
  {
    panel: 'assess-mbti',
    title: 'MBTI 测评',
    description: '性格类型测评与推荐路径配置',
    phase: 'P1',
    icon: '◎',
  },
];

/** hsk_web 侧栏不可见、但仍需通过考试管理跳转的面板 */
export const HSK_WEB_ROUTED_PANELS: PanelId[] = [
  ...ASSESSMENT_TEMPLATE_ENTRIES.map((e) => e.panel),
  'hsk-compose',
];
