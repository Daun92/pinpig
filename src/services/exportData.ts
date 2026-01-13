/**
 * 데이터 내보내기 서비스
 * CSV/Excel 형식으로 거래 데이터 내보내기
 */

import { db } from './database';
import type { Transaction, Category, PaymentMethod } from '@/types';

export interface ExportOptions {
  format: 'csv' | 'excel';
  dateRange?: {
    start: Date;
    end: Date;
  };
  includeCategories?: boolean;
  includePaymentMethods?: boolean;
}

export interface ExportResult {
  success: boolean;
  filename: string;
  recordCount: number;
  error?: string;
}

/**
 * 거래 데이터를 CSV로 내보내기
 */
export async function exportTransactionsToCSV(options: ExportOptions = { format: 'csv' }): Promise<ExportResult> {
  try {
    // 데이터 조회
    let transactions = await db.transactions.orderBy('date').toArray();
    const categories = await db.categories.toArray();
    const paymentMethods = await db.paymentMethods.toArray();

    // 날짜 범위 필터
    if (options.dateRange) {
      const { start, end } = options.dateRange;
      transactions = transactions.filter(t => {
        const date = new Date(t.date);
        return date >= start && date <= end;
      });
    }

    // 카테고리/결제수단 맵 생성
    const categoryMap = new Map<string, Category>();
    categories.forEach(c => categoryMap.set(c.id, c));

    const paymentMethodMap = new Map<string, PaymentMethod>();
    paymentMethods.forEach(p => paymentMethodMap.set(p.id, p));

    // CSV 헤더
    const headers = [
      '날짜',
      '시간',
      '유형',
      '카테고리',
      '결제수단',
      '금액',
      '메모',
    ];

    // CSV 행 생성
    const rows = transactions.map(t => {
      const category = categoryMap.get(t.categoryId);
      const paymentMethod = t.paymentMethodId ? paymentMethodMap.get(t.paymentMethodId) : null;

      const date = new Date(t.date);
      const dateStr = formatDate(date);
      const timeStr = t.time || '';
      const typeStr = t.type === 'income' ? '수입' : '지출';
      const categoryStr = category?.name || '';
      const paymentStr = paymentMethod?.name || '';
      const amount = t.amount;
      const memo = t.memo || '';

      return [
        dateStr,
        timeStr,
        typeStr,
        categoryStr,
        paymentStr,
        amount.toString(),
        escapeCSV(memo),
      ];
    });

    // CSV 문자열 생성
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    // BOM 추가 (Excel에서 한글 깨짐 방지)
    const BOM = '\uFEFF';
    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });

    // 파일명 생성
    const filename = generateFilename('pinpig_거래내역', 'csv');

    // 다운로드
    downloadBlob(blob, filename);

    return {
      success: true,
      filename,
      recordCount: transactions.length,
    };
  } catch (error) {
    console.error('Export failed:', error);
    return {
      success: false,
      filename: '',
      recordCount: 0,
      error: (error as Error).message,
    };
  }
}

/**
 * 카테고리 데이터를 CSV로 내보내기
 */
export async function exportCategoriesToCSV(): Promise<ExportResult> {
  try {
    const categories = await db.categories.orderBy('order').toArray();

    const headers = ['이름', '유형', '아이콘', '색상', '예산', '순서'];

    const rows = categories.map(c => [
      escapeCSV(c.name),
      c.type === 'income' ? '수입' : '지출',
      c.icon,
      c.color,
      (c.budget || 0).toString(),
      c.order.toString(),
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const BOM = '\uFEFF';
    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });

    const filename = generateFilename('pinpig_카테고리', 'csv');
    downloadBlob(blob, filename);

    return {
      success: true,
      filename,
      recordCount: categories.length,
    };
  } catch (error) {
    console.error('Export categories failed:', error);
    return {
      success: false,
      filename: '',
      recordCount: 0,
      error: (error as Error).message,
    };
  }
}

/**
 * 결제수단 데이터를 CSV로 내보내기
 */
export async function exportPaymentMethodsToCSV(): Promise<ExportResult> {
  try {
    const paymentMethods = await db.paymentMethods.orderBy('order').toArray();

    const headers = ['이름', '아이콘', '색상', '순서'];

    const rows = paymentMethods.map(p => [
      escapeCSV(p.name),
      p.icon,
      p.color,
      p.order.toString(),
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const BOM = '\uFEFF';
    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });

    const filename = generateFilename('pinpig_결제수단', 'csv');
    downloadBlob(blob, filename);

    return {
      success: true,
      filename,
      recordCount: paymentMethods.length,
    };
  } catch (error) {
    console.error('Export payment methods failed:', error);
    return {
      success: false,
      filename: '',
      recordCount: 0,
      error: (error as Error).message,
    };
  }
}

/**
 * 전체 데이터를 JSON으로 내보내기 (백업용)
 */
export async function exportAllDataToJSON(): Promise<ExportResult> {
  try {
    const transactions = await db.transactions.toArray();
    const categories = await db.categories.toArray();
    const paymentMethods = await db.paymentMethods.toArray();
    const settings = await db.settings.toArray();
    const recurringTransactions = await db.recurringTransactions.toArray();

    const exportData = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      data: {
        transactions,
        categories,
        paymentMethods,
        settings,
        recurringTransactions,
      },
    };

    const jsonContent = JSON.stringify(exportData, null, 2);
    const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });

    const filename = generateFilename('pinpig_백업', 'json');
    downloadBlob(blob, filename);

    return {
      success: true,
      filename,
      recordCount: transactions.length,
    };
  } catch (error) {
    console.error('Export all data failed:', error);
    return {
      success: false,
      filename: '',
      recordCount: 0,
      error: (error as Error).message,
    };
  }
}

/**
 * 내보내기 미리보기 (첫 10건)
 */
export async function getExportPreview(): Promise<{
  transactions: Transaction[];
  totalCount: number;
  dateRange: { oldest: Date | null; newest: Date | null };
}> {
  const transactions = await db.transactions.orderBy('date').reverse().limit(10).toArray();
  const totalCount = await db.transactions.count();

  let oldest: Date | null = null;
  let newest: Date | null = null;

  if (totalCount > 0) {
    const oldestTx = await db.transactions.orderBy('date').first();
    const newestTx = await db.transactions.orderBy('date').reverse().first();
    oldest = oldestTx?.date ? new Date(oldestTx.date) : null;
    newest = newestTx?.date ? new Date(newestTx.date) : null;
  }

  return {
    transactions,
    totalCount,
    dateRange: { oldest, newest },
  };
}

// =========================================
// Helper Functions
// =========================================

function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function escapeCSV(value: string): string {
  if (!value) return '';
  // 쉼표, 줄바꿈, 따옴표가 포함된 경우 따옴표로 감싸기
  if (value.includes(',') || value.includes('\n') || value.includes('"')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}


function generateFilename(prefix: string, extension: string): string {
  const now = new Date();
  const dateStr = formatDate(now);
  const timeStr = `${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}`;
  return `${prefix}_${dateStr}_${timeStr}.${extension}`;
}

function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
