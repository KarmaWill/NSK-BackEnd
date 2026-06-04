import { useState } from 'react';
import { PageTabPanel, PageTabs } from '../components/PageTabs';

export type AssessmentConfigKey =
  | 'hsk-diagnostic'
  | 'hsk-vocab-assess'
  | 'hsk-speaking-rater'
  | 'hsk-writing-rater'
  | 'assess-mi'
  | 'assess-style'
  | 'assess-mbti';

type Props = {
  title: string;
  subtitle: string;
  configKey: AssessmentConfigKey;
};

const TAB_DEFS: Record<AssessmentConfigKey, { id: string; label: string }[]> = {
  'hsk-diagnostic': [
    { id: 'basic', label: '基础配置' },
    { id: 'scope', label: '题目范围' },
    { id: 'grading', label: '分级规则' },
  ],
  'hsk-vocab-assess': [
    { id: 'basic', label: '基础配置' },
    { id: 'scope', label: '词汇范围' },
    { id: 'grading', label: '通过标准' },
  ],
  'hsk-speaking-rater': [
    { id: 'basic', label: '基础配置' },
    { id: 'scope', label: '评分维度' },
    { id: 'grading', label: 'Rater 规则' },
  ],
  'hsk-writing-rater': [
    { id: 'basic', label: '基础配置' },
    { id: 'scope', label: '评分维度' },
    { id: 'grading', label: 'Rater 规则' },
  ],
  'assess-mi': [
    { id: 'basic', label: '基础配置' },
    { id: 'scope', label: '维度与题量' },
    { id: 'grading', label: '权重配置' },
  ],
  'assess-style': [
    { id: 'basic', label: '基础配置' },
    { id: 'scope', label: '题目范围' },
    { id: 'grading', label: '结果解读' },
  ],
  'assess-mbti': [
    { id: 'basic', label: '基础配置' },
    { id: 'scope', label: '题目范围' },
    { id: 'grading', label: '类型映射' },
  ],
};

const HINTS: Record<string, string> = {
  basic: '配置测评入口文案、说明与结果展示规则；依托全库题库选择题目。',
  scope: '设置题目来源、数量与筛选条件（词汇等级、场景标签等）。',
  grading: '配置通过标准、分数区间与级别映射；入门诊断需配置分级规则。',
};

export function LearningAssessment({ title, subtitle, configKey }: Props) {
  const tabs = TAB_DEFS[configKey];
  const [activeTab, setActiveTab] = useState(tabs[0].id);

  return (
    <>
      <div className="page-header">
        <div>
          <div className="page-title">{title}</div>
          <div className="page-subtitle">{subtitle}</div>
        </div>
        <div className="page-actions">
          <button type="button" className="btn btn-primary">保存配置</button>
        </div>
      </div>

      <PageTabs tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab}>
        {tabs.map((tab) => (
          <PageTabPanel key={tab.id} id={tab.id} activeTab={activeTab}>
            <div className="card">
              <div className="card-header">
                <div className="card-title">{tab.label}</div>
              </div>
              <div className="card-body">
                <p className="text-muted" style={{ margin: 0 }}>
                  {HINTS[tab.id] ?? '在此配置测评相关参数。'}
                  {configKey === 'hsk-diagnostic' && tab.id === 'grading' && (
                    <> 对齐 Excel「入门测」：分数区间对应 HSK 级别，区间不可重叠。</>
                  )}
                </p>
              </div>
            </div>
          </PageTabPanel>
        ))}
      </PageTabs>
    </>
  );
}
