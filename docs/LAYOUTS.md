# PinPig 화면별 레이아웃 상세

---

## 디자인 원칙 적용

### 전체 적용 규칙

| 원칙 | 적용 |
|------|------|
| Paper Metaphor | 배경 `paper-white`, 그림자 없음 |
| Quiet Interface | 색상 최소화, 텍스트로 정보 전달 |
| Breathe | 충분한 여백, 시각적 밀도 낮춤 |
| 1초 확인 | Hero 영역에 핵심 정보 |

### 공통 레이아웃

```
┌─────────────────────────────────────┐
│ Safe Area Top                       │  env(safe-area-inset-top)
├─────────────────────────────────────┤
│                                     │
│           Content Area              │  flex-1, overflow-auto
│                                     │
├─────────────────────────────────────┤
│ Bottom Navigation (56px)            │  fixed bottom
│ Safe Area Bottom                    │  env(safe-area-inset-bottom)
└─────────────────────────────────────┘
```

---

## 1. 온보딩 - 웰컴

### 레이아웃 구조

```
┌─────────────────────────────────────┐
│                                     │  pt-safe-top
│                                     │
│                                     │
│            ┌───────┐                │
│            │ Logo  │                │  PinPig 로고 (SVG): 80x80px
│            └───────┘                │
│                                     │  gap: 16px
│            PinPig                   │  text-title, ink-black
│                                     │  gap: 8px
│      기록하는 가계부가 아니라         │  text-body, ink-mid
│         비춰주는 거울                │  text-body, ink-mid
│                                     │
│                                     │
│                                     │
│    ┌─────────────────────────┐     │
│    │       시작하기           │     │  Button Primary
│    └─────────────────────────┘     │  mx-24px, h-52px
│                                     │  pb-48px + safe-bottom
└─────────────────────────────────────┘
```

### 상세 스펙

| 요소 | 스펙 |
|------|------|
| 컨테이너 | `flex flex-col items-center justify-center min-h-screen bg-paper-white` |
| 로고 | `w-20 h-20 mb-4` |
| 앱 이름 | `text-title text-ink-black mb-2` |
| 태그라인 | `text-body text-ink-mid text-center px-8` |
| 버튼 | `w-full mx-6 h-13 bg-ink-black text-paper-white rounded-sm` |
| 버튼 위치 | `absolute bottom-12 left-6 right-6` (safe-area 포함) |

### 키포인트

- **중앙 정렬**: 로고~태그라인 수직 중앙
- **버튼 하단 고정**: 엄지 닿는 위치
- **여백 충분**: 압박감 없는 첫인상
- **애니메이션**: fade-in 150ms (로고 → 텍스트 → 버튼 순차)

---

## 2. 온보딩 - 예산 설정

### 레이아웃 구조

```
┌─────────────────────────────────────┐
│ ←                                   │  Header: 56px, 뒤로가기
├─────────────────────────────────────┤
│                                     │  pt-32px
│     이번 달 쓸 수 있는 돈은          │  text-title, ink-black
│         얼마인가요?                  │  text-title, ink-black
│                                     │  gap: 48px
│                                     │
│         1,500,000                   │  text-hero, ink-black
│            원                       │  text-title, ink-mid
│                                     │  gap: 32px
│                                     │
│  ──────────────●──────────────      │  Slider: h-2px
│                                     │  gap: 8px
│  50만                       300만   │  text-caption, ink-light
│                                     │
│                                     │
│     나중에 설정에서 바꿀 수 있어요     │  text-sub, ink-light
│                                     │
│    ┌─────────────────────────┐     │
│    │         완료            │     │  Button Primary
│    └─────────────────────────┘     │
│                                     │  pb-safe-bottom
└─────────────────────────────────────┘
```

### 상세 스펙

| 요소 | 스펙 |
|------|------|
| 헤더 | `h-14 flex items-center px-4` |
| 뒤로 버튼 | `w-10 h-10 flex items-center justify-center` |
| 질문 | `text-title text-ink-black text-center mt-8` |
| 금액 | `text-hero text-ink-black text-center mt-12` |
| 원 | `text-title text-ink-mid` |
| 슬라이더 트랙 | `h-0.5 bg-paper-mid rounded-full` |
| 슬라이더 thumb | `w-6 h-6 bg-ink-black rounded-full` |
| 범위 라벨 | `text-caption text-ink-light` |
| 안내 문구 | `text-sub text-ink-light text-center` |
| 버튼 | `mx-6 h-13 bg-ink-black text-paper-white rounded-sm` |

