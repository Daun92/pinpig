/**
 * PinPig 모의 데이터 CSV 생성 스크립트
 *
 * 페르소나: 서울 거주 30대 여성 직장인
 * - 이름: 김지연 (가상)
 * - 나이: 32세
 * - 직업: IT 기업 마케팅 매니저
 * - 월급: 세후 약 350만원 (25일 입금)
 * - 거주: 서울 마포구 원룸 (월세 65만원)
 * - 특징: 카페/디저트 좋아함, 자기계발 관심, 온라인 쇼핑 즐김
 *
 * 기간: 2025년 7월 ~ 2025년 12월 (6개월)
 *
 * Usage: node scripts/generate-seed-csv.js
 *
 * 생성 파일:
 *   - data/seed-transactions.csv
 *   - data/seed-categories.csv
 *   - data/seed-payment-methods.csv
 *   - data/seed-transactions-import.csv (앱 가져오기용)
 */

const fs = require('fs');
const path = require('path');

// 출력 디렉토리 생성
const dataDir = path.join(__dirname, '..', 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// =========================================
// 날짜/유틸리티 헬퍼
// =========================================

function generateId() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function daysAgo(days) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date;
}

function formatDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function formatTime(hours, minutes) {
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
}

function randomItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// 가중치 기반 랜덤 선택
function weightedRandomItem(items, weights) {
  const totalWeight = weights.reduce((a, b) => a + b, 0);
  let random = Math.random() * totalWeight;
  for (let i = 0; i < items.length; i++) {
    if (random < weights[i]) return items[i];
    random -= weights[i];
  }
  return items[items.length - 1];
}

