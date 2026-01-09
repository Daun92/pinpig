# PinPig 프로젝트 컨텍스트

> **최종 갱신**: 2026-01-08
> **버전**: 0.1.4
> **이 파일은 새 대화 시작 시 빠른 맥락 파악용입니다.**

---

## 현재 상태

| 항목 | 값 |
|------|-----|
| 버전 | 0.1.4 |
| MVP 완성도 | 92% |
| 배포 URL | https://pinpig.vercel.app |
| ESLint | 0 에러, 5 경고 (의도적) |
| 빌드 | 통과 |

---

## 핵심 컨셉

**"기록하는 가계부가 아니라, 비춰주는 거울"**

- "얼마나 썼지?" → **"얼마나 남았지?"**
- 1초 확인, 3터치 기록
- 판단 없는 중립적 정보 전달
- 소비 = 관심의 표현

---

## 아키텍처 요약

```
기술 스택:
- React 18 + TypeScript + Vite
- Tailwind CSS + Zustand
- Dexie.js (IndexedDB)
- Recharts, date-fns, lucide-react

구조:
- 18 페이지 (src/pages/)
- 15 컴포넌트 (src/components/)
- 6 스토어 (src/stores/)
- 35+ 쿼리 함수 (src/services/queries.ts)
```

### 주요 라우트

| 경로 | 페이지 | 설명 |
|------|--------|------|
| `/` | HomePage | 홈 대시보드 (남은 예산) |
| `/add` | AddPage | 거래 입력 |
| `/history` | HistoryPage | 내역 (에스컬레이터 스크롤) |
| `/stats` | StatsPage | 분석/리포트 |
| `/settings` | SettingsPage | 설정 |
| `/settings/budget-wizard` | BudgetWizardPage | 예산 마법사 |
| `/settings/recurring` | RecurringTransactionPage | 반복 거래 |
| `/review` | MonthlyReviewPage | 월간 리뷰 |

---

## 최근 작업 (최신순)

### #76 좌우 스와이프 월 이동 (2026-01-08)
- 좌로 스와이프 = 다음 달, 우로 스와이프 = 이전 달
- 스크롤 중에도 월 이동 가능

### #75 기록 탭 UX 개선 (2026-01-08)
- 스크롤 시 최근 날짜로 강제 이동되는 버그 수정

### #74 설정 페이지 버전 동적 로드 (2026-01-08)
- `__APP_VERSION__` 전역 상수로 package.json 버전 주입
- SettingsPage에서 동적 표시

### #73 작업일지 이원화 구조 (2026-01-08)
- `docs/CONTEXT.md` (맥락 유지용) + `WORKLOG-FULL.md` (작업 관리용) 분리

### #72 앱 기획 완성도 평가 (2026-01-08)
- 기획서 대비 완성도 분석
- `docs/COMPLETION_REPORT.md` 생성
- MVP 92% 완성 확인

### #71 코드베이스 정비 (2026-01-08)
- services/index.ts 누락 export 추가 (8→35개)
- stores/index.ts 불완전 export 수정
- ESLint 에러 0개로 정리

### #70 Floating Header + Pull-to-load (2026-01-08)
- HistoryPage 에스컬레이터 스크롤 UX
- Intersection Observer 기반 단일 Floating Header
- 양방향 월 이동 (#75에서 개선)

---

## 미완성 / 진행 예정

### 🔴 필수 (MVP 100% 목표)
- **온보딩 플로우** - 신규 사용자 첫 경험 부재
  - `/onboarding` 라우트
  - 웰컴 → 예산 설정 → 완료 → 홈

### 🟡 권장
- 홈 인사이트 카드 - "💡 이번 주 인사이트" 영역
- 예측 카드 - 월말 예상 잔액

### 🟢 선택
- PWA 푸시 알림
- Phase 2: Capacitor iOS 전환

---

## 주의사항

1. **온보딩 미구현** - 앱 첫 실행 시 예산 0원으로 시작
2. **addPageStore.ts deprecated** - fabStore 직접 사용

---

## 참조 문서

| 문서 | 용도 |
|------|------|
| `WORKLOG-FULL.md` | 전체 작업 히스토리 |
| `docs/COMPLETION_REPORT.md` | 완성도 평가 보고서 |
| `docs/CONCEPT.md` | 앱 컨셉 |
| `docs/USER_JOURNEY.md` | 사용자 여정 |
| `MoneyMirror_PWA_개발기획서.md` | MVP 기획서 |
| `moneymirror-design-system.md` | 디자인 시스템 |

---

*상세 작업 기록은 `WORKLOG-FULL.md` 참조*
