/**
 * 백업 엔진 (Phase 2 S2)
 *
 * 스냅샷 생성 → 무결성 검증 → 저장소 어댑터에 저장 → 마지막 백업 시각 기록.
 * 저장소는 어댑터로 분리한다.
 * - 웹(PWA): 파일 다운로드 (webDownloadStorage). 같은 origin 안에는 안전한 곳이 없다
 * - 네이티브(S3 이후): Capacitor Filesystem으로 앱 Documents에 저장 — 별도 어댑터로 추가
 *
 * 파일 구조의 정본은 여기(buildBackupPayload)이고, 복원은 services/backupRestore.ts.
 */

import { db } from './database';
import { parsePinPigBackup, type PinPigBackup, type PinPigBackupData } from './backupRestore';
import { track } from './telemetry';
import type { Settings } from '@/types';

export const BACKUP_FORMAT_VERSION = '1.2'; // 1.2: checksum 추가

export interface BackupPayload extends PinPigBackup {
  checksum: string; // data를 JSON 직렬화한 문자열의 FNV-1a 해시
}

export interface BackupSnapshot {
  payload: BackupPayload;
  json: string;
  filename: string;
  recordCount: number;   // 거래 수
  createdAt: Date;
}

export interface BackupVerification {
  ok: boolean;
  issues: string[];
}

export interface BackupStorage {
  name: string;
  save(snapshot: BackupSnapshot): Promise<{ location: string }>;
}

export interface BackupRunResult {
  success: boolean;
  storage: string;
  location?: string;
  filename: string;
  recordCount: number;
  verification: BackupVerification;
  error?: string;
}

// =========================================
// 체크섬 (FNV-1a 32bit — 의존성 없이 동기 계산)
// =========================================

export function checksumOf(text: string): string {
  let hash = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash.toString(16).padStart(8, '0');
}

/** data 부분만 직렬화한 문자열의 체크섬. 복원 쪽도 같은 규칙으로 검증한다 */
export function checksumOfData(data: PinPigBackupData): string {
  return checksumOf(JSON.stringify(data));
}

// =========================================
// 스냅샷
// =========================================

export async function buildBackupPayload(now = new Date()): Promise<BackupPayload> {
  const [transactions, categories, paymentMethods, settings, recurringTransactions, incomeSources, annualExpenses] =
    await Promise.all([
      db.transactions.toArray(),
      db.categories.toArray(),
      db.paymentMethods.toArray(),
      db.settings.toArray(),
      db.recurringTransactions.toArray(),
      db.incomeSources.toArray(),
      db.annualExpenses.toArray(),
    ]);

  const data: PinPigBackupData = {
    transactions,
    categories,
    paymentMethods,
    settings,
    recurringTransactions,
    incomeSources,
    annualExpenses,
  };

  return {
    version: BACKUP_FORMAT_VERSION,
    exportedAt: now.toISOString(),
    checksum: checksumOfData(JSON.parse(JSON.stringify(data))),
    data,
  };
}

export function backupFilename(now = new Date()): string {
  const d = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
  const t = `${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}`;
  return `pinpig_백업_${d}_${t}.json`;
}

export async function createSnapshot(now = new Date()): Promise<BackupSnapshot> {
  const payload = await buildBackupPayload(now);
  return {
    payload,
    json: JSON.stringify(payload, null, 2),
    filename: backupFilename(now),
    recordCount: payload.data.transactions.length,
    createdAt: now,
  };
}

// =========================================
// 검증 — 직렬화된 파일을 다시 읽어 복원 가능한지 확인
// =========================================

export function verifySnapshot(snapshot: BackupSnapshot): BackupVerification {
  const issues: string[] = [];
  const parsed = parsePinPigBackup(snapshot.json);
  if (!parsed) {
    return { ok: false, issues: ['백업 구조로 다시 읽을 수 없음'] };
  }
  const expected = snapshot.payload.data;
  const tables: (keyof PinPigBackupData)[] = [
    'transactions', 'categories', 'paymentMethods', 'settings', 'recurringTransactions', 'incomeSources', 'annualExpenses',
  ];
  for (const t of tables) {
    const a = expected[t]?.length ?? 0;
    const b = parsed.data[t]?.length ?? 0;
    if (a !== b) issues.push(`${t} 건수 불일치 (${a} → ${b})`);
  }
  const check = verifyChecksum(snapshot.json);
  if (check === 'mismatch') issues.push('체크섬 불일치');
  return { ok: issues.length === 0, issues };
}

