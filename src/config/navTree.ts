import type { ProductCode } from '../lib/api';
import type { PanelId } from '../types';
import { NAV_LABELS } from '../types';
import { HSK_WEB_ROUTED_PANELS } from './assessmentTemplates';

export type NavBadge = { text: string; className?: string };
export type NavPhase = 'p0' | 'p1' | 'p2';

export type NavItemNode = {
  type: 'item';
  panel: PanelId;
  label?: string;
  badge?: NavBadge;
  phase?: NavPhase;
  childClass?: string;
};

export type NavGroupNode = {
  type: 'group';
  id: string;
  label: string;
  iconPanel?: PanelId;
  defaultExpanded?: boolean;
  activePanels: PanelId[];
  children: NavItemNode[];
};

export type NavSectionNode = {
  type: 'section';
  label: string;
  children: Array<NavItemNode | NavGroupNode>;
};

export type NavBlock = NavSectionNode | { type: 'tablet-course-libs' };

function phaseBadge(phase?: NavPhase): NavBadge | undefined {
  if (phase === 'p0') return { text: 'P0', className: 'ok' };
  if (phase === 'p1') return { text: 'P1', className: 'warn' };
  if (phase === 'p2') return { text: 'P2' };
  return undefined;
}

function item(
  panel: PanelId,
  opts?: { label?: string; phase?: NavPhase; badge?: NavBadge; childClass?: string },
): NavItemNode {
  return {
    type: 'item',
    panel,
    label: opts?.label,
    phase: opts?.phase,
    badge: opts?.badge ?? phaseBadge(opts?.phase),
    childClass: opts?.childClass,
  };
}

export const WEB_EXAM_BANK_GROUP: NavGroupNode = {
  type: 'group',
  id: 'web-exam-bank',
  label: '考试与题库',
  iconPanel: 'hsk',
  defaultExpanded: true,
  activePanels: ['hsk-question-bank', 'hsk-paper', 'hsk-exam'],
  children: [
    item('hsk-question-bank', { phase: 'p0', childClass: 'course-child-item' }),
    item('hsk-paper', { phase: 'p0', childClass: 'course-child-item' }),
    item('hsk-exam', { phase: 'p0', childClass: 'course-child-item' }),
  ],
};

export const WEB_ASSESS_HUB_GROUP: NavGroupNode = {
  type: 'group',
  id: 'web-assess-hub',
  label: '测评中心',
  iconPanel: 'hsk',
  defaultExpanded: true,
  activePanels: ['hsk-vocab-assess', 'hsk-speaking-rater', 'hsk-writing-rater'],
  children: [
    item('hsk-vocab-assess', { label: '词汇测评', phase: 'p0', childClass: 'course-child-item' }),
    item('hsk-speaking-rater', { phase: 'p1', childClass: 'course-child-item' }),
    item('hsk-writing-rater', { phase: 'p1', childClass: 'course-child-item' }),
  ],
};

export const VIDEO_CENTER_GROUP: NavGroupNode = {
  type: 'group',
  id: 'video-center',
  label: '视频中心',
  iconPanel: 'culture',
  defaultExpanded: false,
  activePanels: ['culture', 'video-types'],
  children: [
    item('culture', { label: '视频列表', childClass: 'course-child-item' }),
    item('video-types', { label: '视频类型', childClass: 'course-child-item' }),
  ],
};

export const TABLET_HSK_GROUP: NavGroupNode = {
  type: 'group',
  id: 'tablet-hsk',
  label: 'HSK考试管理',
  iconPanel: 'hsk',
  defaultExpanded: false,
  activePanels: ['hsk', 'hsk-question-bank', 'hsk-paper', 'hsk-exam'],
  children: [
    item('hsk-question-bank', { childClass: 'course-child-item' }),
    item('hsk-paper', { childClass: 'course-child-item' }),
    item('hsk-exam', { childClass: 'course-child-item' }),
  ],
};

