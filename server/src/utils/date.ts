// Don't pass DD/MM/YYYY to `new Date()` directly. JS will happily
// parse "21/04/2026" as MM/DD/YYYY in some engines and silently
// give you a wrong date. So we parse manually.

const DATE_RE = /^(\d{2})\/(\d{2})\/(\d{4})$/;

export function parseDate(input: string): Date {
  const m = DATE_RE.exec(input);
  if (!m) throw new Error(`Bad date format (expected DD/MM/YYYY): "${input}"`);

  const day = Number(m[1]);
  const month = Number(m[2]);
  const year = Number(m[3]);

  const d = new Date(year, month - 1, day);

  // Date() rolls over invalid days (31/02 -> 03/03), so check.
  if (d.getFullYear() !== year || d.getMonth() !== month - 1 || d.getDate() !== day) {
    throw new Error(`Invalid calendar date: "${input}"`);
  }
  return d;
}

export function formatDate(d: Date): string {
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  return `${dd}/${mm}/${d.getFullYear()}`;
}

// Inclusive list of `days` dates ending at referenceDate.
// e.g. ('23/04/2026', 3) -> ['21/04/2026','22/04/2026','23/04/2026']
export function getDateWindow(referenceDate: string, days: number): string[] {
  if (days < 1) throw new Error('days must be >= 1');
  const ref = parseDate(referenceDate);
  const out: string[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(ref);
    d.setDate(ref.getDate() - i);
    out.push(formatDate(d));
  }
  return out;
}
