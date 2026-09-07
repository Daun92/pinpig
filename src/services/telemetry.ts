/**
 * 계측 어댑터 (Phase 2 S1)
 *
 * 오류 보고와 익명 사용 통계를 받는 단일 창구. 전송처(provider)는 아직 없고,
 * 나중에 PostHog·Sentry 같은 어댑터를 registerTelemetryProvider로 끼운다.
 *
 * 원칙
 * - 기본 꺼짐. 사용자가 설정에서 켠 항목만 provider에 전달한다 (opt-in)
 * - 금액·메모·카테고리명 같은 사용자 데이터는 절대 싣지 않는다 (sanitize)
 * - 최근 오류는 기기 안 localStorage에만 최대 20건 보관한다 (설정 > 정보에서 확인·삭제)
 */

export type TelemetryProps = Record<string, string | number | boolean>;

export interface TelemetryEvent {
  name: string;
  props: TelemetryProps;
  at: string; // ISO
}

export interface TelemetryError {
  name: string;
  message: string;
  stack?: string;        // 상위 프레임 몇 줄만
  path: string;          // 쿼리 제거된 경로
  source: 'window' | 'promise' | 'react' | 'manual';
  at: string;
  appVersion: string;
  buildCommit: string;
}

export interface TelemetryContext {
  installId: string;
}

export interface TelemetryProvider {
  name: string;
  init(ctx: TelemetryContext): void | Promise<void>;
  captureError(error: TelemetryError): void;
  track(event: TelemetryEvent): void;
  shutdown?(): void;
}

export interface TelemetryConsent {
  errors: boolean;
  usage: boolean;
  installId?: string;
}

// =========================================
// 상태
// =========================================

const providers: TelemetryProvider[] = [];
let consent: TelemetryConsent = { errors: false, usage: false };
let initialized = false;

const ERROR_LOG_KEY = 'pinpig.telemetry.recentErrors';
const ERROR_LOG_MAX = 20;
const STACK_LINES = 6;

declare const __APP_VERSION__: string;
declare const __BUILD_COMMIT__: string;

function appVersion(): string {
  try { return __APP_VERSION__; } catch { return 'unknown'; }
}
function buildCommit(): string {
  try { return __BUILD_COMMIT__; } catch { return 'unknown'; }
}

// =========================================
// provider 등록 · 동의 설정
// =========================================

export function registerTelemetryProvider(provider: TelemetryProvider): void {
  if (providers.some((p) => p.name === provider.name)) return;
  providers.push(provider);
  if (initialized && consent.installId) {
    void provider.init({ installId: consent.installId });
  }
}

/** 테스트용: provider·동의 상태 초기화 */
export function resetTelemetry(): void {
  for (const p of providers) p.shutdown?.();
  providers.length = 0;
  consent = { errors: false, usage: false };
  initialized = false;
}

/**
 * 설정에서 읽은 동의 상태를 반영한다. 설정이 바뀔 때마다 호출.
 * 둘 다 꺼져 있으면 provider는 아무것도 받지 않는다.
 */
export function configureTelemetry(next: TelemetryConsent): void {
  consent = { ...next };
  const anyOn = consent.errors || consent.usage;
  if (anyOn && consent.installId && !initialized) {
    initialized = true;
    for (const p of providers) void p.init({ installId: consent.installId });
  }
  if (!anyOn && initialized) {
    initialized = false;
    for (const p of providers) p.shutdown?.();
  }
}

export function getTelemetryConsent(): Readonly<TelemetryConsent> {
  return consent;
}

/** 익명 설치 식별자 — 통계를 켤 때 한 번 만들고, 끄면 설정에서 지운다 */
export function generateInstallId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

/** 설치일로부터 며칠째인지 (D1/D7 리텐션 계산용). 설치일 미상은 -1 */
export function daysSinceInstall(installedAt: string | undefined, now = new Date()): number {
  if (!installedAt) return -1;
  const start = new Date(installedAt);
  if (Number.isNaN(start.getTime())) return -1;
  const a = Date.UTC(start.getFullYear(), start.getMonth(), start.getDate());
  const b = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.max(0, Math.round((b - a) / 86400000));
}

