# PinPig 프로젝트 컨텍스트

> **최종 갱신**: 2026-09-07
> **버전**: 0.2.5
> **이 파일은 새 대화 시작 시 빠른 맥락 파악용입니다.**

---

## 현재 상태

| 항목 | 값 |
|------|-----|
| 버전 | 0.2.5 |
| MVP 완성도 | 100% |
| 배포 URL | https://pinpig.vercel.app |
| ESLint | 0 에러 0 경고 |
| 빌드 | 통과 (시작 JS 1,048KB, 26페이지 lazy 분할) |
| 테스트 | vitest + fake-indexeddb, 45건 통과 |

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

### #141 PinPig 백업 복원 전용 경로 — iOS 홈화면 앱 데이터 이전 (2026-09-07)
- **문제**: iOS는 Safari 탭과 홈화면 PWA의 IndexedDB를 분리(Apple 정책) → 유일한 이동 경로인 "전체 백업 → 가져오기"가 막혀 있었음. `parseJSON`이 백업 구조(`data:{transactions,…}`)를 못 읽어 빈 배열, 래핑을 풀어도 `categoryId`·`type:'income'` 유실
- **구현**: `services/backupRestore.ts` 신규 — 백업 판별 → 7개 테이블 단일 트랜잭션 복원(전체 교체/병합), Date 필드 되살림. `ImportDataPage`에 `backup_preview → restoring → restore_complete` 단계 추가, 완료 후 `location.replace('/')`로 스토어 전체 재로드. 백업에 `incomeSources`·`annualExpenses` 추가(v1.1)
- **검증**: type-check·lint 0-0·vitest **45건** 통과. **build 미실행**(환경 OOM — 변경 없이도 재현, 커밋 메모리 고갈) · 실기기 미확인
- **미배포** — 배포 지시 대기

### #140 예정 거래 도래 후 시한부 '확인' 배지 (2026-08-07)
- **결정**: #139 잔여 4건 중 ①은 **시한부 배지**(조용히 경고 · 무응답이면 확정), ②③ 현행 유지, ④ `HeroCarousel` 삭제
- **② 근거**: 검색 실측 — 5년치 105ms · 14년치 320ms(선형), 300ms 디바운스 존재 → 여유 확인
- **구현 (스키마 변경 0)**: `needsSettlementCheck` — `createdAt < date`(선입력) + `updatedAt < date`(미수정) + '반복' 태그 제외 + 7일 시한. **수정하면 배지 소멸 = 확인**
- **표시**: 기록 탭 앰버 "확인" 배지(파란 "예정"과 구분), 홈 하단 "확인" 카드 → `?scrollTo=check`
- **검증**: type-check·lint 0-0·vitest **36건**·build 통과 + 실브라우저 전 흐름 확인
- **미배포** — 배포 지시 대기

### #139 시나리오·가설 점검 + 공백 4건 수정 (2026-08-07)
- **점검**: 신규 공백 6건 발견 — 급여일 예산 주기 미배선 / 초과 금액 미표시 / PWA 장기 체류 시 홈 낡음 / 예정 도래 확인 흐름 부재 / 검색 전체 스캔 / 카테고리 정리 불가
- **결정**: 예산 주기는 **달력 월 확정**(급여일 미지원, PRD Out of Scope 명시) + 데드 코드 제거
- **수정 4건**: ①payday 계열 데드 코드 삭제 ②히어로에 초과 금액 표시(+미사용 `BudgetInsightCard` 삭제) ③`createDayChangeGuard`로 날짜 변경 시 홈 재로드 ④`__BUILD_TIME__`·`__BUILD_COMMIT__` 주입 → 설정에 "빌드 26.08.07 · b3fec0e"
- **검증**: type-check·lint 0-0·vitest **29건**·build 통과 + 실브라우저 확인
- **미수정**: 예정 도래 알림 · 검색 인덱스 · 카테고리 숨김 · `HeroCarousel` 미사용 (보고만)
- **미배포** — 배포 지시 대기

