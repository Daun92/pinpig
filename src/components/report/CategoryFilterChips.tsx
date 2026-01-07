import { Icon } from '@/components/common/Icon';
import type { CategorySummary } from '@/types';

interface CategoryFilterChipsProps {
  categories: CategorySummary[];
  selectedIds: string[];
  onToggle: (categoryId: string) => void;
  maxSelections?: number;
}

export function CategoryFilterChips({
  categories,
  selectedIds,
  onToggle,
  maxSelections = 3,
}: CategoryFilterChipsProps) {
  // Show top 5 categories by amount
  const topCategories = categories.slice(0, 5);

  const handleToggle = (categoryId: string) => {
    // Allow toggle if deselecting or haven't reached max
    if (selectedIds.includes(categoryId) || selectedIds.length < maxSelections) {
      onToggle(categoryId);
    }
  };

  return (
    <div className="flex flex-wrap gap-2">
      {topCategories.map((category) => {
        const isSelected = selectedIds.includes(category.categoryId);
        const isDisabled = !isSelected && selectedIds.length >= maxSelections;

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
