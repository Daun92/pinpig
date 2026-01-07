# MoneyMirror PWA 개발 기획서

> **버전:** 1.0 (MVP)  
> **최종 수정:** 2025-01-07  
> **개발 형태:** Progressive Web App (PWA)

---

## 1. 프로젝트 개요

### 1.1 제품 정의

**MoneyMirror**는 "기록하는 가계부가 아니라, 비춰주는 거울"을 콘셉트로 한 개인 자산 관리 웹앱입니다.

### 1.2 MVP 범위

| 구분 | 포함 | 제외 (v2 이후) |
|------|------|----------------|
| 데이터 입력 | 수동 입력 | 계좌/카드 자동 연동 |
| 저장 방식 | 로컬 (IndexedDB) | 클라우드 동기화 |
| 플랫폼 | PWA (웹앱) | 네이티브 앱 |
| 인증 | 없음 (로컬 전용) | 회원가입/로그인 |

### 1.3 핵심 가치

```
┌─────────────────────────────────────────────┐
│                                             │
│  [간편 입력] → [상태 대시보드] → [소비 인사이트]  │
│       ↓              ↓              ↓       │
│   3-Touch        즉각 확인       행동 유도    │
│                                             │
└─────────────────────────────────────────────┘
```

---

## 2. 기술 스택

### 2.1 Frontend

| 영역 | 기술 | 선정 이유 |
|------|------|----------|
| Framework | **React 18** | 컴포넌트 기반, 생태계 |
| Language | **TypeScript** | 타입 안정성 |
| Styling | **Tailwind CSS** | 유틸리티 기반, 빠른 개발 |
| State | **Zustand** | 경량, 간단한 API |
| Routing | **React Router v6** | SPA 라우팅 |
| Build | **Vite** | 빠른 HMR, 최적화된 빌드 |

### 2.2 PWA 구성

| 영역 | 기술 |
|------|------|
| Service Worker | **Workbox** |
| App Manifest | `manifest.json` |
| 아이콘 | 192x192, 512x512 PNG |
| 오프라인 | Cache-first 전략 |

### 2.3 데이터 저장

| 영역 | 기술 | 용도 |
|------|------|------|
| 메인 DB | **IndexedDB** (Dexie.js) | 거래 내역, 카테고리 |
| 설정 | **localStorage** | 예산, 사용자 설정 |
| 임시 | **sessionStorage** | 입력 중 데이터 |

### 2.4 차트/시각화

| 라이브러리 | 용도 |
|------------|------|
| **Recharts** | 카테고리별 바 차트 |
| CSS Progress Bar | 진행률 바 (커스텀) |

---

## 3. 프로젝트 구조

```
moneymirror/
├── public/
│   ├── manifest.json
│   ├── sw.js
│   ├── icons/
│   │   ├── icon-192.png
│   │   └── icon-512.png
│   └── favicon.ico
│
├── src/
│   ├── main.tsx
│   ├── App.tsx
│   ├── index.css
│   │
│   ├── components/
│   │   ├── common/
│   │   │   ├── Button.tsx
│   │   │   ├── Card.tsx
│   │   │   ├── Icon.tsx
│   │   │   ├── Modal.tsx
│   │   │   ├── ProgressBar.tsx
│   │   │   └── Toast.tsx
│   │   │
│   │   ├── layout/
│   │   │   ├── BottomNav.tsx
│   │   │   ├── Header.tsx
│   │   │   └── FAB.tsx
│   │   │
│   │   ├── home/
│   │   │   ├── BudgetHero.tsx
│   │   │   ├── SpendingProgress.tsx
│   │   │   ├── RecentTransactions.tsx
│   │   │   └── InsightCard.tsx
│   │   │
│   │   ├── transaction/
│   │   │   ├── TransactionList.tsx
│   │   │   ├── TransactionItem.tsx
│   │   │   ├── TransactionDetail.tsx
│   │   │   ├── TransactionForm.tsx
│   │   │   ├── CategoryPicker.tsx
│   │   │   ├── DatePicker.tsx
│   │   │   └── NumPad.tsx
│   │   │
│   │   ├── report/
│   │   │   ├── MonthlySummary.tsx
│   │   │   ├── CategoryChart.tsx
│   │   │   ├── InsightSection.tsx
│   │   │   └── PredictionCard.tsx
│   │   │
│   │   └── settings/
│   │       ├── BudgetSetting.tsx
│   │       ├── CategoryManager.tsx
│   │       ├── NotificationSetting.tsx
│   │       └── DataExport.tsx
│   │
│   ├── pages/
│   │   ├── HomePage.tsx
│   │   ├── HistoryPage.tsx
│   │   ├── ReportPage.tsx
│   │   ├── SettingsPage.tsx
│   │   └── OnboardingPage.tsx
│   │
│   ├── stores/
│   │   ├── transactionStore.ts
│   │   ├── budgetStore.ts
│   │   ├── categoryStore.ts
│   │   └── settingsStore.ts
│   │
│   ├── db/
│   │   ├── index.ts
│   │   ├── transactions.ts
│   │   └── categories.ts
│   │
│   ├── hooks/
│   │   ├── useTransactions.ts
│   │   ├── useBudget.ts
│   │   ├── useInsights.ts
│   │   └── usePrediction.ts
│   │
│   ├── utils/
│   │   ├── format.ts
│   │   ├── date.ts
│   │   ├── calculate.ts
│   │   └── export.ts
│   │
│   ├── types/
│   │   ├── transaction.ts
│   │   ├── category.ts
│   │   └── budget.ts
│   │
│   └── constants/
│       ├── categories.ts
│       ├── colors.ts
│       └── config.ts
│
├── package.json
├── tsconfig.json
├── vite.config.ts
├── tailwind.config.js
└── README.md
```

