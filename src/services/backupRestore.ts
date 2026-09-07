/**
 * PinPig 백업 복원 서비스
 *
 * 설정 > 데이터 내보내기 > "전체 백업"(exportAllDataToJSON)이 만든 JSON을
 * 그대로 되살린다. 타 가계부 앱 파일용 파서(excelImport)와 달리
 * 카테고리·결제수단·설정·반복거래를 id 그대로 복원한다.
 *
 * 주 용도: iOS에서 Safari 탭과 홈화면 PWA는 저장소가 분리되므로,
 * Safari에서 백업 → 홈화면 앱에서 복원으로 데이터를 옮긴다.
 */

import { db } from './database';
import type {
  Transaction,
  Category,
  PaymentMethod,
  IncomeSource,
  Settings,
  AnnualExpensePattern,
  RecurringTransaction,
} from '@/types';

// =========================================
// 백업 파일 구조
// =========================================

export interface PinPigBackupData {
  transactions: Transaction[];
  categories: Category[];
  paymentMethods: PaymentMethod[];
  settings: Settings[];
  recurringTransactions: RecurringTransaction[];
  // v1.1부터 포함 (v1.0 백업에는 없을 수 있음)
  incomeSources?: IncomeSource[];
  annualExpenses?: AnnualExpensePattern[];
}

export interface PinPigBackup {
  version: string;
  exportedAt: string;
  checksum?: string; // 1.2부터. 검증은 backupEngine.verifyChecksum
  data: PinPigBackupData;
}

export type RestoreMode = 'replace' | 'merge';

export interface RestoreSummary {
  version: string;
  exportedAt: Date | null;
  transactions: number;
  categories: number;
  paymentMethods: number;
  incomeSources: number;
  settings: number;
  recurringTransactions: number;
  annualExpenses: number;
  dateRange: { oldest: Date | null; newest: Date | null };
}

export interface RestoreResult {
  success: boolean;
  mode: RestoreMode;
  restored: {
    transactions: number;
    categories: number;
    paymentMethods: number;
    incomeSources: number;
    settings: number;
    recurringTransactions: number;
    annualExpenses: number;
  };
  skipped: number; // id가 없어 건너뛴 레코드 수
  error?: string;
}

export interface RestoreProgress {
  phase: 'preparing' | 'restoring' | 'complete';
  current: number;
  total: number;
  message: string;
}

export type RestoreProgressCallback = (progress: RestoreProgress) => void;

// =========================================
// 판별 · 파싱
// =========================================

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * 파싱된 JSON 값이 PinPig 전체 백업 구조인지 판별
 * 조건: version 문자열 + data 객체 + data.transactions 배열
 */
export function isPinPigBackup(value: unknown): value is PinPigBackup {
  if (!isRecord(value)) return false;
  if (typeof value.version !== 'string') return false;
  if (!isRecord(value.data)) return false;
  return Array.isArray(value.data.transactions);
}

/**
 * JSON 문자열 → PinPigBackup. 백업 구조가 아니면 null.
 * (타 앱 JSON은 null을 돌려주므로 호출부가 excelImport.parseJSON으로 넘긴다)
 */
export function parsePinPigBackup(jsonContent: string): PinPigBackup | null {
  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonContent);
  } catch {
    return null;
  }
  if (!isPinPigBackup(parsed)) return null;

  const data = parsed.data as Partial<PinPigBackupData>;
  return {
    version: parsed.version,
    exportedAt: typeof parsed.exportedAt === 'string' ? parsed.exportedAt : '',
    checksum: typeof parsed.checksum === 'string' ? parsed.checksum : undefined,
    data: {
      transactions: asArray<Transaction>(data.transactions),
      categories: asArray<Category>(data.categories),
      paymentMethods: asArray<PaymentMethod>(data.paymentMethods),
      settings: asArray<Settings>(data.settings),
      recurringTransactions: asArray<RecurringTransaction>(data.recurringTransactions),
      incomeSources: data.incomeSources ? asArray<IncomeSource>(data.incomeSources) : undefined,
      annualExpenses: data.annualExpenses ? asArray<AnnualExpensePattern>(data.annualExpenses) : undefined,
    },
  };
}

function asArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

// =========================================
// 요약
// =========================================

export function getBackupSummary(backup: PinPigBackup): RestoreSummary {
  const { data } = backup;
  let oldest: Date | null = null;
  let newest: Date | null = null;

  for (const tx of data.transactions) {
    const d = toDate(tx.date);
    if (!d) continue;
    if (!oldest || d < oldest) oldest = d;
    if (!newest || d > newest) newest = d;
  }

  const exportedAt = toDate(backup.exportedAt);

  return {
    version: backup.version,
    exportedAt,
    transactions: data.transactions.length,
    categories: data.categories.length,
    paymentMethods: data.paymentMethods.length,
    incomeSources: data.incomeSources?.length ?? 0,
    settings: data.settings.length,
    recurringTransactions: data.recurringTransactions.length,
    annualExpenses: data.annualExpenses?.length ?? 0,
    dateRange: { oldest, newest },
  };
}

// =========================================
// 날짜 되살리기 (JSON 직렬화로 문자열이 된 Date 필드)
// =========================================

const DATE_FIELDS: Record<keyof PinPigBackupData, string[]> = {
  transactions: ['date', 'createdAt', 'updatedAt'],
  categories: ['createdAt', 'updatedAt'],
  paymentMethods: ['createdAt', 'updatedAt'],
  incomeSources: ['createdAt', 'updatedAt'],
  settings: ['updatedAt', 'lastBackupAt'],
  recurringTransactions: [
    'startDate',
    'endDate',
    'lastExecutedDate',
    'nextExecutionDate',
    'createdAt',
    'updatedAt',
  ],
  annualExpenses: ['createdAt', 'updatedAt'],
};

