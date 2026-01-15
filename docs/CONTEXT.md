# PinPig 프로젝트 컨텍스트

> **최종 갱신**: 2026-01-15
> **버전**: 0.2.5
> **이 파일은 새 대화 시작 시 빠른 맥락 파악용입니다.**

---

## 현재 상태

| 항목 | 값 |
|------|-----|
| 버전 | 0.2.5 |
| MVP 완성도 | 100% |
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
- 22 페이지 (src/pages/) - 알림 설정 페이지 2개 추가
- 24 컴포넌트 (src/components/)
- 8 스토어 (src/stores/)
- 5 훅 (src/hooks/)
- 40+ 쿼리 함수 (src/services/queries.ts)
```

### 주요 라우트

| 경로 | 페이지 | 설명 |
|------|--------|------|
| `/` | HomePage | 홈 대시보드 (남은 예산) |
| `/add` | AddPage | 거래 입력 |
| `/history` | HistoryPage | 내역 (fixed header + sticky date) |
| `/stats` | StatsPage | 분석/리포트 (fixed + sticky tabs) |
| `/settings` | SettingsPage | 설정 |
| `/settings/methods` | MethodManagePage | 수단 관리 (지출/수입) |
| `/settings/budget-wizard` | BudgetWizardPage | 예산 마법사 |
| `/settings/category-budget` | CategoryBudgetPage | 카테고리별 예산 |
| `/settings/recurring` | RecurringTransactionPage | 반복 거래 |
| `/settings/recurring-alerts` | RecurringAlertSettingsPage | 반복 거래 알림 |
| `/settings/payment-method-alerts` | PaymentMethodAlertSettingsPage | 결제수단별 알림 |
| `/review` | MonthlyReviewPage | 월간 리뷰 |

---

## 최근 작업 (최신순)

### #121 UX/UI 개선 패키지 (v0.2.5) (2026-01-15)
- 반복거래 메모/태그 입력 분리 (커서 문제 해결)
- 토스트 알림 위치 상단 이동 + 다크모드 가시성 개선
- 금액 입력 천단위 콤마 적용
- 분석 탭 다크모드 가시성 개선 (아이콘, 라벨, 차트)
- AddPage 자동 포커스 + Enter 키 UX 개선
- 차트 라벨 overflow 문제 해결

### #120 발전 방향 로드맵 문서 작성 (2026-01-13)
- `docs/ROADMAP.md` 신규 생성
- 단기/중기/장기 계획, 기술 부채 관리

### #119 예정 지출 기록 및 날짜 탐색 개선 (2026-01-13)
- AddPage: 미래 날짜 선택 가능 (`disableFuture={false}`)
- DateTimePicker: 일~토 달력 구조, 주말 색상 구분
- HomePage → HistoryPage: 요약카드 클릭 시 해당 날짜로 스크롤

### #118 앱 내 알림 마스터 토글 추가 (2026-01-13)
- 설정 > 알림 섹션 최상단에 "앱 내 알림" 전체 on/off 토글 추가
- 마스터 토글 OFF 시 세부 알림 설정 항목 숨김

---

## 알림 시스템 구조

```
┌─────────────────────────────────────────────────────────────┐
│                    앱 알림 시스템                            │
├─────────────────────────────────────────────────────────────┤
│ ⚙️ 앱 내 알림 마스터 토글 (#118)                             │
│    - notificationEnabled: 전체 알림 on/off                  │
│    - OFF 시 하위 모든 알림 비활성화 및 UI 숨김              │
├─────────────────────────────────────────────────────────────┤
│ 1. 전체 예산 알림                                           │
│    - 월 예산 대비 사용률 임계값 도달 시 Toast                │
│                                                             │
│ 2. 카테고리별 알림 (#104)                                    │
│    - 카테고리 예산 대비 임계값 도달 시 Toast                 │
│    - 카테고리 편집 시 알림 설정 연계 (#116)                  │
│                                                             │
│ 3. 반복 거래 알림 (#114)                                     │
│    - 예정된 거래 N일 전 사전 알림                            │
│    - 개별 거래별 알림 시점 커스터마이즈                      │
│                                                             │
│ 4. 결제수단별 알림 (#115)                                    │
│    - 카드/계좌별 예산 대비 임계값 도달 시 Toast              │
│    - 거래 저장 직후 즉시 확인                                │
└─────────────────────────────────────────────────────────────┘
```

---

## 미완성 / 진행 예정

### 🟡 권장
- 예측 카드 - 월말 예상 잔액

### 🟢 선택
- PWA 푸시 알림
- Phase 2: Capacitor iOS 전환

### ✅ 완료됨
- 홈 인사이트 카드 → #105 히어로 캐러셀로 구현
- 인사이트 상세 뷰 연결 → #112 URL 파라미터 기반 맥락 전달
- 반복 거래 알림 → #114 완성
- 결제수단별 알림 → #115 완성
- 카테고리 알림 연계 → #116 완성

---

## 주의사항

1. **addPageStore.ts deprecated** - fabStore 직접 사용

---

## 참조 문서

| 문서 | 용도 |
|------|------|
| `docs/FEATURE_MAP.md` | **기능 연관 맵 (수정 전 필수)** |
| `docs/ROADMAP.md` | **발전 방향 로드맵** |
| `WORKLOG-FULL.md` | 전체 작업 히스토리 |
| `docs/COMPLETION_REPORT.md` | 완성도 평가 보고서 |
| `docs/CONCEPT.md` | 앱 컨셉 |
| `docs/USER_JOURNEY.md` | 사용자 여정 |
| `MoneyMirror_PWA_개발기획서.md` | MVP 기획서 |
| `moneymirror-design-system.md` | 디자인 시스템 |

---

*상세 작업 기록은 `WORKLOG-FULL.md` 참조*
