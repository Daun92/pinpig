/**
 * 데이터 가져오기 서비스
 * Excel, CSV, JSON 형식 지원
 * 다른 가계부 앱에서 내보낸 데이터를 PinPig 형식으로 변환
 */

import { db, generateId } from './database';
import type { Transaction, Category, PaymentMethod, CreateCategoryInput, CreatePaymentMethodInput } from '@/types';

// =========================================
// 지원 파일 형식
// =========================================

export type SupportedFileType = 'xlsx' | 'xls' | 'csv' | 'json';

export const SUPPORTED_FILE_TYPES: Record<SupportedFileType, { extension: string; mimeType: string; label: string }> = {
  xlsx: { extension: '.xlsx', mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', label: 'Excel (xlsx)' },
  xls: { extension: '.xls', mimeType: 'application/vnd.ms-excel', label: 'Excel (xls)' },
  csv: { extension: '.csv', mimeType: 'text/csv', label: 'CSV' },
  json: { extension: '.json', mimeType: 'application/json', label: 'JSON' },
};

// =========================================
// 데이터 구조 인터페이스
// =========================================

export interface ExcelRow {
  // 머니매니저 형식
  기간?: number | string;        // Excel 시리얼 날짜 또는 문자열
  자산?: string;                 // 결제수단 (카드/은행)
  분류?: string;                 // 카테고리
  소분류?: string;               // 서브 카테고리 (미사용)
  내용?: string;                 // 거래 내용/가맹점
  KRW?: number;                  // 금액 (원화)
  '수입/지출'?: string;          // 타입
  추가입력?: string;             // 메모
  금액?: number;                 // 금액 (대체)
  화폐?: string;                 // 통화

  // CSV/JSON 범용 형식 (영문)
  date?: string;                 // 날짜 (YYYY-MM-DD 또는 MM/DD/YYYY)
  time?: string;                 // 시간 (HH:mm)
  type?: string;                 // 'income' | 'expense' | '수입' | '지출'
  category?: string;             // 카테고리명
  amount?: number;               // 금액
  description?: string;          // 설명/가맹점
  memo?: string;                 // 메모
  paymentMethod?: string;        // 결제수단
}

export interface ImportResult {
  success: boolean;
  totalRows: number;
  importedTransactions: number;
  newCategories: number;
  newPaymentMethods: number;
  skippedRows: number;
  duplicateRows: number;
  errors: string[];
  dateRange: {
    oldest: Date | null;
    newest: Date | null;
  };
}

export interface ImportProgress {
  phase: 'preparing' | 'checking_duplicates' | 'creating_categories' | 'importing' | 'complete';
  current: number;
  total: number;
  message: string;
}

export type ImportProgressCallback = (progress: ImportProgress) => void;

export interface DuplicateCheckResult {
  totalRows: number;
  duplicateCount: number;
  newCount: number;
  duplicates: Array<{
    date: string;
    description: string;
    amount: number;
    category: string;
  }>;
}

export interface ImportPreview {
  totalRows: number;
  categories: { name: string; type: 'income' | 'expense'; count: number }[];
  paymentMethods: { name: string; count: number }[];
  dateRange: { oldest: Date | null; newest: Date | null };
  sampleTransactions: Array<{
    date: string;
    type: string;
    category: string;
    description: string;
    amount: number;
    paymentMethod: string;
  }>;
}

// =========================================
// 카테고리 매핑 테이블
// =========================================

const CATEGORY_MAPPING: Record<string, { name: string; icon: string; color: string; type: 'income' | 'expense' }> = {
  // 지출 카테고리
  '식비': { name: '식비', icon: 'Utensils', color: '#FF6B6B', type: 'expense' },
  '마트/편의점': { name: '식비', icon: 'Utensils', color: '#FF6B6B', type: 'expense' },
  '교통/차량': { name: '교통', icon: 'Car', color: '#4ECDC4', type: 'expense' },
  '문화생활': { name: '문화/여가', icon: 'Film', color: '#96CEB4', type: 'expense' },
  '패션/미용': { name: '쇼핑', icon: 'ShoppingBag', color: '#45B7D1', type: 'expense' },
  '생활용품': { name: '쇼핑', icon: 'ShoppingBag', color: '#45B7D1', type: 'expense' },
  '건강': { name: '의료/건강', icon: 'Heart', color: '#FFEAA7', type: 'expense' },
  '주거/통신': { name: '주거/통신', icon: 'Home', color: '#DDA0DD', type: 'expense' },
  '금융': { name: '금융', icon: 'Landmark', color: '#74B9FF', type: 'expense' },
  '교육': { name: '교육', icon: 'GraduationCap', color: '#A29BFE', type: 'expense' },
  '경조사/회비': { name: '경조사', icon: 'Heart', color: '#FD79A8', type: 'expense' },
  '부모님': { name: '가족', icon: 'Users', color: '#FDCB6E', type: 'expense' },
  '기타': { name: '기타', icon: 'MoreHorizontal', color: '#B8B8B8', type: 'expense' },

  // 수입 카테고리
  '월급': { name: '급여', icon: 'Wallet', color: '#4A7C59', type: 'income' },
  '상여': { name: '급여', icon: 'Wallet', color: '#4A7C59', type: 'income' },
  '부수입': { name: '부수입', icon: 'TrendingUp', color: '#00B894', type: 'income' },
  '용돈': { name: '용돈', icon: 'Gift', color: '#FDA7DF', type: 'income' },
  '잔액수정': { name: '기타수입', icon: 'TrendingUp', color: '#74B9FF', type: 'income' },
};

// =========================================
// 결제수단 매핑 테이블
// =========================================

const PAYMENT_METHOD_MAPPING: Record<string, { icon: string; color: string }> = {
  // 카드
  '현대카드': { icon: 'CreditCard', color: '#000000' },
  '하나카드': { icon: 'CreditCard', color: '#009775' },
  '우리카드': { icon: 'CreditCard', color: '#0066B3' },
  'KB카드': { icon: 'CreditCard', color: '#FFBC00' },
  '삼성카드': { icon: 'CreditCard', color: '#0066FF' },
  '신한카드': { icon: 'CreditCard', color: '#0046FF' },
  '씨티카드': { icon: 'CreditCard', color: '#003B70' },
  '롯데카드': { icon: 'CreditCard', color: '#E60012' },
  '마패카드': { icon: 'CreditCard', color: '#6B7280' },

  // 은행
  '하나은행': { icon: 'Building', color: '#009775' },
  '신한은행': { icon: 'Building', color: '#0046FF' },
  '우리은행': { icon: 'Building', color: '#0066B3' },
  '국민은행': { icon: 'Building', color: '#FFBC00' },
  '카카오뱅크': { icon: 'Building', color: '#FEE500' },

  // 기타
  '현금': { icon: 'Banknote', color: '#4CAF50' },
  '공제': { icon: 'Receipt', color: '#9E9E9E' },
};

// =========================================
// 파일 파싱 함수
// =========================================

/**
 * 파일 확장자로 파일 타입 감지
 */
export function detectFileType(fileName: string): SupportedFileType | null {
  const ext = fileName.toLowerCase().split('.').pop();
  switch (ext) {
    case 'xlsx': return 'xlsx';
    case 'xls': return 'xls';
    case 'csv': return 'csv';
    case 'json': return 'json';
    default: return null;
  }
}

/**
 * CSV 문자열을 ExcelRow 배열로 파싱
 */
export function parseCSV(csvContent: string): ExcelRow[] {
  const lines = csvContent.trim().split(/\r?\n/);
  if (lines.length < 2) return [];

  // 헤더 파싱 (첫 번째 줄)
  const headers = parseCSVLine(lines[0]);
  const rows: ExcelRow[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    if (values.length === 0) continue;

    const row: Record<string, unknown> = {};
    headers.forEach((header, index) => {
      const value = values[index]?.trim() || '';
      const key = header.trim();

      // 숫자 필드 처리
      if (['금액', 'KRW', 'amount'].includes(key)) {
        row[key] = parseFloat(value.replace(/,/g, '')) || 0;
      } else {
        row[key] = value;
      }
    });

    rows.push(row as ExcelRow);
  }

  return rows;
}

/**
 * CSV 한 줄 파싱 (따옴표 처리)
 */
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        current += '"';
        i++; // 이스케이프된 따옴표
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current);

  return result;
}

