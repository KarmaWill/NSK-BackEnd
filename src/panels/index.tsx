import type { PanelId } from '../types';
import { Dashboard } from './Dashboard';
import { CourseLibConfig } from './CourseLibConfig';
import { AiTrainerSync } from './AiTrainerSync';
import { AiRoles } from './AiRoles';
import { AiFree } from './AiFree';
import { AiScene } from './AiScene';
import { AiCapabilities } from './AiCapabilities';
import { Lessons } from './Lessons';
import { Resources } from './Resources';
import { AudioReading } from './AudioReading';
import { Questions } from './Questions';
import { Multilang } from './Multilang';
import { Vocab } from './Vocab';
import { Hsk } from './Hsk';
import { Culture } from './Culture';
import { Library } from './Library';
import { Users } from './Users';
import { Premium } from './Premium';
import { Notify } from './Notify';
import { SysConfig } from './SysConfig';
import { Qtype } from './Qtype';
import { Logs } from './Logs';
import { MediaLib } from './MediaLib';

type PanelProps = {
  onNavigate: (id: PanelId) => void;
  activeCourseLibId?: string;
  onActiveCourseLibChange?: (id: string) => void;
};

const PANELS: Record<PanelId, (props: PanelProps) => JSX.Element> = {
  dashboard: (p) => <Dashboard {...p} />,
  'course-config': () => <CourseLibConfig />,
  'ai-roles': () => <AiRoles />,
  'ai-capabilities': () => <AiCapabilities />,
  'ai-free': () => <AiFree />,
  'ai-scene': () => <AiScene />,
  'ai-eval': () => <AiTrainerSync page="ai-free" />,
  'ai-api': () => <AiTrainerSync page="ai-free" />,
  catalog: (p) => <Lessons {...p} />,
  resources: () => <Resources />,
  'audio-reading': () => <AudioReading />,
  questions: () => <Questions />,
  medialib: () => <MediaLib />,
  multilang: () => <Multilang />,
  vocab: () => <Vocab />,
  hsk: () => <Hsk />,
  culture: () => <Culture />,
  library: () => <Library />,
  users: () => <Users />,
  premium: () => <Premium />,
  notify: () => <Notify />,
  qtype: () => <Qtype />,
  logs: () => <Logs />,
  sysconfig: () => <SysConfig />,
};

export function PanelContent({
  panelId,
  onNavigate,
  activeCourseLibId = '',
  onActiveCourseLibChange = () => {},
}: {
  panelId: PanelId;
  onNavigate: (id: PanelId) => void;
  activeCourseLibId?: string;
  onActiveCourseLibChange?: (id: string) => void;
}) {
  const Comp = PANELS[panelId];
  if (!Comp) {
    const Fallback = PANELS.dashboard;
    return <Fallback onNavigate={onNavigate} activeCourseLibId={activeCourseLibId} onActiveCourseLibChange={onActiveCourseLibChange} />;
  }
  return <Comp onNavigate={onNavigate} activeCourseLibId={activeCourseLibId} onActiveCourseLibChange={onActiveCourseLibChange} />;
}
