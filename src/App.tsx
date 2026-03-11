import { useState, useEffect } from 'react';
import type { PanelId } from './types';
import { Sidebar } from './components/Sidebar';
import { Topbar } from './components/Topbar';
import { PanelContent } from './panels';
import { loadCourseLibs, COURSE_LIBS_UPDATED_EVENT } from './stores/courseLibs';

export default function App() {
  const [activePanel, setActivePanel] = useState<PanelId>('dashboard');
  const [activeCourseLibId, setActiveCourseLibId] = useState<string>(() => loadCourseLibs()[0]?.id ?? '');

  useEffect(() => {
    const sync = () => {
      const libs = loadCourseLibs();
      setActiveCourseLibId((prev) => {
        if (libs.length && !libs.some((row) => row.id === prev)) return libs[0].id;
        return prev;
      });
    };
    window.addEventListener(COURSE_LIBS_UPDATED_EVENT, sync);
    return () => window.removeEventListener(COURSE_LIBS_UPDATED_EVENT, sync);
  }, []);

  return (
    <div className="app">
      <Sidebar
        activePanel={activePanel}
        onNavigate={setActivePanel}
        activeCourseLibId={activeCourseLibId}
        onActiveCourseLibChange={setActiveCourseLibId}
      />
      <div className="main">
        <Topbar panelId={activePanel} />
        <div className="content">
          <div className="page active">
            <PanelContent
              panelId={activePanel}
              onNavigate={setActivePanel}
              activeCourseLibId={activeCourseLibId}
              onActiveCourseLibChange={setActiveCourseLibId}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