const HSK_WEB_BLOCKS: NavBlock[] = [
  { type: 'section', label: '概览', children: [item('dashboard')] },
  { type: 'section', label: '资源库', children: [item('medialib'), item('database')] },
  {
    type: 'section',
    label: '用户 & 运营',
    children: [
      item('users', { badge: { text: '2.4k', className: 'ok' } }),
      item('feedback'),
      item('premium'),
      item('notify', { badge: { text: '3', className: 'warn' } }),
      item('ops-banner'),
      item('news-config'),
    ],
  },
  { type: 'section', label: 'AI 配置', children: [item('ai-roles')] },
  {
    type: 'section',
    label: '内容配置',
    children: [item('audio-reading-mgmt', { label: '有声阅读管理' }), VIDEO_CENTER_GROUP],
  },
  { type: 'section', label: '考试与测评', children: [WEB_EXAM_BANK_GROUP, WEB_ASSESS_HUB_GROUP] },
  {
    type: 'section',
    label: '系统管理',
    children: [item('sysconfig')],
  },
];

function tabletBlocks(role: 'admin' | 'editor'): NavBlock[] {
  const blocks: NavBlock[] = [
    { type: 'section', label: '概览', children: [item('dashboard')] },
    { type: 'section', label: '资源库', children: [item('medialib')] },
    { type: 'tablet-course-libs' },
    { type: 'section', label: '数据库', children: [item('database')] },
    {
      type: 'section',
      label: 'AI 配置',
      children: [item('ai-roles'), item('ai-free'), item('ai-scene')],
    },
    {
      type: 'section',
      label: '专业内容管理',
      children: [
        item('audio-reading-mgmt', { label: '有声阅读管理' }),
        item('library'),
        VIDEO_CENTER_GROUP,
      ],
    },
    {
      type: 'section',
      label: '用户 & 运营',
      children: [
        item('users', { badge: { text: '2.4k', className: 'ok' } }),
        item('feedback'),
        item('premium'),
        item('notify', { badge: { text: '3', className: 'warn' } }),
      ],
    },
  ];
  if (role === 'admin') {
    blocks.push({
      type: 'section',
      label: '系统管理',
      children: [item('qtype'), item('logs'), item('sysconfig')],
    });
  }
  return blocks;
}

export function getNavBlocks(product: ProductCode, role: 'admin' | 'editor'): NavBlock[] {
  if (product === 'tablet_app') return tabletBlocks(role);
  return HSK_WEB_BLOCKS;
}

export function collectPanelsFromBlocks(blocks: NavBlock[]): PanelId[] {
  const ids = new Set<PanelId>();
  const walk = (nodes: Array<NavItemNode | NavGroupNode>) => {
    for (const n of nodes) {
      if (n.type === 'item') ids.add(n.panel);
      else n.children.forEach((c) => ids.add(c.panel));
    }
  };
  for (const block of blocks) {
    if (block.type === 'section') walk(block.children);
    if (block.type === 'tablet-course-libs') {
      ids.add('course-config');
      ids.add('catalog');
      ids.add('resources');
      ids.add('audio-reading');
      ids.add('questions');
      ids.add('ai-capabilities');
      ids.add('hsk-question-bank');
      ids.add('hsk-paper');
      ids.add('hsk-exam');
      ids.add('hsk');
      ids.add('library');
      ids.add('culture');
      ids.add('video-add');
      ids.add('video-types');
      ids.add('audio-reading-mgmt');
      ids.add('ai-roles');
      ids.add('ai-free');
      ids.add('ai-scene');
      ids.add('users');
      ids.add('feedback');
      ids.add('premium');
      ids.add('notify');
      ids.add('qtype');
      ids.add('logs');
      ids.add('sysconfig');
    }
  }
  return [...ids];
}

export function getHskWebPanelAllowlist(): Set<PanelId> {
  return new Set([...collectPanelsFromBlocks(HSK_WEB_BLOCKS), ...HSK_WEB_ROUTED_PANELS]);
}

export function getItemLabel(node: NavItemNode): string {
  return node.label ?? NAV_LABELS[node.panel];
}

export function getDefaultExpandedGroupIds(product: ProductCode): Record<string, boolean> {
  if (product === 'hsk_web') {
    return { 'web-exam-bank': true, 'web-assess-hub': true };
  }
  return {};
}
