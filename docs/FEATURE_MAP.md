# PinPig 기능 연관 맵

> 기능 수정 시 함께 확인해야 할 연관 항목을 정리한 문서
> 일관성 유지를 위해 수정 전 관련 트리 확인 필수

---

## 1. 예산 관리 (Budget)

```
예산 관리
├── BudgetWizardPage      # 예산 마법사 (초기 설정, 분석 기반)
├── CategoryBudgetPage    # 카테고리별 예산 (일상 조정)
├── SettingsPage          # 월 예산 직접 입력
└── HomePage              # 남은 예산 표시
```

### 공유 개념
| 개념 | 위치 | 설명 |
|------|------|------|
| `monthlyBudget` | settingsStore | 월 총 예산 |
| `category.budget` | 각 카테고리 | 카테고리별 예산 |
| 배분 비율 | queries.ts | DEFAULT_BUDGET_RATIOS |
| 천단위 표기 | 공통 | `toLocaleString()` |

### 수정 시 체크리스트
- [ ] 예산 입력 UI 일관성 (천단위 콤마, inputMode 등)
- [ ] 슬라이더 UI/UX 동일한가?
- [ ] 자동 배분 로직 동기화
- [ ] 저장 방식 (실시간 vs 일괄)

---

## 2. 카테고리 관리 (Category)

```
카테고리 관리
├── CategoryManagePage    # 목록, 순서, 추가/삭제
├── CategoryEditPage      # 개별 편집 (이름, 아이콘, 색상, 예산)
├── CategoryBudgetPage    # 예산만 조정
├── BudgetWizardPage      # 예산 마법사 내 카테고리
├── AddPage               # 거래 입력 시 선택
├── EditTransactionPage   # 거래 수정 시 선택
└── StatsPage             # 카테고리별 통계/차트
```

### 공유 개념
| 개념 | 위치 | 설명 |
|------|------|------|
| `Category` 타입 | types/index.ts | id, name, icon, color, budget, order |
| `isDefault` | Category | 기본 카테고리 삭제 방지 |
| 아이콘 시스템 | Icon 컴포넌트 | Lucide 아이콘명 |
| 색상 팔레트 | types/index.ts | CATEGORY_COLORS |

### 수정 시 체크리스트
- [ ] 카테고리 표시 UI 일관성 (아이콘+이름+색상)
- [ ] 정렬 순서 반영 (order 필드)
- [ ] isDefault 처리 (삭제 방지)
- [ ] 예산 표시 형식 통일

---

## 3. 거래 입력/수정 (Transaction Entry)

```
거래 입력/수정
├── AddPage                     # 신규 거래 입력 (FAB)
├── TransactionDetailPage       # 상세 보기 + 빠른 수정
├── EditTransactionPage         # 전체 필드 수정
└── RecurringTransactionEditPage # 반복거래 템플릿 편집
```

### 공유 개념
| 개념 | 위치 | 설명 |
|------|------|------|
| `Transaction` 타입 | types/index.ts | 거래 데이터 구조 |
| 금액 입력 | 공통 | 천단위 콤마, 키패드 |
| 날짜 선택 | 공통 | DatePicker 컴포넌트 |
| 타입 토글 | 공통 | expense/income 전환 |

### 수정 시 체크리스트
- [ ] 금액 입력 UI 동일한가?
- [ ] 카테고리 선택 UI 동일한가?
- [ ] 결제/수입수단 선택 UI 동일한가?
- [ ] 메모/태그 입력 UI 동일한가?
- [ ] 저장 후 네비게이션 일관성

---

## 4. 태그/메모 시스템 (Tags & Memo)

```
태그/메모 시스템
├── AddPage                     # 입력 UI
├── TransactionDetailPage       # 입력 UI + 표시
├── EditTransactionPage         # 입력 UI
├── RecurringTransactionEditPage # 입력 UI
├── HistoryPage                 # 목록에서 표시
├── HomePage                    # 최근 거래 표시
└── utils/tags.ts               # 파싱/조합 유틸리티
```

### 공유 개념
| 개념 | 위치 | 설명 |
|------|------|------|
| `tags` 필드 | Transaction | string[] 배열 |
| `memo` 필드 | Transaction | 순수 메모 텍스트 |
| `parseMemoWithTags()` | utils/tags.ts | 입력 → 태그+메모 분리 |
| `combineMemoWithTags()` | utils/tags.ts | 태그+메모 → 표시용 조합 |
| `getMemoPreview()` | utils/tags.ts | 목록 표시용 미리보기 |

### 수정 시 체크리스트
- [ ] 입력 UI 4개 페이지 동일한가?
- [ ] 추천 태그 로직 동일한가?
- [ ] 태그 칩 스타일 일관성
- [ ] 목록 표시 형식 (첫 태그 or 메모)
- [ ] 검색 시 태그 포함 여부

