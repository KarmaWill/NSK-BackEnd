import { HskExamManager } from '../components/HskExamManager';
import type { PanelId } from '../types';

type Props = {
  onNavigate?: (id: PanelId) => void;
};

export function HskExam({ onNavigate }: Props) {
  return <HskExamManager onNavigate={onNavigate} />;
}
