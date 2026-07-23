import {
  canDeleteQuestion,
  canEditQuestion,
  canWithdrawQuestion,
  getQuestionStatusClass,
  getQuestionStatusLabel,
  nextQuestionStatus,
} from '../config/hskQuestionWorkflow';
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

function nextStatusActionLabel(status: HskQuestionStatus): string {
  switch (status) {
    case 'draft':
      return '提交审核';
    case 'pending_review':
      return '审核通过';
    case 'pending_publish':
      return '发布';
    default:
      return '';
  }
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
              <th className="col-workflow">审核管理</th>
              <th className="col-actions">操作</th>
            </tr>
          </thead>
          <tbody>
            {questions.map((q) => {
              const tags = q.tags;
              const nextStatus = nextQuestionStatus(q.status);
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
                      {tags.length === 0 && <span className="muted">—</span>}
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
                    <span className={`hsk-question-list-status ${getQuestionStatusClass(q.status)}`}>
                      {getQuestionStatusLabel(q.status)}
                    </span>
                  </td>
                  <td className="col-workflow">
                    <div className="hsk-question-list-workflow-actions">
                      {nextStatus && onStatusChange && (
                        <button
                          type="button"
                          className="hsk-question-list-action"
                          onClick={() => onStatusChange(q, nextStatus)}
                        >
                          {nextStatusActionLabel(q.status)}
                        </button>
                      )}
                      {canWithdrawQuestion(q.status) && onStatusChange && (
                        <button
                          type="button"
                          className="hsk-question-list-action hsk-question-list-action-neutral"
                          onClick={() => onStatusChange(q, 'draft')}
                        >
                          撤回草稿
                        </button>
                      )}
                    </div>
                  </td>
                  <td className="col-actions">
                    <div className="hsk-question-list-row-actions">
                      {canEditQuestion(q.status) && (
                        <button type="button" className="hsk-question-list-action" onClick={() => onEdit(q)}>
                          编辑
                        </button>
                      )}
                      <button type="button" className="hsk-question-list-action" onClick={() => onPreview(q)}>
                        预览
                      </button>
                      {canDeleteQuestion(q.status) && (
                        <button
                          type="button"
                          className="hsk-question-list-action hsk-question-list-action-danger"
                          onClick={() => onDelete(q)}
                        >
                          删除
                        </button>
                      )}
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