### 키포인트

- **금액 터치**: 금액 영역 탭 시 직접 입력 모달
- **슬라이더**: 50만~300만, 10만 단위
- **실시간 반영**: 슬라이더 움직이면 즉시 금액 변경
- **안심 문구**: "나중에 바꿀 수 있어요" 심리적 부담 감소

### 인터랙션

```
[슬라이더 드래그]
  ↓
금액 실시간 업데이트 (100ms ease-out)
  ↓
[금액 영역 탭]
  ↓
숫자 키패드 모달 (직접 입력)
```

---

## 3. 홈 (메인 대시보드)

### 레이아웃 구조

```
┌─────────────────────────────────────┐
│                                     │  pt-safe-top + 16px
│              1월                    │  MonthDisplay
├─────────────────────────────────────┤
│                                     │
│           847,000원                 │  ← HERO ZONE
│      이번 달 쓸 수 있는 돈           │
│                                     │
│  ━━━━━━━━━━━━━━━━━━━━○━━━━━━━      │  ProgressBar
│                                     │
│     15일 남음 · 하루 56,000원       │  DailyBudget
│                                     │
├─────────────────────────────────────┤  구분선 또는 gap
│                                     │
│  최근 거래                     모두 │  SectionHeader
│                                     │
│  ┌─────────────────────────────┐   │
│  │[Coffee] 스타벅스  오늘 14:32│   │  TransactionItem (Lucide: Coffee)
│  │                     4,500원 │   │
│  ├─────────────────────────────┤   │
│  │[ShoppingBag] 쿠팡 오늘 11:20│   │  Lucide: ShoppingBag
│  │                    32,000원 │   │
│  ├─────────────────────────────┤   │
│  │[Wallet] 급여          어제  │   │  Lucide: Wallet
│  │                + 3,000,000원│   │  수입: semantic-positive
│  └─────────────────────────────┘   │
│                                     │
│                        ┌────┐      │
│                        │ +  │      │  FAB (Lucide: Plus)
│                        └────┘      │
├─────────────────────────────────────┤
│  [Home] [List] [BarChart2] [Settings]│  BottomNav (Lucide)
│                                     │  pb-safe-bottom
└─────────────────────────────────────┘
```

### Hero Zone 상세

```
┌─────────────────────────────────────┐
│                                     │  padding: 24px
│              1월                    │  text-sub, ink-mid, 터치로 월 변경
│                                     │  gap: 8px
│           847,000원                 │  text-hero (40px, 300)
│                                     │  gap: 4px
│      이번 달 쓸 수 있는 돈           │  text-sub, ink-mid
│                                     │  gap: 24px
│  ━━━━━━━━━━━━━━━━━━━━○━━━━━━━      │  h-2px, bg-paper-mid
│  ━━━━━━━━━━━━━━━━━━━━               │  h-2px, bg-ink-black (진행)
│                                     │  gap: 12px
│     15일 남음 · 하루 56,000원       │  text-sub, ink-mid
│                                     │  padding-bottom: 24px
└─────────────────────────────────────┘
```

### 최근 거래 상세

```
┌─────────────────────────────────────┐
│  최근 거래                     모두 │  px-24px
│                                     │  text-sub ink-dark / ink-mid
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│                                     │  padding: 16px 24px
│  [Coffee] 스타벅스       오늘 14:32 │  Lucide: Coffee
│  │        │                   │    │
│  │        └─ text-body ink-dark│    │
│  │                            │    │
│  └─ 24px, ink-mid             └─ text-caption ink-light
│                                     │
│                         4,500원     │  text-amount ink-black
│                                     │  (수입: + prefix, semantic-positive)
├─────────────────────────────────────┤  border-b 1px paper-mid
```

### 상세 스펙

| 요소 | 스펙 |
|------|------|
| 월 표시 | `text-sub text-ink-mid text-center` |
| Hero 금액 | `text-hero text-ink-black text-center` |
| Hero 라벨 | `text-sub text-ink-mid text-center` |
| 진행률 트랙 | `h-0.5 bg-paper-mid rounded-full mx-6` |
| 진행률 바 | `h-0.5 bg-ink-black rounded-full` |
| 일평균 | `text-sub text-ink-mid text-center` |
| 섹션 헤더 | `flex justify-between px-6 py-3` |
| 거래 아이템 | `flex items-center px-6 py-4 border-b border-paper-mid` |
| FAB | `fixed bottom-24 right-6 w-14 h-14 bg-ink-black rounded-full shadow-lg` |

