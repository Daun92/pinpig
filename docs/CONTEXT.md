# PinPig 프로젝트 컨텍스트

> **최종 갱신**: 2026-01-09
> **버전**: 0.1.6
> **이 파일은 새 대화 시작 시 빠른 맥락 파악용입니다.**

---

## 현재 상태

| 항목 | 값 |
|------|-----|
| 버전 | 0.1.6 |
| MVP 완성도 | 98% |
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

### #84 온보딩 아이콘 개선 (2026-01-09) - v0.1.6
- 이모지 → Lucide 선형 아이콘으로 교체
- OnboardingPage: 💰→Wallet, 📊→CalendarDays, 📈→TrendingUp
- AddFlowIllustration: 🍽️→Utensils, ₩→Coins, ✓→Check
- 앱 테마와 일관된 strokeWidth={1.5}

### #83 온보딩 시스템 업그레이드 (2026-01-09)
- 5단계 슬라이드 온보딩 (웰컴 → 홈 → 기록 → 분석 → 예산)
- CSS 애니메이션 일러스트 (숫자 카운트업, 도넛차트 등)
- Coach Marks 시스템 (첫 진입 시 화면별 툴팁 가이드)

### #82 온보딩 시스템 구현 (2026-01-09)
- 3단계 온보딩 → 5단계로 확장
- 카피: "오늘 얼마나 쓸 수 있지?" / "열면 바로 보여요"
- 예산 설정 선택사항 (건너뛰기 가능)

### #81 기간별 추이 - 연간 모드 필터 수정 (2026-01-09)
- 연간 모드에서 카테고리 필터 표시 (기존 미표시 버그 수정)

### #80 분석 탭 세부 개선 - 월간/연간 분석 (2026-01-09)
- 기간설정을 지출/수입 토글 하단으로 이동
- 월간/연간 모드 선택 + 기간 네비게이션 통합
- 수단별 탭에 상세내역 모달 추가

### #79 수단 관리 통합 (2026-01-09)
- 결제수단 + 수입수단 → "수단 관리" 통합

### #78 수입 수단 (Income Source) 추가 (2026-01-09)
- 결제 수단처럼 수입 수단 별도 관리

### #77 분석 탭 스와이프 탭 이동 (2026-01-08)
- 탭 좌우 스와이프 이동 (v0.1.5)

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
