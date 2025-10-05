
export function __er_regex_replace(s, pattern, flags, repl) {
  try {
    const re = new RegExp(pattern, flags || 'g');
    return String(s).replace(re, repl);
  } catch (e) {
    return "__er_err__:" + String(e);
  }
}

export function __er_regex_split(s, pattern, flags) {
  try {
    const re = new RegExp(pattern, flags || 'g');
    const SEP = "\u001F"; // Unit Separator as rarely-used delimiter
    const parts = String(s).split(re).map(p => p.split(SEP).join(SEP + SEP));
    return parts.join(SEP);
  } catch (e) {
    return "__er_err__:" + String(e);
  }
}

export function __er_to_base64(s) {
  try {
    if (typeof btoa === 'function') {
      return btoa(String(s));
    }
    // Node.js
    return Buffer.from(String(s), 'utf-8').toString('base64');
  } catch (e) {
    return "__er_err__:" + String(e);
  }
}

export function __er_from_base64(s) {
  try {
    if (typeof atob === 'function') {
      return atob(String(s));
    }
    // Node.js
    return Buffer.from(String(s), 'base64').toString('utf-8');
  } catch (e) {
    return "__er_err__:" + String(e);
  }
}
