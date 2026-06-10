import { useState } from 'react';

type SectionType = 'listening' | 'reading' | 'writing';

type QuestionTypeConfig = {
  id: string;
  name: string;
  section: SectionType;
  questionCount: number;
  score: number;
};

// 模拟的题型数据
const QUESTION_TYPES: Record<SectionType, QuestionTypeConfig[]> = {
  listening: [
    { id: 'L01', name: '判断对错', section: 'listening', questionCount: 5, score: 5 },
    { id: 'L02', name: '看图选词', section: 'listening', questionCount: 5, score: 5 },
    { id: 'L03', name: '听句选图', section: 'listening', questionCount: 5, score: 5 },
    { id: 'L04', name: '听后选择', section: 'listening', questionCount: 5, score: 5 },
    { id: 'L05', name: '听后排序', section: 'listening', questionCount: 5, score: 5 },
  ],
  reading: [
    { id: 'R01', name: '图文匹配', section: 'reading', questionCount: 5, score: 5 },
    { id: 'R02', name: '词句搭配', section: 'reading', questionCount: 5, score: 5 },
    { id: 'R03', name: '完型填空', section: 'reading', questionCount: 5, score: 5 },
    { id: 'R04', name: '阅读理解', section: 'reading', questionCount: 10, score: 10 },
    { id: 'R05', name: '选词填空', section: 'reading', questionCount: 5, score: 5 },
    { id: 'R06', name: '句子排序', section: 'reading', questionCount: 5, score: 5 },
    { id: 'R07', name: '段落理解', section: 'reading', questionCount: 5, score: 5 },
  ],
  writing: [
    { id: 'W01', name: '看图组词', section: 'writing', questionCount: 5, score: 10 },
    { id: 'W02', name: '连词成句', section: 'writing', questionCount: 5, score: 10 },
    { id: 'W03', name: '看图写句', section: 'writing', questionCount: 3, score: 15 },
    { id: 'W04', name: '命题作文', section: 'writing', questionCount: 1, score: 15 },
  ],
};

type Props = {
  section: SectionType;
  questionTypeId: string;
  hskLevel: number;
  onBack: () => void;
};

