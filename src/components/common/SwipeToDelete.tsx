import { useState, useRef, useCallback, type ReactNode } from 'react';
import { Trash2 } from 'lucide-react';

interface SwipeToDeleteProps {
  children: ReactNode;
  onDelete: () => void | Promise<void>;
  confirmMessage?: string;
  disabled?: boolean;
}

const SWIPE_THRESHOLD = 80; // px to trigger delete action
const DELETE_ZONE_WIDTH = 80; // px width of delete button

export function SwipeToDelete({
  children,
  onDelete,
  confirmMessage = '삭제하시겠습니까?',
  disabled = false,
}: SwipeToDeleteProps) {
  const [translateX, setTranslateX] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const startXRef = useRef(0);
  const currentXRef = useRef(0);
  const isDraggingRef = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (disabled) return;
    startXRef.current = e.touches[0].clientX;
    currentXRef.current = e.touches[0].clientX;
    isDraggingRef.current = true;
  }, [disabled]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isDraggingRef.current || disabled) return;

    currentXRef.current = e.touches[0].clientX;
    const diff = currentXRef.current - startXRef.current;

    // Only allow left swipe (negative diff)
    if (diff < 0) {
      // Limit the swipe distance
      const newTranslate = Math.max(diff, -DELETE_ZONE_WIDTH - 20);
      setTranslateX(newTranslate);
    } else if (translateX < 0) {
      // Allow swiping back to close
      const newTranslate = Math.min(0, translateX + diff);
      setTranslateX(newTranslate);
      startXRef.current = currentXRef.current;
    }
  }, [disabled, translateX]);

  const handleTouchEnd = useCallback(() => {
    if (!isDraggingRef.current || disabled) return;
    isDraggingRef.current = false;

    // Snap to delete zone or back to original position
    if (translateX < -SWIPE_THRESHOLD) {
      setTranslateX(-DELETE_ZONE_WIDTH);
    } else {
      setTranslateX(0);
    }
  }, [disabled, translateX]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (disabled) return;
    startXRef.current = e.clientX;
    currentXRef.current = e.clientX;
    isDraggingRef.current = true;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (!isDraggingRef.current) return;

      currentXRef.current = moveEvent.clientX;
      const diff = currentXRef.current - startXRef.current;

      if (diff < 0) {
        const newTranslate = Math.max(diff, -DELETE_ZONE_WIDTH - 20);
        setTranslateX(newTranslate);
      }
    };

    const handleMouseUp = () => {
      isDraggingRef.current = false;

      if (translateX < -SWIPE_THRESHOLD) {
        setTranslateX(-DELETE_ZONE_WIDTH);
      } else {
        setTranslateX(0);
      }

      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [disabled, translateX]);

  const handleDelete = useCallback(async () => {
    if (isDeleting) return;

    if (window.confirm(confirmMessage)) {
      setIsDeleting(true);
      try {
        await onDelete();
      } finally {
        setIsDeleting(false);
        setTranslateX(0);
      }
    } else {
      setTranslateX(0);
    }
  }, [confirmMessage, isDeleting, onDelete]);

  const closeSwipe = useCallback(() => {
    setTranslateX(0);
  }, []);

  // Close swipe when clicking outside
  const handleContainerClick = useCallback((e: React.MouseEvent) => {
    if (translateX < 0 && e.target === containerRef.current) {
      closeSwipe();
    }
  }, [translateX, closeSwipe]);

  return (
    <div
      ref={containerRef}
      className="relative overflow-hidden"
      onClick={handleContainerClick}
    >
      {/* Delete button background */}
      <div
        className="absolute inset-y-0 right-0 flex items-center justify-center bg-red-500 transition-opacity"
        style={{
          width: DELETE_ZONE_WIDTH,
          opacity: translateX < 0 ? 1 : 0,
        }}
      >
        <button
          onClick={handleDelete}
          disabled={isDeleting}
          className="w-full h-full flex items-center justify-center text-white"
        >
          <Trash2 size={24} className={isDeleting ? 'animate-pulse' : ''} />
        </button>
      </div>

      {/* Main content */}
      <div
        className="relative bg-paper-white dark:bg-ink-black transition-transform duration-150 ease-out"
        style={{
          transform: `translateX(${translateX}px)`,
          transition: isDraggingRef.current ? 'none' : 'transform 0.15s ease-out',
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
      >
        {children}
      </div>
    </div>
  );
}