### #138 제품 문서 시각화 — PRD·유저플로우·IA (2026-08-07)
- **요청**: `참고/` HTML 2종의 시각화 방식을 참고해 기존 PRD·유저플로우·IA를 시각 문서로 재구성
- **역설계**: 점격자 캔버스 + 팬/줌, 스윔레인, 노드 4종(start·hub·leaf·action pill), 엘보 커넥터, 트리 레이아웃(부모=자식 span 중앙)
- **산출**: `docs/product/` HTML 3종 (PRD 91노드 · 유저플로우 107노드 · IA 83노드/27라우트 전량)
- **생성기**: `scripts/docviz/` — HTML 직접 수정 금지, `content.py` 고쳐 재생성
- **검증**: 3종 실브라우저 렌더 확인 (라벨 오버플로 없음, 엣지 겹침 해소)

### #137 예정 거래(미래 날짜 선입력) 정합화 (2026-08-07)
- **진단**: 미래 입력은 #119에서 이미 열려 있었음 — 막힌 건 입력이 아니라 **입력 이후 정합성**. 예정 거래가 분석·카테고리 예산에 실지출로 집계되고, 편집 화면은 미래 날짜 수정 불가였음
- **결정**: 홈 남은 예산은 예정 차감 유지(+"예정 N원 포함" 명시) / 분석·카테고리 사용률은 실지출만 / 상태 필드 없이 `date > 오늘`로 파생(스키마 무변경)
- **`docs/UPCOMING_TRANSACTIONS.md` 신규** — 3층 구조(확정·예정·예상) + 영역별 집계 기준표
- **변경**: `utils/date.ts` 신규, 편집·상세 `disableFuture={false}`, 연도 2018~2027, 기록 탭 "예정" 배지, `getSettledTransactionsByMonth/Year` 신설 후 분석 17개 호출부 전환
- **검증**: type-check·lint 0-0·vitest **25건**·build 통과 + **실브라우저 확인 완료**
- **배포 완료** (0f9671d, main 동기화) — 프로덕션 실동작 확인: 홈 1,200,000원 + "예정 500,000원 포함", 분석 300,000원(15%)만 집계

### #136 분석 카테고리 리스트 — 예산/금액 보기 기준 전환 (2026-08-03)
- **배경**: 한 행에 구성비 막대 + 빨간 '예산의 100%(초과)' 텍스트가 섞여 인지적 오해. 금액순 정렬은 고정지출이 늘 1위라 변동 소비가 안 보임
- **변경**: `StatsPage`에 '금액순 | 예산순' 토글(기본 예산순) — 정렬과 막대·% 기준을 함께 전환. 예산순 = 예산 대비(초과 시 빨강, 예산 없으면 회색 구성비 + '예산 미설정'), 금액순 = 총지출 구성비. 도넛·인사이트·필터칩은 금액순 원본 유지
- **검증**: type-check·lint·vitest 15건·build 통과, **UI 실브라우저 미확인**
- **배포 완료** (edc306d, main 동기화) — 프로덕션 번들에 신규 문구 반영 확인

### #135 #133 배포 + 원격 main 덮임 복구 (2026-08-02)
- 프로덕션 반영 검증 완료(라우트 분할·xlsx 프리캐시 제외)
- `origin/main`이 무관한 프로젝트 히스토리로 덮여 있던 것 발견 → `backup/unknown-project-main`으로 보존 후 복구. pinpig 코드 유실 없음
- **⚠ 재발 위험**: 원인 리포가 다시 push하면 또 덮임 — GitHub main 브랜치 보호 설정 권장

### #134 Phase 2 방향 확정 + 실행 계획 문서화 (2026-08-02)
- **결정 4건**: Mac mini M4 확보(P-1) / 한국 선행 출시·i18n 연기(P-2=D3) / 위젯 v1은 홈 2종(P-3) / PWA 무료 티어 유지(P-4)
- **`docs/PHASE2_PLAN.md` 신규**: 결정 로그 + 실행 순서 S0(맥 셋업)~S5(수익화) + 대기 결정(D1·D2·가격) 트리거 명시
- **개발 미착수** — 방향 논의 우선, 실행은 별도 지시로 시작

