# PinPig 유저 플로우

> **문서 버전**: 1.0 | **작성일**: 2026-07-16 | **기준 앱 버전**: v0.2.5
> 문서 세트: [01 기획서](./01_PRD.md) · [02 기능 정의서](./02_REQUIREMENTS.md) · **03 유저 플로우** · [04 와이어프레임](./04_WIREFRAMES.md)
> 다이어그램은 Mermaid. 노드 괄호 안 경로는 실제 라우트(`src/App.tsx`).

---

## 1. 앱 진입 게이트

앱 실행 시 온보딩 완료 여부로 분기한다. 온보딩은 라우터 밖에서 렌더되는 전체 화면 게이트다.

```mermaid
flowchart TD
    Start([앱 실행 / PWA 열기]) --> Splash[스플래시<br/>설정 로드 중]
    Splash --> Check{isOnboardingComplete?}
    Check -- 아니오 --> OB[온보딩 5단계<br/>OnboardingPage]
    OB --> OB5[Step 5: 월 예산 슬라이더]
    OB5 -- 완료 --> Home
    OB5 -- "나중에 설정할게요" --> Home
    Check -- 예 --> Home["홈 (/)"]
    Home --> Recur[반복거래 자동 실행<br/>processRecurringTransactions<br/>catch-up 최대 365건]
```

**온보딩 스텝**: ① 웰컴("오늘 얼마나 쓸 수 있지?") → ② 홈 기능 소개 → ③ 3터치 기록 소개 → ④ 분석 소개 → ⑤ 예산 설정(슬라이더 50만~500만, 스킵 가능)

---

## 2. 정보 구조 (내비게이션 맵)

하단 탭바 5개(중앙 FAB 포함)가 최상위. 설정이 관리 화면들의 허브다.

```mermaid
flowchart LR
    subgraph TabBar[하단 탭바]
        T1["오늘 (/)"]
        T2["기록 (/history)"]
        FAB(("＋ FAB (/add)"))
        T3["분석 (/stats)"]
        T4["설정 (/settings)"]
    end

    T1 --> TD1["거래 상세 (/transaction/:id)"]
    T1 -->|어제·예정 카드| T2
    T2 --> TD1
    TD1 --> TE["거래 수정 (/transaction/:id/edit)"]
    T3 -->|카테고리·수단 탭| TM[추이 모달]
    T3 -->|"설정하기 CTA"| BW

    T4 --> BW["예산 마법사 (/settings/budget-wizard)"]
    T4 --> CB["카테고리별 예산 (/settings/category-budget)"]
    T4 --> AE["연간 지출 관리 (/settings/annual-expenses)"]
    T4 --> MR["월간 리뷰 (/review)"]
    T4 --> RT["반복 거래 (/settings/recurring)"] --> RTE["반복 거래 편집 (new · :id/edit)"]
    T4 --> IS["인사이트 카드 (/settings/insights)"]
    T4 --> AL["알림 설정 4종<br/>(budget · category · recurring · payment-method)-alerts"]
    T4 --> CM["카테고리 관리 (/settings/categories)"] --> CE["카테고리 편집 (new · :id/edit)"]
    T4 --> MM["수단 관리 (/settings/methods)"] --> PME["결제/수입수단 편집"]
    T4 --> IO["데이터 가져오기·내보내기 (/settings/import · export)"]
    CB --> CM
```

---

## 3. 핵심 플로우 ① — 1초 확인 (가장 빈번, 하루 3~5회)

```mermaid
flowchart LR
    A([앱 열기]) -->|즉시, 로딩 없음| B["홈 히어로<br/>이번 달 쓸 수 있는 돈<br/>N일 남음 · 하루 M원"]
    B --> C{더 볼까?}
    C -- 아니오 --> Z([앱 닫기<br/>총 3초])
    C -- 인사이트 --> D[캐러셀 스와이프<br/>최대 3장] --> Z
    C -- 아래로 스크롤 --> E[오늘 거래 목록<br/>Screen 2] --> Z
```

- 입력·터치 없이 정보 획득이 완결되는 것이 설계 목표 (NFR-1)
- 예산 미설정/거래 없음 등 상태별로 히어로·캐러셀이 CTA로 대체됨 (04 와이어프레임 참조)

---

## 4. 핵심 플로우 ② — 3터치 기록 (하루 2~5회)

