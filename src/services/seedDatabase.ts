/**
 * Test Database Seeder
 * 테스트용 시드 데이터 생성
 */

import { db, generateId, initializeDatabase } from './database';
import type {
  Transaction,
  RecurringTransaction,
  AnnualExpensePattern,
} from '@/types';

// 날짜 헬퍼 함수
function daysAgo(days: number): Date {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date;
}

function setTime(date: Date, hours: number, minutes: number): Date {
  const newDate = new Date(date);
  newDate.setHours(hours, minutes, 0, 0);
  return newDate;
}

function formatTime(hours: number, minutes: number): string {
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
}

// 랜덤 선택 헬퍼
function randomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// 거래 설명 템플릿
const EXPENSE_DESCRIPTIONS = {
  식비: [
    '스타벅스', '맥도날드', '편의점', '배달의민족', '쿠팡이츠',
    '김밥천국', '한솥', '롯데리아', '버거킹', '써브웨이',
    '파리바게뜨', '던킨도너츠', '이삭토스트', '마켓컬리', '오아시스마켓'
  ],
  교통: [
    '카카오택시', '지하철', '버스', 'T머니충전', '주유소',
    '고속버스터미널', 'KTX', '따릉이', '쏘카', '타다'
  ],
  쇼핑: [
    '쿠팡', '네이버쇼핑', '무신사', '올리브영', '다이소',
    'GS25', '이마트', '롯데마트', 'SSG닷컴', '11번가',
    '자라', '유니클로', 'H&M', 'ABC마트', '오늘의집'
  ],
  '문화/여가': [
    'CGV', '넷플릭스', '멜론', '스포티파이', '왓챠',
    'PC방', '노래방', '볼링장', '찜질방', '헬스장',
    'YES24', '교보문고', '애플뮤직', '유튜브프리미엄', '트위치'
  ],
  '의료/건강': [
    '약국', '병원', '치과', '안과', '피부과',
    '한의원', '물리치료', '정형외과', '이비인후과', '건강검진센터'
  ],
  '주거/통신': [
    'KT', 'SKT', 'LG U+', '한전', '서울가스',
    '관리비', '수도요금', '인터넷', '넷플릭스', '월세'
  ],
  기타: [
    'ATM출금', '이체수수료', '선물', '경조사', '기부',
    '보험료', '구독서비스', '앱결제', '인앱구매', '기타'
  ],
};

const INCOME_DESCRIPTIONS = {
  급여: ['월급', '상여금', '성과급', '연차수당', '야근수당'],
  용돈: ['부모님용돈', '생일선물', '명절용돈', '경조사', '축의금'],
  기타수입: ['이자', '환급금', '중고거래', '배당금', '프리랜서'],
};

interface SeedOptions {
  monthsOfData?: number;      // 몇 개월치 데이터 생성 (기본: 6)
  transactionsPerMonth?: number;  // 월별 거래 수 (기본: 30-50)
  includeBudgets?: boolean;   // 카테고리 예산 설정 여부
  includeRecurring?: boolean; // 반복 거래 생성 여부
  includeAnnual?: boolean;    // 연간 지출 패턴 생성 여부
}

/**
 * 테스트용 시드 데이터 생성
 */
