import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';

export interface ParsedStudentRecord {
  roll_number: string;
  reg_number: string;
  full_name_en: string;
  technology?: string;
}

export interface ParseDefaults {
  technology?: string;
}

export interface ParseResult {
  records: ParsedStudentRecord[];
  warnings: string[];
  rawTextLength: number;
  pageCount: number;
}

export function normalizeName(name: string): string {
  return (name || '')
    .toLowerCase()
    .replace(/[.,]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function normalizeShift(shift: string): string {
  const s = (shift || '').trim().toLowerCase();
  if (!s) return '';
  if (/^(1|1st|first|morning|১ম)(\s*shift)?$/i.test(s) || s.includes('1st') || s.includes('first') || s.includes('১ম')) {
    return '1st';
  }
  if (/^(2|2nd|second|day|২য়|২য়)(\s*shift)?$/i.test(s) || s.includes('2nd') || s.includes('second') || s.includes('২য়') || s.includes('২য়')) {
    return '2nd';
  }
  return (shift || '').trim();
}

export function normalizeSession(session: string): string {
  const s = (session || '').trim();
  if (!s) return '';
  const match = s.match(/(20\d{2})\s*[-–/]\s*(?:20)?(\d{2})/);
  if (match) {
    return `${match[1]}-${match[2]}`;
  }
  return s.replace(/\s+/g, '');
}

const KNOWN_TECHNOLOGIES = [
  { pattern: /computer\s*science\s*(?:&|and)?\s*technology|\bcst\b|\bcmt\b|computer\s*technology/i, label: 'Computer Science & Technology' },
  { pattern: /civil\s*technology|\bcivil\b/i, label: 'Civil Technology' },
  { pattern: /electrical\s*technology|\belectrical\b/i, label: 'Electrical Technology' },
  { pattern: /electronics\s*technology|\belectronics\b/i, label: 'Electronics Technology' },
  { pattern: /mechanical\s*technology|\bmechanical\b/i, label: 'Mechanical Technology' },
  { pattern: /power\s*technology|\bpower\b/i, label: 'Power Technology' },
  { pattern: /architecture/i, label: 'Architecture Technology' },
  { pattern: /environmental/i, label: 'Environmental Technology' },
];

export function detectTechnology(text: string): string | undefined {
  for (const tech of KNOWN_TECHNOLOGIES) {
    if (tech.pattern.test(text)) {
      return tech.label;
    }
  }
  return undefined;
}

function cleanExtractedName(raw: string): string {
  return raw
    .replace(/\b(?:male|female|regular|irregular|passed|active|1st|2nd|first|second|shift|morning|day)\b/gi, ' ')
    .replace(/(১ম|২য়|২য়)/g, ' ')
    .replace(/[|:,;]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function extractHeaderContext(lineText: string, ctx: { technology?: string }) {
  if (/tech|dept|department|trade/i.test(lineText) || KNOWN_TECHNOLOGIES.some((t) => t.pattern.test(lineText))) {
    const detected = detectTechnology(lineText);
    if (detected) ctx.technology = detected;
  }
}

interface TextItem {
  str: string;
  x: number;
  y: number;
}

function groupItemsIntoLines(items: TextItem[]): string[][] {
  const sorted = [...items].sort((a, b) => {
    if (Math.abs(b.y - a.y) > 3.5) return b.y - a.y;
    return a.x - b.x;
  });

  const lines: TextItem[][] = [];
  for (const item of sorted) {
    const lastLine = lines[lines.length - 1];
    if (!lastLine || Math.abs(lastLine[0].y - item.y) > 3.5) {
      lines.push([item]);
    } else {
      lastLine.push(item);
    }
  }

  return lines.map((line) => {
    line.sort((a, b) => a.x - b.x);
    const cells: string[] = [];
    let prevEndX = -Infinity;
    for (const item of line) {
      const txt = item.str.trim();
      if (!txt) continue;
      if (cells.length > 0 && item.x - prevEndX < 4) {
        cells[cells.length - 1] = `${cells[cells.length - 1]} ${txt}`.replace(/\s+/g, ' ').trim();
      } else {
        cells.push(txt);
      }
      prevEndX = item.x + txt.length * 4.5;
    }
    return cells;
  });
}

function parseRowTokens(
  cells: string[],
  ctx: { technology?: string },
  defaults: ParseDefaults
): ParsedStudentRecord | null {
  const fullLine = cells.join(' ').replace(/\s+/g, ' ').trim();
  if (!fullLine) return null;

  if (/\broll\b/i.test(fullLine) && /\bname\b/i.test(fullLine)) return null;

  const sixDigitMatches = fullLine.match(/\b\d{6}\b/g) || [];
  const tenDigitMatches = fullLine.match(/\b\d{10}\b/g) || [];

  let roll = sixDigitMatches[0] || '';
  let reg = tenDigitMatches[0] || '';

  if (!roll || !reg) {
    const allLongNums = fullLine.match(/\b\d{5,12}\b/g) || [];
    if (allLongNums.length >= 2) {
      const sortedByLen = [...allLongNums].sort((a, b) => a.length - b.length);
      if (!roll) roll = sortedByLen[0];
      if (!reg) reg = sortedByLen[sortedByLen.length - 1];
    }
  }

  if (!roll || !reg || roll === reg) {
    return null;
  }

  const rowTech = detectTechnology(fullLine) || ctx.technology || defaults.technology || undefined;

  let remainder = fullLine
    .replace(roll, ' ')
    .replace(reg, ' ')
    .replace(/\b20\d{2}\s*[-–/]\s*(?:20)?\d{2}\b/g, ' ');

  for (const tech of KNOWN_TECHNOLOGIES) {
    remainder = remainder.replace(tech.pattern, ' ');
  }

  remainder = remainder
    .replace(/^\s*\d{1,4}\s*[.)\-]?\s*/, ' ')
    .replace(/\b\d+\b/g, ' ');

  const fullNameEn = cleanExtractedName(remainder);
  if (!fullNameEn || !/[a-zA-Z]{2,}/.test(fullNameEn)) {
    return null;
  }

  return {
    roll_number: roll,
    reg_number: reg,
    full_name_en: fullNameEn,
    technology: rowTech,
  };
}

export async function parsePdfBuffer(buffer: Buffer, defaults: ParseDefaults = {}): Promise<ParseResult> {
  const uint8 = new Uint8Array(buffer);
  const loadingTask = pdfjsLib.getDocument({
    data: uint8,
    useSystemFonts: true,
    verbosity: 0,
  });

  const pdfDoc = await loadingTask.promise;
  const pageCount = pdfDoc.numPages;

  const recordsMap = new Map<string, ParsedStudentRecord>();
  const warnings: string[] = [];
  let rawTextLength = 0;

  const ctx: { technology?: string } = {
    technology: defaults.technology || undefined,
  };

  for (let pageNum = 1; pageNum <= pageCount; pageNum++) {
    const page = await pdfDoc.getPage(pageNum);
    const textContent = await page.getTextContent();
    const items: TextItem[] = [];

    for (const rawItem of textContent.items as any[]) {
      if (typeof rawItem?.str === 'string' && rawItem.str.trim()) {
        rawTextLength += rawItem.str.trim().length;
        items.push({
          str: rawItem.str,
          x: rawItem.transform?.[4] ?? 0,
          y: rawItem.transform?.[5] ?? 0,
        });
      }
    }

    const lines = groupItemsIntoLines(items);
    for (let i = 0; i < lines.length; i++) {
      const cells = lines[i];
      const lineText = cells.join(' ');
      extractHeaderContext(lineText, ctx);

      let parsed = parseRowTokens(cells, ctx, defaults);

      if (!parsed && i + 1 < lines.length) {
        const nextLineText = lines[i + 1].join(' ');
        const nextHasOwnRoll = /\b\d{6}\b/.test(nextLineText) && /\b\d{10}\b/.test(nextLineText);
        if (!nextHasOwnRoll && (/\b\d{6}\b/.test(lineText) || /\b\d{10}\b/.test(lineText))) {
          const combinedCells = [...cells, ...lines[i + 1]];
          parsed = parseRowTokens(combinedCells, ctx, defaults);
          if (parsed) i++;
        }
      }

      if (parsed) {
        recordsMap.set(parsed.roll_number, parsed);
      }
    }
  }

  const records = Array.from(recordsMap.values());

  if (rawTextLength < 20) {
    warnings.push('এই PDF ফাইলটিতে সিলেক্টেবল টেক্সট পাওয়া যায়নি (সম্ভবত স্ক্যান করা ইমেজ PDF)। ডিজিটাল টেক্সট PDF অথবা CSV ফাইল দিন।');
  } else if (records.length === 0) {
    warnings.push('PDF থেকে রোল, রেজিস্ট্রেশন ও নাম আলাদা করা যায়নি।');
  }

  return {
    records,
    warnings,
    rawTextLength,
    pageCount,
  };
}

function splitCsvLine(line: string, delimiter: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === delimiter && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += ch;
    }
  }
  result.push(current.trim());
  return result;
}

export function parseCsvBuffer(buffer: Buffer, defaults: ParseDefaults = {}): ParseResult {
  const text = buffer.toString('utf8').replace(/^\uFEFF/, '');
  const rawLines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const warnings: string[] = [];
  const recordsMap = new Map<string, ParsedStudentRecord>();

  if (rawLines.length === 0) {
    return { records: [], warnings: ['CSV ফাইলটি খালি।'], rawTextLength: 0, pageCount: 1 };
  }

  const delimiter = rawLines[0].includes('\t') ? '\t' : ',';
  const firstRow = splitCsvLine(rawLines[0], delimiter).map((h) => h.toLowerCase());

  const findCol = (patterns: RegExp[]) => firstRow.findIndex((h) => patterns.some((p) => p.test(h)));
  const hasHeader = firstRow.some((h) => /roll|reg|name/i.test(h));

  const rollIdx = findCol([/roll/i]);
  const regIdx = findCol([/reg/i]);
  const nameIdx = findCol([/name/i]);
  const techIdx = findCol([/tech|dept|department/i]);

  const startIndex = hasHeader ? 1 : 0;

  for (let i = startIndex; i < rawLines.length; i++) {
    const cols = splitCsvLine(rawLines[i], delimiter);
    if (hasHeader && rollIdx !== -1 && regIdx !== -1 && nameIdx !== -1) {
      const roll = (cols[rollIdx] || '').trim();
      const reg = (cols[regIdx] || '').trim();
      const name = (cols[nameIdx] || '').replace(/\s+/g, ' ').trim();
      const tech = (techIdx !== -1 ? cols[techIdx] : '') || defaults.technology || undefined;

      if (roll && reg && name) {
        recordsMap.set(roll, {
          roll_number: roll,
          reg_number: reg,
          full_name_en: name,
          technology: tech,
        });
      }
    } else {
      const parsed = parseRowTokens(cols, {}, defaults);
      if (parsed) {
        recordsMap.set(parsed.roll_number, parsed);
      }
    }
  }

  const records = Array.from(recordsMap.values());
  if (records.length === 0) {
    warnings.push('CSV ফাইল থেকে কোনো বৈধ শিক্ষার্থীর তথ্য পাওয়া যায়নি।');
  }

  return {
    records,
    warnings,
    rawTextLength: text.length,
    pageCount: 1,
  };
}

export function verifyStudentAgainstRegistry(
  input: {
    full_name_en: string;
    roll_number: string;
    reg_number: string;
  },
  official: {
    full_name_en: string;
    roll_number: string;
    reg_number: string;
  }
): { valid: boolean; mismatchedFields: string[] } {
  const mismatchedFields: string[] = [];

  if ((input.roll_number || '').trim() !== (official.roll_number || '').trim()) {
    mismatchedFields.push('রোল নম্বর');
  }
  if ((input.reg_number || '').trim() !== (official.reg_number || '').trim()) {
    mismatchedFields.push('রেজিস্ট্রেশন নম্বর');
  }
  if (normalizeName(input.full_name_en) !== normalizeName(official.full_name_en)) {
    mismatchedFields.push('নাম (English)');
  }

  return {
    valid: mismatchedFields.length === 0,
    mismatchedFields,
  };
}
