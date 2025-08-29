// Strip <think>...</think> blocks (DeepSeek etc.)
export function stripThinkBlocks(s) {
  return s.replace(/<think>[\s\S]*?<\/think>/gi, '');
}

// Strip ```json ... ``` or ``` ... ``` fences
export function stripCodeFences(s) {
  return s
    .replace(/```json[\s\S]*?```/gi, m => m.replace(/```json|```/gi, ''))
    .replace(/```[\s\S]*?```/g, m => m.replace(/```/g, ''));
}

// Remove ellipses ("...") tokens outside JSON strings
export function removeEllipsesOutsideStrings(s) {
  let out = '';
  let inStr = false, escape = false;
  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    if (inStr) {
      out += ch;
      if (escape) { escape = false; continue; }
      if (ch === '\\') { escape = true; continue; }
      if (ch === '"') inStr = false;
    } else {
      if (ch === '"') { inStr = true; out += ch; continue; }
      if (ch === '.') {
        while (i + 1 < s.length && s[i + 1] === '.') i++;
        continue; // skip dot run
      }
      out += ch;
    }
  }
  return out;
}

// Remove trailing commas like {"a":1,} or [1,2,]
export function removeTrailingCommas(s) {
  let out = '';
  let inStr = false, escape = false;
  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    out += ch;
    if (inStr) {
      if (escape) { escape = false; continue; }
      if (ch === '\\') { escape = true; continue; }
      if (ch === '"') inStr = false;
    } else {
      if (ch === '"') inStr = true;
      if (ch === ',' && i + 1 < s.length) {
        const next = s.slice(i + 1).match(/^\s*[}\]]/);
        if (next) out = out.slice(0, -1); // drop comma
      }
    }
  }
  return out;
}

// Extract the first balanced JSON object
export function extractFirstJsonObject(s) {
  let inStr = false, escape = false, depth = 0, start = -1;
  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    if (inStr) {
      if (escape) { escape = false; continue; }
      if (ch === '\\') { escape = true; continue; }
      if (ch === '"') inStr = false;
    } else {
      if (ch === '"') { inStr = true; continue; }
      if (ch === '{') { if (depth === 0) start = i; depth++; }
      else if (ch === '}') {
        depth--;
        if (depth === 0 && start !== -1) return s.slice(start, i + 1);
      }
    }
  }
  return null;
}
