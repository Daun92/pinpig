# PinPig Design System

---

## 브랜드 아이덴티티

### 앱 이름
**PinPig** (핀피그)

### 태그라인
> "기록하는 가계부가 아니라, 비춰주는 거울"

### 브랜드 성격
- **조용한 관찰자** - 판단하지 않고 사실만 전달
- **따뜻한 중립** - 차갑지 않은 담담함
- **일상의 동반자** - 금융앱이 아닌 노트앱

---

## 디자인 철학

### 핵심 원칙

| 원칙 | 설명 | 적용 |
|------|------|------|
| **Quiet Interface** | 색상으로 소리치지 않음 | 모노톤 기반, 최소 색상 |
| **Paper Metaphor** | 종이 위에 적는 느낌 | 따뜻한 오프화이트, 그림자 없음 |
| **1초 확인** | 앱 열면 바로 핵심 정보 | 남은 돈이 Hero |
| **판단 없음** | 사실만 전달 | 경고 최소화, 중립 어조 |

### 첫인상 목표

```
깔끔하다 → 요소 최소화, 정렬 철저
더할 게 없다 → 장식 제거, 필수만
편안하다 → 따뜻한 톤, 낮은 대비
```

---

## 컬러 시스템

### Warm Mono Palette

모든 색상은 따뜻한 톤(Yellow/Red-tinted) 기반.
차가운 그레이(Blue-tinted)는 사용하지 않음.

#### 배경 (Paper)

| 토큰 | HEX | 용도 |
|------|-----|------|
| `paper-white` | `#FAF9F7` | 메인 배경 |
| `paper-light` | `#F5F4F1` | 카드, 입력창 |
| `paper-mid` | `#ECEAE6` | 구분선, 비활성 |

#### 텍스트 (Ink)

| 토큰 | HEX | 용도 |
|------|-----|------|
| `ink-black` | `#1C1B1A` | 주요 숫자, 제목 |
| `ink-dark` | `#3D3C3A` | 본문 |
| `ink-mid` | `#6B6966` | 보조 텍스트, 아이콘 |
| `ink-light` | `#9C9A96` | 힌트, 타임스탬프 |

#### 기능색 (Semantic)

| 토큰 | HEX | 용도 | 원칙 |
|------|-----|------|------|
| `positive` | `#4A7C59` | 수입 | + 기호와 함께만 |
| `caution` | `#8B7355` | 주의 | 텍스트로 대체 권장 |

**원칙:** 기능색은 최소한으로. 가능하면 기호와 텍스트로 상태 전달.

### 다크모드

| 용도 | Light | Dark |
|------|-------|------|
| 메인 배경 | `#FAF9F7` | `#1C1B1A` |
| 카드 배경 | `#F5F4F1` | `#2A2928` |
| 주요 텍스트 | `#1C1B1A` | `#E8E6E3` |
| 보조 텍스트 | `#6B6966` | `#9C9A96` |
| 구분선 | `#ECEAE6` | `#3D3C3A` |

---

## 타이포그래피

### 서체

| 용도 | 서체 |
|------|------|
| 숫자 | SF Pro Display, Roboto, system-ui |
| 한글/영문 | Pretendard, -apple-system, sans-serif |

### 웨이트

- **Light (300):** Hero 숫자
- **Regular (400):** 본문, 일반 숫자
- **Medium (500):** 제목, 강조

**Bold 사용 금지** - 무겁지 않게.

### Type Scale

| 토큰 | 크기 | 웨이트 | 용도 |
|------|------|--------|------|
| `hero` | 40px | 300 | 메인 잔액 (남은 돈) |
| `amount` | 20px | 400 | 거래 금액 |
| `title` | 18px | 500 | 섹션 제목 |
| `body` | 15px | 400 | 본문 |
| `sub` | 13px | 400 | 카테고리, 날짜 |
| `caption` | 11px | 400 | 타임스탬프 |

### 금액 표기 규칙

