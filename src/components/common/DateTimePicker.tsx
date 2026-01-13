import { useState, useEffect, useMemo } from 'react';
import { X } from 'lucide-react';
import { getDaysInMonth, isFuture, startOfDay } from 'date-fns';

interface DateTimePickerProps {
  isOpen: boolean;
  selectedDate: Date;
  selectedTime: string;
  onClose: () => void;
  onSelect: (date: Date, time: string) => void;
  disableFuture?: boolean;
}

type SegmentType = 'year' | 'month' | 'day' | 'time';

export function DateTimePicker({
  isOpen,
  selectedDate,
  selectedTime,
  onClose,
  onSelect,
  disableFuture = true,
}: DateTimePickerProps) {
  const [activeSegment, setActiveSegment] = useState<SegmentType | null>(null);
  const [tempYear, setTempYear] = useState(selectedDate.getFullYear());
  const [tempMonth, setTempMonth] = useState(selectedDate.getMonth() + 1);
  const [tempDay, setTempDay] = useState(selectedDate.getDate());
  const [tempHour, setTempHour] = useState(parseInt(selectedTime.split(':')[0]));
  const [tempMinute, setTempMinute] = useState(parseInt(selectedTime.split(':')[1]));

  const now = new Date();
  const currentYear = now.getFullYear();

  useEffect(() => {
    if (isOpen) {
      setTempYear(selectedDate.getFullYear());
      setTempMonth(selectedDate.getMonth() + 1);
      setTempDay(selectedDate.getDate());
      setTempHour(parseInt(selectedTime.split(':')[0]));
      setTempMinute(parseInt(selectedTime.split(':')[1]));
      setActiveSegment(null);
    }
  }, [isOpen, selectedDate, selectedTime]);

  // Validate and adjust day when year/month changes
  useEffect(() => {
    const maxDays = getDaysInMonth(new Date(tempYear, tempMonth - 1));
    if (tempDay > maxDays) {
      setTempDay(maxDays);
    }
  }, [tempYear, tempMonth, tempDay]);

  const daysInMonth = useMemo(() => {
    return getDaysInMonth(new Date(tempYear, tempMonth - 1));
  }, [tempYear, tempMonth]);

  const isDateDisabled = (year: number, month: number, day: number) => {
    if (!disableFuture) return false;
    const date = new Date(year, month - 1, day);
    return isFuture(startOfDay(date));
  };

  const isMonthDisabled = (year: number, month: number) => {
    if (!disableFuture) return false;
    return year > currentYear || (year === currentYear && month > now.getMonth() + 1);
  };

  const isYearDisabled = (year: number) => {
    if (!disableFuture) return false;
    return year > currentYear;
  };

  if (!isOpen) return null;

  const handleConfirm = () => {
    const newDate = new Date(tempYear, tempMonth - 1, tempDay);
    const newTime = `${tempHour.toString().padStart(2, '0')}:${tempMinute.toString().padStart(2, '0')}`;
    onSelect(newDate, newTime);
    onClose();
  };

  const handleSegmentClick = (segment: SegmentType) => {
    setActiveSegment(activeSegment === segment ? null : segment);
  };

  // Generate arrays for selection
  const years = Array.from({ length: 10 }, (_, i) => currentYear - 9 + i);
  const months = Array.from({ length: 12 }, (_, i) => i + 1);
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const hours = Array.from({ length: 24 }, (_, i) => i);
  const minutes = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];

  const renderSegmentSelector = () => {
    switch (activeSegment) {
      case 'year':
        return (
          <div className="grid grid-cols-5 gap-2 p-4">
            {years.map((year) => {
              const disabled = isYearDisabled(year);
              const isSelected = year === tempYear;
              return (
                <button
                  key={year}
                  onClick={() => !disabled && setTempYear(year)}
                  disabled={disabled}
                  className={`py-3 rounded-lg text-body transition-colors ${
                    isSelected
                      ? 'bg-ink-black dark:bg-pig-pink text-paper-white'
                      : disabled
                      ? 'text-paper-mid dark:text-ink-dark cursor-not-allowed'
                      : 'bg-paper-light dark:bg-ink-dark text-ink-dark dark:text-paper-mid hover:bg-paper-mid dark:hover:bg-ink-mid'
                  }`}
                >
                  {year}
                </button>
              );
            })}
          </div>
        );

      case 'month':
        return (
          <div className="grid grid-cols-4 gap-2 p-4">
            {months.map((month) => {
              const disabled = isMonthDisabled(tempYear, month);
              const isSelected = month === tempMonth;
              return (
                <button
                  key={month}
                  onClick={() => !disabled && setTempMonth(month)}
                  disabled={disabled}
                  className={`py-3 rounded-lg text-body transition-colors ${
                    isSelected
                      ? 'bg-ink-black dark:bg-pig-pink text-paper-white'
                      : disabled
                      ? 'text-paper-mid dark:text-ink-dark cursor-not-allowed'
                      : 'bg-paper-light dark:bg-ink-dark text-ink-dark dark:text-paper-mid hover:bg-paper-mid dark:hover:bg-ink-mid'
                  }`}
                >
                  {month}월
                </button>
              );
            })}
          </div>
        );

      case 'day': {
        // 해당 월 1일의 요일 (0=일, 1=월, ..., 6=토)
        const firstDayOfMonth = new Date(tempYear, tempMonth - 1, 1).getDay();
        const weekDays = ['일', '월', '화', '수', '목', '금', '토'];

        return (
          <div className="p-4">
            {/* 요일 헤더 */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {weekDays.map((dayName, idx) => (
                <div
                  key={dayName}
                  className={`py-1 text-center text-caption font-medium ${
                    idx === 0 ? 'text-red-400' : idx === 6 ? 'text-blue-400' : 'text-ink-light'
                  }`}
                >
                  {dayName}
                </div>
              ))}
            </div>
            {/* 날짜 그리드 */}
            <div className="grid grid-cols-7 gap-1">
              {/* 1일 전 빈 셀 */}
              {Array.from({ length: firstDayOfMonth }).map((_, idx) => (
                <div key={`empty-${idx}`} className="py-2" />
              ))}
              {/* 날짜들 */}
              {days.map((day) => {
                const disabled = isDateDisabled(tempYear, tempMonth, day);
                const isSelected = day === tempDay;
                const dateObj = new Date(tempYear, tempMonth - 1, day);
                const dayOfWeek = dateObj.getDay();
                const isSunday = dayOfWeek === 0;
                const isSaturday = dayOfWeek === 6;

                return (
                  <button
                    key={day}
                    onClick={() => !disabled && setTempDay(day)}
                    disabled={disabled}
                    className={`py-2 rounded-lg text-body transition-colors ${
                      isSelected
                        ? 'bg-ink-black dark:bg-pig-pink text-paper-white'
                        : disabled
                        ? 'text-paper-mid dark:text-ink-dark cursor-not-allowed'
                        : isSunday
                        ? 'text-red-400 hover:bg-paper-mid dark:hover:bg-ink-mid'
                        : isSaturday
                        ? 'text-blue-400 hover:bg-paper-mid dark:hover:bg-ink-mid'
                        : 'text-ink-dark dark:text-paper-mid hover:bg-paper-mid dark:hover:bg-ink-mid'
                    }`}
                  >
                    {day}
                  </button>
                );
              })}
            </div>
          </div>
        );
      }

      case 'time':
        return (
          <div className="p-4">
            <div className="flex gap-4">
              {/* Hours */}
              <div className="flex-1">
                <p className="text-caption text-ink-light mb-2 text-center">시</p>
                <div className="grid grid-cols-4 gap-1 max-h-48 overflow-y-auto">
                  {hours.map((hour) => {
                    const isSelected = hour === tempHour;
                    return (
                      <button
                        key={hour}
                        onClick={() => setTempHour(hour)}
                        className={`py-2 rounded-lg text-body transition-colors ${
                          isSelected
                            ? 'bg-ink-black dark:bg-pig-pink text-paper-white'
                            : 'text-ink-dark dark:text-paper-mid hover:bg-paper-mid dark:hover:bg-ink-mid'
                        }`}
                      >
                        {hour.toString().padStart(2, '0')}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Minutes */}
              <div className="flex-1">
                <p className="text-caption text-ink-light mb-2 text-center">분</p>
                <div className="grid grid-cols-3 gap-1">
                  {minutes.map((minute) => {
                    const isSelected = minute === tempMinute;
                    return (
                      <button
                        key={minute}
                        onClick={() => setTempMinute(minute)}
                        className={`py-2 rounded-lg text-body transition-colors ${
                          isSelected
                            ? 'bg-ink-black dark:bg-pig-pink text-paper-white'
                            : 'text-ink-dark dark:text-paper-mid hover:bg-paper-mid dark:hover:bg-ink-mid'
                        }`}
                      >
                        {minute.toString().padStart(2, '0')}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-paper-white dark:bg-ink-black rounded-2xl w-full max-w-lg animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-paper-mid dark:border-ink-dark">
          <button onClick={onClose} className="p-2">
            <X size={20} className="text-ink-mid" />
          </button>
          <h3 className="text-body text-ink-black dark:text-paper-white font-medium">날짜 및 시간</h3>
          <button
            onClick={handleConfirm}
            className="text-body text-ink-black dark:text-paper-white font-medium px-2"
          >
            확인
          </button>
        </div>

        {/* Segment Tabs */}
        <div className="flex gap-2 px-4 py-4">
          <button
            onClick={() => handleSegmentClick('year')}
            className={`flex-1 py-3 px-2 rounded-lg text-body font-medium transition-colors ${
              activeSegment === 'year'
                ? 'bg-ink-black dark:bg-pig-pink text-paper-white'
                : 'bg-paper-light dark:bg-ink-dark text-ink-dark dark:text-paper-mid'
            }`}
          >
            {tempYear}년
          </button>
          <button
            onClick={() => handleSegmentClick('month')}
            className={`flex-1 py-3 px-2 rounded-lg text-body font-medium transition-colors ${
              activeSegment === 'month'
                ? 'bg-ink-black dark:bg-pig-pink text-paper-white'
                : 'bg-paper-light dark:bg-ink-dark text-ink-dark dark:text-paper-mid'
            }`}
          >
            {tempMonth}월
          </button>
          <button
            onClick={() => handleSegmentClick('day')}
            className={`flex-1 py-3 px-2 rounded-lg text-body font-medium transition-colors ${
              activeSegment === 'day'
                ? 'bg-ink-black dark:bg-pig-pink text-paper-white'
                : 'bg-paper-light dark:bg-ink-dark text-ink-dark dark:text-paper-mid'
            }`}
          >
            {tempDay}일
          </button>
          <button
            onClick={() => handleSegmentClick('time')}
            className={`flex-1 py-3 px-2 rounded-lg text-body font-medium transition-colors ${
              activeSegment === 'time'
                ? 'bg-ink-black dark:bg-pig-pink text-paper-white'
                : 'bg-paper-light dark:bg-ink-dark text-ink-dark dark:text-paper-mid'
            }`}
          >
            {tempHour.toString().padStart(2, '0')}:{tempMinute.toString().padStart(2, '0')}
          </button>
        </div>

        {/* Segment Content */}
        <div className="min-h-[200px] border-t border-paper-mid dark:border-ink-dark">
          {activeSegment ? (
            renderSegmentSelector()
          ) : (
            <div className="flex items-center justify-center h-[200px] text-ink-light text-body">
              위 항목을 탭하여 변경하세요
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