function escapeCSV(value) {
  if (!value) return '';
  if (value.includes(',') || value.includes('\n') || value.includes('"')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

// =========================================
// 기본 데이터 정의 (페르소나 맞춤)
// =========================================

const EXPENSE_CATEGORIES = [
  { id: generateId(), name: '식비', icon: 'Utensils', color: '#FF6B6B', type: 'expense', order: 0, budget: 500000 },
  { id: generateId(), name: '교통', icon: 'Car', color: '#4ECDC4', type: 'expense', order: 1, budget: 150000 },
  { id: generateId(), name: '쇼핑', icon: 'ShoppingBag', color: '#45B7D1', type: 'expense', order: 2, budget: 300000 },
  { id: generateId(), name: '문화/여가', icon: 'Film', color: '#96CEB4', type: 'expense', order: 3, budget: 200000 },
  { id: generateId(), name: '의료/건강', icon: 'Heart', color: '#FFEAA7', type: 'expense', order: 4, budget: 100000 },
  { id: generateId(), name: '주거/통신', icon: 'Home', color: '#DDA0DD', type: 'expense', order: 5, budget: 850000 },
  { id: generateId(), name: '기타', icon: 'MoreHorizontal', color: '#B8B8B8', type: 'expense', order: 6, budget: 150000 },
];

const INCOME_CATEGORIES = [
  { id: generateId(), name: '급여', icon: 'Wallet', color: '#4A7C59', type: 'income', order: 0 },
  { id: generateId(), name: '용돈', icon: 'Gift', color: '#FDA7DF', type: 'income', order: 1 },
  { id: generateId(), name: '기타수입', icon: 'TrendingUp', color: '#74B9FF', type: 'income', order: 2 },
];

const PAYMENT_METHODS = [
  { id: generateId(), name: '현금', icon: 'Banknote', color: '#4CAF50', order: 0 },
  { id: generateId(), name: '신한카드', icon: 'CreditCard', color: '#0046FF', order: 1, budget: 1200000 },
  { id: generateId(), name: '삼성카드', icon: 'CreditCard', color: '#1428A0', order: 2, budget: 500000 },
  { id: generateId(), name: '카카오페이', icon: 'Smartphone', color: '#FEE500', order: 3 },
  { id: generateId(), name: '계좌이체', icon: 'Building', color: '#9C27B0', order: 4 },
];

// 거래 설명 템플릿 (30대 여성 직장인 페르소나 맞춤)
const EXPENSE_DESCRIPTIONS = {
  '식비': {
    items: [
      // 카페 (30대 여성, 카페 자주 이용)
      { desc: '스타벅스 마포역점', min: 5500, max: 8500, weight: 15 },
      { desc: '투썸플레이스', min: 6000, max: 9500, weight: 10 },
      { desc: '이디야커피', min: 3500, max: 5500, weight: 12 },
      { desc: '블루보틀 연남점', min: 6000, max: 8000, weight: 5 },
      { desc: '폴바셋', min: 5500, max: 7500, weight: 4 },
      // 점심 (회사 근처)
      { desc: '회사 구내식당', min: 6000, max: 7000, weight: 20 },
      { desc: '마포 국밥집', min: 8000, max: 10000, weight: 8 },
      { desc: '연남동 파스타', min: 14000, max: 18000, weight: 5 },
      { desc: '샐러디', min: 9000, max: 13000, weight: 8 },
      // 편의점/간식
      { desc: 'GS25', min: 2000, max: 8000, weight: 12 },
      { desc: 'CU', min: 2000, max: 7000, weight: 10 },
      { desc: '세븐일레븐', min: 2500, max: 6000, weight: 5 },
      // 배달
      { desc: '배달의민족', min: 15000, max: 28000, weight: 10 },
      { desc: '요기요', min: 14000, max: 26000, weight: 6 },
      { desc: '쿠팡이츠', min: 16000, max: 30000, weight: 5 },
      // 외식
      { desc: '홍대 떡볶이', min: 8000, max: 12000, weight: 4 },
      { desc: '연남동 브런치카페', min: 18000, max: 25000, weight: 3 },
      { desc: '마포숯불갈비', min: 25000, max: 40000, weight: 3 },
      { desc: '합정 일식당', min: 20000, max: 35000, weight: 3 },
      // 디저트
      { desc: '노티드 도넛', min: 4000, max: 12000, weight: 6 },
      { desc: '뚜레쥬르', min: 5000, max: 15000, weight: 5 },
      { desc: '설빙', min: 10000, max: 15000, weight: 3 },
    ],
  },
  '교통': {
    items: [
      { desc: '티머니 충전', min: 30000, max: 50000, weight: 25 },
      { desc: '카카오택시', min: 8000, max: 22000, weight: 35 },
      { desc: '타다', min: 10000, max: 28000, weight: 15 },
      { desc: '따릉이', min: 1000, max: 2000, weight: 15 },
      { desc: 'KTX (서울-부산)', min: 50000, max: 60000, weight: 3 },
      { desc: 'SRT', min: 45000, max: 55000, weight: 2 },
      { desc: '고속버스', min: 20000, max: 35000, weight: 5 },
    ],
  },
  '쇼핑': {
    items: [
      // 화장품/뷰티 (30대 여성 핵심)
      { desc: '올리브영', min: 15000, max: 60000, weight: 25 },
      { desc: '시코르', min: 30000, max: 80000, weight: 8 },
      { desc: '이니스프리', min: 15000, max: 40000, weight: 6 },
      // 패션
      { desc: '무신사', min: 30000, max: 90000, weight: 12 },
      { desc: '지그재그', min: 20000, max: 60000, weight: 10 },
      { desc: '에이블리', min: 15000, max: 50000, weight: 8 },
      { desc: '자라', min: 50000, max: 130000, weight: 5 },
      { desc: '유니클로', min: 30000, max: 80000, weight: 6 },
      { desc: 'COS', min: 80000, max: 180000, weight: 3 },
      // 생활용품
      { desc: '다이소', min: 5000, max: 20000, weight: 15 },
      { desc: '쿠팡', min: 15000, max: 60000, weight: 20 },
      { desc: '마켓컬리', min: 30000, max: 70000, weight: 8 },
      { desc: '오늘의집', min: 20000, max: 100000, weight: 5 },
      { desc: 'SSG닷컴', min: 25000, max: 80000, weight: 4 },
    ],
  },
  '문화/여가': {
    items: [
      // 구독 서비스 (월정액)
      { desc: '넷플릭스', min: 13500, max: 13500, weight: 0, isSubscription: true, day: 5 },
      { desc: '유튜브프리미엄', min: 10450, max: 10450, weight: 0, isSubscription: true, day: 8 },
      { desc: '멜론', min: 10900, max: 10900, weight: 0, isSubscription: true, day: 12 },
      // 영화/공연
      { desc: 'CGV 홍대입구', min: 13000, max: 18000, weight: 15 },
      { desc: '메가박스', min: 12000, max: 17000, weight: 12 },
      { desc: '인터파크 공연', min: 50000, max: 150000, weight: 5 },
      // 독서
      { desc: '교보문고', min: 15000, max: 35000, weight: 12 },
      { desc: '알라딘', min: 12000, max: 30000, weight: 10 },
      { desc: '밀리의서재', min: 9900, max: 9900, weight: 0, isSubscription: true, day: 15 },
      // 운동/자기계발
      { desc: '필라테스 PT', min: 50000, max: 50000, weight: 20 },
      { desc: '클래스101', min: 30000, max: 80000, weight: 5 },
      { desc: '탈잉 클래스', min: 40000, max: 100000, weight: 4 },
      // 기타
      { desc: '찜질방', min: 12000, max: 18000, weight: 5 },
      { desc: '방탈출카페', min: 20000, max: 30000, weight: 4 },
    ],
  },
  '의료/건강': {
    items: [
      { desc: '마포약국', min: 5000, max: 20000, weight: 35 },
      { desc: '올리브영 영양제', min: 25000, max: 60000, weight: 20 },
      { desc: '연세내과', min: 15000, max: 35000, weight: 15 },
      { desc: '강남피부과', min: 50000, max: 150000, weight: 10 },
      { desc: '마포치과', min: 30000, max: 100000, weight: 8 },
      { desc: '안과 검진', min: 20000, max: 50000, weight: 5 },
      { desc: '건강검진센터', min: 80000, max: 200000, weight: 2 },
      { desc: '아이허브', min: 30000, max: 80000, weight: 5 },
    ],
  },
  '주거/통신': {
    items: [
      // 고정 지출 (월정액)
      { desc: '월세', min: 650000, max: 650000, weight: 0, isFixed: true, day: 1 },
      { desc: '관리비', min: 70000, max: 90000, weight: 0, isFixed: true, day: 25 },
      { desc: 'SKT 통신비', min: 62000, max: 68000, weight: 0, isFixed: true, day: 20 },
      { desc: 'KT 인터넷', min: 33000, max: 33000, weight: 0, isFixed: true, day: 15 },
      { desc: '전기요금', min: 20000, max: 80000, weight: 0, isFixed: true, day: 15 },
      { desc: '가스요금', min: 10000, max: 40000, weight: 0, isFixed: true, day: 20 },
    ],
  },
  '기타': {
    items: [
      { desc: '미용실 커트', min: 20000, max: 35000, weight: 15 },
      { desc: '미용실 펌', min: 80000, max: 150000, weight: 5 },
      { desc: '미용실 염색', min: 60000, max: 120000, weight: 5 },
      { desc: '네일샵', min: 40000, max: 80000, weight: 12 },
      { desc: '경조사비', min: 30000, max: 100000, weight: 15 },
      { desc: '선물 구입', min: 20000, max: 70000, weight: 15 },
      { desc: '세탁소', min: 8000, max: 25000, weight: 10 },
      { desc: '사진관', min: 15000, max: 50000, weight: 3 },
      { desc: 'ATM 수수료', min: 500, max: 1000, weight: 10 },
      { desc: '택배비', min: 3000, max: 5000, weight: 10 },
    ],
  },
};

const INCOME_DESCRIPTIONS = {
  '급여': [
    { desc: '(주)테크마케팅 급여', min: 3500000, max: 3500000, weight: 100 },
  ],
  '용돈': [
    { desc: '부모님 용돈', min: 200000, max: 500000, weight: 40 },
    { desc: '명절 용돈', min: 100000, max: 300000, weight: 30 },
    { desc: '생일 축하금', min: 50000, max: 200000, weight: 30 },
  ],
  '기타수입': [
    { desc: '당근마켓 중고거래', min: 10000, max: 80000, weight: 50 },
    { desc: '예금 이자', min: 5000, max: 30000, weight: 30 },
    { desc: '카드 캐시백', min: 5000, max: 20000, weight: 20 },
  ],
};

// 카테고리별 기본 금액 범위 (레거시 호환용)
const AMOUNT_RANGES = {
  '식비': [3000, 50000],
  '교통': [1250, 30000],
  '쇼핑': [5000, 200000],
  '문화/여가': [5000, 50000],
  '의료/건강': [5000, 100000],
  '주거/통신': [10000, 150000],
  '기타': [1000, 50000],
};

// =========================================
// CSV 생성 함수들
// =========================================

function generateCategoriesCSV() {
  const allCategories = [...EXPENSE_CATEGORIES, ...INCOME_CATEGORIES];
  const headers = ['id', 'name', 'icon', 'color', 'type', 'order', 'budget'];

  const rows = allCategories.map(c => [
    c.id,
    escapeCSV(c.name),
    c.icon,
    c.color,
    c.type,
    c.order,
    c.budget || ''
  ]);

  const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  return '\uFEFF' + csv; // BOM for Excel
}

function generatePaymentMethodsCSV() {
  const headers = ['id', 'name', 'icon', 'color', 'order', 'budget'];

  const rows = PAYMENT_METHODS.map(p => [
    p.id,
    escapeCSV(p.name),
    p.icon,
    p.color,
    p.order,
    p.budget || ''
  ]);

  const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  return '\uFEFF' + csv;
}

// 결제수단 선택 (카테고리에 따라 다른 가중치)
function selectPaymentMethod(categoryName) {
  const methods = PAYMENT_METHODS;
  let weights;

  switch (categoryName) {
    case '식비':
      // 카페/식당: 카드, 카카오페이 위주
      weights = [5, 40, 25, 25, 5]; // 현금, 신한, 삼성, 카카오페이, 계좌이체
      break;
    case '교통':
      // 택시: 카카오페이, 카드
      weights = [5, 30, 20, 40, 5];
      break;
    case '쇼핑':
      // 온라인쇼핑: 카드 위주
      weights = [5, 45, 30, 15, 5];
      break;
    case '문화/여가':
      weights = [5, 40, 30, 20, 5];
      break;
    case '주거/통신':
      // 자동이체: 계좌이체, 카드
      weights = [0, 30, 20, 0, 50];
      break;
    case '의료/건강':
      weights = [10, 40, 30, 15, 5];
      break;
    default:
      weights = [15, 35, 25, 15, 10];
  }

  return weightedRandomItem(methods, weights);
}

// 페르소나 기반 거래 생성 (2025년 7월 ~ 12월)
function generateTransactionsCSV() {
  const transactions = [];

  // 기간: 2025년 7월 1일 ~ 2025년 12월 31일
  const startDate = new Date(2025, 6, 1);  // 7월 1일
  const endDate = new Date(2025, 11, 31);  // 12월 31일

  // 카테고리 ID 맵
  const catMap = {};
  [...EXPENSE_CATEGORIES, ...INCOME_CATEGORIES].forEach(c => {
    catMap[c.name] = c;
  });

  // 날짜별 순회
  let currentDate = new Date(startDate);

  while (currentDate <= endDate) {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const day = currentDate.getDate();
    const dayOfWeek = currentDate.getDay(); // 0=일, 6=토
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

    // ========== 수입 ==========

    // 월급 (매월 25일)
    if (day === 25) {
      const salaryInfo = INCOME_DESCRIPTIONS['급여'][0];
      transactions.push({
        id: generateId(),
        type: 'income',
        amount: salaryInfo.min,
        categoryId: catMap['급여'].id,
        categoryName: '급여',
        paymentMethodId: PAYMENT_METHODS.find(p => p.name === '계좌이체').id,
        paymentMethodName: '계좌이체',
        description: salaryInfo.desc,
        memo: `${month + 1}월 급여`,
        date: formatDate(currentDate),
        time: '09:00',
      });
    }

    // 추가 수입 (가끔)
    if (day === 15 && Math.random() < 0.3) {
      const incomeType = Math.random() < 0.5 ? '용돈' : '기타수입';
      const incomeItems = INCOME_DESCRIPTIONS[incomeType];
      const weights = incomeItems.map(i => i.weight);
      const selected = weightedRandomItem(incomeItems, weights);

      transactions.push({
        id: generateId(),
        type: 'income',
        amount: randomInt(selected.min, selected.max),
        categoryId: catMap[incomeType].id,
        categoryName: incomeType,
        paymentMethodId: PAYMENT_METHODS.find(p => p.name === '계좌이체').id,
        paymentMethodName: '계좌이체',
        description: selected.desc,
        memo: '',
        date: formatDate(currentDate),
        time: formatTime(randomInt(10, 18), randomInt(0, 59)),
      });
    }

    // ========== 고정 지출 (주거/통신) ==========
    const housingItems = EXPENSE_DESCRIPTIONS['주거/통신'].items;
    housingItems.forEach(item => {
      if (item.isFixed && day === item.day) {
        const amount = item.min === item.max ? item.min : randomInt(item.min, item.max);
        transactions.push({
          id: generateId(),
          type: 'expense',
          amount: amount,
          categoryId: catMap['주거/통신'].id,
          categoryName: '주거/통신',
          paymentMethodId: PAYMENT_METHODS.find(p => p.name === '계좌이체').id,
          paymentMethodName: '계좌이체',
          description: item.desc,
          memo: '자동이체',
          date: formatDate(currentDate),
          time: '08:00',
        });
      }
    });

    // ========== 구독 서비스 (문화/여가) ==========
    const cultureItems = EXPENSE_DESCRIPTIONS['문화/여가'].items;
    cultureItems.forEach(item => {
      if (item.isSubscription && day === item.day) {
        transactions.push({
          id: generateId(),
          type: 'expense',
          amount: item.min,
          categoryId: catMap['문화/여가'].id,
          categoryName: '문화/여가',
          paymentMethodId: PAYMENT_METHODS.find(p => p.name === '신한카드').id,
          paymentMethodName: '신한카드',
          description: item.desc,
          memo: '월정액',
          date: formatDate(currentDate),
          time: '00:00',
        });
      }
    });

    // ========== 일상 지출 ==========

    // 식비: 평일 2-4회, 주말 1-3회
    const foodCount = isWeekend ? randomInt(1, 3) : randomInt(2, 4);
    const foodItems = EXPENSE_DESCRIPTIONS['식비'].items;
    const foodWeights = foodItems.map(i => i.weight);

    for (let i = 0; i < foodCount; i++) {
      const selected = weightedRandomItem(foodItems, foodWeights);
      const payMethod = selectPaymentMethod('식비');

      transactions.push({
        id: generateId(),
        type: 'expense',
        amount: randomInt(selected.min, selected.max),
        categoryId: catMap['식비'].id,
        categoryName: '식비',
        paymentMethodId: payMethod.id,
        paymentMethodName: payMethod.name,
        description: selected.desc,
        memo: '',
        date: formatDate(currentDate),
        time: formatTime(randomInt(7, 22), randomInt(0, 59)),
      });
    }

    // 교통: 평일 70% 확률
    if (!isWeekend && Math.random() < 0.7) {
      const transItems = EXPENSE_DESCRIPTIONS['교통'].items;
      const transWeights = transItems.map(i => i.weight);
      const selected = weightedRandomItem(transItems, transWeights);
      const payMethod = selectPaymentMethod('교통');

      transactions.push({
        id: generateId(),
        type: 'expense',
        amount: randomInt(selected.min, selected.max),
        categoryId: catMap['교통'].id,
        categoryName: '교통',
        paymentMethodId: payMethod.id,
        paymentMethodName: payMethod.name,
        description: selected.desc,
        memo: '',
        date: formatDate(currentDate),
        time: formatTime(randomInt(7, 22), randomInt(0, 59)),
      });
    }

    // 쇼핑: 주말 40%, 평일 15%
    if ((isWeekend && Math.random() < 0.4) || (!isWeekend && Math.random() < 0.15)) {
      const shopItems = EXPENSE_DESCRIPTIONS['쇼핑'].items;
      const shopWeights = shopItems.map(i => i.weight);
      const selected = weightedRandomItem(shopItems, shopWeights);
      const payMethod = selectPaymentMethod('쇼핑');

      transactions.push({
        id: generateId(),
        type: 'expense',
        amount: randomInt(selected.min, selected.max),
        categoryId: catMap['쇼핑'].id,
        categoryName: '쇼핑',
        paymentMethodId: payMethod.id,
        paymentMethodName: payMethod.name,
        description: selected.desc,
        memo: '',
        date: formatDate(currentDate),
        time: formatTime(randomInt(10, 21), randomInt(0, 59)),
      });
    }

    // 문화/여가: 주말 50%, 평일 10%
    if ((isWeekend && Math.random() < 0.5) || (!isWeekend && Math.random() < 0.1)) {
      const cultureRegular = cultureItems.filter(i => !i.isSubscription && i.weight > 0);
      const cultureWeights = cultureRegular.map(i => i.weight);
      const selected = weightedRandomItem(cultureRegular, cultureWeights);
      const payMethod = selectPaymentMethod('문화/여가');

      transactions.push({
        id: generateId(),
        type: 'expense',
        amount: randomInt(selected.min, selected.max),
        categoryId: catMap['문화/여가'].id,
        categoryName: '문화/여가',
        paymentMethodId: payMethod.id,
        paymentMethodName: payMethod.name,
        description: selected.desc,
        memo: '',
        date: formatDate(currentDate),
        time: formatTime(randomInt(10, 21), randomInt(0, 59)),
      });
    }

    // 의료/건강: 8% 확률
    if (Math.random() < 0.08) {
      const healthItems = EXPENSE_DESCRIPTIONS['의료/건강'].items;
      const healthWeights = healthItems.map(i => i.weight);
      const selected = weightedRandomItem(healthItems, healthWeights);
      const payMethod = selectPaymentMethod('의료/건강');

      transactions.push({
        id: generateId(),
        type: 'expense',
        amount: randomInt(selected.min, selected.max),
        categoryId: catMap['의료/건강'].id,
        categoryName: '의료/건강',
        paymentMethodId: payMethod.id,
        paymentMethodName: payMethod.name,
        description: selected.desc,
        memo: '',
        date: formatDate(currentDate),
        time: formatTime(randomInt(10, 18), randomInt(0, 59)),
      });
    }

    // 기타: 10% 확률
    if (Math.random() < 0.1) {
      const etcItems = EXPENSE_DESCRIPTIONS['기타'].items;
      const etcWeights = etcItems.map(i => i.weight);
      const selected = weightedRandomItem(etcItems, etcWeights);
      const payMethod = selectPaymentMethod('기타');

      transactions.push({
        id: generateId(),
        type: 'expense',
        amount: randomInt(selected.min, selected.max),
        categoryId: catMap['기타'].id,
        categoryName: '기타',
        paymentMethodId: payMethod.id,
        paymentMethodName: payMethod.name,
        description: selected.desc,
        memo: '',
        date: formatDate(currentDate),
        time: formatTime(randomInt(10, 20), randomInt(0, 59)),
      });
    }

    // 다음 날로 이동
    currentDate.setDate(currentDate.getDate() + 1);
  }

  // 날짜+시간 순 정렬
  transactions.sort((a, b) => {
    const dateCompare = a.date.localeCompare(b.date);
    if (dateCompare !== 0) return dateCompare;
    return a.time.localeCompare(b.time);
  });

  const headers = ['id', 'type', 'amount', 'categoryId', 'categoryName', 'paymentMethodId', 'paymentMethodName', 'description', 'memo', 'date', 'time'];

  const rows = transactions.map(t => [
    t.id,
    t.type,
    t.amount,
    t.categoryId,
    t.categoryName,
    t.paymentMethodId,
    t.paymentMethodName,
    escapeCSV(t.description),
    escapeCSV(t.memo),
    t.date,
    t.time
  ]);

  const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  return { csv: '\uFEFF' + csv, count: transactions.length, transactions };
}

// 앱에서 가져올 수 있는 간단한 형식의 CSV (날짜, 유형, 카테고리, 금액, 설명)
function generateSimpleTransactionsCSV(transactions) {
  // 앱의 가져오기 형식에 맞춤
  const headers = ['날짜', '시간', '유형', '카테고리', '결제수단', '금액', '메모'];

  const rows = transactions.map(t => [
    t.date,
    t.time,
    t.type === 'income' ? '수입' : '지출',
    t.categoryName,
    t.paymentMethodName,
    t.amount,
    escapeCSV(t.description)
  ]);

  const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  return '\uFEFF' + csv;
}

// 통계 계산
function calculateStats(transactions) {
  const income = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
  const expense = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);

  const categoryStats = {};
  transactions.filter(t => t.type === 'expense').forEach(t => {
    if (!categoryStats[t.categoryName]) {
      categoryStats[t.categoryName] = { count: 0, total: 0 };
    }
    categoryStats[t.categoryName].count++;
    categoryStats[t.categoryName].total += t.amount;
  });

  return { income, expense, categoryStats };
}

// =========================================
// 실행
// =========================================

console.log('='.repeat(60));
console.log('PinPig 모의 데이터 생성');
console.log('='.repeat(60));
console.log('\n📋 페르소나: 서울 거주 30대 여성 직장인');
console.log('   - 이름: 김지연 (가상)');
console.log('   - 나이: 32세');
console.log('   - 직업: IT 기업 마케팅 매니저');
console.log('   - 월급: 세후 350만원 (매월 25일)');
console.log('   - 거주: 서울 마포구 원룸 (월세 65만원)');
console.log('   - 특징: 카페/디저트 좋아함, 자기계발 관심\n');
console.log('📅 기간: 2025년 7월 ~ 2025년 12월 (6개월)\n');

// 카테고리 CSV
const categoriesCSV = generateCategoriesCSV();
fs.writeFileSync(path.join(dataDir, 'seed-categories.csv'), categoriesCSV, 'utf8');
console.log('✓ seed-categories.csv 생성 완료');

// 결제수단 CSV
const paymentMethodsCSV = generatePaymentMethodsCSV();
fs.writeFileSync(path.join(dataDir, 'seed-payment-methods.csv'), paymentMethodsCSV, 'utf8');
console.log('✓ seed-payment-methods.csv 생성 완료');

// 상세 거래 CSV (ID 포함)
const { csv: transactionsCSV, count: txCount, transactions } = generateTransactionsCSV();
fs.writeFileSync(path.join(dataDir, 'seed-transactions.csv'), transactionsCSV, 'utf8');
console.log(`✓ seed-transactions.csv 생성 완료 (${txCount}건)`);

// 간단한 거래 CSV (앱 가져오기용)
const simpleCSV = generateSimpleTransactionsCSV(transactions);
fs.writeFileSync(path.join(dataDir, 'seed-transactions-import.csv'), simpleCSV, 'utf8');
console.log(`✓ seed-transactions-import.csv 생성 완료 (앱 가져오기용)`);

// 통계 출력
const stats = calculateStats(transactions);
console.log('\n' + '='.repeat(60));
console.log('📊 생성 통계');
console.log('='.repeat(60));
console.log(`총 거래 수: ${txCount.toLocaleString()}건`);
console.log(`총 수입: ${stats.income.toLocaleString()}원`);
console.log(`총 지출: ${stats.expense.toLocaleString()}원`);
console.log(`순 잔액: ${(stats.income - stats.expense).toLocaleString()}원`);
console.log(`월평균 지출: ${Math.round(stats.expense / 6).toLocaleString()}원`);

console.log('\n📂 카테고리별 지출:');
Object.entries(stats.categoryStats)
  .sort((a, b) => b[1].total - a[1].total)
  .forEach(([cat, data]) => {
    const percent = ((data.total / stats.expense) * 100).toFixed(1);
    console.log(`   ${cat}: ${data.total.toLocaleString()}원 (${percent}%, ${data.count}건)`);
  });

console.log(`
📁 생성된 파일 (data 폴더):
   - seed-categories.csv        (카테고리 정의)
   - seed-payment-methods.csv   (결제수단 정의)
   - seed-transactions.csv      (상세 거래 데이터, ID 포함)
   - seed-transactions-import.csv (앱 가져오기용 간단 형식)

💡 사용법:
   앱에서 설정 > 가져오기로 seed-transactions-import.csv 파일을 가져올 수 있습니다.
`);
