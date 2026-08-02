# 예산 현황 기능 개선 계획

> **목표**: 기존 앱 철학과 디자인 일관성을 유지하면서 카테고리별/결제수단별 예산 대비 현황 확인 및 액션 연결 기능 추가

---

## 앱 철학 준수 사항

| 원칙 | 적용 방법 |
|------|-----------|
| "얼마나 남았지?" | 예산 대비도 "남은 금액" 관점으로 표현 |
| 1초 확인 | 기존 UI에 정보 추가, 새 페이지 최소화 |
| 3터치 기록 | 액션 연결도 최소 터치로 |
| 판단 없는 비춤 | "초과" → "예산의 105%를 사용했어요" |
| 소비 = 관심 | 카테고리 예산 = "관심 배분" 관점 |

---

## Phase 1: StatsPage 카테고리/수단 리스트에 예산 정보 추가

### 1.1 카테고리 리스트 개선 (StatsPage)

**현재 상태:**
```
🍚 식비                                         702,000원
━━━━━━━━━━━━━━━━━━━━━━━━ (전체의 35%)
12건
```

**개선 후:**
```
🍚 식비                                         702,000원
━━━━━━━━━━━━━━━━━━━━━━━━ (전체의 35%)
12건 · 예산의 78%                                   [→]
```

**변경 사항:**
- `CategorySummary` 타입에 `budget`, `budgetPercent` 필드 추가 (기존 PaymentMethodSummary 패턴 참고)
- `getCategoryBreakdown()` 쿼리에서 카테고리 예산 정보 포함
- StatsPage 카테고리 리스트 항목에 예산 대비 % 표시

**파일 변경:**
- `src/types/index.ts` - CategorySummary 타입 확장
- `src/services/queries.ts` - getCategoryBreakdown 수정
- `src/pages/StatsPage.tsx` - 카테고리 리스트 UI 수정

### 1.2 결제수단 리스트 개선 (StatsPage)

**현재 상태:**
- 이미 `budgetPercent` 표시 중 (부분적)
- 한도 설정된 경우만 표시

**개선 후:**
- 한도 미설정 수단에 [설정] 링크 추가
- 한도 90% 이상 시 시각적 강조 (⚠️ 아이콘)

**파일 변경:**
- `src/pages/StatsPage.tsx` - 수단 리스트 UI 수정

### 1.3 공통 유틸 함수

**신규 파일:** `src/utils/budgetStatus.ts`

```typescript
type BudgetLevel = 'normal' | 'caution' | 'warning' | 'danger';

function getBudgetLevel(percentUsed: number): BudgetLevel;
function getBudgetMessage(percentUsed: number, context: 'category' | 'paymentMethod'): string;
```

---

## Phase 2: Drill-down 모달 확장 (교차 분석)

### 2.1 CategoryTrendModal 확장

**현재 구조:**
```
┌─────────────────────────────────────────────────────────────┐
│  🍚 식비                                              ✕    │
│  최근 6개월 추이                                           │
├─────────────────────────────────────────────────────────────┤
│  [차트]                                                     │
│  월 평균: XXX원  |  최고 지출: X월                          │
│  ── 1월 지출 TOP5 ──                                       │
│  ...                                                        │
└─────────────────────────────────────────────────────────────┘
```

**개선 후:**
```
┌─────────────────────────────────────────────────────────────┐
│  🍚 식비                                              ✕    │
│  최근 6개월 추이                                           │
├─────────────────────────────────────────────────────────────┤
│  1월 식비: 702,000원                                       │
│  예산 900,000원 중 78%                                      │
│  ━━━━━━━━━━━━━━━━━━░░░░                                    │
│                                                             │
│  ── 결제수단별 ──                           ← 신규 섹션    │
│  💳 신용카드    450,000원 (64%)                            │
│  🏦 체크카드    180,000원 (26%)                            │
│  💵 현금         72,000원 (10%)                            │
│                                                             │
│  [차트]                                                     │
│  ...                                                        │
│                                                             │
│           [내역 보기]   [예산 조정]        ← 신규 액션      │
└─────────────────────────────────────────────────────────────┘
```

**변경 사항:**
- 모달 상단에 예산 대비 프로그레스 바 추가
- "결제수단별" breakdown 섹션 추가
- 하단에 액션 링크 추가 (담담한 텍스트 링크 스타일)

**신규 쿼리:**
```typescript
// 특정 카테고리의 결제수단별 breakdown
async function getCategoryPaymentBreakdown(
  year: number,
  month: number,
  categoryId: string
): Promise<PaymentBreakdownItem[]>
```

**파일 변경:**
- `src/services/queries.ts` - getCategoryPaymentBreakdown 추가
- `src/components/report/CategoryTrendModal.tsx` - UI 확장

### 2.2 PaymentMethodTrendModal 확장

**동일한 패턴으로:**
- 모달 상단에 한도 대비 프로그레스 바 추가
- "카테고리별" breakdown 섹션 추가
- 하단에 액션 링크 추가

**신규 쿼리:**
```typescript
// 특정 결제수단의 카테고리별 breakdown
async function getPaymentMethodCategoryBreakdown(
  year: number,
  month: number,
  paymentMethodId: string
): Promise<CategoryBreakdownItem[]>
```

**파일 변경:**
- `src/services/queries.ts` - getPaymentMethodCategoryBreakdown 추가
- `src/components/report/PaymentMethodTrendModal.tsx` - UI 확장

---

## Phase 3: 홈 InsightCard에 예산 배분 현황 슬라이드 추가

