import { useEffect, useState } from 'react';
import {
  getActiveProduct,
  listFeedback,
  patchFeedbackStatus,
  setActiveProduct,
  PRODUCT_OPTIONS,
  type FeedbackRow,
  type ProductCode,
} from '../lib/api';

const STATUS_OPTIONS = ['PENDING', 'RESOLVING', 'IGNORED'] as const;

export function Feedback() {
  const [productCode, setProductCode] = useState<ProductCode>(() => getActiveProduct());
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [rows, setRows] = useState<FeedbackRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await listFeedback({
        productCode,
        status: statusFilter || undefined,
      });
      setRows(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载失败');
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [productCode, statusFilter]);

  useEffect(() => {
    const onProduct = () => setProductCode(getActiveProduct());
    window.addEventListener('clingo-product-changed', onProduct);
    return () => window.removeEventListener('clingo-product-changed', onProduct);
  }, []);

  const handleStatus = async (id: string, status: string) => {
    try {
      await patchFeedbackStatus(id, status);
      await load();
    } catch (err) {
      alert(err instanceof Error ? err.message : '更新失败');
    }
  };

  return (
    <>
      <div className="page-header">
        <div>
          <div className="page-title">用户反馈池</div>
          <div className="page-subtitle">来自官网与平板 App 的用户反馈（API 实时同步）</div>
        </div>
        <button type="button" className="btn btn-secondary btn-sm" onClick={() => load()}>
          刷新
        </button>
      </div>

      <div className="card mb-16">
        <div className="card-body">
          <div className="form-row">
            <div className="form-group">
              <label>产品</label>
              <select
                value={productCode}
                onChange={(e) => {
                  const code = e.target.value as ProductCode;
                  setProductCode(code);
                  setActiveProduct(code);
                }}
              >
                {PRODUCT_OPTIONS.map((p) => (
                  <option key={p.code} value={p.code}>
                    {p.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>状态筛选</label>
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                <option value="">全部</option>
                {STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-body" style={{ padding: 0 }}>
          {loading && (
            <div style={{ padding: 40, textAlign: 'center', color: 'var(--ink-light)' }}>
              加载中…
            </div>
          )}
          {!loading && error && (
            <div style={{ padding: 40, textAlign: 'center', color: '#b91c1c' }}>{error}</div>
          )}
          {!loading && !error && rows.length === 0 && (
            <div style={{ padding: 40, textAlign: 'center', color: 'var(--ink-light)' }}>
              暂无反馈
            </div>
          )}
          {!loading && !error && rows.length > 0 && (
            <table>
              <thead>
                <tr>
                  <th>用户</th>
                  <th>产品</th>
                  <th>内容</th>
                  <th>状态</th>
                  <th>时间</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id}>
                    <td>{row.user.username}</td>
                    <td>
                      <span className="badge badge-indigo">{row.product.code}</span>
                    </td>
                    <td style={{ maxWidth: 360, whiteSpace: 'pre-wrap' }}>{row.content}</td>
                    <td>
                      <span
                        className={`badge ${
                          row.status === 'PENDING'
                            ? 'badge-amber'
                            : row.status === 'RESOLVING'
                              ? 'badge-green'
                              : ''
                        }`}
                      >
                        {row.status}
                      </span>
                    </td>
                    <td className="text-muted font-mono" style={{ fontSize: 12 }}>
                      {new Date(row.createdAt).toLocaleString('zh-CN')}
                    </td>
                    <td>
                      <select
                        value={row.status}
                        onChange={(e) => handleStatus(row.id, e.target.value)}
                        style={{ fontSize: 13, borderRadius: 6, padding: '4px 8px' }}
                      >
                        {STATUS_OPTIONS.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </>
  );
}
