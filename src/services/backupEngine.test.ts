/**
 * 백업 엔진 테스트 (Phase 2 S2)
 *
 * 핵심 시나리오: "기기 초기화" — 스냅샷을 만든 뒤 저장소를 통째로 지우고,
 * 그 파일만으로 복원했을 때 데이터가 그대로 돌아오는가.
 */

import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import { db } from '@/services/database';
import {
  createSnapshot,
  verifySnapshot,
  verifyChecksum,
  checksumOf,
  runBackup,
  getBackupStatus,
  backupFilename,
  BACKUP_FORMAT_VERSION,
  NEVER_BACKED_UP_MIN_TRANSACTIONS,
  type BackupStorage,
  type BackupSnapshot,
} from '@/services/backupEngine';
import { parsePinPigBackup, restorePinPigBackup } from '@/services/backupRestore';
import type { Transaction, Category, PaymentMethod, IncomeSource, Settings, RecurringTransaction } from '@/types';
import { DEFAULT_SETTINGS } from '@/types';

const NOW = new Date(2026, 8, 7, 10, 0, 0);

async function clearDb() {
  await Promise.all([
    db.transactions.clear(), db.categories.clear(), db.paymentMethods.clear(), db.incomeSources.clear(),
    db.settings.clear(), db.recurringTransactions.clear(), db.annualExpenses.clear(),
  ]);
}

async function seed(txCount = 3) {
  await db.categories.bulkAdd([
    { id: 'cat-food', name: '식비', icon: 'Utensils', color: '#F80', type: 'expense', order: 0, createdAt: NOW, updatedAt: NOW } as Category,
    { id: 'cat-salary', name: '급여', icon: 'Wallet', color: '#0F8', type: 'income', order: 0, createdAt: NOW, updatedAt: NOW } as Category,
  ]);
  await db.paymentMethods.add({ id: 'pm-card', name: '카드', icon: 'CreditCard', color: '#08F', order: 0, createdAt: NOW, updatedAt: NOW } as PaymentMethod);
  await db.incomeSources.add({ id: 'is-cash', name: '현금', icon: 'Banknote', color: '#4C5', order: 0, createdAt: NOW, updatedAt: NOW } as IncomeSource);
  await db.settings.add({ id: 'default', ...DEFAULT_SETTINGS, monthlyBudget: 1500000, isOnboardingComplete: true, updatedAt: NOW } as Settings);
  await db.recurringTransactions.add({
    id: 'rec-1', type: 'expense', amount: 9900, categoryId: 'cat-food', frequency: 'monthly', dayOfMonth: 15,
    startDate: new Date(2026, 0, 15), isActive: true, nextExecutionDate: new Date(2026, 8, 15), createdAt: NOW, updatedAt: NOW,
  } as RecurringTransaction);
  const txs: Transaction[] = [];
  for (let i = 0; i < txCount; i++) {
    txs.push({
      id: `tx-${i}`, type: i === 0 ? 'income' : 'expense', amount: 1000 * (i + 1),
      categoryId: i === 0 ? 'cat-salary' : 'cat-food', paymentMethodId: i === 0 ? undefined : 'pm-card',
      incomeSourceId: i === 0 ? 'is-cash' : undefined, memo: `m${i}`, date: new Date(2026, 8, 1 + i), time: '12:00',
      createdAt: NOW, updatedAt: NOW,
    } as Transaction);
  }
  await db.transactions.bulkAdd(txs);
}

class MemoryStorage implements BackupStorage {
  name = 'memory';
  saved: BackupSnapshot[] = [];
  failNext = false;
  async save(snapshot: BackupSnapshot) {
    if (this.failNext) { this.failNext = false; throw new Error('disk full'); }
    this.saved.push(snapshot);
    return { location: `memory://${snapshot.filename}` };
  }
}

beforeEach(async () => { await clearDb(); });
afterAll(async () => { await clearDb(); });

describe('스냅샷·검증', () => {
  it('스냅샷은 1.2 구조에 체크섬을 담고, 자체 검증을 통과한다', async () => {
    await seed();
    const snap = await createSnapshot(NOW);
    expect(snap.payload.version).toBe(BACKUP_FORMAT_VERSION);
    expect(snap.payload.checksum).toMatch(/^[0-9a-f]{8}$/);
    expect(snap.recordCount).toBe(3);
    expect(snap.filename).toBe(backupFilename(NOW));
    expect(verifySnapshot(snap)).toEqual({ ok: true, issues: [] });
    expect(verifyChecksum(snap.json)).toBe('ok');
  });

  it('파일 내용이 바뀌면 체크섬 불일치로 잡는다', async () => {
    await seed();
    const snap = await createSnapshot(NOW);
    const tampered = snap.json.replace('"amount": 2000', '"amount": 9999');
    expect(tampered).not.toBe(snap.json);
    expect(verifyChecksum(tampered)).toBe('mismatch');
    expect(verifySnapshot({ ...snap, json: tampered }).ok).toBe(false);
  });

  it('체크섬 없는 구버전 파일은 absent, 깨진 JSON은 invalid', () => {
    expect(verifyChecksum(JSON.stringify({ version: '1.1', data: { transactions: [] } }))).toBe('absent');
    expect(verifyChecksum('{not json')).toBe('invalid');
  });

  it('checksumOf는 결정적이고 입력에 민감하다', () => {
    expect(checksumOf('abc')).toBe(checksumOf('abc'));
    expect(checksumOf('abc')).not.toBe(checksumOf('abd'));
  });
});