### 키포인트

- **Hero 최우선**: 스크롤 없이 남은 돈 즉시 확인
- **진행률 바**: 단순 2px, 색상 변화 없음 (상태는 텍스트로)
- **최근 거래 3건**: 더 보려면 "모두" 또는 내역 탭
- **FAB 위치**: 오른손 엄지 자연스러운 위치

### 빈 상태

```
┌─────────────────────────────────────┐
│  최근 거래                          │
│                                     │
│                                     │
│         아직 거래가 없어요           │  text-body ink-light
│                                     │
│      + 버튼을 눌러 기록해보세요       │  text-sub ink-light
│                                     │
└─────────────────────────────────────┘
```

---

## 4. 내역

### 레이아웃 구조

```
┌─────────────────────────────────────┐
│  내역                     [Search]  │  Header (Lucide: Search)
├─────────────────────────────────────┤
│  ┌──────────┐  ┌────────────────┐  │
│  │  1월 ▾   │  │ 전체 카테고리 ▾ │  │  FilterBar
│  └──────────┘  └────────────────┘  │
├─────────────────────────────────────┤
│                                     │
│  오늘                    -36,500원  │  DateGroup Header
│  ─────────────────────────────      │
│  [Coffee] 스타벅스          14:32   │  Lucide: Coffee
│     카페                   4,500원  │
│  ─────────────────────────────      │
│  [ShoppingBag] 쿠팡        11:20    │  Lucide: ShoppingBag
│     쇼핑                  32,000원  │
│                                     │
│  어제                +2,972,000원   │  DateGroup Header
│  ─────────────────────────────      │
│  [Wallet] 급여                      │  Lucide: Wallet
│     급여            + 3,000,000원   │
│  ─────────────────────────────      │
│  [Utensils] 점심           12:30    │  Lucide: Utensils
│     식비                   8,000원  │
│                                     │
│                        ┌────┐      │
│                        │ +  │      │  FAB (Lucide: Plus)
│                        └────┘      │
├─────────────────────────────────────┤
│  [Home] [List] [BarChart2] [Settings]│  BottomNav (Lucide)
└─────────────────────────────────────┘
```

### 날짜 그룹 헤더

```
┌─────────────────────────────────────┐
│                                     │  padding: 12px 24px
│  오늘                    -36,500원  │
│  │                           │     │
│  └─ text-sub ink-dark        └─ text-sub ink-mid (지출)
│                                     │     semantic-positive (수입>지출)
│                                     │  bg-paper-light
└─────────────────────────────────────┘
```

### 거래 아이템 (상세)

```
┌─────────────────────────────────────┐
│                                     │  padding: 16px 24px
│  [Coffee] 스타벅스           14:32  │  Lucide: Coffee
│  │        │                    │   │
│  │        └─ text-body ink-black└─ text-caption ink-light
│  │                                  │
│  └─ Lucide icon 20px ink-mid        │
│                                     │
│       카페                  4,500원 │
│       │                        │   │
│       └─ text-sub ink-mid      └─ text-amount ink-black
│                                     │
├─────────────────────────────────────┤  border-b 1px paper-mid
```

### 필터 바

```
┌─────────────────────────────────────┐
│                                     │  padding: 12px 24px
│  ┌──────────┐  ┌────────────────┐  │  gap: 8px
│  │  1월 ▾   │  │ 전체 카테고리 ▾ │  │
│  └──────────┘  └────────────────┘  │
│  │              │                  │
│  │              └─ bg-paper-light rounded-sm px-3 py-2
│  └─ bg-paper-light rounded-sm px-3 py-2
│                                     │  text-sub ink-dark
│                                     │  bg-paper-white, border-b paper-mid
└─────────────────────────────────────┘
```

### 키포인트

- **날짜별 그룹핑**: "오늘", "어제", "1월 5일" 형식
- **일간 합계**: 헤더 우측에 그날 순 지출/수입
- **스크롤 성능**: 가상화 또는 무한 스크롤
- **탭 → 상세**: 아이템 탭 시 상세 모달

---

## 5. 통계

### 레이아웃 구조

