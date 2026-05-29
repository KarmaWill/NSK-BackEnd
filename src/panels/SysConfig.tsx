import { useEffect, useState } from 'react';
import { Toggle } from '../components/Toggle';
import {
  getActiveProduct,
  getProductConfig,
  upsertProductConfig,
  type ProductCode,
} from '../lib/api';

type FlagKey = 'maintenance_mode' | 'pinyin_switch' | 'multi_language_switch' | 'hsk_practice_enabled';

const FLAG_LABELS: Record<FlagKey, string> = {
  maintenance_mode: '维护模式',
  pinyin_switch: '拼音开关',
  multi_language_switch: '多语言开关',
  hsk_practice_enabled: 'HSK 练习入口',
};

export function SysConfig() {
  const [product, setProduct] = useState<ProductCode>(() => getActiveProduct());
  const [flags, setFlags] = useState<Record<FlagKey, boolean>>({
    maintenance_mode: false,
    pinyin_switch: true,
    multi_language_switch: true,
    hsk_practice_enabled: true,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const onProduct = () => setProduct(getActiveProduct());
    window.addEventListener('clingo-product-changed', onProduct);
    return () => window.removeEventListener('clingo-product-changed', onProduct);
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const cfg = await getProductConfig(product);
        if (cancelled) return;
        setFlags({
          maintenance_mode: cfg.maintenance_mode === 'true',
          pinyin_switch: cfg.pinyin_switch !== 'false',
          multi_language_switch: cfg.multi_language_switch !== 'false',
          hsk_practice_enabled: cfg.hsk_practice_enabled !== 'false',
        });
      } catch {
        if (!cancelled) setMessage('无法加载配置，请确认 API 已启动');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [product]);

  const handleSave = async () => {
    setSaving(true);
    setMessage('');
    try {
      for (const [key, on] of Object.entries(flags) as [FlagKey, boolean][]) {
        await upsertProductConfig(product, key, on ? 'true' : 'false');
      }
      setMessage('已保存到 API');
    } catch (err) {
      setMessage(err instanceof Error ? err.message : '保存失败');
    } finally {
      setSaving(false);
    }
  };

  const visibleFlags: FlagKey[] =
    product === 'tablet_app'
      ? ['maintenance_mode', 'pinyin_switch', 'multi_language_switch']
      : ['maintenance_mode', 'hsk_practice_enabled'];

  return (
    <>
      <div className="page-header">
        <div>
          <div className="page-title">系统设置</div>
          <div className="page-subtitle">
            产品功能开关（当前产品：{product}，与顶栏同步）
          </div>
        </div>
      </div>
      <div className="grid-2">
        <div className="card">
          <div className="card-header">
            <div className="card-title">API 功能开关</div>
          </div>
          <div className="card-body">
            {loading && <p className="text-muted">加载中…</p>}
            {!loading &&
              visibleFlags.map((key) => (
                <div className="toggle-row" key={key}>
                  <div>
                    <div className="toggle-label">{FLAG_LABELS[key]}</div>
                    {key === 'maintenance_mode' && (
                      <div className="toggle-desc">开启后客户端应显示维护页</div>
                    )}
                  </div>
                  <Toggle
                    defaultOn={flags[key]}
                    onChange={(on) => setFlags((prev) => ({ ...prev, [key]: on }))}
                  />
                </div>
              ))}
            <hr className="divider" />
            {message && (
              <p style={{ fontSize: 14, marginBottom: 12, color: 'var(--teal)' }}>{message}</p>
            )}
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleSave}
              disabled={loading || saving}
            >
              {saving ? '保存中…' : '💾 保存到 API'}
            </button>
          </div>
        </div>
        <div className="card">
          <div className="card-header">
            <div className="card-title">📦 版本信息</div>
          </div>
          <div className="card-body">
            <table>
              <tbody>
                <tr>
                  <td className="text-muted" style={{ width: 140 }}>
                    管理后台
                  </td>
                  <td className="font-mono font-bold">v1.0.0 + API</td>
                </tr>
                <tr>
                  <td className="text-muted">API 地址</td>
                  <td className="font-mono" style={{ fontSize: 12 }}>
                    {import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}