describe('기기 초기화 시나리오', () => {
  it('스냅샷 → 전부 삭제 → 그 파일로 복원하면 데이터가 그대로 돌아온다', async () => {
    await seed(5);
    const before = {
      tx: await db.transactions.orderBy('id').toArray(),
      cats: await db.categories.count(),
      settings: await db.settings.get('default'),
    };

    const snap = await createSnapshot(NOW);
    const fileOnDisk = snap.json; // 사용자의 파일 앱에 남은 유일한 사본

    await clearDb(); // 기기 초기화 · iOS 저장소 삭제
    expect(await db.transactions.count()).toBe(0);
    expect(await db.settings.count()).toBe(0);

    const backup = parsePinPigBackup(fileOnDisk);
    expect(backup).not.toBeNull();
    expect(verifyChecksum(fileOnDisk)).toBe('ok');
    const result = await restorePinPigBackup(backup!, { mode: 'replace' });
    expect(result.success).toBe(true);

    const after = await db.transactions.orderBy('id').toArray();
    expect(after).toHaveLength(before.tx.length);
    for (let i = 0; i < after.length; i++) {
      expect(after[i].id).toBe(before.tx[i].id);
      expect(after[i].amount).toBe(before.tx[i].amount);
      expect(after[i].type).toBe(before.tx[i].type);
      expect(after[i].categoryId).toBe(before.tx[i].categoryId);
      expect(after[i].date.getTime()).toBe(before.tx[i].date.getTime());
    }
    expect(await db.categories.count()).toBe(before.cats);
    expect(await db.incomeSources.count()).toBe(1);
    expect(await db.recurringTransactions.count()).toBe(1);
    const settings = await db.settings.get('default');
    expect(settings?.monthlyBudget).toBe(before.settings?.monthlyBudget);
    expect(settings?.isOnboardingComplete).toBe(true);
  });
});

describe('runBackup', () => {
  it('저장소에 저장하고 lastBackupAt을 기록한다', async () => {
    await seed();
    const storage = new MemoryStorage();
    const result = await runBackup(storage, NOW);
    expect(result.success).toBe(true);
    expect(result.location).toBe(`memory://${backupFilename(NOW)}`);
    expect(storage.saved).toHaveLength(1);
    const settings = await db.settings.get('default');
    expect(settings?.lastBackupAt?.getTime()).toBe(NOW.getTime());
  });

  it('저장 실패면 lastBackupAt을 건드리지 않는다', async () => {
    await seed();
    const storage = new MemoryStorage();
    storage.failNext = true;
    const result = await runBackup(storage, NOW);
    expect(result.success).toBe(false);
    expect(result.error).toBe('disk full');
    expect((await db.settings.get('default'))?.lastBackupAt).toBeUndefined();
  });

  it('lastBackupAt은 복원 시 Date로 되살아난다', async () => {
    await seed();
    await runBackup(new MemoryStorage(), NOW);
    const snap = await createSnapshot(new Date(2026, 8, 8));
    await clearDb();
    await restorePinPigBackup(parsePinPigBackup(snap.json)!, { mode: 'replace' });
    const settings = await db.settings.get('default');
    expect(settings?.lastBackupAt).toBeInstanceOf(Date);
    expect(settings?.lastBackupAt?.getTime()).toBe(NOW.getTime());
  });
});

describe('getBackupStatus', () => {
  const day = 86400000;
  it('알림 끔(0일)이면 절대 due가 아니다', () => {
    expect(getBackupStatus({ backupReminderDays: 0, lastBackupAt: undefined }, 500, NOW).reason).toBe('disabled');
  });
  it('거래가 없으면 no-data', () => {
    expect(getBackupStatus({ backupReminderDays: 7, lastBackupAt: undefined }, 0, NOW).reason).toBe('no-data');
  });
  it('백업한 적 없으면 거래가 기준치 이상일 때만 never', () => {
    const s = { backupReminderDays: 7, lastBackupAt: undefined };
    expect(getBackupStatus(s, NEVER_BACKED_UP_MIN_TRANSACTIONS - 1, NOW)).toMatchObject({ isDue: false, reason: 'ok' });
    expect(getBackupStatus(s, NEVER_BACKED_UP_MIN_TRANSACTIONS, NOW)).toMatchObject({ isDue: true, reason: 'never' });
  });
  it('주기 경계: 6일은 ok, 7일은 overdue', () => {
    const six = getBackupStatus({ backupReminderDays: 7, lastBackupAt: new Date(NOW.getTime() - 6 * day) }, 50, NOW);
    const seven = getBackupStatus({ backupReminderDays: 7, lastBackupAt: new Date(NOW.getTime() - 7 * day) }, 50, NOW);
    expect(six).toMatchObject({ isDue: false, reason: 'ok', daysSince: 6 });
    expect(seven).toMatchObject({ isDue: true, reason: 'overdue', daysSince: 7 });
  });
  it('설정이 없으면 기본 7일로 판정한다', () => {
    expect(getBackupStatus(null, 20, NOW)).toMatchObject({ reminderDays: 7, reason: 'never' });
  });
});
