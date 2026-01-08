/**
 * Excel 데이터를 PinPig 앱으로 가져오는 스크립트
 *
 * 사용법: 브라우저 콘솔에서 실행하거나 개발 도구에서 import
 */

import * as XLSX from 'xlsx';

// 엑셀 카테고리 → PinPig 카테고리 매핑
const CATEGORY_MAP: Record<string, { name: string; type: 'income' | 'expense' }> = {
  // 지출 카테고리
  '식비': { name: '식비', type: 'expense' },
  '마트/편의점': { name: '식비', type: 'expense' },
  '교통/차량': { name: '교통', type: 'expense' },
  '문화생활': { name: '문화/여가', type: 'expense' },
  '패션/미용': { name: '쇼핑', type: 'expense' },
  '생활용품': { name: '쇼핑', type: 'expense' },
  '건강': { name: '의료/건강', type: 'expense' },
  '주거/통신': { name: '주거/통신', type: 'expense' },
  '금융': { name: '기타', type: 'expense' },
  '교육': { name: '기타', type: 'expense' },
  '경조사/회비': { name: '기타', type: 'expense' },
  '부모님': { name: '기타', type: 'expense' },
  '기타': { name: '기타', type: 'expense' },
  '잔액수정': { name: '기타', type: 'expense' },

  // 수입 카테고리
  '월급': { name: '급여', type: 'income' },
  '상여': { name: '급여', type: 'income' },
  '부수입': { name: '기타수입', type: 'income' },
  '용돈': { name: '용돈', type: 'income' },
};

export interface ExcelRow {
  date: number; // Excel 날짜 (1900-01-01부터의 일수)
  asset: string;
  category: string;
  subcategory: string | null;
  description: string;
  amount: number;
  type: '수입' | '지출' | '차액수입';
  memo: string | null;
}

export interface ParsedTransaction {
  date: Date;
  time: string;
  type: 'income' | 'expense';
  categoryName: string;
  description: string;
  amount: number;
  memo?: string;
}

function excelDateToJS(excelDate: number): Date {
  // Excel 날짜 → JavaScript Date
  // Excel 날짜는 1900-01-01 = 1, JavaScript는 1970-01-01 = 0
  return new Date((excelDate - 25569) * 86400000);
}

function excelTimeToString(excelDate: number): string {
  const date = excelDateToJS(excelDate);
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
}

export function parseExcelData(data: any[][]): ParsedTransaction[] {
  const transactions: ParsedTransaction[] = [];

  // 첫 번째 행은 헤더이므로 건너뜀
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (!row || !row[0]) continue;

    const excelDate = row[0] as number;
    const category = row[2] as string;
    const description = row[4] as string || '';
    const amount = row[5] as number || 0;
    const typeStr = row[6] as string;
    const memo = row[7] as string || undefined;

    // 타입 결정
    let type: 'income' | 'expense';
    if (typeStr === '수입' || typeStr === '차액수입') {
      type = 'income';
    } else {
      type = 'expense';
    }

    // 카테고리 매핑
    const mapped = CATEGORY_MAP[category];
    const categoryName = mapped?.name || '기타';

    // 수입인데 지출 카테고리로 매핑된 경우 수정
    if (type === 'income' && mapped?.type === 'expense') {
      // 수입 카테고리로 변경
    }

    transactions.push({
      date: excelDateToJS(excelDate),
      time: excelTimeToString(excelDate),
      type,
      categoryName,
      description,
      amount: Math.abs(amount),
      memo,
    });
  }

  return transactions;
}

// JSON으로 내보내기 (브라우저에서 사용할 수 있도록)
export function exportToJSON(filePath: string): string {
  const workbook = XLSX.readFile(filePath);
  const sheet = workbook.Sheets['Sheet1'];
  const data = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as any[][];

  const transactions = parseExcelData(data);
  return JSON.stringify(transactions, null, 2);
}