export function HskQuestionConfig({ section, questionTypeId, hskLevel, onBack }: Props) {
  const allTypes = QUESTION_TYPES[section];
  const currentType = allTypes.find(t => t.id === questionTypeId) || allTypes[0];
  
  const [activeTypeId, setActiveTypeId] = useState(currentType.id);
  const [toast, setToast] = useState<string | null>(null);

  const activeType = allTypes.find(t => t.id === activeTypeId) || currentType;

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2200);
  };

  const getSectionColor = () => {
    switch (section) {
      case 'listening': return '#534AB7';
      case 'reading': return '#0F6E56';
      case 'writing': return '#E85D04';
      default: return '#534AB7';
    }
  };

  const getSectionName = () => {
    switch (section) {
      case 'listening': return '听力';
      case 'reading': return '阅读';
      case 'writing': return '书写';
      default: return '';
    }
  };

  return (
    <>
      <div className="question-config-container">
        {/* 左侧配置面板 */}
        <div className="config-panel">
          <div className="config-header">
            <div className="config-header-top">
              <h1>
                <button 
                  type="button" 
                  className="back-btn"
                  onClick={onBack}
                >
                  ← 返回
                </button>
                <span style={{ color: getSectionColor() }}>
                  {getSectionName()}题型配置
                </span>
                <span className="hsk-level-badge">HSK {hskLevel}</span>
              </h1>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button 
                  type="button" 
                  className="btn btn-secondary btn-sm"
                  onClick={() => showToast('保存草稿成功')}
                >
                  💾 保存草稿
                </button>
                <button 
                  type="button" 
                  className="btn btn-primary btn-sm"
                  onClick={() => showToast('发布成功')}
                >
                  📤 发布
                </button>
              </div>
            </div>

            {/* 题型切换tabs */}
            <div className="type-tabs">
              {allTypes.map(type => (
                <button
                  key={type.id}
                  type="button"
                  className={`type-tab ${activeTypeId === type.id ? 'active' : ''}`}
                  onClick={() => setActiveTypeId(type.id)}
                >
                  {type.id} {type.name}
                  <span className="badge">{type.questionCount}题</span>
                </button>
              ))}
            </div>
          </div>

          <div className="config-body">
            {/* 基本信息 */}
            <div className="config-section">
              <div className="section-title">
                📋 基本信息
              </div>
              <div className="form-group">
                <label>
                  题型名称<span className="required">*</span>
                </label>
                <input 
                  type="text" 
                  value={activeType.name}
                  readOnly
                  style={{ background: 'var(--stone-lighter)' }}
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>
                    题目数量<span className="required">*</span>
                  </label>
                  <input 
                    type="number" 
                    value={activeType.questionCount}
                    onChange={() => {}}
                  />
                </div>
                <div className="form-group">
                  <label>
                    单题分值<span className="required">*</span>
                  </label>
                  <input 
                    type="number" 
                    value={activeType.score}
                    onChange={() => {}}
                  />
                </div>
                <div className="form-group">
                  <label>总分</label>
                  <input 
                    type="number" 
                    value={activeType.questionCount * activeType.score}
                    readOnly
                    style={{ background: 'var(--stone-lighter)' }}
                  />
                </div>
              </div>
            </div>

            {/* 题目内容 */}
            <div className="config-section">
              <div className="section-title">
                ✏️ 题目内容
              </div>
              <div className="form-group">
                <label>
                  题干文本<span className="optional">(可选)</span>
                </label>
                <textarea 
                  placeholder="输入题干说明文字..."
                  rows={3}
                />
              </div>

              {/* 音频/图片资源 */}
              {section === 'listening' && (
                <div className="form-group">
                  <label>
                    音频资源<span className="required">*</span>
                  </label>
                  <div className="resource-selector">
                    <span className="resource-icon">🎵</span>
                    <span className="resource-name empty">选择音频文件</span>
                    <span className="resource-action">浏览</span>
                  </div>
                </div>
              )}

              {(section === 'reading' || section === 'writing') && (
                <div className="form-group">
                  <label>
                    图片资源<span className="optional">(可选)</span>
                  </label>
                  <div className="resource-selector">
                    <span className="resource-icon">🖼️</span>
                    <span className="resource-name empty">选择图片文件</span>
                    <span className="resource-action">浏览</span>
                  </div>
                </div>
              )}
            </div>

            {/* 选项配置 */}
            <div className="config-section">
              <div className="section-title">
                🔤 选项配置
              </div>
              
              {['A', 'B', 'C', 'D'].map(key => (
                <div key={key} className="option-card">
                  <div className="option-header">
                    <div className="option-key">{key}</div>
                    <label className="checkbox-label">
                      <span>正确答案</span>
                      <input type="checkbox" />
                    </label>
                  </div>
                  <div className="form-group">
                    <input 
                      type="text" 
                      placeholder={`输入选项 ${key} 的内容...`}
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* 解析说明 */}
            <div className="config-section">
              <div className="section-title">
                💡 解析说明
              </div>
              <div className="form-group">
                <label>
                  答案解析<span className="optional">(可选)</span>
                </label>
                <textarea 
                  placeholder="输入答案解析，帮助学生理解..."
                  rows={4}
                />
              </div>
            </div>
          </div>
        </div>

        {/* 右侧预览面板 */}
        <div className="preview-panel">
          <div className="preview-header">
            <h2>实时预览</h2>
          </div>
          <div className="preview-body">
            <div className="preview-device">
              <div className="preview-screen">
                <div className="question-preview" style={{ borderTopColor: getSectionColor() }}>
                  <div className="question-preview-header">
                    <span className="question-type-label" style={{ background: getSectionColor() }}>
                      {activeType.id}
                    </span>
                    <span className="question-title">{activeType.name}</span>
                  </div>
                  
                  <div className="question-preview-content">
                    <div className="question-stem">
                      <p style={{ color: 'var(--ink-light)', fontSize: '14px' }}>
                        题干内容将显示在这里...
                      </p>
                    </div>

                    {section === 'listening' && (
                      <div className="audio-player">
                        <button type="button" className="play-btn">▶️</button>
                        <div className="audio-waveform"></div>
                      </div>
                    )}

                    <div className="options-preview">
                      {['A', 'B', 'C', 'D'].map(key => (
                        <div key={key} className="option-preview">
                          <span className="option-key-preview">{key}</span>
                          <span className="option-text-preview">选项内容</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="question-preview-footer">
                    <span style={{ fontSize: '13px', color: 'var(--ink-light)' }}>
                      分值: {activeType.score}分
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {toast && (
        <div className="hsk-toast show">
          {toast}
        </div>
      )}
    </>
  );
}
