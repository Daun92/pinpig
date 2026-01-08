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

## 진행 예정
- 온보딩 플로우 구현
- PWA 푸시 알림 연동

---
