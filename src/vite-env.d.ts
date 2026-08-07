/// <reference types="vite/client" />

declare const __APP_VERSION__: string;
/** 빌드 시각 (ISO 8601, UTC) — vite.config.ts에서 주입 */
declare const __BUILD_TIME__: string;
/** 빌드된 커밋의 짧은 해시 — CI는 VERCEL_GIT_COMMIT_SHA, 로컬은 git rev-parse */
declare const __BUILD_COMMIT__: string;
