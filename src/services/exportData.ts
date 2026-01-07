import { db } from '@/services/database';
import { format } from 'date-fns';
import type { TransactionExportRow } from '@/types';

/**
 * 모든 거래를 CSV 형식으로 내보내기
 */
export async function exportTransactionsToCSV(): Promise<void> {
  // 모든 거래 조회
  const transactions = await db.transactions.orderBy('date').reverse().toArray();

  if (transactions.length === 0) {
    throw new Error('내보낼 거래 내역이 없습니다.');
  }

  // 카테고리 맵 조회
  const categories = await db.categories.toArray();
  const categoryMap = new Map(categories.map((c) => [c.id, c.name]));

  // 거래 데이터를 Export 형식으로 변환
  const rows: TransactionExportRow[] = transactions.map((tx) => ({
    date: format(tx.date, 'yyyy-MM-dd'),
    time: tx.time,
    type: tx.type === 'income' ? '수입' : '지출',
    category: categoryMap.get(tx.categoryId) || '기타',
    description: tx.description || '',
    amount: tx.amount,
    memo: tx.memo || '',
  }));

  // CSV 생성
  const headers = ['날짜', '시간', '유형', '카테고리', '설명', '금액', '메모'];
  const csvContent = [
    headers.join(','),
    ...rows.map((row) =>
      [
        row.date,
        row.time,
        row.type,
        escapeCSV(row.category),
        escapeCSV(row.description),
        row.amount,
        escapeCSV(row.memo),
      ].join(',')
    ),
  ].join('\n');

  // BOM 추가 (Excel에서 한글 인식)
  const BOM = '\uFEFF';
  const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });

  // 파일 다운로드
  const fileName = `pinpig_${format(new Date(), 'yyyyMMdd_HHmmss')}.csv`;
  downloadBlob(blob, fileName);
}

/**
 * CSV 필드 이스케이프 (쉼표, 줄바꿈, 따옴표 처리)
 */
function escapeCSV(value: string): string {
  if (!value) return '';

  // 쉼표, 줄바꿈, 따옴표가 포함된 경우 따옴표로 감싸기
  if (value.includes(',') || value.includes('\n') || value.includes('"')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

/**
 * Blob을 파일로 다운로드
 */
function downloadBlob(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * 내보내기 가능한 거래 수 확인
 */
export async function getExportableCount(): Promise<number> {
  return db.transactions.count();
}
