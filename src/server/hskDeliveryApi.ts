import fs from 'node:fs';
import path from 'node:path';
import type { IncomingMessage, ServerResponse } from 'node:http';
import type { ExamDeliveryPackage } from '../types/hskExams';

const DELIVERY_DIR = path.resolve(process.cwd(), 'public/data/hsk-deliveries');

function ensureDir() {
  if (!fs.existsSync(DELIVERY_DIR)) {
    fs.mkdirSync(DELIVERY_DIR, { recursive: true });
  }
}

function deliveryPath(examId: string) {
  return path.join(DELIVERY_DIR, `${examId}.json`);
}

export function readDeliveryFromDisk(examId: string): ExamDeliveryPackage | null {
  try {
    const file = deliveryPath(examId);
    if (!fs.existsSync(file)) return null;
    return JSON.parse(fs.readFileSync(file, 'utf-8')) as ExamDeliveryPackage;
  } catch {
    return null;
  }
}

export function writeDeliveryToDisk(examId: string, pkg: ExamDeliveryPackage) {
  ensureDir();
  fs.writeFileSync(deliveryPath(examId), JSON.stringify(pkg, null, 2), 'utf-8');
}

function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf-8')));
    req.on('error', reject);
  });
}

export async function handleHskDeliveryRequest(
  req: IncomingMessage,
  res: ServerResponse,
  examId: string,
): Promise<boolean> {
  if (req.method === 'GET') {
    const pkg = readDeliveryFromDisk(examId);
    if (!pkg) {
      res.statusCode = 404;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: 'Exam delivery not found' }));
      return true;
    }
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(pkg));
    return true;
  }

  if (req.method === 'PUT') {
    try {
      const body = await readBody(req);
      const pkg = JSON.parse(body) as ExamDeliveryPackage;
      writeDeliveryToDisk(examId, pkg);
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ ok: true, examId }));
    } catch {
      res.statusCode = 400;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: 'Invalid delivery payload' }));
    }
    return true;
  }

  res.statusCode = 405;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify({ error: 'Method not allowed' }));
  return true;
}

export function createHskDeliveryApiPlugin() {
  return {
    name: 'hsk-delivery-api',
    configureServer(server: { middlewares: { use: (fn: (req: IncomingMessage, res: ServerResponse, next: () => void) => void) => void } }) {
      server.middlewares.use((req, res, next) => {
        const url = req.url?.split('?')[0] ?? '';
        const match = url.match(/^\/api\/hsk\/exams\/([^/]+)\/delivery$/);
        if (!match) {
          next();
          return;
        }
        void handleHskDeliveryRequest(req, res, decodeURIComponent(match[1]));
      });
    },
    configurePreviewServer(server: { middlewares: { use: (fn: (req: IncomingMessage, res: ServerResponse, next: () => void) => void) => void } }) {
      server.middlewares.use((req, res, next) => {
        const url = req.url?.split('?')[0] ?? '';
        const match = url.match(/^\/api\/hsk\/exams\/([^/]+)\/delivery$/);
        if (!match) {
          next();
          return;
        }
        void handleHskDeliveryRequest(req, res, decodeURIComponent(match[1]));
      });
    },
  };
}
