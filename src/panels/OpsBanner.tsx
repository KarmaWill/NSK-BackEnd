import { useEffect, useState } from 'react';
import {
  createCmsBanner,
  deleteCmsBanner,
  getActiveProduct,
  listCmsBanners,
  updateCmsBanner,
  type CmsBannerRow,
  type ProductCode,
} from '../lib/api';

const emptyForm: {
  title: string;
  subtitle: string;
  imageUrl: string;
  linkUrl: string;
  placement: string;
  status: 'DRAFT' | 'PUBLISHED';
} = {
  title: '',
  subtitle: '',
  imageUrl: '',
  linkUrl: '',
  placement: 'home_slogan',
  status: 'DRAFT',
};

export function OpsBanner() {
  const [productCode] = useState<ProductCode>(() => getActiveProduct());
  const [rows, setRows] = useState<CmsBannerRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      setRows(await listCmsBanners(productCode));
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
        await updateCmsBanner(editingId, form);
        setMessage('已更新 Banner');
      } else {
        await createCmsBanner(productCode, form);
        setMessage('已创建 Banner');
      }
      resetForm();
      await load();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : '保存失败');
    }
  };

  const handleEdit = (row: CmsBannerRow) => {
    setEditingId(row.id);
    setForm({
      title: row.title,
      subtitle: row.subtitle || '',
      imageUrl: row.imageUrl || '',
      linkUrl: row.linkUrl || '',
      placement: row.placement,
      status: row.status === 'PUBLISHED' ? 'PUBLISHED' : 'DRAFT',
    });
  };

  const togglePublish = async (row: CmsBannerRow) => {
    const next = row.status === 'PUBLISHED' ? 'DRAFT' : 'PUBLISHED';
    await updateCmsBanner(row.id, { status: next });
    await load();
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('确定删除这条 Banner？')) return;
    await deleteCmsBanner(id);
    await load();
  };

  return (
    <>
      <div className="page-header">
        <div>
          <div className="page-title">Banner 配置</div>
          <div className="page-subtitle">C-Lingo 官网 · home_slogan 位同步至首页品牌 Banner</div>
        </div>
      </div>

      <div className="grid-2">
        <div className="card">
          <div className="card-header">
            <div className="card-title">{editingId ? '编辑 Banner' : '新建 Banner'}</div>
          </div>
          <div className="card-body">
            <label className="form-label">主标题</label>
            <input
              className="form-input"
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            />
            <label className="form-label">副标题</label>
            <input
              className="form-input"
              value={form.subtitle}
              onChange={(e) => setForm((f) => ({ ...f, subtitle: e.target.value }))}
            />
            <label className="form-label">Logo/图片路径</label>
            <input
              className="form-input"
              value={form.imageUrl}
              onChange={(e) => setForm((f) => ({ ...f, imageUrl: e.target.value }))}
            />
            <label className="form-label">位置</label>
            <select
              className="form-input"
              value={form.placement}
              onChange={(e) => setForm((f) => ({ ...f, placement: e.target.value }))}
            >
              <option value="home_slogan">首页品牌 Banner (home_slogan)</option>
              <option value="home_hero">首页 Hero (home_hero)</option>
            </select>
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
            <div className="card-title">Banner 列表</div>
          </div>
          <div className="card-body">
            {loading && <p className="text-muted">加载中…</p>}
            {error && <p style={{ color: 'crimson' }}>{error}</p>}
            {!loading && !rows.length && <p className="text-muted">暂无 Banner</p>}
            <table>
              <thead>
                <tr>
                  <th>标题</th>
                  <th>位置</th>
                  <th>状态</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id}>
                    <td>
                      <b>{row.title}</b>
                      {row.subtitle && (
                        <div className="text-muted" style={{ fontSize: 12 }}>
                          {row.subtitle}
                        </div>
                      )}
                    </td>
                    <td className="text-muted">{row.placement}</td>
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
