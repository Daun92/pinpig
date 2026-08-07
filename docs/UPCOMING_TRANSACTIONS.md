# 예정 거래 설계 (Upcoming Transactions)

> **작성일**: 2026-08-07
> **상태**: 설계 확정 · 구현 착수
> **관련**: #119(미래 입력 개방), #124~#133(반복거래 선반영), R-03/R-04/R-05/R-08

---

## 1. 배경

"예정 고지가 확정된 지출을 미리 입력해두고 싶다"는 요구에서 출발했다.

조사 결과 **미래 날짜 입력은 이미 열려 있었다.** #119(2026-01-13)에서 `AddPage`에 한해
`disableFuture={false}`로 열고 파란색 "예정" 라벨까지 붙였다. 실브라우저로 확인한 현재 동작:

| 확인 항목 | 결과 |
|---|---|
| AddPage에서 미래 날짜 선택 | 가능 |
| 날짜 칩 표시 | `8/25 (화) 예정` (파란색) |
| 연도 목록 | 2017~2026 — **다음 해 없음** |
| 저장 후 홈 남은 예산 | 200만 → **150만 (즉시 차감)** |
| 홈 "이번 달 관심" | **미래 건이 분석에 집계됨** |
| 기록 탭 | **예정 표식 없음** — 실지출과 동일 렌더 |
| 편집·상세 화면 | `disableFuture={true}` — **날짜 수정 불가** |

즉 막힌 것은 입력이 아니라 **입력 이후의 정합성**이었다.

### 근본 원인

앱에 "예정"이 두 갈래로 존재하고, 수동 입력 쪽만 1급 시민이 아니다.

- **반복거래 예정**: `ProjectedTransaction` 전용 타입(`isProjected: true`)으로 실거래와 구분됨
- **수동 미래 입력**: 그냥 `Transaction` — `Transaction` 타입에 상태 구분 필드가 없어(`types/index.ts:7-20`)
  집계 단계에서 실지출과 분리할 수단이 없다

---

## 2. 설계 원칙

### 2.1 상태 필드를 추가하지 않고 날짜로 파생한다

```ts
// src/utils/date.ts (신규)
export function isUpcoming(date: Date): boolean {
  return isAfter(startOfDay(date), startOfDay(new Date()));
}
```

- 경계: **오늘은 예정이 아니다.** 내일부터 예정.
- Dexie 스키마 변경·마이그레이션 없음 → 기존 데이터 그대로
- 날짜가 도래하면 자동으로 실거래가 되므로 **별도 확정 처리가 불필요**

**한계**: "예정이었는데 실제로는 안 나갔다"를 표현할 수 없다. 실사용에서 이 요구가 나오면
2단계로 `status: 'scheduled' | 'settled' | 'canceled'` 도입을 검토한다. 그때는 스키마 버전 업 + 마이그레이션이 필요하다.

### 2.1.1 도래 후 시한부 '확인' 배지 (#140)

날짜가 지나면 예정 거래는 조용히 확정 지출이 된다. 고지 금액이 예상과 달랐어도 알아챌
방법이 없으므로, 도래 직후 **7일 동안만** 표시해 두고 손대지 않으면 사라지게 한다.
**무응답 = 확정**이라는 결정이며, 알림을 늘리지 않는다.

여기서도 저장 필드를 늘리지 않는다 (`utils/date.ts`의 `needsSettlementCheck`):

| 조건 | 의미 |
|---|---|
| `!isUpcoming(date)` | 이미 도래했다 |
| `createdAt < date` | 발생 전에 미리 넣은 거래였다 — 당일·소급 입력은 해당 없음 |
| `updatedAt < date` | 도래 후 손대지 않았다 — **수정했다면 확인한 것으로 본다** |
| `!tags.includes('반복')` | 반복 자동 생성분 제외 — 금액이 고정이고 별도 알림이 있다 |
| `오늘 - date ≤ 7일` | 시한 |

표시 위치: 기록 탭 행의 앰버 "확인" 배지, 홈 하단 "확인" 카드(→ `/history?scrollTo=check`).
파란 "예정" 배지(도래 전)와 앰버 "확인" 배지(도래 후)는 색으로 구분된다.

### 2.2 3층 구조

