# excel-row-stream

[![NPM Version](https://img.shields.io/npm/v/excel-row-stream.svg?style=flat-square)](https://www.npmjs.com/package/excel-row-stream)
[![NPM Downloads](https://img.shields.io/npm/dt/excel-row-stream.svg?style=flat-square)](https://www.npmjs.com/package/excel-row-stream)

Fast and simple transform stream for excel file parsing

# Install

`npm i excel-row-stream`

# Usage

Here is an example:

```typescript
import { createReadStream } from "fs";
import { Writable } from "stream";
import { pipeline } from "stream/promises";

import createExcelWorkbookStream, { Row } from "excel-row-stream";

const fileStream = createReadStream("./some.xlsx");
const workbookStream = createExcelWorkbookStream({
    matchSheet: /sheet name/i,
    dropEmptyRows: true,
});
const resultStream = new Writable({
    objectMode: true,
    write(row: Row, _encoding, callback) {
        console.log(row.index, row.values);
        callback();
    },
});

await pipeline(fileStream, workbookStream, resultStream);

console.log("Done!");
```

The `workbookStream` will only return rows from matched sheets.

## Options

-   **matchSheet** (required) - RegExp, to match the sheet name
-   **dropEmptyRows** (optional) - Boolean, to drop empty rows, by default parser will emit all rows
-   **dropEmptyCells** (optional) - Boolean, to drop empty cells on the right side of the row
-   **alwaysAddSecondsToCustomTimeFormat** (optional) - Boolean, always provide seconds for custom time format. Handles the common scenario where dates are formatted to display in hh:mm format (without seconds) in excel but the underlying data has more resolution. Defaults to TRUE, because this library is intended for data analysis, not replicating what the user saw in Excel. Also because this is what pandas would do. \*This is only applied to when the time field has a format type of CUSTOM\* . Which is what Excel automatically applies when it infers a field is a time field.

## Important

All `row.values` have `unknown` type. Please always validate your data. For example, you can do it with the excellent [io-ts](https://github.com/gcanti/io-ts) library.

## Compose

This library provides several streams to make your life easier

### createRowToRowWithColumnsStream({sanitizeColumnName})

Creates a stream that converts rows with values into objects with column names. The column names come from the first row (index = 1).

Options:
– **sanitizeColumnName** optional function to transform column names.

```typescript
const fileStream = createReadStream("file.xlsx");
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
        console.log(row.index, row.columns);
        callback();
    },
});

await pipeline(fileStream, parserStream, withColumnsStream, resultStream);
```

### createRowToRowAsObjectStream()

Creates a stream that strips the `index` from rows and returns the data directly, either `values` or `columns`.

```typescript
const fileStream = createReadStream("file.xlsx");
const parserStream = createExcelParserStream({
    matchSheet: /.*/,
    dropEmptyRows: true,
});

const asObjectsStream = createRowToRowAsObjectStream();

const resultStream = new Writable({
    objectMode: true,
    write(row: unknown[], _encoding, callback) {
        console.log("values", row);
        callback();
    },
});

await pipeline(fileStream, parserStream, asObjectsStream, resultStream);
```

### createThrowIfEmptyStream({message})

Creates a stream that checks if no data flows through it and throws an error with `message`.

```typescript
const fileStream = createReadStream("file.xlsx");
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

const throwIfEmpty = createThrowIfEmptyStream({
    message: "Can not believe it",
});

// will throw
await pipeline(fileStream, parserStream, filterStream, throwIfEmpty);
```

License

[MIT](LICENSE)
