import type { PanelId } from '../types';
import { NAV_LABELS } from '../types';

type Props = { panelId: PanelId };

export function Topbar({ panelId }: Props) {
  const title = NAV_LABELS[panelId] ?? panelId;

  return (
    <header className="topbar">
      <div className="breadcrumb" id="breadcrumb">
        <span>C-Lingo AIOS</span>
        <span className="breadcrumb-sep">›</span>
        <span className="breadcrumb-curr" id="bc-curr">{title}</span>
      </div>
      <div className="topbar-right">
        <div className="search-bar">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.35-4.35" />
          </svg>
          <input type="text" placeholder="搜索内容、用户、题目..." />
        </div>
        <div className="online-chip">
          <div className="online-dot" />
          服务正常
        </div>
      </div>
    </header>
  );
}