---

## 4. 데이터 모델

### 4.1 Transaction (거래)

```typescript
interface Transaction {
  id: string;                    // UUID
  amount: number;                // 금액 (양수)
  type: 'income' | 'expense';    // 수입/지출
  categoryId: string;            // 카테고리 ID
  description: string;           // 가맹점명/설명
  memo?: string;                 // 메모 (선택)
  date: string;                  // ISO 날짜 (YYYY-MM-DD)
  time: string;                  // 시간 (HH:mm)
  createdAt: string;             // 생성 시각
  updatedAt: string;             // 수정 시각
}
```

### 4.2 Category (카테고리)

```typescript
interface Category {
  id: string;                    // UUID
  name: string;                  // 카테고리명
  icon: string;                  // 아이콘 이름
  type: 'income' | 'expense';    // 수입/지출 구분
  color: string;                 // 색상 코드
  order: number;                 // 정렬 순서
  isDefault: boolean;            // 기본 카테고리 여부
  isActive: boolean;             // 활성화 여부
}
```

### 4.3 Budget (예산)

```typescript
interface Budget {
  monthlyBudget: number;         // 월 예산
  payday: number;                // 급여일 (1-31)
  startDayOfMonth: number;       // 월 시작일 (1 or 급여일)
}
```

### 4.4 Settings (설정)

```typescript
interface Settings {
  isOnboardingComplete: boolean;
  notifications: {
    enabled: boolean;
    budgetAlert: boolean;        // 예산 80% 알림
    dailyReminder: boolean;      // 일일 기록 리마인더
  };
  display: {
    darkMode: 'system' | 'light' | 'dark';
  };
}
```

### 4.5 기본 카테고리

```typescript
const DEFAULT_EXPENSE_CATEGORIES = [
  { id: 'food', name: '식비', icon: 'utensils' },
  { id: 'cafe', name: '카페', icon: 'coffee' },
  { id: 'transport', name: '교통', icon: 'car' },
  { id: 'shopping', name: '쇼핑', icon: 'shopping-bag' },
  { id: 'housing', name: '주거', icon: 'home' },
  { id: 'health', name: '의료', icon: 'heart-pulse' },
  { id: 'leisure', name: '여가', icon: 'gamepad' },
  { id: 'telecom', name: '통신', icon: 'smartphone' },
  { id: 'etc', name: '기타', icon: 'more-horizontal' },
];

const DEFAULT_INCOME_CATEGORIES = [
  { id: 'salary', name: '급여', icon: 'wallet' },
  { id: 'bonus', name: '보너스', icon: 'gift' },
  { id: 'investment', name: '투자수익', icon: 'trending-up' },
  { id: 'etc-income', name: '기타수입', icon: 'plus-circle' },
];
```

---

## 5. 화면별 개발 명세

### 5.1 온보딩 (`/onboarding`)

