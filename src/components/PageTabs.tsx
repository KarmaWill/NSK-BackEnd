import type { ReactNode } from 'react';

export type PageTab = {
  id: string;
  label: string;
  badge?: number;
};

type PageTabsProps = {
  tabs: PageTab[];
  activeTab: string;
  onTabChange: (id: string) => void;
  children: ReactNode;
};

export function PageTabs({ tabs, activeTab, onTabChange, children }: PageTabsProps) {
  return (
    <>
      <div className="page-tabs-bar">
        <div className="type-tabs" role="tablist">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={activeTab === tab.id}
              className={`type-tab ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => onTabChange(tab.id)}
            >
              {tab.label}
              {tab.badge != null && tab.badge > 0 && <span className="badge">{tab.badge}</span>}
            </button>
          ))}
        </div>
      </div>
      <div className="page-tabs-body">{children}</div>
    </>
  );
}

type PageTabPanelProps = {
  id: string;
  activeTab: string;
  children: ReactNode;
};

export function PageTabPanel({ id, activeTab, children }: PageTabPanelProps) {
  return (
    <div
      className={`config-tab-panel ${activeTab === id ? 'active' : ''}`}
      role="tabpanel"
      hidden={activeTab !== id}
    >
      {children}
    </div>
  );
}
