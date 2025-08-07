import ssf from "ssf";

interface FormatOptions {
  formatId: undefined | number | string;
  hasFormatCodes: boolean;
  formatCodes: Record<string, string | undefined>;
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
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (e) {
        // DO NOTHING
      }
    }
  }

  const formatIdNum = Number(formatId);
  // we ignore default format 0 because it formats number as string.
  if (formatIdNum) {
    try {
      const num = Number(value);
      if (!isNaN(num)) {
        return ssf.format(formatIdNum, num, {
          date1904,
        });
      }
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
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
