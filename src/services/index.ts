// Database
export {
  db,
  generateId,
  initializeDatabase,
  resetDatabase,
  getCategories,
  getPaymentMethods,
  getSettings,
  updateSettings,
} from './database';

// Queries - Basic
export {
  getTransactionsByMonth,
  getRecentTransactions,
  getMonthlySummary,
  getCategoryBreakdown,
  getPaymentMethodBreakdown,
  getTransactionsByCategory,
  getTopTransactionsByCategory,
  searchTransactions,
  exportTransactionsToCSV,
} from './queries';

// Queries - Trends
export {
  getMonthlyTrend,
  getAnnualTrend,
  getCategoryTrend,
  getTransactionsByYear,
} from './queries';

// Queries - Budget Wizard
export {
  getBudgetRecommendation,
  applyBudgetRecommendation,
} from './queries';

// Queries - Annual Expenses
export {
  detectAnnualLargeExpenses,
  getAnnualExpensePatterns,
  saveAnnualExpensePatterns,
  updateAnnualExpensePattern,
  deleteAnnualExpensePattern,
  getUpcomingAnnualExpenses,
} from './queries';

// Queries - Monthly Review
export {
  generateMonthlyReview,
} from './queries';

// Queries - Recurring Transactions
export {
  getRecurringTransactions,
  getActiveRecurringTransactions,
  getRecurringTransactionsByType,
  createRecurringTransaction,
  updateRecurringTransaction,
  deleteRecurringTransaction,
  calculateNextExecutionDate,
  getProjectedTransactions,
  getMonthlyProjectedTransactions,
  getUpcomingRecurringTransactions,
  executeRecurringTransaction,
} from './queries';

// Queries - Budget Structure
export {
  getMonthlyBudgetStructure,
} from './queries';

// Queries - Tags
export {
  getRecentMemos,
  getRecentTags,
  getTagsByCategory,
  getTagSuggestions,
} from './queries';

// Seed Database (Development)
export {
  seedDatabase,
  seedEmptyDatabase,
  seedRecentTransactions,
} from './seedDatabase';
