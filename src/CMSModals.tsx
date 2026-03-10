import React, { useState } from 'react'

type ModalId = 'modal-add-node' | 'modal-add-resource' | 'modal-add-question' | 'modal-preview-q' | 'modal-add-lang' | null

export function Modals({
  modal,
  closeModal,
  showToast,
  openModal,
  selectedQType,
  setSelectedQType,
}: {
  modal: ModalId
  closeModal: () => void
  showToast: (msg: string, type?: 'success' | 'error' | 'info') => void
  openModal: (id: ModalId) => void
  selectedQType: string
  setSelectedQType: (s: string) => void
}) {
  const qTypes = [
    { code: 'T00', name: '听音选图', stars: '★' },
    { code: 'T01', name: '汉字填空', stars: '★' },
    { code: 'T02', name: '词意选择1', stars: '★★' },
    { code: 'T03', name: '听力选择', stars: '★★' },
    { code: 'T04', name: '词意选择2', stars: '★★' },
    { code: 'T05', name: '语义选择', stars: '★★' },
  ]
  const qtypeDescs: Record<string, string> = {
    T00: 'T00 · 听音选图 — 学生听音频，从4张图片中选出正确答案',
    T01: 'T01 · 汉字填空 — 看图片，从汉字选项中选出正确汉字',
    T02: 'T02 · 词意选择1 — 看汉字+图+音频，选出正确英文释义',
    T03: 'T03 · 听力选择 — 听音频，从中文句子中选出所听到的句子',
    T04: 'T04 · 词意选择2 — 看英文题干，从图/拼/字选项中选出正确答案',
    T05: 'T05 · 语义选择 — 看英文句子，选出正确中文翻译',
  }
  const [correctSlot, setCorrectSlot] = useState(0)

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) closeModal()
  }

  return (
    <>
      {/* Add Catalog Node */}
      <div className={`modal-overlay ${modal === 'modal-add-node' ? 'open' : ''}`} id="modal-add-node" onClick={handleOverlayClick}>
        <div className="modal" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <div className="modal-title">新增目录节点</div>
            <button className="modal-close" onClick={closeModal}>✕</button>
          </div>
          <div className="modal-body">
            <div className="form-row">
              <div className="form-group"><label className="form-label">NameId *</label><input className="form-input" placeholder="如 N10700" style={{ fontFamily: 'JetBrains Mono', fontSize: 12 }} /></div>
              <div className="form-group"><label className="form-label">ParentId *</label>
                <select className="form-input form-select">
                  <option>N10000 · Level 1</option>
                  <option>N10100 · Unit 1</option><option>N10200 · Unit 2</option>
                </select>
              </div>
            </div>
            <div className="form-row">
              <div className="form-group"><label className="form-label">NameCn *</label><input className="form-input" placeholder="如 第七单元" /></div>
              <div className="form-group"><label className="form-label">ChineseName *</label><input className="form-input" placeholder="如 问候语" style={{ fontFamily: 'Noto Serif SC' }} /></div>
            </div>
            <div className="form-row">
              <div className="form-group"><label className="form-label">EnglishName</label><input className="form-input" placeholder="Greetings" /></div>
              <div className="form-group"><label className="form-label">Leaf</label>
                <select className="form-input form-select"><option value="0">0 — 非叶节点</option><option value="1">1 — 叶节点（Lesson）</option></select>
              </div>
            </div>
            <div className="form-row">
              <div className="form-group"><label className="form-label">Cover 图片</label><input className="form-input" placeholder="FM-Unit7.png" style={{ fontFamily: 'JetBrains Mono', fontSize: 12 }} /></div>
              <div className="form-group"><label className="form-label">EnglishNameLanguageID</label><input className="form-input" placeholder="L000xxx" style={{ fontFamily: 'JetBrains Mono', fontSize: 12 }} /></div>
            </div>
            <div className="form-group"><label className="form-label">ChineseTarget</label><textarea className="form-input" placeholder="中文学习目标" /></div>
            <div className="form-group"><label className="form-label">EnglishTarget</label><textarea className="form-input" placeholder="English learning target" /></div>
          </div>
          <div className="modal-footer">
            <button className="btn btn-ghost" onClick={closeModal}>取消</button>
            <button className="btn btn-primary" onClick={() => { closeModal(); showToast('节点已保存为草稿', 'success'); }}>保存草稿</button>
          </div>
        </div>
      </div>

      {/* Add/Edit Resource */}
      <div className={`modal-overlay ${modal === 'modal-add-resource' ? 'open' : ''}`} id="modal-add-resource" onClick={handleOverlayClick}>
        <div className="modal" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <div className="modal-title">新增学习资源</div>
            <button className="modal-close" onClick={closeModal}>✕</button>
          </div>
          <div className="modal-body">
            <div className="form-row">
              <div className="form-group"><label className="form-label">资源ID</label><input className="form-input" defaultValue="M0200078" style={{ fontFamily: 'JetBrains Mono', fontSize: 12 }} /><div className="form-hint">自动生成，可修改</div></div>
              <div className="form-group"><label className="form-label">目录ID *</label>
                <select className="form-input form-select">
                  <option>N10101 · 米饭</option><option>N10102 · 饺子</option><option>N10201 · 水</option>
                </select>
              </div>
            </div>
            <div className="form-row">
              <div className="form-group"><label className="form-label">资源类别 *</label>
                <select className="form-input form-select"><option>学习卡片</option><option>有声阅读</option></select>
              </div>
              <div className="form-group"><label className="form-label">词条属性</label>
                <select className="form-input form-select"><option>—</option><option>字</option><option>词</option><option>句</option></select>
              </div>
            </div>
            <div className="form-row">
              <div className="form-group"><label className="form-label">原文 *</label><input className="form-input" placeholder="输入中文" style={{ fontFamily: 'Noto Serif SC' }} /></div>
              <div className="form-group"><label className="form-label">拼音</label><input className="form-input" placeholder="pīnyīn" /></div>
            </div>
            <div className="form-row">
              <div className="form-group"><label className="form-label">译文（英文）</label><input className="form-input" placeholder="English translation" /></div>
              <div className="form-group"><label className="form-label">词性</label>
                <select className="form-input form-select"><option>—</option><option>n.</option><option>v.</option></select>
              </div>
            </div>
            <div className="form-row">
              <div className="form-group"><label className="form-label">声音编号</label><input className="form-input" placeholder="Y100xxx.mp3" style={{ fontFamily: 'JetBrains Mono', fontSize: 12 }} /></div>
              <div className="form-group"><label className="form-label">HSK级别</label>
                <select className="form-input form-select"><option>— 不限</option><option>HSK 1</option><option>HSK 4</option></select>
              </div>
            </div>
            <div className="form-group"><label className="form-label">图片</label>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <div style={{ width: 64, height: 64, background: 'var(--stone)', borderRadius: 8, border: '1px dashed var(--stone-dark)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, cursor: 'pointer' }} onClick={() => showToast('图片选择器开发中', 'info')}>🖼</div>
                <div>
                  <button className="btn btn-secondary" style={{ fontSize: 11, marginBottom: 6, display: 'block', width: 120 }} onClick={() => showToast('图片上传中', 'info')}>上传新图片</button>
                  <button className="btn btn-ghost" style={{ fontSize: 11, display: 'block' }} onClick={() => showToast('图库选择器开发中', 'info')}>从图库选择</button>
                </div>
              </div>
            </div>
            <div className="form-group"><label className="form-label">译文多国语ID</label>
              <div style={{ display: 'flex', gap: 8 }}>
                <input className="form-input" placeholder="L000xxx" style={{ fontFamily: 'JetBrains Mono', fontSize: 12, flex: 1 }} />
                <button className="btn btn-secondary" style={{ whiteSpace: 'nowrap', fontSize: 11 }} onClick={() => { openModal('modal-add-lang'); closeModal(); }}>新建条目</button>
              </div>
            </div>
          </div>
          <div className="modal-footer">
            <button className="btn btn-ghost" onClick={closeModal}>取消</button>
            <button className="btn btn-primary" onClick={() => { closeModal(); showToast('资源已保存为草稿', 'success'); }}>保存草稿</button>
          </div>
        </div>
      </div>

      {/* Add Question */}
      <div className={`modal-overlay ${modal === 'modal-add-question' ? 'open' : ''}`} id="modal-add-question" onClick={handleOverlayClick}>
        <div className="modal modal-wide" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <div className="modal-title" id="q-modal-title">新增题目 · {selectedQType} {qTypes.find((t) => t.code === selectedQType)?.name || '听音选图'}</div>
            <button className="modal-close" onClick={closeModal}>✕</button>
          </div>
          <div className="modal-body">
            <div className="form-row" style={{ marginBottom: 4 }}>
              <div className="form-group"><label className="form-label">所属目录 *</label>
                <select className="form-input form-select">
                  <option>N10101 · 米饭</option><option>N10102 · 饺子</option><option>N10201 · 水</option>
                </select>
              </div>
              <div className="form-group"><label className="form-label">资源ID</label><input className="form-input" placeholder="M0300xxx" style={{ fontFamily: 'JetBrains Mono', fontSize: 12 }} /></div>
            </div>
            <div className="form-group">
              <label className="form-label">选择题型 *</label>
              <div className="q-type-grid">
                {qTypes.map((t) => (
                  <div key={t.code} className={`q-type-card ${selectedQType === t.code ? 'selected' : ''}`} onClick={() => setSelectedQType(t.code)}>
                    <div className="q-type-code">{t.code}</div>
                    <div className="q-type-name">{t.name}</div>
                    <div className="q-type-stars">{t.stars}</div>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ padding: '10px 14px', background: 'var(--stone)', borderRadius: 6, borderLeft: '3px solid #a1a1aa', marginBottom: 16, fontSize: 12, color: 'var(--ink-light)' }} id="qtype-desc">
              {qtypeDescs[selectedQType] || qtypeDescs.T00}
            </div>
            <div className="form-group">
              <label className="form-label">音频文件（题干）</label>
              <div style={{ display: 'flex', gap: 8 }}><input className="form-input" placeholder="T100001.mp3" style={{ fontFamily: 'JetBrains Mono', fontSize: 12, flex: 1 }} /><button className="btn btn-secondary" style={{ fontSize: 11 }} onClick={() => showToast('音频上传开发中', 'info')}>上传</button></div>
            </div>
            <div className="form-group">
              <label className="form-label">图片选项（点击绿框标记正确答案）</label>
              <div className="img-grid">
                {['🍚', '🥟', '🥐', '🍜'].map((emoji, i) => (
                  <div key={i} className={`img-slot ${correctSlot === i ? 'correct' : ''}`} onClick={() => setCorrectSlot(i)}>
                    <span style={{ fontSize: 30 }}>{emoji}</span>
                    <div className="img-slot-label">TI-10000{i + 1}</div>
                  </div>
                ))}
              </div>
              <div className="form-hint">绿色边框 = 正确答案，其余为干扰项</div>
            </div>
            <div className="form-row">
              <div className="form-group"><label className="form-label">难度</label><select className="form-input form-select"><option>★ 一星</option><option>★★ 二星</option></select></div>
              <div className="form-group"><label className="form-label">知识点</label><input className="form-input" defaultValue="米饭" /></div>
            </div>
            <div className="form-group"><label className="form-label">解析（选填）</label><textarea className="form-input" rows={3} defaultValue={'音频播放的是"米饭"(mǐfàn)，米饭是煮熟的大米。'} /></div>
            <div className="form-group"><label className="form-label">解析多语言ID</label><input className="form-input" defaultValue="L000103" style={{ fontFamily: 'JetBrains Mono', fontSize: 12 }} /></div>
          </div>
          <div className="modal-footer">
            <button className="btn btn-ghost" onClick={() => { openModal('modal-preview-q'); closeModal(); }}>平板预览</button>
            <button className="btn btn-ghost" onClick={closeModal}>取消</button>
            <button className="btn btn-primary" onClick={() => { closeModal(); showToast('题目已保存为草稿', 'success'); }}>保存草稿</button>
          </div>
        </div>
      </div>

      {/* Preview Q (config + tablet preview) */}
      <div className={`modal-overlay ${modal === 'modal-preview-q' ? 'open' : ''}`} id="modal-preview-q" onClick={handleOverlayClick}>
        <div className="modal" style={{ width: 960, maxWidth: '98vw' }} onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <div>
              <div className="modal-title">修改题库配置</div>
              <div style={{ fontSize: '11.5px', color: 'var(--ink-light)', marginTop: 2 }}>当前题型：T00 听音选图 · N10101 米饭</div>
            </div>
            <button className="modal-close" onClick={closeModal}>✕</button>
          </div>
          <div className="modal-body" style={{ padding: 0, display: 'flex', minHeight: 560 }}>
            <div style={{ flex: 1, padding: 24, overflowY: 'auto', borderRight: '1px solid var(--stone-dark)' }}>
              <div className="form-group" style={{ marginBottom: 16 }}>
                <label className="form-label">* 题目类型</label>
                <select className="form-input form-select">
                  <option value="T00">T00 听音选图</option>
                  <option value="T01">T01 汉字填空</option>
                  <option value="T02">T02 词意选择1</option>
                  <option value="T05">T05 语义选择</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">* 音频地址</label>
                <input className="form-input" defaultValue="Lv.1/U1/L1/1/0101010101/面条.mp3" style={{ fontFamily: 'JetBrains Mono', fontSize: '11.5px' }} />
              </div>
            </div>
            <div style={{ width: 320, flexShrink: 0, padding: 24, background: 'var(--mist)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '.5px', textTransform: 'uppercase', color: 'var(--ink-light)', marginBottom: 16, alignSelf: 'flex-start' }}>实时预览</div>
              <div style={{ width: 240, background: '#1a1a1a', borderRadius: 36, padding: 10, boxShadow: '0 12px 32px rgba(0,0,0,0.12)' }}>
                <div style={{ background: '#fff', borderRadius: 26, overflow: 'hidden', minHeight: 360 }}>
                  <div style={{ padding: '14px', textAlign: 'center' }}>
                    <div style={{ fontSize: 11, color: 'var(--ink-light)', marginBottom: 10 }}>Choose the correct picture</div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                      <div style={{ aspectRatio: 1, borderRadius: 10, border: '2px solid #5c7a68', background: '#f0f4f2', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontSize: 30, cursor: 'pointer' }} onClick={() => showToast('✓ 答对了！', 'success')}>🍜<div style={{ fontSize: 9, color: 'var(--ink-light)', fontFamily: 'Noto Serif SC' }}>面条</div></div>
                      <div style={{ aspectRatio: 1, borderRadius: 10, border: '1px solid var(--stone-dark)', background: 'var(--stone)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontSize: 30 }}>🥟<div style={{ fontSize: 9, color: 'var(--ink-light)', fontFamily: 'Noto Serif SC' }}>饺子</div></div>
                      <div style={{ aspectRatio: 1, borderRadius: 10, border: '1px solid var(--stone-dark)', background: 'var(--stone)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontSize: 30 }}>🍚<div style={{ fontSize: 9, color: 'var(--ink-light)', fontFamily: 'Noto Serif SC' }}>米饭</div></div>
                      <div style={{ aspectRatio: 1, borderRadius: 10, border: '1px solid var(--stone-dark)', background: 'var(--stone)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontSize: 30 }}>🍲<div style={{ fontSize: 9, color: 'var(--ink-light)', fontFamily: 'Noto Serif SC' }}>汤</div></div>
                    </div>
                  </div>
                </div>
              </div>
              <div style={{ marginTop: 16, width: '100%' }}>
                <div style={{ fontSize: 11, color: 'var(--ink-light)', marginBottom: 8, fontWeight: 500 }}>切换预览题型</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                  <button className="btn btn-secondary" style={{ fontSize: 11, justifyContent: 'flex-start' }}>T00 听音选图</button>
                  <button className="btn btn-secondary" style={{ fontSize: 11, justifyContent: 'flex-start' }}>T01 汉字填空</button>
                  <button className="btn btn-secondary" style={{ fontSize: 11, justifyContent: 'flex-start' }}>T02 词意选择1</button>
                  <button className="btn btn-secondary" style={{ fontSize: 11, justifyContent: 'flex-start' }}>T05 语义选择</button>
                </div>
              </div>
            </div>
          </div>
          <div className="modal-footer">
            <button className="btn btn-ghost" onClick={closeModal}>取消</button>
            <button className="btn btn-primary" onClick={() => { closeModal(); showToast('题目配置已保存', 'success'); }}>确定</button>
          </div>
        </div>
      </div>

      {/* Add/Edit Lang */}
      <div className={`modal-overlay ${modal === 'modal-add-lang' ? 'open' : ''}`} id="modal-add-lang" onClick={handleOverlayClick}>
        <div className="modal" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <div className="modal-title">新增 / 编辑多语言条目</div>
            <button className="modal-close" onClick={closeModal}>✕</button>
          </div>
          <div className="modal-body">
            <div className="form-row">
              <div className="form-group"><label className="form-label">ID *</label><input className="form-input" placeholder="L000xxx" style={{ fontFamily: 'JetBrains Mono' }} /><div className="form-hint">留空自动生成，规则 Lxxxxxx</div></div>
              <div className="form-group"><label className="form-label">中文原文 *</label><input className="form-input" placeholder="输入中文文本" style={{ fontFamily: 'Noto Serif SC' }} /></div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div className="form-group"><label className="form-label"><span className="lang-badge lang-th">TH</span>泰语</label><textarea className="form-input" rows={2} placeholder="ภาษาไทย" /></div>
              <div className="form-group"><label className="form-label"><span className="lang-badge lang-vi">VI</span>越南语</label><textarea className="form-input" rows={2} placeholder="Tiếng Việt" /></div>
              <div className="form-group"><label className="form-label"><span className="lang-badge lang-ko">KO</span>韩语</label><textarea className="form-input" rows={2} placeholder="한국어" /></div>
              <div className="form-group"><label className="form-label"><span className="lang-badge lang-ja">JA</span>日语</label><textarea className="form-input" rows={2} placeholder="日本語" /></div>
            </div>
          </div>
          <div className="modal-footer">
            <button className="btn btn-ghost" onClick={closeModal}>取消</button>
            <button className="btn btn-primary" onClick={() => { closeModal(); showToast('多语言条目已保存', 'success'); }}>保存</button>
          </div>
        </div>
      </div>
    </>
  )
}