**목적:** 최초 실행 시 최소 설정으로 빠른 시작

#### 플로우

```
[웰컴] → [예산 설정] → [완료] → [홈]
```

#### 화면 1: 웰컴

```
┌─────────────────────────────────────┐
│                                     │
│              MoneyMirror            │
│                                     │
│      기록하는 가계부가 아니라         │
│         비춰주는 거울                │
│                                     │
│         [  시작하기  ]              │
│                                     │
└─────────────────────────────────────┘
```

**컴포넌트:**
- 로고/앱명
- 태그라인
- Primary Button

#### 화면 2: 예산 설정

```
┌─────────────────────────────────────┐
│                                     │
│  ←                                  │
│                                     │
│       월 예산을 설정해주세요          │
│                                     │
│         1,500,000원                 │
│                                     │
│  ━━━━━━━━━━━━●━━━━━━━━━━━━          │
│  50만             200만     300만   │
│                                     │
│         [  완료  ]                  │
│                                     │
└─────────────────────────────────────┘
```

**컴포넌트:**
- Slider (50만 ~ 300만, 10만 단위)
- 직접 입력 옵션
- Primary Button

**데이터 저장:**
```typescript
localStorage.setItem('budget', JSON.stringify({
  monthlyBudget: 1500000,
  payday: 25,
  startDayOfMonth: 1
}));
localStorage.setItem('isOnboardingComplete', 'true');
```

---

### 5.2 홈 대시보드 (`/`)

**목적:** 앱 실행 즉시 핵심 정보 파악

#### 와이어프레임

```
┌─────────────────────────────────────┐
│  [Status Bar]                       │
│                                     │
│              1월                    │
│                                     │
│           847,000원                 │
│        이번 달 쓸 수 있는 돈          │
│                                     │
│  ━━━━━━━━━━━━━━━━━○━━━━━━━━━        │
│                                     │
│     15일 남음 · 하루 56,000원        │
│                                     │
├─────────────────────────────────────┤
│                                     │
│  최근 거래                           │
│                                     │
│  ☕ 스타벅스           오늘 14:32    │
│                         4,500원     │
│  ─────────────────────────────      │
│  🛒 쿠팡               오늘 11:20    │
│                        32,000원     │
│  ─────────────────────────────      │
│  💰 급여               어제          │
│                    + 3,000,000원    │
│                                     │
│            모두 보기 →              │
│                                     │
├─────────────────────────────────────┤
│  💡 이번 주 인사이트                  │
│  ┌─────────────────────────────┐   │
│  │ 식비가 평소보다 2만원 많아요   │   │
│  └─────────────────────────────┘   │
│                                     │
│             [  ➕  ]                │
├─────────────────────────────────────┤
│  [🏠]      [📋]      [📊]      [⚙️]  │
└─────────────────────────────────────┘
```

#### 컴포넌트 명세

**BudgetHero**
```typescript
interface BudgetHeroProps {
  remainingBudget: number;      // 잔여 예산
  currentMonth: string;         // 현재 월 (1월)
}
```

**SpendingProgress**
```typescript
interface SpendingProgressProps {
  spent: number;                // 지출 금액
  budget: number;               // 예산
  daysRemaining: number;        // 남은 일수
  dailyRecommended: number;     // 일평균 권장액
}

// 상태 계산
const getStatus = (spent: number, recommended: number) => {
  const ratio = spent / recommended;
  if (ratio < 1) return 'safe';
  if (ratio < 1.2) return 'caution';
  return 'danger';
};
```

**RecentTransactions**
```typescript
interface RecentTransactionsProps {
  transactions: Transaction[];  // 최근 3건
  onViewAll: () => void;
  onItemClick: (id: string) => void;
}
```

**InsightCard**
```typescript
interface InsightCardProps {
  message: string;
  onClick: () => void;
}
```

#### 계산 로직

```typescript
// 잔여 예산
const remainingBudget = budget - totalExpenseThisMonth;

// 일평균 권장 지출
const daysInMonth = getDaysInMonth(currentMonth);
const daysPassed = getCurrentDayOfMonth();
const daysRemaining = daysInMonth - daysPassed;
const dailyRecommended = remainingBudget / daysRemaining;

// 소비 진행률 (권장선 대비)
const recommendedSpent = (budget / daysInMonth) * daysPassed;
const progressRatio = totalExpenseThisMonth / recommendedSpent;
```

