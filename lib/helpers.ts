import { reduceRight } from "fp-ts/Array";
import { WorkBookStyles, RowWithValues } from "./types";

interface FixStylesOptions {
  addSecondsToCustomTimeFormat: boolean;
}

export function fixStyles(
  styles: WorkBookStyles,
  { addSecondsToCustomTimeFormat }: FixStylesOptions,
): WorkBookStyles {
  if (addSecondsToCustomTimeFormat && styles.hasFormatCodes) {
    styles.formatCodes = Object.entries(styles.formatCodes).reduce<
      Record<string, string>
    >((map, [id, value]) => {
      map[id] = value.replace(/h{1,2}:m{1,2}(:s{1,2})?/, "hh:mm:ss");
      return map;
    }, {});
  }

  return styles;
}

export function isEmpyRow(row: RowWithValues): boolean {
  return row.values.every((v) => v === undefined || v === null);
}

export const dropEmpty = (arr: unknown[]) =>
  reduceRight([], (v, arr: unknown[]) => {
    if (arr.length === 0 && (v === undefined || v === null)) {
      return arr;
    }

    arr.unshift(v);
    return arr;
  })(arr);

export function dropEmptyValues({
  index,
  values,
}: RowWithValues): RowWithValues {
  return {
    index,
    values: dropEmpty(values),
  };
}

export async function asyncIterate<T>(
  arr: T[],
  fn: (i: T) => Promise<void>,
): Promise<void> {
  // eslint-disable-next-line @typescript-eslint/await-thenable
  for await (const el of arr) {
    await fn(el);
  }
}

export function getFormatId(strId?: string): null | number {
  if (!strId) {
    return null;
  }

  const id = parseInt(strId, 10);
  if (isNaN(id)) {
    return null;
  }

  return id;
}

export function getColumnIndex(columnName: string): number {
  let i = columnName.search(/\d/);
  let colNum = 0;

  columnName.replace(/\D/g, function (letter) {
    colNum += (parseInt(letter, 36) - 9) * Math.pow(26, --i);
    return "";
  });

  return colNum;
}

export function safeInsertAt<V>(
  index: number,
  value: V,
  arr: (null | V)[],
): (null | V)[] {
  for (let i = arr.length; i < index; i++) {
    if (arr[i] === undefined) {
      arr[i] = null;
    }
  }
  arr[index] = value;
  return arr;
}

export function toError(e: unknown): Error {
  try {
    return e instanceof Error ? e : new Error(String(e));
  } catch (cause) {
    return Error("Failed", { cause });
  }
}
