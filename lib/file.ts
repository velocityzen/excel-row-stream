import { createReadStream } from "fs";
import { Writable } from "stream";
import { pipeline } from "stream/promises";
import type { RowWithValues, WorkbookStreamOptions } from "./types";
import createExcelWorkbookStream from "./workbook";

interface ParseExcelRowsOptions extends WorkbookStreamOptions {
  file: string;
  onRow: (row: RowWithValues) => void;
}

export async function parseExcelRows({
  file,
  onRow,
  ...opts
}: ParseExcelRowsOptions): Promise<void> {
  const fileStream = createReadStream(file);
  const parserStream = createExcelWorkbookStream(opts);
  const resultStream = new Writable({
    objectMode: true,
    write(row: RowWithValues, _encoding, callback) {
      try {
        onRow(row);
        callback();
      } catch (error) {
        parserStream.destroy(error as Error);
      }
    },
  });

  await pipeline(fileStream, parserStream, resultStream);
}