---

### 5.3 거래 입력 (Modal)

**진입:** FAB (+) 버튼 탭

#### 와이어프레임

```
┌─────────────────────────────────────┐
│                                     │
│  ✕                          저장    │
│                                     │
│     [ 지출 ]  [ 수입 ]              │
│                                     │
│              45,000                 │
│               원                    │
│                                     │
│  ─────────────────────────────      │
│                                     │
│  🍽️ 식비   ☕ 카페   🚗 교통   ···   │
│                                     │
│  ─────────────────────────────      │
│                                     │
│  📅 오늘 (1월 7일)              →   │
│  📝 메모 추가                    →   │
│                                     │
├─────────────────────────────────────┤
│                                     │
│  ┌─────┬─────┬─────┐              │
│  │  1  │  2  │  3  │              │
│  ├─────┼─────┼─────┤              │
│  │  4  │  5  │  6  │              │
│  ├─────┼─────┼─────┤              │
│  │  7  │  8  │  9  │              │
│  ├─────┼─────┼─────┤              │
│  │  00 │  0  │  ⌫  │              │
│  └─────┴─────┴─────┘              │
│                                     │
└─────────────────────────────────────┘
```

#### 컴포넌트 명세

**TransactionForm**
```typescript
interface TransactionFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (transaction: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>) => void;
  editTransaction?: Transaction;  // 수정 시
}

interface FormState {
  type: 'income' | 'expense';
  amount: number;
  categoryId: string;
  date: string;
  time: string;
  description: string;
  memo: string;
}
```

**NumPad**
```typescript
interface NumPadProps {
  value: string;
  onChange: (value: string) => void;
  maxLength?: number;  // 기본 9자리
}

// 키 배열
const KEYS = [
  ['1', '2', '3'],
  ['4', '5', '6'],
  ['7', '8', '9'],
  ['00', '0', 'backspace'],
];
```

**CategoryPicker**
```typescript
interface CategoryPickerProps {
  categories: Category[];
  selectedId: string;
  onSelect: (id: string) => void;
}
```

#### 기본값 로직

```typescript
const getDefaultCategory = (type: 'income' | 'expense') => {
  if (type === 'income') return 'salary';
  
  const hour = new Date().getHours();
  if (hour >= 11 && hour < 14) return 'food';      // 점심
  if (hour >= 7 && hour < 10) return 'transport';  // 출근
  if (hour >= 18 && hour < 21) return 'food';      // 저녁
  return 'etc';
};
```

---

### 5.4 내역 (`/history`)

**목적:** 전체 거래 내역 조회 및 관리

#### 와이어프레임

```
┌─────────────────────────────────────┐
│  내역                    🔍         │
│                                     │
│  ┌─────────────────────────────┐   │
│  │ 1월 ▾ │ 전체 ▾              │   │
│  └─────────────────────────────┘   │
│                                     │
│  오늘                    -36,500원  │
│  ─────────────────────────────      │
│  ☕ 스타벅스                14:32   │
│     카페                     4,500원│
│  ─────────────────────────────      │
│  🛒 쿠팡                   11:20   │
│     쇼핑                   32,000원 │
│                                     │
│  어제                 +2,972,000원  │
│  ─────────────────────────────      │
│  💰 급여                           │
│     급여              + 3,000,000원 │
│  ─────────────────────────────      │
│  🍽️ 이태원파스타           19:42   │
│     식비                   28,000원 │
│                                     │
├─────────────────────────────────────┤
│  [🏠]      [📋]      [📊]      [⚙️]  │
└─────────────────────────────────────┘
```

#### 컴포넌트 명세

**TransactionList**
```typescript
interface TransactionListProps {
  transactions: Transaction[];
  groupBy: 'date';  // 날짜별 그룹핑
  onItemClick: (id: string) => void;
  onItemDelete: (id: string) => void;
}

// 그룹핑 유틸
const groupByDate = (transactions: Transaction[]) => {
  return transactions.reduce((groups, tx) => {
    const date = tx.date;
    if (!groups[date]) groups[date] = [];
    groups[date].push(tx);
    return groups;
  }, {} as Record<string, Transaction[]>);
};
```

**Filter**
```typescript
interface FilterState {
  month: string;           // 'YYYY-MM'
  categoryId: string | 'all';
}
```

