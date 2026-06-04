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
import { LearningAssessment } from './LearningAssessment';
import { DiagnosticAssessment } from './DiagnosticAssessment';
import { VocabAssessment } from './VocabAssessment';
import { HskCompose } from './HskCompose';

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
  'audio-reading-mgmt': () => <AudioReading pageTitle="有声阅读" />,
  questions: () => <Questions />,
  vocab: () => <Vocab />,
  hsk: () => <Hsk />,
  'hsk-question-bank': () => <HskQuestionBank />,
  'hsk-paper': () => <HskPaper />,
  'hsk-exam': () => <HskExam />,
  'hsk-diagnostic': () => <DiagnosticAssessment />,
  'hsk-vocab-assess': () => <VocabAssessment />,
  'hsk-speaking-rater': () => (
    <LearningAssessment
      title="口语Rater"
      subtitle="C-Lingo 官网 · 口语评分 Rater 配置"
      configKey="hsk-speaking-rater"
    />
  ),
  'hsk-writing-rater': () => (
    <LearningAssessment
      title="写作Rater"
      subtitle="C-Lingo 官网 · 写作评分 Rater 配置"
      configKey="hsk-writing-rater"
    />
  ),
  'hsk-compose': (p) => <HskCompose onNavigate={p.onNavigate} />,
  culture: () => <Culture />,
  library: () => <Library />,
  users: () => <Users />,
  feedback: () => <Feedback />,
  premium: () => <Premium />,
  notify: () => <Notify />,
  'news-config': () => <NewsConfig />,
  'ops-banner': () => <OpsBanner />,
  'assess-mi': () => (
    <LearningAssessment
      title="多元智能测评"
      subtitle="C-Lingo 官网 · 多元智能测评配置"
      configKey="assess-mi"
    />
  ),
  'assess-style': () => (
    <LearningAssessment
      title="学习风格测评"
      subtitle="C-Lingo 官网 · 学习风格测评配置"
      configKey="assess-style"
    />
  ),
  'assess-mbti': () => (
    <LearningAssessment
      title="MBTI测评"
      subtitle="C-Lingo 官网 · MBTI 测评配置"
      configKey="assess-mbti"
    />
  ),
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
