import { Icon } from '@/components/common/Icon';
import type { CategorySummary } from '@/types';

interface CategoryFilterChipsProps {
  categories: CategorySummary[];
  selectedIds: string[];
  onToggle: (categoryId: string) => void;
  maxSelections?: number;
  showAll?: boolean;           // 전체 카테고리 표시 (상위 5개 제한 해제)
  showTotalOption?: boolean;   // "전체 금액" 칩 표시
  isTotalSelected?: boolean;   // "전체" 선택 상태
  onTotalToggle?: () => void;  // "전체" 토글 핸들러
}

export function CategoryFilterChips({
  categories,
  selectedIds,
  onToggle,
  maxSelections = 3,
  showAll = false,
  showTotalOption = false,
  isTotalSelected = false,
  onTotalToggle,
}: CategoryFilterChipsProps) {
  // Show all categories or top 5 based on showAll prop
  const displayCategories = showAll ? categories : categories.slice(0, 5);

  // Count selected items including "전체" option
  const totalSelectedCount = selectedIds.length + (isTotalSelected ? 1 : 0);

  const handleToggle = (categoryId: string) => {
    // Allow toggle if deselecting or haven't reached max
    if (selectedIds.includes(categoryId) || totalSelectedCount < maxSelections) {
      onToggle(categoryId);
    }
  };

  const handleTotalToggle = () => {
    if (!onTotalToggle) return;
    // Allow toggle if deselecting or haven't reached max
    if (isTotalSelected || totalSelectedCount < maxSelections) {
      onTotalToggle();
    }
  };

  const isTotalDisabled = !isTotalSelected && totalSelectedCount >= maxSelections;

  return (
    <div className="flex flex-wrap gap-2">
      {/* 전체 금액 옵션 */}
      {showTotalOption && (
        <button
          onClick={handleTotalToggle}
          disabled={isTotalDisabled}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sub transition-all ${
            isTotalSelected
              ? 'bg-ink-black text-paper-white'
              : isTotalDisabled
              ? 'bg-paper-light text-ink-light cursor-not-allowed'
              : 'bg-paper-light text-ink-dark hover:bg-paper-mid'
          }`}
        >
          <Icon
            name="TrendingUp"
            size={14}
            className={isTotalSelected ? 'text-paper-white' : 'text-ink-mid'}
          />
          <span>전체</span>
        </button>
      )}

      {/* 카테고리 칩들 */}
      {displayCategories.map((category) => {
        const isSelected = selectedIds.includes(category.categoryId);
        const isDisabled = !isSelected && totalSelectedCount >= maxSelections;

        return (
          <button
            key={category.categoryId}
            onClick={() => handleToggle(category.categoryId)}
            disabled={isDisabled}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sub transition-all ${
              isSelected
                ? 'text-paper-white'
                : isDisabled
                ? 'bg-paper-light text-ink-light cursor-not-allowed'
                : 'bg-paper-light text-ink-dark hover:bg-paper-mid'
            }`}
            style={
              isSelected
                ? { backgroundColor: category.categoryColor }
                : undefined
            }
          >
            <Icon
              name={category.categoryIcon}
              size={14}
              className={isSelected ? 'text-paper-white' : 'text-ink-mid'}
            />
            <span>{category.categoryName}</span>
          </button>
        );
      })}
    </div>
  );
}