#### 스와이프 삭제

```typescript
// react-swipeable 사용
const handlers = useSwipeable({
  onSwipedLeft: () => setShowDelete(true),
  onSwipedRight: () => setShowDelete(false),
  trackMouse: true,
});
```

---

### 5.5 거래 상세 (Modal)

**진입:** 거래 아이템 탭

```
┌─────────────────────────────────────┐
│                                     │
│  ←                          삭제    │
│                                     │
│              ☕                      │
│           스타벅스                   │
│                                     │
│           4,500원                   │
│                                     │
├─────────────────────────────────────┤
│                                     │
│  카테고리        카페              →│
│  ─────────────────────────────      │
│  날짜           2025.01.07 14:32  →│
│  ─────────────────────────────      │
│  메모           (없음)             →│
│                                     │
├─────────────────────────────────────┤
│                                     │
│           [  수정하기  ]            │
│                                     │
└─────────────────────────────────────┘
```

---

### 5.6 리포트 (`/report`)

**목적:** 월간 소비 분석 및 인사이트

#### 와이어프레임

```
┌─────────────────────────────────────┐
│  리포트              ◀ 1월 ▶        │
│                                     │
├─────────────────────────────────────┤
│                                     │
│  이번 달 총 지출                     │
│                                     │
│         1,253,000원                 │
│                                     │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━        │
│  예산 대비 83%                       │
│                                     │
├─────────────────────────────────────┤
│                                     │
│  카테고리별                          │
│                                     │
│  🍽️ 식비                   420,000원│
│  ━━━━━━━━━━━━━━━━━━━━              │
│                                     │
│  🏠 주거                   350,000원│
│  ━━━━━━━━━━━━━━━━━                 │
│                                     │
│  🛒 쇼핑                   185,000원│
│  ━━━━━━━━━━━━                      │
│                                     │
│  ☕ 카페                    98,000원│
│  ━━━━━━━━                          │
│                                     │
│  기타                      200,000원│
│  ━━━━━━━━━━                        │
│                                     │
├─────────────────────────────────────┤
│                                     │
│  💡 인사이트                         │
│                                     │
│  지난달 대비 식비가 2만원 늘었어요     │
│                                     │
├─────────────────────────────────────┤
│                                     │
│  📈 예측                            │
│                                     │
│  월말 예상 잔액        약 147,000원  │
│                                     │
├─────────────────────────────────────┤
│  [🏠]      [📋]      [📊]      [⚙️]  │
└─────────────────────────────────────┘
```

#### 컴포넌트 명세

**MonthlySummary**
```typescript
interface MonthlySummaryProps {
  totalExpense: number;
  budget: number;
  month: string;
}
```

**CategoryChart**
```typescript
interface CategoryChartProps {
  data: {
    categoryId: string;
    categoryName: string;
    icon: string;
    amount: number;
    percentage: number;
  }[];
  onCategoryClick: (categoryId: string) => void;
}
```

**InsightSection**
```typescript
interface InsightSectionProps {
  insights: Insight[];
}

interface Insight {
  type: 'increase' | 'decrease' | 'new' | 'achievement';
  category: string;
  message: string;
  amount?: number;
  percentage?: number;
}
```

#### 인사이트 생성 로직

```typescript
const generateInsights = (
  currentMonth: Transaction[],
  previousMonth: Transaction[]
): Insight[] => {
  const insights: Insight[] = [];
  
  // 카테고리별 비교
  const currentByCategory = groupByCategory(currentMonth);
  const previousByCategory = groupByCategory(previousMonth);
  
  for (const [categoryId, currentAmount] of Object.entries(currentByCategory)) {
    const previousAmount = previousByCategory[categoryId] || 0;
    const diff = currentAmount - previousAmount;
    const percentage = previousAmount > 0 
      ? Math.round((diff / previousAmount) * 100) 
      : 100;
    
    if (Math.abs(percentage) >= 20) {
      insights.push({
        type: diff > 0 ? 'increase' : 'decrease',
        category: categoryId,
        message: `지난달 대비 ${Math.abs(percentage)}% ${diff > 0 ? '증가' : '감소'}`,
        amount: Math.abs(diff),
        percentage,
      });
    }
  }
  
  return insights.slice(0, 3);  // 최대 3개
};
```

