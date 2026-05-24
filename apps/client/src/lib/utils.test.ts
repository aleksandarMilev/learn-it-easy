import { describe, it, expect } from 'vitest';
import { getFullName, getDayName, classNames, formatDate } from './utils';

describe('getFullName', () => {
  it('should return full name from profile', () => {
    expect(getFullName({ firstName: 'John', lastName: 'Doe' })).toBe('John Doe');
  });

  it('should return Unknown for null profile', () => {
    expect(getFullName(null)).toBe('Unknown');
  });
});

describe('getDayName', () => {
  it('should return correct day names', () => {
    expect(getDayName(0)).toBe('Sunday');
    expect(getDayName(1)).toBe('Monday');
    expect(getDayName(6)).toBe('Saturday');
  });

  it('should return Unknown for invalid day', () => {
    expect(getDayName(7)).toBe('Unknown');
  });
});

describe('classNames', () => {
  it('should join class names', () => {
    expect(classNames('foo', 'bar')).toBe('foo bar');
  });

  it('should filter falsy values', () => {
    expect(classNames('foo', false, null, undefined, 'bar')).toBe('foo bar');
  });

  it('should return empty string for all falsy values', () => {
    expect(classNames(false, null, undefined)).toBe('');
  });
});

describe('formatDate', () => {
  it('should format a date string', () => {
    const result = formatDate('2026-06-01T10:00:00.000Z');

    expect(result).toContain('2026');
    expect(result).toContain('Jun');
  });
});
