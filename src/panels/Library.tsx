import { useState } from 'react';

type Book = {
  id: string;
  title: string;
  titleEn?: string;
  publisher: string;
  isbn: string;
  authors: string[];
  level: string;
  features: string[];
  premium: boolean;
  coverUrl?: string;
  description: string;
  unitCount: number;
  lessonCount: number;
  vocabularyCount: number;
  characterCount: number;
  lastModified: string;
  isPublished: boolean;
};

const MOCK_BOOKS: Book[] = [
  { 
    id: 'book-001', 
    title: '快乐中文 第一册', 
    titleEn: 'Happy Chinese Book 1',
    publisher: '人民教育出版社', 
    isbn: '978-7-107-37765-5',
    authors: ['李晓琪', '刘晓雨', '王淑红'],
    level: 'HSK 1-2', 
    features: ['听力', '阅读', '词汇', '文化'],
    premium: false,
    description: '面向海外母语非汉语的中学生，对标《国际中文教育中文水平等级标准》',
    unitCount: 8,
    lessonCount: 24,
    vocabularyCount: 340,
    characterCount: 120,
    lastModified: '2024-03-15',
    isPublished: true
  },
  { 
    id: 'book-002', 
    title: 'HSK 1 Standard Course', 
    titleEn: 'HSK Standard Course 1',
    publisher: '北京语言大学出版社', 
    isbn: '978-7-5619-4019-6',
    authors: ['姜丽萍'],
    level: 'HSK 1', 
    features: ['听力', '阅读', '词汇'],
    premium: false,
    description: 'HSK官方标准教程，配套HSK 1级考试',
    unitCount: 15,
    lessonCount: 15,
    vocabularyCount: 150,
    characterCount: 100,
    lastModified: '2024-03-14',
    isPublished: true
  },
  { 
    id: 'book-003', 
    title: 'Business Chinese for Traders', 
    titleEn: 'Business Chinese for International Trade',
    publisher: '商务印书馆', 
    isbn: '978-7-100-18234-1',
    authors: ['张明', '李华'],
    level: 'HSK 4-5', 
    features: ['听力', '阅读', 'AI练习', '商务场景'],
    premium: true,
    description: '针对商务人士的实用中文教材',
    unitCount: 12,
    lessonCount: 36,
    vocabularyCount: 800,
    characterCount: 400,
    lastModified: '2024-03-10',
    isPublished: true
  },
  { 
    id: 'book-004', 
    title: 'Daily Life in Beijing', 
    titleEn: 'Experiencing Beijing Life',
    publisher: '外语教学与研究出版社', 
    isbn: '978-7-5600-9234-8',
    authors: ['王芳'],
    level: 'HSK 2-3', 
    features: ['阅读', '文化', '情景对话'],
    premium: false,
    description: '通过北京日常生活场景学习中文',
    unitCount: 10,
    lessonCount: 30,
    vocabularyCount: 500,
    characterCount: 250,
    lastModified: '2024-03-08',
    isPublished: true
  },
];