---

### 5.7 설정 (`/settings`)

**목적:** 앱 개인화 및 데이터 관리

#### 와이어프레임

```
┌─────────────────────────────────────┐
│  설정                               │
│                                     │
├─────────────────────────────────────┤
│                                     │
│  예산                               │
│  ─────────────────────────────      │
│  월 예산             1,500,000원  → │
│  ─────────────────────────────      │
│  급여일                    25일   → │
│                                     │
│  카테고리                           │
│  ─────────────────────────────      │
│  카테고리 관리                    → │
│                                     │
│  데이터                             │
│  ─────────────────────────────      │
│  데이터 내보내기 (CSV)            → │
│  ─────────────────────────────      │
│  모든 데이터 삭제                  → │
│                                     │
│  화면                               │
│  ─────────────────────────────      │
│  다크 모드                시스템  → │
│                                     │
│  정보                               │
│  ─────────────────────────────      │
│  버전                       1.0.0   │
│                                     │
├─────────────────────────────────────┤
│  [🏠]      [📋]      [📊]      [⚙️]  │
└─────────────────────────────────────┘
```

#### 기능 명세

**예산 설정**
- 월 예산 변경 (슬라이더 + 직접 입력)
- 급여일 설정 (1-31일)

**카테고리 관리**
- 카테고리 순서 변경 (드래그)
- 카테고리 추가/수정/삭제
- 기본 카테고리는 삭제 불가, 비활성화만 가능

**데이터 내보내기**
```typescript
const exportToCSV = (transactions: Transaction[]) => {
  const headers = ['날짜', '시간', '유형', '카테고리', '금액', '설명', '메모'];
  const rows = transactions.map(tx => [
    tx.date,
    tx.time,
    tx.type === 'income' ? '수입' : '지출',
    getCategoryName(tx.categoryId),
    tx.amount,
    tx.description,
    tx.memo || '',
  ]);
  
  const csv = [headers, ...rows]
    .map(row => row.join(','))
    .join('\n');
  
  downloadFile(csv, `moneymirror_${formatDate(new Date())}.csv`);
};
```

**데이터 삭제**
- 확인 모달 2단계 (실수 방지)
- IndexedDB 전체 초기화
- localStorage 초기화

---

## 6. PWA 설정

### 6.1 manifest.json

```json
{
  "name": "MoneyMirror",
  "short_name": "머니미러",
  "description": "기록하는 가계부가 아니라, 비춰주는 거울",
  "start_url": "/",
  "display": "standalone",
  "orientation": "portrait",
  "background_color": "#FAF9F7",
  "theme_color": "#1C1B1A",
  "icons": [
    {
      "src": "/icons/icon-192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/icons/icon-512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any maskable"
    }
  ]
}
```

### 6.2 Service Worker (Workbox)

```typescript
// vite.config.ts
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365, // 1년
              },
            },
          },
        ],
      },
    }),
  ],
});
```

### 6.3 오프라인 지원

- 모든 정적 자산 캐싱
- IndexedDB 로컬 저장으로 오프라인 완전 지원
- 네트워크 불필요 (v1은 서버 통신 없음)

---

## 7. 디자인 토큰 (Tailwind)

```javascript
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        paper: {
          white: '#FAF9F7',
          light: '#F5F4F1',
          mid: '#ECEAE6',
        },
        ink: {
          black: '#1C1B1A',
          dark: '#3D3C3A',
          mid: '#6B6966',
          light: '#9C9A96',
        },
        semantic: {
          positive: '#4A7C59',
          caution: '#8B7355',
        },
      },
      fontFamily: {
        sans: ['Pretendard', '-apple-system', 'sans-serif'],
        number: ['SF Pro Display', 'Roboto', 'system-ui'],
      },
      fontSize: {
        hero: ['40px', { lineHeight: '1.2', fontWeight: '300' }],
        amount: ['20px', { lineHeight: '1.4', fontWeight: '400' }],
        title: ['18px', { lineHeight: '1.4', fontWeight: '500' }],
        body: ['15px', { lineHeight: '1.6', fontWeight: '400' }],
        sub: ['13px', { lineHeight: '1.5', fontWeight: '400' }],
        caption: ['11px', { lineHeight: '1.4', fontWeight: '400' }],
      },
      spacing: {
        xs: '8px',
        sm: '16px',
        md: '24px',
        lg: '32px',
        xl: '48px',
      },
      borderRadius: {
        sm: '8px',
        md: '12px',
      },
    },
  },
};
```

