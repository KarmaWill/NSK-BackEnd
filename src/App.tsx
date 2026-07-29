import { useState, useEffect } from 'react';
import type { PanelId } from './types';
import { Sidebar } from './components/Sidebar';
import { Topbar } from './components/Topbar';
import { PanelContent } from './panels';
import { LoginGate } from './components/LoginGate';
import { loadCourseLibs, COURSE_LIBS_UPDATED_EVENT } from './stores/courseLibs';
import {
  getToken,
  logout,
  type AuthUser,
  getActiveProduct,
  usesTrustedNetworkAuth,
} from './lib/api';
import { isPanelAvailableForProduct } from './config/productNav';

export default function App() {
  const trustedNetworkAuth = usesTrustedNetworkAuth();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [activePanel, setActivePanel] = useState<PanelId>('dashboard');
  const [activeCourseLibId, setActiveCourseLibId] = useState<string>(() => loadCourseLibs()[0]?.id ?? '');

  useEffect(() => {
    if (trustedNetworkAuth) {
      logout();
      setUser({ id: 'internal', username: '内网用户', role: 'ADMIN' });
    } else if (getToken()) {
      setUser({ id: '', username: 'admin', role: 'ADMIN' });
    }
    setAuthChecked(true);
  }, [trustedNetworkAuth]);

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

  useEffect(() => {
    const syncPanelForProduct = () => {
      const product = getActiveProduct();
      setActivePanel((prev) => (isPanelAvailableForProduct(prev, product) ? prev : 'dashboard'));
    };
    syncPanelForProduct();
    window.addEventListener('clingo-product-changed', syncPanelForProduct);
    return () => window.removeEventListener('clingo-product-changed', syncPanelForProduct);
  }, []);

  if (!authChecked) return null;

  if (!user) {
    return <LoginGate onSuccess={setUser} />;
  }

  return (
    <div className="app">
      <Sidebar
        activePanel={activePanel}
        onNavigate={setActivePanel}
        activeCourseLibId={activeCourseLibId}
        onActiveCourseLibChange={setActiveCourseLibId}
        username={user.username}
      />
      <div className="main">
        <Topbar
          panelId={activePanel}
          username={user.username}
          showLogout={!trustedNetworkAuth}
          onLogout={() => {
            logout();
            setUser(null);
          }}
        />
        <div className={`content${activePanel === 'dashboard' ? ' content-dashboard' : ''}`}>
          <div className={`page active${activePanel === 'dashboard' ? ' page-dashboard' : ''}`}>
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
