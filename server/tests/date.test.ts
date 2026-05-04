import { parseDate, formatDate, getDateWindow } from '../src/utils/date';

describe('parseDate', () => {
  it('parses DD/MM/YYYY', () => {
    const d = parseDate('21/04/2026');
    expect(d.getFullYear()).toBe(2026);
    expect(d.getMonth()).toBe(3); // April, zero-indexed
    expect(d.getDate()).toBe(21);
  });

  it('rejects month > 12', () => {
    expect(() => parseDate('04/13/2026')).toThrow();
  });

  it('rejects malformed strings', () => {
    expect(() => parseDate('2026-04-21')).toThrow();
    expect(() => parseDate('21/4/2026')).toThrow();
    expect(() => parseDate('not a date')).toThrow();
  });

  it('rejects calendar-impossible dates instead of rolling them over', () => {
    expect(() => parseDate('31/02/2026')).toThrow(/Invalid calendar date/);
  });
});

describe('formatDate', () => {
  it('zero-pads days and months', () => {
    expect(formatDate(new Date(2026, 0, 5))).toBe('05/01/2026');
  });
});

describe('getDateWindow', () => {
  it('returns the inclusive 3-day window', () => {
    expect(getDateWindow('23/04/2026', 3)).toEqual([
      '21/04/2026', '22/04/2026', '23/04/2026',
    ]);
  });

  it('handles month boundaries', () => {
    expect(getDateWindow('02/05/2026', 3)).toEqual([
      '30/04/2026', '01/05/2026', '02/05/2026',
    ]);
  });

  it('rejects zero/negative day counts', () => {
    expect(() => getDateWindow('23/04/2026', 0)).toThrow();
  });
});
