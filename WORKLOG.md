# PinPig 작업일지

---

## 2025-01-07

### #1 작업일지 시스템 구축
- **요청**: 작업일지 생성, CLAUDE.md 지침 반영
- **변경**: `WORKLOG.md` 생성, `CLAUDE.md` 최우선 지침 추가
- **결과**: 작업 추적 시스템 구축 완료
- **피드백**: 로그 형식 간소화 요청 → #2에서 반영

### #2 작업일지 형식 간소화
- **요청**: 로그 수준으로 짧게, 복기 시 작업단위로 파악 가능하게
- **변경**: `WORKLOG.md` 형식 간소화, `CLAUDE.md` 지침 업데이트
- **결과**: 간결한 로그 형식 적용

### #3 앱 컨셉 및 철학 구체화
- **요청**: 앱 이름 PinPig 확정, 핵심 질문/타겟/톤/차별화 정의
- **변경**: `docs/CONCEPT.md` 생성
- **결과**: 컨셉 문서화 완료

### #4 디자인 시스템 업데이트
- **요청**: PinPig 브랜딩 반영
- **변경**: `docs/DESIGN_SYSTEM.md` 생성 (기존 moneymirror-design-system.md 대체)
- **결과**: 브랜드 아이덴티티, 컬러/타이포/컴포넌트 스펙, Tailwind 토큰 정의

### #5 화면 설계 및 IA 구조 상세 설계
- **요청**: 화면 개수, IA 구조, 화면별 목적/경험/레이아웃/포인트 정리
- **변경**: `docs/SCREENS.md` 생성
- **결과**:
  - IA 구조도 (온보딩 → 메인탭 4개 + 모달)
  - 8개 화면 상세 설계
  - MVP 필수: 온보딩(2) + 홈 + 내역 + 거래입력
  - 3터치 플로우, 스마트 기본값 정의

### #6 앱 경험여정 및 유저 시나리오 구체화
- **요청**: 핵심 플로우, 유저 시나리오, 앱 경험여정 구체화
- **변경**: `docs/USER_JOURNEY.md` 생성
- **결과**:
  - 4가지 핵심 플로우 정의 (확인/기록/내역/리뷰)
  - 페르소나 (김지원 29세 직장인)
  - 6가지 상세 시나리오 (온보딩~월말리뷰)
  - 일일 사용 패턴, 감정 곡선
  - 핵심 경험 원칙 4가지

### #7 화면별 레이아웃 및 키포인트 상세화
- **요청**: 통합 디자인 컨셉에 따른 화면별 레이아웃, 키포인트 구체화
- **변경**: `docs/LAYOUTS.md` 생성
- **결과**:
  - 8개 화면 상세 레이아웃 (ASCII 와이어프레임)
  - 컴포넌트별 Tailwind 스펙
  - 공통 컴포넌트 (BottomNav, FAB)
  - 인터랙션/애니메이션 정의
  - 스마트 기본값 로직

### #8 디자인 문서 검토 및 아이콘 가이드라인 통일
- **요청**: 디자인 문서 충돌/모순점 점검, 이모지 → Lucide SVG 아이콘 전환
- **분석 결과**:
  - 발견된 충돌: 아이콘 표기 불일치, 라우트명 차이 (`/stats` vs `/report`), 중복 문서 존재
  - 일관성 유지: 컬러 시스템, 타이포그래피, 여백 시스템은 모든 문서에서 동일
- **변경**:
  - `docs/DESIGN_SYSTEM.md`: 아이콘 시스템 섹션 강화
    - "이모지 사용 금지, Lucide 선형 SVG 아이콘만 사용" 원칙 명시
    - 카테고리별 Lucide 아이콘 import 예시 추가
    - 수입 카테고리 아이콘 추가 (Wallet, Gift, TrendingUp, PlusCircle)
    - UI 아이콘 확장 (Search, Trash2, Calendar, FileText, ChevronRight/Left)
    - 사용 예시 코드 추가
  - `docs/SCREENS.md`: 모든 와이어프레임에서 이모지 → `[Lucide아이콘명]` 형식으로 교체
  - `docs/LAYOUTS.md`: 모든 와이어프레임에서 이모지 → `[Lucide아이콘명]` 형식으로 교체