/**
 * JSON 문자열을 ExcelRow 배열로 파싱
 */
export function parseJSON(jsonContent: string): ExcelRow[] {
  try {
    const data = JSON.parse(jsonContent);

    // 배열인 경우
    if (Array.isArray(data)) {
      return data.map(normalizeRow);
    }

    // { transactions: [...] } 형태인 경우
    if (data.transactions && Array.isArray(data.transactions)) {
      return data.transactions.map(normalizeRow);
    }

    // { data: [...] } 형태인 경우
    if (data.data && Array.isArray(data.data)) {
      return data.data.map(normalizeRow);
    }

    return [];
  } catch {
    return [];
  }
}

/**
 * 다양한 필드명을 ExcelRow 형식으로 정규화
 */
function normalizeRow(row: Record<string, unknown>): ExcelRow {
  return {
    // 날짜 필드 정규화
    기간: row['기간'] || row['date'] || row['날짜'] || row['Date'],
    // 결제수단 필드 정규화
    자산: (row['자산'] || row['paymentMethod'] || row['payment_method'] || row['결제수단'] || '') as string,
    // 카테고리 필드 정규화
    분류: (row['분류'] || row['category'] || row['카테고리'] || '') as string,
    // 내용 필드 정규화
    내용: (row['내용'] || row['description'] || row['설명'] || row['가맹점'] || '') as string,
    // 금액 필드 정규화
    금액: Number(row['금액'] || row['amount'] || row['KRW'] || 0),
    KRW: Number(row['KRW'] || row['금액'] || row['amount'] || 0),
    // 타입 필드 정규화
    '수입/지출': (row['수입/지출'] || row['type'] || row['타입'] || '') as string,
    // 메모 필드 정규화
    추가입력: (row['추가입력'] || row['memo'] || row['메모'] || row['note'] || '') as string,
  } as ExcelRow;
}

