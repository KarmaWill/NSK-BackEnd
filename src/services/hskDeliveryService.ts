import type { ExamDeliveryPackage } from '../types/hskExams';

export async function syncHskDeliveryToServer(examId: string, pkg: ExamDeliveryPackage): Promise<void> {
  try {
    await fetch(`/api/hsk/exams/${encodeURIComponent(examId)}/delivery`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(pkg),
    });
  } catch {
    // 开发环境无 API 时静默失败，delivery 仍保存在 localStorage
  }
}

export async function fetchHskDelivery(examId: string): Promise<ExamDeliveryPackage | null> {
  try {
    const res = await fetch(`/api/hsk/exams/${encodeURIComponent(examId)}/delivery`);
    if (!res.ok) return null;
    return (await res.json()) as ExamDeliveryPackage;
  } catch {
    return null;
  }
}
