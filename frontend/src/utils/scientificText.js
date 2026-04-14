export const normalizeScientificText = (text) => {
    if (!text) return '';

    let normalized = String(text).replace(/\r\n/g, '\n');

    // Convert escaped LaTeX delimiters to remark-math delimiters.
    normalized = normalized.replace(/\\\[([\s\S]*?)\\\]/g, (_, body) => `\n$$\n${body.trim()}\n$$\n`);
    normalized = normalized.replace(/\\\(([\s\S]*?)\\\)/g, (_, body) => `$${body.trim()}$`);

    // Some models wrap equations in square brackets like: [ \text{...} ]
    normalized = normalized.replace(/\[\s*(\\[A-Za-z][\s\S]*?)\s*\]/g, (_, body) => `\n$$\n${body.trim()}\n$$\n`);

    // If math commands are double-escaped, collapse to single for KaTeX.
    normalized = normalized.replace(/\\\\([A-Za-z]+)/g, '\\$1');

    return normalized;
};
