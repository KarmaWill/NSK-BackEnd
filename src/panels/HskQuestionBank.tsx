import { useState } from 'react';
import { HskQuestionConfig } from './HskQuestionConfig';

type SectionType = 'listening' | 'reading' | 'writing';

type QuestionTypeItem = {
  id: string;
  name: string;
  section: SectionType;
  description: string;
  hskLevels: number[]; // 适用的HSK级别
  questionCount: number; // 已配置题目数
  totalQuestions: number; // 总题目数
  difficulty: string;
  lastModified: string;
  isPublished: boolean;
};

// 模拟题型数据
const MOCK_QUESTION_TYPES: QuestionTypeItem[] = [
  // 听力题型
  { id: 'L01', name: '判断对错', section: 'listening', description: '听句判断真假', hskLevels: [1, 2], questionCount: 45, totalQuestions: 50, difficulty: '★☆☆☆☆', lastModified: '2024-03-15', isPublished: true },
  { id: 'L02', name: '看图选词', section: 'listening', description: '听音频选对应图片', hskLevels: [1, 2], questionCount: 38, totalQuestions: 50, difficulty: '★★☆☆☆', lastModified: '2024-03-14', isPublished: true },
  { id: 'L03', name: '听句选图', section: 'listening', description: '听句子选择对应图片', hskLevels: [1, 2, 3], questionCount: 42, totalQuestions: 60, difficulty: '★★☆☆☆', lastModified: '2024-03-13', isPublished: true },
  { id: 'L04', name: '听后选择', section: 'listening', description: '听对话后选答案', hskLevels: [3, 4, 5], questionCount: 60, totalQuestions: 80, difficulty: '★★★☆☆', lastModified: '2024-03-12', isPublished: true },
  { id: 'L05', name: '听后排序', section: 'listening', description: '听对话排列句子顺序', hskLevels: [4, 5, 6], questionCount: 25, totalQuestions: 60, difficulty: '★★★★☆', lastModified: '2024-03-11', isPublished: false },
  
  // 阅读题型
  { id: 'R01', name: '图文匹配', section: 'reading', description: '图片与句子对应', hskLevels: [1, 2, 3], questionCount: 55, totalQuestions: 60, difficulty: '★☆☆☆☆', lastModified: '2024-03-10', isPublished: true },
  { id: 'R02', name: '词句搭配', section: 'reading', description: '词语与句子配对', hskLevels: [2, 3], questionCount: 40, totalQuestions: 50, difficulty: '★★☆☆☆', lastModified: '2024-03-09', isPublished: true },
  { id: 'R03', name: '完型填空', section: 'reading', description: '从词库选词填入空白', hskLevels: [3, 4, 5], questionCount: 70, totalQuestions: 80, difficulty: '★★★☆☆', lastModified: '2024-03-08', isPublished: true },
  { id: 'R04', name: '阅读理解', section: 'reading', description: '读文章后选择答案', hskLevels: [3, 4, 5, 6], questionCount: 85, totalQuestions: 100, difficulty: '★★★★☆', lastModified: '2024-03-07', isPublished: true },
  { id: 'R05', name: '选词填空', section: 'reading', description: '选择恰当词语填空', hskLevels: [4, 5, 6], questionCount: 48, totalQuestions: 60, difficulty: '★★★☆☆', lastModified: '2024-03-06', isPublished: true },
  { id: 'R06', name: '句子排序', section: 'reading', description: '拖拽排列句子顺序', hskLevels: [4, 5, 6], questionCount: 30, totalQuestions: 50, difficulty: '★★★★☆', lastModified: '2024-03-05', isPublished: false },
  { id: 'R07', name: '段落理解', section: 'reading', description: '理解段落主旨', hskLevels: [5, 6], questionCount: 20, totalQuestions: 40, difficulty: '★★★★★', lastModified: '2024-03-04', isPublished: false },
  
  // 写作题型
  { id: 'W01', name: '看图组词', section: 'writing', description: '看图片组合词语', hskLevels: [1, 2], questionCount: 35, totalQuestions: 40, difficulty: '★★☆☆☆', lastModified: '2024-03-03', isPublished: true },
  { id: 'W02', name: '连词成句', section: 'writing', description: '拖拽词语排列成句', hskLevels: [2, 3, 4], questionCount: 50, totalQuestions: 60, difficulty: '★★★☆☆', lastModified: '2024-03-02', isPublished: true },
  { id: 'W03', name: '看图写句', section: 'writing', description: '看图片写句子', hskLevels: [3, 4, 5], questionCount: 28, totalQuestions: 50, difficulty: '★★★★☆', lastModified: '2024-03-01', isPublished: true },
  { id: 'W04', name: '命题作文', section: 'writing', description: '根据命题写短文，AI评分', hskLevels: [4, 5, 6], questionCount: 15, totalQuestions: 30, difficulty: '★★★★★', lastModified: '2024-02-28', isPublished: false },
];

