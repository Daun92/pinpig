/**
 * 계측 어댑터 테스트 (Phase 2 S1)
 * - opt-in: 동의 없으면 provider가 아무것도 받지 않는다
 * - 정제: 금액·메모류 키는 절대 실리지 않는다
 * - 기기 내 최근 오류는 동의와 무관하게 최대 20건
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  resetTelemetry,
  registerTelemetryProvider,
  configureTelemetry,
  captureError,
  track,
  sanitizeProps,
  getRecentErrors,
  clearRecentErrors,
  daysSinceInstall,
  generateInstallId,
  todayKey,
  buildTelemetryConsentUpdate,
  applyTelemetrySettings,
  type TelemetryProvider,
} from '@/services/telemetry';

// node 환경엔 localStorage가 없다 — 최소 구현으로 대체
const store = new Map<string, string>();
beforeEach(() => {
  store.clear();
  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    value: {
      getItem: (k: string) => store.get(k) ?? null,
      setItem: (k: string, v: string) => { store.set(k, v); },
      removeItem: (k: string) => { store.delete(k); },
    },
  });
  resetTelemetry();
});

function makeProvider(): TelemetryProvider & { errors: unknown[]; events: unknown[]; inits: number; shutdowns: number } {
  const p = {
    name: 'mock',
    errors: [] as unknown[],
    events: [] as unknown[],
    inits: 0,
    shutdowns: 0,
    init: vi.fn(() => { p.inits += 1; }),
    captureError: vi.fn((e: unknown) => { p.errors.push(e); }),
    track: vi.fn((e: unknown) => { p.events.push(e); }),
    shutdown: vi.fn(() => { p.shutdowns += 1; }),
  };
  return p;
}

describe('opt-in 게이팅', () => {
  it('기본(둘 다 꺼짐)에서는 provider가 오류도 이벤트도 받지 않는다', () => {
    const p = makeProvider();
    registerTelemetryProvider(p);
    captureError(new Error('boom'));
    expect(track('app_open', { days_since_install: 0 })).toBeNull();
    expect(p.errors).toHaveLength(0);
    expect(p.events).toHaveLength(0);
    expect(p.inits).toBe(0);
  });

  it('오류만 켜면 오류는 가고 이벤트는 안 간다', () => {
    const p = makeProvider();
    registerTelemetryProvider(p);
    configureTelemetry({ errors: true, usage: false, installId: 'id-1' });
    captureError(new Error('boom'));
    track('app_open');
    expect(p.errors).toHaveLength(1);
    expect(p.events).toHaveLength(0);
    expect(p.inits).toBe(1);
  });

  it('통계만 켜면 이벤트는 가고 오류는 안 간다', () => {
    const p = makeProvider();
    registerTelemetryProvider(p);
    configureTelemetry({ errors: false, usage: true, installId: 'id-1' });
    captureError(new Error('boom'));
    const ev = track('app_open', { days_since_install: 3 });
    expect(p.errors).toHaveLength(0);
    expect(p.events).toHaveLength(1);
    expect(ev?.props).toEqual({ days_since_install: 3 });
  });

  it('둘 다 끄면 shutdown되고 이후 아무것도 가지 않는다', () => {
    const p = makeProvider();
    registerTelemetryProvider(p);
    configureTelemetry({ errors: true, usage: true, installId: 'id-1' });
    configureTelemetry({ errors: false, usage: false });
    captureError(new Error('after'));
    track('app_open');
    expect(p.shutdowns).toBe(1);
    expect(p.errors).toHaveLength(0);
    expect(p.events).toHaveLength(0);
  });

  it('동의 후 등록된 provider도 init을 받는다', () => {
    configureTelemetry({ errors: true, usage: false, installId: 'id-1' });
    const p = makeProvider();
    registerTelemetryProvider(p);
    expect(p.inits).toBe(1);
  });
});

describe('정제', () => {
  it('금액·메모·카테고리명 키는 버려지고 허용 키만 남는다', () => {
    const out = sanitizeProps({
      type: 'expense',
      amount: 12000,
      memo: '점심',
      categoryName: '식비',
      count: 3,
      screen: 'x'.repeat(100),
    });
    expect(out).toEqual({ type: 'expense', count: 3, screen: 'x'.repeat(64) });
    expect('amount' in out).toBe(false);
    expect('memo' in out).toBe(false);
  });

  it('오류 메시지는 300자, 스택은 6줄로 자르고 경로는 pathname만 남긴다', () => {
    configureTelemetry({ errors: true, usage: false, installId: 'id-1' });
    const p = makeProvider();
    registerTelemetryProvider(p);
    const err = new Error('m'.repeat(500));
    err.stack = Array.from({ length: 20 }, (_, i) => `  at frame${i}`).join('\n');
    const recorded = captureError(err, 'window');
    expect(recorded.message).toHaveLength(300);
    expect(recorded.stack?.split('\n')).toHaveLength(6);
    expect(recorded.source).toBe('window');
    expect(recorded.path).not.toContain('?');
  });

  it('Error가 아닌 값도 오류로 감싼다', () => {
    const recorded = captureError('문자열 오류', 'promise');
    expect(recorded.name).toBe('Error');
    expect(recorded.message).toBe('문자열 오류');
  });
});

describe('기기 내 최근 오류', () => {
  it('동의와 무관하게 남고 20건에서 잘린다', () => {
    for (let i = 0; i < 25; i++) captureError(new Error(`e${i}`));
    const list = getRecentErrors();
    expect(list).toHaveLength(20);
    expect(list[0].message).toBe('e24'); // 최신이 앞
    clearRecentErrors();
    expect(getRecentErrors()).toHaveLength(0);
  });
});

describe('설치 식별자·경과일', () => {
  it('installId는 매번 다르고 비어 있지 않다', () => {
    const a = generateInstallId();
    const b = generateInstallId();
    expect(a).not.toBe(b);
    expect(a.length).toBeGreaterThan(8);
  });

  it('daysSinceInstall은 달력일 기준이고 미상은 -1', () => {
    expect(daysSinceInstall('2026-09-01', new Date(2026, 8, 8, 3, 0))).toBe(7);
    expect(daysSinceInstall('2026-09-07', new Date(2026, 8, 7, 23, 59))).toBe(0);
    expect(daysSinceInstall('2026-09-06', new Date(2026, 8, 7, 0, 1))).toBe(1);
    expect(daysSinceInstall(undefined)).toBe(-1);
    expect(daysSinceInstall('not-a-date')).toBe(-1);
  });

  it('todayKey는 YYYY-MM-DD', () => {
    expect(todayKey(new Date(2026, 0, 5))).toBe('2026-01-05');
  });
});

describe('buildTelemetryConsentUpdate', () => {
  const NOW = new Date(2026, 8, 7);
  it('처음 켜면 installId와 installedAt을 만든다', () => {
    const u = buildTelemetryConsentUpdate({}, { usage: true }, NOW);
    expect(u.telemetryUsageEnabled).toBe(true);
    expect(u.telemetryErrorsEnabled).toBe(false);
    expect(u.telemetryInstallId).toBeTruthy();
    expect(u.telemetryInstalledAt).toBe('2026-09-07');
  });
  it('이미 켜져 있으면 기존 식별자를 유지한다', () => {
    const cur = { telemetryErrorsEnabled: true, telemetryInstallId: 'keep', telemetryInstalledAt: '2026-01-01' };
    const u = buildTelemetryConsentUpdate(cur, { usage: true }, NOW);
    expect(u.telemetryInstallId).toBe('keep');
    expect(u.telemetryInstalledAt).toBe('2026-01-01');
    expect(u.telemetryErrorsEnabled).toBe(true);
  });
  it('둘 다 끄면 식별자를 지운다', () => {
    const cur = { telemetryErrorsEnabled: true, telemetryUsageEnabled: false, telemetryInstallId: 'x', telemetryInstalledAt: '2026-01-01' };
    const u = buildTelemetryConsentUpdate(cur, { errors: false }, NOW);
    expect(u).toEqual({
      telemetryErrorsEnabled: false, telemetryUsageEnabled: false,
      telemetryInstallId: undefined, telemetryInstalledAt: undefined,
    });
  });
  it('applyTelemetrySettings는 구버전 설정(필드 없음)을 꺼짐으로 본다', () => {
    const p = makeProvider();
    registerTelemetryProvider(p);
    applyTelemetrySettings({});
    captureError(new Error('x'));
    expect(p.errors).toHaveLength(0);
    applyTelemetrySettings({ telemetryErrorsEnabled: true, telemetryInstallId: 'id' });
    captureError(new Error('y'));
    expect(p.errors).toHaveLength(1);
  });
});
