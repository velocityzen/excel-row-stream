import { describe, expect, test } from "vitest";
import { parseExcelRows } from "../lib";

describe("Excel parser stream", () => {
  test("date1904", async () =>
    parseExcelRows({
      file: "./tests/fixtures/date1904.xlsx",
      matchSheet: /.*/,
      dropEmptyRows: true,
      onRow: (row) => {
        if (row.index === 2) {
          expect(row.values).toStrictEqual(["string", "27/09/1986", 20064]);
        }
      },
    }));

  test("parses large files", async () => {
    let rowsNumber = 0;
    await parseExcelRows({
      file: "./tests/fixtures/big.xlsx",
      matchSheet: /.*/,
      onRow: () => {
        rowsNumber++;
      },
    });

    expect(rowsNumber).toBe(80000);
  });

  test("supports predefined formats", async () =>
    parseExcelRows({
      file: "./tests/fixtures/predefined_formats.xlsx",
      matchSheet: /.*/,
      onRow: (row) => {
        if (row.index === 2) {
          expect(row.values).toStrictEqual([
            "jhon",
            "doe",
            "maschio",
            "9/27/86",
            1111111111,
            "test@gmail.com",
            "milano",
            20064,
            "gorgonzola",
            "italia",
          ]);
        }
      },
    }));

  test("supports custom formats", async () =>
    parseExcelRows({
      file: "./tests/fixtures/import.xlsx",
      matchSheet: /.*/,
      onRow: (row) => {
        if (row.index === 2) {
          expect(row.values).toStrictEqual(["string", "27/09/1986", "20064"]);
        }
      },
    }));

  test("catches zip format errors", async () => {
    try {
      await parseExcelRows({
        file: "./tests/fixtures/notanxlsx",
        matchSheet: /.*/,
        onRow: () => {
          throw Error("Failed to fail");
        },
      });
      throw Error("Failed to fail");
    } catch (error) {
      if (error instanceof Error) {
        expect(error.message).toBe("invalid signature: 0x6d612069");
      } else {
        throw Error("Failed to fail");
      }
    }
  });

  test("parses a file with no number format ids", async () =>
    parseExcelRows({
      file: "./tests/fixtures/nonumfmt.xlsx",
      dropEmptyRows: true,
      matchSheet: /.*/,
      onRow: (row) => {
        if (row.index === 2) {
          expect(row.values).toStrictEqual([
            "lambrate",
            "Italy",
            "hello@example.com",
            "rossi",
            "mario",
            "MI",
            "M",
            "20131",
          ]);
        }
      },
    }));

  test("support rich-text", async () =>
    parseExcelRows({
      file: "./tests/fixtures/richtext.xlsx",
      matchSheet: /.*/,
      onRow: (row) => {
        expect(row.values).toStrictEqual([null, "B cell", "C cell"]);
      },
    }));

  test("parses a file having uppercase in sheet name and mixed first node", async () => {
    let rowsNumber = 0;
    await parseExcelRows({
      file: "./tests/fixtures/uppercase_sheet_name.xlsx",
      matchSheet: /.*/,
      onRow: (row) => {
        rowsNumber++;
        if (row.index === 1) {
          expect(row.values).toStrictEqual([
            "Category ID",
            "Parent category ID",
            "Name DE",
            "Name FR",
            "Name IT",
            "Name EN",
            "GS1 ID",
          ]);
        }
      },
    });

    expect(rowsNumber).toBe(24);
  });

  test("parse 0 as 0", async () =>
    parseExcelRows({
      file: "./tests/fixtures/issue_44_empty_0.xlsx",
      matchSheet: /.*/,
      onRow: (row) => {
        if (row.index === 2) {
          expect(row.values).toStrictEqual([0, 1]);
        }
      },
    }));

  test("Ensure empty cell are nulls", async () =>
    parseExcelRows({
      file: "./tests/fixtures/empty_cell_order.xlsx",
      matchSheet: /.*/,
      onRow: (row) => {
        if (row.index === 3) {
          expect(row.values[0]).toStrictEqual(null);
          expect(row.values[1]).toStrictEqual(null);
          expect(row.values[2]).toStrictEqual(null);
          expect(row.values[3]).toStrictEqual(null);
          expect(row.values[4]).toStrictEqual("95");
        }
      },
    }));

  test("adds seconds to custom time format", async () =>
    parseExcelRows({
      file: "./tests/fixtures/add_seconds.xlsx",
      matchSheet: /.*/,
      onRow: (row) => {
        if (row.index === 1) {
          expect(row.values[0]).toEqual("03/28/2022 12:00:00 AM");
          expect(row.values[1]).toEqual("03/26/2023 11:59:59 PM");
        }
      },
    }));

  test("do not adds seconds to custom time format", async () =>
    parseExcelRows({
      file: "./tests/fixtures/add_seconds.xlsx",
      matchSheet: /.*/,
      alwaysAddSecondsToCustomTimeFormat: false,
      onRow: (row) => {
        if (row.index === 1) {
          expect(row.values[0]).toEqual("03/28/2022 12:00 AM");
          expect(row.values[1]).toEqual("03/26/2023 11:59 PM");
        }
      },
    }));
});