```
┌─────────────────────────────────────┐
│  통계                 ◀  1월  ▶    │  Header + MonthNav
├─────────────────────────────────────┤
│                                     │
│  이번 달 지출                        │  SummarySection
│                                     │
│         1,253,000원                 │
│                                     │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━        │
│  예산의 83%                         │
│                                     │
├─────────────────────────────────────┤
│                                     │
│  카테고리별                          │  CategorySection
│                                     │
│  [Utensils] 식비           420,000원 │  Lucide: Utensils
│  ━━━━━━━━━━━━━━━━━━━━              │
│                                     │
│  [Home] 주거              350,000원 │  Lucide: Home
│  ━━━━━━━━━━━━━━━━━                 │
│                                     │
│  [ShoppingBag] 쇼핑       185,000원 │  Lucide: ShoppingBag
│  ━━━━━━━━━━━━                      │
│                                     │
│  [Coffee] 카페             98,000원 │  Lucide: Coffee
│  ━━━━━━━━                          │
│                                     │
│  [MoreHorizontal] 기타    200,000원 │  Lucide: MoreHorizontal
│  ━━━━━━━━━━                        │
│                                     │
├─────────────────────────────────────┤
│                                     │
│  [Lightbulb] 이번 달 관심사          │  InsightSection (Lucide: Lightbulb)
│  ┌─────────────────────────────┐   │
│  │ 식비에 가장 많이 썼어요       │   │
│  │ 카페가 지난달보다 2만원 늘었어요│   │
│  └─────────────────────────────┘   │
│                                     │
├─────────────────────────────────────┤
│  [Home] [List] [BarChart2] [Settings]│  BottomNav (Lucide)
└─────────────────────────────────────┘
```

### 월간 요약

```
┌─────────────────────────────────────┐
│                                     │  padding: 24px
│  이번 달 지출                        │  text-sub ink-mid
│                                     │  gap: 8px
│         1,253,000원                 │  text-hero ink-black
│                                     │  gap: 16px
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━        │  h-2px
│                                     │  gap: 8px
│  예산의 83%                         │  text-sub ink-mid
│                                     │
└─────────────────────────────────────┘
```

### 카테고리 차트 아이템

```
┌─────────────────────────────────────┐
│                                     │  padding: 12px 24px
│  [Utensils] 식비           420,000원 │  Lucide: Utensils
│  │          │                  │    │
│  │          └─ text-body ink-dark└─ text-amount ink-black
│  └─ Lucide icon 20px ink-mid        │
│                                     │  gap: 8px
│  ━━━━━━━━━━━━━━━━━━━━              │  h-4px bg-ink-black rounded
│  │                                  │  width: 비율 계산
│  └─ 최대 카테고리 = 100%, 나머지 비례
│                                     │
└─────────────────────────────────────┘
```

### 인사이트 카드

```
┌─────────────────────────────────────┐
│                                     │  padding: 24px
│  [Lightbulb] 이번 달 관심사          │  text-sub ink-mid (Lucide: Lightbulb)
│                                     │  gap: 12px
│  ┌─────────────────────────────┐   │  bg-paper-light rounded-md
│  │                             │   │  padding: 16px
│  │ • 식비에 가장 많이 썼어요    │   │  text-body ink-dark
│  │                             │   │  gap: 8px
│  │ • 카페가 지난달보다          │   │
│  │   2만원 늘었어요            │   │
│  │                             │   │
│  └─────────────────────────────┘   │
│                                     │
└─────────────────────────────────────┘
```

### 키포인트

- **월 네비게이션**: 좌우 화살표 또는 스와이프
- **카테고리 정렬**: 금액 높은 순
- **바 차트**: 단순 수평 바, 최대값 기준 비율
- **인사이트**: 판단 없이 사실만 ("관심" 프레이밍)

---

## 6. 설정

### 레이아웃 구조

```
┌─────────────────────────────────────┐
│  설정                               │  Header
├─────────────────────────────────────┤
│                                     │
│  예산                               │  SectionTitle
│  ─────────────────────────────      │
│  월 예산               1,500,000원 →│  SettingsItem
│                                     │
│  카테고리                           │  SectionTitle
│  ─────────────────────────────      │
│  카테고리 관리                    → │  SettingsItem
│                                     │
│  데이터                             │  SectionTitle
│  ─────────────────────────────      │
│  데이터 내보내기 (CSV)            → │  SettingsItem
│  ─────────────────────────────      │
│  모든 데이터 삭제                  → │  SettingsItem (danger)
│                                     │
│  화면                               │  SectionTitle
│  ─────────────────────────────      │
│  다크 모드                 시스템 → │  SettingsItem
│                                     │
│  정보                               │  SectionTitle
│  ─────────────────────────────      │
│  버전                       1.0.0   │  SettingsItem (static)
│  피드백 보내기                    → │  SettingsItem
│                                     │
├─────────────────────────────────────┤
│  [Home] [List] [BarChart2] [Settings]│  BottomNav (Lucide)
└─────────────────────────────────────┘
```

