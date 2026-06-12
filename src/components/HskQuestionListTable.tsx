import {
  getQuestionStatusClass,
  getQuestionStatusLabel,
} from '../config/hskQuestionWorkflow';
import { getAnswerModeDef, guessAnswerMode } from '../config/hskAnswerModes';
import type {
  HskQuestionRow,
  HskQuestionStatus,
  HskQuestionTypeCode,
  HskQuestionTypeDef,
} from '../types/hskExams';

type Props = {
  questions: HskQuestionRow[];
  types: HskQuestionTypeDef[];
  onEdit: (question: HskQuestionRow) => void;
  onPreview: (question: HskQuestionRow) => void;
  onDelete: (question: HskQuestionRow) => void;
  onStatusChange?: (question: HskQuestionRow, nextStatus: HskQuestionStatus) => void;
};

function sectionEmoji(typeId: HskQuestionTypeCode): string {
  if (typeId.startsWith('L')) return '🎧';
  if (typeId.startsWith('R')) return '📖';
  return '✍️';
}

function getQuestionTypeLabel(question: HskQuestionRow, types: HskQuestionTypeDef[]): string {
  const typeDef = types.find((t) => t.id === question.type_id);
  if (!typeDef) return question.type_id;
  if (typeDef.id.startsWith('T')) return typeDef.name;
  return typeDef.hskTypeCode || typeDef.name;
}

function getTypeModeLabel(question: HskQuestionRow, types: HskQuestionTypeDef[]): string {
  const typeDef = types.find((t) => t.id === question.type_id);
  const mode = guessAnswerMode(question.type_id, typeDef?.answerMode as Parameters<typeof guessAnswerMode>[1]);
  return getAnswerModeDef(mode).label;
}

function getTagLabels(question: HskQuestionRow, types: HskQuestionTypeDef[]): string[] {
  if (question.tags.length > 0) return question.tags;
  return [getTypeModeLabel(question, types)];
}

export function getQuestionTypeFilterLabel(typeId: HskQuestionTypeCode, fallbackName: string): string {
  const emoji = sectionEmoji(typeId);
  return `${emoji} ${fallbackName} (${typeId})`;
}

export function HskQuestionListTable({
  questions,
  types,
  onEdit,
  onPreview,
  onDelete,
  onStatusChange,
}: Props) {
  return (
    <div className="hsk-question-list-table-card">
      <div className="hsk-question-list-table-wrap">
        <table className="hsk-question-list-table">
          <thead>
            <tr>
              <th className="col-check" aria-label="选择" />
              <th className="col-id">编号</th>
              <th className="col-stem">题目</th>
              <th className="col-type">题型</th>
              <th className="col-level">等级</th>
              <th className="col-tags">标签</th>
              <th className="col-links">关联资源</th>
              <th className="col-status">状态</th>
              <th className="col-actions">操作</th>
            </tr>
          </thead>
          <tbody>
            {questions.map((q) => {
              const tags = getTagLabels(q, types);
              return (
                <tr key={q.question_uid}>
                  <td className="col-check">
                    <input type="checkbox" aria-label={`选择 ${q.question_uid}`} />
                  </td>
                  <td className="col-id">
                    <span className="paper-id">{q.question_uid}</span>
                  </td>
                  <td className="col-stem">
                    <div className="hsk-question-list-stem-cell">{q.stem || '（无题干）'}</div>
                  </td>
                  <td className="col-type">{getQuestionTypeLabel(q, types)}</td>
                  <td className="col-level">
                    <span className="hsk-level-mini">{q.level}</span>
                  </td>
                  <td className="col-tags">
                    <div className="hsk-question-list-tag-row">
                      {tags.map((tag) => (
                        <span key={tag} className="hsk-question-list-tag">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="col-links">
                    <div className="hsk-question-list-links">
                      {q.linked_courses.length > 0 && (
                        <span title="关联课程">📚{q.linked_courses.length}</span>
                      )}
                      {q.linked_papers.length > 0 && (
                        <span title="关联试卷">📄{q.linked_papers.length}</span>
                      )}
                      {q.linked_videos.length > 0 && (
                        <span title="关联视频">🎬{q.linked_videos.length}</span>
                      )}
                      {q.linked_courses.length === 0 &&
                        q.linked_papers.length === 0 &&
                        q.linked_videos.length === 0 && <span className="muted">—</span>}
                    </div>
                  </td>
                  <td className="col-status">
                    <div className="hsk-question-list-status-cell">
                      <span className={`hsk-question-list-status ${getQuestionStatusClass(q.status)}`}>
                        {getQuestionStatusLabel(q.status)}
                      </span>
                      {q.status === 'draft' && onStatusChange && (
                        <button
                          type="button"
                          className="hsk-question-list-status-btn"
                          onClick={() => onStatusChange(q, 'pending_review')}
                        >
                          提交审核
                        </button>
                      )}
                      {q.status === 'pending_review' && onStatusChange && (
                        <button
                          type="button"
                          className="hsk-question-list-status-btn"
                          onClick={() => onStatusChange(q, 'pending_publish')}
                        >
                          审核通过
                        </button>
                      )}
                      {q.status === 'pending_publish' && onStatusChange && (
                        <button
                          type="button"
                          className="hsk-question-list-status-btn is-primary"
                          onClick={() => onStatusChange(q, 'published')}
                        >
                          发布
                        </button>
                      )}
                    </div>
                  </td>
                  <td className="col-actions">
                    <div className="hsk-question-list-row-actions">
                      <button type="button" className="hsk-question-list-action" onClick={() => onEdit(q)}>
                        编辑
                      </button>
                      <button type="button" className="hsk-question-list-action" onClick={() => onPreview(q)}>
                        预览
                      </button>
                      <button
                        type="button"
                        className="hsk-question-list-action hsk-question-list-action-danger"
                        onClick={() => onDelete(q)}
                      >
                        删除
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
