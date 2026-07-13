const {
  sanitizeInput,
  escapeHtml,
  waitLevel,
  densityStats,
  debounce,
  createTTLCache,
  cacheKey
} = require('../js/utils.js');

describe('sanitizeInput', () => {
  test('strips angle brackets to prevent HTML injection', () => {
    expect(sanitizeInput('<script>alert(1)</script>')).toBe('scriptalert(1)/script');
  });

  test('collapses whitespace and trims', () => {
    expect(sanitizeInput('  hello    world  ')).toBe('hello world');
  });

  test('enforces max length', () => {
    const long = 'a'.repeat(600);
    expect(sanitizeInput(long).length).toBe(500);
  });

  test('respects a custom max length', () => {
    expect(sanitizeInput('hello world', 5)).toBe('hello');
  });

  test('returns empty string for non-string input', () => {
    expect(sanitizeInput(null)).toBe('');
    expect(sanitizeInput(undefined)).toBe('');
    expect(sanitizeInput(42)).toBe('');
  });
});

describe('escapeHtml', () => {
  test('escapes all HTML-sensitive characters', () => {
    expect(escapeHtml(`<a href="x">'&'</a>`)).toBe(
      '&lt;a href=&quot;x&quot;&gt;&#39;&amp;&#39;&lt;/a&gt;'
    );
  });

  test('leaves plain text untouched', () => {
    expect(escapeHtml('Gate C is accessible')).toBe('Gate C is accessible');
  });
});

describe('waitLevel', () => {
  test('classifies low wait times', () => {
    expect(waitLevel(0)).toBe('low');
    expect(waitLevel(9)).toBe('low');
  });

  test('classifies moderate wait times', () => {
    expect(waitLevel(10)).toBe('med');
    expect(waitLevel(19)).toBe('med');
  });

  test('classifies high wait times', () => {
    expect(waitLevel(20)).toBe('high');
    expect(waitLevel(45)).toBe('high');
  });

  test('defaults to low for invalid input', () => {
    expect(waitLevel(NaN)).toBe('low');
    expect(waitLevel('20')).toBe('low');
  });
});

describe('densityStats', () => {
  test('counts each density level correctly', () => {
    const stats = densityStats(['low', 'low', 'med', 'high', 'crit', 'crit']);
    expect(stats).toEqual({ low: 2, med: 1, high: 1, crit: 2, total: 6 });
  });

  test('handles an empty array', () => {
    expect(densityStats([])).toEqual({ low: 0, med: 0, high: 0, crit: 0, total: 0 });
  });

  test('ignores unrecognized labels without throwing', () => {
    const stats = densityStats(['low', 'unknown']);
    expect(stats.low).toBe(1);
    expect(stats.total).toBe(2);
  });
});

describe('debounce', () => {
  jest.useFakeTimers();

  test('only calls the function once after repeated rapid calls', () => {
    const fn = jest.fn();
    const debounced = debounce(fn, 300);
    debounced();
    debounced();
    debounced();
    expect(fn).not.toHaveBeenCalled();
    jest.advanceTimersByTime(300);
    expect(fn).toHaveBeenCalledTimes(1);
  });
});

describe('createTTLCache', () => {
  test('stores and retrieves a value', () => {
    const cache = createTTLCache(1000);
    cache.set('a', 'value');
    expect(cache.get('a')).toBe('value');
  });

  test('expires values after the TTL', () => {
    jest.useFakeTimers().setSystemTime(0);
    const cache = createTTLCache(1000);
    cache.set('a', 'value');
    jest.setSystemTime(1500);
    expect(cache.get('a')).toBeUndefined();
  });

  test('returns undefined for a missing key', () => {
    const cache = createTTLCache();
    expect(cache.get('missing')).toBeUndefined();
  });
});

describe('cacheKey', () => {
  test('is case-insensitive and stable for the same inputs', () => {
    expect(cacheKey('Where is Gate C?', 'English')).toBe(
      cacheKey('where is gate c?', 'english')
    );
  });

  test('differs for different languages', () => {
    expect(cacheKey('hello', 'English')).not.toBe(cacheKey('hello', 'Spanish'));
  });
});
