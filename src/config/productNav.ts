import type { PanelId } from '../types';
import type { ProductCode } from '../lib/api';

/** C-Lingo 官网 (hsk_web) 侧栏可见页面 */
const HSK_WEB_PANELS = new Set<PanelId>([
  'dashboard',
  'medialib',
  'database',
  'ai-roles',
  'audio-reading-mgmt',
  'hsk-question-bank',
  'hsk-paper',
  'hsk-exam',
  'culture',
  'users',
  'feedback',
  'premium',
  'notify',
  'news-config',
  'ops-banner',
]);

export function isPanelAvailableForProduct(panel: PanelId, product: ProductCode): boolean {
  if (product === 'tablet_app') return true;
  return HSK_WEB_PANELS.has(panel);
}

export function isTabletAppProduct(product: ProductCode): boolean {
  return product === 'tablet_app';
}
