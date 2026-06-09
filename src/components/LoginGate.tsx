import { useState } from 'react';
import { getApiBase, login, usesDevApiProxy, type AuthUser } from '../lib/api';

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
    <div className="login-gate">
      <div className="login-gate-bg" aria-hidden />
      <div className="login-gate-overlay" aria-hidden />

      <div className="login-gate-panel">
        <img
          src="/login-logo.png"
          alt="C-Lingo AIOS"
          className="login-gate-logo"
        />

        <form onSubmit={handleSubmit} className="login-gate-card card">
          <h1 className="login-gate-title">管理后台</h1>
          <p className="login-gate-subtitle">
            API：{getApiBase()}
            {usesDevApiProxy() ? ' · 开发代理 → localhost:3000' : ''}
          </p>
          {error && <div className="login-gate-error">{error}</div>}
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
          <button type="submit" className="btn btn-primary login-gate-submit" disabled={loading}>
            {loading ? '登录中…' : '登录'}
          </button>
        </form>
      </div>
    </div>
  );
}
