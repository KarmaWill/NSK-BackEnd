import { useState } from 'react';
import { HskQuestionTagPicker } from './HskQuestionTagPicker';
import type { HskQuestionRow, HskQuestionTag } from '../types/hskExams';

type Props = {
  question: HskQuestionRow;
  tags: HskQuestionTag[];
  onTagsChange: (next: string[]) => void;
};

export function HskQuestionTagsLinksSection({ question, tags, onTagsChange }: Props) {
  const [expanded, setExpanded] = useState(true);

  const hasLinks =
    question.linked_courses.length > 0 ||
    question.linked_papers.length > 0 ||
    question.linked_videos.length > 0;

  const removeTag = (label: string) => {
    onTagsChange(question.tags.filter((t) => t !== label));
  };

  return (
    <>
      <div className="hsk-question-edit-section-divider" />
      <button
        type="button"
        className="hsk-question-edit-collapsible-head"
        onClick={() => setExpanded((v) => !v)}
        aria-expanded={expanded}
      >
        <h3># 标签 / 关联资源</h3>
        <span>{expanded ? '收起 ▲' : '展开 ▼'}</span>
      </button>

      {expanded && (
        <div className="hsk-question-edit-tags-links-body">
          <div className="hsk-question-edit-tag-section">
            <label>标签</label>
            {question.tags.length > 0 && (
              <div className="hsk-question-edit-tag-pills">
                {question.tags.map((label) => (
                  <span key={label} className="hsk-question-edit-tag-pill">
                    {label}
                    <button
                      type="button"
                      className="hsk-question-edit-tag-pill-remove"
                      aria-label={`移除 ${label}`}
                      onClick={() => removeTag(label)}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
            <HskQuestionTagPicker
              tags={tags}
              selected={question.tags}
              onChange={onTagsChange}
              hideSelectedPills
            />
          </div>

          <div className="hsk-question-edit-linked-section">
            <label>已关联资源</label>
            <p className="hsk-question-edit-linked-hint">
              如需解除关联，请前往对应课程或试卷的管理页面操作
            </p>
            {!hasLinks ? (
              <p className="hsk-question-edit-linked-empty">暂无关联资源</p>
            ) : (
              <div className="hsk-question-edit-linked-rows">
                {question.linked_courses.length > 0 && (
                  <p className="hsk-question-edit-linked-row">
                    <span className="hsk-question-edit-linked-label">📚 课程：</span>
                    {question.linked_courses.join('、')}
                  </p>
                )}
                {question.linked_papers.length > 0 && (
                  <p className="hsk-question-edit-linked-row">
                    <span className="hsk-question-edit-linked-label">📄 试卷：</span>
                    {question.linked_papers.join('、')}
                  </p>
                )}
                {question.linked_videos.length > 0 && (
                  <p className="hsk-question-edit-linked-row">
                    <span className="hsk-question-edit-linked-label">🎬 视频：</span>
                    {question.linked_videos.join('、')}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
