# excel-row-stream

[![NPM Version](https://img.shields.io/npm/v/excel-row-stream.svg?style=flat-square)](https://www.npmjs.com/package/excel-row-stream)
[![NPM Downloads](https://img.shields.io/npm/dt/excel-row-stream.svg?style=flat-square)](https://www.npmjs.com/package/excel-row-stream)

Fast and simple transform stream for excel files parsing

# install

`npm i excel-row-stream`

# usage

Here is an example:

```typescript
import { createReadStream } from "fs";
import { Writable } from "stream";
import { pipeline } from "stream/promises";

import createExcelWorkbookStream, { Row } from "excel-row-stream";

const fileStream = createReadStream("./some.xlsx");
const workbookStream = createExcelWorkbookStream({
    matchSheet: /sheet name/i,
    dropEmptyRow: true,
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
-   **dropEmptyRow** (optional) - Boolean, to drop empty rows, by default parser will emit all rows
-   **dropEmptyCell** (optional) - Boolean, to drop empty cells on the right side of the row

## Important

All `row.values` have `unknown` type. Please always validate your data. For example you can do it with excelent [io-ts](https://github.com/gcanti/io-ts) library.

License

[MIT](LICENSE)
