// In-memory Apps Script workbook for acknowledgement/storage regression tests.
// No Google services, requests, real leads or emails.
const assert = require('node:assert/strict');
function workbookFixture({brand, rows = [], width = 12, options = {}}) {
  const sheets = new Map(), actions = [];
  const auditName = brand + ' Acknowledgements';
  const headers = ['Timestamp', 'Selected Plan', 'Full Name', 'Business Name', 'Email', 'Phone',
    'Preferred Contact', 'Contact Detail', 'Profile URL', 'Review Count', 'Review Links', 'Reason'];
  if (width === 13) headers.push('Traffic Source');
  let spreadsheet;
  const display = value => typeof value === 'string' && /^'[=+\-@]/.test(value) ? value.slice(1) : value;
  function makeSheet(name, headings = [], data = []) {
    const sheet = {name, headers: headings, rows: data, hidden: false,
      getName: () => name,
      getSheetId: () => name === 'Leads' ? 7 : 8,
      getParent() { if (options.parentFailure) throw Error('Parent unavailable'); return spreadsheet; },
      getLastRow: () => sheet.headers.length ? data.length + 1 : 0,
      hideSheet() { sheet.hidden = true; return sheet; },
      appendRow(row) {
        if (name === auditName && options.auditFailure) throw Error('Archive unavailable');
        if (name === 'Leads' && options.saveError) throw Error('Storage unavailable');
        actions.push('append:' + name);
        if (!sheet.headers.length) sheet.headers = Array.from(row); else data.push(Array.from(row));
        if (name === auditName && data.length && options.onAuditAppend) options.onAuditAppend(rows);
        return sheet;
      },
      getRange(startRow, startCol, rowCount = 1, colCount = 1) {
        const read = (r, c) => display((r === 1 ? sheet.headers : data[r - 2] || [])[c - 1] ?? '');
        const range = {
          getRow: () => startRow,
          getValue: () => read(startRow, startCol),
          getValues: () => Array.from({length: rowCount}, (_, r) =>
            Array.from({length: colCount}, (_, c) => read(startRow + r, startCol + c))),
          setValue(value) {
            assert.equal(rowCount, 1); assert.equal(colCount, 1);
            if (options.cellFailure) throw Error('Cell unavailable');
            actions.push('set:' + name);
            const target = startRow === 1 ? sheet.headers : data[startRow - 2];
            target[startCol - 1] = value; return range;
          },
          createTextFinder(text) {
            let entire = false;
            const finder = {matchCase: () => finder, useRegularExpression: () => finder,
              matchEntireCell(value) { entire = value; return finder; },
              findNext() {
                for (let r = startRow; r < startRow + rowCount; r++) {
                  const value = String(read(r, startCol));
                  if (entire ? value === text : value.includes(text)) return sheet.getRange(r, startCol);
                }
                return null;
              }};
            return finder;
          }
        };
        return range;
      }
    };
    sheets.set(name, sheet); return sheet;
  }
  const leadSheet = makeSheet('Leads', headers, rows);
  spreadsheet = {
    getSheetByName: name => sheets.get(name) || null,
    insertSheet(name) { assert.equal(sheets.has(name), false); return makeSheet(name); }
  };
  if (options.badAuditHeaders) makeSheet(auditName, ['Unrelated data']);
  return {spreadsheet, leadSheet, rows, actions, audit: () => sheets.get(auditName)};
}
module.exports = {workbookFixture};