| 층위 | 정의 | 저장 형태 |
|---|---|---|
| **① 확정 (settled)** | `date ≤ 오늘` | 실제 `Transaction` |
| **② 예정 (upcoming)** | `date > 오늘` | 실제 `Transaction` — 수동 선입력 + 반복 월초 선반영분 |
| **③ 예상 (projected)** | 반복 템플릿 기반, 아직 거래 미생성 | `ProjectedTransaction` (파생, 비영속) |

②와 ③은 성격이 같지만 저장 형태가 다르다. **화면에서는 둘을 함께 "예정"으로 묶어 보여준다.**

### 2.3 영역별 집계 기준 (핵심 결정)

| 영역 | 기준 | 근거 |
|---|---|---|
| 홈 남은 예산 (히어로 금액) | ① + ② + ③ 차감 | **현행 유지.** "고지 확정된 돈은 이미 쓸 수 없는 돈" — 컨셉에 부합 |
| 홈 프로그레스 · 전체 예산 알림 (`percentUsed`) | ① + ② | 남은 예산과 같은 화면·같은 경고 성격이므로 일관 |
| 분석 탭 (월간·연간) | **①만** | "지난 소비를 비춰주는" 영역 — 아직 쓰지 않은 돈은 뺀다 |
| 카테고리·수단 예산 사용률 | **①만** | 위와 동일 |
| 인사이트 상세 (caution/room/interest/compare) | **①만** | 분석 계열 |
| 예정 영역 (홈 예정 카드·upcoming 위젯·기록 미래 그룹) | ② + ③ | 예정 그 자체를 보는 영역 |
| CSV 내보내기 | ① + ② | 사용자가 입력한 데이터 전량 |

> **의도적 비대칭**: 전체 예산 알림은 예정 포함, 카테고리 예산 알림은 실지출만.
> 전체 예산 알림은 "쓸 수 있는 돈이 얼마 안 남았다"는 경고라 예정을 포함해야 실제 여유를 반영한다.
> 카테고리 예산은 "이 카테고리에 얼마 썼나"라 실지출 기준이 맞다. 이 차이는 의도된 것이다.

---

## 3. 구현 계획

### 패키지 C — 입력·수정 경로 정합 (위험 낮음, 선행)

| 파일 | 변경 |
|---|---|
| `EditTransactionPage.tsx:611` | `disableFuture={true}` → `false` |
| `TransactionDetailPage.tsx:738` | 동일 |
| `DateTimePicker.tsx:87` | `years`를 `currentYear-8 ~ currentYear+1`로 확장 (연말 고지 선입력). `disableFuture=true` 호출부는 `isYearDisabled`가 계속 막으므로 안전 |
| `AddPage.tsx` 저장 후 | 미래 날짜면 `"8월 25일에 기록될 예정이에요"` 토스트 |

**해소되는 문제**: 미래 거래를 잘못 입력하면 날짜를 고칠 수 없어 삭제 후 재입력해야 했다.

### 패키지 B — 예정 식별·표시

| 파일 | 변경 |
|---|---|
| `HistoryPage.tsx` | 리스트 아이템에 "예정" 배지, 날짜 그룹 헤더 구분 (`isFutureGroup`이 이미 계산됨 — 렌더에 연결) |
| `TransactionDetailPage.tsx` | 상단 예정 표시 |
| `queries.ts:1745` `getUpcomingThisMonth` | **수동 미래 거래를 포함**하도록 확장 — 현재 반복 projections만 봄 |
| `HomePage.tsx:446` | 예정 카드 `-500,000원` → 마이너스 제거 (디자인 가이드: 마이너스 기호 금지) |

### 패키지 A — 집계 정합성 (핵심)

**A-1. `transactionStore.ts:270-295` `selectBudgetStatus`**

`BudgetStatus`에 `actualExpense` / `upcomingExpense` 추가.
`totalExpense` · `remaining` · `percentUsed`는 **예정 포함 유지** → 값 불변, 기존 소비처 회귀 없음.

**A-2. `queries.ts:1177` `getMonthlyBudgetStructure`**

```
currentSpent     = 실지출만                          (기존: 예정 포함)
projectedSpent   = currentSpent + 반복예상 + 수동예정   (기존: currentSpent + 반복예상)
projectedBalance = 기존과 동일한 값 (항만 분리)
```