/** 오늘 날짜를 YYYY-MM-DD로 (설치일 기록용) */
export function todayKey(now = new Date()): string {
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

// =========================================
// 정제 (sanitize)
// =========================================

const ALLOWED_PROP_KEYS = new Set([
  'type', 'source', 'count', 'days_since_install', 'mode', 'result', 'screen', 'has_budget', 'reason',
]);

/** 허용 키만 남기고, 값이 문자열이면 길이를 자른다. 금액·메모류 키는 여기서 걸러진다 */
export function sanitizeProps(props: TelemetryProps | undefined): TelemetryProps {
  const out: TelemetryProps = {};
  if (!props) return out;
  for (const [k, v] of Object.entries(props)) {
    if (!ALLOWED_PROP_KEYS.has(k)) continue;
    if (typeof v === 'string') out[k] = v.slice(0, 64);
    else if (typeof v === 'number' || typeof v === 'boolean') out[k] = v;
  }
  return out;
}

function currentPath(): string {
  if (typeof window === 'undefined') return '';
  return window.location.pathname;
}

function trimStack(stack: string | undefined): string | undefined {
  if (!stack) return undefined;
  return stack.split('\n').slice(0, STACK_LINES).map((l) => l.trim()).join('\n');
}

export function toTelemetryError(input: unknown, source: TelemetryError['source']): TelemetryError {
  const err = input instanceof Error ? input : new Error(typeof input === 'string' ? input : String(input));
  return {
    name: err.name || 'Error',
    message: (err.message || '').slice(0, 300),
    stack: trimStack(err.stack),
    path: currentPath(),
    source,
    at: new Date().toISOString(),
    appVersion: appVersion(),
    buildCommit: buildCommit(),
  };
}

// =========================================
// 기기 내 최근 오류 보관
// =========================================

export function getRecentErrors(): TelemetryError[] {
  try {
    const raw = localStorage.getItem(ERROR_LOG_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function clearRecentErrors(): void {
  try { localStorage.removeItem(ERROR_LOG_KEY); } catch { /* storage 불가 환경 */ }
}

function appendRecentError(error: TelemetryError): void {
  try {
    const list = getRecentErrors();
    list.unshift(error);
    localStorage.setItem(ERROR_LOG_KEY, JSON.stringify(list.slice(0, ERROR_LOG_MAX)));
  } catch { /* storage 불가 환경 */ }
}

// =========================================
// 공개 API
// =========================================

/**
 * 오류 기록. 기기 내 목록에는 항상 남기고, 동의가 있을 때만 provider로 보낸다.
 */
export function captureError(input: unknown, source: TelemetryError['source'] = 'manual'): TelemetryError {
  const error = toTelemetryError(input, source);
  appendRecentError(error);
  if (consent.errors) {
    for (const p of providers) {
      try { p.captureError(error); } catch { /* provider 오류는 앱을 막지 않는다 */ }
    }
  }
  return error;
}

/**
 * 사용 이벤트. 동의가 없으면 아무 데도 가지 않는다.
 */
export function track(name: string, props?: TelemetryProps): TelemetryEvent | null {
  if (!consent.usage) return null;
  const event: TelemetryEvent = { name, props: sanitizeProps(props), at: new Date().toISOString() };
  for (const p of providers) {
    try { p.track(event); } catch { /* provider 오류는 앱을 막지 않는다 */ }
  }
  return event;
}

// =========================================
// 전역 오류 훅
// =========================================

let globalHandlersInstalled = false;

export function installGlobalErrorHandlers(): void {
  if (globalHandlersInstalled || typeof window === 'undefined') return;
  globalHandlersInstalled = true;
  window.addEventListener('error', (e) => {
    captureError(e.error ?? e.message, 'window');
  });
  window.addEventListener('unhandledrejection', (e) => {
    captureError(e.reason, 'promise');
  });
}

// =========================================
// 개발용 provider — 콘솔에 찍기만 한다
// =========================================

export const consoleTelemetryProvider: TelemetryProvider = {
  name: 'console',
  init(ctx) { console.info('[telemetry] init', ctx.installId); },
  captureError(error) { console.warn('[telemetry] error', error); },
  track(event) { console.info('[telemetry] track', event.name, event.props); },
};

// =========================================
// 설정 ↔ 동의 상태 연결
// =========================================

export interface TelemetrySettingsLike {
  telemetryErrorsEnabled?: boolean;
  telemetryUsageEnabled?: boolean;
  telemetryInstallId?: string;
  telemetryInstalledAt?: string;
}

/** 저장된 설정을 읽어 동의 상태를 반영한다. 설정이 없거나 필드가 없으면(구버전 사용자) 꺼짐 */
export function applyTelemetrySettings(settings: TelemetrySettingsLike | null | undefined): void {
  configureTelemetry({
    errors: settings?.telemetryErrorsEnabled ?? false,
    usage: settings?.telemetryUsageEnabled ?? false,
    installId: settings?.telemetryInstallId,
  });
}

/**
 * 토글 변경을 설정 업데이트로 변환한다.
 * - 하나라도 켜지면 installId·installedAt이 없을 때 새로 만든다
 * - 둘 다 꺼지면 installId·installedAt을 지운다 (식별자를 남기지 않는다)
 */
export function buildTelemetryConsentUpdate(
  current: TelemetrySettingsLike | null | undefined,
  change: { errors?: boolean; usage?: boolean },
  now = new Date()
): Required<Pick<TelemetrySettingsLike, 'telemetryErrorsEnabled' | 'telemetryUsageEnabled'>> &
  Pick<TelemetrySettingsLike, 'telemetryInstallId' | 'telemetryInstalledAt'> {
  const errors = change.errors ?? current?.telemetryErrorsEnabled ?? false;
  const usage = change.usage ?? current?.telemetryUsageEnabled ?? false;
  if (!errors && !usage) {
    return {
      telemetryErrorsEnabled: false,
      telemetryUsageEnabled: false,
      telemetryInstallId: undefined,
      telemetryInstalledAt: undefined,
    };
  }
  return {
    telemetryErrorsEnabled: errors,
    telemetryUsageEnabled: usage,
    telemetryInstallId: current?.telemetryInstallId || generateInstallId(),
    telemetryInstalledAt: current?.telemetryInstalledAt || todayKey(now),
  };
}
