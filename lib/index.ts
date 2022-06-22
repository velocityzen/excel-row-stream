import createExcelWorkbookStream from "./workbook";
import type { WorkbookStreamOptions } from "./types";

export type {
  RowWithValues,
  RowWithColumns,
  RowAsObject,
  WorkbookStreamOptions,
} from "./types";

export default function createExcelParserStream(opts: WorkbookStreamOptions) {
  return createExcelWorkbookStream(opts);
}

export { parseExcelRows } from "./file";
export type {
  CreateRowToRowWithColumnsStreamOptions,
  CreateThrowIfEmptyStreamOptions,
} from "./compose";
export {
  createRowToRowWithColumnsStream,
  createRowToRowAsObjectStream,
  createThrowIfEmptyStream,
} from "./compose";
