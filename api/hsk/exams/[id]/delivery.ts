import fs from 'node:fs';
import path from 'node:path';

type ExamDeliveryPackage = Record<string, unknown>;

function deliveryPath(examId: string) {
  return path.join(process.cwd(), 'public/data/hsk-deliveries', `${examId}.json`);
}

export default async function handler(req: { method?: string; body?: unknown }, res: {
  status: (code: number) => { json: (body: unknown) => void; end: (body?: string) => void };
  setHeader: (key: string, value: string) => void;
}) {
  const examId = String((req as { query?: { id?: string } }).query?.id ?? '');
  if (!examId) {
    res.status(400).json({ error: 'Missing exam id' });
    return;
  }

  const file = deliveryPath(examId);

  if (req.method === 'GET') {
    if (!fs.existsSync(file)) {
      res.status(404).json({ error: 'Exam delivery not found' });
      return;
    }
    const pkg = JSON.parse(fs.readFileSync(file, 'utf-8')) as ExamDeliveryPackage;
    res.setHeader('Content-Type', 'application/json');
    res.status(200).json(pkg);
    return;
  }

  if (req.method === 'PUT') {
    try {
      const pkg = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      fs.mkdirSync(path.dirname(file), { recursive: true });
      fs.writeFileSync(file, JSON.stringify(pkg, null, 2), 'utf-8');
      res.status(200).json({ ok: true, examId });
    } catch {
      res.status(400).json({ error: 'Invalid delivery payload' });
    }
    return;
  }

  res.status(405).json({ error: 'Method not allowed' });
}
