# -*- coding: utf-8 -*-
"""PinPig 제품 문서 3종 — 내용 정의 (v0.2.5 + #137 기준)"""
import sys, io, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from render import Doc, n, write

META = '기준 앱 v0.2.5 (#137 반영) · 2026-08-07 · 드래그로 이동, 휠로 확대'

# ══════════════════════════════════════════════ 1. PRD
prd = Doc(
    'PinPig 제품 기획서',
    '"얼마나 썼지?"가 아니라 "얼마나 남았지?" — 비춰주는 거울 가계부',
    META,
    n('r', 'PinPig', 'start'),
    n('h', '제품 기획서', 'hub'),
    [
     {'title': '정의 · 프레임 전환', 'trees': [
        n('d', '제품 정의', 'hub',
          n('d1', '"얼마나 남았지?"를 1초에 비춰주는 예산 PWA', 'leaf'),
          n('d2', '기록하는 가계부가 아니라, 비춰주는 거울', 'leaf'),
          n('d3', '프레임 전환 5가지', 'leaf',
            n('d3a', '얼마나 썼지? → 얼마나 남았지?', 'action'),
            n('d3b', '지출=죄책감 → 소비=관심의 표현', 'action'),
            n('d3c', '과거 기록 → 현재 상태', 'action'),
            n('d3d', '분석 중심 → 확인 중심', 'action'),
            n('d3e', '금융앱 느낌 → 일상앱 느낌', 'action')))]},

     {'title': '타겟 사용자', 'trees': [
        n('p', '페르소나 — 김지원 29세 마케터', 'hub',
          n('p1', '월급 300만원 · 25일 입금', 'leaf'),
          n('p2', '고정지출 70만 (월세·통신·구독)', 'leaf'),
          n('p3', '가계부 앱 3개 설치 후 전부 삭제', 'leaf'),
          n('p4', '목표는 자산관리가 아닌 "이번 달 버티기"', 'leaf'),
          n('p5', '사용 패턴', 'leaf',
            n('p5a', '하루 3~6회 실행', 'action'),
            n('p5b', '확인 3~5회 · 회당 3초', 'action'),
            n('p5c', '기록 2~3회 · 회당 10초', 'action')))]},

     {'title': '문제 정의', 'trees': [
        n('q', '문제', 'hub',
          n('q1', '① 질문에 답하지 않음 — 남은 돈이 안 보임', 'leaf'),
          n('q2', '② 과도한 복잡성 — 계좌연동·자산관리', 'leaf'),
          n('q3', '③ 감정 비용 — 판단형 메시지의 죄책감', 'leaf'),
          n('q4', '귀결', 'leaf',
            n('q4a', '설치 → 며칠 사용 → 삭제 반복', 'action'),
            n('q4b', '소비 인식 자체를 포기', 'action')))]},

     {'title': '해결 방안', 'trees': [
        n('s', '해결', 'hub',
          n('s1', '1초 확인 — 히어로에 남은 돈·하루 가용액', 'leaf',
            n('s1a', '로컬 IndexedDB — 로딩·오프라인 제약 없음', 'action')),
          n('s2', '3터치 기록 — FAB → 금액+카테고리 → 저장', 'leaf',
            n('s2a', '시간대 기반 카테고리 추천', 'action'),
            n('s2b', '날짜 "오늘" 기본값 · 마지막 수단 유지', 'action')),
          n('s3', '판단 없는 비춤 — 중립 문구만', 'leaf',
            n('s3a', '예산 초과에도 경고·빨간색 없음', 'action')),
          n('s4', '소비=관심 프레임 — 통계·리뷰·인사이트', 'leaf'),
          n('s5', '자동화 — 반복거래 실행 · 알림 4종', 'leaf',
            n('s5a', '밀린 회차 catch-up 최대 365건', 'action')))]},

     {'title': '차별화', 'trees': [
        n('x', '차별화', 'hub',
          n('x1', '프레임 전환 — 절약 강요가 아닌 인식', 'leaf'),
          n('x2', '감정 설계 — 죄책감 없는 중립 어조', 'leaf'),
          n('x3', '로컬 우선 — 회원가입·서버·계좌연동 없음', 'leaf'),
          n('x4', '극단적 단순화 — 3터치 기록, 1초 확인', 'leaf'),
          n('x5', '설치 장벽 없음 — PWA로 즉시 시작', 'leaf'))]},

     {'title': '범위 — In Scope (12영역 전부 완료)', 'trees': [
        n('i', '요구사항 영역', 'hub',
          n('i1', 'R-01 온보딩 및 첫 예산 설정', 'leaf'),
          n('i2', 'R-02 홈 대시보드 (1초 확인)', 'leaf'),
          n('i3', 'R-03 거래 기록 및 수정', 'leaf'),
          n('i4', 'R-04 거래 내역 조회', 'leaf'),
          n('i5', 'R-05 예산 관리', 'leaf'),
          n('i6', 'R-06 분류 체계 관리 (카테고리·수단)', 'leaf'),
          n('i7', 'R-07 반복 거래 자동화 · 연간 지출', 'leaf'),
          n('i8', 'R-08 통계 및 리포트', 'leaf'),
          n('i9', 'R-09 홈 인사이트', 'leaf'),
          n('i10', 'R-10 알림 시스템', 'leaf'),
          n('i11', 'R-11 데이터 내보내기 · 가져오기', 'leaf'),
          n('i12', 'R-12 설정 및 개인화', 'leaf'))]},

     {'title': '범위 — Out of Scope', 'trees': [
        n('o', '의도적 제외', 'hub',
          n('o1', '투자 · 자산 추적 — 복잡성', 'action'),
          n('o2', '또래 비교 — 프라이버시 · 스트레스', 'action'),
          n('o3', '게이미피케이션 — 미검증', 'action'),
          n('o4', '영수증 OCR — 비용 대비 효과 불명확', 'action'),
          n('o5', '복식부기 — 타겟 니즈 아님', 'action'),
          n('o6', '계좌 연동 · 서버 저장 · 회원가입', 'action'),
          n('o7', '급여일 기준 예산 주기 — 달력 월 고정', 'action'))]},

     {'title': '성공 지표 · 리스크', 'trees': [
        n('k', '성공 지표', 'hub',
          n('k1', '온보딩 완료율 90%+', 'action'),
          n('k2', 'D1 리텐션 60%+', 'action'),
          n('k3', 'D7 리텐션 40%+', 'action'),
          n('k4', '일평균 기록 2회+', 'action'),
          n('k5', '기록 소요 15초 이내', 'action'),
          n('k6', '정성 — 복잡하지 않다 · 죄책감이 안 든다', 'action')),
        n('rk', '리스크 · 완화', 'hub',
          n('rk1', '데이터 유실 — 로컬 단독 저장', 'leaf',
            n('rk1a', 'JSON 내보내기 · 가져오기', 'action')),
          n('rk2', '다기기 동기화 부재', 'leaf',
            n('rk2a', 'Phase 2 이후 검토', 'action')),
          n('rk3', 'iOS PWA 제약 — 푸시 · 설치 경험', 'leaf',
            n('rk3a', 'Phase 2 Capacitor 전환으로 해소', 'action')),
          n('rk4', '수동 기록 지속성 — 습관 끊기면 공백', 'leaf',
            n('rk4a', '반복거래 자동화 · 알림으로 완화', 'action')),
          n('rk5', '수익모델 부재 — 개인 프로젝트', 'leaf'))]},

     {'title': '플랫폼 · 기술', 'trees': [
        n('t', '플랫폼 · 기술', 'hub',
          n('t1', 'Phase 1 — 모바일 웹 PWA (완료)', 'leaf',
            n('t1a', 'vite-plugin-pwa + Workbox · 오프라인 동작', 'action')),
          n('t2', 'Phase 2 — iOS Capacitor (예정)', 'leaf',
            n('t2a', '푸시 알림 · 홈화면 설치 경험 개선', 'action')),
          n('t3', '기술 스택', 'leaf',
            n('t3a', 'React 18 + TypeScript strict + Vite', 'action'),
            n('t3b', 'Zustand · Dexie.js (IndexedDB)', 'action'),
            n('t3c', 'Tailwind CSS · Recharts · date-fns', 'action')),
          n('t4', '역할 — 단일 사용자, 로그인·권한 체계 없음', 'leaf'))]},
    ])