### 섹션 타이틀

```
┌─────────────────────────────────────┐
│                                     │  padding: 24px 24px 8px
│  예산                               │  text-sub ink-light
│                                     │
└─────────────────────────────────────┘
```

### 설정 아이템

```
┌─────────────────────────────────────┐
│                                     │  padding: 16px 24px
│  월 예산               1,500,000원 →│
│  │                           │   │ │
│  │                           │   └─ Lucide: ChevronRight
│  │                           └─ text-body ink-mid
│  └─ text-body ink-black            │
│                                     │
├─────────────────────────────────────┤  border-b 1px paper-mid
```

### 위험 아이템 (삭제)

```
┌─────────────────────────────────────┐
│                                     │
│  모든 데이터 삭제                  → │  text-body text-red-500
│                                     │
└─────────────────────────────────────┘
```

### 키포인트

- **섹션 그룹핑**: 관련 설정끼리 묶음
- **위험 액션**: 빨간색 텍스트, 2단계 확인
- **간결함**: 필수 설정만, 복잡한 옵션 X

---

## 7. 거래 입력 모달

### 레이아웃 구조

```
┌─────────────────────────────────────┐
│ ████████████████████████████████████│  Backdrop (rgba(0,0,0,0.5))
│ ████████████████████████████████████│
├─────────────────────────────────────┤
│                                     │  bg-paper-white
│  [X]                        저장    │  ModalHeader (Lucide: X)
│                                     │
│     [ 지출 ]  [ 수입 ]              │  TypeToggle
│                                     │
│              45,000                 │  AmountDisplay
│               원                    │
│                                     │
│  ─────────────────────────────      │  Divider
│                                     │
│  [Utensils] [Coffee] [Car] ...      │  CategoryPicker (Lucide 아이콘)
│    식비      카페    교통           │
│                                     │
│  ─────────────────────────────      │  Divider
│                                     │
│  [Calendar] 오늘 (1월 7일)      [>] │  DatePicker (Lucide: Calendar, ChevronRight)
│  [FileText] 메모 추가           [>] │  MemoInput (Lucide: FileText, ChevronRight)
│                                     │
├─────────────────────────────────────┤
│  ┌─────┬─────┬─────┐              │
│  │  1  │  2  │  3  │              │  NumPad
│  ├─────┼─────┼─────┤              │
│  │  4  │  5  │  6  │              │
│  ├─────┼─────┼─────┤              │
│  │  7  │  8  │  9  │              │
│  ├─────┼─────┼─────┤              │
│  │ 00  │  0  │  ⌫  │              │
│  └─────┴─────┴─────┘              │
│                                     │  pb-safe-bottom
└─────────────────────────────────────┘
```

### 모달 헤더

```
┌─────────────────────────────────────┐
│                                     │  h-56px padding: 0 16px
│  [X]                        저장    │  Lucide: X
│  │                            │    │
│  │                            └─ text-body ink-black (활성)
│  │                               text-body ink-light (비활성: 금액 0)
│  └─ Lucide icon 24px ink-mid       │
│                                     │
└─────────────────────────────────────┘
```

### 타입 토글

```
┌─────────────────────────────────────┐
│                                     │  padding: 16px 24px
│     [ 지출 ]  [ 수입 ]              │
│     │          │                   │
│     │          └─ bg-transparent text-ink-light (비선택)
│     └─ bg-ink-black text-paper-white rounded-sm (선택)
│                                     │  각 버튼: px-4 py-2
└─────────────────────────────────────┘
```

### 금액 표시

```
┌─────────────────────────────────────┐
│                                     │  padding: 24px
│              45,000                 │  text-hero ink-black
│               원                    │  text-title ink-mid
│                                     │  text-center
│  (금액 0일 때: "0" text-ink-light)  │
└─────────────────────────────────────┘
```

### 카테고리 피커

