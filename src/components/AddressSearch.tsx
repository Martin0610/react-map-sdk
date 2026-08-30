import React, { useState, useEffect, useRef, useCallback } from 'react';
import type { AddressSearchProps, GeocodeResult } from '../types/map';
import { geocodeAddress } from '../utils/geocoding';

/**
 * AddressSearch Component
 *
 * An interactive, 100% free address geocoding search input with debounced autocomplete,
 * keyboard navigation, and instant coordinate extraction.
 */
export const AddressSearch: React.FC<AddressSearchProps> = ({
  placeholder = 'Search address, city, or landmark...',
  onSelect,
  initialValue = '',
  className = '',
  style,
  options,
  disabled = false,
  debounceMs = 300,
  clearOnSelect = false
}) => {
  const [query, setQuery] = useState(initialValue);
  const [results, setResults] = useState<GeocodeResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState<number>(-1);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isSelectedRef = useRef(false);

  // Sync initialValue changes if passed from parent
  useEffect(() => {
    if (initialValue !== undefined && !isSelectedRef.current) {
      setQuery(initialValue);
    }
    isSelectedRef.current = false;
  }, [initialValue]);

  // Handle search with debounce
  const executeSearch = useCallback(
    async (searchTerm: string) => {
      if (!searchTerm.trim() || searchTerm.trim().length < 2) {
        setResults([]);
        setIsOpen(false);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        const data = await geocodeAddress(searchTerm, options);
        setResults(data);
        setIsOpen(data.length > 0);
        setHighlightedIndex(-1);
      } catch (err) {
        console.error('[react-map-sdk] Geocoding search failed:', err);
        setResults([]);
        setIsOpen(false);
      } finally {
        setIsLoading(false);
      }
    },
    [options]
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);
    isSelectedRef.current = false;

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      executeSearch(val);
    }, debounceMs);
  };

  const handleSelectResult = (result: GeocodeResult) => {
    isSelectedRef.current = true;
    if (clearOnSelect) {
      setQuery('');
    } else {
      setQuery(result.name || result.displayName);
    }
    setIsOpen(false);
    setResults([]);
    setHighlightedIndex(-1);
    onSelect(result);
  };

  const handleClear = () => {
    setQuery('');
    setResults([]);
    setIsOpen(false);
    setHighlightedIndex(-1);
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
  };

  // Keyboard navigation: ArrowUp, ArrowDown, Enter, Escape
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen || results.length === 0) {
      if (e.key === 'ArrowDown' && results.length > 0) {
        setIsOpen(true);
      }
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev < results.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : results.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (highlightedIndex >= 0 && highlightedIndex < results.length) {
        handleSelectResult(results[highlightedIndex]);
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setIsOpen(false);
      setHighlightedIndex(-1);
    }
  };

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className={`react-map-sdk-search-container ${className}`.trim()}
      style={{
        position: 'relative',
        width: '100%',
        fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        ...style
      }}
    >
      <div
        style={{
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          width: '100%',
          borderRadius: '8px',
          backgroundColor: '#ffffff',
          border: '1px solid #cbd5e1',
          boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
          transition: 'all 0.15s ease'
        }}
      >
        <span
          style={{
            paddingLeft: '10px',
            paddingRight: '6px',
            color: '#64748b',
            display: 'flex',
            alignItems: 'center',
            fontSize: '14px',
            userSelect: 'none'
          }}
        >
          🔍
        </span>

        <input
          type="text"
          value={query}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (results.length > 0) setIsOpen(true);
          }}
          placeholder={placeholder}
          disabled={disabled}
          style={{
            flex: 1,
            padding: '8px 4px',
            fontSize: '14px',
            color: '#0f172a',
            backgroundColor: 'transparent',
            border: 'none',
            outline: 'none',
            minWidth: '0'
          }}
        />

        {isLoading && (
          <div
            style={{
              paddingRight: '10px',
              display: 'flex',
              alignItems: 'center',
              color: '#3b82f6',
              fontSize: '12px'
            }}
          >
            <span
              style={{
                display: 'inline-block',
                width: '14px',
                height: '14px',
                border: '2px solid #e2e8f0',
                borderTopColor: '#3b82f6',
                borderRadius: '50%',
                animation: 'spin 0.6s linear infinite'
              }}
            />
          </div>
        )}

        {!isLoading && query && (
          <button
            type="button"
            onClick={handleClear}
            style={{
              background: 'none',
              border: 'none',
              padding: '4px 10px',
              cursor: 'pointer',
              color: '#94a3b8',
              fontSize: '14px',
              lineHeight: 1
            }}
            title="Clear search"
          >
            ✕
          </button>
        )}
      </div>

      {isOpen && results.length > 0 && (
        <ul
          style={{
            position: 'absolute',
            top: 'calc(100% + 4px)',
            left: 0,
            right: 0,
            zIndex: 9999,
            backgroundColor: '#ffffff',
            borderRadius: '8px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)',
            maxHeight: '260px',
            overflowY: 'auto',
            margin: 0,
            padding: '4px 0',
            listStyle: 'none'
          }}
        >
          {results.map((item, index) => {
            const isHighlighted = index === highlightedIndex;
            return (
              <li
                key={`${item.coordinates.lat}-${item.coordinates.lng}-${index}`}
                onMouseDown={() => handleSelectResult(item)}
                onMouseEnter={() => setHighlightedIndex(index)}
                style={{
                  padding: '8px 12px',
                  cursor: 'pointer',
                  backgroundColor: isHighlighted ? '#f1f5f9' : 'transparent',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '8px',
                  borderBottom: index !== results.length - 1 ? '1px solid #f8fafc' : 'none',
                  transition: 'background-color 0.1s ease'
                }}
              >
                <span style={{ fontSize: '14px', marginTop: '2px', color: '#64748b' }}>📍</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: '13px',
                      fontWeight: 600,
                      color: '#1e293b',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}
                  >
                    {item.name || item.displayName.split(',')[0]}
                  </div>
                  <div
                    style={{
                      fontSize: '11px',
                      color: '#64748b',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      marginTop: '1px'
                    }}
                  >
                    {item.displayName}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};
