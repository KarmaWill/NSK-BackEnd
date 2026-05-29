import { useEffect, useState } from 'react';
import type { PanelId } from '../types';
import { NAV_LABELS } from '../types';
import {
  getActiveProduct,
  setActiveProduct,
  PRODUCT_OPTIONS,
  type ProductCode,
} from '../lib/api';

type Props = {
  panelId: PanelId;
  username: string;
  onLogout: () => void;
};

export function Topbar({ panelId, username, onLogout }: Props) {
  const title = NAV_LABELS[panelId] ?? panelId;
  const [product, setProduct] = useState<ProductCode>(() => getActiveProduct());

  useEffect(() => {
    const onProduct = () => setProduct(getActiveProduct());
    window.addEventListener('clingo-product-changed', onProduct);
    return () => window.removeEventListener('clingo-product-changed', onProduct);
  }, []);

  return (
    <header className="topbar">
      <div className="breadcrumb" id="breadcrumb">
        <span>C-Lingo AIOS</span>
        <span className="breadcrumb-sep">›</span>
        <span className="breadcrumb-curr" id="bc-curr">{title}</span>
      </div>
      <div className="topbar-right">
        <select
          value={product}
          onChange={(e) => {
            const code = e.target.value as ProductCode;
            setProduct(code);
            setActiveProduct(code);
          }}
          style={{
            fontSize: 13,
            borderRadius: 8,
            padding: '6px 10px',
            border: '1px solid var(--border, #e5e7eb)',
            marginRight: 8,
          }}
          title="当前配置的产品渠道"
        >
          {PRODUCT_OPTIONS.map((p) => (
            <option key={p.code} value={p.code}>
              {p.label}
            </option>
          ))}
        </select>
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
        <button
          type="button"
          className="btn btn-secondary btn-sm"
          style={{ marginLeft: 8 }}
          onClick={onLogout}
        >
          退出
        </button>
      </div>
    </header>
  );
}
