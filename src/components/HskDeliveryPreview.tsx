import type { ExamDeliveryPackage, HskRuntimeQuestion } from '../types/hskExams';

type Props = {
  delivery: ExamDeliveryPackage | null;
  error?: string | null;
};

function questionSummary(q: HskRuntimeQuestion): string {
  if (q.questions?.length) {
    return `复合题 · ${q.questions.length} 小题`;
  }
  const content = q.content;
  if (content && typeof content === 'object') {
    const text =
      (content.phrase as string | undefined) ??
      (content.sentence as string | undefined) ??
      (content.question as string | undefined) ??
      (content.prompt as string | undefined);
    if (text) return text.length > 40 ? `${text.slice(0, 40)}…` : text;
  }
  if (q.options?.length) return `${q.options.length} 个选项`;
  return '—';
}

export function HskDeliveryPreview({ delivery, error }: Props) {
  if (error) {
    return (
      <div className="card">
        <div className="card-body">
          <p style={{ color: 'var(--danger)', margin: 0 }}>{error}</p>
        </div>
      </div>
    );
  }

  if (!delivery) {
    return (
      <div className="card">
        <div className="card-body">
          <p className="text-muted" style={{ margin: 0 }}>暂无编译结果，请先完成组卷选题。</p>
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="card-header">
        <div className="card-title">学员端预览</div>
        <div style={{ fontSize: 13, color: 'var(--ink-light)' }}>
          {delivery.questions.length} 题 · {delivery.totalScore} 分 · {delivery.durationMinutes} 分钟 · 及格 {delivery.passScore} 分
        </div>
      </div>
      <div className="card-body">
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
          {delivery.sectionSummary.map((s) => (
            <span key={s.module} className="library-feature-selected-tag">
              {s.module} {s.count} 题{s.minutes ? ` · 约 ${s.minutes} 分钟` : ''}
            </span>
          ))}
        </div>

        <div className="paper-table-container">
          <table>
            <thead>
              <tr>
                <th style={{ width: 56 }}>#</th>
                <th style={{ width: 88 }}>题型</th>
                <th>名称 / 内容摘要</th>
                <th style={{ width: 100 }}>部分</th>
                <th style={{ width: 72 }}>分值</th>
                <th style={{ width: 72 }}>答案</th>
              </tr>
            </thead>
            <tbody>
              {delivery.questions.map((q) => (
                <tr key={`${q.type}-${q.id}`}>
                  <td>{q.id}</td>
                  <td><span className="paper-id">{q.type}</span></td>
                  <td>
                    <div style={{ fontWeight: 500 }}>{q.typeName}</div>
                    <div style={{ fontSize: 12, color: 'var(--ink-light)', marginTop: 2 }}>{questionSummary(q)}</div>
                  </td>
                  <td style={{ fontSize: 13 }}>{q.section}</td>
                  <td>{q.score}</td>
                  <td style={{ fontSize: 13 }}>
                    {q.questions?.length
                      ? `${q.questions.length} 小题`
                      : q.answer ?? '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <details style={{ marginTop: 16 }}>
          <summary style={{ cursor: 'pointer', fontSize: 13, color: 'var(--ink-light)', userSelect: 'none' }}>
            展开原始 JSON（供开发联调）
          </summary>
          <pre
            style={{
              margin: '12px 0 0',
              padding: 16,
              background: 'var(--surface2)',
              borderRadius: 8,
              fontSize: 11,
              lineHeight: 1.5,
              overflow: 'auto',
              maxHeight: 360,
            }}
          >
            {JSON.stringify(delivery.questions, null, 2)}
          </pre>
        </details>
      </div>
    </div>
  );
}
