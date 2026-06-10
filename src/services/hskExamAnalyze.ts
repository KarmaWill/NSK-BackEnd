import type { HskExamAnalyzeResult } from '../types/hskExams';

type AnalyzeOptions = {
  apiUrl?: string;
  apiKey?: string;
  model?: string;
  useMock?: boolean;
};

function mockAnalyzeExam(text: string): HskExamAnalyzeResult {
  const levelMatch = text.match(/HSK\s*([1-6])/i);
  const level = levelMatch ? `HSK${levelMatch[1]}` : 'HSK3';
  return {
    examMeta: {
      title: '导入试卷',
      level,
      totalScore: 100,
      duration: 90,
    },
    sections: [
      { questionType: 'L01', questionCount: 10, sectionName: '听力第一部分' },
      { questionType: 'R01', questionCount: 10, sectionName: '阅读第一部分' },
      { questionType: 'W02', questionCount: 5, sectionName: '书写第一部分' },
    ],
    questions: [],
  };
}

export async function analyzeExamPdfText(
  text: string,
  existingTypeCodes: string[] = [],
  options: AnalyzeOptions = {},
): Promise<HskExamAnalyzeResult> {
  const {
    apiUrl = '/api/analyze-exam',
    apiKey = '',
    model = 'gpt-4o',
    useMock = import.meta.env.DEV,
  } = options;

  if (useMock || (!apiKey && import.meta.env.DEV)) {
    return mockAnalyzeExam(text);
  }

  const systemPrompt = `你是 HSK 试卷结构分析专家。分析输入文本，识别目前已有的题型，输出 JSON：
{
  "examMeta": { "title": "试卷标题", "level": "HSK3", "totalScore": 100, "duration": 90 },
  "sections": [{ "questionType": "L01", "questionCount": 15, "sectionName": "第一部分" }],
  "questions": []
}`;

  const userContent = [
    '以下是 HSK 试卷的原始文本，请分析其结构：',
    '',
    `现有题型：${existingTypeCodes.join(', ') || '（无）'}`,
    '',
    '--- 试卷文本 ---',
    text.slice(0, 12000),
    '--- 结束 ---',
  ].join('\n');

  try {
    const res = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userContent },
        ],
        temperature: 0.1,
        response_format: { type: 'json_object' },
      }),
    });
    if (!res.ok) throw new Error(`AI 分析请求失败 (${res.status})`);
    const data = await res.json();
    const content = data?.choices?.[0]?.message?.content;
    if (!content) throw new Error('AI 返回内容为空');
    return JSON.parse(content) as HskExamAnalyzeResult;
  } catch (err) {
    console.error('AI 分析失败，回退到模拟分析:', err);
    return mockAnalyzeExam(text);
  }
}

export async function extractTextFromPdfFile(file: File): Promise<string> {
  const form = new FormData();
  form.append('file', file);
  try {
    const res = await fetch('/api/extract-pdf-text', { method: 'POST', body: form });
    if (res.ok) {
      const data = await res.json();
      if (typeof data.text === 'string') return data.text;
    }
  } catch {
    /* fallback below */
  }
  return `[本地预览] 已选择文件 ${file.name}，大小 ${(file.size / 1024).toFixed(1)} KB。后端 PDF 解析接口未就绪时将使用模拟分析。`;
}
