import React, { useEffect, useMemo, useRef, useState } from 'react';
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react';
import './CalendarInput.css';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

const toDateValue = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const parseDateValue = (value) => {
  if (!value) return null;
  const [year, month, day] = value.split('-').map(Number);
  if (!year || !month || !day) return null;
  return new Date(year, month - 1, day);
};

const formatDate = (value) => {
  if (!value) return '';
  const [year, month, day] = value.split('-');
  if (!year || !month || !day) return value;
  return `${day}-${month}-${year}`;
};

const isOutOfRange = (dateValue, min, max) => (
  (min && dateValue < min) || (max && dateValue > max)
);

export default function CalendarInput({
  id,
  name,
  label,
  value,
  onChange,
  required = false,
  min,
  max,
  gridColumn,
}) {
  const fieldRef = useRef(null);
  const [isOpen, setIsOpen] = useState(false);
  const [pickerMode, setPickerMode] = useState('days');
  const selectedDate = useMemo(() => parseDateValue(value), [value]);
  const [viewDate, setViewDate] = useState(selectedDate || parseDateValue(max) || new Date());
  const displayValue = useMemo(() => formatDate(value), [value]);
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const minYear = parseDateValue(min)?.getFullYear() || year - 100;
  const maxYear = parseDateValue(max)?.getFullYear() || year + 20;
  const yearPageStart = Math.floor(year / 12) * 12;
  const yearOptions = useMemo(
    () => Array.from({ length: 12 }, (_, index) => yearPageStart + index),
    [yearPageStart],
  );

  useEffect(() => {
    if (selectedDate) setViewDate(selectedDate);
  }, [selectedDate]);

  useEffect(() => {
    const handlePointerDown = (event) => {
      if (!fieldRef.current?.contains(event.target)) {
        setIsOpen(false);
        setPickerMode('days');
      }
    };

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
        setPickerMode('days');
      }
    };

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const emitChange = (nextValue) => {
    onChange({ target: { name, value: nextValue } });
  };

  const changeMonth = (offset) => {
    setViewDate(prev => new Date(prev.getFullYear(), prev.getMonth() + offset, 1));
  };

  const changeYearPage = (offset) => {
    setViewDate(prev => new Date(prev.getFullYear() + offset, prev.getMonth(), 1));
  };

  const selectMonth = (nextMonth) => {
    setViewDate(prev => new Date(prev.getFullYear(), nextMonth, 1));
    setPickerMode('days');
  };

  const isMonthDisabled = (nextMonth) => {
    const monthStart = toDateValue(new Date(year, nextMonth, 1));
    const monthEnd = toDateValue(new Date(year, nextMonth + 1, 0));
    return (max && monthStart > max) || (min && monthEnd < min);
  };

  const selectYear = (nextYear) => {
    if (nextYear < minYear || nextYear > maxYear) return;
    setViewDate(prev => new Date(nextYear, prev.getMonth(), 1));
  };

  const selectDate = (date) => {
    const nextValue = toDateValue(date);
    if (isOutOfRange(nextValue, min, max)) return;
    emitChange(nextValue);
    setIsOpen(false);
    setPickerMode('days');
  };

  const selectToday = () => {
    const todayValue = toDateValue(new Date());
    if (isOutOfRange(todayValue, min, max)) return;
    emitChange(todayValue);
    setViewDate(new Date());
    setIsOpen(false);
    setPickerMode('days');
  };

  const calendarDays = useMemo(() => {
    const viewYear = viewDate.getFullYear();
    const viewMonth = viewDate.getMonth();
    const firstDay = new Date(viewYear, viewMonth, 1);
    const gridStart = new Date(viewYear, viewMonth, 1 - firstDay.getDay());

    return Array.from({ length: 42 }, (_, index) => {
      const date = new Date(gridStart);
      date.setDate(gridStart.getDate() + index);
      const dateValue = toDateValue(date);
      return {
        date,
        value: dateValue,
        day: date.getDate(),
        inMonth: date.getMonth() === viewMonth,
        selected: value === dateValue,
        today: toDateValue(new Date()) === dateValue,
        disabled: isOutOfRange(dateValue, min, max),
      };
    });
  }, [viewDate, value, min, max]);

  return (
    <div className="calendar-field" ref={fieldRef} style={gridColumn ? { gridColumn } : undefined}>
      <label htmlFor={id || name} className="calendar-label">
        {label} {required && <span className="required-star">*</span>}
      </label>

      <button
        id={id || name}
        type="button"
        className={`calendar-control ${isOpen ? 'open' : ''}`}
        onClick={() => {
          setIsOpen(prev => !prev);
          setPickerMode('days');
        }}
        aria-expanded={isOpen}
      >
        <CalendarDays size={20} className="calendar-icon" aria-hidden="true" />
        <span className={`calendar-display ${value ? 'has-value' : ''}`}>
          {displayValue || 'Select date'}
        </span>
      </button>

      <span className="calendar-hint">DD-MM-YYYY</span>

      {isOpen && (
        <div className="calendar-popover" role="dialog" aria-label={`${label} calendar`}>
          <div className="calendar-popover-header">
            <button
              type="button"
              className="calendar-nav-button"
              onClick={() => (pickerMode === 'days' ? changeMonth(-1) : changeYearPage(-12))}
              aria-label={pickerMode === 'days' ? 'Previous month' : 'Previous years'}
            >
              <ChevronLeft size={18} />
            </button>
            <button
              type="button"
              className="calendar-current-month"
              onClick={() => setPickerMode(prev => (prev === 'days' ? 'monthYear' : 'days'))}
              aria-label="Change month and year"
              aria-pressed={pickerMode === 'monthYear'}
            >
              <strong>{MONTHS[month]}</strong>
              <span>{year}</span>
            </button>
            <button
              type="button"
              className="calendar-nav-button"
              onClick={() => (pickerMode === 'days' ? changeMonth(1) : changeYearPage(12))}
              aria-label={pickerMode === 'days' ? 'Next month' : 'Next years'}
            >
              <ChevronRight size={18} />
            </button>
          </div>

          {pickerMode === 'monthYear' ? (
            <div className="calendar-month-year-picker">
              <div className="calendar-month-grid" aria-label="Select month">
                {MONTHS.map((monthName, index) => (
                  <button
                    key={monthName}
                    type="button"
                    className={`calendar-picker-button ${index === month ? 'selected' : ''}`}
                    onClick={() => selectMonth(index)}
                    disabled={isMonthDisabled(index)}
                  >
                    {monthName.slice(0, 3)}
                  </button>
                ))}
              </div>

              <div className="calendar-year-grid" aria-label="Select year">
                {yearOptions.map(optionYear => (
                  <button
                    key={optionYear}
                    type="button"
                    className={`calendar-picker-button ${optionYear === year ? 'selected' : ''}`}
                    onClick={() => selectYear(optionYear)}
                    disabled={optionYear < minYear || optionYear > maxYear}
                  >
                    {optionYear}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <>
              <div className="calendar-weekdays">
                {WEEKDAYS.map(day => <span key={day}>{day}</span>)}
              </div>

              <div className="calendar-day-grid">
                {calendarDays.map(day => (
                  <button
                    key={day.value}
                    type="button"
                    className={[
                      'calendar-day',
                      day.inMonth ? '' : 'muted',
                      day.selected ? 'selected' : '',
                      day.today ? 'today' : '',
                    ].filter(Boolean).join(' ')}
                    onClick={() => selectDate(day.date)}
                    disabled={day.disabled}
                  >
                    {day.day}
                  </button>
                ))}
              </div>
            </>
          )}

          <div className="calendar-actions">
            <button type="button" onClick={() => emitChange('')}>Clear</button>
            <button type="button" onClick={selectToday}>Today</button>
          </div>
        </div>
      )}
    </div>
  );
}
