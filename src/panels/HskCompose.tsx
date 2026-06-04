import type { PanelId } from '../types';

type Props = {
  onNavigate?: (id: PanelId) => void;
};

export function HskCompose({ onNavigate }: Props) {
  return (
    <>
      <div className="page-header">
        <div>
          <div className="page-title">自由组卷</div>
          <div className="page-subtitle">C-Lingo 官网 · HSK / K12 / MBTI 模式组卷工作台（一期规划中）</div>
        </div>
      </div>
      <div className="card">
        <div className="card-header">
          <div className="card-title">组卷模式</div>
        </div>
        <div className="card-body">
          <p className="text-muted" style={{ margin: '0 0 16px' }}>
            支持 HSK 大纲组卷、K12 模式、MBTI 模式与创作者自定义拼盘。请先完成题库管理与考试管理中的试卷模板配置。
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {onNavigate && (
              <>
                <button type="button" className="btn btn-secondary" onClick={() => onNavigate('hsk-question-bank')}>
                  前往题库管理
                </button>
                <button type="button" className="btn btn-secondary" onClick={() => onNavigate('hsk-exam')}>
                  前往考试管理
                </button>
                <button type="button" className="btn btn-secondary" onClick={() => onNavigate('hsk-paper')}>
                  前往试卷管理
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