```
┌─────────────────────────────────────┐
│                                     │  padding: 16px 0
│  [Utensils] [Coffee] [Car] ...      │  horizontal scroll (Lucide 아이콘)
│  │  식비     카페    교통           │  gap: 12px, pl-24px
│  └─ 각 아이템:                      │
│     Lucide icon 24px                │
│     text-caption                    │
│     선택: ink-black                 │
│     비선택: ink-light               │
│     선택 시 하단 dot indicator       │
└─────────────────────────────────────┘
```

### 숫자패드

```
┌─────────────────────────────────────┐
│                                     │  bg-paper-light
│  ┌─────┬─────┬─────┐              │  padding: 8px
│  │  1  │  2  │  3  │              │
│  ├─────┼─────┼─────┤              │  gap: 1px
│  │  4  │  5  │  6  │              │
│  ├─────┼─────┼─────┤              │  각 버튼:
│  │  7  │  8  │  9  │              │  h-14 (56px)
│  ├─────┼─────┼─────┤              │  bg-paper-white
│  │ 00  │  0  │  ⌫  │              │  text-amount ink-black
│  └─────┴─────┴─────┘              │  active: bg-paper-mid
│                                     │
└─────────────────────────────────────┘
```

### 키포인트

- **모달 진입**: slide-up 200ms
- **기본 선택**: 시간대별 카테고리 추천
- **저장 조건**: 금액 > 0
- **숫자패드**: 항상 표시, 계산기 아님 (단순 입력)

### 스마트 기본값

```typescript
// 시간대별 카테고리 추천
const hour = new Date().getHours();
if (hour >= 7 && hour < 10) return 'transport';   // 출근
if (hour >= 11 && hour < 14) return 'food';       // 점심
if (hour >= 14 && hour < 17) return 'cafe';       // 오후
if (hour >= 18 && hour < 21) return 'food';       // 저녁
return 'etc';
```

---

## 8. 거래 상세 모달

### 레이아웃 구조

```
┌─────────────────────────────────────┐
│ ████████████████████████████████████│  Backdrop
├─────────────────────────────────────┤
│                                     │  bg-paper-white
│  [ArrowLeft]                삭제    │  ModalHeader (Lucide: ArrowLeft)
│                                     │
│            [Coffee]                 │  CategoryIcon 48px (Lucide)
│           스타벅스                   │  Description
│                                     │
│           4,500원                   │  Amount
│                                     │
├─────────────────────────────────────┤
│                                     │
│  카테고리        카페           [>] │  DetailRow (Lucide: ChevronRight)
│  ─────────────────────────────      │
│  날짜           2025.01.07 14:32 [>]│  DetailRow
│  ─────────────────────────────      │
│  메모           (없음)           [>]│  DetailRow
│                                     │
├─────────────────────────────────────┤
│                                     │
│    ┌─────────────────────────┐     │
│    │       수정하기           │     │  Button Primary
│    └─────────────────────────┘     │
│                                     │  pb-safe-bottom
└─────────────────────────────────────┘
```

### 키포인트

- **삭제**: 확인 모달 필요 (2단계)
- **수정**: 입력 모달과 동일 UI, 데이터 프리필

---

## 공통 컴포넌트: Bottom Navigation

### 레이아웃

```
┌─────────────────────────────────────┐
│ ─────────────────────────────────── │  border-t 1px paper-mid
│                                     │  h-56px + safe-bottom
│  [Home] [List] [BarChart2] [Settings]│  Lucide 아이콘
│  홈      내역    통계    설정       │
│  │       │       │       │        │
│  └─ 활성: ink-black                │
│     비활성: ink-mid                 │
│                                     │
│  Lucide icon: 20px                 │
│  label: text-caption               │
│  gap: 4px                          │
│  각 탭 영역: flex-1, min-w-touch   │
│                                     │
└─────────────────────────────────────┘
```

---

## 공통 컴포넌트: FAB

### 레이아웃

```
┌────────────────────────┐
│                        │
│     ┌────────────┐     │
│     │            │     │  w-56px h-56px
│     │    [+]     │     │  bg-ink-black (Lucide: Plus)
│     │            │     │  rounded-full
│     └────────────┘     │  shadow: 0 4px 12px rgba(0,0,0,0.15)
│                        │
│  Lucide Plus icon: 24px paper-white│
│  position: fixed       │
│  bottom: 80px (nav위)  │
│  right: 24px           │
│                        │
└────────────────────────┘
```

### 상태

- **기본**: 표시
- **스크롤 다운**: 유지 (숨기지 않음)
- **모달 열림**: 숨김
- **설정 페이지**: 숨김

---

*버전: 1.0*
*최종 수정: 2025-01-07*