export function Library() {
  const [books, setBooks] = useState<Book[]>(MOCK_BOOKS);
  const [searchQuery, setSearchQuery] = useState('');
  const [toast, setToast] = useState<string | null>(null);
  const [editingBook, setEditingBook] = useState<Book | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2200);
  };

  const togglePublishStatus = (id: string) => {
    setBooks(books.map(b => 
      b.id === id ? { ...b, isPublished: !b.isPublished } : b
    ));
    const book = books.find(b => b.id === id);
    showToast(`已${book?.isPublished ? '下架' : '上架'} ${book?.title}`);
  };

  // 如果正在编辑书籍，显示编辑页面
  if (editingBook) {
    return (
      <BookEditor 
        book={editingBook} 
        onSave={(updated) => {
          setBooks(books.map(b => b.id === updated.id ? updated : b));
          setEditingBook(null);
          showToast(`已保存 ${updated.title}`);
        }}
        onCancel={() => setEditingBook(null)}
      />
    );
  }

  // 筛选逻辑
  const filteredBooks = books.filter(b => {
    if (searchQuery === '') return true;
    const query = searchQuery.toLowerCase();
    return b.title.toLowerCase().includes(query) ||
           b.titleEn?.toLowerCase().includes(query) ||
           b.publisher.toLowerCase().includes(query) ||
           b.authors.some(a => a.toLowerCase().includes(query)) ||
           b.isbn.includes(query);
  });

  return (
    <>
      <div className="page-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div className="page-title">书籍教材管理</div>
          <div className="page-subtitle">管理课程配套书籍与阅读材料</div>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button type="button" className="btn btn-secondary" onClick={() => showToast('批量导入功能开发中')}>
            📥 批量导入
          </button>
          <button type="button" className="btn btn-primary" onClick={() => showToast('新建书籍功能开发中')}>
            ➕ 上架书籍
          </button>
        </div>
      </div>

      {/* 搜索栏 */}
      <div className="paper-filter-bar">
        <div className="filter-group">
          <span className="filter-label">搜索:</span>
          <input 
            type="text" 
            className="search-input" 
            placeholder="搜索书名、出版社、ISBN、作者..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ minWidth: '400px' }}
          />
        </div>
        <div style={{ marginLeft: 'auto', fontSize: '13px', color: 'var(--ink-light)' }}>
          共 {filteredBooks.length} 本书籍
        </div>
      </div>

      {/* 书籍表格 */}
      <div className="paper-table-container">
        <table>
          <thead>
            <tr>
              <th style={{ width: '280px' }}>书籍信息</th>
              <th style={{ width: '140px' }}>出版社</th>
              <th style={{ width: '100px', whiteSpace: 'nowrap' }}>级别</th>
              <th style={{ width: '180px' }}>功能模块</th>
              <th style={{ width: '140px', whiteSpace: 'nowrap' }}>内容统计</th>
              <th style={{ width: '100px' }}>状态</th>
              <th style={{ width: '200px', whiteSpace: 'nowrap' }}>操作</th>
            </tr>
          </thead>
          <tbody>
            {filteredBooks.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '60px', color: 'var(--ink-light)' }}>
                  {searchQuery ? '未找到匹配的书籍' : '暂无书籍数据'}
                </td>
              </tr>
            ) : (
              filteredBooks.map(book => (
                <tr key={book.id}>
                  <td>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <div className="paper-name">{book.title}</div>
                      {book.titleEn && (
                        <div style={{ fontSize: '12px', color: 'var(--ink-light)' }}>
                          {book.titleEn}
                        </div>
                      )}
                      <div style={{ fontSize: '11px', color: 'var(--ink-lighter)', fontFamily: 'JetBrains Mono, monospace' }}>
                        ISBN: {book.isbn}
                      </div>
                      {book.premium && (
                        <span className="badge" style={{ background: 'var(--amber-l)', color: 'var(--amber)', width: 'fit-content', fontSize: '10px', padding: '2px 6px' }}>
                          Premium
                        </span>
                      )}
                    </div>
                  </td>
                  <td>
                    <div style={{ fontSize: '13px' }}>
                      {book.publisher}
                    </div>
                  </td>
                  <td>
                    <span className="hsk-badge" style={{ background: 'var(--primary-l)', color: 'var(--primary)' }}>
                      {book.level}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                      {book.features.map(f => (
                        <span key={f} className="feature-tag">
                          {f}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td>
                    <div style={{ fontSize: '12px', color: 'var(--ink-light)', lineHeight: '1.6' }}>
                      {book.unitCount} 单元 · {book.lessonCount} 课<br/>
                      {book.vocabularyCount} 词 · {book.characterCount} 字
                    </div>
                  </td>
                  <td>
                    <label className="status-toggle">
                      <input 
                        type="checkbox" 
                        checked={book.isPublished}
                        onChange={() => togglePublishStatus(book.id)}
                      />
                      <span className="toggle-slider"></span>
                    </label>
                  </td>
                  <td>
                    <div className="actions">
                      <button 
                        type="button" 
                        className="action-btn edit"
                        onClick={() => setEditingBook(book)}
                      >
                        ✏️ 编辑
                      </button>
                      <button 
                        type="button" 
                        className="action-btn data"
                        onClick={() => showToast(`查看 ${book.title} 的使用数据`)}
                      >
                        📊 数据
                      </button>
                      <button 
                        type="button" 
                        className="action-btn delete"
                        onClick={() => {
                          if (confirm(`确认删除"${book.title}"吗？`)) {
                            showToast(`已删除 ${book.title}`);
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

// 书籍编辑器组件
type BookEditorProps = {
  book: Book;
  onSave: (book: Book) => void;
  onCancel: () => void;
};

function BookEditor({ book, onSave, onCancel }: BookEditorProps) {
  const [editedBook, setEditedBook] = useState<Book>(book);
  const [activeTab, setActiveTab] = useState<'basic' | 'structure' | 'content'>('basic');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 56px)' }}>
      {/* 顶部操作栏 */}
      <div className="config-header">
        <div className="config-header-top">
          <h1>
            <button 
              type="button" 
              className="back-btn"
              onClick={onCancel}
            >
              ← 返回
            </button>
            <span>编辑书籍：{book.title}</span>
          </h1>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button 
              type="button" 
              className="btn btn-secondary btn-sm"
              onClick={onCancel}
            >
              取消
            </button>
            <button 
              type="button" 
              className="btn btn-primary btn-sm"
              onClick={() => onSave(editedBook)}
            >
              💾 保存
            </button>
          </div>
        </div>

        {/* 标签页 */}
        <div className="type-tabs">
          <button
            type="button"
            className={`type-tab ${activeTab === 'basic' ? 'active' : ''}`}
            onClick={() => setActiveTab('basic')}
          >
            📚 基本信息
          </button>
          <button
            type="button"
            className={`type-tab ${activeTab === 'structure' ? 'active' : ''}`}
            onClick={() => setActiveTab('structure')}
          >
            📑 结构配置
          </button>
          <button
            type="button"
            className={`type-tab ${activeTab === 'content' ? 'active' : ''}`}
            onClick={() => setActiveTab('content')}
          >
            📝 内容管理
          </button>
        </div>
      </div>

      {/* 内容区域 */}
      <div className="config-body" style={{ flex: 1, overflow: 'auto' }}>
        {activeTab === 'basic' && (
          <div>
            <div className="config-section">
              <div className="section-title">📖 书籍基本信息</div>
              
              <div className="form-row">
                <div className="form-group">
                  <label>中文书名<span className="required">*</span></label>
                  <input 
                    type="text" 
                    value={editedBook.title}
                    onChange={(e) => setEditedBook({...editedBook, title: e.target.value})}
                  />
                </div>
                <div className="form-group">
                  <label>英文书名<span className="optional">(可选)</span></label>
                  <input 
                    type="text" 
                    value={editedBook.titleEn || ''}
                    onChange={(e) => setEditedBook({...editedBook, titleEn: e.target.value})}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>出版社<span className="required">*</span></label>
                  <input 
                    type="text" 
                    value={editedBook.publisher}
                    onChange={(e) => setEditedBook({...editedBook, publisher: e.target.value})}
                  />
                </div>
                <div className="form-group">
                  <label>ISBN<span className="required">*</span></label>
                  <input 
                    type="text" 
                    value={editedBook.isbn}
                    onChange={(e) => setEditedBook({...editedBook, isbn: e.target.value})}
                  />
                </div>
                <div className="form-group">
                  <label>适用级别<span className="required">*</span></label>
                  <input 
                    type="text" 
                    value={editedBook.level}
                    onChange={(e) => setEditedBook({...editedBook, level: e.target.value})}
                    placeholder="如：HSK 1-2"
                  />
                </div>
              </div>

              <div className="form-group">
                <label>作者/主编<span className="required">*</span></label>
                <input 
                  type="text" 
                  value={editedBook.authors.join(', ')}
                  onChange={(e) => setEditedBook({...editedBook, authors: e.target.value.split(',').map(a => a.trim())})}
                  placeholder="多个作者用逗号分隔"
                />
              </div>

              <div className="form-group">
                <label>书籍描述</label>
                <textarea 
                  value={editedBook.description}
                  onChange={(e) => setEditedBook({...editedBook, description: e.target.value})}
                  rows={3}
                  placeholder="简要描述书籍特点、适用人群等..."
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>
                    <input 
                      type="checkbox" 
                      checked={editedBook.premium}
                      onChange={(e) => setEditedBook({...editedBook, premium: e.target.checked})}
                    />
                    {' '}Premium 专属书籍
                  </label>
                </div>
              </div>
            </div>

            <div className="config-section">
              <div className="section-title">📊 内容统计</div>
              <div className="form-row">
                <div className="form-group">
                  <label>单元数量</label>
                  <input 
                    type="number" 
                    value={editedBook.unitCount}
                    onChange={(e) => setEditedBook({...editedBook, unitCount: parseInt(e.target.value) || 0})}
                  />
                </div>
                <div className="form-group">
                  <label>课程数量</label>
                  <input 
                    type="number" 
                    value={editedBook.lessonCount}
                    onChange={(e) => setEditedBook({...editedBook, lessonCount: parseInt(e.target.value) || 0})}
                  />
                </div>
                <div className="form-group">
                  <label>词汇数量</label>
                  <input 
                    type="number" 
                    value={editedBook.vocabularyCount}
                    onChange={(e) => setEditedBook({...editedBook, vocabularyCount: parseInt(e.target.value) || 0})}
                  />
                </div>
                <div className="form-group">
                  <label>汉字数量</label>
                  <input 
                    type="number" 
                    value={editedBook.characterCount}
                    onChange={(e) => setEditedBook({...editedBook, characterCount: parseInt(e.target.value) || 0})}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'structure' && (
          <div className="config-section">
            <div className="section-title">📑 书籍结构配置</div>
            <div style={{ padding: '20px', background: 'var(--stone-lighter)', borderRadius: '8px', textAlign: 'center', color: 'var(--ink-light)' }}>
              <p>书籍结构编辑器</p>
              <p style={{ fontSize: '13px', marginTop: '8px' }}>单元 → 课程 → 词汇/句型/练习</p>
              <button type="button" className="btn btn-primary btn-sm" style={{ marginTop: '16px' }}>
                ➕ 添加单元
              </button>
            </div>
          </div>
        )}

        {activeTab === 'content' && (
          <div className="config-section">
            <div className="section-title">📝 内容管理</div>
            <div style={{ padding: '20px', background: 'var(--stone-lighter)', borderRadius: '8px', textAlign: 'center', color: 'var(--ink-light)' }}>
              <p>课程内容、练习题、音频、视频等资源管理</p>
              <p style={{ fontSize: '13px', marginTop: '8px' }}>功能开发中...</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