function toDate(value: unknown): Date | null {
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;
  if (typeof value === 'string' || typeof value === 'number') {
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  return null;
}

function reviveDates<T extends Record<string, unknown>>(row: T, fields: string[]): T {
  const out: Record<string, unknown> = { ...row };
  for (const field of fields) {
    if (!(field in out)) continue;
    const raw = out[field];
    if (raw === undefined || raw === null) {
      delete out[field]; // 선택 필드는 키 자체를 지워 undefined 저장을 피한다
      continue;
    }
    const d = toDate(raw);
    if (d) out[field] = d;
    else delete out[field];
  }
  return out as T;
}

function hasId(row: unknown): row is { id: string } {
  return isRecord(row) && typeof row.id === 'string' && row.id.length > 0;
}

/**
 * 테이블 한 종류를 복원 가능한 형태로 정제. id 없는 행은 버린다.
 */
function prepareRows<T extends { id: string }>(
  rows: T[] | undefined,
  table: keyof PinPigBackupData
): { rows: T[]; skipped: number } {
  if (!rows) return { rows: [], skipped: 0 };
  const fields = DATE_FIELDS[table];
  const out: T[] = [];
  let skipped = 0;
  for (const row of rows) {
    if (!hasId(row)) {
      skipped += 1;
      continue;
    }
    out.push(reviveDates(row as unknown as Record<string, unknown>, fields) as unknown as T);
  }
  return { rows: out, skipped };
}

// =========================================
// 복원
// =========================================

const TABLE_ORDER: (keyof PinPigBackupData)[] = [
  'categories',
  'paymentMethods',
  'incomeSources',
  'settings',
  'recurringTransactions',
  'annualExpenses',
  'transactions',
];

/**
 * PinPig 백업을 DB에 복원
 *
 * - replace: 7개 테이블을 모두 비운 뒤 백업 내용으로 채운다.
 *   백업에 없는 테이블(v1.0의 incomeSources·annualExpenses)은 비우지 않고 그대로 둔다.
 * - merge: 같은 id는 백업 값으로 덮어쓰고, 나머지는 유지한다 (bulkPut).
 *
 * 전체를 단일 Dexie 트랜잭션으로 묶어 중간 실패 시 원상 복구된다.
 */
export async function restorePinPigBackup(
  backup: PinPigBackup,
  options: { mode: RestoreMode },
  onProgress?: RestoreProgressCallback
): Promise<RestoreResult> {
  const { mode } = options;
  const result: RestoreResult = {
    success: false,
    mode,
    restored: {
      transactions: 0,
      categories: 0,
      paymentMethods: 0,
      incomeSources: 0,
      settings: 0,
      recurringTransactions: 0,
      annualExpenses: 0,
    },
    skipped: 0,
  };

  onProgress?.({ phase: 'preparing', current: 0, total: 1, message: '백업 파일 확인 중...' });

  const prepared = {
    categories: prepareRows(backup.data.categories, 'categories'),
    paymentMethods: prepareRows(backup.data.paymentMethods, 'paymentMethods'),
    incomeSources: prepareRows(backup.data.incomeSources, 'incomeSources'),
    settings: prepareRows(backup.data.settings, 'settings'),
    recurringTransactions: prepareRows(backup.data.recurringTransactions, 'recurringTransactions'),
    annualExpenses: prepareRows(backup.data.annualExpenses, 'annualExpenses'),
    transactions: prepareRows(backup.data.transactions, 'transactions'),
  };

  const presentInBackup: Record<keyof PinPigBackupData, boolean> = {
    categories: true,
    paymentMethods: true,
    incomeSources: backup.data.incomeSources !== undefined,
    settings: true,
    recurringTransactions: true,
    annualExpenses: backup.data.annualExpenses !== undefined,
    transactions: true,
  };

  const total = TABLE_ORDER.reduce((sum, t) => sum + prepared[t].rows.length, 0);
  let current = 0;

  try {
    await db.transaction(
      'rw',
      [
        db.transactions,
        db.categories,
        db.paymentMethods,
        db.incomeSources,
        db.settings,
        db.recurringTransactions,
        db.annualExpenses,
      ],
      async () => {
        for (const tableName of TABLE_ORDER) {
          if (!presentInBackup[tableName]) continue;
          const table = db.table(tableName);
          const { rows } = prepared[tableName];

          if (mode === 'replace') {
            await table.clear();
          }

          onProgress?.({
            phase: 'restoring',
            current,
            total,
            message: `${TABLE_LABELS[tableName]} 복원 중...`,
          });

          if (rows.length > 0) {
            await table.bulkPut(rows);
          }
          current += rows.length;
          result.restored[tableName] = rows.length;
        }
      }
    );

    result.skipped = TABLE_ORDER.reduce((sum, t) => sum + prepared[t].skipped, 0);
    result.success = true;
    onProgress?.({ phase: 'complete', current: total, total, message: '복원 완료' });
  } catch (error) {
    result.error = (error as Error).message;
  }

  return result;
}

const TABLE_LABELS: Record<keyof PinPigBackupData, string> = {
  transactions: '거래',
  categories: '카테고리',
  paymentMethods: '결제수단',
  incomeSources: '수입수단',
  settings: '설정',
  recurringTransactions: '반복거래',
  annualExpenses: '연간지출',
};
