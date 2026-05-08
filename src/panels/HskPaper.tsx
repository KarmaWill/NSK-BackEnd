import { useState } from 'react';

type Paper = {
  id: string;
  name: string;
  hskLevel: number;
  listening: number;
  reading: number;
  writing: number;
  totalScore: number;
  duration: number; // 分钟
  isPublished: boolean;
  linkedCourses: number;
  lastModified: string;
};

// 模拟数据
const MOCK_PAPERS: Paper[] = [
  { id: 'UT-001', name: 'Unit 1 课后测试：日常问候与介绍', hskLevel: 1, listening: 10, reading: 10, writing: 5, totalScore: 100, duration: 20, isPublished: true, linkedCourses: 3, lastModified: '2024-03-15' },
  { id: 'UT-002', name: 'Unit 2 课后测试：购物与消费', hskLevel: 2, listening: 10, reading: 10, writing: 5, totalScore: 100, duration: 20, isPublished: true, linkedCourses: 5, lastModified: '2024-03-14' },
  { id: 'UT-003', name: 'Unit 3 课后测试：餐饮与点餐', hskLevel: 2, listening: 12, reading: 12, writing: 6, totalScore: 100, duration: 20, isPublished: true, linkedCourses: 2, lastModified: '2024-03-13' },
  { id: 'UT-004', name: 'Unit 4 课后测试：交通出行', hskLevel: 3, listening: 12, reading: 12, writing: 6, totalScore: 100, duration: 25, isPublished: false, linkedCourses: 0, lastModified: '2024-03-12' },
  { id: 'UT-005', name: 'Unit 5 课后测试：工作与职业', hskLevel: 4, listening: 15, reading: 15, writing: 5, totalScore: 100, duration: 30, isPublished: true, linkedCourses: 4, lastModified: '2024-03-11' },
  { id: 'CT-001', name: '第一章综合测试（Unit 1-3）', hskLevel: 2, listening: 20, reading: 30, writing: 10, totalScore: 100, duration: 45, isPublished: true, linkedCourses: 2, lastModified: '2024-03-09' },
  { id: 'CT-002', name: '第二章综合测试（Unit 4-6）', hskLevel: 4, listening: 20, reading: 30, writing: 10, totalScore: 100, duration: 45, isPublished: true, linkedCourses: 1, lastModified: '2024-03-08' },
  { id: 'RT-001', name: '上学期期中总复习', hskLevel: 3, listening: 30, reading: 35, writing: 15, totalScore: 100, duration: 60, isPublished: true, linkedCourses: 8, lastModified: '2024-03-06' },
  { id: 'RT-002', name: '下学期期末总复习', hskLevel: 4, listening: 35, reading: 40, writing: 25, totalScore: 100, duration: 80, isPublished: true, linkedCourses: 6, lastModified: '2024-03-05' },
];