### #133 정합성·안정성·번들 최적화 (2026-08-02)
- **정합성**: 홈 예산구조 transactions 반응 재계산, 엔진 날짜 키 가드+visibilitychange(장기 세션 대응), 등록 직후 도래분 즉시 처리 통일, console.log DEV 가드
- **안정성**: executeRecurringTransaction Dexie 트랜잭션 원자화(멀티 탭 중복 방지), 엔진 항목별 에러 격리 — 테스트 15건
- **번들**: 26페이지 lazy 분할 + xlsx 프리캐시 제외 → 시작 JS -39%(1,719→1,048KB), 프리캐시 2,193→1,788KB
- **미배포** — 배포 지시 대기

### #132 기록 탭 진입 시 '오늘' 자동 앵커 (2026-08-02)
- **배경**: 선반영 도입 후 기록 탭 최상단이 미래 예정 거래로 채워지는 UX 공백 (회귀 아님 — 자동 스크롤은 원래 딥링크 전용)
- **변경**: 무파라미터 진입 + 현재 월이면 '오늘' 그룹 1회 자동 앵커 (오늘 없으면 가장 가까운 예정 폴백), 스크롤 계산 rAF 제거로 동기화
- **검증**: 실브라우저 확인 (진입 시 오늘 헤더 116px 배치, 딥링크 회귀 통과), 프로덕션 배포 완료

