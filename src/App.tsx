import { useState } from 'react';
import type { PanelId } from './types';
import { Sidebar } from './components/Sidebar';
import { Topbar } from './components/Topbar';
import { PanelContent } from './panels';

export default function App() {
  const [activePanel, setActivePanel] = useState<PanelId>('dashboard');

  return (
    <div className="app">
      <Sidebar activePanel={activePanel} onNavigate={setActivePanel} />
      <div className="main">
        <Topbar panelId={activePanel} />
        <div className="content">
          <div className="page active">
            <PanelContent panelId={activePanel} onNavigate={setActivePanel} />
          </div>
        </div>
      </div>
    </div>
  );
}
