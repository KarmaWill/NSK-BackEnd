import type { ExamDeliveryPackage } from '../types/hskExams';
import { getExamDeliveryApi } from './assessmentExamBankApi';

export async function syncHskDeliveryToServer(examId: string, pkg: ExamDeliveryPackage): Promise<void> {
  void examId;
  void pkg;
  // 兼容旧调用点：stage 6 起 delivery 只能通过正式 publish API 生成，禁止再写旧 PUT 桩。
}

export async function fetchHskDelivery(examId: string): Promise<ExamDeliveryPackage | null> {
  try {
    return await getExamDeliveryApi(examId);
  } catch {
    return null;
  }
}
