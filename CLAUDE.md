# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

## 최우선 지침: 작업일지 기록

> **모든 작업은 반드시 WORKLOG.md에 기록합니다.**

### 작업 시작 전
1. WORKLOG.md를 읽고 이전 작업 맥락 파악
2. 새 작업 항목 생성 (요청사항, 작업 전 상태 기록)

### 작업 완료 후
1. 반영사항 기록 (변경 파일 목록 포함)
2. 작업 후 상태 기록
3. 피드백 대기 또는 후속 작업 명시

### 작업일지 형식
```markdown
### #N 작업 제목
- **요청**: 한 줄 요약
- **변경**: 변경된 파일/내용
- **결과**: 완료 상태
- **피드백**: 있을 경우 (→ 후속 작업 번호)
```

---

## Project Overview

**PinPig** - A personal budgeting PWA focused on "how much is left?" rather than "how much did I spend?"

- **Concept**: 금융앱이 아닌 일상앱 (everyday app, not a financial app)
- **Philosophy**: "기록하는 가계부가 아니라, 비춰주는 거울" (A mirror, not a ledger)
- **Roadmap**: Phase 1: PWA → Phase 2: Capacitor iOS

## Development Commands

```bash
# Install dependencies
npm install

# Development server (http://localhost:5173)
npm run dev

# Type checking
npm run type-check

# Linting
npm run lint
npm run lint:fix

# Build for production
npm run build

# Preview production build
npm run preview

# Run tests
npm run test
npm run test:coverage
```

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | React 18 + TypeScript (strict) |
| Styling | Tailwind CSS |
| State | Zustand (with devtools) |
| Routing | React Router v6 |
| Build | Vite |
| Local DB | Dexie.js (IndexedDB) |
| Icons | Lucide React |
| Charts | Recharts |
| Date | date-fns |
| PWA | vite-plugin-pwa + Workbox |
| Testing | Vitest |

### Path Alias

Use `@/` to reference `src/` directory:
```typescript
import { db } from '@/services/database';
import type { Transaction } from '@/types';
```

## Architecture

### Data Flow

```
UI Components → Zustand Stores → Dexie.js (IndexedDB)
                     ↓
              Services/Database layer
```

### Key Directories

- `src/services/database.ts` - Dexie schema, initialization, queries
- `src/stores/` - Zustand stores with devtools middleware
- `src/types/index.ts` - All TypeScript interfaces and default data
- `src/pages/` - Route-level components
- `src/components/` - Organized by domain (home, transaction, report, settings)

### Dexie Database Schema

```typescript
// src/services/database.ts
transactions: 'id, type, categoryId, paymentMethodId, date, createdAt'
categories: 'id, type, name, order'
paymentMethods: 'id, name, order'
settings: 'id'
```

Database initializes with default categories and payment methods on first run.

### Zustand Store Pattern

```typescript
// Standard store structure
interface SomeStore {
  // State
  items: Item[];
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchItems: () => Promise<void>;
  addItem: (input: CreateItemInput) => Promise<Item>;
}

export const useStore = create<SomeStore>()(
  devtools((set, get) => ({ ... }), { name: 'StoreName' })
);
```

## Core Types

Key interfaces in `src/types/index.ts`:

- **Transaction**: id, type, amount, categoryId, paymentMethodId?, memo?, date, createdAt, updatedAt
- **Category**: id, name, icon (emoji), color, type, order, isDefault?, budget?
- **PaymentMethod**: id, name, icon, color, order, isDefault?
- **Settings**: monthlyBudget, currency, startDayOfMonth, theme

## Design Guidelines

### Currency Display Rules

```
✅ DO:
847,000원          # Currency suffix with comma separators
+ 3,000,000        # Plus sign for income only
4,500              # No sign for expenses

❌ DON'T:
₩847,000           # Currency symbol prefix
-4,500             # Minus sign (causes stress)
847000             # No comma separators
```

### UX Tone

Neutral observation, not praise or criticism. Facts only.

```
✅ "예산의 80%를 사용했어요" (You've used 80% of your budget)
❌ "지출이 너무 많아요" (You're spending too much)
```

### 3-Touch Rule

All major actions must complete within 3 touches:
```
Add Transaction: FAB → Amount + Category → Save
```

## Conventions

### File Naming

| Type | Pattern | Example |
|------|---------|---------|
| Component | PascalCase | `TransactionForm.tsx` |
| Hook | use + camelCase | `useTransactions.ts` |
| Store | camelCase + Store | `transactionStore.ts` |
| Utility | camelCase | `format.ts` |

### Component Structure

```typescript
interface ComponentProps {
  // props
}

export function Component({ prop1, prop2 }: ComponentProps) {
  // 1. hooks
  // 2. derived state
  // 3. handlers
  // 4. effects
  return ( /* JSX */ );
}
```

### File Creation Rules

- Components: `src/components/{domain}/{ComponentName}.tsx`
- Hooks: `src/hooks/use{Name}.ts`
- Stores: `src/stores/{name}Store.ts`
- Types: Add to `src/types/index.ts`

## Out of Scope (Not Implementing)

- Investment/asset tracking (complexity)
- Peer comparison (privacy/stress)
- Gamification (not validated)
- Receipt OCR (cost/benefit unclear)
- Double-entry bookkeeping (not target user need)

## Reference Documents

- `moneymirror-design-system.md` - Full design system spec
- `MoneyMirror_PWA_개발기획서.md` - PWA development specification