- **결과**: 디자인 문서 간 아이콘 표기 통일, 개발 시 Lucide React 활용 명확화

### #9 프론트엔드 개발 시작 - 핵심 화면 구현
- **요청**: 현재 구현 상태 확인 후 프론트엔드 개발 시작
- **변경**:
  - `src/types/index.ts`: 이모지 아이콘 → Lucide 아이콘명 전환 (Utensils, Car, ShoppingBag 등)
  - `src/components/layout/TabBar.tsx`: 아이콘 수정 (Clock→List, PieChart→BarChart2), 라벨 변경 (통계→리포트)
  - `src/components/common/Icon.tsx`: 동적 Lucide 아이콘 렌더링 컴포넌트 생성
  - `src/pages/HomePage.tsx`: 디자인 스펙에 맞게 재구현
    - Hero Zone (남은 예산, 진행률 바, 일평균 예산)
    - 최근 거래 섹션 (카테고리 아이콘 표시)
    - FAB 버튼
  - `src/pages/AddPage.tsx`: 거래 입력 화면 재구현
    - 타입 토글 (지출/수입)
    - 카테고리 피커 (수평 스크롤, 아이콘)
    - 숫자 키패드
    - 시간대별 스마트 기본값
  - `src/pages/HistoryPage.tsx`: 내역 화면 재구현
    - 날짜별 그룹핑
    - 일간 합계 표시
    - 필터 바 (월, 카테고리)
  - `src/services/queries.ts`, `src/stores/categoryStore.ts`: 타입 에러 수정
- **결과**: MVP 핵심 화면 3개 (홈, 거래입력, 내역) 디자인 스펙 반영 완료, 타입체크 통과

### #10 Excel 데이터 가져오기 기능 구현
- **요청**: 2026-01-07.xlsx 파일 분석 및 데이터 업로드
- **분석**:
  - 총 6,121개 거래 데이터 (2018-09-23 ~ 2026-02-14)
  - 18개 카테고리 (식비, 교통/차량, 문화생활, 월급 등)
  - 수입/지출/차액수입 타입
- **변경**:
  - `scripts/import-excel.ts`: Excel 파싱 스크립트 생성
  - `public/import-data.json`: 변환된 JSON 데이터 (6,121건)
  - `src/services/importData.ts`: 브라우저 import 서비스
    - `importTransactionsFromJSON()`: JSON에서 거래 가져오기
    - `clearAllTransactions()`: 전체 삭제
    - `getImportStatus()`: 현재 데이터 상태 조회
  - `src/pages/SettingsPage.tsx`: 데이터 관리 UI 추가
    - 데이터 가져오기 버튼
    - 모든 데이터 삭제 버튼
    - 현재 저장된 데이터 현황 표시
- **카테고리 매핑**:
  - 식비, 마트/편의점 → 식비
  - 교통/차량 → 교통
  - 문화생활 → 문화/여가
  - 패션/미용, 생활용품 → 쇼핑
  - 건강 → 의료/건강
  - 월급, 상여 → 급여
- **결과**: 설정 페이지에서 "데이터 가져오기" 클릭으로 6,121건 import 가능

### #11 아이콘 에러 수정 - 데이터베이스 초기화 기능
- **요청**: IndexedDB에 저장된 이모지 아이콘 → Lucide 아이콘 전환 문제 해결
- **원인**: 코드는 Lucide 아이콘명을 기대하지만, DB에는 이전 이모지(🎬, 📦, 💊 등)가 저장됨
- **변경**:
  - `src/pages/SettingsPage.tsx`: 데이터베이스 초기화 버튼 추가
    - `resetDatabase()` 함수 호출
    - 초기화 후 페이지 자동 새로고침
- **결과**: 설정 > 데이터베이스 초기화 클릭으로 해결 가능

