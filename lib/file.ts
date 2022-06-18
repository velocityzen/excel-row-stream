import { createReadStream } from "fs";
import { Writable } from "stream";
import { pipeline } from "stream/promises";

import createExcelWorkbookStream from "./workbook";
import type { WorkbookStreamOptions, Row } from "./types";

interface ParseExcelRowsOptions extends WorkbookStreamOptions {
  file: string;
  onRow: (row: Row) => void;
}

export async function parseExcelRows({
  file,
  onRow,
  ...opts
}: ParseExcelRowsOptions): Promise<void> {
  const fileStream = createReadStream(file);
  const parserStream = createExcelWorkbookStream(opts);
  const testStream = new Writable({
    objectMode: true,
    write(row: Row, _encoding, callback) {
      try {
        onRow(row);
        callback();
      } catch (error) {
        parserStream.destroy(error as Error);
      }
    },
  });

  await pipeline(fileStream, parserStream, testStream);
}