AddPage는 아코디언 구조로, 선택을 마치면 다음 섹션이 자동으로 펼쳐진다. 저장 버튼은 화면 하단 중앙 FAB(✓)이다.

```mermaid
flowchart TD
    A([결제 직후]) --> B["① FAB ＋ 탭"]
    B --> C["/add 진입<br/>금액 필드 자동 포커스<br/>날짜=오늘 기본값"]
    C --> D["② 금액 입력 + 카테고리 칩 선택<br/>(5열 그리드)"]
    D --> E{선택 입력?}
    E -- 결제수단 --> E1[수단 칩 선택<br/>자동 펼침]
    E -- 메모/태그 --> E2[메모·태그 입력<br/>추천 칩]
    E -- 할부/반복 --> E3["3-way 토글<br/>없음 · 할부 · 반복"]
    E -- 건너뜀 --> F
    E1 --> F
    E2 --> F
    E3 --> F["③ FAB ✓ 저장"]
    F --> G["홈 복귀<br/>남은 돈 즉시 반영<br/>총 10초"]

    E3 -.할부 n개월.-> H[분할 거래 n건 생성<br/>+ 반복 등록]
    E3 -.반복 주기 선택.-> I[반복거래 등록<br/>+ 즉시/다음 회차 생성<br/>+ '반복' 태그]
```

**유효성**: 금액 0 또는 카테고리 미선택이면 FAB 비활성 → 저장 불가.
**수입 기록**: 헤더 지출/수입 토글 → 수입 카테고리·수입수단으로 전환, 저장 시 `+` 녹색 표시.

---

## 5. 핵심 플로우 ③ — 내역 확인·검색 (하루 0~2회)

```mermaid
flowchart TD
    A([궁금증: 어제 뭐 샀더라?]) --> B{진입 경로}
    B -- 탭바 '기록' --> C["/history<br/>이번 달 · 날짜별 그룹"]
    B -- 홈 '어제' 카드 --> C2["/history?scrollTo=yesterday"]
    B -- 홈 '예정' 카드 --> C3["/history?scrollTo=future"]
    C2 --> C
    C3 --> C
    C --> D{탐색 방법}
    D -- 좌우 스와이프 / ◀▶ --> E[월 이동<br/>미래 월 포함]
    D -- 월 라벨 탭 --> F[월 선택 모달<br/>연도 + 4×3 그리드]
    D -- 검색 아이콘 --> G["전체 기간 텍스트 검색<br/>메모·태그 포함"]
    D -- 카테고리 필터 --> H[카테고리 다중 선택 모달]
    E --> I[거래 항목 탭]
    F --> I
    G --> I
    H --> I
    I --> J["/transaction/:id<br/>상세 = 즉시 편집 화면"]
    J -- FAB ✓ --> K[수정 저장]
    J -- 휴지통 --> L[삭제 confirm]
```

---

## 6. 핵심 플로우 ④ — 월말 리뷰 (월 1~2회)

```mermaid
flowchart TD
    A([월말: 이번 달 뭐에 썼지?]) --> B{진입}
    B -- 탭바 '분석' --> C["/stats<br/>지출/수입 탭 + 월간/연간"]
    B -- 설정 > 월간 리뷰 --> D["/review (기본: 지난달)"]
    C --> C1[카테고리별 도넛 + 리스트<br/>예산 대비 %]
    C --> C2[수단별 도넛 + 리스트<br/>한도 대비 %]
    C --> C3[기간별 추이<br/>6/12개월·연간 멀티라인]
    C1 -- 항목 탭 --> M1[카테고리 추이 모달]
    C2 -- 항목 탭 --> M2[수단 추이 모달]
    C --> C4["💡 인사이트<br/>'이번 달 관심사' 중립 문구"]
    D --> D1[지출 총액 + 예산 대비 %]
    D1 --> D2["발견한 점 (ReviewInsight)"]
    D2 --> D3[카테고리별 전월 비교]
    D3 --> E{다음 달 예산}
    E -- 유지하기 --> F["/settings"]
    E -- 조정하기 --> G["/settings/budget-wizard"]
```

---

## 7. 예산 설정 3경로

