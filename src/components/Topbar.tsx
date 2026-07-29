import { useEffect, useState } from 'react';
import type { PanelId } from '../types';
import { NAV_LABELS } from '../types';
import { getActiveProductLabel } from '../lib/api';

type Props = {
  panelId: PanelId;
  username: string;
  onLogout: () => void;
  showLogout?: boolean;
};

export function Topbar({ panelId, username, onLogout, showLogout = true }: Props) {
  const title = NAV_LABELS[panelId] ?? panelId;
  const [productLabel, setProductLabel] = useState(() => getActiveProductLabel());

  useEffect(() => {
    const sync = () => setProductLabel(getActiveProductLabel());
    window.addEventListener('clingo-product-changed', sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener('clingo-product-changed', sync);
      window.removeEventListener('storage', sync);
    };
  }, []);

  return (
    <header className="topbar">
      <div className="breadcrumb" id="breadcrumb">
        <span>{productLabel}</span>
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
          API 已连接
        </div>
        <span style={{ fontSize: 13, marginLeft: 8, color: 'var(--ink-light)' }}>{username}</span>
        {showLogout && (
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            style={{ marginLeft: 8 }}
            onClick={onLogout}
          >
            退出
          </button>
        )}
      </div>
    </header>
  );
}
