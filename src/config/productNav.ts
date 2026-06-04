import type { PanelId } from '../types';
import type { ProductCode } from '../lib/api';
import { getHskWebPanelAllowlist } from './navTree';

const HSK_WEB_PANELS = getHskWebPanelAllowlist();

export function isPanelAvailableForProduct(panel: PanelId, product: ProductCode): boolean {
  if (product === 'tablet_app') return true;
  return HSK_WEB_PANELS.has(panel);
}

export function isTabletAppProduct(product: ProductCode): boolean {
  return product === 'tablet_app';
}
