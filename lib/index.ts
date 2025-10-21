import type { WorkbookStreamOptions } from "./types";
import createExcelWorkbookStream from "./workbook";

export type {
  RowAsObject,
  RowWithColumns,
  RowWithValues,
  WorkbookStreamOptions,
} from "./types";

export function createExcelParserStream(opts: WorkbookStreamOptions) {
  return createExcelWorkbookStream(opts);
}

export {
  createRowToRowAsObjectStream,
  createRowToRowWithColumnsStream,
  createThrowIfEmptyStream,
} from "./compose";

export type {
  CreateRowToRowWithColumnsStreamOptions,
  CreateThrowIfEmptyStreamOptions,
} from "./compose";

export { parseExcelRows } from "./file";
