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

### #19 다크모드 설정 기능 추가 (쿨톤 프리미엄)
- **요청**: 설정에 다크모드 추가, 고급스러운 쿨톤 비주얼
- **변경**:
  - `src/styles/globals.css`: CSS 변수 시스템 추가 (라이트/다크 모드)
    - 다크모드: 쿨 블루-그레이 톤 (#0D0F12 배경, #F0F2F5 텍스트)
    - 차트 색상 변수 추가
  - `tailwind.config.js`: 색상을 CSS 변수 참조로 변경
  - `src/hooks/useTheme.ts`: 테마 관리 훅 생성
    - 시스템 테마 자동 감지 (prefers-color-scheme)
    - localStorage 동기화 (FOUC 방지)
    - meta theme-color 동적 업데이트
  - `index.html`: FOUC 방지 인라인 스크립트 추가
  - `src/App.tsx`: useTheme 훅 초기화
  - `src/components/common/SegmentedControl.tsx`: 세그먼트 컨트롤 컴포넌트 생성
  - `src/pages/SettingsPage.tsx`: 테마 토글 UI 섹션 추가
    - 3가지 옵션: 라이트/다크/시스템
    - Sun/Moon/Monitor 아이콘
- **결과**: 쿨톤 프리미엄 다크모드 완료, 타입체크 통과
- **피드백**: 테마 설정이 안됨 → #20에서 수정

### #20 다크모드 설정 버그 수정
- **요청**: 테마 설정 변경이 동작하지 않는 문제 해결
- **원인 (1차)**:
  - `settingsStore.updateSettings()`에서 `state.settings`가 null일 때 상태 업데이트 실패
  - 테마 변경 시 즉시 적용되지 않고 DB 라운드트립 후에만 반영
- **원인 (2차)**:
  - `db.settings.update()`가 레코드 미존재 시 실패
  - SegmentedControl 버튼 상태가 업데이트되지 않음
- **변경**:
  - `src/stores/settingsStore.ts`:
    - updateSettings 완전 재작성
    - DB에서 현재 설정 먼저 조회
    - 설정 없으면 DEFAULT_SETTINGS로 생성
    - `db.settings.put()` (upsert) 사용
    - Zustand 상태 직접 업데이트
  - `src/hooks/useTheme.ts`: handleSetTheme에서 테마 즉시 적용 후 DB 저장
- **결과**: 테마 설정 즉시 반영, 버튼 상태 동기화, 새로고침 후에도 유지, 타입체크 통과

### #21 범용 Excel 데이터 임포트 시스템 구축
- **요청**: 다른 앱(머니매니저 등) 데이터를 온전히 반영할 수 있는 프로세스 구축
- **분석 결과** (2026-01-07.xlsx):
  - 총 6,121건 거래 (2018-09-23 ~ 2026-02-14)
  - 18개 카테고리 (식비, 교통/차량, 문화생활, 월급 등)
  - 16개 결제수단 (현대카드, 하나은행, 카카오뱅크 등)
  - 수입/지출/차액수입 3가지 타입
- **변경**:
  - `scripts/analyze-excel.cjs`: Excel 파일 분석 스크립트 생성
  - `src/services/excelImport.ts`: 범용 Excel 임포트 서비스
    - 카테고리 매핑 테이블 (18개 → PinPig 카테고리)
    - 결제수단 매핑 테이블 (16개 은행/카드)
    - Excel 시리얼 날짜 → JS Date 변환
    - 미리보기 기능 (previewExcelImport)
    - 가져오기 기능 (importExcelData)
    - 누락 카테고리/결제수단 자동 생성
  - `src/pages/ImportDataPage.tsx`: Excel 업로드 UI
    - 4단계 플로우: 업로드 → 미리보기 → 가져오기 → 완료
    - 카테고리/결제수단 미리보기
    - 기존 데이터 삭제 옵션
    - 샘플 데이터 표시
  - `src/pages/SettingsPage.tsx`: 임포트 버튼 → 새 페이지로 이동
  - `src/App.tsx`: `/settings/import` 라우트 추가
- **결과**: Excel 파일 직접 업로드 및 가져오기 가능, 타입체크 통과

### #21 네비게이션 바 아이콘 및 헤더 통일
- **요청**: 탭바 아이콘/라벨 변경 → 귀여운 브랜드 스타일 + 헤더 일치
- **변경**:
  - `src/components/layout/TabBar.tsx`:
    - Sparkle → PiggyBank 🐷 (오늘)
    - Layers → ClipboardList 📋 (기록)
    - Waves → PieChart 📊, 라벨 '흐름' → '분석'
    - SlidersHorizontal → Settings ⚙️ (설정)
  - `src/pages/HistoryPage.tsx`: 헤더 "내역" → "기록"
  - `src/pages/StatsPage.tsx`: 헤더 "통계" → "분석"
- **결과**: 탭바 아이콘과 페이지 헤더 일관성 확보

### #22 결제수단 관리 페이지 개선 (순서 변경 + CRUD UI)
- **요청**: 결제수단 순서 변경 기능(드래그앤드롭) 및 CRUD UI 개선
- **변경**:
  - `src/stores/paymentMethodStore.ts`:
    - `reorderPaymentMethods()` 함수 추가
    - DB 트랜잭션으로 순서 일괄 업데이트
  - `src/pages/PaymentMethodManagePage.tsx`:
    - 드래그앤드롭 구현 (마우스 + 터치 지원)
    - 순서 변경 버튼 (↑/↓) 추가 (접근성)
    - 드래그 시 시각적 피드백 (opacity, scale, ring)
    - 색상 선택 시 체크마크 표시
    - 취소/저장 버튼에 아이콘 추가
    - 다크모드 지원 강화
    - 안내 메시지 개선
- **결과**: 드래그앤드롭 + 버튼으로 순서 변경 가능, 타입체크 통과

### #23 카테고리 관리 페이지 개선 (순서 변경 + CRUD UI)
- **요청**: 카테고리 관리 화면도 동일한 수준으로 개선
- **변경**:
  - `src/pages/CategoryManagePage.tsx`:
    - 드래그앤드롭 구현 (마우스 + 터치 지원)
    - 순서 변경 버튼 (↑/↓) 추가 (접근성)
    - 드래그 시 시각적 피드백 (opacity, scale, ring)
    - 색상 선택 시 체크마크 표시
    - 취소/저장 버튼에 아이콘(X/✓) 추가
    - 다크모드 전체 지원 (리스트, 모달, 탭, 에러메시지)
    - 안내 메시지 개선 (지출 카테고리 예산 설명 추가)
    - 모달 입력필드 포커스 시 테두리 효과
- **결과**: 결제수단과 동일한 UX로 통일, 타입체크 통과

### #24 기록 탭 검색 및 필터 기능 구현
- **요청**: 검색 기능 활성화, 필터 작동 활성화 (기간/카테고리)
- **변경**: `src/pages/HistoryPage.tsx` 전면 리팩토링
  - 검색 기능: 헤더 검색 모드 토글, 거래설명/카테고리명/메모 검색
  - 기간 필터: 월 선택 모달 (좌우 네비게이션)
  - 카테고리 필터: 다중 선택 모달 (지출/수입 구분)
  - 검색 결과 카운트 표시
  - 필터 초기화 버튼
- **결과**: 검색 + 기간/카테고리 필터 모두 작동, 타입체크 통과

### #25 기록 탭 월 선택 모달 및 검색 개선
- **요청**:
  - 기간 선택 모달 개선 (하단 네비게이션 가림, 년/월 선택 불편)
  - 월 이동 바로가기 추가
  - 검색 시 전체 기간 검색
- **변경**:
  - `src/pages/HistoryPage.tsx`
    - 년도 네비게이션 + 월 그리드 UI (4x3)
    - 미래 월 비활성화, safe-bottom 패딩
    - 필터바에 ◀ ▶ 버튼 추가 (모달 없이 월 이동)
    - 검색 시 전체 기간 검색 (debounce 300ms)
    - 검색 중 "전체 기간" 표시, "검색 중..." 로딩 상태
  - `src/stores/transactionStore.ts`
    - `searchAllTransactions` 액션 추가
- **결과**:
  - 년도 변경 12번 → 1번 클릭
  - 이전/다음 달 바로 이동 가능
  - 검색 시 전체 기간에서 거래 검색
  - 타입체크 통과

### #26 월 예산 시스템 전면 개선
- **요청**: 월 예산 설정, 예산 설정 마법사, 반복 거래, 예상 수입/지출, 월 예산구조 세팅 구체적 개선
- **변경**:
  - `src/types/index.ts`: 새 타입 추가
    - RecurrenceFrequency (daily/weekly/biweekly/monthly/yearly)
    - RecurringTransaction (반복 거래 정의)
    - ProjectedTransaction (예정 거래 표시용)
    - MonthlyBudgetStructure (예상 수입/지출/잔액 구조)
    - CategoryBudgetSummary (카테고리별 예산 요약)
  - `src/services/database.ts`: DB 스키마 v3 업그레이드
    - recurringTransactions 테이블 추가
  - `src/services/queries.ts`: 반복 거래 쿼리 함수 추가 (~350줄)
    - getRecurringTransactions, createRecurringTransaction, updateRecurringTransaction, deleteRecurringTransaction
    - calculateNextExecutionDate (빈도별 다음 실행일 계산)
    - getProjectedTransactions (예정 거래 생성)
    - getMonthlyBudgetStructure (예상 잔액 계산)
    - getUpcomingRecurringTransactions (N일 내 예정 거래)
  - `src/pages/RecurringTransactionPage.tsx`: 반복 거래 관리 화면 신규 생성
    - 수입/지출 타입 토글
    - 빈도 선택 (매일/매주/2주마다/매월/매년)
    - 매월 시 일자 선택
    - 카테고리/결제수단 선택
    - 활성화 토글
    - 월간 예상 수입/지출 합계 표시
  - `src/pages/BudgetWizardPage.tsx`: 5단계로 확장
    - Step 4: 카테고리별 예산 배분 (슬라이더 UI)
    - 자동 배분 / 수동 조절 토글
    - 배분 합계 표시
  - `src/pages/HomePage.tsx`: 예상 잔액 및 예정 거래 표시
    - 예상 수입/지출 카드 (녹색/빨간색)
    - 예정된 거래 섹션 (7일 내)
    - 잔액 계산에 예상 수입/지출 반영
  - `src/pages/SettingsPage.tsx`: 반복 거래 관리 메뉴 추가
  - `src/App.tsx`: `/settings/recurring` 라우트 추가
- **결과**: 월 예산 시스템 전면 개선 완료, 타입체크 통과

### #27 관리 페이지 FAB 연동 및 하단 패딩 개선
- **요청**: 카테고리/결제수단/반복거래 관리 화면의 저장 버튼을 TabBar FAB로 통합
- **변경**:
  - `src/stores/fabStore.ts`: FAB 상태 관리 Store 신규 생성
    - canSubmit, isVisible, submitHandler, cancelHandler
    - setSubmitHandler, setCanSubmit, triggerSubmit 액션
    - reset() 함수 (페이지 이동 시 상태 초기화)
  - `src/stores/addPageStore.ts`: fabStore 재사용 (backward compatibility)
  - `src/components/layout/TabBar.tsx`:
    - FAB_SUBMIT_PAGES 배열로 FAB 저장 모드 페이지 관리
    - /settings/categories, /settings/payment-methods, /settings/recurring 추가
  - `src/pages/CategoryManagePage.tsx`:
    - FAB 연동 (useCallback + useEffect)
    - 모달 인라인 저장 버튼 제거, 안내 문구 추가
    - pb-24 하단 패딩 추가
  - `src/pages/PaymentMethodManagePage.tsx`:
    - FAB 연동 (useCallback + useEffect)
    - 모달 인라인 저장 버튼 제거, 안내 문구 추가
    - pb-24 하단 패딩 추가
  - `src/pages/RecurringTransactionPage.tsx`:
    - FAB 연동 (useCallback + useEffect)
    - 모달 인라인 저장 버튼 제거, 안내 문구 추가
    - pb-24 하단 패딩 추가
- **결과**: 관리 페이지 저장 버튼 FAB 통합, 하단 네비게이션 가림 문제 해결, 타입체크 통과

### #28 하단 네비게이션 바 가림 문제 근본 해결
- **요청**: 여러 페이지에서 반복되는 하단 네비게이션 가림 문제의 근본적 해결
- **변경**:
  - `src/styles/globals.css`: CSS 변수 정의
    - `--nav-height: 64px` (TabBar h-16)
    - `--nav-safe-height: calc(64px + env(safe-area-inset-bottom))`
  - `tailwind.config.js`: spacing에 `nav` 추가 (`var(--nav-safe-height)`)
  - `src/App.tsx`: `main pb-20` → `pb-nav` 변경
  - 페이지 컨테이너 `pb-20/pb-24` 제거 (App.tsx에서 일괄 처리):
    - HomePage, HistoryPage, StatsPage, SettingsPage
    - AnnualExpensesPage, MonthlyReviewPage, ImportDataPage
    - RecurringTransactionPage, PaymentMethodManagePage, CategoryManagePage
  - 모달/오버레이 `pb-20/pb-24` → `pb-nav` 변경:
    - HistoryPage (MonthPicker, CategoryPicker)
    - CategoryManagePage (Add/Edit 모달)
    - CategoryTrendModal
- **결과**: `pb-nav` 클래스로 일관된 하단 여백 관리, 타입체크 통과

### #29 바텀시트 모달 z-index 수정
- **요청**: 분석 페이지 카테고리 상세(CategoryTrendModal) TOP5 항목이 TabBar에 가려지는 문제
- **원인**: TabBar와 모달 모두 `z-50` 사용 → TabBar가 모달 위에 겹침
- **변경**: 모든 바텀시트 모달 `z-50` → `z-[60]` 변경
  - `CategoryTrendModal.tsx`
  - `CategoryManagePage.tsx` (Add/Edit 모달)
  - `AnnualExpensesPage.tsx` (Detected Patterns 모달)
  - `HistoryPage.tsx` (MonthPicker, CategoryPicker 모달)
  - `RecurringTransactionPage.tsx` (Add/Edit 모달)
- **결과**: 모달이 TabBar 위에 표시되어 콘텐츠 가림 해결, 타입체크 통과

### #30 모달 배경 오버레이 일관성 개선
- **요청**: 모달 열릴 때 메인화면 어둡게 처리하여 집중도 향상
- **변경**: `CategoryTrendModal.tsx` 배경 `bg-ink-black/30` → `bg-black/50`
- **결과**: 모든 바텀시트 모달 배경 `bg-black/50`으로 통일, 타입체크 통과

### #31 리스트 스와이프 삭제 기능 추가
- **요청**: 반복거래/카테고리/결제수단 리스트에서 스와이프로 삭제 기능 추가
- **변경**:
  - `src/components/common/SwipeToDelete.tsx` (신규): 재사용 가능한 스와이프 삭제 컴포넌트
    - 좌측 스와이프로 삭제 버튼 노출 (80px 임계값)
    - 터치 + 마우스 드래그 지원
    - confirmMessage prop으로 커스텀 확인 메시지
    - disabled prop으로 삭제 불가 항목 처리 (기본 카테고리/결제수단)
  - `src/components/common/index.ts`: SwipeToDelete export 추가
  - `src/pages/RecurringTransactionPage.tsx`: 수입/지출 리스트 아이템에 SwipeToDelete 적용
  - `src/pages/CategoryManagePage.tsx`: 카테고리 리스트 아이템에 SwipeToDelete 적용 (기본 카테고리는 disabled)
  - `src/pages/PaymentMethodManagePage.tsx`: 결제수단 리스트 아이템에 SwipeToDelete 적용 (기본 결제수단은 disabled)
- **결과**: 모든 관리 페이지에서 스와이프 삭제 지원, 타입체크 통과
- **피드백**: 버튼 제거 요청 → #32

### #32 관리 페이지 리스트 버튼 간소화
- **요청**: 스와이프 삭제 적용 후 위/아래 화살표, 수정, 휴지통 버튼 삭제
- **변경**:
  - `src/pages/CategoryManagePage.tsx`:
    - 순서 변경 버튼(↑/↓), 수정 버튼, 삭제 버튼 제거
    - 아이템 탭으로 수정 모달 열기 (onClick 추가)
    - moveItem 함수 및 Trash2 import 제거
  - `src/pages/PaymentMethodManagePage.tsx`:
    - 순서 변경 버튼(↑/↓), 수정 버튼, 삭제 버튼 제거
    - 아이템 탭으로 수정 모달 열기 (onClick 추가)
    - moveItem 함수 및 Trash2 import 제거
- **결과**: 리스트 UI 간소화 (드래그로 순서 변경, 탭으로 수정, 스와이프로 삭제), 타입체크 통과
- **피드백**: 모달 방식 통일 요청 → #33

### #33 결제수단 관리 모달 방식 통일
- **요청**: 카테고리/결제수단 관리 CRUD UX 일관성 확보, 하단 모달 방식으로 통일
- **변경**:
  - `src/pages/PaymentMethodManagePage.tsx`:
    - 인라인 폼 → 하단 바텀시트 모달로 변경
    - CategoryManagePage와 동일한 모달 구조 적용
    - 배경 오버레이 bg-black/50, z-[60]
    - pb-nav로 하단 네비게이션 여백 확보
    - rounded-t-2xl, animate-slide-up 애니메이션
- **결과**: 카테고리/결제수단 관리 UX 통일, 타입체크 통과
- **인터랙션 패턴**:
  - 순서 변경: ≡ 드래그
  - 수정: 아이템 탭 → 하단 모달
  - 삭제: 좌측 스와이프

### #34 하단 네비게이션 가려짐 근본 해결
- **요청**: 예산 설정 마법사, 기록 탭 등에서 하단 버튼/콘텐츠가 TabBar에 가려지는 문제 근본적 해결
- **원인 분석**:
  - App.tsx의 `<main className="pb-nav">`는 페이지 **밖**에 패딩 추가
  - 페이지들이 `min-h-screen`을 사용하여 콘텐츠가 넘칠 때 TabBar 뒤로 스크롤됨
  - 해결: 페이지 루트 또는 스크롤 컨테이너에 직접 `pb-nav` 추가 필요
- **변경**:
  - `src/pages/BudgetWizardPage.tsx`: 스크롤 영역에 `pb-nav` 추가
  - `src/pages/HistoryPage.tsx`: 루트 컨테이너에 `pb-nav` 추가
  - `src/pages/HomePage.tsx`: 루트에 `pb-nav` 추가
  - `src/pages/StatsPage.tsx`: 루트에 `pb-nav` 추가
  - `src/pages/SettingsPage.tsx`: 루트에 `pb-nav` 추가
  - `src/pages/CategoryManagePage.tsx`: 루트에 `pb-nav` 추가
  - `src/pages/PaymentMethodManagePage.tsx`: 루트에 `pb-nav` 추가
  - `src/pages/MonthlyReviewPage.tsx`: 루트에 `pb-nav` 추가
  - `src/pages/AnnualExpensesPage.tsx`: 루트에 `pb-nav` 추가
  - `src/pages/ImportDataPage.tsx`: 루트에 `pb-nav` 추가
  - `src/pages/RecurringTransactionPage.tsx`: `pb-24` → `pb-nav` 변경
  - `src/pages/AddPage.tsx`: 스크롤 컨테이너의 `pb-24` → `pb-nav` 변경
- **결과**: 모든 페이지에서 하단 콘텐츠가 TabBar에 가려지지 않음, 타입체크 통과
- **패턴 정립**:
  - 페이지 루트: `<div className="min-h-screen ... pb-nav">`
  - 내부 스크롤: `<div className="overflow-auto pb-nav">`

### #35 모달 위 FAB 버튼 가림 문제 해결
- **요청**: 하단 모달이 열릴 때 FAB 저장 버튼이 가려지는 문제
- **원인**: 모달 `z-[60]`이 TabBar `z-50`보다 높아 FAB 버튼 가림
- **변경**:
  - `src/components/layout/TabBar.tsx`: FAB 버튼에 `z-[70]` 추가하여 모달 위에 표시
- **결과**: 모달이 열려도 FAB 버튼 접근 가능, 타입체크 통과

### #36 모달 내부 하단 여백 수정
- **요청**: 결제수단/카테고리 수정 모달 콘텐츠가 하단 네비게이션에 가려지는 문제
- **원인**: `pb-nav`가 모달 컨테이너에 있어 내부 콘텐츠의 패딩이 부족
- **변경**:
  - `src/pages/PaymentMethodManagePage.tsx`: 모달 `pb-nav` 위치를 외부 → 내부 `p-6` div로 이동
  - `src/pages/CategoryManagePage.tsx`: 동일하게 수정
- **결과**: 모달 콘텐츠가 네비게이션 영역과 겹치지 않음, 타입체크 통과

### #37 FAB 포함 하단 여백 근본 수정
- **요청**: 모달 하단 콘텐츠가 FAB 버튼에 의해 여전히 가려지는 문제
- **근본 원인 분석**:
  - `--nav-safe-height`가 64px로 TabBar 높이만 반영
  - FAB 버튼이 `-mt-4` (16px)만큼 TabBar 위로 돌출
  - 실제 필요한 안전 높이: 64px + 16px = 80px
- **변경**:
  - `src/styles/globals.css`: `--nav-safe-height` 값을 `calc(64px + ...)` → `calc(80px + ...)` 변경
  - 주석 업데이트: "TabBar h-16 = 64px + FAB offset 16px + safe area"
- **결과**: 모든 `pb-nav` 사용 영역에서 FAB 버튼 가림 해결

### #38 마지막 콘텐츠 섹션 및 Footer 하단 여백 추가 수정
- **요청**: 분석/홈/기록/설정 탭 마지막 콘텐츠가 TabBar+FAB에 가려지는 문제, 예산 설정 마법사/반복 거래 관리 Footer 가림 문제
- **원인 분석**:
  - 페이지 루트의 `pb-nav`만으로는 마지막 콘텐츠 섹션이 FAB에 닿음
  - FAB이 `-mt-4`로 16px 위로 돌출되어 추가 여백 필요
  - BudgetWizardPage, RecurringTransactionPage의 Footer가 `pb-safe`(safe-area만) 사용 → TabBar 높이 미반영
- **변경**:
  - 마지막 콘텐츠 섹션에 `pb-20` (80px) 추가:
    - `src/pages/StatsPage.tsx`: Insights 섹션 `py-4` → `py-4 pb-20`
    - `src/pages/HomePage.tsx`: Recent Transactions 섹션 `mt-6` → `mt-6 pb-20`
    - `src/pages/HistoryPage.tsx`: 빈 상태 및 데이터 리스트에 `pb-20` 추가
    - `src/pages/SettingsPage.tsx`: App Info 섹션 `px-6 pt-6` → `px-6 pt-6 pb-20`
  - Footer 패딩 `pb-safe` → `pb-nav` 변경:
    - `src/pages/BudgetWizardPage.tsx`: Footer `pb-safe` → `pb-nav`
    - `src/pages/RecurringTransactionPage.tsx`: 입력 폼 영역 `pb-safe` → `pb-nav`
- **결과**: 모든 탭 마지막 콘텐츠 및 마법사 페이지 Footer가 TabBar+FAB에 가려지지 않음, 타입체크 통과
- **패턴 정립**:
  - 스크롤 페이지 마지막 섹션: `pb-20` 추가 (FAB 영역 확보)
  - 고정 Footer: `pb-nav` 사용 (TabBar+safe-area 확보)
- **추가 수정**: BudgetWizardPage 루트 컨테이너에 `pb-nav` 추가
  - 원인: `min-h-screen` (100vh)가 iOS Safari에서 TabBar 영역 포함하여 Footer가 밀림
  - 해결: 루트에 `pb-nav` 추가, Footer에서 중복 `pb-nav` 제거
  - 최종 구조: `<div className="min-h-screen flex flex-col pb-nav">` + Footer는 `p-6 border-t`만

### #39 거래 수정 및 상세화면 구현
- **요청**: 지출/수입 기록 수정 및 상세화면 기획 및 개발
- **변경**:
  - `src/components/transaction/TransactionDetailModal.tsx`: 거래 상세 모달 신규 생성
    - 금액 (수입/지출 구분 색상)
    - 카테고리 (아이콘, 컬러)
    - 일시, 결제수단, 가맹점, 메모 표시
    - 삭제/수정 버튼 (하단 액션 버튼)
    - 삭제 시 confirm 확인
  - `src/components/transaction/index.ts`: export 파일 생성
  - `src/pages/EditTransactionPage.tsx`: 거래 수정 화면 신규 생성
    - AddPage와 동일한 UI 구조
    - URL 파라미터로 거래 ID 받아서 기존 데이터 로드
    - FAB 저장 버튼 연동
    - 타입 변경 시 카테고리 자동 전환
  - `src/pages/HistoryPage.tsx`:
    - 거래 항목 탭 시 상세 모달 열림
    - `cursor-pointer active:bg-paper-light` 탭 피드백 추가
    - TransactionDetailModal 연동
  - `src/App.tsx`: `/transaction/:id/edit` 라우트 추가
- **UX 플로우**:
  - 기록 탭 → 거래 항목 탭 → 상세 모달
  - 상세 모달 → 수정 버튼 → 수정 화면
  - 상세 모달 → 삭제 버튼 → 확인 후 삭제
- **결과**: 거래 상세/수정/삭제 완료, 타입체크 통과

### #40 거래 상세/수정 페이지 방식 변경
- **요청**:
  - 모달 방식 → 별도 페이지로 변경
  - 오늘 탭(HomePage)에서도 거래 수정 접근 가능하게
- **변경**:
  - `src/pages/TransactionDetailPage.tsx` 신규 생성 (상세+수정 통합 페이지)
  - `src/pages/HistoryPage.tsx`: 모달 제거, 클릭 시 `/transaction/:id`로 이동
  - `src/pages/HomePage.tsx`: 최근 거래 클릭 시 `/transaction/:id`로 이동
  - `src/App.tsx`: `/transaction/:id` 라우트 추가
- **결과**: 모달 → 페이지 방식 전환 완료, 홈/내역 양쪽에서 접근 가능, 타입체크 통과

### #41 지출/수입 작성화면 UX 개선
- **요청**:
  1. 하단 저장 버튼 → 중앙 FAB 체크(V) 버튼으로 통일
  2. 카테고리 영역 좌우 스크롤 → 5열 고정 그리드 (전체 보이게)
  3. UX 네러티브가 자연스러운 레이아웃 재구성
- **변경**:
  - `src/pages/AddPage.tsx`:
    - 헤더에서 저장 버튼 제거 (X 닫기 버튼만 유지)
    - 저장은 TabBar FAB 체크(V) 버튼으로 통일 (기존 연동 유지)
    - 카테고리: `overflow-x-auto` 스크롤 → `grid grid-cols-5` 고정 그리드
    - 타입 토글: 둥근 pill 버튼으로 변경 (`rounded-full`)
    - 레이아웃 재구성:
      - 지출/수입 선택 → 금액 입력 → 카테고리 선택 (5열 그리드)
      - 구분선 후 추가 정보: 날짜 → 결제수단(지출 시) → 가맹점 → 메모
    - 아이콘/입력필드 정렬 일관성 개선 (`gap-4`)
- **결과**: 타입체크 통과, FAB 저장 동작 유지, 카테고리 전체 표시
- **피드백**: 글자/아이콘 크기 불일치 → #42에서 개선

### #42 AddPage 스타일 통일
- **요청**: 글자 크기, 아이콘 크기가 제각각인 문제 분석 및 개선
- **분석**:
  | 요소 | 변경 전 | 변경 후 |
  |------|--------|--------|
  | 금액 "원" | text-title (18px) | text-amount (20px) - 금액과 조화 |
  | 카테고리 아이콘 | 22px | 24px - 강조 영역 |
  | 결제수단 칩 아이콘 | 14px | 16px - 칩 크기에 맞게 |
  | 결제수단 칩 텍스트 | text-caption (11px) | text-sub (13px) - 가독성 |
  | 리스트 아이콘 | 20px | 20px (유지) |
- **통일 기준 정의**:
  - 리스트 아이콘: 20px
  - 칩 내 아이콘: 16px
  - 카테고리 아이콘: 24px (강조)
  - 본문 텍스트: text-body (15px)
  - 칩 텍스트: text-sub (13px)
  - 라벨/보조: text-caption (11px)
- **변경**: `src/pages/AddPage.tsx` 스타일 통일 적용
- **결과**: 타입체크 통과, 일관된 시각적 위계 확립
- **피드백**: 편의성 저하 느낌 → #43에서 레이아웃 재구성

### #43 AddPage 레이아웃 재구성 및 UX 개선
- **요청**: 지출/수입 토글 헤더 이동, 편의성 저하 원인 분석 및 개선
- **원인 분석**:
  1. 금액 입력 영역이 작고 눈에 안 띔 - 핵심인데 화면 중간에 작은 영역
  2. 스크롤 필요한 긴 폼 - 한 화면에 안 보여서 아래 내용 존재 여부 모름
  3. 시각적 우선순위 부재 - 필수(금액, 카테고리) vs 선택(날짜, 가맹점)의 구분 약함
  4. 입력 흐름 단절 - 금액 → 스크롤 → 카테고리 → 스크롤 → 추가 정보
- **개선 방향**:
  - 금액 입력을 화면 중앙에 크게 배치 (Hero Section)
  - 카테고리는 하단 고정 (키보드 위치와 유사)
  - 선택 정보(날짜, 결제수단, 메모)는 접힌 상태로 기본 숨김
  - Quick Info Bar로 날짜/결제수단 빠른 확인 및 변경
- **변경**:
  - `src/pages/AddPage.tsx`:
    - 지출/수입 토글 → 헤더 중앙으로 이동 (SegmentedControl 스타일)
    - 금액 입력 → flex-1로 화면 중앙 확장 (min-h-[200px])
    - Quick Info Bar 추가 (오늘/어제 + 결제수단 칩)
    - 카테고리 그리드 → 하단 고정 (border-t로 구분)
    - 상세 정보 → 접기/펼치기 토글 (showDetails state)
    - 상세 섹션 → 결제수단, 가맹점, 메모 (접힌 상태 기본)
- **결과**: 타입체크 통과, 3터치 원칙 강화 (금액 → 카테고리 → FAB 저장)
- **피드백**: 접기/펼치기 상세 섹션이 TabBar에 가려짐 → 아래에서 수정

### #44 AddPage 상세 섹션 하단 가림 문제 수정
- **요청**: 상세 정보 접기/펼치기 섹션이 TabBar에 가려지는 문제
- **원인**: 메인 콘텐츠 div에 `pb-nav`가 없고, 확장된 상세 섹션이 TabBar 영역과 겹침
- **변경**:
  - `src/pages/AddPage.tsx`:
    - 메인 콘텐츠 영역에 `overflow-y-auto` 추가 (스크롤 가능하게)
    - 상세 섹션에 `pb-nav` 추가 (TabBar+FAB 높이 확보)
    - 상세 섹션이 접혀있을 때를 위한 Bottom Spacer 추가
- **결과**: 상세 섹션 펼침/접힘 상태 모두에서 콘텐츠가 TabBar에 가려지지 않음

### #45 AddPage 전면 재구성 - 네러티브 기반 UX
- **요청**: 금액 입력 > 일시/카테고리/수단 > 태그/코멘트 네러티브로 전면 개선
- **설계 원칙**:
  1. **금액 입력** (Hero) - 핵심 액션, 화면 상단 집중
  2. **일시/카테고리/수단** (필수 메타) - 컴팩트 칩 형태, 탭하면 펼침
  3. **태그/코멘트** (선택 보조) - 기본 접힘, 필요 시 펼침
- **인터랙션 전략**:
  - `ExpandedSection` 타입으로 한 번에 하나의 섹션만 펼침
  - 카테고리/결제수단 선택 시 150ms 후 자동 접힘 (컴팩트 모드 전환)
  - 날짜는 기존 DateTimePicker 모달 유지
- **변경**:
  - `src/pages/AddPage.tsx` 전면 재작성:
    - Hero Section: 금액 입력만 집중 (py-8 패딩)
    - 날짜 선택: rounded-xl 버튼, 날짜+시간 한 줄 표시
    - 카테고리 선택: 컴팩트 칩 (선택된 아이콘+이름) + 펼침 시 5열 그리드
    - 결제수단 선택: 컴팩트 칩 + 펼침 시 wrap flex 칩 목록
    - 메모 추가: 컴팩트 칩 + 펼침 시 어디서?/메모 입력 필드
    - 불필요한 import 제거 (Store, FileText → MessageSquare, Tag)
- **UX 개선점**:
  - 한 화면에 모든 필수 정보 확인 가능 (스크롤 최소화)
  - 선택 완료 시 자동 접힘으로 진행감 제공
  - 3터치 원칙 강화: 금액 → 카테고리 탭 → FAB 저장
- **결과**: 타입체크 통과, 네러티브 기반 입력 흐름 완성

### #46 AddPage 미니멀 칩 전환 및 첫 진입 UX 개선
- **요청**: 선택 완료 시 더 미니멀한 칩 형태로 전환, 첫 진입 시 카테고리 열림 기본값
- **설계 원칙**:
  1. **첫 진입**: 카테고리 섹션 열림 상태 (사용자 가이드)
  2. **선택 완료 후**: 버튼 → 미니멀 칩 전환 (시각적 진행감)
  3. **재편집 용이**: 칩 탭하면 해당 섹션 재열림
- **상태 관리 추가**:
  - `hasUserSelectedCategory`, `hasUserSelectedPayment`: 사용자 직접 선택 여부 추적
  - `showCategoryAsChip`, `showPaymentAsChip`: 칩 vs 풀 버튼 렌더링 결정
- **변경**:
  - `src/pages/AddPage.tsx`:
    - 초기 상태: `expandedSection: 'category'` (첫 진입 시 카테고리 열림)
    - Hero Section 하단에 미니멀 칩 영역 추가:
      - 날짜 칩: `bg-paper-light`, 14px 아이콘, `text-sub`
      - 카테고리 칩: `bg-ink-black text-paper-white`, 14px 아이콘 (강조)
      - 결제수단 칩: `bg-paper-light`, 14px 아이콘
      - 메모 칩: `truncate max-w-[150px]`로 긴 텍스트 처리
    - 조건부 렌더링: 칩 표시 시 해당 풀 버튼 숨김
    - 타입 변경(지출↔수입) 시 상태 리셋: 카테고리 열림으로 복귀
- **UX 플로우**:
  1. 첫 진입 → 카테고리 열림 (즉시 선택 가능)
  2. 카테고리 선택 → 150ms 후 접힘 → 미니 칩 표시
  3. 칩 탭 → 해당 섹션 재열림 (수정 가능)
- **결과**: 타입체크 통과, 첫 진입 가이드 + 선택 후 미니멀 UI 완성

### #47 분석 탭 (StatsPage) UX 개선
- **요청**:
  1. 헤더 월 이동을 기록 탭 수준의 날짜 선택 모달로 개선
  2. 파이그래프에 카테고리명/퍼센트 표시 쉽게 확인
  3. 파이차트 중앙 금액을 천원 단위로 표시 + 주석
- **변경**:
  - `src/pages/StatsPage.tsx`:
    - `showMonthPicker`, `pickerYear` 상태 추가
    - 헤더 월 네비게이션 → HistoryPage 스타일로 변경 (좌우 화살표 + 가운데 클릭 시 모달)
    - 월 선택 모달 추가 (년도 네비게이션 + 4x3 월 그리드)
    - import 추가: `ChevronDown`, `X`
  - `src/components/report/CategoryDonutChart.tsx`:
    - Recharts `Sector` 활용하여 호버 시 파이 조각 확대 + 라벨 표시
    - 차트 아래 범례 추가 (색상 점 + 카테고리명 + 퍼센트)
    - 중앙 금액 → 천원 단위로 표시 (formatThousandWon 함수)
    - "(천원)" 주석 표시
    - `activeIndex` 상태로 호버 인터랙션 연동
- **결과**: 타입체크 통과, 분석 탭 UX 개선 완료

### #48 AddPage 내러티브 재구성 및 UX 흐름 개선
- **요청**:
  1. 내러티브 순서 변경: 일시 → 금액 → 카테고리/결제수단 → 메모
  2. 결제수단도 첫 진입 시 펼침 기본값 (카테고리 선택 후)
  3. 메모 클릭 시 자동 커서 포커스
- **내러티브 설계**:
  | 순서 | 섹션 | 목적 |
  |-----|------|------|
  | 1 | 일시 | "언제?" - 상단 pill 버튼으로 즉시 확인/변경 |
  | 2 | 금액 | "얼마?" - Hero 영역, 핵심 입력 |
  | 3 | 카테고리/결제수단 | "어디에? 뭘로?" - 선택 후 자동 다음 단계 |
  | 4 | 메모 | "추가 정보" - 선택 입력 |
- **변경**:
  - `src/pages/AddPage.tsx`:
    - ref 분리: `amountInputRef`, `memoInputRef`
    - 일시 버튼: 상단 중앙 pill 형태로 이동 (Calendar 아이콘 + 날짜/시간)
    - 금액 칩 영역: 날짜 칩 제거 (상단으로 이동했으므로)
    - 카테고리 선택 후 → 자동으로 결제수단 펼침 (지출 && !hasUserSelectedPayment)
    - `handleMemoToggle()`: 메모 펼칠 때 100ms 후 자동 포커스
    - 타입 변경 시 `hasUserSelectedPayment`도 함께 리셋
- **자동 흐름**:
  1. 첫 진입 → 카테고리 열림
  2. 카테고리 선택 → 150ms 후 결제수단 열림 (지출일 때)
  3. 결제수단 선택 → 150ms 후 접힘 → 칩 표시
  4. 메모 추가 클릭 → 자동 포커스 (어디서? 필드)
- **결과**: 타입체크 통과, 직관적인 순차 입력 흐름 완성
- **피드백**: 결제수단 칩 스타일 카테고리와 일관성 필요 → 아래에서 수정
- **추가 수정**: 결제수단 칩 `bg-paper-light` → `bg-ink-black text-paper-white`로 통일

### #49 AddPage 모바일 레이아웃 최적화
- **요청**: 여백과 레이아웃을 모바일 프레임에 최적화
- **변경**:
  - `src/pages/AddPage.tsx`:
    - 헤더: `h-14 px-4` → `h-12 px-3` (더 컴팩트)
    - 타입 토글: `p-1` → `p-0.5` (pill 여백 축소)
    - 메인 콘텐츠: `px-5` 통일 (기존 px-4/px-6 혼재)
    - 일시 버튼: `w-full` → `inline-flex` (좌측 정렬, 더 미니멀)
    - 금액 Hero: `py-6` → `py-5` (수직 여백 최적화)
    - 미니 칩: `gap-2 mt-4` → `gap-1.5 mt-3` (밀도 향상)
    - 칩 사이즈: `px-3 py-1.5 text-sub` → `px-2.5 py-1 text-caption` (더 컴팩트)
    - 카테고리 버튼: `w-8 h-8 px-4 py-3` → `w-9 h-9 px-3.5 py-2.5`
    - 카테고리 그리드: `gap-2 p-3 mt-2` → `gap-1 p-2.5 mt-1.5` (밀도 향상)
    - 카테고리 아이콘: `w-11 h-11` → `w-10 h-10` (약간 축소)
    - 결제수단 칩: `gap-2` → `gap-1.5`
    - 메모 섹션: `mt-4 p-4` → `mt-3 p-3` (더 컴팩트)
    - 하단 스페이서: `pb-nav` → `pb-nav mt-4` (여유 공간 추가)
- **최적화 원칙**:
  - 좌우 패딩 통일 (px-5)
  - 수직 여백 체계화 (2/3/5의 배수)
  - 터치 영역 유지하면서 시각적 밀도 향상
  - 모바일 뷰포트에서 스크롤 최소화
- **결과**: 타입체크 통과, 모바일 프레임에 최적화된 레이아웃
- **피드백**: 일시 칩 중앙 정렬, 금액 영역 중상단 위치 요청

### #50 AddPage 일시 칩 중앙 정렬 및 금액 위치 조정
- **요청**:
  1. 일시 칩을 화면 좌우 가운데로 위치
  2. 헤더와 본문 사이 여백 추가하여 금액이 중앙~중상단에 위치하도록
  3. 헤더-일시 간 여백 정확히 50px 확보
- **변경**:
  - `src/pages/AddPage.tsx`:
    - 일시 섹션: `pt-3 pb-2` → `pt-[50px] pb-4 flex justify-center`
    - 금액 Hero: `py-5` → `py-6` (수직 여백 확대)
- **효과**:
  - 일시 칩: 좌측 정렬 → 화면 중앙 정렬
  - 헤더-일시 간 여백 정확히 50px (Tailwind arbitrary value 사용)
  - 금액 입력이 시각적으로 중앙~중상단에 위치
- **추가 수정**: 금액-미니칩 간 여백 15px 추가
  - 미니멀 칩 영역: `mt-3` (12px) → `mt-[27px]` (27px)
- **결과**: 타입체크 통과, 금액과 칩 간의 시각적 분리 강화

### #51 TransactionDetailPage AddPage 구조로 개선
- **요청**:
  1. 거래 상세 화면을 지출/수입 입력 화면과 동일한 구조로 개선
  2. 저장 버튼 제거, 네비게이션 [+] 버튼을 [✓]로 변경
- **변경**:
  - `src/pages/TransactionDetailPage.tsx`:
    - 헤더: ChevronLeft → X 버튼, 타입 토글 중앙, 삭제 버튼 우측
    - 일시: 상단 중앙 pill 버튼 (AddPage와 동일)
    - 금액: Hero 영역 (AddPage와 동일)
    - 선택 완료 칩: 카테고리/결제수단/메모 미니 칩 패턴 적용
    - 카테고리/결제수단: 확장형 섹션 (AddPage와 동일)
    - 메모: 확장형 섹션 (AddPage와 동일)
    - 저장 버튼 제거 (FAB 체크 버튼으로 대체)
  - `src/components/layout/TabBar.tsx`:
    - `FAB_SUBMIT_PATTERNS`에 `/transaction/*` 추가
- **결과**: 타입체크 통과, AddPage와 일관된 UX 제공

### #52 메모 필드 통합 및 태그 시스템 구현
- **요청**:
  1. "어디서?" 필드와 "메모" 필드를 단일 필드로 통합
  2. 메모를 태그처럼 최근 사용 항목에서 빠르게 선택 가능하게
- **설계 (방안4 - 하이브리드)**:
  - 최근 사용 메모를 태그 칩으로 표시 (최대 6개)
  - 칩 탭하면 메모에 추가
  - 단일 입력 필드에서 자유롭게 작성 가능
- **변경**:
  - `src/services/queries.ts`:
    - `getRecentMemos(limit)` 함수 추가
    - 최근 200개 거래에서 유니크 메모 추출 (description/memo 호환)
  - `src/pages/AddPage.tsx`:
    - `description` state 제거, `memo`만 사용
    - `recentMemos` state 추가 (최근 태그 저장)
    - `handleTagSelect()` 함수 추가 (중복 방지 후 메모에 추가)
    - `availableTags` computed value (현재 메모와 겹치지 않는 태그만)
    - 메모 섹션 UI 변경:
      - "어디서?" + "메모" 두 필드 → "최근" 태그 칩 + 단일 입력 필드
    - `handleSubmit`: `description: ''` (deprecated, 호환성 유지)
- **UX 플로우**:
  1. 메모 추가 탭 → 섹션 펼침
  2. 최근 사용 태그 칩 표시 (있을 경우)
  3. 칩 탭 → 메모에 추가 (중복 시 무시)
  4. 직접 입력도 가능
- **결과**: 타입체크 통과, 태그 기반 빠른 메모 입력 완성

### #53 TransactionDetailPage AddPage 완전 동기화
- **요청**: 지출/수입 상세/수정 화면을 등록 화면과 동일한 수준으로 동기화
- **변경**:
  - `src/pages/TransactionDetailPage.tsx`:
    - `getRecentMemos` import 추가
    - `description` state 제거, `memo`만 사용
    - `recentMemos` state 추가 (태그 제안용)
    - 기존 description/memo → 통합 memo로 로드 (join + trim)
    - `handleTagSelect()`, `availableTags` 로직 추가
    - `handleSubmit`: `description: ''` (deprecated, 호환성 유지)
    - 일시 버튼 여백: `pt-8` → `pt-[50px]` (AddPage와 동일)
    - 미니 칩 영역: `mt-3` → `mt-[27px]` (AddPage와 동일)
    - 미니 칩 조건: `(description || memo)` → `memo`
    - 메모 섹션 UI: 태그 칩 + 단일 입력 필드 (AddPage와 동일)
- **동기화 항목**:
  | 항목 | AddPage | TransactionDetailPage |
  |------|---------|----------------------|
  | 일시 버튼 여백 | pt-[50px] | pt-[50px] ✓ |
  | 미니 칩 여백 | mt-[27px] | mt-[27px] ✓ |
  | 메모 필드 | memo only | memo only ✓ |
  | 태그 시스템 | 최근 6개 칩 | 최근 6개 칩 ✓ |
- **결과**: 타입체크 통과, AddPage와 TransactionDetailPage 완전 동기화

---

## 2026-01-08

### #54 iOS 단축어 딥링크 지원
- **요청**: iOS 단축어로 PWA 특정 화면(지출 작성)으로 바로 진입 가능하게
- **변경**:
  - `src/hooks/useDeepLink.ts`: URL 파라미터 처리 훅 생성
    - `?action=add` → /add (지출 작성)
    - `?action=add-income` → /add?type=income (수입 작성)
    - `?action=history|stats|settings` → 각 탭 이동
    - `?goto=/path` → 직접 경로 지정
  - `src/App.tsx`: useDeepLink 훅 연동
  - `src/pages/AddPage.tsx`: URL 쿼리 type 파라미터 처리
    - `useSearchParams` 추가
    - `/add?type=income` 접근 시 수입 모드로 시작
  - `vite.config.ts`: PWA manifest shortcuts 추가
    - 홈화면 롱프레스 시 "지출 추가", "수입 추가" 빠른 액션
- **iOS 단축어 설정 방법**:
  1. 단축어 앱 → 새 단축어 → "URL 열기" 액션
  2. URL: `https://도메인/?action=add` (지출) 또는 `?action=add-income` (수입)
  3. Safari에서 열기 선택
- **결과**: 타입체크 통과, iOS 단축어 및 PWA shortcuts 지원

### #59 오늘 탭 레이아웃 및 감성 메시지 개선
- **요청**:
  1. Hero Zone을 화면 1/3 지점에 위치 (헤더 여백 추가)
  2. 오늘 섹션을 화면 중앙에 위치
  3. 미지출 상태일 때 감성적인 메시지 표시
- **변경**:
  - `src/pages/HomePage.tsx`:
    - 루트 `flex flex-col` 구조로 변경
    - Hero Zone: `pt-16 pb-8` (상단 여백 확대)
    - 오늘 섹션: `flex-1 flex flex-col` (중앙 차지)
    - 하단 카드: `py-4` (pb-20 제거, 자연스러운 배치)
    - `getEmptyTodayMessage()` 함수 추가:
      - 시간대별 메시지 (아침/오후/저녁/밤)
      - 요일별 특별 메시지 (월요일, 금요일, 주말)
      - 랜덤 선택으로 다양성 확보
- **감성 메시지 예시**:
  | 시간대 | 메시지 |
  |-------|--------|
  | 아침 | "아직 조용한 아침이에요" / "새로운 하루가 시작됐어요" |
  | 오후 | "지갑이 쉬고 있는 오후" / "여유로운 하루를 보내고 있네요" |
  | 저녁 | "오늘은 차분한 하루였네요" / "지갑 없이도 충분한 하루" |
  | 밤 | "오늘 하루 수고했어요" / "잔잔하게 마무리되는 하루" |
  | 월요일 | "월요일, 아직 여유롭네요" |
  | 금요일 | "금요일, 아직 차분한 하루" |
  | 주말 | "느긋한 주말 오전" / "쉬어가는 주말" |
- **결과**: 타입체크 통과, 레이아웃 개선 + 감성 메시지 완성

### #58 오늘 탭 레이아웃 개선 - 하단 2컬럼 구조
- **요청**: 상중하(예정→오늘→과거) 대신 상하 구조로 변경
  - (상) 오늘 - 메인 영역
  - (하) 어제|예정 - 2컬럼 분할
- **변경**:
  - `src/pages/HomePage.tsx`:
    - 미래 요약 카드 상단 → 하단으로 이동
    - 어제/예정 카드를 `flex gap-3`로 2컬럼 배치
    - 한쪽만 있을 때 `max-w-[50%]`로 절반 폭 유지
    - 디자인 시스템 준수: `rounded-md`, `bg-paper-light`, `text-ink-*`
- **레이아웃 구조**:
  ```
  [Hero Zone]
  [오늘] - 메인 섹션
  [어제 | 예정] - 2컬럼 하단
  ```
- **시간 흐름**: 좌→우 (과거→미래) 직관적 배치
- **결과**: 타입체크 통과, 오늘 중심 + 하단 2컬럼 완성

### #57 오늘 탭 리디자인 - 오늘 중심 레이아웃
- **요청**: "오늘"에 집중, 미래/과거는 요약 형태로 표시, 상세는 기록 탭에서 확인
- **변경**:
  - `src/pages/HomePage.tsx` 전면 재작성:
    - 거래 분류 로직 추가: `todayTransactions`, `yesterdayTransactions`, `futureTransactions`
    - 각 카테고리별 요약 계산 (건수, 수입, 지출, 합계)
    - **Hero Zone**: 남은 예산, 진행률, 하루 예산 (유지)
    - **미래 요약 카드**: 이번 달 예정 거래 요약 (건수, +수입/-지출)
      - CalendarClock 아이콘, 파란색 배경
      - 탭 → 기록 탭으로 이동
    - **오늘 섹션**: 메인 영역, 전체 거래 리스트 표시
      - 카테고리 컬러 아이콘
      - 시간, 카테고리명, 금액 표시
      - 오늘 합계 헤더에 표시
      - 빈 상태: "오늘은 아직 거래가 없어요"
    - **어제 요약 카드**: 어제 거래 요약 (건수, 합계)
      - History 아이콘, 회색 배경
      - 탭 → 기록 탭으로 이동
    - 불필요한 섹션 제거: 예정된 거래(RecurringTransaction), 최근 거래
- **레이아웃 구조**:
  ```
  [Hero Zone - 남은 예산]
  [미래 요약 카드] → 기록 탭
  [오늘] - 메인 섹션, 전체 리스트
  [어제 요약 카드] → 기록 탭
  ```
- **결과**: 타입체크 통과, 오늘 중심 UX 완성

### #56 기록 탭 UX 개선 - 오늘 위치 스크롤 및 Snap Scroll
- **요청**:
  1. 기록 화면 기본값이 '오늘(현시점)'이 되도록
  2. 탭 이동시 스크롤 위치가 오늘로 세팅
  3. 스크롤 이동시 일단위로 자연스럽게 걸치도록 (snap scroll)
- **변경**:
  - `src/pages/HistoryPage.tsx`:
    - `scrollContainerRef`, `todayGroupRef` 추가
    - `hasScrolledToToday` state로 최초 1회 스크롤 제어
    - `scrollToToday()` 함수: 오늘 날짜 그룹으로 자동 스크롤
    - 데이터 로드 후 100ms 딜레이로 오늘 위치로 스크롤
    - 스크롤 컨테이너에 `snap-y snap-proximity` 적용
    - 각 날짜 그룹에 `snap-start` 클래스 적용
    - 헤더 `sticky top-0 z-20` (스크롤 시 고정)
    - 필터바 `sticky top-14 z-20` (헤더 아래 고정)
    - 날짜 그룹 헤더 `sticky top-[104px] z-10` (필터바 아래 고정)
- **UX 개선**:
  - 탭 진입 시 → 자동으로 "오늘" 그룹으로 스크롤
  - 스크롤 시 → 일단위로 자연스럽게 걸침 (snap scroll)
  - 스크롤 중 → 현재 보고 있는 날짜 헤더가 상단에 고정
- **결과**: 타입체크 통과, 오늘 위치 자동 스크롤 및 snap scroll 완료

### #60 오늘 탭 → 기록 탭 스크롤 네비게이션
- **요청**: 오늘 화면에서 어제/예정 카드 클릭 시 기록 탭의 해당 위치로 스크롤
- **변경**:
  - `src/pages/HomePage.tsx`:
    - 어제 카드: `navigate('/history?scrollTo=yesterday')`
    - 예정 카드: `navigate('/history?scrollTo=future')`
  - `src/pages/HistoryPage.tsx`:
    - `useSearchParams` 훅으로 URL 쿼리 파라미터 읽기
    - `yesterdayGroupRef`, `futureGroupRef` ref 추가
    - `scrollToGroup()` 함수 확장: 대상 ref 인자로 받아서 스크롤
    - `scrollToTarget` 파라미터에 따라 대상 ref 결정:
      - `'yesterday'` → 어제 그룹으로 스크롤
      - `'future'` → 첫 번째 미래 그룹으로 스크롤
      - 기본값 → 오늘 그룹으로 스크롤
    - 날짜 그룹별 ref 할당 로직:
      - `isToday()` → `todayGroupRef`
      - `isYesterday()` → `yesterdayGroupRef`
      - `isFuture()` 중 첫 번째 → `futureGroupRef`
    - 스크롤 완료 후 쿼리 파라미터 제거 (`setSearchParams({}, { replace: true })`)
- **UX 플로우**:
  1. 오늘 화면에서 "어제" 카드 탭 → 기록 탭의 어제 날짜로 스크롤
  2. 오늘 화면에서 "예정" 카드 탭 → 기록 탭의 첫 번째 미래 날짜로 스크롤
  3. URL 파라미터는 스크롤 후 자동 제거되어 뒤로가기 시 깔끔함
- **결과**: 타입체크 통과, 오늘→기록 간 컨텍스트 연속성 확보

### #55 iOS Safari 데이터 지속성 문제 해결
- **요청**: 모바일 Safari에서 앱을 닫았다 열 때마다 데이터가 초기화되는 문제
- **원인 분석**:
  - IndexedDB (Dexie.js) 사용 중 - 영구 저장소이나 iOS Safari 정책 문제
  - Safari 탭에서 사용 시 임시 저장소로 취급 (7일 미사용 시 삭제)
  - 홈화면 PWA로 추가해야만 영구 저장소 보장
- **변경**:
  - `src/main.tsx`: Storage Persistence API 추가
    - `navigator.storage.persist()` 호출하여 영구 저장소 요청
    - 앱 초기화 시 자동 실행
- **iOS 데이터 지속성 조건**:
  | 실행 방식 | 데이터 지속성 |
  |-----------|--------------|
  | Safari 탭 | ❌ 삭제될 수 있음 |
  | 홈화면 웹앱 | ✅ 영구 저장 |
  | 개인정보 보호 모드 | ❌ 세션 종료 시 삭제 |
- **결과**: 타입체크 통과, Storage Persistence API 적용

### #61 분석 탭 차트 다크모드 가시성 개선
- **요청**: 분석 탭 그래프가 다크모드에서 글자가 잘 보이지 않는 문제
- **원인**: 차트 색상이 하드코딩되어 다크모드 CSS 변수를 사용하지 않음
- **변경**:
  - `src/components/report/chartConfig.ts`:
    - 하드코딩된 색상 → CSS 변수로 변경
    - `expense`, `income`, `grid`, `axis` 모두 `var(--chart-*)` 사용
  - `src/components/report/CategoryDonutChart.tsx`:
    - 라벨 `fill="#333"` → `fill="var(--color-ink-dark)"` 변경
    - "기타" 카테고리 색상 → `getComputedStyle`로 동적 조회
- **CSS 변수 매핑**:
  | 색상 | Light Mode | Dark Mode |
  |------|------------|-----------|
  | chart-expense | #1C1B1A | #F0F2F5 |
  | chart-income | #4A7C59 | #5BA872 |
  | chart-grid | #ECEAE6 | #2A303A |
  | chart-axis | #6B6966 | #9CA3AF |
- **결과**: 타입체크 통과, 다크모드에서 차트 가시성 개선

---

## 2026-01-08

### #62 데이터 가져오기 기능 전면 개선
- **요청**: Excel 가져오기 기능 개선 - UI 화면, Excel 직접 지원, 중복 처리, 진행상황 표시
- **변경**:
  - `src/services/excelImport.ts`:
    - `ImportProgress` 타입 추가 (phase, current, total, message)
    - `ImportProgressCallback` 타입 추가
    - `DuplicateCheckResult` 타입 추가
    - `ImportResult`에 `duplicateRows` 필드 추가
    - `checkDuplicates()` 함수 추가 - 기존 데이터와 중복 체크
    - `importExcelData()` 개선:
      - `skipDuplicates` 옵션 추가 (기본값: true)
      - `abortSignal` 옵션 추가 (취소 기능)
      - `onProgress` 콜백 추가 (진행률 보고)
      - 중복 체크 로직 (날짜-금액-설명 조합)
      - 100건마다 취소 체크 및 진행률 업데이트
      - 파일 내 중복도 방지 (existingKeys Set에 추가)
  - `src/pages/ImportDataPage.tsx`:
    - `duplicate_check` 단계 추가 (중복 확인 화면)
    - `AbortController` 기반 취소 기능
    - 진행률 바 UI (퍼센트, 현재/전체 건수)
    - 중복 데이터 미리보기 (최대 20건 표시)
    - 옵션 UI 개선:
      - "기존 데이터 모두 삭제 후 가져오기" 체크박스
      - "중복 데이터 자동 건너뛰기" 체크박스
    - 중복 발견 시 선택 옵션:
      - "새 데이터만 가져오기"
      - "전체 가져오기 (중복 포함)"
    - 취소 버튼 (importing 단계에서 표시)
    - 완료 화면에 "건너뛴 중복" 카운트 표시
    - 취소된 경우 AlertTriangle 아이콘 표시
- **UX 플로우**:
  1. 파일 선택 → 미리보기 (카테고리, 결제수단, 샘플 데이터)
  2. 가져오기 클릭 → 중복 확인 (기존 데이터 있을 경우)
  3. 중복 발견 시 → 선택 화면 (새 데이터만 / 전체)
  4. 가져오기 진행 → 진행률 바 + 취소 버튼
  5. 완료 → 결과 요약 (가져온 수, 중복, 새 카테고리 등)
- **결과**: 타입체크 통과, 데이터 가져오기 UX 전면 개선

### #63 CSV/JSON 데이터 가져오기 지원
- **요청**: Excel 외에 CSV, JSON 파일 포맷 지원 추가
- **변경**:
  - `src/services/excelImport.ts` - `parseCSV()`, `parseJSON()`, `detectFileType()` 함수 추가
  - `src/pages/ImportDataPage.tsx` - 드래그앤드롭 UI 및 다중 파일 포맷 지원
- **결과**: CSV/JSON 가져오기 기능 완료, 드래그앤드롭 UI 추가, 타입체크 통과

### #64 디자인 시스템 원칙 준수 개선
- **요청**: 데이터 가져오기 페이지 디자인 스타일 원칙 준수, 설정 페이지 (Excel) 표시 삭제
- **변경**:
  - `src/pages/SettingsPage.tsx` - "데이터 가져오기 (Excel)" → "데이터 가져오기"
  - `src/pages/ImportDataPage.tsx` - 디자인 시스템 원칙 준수 전면 개선:
    - 컬러풀 아이콘(blue/green/amber) → 모노톤(ink-mid)
    - pig-pink 강조색 버튼 → ink-black 기본 버튼
    - rounded-xl → rounded-sm/md (디자인 시스템 토큰)
    - text-heading → text-title
    - 불필요한 색상 제거, paper/ink 계열로 통일
    - 진행률 바 높이 2px로 변경
- **결과**: 디자인 시스템 원칙(모노톤, Quiet Interface, Paper Metaphor) 준수, 타입체크 통과

### #65 지출 수단별 예산 관리 기능
- **요청**: 지출 수단(결제수단)별로 월 예산 한도를 설정하고 분석 탭에서 사용현황 확인
- **변경**:
  - `src/types/index.ts`: `PaymentMethod.budget`, `PaymentMethodSummary` 타입 추가
  - `src/services/database.ts`: v4 스키마 마이그레이션
  - `src/services/queries.ts`: `getPaymentMethodBreakdown()` 쿼리 추가
  - `src/pages/PaymentMethodEditPage.tsx`: 월 예산 한도 입력 필드 추가
  - `src/components/report/PaymentMethodDonutChart.tsx`: 수단별 도넛 차트 컴포넌트
  - `src/components/report/index.ts`: 컴포넌트 export 추가
  - `src/pages/StatsPage.tsx`: "수단별" 탭 추가 (카테고리별 / 수단별 / 월별 추이)
- **UX 개선**:
  - 설정 > 결제수단 > 편집에서 "월 예산 한도" 입력 (선택)
  - 분석 탭에서 수단별 지출 비율 도넛 차트 표시
  - 예산 설정된 수단은 "예산의 N%" 표시, 초과 시 강조
- **결과**: 타입체크 통과, 지출 수단별 예산 관리 기능 구현 완료

### #66 다크모드 CSS 변수 충돌 해결 (근본 원인 분석)
- **요청**: 설정 탭 하위 메뉴들 다크모드 미적용 문제 해결 및 원인 문서화
- **근본 원인 분석**:
  - **문제**: 다크모드에서 배경이 여전히 밝게 표시됨
  - **원인**: CSS 변수 시스템과 Tailwind `dark:` 프리픽스의 이중 적용 충돌
  - **CSS 변수 동작 원리** (`src/styles/globals.css`):
    ```css
    :root {
      --color-paper-white: #FAF9F7;  /* 라이트 모드: 밝은 배경 */
      --color-ink-black: #1C1B1A;    /* 라이트 모드: 어두운 텍스트 */
    }
    .dark {
      --color-paper-white: #0D0F12;  /* 다크 모드: 어두운 배경 (자동 반전!) */
      --color-ink-black: #F0F2F5;    /* 다크 모드: 밝은 텍스트 (자동 반전!) */
    }
    ```
  - **잘못된 패턴**: `bg-paper-white dark:bg-ink-black`
    - 다크 모드에서 `ink-black` = `#F0F2F5` (밝은 색!) → 밝은 배경 적용됨
  - **올바른 패턴**: `bg-paper-white`
    - CSS 변수가 자동으로 다크 모드 값(`#0D0F12`)으로 전환됨
- **변경**: 12개 설정 관련 페이지에서 잘못된 `dark:` 프리픽스 제거
  - `SettingsPage.tsx`, `ExportDataPage.tsx`, `ImportDataPage.tsx`
  - `CategoryManagePage.tsx`, `CategoryEditPage.tsx`
  - `PaymentMethodManagePage.tsx`, `PaymentMethodEditPage.tsx`
  - `RecurringTransactionPage.tsx`, `RecurringTransactionEditPage.tsx`
  - `BudgetWizardPage.tsx`, `AnnualExpensesPage.tsx`, `MonthlyReviewPage.tsx`
- **제거한 패턴**:
  | 잘못된 패턴 | 이유 |
  |-------------|------|
  | `dark:bg-ink-black` | 다크 모드에서 밝은 색(#F0F2F5) 적용됨 |
  | `dark:text-paper-white` | 다크 모드에서 어두운 색(#0D0F12) 적용됨 |
  | `dark:border-ink-dark` | CSS 변수가 이미 처리 |
  | `dark:bg-ink-dark` | CSS 변수가 이미 처리 |
- **유지한 패턴**:
  | 올바른 패턴 | 이유 |
  |-------------|------|
  | `dark:bg-pig-pink` | 비CSS변수 색상, 명시적 오버라이드 필요 |
  | `dark:ring-paper-white` | 포커스 링 스타일링 |
- **핵심 교훈**: CSS 변수 기반 색상 토큰을 사용할 때는 `dark:` 프리픽스가 **이중 반전**을 유발함. CSS 변수가 이미 다크 모드를 처리하므로 추가 `dark:` 프리픽스 불필요.
- **결과**: 타입체크 통과, 다크모드 정상 작동 확인

### #67 하단 네비게이션 탭 이동 시 스크롤 초기화
- **요청**: 탭 이동 시 해당 페이지의 최상단 위치를 기본값으로 지정
- **변경**: `src/components/layout/TabBar.tsx`
  - NavLink에 `onClick` 핸들러 추가
  - `main` 요소를 찾아 `scrollTo({ top: 0, behavior: 'instant' })` 호출
- **결과**: 타입체크 통과, 탭 전환 시 항상 페이지 최상단으로 이동

---

## 2026-01-08

### #68 기록 탭 에스컬레이터 스크롤 UX + 월 단위 합계
- **요청**: 기록 탭에서 스크롤 시 일자별 에스컬레이터 식 UX 경험 제공, 월 단위 합계 추가
- **변경**:
  - `src/types/index.ts`: `DateGroup`, `MonthGroup` 타입 추가
  - `src/components/history/MonthSummaryCard.tsx`: 월 합계 카드 컴포넌트 생성
  - `src/components/history/index.ts`: 배럴 export 파일
  - `src/pages/HistoryPage.tsx`:
    - `groupTransactionsByMonth()` 함수 추가 (월 단위 그룹핑)
    - Nested sticky 헤더 구조: 월 헤더 → 일자 헤더 계층화
    - 검색 모드/단일 월 모드에 따른 동적 sticky 위치 계산
    - 월 합계 카드 조건부 렌더링 (검색 시 또는 다중 월 시)
  - `src/styles/globals.css`: `.month-group` 스타일 추가
- **결과**:
  - 단일 월 보기: 일자 헤더만 sticky로 표시
  - 검색/다중 월: 월 헤더 + 일자 헤더 이중 sticky 에스컬레이터 효과
  - 월 말미에 지출/수입/순액 합계 카드 표시
  - 빌드 및 타입체크 통과

### #69 에스컬레이터 스크롤 개선 - 일자 헤더 고정 및 밀림 효과
- **요청**: 스크롤 시 일자 헤더가 상단 고정, 해당 일자 내역 지나면 헤더도 밀려나는 효과
- **변경**:
  - `src/pages/HistoryPage.tsx`: `.date-group` 클래스 적용, `relative` 포지션
  - `src/styles/globals.css`: `.date-group { contain: layout }` 추가 (CSS containment)
- **결과**:
  - 일자별 헤더가 스크롤 시 상단에 고정
  - 다음 일자 그룹이 올라오면 이전 헤더가 자연스럽게 밀려남
  - 에스컬레이터 효과 적용 완료

### #70 Floating Header + Pull-to-load 이전 월 구현
- **요청**: PC에서 에스컬레이터 효과 체감 어려움, 월초에서 당기면 이전 월로 이동
- **원인 분석**:
  - CSS sticky는 부모 컨테이너 내에서만 작동
  - 모든 date-group이 같은 스크롤 컨테이너에 있어 서로 밀어내지 않음
  - PC에서 한 화면에 모든 거래가 보이면 스크롤 자체가 적음
- **변경**:
  - `src/pages/HistoryPage.tsx`:
    - Intersection Observer 기반 단일 Floating Header 구현
    - `activeGroupLabel`, `activeGroupTotal` 상태로 현재 보이는 그룹 추적
    - `dateGroupRefs` Map으로 모든 date-group 요소 관리
    - Pull-to-load 터치 이벤트 (handleTouchStart/Move/End)
    - 스크롤 최상단에서 당기면 이전 월 데이터 로드
    - Floating Header는 고정 위치, 스크롤에 따라 내용만 교체
- **결과**:
  - 단일 Floating Header가 스크롤 위치에 따라 자동 업데이트
  - 일반 모드: Floating Header 사용, 검색 모드: 기존 sticky 헤더 유지
  - Pull-to-load로 이전 월 자연스럽게 로드 가능
  - 빌드 및 타입체크 통과

### #71 코드베이스 정비 및 완성도 개선
- **요청**: 프로젝트 코드 분석, 오류/중복/개선요소 파악 후 정비
- **분석 결과**:
  - 전체 62개 TypeScript/TSX 파일, 18개 페이지, 6개 스토어
  - 미사용 코드 없음 (모든 파일 활성 상태)
  - 아키텍처 성숙도: B+ (프로덕션 준비 완료)
- **발견된 문제 및 해결**:
  | 문제 | 해결 |
  |------|------|
  | `services/index.ts` 누락된 export | 35개 함수 재정리 및 export 추가 |
  | `addPageStore.ts` 불명확한 별칭 | deprecated 주석 추가, `fabStore` 직접 사용으로 전환 |
  | 포맷팅 함수 중복 | `getDateLabel`, `getMonthLabel` → `utils/format.ts`로 이동 |
  | `stores/index.ts` 불완전 | `paymentMethodStore`, `fabStore` export 추가 |
  | ESLint 에러 4개 | `@ts-ignore` → `@ts-expect-error`, `any` 타입 처리, 미사용 변수 수정 |
- **변경 파일**:
  - `src/services/index.ts`: 쿼리 함수 전체 export 정리 (8개 → 35개 함수)
  - `src/stores/index.ts`: paymentMethodStore, fabStore export 추가
  - `src/stores/addPageStore.ts`: @deprecated 주석 추가
  - `src/stores/paymentMethodStore.ts`: selectPaymentMethodMap 추가
  - `src/pages/AddPage.tsx`: import 경로 fabStore로 변경
  - `src/utils/format.ts`: getDateLabel, getMonthLabel 함수 추가

### #72 앱 기획 완성도 평가 및 문서화
- **요청**: 앱 기획서 확인, 기획의도 완성도와 앱 완결성 평가 후 문서화
- **분석**:
  - 기획서: `MoneyMirror_PWA_개발기획서.md`, `moneymirror-design-system.md`, `docs/CONCEPT.md`, `docs/USER_JOURNEY.md`
  - 현재 상태: 18개 페이지, 15개 컴포넌트, 6개 스토어
- **평가 결과**: MVP 기준 92% 완성
  | 항목 | 상태 |
  |------|------|
  | 핵심 철학 (비춰주는 거울) | ✅ 완벽 구현 |
  | 1초 확인 / 3터치 기록 | ✅ 달성 |
  | 디자인 시스템 | ✅ 일관됨 |
  | 온보딩 | 🔴 미구현 |
  | 확장 기능 | ✅ 기획서 초과 |
- **변경**: `docs/COMPLETION_REPORT.md` 생성
- **결과**: 완성도 평가 보고서 문서화 완료

---

## 진행 예정
- 온보딩 플로우 구현 (MVP 100% 완성 목표)
- PWA 푸시 알림 연동
- Phase 2: Capacitor iOS 전환 준비

---

## 작업일지 파일 관리

> **파일 분할 기준**: 2000줄 또는 100KB 초과 시 새 파일 생성
> - `WORKLOG.md` - 현재 작업일지 (최신)
> - `WORKLOG-2025.md` - 2025년 아카이브 (필요 시)
> - 현재 상태: ~1200줄, 67KB (여유 있음)

### #73 작업일지 이원화 구조 적용
- **요청**: 맥락 유지용 / 작업 관리용 분리
- **변경**:
  - `docs/CONTEXT.md` 생성 (맥락 유지용, 10K 토큰 이하)
  - `WORKLOG.md` → `WORKLOG-FULL.md` 이동 (작업 관리용)
  - `CLAUDE.md` 지침 수정 (이원화 구조 반영)
- **결과**: 새 대화 시작 시 CONTEXT.md로 빠른 맥락 파악 가능

### #74 설정 페이지 버전 동적 로드
- **요청**: 앱 설정 탭 버전을 package.json에서 동적으로 가져오기
- **변경**:
  - `vite.config.ts`: `__APP_VERSION__` define 추가 (package.json에서 읽기)
  - `src/vite-env.d.ts`: `__APP_VERSION__` 타입 선언 추가
  - `src/pages/SettingsPage.tsx`: 하드코딩 `0.1.0` → `{__APP_VERSION__}` 변경
- **결과**: 타입체크/빌드 통과, 배포 시 버전 자동 동기화

### #75 기록 탭 UX 개선 (스크롤 버그 수정 + 양방향 월 이동)
- **요청**:
  1. 홈에서 어제/예정으로 이동 후 스크롤하면 최근 날짜로 강제 이동되는 버그 수정
  2. 월 스와이프가 이전 달로만 이동 → 양방향 이동 구현
- **문제 분석**:
  - 버그: `scrollToTarget`이 없을 때 기본값 `todayGroupRef`로 스크롤됨
  - 탭 복귀 시 `hasScrolledToTarget` 리셋되면서 자동 스크롤 발생
- **변경**: `src/pages/HistoryPage.tsx`
  - 자동 스크롤: 명시적 `scrollTo` 파라미터 있을 때만 작동하도록 수정
  - 양방향 월 이동: `pullDirection` 상태 추가 ('up' | 'down')
    - 상단 당기기 = 다음 달 (더 최신으로, 현재 월까지만)
    - 하단 당기기 = 이전 달 (더 과거로)
  - 터치 이벤트 로직 개선: `touchStartY` 기반 정확한 delta 계산
  - Pull indicator UI 양방향 지원
- **결과**: 타입체크 통과, 스크롤 버그 해결, 기록 순서(최신→과거)에 맞는 자연스러운 월 이동
- **피드백**: 상하 당기기 방향이 거꾸로 → 수정 완료

### #76 기록 탭 좌우 스와이프 월 이동
- **요청**: 한 달 내역이 많아 스크롤이 길어서 상하 당기기 불편 → 좌우 스와이프로 변경
- **변경**: `src/pages/HistoryPage.tsx`
  - 상하 당기기 → 좌우 스와이프로 전환
  - 좌로 스와이프 = 다음 달 (이번 달까지만)
  - 우로 스와이프 = 이전 달
  - 수평/수직 제스처 구분 (1.5배 비율)
  - 스와이프 indicator: 화면 좌우 가장자리에 표시
- **결과**: 타입체크/빌드 통과, 스크롤 중에도 자연스러운 월 이동 가능

### #77 분석 탭 좌우 스와이프 탭 이동
- **요청**: 분석 탭의 카테고리별/수단별/월별 추이 탭 좌우 스와이프 이동
- **변경**: `src/pages/StatsPage.tsx`
  - 탭 컨텐츠 영역에 터치 이벤트 추가
  - 좌로 스와이프 = 다음 탭, 우로 스와이프 = 이전 탭
  - 스와이프 indicator에 다음 탭 이름 표시
- **결과**: 타입체크/빌드 통과, v0.1.5 배포

---

## 2026-01-09

### #78 수입 수단 (Income Source) 추가
- **요청**: 결제 수단처럼 수입 수단을 별도로 관리할 수 있도록 추가
- **변경**:
  - `src/types/index.ts`: `IncomeSource` 인터페이스, `DEFAULT_INCOME_SOURCES`, `Transaction.incomeSourceId` 추가
  - `src/services/database.ts`: Schema v5로 `incomeSources` 테이블 추가, 초기화 함수
  - `src/stores/incomeSourceStore.ts`: 신규 스토어 생성 (CRUD + reorder)
  - `src/stores/index.ts`: export 추가
  - `src/pages/AddPage.tsx`: 수입 선택 시 수입수단 선택 UI 추가
  - `src/pages/EditTransactionPage.tsx`: 수입 수정 시 수입수단 선택 추가
  - `src/pages/IncomeSourceManagePage.tsx`: 신규 (수입수단 목록 관리)
  - `src/pages/IncomeSourceEditPage.tsx`: 신규 (수입수단 추가/수정)
  - `src/pages/SettingsPage.tsx`: "수입수단 관리" 메뉴 추가
  - `src/App.tsx`: 라우트 3개 추가 (`/settings/income-sources/*`)
- **기본 수입수단**: 급여, 용돈, 부업, 기타
- **결과**: 타입체크/빌드 통과
- **피드백**: 수입 카테고리에 이미 급여/용돈이 있어 중복 → #79에서 개선

### #79 수단 관리 통합 (지출/수입 탭)
- **요청**: 수입수단 기본값을 계좌/카드/현금으로 변경, 결제수단/수입수단을 하나의 '수단 관리'로 통합 (카테고리 관리처럼)
- **변경**:
  - `src/types/index.ts`: `DEFAULT_INCOME_SOURCES`를 현금/카드/계좌이체로 변경 (결제수단과 동일)
  - `src/pages/MethodManagePage.tsx`: 신규 통합 수단관리 페이지 (지출/수입 탭)
  - `src/pages/SettingsPage.tsx`: 결제수단 관리 + 수입수단 관리 → "수단 관리" 하나로 통합
  - `src/App.tsx`: `/settings/methods` 라우트 추가
  - `src/services/database.ts`: Schema v6 마이그레이션 (기존 급여/용돈/부업/기타 → 현금/카드/계좌이체)
- **결과**: 타입체크/빌드 통과, 기존 DB도 자동 마이그레이션

### #80 분석 탭 세부 개선 (월간/연간 분석)
- **요청**: 분석 탭을 월/연 단위로 분석할 수 있도록 개선
  1. 기간설정 탭을 지출/수입 토글 하단으로 이동
  2. 기간설정을 특정 월/년 선택 가능하도록 개선
  3. '이번 달' 표현 대신 기간 선택에 맞는 톤으로 재구성 (예: 'X월 지출', '2026년 지출')
  4. '월별 추이' 탭 명칭을 '기간별 추이'로 변경
  5. 추이 탭 내 '전체 금액' 기본값 해제, 모든 카테고리 표시
  6. 수단별 탭에 상세내역 모달 추가
- **변경**:
  - `src/types/index.ts`: `PaymentMethodTrend` 타입 추가
  - `src/services/queries.ts`: 연간 집계 쿼리 3개 + 수단 추이 쿼리 2개 추가
    - `getYearlySummary`, `getYearlyCategoryBreakdown`, `getYearlyPaymentMethodBreakdown`
    - `getPaymentMethodTrend`, `getTopTransactionsByPaymentMethod`, `getTransactionsByPaymentMethod`
  - `src/components/report/CategoryFilterChips.tsx`: props 확장 (`showAll`, `showTotalOption`, `isTotalSelected`, `onTotalToggle`)
  - `src/components/report/MultiCategoryTrendChart.tsx`: `showTotalLine` prop 추가 (기본 false)
  - `src/components/report/PaymentMethodTrendModal.tsx`: 신규 생성 (6개월 추이, 월평균, 최고지출월, TOP5)
  - `src/components/report/index.ts`: export 추가
  - `src/pages/StatsPage.tsx`: 대규모 UI 개선
    - 상태 추가: `periodMode`, `selectedYear`, `yearlySummary`, `showTotalLine`, `selectedPaymentMethod`
    - 헤더에서 월 네비게이션 제거, Summary 섹션으로 이동
    - 월간/연간 토글 추가, 기간 네비게이션 UI 통합
    - 탭 명칭 '월별 추이' → '기간별 추이'
    - 카테고리 필터 개선: 전체 옵션 선택화, 모든 카테고리 표시
    - 수단별 탭에 모달 연결
- **결과**: 타입체크/빌드 통과
- **피드백**: 기간별 추이 탭에서 연간 모드 시 필터 미표시 → #81에서 수정

### #81 기간별 추이 - 연간 모드 필터 표시 수정
- **요청**: 기간별 추이 탭에서 연간 모드 선택 시 필터가 없어 그래프 표현 불가
- **변경**:
  - `src/pages/StatsPage.tsx`:
    - CategoryFilterChips에서 `trendPeriod !== 'annual'` 조건 제거
    - 연간 모드에서 카테고리 트렌드 데이터 가져오도록 수정 (36개월 데이터)
  - `src/components/report/MultiCategoryTrendChart.tsx`:
    - 연간 데이터에 카테고리별 연간 합계 추가
    - 카테고리 라인 렌더링에서 `period !== 'annual'` 조건 제거
    - Legend 표시에서 `period !== 'annual'` 조건 제거
- **결과**: 타입체크/빌드 통과

### #82 온보딩 시스템 구현
- **요청**: 신규 사용자를 위한 온보딩 플로우 + 빈 상태 메인 화면 설계/구현
- **변경**:
  - `src/pages/OnboardingPage.tsx`: 신규 생성
    - 3단계 플로우: 웰컴 → 가치 제안 → 예산 설정
    - 카피: "오늘 얼마나 쓸 수 있지?" / "열면 바로 보여요" / "이번 달 쓸 수 있는 돈은?"
    - 예산 설정 선택사항 ("나중에 설정할게요" 버튼)
    - PiggyBank 아이콘 사용 (TabBar와 동일)
  - `src/App.tsx`: 온보딩 조건부 렌더링 추가
    - `isOnboardingComplete === false`면 OnboardingPage 표시
    - 설정 로딩 중 로딩 화면 표시
  - `src/pages/HomePage.tsx`: 첫 사용자 빈 상태 메시지 추가
    - transactions.length === 0: "새로운 시작이에요" + FAB 유도
    - 기존 사용자 (오늘 거래만 없음): 기존 감성 메시지 유지
- **결과**: 타입체크/빌드 통과

### #83 온보딩 시스템 업그레이드 (5단계 + Coach Marks)
- **요청**: 온보딩에 앱 기능 소개, 화면별 가이드, 사용 후 확인 가능한 것들 반영
- **변경**:
  - **슬라이드 온보딩 5단계 확장**:
    - `src/pages/OnboardingPage.tsx`: 3단계 → 5단계 확장
      1. 웰컴 - "오늘 얼마나 쓸 수 있지?" (아이콘 바운스)
      2. 홈 기능 - "열면 바로 보여요" (숫자 카운트업 애니메이션)
      3. 기록 기능 - "3번 터치로 끝" (순차 하이라이트)
      4. 분석 기능 - "내 소비 패턴이 보여요" (도넛차트 채우기)
      5. 예산 설정 - 기존 슬라이더 유지
    - 단계 인디케이터 (점) 추가, 클릭 이동 가능
  - **일러스트 컴포넌트** (CSS 애니메이션):
    - `src/components/onboarding/illustrations/HomeIllustration.tsx`: 모의 홈 화면 + 숫자 카운트업
    - `src/components/onboarding/illustrations/AddFlowIllustration.tsx`: 3단계 플로우 시각화
    - `src/components/onboarding/illustrations/ChartIllustration.tsx`: 도넛 차트 + 추이선
  - **Coach Marks 시스템** (첫 진입 시 화면별 가이드):
    - `src/components/coachmark/CoachMarkProvider.tsx`: Context + Overlay 렌더링
    - `src/components/coachmark/CoachMarkOverlay.tsx`: 스포트라이트 오버레이 (clip-path)
    - `src/components/coachmark/tourConfigs.ts`: 화면별 투어 설정
    - Settings에 투어 플래그 추가: `hasSeenHomeTour`, `hasSeenAddTour`, `hasSeenStatsTour`, `hasSeenSettingsTour`
  - **각 페이지 통합**:
    - `src/pages/HomePage.tsx`: home tour 트리거, data-tour 속성 추가
    - `src/pages/AddPage.tsx`: add tour 트리거, data-tour 속성 추가
    - `src/pages/StatsPage.tsx`: stats tour 트리거, data-tour 속성 추가
    - `src/pages/SettingsPage.tsx`: settings tour 트리거, data-tour 속성 추가
    - `src/components/layout/TabBar.tsx`: FAB에 data-tour 속성 추가
  - **인프라**:
    - `src/types/index.ts`: Settings에 투어 플래그 추가
    - `src/stores/settingsStore.ts`: `markTourComplete` 액션, `selectHasSeenTour` 셀렉터 추가
    - `tailwind.config.js`: 온보딩 애니메이션 키프레임 6개 추가
    - `src/App.tsx`: CoachMarkProvider 래핑
- **결과**: 타입체크/빌드 통과

### #84 온보딩 아이콘 개선 (v0.1.6)
- **요청**: 이모지 대신 앱 그래픽 테마와 어울리는 아이콘 사용
- **변경**:
  - OnboardingPage.tsx: 이모지 → Lucide 선형아이콘 (Wallet, CalendarDays, TrendingUp)
  - AddFlowIllustration.tsx: 이모지 → Lucide 선형아이콘 (Utensils, Coins, Check)
  - 모든 아이콘 strokeWidth=1.5로 통일
- **결과**: v0.1.6 릴리즈, GitHub 푸시 + Vercel 배포 완료

### #85 메모 표시 버그 수정 + 기록탭 월간 합계 (v0.1.7)
- **요청**: 거래 메모가 분석/기록 탭에 표시되지 않는 문제 수정 + 기록탭 월간 합계 추가
- **변경**:
  - `src/components/report/CategoryTrendModal.tsx`:
    - TOP5 항목에 메모 표시: `tx.description` → `tx.memo || tx.description`
  - `src/pages/HistoryPage.tsx`:
    - 거래 목록에 메모 표시: `tx.memo || tx.description || category?.name`
    - 월간 합계 영역 추가 (수입/지출/합계 - sticky 헤더)
    - sticky 위치 동적 계산 (인라인 스타일 사용)
- **결과**: v0.1.7 릴리즈

### #86 Transaction description/memo 필드 통합
- **요청**: 분석탭 수단별 상세내역에서 입력사항이 반영되지 않는 문제 분석 및 개선
- **원인**: description과 memo가 별도 필드로 존재하나 표시/저장이 불일치
- **변경**:
  - `src/types/index.ts`:
    - Transaction.description 필드 제거, memo로 통합
    - RecurringTransaction.description 제거
    - ProjectedTransaction.description → memo
    - TransactionExportRow.description 제거
  - `src/services/database.ts`:
    - DB v7 마이그레이션 추가 (description → memo 데이터 병합)
  - 페이지/컴포넌트 수정:
    - AddPage, EditTransactionPage, TransactionDetailPage: description 제거
    - HistoryPage, HomePage: `tx.memo || category?.name` 로직
    - RecurringTransactionPage, RecurringTransactionEditPage: description → memo
    - PaymentMethodTrendModal, CategoryTrendModal: `tx.memo || '거래'`
    - TransactionDetailModal: 가맹점 섹션 제거
  - 서비스 수정:
    - queries.ts: 검색/태그 추출에서 description 참조 제거
    - exportData.ts: CSV 내보내기 memo만 사용
    - importData.ts, excelImport.ts: description+memo 병합 저장
    - seedDatabase.ts: 샘플 데이터 description → memo
- **결과**: 타입체크 통과, DB 마이그레이션으로 기존 데이터 자동 병합

### #87 결제수단 상세 모달 - 수입/지출 혼합 버그 수정
- **요청**: 분석 > 수단별 세부 항목에서 지출 탭인데 수입 항목이 표시되는 문제
- **원인**: `getTransactionsByPaymentMethod`, `getPaymentMethodTrend`, `getTopTransactionsByPaymentMethod` 쿼리에서 type 필터 누락
- **변경**:
  - `src/services/queries.ts`:
    - `getTransactionsByPaymentMethod`: type 파라미터 추가, filter에 `tx.type === type` 조건
    - `getPaymentMethodTrend`: type 파라미터 추가, 하위 함수에 전달
    - `getTopTransactionsByPaymentMethod`: type 파라미터 추가
  - `src/components/report/PaymentMethodTrendModal.tsx`:
    - 쿼리 호출 시 type 전달
    - useEffect dependency에 type 추가
- **결과**: 지출/수입 탭에 맞는 항목만 정확히 표시

### #88 TOP5 세로 레이아웃 개선 (카테고리/결제수단 모달)
- **요청**: 긴 메모로 인한 레이아웃 깨짐, 억 단위 금액 대응
- **변경**:
  - `src/components/report/PaymentMethodTrendModal.tsx`:
    - 가로 배치 → 세로 배치 변경
    - 첫 줄: 순위 + 메모 (truncate 말줄임)
    - 둘째 줄: 날짜(좌) + 금액(우)
    - pl-8로 순위 아이콘과 정렬
  - `src/components/report/CategoryTrendModal.tsx`:
    - 동일한 세로 레이아웃 적용
- **결과**: 두 모달 모두 어떤 길이의 메모/금액도 안정적 표시

### #89 반복거래/설정 UI 개선 (v0.2.4)
- **요청**: 4가지 개선 요청
  1. 설정 탭 월예산 천단위 콤마
  2. 반복거래 메모 필드 중복 제거 + 활성화 설명
  3. 반복주기 순서 재배치
  4. 관리 페이지 FAB 비활성화
- **변경**:
  - `src/pages/SettingsPage.tsx`:
    - 월예산 input type="text" + inputMode="numeric"
    - formatBudgetDisplay/parseBudgetInput 헬퍼 추가
  - `src/pages/RecurringTransactionEditPage.tsx`:
    - 중복 메모 입력 필드 제거
    - FREQUENCY_OPTIONS 순서: monthly → yearly → weekly → biweekly → daily
    - executionMode 옵션 추가 (on_date/start_of_month)
    - 활성화 설명 동적 표시 (executionMode 기반)
    - 지출/수입 토글 스타일 개선 (선택 시 dark bg)
  - `src/components/layout/TabBar.tsx`:
    - FAB_HIDDEN_PATTERNS 추가 (/settings/recurring, /settings/categories, /settings/methods)
    - 관리 페이지에서 FAB 비활성화 상태 표시 (숨김 → 비활성)
  - `src/pages/RecurringTransactionPage.tsx`:
    - 활성/비활성 카드 스타일 통일 (배경 동일, 체크버튼만 구분)
  - `src/types/index.ts`:
    - RecurringExecutionMode 타입 추가
    - RecurringTransaction.executionMode 필드 추가
- **결과**: v0.2.4 릴리즈, 타입체크 통과

### #90 반복거래 수입수단 선택 기능 추가
- **요청**: 반복거래 등록/수정 화면에서 수입 타입 선택 시 수입수단 선택 기능 추가 (지출의 결제수단과 대칭)
- **변경**:
  - `src/types/index.ts`:
    - `RecurringTransaction` 인터페이스에 `incomeSourceId?: string` 필드 추가
  - `src/pages/RecurringTransactionEditPage.tsx`:
    - `IncomeSource` 타입 import 추가
    - `incomeSources` state 및 `formIncomeSourceId` state 추가
    - `loadData`에서 `db.incomeSources` 로드
    - 수입 타입일 때 수입수단 선택 UI 추가 (결제수단과 동일 패턴)
    - `handleSubmit`에서 타입에 따라 `incomeSourceId` 또는 `paymentMethodId` 저장
    - `loadExistingData`에서 기존 `incomeSourceId` 로드
    - 타입 토글 시 기본 결제수단/수입수단 설정
- **결과**: 타입체크 및 빌드 통과

---

## 2026-01-13

### #91 예산 마법사 개선 - 기본값 지원 및 빠른 설정
- **요청**: 이전 사용내역이 0원일 때에도 예산 카테고리 기본값 세팅, 예산 마법사 스킵 버튼
- **변경**:
  - `src/services/queries.ts`:
    - `DEFAULT_BUDGET_RATIOS` 상수 추가 (식비 30%, 교통 10%, 쇼핑 15%, 문화/여가 10%, 의료/건강 5%, 주거/통신 20%, 기타 10%)
    - `getBudgetRecommendation()` - 지출 데이터 없어도 기본 비율로 모든 카테고리 추천
  - `src/pages/BudgetWizardPage.tsx`:
    - `redistributeBudgets()` - avgExpense3Months 체크 제거 (데이터 없어도 동작)
    - Step 1에 "바로 예산 설정하기" 버튼 추가 → Step 4로 스킵
- **결과**: 신규 사용자도 예산 마법사 정상 이용 가능

### #92 카테고리 편집 - 예산 천단위 콤마 표시
- **요청**: 카테고리 관리 > 세부 항목 편집 시 예산 입력에 천단위 구분표기(,) 추가
- **변경**:
  - `src/pages/CategoryEditPage.tsx`:
    - `budgetInput` state 추가 (포맷된 표시용)
    - `formatBudgetDisplay()`, `parseBudgetInput()` 헬퍼 추가
    - input type="number" → type="text" inputMode="numeric" 변경
- **결과**: 예산 입력 시 천단위 콤마 자동 표시

### #93 카테고리별 예산 페이지 종합 개선
- **요청**: 월예산 자동배분, % 입력모드, 카테고리 삭제/관리 통합
- **변경**:
  - `src/pages/CategoryBudgetPage.tsx` (전면 재설계):
    - `InputMode` 타입 ('amount' | 'percent')
    - `CategoryBudgetEntry` 인터페이스 (budget + percentage 동시 관리)
    - SegmentedControl로 금액/% 모드 전환
    - 자동 배분 토글 (Info 툴팁 포함)
    - SwipeToDelete로 카테고리 인라인 삭제 (기본 카테고리 제외)
    - 요약 섹션 (총예산, 배분합계, 미배분/초과)
    - "카테고리 관리" 버튼 (CategoryManagePage 이동)
    - 실시간 저장 (blur/Enter)
  - `src/pages/SettingsPage.tsx`:
    - PieChart 아이콘 import
    - "카테고리별 예산" 메뉴 항목 추가
  - `src/App.tsx`:
    - `/settings/category-budget` 라우트 추가
- **핵심 로직**:
  - % → 금액: `Math.round((percentage / 100) * monthlyBudget)`
  - 금액 → %: `Math.round((budget / monthlyBudget) * 1000) / 10`
  - 자동 배분: 총예산 변경 시 기존 비율 유지하며 재계산
  - 개별 수정 시 자동 배분 OFF
- **결과**: 예산 마법사와 차별화된 일상적 예산 관리 경험 제공

### #94 거래 태그 시스템 구현
- **요청**: 메모 입력 시 해시태그로 태그 자동 구분, 화면별 차등 표시, 태그 검색
- **변경**:
  - `src/types/index.ts`:
    - Transaction 인터페이스에 `tags?: string[]` 필드 추가
  - `src/services/database.ts`:
    - Schema v8 추가: `*tags` MultiEntry 인덱스 (태그별 검색 최적화)
    - 마이그레이션: 기존 메모의 #해시태그 → tags 배열로 자동 분리
  - `src/utils/tags.ts` (신규):
    - `parseMemoWithTags()` - 해시태그 파싱
    - `combineMemoWithTags()` - 수정 시 다시 합치기
    - `getMemoPreview()` - 목록 표시용 미리보기
    - `isValidTag()`, `normalizeTags()` - 유효성 검사
  - `src/pages/AddPage.tsx`:
    - tags를 별도 배열로 저장 (memo와 분리)
  - `src/pages/TransactionDetailPage.tsx`:
    - tags 필드 로드/저장 분리
    - 메모 버튼에 `#태그 메모` 형식 표시
  - `src/pages/EditTransactionPage.tsx`:
    - 태그 섹션 UI 추가 (선택된 태그, 카테고리별 제안, 자주 사용)
    - 태그 입력/추가/삭제 기능
  - `src/pages/HistoryPage.tsx`, `src/pages/HomePage.tsx`:
    - 목록에서 첫 번째 태그 또는 메모 표시
  - `src/components/report/CategoryTrendModal.tsx`, `PaymentMethodTrendModal.tsx`:
    - 리포트에서도 태그/메모 적절히 표시
  - `src/services/queries.ts`:
    - `getRecentTags()`, `getTagsByCategory()` - tags 필드에서 직접 조회
    - `getTransactionsByTag()` - 태그로 거래 검색 (신규)
    - `getAllTags()` - 전체 태그 목록 (신규)
    - `searchTransactions()` 개선 - 태그/메모/금액 검색 지원
- **검색 기능**:
  - 일반 검색: 태그 → 메모 → 금액 순서로 검색
  - `#태그명`: 태그 전용 검색
  - 숫자 검색: 금액에서 부분 일치
- **결과**: 타입체크/빌드 통과, 태그 기반 분류 시스템 완성

### #95 반복거래 태그 지원 추가
- **요청**: 반복거래(RecurringTransaction)에도 태그 시스템 적용
- **변경**:
  - `src/types/index.ts`:
    - RecurringTransaction 인터페이스에 `tags?: string[]` 필드 추가
  - `src/pages/RecurringTransactionEditPage.tsx`:
    - 태그 입력 UI 추가 (`#태그` 형식 입력)
    - `parseMemoWithTags()`, `combineMemoWithTags()` 유틸리티 사용
    - 태그 칩 표시 및 개별 삭제 기능
    - 저장 시 `tags` 필드 별도 저장
  - `src/services/queries.ts`:
    - `executeRecurringTransaction()` 함수에서 `tags`, `incomeSourceId` 복사 추가
    - 반복거래 실행 시 생성되는 거래에 태그 자동 포함
- **결과**: 반복거래에서도 해시태그 입력 가능, 실행 시 거래에 태그 자동 복사

### #96 메모/태그 한 줄 입력 UI 단순화
- **요청**: 지출/수입 기록 시 한줄 입력에서 #으로 자동태그 구분
- **변경**:
  - `src/pages/AddPage.tsx`:
    - 기존 복잡한 태그 선택 UI 제거 (카테고리 제안, 자주 사용 태그 등)
    - `메모 내용 #태그1 #태그2` 형태의 단일 입력 필드로 단순화
    - `parseMemoWithTags()`, `combineMemoWithTags()` 유틸리티 활용
  - `src/pages/TransactionDetailPage.tsx`:
    - 동일하게 한 줄 입력으로 단순화
    - 태그 미리보기 칩 유지 (시각적 확인용)
  - `src/pages/EditTransactionPage.tsx`:
    - 태그 섹션 UI 제거 (`tagInput`, `showTagSection` 등 상태 제거)
    - 메모와 태그를 하나의 입력 필드로 통합
    - 하단에 태그 칩 미리보기 표시
- **UX 개선**:
  - 기존: 메모 입력 → 태그 섹션 열기 → 태그 선택/입력 (3단계)
  - 개선: `점심 #회식 #팀` 한 줄 입력 (1단계)
- **결과**: 3개 페이지 모두 일관된 한 줄 입력 UX 적용, 타입체크 통과

### #97 카테고리별 예산 페이지 UX 개선
- **요청**: 사용자 입력 유지, 자동배분 버튼화, 슬라이더 추가, inputMode 반영
- **변경**:
  - `src/pages/CategoryBudgetPage.tsx`:
    - `isInitialLoad` ref 추가 - categoryData 초기 로드 후 사용자 입력 유지
    - 자동배분 토글 → "비율대로 배분", "균등 배분" 두 버튼으로 변경
    - 슬라이더 추가 (예산 마법사와 동일한 UX)
    - 슬라이더 thumb 오버레이로 카테고리 색상 적용
    - inputMode(금액/%) 토글이 버튼 텍스트와 슬라이더에 반영되도록 개선
    - SwipeToDelete 제거 (예산 페이지에서 실수 삭제 방지)
- **결과**: 직관적인 예산 조정 UX, 사용자 입력 보존

### #98 예산 마법사 UX 개선
- **요청**: 자동배분 툴팁, 천단위 표기, 비율 표시 명확화
- **변경**:
  - `src/pages/BudgetWizardPage.tsx`:
    - 슬라이더 thumb 가시성 개선 (카테고리 색상 오버레이)
    - 자동 배분 Info 아이콘에 호버 툴팁 추가
      - "각 카테고리 비율은 과거 3개월 지출 패턴을 기준으로 자동 계산됩니다."
      - 왼쪽 정렬로 화면 밖 벗어남 방지
    - 예산 입력란: `type="number"` → `type="text"` + 천단위 콤마
    - "월 평균 • %" → "과거 3개월 평균: {금액}" + "예산의 {동적%}%" 로 명확화
      - 기존: 고정된 추천 비율 표시
      - 개선: 현재 설정 금액의 총예산 대비 비율 실시간 표시
- **결과**: 예산 설정 시 맥락 이해 용이, 사용자 친화적 UX

### #99 메모/태그 입력 개선 - 추천 태그 칩 + 버그 수정
- **요청**: B안(입력 + 추천 태그 칩) 구현, EditTransactionPage 메모 순서 버그 수정
- **버그 수정**:
  - `src/utils/tags.ts`:
    - `combineMemoWithTags()` 함수의 순서 문제 수정
    - 기존: `${memoText} ${tagsText}` (메모가 앞)
    - 수정: `${tagsText} ${memoText}` (태그가 앞 - 입력 UX와 일관성 유지)
- **변경**:
  - `src/pages/AddPage.tsx`:
    - `getRecentTags()` 쿼리로 자주 사용하는 태그 로드
    - `suggestedTags`, `availableSuggestedTags` 상태 추가
    - 메모 입력 패널에 "자주 사용" 태그 칩 영역 추가
    - 탭하면 즉시 태그 추가, 선택된 태그는 검은색 칩으로 구분
  - `src/pages/TransactionDetailPage.tsx`:
    - 동일한 추천 태그 칩 UI 추가
  - `src/pages/EditTransactionPage.tsx`:
    - 동일한 추천 태그 칩 UI 추가
- **UI 구조**:
  ```
  [메모 입력 필드]
  #으로 태그 추가 (예: 점심 #회식 #팀)

  자주 사용:  [#회식] [#정기] [#카페]  ← 추천 칩 (탭하면 추가)

  선택된 태그: [#회식] [#팀]             ← 검은색 칩
  ```
- **결과**: 한 줄 입력 + 추천 태그로 빠른 태그 선택, 메모 순서 버그 해결

### #100 예산 마법사 자동배분 툴팁 개선
- **요청**: 자동배분 Info 툴팁에 실제 배분 비율 표시
- **변경**:
  - `src/pages/BudgetWizardPage.tsx`:
    - 추상적 설명 → 구체적 비율 표시로 변경
    - 기존: "각 카테고리 비율은 과거 3개월 지출 패턴을 기준으로 자동 계산됩니다."
    - 개선: 상위 4개 카테고리의 실제 배분 비율 표시
      ```
      배분 비율 (과거 3개월 기준)
      식비          30%
      교통          10%
      쇼핑          15%
      문화/여가      10%
      외 3개
      ```
- **결과**: 자동 배분 결과 예측 가능, 사용자 이해도 향상

### #101 메모/태그 분리형 UI 개선 (A안)
- **요청**: "자주 사용" 칩이 보이지 않는 문제 해결, 메모와 태그 분리 UI 구현
- **문제점**: 태그 데이터가 없으면 `getRecentTags()`가 빈 배열 반환 → 추천 태그 미표시
- **변경**:
  - `src/services/queries.ts`:
    - `DEFAULT_SUGGESTED_TAGS` 기본 추천 태그 배열 추가
    - `getRecentTags()`: 태그 데이터 없을 시 기본 태그 반환하도록 수정
  - `src/pages/AddPage.tsx`:
    - 한 줄 통합 입력 → 분리형 UI로 변경
    - 메모: 순수 텍스트 입력 필드
    - 태그: 선택된 태그 칩(삭제 가능) + 직접 입력 필드 + 추천 태그
  - `src/pages/TransactionDetailPage.tsx`:
    - 동일한 분리형 UI 적용
  - `src/pages/EditTransactionPage.tsx`:
    - 동일한 분리형 UI 적용
- **UI 구조**:
  ```
  ┌─ 메모 ──────────────────────────────────┐
  │ 점심 맛집에서                            │  ← 순수 텍스트
  └─────────────────────────────────────────┘

  ┌─ 태그 ──────────────────────────────────┐
  │ [#회식 ×] [#팀 ×]  [태그입력___] [+]   │  ← 선택된 태그 + 직접 입력
  ├─────────────────────────────────────────┤
  │ 자주 사용: [정기] [회식] [선물] [카페]   │  ← 탭하면 추가
  └─────────────────────────────────────────┘
  ```
- **기본 추천 태그**: 정기, 회식, 선물, 카페, 구독, 배달, 외식, 대중교통
- **결과**: 데이터 없어도 추천 태그 표시, 메모/태그 명확한 분리로 UX 개선

### #102 기능 연관 맵 문서 생성
- **요청**: 기능 수정 시 연관 항목 체계적 관리 구조
- **생성**:
  - `docs/FEATURE_MAP.md`:
    - 7개 기능 그룹 정의 (예산, 카테고리, 거래입력, 태그/메모, 결제수단, 통계, 반복거래)
    - 각 그룹별 연관 파일 트리 구조
    - 공유 개념 테이블 (타입, 위치, 설명)
    - 수정 시 체크리스트
    - 빠른 참조: 파일별 연관 기능 표
- **변경**:
  - `CLAUDE.md`:
    - 작업 시작 전 3번 항목 추가: FEATURE_MAP.md 확인
    - Reference Documents에 FEATURE_MAP.md 추가
  - `docs/CONTEXT.md`:
    - 참조 문서 테이블에 FEATURE_MAP.md 추가
- **사용 방법**:
  ```
  1. 수정 전: 해당 기능 그룹의 체크리스트 확인
  2. 수정 중: 연관 파일들 함께 수정
  3. 수정 후: 체크리스트 항목 검증
  ```
- **결과**: 기능 수정 시 일관성 유지를 위한 체계적 관리 구조 확립

### #103 거래 목록 UI 구조 변경
- **요청**: 거래 목록에서 "1행 메모+태그 | 시간 / 2행 카테고리 | 금액" 구조로 개선
- **기존 구조**: 1행 카테고리 | 시간+금액, 2행 메모, 3행 태그칩
- **신규 구조**:
  ```
  1행: [메모텍스트] [#태그1] [#태그2] ...  |  시간
  2행: 카테고리                            |  금액
  ```
- **변경**:
  - `src/pages/HistoryPage.tsx`: 거래 목록 아이템 레이아웃 변경
  - `src/pages/HomePage.tsx`: 오늘 거래 목록 레이아웃 동일하게 변경
- **특징**:
  - 메모가 있으면 1행 좌측에 표시, 태그가 있으면 메모 옆에 칩으로 표시
  - 메모/태그 둘 다 없으면 "-" 표시
  - 카테고리는 2행에서 보조 정보로 표시 (text-sub text-ink-mid)
  - 금액은 2행 우측에 강조 (text-amount)
- **결과**: 사용자 정의 정보(메모/태그)를 1행에서 바로 파악 가능, 카테고리는 보조 정보로 위치

### #104 거래 상세/입력 페이지 태그 칩 분리 표시
- **요청**: TransactionDetailPage, AddPage에서도 태그를 개별 칩으로 표시
- **기존**: 메모/태그가 `combinedMemoDisplay` 문자열로 합쳐져 표시
- **변경**:
  - `src/pages/TransactionDetailPage.tsx`: 미니 칩 영역에서 메모/태그 분리 표시
  - `src/pages/AddPage.tsx`: 동일하게 미니 칩 영역 분리 표시
- **구조**:
  ```
  [메모아이콘 메모텍스트] [#태그1] [#태그2] ...
  ```
- **결과**: 거래 목록, 거래 상세, 거래 입력 페이지에서 태그가 일관되게 개별 칩으로 표시

### #105 예산 알림 시스템 및 히어로 캐러셀 구현
- **요청**: 예산 현황 확인 및 행동 조절을 위한 알림 시스템
- **신규 파일**:
  - `src/stores/toastStore.ts`: 토스트 상태 관리 (Zustand)
  - `src/components/common/Toast.tsx`: 토스트 UI 컴포넌트 (success/warning/danger/info)
  - `src/services/budgetAlert.ts`: 예산 알림 로직 (getBudgetInsight, getOverBudgetCategories, checkBudgetAlerts)
  - `src/components/home/HeroCarousel.tsx`: 스와이프 가능한 히어로존 캐러셀
  - `src/components/home/BudgetInsightCard.tsx`: 예산 인사이트 카드
- **변경**:
  - `src/types/index.ts`: Settings에 알림 설정 필드 추가 (budgetAlertEnabled, budgetAlertThresholds, categoryAlertEnabled, lastAlertedThreshold, lastAlertedMonth)
  - `src/pages/HomePage.tsx`: HeroCarousel 적용, 알림 체크 로직 추가 (useRef로 StrictMode 중복 방지)
  - `src/pages/SettingsPage.tsx`: 알림 설정 토글 UI 추가
  - `src/App.tsx`: ToastContainer 추가
- **히어로 캐러셀 구성**:
  - 1페이지: 예산 현황 카드 (남은 예산, 진행률 바, 일 평균 추천액)
  - 2페이지: TOP 카테고리 (이번 달 상위 3개)
  - 3페이지: 예산 초과 카테고리 (있을 경우만 표시)
- **알림 임계값**: 50%, 80%, 100% (월 1회)
- **결과**: 인앱 토스트 알림 시스템 + 스와이프 히어로존 완성

### #106 알림 주기 및 인사이트 UI 개선
- **요청**: 토스트 알림 월 1회, % 표기 소숫점 1자리, 초과 카테고리 시각화 개선
- **변경**:
  - `src/types/index.ts`: lastAlertedMonth (YYYY-MM 형식) - 모든 알림 월 1회 통일
  - `src/services/budgetAlert.ts`: 월 단위 알림 제한 로직
  - `src/components/home/HeroCarousel.tsx`:
    - 히어로 섹션 위치 조정 (pt-12 → pt-16, pb-6 → pb-8)
    - TopCategoryCard % 표기: `{cat.percentage.toFixed(1)}%`
    - OverCategoryCard 프로그레스바 색상 개선: 그라디언트 방식 (카테고리색 → 빨강)
- **OverCategoryCard 시각화**:
  ```
  🍽️ 식비              115,000원 / 100,000원
  ━━━━━━━━[카테고리색]━━━[빨강]━━━  (초과분 빨간색)
  115.3%                          +15,000원 초과
  ```
- **결과**: 예산 초과 상태를 직관적으로 파악 가능한 시각화 완성

### #107 인사이트 카드 → 히스토리 페이지 네비게이션
- **요청**: 홈 인사이트 카드(TOP 카테고리, 초과 카테고리) 클릭 시 해당 카테고리 필터 적용된 히스토리 페이지로 이동
- **변경**:
  - `src/pages/HistoryPage.tsx`:
    - `categoryId` URL 파라미터 처리 추가
    - useEffect에서 파라미터 감지 → `setSelectedCategoryIds([categoryId])`
  - `src/components/home/HeroCarousel.tsx`:
    - `onCategoryClick?: (categoryId: string) => void` prop 추가
    - TopCategoryCard: `<div>` → `<button>` + onClick 핸들러
    - OverCategoryCard: `<div>` → `<button>` + onClick 핸들러
    - 클릭 피드백 스타일 추가 (`active:bg-paper-mid`, `active:bg-semantic-negative/10`)
  - `src/pages/HomePage.tsx`:
    - `onCategoryClick` 핸들러 전달: `navigate('/history?categoryId=${id}')`
- **동작 흐름**:
  ```
  홈 → TOP/초과 카테고리 클릭 → /history?categoryId={id} → 필터 적용된 거래 목록
  ```
- **결과**: 인사이트 카드에서 바로 해당 카테고리 거래 내역 확인 가능

### #108 History 탭 에스컬레이터 스크롤 UX 개선
- **요청**: 월/일 요약 헤더가 스크롤 시 에스컬레이터처럼 자연스럽게 전환되며 맥락 유지
- **변경**:
  - `src/hooks/useScrollSpy.ts` (신규):
    - 스크롤 위치 기반 월/일 섹션 추적
    - requestAnimationFrame 최적화
    - 전환 방향(up/down) 감지
  - `src/components/history/StickyContextHeader.tsx` (신규):
    - 현재 월/일 맥락 표시 영역
    - 에스컬레이터 전환 애니메이션 (slide-in-up, slide-out-up 등)
    - 검색/필터 정보 표시
    - fallback 월 정보 지원 (단일 월 뷰)
  - `tailwind.config.js`:
    - 에스컬레이터 애니메이션 keyframes 추가
  - `src/pages/HistoryPage.tsx`:
    - useScrollSpy 훅 통합
    - StickyContextHeader 적용
    - 기존 sticky 월/일 헤더를 일반 헤더로 변경
- **UX 개선**:
  ```
  스크롤 다운 시:
  [현재 월 헤더] ← animate-slide-out-up (위로 밀려나감)
  [다음 월 헤더] ← animate-slide-in-up (아래서 올라옴)
  
  스크롤 업 시:
  [현재 월 헤더] ← animate-slide-out-down (아래로 밀려나감)
  [이전 월 헤더] ← animate-slide-in-down (위에서 내려옴)
  ```
- **결과**: 스크롤 중에도 현재 보고 있는 월/일 맥락 항상 유지, 부드러운 전환 효과

### #109 History 탭 Fixed Header + Sticky Date Header 완성
- **요청**: #108 에스컬레이터 스크롤 개선 - nested overflow로 sticky 동작 안함 → fixed 방식으로 전환
- **문제**: `overflow-y-auto` 중첩으로 sticky가 가장 가까운 스크롤 컨테이너 기준으로 동작
- **해결**:
  - Header + Filter Bar → `fixed` (z-30)
  - 일자별 헤더 → `sticky` (top: 116px, z-10)
  - spacer div로 fixed 영역 높이만큼 여백 확보
- **변경**:
  - `src/pages/HistoryPage.tsx`:
    - `fixedHeaderHeight = 116` (Header 57px + Filter bar 59px)
    - Fixed 영역: Header + Filter Bar
    - Sticky date headers: `style={{ top: \`\${fixedHeaderHeight}px\` }}`
  - StickyContextHeader, useScrollSpy 훅은 생성되었으나 현재 미사용 (향후 활용 가능)
- **구조**:
  ```
  ┌─────────────────────────┐ ← Fixed (z-30)
  │ Header (56px + 1px)     │
  │ Filter Bar (59px + 1px) │
  └─────────────────────────┘ ← 116px
  ┌─────────────────────────┐ ← Sticky (top: 116px)
  │ 일자별 헤더             │
  ├─────────────────────────┤
  │ 거래 목록 (스크롤)      │
  └─────────────────────────┘
  ```
- **결과**: 스크롤 시 일자별 헤더가 fixed 영역 바로 아래에 붙어서 맥락 유지

### #110 홈 인사이트 카드 UX 개선 (2026-01-13)
- **요청**: 인디케이터 표시 개선, 스크롤 힌트 위치, 순환 애니메이션 자연스럽게
- **변경**:
  - `src/components/home/InsightCard.tsx`:
    - 인디케이터 상단 이동 + 모든 도트 표시 (현재 위치만 w-4로 강조)
    - 무한 순환 캐러셀 구현 (클론 카드 방식)
    - `[마지막 클론] [카드1~N] [첫번째 클론]` 구조로 자연스러운 3→1, 1→3 전환
    - displayIndex/currentIndex 분리로 트랜지션 제어
    - 표준 Tailwind 색상 사용 (neutral-800/300) - 커스텀 CSS 변수 opacity 문제 해결
  - `src/pages/HomePage.tsx`:
    - ScrollHint 위치 개선 (absolute → flex-shrink-0, justify-between)
    - 오늘 내역 리스트 종결 표시 추가 (pill 형태 구분선)
    - 어제/예정 카드 영역 구분 강화 (배경색 + 상단 테두리)
- **구조**:
  ```
  인디케이터: ○ ● ○ (상단, 현재 위치만 확대)

  캐러셀 구조 (카드 3개 기준):
  [카드3'] [카드1] [카드2] [카드3] [카드1']
           ↑ displayIndex=1 (시작)

  3→1 이동: displayIndex 3→4 슬라이드 → 완료 후 displayIndex=1로 즉시 이동
  1→3 이동: displayIndex 1→0 슬라이드 → 완료 후 displayIndex=3으로 즉시 이동
  ```
- **결과**: 인사이트 카드 모든 방향 자연스러운 슬라이드, 명확한 인디케이터 표시

### #111 분석 탭 Sticky 헤더 + Scroll to Top (2026-01-13)
- **요청**: 분석 탭에서 지출/수입, 카테고리별/수단별/기간별 탭을 sticky하게, 탭 클릭 시 스크롤 이동
- **변경**:
  - `src/pages/StatsPage.tsx`:
    - Fixed: Header + 지출/수입 탭 (102px)
    - Sticky: 카테고리별/수단별/기간별 탭 (top: 102px)
    - `scrollToTop()`: 페이지 맨 위로 스크롤 (scrollIntoView 사용)
    - `scrollToTabBar()`: 탭 바로 스크롤 (scroll-margin-top으로 fixed 헤더 보정)
    - 지출/수입 탭 클릭 → 맨 위로 스크롤
    - 카테고리별/수단별/기간별 탭 클릭 → 탭 바가 상단에 위치하도록 스크롤
    - 같은 탭 재클릭 시에도 스크롤 동작
- **구조**:
  ```
  ┌──────────────────────────┐ ← Fixed (z-20, 102px)
  │   Header (56px + 1px)    │
  │   지출 | 수입 (44px+1px) │
  └──────────────────────────┘
  │   Summary Section        │ ← 스크롤 가능
  ├──────────────────────────┤ ← Scroll Anchor (scroll-margin-top: 102px)
  ├──────────────────────────┤ ← Sticky (top: 102px)
  │ 카테고리별|수단별|기간별 │
  ├──────────────────────────┤
  │   Tab Content            │ ← 스크롤 가능
  └──────────────────────────┘
  ```
- **기술적 해결**:
  - `window.scrollTo()` 대신 `scrollIntoView()` 사용 (내부 스크롤 컨테이너 대응)
  - sticky 요소 직접 scrollIntoView 시 원래 DOM 위치로 스크롤되는 문제
    → 별도 앵커 div + `scroll-margin-top`으로 해결
- **결과**: 스크롤 시 탭 맥락 유지, 탭 클릭으로 빠른 네비게이션

### #112 인사이트 상세 뷰 시스템 구현 (2026-01-13)
- **요청**: 홈 인사이트 카드에서 상세보기 연결 강화, 맥락 유지 + 액션 가능한 정보 제공
- **변경**:
  - `src/types/index.ts`:
    - `InsightType` ('caution' | 'room' | 'interest' | 'compare' | 'upcoming')
    - `InsightParams`, `CautionDetailData`, `RoomDetailData`, `InterestDetailData`, `CompareDetailData`, `UpcomingDetailData` 타입 추가
    - `InsightDetailData` 유니온 타입 (discriminated union)
  - `src/services/queries.ts`:
    - 헬퍼 함수: `getRemainingDaysInMonth()`, `getDayOfWeekLabel()`, `getTimeRangeLabel()`
    - 쿼리 함수: `getCautionDetail()`, `getRoomDetail()`, `getInterestDetail()`, `getCompareDetail()`, `getUpcomingDetail()`, `getInsightDetail()`
  - `src/components/history/InsightDetailHeader.tsx`: 공통 래퍼 컴포넌트 (카테고리 정보 + dismiss)
  - `src/components/history/CautionSummary.tsx`: 예산 주의 요약 (남은 예산, 일 권장, TOP 지출)
  - `src/components/history/RoomSummary.tsx`: 여유 요약 (사용률, 남은 금액)
  - `src/components/history/InterestSummary.tsx`: 관심 요약 (소비 패턴, TOP 거래)
  - `src/components/history/CompareSummary.tsx`: 전월 비교 요약 (변화량, 건수 비교)
  - `src/components/history/UpcomingSummary.tsx`: 예정 요약 (남은 건수, 총액)
  - `src/components/history/index.ts`: 새 컴포넌트 export
  - `src/pages/HistoryPage.tsx`: URL 파라미터 (`?insight=`) 처리, InsightDetailHeader 통합
  - `src/components/home/insights/*.tsx`: 네비게이션 URL 패턴 업데이트
    - CautionInsight: `/history?insight=caution&categoryId=xxx`
    - RoomInsight: `/history?insight=room&categoryId=xxx`
    - InterestInsight: `/history?insight=interest&categoryId=xxx`
    - CompareInsight: `/history?insight=compare&categoryId=xxx`
    - UpcomingInsight: `/history?insight=upcoming`
- **구조**:
  ```
  홈 인사이트 카드 클릭
      ↓
  /history?insight=caution&categoryId=xxx
      ↓
  HistoryPage
      ├─ URL 파라미터 파싱 (insight, categoryId)
      ├─ getInsightDetail() 호출
      └─ InsightDetailHeader 렌더링
           └─ CautionSummary (타입별 Summary 컴포넌트)
  ```
- **결과**: 인사이트 카드 → 상세 뷰 연결 완료, 맥락 유지 + 액션 가능한 정보 제공

### #113 인사이트 상세 뷰 닫기 개선 (2026-01-13)
- **요청**: X 버튼 외에도 상단 필터 초기화 클릭 시 인사이트 뷰도 함께 닫히도록
- **변경**:
  - `src/pages/HistoryPage.tsx`:
    - `clearCategoryFilter` 함수 확장: 필터 초기화 시 인사이트 뷰도 닫기
    - URL 파라미터에서 `insight`, `categoryId` 모두 제거
- **동작**:
  - X 버튼 클릭 → 인사이트 뷰 닫힘 (기존)
  - 필터바 "초기화" 버튼 클릭 → 카테고리 필터 + 인사이트 뷰 모두 닫힘
  - 카테고리 모달 "초기화" 버튼 클릭 → 동일하게 동작
- **결과**: 사용자가 필터를 초기화할 때 인사이트 맥락도 함께 해제되어 일관된 UX

### #114 반복 거래 알림 시스템 완성 (2026-01-13)
- **요청**: 반복 거래 예정 알림 기능 완성 (이전 세션에서 시작)
- **변경**:
  - `src/types/index.ts`:
    - `RecurringAlertSetting` 인터페이스 추가 (enabled, daysBefore)
    - Settings에 `recurringAlertEnabled`, `recurringAlertDaysBefore`, `recurringAlertSettings` 추가
  - `src/services/database.ts`:
    - Migration v10: recurringAlertSettings 추가
  - `src/pages/RecurringAlertSettingsPage.tsx`:
    - 마스터 토글 (전체 알림 on/off)
    - 기본 알림 시점 선택 (당일, 1일 전, 3일 전, 7일 전)
    - 개별 반복 거래별 알림 설정 (on/off, 커스텀 시점)
    - 다음 실행일 표시
  - `src/services/budgetAlert.ts`:
    - `checkRecurringAlerts()` 함수 추가 - 앱 실행 시 다가오는 반복 거래 확인
  - `src/pages/HomePage.tsx`: 앱 실행 시 `checkRecurringAlerts()` 호출
  - `src/pages/SettingsPage.tsx`: 반복 거래 알림 메뉴 항목 추가
  - `src/App.tsx`: `/settings/recurring-alerts` 라우트 추가
- **결과**: 반복 거래 예정일 사전 알림 기능 완성

### #115 결제수단별 알림 시스템 구현 (2026-01-13)
- **요청**: "수단별 알람" - 결제수단 예산 초과 시 알림
- **변경**:
  - `src/types/index.ts`:
    - `PaymentMethodAlertSetting` 인터페이스 추가 (enabled, thresholds[], lastAlertedThreshold, lastAlertedMonth)
    - Settings에 `paymentMethodAlertEnabled`, `paymentMethodAlertSettings` 추가
    - `DEFAULT_PAYMENT_METHOD_ALERT_THRESHOLDS` 상수 추가 ([70, 100])
  - `src/services/database.ts`:
    - Migration v11: paymentMethodAlertSettings 추가
  - `src/pages/PaymentMethodAlertSettingsPage.tsx`:
    - 마스터 토글 (전체 알림 on/off)
    - 예산 설정된 결제수단만 표시
    - 개별 결제수단별 알림 설정 (on/off, 임계값 50~100%)
    - 예산 미설정 결제수단 안내
    - 결제수단 관리 페이지 링크
  - `src/services/budgetAlert.ts`:
    - `checkPaymentMethodAlerts()` 함수 추가 - 앱 실행 시 결제수단별 예산 확인
    - `checkPaymentMethodAfterTransaction()` 함수 추가 - 거래 후 즉시 확인
  - `src/pages/HomePage.tsx`: 앱 실행 시 `checkPaymentMethodAlerts()` 호출
  - `src/pages/SettingsPage.tsx`: 결제수단별 알림 메뉴 항목 추가
  - `src/App.tsx`: `/settings/payment-method-alerts` 라우트 추가
- **구조**:
  ```
  결제수단 예산 알림 흐름:
  1. 앱 실행 → checkPaymentMethodAlerts() → 임계값 초과 시 Toast
  2. 거래 저장 → checkPaymentMethodAfterTransaction() → 즉시 Toast

  설정 구조:
  paymentMethodAlertSettings: {
    [methodId]: {
      enabled: true,
      thresholds: [70, 100],
      lastAlertedThreshold: 70,
      lastAlertedMonth: "2026-01"
    }
  }
  ```
- **결과**: 카드/계좌별 개별 예산 알림 시스템 완성

### #116 카테고리 편집 시 알림 설정 연계 (2026-01-13)
- **요청**: "카테고리 생성 시 알람여부 연계"
- **변경**:
  - `src/pages/CategoryEditPage.tsx`:
    - 예산 입력 시 알림 설정 UI 자동 표시
    - Bell/BellOff 아이콘으로 알림 on/off 토글
    - 임계값 선택 (50%, 60%, 70%, 80%, 90%, 100%)
    - 카테고리 저장 시 알림 설정도 함께 저장
- **구조**:
  ```
  카테고리 편집 화면:
  ┌─────────────────────────────────┐
  │ 이름: [식비          ]          │
  │ 예산: [300,000      ]원         │
  ├─────────────────────────────────┤
  │ 🔔 예산 알림                [●] │ ← 예산 입력 시만 표시
  │ 알림 받을 시점:                  │
  │ [70%] [80%] [●100%]            │
  └─────────────────────────────────┘
  ```
- **UX 개선**: 카테고리 생성/수정 시 알림 설정을 별도 페이지 이동 없이 바로 설정

### #117 알림 설정 페이지 UI 개선 (2026-01-13)
- **요청**: UI 스타일 불일치 및 불필요한 정보 제거
- **변경**:
  - `src/pages/PaymentMethodAlertSettingsPage.tsx`:
    - "결제수단 예산 설정하기" 버튼 스타일 개선 (밑줄 링크 → 아이콘+버튼 형태)
    - RecurringAlertSettingsPage와 일관된 스타일 적용
  - `src/pages/RecurringAlertSettingsPage.tsx`:
    - 금액 표기 제거 (불필요한 정보 정리)
- **Before/After**:
  ```
  결제수단 알림 - 빈 상태:
  Before: "결제수단 예산 설정하기" (밑줄 텍스트)
  After:  [💳 결제수단 관리] (아이콘+버튼 형태)

  반복 거래 알림 - 항목:
  Before: "매월 15일 · 100,000원"
  After:  "매월 15일"
  ```
- **결과**: 알림 설정 페이지 간 일관된 UI, 불필요한 정보 정리

### #118 앱 내 알림 마스터 토글 추가 (2026-01-13)
- **요청**: 설정 화면 알림 영역에 앱 내 알림 전체 on/off 토글 추가
- **변경**:
  - `src/types/index.ts`:
    - Settings 인터페이스에 `notificationEnabled: boolean` 추가
    - DEFAULT_SETTINGS에 `notificationEnabled: true` 기본값 추가
  - `src/pages/SettingsPage.tsx`:
    - 알림 섹션 최상단에 "앱 내 알림" 마스터 토글 추가
    - 토글 스타일: `bg-ink-black dark:bg-pig-pink` (활성화), `bg-paper-mid` (비활성화)
    - 마스터 토글 OFF 시 세부 알림 설정(예산/카테고리/반복거래/결제수단) 숨김
- **구조**:
  ```
  알림 섹션:
  ┌─────────────────────────────────┐
  │ 🔔 앱 내 알림            [●───] │ ← 마스터 토글
  ├─────────────────────────────────┤
  │ (마스터 토글 ON일 때만 표시)     │
  │ 🔔 예산 알림                  > │
  │ 🔔 카테고리별 알림            > │
  │ 🔔 반복 거래 알림             > │
  │ 🔔 결제수단별 알림            > │
  └─────────────────────────────────┘
  ```
- **결과**: 앱 내 알림 전체를 한 번에 끄고 켤 수 있는 마스터 토글 추가

### #119 예정 지출 기록 및 날짜 탐색 개선 (2026-01-13)
- **요청**:
  1. AddPage에서 미래 날짜 선택 가능하도록 개선
  2. DateTimePicker 달력을 일~토 구조로 변경 + 주말 색상 구분
  3. HomePage의 "어제"/"예정" 요약카드 클릭 시 HistoryPage 해당 위치로 스크롤
- **변경**:
  - `src/pages/AddPage.tsx`:
    - `disableFuture={false}`로 변경하여 미래 날짜 선택 허용
    - 미래 날짜 선택 시 파란색 스타일링 + "예정" 라벨
    - "내일" 라벨 지원 추가 (isTomorrow)
  - `src/components/common/DateTimePicker.tsx`:
    - 달력 구조 변경: 일~토 요일 헤더 추가
    - 일요일 빨간색, 토요일 파란색 색상 구분
    - 1일 전 빈 셀 추가로 정확한 달력 표시
  - `src/pages/HomePage.tsx`:
    - "어제" 카드: `/history?scrollTo=yesterday` 네비게이션
    - "예정" 카드: `/history?scrollTo=future` 네비게이션
  - `src/pages/HistoryPage.tsx`:
    - 스크롤 컨테이너 수정: `window` → `main.overflow-y-auto`
    - `data-scroll-target` 속성으로 날짜 그룹 식별
    - FIXED_HEADER_HEIGHT(116px) 오프셋 적용으로 정확한 위치 스크롤
- **핵심 수정** (스크롤 이슈):
  ```tsx
  // App.tsx의 <main className="overflow-y-auto">가 실제 스크롤 컨테이너
  const scrollContainer = document.querySelector('main.overflow-y-auto');
  scrollContainer.scrollTo({
    top: relativeTop - FIXED_HEADER_HEIGHT,
    behavior: 'auto'
  });
  ```
- **결과**: 예정 지출 기록 가능, 달력 UI 개선, 요약카드 → 히스토리 탐색 연결

### #120 발전 방향 로드맵 문서 작성 (2026-01-13)
- **요청**: 현재 개발 상태 확인 및 향후 발전 방향 기획
- **변경**:
  - `docs/ROADMAP.md` 신규 생성
    - 현재 상태 요약 (v0.2.4, MVP 100%)
    - 단기 개선 계획 (v0.3.x): 예측 카드, 홈 UX 개선
    - 중기 발전 계획 (v0.4.x~v0.5.x): PWA 강화, 소셜 공유, 다국어
    - 장기 계획 (Phase 2): Capacitor iOS 전환, 위젯
    - 하지 않을 것 리스트 명시
    - 기술 부채 관리 계획
  - `docs/CONTEXT.md` 참조 문서에 ROADMAP.md 추가
- **결과**: 프로젝트 발전 방향 체계적 정리 완료

---

## 2026-01-15

### #121 UX/UI 개선 패키지 (v0.2.5) (2026-01-15)
- **요청**: 다크모드 가시성, 토스트 위치, 입력 UX 등 전반적 개선
- **변경**:
  1. **반복거래 메모/태그 입력 분리**
     - `src/pages/RecurringTransactionEditPage.tsx`: # 태그 혼합 시 커서 문제 해결
     - AddPage와 동일한 분리 입력 UI 적용 (메모 + 태그 별도)
  2. **토스트 알림 위치 상단 이동**
     - `src/components/common/Toast.tsx`: bottom → top 위치, 애니메이션 방향 변경
     - safe-area-inset-top 적용으로 노치 대응
  3. **토스트 다크모드 가시성**
     - 모든 토스트 타입(success/warning/danger/info)에 dark: 클래스 추가
     - 텍스트, 아이콘, 닫기 버튼 색상 다크모드 대응
  4. **금액 입력 천단위 콤마**
     - `src/pages/RecurringTransactionEditPage.tsx`: toLocaleString() 적용
  5. **분석 탭 다크모드 가시성**
     - `src/pages/StatsPage.tsx`: 카테고리/수단 아이콘 solid 배경 + white 아이콘
     - 카테고리명, 금액, 퍼센트 dark: 클래스 추가
  6. **AddPage Enter 키 → 태그 입력 이동**
     - 메모 입력에서 Enter 시 태그 입력으로 포커스 이동
  7. **AddPage 금액 입력 자동 포커스**
     - `autoFocus` + setTimeout(100ms)로 확실한 포커스
  8. **차트 라벨 다크모드 (SVG)**
     - `src/components/report/CategoryDonutChart.tsx`
     - `src/components/report/PaymentMethodDonutChart.tsx`
     - `isDarkMode()` 런타임 감지 → `fill` 직접 설정
     - className이 SVG text에서 동작하지 않는 문제 해결
  9. **차트 라벨 overflow 문제 해결**
     - 차트 컨테이너, PieChart에 `overflow: visible` 적용
     - StatsPage 부모 div에도 overflow: visible 추가
  10. **브라우저 light + 앱 dark 모드 가시성 수정**
     - CSS 변수 시스템 이해: `.dark` 클래스에서 변수가 자동 전환됨
     - StatsPage.tsx: 잘못된 `dark:text-paper-white` 제거 (paper-white는 다크모드에서 배경색)
     - 카테고리/수단 항목명, 금액, 퍼센트, 건수 등 `dark:` prefix 클래스 제거
     - CSS 변수(`text-ink-dark`, `text-ink-black` 등)가 `.dark` 클래스에 따라 자동 전환
     - CategoryDonutChart.tsx, PaymentMethodDonutChart.tsx: 다크모드 텍스트 색상을 globals.css 값과 일치 (`#F0F2F5`)
- **결과**: 다크모드 전반적 가시성 개선, 입력 UX 향상, 모바일 친화적 토스트
