import { db, generateId } from './database';
import type { Transaction, Category } from '@/types';

interface ImportedTransaction {
  date: string; // ISO string
  time: string;
  type: 'income' | 'expense';
  categoryName: string;
  description: string;
  amount: number;
  memo: string | null;
}

/**
 * JSON 파일에서 거래 데이터 가져오기
 */
export async function importTransactionsFromJSON(url: string): Promise<number> {
  // 카테고리 맵 가져오기
  const categories = await db.categories.toArray();
  const categoryMap = new Map<string, Category>();

  for (const cat of categories) {
    categoryMap.set(`${cat.type}-${cat.name}`, cat);
  }

  // JSON 데이터 가져오기
  const response = await fetch(url);
  const data: ImportedTransaction[] = await response.json();

  // 기존 거래 삭제 (선택적)
  // await db.transactions.clear();

  // 배치로 처리
  const batchSize = 500;
  let imported = 0;

  for (let i = 0; i < data.length; i += batchSize) {
    const batch = data.slice(i, i + batchSize);
    const transactions: Transaction[] = [];

    for (const item of batch) {
      // 카테고리 찾기
      const categoryKey = `${item.type}-${item.categoryName}`;
      let category = categoryMap.get(categoryKey);

      // 카테고리가 없으면 기본값 사용
      if (!category) {
        const defaultKey = item.type === 'income' ? 'income-기타수입' : 'expense-기타';
        category = categoryMap.get(defaultKey);
      }

      if (!category) {
        console.warn('카테고리를 찾을 수 없음:', item.categoryName);
        continue;
      }

      const now = new Date();
      const txDate = new Date(item.date);

      transactions.push({
        id: generateId(),
        type: item.type,
        amount: item.amount,
        categoryId: category.id,
        description: item.description,
        memo: item.memo || undefined,
        date: txDate,
        time: item.time,
        createdAt: now,
        updatedAt: now,
      });
    }

    if (transactions.length > 0) {
      await db.transactions.bulkAdd(transactions);
      imported += transactions.length;
    }

    console.log(`가져오기 진행: ${imported}/${data.length}`);
  }

  return imported;
}

/**
 * 모든 거래 삭제
 */
export async function clearAllTransactions(): Promise<void> {
  await db.transactions.clear();
}

/**
 * 데이터 가져오기 상태 확인
 */
export async function getImportStatus(): Promise<{
  totalTransactions: number;
  oldestDate: Date | null;
  newestDate: Date | null;
}> {
  const count = await db.transactions.count();

  if (count === 0) {
    return { totalTransactions: 0, oldestDate: null, newestDate: null };
  }

  const oldest = await db.transactions.orderBy('date').first();
  const newest = await db.transactions.orderBy('date').last();

  return {
    totalTransactions: count,
    oldestDate: oldest?.date || null,
    newestDate: newest?.date || null,
  };
}