```mermaid
flowchart TD
    A([예산을 정하고 싶다]) --> B{경로 선택}
    B -- 빠르게 --> C["설정 > 월 예산<br/>인라인 입력 (onBlur 저장)"]
    B -- 처음부터 --> D["예산 마법사 5단계<br/>/settings/budget-wizard"]
    B -- 일상 조정 --> E["카테고리별 예산<br/>/settings/category-budget"]

    D --> D1["① 지난 3개월 지출 회고"]
    D1 --> D2["② 카테고리별 소비 패턴"]
    D2 --> D3["③ 목표 금액<br/>슬라이더 + 프리셋(절약/유지/여유)"]
    D3 --> D4["④ 카테고리별 배분<br/>자동 배분 토글"]
    D4 --> D5["⑤ 완료 → 홈"]
    D1 -.바로 예산 설정하기.-> D3

    E --> E1["금액/% 모드 전환"]
    E1 --> E2["비율대로/균등 빠른 배분"]
    E2 --> E3["카테고리별 슬라이더·입력<br/>즉시 저장"]
    E3 --> E4["요약: 미배분/초과 표시"]
```

---

## 8. 반복거래 라이프사이클 (시스템 플로우)

```mermaid
flowchart TD
    subgraph 등록경로
        A1["AddPage 반복 토글"] --> R
        A2["거래 수정 화면<br/>반복 전환 토글"] --> R
        A3["/settings/recurring/new<br/>템플릿 직접 등록"] --> R
    end
    R[(RecurringTransaction<br/>주기·시작/종료일·실행모드)]
    R --> X{"등록 시<br/>nextExecutionDate ≤ 오늘?"}
    X -- 예 --> X1["즉시 거래 생성 + 토스트"]
    X -- 아니오 --> W[대기]
    W --> T["홈 마운트 시<br/>processRecurringTransactions()"]
    T --> Y{"실행일 도래?<br/>(밀린 것 포함)"}
    Y -- 예 --> Z["거래 자동 생성<br/>'반복' 태그 부여<br/>다음 실행일 재계산"]
    Y -- 아니오 --> W
    Z --> P["예상 거래(Projected)로<br/>홈 '예정' 카드·내역에 표시"]
    R -.실행 모드.-> M1["on_date: 해당 날짜에 입력"]
    R -.실행 모드.-> M2["start_of_month: 월초 선반영"]
```

---

## 9. 알림 트리거 플로우

```mermaid
flowchart TD
    A[거래 저장 / 홈 진입] --> B{"notificationEnabled?<br/>(마스터 토글)"}
    B -- OFF --> Z([알림 없음])
    B -- ON --> C{트리거 검사}
    C --> D["전체 예산 알림<br/>사용률 ≥ 50/80/100%"]
    C --> E["카테고리 알림<br/>카테고리 예산 ≥ 70/100%"]
    C --> F["결제수단 알림<br/>수단 한도 ≥ 70/100%<br/>(저장 직후 즉시)"]
    C --> G["반복거래 알림<br/>실행 N일 전 (기본 1일)"]
    C --> H["연간 지출 알림<br/>발생 N일 전 (기본 14일)"]
    D & E & F & G & H --> I{"이번 달/오늘<br/>이미 알림?"}
    I -- 예 --> Z
    I -- 아니오 --> J["중립 톤 토스트 표시<br/>lastAlerted* 기록"]
```

---

## 10. 인사이트 → 상세 연결

홈 캐러셀 카드는 URL 파라미터(`insight`, `categoryId`, `month`)로 맥락을 전달하며 상세 화면으로 연결된다.

```mermaid
flowchart LR
    A[홈 인사이트 캐러셀<br/>최대 3장] -->|카드 탭| B{위젯 타입}
    B -- "caution / room / interest / compare" --> C["/history?insight=...&categoryId=...<br/>인사이트 상세 헤더 + 해당 거래 목록"]
    B -- upcoming --> D["/history?scrollTo=future"]
    B -- budget-overview --> E["/settings/category-budget"]
    A2[캐러셀 CTA 카드] -->|예산 미설정 시| F["/settings/budget-wizard"]
    A2 -->|카테고리 예산 미설정 시| E
```

---

## 부록: 플로우별 빈도·소요시간 목표

| 플로우 | 빈도 | 목표 소요 | 터치 수 |
|--------|------|----------|---------|
| 1초 확인 | 하루 3~5회 | 3초 | 0 |
| 3터치 기록 | 하루 2~5회 | 10~15초 | 3 (+선택 입력) |
| 내역 확인 | 하루 0~2회 | 30초 | 2~4 |
| 월말 리뷰 | 월 1~2회 | 1~2분 | 3+ |
| 예산 설정(마법사) | 월 0~1회 | 2~3분 | 10+ |