```
DO:
847,000원        쉼표 + 원 뒤에
+ 3,000,000      수입만 + 기호
4,500            지출은 기호 없이

DON'T:
₩847,000         통화 기호 앞에
-4,500           마이너스 기호 (스트레스)
847000           쉼표 없이
```

---

## 여백 시스템

8px 기반 스케일.

| 토큰 | 값 | 용도 |
|------|-----|------|
| `xs` | 8px | 요소 내 최소 간격 |
| `sm` | 16px | 요소 간 기본 간격 |
| `md` | 24px | 그룹 간 간격 |
| `lg` | 32px | 섹션 간 간격 |
| `xl` | 48px | 주요 영역 구분 |

### 모서리 반경

| 토큰 | 값 | 용도 |
|------|-----|------|
| `radius-sm` | 8px | 버튼, 입력창 |
| `radius-md` | 12px | 카드, 모달 |

---

## 아이콘 시스템

### 핵심 원칙

> **이모지 사용 금지. Lucide 선형 SVG 아이콘만 사용.**

이모지는 플랫폼별로 다르게 렌더링되고, 디자인 일관성을 해친다.
모든 아이콘은 Lucide React 라이브러리의 선형(outline) 아이콘을 사용한다.

### 스타일

| 속성 | 값 |
|------|-----|
| 라이브러리 | **Lucide React** (`lucide-react`) |
| 타입 | Line Icon (외곽선, stroke only) |
| 두께 | 1.5px (`strokeWidth={1.5}`) |
| 모서리 | Rounded (기본값) |
| 기본 크기 | 20px |
| 색상 | `ink-mid` (#6B6966) |
| 활성 색상 | `ink-black` (#1C1B1A) |

### 카테고리 아이콘

| 카테고리 | Lucide 아이콘 | import |
|----------|--------------|--------|
| 식비 | `Utensils` | `import { Utensils } from 'lucide-react'` |
| 카페 | `Coffee` | `import { Coffee } from 'lucide-react'` |
| 교통 | `Car` | `import { Car } from 'lucide-react'` |
| 쇼핑 | `ShoppingBag` | `import { ShoppingBag } from 'lucide-react'` |
| 주거 | `Home` | `import { Home } from 'lucide-react'` |
| 의료 | `HeartPulse` | `import { HeartPulse } from 'lucide-react'` |
| 여가 | `Gamepad2` | `import { Gamepad2 } from 'lucide-react'` |
| 통신 | `Smartphone` | `import { Smartphone } from 'lucide-react'` |
| 금융 | `Coins` | `import { Coins } from 'lucide-react'` |
| 기타 | `MoreHorizontal` | `import { MoreHorizontal } from 'lucide-react'` |

### 수입 카테고리 아이콘

| 카테고리 | Lucide 아이콘 | import |
|----------|--------------|--------|
| 급여 | `Wallet` | `import { Wallet } from 'lucide-react'` |
| 보너스 | `Gift` | `import { Gift } from 'lucide-react'` |
| 투자수익 | `TrendingUp` | `import { TrendingUp } from 'lucide-react'` |
| 기타수입 | `PlusCircle` | `import { PlusCircle } from 'lucide-react'` |

### UI 아이콘

| 기능 | Lucide 아이콘 | import |
|------|--------------|--------|
| 추가 | `Plus` | `import { Plus } from 'lucide-react'` |
| 닫기 | `X` | `import { X } from 'lucide-react'` |
| 뒤로 | `ArrowLeft` | `import { ArrowLeft } from 'lucide-react'` |
| 더보기 | `MoreHorizontal` | `import { MoreHorizontal } from 'lucide-react'` |
| 체크 | `Check` | `import { Check } from 'lucide-react'` |
| 설정 | `Settings` | `import { Settings } from 'lucide-react'` |
| 차트 | `BarChart2` | `import { BarChart2 } from 'lucide-react'` |
| 목록 | `List` | `import { List } from 'lucide-react'` |
| 검색 | `Search` | `import { Search } from 'lucide-react'` |
| 삭제 | `Trash2` | `import { Trash2 } from 'lucide-react'` |
| 날짜 | `Calendar` | `import { Calendar } from 'lucide-react'` |
| 메모 | `FileText` | `import { FileText } from 'lucide-react'` |
| 화살표(우) | `ChevronRight` | `import { ChevronRight } from 'lucide-react'` |
| 화살표(좌) | `ChevronLeft` | `import { ChevronLeft } from 'lucide-react'` |

### 사용 예시

```tsx
import { Coffee, Plus, ArrowLeft } from 'lucide-react';

// 기본 사용
<Coffee size={20} strokeWidth={1.5} className="text-ink-mid" />

// 활성 상태
<Coffee size={20} strokeWidth={1.5} className="text-ink-black" />

// FAB 아이콘
<Plus size={24} strokeWidth={2} className="text-paper-white" />
```

---

## 컴포넌트 스펙

### 카드

```
배경: paper-light 또는 투명
테두리: 없음 또는 1px paper-mid
그림자: 없음
모서리: 12px
패딩: 20px
```

### 버튼

#### Primary
```
배경: ink-black
텍스트: paper-white
패딩: 14px 24px
모서리: 8px
```

#### Secondary
```
배경: 투명
텍스트: ink-black
테두리: 1px paper-mid
```

#### Ghost
```
배경: 투명
텍스트: ink-mid
```

### 진행률 바

```
배경: paper-mid, 높이 2px
진행: ink-black, 높이 2px
마커/색상변화 없음 - 상태는 텍스트로
```

### FAB (Floating Action Button)

```
크기: 56px
배경: ink-black
아이콘: paper-white, plus
그림자: 0 4px 12px rgba(0,0,0,0.15)
위치: 우하단 24px
```

### Bottom Navigation

```
높이: 56px + safe-area
배경: paper-white
아이콘: ink-mid (비활성), ink-black (활성)
구분선: 상단 1px paper-mid
```

---

## 모션

### 원칙

**최소한, 부드럽게.**
있어야 할 이유가 없으면 넣지 않는다.

### 허용

| 상황 | 값 |
|------|-----|
| 화면 전환 | 200ms fade |
| 요소 등장 | 150ms fade-in |
| 숫자 변경 | 100ms ease-out |
| 리스트 등장 | stagger 30ms |

### 금지

- 바운스
- 스프링
- 과장된 효과
- 화려한 카운트업
- 파티클

---

## 음성 & 톤

### 언어 원칙

| DO | DON'T |
|----|-------|
| 쓸 수 있는 돈 | 잔여 예산 |
| 오늘 | 금일 |
| 기록하기 | 지출 등록 |
| 56,000원 남음 | 예산 잔액 56,000원 |
| 이번 달 식비에 가장 많이 썼어요 | 식비 초과! |

### 피드백 메시지

중립적 관찰. 칭찬도 비난도 아님.

```
DO:
"예산의 80%를 사용했어요"
"하루 56,000원 남았어요"
"이번 달 카페에 관심이 많았어요"

DON'T:
"예산을 초과했습니다!"
"절약을 더 하셔야 해요"
"지출이 너무 많아요"
```

---

## 디자인 토큰 (Tailwind Config)

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

## 체크리스트

### 디자인 리뷰 시 확인

**첫인상**
- [ ] 불필요한 요소 있음? → 제거
- [ ] 여백 충분함?
- [ ] 색상 3개 이하?

**PinPig 느낌**
- [ ] 금융 용어 대신 일상 용어?
- [ ] 경고/강조 과하지 않음?
- [ ] 노트앱처럼 보임?
- [ ] "남은 돈"이 가장 먼저 보임?

**가시성**
- [ ] 숫자 잘 읽힘?
- [ ] 정보 위계 명확?
- [ ] 아이콘 구분 가능?

**일관성**
- [ ] 컬러 토큰 준수?
- [ ] 타이포 스케일 준수?
- [ ] 여백 시스템 준수?

---

*버전: 2.0 (PinPig)*
*최종 수정: 2025-01-07*
