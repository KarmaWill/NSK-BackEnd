import { useState } from 'react';
import { login, type AuthUser } from '../lib/api';

type Props = {
  onSuccess: (user: AuthUser) => void;
};

export function LoginGate({ onSuccess }: Props) {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin123');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await login(username.trim(), password);
      if (user.role !== 'ADMIN') {
        throw new Error('需要管理员账号 (ADMIN) 才能进入后台');
      }
      onSuccess(user);
    } catch (err) {
      setError(err instanceof Error ? err.message : '登录失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--bg, #f4fff5)',
        padding: 24,
      }}
    >
      <form
        onSubmit={handleSubmit}
        className="card"
        style={{ width: '100%', maxWidth: 420, padding: 32 }}
      >
        <h1 style={{ margin: '0 0 8px', fontSize: '1.35rem' }}>C-Lingo 管理后台</h1>
        <p style={{ margin: '0 0 24px', color: 'var(--ink-light)' }}>
          连接 API 后端 · 本地默认 http://localhost:3000
        </p>
        {error && (
          <div
            style={{
              marginBottom: 16,
              padding: '10px 12px',
              borderRadius: 8,
              background: '#fef2f2',
              color: '#b91c1c',
              fontSize: 14,
            }}
          >
            {error}
          </div>
        )}
        <div className="form-group mb-16">
          <label>用户名</label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="username"
          />
        </div>
        <div className="form-group mb-16">
          <label>密码</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
          />
        </div>
        <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
          {loading ? '登录中…' : '登录'}
        </button>
      </form>
    </div>
  );
}