export function HskQuestionBank() {
  const [questionTypes, setQuestionTypes] = useState<QuestionTypeItem[]>(MOCK_QUESTION_TYPES);
  const [selectedSection, setSelectedSection] = useState<SectionType | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [toast, setToast] = useState<string | null>(null);
  const [configMode, setConfigMode] = useState<{ section: SectionType; typeId: string; hskLevel: number } | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2200);
  };

  const togglePublishStatus = (id: string) => {
    setQuestionTypes(questionTypes.map(q => 
      q.id === id ? { ...q, isPublished: !q.isPublished } : q
    ));
    const qtype = questionTypes.find(q => q.id === id);
    showToast(`已${qtype?.isPublished ? '取消发布' : '发布'} ${qtype?.name}`);
  };

  // 如果处于配置模式，显示配置页面
  if (configMode) {
    return (
      <HskQuestionConfig
        section={configMode.section}
        questionTypeId={configMode.typeId}
        hskLevel={configMode.hskLevel}
        onBack={() => setConfigMode(null)}
      />
    );
  }

  // 筛选逻辑
  const filteredTypes = questionTypes.filter(q => {
    const matchesSection = selectedSection === 'all' || q.section === selectedSection;
    const matchesSearch = searchQuery === '' || 
      q.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSection && matchesSearch;
  });

  const getSectionBadgeClass = (section: SectionType) => {
    switch (section) {
      case 'listening': return 'section-badge-listening';
      case 'reading': return 'section-badge-reading';
      case 'writing': return 'section-badge-writing';
      default: return '';
    }
  };

  const getSectionName = (section: SectionType) => {
    switch (section) {
      case 'listening': return '听力';
      case 'reading': return '阅读';
      case 'writing': return '书写';
      default: return '';
    }
  };

  const getProgressPercent = (current: number, total: number) => {
    return total > 0 ? Math.round((current / total) * 100) : 0;
  };

  return (
    <>
      <div className="page-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div className="page-title">题库管理</div>
          <div className="page-subtitle">管理 HSK 各类题型，配置题目内容、选项、解析等</div>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button type="button" className="btn btn-secondary" onClick={() => showToast('导入题库功能开发中')}>
            📥 导入题库
          </button>
          <button type="button" className="btn btn-primary" onClick={() => showToast('新建题型功能开发中')}>
            ➕ 新建题型
          </button>
        </div>
      </div>

      {/* 筛选栏 */}
      <div className="paper-filter-bar">
        <div className="filter-group">
          <span className="filter-label">题型分类:</span>
          <select value={selectedSection} onChange={(e) => setSelectedSection(e.target.value as SectionType | 'all')}>
            <option value="all">全部分类</option>
            <option value="listening">听力题型</option>
            <option value="reading">阅读题型</option>
            <option value="writing">书写题型</option>
          </select>
        </div>
        <div className="filter-group">
          <span className="filter-label">搜索:</span>
          <input 
            type="text" 
            className="search-input" 
            placeholder="搜索题型ID、名称或描述..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div style={{ marginLeft: 'auto', fontSize: '13px', color: 'var(--ink-light)' }}>
          共 {filteredTypes.length} 种题型
        </div>
      </div>

      {/* 表格 */}
      <div className="paper-table-container">
        <table>
          <thead>
            <tr>
              <th style={{ width: '80px', whiteSpace: 'nowrap' }}>题型ID</th>
              <th style={{ width: '120px' }}>题型名称</th>
              <th style={{ width: '90px', whiteSpace: 'nowrap' }}>分类</th>
              <th>题型描述</th>
              <th style={{ width: '140px', whiteSpace: 'nowrap' }}>适用级别</th>
              <th style={{ width: '100px', whiteSpace: 'nowrap' }}>最后修改</th>
              <th style={{ width: '100px' }}>难度</th>
              <th style={{ width: '100px' }}>发布状态</th>
              <th style={{ width: '200px', whiteSpace: 'nowrap' }}>操作</th>
            </tr>
          </thead>
          <tbody>
            {filteredTypes.length === 0 ? (
              <tr>
                <td colSpan={9} style={{ textAlign: 'center', padding: '60px', color: 'var(--ink-light)' }}>
                  {searchQuery ? '未找到匹配的题型' : '暂无题型数据'}
                </td>
              </tr>
            ) : (
              filteredTypes.map(qtype => {
                return (
                  <tr key={qtype.id}>
                    <td>
                      <span className="paper-id">{qtype.id}</span>
                    </td>
                    <td>
                      <div className="paper-name">{qtype.name}</div>
                    </td>
                    <td>
                      <span className={`section-badge ${getSectionBadgeClass(qtype.section)}`}>
                        {getSectionName(qtype.section)}
                      </span>
                    </td>
                    <td>
                      <div style={{ fontSize: '13px', color: 'var(--ink-light)' }}>
                        {qtype.description}
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                        {qtype.hskLevels.map(level => (
                          <span key={level} className="hsk-level-mini">
                            HSK{level}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td>
                      <div style={{ fontSize: '13px', color: 'var(--ink-light)', whiteSpace: 'nowrap' }}>
                        {qtype.lastModified}
                      </div>
                    </td>
                    <td>
                      <div style={{ fontSize: '13px', color: 'var(--amber)' }}>
                        {qtype.difficulty}
                      </div>
                    </td>
                    <td>
                      <label className="status-toggle">
                        <input 
                          type="checkbox" 
                          checked={qtype.isPublished}
                          onChange={() => togglePublishStatus(qtype.id)}
                        />
                        <span className="toggle-slider"></span>
                      </label>
                    </td>
                    <td>
                      <div className="actions">
                        <button 
                          type="button" 
                          className="action-btn edit"
                          onClick={() => setConfigMode({ section: qtype.section, typeId: qtype.id, hskLevel: qtype.hskLevels[0] })}
                        >
                          ✏️ 配置
                        </button>
                        <button 
                          type="button" 
                          className="action-btn data"
                          onClick={() => showToast(`查看 ${qtype.name} 的使用数据`)}
                        >
                          📊 数据
                        </button>
                        <button 
                          type="button" 
                          className="action-btn delete"
                          onClick={() => {
                            if (confirm(`确认删除题型"${qtype.name}"吗？这将删除该题型下的所有题目。`)) {
                              showToast(`已删除题型 ${qtype.name}`);
                            }
                          }}
                        >
                          🗑️ 删除
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {toast && (
        <div className="hsk-toast show">
          {toast}
        </div>
      )}
    </>
  );
}
