import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Check, ChevronDown } from 'lucide-react';
import './CustomSelect.css';

export default function CustomSelect({
  name,
  label,
  value,
  options,
  onChange,
  required = false,
  gridColumn,
  placeholder = 'Select option',
}) {
  const selectRef = useRef(null);
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');

  const normalizedOptions = useMemo(() => (
    options.map(option => (
      typeof option === 'string' ? { label: option, value: option } : option
    ))
  ), [options]);

  const selectedOption = normalizedOptions.find(option => option.value === value);
  const filteredOptions = normalizedOptions.filter(option => (
    option.label.toLowerCase().includes(query.trim().toLowerCase())
  ));

  useEffect(() => {
    const handlePointerDown = (event) => {
      if (!selectRef.current?.contains(event.target)) {
        setIsOpen(false);
        setQuery('');
      }
    };

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
        setQuery('');
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
    setIsOpen(false);
    setQuery('');
  };

  return (
    <div className="custom-select-field" ref={selectRef} style={gridColumn ? { gridColumn } : undefined}>
      <label className="custom-select-label">
        {label} {required && <span className="required-star">*</span>}
      </label>

      <button
        type="button"
        className={`custom-select-control ${isOpen ? 'open' : ''} ${value ? 'has-value' : ''}`}
        onClick={() => setIsOpen(prev => !prev)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <span>{selectedOption?.label || placeholder}</span>
        <ChevronDown size={18} className="custom-select-chevron" aria-hidden="true" />
      </button>

      {isOpen && (
        <div className="custom-select-popover">
          {normalizedOptions.length > 6 && (
            <input
              className="custom-select-search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search"
              autoFocus
            />
          )}

          <div className="custom-select-list" role="listbox">
            {filteredOptions.map(option => (
              <button
                key={option.value}
                type="button"
                className={`custom-select-option ${option.value === value ? 'selected' : ''}`}
                onClick={() => emitChange(option.value)}
                role="option"
                aria-selected={option.value === value}
              >
                <span>{option.label}</span>
                {option.value === value && <Check size={17} aria-hidden="true" />}
              </button>
            ))}

            {filteredOptions.length === 0 && (
              <div className="custom-select-empty">No options found</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
