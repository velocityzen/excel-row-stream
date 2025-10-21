import { createReadStream } from "fs";
import { Transform, Writable } from "stream";
import { pipeline } from "stream/promises";
import { describe, expect, test } from "vitest";

import {
  createExcelParserStream,
  createRowToRowAsObjectStream,
  createRowToRowWithColumnsStream,
  createThrowIfEmptyStream,
  RowAsObject,
  RowWithColumns,
  RowWithValues,
} from "../lib";

describe("Compose stream", () => {
  test("row has columns", async () => {
    const fileStream = createReadStream(
      "./tests/fixtures/predefined_formats.xlsx",
    );
    const parserStream = createExcelParserStream({
      matchSheet: /.*/,
      dropEmptyRows: true,
    });

    const withColumnsStream = createRowToRowWithColumnsStream();

    const resultStream = new Writable({
      objectMode: true,
      write(row: RowWithColumns, _encoding, callback) {
        expect(row.columns).toBeDefined();

        if (row.index === 2) {
          expect(row.columns.Nome).toBe("jhon");
          expect(row.columns["Data di nascita"]).toBe("9/27/86");
        }

        callback();
      },
    });

    await pipeline(fileStream, parserStream, withColumnsStream, resultStream);
  });

  test("row has sanitized columns", async () => {
    const fileStream = createReadStream(
      "./tests/fixtures/predefined_formats.xlsx",
    );
    const parserStream = createExcelParserStream({
      matchSheet: /.*/,
      dropEmptyRows: true,
    });

    const withColumnsStream = createRowToRowWithColumnsStream({
      sanitizeColumnName: (columnName) =>
        columnName.toLowerCase().replace(/\W/g, "_"),
    });

    const resultStream = new Writable({
      objectMode: true,
      write(row: RowWithColumns, _encoding, callback) {
        expect(row.columns).toBeDefined();

        if (row.index === 2) {
          expect(row.columns.nome).toBe("jhon");
          expect(row.columns.data_di_nascita).toBe("9/27/86");
        }

        callback();
      },
    });

    await pipeline(fileStream, parserStream, withColumnsStream, resultStream);
  });

  test("row as values object", async () => {
    const fileStream = createReadStream(
      "./tests/fixtures/predefined_formats.xlsx",
    );
    const parserStream = createExcelParserStream({
      matchSheet: /.*/,
      dropEmptyRows: true,
    });

    const asObjectsStream = createRowToRowAsObjectStream();

    const resultStream = new Writable({
      objectMode: true,
      write(row: unknown[], _encoding, callback) {
        expect(Array.isArray(row)).toBe(true);
        callback();
      },
    });

    await pipeline(fileStream, parserStream, asObjectsStream, resultStream);
  });

  test("row as columns object", async () => {
    const fileStream = createReadStream(
      "./tests/fixtures/predefined_formats.xlsx",
    );
    const parserStream = createExcelParserStream({
      matchSheet: /.*/,
      dropEmptyRows: true,
    });

    const withColumnsStream = createRowToRowWithColumnsStream({
      sanitizeColumnName: (columnName) =>
        columnName.toLowerCase().replace(/\W/g, "_"),
    });

    const asObjectsStream = createRowToRowAsObjectStream();

    let index = 1;
    const resultStream = new Writable({
      objectMode: true,
      write(row: RowAsObject, _encoding, callback) {
        expect(row.index).toBeUndefined();
        if (index === 1) {
          expect(row.nome).toBe("jhon");
          expect(row.data_di_nascita).toBe("9/27/86");
        }
        index++;
        callback();
      },
    });

    await pipeline(
      fileStream,
      parserStream,
      withColumnsStream,
      asObjectsStream,
      resultStream,
    );
  });

  test("throw if no data", async () => {
    const fileStream = createReadStream(
      "./tests/fixtures/predefined_formats.xlsx",
    );
    const parserStream = createExcelParserStream({
      matchSheet: /.*/,
      dropEmptyRows: true,
    });

    const filterStream = new Transform({
      objectMode: true,
      write(row: RowWithValues, _encoding, callback) {
        // skip all the data
        callback();
      },
    });

    const throwIfError = createThrowIfEmptyStream({
      message: "Can not believe it",
    });

    try {
      await pipeline(fileStream, parserStream, filterStream, throwIfError);
      throw Error("Failed to fail");
    } catch (e) {
      expect((e as Error).message === "Can not believe it");
    }
  });
});