# ══════════════════════════════════════════════ 2. 유저 플로우
flow = Doc(
    'PinPig 유저 플로우',
    '진입 게이트 · 핵심 플로우 4종 · 예산 설정 3경로 · 시스템 플로우 2종',
    META,
    n('r', '앱 실행', 'start'),
    n('h', 'PinPig', 'hub'),
    [
     {'title': '앱 진입 게이트', 'trees': [
        n('g', '진입 판정 — isOnboardingComplete', 'hub',
          n('g1', '미완료 → 온보딩 5단계 (라우터 밖 전체화면)', 'leaf',
            n('g1a', '① 웰컴 — "오늘 얼마나 쓸 수 있지?"', 'leaf'),
            n('g1b', '② 홈 소개', 'leaf'),
            n('g1c', '③ 3터치 기록 소개', 'leaf'),
            n('g1d', '④ 분석 소개', 'leaf'),
            n('g1e', '⑤ 월 예산 슬라이더 50만~500만', 'leaf',
              n('g1f', '"나중에 설정할게요" 스킵 가능', 'action'))),
          n('g2', '완료 → 홈 (/)', 'leaf',
            n('g2a', 'App 마운트 시 반복거래 자동 실행 1회', 'action'),
            n('g2b', 'visibilitychange 재진입 시 날짜 키 재검사', 'action')))]},

     {'title': '① 1초 확인 — 하루 3~5회 · 0터치 · 3초', 'trees': [
        n('f1', '홈 히어로 (/)', 'hub',
          n('f1a', '이번 달 쓸 수 있는 돈', 'leaf'),
          n('f1b', 'N일 남음 · 하루 M원', 'leaf'),
          n('f1c', '예정 N원 포함 (#137)', 'leaf',
            n('f1c1', '확정 + 예정 + 반복예상을 모두 차감', 'action')),
          n('f1d', '예산 사용률 프로그레스', 'leaf'),
          n('f1e', '인사이트 캐러셀 — 최대 3장', 'leaf',
            n('f1e1', '좌우 스와이프로 탐색', 'action'),
            n('f1e2', '카드 탭 → 맥락 전달하며 상세 이동', 'action')),
          n('f1f', '아래로 스크롤 → 오늘 거래 목록', 'leaf',
            n('f1f1', '하단 "어제" 카드 · "예정" 카드', 'leaf')))]},

     {'title': '② 3터치 기록 — 하루 2~5회 · 3터치 · 10초', 'trees': [
        n('f2', '거래 입력 (/add)', 'hub',
          n('f2a', '① FAB ＋ 탭 → 금액 필드 자동 포커스', 'leaf'),
          n('f2b', '② 금액 입력 + 카테고리 칩 (5열 그리드)', 'leaf'),
          n('f2c', '③ FAB ✓ 저장 → 홈 복귀 · 잔액 즉시 반영', 'leaf',
            n('f2c1', '금액 0 또는 카테고리 미선택 시 FAB 비활성', 'action')),
          n('f2d', '선택 — 결제 · 수입수단 칩 (자동 펼침)', 'leaf'),
          n('f2e', '선택 — 메모 · 태그 (추천 칩)', 'leaf'),
          n('f2f', '선택 — 할부 / 반복 3-way 토글', 'leaf',
            n('f2f1', '할부 n개월 → 분할 거래 + 반복 등록', 'action'),
            n('f2f2', '반복 주기 → 템플릿 등록 + "반복" 태그', 'action')),
          n('f2g', '선택 — 날짜 (오늘 기본 · 미래 선택 가능)', 'leaf',
            n('f2g1', '미래 날짜 → 파란 "예정" 라벨', 'action'),
            n('f2g2', '저장 시 "N월 N일에 기록될 예정이에요"', 'action')),
          n('f2h', '헤더 지출 / 수입 토글', 'leaf',
            n('f2h1', '수입 저장 시 + 기호 · 녹색 표시', 'action')))]},

     {'title': '③ 내역 확인 · 검색 — 하루 0~2회', 'trees': [
        n('f3', '기록 (/history)', 'hub',
          n('f3a', '이번 달 · 날짜별 그룹 (일별 수입·지출 요약)', 'leaf'),
          n('f3b', '미래 날짜 그룹 — 파란 "예정" 배지 (#137)', 'leaf'),
          n('f3c', '월 이동 — 스와이프 · ◀▶ (미래 월 포함)', 'leaf'),
          n('f3d', '월 선택 모달 — 연도 + 4×3 그리드', 'leaf'),
          n('f3e', '전체 기간 텍스트 검색 (메모 · 태그)', 'leaf'),
          n('f3f', '카테고리 다중 선택 필터 모달', 'leaf'),
          n('f3g', '진입 시 "오늘" 그룹 자동 앵커', 'leaf',
            n('f3g1', '홈 "어제" 카드 → ?scrollTo=yesterday', 'action'),
            n('f3g2', '홈 "예정" 카드 → ?scrollTo=future', 'action')),
          n('f3h', '항목 탭 → 거래 상세 (/transaction/:id)', 'leaf',
            n('f3h1', '거래 수정 (/transaction/:id/edit)', 'leaf',
              n('f3h2', 'FAB ✓ 저장 · 휴지통 → 삭제 confirm', 'action'),
              n('f3h3', '미래 날짜로 수정 가능 (#137)', 'action'))))]},

     {'title': '④ 월말 리뷰 — 월 1~2회', 'trees': [
        n('f4', '분석 (/stats)', 'hub',
          n('f4a', '카테고리별 — 도넛 + 리스트', 'leaf',
            n('f4a1', '항목 탭 → 카테고리 추이 모달', 'action'),
            n('f4a2', '금액순 | 예산순 토글 (#136)', 'action')),
          n('f4b', '결제수단별 — 도넛 + 리스트 (한도 대비 %)', 'leaf',
            n('f4b1', '항목 탭 → 수단 추이 모달', 'action')),
          n('f4c', '기간별 추이 — 6/12개월 · 연간 멀티라인', 'leaf'),
          n('f4d', '💡 이번 달 관심사 — 중립 인사이트', 'leaf'),
          n('f4e', '집계 기준 — 확정 지출만 (#137)', 'leaf',
            n('f4e1', '예정 거래는 분석에서 제외', 'action'))),
        n('f5', '월간 리뷰 (/review)', 'hub',
          n('f5a', '지출 총액 + 예산 대비 %', 'leaf'),
          n('f5b', '발견한 점 (ReviewInsight)', 'leaf'),
          n('f5c', '카테고리별 전월 비교', 'leaf'),
          n('f5d', '다음 달 예산', 'leaf',
            n('f5d1', '유지하기 → /settings', 'action'),
            n('f5d2', '조정하기 → 예산 마법사', 'action')))]},

     {'title': '예산 설정 3경로 — 월 0~1회', 'trees': [
        n('f6', '예산 설정', 'hub',
          n('f6a', '빠르게 — 설정 > 월 예산 인라인 입력', 'leaf',
            n('f6a1', 'onBlur 즉시 저장', 'action')),
          n('f6b', '처음부터 — 예산 마법사 5단계', 'leaf',
            n('f6b1', '① 지난 3개월 지출 회고', 'leaf'),
            n('f6b2', '② 카테고리별 소비 패턴', 'leaf'),
            n('f6b3', '③ 목표 금액 — 슬라이더 + 절약/유지/여유', 'leaf'),
            n('f6b4', '④ 카테고리별 배분 — 자동 배분 토글', 'leaf'),
            n('f6b5', '⑤ 완료 → 홈', 'leaf')),
          n('f6c', '일상 조정 — 카테고리별 예산', 'leaf',
            n('f6c1', '금액 / % 모드 전환', 'action'),
            n('f6c2', '비율대로 · 균등 빠른 배분', 'action'),
            n('f6c3', '요약 — 미배분 · 초과 표시', 'action')))]},

     {'title': '반복거래 라이프사이클 (시스템)', 'trees': [
        n('f7', 'RecurringTransaction 템플릿', 'hub',
          n('f7a', '등록 — AddPage 반복 토글', 'leaf'),
          n('f7b', '등록 — 거래 수정 화면 반복 전환', 'leaf'),
          n('f7c', '등록 — /settings/recurring/new 직접', 'leaf'),
          n('f7d', '등록 직후 — 이미 도래한 회차 즉시 반영', 'leaf'),
          n('f7e', '실행 엔진 — App 마운트 시 세션당 1회', 'leaf',
            n('f7e1', 'on_date — 오늘까지 도래분만 생성', 'leaf'),
            n('f7e2', 'start_of_month — 당월 말일까지 선반영', 'leaf'),
            n('f7e3', '밀린 회차 catch-up 최대 365건', 'action'),
            n('f7e4', '"반복" 태그 자동 부여 · 다음 실행일 재계산', 'action')),
          n('f7f', '미생성 예상분 (ProjectedTransaction)', 'leaf',
            n('f7f1', '홈 "예정" 카드 · 예산 구조에 반영', 'action')))]},

     {'title': '알림 트리거 (시스템)', 'trees': [
        n('f8', '알림 마스터 토글 — notificationEnabled', 'hub',
          n('f8a', '전체 예산 — 사용률 50 / 80 / 100%', 'leaf',
            n('f8a1', '기준: 확정 + 예정 (남은 예산과 동일)', 'action')),
          n('f8b', '카테고리 — 카테고리 예산 70 / 100%', 'leaf',
            n('f8b1', '기준: 확정 지출만 (#137)', 'action')),
          n('f8c', '결제수단 — 수단 한도 70 / 100%', 'leaf',
            n('f8c1', '거래 저장 직후 즉시 검사', 'action')),
          n('f8d', '반복거래 — 실행 N일 전 (기본 1일)', 'leaf'),
          n('f8e', '연간 지출 — 발생 N일 전 (기본 14일)', 'leaf'),
          n('f8f', '중복 차단 · 표시', 'leaf',
            n('f8f1', '이번 달/오늘 이미 발송이면 무시 (lastAlerted*)', 'action'),
            n('f8f2', '중립 톤 토스트 — 판단·경고 문구 없음', 'action')))]},
    ])

