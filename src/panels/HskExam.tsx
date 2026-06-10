import { useState } from 'react';
import { PageTabPanel, PageTabs } from '../components/PageTabs';
import { getLevelStandard } from '../config/hskLevelStandards';
import { levelToNumber } from '../config/hskQuestionTypes';
import { useHskStore } from '../hooks/useHskStore';
import { createExamFromPaper, loadHskStore, publishExam, saveExam } from '../stores/hskExams';
import type { HskExamInstance } from '../types/hskExams';

const EXAM_TABS = [
  { id: 'instances', label: '考试列表' },
  { id: 'notice', label: '须知配置' },
] as const;

export function HskExam() {
  const { store, refresh } = useHskStore();
  const [activeTab, setActiveTab] = useState<string>('instances');
  const [toast, setToast] = useState<string | null>(null);
  const [editingExam, setEditingExam] = useState<HskExamInstance | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2200);
  };

  const noticePanel = editingExam ? (
    <div className="card">
      <div className="card-header">
        <div className="card-title">考试须知 · {editingExam.name}</div>
      </div>
      <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div>
          <label className="form-label">须知条目（每行一条）</label>
          <textarea
            className="form-input"
            rows={6}
            value={(editingExam.noticeRules ?? []).join('\n')}
            onChange={(e) =>
              setEditingExam({
                ...editingExam,
                noticeRules: e.target.value.split('\n').map((s) => s.trim()).filter(Boolean),
              })
            }
          />
        </div>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <input
            type="checkbox"
            checked={editingExam.showPinyin ?? true}
            onChange={(e) => setEditingExam({ ...editingExam, showPinyin: e.target.checked })}
          />
          学员端显示拼音
        </label>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => {
              saveExam(store, editingExam);
              refresh();
              showToast('须知已保存');
            }}
          >
            保存须知
          </button>
          <button type="button" className="btn btn-secondary" onClick={() => setEditingExam(null)}>
            返回列表
          </button>
        </div>
        <p className="text-muted" style={{ margin: 0, fontSize: 13 }}>
          级别题型结构请在「试卷管理 → 试卷模板」维护；模考规范已合并进官方模板，避免双源配置。
        </p>
      </div>
    </div>
  ) : (
    <div className="card">
      <div className="card-body">
        <p className="text-muted" style={{ margin: 0 }}>
          请从考试列表点击「配置须知」编辑该考试的须知文案与拼音显示。
        </p>
      </div>
    </div>
  );

  const instancesPanel = (
    <>
      <div className="paper-filter-bar">
        <div className="filter-group">
          <span className="filter-label">基于已发布试卷创建:</span>
          <select
            id="hsk-create-exam-paper"
            defaultValue=""
            onChange={(e) => {
              const paperId = e.target.value;
              if (!paperId) return;
              const paper = store.papers.find((p) => p.id === paperId);
              if (!paper || paper.status !== 'published') {
                showToast('请先发布试卷后再创建考试');
                e.target.value = '';
                return;
              }
              const level = levelToNumber(String(paper.level)) ?? 1;
              const standard = getLevelStandard(level);
              createExamFromPaper(store, paperId, {
                name: `${paper.name} · 考试`,
                examType: 'mock',
                noticeRules: standard?.defaultNoticeRules,
                showPinyin: true,
              });
              refresh();
              showToast('已创建考试实例');
              e.target.value = '';
            }}
          >
            <option value="">选择试卷…</option>
            {store.papers.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.status === 'published' ? '已发布' : '草稿'})
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="paper-table-container">
        <table>
          <thead>
            <tr>
              <th>考试 ID</th>
              <th>名称</th>
              <th>类型</th>
              <th>级别</th>
              <th>时长/总分</th>
              <th>交付</th>
              <th>状态</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {store.exams.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center', padding: 48, color: 'var(--ink-light)' }}>
                  暂无考试，请先在试卷管理发布试卷后创建
                </td>
              </tr>
            ) : (
              store.exams.map((exam) => (
                <tr key={exam.id}>
                  <td><span className="paper-id">{exam.id}</span></td>
                  <td>{exam.name}</td>
                  <td>{exam.examType === 'mock' ? '模拟考' : exam.examType === 'formal' ? '正式考' : '练习'}</td>
                  <td>{exam.level}</td>
                  <td>{exam.duration} 分钟 / {exam.totalScore} 分 · 及格 {exam.passScore}</td>
                  <td style={{ fontSize: 12 }}>
                    {exam.deliveryCompiledAt ? (
                      <span style={{ color: 'var(--success)' }}>已编译</span>
                    ) : (
                      <span style={{ color: 'var(--ink-light)' }}>未发布</span>
                    )}
                  </td>
                  <td>{exam.status === 'published' ? '已发布' : '草稿'}</td>
                  <td>
                    <div className="actions">
                      <button
                        type="button"
                        className="action-btn edit"
                        onClick={() => {
                          setEditingExam(exam);
                          setActiveTab('notice');
                        }}
                      >
                        配置须知
                      </button>
                      <button
                        type="button"
                        className="action-btn data"
                        onClick={() => {
                          if (exam.status === 'published') {
                            saveExam(store, { ...exam, status: 'draft' });
                            refresh();
                            showToast('已下线考试');
                            return;
                          }
                          const err = publishExam(loadHskStore(), exam.id);
                          if (err) {
                            showToast(err);
                            return;
                          }
                          refresh();
                          showToast('考试已发布，delivery 已编译');
                        }}
                      >
                        {exam.status === 'published' ? '下线' : '发布'}
                      </button>
                      {exam.status === 'published' && (
                        <a
                          className="action-btn edit"
                          href={`/api/hsk/exams/${exam.id}/delivery`}
                          target="_blank"
                          rel="noreferrer"
                        >
                          API
                        </a>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <div className="card" style={{ marginTop: 16 }}>
        <div className="card-body">
          <p className="text-muted" style={{ margin: 0 }}>
            发布考试时会调用 compileExamDelivery 生成 ExamDeliveryPackage，并同步至 GET /api/hsk/exams/:id/delivery。
            学员端可通过 examId 拉卷。
          </p>
        </div>
      </div>
    </>
  );

  return (
    <>
      <div className="page-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div className="page-title">考试管理</div>
          <div className="page-subtitle">考试实例发布 · 须知配置 · 交付包编译</div>
        </div>
      </div>

      <PageTabs tabs={[...EXAM_TABS]} activeTab={activeTab} onTabChange={setActiveTab}>
        <PageTabPanel id="instances" activeTab={activeTab}>
          {instancesPanel}
        </PageTabPanel>
        <PageTabPanel id="notice" activeTab={activeTab}>
          {noticePanel}
        </PageTabPanel>
      </PageTabs>
      {toast && <div className="hsk-toast show">{toast}</div>}
    </>
  );
}