---

## 8. IndexedDB 스키마 (Dexie.js)

```typescript
// db/index.ts
import Dexie, { Table } from 'dexie';
import { Transaction, Category } from '@/types';

class MoneyMirrorDB extends Dexie {
  transactions!: Table<Transaction>;
  categories!: Table<Category>;

  constructor() {
    super('MoneyMirrorDB');
    
    this.version(1).stores({
      transactions: '++id, date, type, categoryId, createdAt',
      categories: '++id, type, order, isActive',
    });
  }
}

export const db = new MoneyMirrorDB();

// 초기 카테고리 시딩
export const seedDefaultCategories = async () => {
  const count = await db.categories.count();
  if (count === 0) {
    await db.categories.bulkAdd(DEFAULT_CATEGORIES);
  }
};
```

---

## 9. 상태 관리 (Zustand)

```typescript
// stores/transactionStore.ts
import { create } from 'zustand';
import { db } from '@/db';
import { Transaction } from '@/types';

interface TransactionStore {
  transactions: Transaction[];
  isLoading: boolean;
  
  // Actions
  fetchTransactions: (month: string) => Promise<void>;
  addTransaction: (tx: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateTransaction: (id: string, tx: Partial<Transaction>) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
}

export const useTransactionStore = create<TransactionStore>((set, get) => ({
  transactions: [],
  isLoading: false,

  fetchTransactions: async (month) => {
    set({ isLoading: true });
    const startDate = `${month}-01`;
    const endDate = `${month}-31`;
    
    const transactions = await db.transactions
      .where('date')
      .between(startDate, endDate)
      .reverse()
      .sortBy('date');
    
    set({ transactions, isLoading: false });
  },

  addTransaction: async (txData) => {
    const now = new Date().toISOString();
    const transaction: Transaction = {
      ...txData,
      id: crypto.randomUUID(),
      createdAt: now,
      updatedAt: now,
    };
    
    await db.transactions.add(transaction);
    set({ transactions: [transaction, ...get().transactions] });
  },

  updateTransaction: async (id, updates) => {
    const now = new Date().toISOString();
    await db.transactions.update(id, { ...updates, updatedAt: now });
    
    set({
      transactions: get().transactions.map(tx =>
        tx.id === id ? { ...tx, ...updates, updatedAt: now } : tx
      ),
    });
  },

  deleteTransaction: async (id) => {
    await db.transactions.delete(id);
    set({
      transactions: get().transactions.filter(tx => tx.id !== id),
    });
  },
}));
```

```typescript
// stores/budgetStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Budget } from '@/types';

interface BudgetStore extends Budget {
  setBudget: (budget: Partial<Budget>) => void;
}

export const useBudgetStore = create<BudgetStore>()(
  persist(
    (set) => ({
      monthlyBudget: 1500000,
      payday: 25,
      startDayOfMonth: 1,
      
      setBudget: (budget) => set((state) => ({ ...state, ...budget })),
    }),
    {
      name: 'budget-storage',
    }
  )
);
```

---

## 10. 유틸리티 함수

```typescript
// utils/format.ts
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('ko-KR').format(amount) + '원';
};

export const formatDate = (date: Date | string): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('ko-KR', {
    month: 'long',
    day: 'numeric',
  });
};

export const formatTime = (time: string): string => {
  return time; // HH:mm
};

export const getRelativeDate = (date: string): string => {
  const today = new Date().toISOString().split('T')[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
  
  if (date === today) return '오늘';
  if (date === yesterday) return '어제';
  return formatDate(date);
};
```

```typescript
// utils/calculate.ts
export const calculateRemainingBudget = (
  budget: number,
  expenses: Transaction[]
): number => {
  const totalExpense = expenses
    .filter(tx => tx.type === 'expense')
    .reduce((sum, tx) => sum + tx.amount, 0);
  
  return budget - totalExpense;
};

export const calculateDailyRecommended = (
  remainingBudget: number,
  daysRemaining: number
): number => {
  if (daysRemaining <= 0) return 0;
  return Math.floor(remainingBudget / daysRemaining);
};

export const getDaysRemainingInMonth = (): number => {
  const now = new Date();
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  return lastDay - now.getDate();
};
```

