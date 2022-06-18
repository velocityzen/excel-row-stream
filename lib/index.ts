import createExcelWorkbookStream from "./workbook";
import type { WorkbookStreamOptions } from "./types";

export type { Row, WorkbookStreamOptions } from "./types";

export default function createExcelParserStream(opts: WorkbookStreamOptions) {
  return createExcelWorkbookStream(opts);
}

export { parseExcelRows } from "./file";
