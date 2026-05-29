import type { PanelId } from '../types';
import { Dashboard } from './Dashboard';
import { CourseLibConfig } from './CourseLibConfig';
import { Database } from './Database';
import { Feedback } from './Feedback';
import { AiTrainerSync } from './AiTrainerSync';
import { AiRoles } from './AiRoles';
import { AiFree } from './AiFree';
import { AiScene } from './AiScene';
import { AiCapabilities } from './AiCapabilities';
import { Lessons } from './Lessons';
import { Resources } from './Resources';
import { AudioReading } from './AudioReading';
import { Questions } from './Questions';
import { Vocab } from './Vocab';
import { Hsk } from './Hsk';
import { HskExam } from './HskExam';
import { HskPaper } from './HskPaper';
import { HskQuestionBank } from './HskQuestionBank';
import { Culture } from './Culture';
import { Library } from './Library';
import { Users } from './Users';
import { Premium } from './Premium';
import { Notify } from './Notify';
import { SysConfig } from './SysConfig';
import { Qtype } from './Qtype';
import { Logs } from './Logs';
import { MediaLib } from './MediaLib';
import { NewsConfig } from './NewsConfig';
import { OpsBanner } from './OpsBanner';

type PanelProps = {
  onNavigate: (id: PanelId) => void;
  activeCourseLibId?: string;
  onActiveCourseLibChange?: (id: string) => void;
};

const PANELS: Record<PanelId, (props: PanelProps) => JSX.Element> = {
  dashboard: (p) => <Dashboard {...p} />,
  'course-config': () => <CourseLibConfig />,
  medialib: () => <MediaLib />,
  database: () => <Database />,
  'ai-roles': () => <AiRoles />,
  'ai-capabilities': () => <AiCapabilities />,
  'ai-free': () => <AiFree />,
  'ai-scene': () => <AiScene />,
  'ai-eval': () => <AiTrainerSync page="ai-free" />,
  'ai-api': () => <AiTrainerSync page="ai-free" />,
  catalog: (p) => <Lessons {...p} />,
  resources: () => <Resources />,
  'audio-reading': () => <AudioReading />,
  'audio-reading-mgmt': () => <AudioReading pageTitle="有声阅读管理" />,
  questions: () => <Questions />,
  vocab: () => <Vocab />,
  hsk: () => <Hsk />,
  'hsk-question-bank': () => <HskQuestionBank />,
  'hsk-paper': () => <HskPaper />,
  'hsk-exam': () => <HskExam />,
  culture: () => <Culture />,
  library: () => <Library />,
  users: () => <Users />,
  feedback: () => <Feedback />,
  premium: () => <Premium />,
  notify: () => <Notify />,
  'news-config': () => <NewsConfig />,
  'ops-banner': () => <OpsBanner />,
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
