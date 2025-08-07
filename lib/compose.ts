import { Transform } from "stream";

import { RowWithValues, RowWithColumns } from "./types";

export interface CreateRowToRowWithColumnsStreamOptions {
  sanitizeColumnName?: (columnName: string) => string;
}

export function createRowToRowWithColumnsStream({
  sanitizeColumnName,
}: CreateRowToRowWithColumnsStreamOptions = {}) {
  let columnNames: string[];

  return new Transform({
    objectMode: true,
    transform({ index, values }: RowWithValues, _encoding, callback) {
      if (index === 1) {
        columnNames = values.map((value) =>
          sanitizeColumnName
            ? sanitizeColumnName(String(value))
            : String(value),
        );

        callback();
        return;
      }

      const columns = values.reduce<Record<string, unknown>>(
        (rowData, value, column) => {
          rowData[columnNames[column]] = value;
          return rowData;
        },
        {},
      );

      callback(null, {
        index,
        columns,
      });
    },
  });
}

export function createRowToRowAsObjectStream() {
  return new Transform({
    objectMode: true,
    transform(row: RowWithValues | RowWithColumns, _encoding, callback) {
      if ("values" in row) {
        callback(null, row.values);
        return;
      }

      callback(null, row.columns);
    },
  });
}

export interface CreateThrowIfEmptyStreamOptions {
  message: string;
}

export function createThrowIfEmptyStream({
  message,
}: CreateThrowIfEmptyStreamOptions) {
  let hasData = false;

  return new Transform({
    objectMode: true,

    transform(row, _encoding, callback) {
      hasData ||= true;
      callback(null, row);
    },

    flush(callback) {
      const error = hasData ? null : new Error(message);
      callback(error);
    },
  });
}