### #12 예산 설정 및 카테고리 관리, 리포트 화면 구현
- **요청**: 예산설정, 카테고리 관리, 리포트 시각화 및 추이 분석
- **변경**:
  - `src/pages/CategoryManagePage.tsx`: 카테고리 관리 화면 신규 생성
    - 지출/수입 탭 전환
    - 카테고리 추가/수정/삭제 기능
    - 아이콘 및 색상 선택 UI
    - 카테고리별 예산 설정 (지출 카테고리 전용)
  - `src/pages/StatsPage.tsx`: 통계 화면 전면 재구현
    - 월 네비게이션 (이전/다음)
    - 이번 달 지출 + 예산 대비 진행률
    - 탭 전환: 카테고리별 / 월별 추이
    - 카테고리별: 수평 바 차트, 건수/비율 표시
    - 월별 추이: 6개월 바 차트, 수입/지출 합계
    - 인사이트 섹션 (가장 많이 쓴 카테고리, 지난달 대비 변화, 예산 사용률)
  - `src/pages/SettingsPage.tsx`: 카테고리 관리 메뉴 추가
  - `src/App.tsx`: `/settings/categories` 라우트 추가
- **결과**: 예산설정, 카테고리 관리, 리포트 시각화 및 추이 분석 완료, 타입체크 통과

### #13 스마트 예산 시스템 구현
- **요청**: 예산 설정 위저드, 월간 리뷰, 연간 대형 지출 예측 알림
- **변경**:
  - `src/types/index.ts`: BudgetRecommendation, AnnualExpensePattern, MonthlyReview 타입 추가
  - `src/services/database.ts`: annualExpenses 테이블 추가 (스키마 v2)
  - `src/services/queries.ts`: 예산 추천/연간지출/월간리뷰 쿼리 함수 추가
  - `src/pages/BudgetWizardPage.tsx`: 4단계 예산 설정 위저드 생성
    - Step 1: 과거 3개월 지출 분석 결과 표시
    - Step 2: 카테고리별 지출 패턴 확인
    - Step 3: 예산 목표 설정 (절약/유지/여유 프리셋)
    - Step 4: 완료 확인
  - `src/pages/AnnualExpensesPage.tsx`: 연간 대형 지출 관리 화면 생성
    - 작년 데이터 기반 대형 지출 자동 탐지 (≥50만원 + 월평균 2.5배 이상)
    - 항목별 알림 활성화/비활성화
    - D-day 카운트다운 표시
  - `src/pages/MonthlyReviewPage.tsx`: 월간 리뷰 화면 생성
    - 월 네비게이션
    - 예산 대비 사용률 시각화
    - 인사이트 (초과/절약/증가/감소)
    - 카테고리별 전월 대비 비교
  - `src/pages/SettingsPage.tsx`: 예산 마법사/연간지출/월간리뷰 메뉴 추가
  - `src/App.tsx`: 새 라우트 추가 (/settings/budget-wizard, /settings/annual-expenses, /review)
- **결과**: 스마트 예산 시스템 완료, 타입체크 통과

### #14 거래 입력 UI/UX 개선 (Phase 1.5)
- **요청**: 결제수단 선택, 가맹점 입력, 날짜 선택 기능 추가
- **변경**:
  - `src/stores/paymentMethodStore.ts`: 결제수단 Store 생성
    - fetchPaymentMethods, addPaymentMethod, updatePaymentMethod, deletePaymentMethod
    - selectPaymentMethods, selectDefaultPaymentMethod 셀렉터
  - `src/pages/AddPage.tsx`: 거래 입력 화면 개선
    - 결제수단 선택 UI (칩 형태, 지출 시에만 표시)
    - 가맹점/상호명 입력 필드 ("어디서?" placeholder)
    - 날짜 선택 (오늘/어제/이전 날짜 선택 가능, 화살표 네비게이션)
    - 기존 메모 필드 → description 필드로 전환
- **결과**: 3터치 원칙 유지하면서 추가 정보 입력 가능, 타입체크 통과

