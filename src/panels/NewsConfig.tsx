import { useEffect, useState } from 'react';
import {
  createCmsNews,
  deleteCmsNews,
  getActiveProduct,
  listCmsNews,
  updateCmsNews,
  type CmsNewsRow,
  type ProductCode,
} from '../lib/api';

const emptyForm = {
  title: '',
  summary: '',
  category: '',
  slug: '',
  imageUrl: '',
  status: 'DRAFT' as const,
};

export function NewsConfig() {
  const [productCode] = useState<ProductCode>(() => getActiveProduct());
  const [rows, setRows] = useState<CmsNewsRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      setRows(await listCmsNews(productCode));
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载失败');
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [productCode]);

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
  };

  const handleSubmit = async () => {
    if (!form.title.trim()) return;
    setMessage('');
    try {
      if (editingId) {
        await updateCmsNews(editingId, form);
        setMessage('已更新新闻');
      } else {
        await createCmsNews(productCode, form);
        setMessage('已创建新闻');
      }
      resetForm();
      await load();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : '保存失败');
    }
  };

  const handleEdit = (row: CmsNewsRow) => {
    setEditingId(row.id);
    setForm({
      title: row.title,
      summary: row.summary || '',
      category: row.category || '',
      slug: row.slug || '',
      imageUrl: row.imageUrl || '',
      status: row.status === 'PUBLISHED' ? 'PUBLISHED' : 'DRAFT',
    });
  };

  const togglePublish = async (row: CmsNewsRow) => {
    const next = row.status === 'PUBLISHED' ? 'DRAFT' : 'PUBLISHED';
    await updateCmsNews(row.id, { status: next });
    await load();
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('确定删除这条新闻？')) return;
    await deleteCmsNews(id);
    await load();
  };

  return (
    <>
      <div className="page-header">
        <div>
          <div className="page-title">新闻配置</div>
          <div className="page-subtitle">C-Lingo 官网 · 已发布内容会同步至官网首页 News 区块</div>
        </div>
      </div>

      <div className="grid-2">
        <div className="card">
          <div className="card-header">
            <div className="card-title">{editingId ? '编辑新闻' : '新建新闻'}</div>
          </div>
          <div className="card-body">
            <label className="form-label">标题</label>
            <input
              className="form-input"
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            />
            <label className="form-label">摘要</label>
            <textarea
              className="form-input"
              rows={3}
              value={form.summary}
              onChange={(e) => setForm((f) => ({ ...f, summary: e.target.value }))}
            />
            <label className="form-label">分类（如 Press Release）</label>
            <input
              className="form-input"
              value={form.category}
              onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
            />
            <label className="form-label">官网页面 slug（如 news-article）</label>
            <input
              className="form-input"
              value={form.slug}
              onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
            />
            <label className="form-label">封面图路径（如 assets/news-product-matrix.png）</label>
            <input
              className="form-input"
              value={form.imageUrl}
              onChange={(e) => setForm((f) => ({ ...f, imageUrl: e.target.value }))}
            />
            <label className="form-label">状态</label>
            <select
              className="form-input"
              value={form.status}
              onChange={(e) =>
                setForm((f) => ({ ...f, status: e.target.value as 'DRAFT' | 'PUBLISHED' }))
              }
            >
              <option value="DRAFT">草稿</option>
              <option value="PUBLISHED">已发布（官网可见）</option>
            </select>
            {message && <p style={{ color: 'var(--teal)', marginTop: 12 }}>{message}</p>}
            <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
              <button type="button" className="btn btn-primary" onClick={handleSubmit}>
                {editingId ? '保存修改' : '+ 创建'}
              </button>
              {editingId && (
                <button type="button" className="btn btn-outline" onClick={resetForm}>
                  取消
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <div className="card-title">新闻列表</div>
          </div>
          <div className="card-body">
            {loading && <p className="text-muted">加载中…</p>}
            {error && <p style={{ color: 'crimson' }}>{error}</p>}
            {!loading && !rows.length && <p className="text-muted">暂无新闻</p>}
            <table>
              <thead>
                <tr>
                  <th>标题</th>
                  <th>状态</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id}>
                    <td>
                      <b>{row.title}</b>
                      {row.category && (
                        <div className="text-muted" style={{ fontSize: 12 }}>
                          {row.category}
                        </div>
                      )}
                    </td>
                    <td>
                      <span
                        className={`badge ${row.status === 'PUBLISHED' ? 'badge-green' : 'badge-muted'}`}
                      >
                        {row.status === 'PUBLISHED' ? '已发布' : '草稿'}
                      </span>
                    </td>
                    <td style={{ whiteSpace: 'nowrap' }}>
                      <button type="button" className="btn btn-sm" onClick={() => handleEdit(row)}>
                        编辑
                      </button>{' '}
                      <button
                        type="button"
                        className="btn btn-sm"
                        onClick={() => togglePublish(row)}
                      >
                        {row.status === 'PUBLISHED' ? '下线' : '发布'}
                      </button>{' '}
                      <button
                        type="button"
                        className="btn btn-sm btn-danger"
                        onClick={() => handleDelete(row.id)}
                      >
                        删除
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}
