# PinPig 프로젝트 컨텍스트

> **최종 갱신**: 2026-01-09
> **버전**: 0.2.4
> **이 파일은 새 대화 시작 시 빠른 맥락 파악용입니다.**

---

## 현재 상태

| 항목 | 값 |
|------|-----|
| 버전 | 0.2.4 |
| MVP 완성도 | 98% |
| 배포 URL | https://pinpig.vercel.app |
| ESLint | 0 에러 |
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
- 20 페이지 (src/pages/)
- 15 컴포넌트 (src/components/)
- 7 스토어 (src/stores/)
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
| `/settings/methods` | MethodManagePage | 수단 관리 (지출/수입) |
| `/settings/budget-wizard` | BudgetWizardPage | 예산 마법사 |
| `/settings/recurring` | RecurringTransactionPage | 반복 거래 |
| `/review` | MonthlyReviewPage | 월간 리뷰 |

---

## 최근 작업 (최신순)

### #89 반복거래/설정 UI 개선 (2026-01-09) - v0.2.4
- 설정 탭 월예산 천단위 콤마 표시
- 반복거래 메모 필드 중복 제거 + 실행 모드(on_date/start_of_month) 옵션 추가
- 반복주기 순서 재배치 (monthly 우선)
- 관리 페이지 FAB 비활성화 표시
- 활성/비활성 카드 스타일 개선 (체크버튼으로만 구분)

### #88 TOP5 세로 레이아웃 (2026-01-09)
- 카테고리/결제수단 모달 - 세로 배치 통일 (긴 메모/억 단위 금액 대응)

### #87 결제수단 상세 모달 수입/지출 혼합 버그 수정 (2026-01-09)
- 쿼리 함수에 type 필터 누락 → 추가

### #86 Transaction description/memo 필드 통합 (2026-01-09) - v0.2.3
- description과 memo 필드를 memo로 통합
- DB v7 마이그레이션으로 기존 데이터 자동 병합

### #85 메모 표시 버그 수정 + 기록탭 월간 합계 (2026-01-09) - v0.1.7
- 거래 메모가 분석/기록 탭에 표시되지 않던 버그 수정
- 기록 탭 상단에 월간 합계 영역 추가

---

## 미완성 / 진행 예정

### 🟡 권장
- 홈 인사이트 카드 - "💡 이번 주 인사이트" 영역
- 예측 카드 - 월말 예상 잔액

### 🟢 선택
- PWA 푸시 알림
- Phase 2: Capacitor iOS 전환

---

## 주의사항

1. **addPageStore.ts deprecated** - fabStore 직접 사용

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