### #15 거래 입력 UI 전면 개선 + 결제수단 관리
- **요청**: 결제수단 관리 화면, 레이아웃 개선, 커스텀 키패드 제거, FAB 저장 버튼
- **변경**:
  - `src/pages/PaymentMethodManagePage.tsx`: 결제수단 관리 화면 생성
    - 결제수단 추가/수정/삭제
    - 아이콘 및 색상 선택
    - 카드별 실적 관리를 위한 다중 카드 지원
  - `src/pages/AddPage.tsx`: 전면 개선
    - 커스텀 숫자 키패드 제거 → 시스템 입력(키보드) 사용
    - 레이아웃 재구성 (스크롤 가능한 컨텐츠 영역)
    - 카테고리/결제수단 겹침 문제 해결
    - 금액 입력 시 자동 포커스
  - `src/pages/SettingsPage.tsx`: 결제수단 관리 메뉴 추가
  - `src/App.tsx`: `/settings/payment-methods` 라우트 추가
- **결과**: 시스템 입력 사용으로 UX 개선, 카드별 관리 가능, 타입체크 통과

### #16 TabBar FAB 동적 동작 + 메모/날짜선택 개선
- **요청**:
  - TabBar 중앙 FAB이 AddPage에서 저장 버튼(✓)으로 동작
  - 메모 필드 추가
  - 날짜 선택을 달력 팝업 방식으로 변경
- **변경**:
  - `src/stores/addPageStore.ts`: TabBar↔AddPage 통신용 Store 생성
    - canSubmit: 저장 가능 상태
    - submitHandler: 저장 핸들러 등록
    - triggerSubmit: 저장 실행
  - `src/components/layout/TabBar.tsx`: FAB 동적 동작 구현
    - 일반 페이지: + 아이콘, /add로 네비게이션
    - AddPage + 저장가능: ✓ 아이콘, 저장 실행
  - `src/components/common/DateTimePicker.tsx`: 날짜/시간 선택 달력 모달 생성
    - 월 네비게이션
    - 미래 날짜 선택 비활성화
    - 시간 선택 (time input)
  - `src/pages/AddPage.tsx`:
    - addPageStore 연동 (submitHandler 등록, canSubmit 업데이트)
    - 별도 FAB 제거 (TabBar FAB 사용)
    - 메모 필드 추가 (마지막 항목)
    - 날짜 선택: 좌우 화살표 → 달력 팝업 클릭 방식
- **결과**: 3터치 원칙 강화, 직관적인 날짜 선택, 타입체크 통과

### #17 카테고리 상세 모달 개선
- **요청**: 하단 네비게이션에 가려지는 문제 해결, TOP5 지출 표시
- **변경**:
  - `src/services/queries.ts`: `getTopTransactionsByCategory()` 함수 추가
  - `src/components/report/CategoryTrendModal.tsx`:
    - 모달에 `pb-20` 패딩 추가 (하단 네비 overlap 해결)
    - `max-h-[85vh] overflow-y-auto` 추가 (긴 콘텐츠 스크롤)
    - 헤더 `sticky` 처리
    - TOP5 지출 섹션 추가 (순위/내용/날짜/금액)
    - year/month props 추가로 현재 보고 있는 월의 데이터 표시
  - `src/pages/StatsPage.tsx`: 모달에 year, month 전달
- **결과**: 모달 하단 가림 해결, 카테고리별 TOP5 지출 표시, 타입체크 통과

### #18 통계 페이지 수입/지출 통합 분석
- **요청**: 지출 분석만 있어서 수입도 함께 관리
- **변경**:
  - `src/pages/StatsPage.tsx`:
    - 지출/수입 토글 버튼 추가 (상단 pill 형태)
    - `transactionType` state로 분석 대상 전환
    - Summary 섹션: 선택된 타입에 맞게 표시
    - 수입 모드: 잔액(수입-지출) 정보 추가 표시
    - 인사이트: 타입별 맞춤 메시지 (지출→지난달 대비, 수입→저축률 등)
    - 카테고리 금액: 수입일 때 녹색 + 표시
  - `src/components/report/CategoryTrendModal.tsx`:
    - `type` prop 추가 (expense/income)
    - 타입별 라벨 변경 ("최고 지출" ↔ "최고 수입")
    - TOP5 금액 색상 타입별 적용
- **결과**: 수입/지출 통합 분석 가능, 타입체크 통과

---

## 진행 예정
- 온보딩 플로우 구현
- PWA 푸시 알림 연동

---