### 3.1 BudgetOverviewInsight 컴포넌트 신규 생성

**디자인 (기존 CautionInsight 패턴 따름):**
```
┌─────────────────────────────────────────────────────────────┐
│  예산 배분 현황                                  [자세히]   │
├─────────────────────────────────────────────────────────────┤
│  🍚 식비    ████████░░ 78%                                 │
│  🚗 교통    ██████████ 102%                                │
│  🛍️ 쇼핑    █████░░░░░ 52%                                 │
├─────────────────────────────────────────────────────────────┤
│  3개 카테고리 중 1개가 예산을 넘었어요                      │
└─────────────────────────────────────────────────────────────┘
```

**파일 생성:**
- `src/components/home/insights/BudgetOverviewInsight.tsx`

### 3.2 InsightCard 위젯 타입 추가

**변경 사항:**
- `InsightWidgetType`에 `'budget-overview'` 추가
- `InsightCard.tsx`의 `renderWidget()`에 케이스 추가
- 기본 위젯 목록에 포함

**파일 변경:**
- `src/types/index.ts` - InsightWidgetType 확장
- `src/components/home/InsightCard.tsx` - renderWidget 케이스 추가

### 3.3 InsightSettingsPage 위젯 설정 추가

**파일 변경:**
- `src/pages/InsightSettingsPage.tsx` - 새 위젯 옵션 추가

---

## Phase 4: 결제수단 한도 설정 UI 추가

### 4.1 PaymentMethodEditPage 확장

**현재 구조:**
- 이름, 아이콘, 색상 설정만 있음

**개선 후:**
- "월 한도 (선택)" 필드 추가
- 금액 입력 (NumberInput 패턴 사용)

**파일 변경:**
- `src/pages/PaymentMethodEditPage.tsx` - budget 필드 추가

### 4.2 PaymentMethodManagePage에서 한도 표시

**현재 상태:**
- 이름, 아이콘만 표시

**개선 후:**
- 한도 설정된 경우 작은 텍스트로 표시
- 예: "월 한도: 1,000,000원"

**파일 변경:**
- `src/pages/PaymentMethodManagePage.tsx` - 한도 표시 추가

---

## 파일 변경 요약

### 신규 파일
| 파일 | 설명 |
|------|------|
| `src/utils/budgetStatus.ts` | 예산 상태 계산 유틸 |
| `src/components/home/insights/BudgetOverviewInsight.tsx` | 예산 배분 인사이트 카드 |

### 수정 파일
| 파일 | 변경 내용 |
|------|-----------|
| `src/types/index.ts` | CategorySummary 확장, InsightWidgetType 추가 |
| `src/services/queries.ts` | 교차 분석 쿼리 2개 추가, getCategoryBreakdown 수정 |
| `src/pages/StatsPage.tsx` | 카테고리/수단 리스트에 예산 정보 추가 |
| `src/components/report/CategoryTrendModal.tsx` | 예산 바 + 수단별 breakdown + 액션 |
| `src/components/report/PaymentMethodTrendModal.tsx` | 한도 바 + 카테고리별 breakdown + 액션 |
| `src/components/home/InsightCard.tsx` | budget-overview 위젯 렌더링 |
| `src/components/home/insights/index.ts` | BudgetOverviewInsight export |
| `src/pages/InsightSettingsPage.tsx` | 새 위젯 옵션 추가 |
| `src/pages/PaymentMethodEditPage.tsx` | 월 한도 필드 추가 |
| `src/pages/PaymentMethodManagePage.tsx` | 한도 표시 추가 |

---

## 디자인 패턴 준수

### 색상
- 프로그레스 바: `bg-paper-mid` (배경), 카테고리/수단 고유색 (진행)
- 100% 초과 시: `#EF4444` (기존 CautionInsight 패턴)
- 텍스트: `text-ink-mid`, `text-ink-light` (담담한 톤)

### 타이포그래피
- 예산 %: `text-caption text-ink-mid`
- 안내 문구: `text-caption text-ink-light`
- 액션 링크: `text-sub text-ink-mid underline` (담담하게)

### 컴포넌트 패턴
- 프로그레스 바: `h-1.5 bg-paper-mid rounded-full overflow-hidden`
- 모달: 기존 CategoryTrendModal 패턴 100% 준수
- 인사이트 카드: InsightCardWrapper 사용

### 액션 스타일 (담담하게)
```tsx
// ❌ 압박감
<button className="bg-red-500 text-white px-4 py-2">
  지금 조정하기!
</button>

// ✅ 담담하게
<button className="text-sub text-ink-mid underline">
  조정
</button>
```

---

## 구현 순서

1. **Phase 1.3** - 공통 유틸 (`budgetStatus.ts`) 먼저 생성
2. **Phase 1.1** - types, queries 수정 후 StatsPage 카테고리 리스트 개선
3. **Phase 1.2** - StatsPage 수단 리스트 개선
4. **Phase 2.1** - 교차 분석 쿼리 추가 + CategoryTrendModal 확장
5. **Phase 2.2** - PaymentMethodTrendModal 확장
6. **Phase 3** - BudgetOverviewInsight 생성 + InsightCard 연동
7. **Phase 4** - 결제수단 한도 설정 UI

---

## 검증 항목

- [ ] 예산 미설정 카테고리에서는 예산 정보 표시 안 함
- [ ] 한도 미설정 결제수단에서는 한도 정보 표시 안 함
- [ ] 다크모드에서 가시성 확인
- [ ] 기존 기능 회귀 없음
- [ ] 앱 톤 일관성 (판단 없는 중립적 표현)