카테고리 예산 화면이 "지금까지 X / 월말 예상 Y"로 정확해진다.

**A-3. 분석 계열 실지출 전환**

`getSettledTransactionsByMonth()` / `getSettledTransactionsByYear()` 헬퍼를 신설하고
아래 호출부만 교체한다. 기본 함수(`getTransactionsByMonth`)의 동작은 바꾸지 않는다 —
**빠뜨리면 현행 동작이 유지될 뿐 데이터가 사라지지 않는** 방향이라 안전하다.

| 함수 | 위치 | 소비처 |
|---|---|---|
| `getMonthlySummary` | `queries.ts:69` | 분석 월 요약, `getMonthlyTrend`(연쇄) |
| `getCategoryBreakdown` | `:94` | 분석 도넛·리스트, 홈 "이번 달 관심" |
| `getPaymentMethodBreakdown` | `:143` | 분석 수단 도넛·리스트 |
| `getYearlySummary` | `:287` | 분석 연간 토글 |
| `getYearlyCategoryBreakdown` | `:309` | 동상 |
| `getYearlyPaymentMethodBreakdown` | `:349` | 동상 |
| `getAnnualTrend` | `:217` | 연간 추이 |
| `getCategoryBudgetStatus` | `:1601` | 카테고리 예산 알림 |
| `getCautionDetail` | `:1850` | 인사이트 상세 |
| `getRoomDetail` | `:1905` | 인사이트 상세 |
| `getInterestDetail` | `:1963` | 인사이트 상세 |
| `getCompareDetail` | `:2044` | 인사이트 상세 |
| `getCategoryPaymentBreakdown` | `:2247` | breakdown 모달 |
| `getPaymentMethodCategoryBreakdown` | `:2295` | breakdown 모달 |
| `getBudgetOverview` | `:2353` | 예산 배분 현황 위젯 |

**유지(예정 포함)**: `transactionStore.fetchTransactions`(홈 예정 카드·기록 미래 그룹의 원천),
`getMonthlyBudgetStructure`(내부에서 분리), `exportTransactionsToCSV`.

> 과거 월에는 미래 건이 없으므로 **영향은 현재 월에만** 나타난다.

**A-4. 홈 히어로 보조문구** — `HomePage.tsx`

`25일 남음 · 하루 60,000원` 아래에 `예정 500,000원 포함` (수동예정 + `fixedExpenses`).
예정이 0원이면 표시하지 않는다.

### 이중 차감 검증 (최대 위험 지점)

`HomePage.tsx:225-227`

```
remaining = budgetStatus.remaining + expectedIncome - fixedExpenses
```

- `budgetStatus.remaining` = 예산 − (실지출 + 수동예정 + **선반영된 반복거래**)
- `fixedExpenses` = 내일~월말 반복거래 **미생성 예상분**
- 월초 선반영(#130~#133)된 반복거래는 이미 실거래이므로 `nextExecutionDate`가 다음 달로 이동
  → `getProjectedTransactions`에 안 잡힘 → **이중계상 없음**

식 자체는 유지하고, 테스트로 고정한다.

### 패키지 D — 테스트 (vitest)

1. `isUpcoming` 경계 — 오늘 23:59 / 내일 00:00
2. `selectBudgetStatus` 실/예정 분리 후 `remaining` 불변 (회귀 고정)
3. `getMonthlyBudgetStructure` — 선반영 반복거래 + 수동예정 동시 존재 시 이중계상 없음
4. `getCategoryBreakdown` 실지출만 집계

---

## 4. 작업 순서

**C → B → A → D.** C·B는 독립적이고 즉시 체감되며, A는 테스트를 동반한다.
배포는 한 패키지로 묶는다.

---

## 5. 범위 밖 (제안만)

- `status` 필드 도입 (예정 취소 표현) — 실사용 요구가 나오면 재검토
- 예정 도래일 알림 — 기존 반복거래 알림 인프라(R-10) 재사용 가능
- 분석 탭 '예정 포함' 토글 — #136의 '금액순/예산순' 토글과 같은 방식. 상단 컨트롤이 하나 더 늘어나 보류