# ══════════════════════════════════════════════ 3. IA
ia = Doc(
    'PinPig 정보 구조 (IA)',
    '27개 라우트 · 하단 탭바 4 + FAB · 설정 허브 5영역 · 로컬 저장 계층',
    META,
    n('r', '앱 실행', 'start'),
    n('h', 'PinPig', 'hub'),
    [
     {'title': '전역 · 진입', 'trees': [
        n('gl', '전역 레이어', 'hub',
          n('gl1', '온보딩 게이트 — 라우터 밖 전체화면', 'leaf'),
          n('gl2', '스플래시 — 설정 로드 중', 'leaf'),
          n('gl3', '하단 탭바 — 오늘 · 기록 · ＋ · 분석 · 설정', 'leaf'),
          n('gl4', '코치마크 투어 (첫 방문)', 'leaf'),
          n('gl5', '토스트 알림 레이어', 'leaf'))]},

     {'title': '오늘 — 홈 (/)', 'trees': [
        n('a', '오늘  /', 'hub',
          n('a1', 'Screen 1 — 히어로 (남은 돈 · 하루 가용액)', 'leaf'),
          n('a2', 'Screen 1 — 인사이트 캐러셀', 'leaf',
            n('a2a', 'caution · room · compare', 'action'),
            n('a2b', 'interest · upcoming · budget-overview', 'action'),
            n('a2c', '설정에서 최대 3개 선택', 'action')),
          n('a3', 'Screen 2 — 오늘 거래 목록', 'leaf'),
          n('a4', '하단 카드 — 어제 · 예정', 'leaf'),
          n('a5', '거래 상세  /transaction/:id', 'leaf',
            n('a5a', '거래 수정  /transaction/:id/edit', 'leaf')))]},

     {'title': '기록 — 내역 (/history)', 'trees': [
        n('b', '기록  /history', 'hub',
          n('b1', '월 단위 · 날짜별 그룹 (sticky 헤더)', 'leaf'),
          n('b2', '미래 날짜 그룹 — "예정" 배지', 'leaf'),
          n('b3', '월 선택 모달 — 연도 + 4×3 그리드', 'leaf'),
          n('b4', '검색 — 전체 기간 (메모 · 태그)', 'leaf'),
          n('b5', '카테고리 다중 필터 모달', 'leaf'),
          n('b6', '인사이트 상세 헤더  ?insight=', 'leaf'),
          n('b7', '맥락 스크롤  ?scrollTo=today|yesterday|future', 'leaf'))]},

     {'title': '입력 — 거래 (/add)', 'trees': [
        n('c', '＋ FAB  /add', 'hub',
          n('c1', '금액 (Hero) + 카테고리 5열 그리드', 'leaf'),
          n('c2', '아코디언 — 결제 · 수입수단', 'leaf'),
          n('c3', '아코디언 — 메모 · 태그', 'leaf'),
          n('c4', '아코디언 — 할부 / 반복 3-way', 'leaf'),
          n('c5', '날짜 · 시간 피커 (미래 선택 가능)', 'leaf'),
          n('c6', 'iOS 단축어 딥링크  /add?type=', 'leaf'))]},

     {'title': '분석 — 통계 · 리뷰', 'trees': [
        n('e', '분석  /stats', 'hub',
          n('e1', '지출 / 수입 탭 · 월간 / 연간 토글', 'leaf'),
          n('e2', '카테고리별 — 도넛 + 리스트 + 추이 모달', 'leaf'),
          n('e3', '결제수단별 — 도넛 + 리스트 + 추이 모달', 'leaf'),
          n('e4', '기간별 추이 — 6/12개월 · 연간 멀티라인', 'leaf'),
          n('e5', '집계 기준 — 확정 지출만', 'leaf')),
        n('e6', '월간 리뷰  /review', 'hub',
          n('e6a', '총지출 · 예산 사용률', 'leaf'),
          n('e6b', '발견한 점 · 전월 카테고리 비교', 'leaf'))]},

     {'title': '설정 — 5영역 허브 (/settings)', 'trees': [
        n('s', '설정  /settings', 'hub',
          n('s1', '월 예산 인라인 입력', 'leaf'),
          n('s2', '테마 — 라이트 · 다크 · 시스템', 'leaf'),
          n('s3', '앱 내 알림 마스터 토글', 'leaf'),
          n('s4', '앱 정보 — 버전 · 빌드(커밋)', 'leaf'),
          n('u1', '① 예산', 'hub',
            n('u1a', '예산 마법사  /settings/budget-wizard', 'leaf'),
            n('u1b', '카테고리별 예산  /settings/category-budget', 'leaf')),
          n('u2', '② 분류 · 수단', 'hub',
            n('u2a', '카테고리 관리  /settings/categories', 'leaf',
              n('u2a1', '카테고리 편집  new · :id/edit', 'leaf')),
            n('u2b', '수단 관리  /settings/methods', 'leaf',
              n('u2b1', '결제수단  /settings/payment-methods', 'leaf'),
              n('u2b2', '수입수단  /settings/income-sources', 'leaf'))),
          n('u3', '③ 자동화', 'hub',
            n('u3a', '반복 거래  /settings/recurring', 'leaf',
              n('u3a1', '반복 거래 편집  new · :id/edit', 'leaf')),
            n('u3b', '연간 지출 관리  /settings/annual-expenses', 'leaf')),
          n('u4', '④ 알림 · 인사이트', 'hub',
            n('u4a', '전체 예산 알림  /settings/budget-alerts', 'leaf'),
            n('u4b', '카테고리 알림  /settings/category-alerts', 'leaf'),
            n('u4c', '반복거래 알림  /settings/recurring-alerts', 'leaf'),
            n('u4d', '결제수단 알림  /settings/payment-method-alerts', 'leaf'),
            n('u4e', '인사이트 카드  /settings/insights', 'leaf',
              n('u4e1', '표시 위젯 최대 3개 선택', 'action'))),
          n('u5', '⑤ 데이터', 'hub',
            n('u5a', '가져오기  /settings/import', 'leaf',
              n('u5a1', 'Excel 일괄 가져오기', 'action')),
            n('u5b', '내보내기  /settings/export', 'leaf',
              n('u5b1', 'CSV · JSON 내보내기', 'action')),
            n('u5c', '데이터베이스 초기화', 'leaf')))]},

     {'title': '저장 계층 — 로컬 전용', 'trees': [
        n('db', 'Dexie.js (IndexedDB)', 'hub',
          n('db1', 'transactions', 'leaf'),
          n('db2', 'categories', 'leaf'),
          n('db3', 'paymentMethods · incomeSources', 'leaf'),
          n('db4', 'recurringTransactions', 'leaf'),
          n('db5', 'annualExpensePatterns', 'leaf'),
          n('db6', 'settings', 'leaf'),
          n('db7', '경계', 'leaf',
            n('db7a', '서버 · 계좌연동 · 회원가입 없음', 'action'),
            n('db7b', '데이터가 기기를 떠나지 않음 · 오프라인 완전 동작', 'action')))]},
    ])


write('PinPig_PRD_구조도.html', prd)
write('PinPig_유저플로우.html', flow)
write('PinPig_IA_화면구조.html', ia)
