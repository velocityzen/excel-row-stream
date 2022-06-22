import ssf from "ssf";

interface FormatOptions {
  formatId: undefined | number | string;
  hasFormatCodes: boolean;
  formatCodes: Record<string, string>;
  date1904: boolean;
  value: unknown;
}

export function format({
  formatId,
  hasFormatCodes,
  formatCodes,
  date1904,
  value,
}: FormatOptions): unknown {
  if (value === null || value === undefined) {
    return null;
  }

  if (hasFormatCodes && formatId !== undefined) {
    const format = formatCodes[formatId];

    if (format !== undefined && format !== "General") {
      try {
        const num = Number(value);
        if (!isNaN(num)) {
          return ssf.format(format, Number(value), { date1904 });
        }
      } catch (e) {
        // DO NOTHING
      }
    }
  }

  if (formatId) {
    try {
      const num = Number(value);
      if (!isNaN(num)) {
        return ssf.format(Number(formatId), Number(value), {
          date1904,
        });
      }
    } catch (e) {
      // DO NOTHING
    }
  }

  const numValue = parseFloat(value as string);
  if (!isNaN(numValue)) {
    return numValue;
  }

  return value;
}