/**
 * 파일 문자열의 체크섬 검증. checksum 필드가 없는 구버전(1.0·1.1)은 'absent'.
 */
export function verifyChecksum(json: string): 'ok' | 'mismatch' | 'absent' | 'invalid' {
  let parsed: unknown;
  try { parsed = JSON.parse(json); } catch { return 'invalid'; }
  if (typeof parsed !== 'object' || parsed === null) return 'invalid';
  const obj = parsed as { checksum?: unknown; data?: unknown };
  if (typeof obj.checksum !== 'string') return 'absent';
  if (typeof obj.data !== 'object' || obj.data === null) return 'invalid';
  return checksumOf(JSON.stringify(obj.data)) === obj.checksum ? 'ok' : 'mismatch';
}

// =========================================
// 저장소 어댑터
// =========================================

/** 웹(PWA): 브라우저 다운로드로 사용자의 파일 앱에 저장 */
export const webDownloadStorage: BackupStorage = {
  name: 'web-download',
  async save(snapshot) {
    const blob = new Blob([snapshot.json], { type: 'application/json;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = snapshot.filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    return { location: snapshot.filename };
  },
};

// =========================================
// 실행
// =========================================

/**
 * 백업 한 번 실행. 검증 실패면 저장하지 않는다.
 * 성공 시 settings.lastBackupAt을 갱신한다.
 */
export async function runBackup(storage: BackupStorage, now = new Date()): Promise<BackupRunResult> {
  const snapshot = await createSnapshot(now);
  const verification = verifySnapshot(snapshot);
  const base = {
    storage: storage.name,
    filename: snapshot.filename,
    recordCount: snapshot.recordCount,
    verification,
  };

  if (!verification.ok) {
    return { ...base, success: false, error: verification.issues.join(', ') };
  }

  try {
    const { location } = await storage.save(snapshot);
    await markBackupDone(now);
    track('backup_created', { count: snapshot.recordCount, source: storage.name });
    return { ...base, success: true, location };
  } catch (error) {
    return { ...base, success: false, error: (error as Error).message };
  }
}

export async function markBackupDone(now = new Date()): Promise<void> {
  const current = await db.settings.get('default');
  if (!current) return;
  await db.settings.put({ ...current, lastBackupAt: now, updatedAt: now });
}

// =========================================
// 상태 — 홈 카드·설정 문구가 쓰는 판정
// =========================================

export type BackupDueReason = 'disabled' | 'no-data' | 'never' | 'overdue' | 'ok';

export interface BackupStatus {
  lastBackupAt: Date | null;
  daysSince: number | null;
  reminderDays: number;
  isDue: boolean;
  reason: BackupDueReason;
}

/** 백업한 적 없을 때는 거래가 이만큼 쌓인 뒤부터 알린다 */
export const NEVER_BACKED_UP_MIN_TRANSACTIONS = 10;

export function getBackupStatus(
  settings: Pick<Settings, 'backupReminderDays' | 'lastBackupAt'> | null | undefined,
  transactionCount: number,
  now = new Date()
): BackupStatus {
  const reminderDays = settings?.backupReminderDays ?? 7;
  const last = settings?.lastBackupAt ? new Date(settings.lastBackupAt) : null;
  const validLast = last && !Number.isNaN(last.getTime()) ? last : null;
  const daysSince = validLast ? Math.floor((now.getTime() - validLast.getTime()) / 86400000) : null;

  const base = { lastBackupAt: validLast, daysSince, reminderDays };

  if (reminderDays <= 0) return { ...base, isDue: false, reason: 'disabled' };
  if (transactionCount === 0) return { ...base, isDue: false, reason: 'no-data' };
  if (!validLast) {
    const due = transactionCount >= NEVER_BACKED_UP_MIN_TRANSACTIONS;
    return { ...base, isDue: due, reason: due ? 'never' : 'ok' };
  }
  if (daysSince !== null && daysSince >= reminderDays) return { ...base, isDue: true, reason: 'overdue' };
  return { ...base, isDue: false, reason: 'ok' };
}