export function HskPaper() {
  const [papers, setPapers] = useState<Paper[]>(MOCK_PAPERS);
  const [selectedHskLevel, setSelectedHskLevel] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2200);
  };

  const togglePublishStatus = (id: string) => {
    setPapers(papers.map(p => 
      p.id === id ? { ...p, isPublished: !p.isPublished } : p
    ));
    const paper = papers.find(p => p.id === id);
    showToast(`已${paper?.isPublished ? '取消发布' : '发布'} ${paper?.name}`);
  };

  // 筛选逻辑
  const filteredPapers = papers.filter(p => {
    const matchesLevel = selectedHskLevel === null || p.hskLevel === selectedHskLevel;
    const matchesSearch = searchQuery === '' || 
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.id.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesLevel && matchesSearch;
  });

  const getHskBadgeClass = (level: number) => {
    const classes: Record<number, string> = {
      1: 'hsk-badge-1',
      2: 'hsk-badge-2',
      3: 'hsk-badge-3',
      4: 'hsk-badge-4',
      5: 'hsk-badge-5',
      6: 'hsk-badge-6',
    };
    return classes[level] || 'hsk-badge-1';
  };

  return (
    <>
      <div className="page-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div className="page-title">试卷管理</div>
          <div className="page-subtitle">管理测试模块，配置给图书单元测试、体系课程单元测等</div>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button type="button" className="btn btn-secondary" onClick={() => showToast('打开批量操作面板')}>
            📦 批量操作
          </button>
          <button type="button" className="btn btn-primary" onClick={() => showToast('打开新建测试页面')}>
            ➕ 新建测试
          </button>
        </div>
      </div>

      {/* 筛选栏 */}
      <div className="paper-filter-bar">
        <div className="filter-group">
          <span className="filter-label">HSK级别:</span>
          <select value={selectedHskLevel || ''} onChange={(e) => setSelectedHskLevel(e.target.value ? Number(e.target.value) : null)}>
            <option value="">全部级别</option>
            <option value="1">HSK 1</option>
            <option value="2">HSK 2</option>
            <option value="3">HSK 3</option>
            <option value="4">HSK 4</option>
            <option value="5">HSK 5</option>
            <option value="6">HSK 6</option>
          </select>
        </div>
        <div className="filter-group">
          <span className="filter-label">搜索:</span>
          <input 
            type="text" 
            className="search-input" 
            placeholder="搜索试卷ID或名称..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div style={{ marginLeft: 'auto', fontSize: '13px', color: 'var(--ink-light)' }}>
          共 {filteredPapers.length} 条记录
        </div>
      </div>

      {/* 表格 */}
      <div className="paper-table-container">
        <table>
          <thead>
            <tr>
              <th style={{ width: '100px' }}>试卷ID</th>
              <th>试卷名称</th>
              <th style={{ width: '90px', whiteSpace: 'nowrap' }}>级别</th>
              <th style={{ width: '200px' }}>题目构成</th>
              <th style={{ width: '140px', whiteSpace: 'nowrap' }}>总分/时长</th>
              <th style={{ width: '100px' }}>发布状态</th>
              <th style={{ width: '230px', whiteSpace: 'nowrap' }}>操作</th>
            </tr>
          </thead>
          <tbody>
            {filteredPapers.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '60px', color: 'var(--ink-light)' }}>
                  {searchQuery ? '未找到匹配的试卷' : '暂无试卷数据'}
                </td>
              </tr>
            ) : (
              filteredPapers.map(paper => (
                <tr key={paper.id}>
                  <td>
                    <span className="paper-id">{paper.id}</span>
                  </td>
                  <td>
                    <div className="paper-name">{paper.name}</div>
                    {paper.linkedCourses > 0 && (
                      <div style={{ fontSize: '12px', color: 'var(--ink-light)', marginTop: '4px' }}>
                        🔗 已关联 {paper.linkedCourses} 个课程
                      </div>
                    )}
                  </td>
                  <td>
                    <span className={`hsk-badge ${getHskBadgeClass(paper.hskLevel)}`}>
                      HSK {paper.hskLevel}
                    </span>
                  </td>
                  <td>
                    <div className="question-stats">
                      <div className="stat-item stat-listening">
                        <span>👂</span> {paper.listening}
                      </div>
                      <div className="stat-item stat-reading">
                        <span>📖</span> {paper.reading}
                      </div>
                      <div className="stat-item stat-writing">
                        <span>✍️</span> {paper.writing}
                      </div>
                    </div>
                  </td>
                  <td>
                    <div className="score-time">
                      {paper.totalScore}分 / {paper.duration}分钟
                    </div>
                  </td>
                  <td>
                    <label className="status-toggle">
                      <input 
                        type="checkbox" 
                        checked={paper.isPublished}
                        onChange={() => togglePublishStatus(paper.id)}
                      />
                      <span className="toggle-slider"></span>
                    </label>
                  </td>
                  <td>
                    <div className="actions">
                      <button 
                        type="button" 
                        className="action-btn edit"
                        onClick={() => showToast(`编辑 ${paper.name}`)}
                      >
                        ✏️ 编辑
                      </button>
                      <button 
                        type="button" 
                        className="action-btn data"
                        onClick={() => showToast(`查看 ${paper.name} 的数据统计`)}
                      >
                        📊 数据
                      </button>
                      <button 
                        type="button" 
                        className="action-btn delete"
                        onClick={() => {
                          if (confirm(`确认删除"${paper.name}"吗？`)) {
                            showToast(`已删除 ${paper.name}`);
                          }
                        }}
                      >
                        🗑️ 删除
                      </button>
                    </div>
                  </td>
                </tr>
              ))
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