---

## 5. 결제수단/수입수단 (Payment & Income Methods)

```
결제/수입수단 관리
├── MethodManagePage            # 목록, 순서, 추가/삭제/편집
│   ├── 지출 탭 (PaymentMethod)
│   └── 수입 탭 (IncomeSource)
├── AddPage                     # 거래 입력 시 선택
├── EditTransactionPage         # 거래 수정 시 선택
└── RecurringTransactionEditPage # 반복거래 시 선택
```

### 공유 개념
| 개념 | 위치 | 설명 |
|------|------|------|
| `PaymentMethod` 타입 | types/index.ts | 지출 결제수단 |
| `IncomeSource` 타입 | types/index.ts | 수입 수단 |
| `isDefault` | 두 타입 모두 | 기본 수단 삭제 방지 |
| 선택 UI | 공통 | 가로 스크롤 칩 리스트 |

### 수정 시 체크리스트
- [ ] 수단 선택 UI 일관성
- [ ] isDefault 처리
- [ ] 타입(지출/수입) 전환 시 수단 변경

---

## 6. 통계/리포트 (Stats & Report)

```
통계/리포트
├── StatsPage                   # 메인 리포트 페이지
├── CategoryTrendModal          # 카테고리별 추이
├── PaymentMethodTrendModal     # 결제수단별 추이
├── MonthlyReviewPage           # 월간 리뷰
└── HomePage                    # 요약 정보
```

### 공유 개념
| 개념 | 위치 | 설명 |
|------|------|------|
| 차트 라이브러리 | Recharts | 일관된 스타일 |
| 기간 선택 | 공통 | 월/주 단위 |
| 금액 포맷 | 공통 | formatCurrency |

### 수정 시 체크리스트
- [ ] 차트 색상/스타일 일관성
- [ ] 기간 선택 UI 동일한가?
- [ ] 금액 표시 형식 통일

---

## 7. 반복거래 (Recurring Transaction)

```
반복거래
├── RecurringTransactionPage    # 목록
├── RecurringTransactionEditPage # 생성/편집
├── queries.ts                  # executeRecurringTransaction()
└── HomePage                    # 자동 실행 트리거
```

### 공유 개념
| 개념 | 위치 | 설명 |
|------|------|------|
| `RecurringTransaction` 타입 | types/index.ts | 반복거래 템플릿 |
| 실행 로직 | queries.ts | 거래 생성 + 다음 실행일 계산 |
| 거래 필드 복사 | executeRecurringTransaction | tags, memo, amount 등 |

### 수정 시 체크리스트
- [ ] Transaction 필드 추가 시 RecurringTransaction도 추가
- [ ] 실행 시 새 필드 복사 여부 확인
- [ ] 편집 UI가 AddPage/EditTransactionPage와 일관적인가?

---

## 빠른 참조: 파일별 연관 기능

| 파일 | 연관 기능 그룹 |
|------|---------------|
| `AddPage.tsx` | 거래입력, 태그, 카테고리, 결제수단 |
| `EditTransactionPage.tsx` | 거래입력, 태그, 카테고리, 결제수단 |
| `TransactionDetailPage.tsx` | 거래입력, 태그 |
| `BudgetWizardPage.tsx` | 예산, 카테고리 |
| `CategoryBudgetPage.tsx` | 예산, 카테고리 |
| `CategoryManagePage.tsx` | 카테고리 |
| `CategoryEditPage.tsx` | 카테고리 |
| `MethodManagePage.tsx` | 결제수단 |
| `RecurringTransactionEditPage.tsx` | 반복거래, 거래입력, 태그, 결제수단 |
| `StatsPage.tsx` | 통계, 카테고리 |
| `HomePage.tsx` | 예산, 통계, 거래입력, 반복거래 |

---

## 사용 방법

1. **수정 전**: 해당 기능 그룹의 "수정 시 체크리스트" 확인
2. **수정 중**: 연관 파일들 함께 수정
3. **수정 후**: 체크리스트 항목 검증

### 예시: 태그 입력 UI 변경 시

```
1. FEATURE_MAP.md > "4. 태그/메모 시스템" 확인
2. 연관 파일 4개 확인:
   - AddPage.tsx
   - TransactionDetailPage.tsx
   - EditTransactionPage.tsx
   - RecurringTransactionEditPage.tsx
3. 체크리스트 확인:
   - [ ] 입력 UI 4개 페이지 동일한가?
   - [ ] 추천 태그 로직 동일한가?
   - [ ] 태그 칩 스타일 일관성
4. 모든 파일 일괄 수정
5. 타입체크 후 테스트
```

---

*이 문서는 기능 추가/수정 시 업데이트 필요*
