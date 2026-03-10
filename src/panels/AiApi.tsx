export function AiApi() {
  return (
    <>
      <div className="page-header">
        <div>
          <div className="page-title">API 集成配置</div>
          <div className="page-subtitle">配置主 AI 服务商、模型与语音服务</div>
        </div>
      </div>
      <div className="card">
      <div className="card-header">
        <div className="card-title">AI API 配置</div>
        <span className="badge badge-rejected">待配置</span>
      </div>
      <div className="card-body">
        <div style={{
          background: 'var(--amber-l)',
          border: '1px solid rgba(245,158,11,0.3)',
          borderRadius: 8,
          padding: '12px 16px',
          marginBottom: 20,
          fontSize: '0.95rem',
          color: '#92400E',
        }}>
          ⚠️ 请妥善保管 API Key，不要在客户端代码中明文暴露。建议通过后端代理转发 AI 请求。
        </div>
        <div className="form-row">
          <div className="form-group">
            <label>主 AI 服务商</label>
            <select defaultValue="openai">
              <option value="openai">OpenAI</option>
              <option value="anthropic">Anthropic Claude</option>
              <option value="google">Google Gemini</option>
              <option value="azure">Azure OpenAI</option>
            </select>
          </div>
          <div className="form-group">
            <label>使用模型</label>
            <select defaultValue="gpt-4o">
              <option value="gpt-4o">gpt-4o</option>
              <option value="gpt-4o-mini">gpt-4o-mini</option>
              <option value="gpt-3.5-turbo">gpt-3.5-turbo</option>
            </select>
          </div>
        </div>
        <div className="form-group full mb-16">
          <label>API Key</label>
          <input type="text" defaultValue="sk-••••••••••••••••••••••••••••••" style={{ fontFamily: "'JetBrains Mono', monospace", letterSpacing: '0.05em' }} />
        </div>
        <div className="form-row">
          <div className="form-group">
            <label>API Base URL（代理地址）</label>
            <input type="text" defaultValue="https://api.openai.com/v1" placeholder="留空使用官方地址" />
          </div>
          <div className="form-group">
            <label>请求超时 (秒)</label>
            <input type="number" defaultValue={30} />
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label>Max Tokens (每次对话)</label>
            <input type="number" defaultValue={1000} />
          </div>
          <div className="form-group">
            <label>Temperature</label>
            <input type="number" defaultValue={0.7} step={0.1} />
          </div>
        </div>

        <hr className="divider" />
        <div style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: 14 }}>语音服务配置</div>
        <div className="form-row">
          <div className="form-group">
            <label>语音识别 (STT)</label>
            <select defaultValue="web"><option value="web">Web Speech API (免费)</option><option value="azure">Azure Speech</option><option value="google">Google Cloud</option></select>
          </div>
          <div className="form-group">
            <label>文字转语音 (TTS)</label>
            <select defaultValue="web"><option value="web">Web Speech Synthesis (免费)</option><option value="azure">Azure TTS</option><option value="eleven">ElevenLabs</option></select>
          </div>
        </div>

        <hr className="divider" />
        <div className="btn-group">
          <button type="button" className="btn btn-primary">💾 保存 API 配置</button>
          <button type="button" className="btn btn-secondary">🔌 测试连接</button>
        </div>
      </div>
    </div>
    </>
  );
}
