const vocabList = [
  { hanzi: '米饭', pinyin: 'mǐ fàn', en: 'Rice', type: '名词', unit: 'U1' },
  { hanzi: '饺子', pinyin: 'jiǎo zi', en: 'Dumplings', type: '名词', unit: 'U1' },
  { hanzi: '包子', pinyin: 'bāo zi', en: 'Steamed Bun', type: '名词', unit: 'U1' },
  { hanzi: '水', pinyin: 'shuǐ', en: 'Water', type: '名词', unit: 'U2' },
  { hanzi: '茶', pinyin: 'chá', en: 'Tea', type: '名词', unit: 'U2' },
  { hanzi: '吃', pinyin: 'chī', en: 'To eat', type: '动词', unit: 'U1' },
];

export function Vocab() {
  return (
    <div className="card">
      <div className="card-header">
        <div className="card-title">📝 词汇 / 语法库</div>
        <button type="button" className="btn btn-primary btn-sm">+ 添加词汇</button>
      </div>
      <div className="card-body">
        <div className="form-row" style={{ marginBottom: 16 }}>
          <input type="text" placeholder="搜索词汇、拼音或英文..." style={{ borderRadius: 8 }} />
          <select><option>全部单元</option><option>Unit 1</option><option>Unit 2</option><option>Unit 3</option></select>
        </div>
        <table>
          <thead>
            <tr><th>汉字</th><th>拼音</th><th>英文</th><th>类型</th><th>单元</th><th>操作</th></tr>
          </thead>
          <tbody>
            {vocabList.map((v) => (
              <tr key={v.hanzi}>
                <td style={{ fontSize: '1.25rem', fontWeight: 700 }}>{v.hanzi}</td>
                <td className="font-mono" style={{ color: 'var(--teal)' }}>{v.pinyin}</td>
                <td>{v.en}</td>
                <td><span className={`badge ${v.type === '动词' ? 'badge-green' : 'badge-indigo'}`}>{v.type}</span></td>
                <td>{v.unit}</td>
                <td><button type="button" className="btn btn-secondary btn-sm">编辑</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
