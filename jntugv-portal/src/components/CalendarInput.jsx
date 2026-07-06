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
  const selectedDate = useMemo(() => parseDateValue(value), [value]);
  const [viewDate, setViewDate] = useState(selectedDate || parseDateValue(max) || new Date());
  const displayValue = useMemo(() => formatDate(value), [value]);

  useEffect(() => {
    if (selectedDate) setViewDate(selectedDate);
  }, [selectedDate]);

  useEffect(() => {
    const handlePointerDown = (event) => {
      if (!fieldRef.current?.contains(event.target)) setIsOpen(false);
    };

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') setIsOpen(false);
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

  const selectDate = (date) => {
    const nextValue = toDateValue(date);
    if (isOutOfRange(nextValue, min, max)) return;
    emitChange(nextValue);
    setIsOpen(false);
  };

  const selectToday = () => {
    const todayValue = toDateValue(new Date());
    if (isOutOfRange(todayValue, min, max)) return;
    emitChange(todayValue);
    setViewDate(new Date());
    setIsOpen(false);
  };

  const calendarDays = useMemo(() => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const gridStart = new Date(year, month, 1 - firstDay.getDay());

    return Array.from({ length: 42 }, (_, index) => {
      const date = new Date(gridStart);
      date.setDate(gridStart.getDate() + index);
      const dateValue = toDateValue(date);
      return {
        date,
        value: dateValue,
        day: date.getDate(),
        inMonth: date.getMonth() === month,
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
        onClick={() => setIsOpen(prev => !prev)}
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
            <button type="button" className="calendar-nav-button" onClick={() => changeMonth(-1)} aria-label="Previous month">
              <ChevronLeft size={18} />
            </button>
            <div className="calendar-current-month">
              <strong>{MONTHS[viewDate.getMonth()]}</strong>
              <span>{viewDate.getFullYear()}</span>
            </div>
            <button type="button" className="calendar-nav-button" onClick={() => changeMonth(1)} aria-label="Next month">
              <ChevronRight size={18} />
            </button>
          </div>

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

          <div className="calendar-actions">
            <button type="button" onClick={() => emitChange('')}>Clear</button>
            <button type="button" onClick={selectToday}>Today</button>
          </div>
        </div>
      )}
    </div>
  );
}
