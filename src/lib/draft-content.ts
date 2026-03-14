const HTML_TAG_PATTERN = /<[^>]*>/g;
const HTML_BREAK_PATTERN = /<(br|\/p|\/li|\/h[1-6])[^>]*>/gi;
const HTML_ENTITY_SPACE_PATTERN = /&(nbsp|#160);/gi;
const HTML_ENTITY_PATTERN = /&[a-z0-9#]+;/gi;

export function normalizeDraftHtml(html: string) {
  return html.trim();
}

export function extractPlainTextFromHtml(html: string) {
  return normalizeDraftHtml(html)
    .replace(HTML_BREAK_PATTERN, " ")
    .replace(HTML_TAG_PATTERN, " ")
    .replace(HTML_ENTITY_SPACE_PATTERN, " ")
    .replace(HTML_ENTITY_PATTERN, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function hasMeaningfulDraftHtml(html: string) {
  const normalizedHtml = normalizeDraftHtml(html);

  if (!normalizedHtml || !normalizedHtml.includes("<") || !normalizedHtml.includes(">")) {
    return false;
  }

  return extractPlainTextFromHtml(normalizedHtml).length > 0;
}