### #131 반복거래 보완 반영 + 일괄 커밋 (2026-08-02)
- **등록·편집 직후 모드 분기**: `processSingleRecurringTransaction()` 신규 — on_date는 도래분만, start_of_month는 당월 선반영. 기존 "다음 회차 무조건 선생성"(#126) 제거
- **엔진 App 루트 이동**: 홈 미경유 진입에도 반복거래 반영 (세션당 1회)
- **문구 정확화**: "매월 1일에" → "매월 첫 앱 실행 시"
- **lint 0 에러 0 경고 완전 정리** + 미커밋 작업 전체 일괄 커밋·푸시

### #130 반복거래 '월초 선반영' 미구현 수정 (2026-08-02)
- **진단**: start_of_month 모드가 타입·UI에만 존재, 실행 엔진이 executionMode 미참조 → 전부 on_date로 동작. 배포 번들 분석으로 배포본=로컬 작업본 확인
- **수정**: `processRecurringTransactions` 실행 한도일 분기 — on_date는 오늘, start_of_month는 당월 말일까지 선생성
- **테스트 인프라 신규**: vitest.config.ts + fake-indexeddb, `budgetAlert.test.ts` 7건 (재현 3건 실패 → 수정 후 전부 통과)
- **배포**: 2026-08-02 프로덕션 반영 완료 (#131에서 커밋·푸시·배포·번들 검증)

### #129 서비스화 평가 및 상용화 제언 (2026-07-20)
- **`docs/COMMERCIALIZATION.md` 신규**: 상용 3축(신뢰·측정·결제) 갭 진단, BM 제언(무료+동기화 구독 권장, 연 15,000~24,000원 / $15~25), 개발 방향 Track 0~4 (검증 → 신뢰 인프라 → 품질·법무 → iOS 채널 → 결제)
- **전제**: 1인 운영 수익화, 한국+글로벌 병행

### #128 제품 문서 체계화 (2026-07-16)
- **`docs/product/` 신규**: 01_PRD(기획서) · 02_REQUIREMENTS(기능 정의서 R-01~R-12 + NFR) · 03_USER_FLOW(Mermaid 10종) · 04_WIREFRAMES(ASCII 15섹션) — v0.2.5 코드 역설계 기반
- **manyfast PRD 등록**: claude.ai MCP로 "PinPig - 비춰주는 거울 가계부" 프로젝트 생성, PRD 버전 1 저장 (요구사항 쓰기는 PRO 플랜 전용이라 리포 문서로 대체)

### #126 반복 전환 + 다음달 기록 + 태그 자동 + 토스트 개선 (2026-02-13)
- **EditTransactionPage 반복 전환**: 기존 거래를 반복거래로 전환하는 토글 UI + 주기 설정
- **다음달 기록 즉시 생성**: AddPage(할부/반복), RecurringTransactionEditPage에서 다음 회차 미리 생성
- **"반복" 태그 자동 부여**: 반복거래 등록 시 모든 경로에서 "반복" 태그 자동 추가
- **토스트 다크모드 차별화**: 타입별 tinted 배경(green/amber/red/blue-950/60)으로 시각적 구분

### #125 추가 개선 3건 (2026-02-13)
- **토스트 다크모드 배경**: `dark:bg-*-900/50` → `dark:bg-paper-mid` + 컬러 border로 가시성 확보
- **반복거래 즉시 실행**: 등록 시 nextExecutionDate ≤ today이면 즉시 거래 생성 + 토스트 안내
- **미래 월 탐색 허용**: 기록 페이지 다음 달/월선택 모달에서 미래 월 이동 가능

### #127 반복거래 자동 적용 미작동 버그 수정 (2026-03-13)
- **근본 원인**: `getActiveRecurringTransactions()`에서 `.equals(1)` vs boolean `true` 타입 불일치 → 활성 거래 항상 0건 반환
- **수정**: `.filter((rt) => rt.isActive === true)` 전환 + 편집 시 nextExecutionDate 불필요한 재계산 방지
- **영향**: processRecurringTransactions catch-up, 예상 거래 표시, 반복거래 알림 모두 정상화

### #124 v0.2.4 개선 3건 (2026-02-13)
- **다크모드 토스트 수정**: `dark:text-paper-*` override 제거, CSS 변수 자동 전환 활용, 배경 opacity 강화
- **반복거래 자동 실행**: `processRecurringTransactions()` 신규 — 밀린 거래 catch-up (최대 365건), HomePage mount 시 호출
- **할부/반복 설정 UI**: AddPage에 3-way 토글 (없음/할부/반복), 할부 시 분할 거래 + 반복 등록, 반복 시 주기 선택



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
2. **Vercel 배포 계정**: pinpig는 `daunny` 계정(dauns-projects-3fb4a769) 소유 — 브라우저 기본 계정(htry2528@gmail.com)에는 없음. CLI 만료 시 `npx vercel login` 디바이스 인증을 daunny 계정 웹 세션에서 승인
3. **원격 main 덮임 사고 (2026-08-02 복구)**: 외부 리포(블로그 자동화 계열)가 pinpig.git main을 강제 덮은 적 있음 — `backup/unknown-project-main`에 보존 후 복구. **원인 리포의 origin 미수정 시 재발 가능** — push 전 `git log origin/main -1`로 pinpig 커밋인지 확인 습관화, GitHub main 브랜치 보호 설정 권장

---

## 참조 문서

| 문서 | 용도 |
|------|------|
| `docs/product/*.html` | **시각화 문서 3종 — PRD 구조도 · 유저플로우 · IA** (브라우저에서 열기, 생성기 `scripts/docviz/`) |
| `docs/product/01_PRD.md` | **제품 기획서 (v0.2.5 기준)** |
| `docs/product/02_REQUIREMENTS.md` | **기능 정의서 (R-01~R-12 + NFR)** |
| `docs/product/03_USER_FLOW.md` | 유저 플로우 (Mermaid) |
| `docs/product/04_WIREFRAMES.md` | 와이어프레임 (전 화면) |
| `docs/FEATURE_MAP.md` | **기능 연관 맵 (수정 전 필수)** |
| `docs/ROADMAP.md` | **발전 방향 로드맵** |
| `docs/COMMERCIALIZATION.md` | **서비스화 평가·BM 제언 (2026-07-20)** |
| `docs/PHASE2_PLAN.md` | **Phase 2 결정 로그·실행 순서 (2026-08-02)** |
| `docs/UPCOMING_TRANSACTIONS.md` | **예정 거래 설계 — 집계 기준 정본 (2026-08-07)** |
| `WORKLOG-FULL.md` | 전체 작업 히스토리 |
| `docs/COMPLETION_REPORT.md` | 완성도 평가 보고서 |
| `docs/CONCEPT.md` | 앱 컨셉 |
| `docs/USER_JOURNEY.md` | 사용자 여정 |
| `MoneyMirror_PWA_개발기획서.md` | MVP 기획서 |
| `moneymirror-design-system.md` | 디자인 시스템 |

---

*상세 작업 기록은 `WORKLOG-FULL.md` 참조*