---

## 11. 개발 우선순위 및 일정

### Phase 1: 핵심 기능 (1주)

| 순서 | 작업 | 예상 시간 |
|------|------|----------|
| 1 | 프로젝트 셋업 (Vite, React, Tailwind, PWA) | 2h |
| 2 | 디자인 시스템 구축 (토큰, 공통 컴포넌트) | 4h |
| 3 | IndexedDB 셋업 (Dexie) | 2h |
| 4 | 상태 관리 셋업 (Zustand) | 2h |
| 5 | 온보딩 플로우 | 3h |
| 6 | 홈 대시보드 | 6h |
| 7 | 거래 입력 모달 | 6h |
| 8 | 거래 내역 리스트 | 4h |

### Phase 2: 부가 기능 (3-4일)

| 순서 | 작업 | 예상 시간 |
|------|------|----------|
| 9 | 거래 상세/수정/삭제 | 3h |
| 10 | 리포트 페이지 | 6h |
| 11 | 설정 페이지 | 4h |
| 12 | 카테고리 관리 | 3h |
| 13 | CSV 내보내기 | 2h |

### Phase 3: 마무리 (2-3일)

| 순서 | 작업 | 예상 시간 |
|------|------|----------|
| 14 | 다크모드 지원 | 3h |
| 15 | 반응형 최적화 | 2h |
| 16 | PWA 최적화 (아이콘, 스플래시) | 2h |
| 17 | 테스트 및 버그 수정 | 4h |
| 18 | 배포 (Vercel/Netlify) | 1h |

**총 예상 개발 기간: 약 2주**

---

## 12. 기술적 결정 사항

### 12.1 왜 React?

- 팀 친숙도
- 풍부한 생태계
- PWA 지원 용이

### 12.2 왜 IndexedDB?

- 대용량 데이터 저장 (localStorage 5MB 제한)
- 인덱싱을 통한 빠른 쿼리
- 오프라인 완전 지원

### 12.3 왜 Zustand?

- Redux 대비 보일러플레이트 최소
- TypeScript 친화적
- 번들 사이즈 작음 (2KB)

### 12.4 왜 Tailwind?

- 유틸리티 기반 빠른 개발
- 디자인 토큰 통합 용이
- 번들 사이즈 최적화 (PurgeCSS)

---

## 13. 미구현 사항 (v2 로드맵)

| 기능 | 이유 | 예정 버전 |
|------|------|----------|
| 계좌/카드 자동 연동 | 오픈뱅킹 인증 필요 | v2.0 |
| 클라우드 동기화 | 서버 인프라 필요 | v2.0 |
| 회원가입/로그인 | 동기화 전제 필요 | v2.0 |
| 알림 푸시 | Service Worker 고도화 필요 | v1.5 |
| 위젯 | 네이티브 연동 필요 | v2.0 |
| AI 대화형 입력 | LLM API 비용 | v2.0 |

---

## 14. 리스크 및 대응

| 리스크 | 영향 | 대응 |
|--------|------|------|
| IndexedDB 용량 제한 | 장기 사용 시 데이터 손실 | 오래된 데이터 아카이브 기능, v2에서 클라우드 백업 |
| 브라우저 호환성 | iOS Safari 이슈 | 지원 브라우저 명시, 폴리필 적용 |
| PWA 설치율 저조 | 리텐션 하락 | 설치 유도 배너, 이점 안내 |
| 수동 입력 이탈 | DAU 하락 | 입력 UX 최적화, v2 자동화 |

---

## 부록: 체크리스트

### 개발 전

- [ ] Figma 디자인 확정
- [ ] API 명세 (해당 없음 - v1은 로컬 전용)
- [ ] 환경 변수 정의

### 개발 중

- [ ] 컴포넌트 스토리북 작성 (선택)
- [ ] 단위 테스트 작성 (선택)
- [ ] 접근성 체크 (색상 대비, 키보드 네비게이션)

### 배포 전

- [ ] Lighthouse 점수 확인 (PWA, Performance, A11y)
- [ ] 크로스 브라우저 테스트 (Chrome, Safari, Samsung Internet)
- [ ] 실기기 테스트 (iOS, Android)
- [ ] 메타 태그 확인 (OG, Twitter Card)

---

*끝.*
