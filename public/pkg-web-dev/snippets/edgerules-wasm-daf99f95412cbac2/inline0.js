// Inline JS snippets required by edgerules-wasm (wasm-bindgen generated)

export function er_from_base64(s) {
    return atob(s);
}

export function er_to_base64(s) {
    return btoa(s);
}

// regex_replace(text, pattern, replacement, case_insensitive, global)
export function er_regex_replace(text, pattern, replacement, case_insensitive, global) {
    let flags = '';
    if (case_insensitive) flags += 'i';
    if (global) flags += 'g';
    return text.replace(new RegExp(pattern, flags), replacement);
}

// regex_split(text, pattern) → string[]
export function er_regex_split(text, pattern) {
    return text.split(new RegExp(pattern));
}