export async function seedDatabase(options: SeedOptions = {}): Promise<void> {
  const {
    monthsOfData = 6,
    transactionsPerMonth = 40,
    includeBudgets = true,
    includeRecurring = true,
    includeAnnual = true,
  } = options;

  console.log('🌱 Starting database seed...');

  // 1. 기존 데이터 초기화
  await db.transactions.clear();
  await db.recurringTransactions.clear();
  await db.annualExpenses.clear();
  await db.categories.clear();
  await db.paymentMethods.clear();
  await db.settings.clear();

  // 2. 기본 데이터 초기화 (카테고리, 결제수단, 설정)
  await initializeDatabase();

  // 3. 설정 업데이트 (온보딩 완료, 예산 설정)
  await db.settings.update('default', {
    monthlyBudget: 2500000,
    isOnboardingComplete: true,
    updatedAt: new Date(),
  });

  // 4. 카테고리 예산 설정
  if (includeBudgets) {
    const categories = await db.categories.toArray();
    const budgetMap: Record<string, number> = {
      '식비': 600000,
      '교통': 200000,
      '쇼핑': 400000,
      '문화/여가': 200000,
      '의료/건강': 100000,
      '주거/통신': 500000,
      '기타': 200000,
    };

    for (const cat of categories) {
      if (budgetMap[cat.name]) {
        await db.categories.update(cat.id, { budget: budgetMap[cat.name] });
      }
    }
    console.log('✅ Category budgets set');
  }

  // 5. 결제수단 예산 설정
  const paymentMethods = await db.paymentMethods.toArray();
  const cardMethod = paymentMethods.find(p => p.name === '카드');
  if (cardMethod) {
    await db.paymentMethods.update(cardMethod.id, { budget: 1500000 });
  }
  console.log('✅ Payment method budgets set');

  // 6. 거래 데이터 생성
  const categories = await db.categories.toArray();
  const expenseCategories = categories.filter(c => c.type === 'expense');
  const incomeCategories = categories.filter(c => c.type === 'income');
  const methods = await db.paymentMethods.toArray();

  const transactions: Transaction[] = [];
  const now = new Date();

  for (let monthOffset = 0; monthOffset < monthsOfData; monthOffset++) {
    const targetDate = new Date(now.getFullYear(), now.getMonth() - monthOffset, 1);
    const daysInMonth = new Date(targetDate.getFullYear(), targetDate.getMonth() + 1, 0).getDate();

    // 월급 추가 (매월 25일)
    const salaryCategory = incomeCategories.find(c => c.name === '급여');
    if (salaryCategory) {
      const salaryDate = new Date(targetDate.getFullYear(), targetDate.getMonth(), 25);
      if (salaryDate <= now) {
        transactions.push({
          id: generateId(),
          type: 'income',
          amount: randomInt(2800000, 3200000),
          categoryId: salaryCategory.id,
          memo: '월급',
          date: salaryDate,
          time: '09:00',
          createdAt: salaryDate,
          updatedAt: salaryDate,
        });
      }
    }

    // 일반 지출 거래 생성
    const txCount = randomInt(transactionsPerMonth - 10, transactionsPerMonth + 10);
    for (let i = 0; i < txCount; i++) {
      const day = randomInt(1, Math.min(daysInMonth, now.getDate() + (monthOffset === 0 ? 0 : 31)));
      const txDate = new Date(targetDate.getFullYear(), targetDate.getMonth(), day);

      if (txDate > now) continue;

      const category = randomItem(expenseCategories);
      const descriptions = EXPENSE_DESCRIPTIONS[category.name as keyof typeof EXPENSE_DESCRIPTIONS] || EXPENSE_DESCRIPTIONS['기타'];

      // 카테고리별 금액 범위 설정
      const amountRanges: Record<string, [number, number]> = {
        '식비': [3000, 50000],
        '교통': [1250, 30000],
        '쇼핑': [5000, 200000],
        '문화/여가': [5000, 50000],
        '의료/건강': [5000, 100000],
        '주거/통신': [10000, 150000],
        '기타': [1000, 50000],
      };
      const range = amountRanges[category.name] || [1000, 50000];

      // 금액을 100원 단위로 반올림
      const amount = Math.round(randomInt(range[0], range[1]) / 100) * 100;

      const hours = randomInt(7, 23);
      const minutes = randomInt(0, 59);

      transactions.push({
        id: generateId(),
        type: 'expense',
        amount,
        categoryId: category.id,
        paymentMethodId: randomItem(methods).id,
        memo: randomItem(descriptions),
        date: txDate,
        time: formatTime(hours, minutes),
        createdAt: setTime(txDate, hours, minutes),
        updatedAt: setTime(txDate, hours, minutes),
      });
    }

    // 가끔 추가 수입 (용돈, 기타수입)
    if (Math.random() > 0.6) {
      const otherIncomeCategory = randomItem(incomeCategories.filter(c => c.name !== '급여'));
      const memoDescriptions = INCOME_DESCRIPTIONS[otherIncomeCategory.name as keyof typeof INCOME_DESCRIPTIONS] || ['기타수입'];
      const incomeDate = new Date(targetDate.getFullYear(), targetDate.getMonth(), randomInt(1, daysInMonth));

      if (incomeDate <= now) {
        transactions.push({
          id: generateId(),
          type: 'income',
          amount: randomInt(50000, 500000),
          categoryId: otherIncomeCategory.id,
          memo: randomItem(memoDescriptions),
          date: incomeDate,
          time: formatTime(randomInt(10, 18), randomInt(0, 59)),
          createdAt: incomeDate,
          updatedAt: incomeDate,
        });
      }
    }
  }

  await db.transactions.bulkAdd(transactions);
  console.log(`✅ Created ${transactions.length} transactions`);

  // 7. 반복 거래 생성
  if (includeRecurring) {
    const recurringTransactions: RecurringTransaction[] = [];
    const housingCategory = expenseCategories.find(c => c.name === '주거/통신');
    const entertainmentCategory = expenseCategories.find(c => c.name === '문화/여가');
    const salaryCategory = incomeCategories.find(c => c.name === '급여');

    if (housingCategory) {
      // 월세
      recurringTransactions.push({
        id: generateId(),
        type: 'expense',
        amount: 500000,
        categoryId: housingCategory.id,
        paymentMethodId: methods.find(m => m.name === '계좌이체')?.id,
        memo: '월세',
        frequency: 'monthly',
        dayOfMonth: 1,
        startDate: daysAgo(180),
        isActive: true,
        nextExecutionDate: new Date(now.getFullYear(), now.getMonth() + 1, 1),
        createdAt: daysAgo(180),
        updatedAt: new Date(),
      });

      // 통신비
      recurringTransactions.push({
        id: generateId(),
        type: 'expense',
        amount: 65000,
        categoryId: housingCategory.id,
        paymentMethodId: cardMethod?.id,
        memo: 'KT 통신비',
        frequency: 'monthly',
        dayOfMonth: 15,
        startDate: daysAgo(365),
        isActive: true,
        nextExecutionDate: new Date(now.getFullYear(), now.getMonth(), 15),
        createdAt: daysAgo(365),
        updatedAt: new Date(),
      });
    }

    if (entertainmentCategory) {
      // 넷플릭스
      recurringTransactions.push({
        id: generateId(),
        type: 'expense',
        amount: 17000,
        categoryId: entertainmentCategory.id,
        paymentMethodId: cardMethod?.id,
        memo: '넷플릭스',
        frequency: 'monthly',
        dayOfMonth: 10,
        startDate: daysAgo(365),
        isActive: true,
        nextExecutionDate: new Date(now.getFullYear(), now.getMonth(), 10),
        createdAt: daysAgo(365),
        updatedAt: new Date(),
      });

      // 유튜브 프리미엄
      recurringTransactions.push({
        id: generateId(),
        type: 'expense',
        amount: 14900,
        categoryId: entertainmentCategory.id,
        paymentMethodId: cardMethod?.id,
        memo: '유튜브 프리미엄',
        frequency: 'monthly',
        dayOfMonth: 5,
        startDate: daysAgo(200),
        isActive: true,
        nextExecutionDate: new Date(now.getFullYear(), now.getMonth(), 5),
        createdAt: daysAgo(200),
        updatedAt: new Date(),
      });
    }

    // 급여 (수입)
    if (salaryCategory) {
      recurringTransactions.push({
        id: generateId(),
        type: 'income',
        amount: 3000000,
        categoryId: salaryCategory.id,
        memo: '월급',
        frequency: 'monthly',
        dayOfMonth: 25,
        startDate: daysAgo(365),
        isActive: true,
        nextExecutionDate: new Date(now.getFullYear(), now.getMonth(), 25),
        createdAt: daysAgo(365),
        updatedAt: new Date(),
      });
    }

    await db.recurringTransactions.bulkAdd(recurringTransactions);
    console.log(`✅ Created ${recurringTransactions.length} recurring transactions`);
  }

  // 8. 연간 지출 패턴 생성
  if (includeAnnual) {
    const annualExpenses: AnnualExpensePattern[] = [];
    const transportCategory = expenseCategories.find(c => c.name === '교통');
    const housingCategory = expenseCategories.find(c => c.name === '주거/통신');
    const otherCategory = expenseCategories.find(c => c.name === '기타');

    if (transportCategory) {
      annualExpenses.push({
        id: generateId(),
        categoryId: transportCategory.id,
        categoryName: transportCategory.name,
        categoryIcon: transportCategory.icon,
        categoryColor: transportCategory.color,
        description: '자동차보험',
        month: 3,
        day: 15,
        amount: 800000,
        year: now.getFullYear() - 1,
        isEnabled: true,
        notifyDaysBefore: 14,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }

    if (housingCategory) {
      // 재산세 (7월, 9월)
      annualExpenses.push({
        id: generateId(),
        categoryId: housingCategory.id,
        categoryName: housingCategory.name,
        categoryIcon: housingCategory.icon,
        categoryColor: housingCategory.color,
        description: '재산세 1차',
        month: 7,
        day: 31,
        amount: 250000,
        year: now.getFullYear() - 1,
        isEnabled: true,
        notifyDaysBefore: 14,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      annualExpenses.push({
        id: generateId(),
        categoryId: housingCategory.id,
        categoryName: housingCategory.name,
        categoryIcon: housingCategory.icon,
        categoryColor: housingCategory.color,
        description: '재산세 2차',
        month: 9,
        day: 30,
        amount: 250000,
        year: now.getFullYear() - 1,
        isEnabled: true,
        notifyDaysBefore: 14,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }

    if (otherCategory) {
      annualExpenses.push({
        id: generateId(),
        categoryId: otherCategory.id,
        categoryName: otherCategory.name,
        categoryIcon: otherCategory.icon,
        categoryColor: otherCategory.color,
        description: '종합소득세',
        month: 5,
        day: 31,
        amount: 500000,
        year: now.getFullYear() - 1,
        isEnabled: true,
        notifyDaysBefore: 30,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }

    await db.annualExpenses.bulkAdd(annualExpenses);
    console.log(`✅ Created ${annualExpenses.length} annual expense patterns`);
  }

  console.log('🎉 Database seeding completed!');
  console.log(`
📊 Summary:
   - ${transactions.length} transactions (${monthsOfData} months)
   - ${includeBudgets ? '✓' : '✗'} Category budgets
   - ${includeRecurring ? '✓' : '✗'} Recurring transactions
   - ${includeAnnual ? '✓' : '✗'} Annual expense patterns
   - Monthly budget: 2,500,000원
  `);
}

/**
 * 빈 데이터베이스로 초기화 (온보딩 테스트용)
 */
export async function seedEmptyDatabase(): Promise<void> {
  console.log('🌱 Creating empty database for onboarding test...');

  await db.transactions.clear();
  await db.recurringTransactions.clear();
  await db.annualExpenses.clear();
  await db.categories.clear();
  await db.paymentMethods.clear();
  await db.settings.clear();

  await initializeDatabase();

  console.log('✅ Empty database ready for onboarding test');
}

/**
 * 오늘 날짜 기준 최근 거래만 생성 (홈 화면 테스트용)
 */
export async function seedRecentTransactions(): Promise<void> {
  console.log('🌱 Creating recent transactions...');

  const categories = await db.categories.toArray();
  const expenseCategories = categories.filter(c => c.type === 'expense');
  const methods = await db.paymentMethods.toArray();

  const transactions: Transaction[] = [];
  const now = new Date();

  // 오늘 거래 3-5건
  const todayCount = randomInt(3, 5);
  for (let i = 0; i < todayCount; i++) {
    const category = randomItem(expenseCategories);
    const descriptions = EXPENSE_DESCRIPTIONS[category.name as keyof typeof EXPENSE_DESCRIPTIONS] || ['기타'];
    const hours = randomInt(8, now.getHours());

    transactions.push({
      id: generateId(),
      type: 'expense',
      amount: Math.round(randomInt(3000, 50000) / 100) * 100,
      categoryId: category.id,
      paymentMethodId: randomItem(methods).id,
      memo: randomItem(descriptions),
      date: now,
      time: formatTime(hours, randomInt(0, 59)),
      createdAt: setTime(now, hours, randomInt(0, 59)),
      updatedAt: new Date(),
    });
  }

  // 어제 거래 2-4건
  const yesterday = daysAgo(1);
  const yesterdayCount = randomInt(2, 4);
  for (let i = 0; i < yesterdayCount; i++) {
    const category = randomItem(expenseCategories);
    const descriptions = EXPENSE_DESCRIPTIONS[category.name as keyof typeof EXPENSE_DESCRIPTIONS] || ['기타'];

    transactions.push({
      id: generateId(),
      type: 'expense',
      amount: Math.round(randomInt(3000, 50000) / 100) * 100,
      categoryId: category.id,
      paymentMethodId: randomItem(methods).id,
      memo: randomItem(descriptions),
      date: yesterday,
      time: formatTime(randomInt(8, 22), randomInt(0, 59)),
      createdAt: yesterday,
      updatedAt: yesterday,
    });
  }

  await db.transactions.bulkAdd(transactions);
  console.log(`✅ Created ${transactions.length} recent transactions`);
}

// Browser console에서 사용할 수 있도록 window에 노출 (main.tsx에서 처리)
