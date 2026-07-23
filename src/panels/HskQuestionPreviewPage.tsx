import { useLayoutEffect, useState } from 'react';
import { HskQuestionEditPreview } from '../components/HskQuestionEditPreview';
import type { HskQuestionRow, HskQuestionTypeDef } from '../types/hskExams';

type Props = {
  question: HskQuestionRow;
  types: HskQuestionTypeDef[];
  onBack: () => void;
};

export function HskQuestionPreviewPage({ question, types, onBack }: Props) {
  const [tabletLandscape, setTabletLandscape] = useState(false);
  const typeDef = types.find((type) => type.id === question.type_id);

  useLayoutEffect(() => {
    document.querySelector<HTMLElement>('.content')?.scrollTo({ top: 0, left: 0 });
  }, [question.question_uid]);

  return (
    <div className="hsk-question-edit-page hsk-question-preview-page">
      <header className="hsk-question-edit-topbar">
        <button type="button" className="hsk-question-edit-back" onClick={onBack}>
          返回题目列表
        </button>
        <span className="hsk-question-edit-topbar-title">题目预览 · {question.question_uid}</span>
      </header>
      <div className="hsk-question-edit-fullscreen-preview">
        <HskQuestionEditPreview
          question={question}
          typeDef={typeDef}
          tabletLandscape={tabletLandscape}
          onTabletLandscapeChange={setTabletLandscape}
          showToolbarControls
        />
      </div>
    </div>
  );
}
