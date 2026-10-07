// Split only outside PostgreSQL strings, identifiers, comments, and function bodies.
export function splitStatements(sqlText) {
  const statements = [];
  let start = 0, quote = null, dollar = null, comments = 0, lineComment = false;
  for (let index = 0; index < sqlText.length; index++) {
    const char = sqlText[index], next = sqlText[index + 1];
    if (lineComment) { if (char === '\n') lineComment = false; continue; }
    if (comments) {
      if (char === '/' && next === '*') { comments++; index++; }
      else if (char === '*' && next === '/') { comments--; index++; }
      continue;
    }
    if (dollar) {
      if (sqlText.startsWith(dollar,index)) { index += dollar.length - 1; dollar = null; }
      continue;
    }
    if (quote) {
      if (char === quote.char) {
        if (next === quote.char) index++;
        else quote = null;
      } else if (char === '\\' && quote.escape) index++;
      continue;
    }
    if (char === '-' && next === '-') { lineComment = true; index++; }
    else if (char === '/' && next === '*') { comments = 1; index++; }
    else if (char === "'" || char === '"') {
      quote = { char, escape: char === "'" && /[eE]/.test(sqlText[index - 1] ?? '') && !/[\w$]/.test(sqlText[index - 2] ?? '') };
    } else if (char === '$' && !/[\w$]/.test(sqlText[index - 1] ?? '')) {
      dollar = sqlText.slice(index).match(/^\$(?:[A-Za-z_][A-Za-z_0-9]*)?\$/)?.[0] ?? null;
      if (dollar) index += dollar.length - 1;
    } else if (char === ';') {
      const statement = sqlText.slice(start,index).trim();
      if (statement) statements.push(statement);
      start = index + 1;
    }
  }
  if (quote || dollar || comments) throw new Error('Unterminated SQL quote or comment.');
  const tail = sqlText.slice(start).trim();
  if (tail) statements.push(tail);
  return statements;
}