// =========================================
// 유틸리티 함수
// =========================================

/**
 * Excel 시리얼 날짜를 JavaScript Date로 변환
 * Excel epoch: 1899-12-30
 */
function excelDateToJS(excelDate: number): Date {
  // Excel은 1900-01-01을 1로 시작 (윤년 버그로 1899-12-30 기준)
  const excelEpoch = new Date(1899, 11, 30);
  const msPerDay = 24 * 60 * 60 * 1000;

  // 정수 부분: 날짜
  const days = Math.floor(excelDate);
  // 소수 부분: 시간
  const timeFraction = excelDate - days;

  const date = new Date(excelEpoch.getTime() + days * msPerDay);

  // 시간 추출
  const totalSeconds = Math.round(timeFraction * 24 * 60 * 60);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);

  date.setHours(hours, minutes, 0, 0);

  return date;
}

/**
 * 시간 문자열 포맷팅 (HH:mm)
 */
function formatTime(date: Date): string {
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

/**
 * 거래 타입 판단
 */
function determineTransactionType(typeStr: string | undefined): 'income' | 'expense' {
  if (!typeStr) return 'expense';
  const normalized = typeStr.trim().toLowerCase();
  return normalized.includes('수입') ? 'income' : 'expense';
}

// =========================================
// 메인 임포트 함수
// =========================================

/**
 * Excel 분석 결과 미리보기
 */
export async function previewExcelImport(jsonData: ExcelRow[]): Promise<ImportPreview> {
  const categoryCounts = new Map<string, { type: 'income' | 'expense'; count: number }>();
  const paymentMethodCounts = new Map<string, number>();

  let oldestDate: Date | null = null;
  let newestDate: Date | null = null;

  const sampleTransactions: ImportPreview['sampleTransactions'] = [];

  for (const row of jsonData) {
    // 카테고리 집계
    if (row['분류']) {
      const type = determineTransactionType(row['수입/지출']);
      const existing = categoryCounts.get(row['분류']);
      categoryCounts.set(row['분류'], {
        type,
        count: (existing?.count || 0) + 1,
      });
    }

    // 결제수단 집계
    if (row['자산']) {
      paymentMethodCounts.set(row['자산'], (paymentMethodCounts.get(row['자산']) || 0) + 1);
    }

    // 날짜 범위
    if (typeof row['기간'] === 'number') {
      const date = excelDateToJS(row['기간']);
      if (!oldestDate || date < oldestDate) oldestDate = date;
      if (!newestDate || date > newestDate) newestDate = date;
    }

    // 샘플 데이터 (처음 10개)
    if (sampleTransactions.length < 10 && row['기간']) {
      const date = typeof row['기간'] === 'number' ? excelDateToJS(row['기간']) : new Date();
      sampleTransactions.push({
        date: date.toLocaleDateString('ko-KR'),
        type: row['수입/지출'] || '지출',
        category: row['분류'] || '기타',
        description: row['내용'] || '',
        amount: row['금액'] || row['KRW'] || 0,
        paymentMethod: row['자산'] || '현금',
      });
    }
  }

  return {
    totalRows: jsonData.length,
    categories: Array.from(categoryCounts.entries()).map(([name, data]) => ({
      name,
      type: data.type,
      count: data.count,
    })).sort((a, b) => b.count - a.count),
    paymentMethods: Array.from(paymentMethodCounts.entries()).map(([name, count]) => ({
      name,
      count,
    })).sort((a, b) => b.count - a.count),
    dateRange: { oldest: oldestDate, newest: newestDate },
    sampleTransactions,
  };
}

/**
 * 중복 데이터 확인
 * 동일 날짜, 금액, 설명을 가진 거래가 있는지 체크
 */
export async function checkDuplicates(
  jsonData: ExcelRow[],
  onProgress?: ImportProgressCallback
): Promise<DuplicateCheckResult> {
  const result: DuplicateCheckResult = {
    totalRows: jsonData.length,
    duplicateCount: 0,
    newCount: 0,
    duplicates: [],
  };

  // 기존 거래 가져오기
  const existingTransactions = await db.transactions.toArray();

  // 중복 체크용 Set 생성 (날짜-금액-메모 조합)
  const existingKeys = new Set<string>();
  for (const tx of existingTransactions) {
    const dateStr = tx.date instanceof Date
      ? tx.date.toISOString().split('T')[0]
      : new Date(tx.date).toISOString().split('T')[0];
    const key = `${dateStr}-${tx.amount}-${tx.memo || ''}`;
    existingKeys.add(key);
  }

  // 각 행 체크
  for (let i = 0; i < jsonData.length; i++) {
    const row = jsonData[i];

    if (onProgress && i % 100 === 0) {
      onProgress({
        phase: 'checking_duplicates',
        current: i,
        total: jsonData.length,
        message: `중복 확인 중... ${i}/${jsonData.length}`,
      });
    }

    if (!row['기간']) continue;

    const date = typeof row['기간'] === 'number'
      ? excelDateToJS(row['기간'])
      : new Date(row['기간']);

    if (isNaN(date.getTime())) continue;

    const dateStr = date.toISOString().split('T')[0];
    const amount = Math.abs(row['금액'] || row['KRW'] || 0);
    const description = row['내용'] || '';
    const key = `${dateStr}-${amount}-${description}`;

    if (existingKeys.has(key)) {
      result.duplicateCount++;
      if (result.duplicates.length < 20) {
        result.duplicates.push({
          date: date.toLocaleDateString('ko-KR'),
          description,
          amount,
          category: row['분류'] || '기타',
        });
      }
    } else {
      result.newCount++;
    }
  }

  return result;
}

/**
 * Excel 데이터를 PinPig로 가져오기
 */
export async function importExcelData(
  jsonData: ExcelRow[],
  options: {
    clearExisting?: boolean;
    createMissingCategories?: boolean;
    createMissingPaymentMethods?: boolean;
    skipDuplicates?: boolean;
    abortSignal?: AbortSignal;
  } = {},
  onProgress?: ImportProgressCallback
): Promise<ImportResult> {
  const {
    clearExisting = false,
    createMissingCategories = true,
    createMissingPaymentMethods = true,
    skipDuplicates = true,
    abortSignal,
  } = options;

  const result: ImportResult = {
    success: false,
    totalRows: jsonData.length,
    importedTransactions: 0,
    newCategories: 0,
    newPaymentMethods: 0,
    skippedRows: 0,
    duplicateRows: 0,
    errors: [],
    dateRange: { oldest: null, newest: null },
  };

  // 중복 체크를 위한 Set 준비
  let existingKeys = new Set<string>();
  if (skipDuplicates && !clearExisting) {
    onProgress?.({
      phase: 'preparing',
      current: 0,
      total: 1,
      message: '기존 데이터 로딩 중...',
    });

    const existingTransactions = await db.transactions.toArray();
    for (const tx of existingTransactions) {
      const dateStr = tx.date instanceof Date
        ? tx.date.toISOString().split('T')[0]
        : new Date(tx.date).toISOString().split('T')[0];
      const key = `${dateStr}-${tx.amount}-${tx.memo || ''}`;
      existingKeys.add(key);
    }
  }

  try {
    // 취소 체크
    if (abortSignal?.aborted) {
      result.errors.push('가져오기가 취소되었습니다.');
      return result;
    }

    // 기존 데이터 삭제 (선택적)
    if (clearExisting) {
      await db.transactions.clear();
      existingKeys = new Set<string>();
    }

    // 현재 카테고리 및 결제수단 가져오기
    const existingCategories = await db.categories.toArray();
    const existingPaymentMethods = await db.paymentMethods.toArray();

    // 이름 기반 맵 생성
    const categoryMap = new Map<string, Category>();
    existingCategories.forEach(cat => {
      categoryMap.set(`${cat.type}-${cat.name}`, cat);
    });

    const paymentMethodMap = new Map<string, PaymentMethod>();
    existingPaymentMethods.forEach(pm => {
      paymentMethodMap.set(pm.name, pm);
    });

    // 새로 생성할 카테고리/결제수단 추적
    const newCategoriesToCreate = new Map<string, CreateCategoryInput>();
    const newPaymentMethodsToCreate = new Map<string, CreatePaymentMethodInput>();

    onProgress?.({
      phase: 'creating_categories',
      current: 0,
      total: jsonData.length,
      message: '카테고리 및 결제수단 분석 중...',
    });

    // 1차 패스: 필요한 카테고리/결제수단 확인
    for (const row of jsonData) {
      const originalCategory = row['분류'];
      const type = determineTransactionType(row['수입/지출']);

      if (originalCategory && createMissingCategories) {
        // 매핑 테이블에서 찾기
        const mapping = CATEGORY_MAPPING[originalCategory];
        const mappedName = mapping?.name || originalCategory;
        const key = `${type}-${mappedName}`;

        if (!categoryMap.has(key) && !newCategoriesToCreate.has(key)) {
          const maxOrder = Math.max(0, ...existingCategories.filter(c => c.type === type).map(c => c.order));
          newCategoriesToCreate.set(key, {
            name: mappedName,
            icon: mapping?.icon || 'MoreHorizontal',
            color: mapping?.color || '#B8B8B8',
            type,
            order: maxOrder + 1 + newCategoriesToCreate.size,
          });
        }
      }

      const paymentMethodName = row['자산'];
      if (paymentMethodName && createMissingPaymentMethods) {
        if (!paymentMethodMap.has(paymentMethodName) && !newPaymentMethodsToCreate.has(paymentMethodName)) {
          const mapping = PAYMENT_METHOD_MAPPING[paymentMethodName];
          const maxOrder = Math.max(0, ...existingPaymentMethods.map(pm => pm.order));
          newPaymentMethodsToCreate.set(paymentMethodName, {
            name: paymentMethodName,
            icon: mapping?.icon || 'CreditCard',
            color: mapping?.color || '#6B7280',
            order: maxOrder + 1 + newPaymentMethodsToCreate.size,
          });
        }
      }
    }

    // 새 카테고리 생성
    for (const [key, input] of newCategoriesToCreate) {
      const now = new Date();
      const newCategory: Category = {
        id: generateId(),
        ...input,
        createdAt: now,
        updatedAt: now,
      };
      await db.categories.add(newCategory);
      categoryMap.set(key, newCategory);
      result.newCategories++;
    }

    // 새 결제수단 생성
    for (const [name, input] of newPaymentMethodsToCreate) {
      const now = new Date();
      const newPaymentMethod: PaymentMethod = {
        id: generateId(),
        ...input,
        createdAt: now,
        updatedAt: now,
      };
      await db.paymentMethods.add(newPaymentMethod);
      paymentMethodMap.set(name, newPaymentMethod);
      result.newPaymentMethods++;
    }

    // 취소 체크
    if (abortSignal?.aborted) {
      result.errors.push('가져오기가 취소되었습니다.');
      return result;
    }

    // 2차 패스: 거래 데이터 가져오기
    const batchSize = 500;
    const transactions: Transaction[] = [];

    for (let i = 0; i < jsonData.length; i++) {
      const row = jsonData[i];

      // 취소 체크 (100건마다)
      if (i % 100 === 0) {
        if (abortSignal?.aborted) {
          // 현재까지 처리된 데이터 저장
          if (transactions.length > 0) {
            await db.transactions.bulkAdd(transactions);
            result.importedTransactions += transactions.length;
          }
          result.errors.push('가져오기가 취소되었습니다.');
          return result;
        }

        onProgress?.({
          phase: 'importing',
          current: i,
          total: jsonData.length,
          message: `거래 데이터 가져오는 중... ${i.toLocaleString()}/${jsonData.length.toLocaleString()}`,
        });
      }

      try {
        // 날짜 파싱
        if (!row['기간']) {
          result.skippedRows++;
          continue;
        }

        const date = typeof row['기간'] === 'number'
          ? excelDateToJS(row['기간'])
          : new Date(row['기간']);

        if (isNaN(date.getTime())) {
          result.skippedRows++;
          continue;
        }

        // 중복 체크
        if (skipDuplicates && !clearExisting) {
          const dateStr = date.toISOString().split('T')[0];
          const amount = Math.abs(row['금액'] || row['KRW'] || 0);
          const description = row['내용'] || '';
          const key = `${dateStr}-${amount}-${description}`;

          if (existingKeys.has(key)) {
            result.duplicateRows++;
            continue;
          }
          // 새로 추가되는 항목도 키에 추가 (동일 파일 내 중복 방지)
          existingKeys.add(key);
        }

        // 날짜 범위 업데이트
        if (!result.dateRange.oldest || date < result.dateRange.oldest) {
          result.dateRange.oldest = date;
        }
        if (!result.dateRange.newest || date > result.dateRange.newest) {
          result.dateRange.newest = date;
        }

        // 타입
        const type = determineTransactionType(row['수입/지출']);

        // 카테고리 찾기
        const originalCategory = row['분류'] || '기타';
        const mapping = CATEGORY_MAPPING[originalCategory];
        const mappedName = mapping?.name || originalCategory;
        const categoryKey = `${type}-${mappedName}`;

        let category = categoryMap.get(categoryKey);
        if (!category) {
          // 폴백: 기타 카테고리
          const fallbackKey = type === 'income' ? 'income-기타수입' : 'expense-기타';
          category = categoryMap.get(fallbackKey);
        }

        if (!category) {
          result.skippedRows++;
          result.errors.push(`카테고리를 찾을 수 없음: ${originalCategory}`);
          continue;
        }

        // 결제수단 찾기
        const paymentMethod = row['자산'] ? paymentMethodMap.get(row['자산']) : undefined;

        // 금액
        const amount = Math.abs(row['금액'] || row['KRW'] || 0);
        if (amount === 0) {
          result.skippedRows++;
          continue;
        }

        const now = new Date();
        // '내용'과 '추가입력'을 memo로 통합
        const contentMemo = row['내용'] || '';
        const additionalMemo = row['추가입력'] || '';
        const combinedMemo = [contentMemo, additionalMemo].filter(Boolean).join(' ').trim() || undefined;

        transactions.push({
          id: generateId(),
          type,
          amount,
          categoryId: category.id,
          paymentMethodId: paymentMethod?.id,
          memo: combinedMemo,
          date,
          time: formatTime(date),
          createdAt: now,
          updatedAt: now,
        });

        // 배치 저장
        if (transactions.length >= batchSize) {
          await db.transactions.bulkAdd(transactions);
          result.importedTransactions += transactions.length;
          transactions.length = 0;
        }
      } catch (error) {
        result.skippedRows++;
        result.errors.push(`행 처리 오류: ${error}`);
      }
    }

    // 남은 거래 저장
    if (transactions.length > 0) {
      await db.transactions.bulkAdd(transactions);
      result.importedTransactions += transactions.length;
    }

    onProgress?.({
      phase: 'complete',
      current: jsonData.length,
      total: jsonData.length,
      message: '가져오기 완료!',
    });

    result.success = true;
  } catch (error) {
    result.errors.push(`가져오기 실패: ${error}`);
  }

  return result;
}

/**
 * 임포트 상태 확인
 */
export async function getImportStatus(): Promise<{
  totalTransactions: number;
  totalCategories: number;
  totalPaymentMethods: number;
  oldestDate: Date | null;
  newestDate: Date | null;
}> {
  const [transactionCount, categories, paymentMethods] = await Promise.all([
    db.transactions.count(),
    db.categories.count(),
    db.paymentMethods.count(),
  ]);

  if (transactionCount === 0) {
    return {
      totalTransactions: 0,
      totalCategories: categories,
      totalPaymentMethods: paymentMethods,
      oldestDate: null,
      newestDate: null,
    };
  }

  const oldest = await db.transactions.orderBy('date').first();
  const newest = await db.transactions.orderBy('date').last();

  return {
    totalTransactions: transactionCount,
    totalCategories: categories,
    totalPaymentMethods: paymentMethods,
    oldestDate: oldest?.date || null,
    newestDate: newest?.date || null,
  };
}

/**
 * 모든 거래 삭제
 */
export async function clearAllTransactions(): Promise<void> {
  await db.transactions.clear();
}

/**
 * 모든 데이터 초기화 (카테고리/결제수단 포함)
 */
export async function resetAllData(): Promise<void> {
  await Promise.all([
    db.transactions.clear(),
    db.categories.clear(),
    db.paymentMethods.clear(),
  ]);
  // 데이터베이스 재초기화는 페이지 새로고침 시 자동으로 수행됨
}
