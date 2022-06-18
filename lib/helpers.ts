import { reduceRight } from "fp-ts/Array";
import { Row } from "./types";

export function isEmpyRow(row: Row): boolean {
  return row.values.every((v) => v === undefined || v === null);
}

const dropEmpty = reduceRight([], (v, arr: unknown[]) => {
  if (arr.length === 0 && (v === undefined || v === null)) {
    return arr;
  }

  arr.unshift(v);
  return arr;
});

export function dropEmptyValues({ index, values }: Row): Row {
  return {
    index,
    values: dropEmpty(values),
  };
}

export async function asyncIterate<T>(
  arr: T[],
  fn: (i: T) => Promise<void>
): Promise<void> {
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
