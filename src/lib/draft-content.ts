import sanitizeHtml from "sanitize-html";

const HTML_TAG_PATTERN = /<[^>]*>/g;
const HTML_BREAK_PATTERN = /<(br|\/p|\/li|\/h[1-6])[^>]*>/gi;
const HTML_ENTITY_SPACE_PATTERN = /&(nbsp|#160);/gi;
const HTML_ENTITY_PATTERN = /&[a-z0-9#]+;/gi;
const HTML_CONTENT_TAG_PATTERN = /<\/?[a-z][^>]*>/i;
const RELATIVE_LINK_PATTERN = /^(\/(?!\/)|#|\.\.?\/)/;
const DISALLOWED_URL_CHARACTERS_PATTERN = /[\u0000-\u001F\u007F\s]/;

const ALLOWED_TAGS = [
  "p",
  "br",
  "h2",
  "h3",
  "strong",
  "em",
  "s",
  "ul",
  "ol",
  "li",
  "blockquote",
  "code",
  "pre",
  "a",
] as const;

const SANITIZE_OPTIONS: sanitizeHtml.IOptions = {
  allowedTags: [...ALLOWED_TAGS],
  allowedAttributes: {
    a: ["href", "target", "rel"],
  },
  allowedSchemes: ["http", "https", "mailto"],
  allowedSchemesAppliedToAttributes: ["href"],
  allowProtocolRelative: false,
  disallowedTagsMode: "discard",
  transformTags: {
    a: (_tagName, attribs) => {
      const href = normalizeDraftLinkHref(attribs.href);
      const nextAttribs: Record<string, string> = {};

      if (href) {
        nextAttribs.href = href;
        nextAttribs.rel = "noopener noreferrer";
        nextAttribs.target = "_blank";
      }

      return {
        tagName: "a",
        attribs: nextAttribs,
      };
    },
  },
};

export function normalizeDraftLinkHref(href: string | undefined | null) {
  if (!href) return null;

  const trimmedHref = href.trim();
  if (!trimmedHref || DISALLOWED_URL_CHARACTERS_PATTERN.test(trimmedHref)) {
    return null;
  }

  if (RELATIVE_LINK_PATTERN.test(trimmedHref)) {
    return trimmedHref;
  }

  try {
    const url = new URL(trimmedHref);

    if (!["http:", "https:", "mailto:"].includes(url.protocol)) {
      return null;
    }

    return url.toString();
  } catch {
    return null;
  }
}

export function normalizeDraftHtml(html: string) {
  return sanitizeHtml(html, SANITIZE_OPTIONS).trim();
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

  if (!normalizedHtml || !HTML_CONTENT_TAG_PATTERN.test(normalizedHtml)) {
    return false;
  }

  return extractPlainTextFromHtml(normalizedHtml).length > 0;
}
